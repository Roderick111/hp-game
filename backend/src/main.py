"""FastAPI backend for HP Investigation Game.

Phase 1: Core Investigation Loop
- Freeform input -> LLM narrator -> Evidence discovery
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.routes import router

app = FastAPI(
    title="HP Game Backend",
    description="Investigation game with Claude LLM narrator",
    version="0.4.0",
)

# CORS for local dev (frontend on different port)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite + common dev ports
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
