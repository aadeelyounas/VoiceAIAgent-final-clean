FROM python:3.10.13-alpine

WORKDIR /app

RUN --mount=type=cache,target=/root/.cache/pip \
    --mount=type=bind,source=local_setup/telephony_server/requirements.txt,target=/app/requirements.txt \
    pip install --no-cache-dir -r requirements.txt
COPY local_setup/telephony_server/twilio_api_server.py /app/

EXPOSE 8001

CMD ["uvicorn", "twilio_api_server:app", "--host", "0.0.0.0", "--port", "8001"]
