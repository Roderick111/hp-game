"""Player state persistence (JSON file storage).

Saves and loads player state to/from JSON files in the saves/ directory.

Phase 5.3: Multi-slot save system
- Supports 4 slots: slot_1, slot_2, slot_3, autosave
- Backward compatible: "default" slot maps to old save format
- Safe save pattern: write to temp file, verify, atomic rename
"""

import json
import logging
import shutil
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from .player_state import PlayerState

logger = logging.getLogger(__name__)

# Default saves directory (relative to project root)
SAVES_DIR = Path(__file__).parent.parent.parent / "saves"

# Valid save slots
VALID_SLOTS = {"slot_1", "slot_2", "slot_3", "autosave", "default"}


def save_state(state: PlayerState, player_id: str, saves_dir: Path | None = None) -> Path:
    """Save player state to JSON file.

    Args:
        state: PlayerState instance to save
        player_id: Unique player identifier
        saves_dir: Optional custom saves directory (default: ./saves)

    Returns:
        Path to saved file
    """
    save_dir = saves_dir or SAVES_DIR
    save_dir.mkdir(parents=True, exist_ok=True)

    save_path = save_dir / f"{state.case_id}_{player_id}.json"

    with open(save_path, "w", encoding="utf-8") as f:
        json.dump(state.model_dump(mode="json"), f, indent=2, default=str)

    return save_path


def load_state(case_id: str, player_id: str, saves_dir: Path | None = None) -> PlayerState | None:
    """Load player state from JSON file.

    Args:
        case_id: Case identifier
        player_id: Unique player identifier
        saves_dir: Optional custom saves directory (default: ./saves)

    Returns:
        PlayerState instance if file exists, None otherwise
    """
    save_dir = saves_dir or SAVES_DIR
    save_path = save_dir / f"{case_id}_{player_id}.json"

    if not save_path.exists():
        return None

    with open(save_path, encoding="utf-8") as f:
        data: dict[str, Any] = json.load(f)

    return PlayerState(**data)


def delete_state(case_id: str, player_id: str, saves_dir: Path | None = None) -> bool:
    """Delete a saved state file.

    Args:
        case_id: Case identifier
        player_id: Unique player identifier
        saves_dir: Optional custom saves directory

    Returns:
        True if file was deleted, False if it didn't exist
    """
    save_dir = saves_dir or SAVES_DIR
    save_path = save_dir / f"{case_id}_{player_id}.json"

    if save_path.exists():
        save_path.unlink()
        return True

    return False


def list_saves(player_id: str | None = None, saves_dir: Path | None = None) -> list[str]:
    """List all save files.

    Args:
        player_id: Optional filter by player ID
        saves_dir: Optional custom saves directory

    Returns:
        List of save file stems (case_id_player_id format)
    """
    save_dir = saves_dir or SAVES_DIR

    if not save_dir.exists():
        return []

    saves = [p.stem for p in save_dir.glob("*.json")]

    if player_id:
        saves = [s for s in saves if s.endswith(f"_{player_id}")]

    return saves


# ============================================================================
# Phase 5.3: Multi-Slot Save System Functions
# ============================================================================


def _get_slot_save_path(
    case_id: str,
    player_id: str,
    slot: str,
    saves_dir: Path | None = None,
) -> Path:
    """Get path for slot-based save file.

    Args:
        case_id: Case identifier
        player_id: Player identifier
        slot: Save slot (slot_1, slot_2, slot_3, autosave, default)
        saves_dir: Optional custom saves directory

    Returns:
        Path to save file

    Note:
        "default" slot uses old format (case_id_player_id.json) for backward compatibility.
        Other slots use format: case_id_player_id_slot.json
    """
    save_dir = saves_dir or SAVES_DIR

    # Default slot uses old naming for backward compatibility
    if slot == "default":
        return save_dir / f"{case_id}_{player_id}.json"

    return save_dir / f"{case_id}_{player_id}_{slot}.json"


def save_player_state(
    case_id: str,
    player_id: str,
    state: PlayerState,
    slot: str = "default",
    saves_dir: Path | None = None,
) -> bool:
    """Save player state to specific slot with atomic write.

    Uses safe save pattern:
    1. Write to temp file
    2. Verify temp file is valid JSON
    3. Atomic rename to final path

    Args:
        case_id: Case identifier
        player_id: Player identifier
        state: PlayerState to save
        slot: Save slot (slot_1, slot_2, slot_3, autosave, default)
        saves_dir: Optional custom saves directory

    Returns:
        True if save succeeded, False otherwise

    Raises:
        ValueError: If slot is invalid
    """
    if slot not in VALID_SLOTS:
        raise ValueError(f"Invalid slot: {slot}. Must be one of {VALID_SLOTS}")

    save_dir = saves_dir or SAVES_DIR
    save_dir.mkdir(parents=True, exist_ok=True)

    save_path = _get_slot_save_path(case_id, player_id, slot, saves_dir)
    temp_path = save_path.with_suffix(".tmp")

    try:
        # Update last_saved timestamp
        state.last_saved = datetime.now(UTC)
        state.updated_at = datetime.now(UTC)

        # Write to temp file
        with open(temp_path, "w", encoding="utf-8") as f:
            json.dump(state.model_dump(mode="json"), f, indent=2, default=str)

        # Verify temp file is readable and valid
        with open(temp_path, encoding="utf-8") as f:
            verified = json.load(f)
            if not verified.get("state_id"):
                raise ValueError("Save verification failed: missing state_id")

        # Atomic rename (prevents corruption if crash during write)
        shutil.move(str(temp_path), str(save_path))

        logger.info(f"Saved to slot {slot}: {save_path}")
        return True

    except Exception as e:
        logger.error(f"Save failed for slot {slot}: {e}")
        # Clean up temp file if it exists
        if temp_path.exists():
            try:
                temp_path.unlink()
            except Exception:
                pass
        return False


