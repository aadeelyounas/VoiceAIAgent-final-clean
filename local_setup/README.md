# VoiceAIAgent - Local Setup


## Architecture Overview

The system consists of four main containerized components:

1. **VoiceAIAgent Server** - Core orchestration platform for creating and handling agents
2. **Telephony Server** - Handles telephony provider integration (Twilio/Plivo)
3. **Inbound Server** - Manages incoming call handling
4. **Redis** - Persistent storage for agents and prompt data
5. **Ngrok** - Local tunneling for webhook endpoints

## Prerequisites

- Docker and Docker Compose
- Python 3.8+
- Ngrok account (for tunneling)
- Telephony provider account (Twilio or Plivo)
- API keys for LLM, ASR, and TTS providers

## Quick Start

### 1. Environment Setup

1. Copy the environment template:
   ```bash
   cp .env.sample .env
   ```

2. Configure your environment variables in `.env`:
   ```bash
   # Telephony Provider (Twilio)
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number
   
   
   # Redis Configuration
   REDIS_URL=redis://redis:6379/0
   
   # System Configuration
   MAX_CONCURRENT_CALLS=50
   CALL_RECORDING_ENABLED=true
   DEFAULT_LANGUAGE=en
   AGENT_POOL_CAPACITY=100
   ESCALATION_TIMEOUT=30
   
   # API Configuration
   INBOUND_API_PORT=5002
   INBOUND_WEBHOOK_URL=/inbound_call
   
   # LLM Providers (add as needed)
   OPENAI_API_KEY=your_openai_api_key
   LITELLM_MODEL_API_KEY=your_llm_api_key
   LITELLM_MODEL_API_BASE=your_llm_base_url
   
   # ASR Providers
   DEEPGRAM_AUTH_TOKEN=your_deepgram_token
   
   # TTS Providers
   ELEVENLABS_API_KEY=your_elevenlabs_key
   CARTESIA_API_KEY=your_cartesia_key
   SMALLEST_API_KEY=your_smallest_key
   ```

### 2. Ngrok Configuration

1. Get your Ngrok auth token from [ngrok.com](https://ngrok.com)
2. Update `ngrok-config.yml` with your auth token:
   ```yaml
   authtoken: your_ngrok_auth_token
   tunnels:
     voiceaiagent:
       proto: http
       addr: voiceaiagent-app:5001
     inbound:
       proto: http
       addr: voiceaiagent-inbound-server:5002
   ```

### 3. Build and Run

1. Build the Docker images:
   ```bash
   docker-compose build --no-cache
   ```

2. Start all services:
   ```bash
   docker-compose up -d
   ```

3. For specific services only:
   ```bash
   # Core services
   docker-compose up -d voiceaiagent-app redis ngrok
   
   # With Twilio
   docker-compose up -d voiceaiagent-app redis ngrok voiceaiagent-twilio-app
   
   # With inbound server
   docker-compose up -d voiceaiagent-app voiceaiagent-inbound-server redis ngrok
   ```

### 4. Verify Installation

1. Check service status:
   ```bash
   docker-compose ps
   ```

2. View logs:
   ```bash
   docker-compose logs -f voiceaiagent-app
   ```

3. Access services:
   - VoiceAIAgent API: `http://localhost:5001`
   - Inbound Server: `http://localhost:5002`
   - Twilio Server: `http://localhost:8001`
   - Ngrok Dashboard: `http://localhost:4040`
   - Redis: `localhost:6379`

## Configuration

### Supported Providers

#### ASR (Automatic Speech Recognition)
- **Deepgram** - Set `DEEPGRAM_AUTH_TOKEN`

#### LLM (Large Language Models)
- **OpenAI** - Set `OPENAI_API_KEY`
- **LiteLLM compatible models** - Set `LITELLM_MODEL_API_KEY` and `LITELLM_MODEL_API_BASE`
- **VLLM hosted models** - Set `VLLM_SERVER_BASE_URL`

#### TTS (Text-to-Speech)
- **AWS Polly** - Configure AWS credentials in `~/.aws/`
- **ElevenLabs** - Set `ELEVENLABS_API_KEY`
- **OpenAI** - Set `OPENAI_API_KEY`
- **Deepgram** - Set `DEEPGRAM_AUTH_TOKEN`
- **Cartesia** - Set `CARTESIA_API_KEY`
- **Smallest** - Set `SMALLEST_API_KEY`

#### Telephony
- **Twilio** - Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- **Plivo** - Set `PLIVO_AUTH_ID`, `PLIVO_AUTH_TOKEN`, `PLIVO_PHONE_NUMBER`

### Agent Configuration

Agents are configured through JSON payloads. Example agent configuration:

```json
{
  "agent_name": "customer_service_agent",
  "agent_type": "conversational",
  "language": "en",
  "voice": {
    "provider": "elevenlabs",
    "voice_id": "pNInz6obpgDQGcFmaJgB"
  },
  "llm": {
    "provider": "openai",
    "model": "gpt-4"
  },
  "asr": {
    "provider": "deepgram",
    "model": "nova"
  },
  "prompts": {
    "system_prompt": "You are a helpful customer service representative...",
    "welcome_message": "Hello! How can I help you today?"
  }
}
```

## API Usage

### Create an Agent

```bash
curl -X POST http://localhost:5001/agent \
  -H "Content-Type: application/json" \
  -d @agent_config.json
```

### Start a Call

```bash
curl -X POST http://localhost:5001/call \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "your_agent_id",
    "recipient_phone": "+1234567890"
  }'
```

### List Active Calls

```bash
curl http://localhost:5001/calls
```

## Development

### File Structure

```
local_setup/
├── docker-compose.yml          # Main orchestration file
├── ngrok-config.yml           # Ngrok tunnel configuration
├── .env.sample               # Environment variables template
├── dockerfiles/              # Docker build files
│   ├── voiceaiagent-app.Dockerfile
│   ├── voiceaiagent-inbound-server.Dockerfile
│   └── voiceaiagent-twilio-app.Dockerfile
├── telephony_server/         # Telephony integration servers
│   └── twilio_api_server.py
├── inbound_server.py         # Inbound call handler
├── quickstart_client.py      # Example client
└── quickstart_server.py      # Example server
```

### Adding Custom Providers

1. **New Telephony Provider**: Create files in `../voiceaiagent/input_handlers/telephony_providers/` and `../voiceaiagent/output_handlers/telephony_providers/`
2. **New LLM Provider**: Add configuration to `../voiceaiagent/llms/`
3. **New TTS Provider**: Add implementation to `../voiceaiagent/synthesizer/`
4. **New ASR Provider**: Add implementation to `../voiceaiagent/transcriber/`

### Debugging

1. Enable debug logging:
   ```bash
   export LOG_LEVEL=DEBUG
   ```

2. Access container shells:
   ```bash
   docker-compose exec voiceaiagent-app bash
   ```

3. Monitor Redis:
   ```bash
   docker-compose exec redis redis-cli monitor
   ```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 5001, 5002, 6379, 8001, 4040 are available
2. **Ngrok connection**: Verify auth token in `ngrok-config.yml`
3. **Provider authentication**: Check API keys in `.env` file
4. **AWS credentials**: Ensure `~/.aws/credentials` is properly configured for Polly

### Performance Optimization

- Increase `MAX_CONCURRENT_CALLS` for higher throughput
- Use local Redis instance for production
- Configure provider-specific optimization settings
- Monitor container resource usage

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## Support

- **Discord**: Join our community for support and discussions
- **Documentation**: Visit the hosted docs for detailed API reference
- **Issues**: Report bugs and feature requests on GitHub

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.
