import time
import structlog
from prometheus_client import Counter, Histogram, Gauge, generate_latest
from fastapi import APIRouter, Request, Response
from pydantic import BaseModel

# Prometheus Metrics
ACTIVE_QUIZ_ROOMS = Gauge('active_quiz_rooms', 'Number of currently active quiz rooms')
AI_CALLS_TOTAL = Counter('ai_calls_total', 'Total number of AI generation calls')
AI_CALL_DURATION = Histogram('ai_call_duration_seconds', 'Time spent waiting for AI response')
WEBSOCKET_CONNECTIONS = Gauge('websocket_connections', 'Number of active WS connections')
API_REQUEST_DURATION = Histogram('api_request_duration_seconds', 'API Request duration in seconds', ['method', 'endpoint'])

# Structured Logging Config
structlog.configure(
    processors=[
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
)
logger = structlog.get_logger()

monitoring_router = APIRouter()

@monitoring_router.get("/health")
async def health_check():
    """Returns system health status for Docker/Load Balancer."""
    from database import engine
    from services.quiz_engine import redis_client
    from sqlalchemy import text
    
    db_status = "ok"
    redis_status = "ok"
    
    # Check DB
    try:
        if engine:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
        else:
            db_status = "error: engine not initialized"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    # Check Redis
    try:
        if redis_client:
            # We use the async client from quiz_engine
            import asyncio
            await asyncio.wait_for(redis_client.ping(), timeout=2.0)
        else:
            redis_status = "error: client not initialized"
    except Exception as e:
        redis_status = f"error: {str(e)}"
    
    ai_status = "ok" # Could add a check for Anthropic API here if needed
    
    overall_status = "healthy" if db_status == "ok" and redis_status == "ok" else "degraded"
    
    return {
        "status": overall_status,
        "db": db_status,
        "redis": redis_status,
        "ai": ai_status,
        "timestamp": time.time()
    }

@monitoring_router.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint."""
    return Response(generate_latest(), media_type="text/plain")

# Middleware for measuring request duration
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    
    # Exclude metrics endpoint from recording itself
    if request.url.path not in ["/metrics", "/health"]:
        API_REQUEST_DURATION.labels(
            method=request.method,
            endpoint=request.url.path
        ).observe(duration)
        
        # Safe client IP extraction — request.client can be None in some ASGI setups
        client_ip = request.client.host if request.client else "unknown"
        
        logger.info(
            "api_request",
            method=request.method,
            path=request.url.path,
            duration_ms=round(duration * 1000, 2),
            status=response.status_code,
            client_ip=client_ip
        )
        
    return response
