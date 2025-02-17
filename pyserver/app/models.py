"""
File Overview:
This module defines the data models for the AI Chat API application.
It includes models for chat messages, requests, responses, and health checks.
The models are defined using Pydantic's BaseModel class and include validation
methods for message content and request parameters.

File Path:
pyserver/app/models.py
"""
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict
from enum import Enum
from app.config import ChatProvider, settings

class MessageRole(str, Enum):
    """Enumeration of valid roles for chat messages."""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"

class ChatMessage(BaseModel):
    """Represents a single chat message with role and content."""
    role: MessageRole
    content: str
    metadata: Optional[Dict] = None

    @field_validator('content')
    @classmethod
    def validate_content(cls, v):
        """Validate the length of the message content."""
        content = v.strip()
        content_length = len(content)
        
        if content_length < settings.MIN_MESSAGE_LENGTH:
            raise ValueError("Message content cannot be empty")
        
        if content_length > settings.MAX_MESSAGE_LENGTH:
            raise ValueError(
                f"Message is too long ({content_length} characters). "
                f"Maximum allowed length is {settings.MAX_MESSAGE_LENGTH} characters."
            )
        
        return content

class ChatRequest(BaseModel):
    """Structure for a chat request containing messages and options."""
    messages: List[ChatMessage]
    model: Optional[str] = None

    @field_validator('messages')
    @classmethod
    def validate_messages(cls, v):
        """
        Validate the number of messages in the request.
        
        Args:
            v: The list of messages.
        
        Returns:
            The validated list of messages.
        
        Raises:
            ValueError: If the number of messages exceeds the maximum allowed.
        """
        if len(v) > settings.MAX_MESSAGES_IN_CONTEXT:
            raise ValueError(f"Too many messages. Maximum is {settings.MAX_MESSAGES_IN_CONTEXT}")
        return v

class ChatResponse(BaseModel):
    """Structure for a chat response containing the content and optional metadata."""
    content: str
    metadata: Optional[Dict] = None

class ErrorResponse(BaseModel):
    """Structure for an error response with error details."""
    error: str
    code: str
    details: Optional[Dict] = None

class HealthResponse(BaseModel):
    """Structure for a health check response indicating system status."""
    status: str
    version: str
    providers: dict
