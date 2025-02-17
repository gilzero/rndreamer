"""
File Overview:
This module is the entry point for running the FastAPI application.
It sets up the server configuration and starts the FastAPI application.

File Path:
pyserver/run.py
"""
import uvicorn
from app.config import settings
import os

# Use settings for server configuration
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
    )
