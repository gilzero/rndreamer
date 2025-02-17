from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict
from enum import Enum
from app.config import ChatProvider

class MessageRole(str, Enum):
    """Valid roles for chat messages"""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"

class ChatMessage(BaseModel):
    """Single chat message structure"""
    role: MessageRole
    content: str
    metadata: Optional[Dict] = None

    @validator('content')
    def validate_content(cls, v):
        """Validate message content length"""
        from app.config import settings
        
        if len(v.strip()) < settings.MIN_MESSAGE_LENGTH:
            raise ValueError("Message content cannot be empty")
        if len(v) > settings.MAX_MESSAGE_LENGTH:
            raise ValueError(f"Message exceeds maximum length of {settings.MAX_MESSAGE_LENGTH} characters")
        return v.strip()

class ChatRequest(BaseModel):
    """Chat request structure"""
    messages: List[ChatMessage]
    provider: ChatProvider
    model: Optional[str] = None
    temperature: Optional[float] = None
    
    @validator('messages')
    def validate_messages(cls, v):
        """Validate message list length"""
        from app.config import settings
        
        if len(v) > settings.MAX_MESSAGES_IN_CONTEXT:
            raise ValueError(f"Too many messages. Maximum is {settings.MAX_MESSAGES_IN_CONTEXT}")
        return v

class ChatResponse(BaseModel):
    """Chat response structure"""
    content: str
    metadata: Optional[Dict] = None

class ErrorResponse(BaseModel):
    """Error response structure"""
    error: str
    code: Optional[str] = None
    details: Optional[Dict] = None

class HealthResponse(BaseModel):
    """Health check response structure"""
    status: str = "healthy"
    version: str = "1.0.0"
    providers: Dict[str, str] = Field(
        default_factory=lambda: {
            "gpt": "ok",
            "claude": "ok",
            "gemini": "ok"
        }
    )
