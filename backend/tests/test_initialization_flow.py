
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.api.routes import InvestigateRequest, investigate

TEST_CASE_ID = "test_case_init"
TEST_PLAYER_ID = "test_player_init"

@pytest.fixture
def mock_case_file(tmp_path):
    """Create a temporary case file without 'great_hall'."""
    case_data = {
        "id": TEST_CASE_ID,
        "title": "Test Case",
        "difficulty": 1,
        "victim": {"id": "victim", "name": "Victim"},
        "locations": [
            {"id": "entry_hall", "name": "Entry Hall", "description": "The entry hall."},
            {"id": "kitchen", "name": "Kitchen", "description": "The kitchen."}
        ],
        "witnesses": [],
        "evidence": [],
        "timeline": [],
        "solution": {"whodunit": "nobody", "howdunit": "nothing", "whydunit": "none"},
        "post_verdict": {"success": "Win", "failure": "Lose"}
    }

    # We need to mock where the app looks for cases
    # For this test, we'll patch load_case instead of writing to the actual data dir
    return case_data

@pytest.mark.asyncio
async def test_initialization_flow_without_greathall(mock_case_file):
    """Test that a new game initializes with the first location when no default exists."""

    # Mock dependencies
    with patch("src.api.routes.load_case", return_value=mock_case_file), \
         patch("src.api.routes.list_locations", return_value=mock_case_file["locations"]), \
         patch("src.api.routes.get_location", side_effect=lambda case, loc_id: next((l for l in mock_case_file["locations"] if l["id"] == loc_id), None)), \
         patch("src.api.routes.load_state", return_value=None), \
         patch("src.api.routes.save_player_state") as mock_save, \
         patch("src.api.routes.build_narrator_or_spell_prompt", return_value="Prompt"), \
         patch("src.api.routes.get_client") as mock_client, \
         patch("src.api.routes.detect_spell_with_fuzzy", return_value=(None, None)), \
         patch("src.api.routes.check_already_discovered", return_value=False), \
         patch("src.api.routes.extract_evidence_from_response", return_value=[]), \
         patch("src.api.routes.extract_flags_from_response", return_value=([], [])):

        # Setup AsyncMock
        mock_client_instance = MagicMock()
        mock_client_instance.get_response = AsyncMock(return_value="Narrator response")
        mock_client.return_value = mock_client_instance

        # 1. Investigate request with NO location specified
        req = InvestigateRequest(
            player_input="start game",
            case_id=TEST_CASE_ID,
            player_id=TEST_PLAYER_ID,
            location_id=None
        )

        try:
            response = await investigate(req)
        except Exception as e:
            pytest.fail(f"Investigate failed with error: {e}")

        # 2. Verify save_player_state was called
        assert mock_save.called, "save_player_state should be called"

        # 3. Verify the saved state has the correct location
        # Args are: case_id, player_id, state
        saved_state = mock_save.call_args[0][2]

        print(f"Initialized location: {saved_state.current_location}")

        # Should default to "entry_hall" (first in list)
        assert saved_state.current_location == "entry_hall"

        # Should NOT be "great_hall" (which doesn't exist in our mock)
        assert saved_state.current_location != "great_hall"

@pytest.mark.asyncio
async def test_initialization_flow_with_explicit_location(mock_case_file):
    """Test that explicit location request is honored."""

    with patch("src.api.routes.load_case", return_value=mock_case_file), \
         patch("src.api.routes.list_locations", return_value=mock_case_file["locations"]), \
         patch("src.api.routes.get_location", side_effect=lambda case, loc_id: next((l for l in mock_case_file["locations"] if l["id"] == loc_id), None)), \
         patch("src.api.routes.load_state", return_value=None), \
         patch("src.api.routes.save_player_state") as mock_save, \
         patch("src.api.routes.build_narrator_or_spell_prompt", return_value="Prompt"), \
         patch("src.api.routes.get_client") as mock_client, \
         patch("src.api.routes.detect_spell_with_fuzzy", return_value=(None, None)), \
         patch("src.api.routes.check_already_discovered", return_value=False), \
         patch("src.api.routes.extract_evidence_from_response", return_value=[]), \
         patch("src.api.routes.extract_flags_from_response", return_value=([], [])):

        mock_client.return_value.get_response = AsyncMock(return_value="Response")

        req = InvestigateRequest(
            player_input="go to kitchen",
            case_id=TEST_CASE_ID,
            player_id=TEST_PLAYER_ID,
            location_id="kitchen"
        )

        await investigate(req)

        saved_state = mock_save.call_args[0][2]
        assert saved_state.current_location == "kitchen"

