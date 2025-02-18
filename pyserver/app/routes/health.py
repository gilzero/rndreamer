from fastapi import APIRouter, HTTPException
import time

router = APIRouter()

@router.get("/")
async def health_check():
    return {"status": "OK", "message": "System operational"}

@router.get("/{provider}")
async def provider_health_check(provider: str):
    start_time = time.time()
    if provider.lower() not in ["gpt", "claude", "gemini"]:
        raise HTTPException(status_code=400, detail=f"Invalid provider: {provider}")
    duration = time.time() - start_time
    return {"status": "OK", "provider": provider, "metrics": {"responseTime": duration}}