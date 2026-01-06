"""Pytest configuration and fixtures."""
import sys
from pathlib import Path

import pytest

# Add src to path for imports
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))


@pytest.fixture(autouse=True)
def reset_saves_dir(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """Reset saves directory for each test to avoid cross-test pollution."""
    # Create temp saves directory
    saves_dir = tmp_path / "saves"
    saves_dir.mkdir(exist_ok=True)

    # Patch the SAVES_DIR in persistence module
    monkeypatch.setattr("src.state.persistence.SAVES_DIR", saves_dir)
