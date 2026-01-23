
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException

from src.api.routes import InvestigateRequest, investigate

TEST_CASE_ID = "test_case_persistence"
TEST_PLAYER_ID = "test_player_persistence"

@pytest.fixture
def mock_case_file_no_greathall():
    return {
        "id": TEST_CASE_ID,
        "title": "Test Case",
        "locations": [
            {"id": "entry_hall", "name": "Entry Hall", "description": "The entry hall."},
        ],
        "evidence": {},
        "witnesses": []
    }

@pytest.mark.asyncio
async def test_investigate_with_invalid_explicit_location(mock_case_file_no_greathall):
    """Test that requesting an invalid location (e.g. great_hall) fails currently, but should recover."""

    mock_case_data = mock_case_file_no_greathall

    with patch("src.api.routes.load_case", return_value=mock_case_data), \
         patch("src.api.routes.list_locations", return_value=mock_case_data["locations"]), \
         patch("src.api.routes.get_location", side_effect=lambda case, loc_id: next((l for l in mock_case_data["locations"] if l["id"] == loc_id), None) if next((l for l in mock_case_data["locations"] if l["id"] == loc_id), None) else (_ for _ in ()).throw(KeyError(loc_id))), \
         patch("src.api.routes.load_state", return_value=None), \
         patch("src.api.routes.save_player_state") as mock_save, \
         patch("src.api.routes.build_narrator_or_spell_prompt", return_value="Prompt"), \
         patch("src.api.routes.get_client") as mock_client, \
         patch("src.api.routes.detect_spell_with_fuzzy", return_value=(None, None)), \
         patch("src.api.routes.check_already_discovered", return_value=False), \
         patch("src.api.routes.extract_evidence_from_response", return_value=[]), \
         patch("src.api.routes.extract_flags_from_response", return_value=([], [])):

        mock_client.return_value.get_response = AsyncMock(return_value="Narrator response")

        # Request with EXPLICIT "great_hall" (which doesn't exist in mock)
        req = InvestigateRequest(
            player_input="look around",
            case_id=TEST_CASE_ID,
            player_id=TEST_PLAYER_ID,
            location_id="great_hall"
        )

        # FIX IMPLEMENTED: This should now SUCCEED and fallback to "entry_hall"

        try:
            response = await investigate(req)
            # If we get here, it succeeded!
            print("\nSuccessfully recovered from invalid location!")

            # Verify it fell back to "entry_hall" (first location in case)
            # We can't easily check the resolved location_id from response structure directly
            # without checking the mocks, but success is the main metric.

            # Check mock_save to see what state was saved
            assert mock_save.called
            saved_state = mock_save.call_args[0][2]
            assert saved_state.current_location == "entry_hall"

        except HTTPException as e:
            pytest.fail(f"Should NOT have raised HTTPException for invalid location, but got: {e.detail}")
