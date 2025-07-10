FROM python:3.10.13-alpine

WORKDIR /app

RUN --mount=type=cache,target=/root/.cache/pip \
    pip install certifi==2024.8.30 python-dotenv==1.1.1 charset-normalizer==3.3.2 idna==3.8 requests==2.32.3 urllib3==2.2.3 websockets==12.0 fastapi==0.115.13 uvicorn==0.30.1 python-multipart==0.0.9

COPY local_setup/inbound_server.py /app/

EXPOSE 5000
EXPOSE 5002
CMD ["python", "inbound_server.py"]