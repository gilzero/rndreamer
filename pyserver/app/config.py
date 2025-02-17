from pydantic_settings import BaseSettings
from typing import Dict, Optional
from enum import Enum

class ChatProvider(str, Enum):
    """Supported AI chat providers"""
    GPT = "gpt"
    CLAUDE = "claude"
    GEMINI = "gemini"

class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Server Configuration
    PORT: int = 3051
    ENVIRONMENT: str = "development"

    # API Keys
    OPENAI_API_KEY: str
    ANTHROPIC_API_KEY: str
    GEMINI_API_KEY: str

    # Model Configuration
    MODEL_CONFIGS: Dict[str, Dict] = {
        ChatProvider.GPT: {
            "default": "gpt-4o",
            "fallback": "gpt-4o-mini",
            "temperature": 0.3,
            "max_tokens": 8192,
        },
        ChatProvider.CLAUDE: {
            "default": "claude-3-5-sonnet-latest",
            "fallback": "claude-3-5-haiku-latest",
            "temperature": 0.3,
            "max_tokens": 8192,
        },
        ChatProvider.GEMINI: {
            "default": "gemini-2.0-flash",
            "fallback": "gemini-1.5-pro",
            "temperature": 0.3,
            "max_tokens": 8192,
        }
    }

    # Message Validation
    MAX_MESSAGE_LENGTH: int = 24000
    MAX_MESSAGES_IN_CONTEXT: int = 50
    MIN_MESSAGE_LENGTH: int = 1

    # Rate Limiting (in milliseconds)
    RATE_LIMIT_WINDOW_MS: int = 3600000  # 1 hour
    RATE_LIMIT_MAX_REQUESTS: int = 500
    PROVIDER_RATE_LIMITS: Dict[str, int] = {
        ChatProvider.GPT: 200,
        ChatProvider.CLAUDE: 200,
        ChatProvider.GEMINI: 200
    }

    class Config:
        env_file = ".env"

# Create global settings instance
settings = Settings()
