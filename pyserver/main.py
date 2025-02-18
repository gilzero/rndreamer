# main.py
# Standard library imports
import os
import sys
import json
import time
import asyncio
import logging
import logging.handlers
import traceback
import threading
import psutil
from datetime import datetime
from pathlib import Path
from enum import Enum
from typing import List, Optional, Dict, Any, Union
from typing_extensions import Literal

# Third-party imports
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, field_validator
from dotenv import load_dotenv
from langchain.callbacks import AsyncIteratorCallbackHandler
from langchain.schema import HumanMessage, AIMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI, HarmBlockThreshold, HarmCategory
from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq

# Load environment variables
load_dotenv()

###################
# Configuration
###################

class Config:
    # Server
    PORT = os.getenv("PORT", "3050")
    
    # API Keys
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    
    # Models
    MODELS = {
        "gpt": {
            "default": os.getenv("OPENAI_MODEL_DEFAULT"),
            "fallback": os.getenv("OPENAI_MODEL_FALLBACK"),
            "temperature": float(os.getenv("OPENAI_TEMPERATURE", "0.7")),
            "max_tokens": int(os.getenv("OPENAI_MAX_TOKENS", "2048")),
        },
        "claude": {
            "default": os.getenv("ANTHROPIC_MODEL_DEFAULT"),
            "fallback": os.getenv("ANTHROPIC_MODEL_FALLBACK"),
            "temperature": float(os.getenv("ANTHROPIC_TEMPERATURE", "0.7")),
            "max_tokens": int(os.getenv("ANTHROPIC_MAX_TOKENS", "2048")),
        },
        "gemini": {
            "default": os.getenv("GEMINI_MODEL_DEFAULT"),
            "fallback": os.getenv("GEMINI_MODEL_FALLBACK"),
            "temperature": float(os.getenv("GEMINI_TEMPERATURE", "0.7")),
            "max_tokens": int(os.getenv("GEMINI_MAX_TOKENS", "2048")),
        },
        "groq": {
            "default": os.getenv("GROQ_MODEL_DEFAULT"),
            "fallback": os.getenv("GROQ_MODEL_FALLBACK"),
            "temperature": float(os.getenv("GROQ_TEMPERATURE", "0.7")),
            "max_tokens": int(os.getenv("GROQ_MAX_TOKENS", "2048")),
        },
    }
    
    # Message Validation
    MAX_MESSAGE_LENGTH = int(os.getenv("MAX_MESSAGE_LENGTH", "24000"))
    MAX_MESSAGES_IN_CONTEXT = int(os.getenv("MAX_MESSAGES_IN_CONTEXT", "50"))
    MIN_MESSAGE_LENGTH = int(os.getenv("MIN_MESSAGE_LENGTH", "1"))
    
    # Rate Limiting
    RATE_LIMIT_WINDOW_MS: int = int(os.getenv("RATE_LIMIT_WINDOW_MS", "60000"))
    RATE_LIMIT_MAX_REQUESTS: int = int(os.getenv("RATE_LIMIT_MAX_REQUESTS", "60"))

    @classmethod
    def get_rate_limit_reset(cls) -> int:
        """Get the rate limit reset timestamp"""
        return int(time.time() + (cls.RATE_LIMIT_WINDOW_MS/1000))

###################
# Models
###################

class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"

class ChatMessage(BaseModel):
    role: MessageRole
    content: str
    timestamp: Optional[int] = None
    model: Optional[str] = None

    @field_validator('content')
    @classmethod
    def validate_content_length(cls, v):
        if not v.strip():
            raise ValueError("Message content cannot be empty")
        if len(v) > Config.MAX_MESSAGE_LENGTH:
            raise ValueError(f"Message exceeds maximum length of {Config.MAX_MESSAGE_LENGTH} characters")
        return v

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: str

    @field_validator('messages')
    @classmethod
    def validate_messages_count(cls, v):
        if len(v) > Config.MAX_MESSAGES_IN_CONTEXT:
            raise ValueError(f"Conversation exceeds maximum of {Config.MAX_MESSAGES_IN_CONTEXT} messages")
        return v