def load_player_state(
    case_id: str,
    player_id: str,
    slot: str = "default",
    saves_dir: Path | None = None,
) -> PlayerState | None:
    """Load player state from specific slot.

    Args:
        case_id: Case identifier
        player_id: Player identifier
        slot: Save slot (slot_1, slot_2, slot_3, autosave, default)
        saves_dir: Optional custom saves directory

    Returns:
        PlayerState if found and valid, None if not found

    Raises:
        ValueError: If save file is corrupted or invalid slot
    """
    if slot not in VALID_SLOTS:
        raise ValueError(f"Invalid slot: {slot}. Must be one of {VALID_SLOTS}")

    save_path = _get_slot_save_path(case_id, player_id, slot, saves_dir)

    if not save_path.exists():
        return None

    try:
        with open(save_path, encoding="utf-8") as f:
            data: dict[str, Any] = json.load(f)

        # Validate required fields
        if not data.get("state_id") or not data.get("case_id"):
            raise ValueError(f"Corrupted save in slot {slot}: missing required fields")

        return PlayerState(**data)

    except json.JSONDecodeError as e:
        raise ValueError(f"Corrupted save in slot {slot}: invalid JSON - {e}")
    except Exception as e:
        if "Corrupted" in str(e):
            raise
        raise ValueError(f"Failed to load slot {slot}: {e}")


def delete_player_save(
    case_id: str,
    player_id: str,
    slot: str,
    saves_dir: Path | None = None,
) -> bool:
    """Delete specific save slot.

    Args:
        case_id: Case identifier
        player_id: Player identifier
        slot: Save slot to delete
        saves_dir: Optional custom saves directory

    Returns:
        True if deleted, False if not found
    """
    if slot not in VALID_SLOTS:
        return False

    save_path = _get_slot_save_path(case_id, player_id, slot, saves_dir)

    if save_path.exists():
        try:
            save_path.unlink()
            logger.info(f"Deleted save slot {slot}: {save_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete slot {slot}: {e}")
            return False

    return False


def get_save_metadata(
    case_id: str,
    player_id: str,
    slot: str,
    saves_dir: Path | None = None,
) -> dict[str, Any] | None:
    """Get metadata for a save slot (fast, doesn't load full state).

    Args:
        case_id: Case identifier
        player_id: Player identifier
        slot: Save slot
        saves_dir: Optional custom saves directory

    Returns:
        Dict with slot metadata or None if not found
    """
    save_path = _get_slot_save_path(case_id, player_id, slot, saves_dir)

    if not save_path.exists():
        return None

    try:
        with open(save_path, encoding="utf-8") as f:
            data: dict[str, Any] = json.load(f)

        # Calculate progress (evidence count / total evidence for case)
        # Note: Total evidence depends on case, using 15 as default for case_001
        evidence_count = len(data.get("discovered_evidence", []))
        total_evidence = 15  # Default for case_001
        progress_percent = min(100, int((evidence_count / total_evidence) * 100))

        # Count witnesses interrogated
        witness_states = data.get("witness_states", {})
        witnesses_interrogated = len(
            [ws for ws in witness_states.values() if ws.get("conversation_history")]
        )

        return {
            "slot": slot,
            "case_id": data.get("case_id", case_id),
            "timestamp": data.get("last_saved") or data.get("updated_at"),
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
    saves_dir: Path | None = None,
) -> list[dict[str, Any]]:
    """List all save slots with metadata for a player.

    Args:
        case_id: Case identifier
        player_id: Player identifier
        saves_dir: Optional custom saves directory

    Returns:
        List of slot metadata dicts, empty list if none found
    """
    saves: list[dict[str, Any]] = []

    # Check all valid slots (excluding default for new system)
    for slot in ["slot_1", "slot_2", "slot_3", "autosave"]:
        metadata = get_save_metadata(case_id, player_id, slot, saves_dir)
        if metadata:
            saves.append(metadata)

    return saves


def migrate_old_save(
    case_id: str,
    player_id: str,
    saves_dir: Path | None = None,
) -> bool:
    """Migrate old save format to autosave slot (one-time migration).

    Old format: case_id_player_id.json (no slot suffix)
    New format: case_id_player_id_autosave.json

    Args:
        case_id: Case identifier
        player_id: Player identifier
        saves_dir: Optional custom saves directory

    Returns:
        True if migration happened, False if no migration needed
    """
    save_dir = saves_dir or SAVES_DIR
    old_path = save_dir / f"{case_id}_{player_id}.json"
    new_path = save_dir / f"{case_id}_{player_id}_autosave.json"

    # Only migrate if old exists and new doesn't
    if old_path.exists() and not new_path.exists():
        try:
            # Copy (not move) to preserve backward compatibility
            shutil.copy2(str(old_path), str(new_path))
            logger.info(f"Migrated old save to autosave slot: {old_path} -> {new_path}")
            return True
        except Exception as e:
            logger.error(f"Migration failed: {e}")
            return False

    return False
