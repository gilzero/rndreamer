import logging
import time
from typing import Dict, Optional, Callable
from fastapi import HTTPException, Request
from collections import defaultdict
from datetime import datetime, timedelta
import json
from app.config import settings, ChatProvider

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class RateLimiter:
    """Rate limiting implementation"""
    def __init__(self):
        self.requests: Dict[str, list] = defaultdict(list)
    
    def _clean_old_requests(self, key: str, window_ms: int):
        """Remove requests outside the current time window"""
        now = datetime.now()
        window_start = now - timedelta(milliseconds=window_ms)
        self.requests[key] = [
            req_time for req_time in self.requests[key]
            if req_time > window_start
        ]
    
    def check_rate_limit(self, key: str, max_requests: int, window_ms: int) -> bool:
        """Check if request is within rate limits"""
        self._clean_old_requests(key, window_ms)
        
        if len(self.requests[key]) >= max_requests:
            return False
            
        self.requests[key].append(datetime.now())
        return True

# Global rate limiter instance
rate_limiter = RateLimiter()

def rate_limit_middleware(request: Request) -> None:
    """Rate limiting middleware"""
    # Get provider from path or default to global limit
    path = request.url.path
    provider = None
    for p in ChatProvider:
        if p.value in path:
            provider = p
            break
    
    # Check global rate limit
    if not rate_limiter.check_rate_limit(
        'global',
        settings.RATE_LIMIT_MAX_REQUESTS,
        settings.RATE_LIMIT_WINDOW_MS
    ):
        raise HTTPException(
            status_code=429,
            detail="Global rate limit exceeded"
        )
    
    # Check provider-specific rate limit
    if provider and not rate_limiter.check_rate_limit(
        provider.value,
        settings.PROVIDER_RATE_LIMITS[provider],
        settings.RATE_LIMIT_WINDOW_MS
    ):
        raise HTTPException(
            status_code=429,
            detail=f"{provider.value.upper()} rate limit exceeded"
        )

class Timer:
    """Context manager for timing operations"""
    def __init__(self):
        self.start_time: Optional[float] = None
        self.end_time: Optional[float] = None

    def __enter__(self):
        self.start_time = time.time()
        return self

    def __exit__(self, *args):
        self.end_time = time.time()

    @property
    def duration(self) -> float:
        """Return duration in milliseconds"""
        if self.start_time and self.end_time:
            return (self.end_time - self.start_time) * 1000
        return 0

def log_chat_request(
    provider: str,
    messages: list,
    duration_ms: float,
    success: bool,
    error: Optional[Exception] = None
):
    """Log chat request details"""
    log_data = {
        "timestamp": datetime.now().isoformat(),
        "provider": provider,
        "message_count": len(messages),
        "duration_ms": duration_ms,
        "success": success
    }
    
    if error:
        log_data["error"] = {
            "type": type(error).__name__,
            "message": str(error)
        }
    
    logger.info("Chat Request", extra={"data": log_data})

def sanitize_response(response: str) -> str:
    """Sanitize response content"""
    # Remove any potential control characters
    return "".join(char for char in response if char.isprintable())
