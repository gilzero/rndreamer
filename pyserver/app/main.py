from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import List, Optional

from app.config import settings, ChatProvider
from app.models import (
    ChatMessage, ChatRequest, ChatResponse,
    ErrorResponse, HealthResponse
)
from app.services import chat_service
from app.utils import rate_limit_middleware

# Initialize FastAPI app
app = FastAPI(
    title="AI Chat API",
    description="Multi-provider AI Chat API with LangChain integration",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add rate limiting middleware
@app.middleware("http")
async def rate_limit(request: Request, call_next):
    try:
        rate_limit_middleware(request)
        response = await call_next(request)
        return response
    except HTTPException as e:
        return Response(
            content=ErrorResponse(
                error=e.detail,
                code="RATE_LIMIT_EXCEEDED"
            ).model_dump_json(),
            status_code=e.status_code,
            media_type="application/json"
        )

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse()

@app.post("/chat/{provider}", response_model=ChatResponse)
async def chat(
    provider: ChatProvider,
    request: ChatRequest,
    stream: bool = False
):
    """
    Chat endpoint supporting both streaming and non-streaming responses
    
    Args:
        provider: AI provider to use (gpt, claude, gemini)
        request: Chat request containing messages and options
        stream: Whether to stream the response
    """
    try:
        if stream:
            return StreamingResponse(
                chat_service.chat_stream(
                    messages=request.messages,
                    provider=provider,
                    model=request.model
                ),
                media_type="text/event-stream"
            )
        else:
            content = await chat_service.chat(
                messages=request.messages,
                provider=provider,
                model=request.model
            )
            return ChatResponse(content=content)
            
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# Provider-specific endpoints for better OpenAPI documentation
@app.post("/chat/gpt", response_model=ChatResponse)
async def chat_gpt(request: ChatRequest, stream: bool = False):
    """OpenAI GPT chat endpoint"""
    request.provider = ChatProvider.GPT
    return await chat(ChatProvider.GPT, request, stream)

@app.post("/chat/claude", response_model=ChatResponse)
async def chat_claude(request: ChatRequest, stream: bool = False):
    """Anthropic Claude chat endpoint"""
    request.provider = ChatProvider.CLAUDE
    return await chat(ChatProvider.CLAUDE, request, stream)

@app.post("/chat/gemini", response_model=ChatResponse)
async def chat_gemini(request: ChatRequest, stream: bool = False):
    """Google Gemini chat endpoint"""
    request.provider = ChatProvider.GEMINI
    return await chat(ChatProvider.GEMINI, request, stream)

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions"""
    return Response(
        content=ErrorResponse(
            error=exc.detail,
            code=exc.detail.replace(" ", "_").upper()
        ).model_dump_json(),
        status_code=exc.status_code,
        media_type="application/json"
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    return Response(
        content=ErrorResponse(
            error="Internal server error",
            code="INTERNAL_SERVER_ERROR",
            details={"message": str(exc)}
        ).model_dump_json(),
        status_code=500,
        media_type="application/json"
    )
