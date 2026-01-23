
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.api.routes import InvestigateRequest, investigate


@pytest.mark.asyncio
async def test_initialization_without_greathall():
    # Mock case data that does NOT have great_hall
    mock_case_data = {
        "locations": [
            {"id": "entry_hall", "name": "Entry Hall", "description": "The entry hall."},
            {"id": "kitchen", "name": "Kitchen", "description": "The kitchen."}
        ],
        "evidence": {} # Added checks for evidence logic
    }

    # Mock dependencies
    with patch("src.api.routes.load_case", return_value=mock_case_data), \
         patch("src.api.routes.list_locations", return_value=mock_case_data["locations"]), \
         patch("src.api.routes.get_location", side_effect=lambda case, loc_id: next((l for l in mock_case_data["locations"] if l["id"] == loc_id), None)), \
         patch("src.api.routes.load_state", return_value=None), \
         patch("src.api.routes.save_player_state") as mock_save, \
         patch("src.api.routes.build_narrator_or_spell_prompt", return_value="Prompt"), \
         patch("src.api.routes.get_client") as mock_client, \
         patch("src.api.routes.detect_spell_with_fuzzy", return_value=(None, None)), \
         patch("src.api.routes.check_already_discovered", return_value=False), \
         patch("src.api.routes.extract_evidence_from_response", return_value=[]), \
         patch("src.api.routes.extract_flags_from_response", return_value=([], [])):

        # Setup AsyncMock for get_response
        mock_client_instance = MagicMock()
        mock_client_instance.get_response = AsyncMock(return_value="Narrator response")
        mock_client.return_value = mock_client_instance

        # Request with NO location specified
        req = InvestigateRequest(
            player_input="look around",
            case_id="case_test",
            location_id=None
        )

        try:
            response = await investigate(req)
        except Exception as e:
            pytest.fail(f"Investigate failed with error: {e}")

        assert mock_save.called
        saved_state = mock_save.call_args[0][2]

        print(f"Saved state current_location: {saved_state.current_location}")

        # It SHOULD be "entry_hall" (first location), NOT "great_hall"
        assert saved_state.current_location == "entry_hall"
        assert saved_state.current_location != "great_hall"
