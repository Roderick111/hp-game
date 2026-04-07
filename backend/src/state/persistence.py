"""Player state persistence (PostgreSQL storage via Neon).

Saves and loads player state to/from a PostgreSQL database.

Phase 5.3: Multi-slot save system
- Supports 4 slots: slot_1, slot_2, slot_3, autosave
- Backward compatible: "default" slot maps to autosave
- JSON state stored in JSONB column for queryability
"""

import json
import logging
import os
import re
from datetime import UTC, datetime
from typing import Any

import psycopg

from .player_state import PlayerState

logger = logging.getLogger(__name__)

# Valid save slots
VALID_SLOTS = {"slot_1", "slot_2", "slot_3", "autosave", "default"}

# Cached connection (reused across requests)
_conn: psycopg.Connection[tuple[Any, ...]] | None = None
_database_url: str | None = None


def _get_conn() -> psycopg.Connection[tuple[Any, ...]]:
    """Get or create a reusable database connection."""
    global _conn, _database_url
    if _database_url is None:
        _database_url = os.environ.get("DATABASE_URL", "")
        if not _database_url:
            raise RuntimeError("DATABASE_URL not set in environment")

    if _conn is None or _conn.closed:
        _conn = psycopg.connect(_database_url, autocommit=True)

    return _conn


