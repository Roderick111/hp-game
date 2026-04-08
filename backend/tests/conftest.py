"""Pytest configuration and fixtures."""

import sys
from pathlib import Path
from unittest.mock import MagicMock

import pytest

# Add src to path for imports
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))


@pytest.fixture(autouse=True)
def reset_db_connection(monkeypatch: pytest.MonkeyPatch) -> None:
    """Reset database connection for each test to avoid cross-test pollution."""
    # Mock the database connection instead of patching SAVES_DIR
    # since persistence now uses PostgreSQL
    monkeypatch.setattr("src.state.persistence._conn", None)
    monkeypatch.setattr("src.state.persistence._database_url", None)


@pytest.fixture(autouse=True)
def disable_rate_limiting() -> None:
    """Disable rate limiting during tests to prevent 429 errors."""
    from src.api.rate_limit import limiter

    limiter.enabled = False
    yield
    limiter.enabled = True