class HealthResponse(BaseModel):
    status: Literal["OK", "ERROR"]
    message: Optional[str] = None
    provider: Optional[str] = None
    metrics: Optional[Dict[str, float]] = None
    error: Optional[Dict[str, str]] = None

###################
# Logging Setup
###################

def _setup_logging():
    """Configure main application logging"""
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    
    # Console Handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    console_handler.setLevel(logging.INFO)
    logger.addHandler(console_handler)
    
    # Ensure logs directory exists
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # File handlers with rotation
    handlers = {
        "app": ("app.log", logging.INFO),
        "error": ("error.log", logging.ERROR),
        "debug": ("debug.log", logging.DEBUG),
    }
    
    for name, (filename, level) in handlers.items():
        handler = logging.handlers.RotatingFileHandler(
            f"logs/{filename}",
            maxBytes=10485760,  # 10MB
            backupCount=5,
            encoding="utf-8"
        )
        handler.setFormatter(formatter)
        handler.setLevel(level)
        logger.addHandler(handler)
    
    return logger

###################
# Utility Functions
###################

def _sanitize_log_data(data: Any) -> Any:
    """Remove sensitive data from logs"""
    if isinstance(data, dict):
        return {k: _sanitize_log_data(v) for k, v in data.items() if k not in ['api_key']}
    elif isinstance(data, list):
        return [_sanitize_log_data(item) for item in data]
    return data

def _format_log_data(data: Any) -> str:
    """Format data for logging"""
    try:
        return json.dumps(_sanitize_log_data(data), indent=2)
    except:
        return str(data)

def _get_llm_config(llm: Any) -> Dict[str, Any]:
    """Get LLM configuration safely"""
    config = {
        "streaming": getattr(llm, "streaming", None),
        "temperature": getattr(llm, "temperature", None),
        "timeout": getattr(llm, "timeout", None),
        "max_retries": getattr(llm, "max_retries", None),
    }
    
    if hasattr(llm, "max_tokens"):
        config["max_tokens"] = llm.max_tokens
    elif hasattr(llm, "max_output_tokens"):
        config["max_tokens"] = llm.max_output_tokens
    
    if isinstance(llm, ChatGoogleGenerativeAI):
        config.update({
            "safety_settings": getattr(llm, "safety_settings", None),
        })
    
    return config

def _log_debug_info(action: str, data: Any = None, context: Dict[str, Any] = None, error: Exception = None):
    """Log detailed debug information"""
    debug_info = {
        "action": action,
        "timestamp": datetime.utcnow().isoformat(),
        "data": data,
        "context": context or {},
    }
    
    if error:
        debug_info["error"] = {
            "type": type(error).__name__,
            "message": str(error),
            "traceback": traceback.format_exc()
        }
    
    logger.debug(f"Debug Info:\n{_format_log_data(debug_info)}")

###################
# LLM Integration
###################

def _get_llm(provider: str, model: str):
    """Initialize LLM based on provider"""
    logger.info(f"Initializing LLM for provider: {provider}, model: {model}")
    
    try:
        config = Config.MODELS[provider]
        
        if provider == "gpt":
            return ChatOpenAI(
                api_key=Config.OPENAI_API_KEY,
                model=model,
                streaming=True,
                temperature=config["temperature"],
                max_tokens=config["max_tokens"],
            )
        elif provider == "claude":
            return ChatAnthropic(
                api_key=Config.ANTHROPIC_API_KEY,
                model=model,
                streaming=True,
                temperature=config["temperature"],
                max_tokens=config["max_tokens"],
            )
        elif provider == "gemini":
            return ChatGoogleGenerativeAI(
                api_key=Config.GEMINI_API_KEY,
                model=model,
                streaming=True,
                temperature=config["temperature"],
                max_output_tokens=config["max_tokens"],
                safety_settings={
                    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                },
                convert_messages=True,
                timeout=30,
                max_retries=2,
            )
        elif provider == "groq":
            return ChatGroq(
                api_key=Config.GROQ_API_KEY,
                model=model,
                streaming=True,
                temperature=config["temperature"],
                max_tokens=config["max_tokens"],
            )
            
        raise ValueError(f"Unknown provider: {provider}")
    except Exception as e:
        logger.error(f"Failed to initialize {provider} model: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initialize {provider} model: {str(e)}"
        )

