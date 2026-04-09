"""FastAPI backend for HP Investigation Game.

Phase 1: Core Investigation Loop
- Freeform input -> LLM narrator -> Evidence discovery
"""

import logging
import os

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, Request, Response  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from fastapi.responses import JSONResponse  # noqa: E402
from slowapi import _rate_limit_exceeded_handler  # noqa: E402
from slowapi.errors import RateLimitExceeded  # noqa: E402

from src.api.rate_limit import limiter  # noqa: E402
from src.api.routes import router  # noqa: E402
from src.config.llm_settings import get_llm_settings  # noqa: E402
from src.state.persistence import init_db  # noqa: E402
from src.telemetry.logger import log_event  # noqa: E402

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


# CORS — env-based origins for production, localhost defaults for dev
_cors_env = os.getenv("CORS_ORIGINS", "")
_cors_origins = [o.strip() for o in _cors_env.split(",") if o.strip()] if _cors_env else [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database (creates table if not exists)
init_db()

# Log active LLM config on startup
_llm = get_llm_settings()
logger = logging.getLogger(__name__)
logger.info(
    "LLM config: model=%s, fallback=%s, provider=%s",
    _llm.DEFAULT_MODEL,
    _llm.FALLBACK_MODEL,
    _llm.DEFAULT_LLM_PROVIDER.value,
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Log unhandled exceptions to telemetry before returning 500."""
    log_event(
        "server_error",
        "unknown",
        "unknown",
        {
            "path": str(request.url.path),
            "error": str(exc)[:200],
        },
    )
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


# Include API routes
app.include_router(router)


@app.get("/health")
async def health() -> dict[str, str | bool]:
    """Health check endpoint with DB connectivity verification."""
    from src.state.persistence import _get_conn

    db_ok = False
    try:
        conn = _get_conn()
        conn.execute("SELECT 1")
        db_ok = True
    except Exception:
        pass
    return {"status": "ok" if db_ok else "degraded", "db": db_ok}


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint."""
    return {
        "message": "HP Investigation Game API",
        "docs": "/docs",
        "health": "/health",
    }