def init_db() -> None:
    """Create saves table if it doesn't exist."""
    conn = _get_conn()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS saves (
            player_id TEXT NOT NULL,
            case_id TEXT NOT NULL,
            slot TEXT NOT NULL,
            state JSONB NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (player_id, case_id, slot)
        )
    """)
    logger.info("Database initialized: saves table ready")


def _validate_identifier(value: str, name: str) -> None:
    """Validate case_id/player_id to prevent injection.

    Args:
        value: The identifier to validate
        name: Parameter name for error message

    Raises:
        ValueError: If identifier contains invalid characters
    """
    if not re.match(r"^[a-zA-Z0-9_-]+$", value):
        raise ValueError(f"Invalid {name} format: {value}")


def _normalize_slot(slot: str) -> str:
    """Normalize slot name. 'default' maps to 'autosave'."""
    return "autosave" if slot == "default" else slot


# ============================================================================
# Core CRUD functions (same signatures as before)
# ============================================================================


def save_player_state(
    case_id: str,
    player_id: str,
    state: PlayerState,
    slot: str = "default",
    saves_dir: Any = None,  # Ignored, kept for backward compat
) -> bool:
    """Save player state to specific slot.

    Args:
        case_id: Case identifier
        player_id: Player identifier
        state: PlayerState to save
        slot: Save slot (slot_1, slot_2, slot_3, autosave, default)

    Returns:
        True if save succeeded, False otherwise
    """
    if slot not in VALID_SLOTS:
        raise ValueError(f"Invalid slot: {slot}. Must be one of {VALID_SLOTS}")

    _validate_identifier(case_id, "case_id")
    _validate_identifier(player_id, "player_id")

    slot = _normalize_slot(slot)

    try:
        state.last_saved = datetime.now(UTC)
        state.updated_at = datetime.now(UTC)

        state_json = json.loads(json.dumps(state.model_dump(mode="json"), default=str))

        conn = _get_conn()
        conn.execute(
            """
            INSERT INTO saves (player_id, case_id, slot, state, updated_at)
            VALUES (%s, %s, %s, %s::jsonb, NOW())
            ON CONFLICT (player_id, case_id, slot)
            DO UPDATE SET state = EXCLUDED.state, updated_at = NOW()
            """,
            (player_id, case_id, slot, json.dumps(state_json)),
        )

        logger.info(f"Saved state: player={player_id}, case={case_id}, slot={slot}")
        return True

    except Exception as e:
        logger.error(f"Save failed: {e}")
        return False


def load_player_state(
    case_id: str,
    player_id: str,
    slot: str = "default",
    saves_dir: Any = None,  # Ignored, kept for backward compat
) -> PlayerState | None:
    """Load player state from specific slot.

    Args:
        case_id: Case identifier
        player_id: Player identifier
        slot: Save slot (slot_1, slot_2, slot_3, autosave, default)

    Returns:
        PlayerState if found, None if not found
    """
    if slot not in VALID_SLOTS:
        raise ValueError(f"Invalid slot: {slot}. Must be one of {VALID_SLOTS}")

    _validate_identifier(case_id, "case_id")
    _validate_identifier(player_id, "player_id")

    slot = _normalize_slot(slot)

    try:
        conn = _get_conn()
        row = conn.execute(
            "SELECT state FROM saves WHERE player_id = %s AND case_id = %s AND slot = %s",
            (player_id, case_id, slot),
        ).fetchone()

        if row is None:
            return None

        data: dict[str, Any] = row[0] if isinstance(row[0], dict) else json.loads(row[0])

        if not data.get("state_id") or not data.get("case_id"):
            raise ValueError(f"Corrupted save in slot {slot}: missing required fields")

        return PlayerState(**data)

    except ValueError:
        raise
    except Exception as e:
        logger.error(f"Load failed: {e}")
        return None


def delete_player_save(
    case_id: str,
    player_id: str,
    slot: str,
    saves_dir: Any = None,
) -> bool:
    """Delete specific save slot.

    Returns:
        True if deleted, False if not found
    """
    if slot not in VALID_SLOTS:
        return False

    slot = _normalize_slot(slot)

    try:
        conn = _get_conn()
        result = conn.execute(
            "DELETE FROM saves WHERE player_id = %s AND case_id = %s AND slot = %s",
            (player_id, case_id, slot),
        )
        return (result.rowcount or 0) > 0
    except Exception as e:
        logger.error(f"Delete failed: {e}")
        return False


def get_save_metadata(
    case_id: str,
    player_id: str,
    slot: str,
    saves_dir: Any = None,
) -> dict[str, Any] | None:
    """Get metadata for a save slot (loads state from DB)."""
    slot_normalized = _normalize_slot(slot)

    try:
        conn = _get_conn()
        row = conn.execute(
            "SELECT state, updated_at FROM saves WHERE player_id = %s AND case_id = %s AND slot = %s",
            (player_id, case_id, slot_normalized),
        ).fetchone()

        if row is None:
            return None

        data: dict[str, Any] = row[0] if isinstance(row[0], dict) else json.loads(row[0])

        evidence_count = len(data.get("discovered_evidence", []))
        total_evidence = 15
        progress_percent = min(100, int((evidence_count / total_evidence) * 100))

        witness_states = data.get("witness_states", {})
        witnesses_interrogated = len(
            [ws for ws in witness_states.values() if ws.get("conversation_history")]
        )

        return {
            "slot": slot,
            "case_id": data.get("case_id", case_id),
            "timestamp": data.get("last_saved") or str(row[1]),
            "location": data.get("current_location", "unknown"),
            "evidence_count": evidence_count,
            "witnesses_interrogated": witnesses_interrogated,
            "progress_percent": progress_percent,
            "version": data.get("version", "1.0.0"),
        }

    except Exception as e:
        logger.warning(f"Failed to read metadata for slot {slot}: {e}")
        return None


def list_player_saves(
    case_id: str,
    player_id: str,
    saves_dir: Any = None,
) -> list[dict[str, Any]]:
    """List all save slots with metadata for a player."""
    saves: list[dict[str, Any]] = []

    for slot in ["slot_1", "slot_2", "slot_3", "autosave"]:
        metadata = get_save_metadata(case_id, player_id, slot)
        if metadata:
            saves.append(metadata)

    return saves


# ============================================================================
# Legacy functions (kept for backward compat, delegate to slot-based)
# ============================================================================


def save_state(state: PlayerState, player_id: str, saves_dir: Any = None) -> bool:
    """Legacy save — delegates to save_player_state with autosave slot."""
    return save_player_state(state.case_id, player_id, state, "autosave")


def load_state(case_id: str, player_id: str, saves_dir: Any = None) -> PlayerState | None:
    """Legacy load — delegates to load_player_state with autosave slot."""
    return load_player_state(case_id, player_id, "autosave")


def delete_state(case_id: str, player_id: str, saves_dir: Any = None) -> bool:
    """Legacy delete — delegates to delete_player_save with autosave slot."""
    return delete_player_save(case_id, player_id, "autosave")


def list_saves(player_id: str | None = None, saves_dir: Any = None) -> list[str]:
    """Legacy list — returns empty (not used in new system)."""
    return []


def migrate_old_save(
    case_id: str,
    player_id: str,
    saves_dir: Any = None,
) -> bool:
    """No-op for DB backend. Migration not needed."""
    return False
