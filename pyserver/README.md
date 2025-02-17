# PyServer (FastAPI)

```bash
pyserver/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI app, routes, and middleware
│   ├── config.py        # All configurations (env vars, settings)
│   ├── models.py        # All Pydantic models
│   ├── services.py      # Chat and LangChain services
│   └── utils.py         # Utilities (validation, logging, rate limiting)
├── tests/
│   ├── __init__.py
│   ├── test_api.py      # API endpoint tests
│   └── test_services.py # Service layer tests
├── logs/
├── .env
├── .env.example
├── .gitignore
├── requirements.txt
└── run.py
````

## Setup

1. Create and activate virtual environment (Python 3.11+)
```bash
python3.11 -m venv venv
source venv/bin/activate  # Unix/macOS
```

2. Install dependencies
```bash
pip install -r requirements.txt
```

3. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your API keys and settings
```

4. Run the server
```bash
python run.py
```

## API Endpoints

- Health Check: `GET /health`
- Chat (Stream): `POST /chat/{provider}?stream=true`
- Chat (Regular): `POST /chat/{provider}`

Supported providers:
- GPT: `/chat/gpt`
- Claude: `/chat/claude`
- Gemini: `/chat/gemini`

## Development

- API Documentation: http://localhost:3051/docs
- ReDoc: http://localhost:3051/redoc
- Health Check: http://localhost:3051/health

## Features

- Multiple AI Provider Support (GPT, Claude, Gemini)
- Streaming and Non-streaming Responses
- Rate Limiting
- Request Validation
- Error Handling
- Logging
- Health Monitoring

## Roadmap

### Phase 1 (Current)
- [x] Basic FastAPI Setup
- [x] Multiple AI Provider Integration
- [x] Rate Limiting
- [x] Basic Logging

### Phase 2 (Next)
- [ ] Enhanced Error Handling
- [ ] Improved Logging with ELK Stack
- [ ] Metrics Collection (Prometheus)
- [ ] Docker Support

### Phase 3 (Future)
- [ ] Authentication & Authorization
- [ ] Response Caching
- [ ] Load Balancing
- [ ] CI/CD Pipeline

## TODO

### High Priority
- [ ] Implement Unit Tests
- [ ] Add Request/Response Validation
- [ ] Improve Error Messages
- [ ] Add API Documentation

### Medium Priority
- [ ] Set Up Monitoring
- [ ] Implement Caching
- [ ] Add Performance Metrics
- [ ] Docker Compose Setup

### Low Priority
- [ ] Add User Management
- [ ] Implement Analytics
- [ ] Add Admin Dashboard
- [ ] Set Up CI/CD
