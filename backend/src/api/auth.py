"""HMAC-signed player tokens for anonymous session auth.

Token format: ``<player_id>.<hmac_sha256_hex>``.

Players never log in — instead the server mints a UUID + signed token on first
visit (`POST /api/session`). The token proves the client owns the player_id;
without it, requests can't read or mutate that player's saves.
"""

from __future__ import annotations

import hmac
import os
import uuid
from hashlib import sha256

_MIN_SECRET_LEN = 32


def _get_secret() -> bytes:
    """Return the configured HMAC secret as bytes. Raises if missing or weak."""
    secret = os.environ.get("PLAYER_TOKEN_SECRET", "")
    if len(secret) < _MIN_SECRET_LEN:
        raise RuntimeError(
            f"PLAYER_TOKEN_SECRET must be set and at least {_MIN_SECRET_LEN} chars. "
            "Generate one with: python -c 'import secrets;print(secrets.token_hex(32))'"
        )
    return secret.encode("utf-8")


def new_player_id() -> str:
    """Generate a fresh URL-safe player_id."""
    return uuid.uuid4().hex


def mint_token(player_id: str) -> str:
    """Mint a signed token for the given player_id."""
    sig = hmac.new(_get_secret(), player_id.encode("utf-8"), sha256).hexdigest()
    return f"{player_id}.{sig}"


def verify_token(token: str) -> str | None:
    """Verify a signed token. Returns player_id if valid, None otherwise."""
    if not token or "." not in token:
        return None
    try:
        player_id, sig = token.rsplit(".", 1)
    except ValueError:
        return None
    if not player_id or not sig:
        return None
    expected = hmac.new(_get_secret(), player_id.encode("utf-8"), sha256).hexdigest()
    if hmac.compare_digest(sig, expected):
        return player_id
    return None