def _convert_messages(messages: List[ChatMessage], provider: str = None):
    """Convert messages to LangChain format with provider-specific handling"""
    message_map = {
        MessageRole.USER: HumanMessage,
        MessageRole.ASSISTANT: AIMessage,
        MessageRole.SYSTEM: SystemMessage,
    }
    
    converted_messages = []
    
    for msg in messages:
        if provider == "gemini" and msg.role == MessageRole.SYSTEM:
            next_user_msg = next(
                (m for m in messages if m.role == MessageRole.USER), 
                None
            )
            if next_user_msg:
                combined_content = f"{msg.content}\n\nUser: {next_user_msg.content}"
                converted_messages.append(HumanMessage(content=combined_content))
                continue
            else:
                converted_messages.append(HumanMessage(content=msg.content))
        else:
            converted_messages.append(message_map[msg.role](content=msg.content))
    
    return converted_messages

###################
# FastAPI App
###################

# Initialize FastAPI and logging
app = FastAPI()
logger = _setup_logging()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoints
@app.get("/health", response_model=HealthResponse)
async def health_check():
    logger.info("Health check endpoint called")
    return {
        "status": "OK",
        "message": "System operational"
    }

@app.get("/health/{provider}", response_model=HealthResponse)
async def provider_health_check(provider: str):
    logger.info(f"Provider health check called for: {provider}")
    if provider not in Config.MODELS:
        logger.error(f"Invalid provider requested: {provider}")
        raise HTTPException(status_code=400, detail=f"Invalid provider: {provider}")
    
    start_time = time.time()
    await asyncio.sleep(0.1)
    duration = time.time() - start_time
    
    logger.info(f"Provider {provider} health check completed in {duration:.2f}s")
    return {
        "status": "OK",
        "provider": provider,
        "metrics": {"responseTime": duration}
    }

# Update the stream_response function
async def stream_response(request: ChatRequest, provider: str):
    message_id = f"{provider}-{int(time.time()*1000)}"
    start_time = time.time()
    
    # Debug log for request initialization
    _log_debug_info(
        "stream_response_start",
        {
            "message_id": message_id,
            "provider": provider,
            "model": request.model,
            "request_messages": [
                {
                    "role": msg.role,
                    "content": msg.content,
                    "timestamp": msg.timestamp,
                    "length": len(msg.content)
                } for msg in request.messages
            ]
        },
        {
            "memory_usage": psutil.Process().memory_info().rss / 1024 / 1024,  # MB
            "thread_id": threading.get_ident(),
            "process_id": os.getpid()
        }
    )
    
    try:
        llm = _get_llm(provider, request.model)
        callback = AsyncIteratorCallbackHandler()
        llm.callbacks = [callback]
        
        messages = _convert_messages(request.messages, provider)
        
        # Log the converted messages
        _log_debug_info(
            "messages_converted",
            {
                "message_id": message_id,
                "provider": provider,
                "messages": messages
            }
        )
        
        # Start the generation task
        task = asyncio.create_task(llm.agenerate([messages]))
        full_response = ""
        token_count = 0
        
        try:
            if provider == "gemini":
                # For Gemini, we need to handle streaming differently
                result = await task
                response_text = result.generations[0][0].text
                
                # Simulate streaming by splitting the response
                tokens = response_text.split()
                for token in tokens:
                    token_count += 1
                    token_with_space = token + " "
                    full_response += token_with_space
                    
                    data = {
                        "id": message_id,
                        "delta": {"content": token_with_space}
                    }
                    
                    # Log token details periodically
                    if token_count == 1 or token_count % 10 == 0:
                        _log_debug_info(
                            "token_sent",
                            {
                                "message_id": message_id,
                                "token_number": token_count,
                                "token": token_with_space,
                                "response_length": len(full_response)
                            }
                        )
                    
                    yield f"data: {json.dumps(data)}\n\n"
                    await asyncio.sleep(0.01)  # Add small delay between tokens
            else:
                # For other providers, use normal streaming
                async for token in callback.aiter():
                    if token:  # Only process non-empty tokens
                        token_count += 1
                        full_response += token
                        
                        data = {
                            "id": message_id,
                            "delta": {"content": token}
                        }
                        
                        # Log token details periodically
                        if token_count == 1 or token_count % 100 == 0:
                            _log_debug_info(
                                "token_received",
                                {
                                    "message_id": message_id,
                                    "token_number": token_count,
                                    "token": token,
                                    "response_length": len(full_response)
                                }
                            )
                        
                        yield f"data: {json.dumps(data)}\n\n"
                
                # For non-Gemini providers, wait for task completion
                await task
        
        except Exception as e:
            _log_debug_info(
                "streaming_error",
                {
                    "message_id": message_id,
                    "error": str(e),
                    "provider": provider
                }
            )
            raise
        
        # Log completion
        _log_debug_info(
            "generation_complete",
            {
                "message_id": message_id,
                "provider": provider,
                "total_tokens": token_count,
                "final_length": len(full_response),
                "response_preview": full_response[:200] + "..." if len(full_response) > 200 else full_response
            }
        )
        
        yield "data: [DONE]\n\n"
        
    except Exception as e:
        _log_debug_info(
            "stream_error",
            {
                "message_id": message_id,
                "error": str(e),
                "error_type": type(e).__name__,
                "provider": provider
            },
            error=e
        )
        raise

