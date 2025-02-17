"""
File Overview:
This module contains utility functions and classes for the AI Chat API application.
It includes rate limiting mechanisms, logging utilities, and response sanitization methods.

File Path:
pyserver/app/utils.py
"""
import logging
import time
from typing import Dict, Optional, Any
from fastapi import HTTPException, Request
from collections import defaultdict
from datetime import datetime, timedelta
import json
from app.config import settings, ChatProvider
import logging.config
from pythonjsonlogger import jsonlogger
import os  # Import os


class RateLimiter:
    """Implements a simple rate limiting mechanism using a sliding window approach."""

    def __init__(self):
        self.requests: Dict[str, list] = defaultdict(list)

    def _clean_old_requests(self, key: str, window_ms: int):
        """
        Remove requests that are outside the current time window.
        """
        now = datetime.now()
        window_start = now - timedelta(milliseconds=window_ms)
        self.requests[key] = [
            req_time for req_time in self.requests[key]
            if req_time > window_start
        ]

    def check_rate_limit(self, key: str, max_requests: int, window_ms: int) -> bool:
        """
        Check if a request is within the rate limits.
        """
        self._clean_old_requests(key, window_ms)

        if len(self.requests[key]) >= max_requests:
            return False

        self.requests[key].append(datetime.now())
        return True

    def get_remaining_requests(self, key: str) -> int:
        """
        Get the number of remaining requests allowed in the current window.
        """
        # Use the configured window size for the given key
        if key == 'global':
          window_ms = settings.RATE_LIMIT_WINDOW_MS
          max_requests = settings.RATE_LIMIT_MAX_REQUESTS
        else: # Assumed to be a provider
          window_ms = settings.RATE_LIMIT_WINDOW_MS
          max_requests = settings.PROVIDER_RATE_LIMITS.get(ChatProvider(key), settings.RATE_LIMIT_MAX_REQUESTS)  # Default to global limit if provider not found


        self._clean_old_requests(key, window_ms)
        return max_requests - len(self.requests[key])

    def get_reset_time(self, key: str) -> int:
        """
        Get the time in seconds until the rate limit window resets.
        """
        # Use the configured window size for the given key
        if key == 'global':
            window_ms = settings.RATE_LIMIT_WINDOW_MS
        else:
            window_ms = settings.RATE_LIMIT_WINDOW_MS

        if not self.requests[key]:
            return 0

        oldest_request = min(self.requests[key])
        reset_time = oldest_request + timedelta(milliseconds=window_ms)
        return int((reset_time - datetime.now()).total_seconds())

# Global rate limiter instance
rate_limiter = RateLimiter()

# Rate limiting middleware (Not used directly, but kept for potential future use)
def rate_limit_middleware(request: Request) -> None:
    """
    Middleware function for rate limiting.  (Currently unused, replaced by middleware in main.py)
    """
    # ... (This function is no longer used, but I've left it here in case
    # you want to use a separate middleware function in the future. The logic
    # is now correctly implemented in the middleware within main.py)
    pass

class Timer:
    """Context manager for timing operations."""

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
        """Calculate the duration of the timed operation in milliseconds."""
        if self.start_time and self.end_time:
            return (self.end_time - self.start_time) * 1000
        return 0

def log_chat_request(
    provider: str,
    messages: list,
    duration_ms: float,
    success: bool,
    error: Optional[Exception] = None,
    model: str = ""
):
    """Log details of a chat request."""
    log_data = {
        "provider": provider,
        "message_count": len(messages),
        "success": success,
        "response_time_ms": duration_ms,
        "model": model
    }

    if error:
        log_data["error"] = {
            "type": type(error).__name__,
            "message": str(error)
        }
    if success:
      logger.info(json.dumps(log_data))
    else:
      logger.error(json.dumps(log_data))

def sanitize_response(response: str) -> str:
    """Sanitize response content by removing non-printable characters."""
    return "".join(char for char in response if char.isprintable())

def setup_logging(log_level: str = "INFO", log_file_path: str = "logs/app.log"):
    """Configure structured logging with log rotation."""
    # Ensure log level is uppercase
    log_level = log_level.upper()

    # Create the logs directory if it doesn't exist
    log_dir = os.path.dirname(log_file_path)
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)

    logging_config = {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'json': {
                '()': 'pythonjsonlogger.jsonlogger.JsonFormatter',
                'format': '%(asctime)s %(name)s %(levelname)s %(message)s',  # Keep as strings
                 'datefmt': '%Y-%m-%d %H:%M:%S'
            }
        },
        'handlers': {
            'rotating_file': {
                'class': 'logging.handlers.RotatingFileHandler',
                'filename': log_file_path,
                'maxBytes': 10485760,  # 10MB
                'backupCount': 5,
                'formatter': 'json',
                'level': log_level, # Apply level here
            },
             'console': {  # Add a console handler
                'class': 'logging.StreamHandler',
                'formatter': 'json',
                'level': log_level,
            }
        },
        'root': {
            'handlers': ['rotating_file', 'console'], # Use both handlers
            'level': log_level,

        }
    }
    logging.config.dictConfig(logging_config)
    global logger # Reassign logger after config
    logger = logging.getLogger(__name__)

# Call setup_logging() to initialize the logger, using settings from config.py

setup_logging(log_level=settings.LOG_LEVEL, log_file_path=settings.LOG_FILE_PATH) # Use settings