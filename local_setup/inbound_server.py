import asyncio
import base64
import json
import sys
import websockets
import ssl
from dotenv import load_dotenv
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware # Add CORS middleware import
from pydantic import BaseModel
import uvicorn

load_dotenv()
# Create FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow requests from the dashboard origin
    allow_credentials=True,
    allow_methods=["*"], # Allow all methods (GET, PUT)
    allow_headers=["*"], # Allow all headers
)

# Pydantic model for configuration updates
class ConfigUpdate(BaseModel):
    value: str

# Shared configuration state
shared_config = {
    "greeting": "Hello! Sarah here, How can I help you today?",
    "think_prompt": "You are a helpful AI assistant focused on customer service. Dont Speak more than 2 sentences and first ask for verification name should match Zack and Date of Birth should be 28 / 05 / 1994 to book an appointment at MK Clinic.",
    "think_model": "gpt-4.1-nano"
}

# Endpoints for updating configuration
@app.put("/config/greeting")
async def update_greeting(update: ConfigUpdate):
    shared_config["greeting"] = update.value
    return {"message": "Greeting updated"}

@app.put("/config/prompt")
async def update_prompt(update: ConfigUpdate):
    shared_config["think_prompt"] = update.value
    return {"message": "Prompt updated"}

@app.put("/config/model")
async def update_model(update: ConfigUpdate):
    shared_config["think_model"] = update.value
    return {"message": "Model updated"}

@app.get("/config")
async def get_config():
    return shared_config

def sts_connect():
    # you can run export DEEPGRAM_API_KEY="your key" in your terminal to set your API key.
    api_key = os.getenv('DEEPGRAM_API_KEY')
    if not api_key:
        raise ValueError("DEEPGRAM_API_KEY environment variable is not set")

    sts_ws = websockets.connect(
        "wss://agent.deepgram.com/v1/agent/converse",
        subprotocols=["token", api_key]
    )
    return sts_ws


async def twilio_handler(twilio_ws):
    audio_queue = asyncio.Queue()
    streamsid_queue = asyncio.Queue()

    async with sts_connect() as sts_ws:
        config_message = {
            "type": "Settings",
            "audio": {
                "input": {
                    "encoding": "mulaw",
                    "sample_rate": 8000,
                },
                "output": {
                    "encoding": "mulaw",
                    "sample_rate": 8000,
                    "container": "none",
                },
            },
            "agent": {
                "language": "en",
                "listen": {
                    "provider": {
                        "type": "deepgram",
                        "model": "nova-3",
                        "keyterms": ["hello", "goodbye"]
                    }
                },
                "think": {
                    "provider": {
                        "type": "open_ai",
                        "model": shared_config["think_model"],
                        "temperature": 0.7
                    },
                    "prompt": shared_config["think_prompt"]
                },
                "speak": {
                    "provider": {
                        "type": "deepgram",
                        "model": "aura-2-thalia-en"
                    }
                },
                "greeting": shared_config["greeting"]
            }
        }

        await sts_ws.send(json.dumps(config_message))

        async def sts_sender(sts_ws):
            print("sts_sender started")
            while True:
                chunk = await audio_queue.get()
                await sts_ws.send(chunk)

        async def sts_receiver(sts_ws):
            print("sts_receiver started")
            # we will wait until the twilio ws connection figures out the streamsid
            streamsid = await streamsid_queue.get()
            # for each sts result received, forward it on to the call
            async for message in sts_ws:
                if type(message) is str:
                    print(message)
                    # handle barge-in
                    decoded = json.loads(message)
                    if decoded['type'] == 'UserStartedSpeaking':
                        clear_message = {
                            "event": "clear",
                            "streamSid": streamsid
                        }
                        await twilio_ws.send(json.dumps(clear_message))

                    continue

                print(type(message))
                raw_mulaw = message

                # construct a Twilio media message with the raw mulaw (see https://www.twilio.com/docs/voice/twiml/stream#websocket-messages---to-twilio)
                media_message = {
                    "event": "media",
                    "streamSid": streamsid,
                    "media": {"payload": base64.b64encode(raw_mulaw).decode("ascii")},
                }

                # send the TTS audio to the attached phonecall
                await twilio_ws.send(json.dumps(media_message))

        async def twilio_receiver(twilio_ws):
            print("twilio_receiver started")
            # twilio sends audio data as 160 byte messages containing 20ms of audio each
            # we will buffer 20 twilio messages corresponding to 0.4 seconds of audio to improve throughput performance
            BUFFER_SIZE = 20 * 160

            inbuffer = bytearray(b"")
            async for message in twilio_ws:
                try:
                    data = json.loads(message)
                    if data["event"] == "start":
                        print("got our streamsid")
                        start = data["start"]
                        streamsid = start["streamSid"]
                        streamsid_queue.put_nowait(streamsid)
                    if data["event"] == "connected":
                        continue
                    if data["event"] == "media":
                        media = data["media"]
                        chunk = base64.b64decode(media["payload"])
                        if media["track"] == "inbound":
                            inbuffer.extend(chunk)
                    if data["event"] == "stop":
                        break

                    # check if our buffer is ready to send to our audio_queue (and, thus, then to sts)
                    while len(inbuffer) >= BUFFER_SIZE:
                        chunk = inbuffer[:BUFFER_SIZE]
                        audio_queue.put_nowait(chunk)
                        inbuffer = inbuffer[BUFFER_SIZE:]
                except:
                    break

        # the async for loop will end if the ws connection from twilio dies
        # and if this happens, we should forward an some kind of message to sts
        # to signal sts to send back remaining messages before closing(?)
        # audio_queue.put_nowait(b'')

        await asyncio.wait(
            [
                asyncio.ensure_future(sts_sender(sts_ws)),
                asyncio.ensure_future(sts_receiver(sts_ws)),
                asyncio.ensure_future(twilio_receiver(twilio_ws)),
            ]
        )

        await twilio_ws.close()


async def router(websocket, path):
    print(f"Incoming connection on path: {path}")
    if path == "/twilio":
        print("Starting Twilio handler")
        await twilio_handler(websocket)

def main():
    # Create a new event loop
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    # Start the FastAPI server in a separate task
    config = uvicorn.Config(
        app,
        host="0.0.0.0",
        port=5002,
        log_level="info"
    )
    server = uvicorn.Server(config)
    loop.create_task(server.serve())

    # Start the WebSocket server
    ws_server = websockets.serve(router, "0.0.0.0", 5000)
    print("FastAPI server starting on http://0.0.0.0:5002")
    print("WebSocket server starting on ws://0.0.0.0:5000")

    loop.run_until_complete(ws_server)
    loop.run_forever()


if __name__ == "__main__":
    sys.exit(main() or 0)