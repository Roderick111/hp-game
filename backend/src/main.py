"""FastAPI backend for HP Investigation Game.

Phase 1: Core Investigation Loop
- Freeform input -> LLM narrator -> Evidence discovery
"""

import logging

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from src.api.rate_limit import limiter
from src.api.routes import router

# Configure logging for debug output
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

app = FastAPI(
    title="HP Game Backend",
    description="Investigation game with Claude LLM narrator",
    version="0.4.0",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Max request body size: 8 KB (chat messages, verdicts, etc.)
MAX_BODY_SIZE = 8 * 1024


@app.middleware("http")
async def limit_request_body(request: Request, call_next) -> Response:
    """Reject requests with body larger than MAX_BODY_SIZE."""
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_BODY_SIZE:
        return JSONResponse(
            status_code=413,
            content={"detail": "Request body too large"},
        )
    return await call_next(request)


# CORS for local dev (frontend on different port)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router)


@app.get("/health")
async def health() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok"}


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint."""
    return {
        "message": "HP Investigation Game API",
        "docs": "/docs",
        "health": "/health",
    }
