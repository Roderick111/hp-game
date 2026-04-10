"""Pytest configuration and fixtures."""

import json
import sys
from pathlib import Path
from typing import Any
import pytest

from src.state.player_state import PlayerState

# Add src to path for imports
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))


# In-memory store keyed by (player_id, case_id, slot)
_mem_store: dict[tuple[str, str, str], dict[str, Any]] = {}


def _normalize_slot(slot: str) -> str:
    return "autosave" if slot == "default" else slot


def _mock_save(
    case_id: str, player_id: str, state: PlayerState, slot: str = "default"
) -> bool:
    slot = _normalize_slot(slot)
    state_json = json.loads(json.dumps(state.model_dump(mode="json"), default=str))
    _mem_store[(player_id, case_id, slot)] = state_json
    return True


def _mock_load(
    case_id: str, player_id: str, slot: str = "default"
) -> PlayerState | None:
    slot = _normalize_slot(slot)
    data = _mem_store.get((player_id, case_id, slot))
    if data is None:
        return None
    return PlayerState(**data)


def _mock_delete(case_id: str, player_id: str, slot: str) -> bool:
    slot = _normalize_slot(slot)
    key = (player_id, case_id, slot)
    if key in _mem_store:
        del _mem_store[key]
        return True
    return False


def _mock_list(case_id: str, player_id: str) -> list[dict[str, Any]]:
    saves = []
    for (pid, cid, s), data in _mem_store.items():
        if pid == player_id and cid == case_id:
            saves.append({"slot": s, "case_id": cid, "timestamp": "test"})
    return saves


def _mock_get_metadata(
    case_id: str, player_id: str, slot: str
) -> dict[str, Any] | None:
    slot = _normalize_slot(slot)
    data = _mem_store.get((player_id, case_id, slot))
    if data is None:
        return None
    return {
        "slot": slot,
        "case_id": case_id,
        "timestamp": "test",
        "location": data.get("current_location", "unknown"),
        "evidence_count": len(data.get("discovered_evidence", [])),
        "witnesses_interrogated": 0,
        "progress_percent": 0,
        "version": data.get("version", "1.0.0"),
    }


def _mock_init_db() -> None:
    pass


@pytest.fixture(autouse=True)
def mock_persistence(monkeypatch: pytest.MonkeyPatch) -> None:
    """Replace PostgreSQL persistence with in-memory dict for all tests."""
    _mem_store.clear()

    # Patch at the source module
    monkeypatch.setattr("src.state.persistence.save_player_state", _mock_save)
    monkeypatch.setattr("src.state.persistence.load_player_state", _mock_load)
    monkeypatch.setattr("src.state.persistence.delete_player_save", _mock_delete)
    monkeypatch.setattr("src.state.persistence.list_player_saves", _mock_list)
    monkeypatch.setattr("src.state.persistence.get_save_metadata", _mock_get_metadata)
    monkeypatch.setattr("src.state.persistence.init_db", _mock_init_db)
    monkeypatch.setattr("src.state.persistence.save_state", lambda s, p: _mock_save(s.case_id, p, s))
    monkeypatch.setattr("src.state.persistence.load_state", lambda c, p: _mock_load(c, p))
    monkeypatch.setattr("src.state.persistence.delete_state", lambda c, p: _mock_delete(c, p, "autosave"))

    # Patch at import sites (Python binds references at import time)
    monkeypatch.setattr("src.api.helpers.save_player_state", _mock_save)
    monkeypatch.setattr("src.api.helpers.load_player_state", _mock_load)
    monkeypatch.setattr("src.api.routes.saves.load_player_state", _mock_load)
    monkeypatch.setattr("src.api.routes.saves.delete_player_save", _mock_delete)
    monkeypatch.setattr("src.api.routes.saves.list_player_saves", _mock_list)
    monkeypatch.setattr("src.api.routes.saves.save_player_state", _mock_save)
    monkeypatch.setattr("src.api.routes.saves.delete_state", lambda c, p: _mock_delete(c, p, "autosave"))
    monkeypatch.setattr("src.api.routes.saves.migrate_old_save", lambda c, p: False)


@pytest.fixture(autouse=True)
def disable_rate_limiting() -> None:
    """Disable rate limiting during tests to prevent 429 errors."""
    from src.api.rate_limit import limiter

    limiter.enabled = False
    yield
    limiter.enabled = True