# Chat endpoints
@app.post("/chat/{provider}")
async def chat(provider: str, request: ChatRequest):
    start_time = time.time()
    
    try:
        # Validate provider
        if provider not in Config.MODELS:
            raise HTTPException(status_code=400, detail=f"Invalid provider: {provider}")
        
        # Validate model
        valid_models = [Config.MODELS[provider]["default"], Config.MODELS[provider]["fallback"]]
        if request.model not in valid_models:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid model for {provider}. Valid models are: {', '.join(valid_models)}"
            )
        
        # Log request metadata
        metadata = {
            "provider": provider,
            "model": request.model,
            "message_count": len(request.messages),
            "total_input_length": sum(len(msg.content) for msg in request.messages),
            "timestamp": datetime.utcnow().isoformat()
        }
        logger.info(f"Chat request metadata:\n{_format_log_data(metadata)}")
        
        # Set up SSE response
        response = StreamingResponse(
            stream_response(request, provider),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            }
        )
        
        # Log request duration
        duration = time.time() - start_time
        logger.info(f"Chat request initialized in {duration:.2f}s")
        
        return response
        
    except Exception as e:
        error_data = {
            "provider": provider,
            "model": request.model if hasattr(request, 'model') else None,
            "error": str(e),
            "error_type": type(e).__name__,
            "duration": time.time() - start_time
        }
        logger.error(f"Chat endpoint error:\n{_format_log_data(error_data)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Chat error with {provider}: {str(e)}"
        )

# Rate limiting middleware
@app.middleware("http")
async def add_rate_limit_headers(request: Request, call_next):
    # Add rate limiting headers - convert integers to strings
    response = await call_next(request)
    response.headers["X-RateLimit-Limit"] = str(Config.RATE_LIMIT_MAX_REQUESTS)
    response.headers["X-RateLimit-Remaining"] = str(Config.RATE_LIMIT_MAX_REQUESTS - 1)
    response.headers["X-RateLimit-Reset"] = str(Config.get_rate_limit_reset())
    return response

# Error handling
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    error_message = str(exc)
    if isinstance(exc, HTTPException):
        error_message = exc.detail
        logger.warning(f"HTTP Exception: {error_message}")
    else:
        logger.error(f"Unhandled exception: {error_message}", exc_info=True)
    
    if request.url.path.startswith("/chat/"):
        # Return error in SSE format for chat endpoints
        return StreamingResponse(
            iter([f'data: {{"error": "{error_message}"}}\ndata: [DONE]\n\n']),
            media_type="text/event-stream"
        )
    
    # Regular error response for other endpoints
    return {
        "status": "ERROR",
        "message": error_message,
        "error": {
            "type": exc.__class__.__name__,
            "message": error_message
        }
    }

if __name__ == "__main__":
    import uvicorn
    port = int(Config.PORT, "3050")  # Default to 3050 if PORT is not set
    # example execute command: clear && uvicorn main:app --reload --port=3050
    uvicorn.run(app, host="0.0.0.0", port=port)
    
