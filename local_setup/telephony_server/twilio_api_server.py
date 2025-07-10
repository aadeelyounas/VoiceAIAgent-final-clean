import os
import json
import requests
import uuid
from twilio.twiml.voice_response import VoiceResponse, Connect
from twilio.rest import Client
from dotenv import load_dotenv
import redis.asyncio as redis
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware  # Import CORSMiddleware

app = FastAPI()
load_dotenv()
port = 8001

# CORS configuration: Allow requests from your frontend's origin.
origins = ["*"]  # Allow all origins during development

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can also use ["*"] to allow all origins for testing.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

twilio_account_sid = os.getenv('TWILIO_ACCOUNT_SID')
twilio_auth_token = os.getenv('TWILIO_AUTH_TOKEN')
twilio_phone_number = os.getenv('TWILIO_PHONE_NUMBER')

# Initialize Twilio services
twilio_client = Client(twilio_account_sid, twilio_auth_token)
number_provisioner = Client(twilio_account_sid, twilio_auth_token).incoming_phone_numbers


def populate_ngrok_tunnels():
    response = requests.get("http://ngrok:4040/api/tunnels")  # ngrok interface
    telephony_url, voiceaiagent_url = None, None

    if response.status_code == 200:
        data = response.json()

        for tunnel in data['tunnels']:
            if tunnel['name'] == 'twilio-app':
                telephony_url = tunnel['public_url']
            elif tunnel['name'] == 'voiceaiagent-app':
                voiceaiagent_url = tunnel['public_url'].replace('https:', 'wss:')

        return telephony_url, voiceaiagent_url
    else:
        print(f"Error: Unable to fetch data. Status code: {response.status_code}")


@app.get('/phone-numbers/all')
async def list_numbers():
    """List all provisioned Twilio numbers"""
    numbers = twilio_client.incoming_phone_numbers.list(limit=20)
    return [{
        "sid": n.sid,
        "phone_number": n.phone_number,
        "voice_url": n.voice_url,
        "date_created": str(n.date_created)
    } for n in numbers]

@app.post('/bind_number')
async def bind_number(number_sid: str = Query(...), agent_id: str = Query(...)):
    """Bind a provisioned number to specific agent"""
    number = twilio_client.incoming_phone_numbers(number_sid).update(
        voice_url=f"{os.getenv('CALLBACK_BASE')}/agent/{agent_id}/voice"
    )
    return {"status": "bound", "agent_id": agent_id, "number_sid": number.sid}

@app.post('/provision_number')
async def provision_number(area_code: str = Query(...)):
    """Acquire and configure Twilio phone number"""
    try:
        numbers = twilio_client.available_phone_numbers('US').local.list(
            area_code=area_code,
            sms_enabled=True,
            voice_enabled=True
        )
        
        if numbers:
            number = twilio_client.incoming_phone_numbers.create(
                phone_number=numbers[0].phone_number,
                voice_url=f"{os.getenv('CALLBACK_BASE')}/voice",
                sms_url=f"{os.getenv('CALLBACK_BASE')}/sms"
            )
            return {"number_sid": number.sid}
        return {"error": "No numbers available"}

    except Exception as e:
        print(f"Provisioning error: {str(e)}")
        raise HTTPException(status_code=500, detail="Number provisioning failed")

@app.post('/bind_number')
async def bind_number(number_sid: str = Query(...), agent_id: str = Query(...)):
    """Associate phone number with specific agent"""
    try:
        twilio_client.incoming_phone_numbers(number_sid).update(
            voice_url=f"{os.getenv('CALLBACK_BASE')}/agent/{agent_id}/voice"
        )
        return {"status": "success"}
    except Exception as e:
        print(f"Binding error: {str(e)}")
        raise HTTPException(status_code=500, detail="Number binding failed")

@app.post('/call')
async def make_call(request: Request):
    try:
        call_details = await request.json()
        agent_id = call_details.get('agent_id', None)

        if not agent_id:
            raise HTTPException(status_code=404, detail="Agent not provided")
        
        if not call_details or "recipient_phone_number" not in call_details:
            raise HTTPException(status_code=404, detail="Recipient phone number not provided")

        telephony_host, voiceaiagent_host = populate_ngrok_tunnels()

        print(f'telephony_host: {telephony_host}')
        print(f'voiceaiagent_host: {voiceaiagent_host}')

        try:
            call = twilio_client.calls.create(
                to=call_details.get('recipient_phone_number'),
                from_=twilio_phone_number,
                url=f"{telephony_host}/twilio_connect?voiceaiagent_host={voiceaiagent_host}&agent_id={agent_id}&number_sid={call_details.get('number_sid')}",
                method="POST",
                record=True
            )
        except Exception as e:
            print(f'make_call exception: {str(e)}')

        return PlainTextResponse("done", status_code=200)

    except Exception as e:
        print(f"Exception occurred in make_call: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@app.post('/twilio_connect')
async def twilio_connect(voiceaiagent_host: str = Query(...), agent_id: str = Query(...)):
    try:
        response = VoiceResponse()

        connect = Connect()
        voiceaiagent_websocket_url = f'{voiceaiagent_host}/chat/v1/{agent_id}'
        connect.stream(url=voiceaiagent_websocket_url)
        print(f"websocket connection done to {voiceaiagent_websocket_url}")
        response.append(connect)

        return PlainTextResponse(str(response), status_code=200, media_type='text/xml')

    except Exception as e:
        print(f"Exception occurred in twilio_connect: {e}")