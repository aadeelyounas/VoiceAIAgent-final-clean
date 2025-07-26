# VoiceAIAgent

## Deployment Instructions

### Prerequisites
- Docker and Docker Compose
- Ngrok account
- OpenAI API, Deepgram API, Twilio API

### Quick Setup

1. **Configure Environment**
   ```bash
   cp .env.sample .env
   # Edit .env with your API keys
   ```

2. **Update Ngrok Configuration**
   ```bash
   # Edit ngrok-config.yml with your auth token
   ```

3. **Deploy**
   ```bash
   docker-compose build --no-cache
   docker-compose up -d
   ```

4. **Verify**
   ```bash
   docker-compose ps
   ```

### Access Points
- VoiceAIAgent API: `http://localhost:5001`
- Inbound Server: `http://localhost:5002`  
- Twilio Server: `http://localhost:8001`
- Ngrok Dashboard: `http://localhost:4040`
