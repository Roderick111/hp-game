"""Rate limiting configuration."""

from slowapi import Limiter
from starlette.requests import Request


def _rate_limit_key(request: Request) -> str:
    """Key by authenticated player_id when available, else X-Forwarded-For, else remote IP."""
    player_id = getattr(request.state, "player_id", None)
    if player_id:
        return f"player:{player_id}"
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


limiter = Limiter(key_func=_rate_limit_key)

LLM_RATE = "10/minute"
VERIFY_KEY_RATE = "5/minute"
STANDARD_RATE = "100/minute"
