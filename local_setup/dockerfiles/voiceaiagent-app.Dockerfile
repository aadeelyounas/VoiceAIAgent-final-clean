FROM python:3.10.13-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libgomp1 \
    git \
    ffmpeg \
    gcc \
    g++ \
    python3-dev \
    build-essential && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Upgrade pip and install wheel
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --upgrade pip setuptools wheel

# Install uvicorn first
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install uvicorn

# Install common dependencies that voiceaiagent requires
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install \
    python-dotenv \
    pydantic \
    fastapi \
    huggingface-hub \
    numpy \
    tqdm \
    requests

# Install voiceaiagent package from local directory
COPY voiceaiagent /app/voiceaiagent
COPY pyproject.toml requirements.txt /app/
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --verbose -e . || \
    (echo "Failed to install voiceaiagent package. See error above." && exit 1)

# Copy application files
COPY local_setup/quickstart_server.py /app/
COPY local_setup/presets /app/presets

EXPOSE 5001

CMD ["uvicorn", "quickstart_server:app", "--host", "0.0.0.0", "--port", "5001"]
