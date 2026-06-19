"""Anonymous session bootstrap endpoint.

Issues a signed player token. Public — no auth required. Frontend calls this on
first load (or whenever localStorage lacks a token) and stores the result.
"""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from src.api.auth import mint_token, new_player_id

router = APIRouter()


class SessionRequest(BaseModel):
    """Optional existing player_id to mint a token for (legacy migration)."""

    existing_player_id: str | None = Field(
        default=None,
        pattern=r"^[a-zA-Z0-9_-]+$",
        max_length=64,
        description="Pre-token player_id from localStorage — preserves existing saves.",
    )


class SessionResponse(BaseModel):
    player_id: str
    token: str


@router.post("/session", response_model=SessionResponse)
async def create_session(body: SessionRequest) -> SessionResponse:
    """Mint a signed token. Reuses ``existing_player_id`` when supplied."""
    player_id = body.existing_player_id or new_player_id()
    return SessionResponse(player_id=player_id, token=mint_token(player_id))
