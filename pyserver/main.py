from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from typing import Dict, List

from app.config import settings, ChatProvider
from app.models import (
    ChatRequest, ChatResponse,
    ErrorResponse, HealthResponse,
    ChatMessage
)
from app.services import chat_service
from app.utils import rate_limiter  # Assuming these exist
import logging

logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="AI Chat API",
    description="Multi-provider AI Chat API with LangChain integration",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production.  This is very permissive.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def check_rate_limits(request: Request, provider: ChatProvider = None) -> None:
    """Check both global and provider-specific rate limits."""
    if not rate_limiter.check_rate_limit(
        'global',
        settings.RATE_LIMIT_MAX_REQUESTS,
        settings.RATE_LIMIT_WINDOW_MS
    ):
        raise HTTPException(
            status_code=429,
            detail={
                "error": "RATE_LIMIT_EXCEEDED",
                "message": "Global rate limit exceeded"
            }
        )

    if provider and not rate_limiter.check_rate_limit(
        provider.value,
        settings.PROVIDER_RATE_LIMITS[provider],
        settings.RATE_LIMIT_WINDOW_MS
    ):
        raise HTTPException(
            status_code=429,
            detail={
                "error": "RATE_LIMIT_EXCEEDED",
                "message": f"{provider.value.upper()} rate limit exceeded"
            }
        )

def set_rate_limit_headers(response: Response, provider: ChatProvider = None) -> None:
    """Set rate limit headers for both global and provider-specific limits."""
    response.headers["X-RateLimit-Remaining"] = str(rate_limiter.get_remaining_requests('global'))
    response.headers["X-RateLimit-Reset"] = str(rate_limiter.get_reset_time('global'))

    if provider:
        response.headers[f"X-RateLimit-Remaining-{provider.value.upper()}"] = str(
            rate_limiter.get_remaining_requests(provider.value)
        )
        response.headers[f"X-RateLimit-Reset-{provider.value.upper()}"] = str(
            rate_limiter.get_reset_time(provider.value)
        )

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Middleware to enforce rate limiting on incoming requests."""
    try:
        # Extract provider from path if it's a chat endpoint
        provider = None
        for p in ChatProvider:
            if f"/chat/{p.value}" in request.url.path:
                provider = p
                break

        await check_rate_limits(request, provider)
        response = await call_next(request)
        set_rate_limit_headers(response, provider)
        return response

    except HTTPException as e:
        return JSONResponse(
            status_code=e.status_code,
            content=ErrorResponse(
                error=e.detail.get("message", "Rate limit exceeded"),
                code=e.detail.get("error", "RATE_LIMIT_EXCEEDED")
            ).model_dump()
        )
    except Exception as e:
        logger.exception("Rate limiting error: %s", e)
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(
                error="Internal Server Error",
                code="INTERNAL_SERVER_ERROR"
            ).model_dump()
        )

@app.middleware("http")
async def validate_request(request: Request, call_next):
    """
    Middleware to validate incoming requests.  Currently a placeholder.
    """
    #  Implement request validation here.
    response = await call_next(request)
    return response

@app.get("/health", response_model=HealthResponse, responses={503: {"model": ErrorResponse}})
async def health_check():
    """Health check endpoint with provider status verification."""
    provider_status = {}
    overall_status = "healthy"

    for provider in ChatProvider:
        if not settings.ENABLED_PROVIDERS.get(provider, False):
            provider_status[provider.value] = "disabled"
            continue

        try:
            chat_service._get_model(provider)
            provider_status[provider.value] = "ok"
        except Exception as e:
            provider_status[provider.value] = "error"
            overall_status = "degraded"
            logger.error(f"Provider {provider.value} health check failed: {str(e)}")

    response = HealthResponse(
        status=overall_status,
        version="1.0.0",
        providers=provider_status
    )
    
    return JSONResponse(
        status_code=503 if overall_status == "degraded" else 200,
        content=response.model_dump()
    )

@app.post("/chat/{provider}", response_model=ChatResponse)
async def chat(
    provider: ChatProvider,
    request: ChatRequest,
) -> ChatResponse:
    """Handle chat requests."""
    try:
        content = await chat_service.chat(
            messages=request.messages,
            provider=provider,
            model=request.model
        )
        return ChatResponse(content=content)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Chat error: %s", e)
        raise HTTPException(
            status_code=500,
            detail={"error": "INTERNAL_ERROR", "message": str(e)}
        )

@app.post("/chat/{provider}/stream")
async def chat_stream(
    provider: ChatProvider,
    request: ChatRequest,
) -> StreamingResponse:
    """Handle streaming chat requests."""
    try:
        return StreamingResponse(
            chat_service.chat_stream(
                messages=request.messages,
                provider=provider,
                model=request.model
            ),
            media_type="text/event-stream"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Stream error: %s", e)
        raise HTTPException(
            status_code=500,
            detail={"error": "INTERNAL_ERROR", "message": str(e)}
        )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error=exc.detail.get("message", str(exc.detail)),
            code=exc.detail.get("error", "HTTP_ERROR")
        ).model_dump()
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions."""
    logger.exception("Unhandled error: %s", exc)
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="Internal server error",
            code="INTERNAL_SERVER_ERROR"
        ).model_dump()
    )