"""Player state persistence (JSON file storage).

Saves and loads player state to/from JSON files in the saves/ directory.
"""
import json
from pathlib import Path
from typing import Any

from .player_state import PlayerState

# Default saves directory (relative to project root)
SAVES_DIR = Path(__file__).parent.parent.parent / "saves"


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
