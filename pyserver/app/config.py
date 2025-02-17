import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Dict, Optional, Literal
from enum import Enum
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class ChatProvider(str, Enum):
    """Enumeration of supported AI chat providers."""
    GPT = "gpt"
    CLAUDE = "claude"
    GEMINI = "gemini"

class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Server Configuration
    PORT: int = 3050
    ENVIRONMENT: str = "development"

    # API Keys -  Use Optional[str] and handle missing keys gracefully
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None

    # Model Configuration - Use Literal for model names and a separate dict for enabled providers
    MODEL_CONFIGS: Dict[ChatProvider, Dict] = {
        ChatProvider.GPT: {
            "default": "gpt-4o",
            "fallback": "gpt-4o-mini",
            "temperature": 0.3,
            "max_tokens": 8192,
        },
        ChatProvider.CLAUDE: {
            "default": "claude-3-5-sonnet-latest",  #Consider removing the "-latest" for consistency
            "fallback": "claude-3-5-haiku-latest", #Consider removing the "-latest" for consistency
            "temperature": 0.3,
            "max_tokens": 8192,
        },
        ChatProvider.GEMINI: {
            "default": "gemini-2.0-flash",  #  Is "2.0" a typo? Should this and fallback match the pattern in services.py?
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
    PROVIDER_RATE_LIMITS: Dict[ChatProvider, int] = {
        ChatProvider.GPT: 200,
        ChatProvider.CLAUDE: 200,
        ChatProvider.GEMINI: 200,
    }

    # Use a dictionary to store the enabled status of each provider
    ENABLED_PROVIDERS: Dict[ChatProvider, bool] = {
        provider: os.getenv(f"ENABLE_{provider.upper()}", "true").lower() in ("true", "1", "t")
        for provider in ChatProvider
    }

    # Logging Configuration
    LOG_LEVEL: str = "INFO"
    LOG_FILE_PATH: str = "logs/app.log"

    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')



# Create global settings instance
settings = Settings()