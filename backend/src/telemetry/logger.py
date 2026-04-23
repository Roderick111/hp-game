"""Telemetry event logger — fire-and-forget JSONL appender."""

import json
import logging
import re
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# Write to /app/saves/telemetry in production (Docker volume-mounted),
# falls back to local telemetry/ dir for dev
_SAVES_DIR = Path("/app/saves")
TELEMETRY_DIR = (
    _SAVES_DIR / "telemetry"
    if _SAVES_DIR.exists()
    else Path(__file__).parent.parent.parent / "telemetry"
)


def _validate_identifier(value: str, name: str) -> None:
    """Validate identifier to prevent path traversal."""
    if not re.match(r"^[a-zA-Z0-9_-]+$", value):
        raise ValueError(f"Invalid {name} format: {value}")


def log_event(
    event_type: str,
    player_id: str,
    case_id: str,
    data: dict[str, Any] | None = None,
) -> None:
    """Append one event to today's JSONL file. Never raises."""
    try:
        _validate_identifier(player_id, "player_id")
        _validate_identifier(case_id, "case_id")

        TELEMETRY_DIR.mkdir(parents=True, exist_ok=True)

        today = datetime.now(UTC).strftime("%Y-%m-%d")
        filepath = TELEMETRY_DIR / f"{today}.jsonl"

        event = {
            "ts": datetime.now(UTC).isoformat(),
            "event": event_type,
            "player_id": player_id,
            "case_id": case_id,
            "data": data or {},
        }

        with open(filepath, "a", encoding="utf-8") as f:
            f.write(json.dumps(event) + "\n")

    except Exception as e:
        logger.warning(f"Telemetry write failed: {e}")
