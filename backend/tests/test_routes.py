"""Tests for API routes."""
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from src.main import app


@pytest.fixture
def temp_saves_dir(tmp_path: Path) -> Path:
    """Create temporary saves directory."""
    saves_dir = tmp_path / "saves"
    saves_dir.mkdir()
    return saves_dir


@pytest.fixture
async def client() -> AsyncClient:
    """Create async test client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


class TestHealthEndpoint:
    """Tests for health check endpoint."""

    @pytest.mark.asyncio
    async def test_health_check(self, client: AsyncClient) -> None:
        """Health endpoint returns ok."""
        response = await client.get("/health")

        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


class TestRootEndpoint:
    """Tests for root endpoint."""

    @pytest.mark.asyncio
    async def test_root_returns_info(self, client: AsyncClient) -> None:
        """Root endpoint returns API info."""
        response = await client.get("/")

        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "docs" in data


class TestCasesEndpoint:
    """Tests for cases listing endpoint."""

    @pytest.mark.asyncio
    async def test_list_cases(self, client: AsyncClient) -> None:
        """List available cases."""
        response = await client.get("/api/cases")

        assert response.status_code == 200
        data = response.json()
        assert "cases" in data
        assert "case_001" in data["cases"]


class TestLocationEndpoint:
    """Tests for location info endpoint."""

    @pytest.mark.asyncio
    async def test_get_location_info(self, client: AsyncClient) -> None:
        """Get location information."""
        response = await client.get("/api/case/case_001/location/library")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "library"
        assert "Hogwarts Library" in data["name"]
        assert "description" in data
        assert "surface_elements" in data

    @pytest.mark.asyncio
    async def test_get_location_includes_witnesses_present(self, client: AsyncClient) -> None:
        """Location info includes witnesses_present field."""
        response = await client.get("/api/case/case_001/location/library")

        assert response.status_code == 200
        data = response.json()
        assert "witnesses_present" in data
        assert isinstance(data["witnesses_present"], list)
        assert "hermione" in data["witnesses_present"]

    @pytest.mark.asyncio
    async def test_get_location_not_found(self, client: AsyncClient) -> None:
        """404 for nonexistent location."""
        response = await client.get("/api/case/case_001/location/nonexistent")

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_case_not_found(self, client: AsyncClient) -> None:
        """404 for nonexistent case."""
        response = await client.get("/api/case/fake_case/location/library")

        assert response.status_code == 404


class TestEvidenceEndpoint:
    """Tests for evidence listing endpoint."""

    @pytest.mark.asyncio
    async def test_get_evidence_empty(self, client: AsyncClient) -> None:
        """Evidence list empty for new player."""
        response = await client.get(
            "/api/evidence",
            params={"case_id": "case_001", "player_id": "test_player_unique"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["case_id"] == "case_001"
        assert data["discovered_evidence"] == []


class TestEvidenceDetailEndpoint:
    """Tests for evidence detail endpoints."""

    @pytest.mark.asyncio
    async def test_get_evidence_details_empty(self, client: AsyncClient) -> None:
        """Evidence details empty for new player."""
        response = await client.get(
            "/api/evidence/details",
            params={"case_id": "case_001", "player_id": "test_evidence_detail_unique"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["case_id"] == "case_001"
        assert data["evidence"] == []

    @pytest.mark.asyncio
    async def test_get_evidence_details_with_discovered(self, client: AsyncClient) -> None:
        """Evidence details returns metadata for discovered evidence."""
        # Save state with discovered evidence
        state_data = {
            "case_id": "case_001",
            "current_location": "library",
            "discovered_evidence": ["hidden_note", "frost_pattern"],
            "visited_locations": ["library"],
        }
        await client.post(
            "/api/save",
            json={"player_id": "test_evidence_detail_player", "state": state_data},
        )

        # Get evidence details
        response = await client.get(
            "/api/evidence/details",
            params={
                "case_id": "case_001",
                "location_id": "library",
                "player_id": "test_evidence_detail_player",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["evidence"]) == 2

        # Check evidence has metadata
        evidence_ids = [e["id"] for e in data["evidence"]]
        assert "hidden_note" in evidence_ids
        assert "frost_pattern" in evidence_ids

        hidden_note = next(e for e in data["evidence"] if e["id"] == "hidden_note")
        assert hidden_note["name"] == "Threatening Note"
        assert hidden_note["location_found"] == "library"
        assert "description" in hidden_note
        assert hidden_note["type"] == "physical"

    @pytest.mark.asyncio
    async def test_get_single_evidence_success(self, client: AsyncClient) -> None:
        """Get single evidence with metadata."""
        # Save state with discovered evidence
        state_data = {
            "case_id": "case_001",
            "current_location": "library",
            "discovered_evidence": ["frost_pattern"],
            "visited_locations": ["library"],
        }
        await client.post(
            "/api/save",
            json={"player_id": "test_single_evidence_player", "state": state_data},
        )

        # Get single evidence
        response = await client.get(
            "/api/evidence/frost_pattern",
            params={
                "case_id": "case_001",
                "location_id": "library",
                "player_id": "test_single_evidence_player",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "frost_pattern"
        assert data["name"] == "Unnatural Frost Pattern"
        assert data["location_found"] == "library"
        assert data["type"] == "magical"
        assert "spiral" in data["description"].lower()

    @pytest.mark.asyncio
    async def test_get_single_evidence_not_discovered(self, client: AsyncClient) -> None:
        """404 for evidence not yet discovered."""
        response = await client.get(
            "/api/evidence/hidden_note",
            params={
                "case_id": "case_001",
                "location_id": "library",
                "player_id": "test_not_discovered_unique",
            },
        )

        assert response.status_code == 404
        assert "not discovered" in response.json()["detail"]


class TestLoadEndpoint:
    """Tests for state loading endpoint."""

    @pytest.mark.asyncio
    async def test_load_no_state(self, client: AsyncClient) -> None:
        """Load returns null for no saved state."""
        response = await client.get(
            "/api/load/case_001",
            params={"player_id": "nonexistent_player"},
        )

        assert response.status_code == 200
        assert response.json() is None


class TestSaveEndpoint:
    """Tests for state saving endpoint."""

    @pytest.mark.asyncio
    async def test_save_state(self, client: AsyncClient) -> None:
        """Save player state."""
        state_data = {
            "case_id": "case_001",
            "current_location": "library",
            "discovered_evidence": ["hidden_note"],
            "visited_locations": ["library"],
        }

        response = await client.post(
            "/api/save",
            json={
                "player_id": "test_save_player",
                "state": state_data,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True


class TestInvestigateEndpoint:
    """Tests for investigate endpoint."""

    @pytest.fixture
    def mock_claude_response(self) -> str:
        """Mock Claude response."""
        return "You peer beneath the heavy oak desk and discover a crumpled parchment. [EVIDENCE: hidden_note] The note bears hurried writing."

    @pytest.mark.asyncio
    async def test_investigate_success(
        self, client: AsyncClient, mock_claude_response: str
    ) -> None:
        """Successful investigation with mocked LLM."""
        with patch("src.api.routes.get_client") as mock_get_client:
            mock_client = AsyncMock()
            mock_client.get_response = AsyncMock(return_value=mock_claude_response)
            mock_get_client.return_value = mock_client

            response = await client.post(
                "/api/investigate",
                json={
                    "player_input": "I search under the desk",
                    "case_id": "case_001",
                    "location_id": "library",
                    "player_id": "test_investigate_player",
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert "narrator_response" in data
        assert data["narrator_response"] == mock_claude_response

    @pytest.mark.asyncio
    async def test_investigate_finds_evidence(
        self, client: AsyncClient, mock_claude_response: str
    ) -> None:
        """Investigation discovers evidence via trigger match."""
        with patch("src.api.routes.get_client") as mock_get_client:
            mock_client = AsyncMock()
            mock_client.get_response = AsyncMock(return_value=mock_claude_response)
            mock_get_client.return_value = mock_client

            response = await client.post(
                "/api/investigate",
                json={
                    "player_input": "look under the desk",
                    "case_id": "case_001",
                    "location_id": "library",
                    "player_id": "test_evidence_player",
                },
            )

        assert response.status_code == 200
        data = response.json()
        # Either trigger-matched or extracted from response
        assert "hidden_note" in data["new_evidence"]

    @pytest.mark.asyncio
    async def test_investigate_not_present_item(self, client: AsyncClient) -> None:
        """Investigation about not_present item returns predefined response."""
        response = await client.post(
            "/api/investigate",
            json={
                "player_input": "Is there a secret passage?",
                "case_id": "case_001",
                "location_id": "library",
                "player_id": "test_not_present_player",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "solid stone" in data["narrator_response"]
        assert data["new_evidence"] == []

    @pytest.mark.asyncio
    async def test_investigate_case_not_found(self, client: AsyncClient) -> None:
        """404 for nonexistent case."""
        response = await client.post(
            "/api/investigate",
            json={
                "player_input": "look around",
                "case_id": "nonexistent_case",
                "location_id": "library",
                "player_id": "test_player",
            },
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_investigate_location_not_found(self, client: AsyncClient) -> None:
        """404 for nonexistent location."""
        response = await client.post(
            "/api/investigate",
            json={
                "player_input": "look around",
                "case_id": "case_001",
                "location_id": "nonexistent_location",
                "player_id": "test_player",
            },
        )

        assert response.status_code == 404


class TestDeleteStateEndpoint:
    """Tests for delete state endpoint."""

    @pytest.mark.asyncio
    async def test_delete_nonexistent_state(self, client: AsyncClient) -> None:
        """Delete returns false for nonexistent state."""
        response = await client.delete(
            "/api/state/case_001",
            params={"player_id": "nonexistent_player"},
        )

        assert response.status_code == 200
        assert response.json() == {"deleted": False}


class TestResetCaseEndpoint:
    """Tests for reset case endpoint."""

    @pytest.mark.asyncio
    async def test_reset_endpoint_deletes_state(self, client: AsyncClient) -> None:
        """Reset endpoint deletes saved state."""
        player_id = "test_reset_deletes"

        # Create state by submitting a verdict
        await client.post(
            "/api/submit-verdict",
            json={
                "accused_suspect_id": "draco",
                "reasoning": "Test.",
                "evidence_cited": [],
                "case_id": "case_001",
                "player_id": player_id,
            },
        )

        # Reset
        response = await client.post(
            "/api/case/case_001/reset",
            params={"player_id": player_id},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "reset" in data["message"].lower()

        # Verify state was deleted - load returns null for missing state
        load_response = await client.get(
            "/api/load/case_001",
            params={"player_id": player_id},
        )
        assert load_response.status_code == 200
        # Should return null (None) since state was deleted
        state_data = load_response.json()
        assert state_data is None

    @pytest.mark.asyncio
    async def test_reset_endpoint_nonexistent_file(self, client: AsyncClient) -> None:
        """Reset endpoint handles missing file gracefully."""
        response = await client.post(
            "/api/case/case_999/reset",
            params={"player_id": "nonexistent_player_999"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert "no saved progress" in data["message"].lower()


# Phase 2: Witness interrogation tests


class TestWitnessesEndpoint:
    """Tests for witnesses listing endpoint."""

    @pytest.mark.asyncio
    async def test_list_witnesses(self, client: AsyncClient) -> None:
        """List available witnesses."""
        response = await client.get(
            "/api/witnesses",
            params={"case_id": "case_001"},
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

        witness_ids = [w["id"] for w in data]
        assert "hermione" in witness_ids
        assert "draco" in witness_ids

    @pytest.mark.asyncio
    async def test_list_witnesses_includes_trust(self, client: AsyncClient) -> None:
        """Witnesses include trust levels."""
        response = await client.get(
            "/api/witnesses",
            params={"case_id": "case_001"},
        )

        assert response.status_code == 200
        data = response.json()

        hermione = next(w for w in data if w["id"] == "hermione")
        draco = next(w for w in data if w["id"] == "draco")

        assert hermione["trust"] == 50  # base_trust
        assert draco["trust"] == 20  # base_trust


class TestWitnessInfoEndpoint:
    """Tests for single witness info endpoint."""

    @pytest.mark.asyncio
    async def test_get_witness_info(self, client: AsyncClient) -> None:
        """Get witness information."""
        response = await client.get(
            "/api/witness/hermione",
            params={"case_id": "case_001"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "hermione"
        assert data["name"] == "Hermione Granger"
        assert data["trust"] == 50

    @pytest.mark.asyncio
    async def test_get_witness_not_found(self, client: AsyncClient) -> None:
        """404 for nonexistent witness."""
        response = await client.get(
            "/api/witness/voldemort",
            params={"case_id": "case_001"},
        )

        assert response.status_code == 404


class TestInterrogateEndpoint:
    """Tests for witness interrogation endpoint."""

    @pytest.fixture
    def mock_witness_response(self) -> str:
        """Mock witness response."""
        return "I was in the library studying that night. I heard raised voices around 9pm."

    @pytest.mark.asyncio
    async def test_interrogate_success(
        self, client: AsyncClient, mock_witness_response: str
    ) -> None:
        """Successful interrogation with mocked LLM."""
        with patch("src.api.routes.get_client") as mock_get_client:
            mock_client = AsyncMock()
            mock_client.get_response = AsyncMock(return_value=mock_witness_response)
            mock_get_client.return_value = mock_client

            response = await client.post(
                "/api/interrogate",
                json={
                    "witness_id": "hermione",
                    "question": "Where were you that night?",
                    "case_id": "case_001",
                    "player_id": "test_interrogate_player",
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert "trust" in data
        assert "trust_delta" in data
        assert data["response"] == mock_witness_response

    @pytest.mark.asyncio
    async def test_interrogate_empathetic_increases_trust(
        self, client: AsyncClient, mock_witness_response: str
    ) -> None:
        """Empathetic question increases trust."""
        with patch("src.api.routes.get_client") as mock_get_client:
            mock_client = AsyncMock()
            mock_client.get_response = AsyncMock(return_value=mock_witness_response)
            mock_get_client.return_value = mock_client

            response = await client.post(
                "/api/interrogate",
                json={
                    "witness_id": "hermione",
                    "question": "I understand this must be difficult. Please help me remember what happened.",
                    "case_id": "case_001",
                    "player_id": "test_empathy_player",
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert data["trust_delta"] == 5  # Empathetic bonus
        assert data["trust"] == 55  # 50 + 5

    @pytest.mark.asyncio
    async def test_interrogate_aggressive_decreases_trust(
        self, client: AsyncClient, mock_witness_response: str
    ) -> None:
        """Aggressive question decreases trust."""
        with patch("src.api.routes.get_client") as mock_get_client:
            mock_client = AsyncMock()
            mock_client.get_response = AsyncMock(return_value=mock_witness_response)
            mock_get_client.return_value = mock_client

            response = await client.post(
                "/api/interrogate",
                json={
                    "witness_id": "hermione",
                    "question": "You're lying! I know you did it!",
                    "case_id": "case_001",
                    "player_id": "test_aggressive_player",
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert data["trust_delta"] == -10  # Aggressive penalty
        assert data["trust"] == 40  # 50 - 10

    @pytest.mark.asyncio
    async def test_interrogate_witness_not_found(self, client: AsyncClient) -> None:
        """404 for nonexistent witness."""
        response = await client.post(
            "/api/interrogate",
            json={
                "witness_id": "voldemort",
                "question": "Where were you?",
                "case_id": "case_001",
                "player_id": "test_player",
            },
        )

        assert response.status_code == 404


class TestPresentEvidenceEndpoint:
    """Tests for present evidence endpoint."""

    @pytest.fixture
    def mock_evidence_response(self) -> str:
        """Mock response when evidence is presented."""
        return "That frost pattern... I recognize it. Fine, I'll tell you what I saw."

    @pytest.mark.asyncio
    async def test_present_evidence_not_discovered(self, client: AsyncClient) -> None:
        """400 when presenting evidence not discovered."""
        response = await client.post(
            "/api/present-evidence",
            json={
                "witness_id": "hermione",
                "evidence_id": "frost_pattern",
                "case_id": "case_001",
                "player_id": "test_undiscovered_evidence",
            },
        )

        assert response.status_code == 400
        assert "not discovered" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_present_evidence_success(
        self, client: AsyncClient, mock_evidence_response: str
    ) -> None:
        """Present discovered evidence to witness."""
        # First save state with discovered evidence
        state_data = {
            "case_id": "case_001",
            "current_location": "library",
            "discovered_evidence": ["frost_pattern"],
            "visited_locations": ["library"],
        }
        await client.post(
            "/api/save",
            json={"player_id": "test_present_evidence", "state": state_data},
        )

        # Now present evidence
        with patch("src.api.routes.get_client") as mock_get_client:
            mock_client = AsyncMock()
            mock_client.get_response = AsyncMock(return_value=mock_evidence_response)
            mock_get_client.return_value = mock_client

            response = await client.post(
                "/api/present-evidence",
                json={
                    "witness_id": "hermione",
                    "evidence_id": "frost_pattern",
                    "case_id": "case_001",
                    "player_id": "test_present_evidence",
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert "trust" in data
        assert data["response"] == mock_evidence_response


# Phase 3: Verdict endpoint tests


class TestSubmitVerdictEndpoint:
    """Tests for submit-verdict endpoint."""

    @pytest.mark.asyncio
    async def test_submit_verdict_correct(self, client: AsyncClient) -> None:
        """Submit correct verdict returns success."""
        response = await client.post(
            "/api/submit-verdict",
            json={
                "accused_suspect_id": "draco",
                "reasoning": "The wand signature and frost pattern prove Draco cast the spell from outside.",
                "evidence_cited": ["frost_pattern", "wand_signature"],
                "case_id": "case_001",
                "player_id": "test_correct_verdict",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["correct"] is True
        assert data["case_solved"] is True
        assert data["attempts_remaining"] == 9
        assert "mentor_feedback" in data
        assert data["confrontation"] is not None

    @pytest.mark.asyncio
    async def test_submit_verdict_incorrect(self, client: AsyncClient) -> None:
        """Submit incorrect verdict returns failure with LLM feedback (empty template fields)."""
        response = await client.post(
            "/api/submit-verdict",
            json={
                "accused_suspect_id": "hermione",
                "reasoning": "She was there so she did it.",
                "evidence_cited": [],
                "case_id": "case_001",
                "player_id": "test_incorrect_verdict",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["correct"] is False
        assert data["case_solved"] is False
        assert data["attempts_remaining"] == 9
        assert "mentor_feedback" in data
        # Template fields are now empty (integrated into analysis)
        assert data["mentor_feedback"]["hint"] is None
        assert data["mentor_feedback"]["analysis"]  # LLM text populated

    @pytest.mark.asyncio
    async def test_submit_verdict_has_mentor_feedback(self, client: AsyncClient) -> None:
        """Verdict response includes mentor feedback with LLM analysis (empty template fields)."""
        response = await client.post(
            "/api/submit-verdict",
            json={
                "accused_suspect_id": "draco",
                "reasoning": "The frost pattern proves it.",
                "evidence_cited": ["frost_pattern"],
                "case_id": "case_001",
                "player_id": "test_mentor_feedback",
            },
        )

        assert response.status_code == 200
        data = response.json()
        feedback = data["mentor_feedback"]
        # Core fields still populated
        assert "analysis" in feedback
        assert feedback["analysis"]  # Should have LLM-generated text
        assert "score" in feedback
        assert "quality" in feedback
        # Template fields are now empty (LLM integrates into analysis)
        assert feedback["fallacies_detected"] == []
        assert feedback["critique"] == ""
        assert feedback["praise"] == ""
        assert feedback["hint"] is None

    @pytest.mark.asyncio
    async def test_submit_verdict_detects_fallacies(self, client: AsyncClient) -> None:
        """Verdict fallacies are now integrated into LLM analysis (empty list in response)."""
        response = await client.post(
            "/api/submit-verdict",
            json={
                "accused_suspect_id": "hermione",
                "reasoning": "She was present in the library so she did it.",
                "evidence_cited": [],
                "case_id": "case_001",
                "player_id": "test_fallacies",
            },
        )

        assert response.status_code == 200
        data = response.json()
        fallacies = data["mentor_feedback"]["fallacies_detected"]
        # Fallacies are now integrated into LLM analysis, list is empty
        assert fallacies == []
        # But analysis should contain the feedback
        assert data["mentor_feedback"]["analysis"]

    @pytest.mark.asyncio
    async def test_submit_verdict_has_wrong_suspect_response(self, client: AsyncClient) -> None:
        """Wrong verdict for known suspect includes pre-written response."""
        response = await client.post(
            "/api/submit-verdict",
            json={
                "accused_suspect_id": "hermione",
                "reasoning": "She was there.",
                "evidence_cited": [],
                "case_id": "case_001",
                "player_id": "test_wrong_suspect_response",
            },
        )

        assert response.status_code == 200
        data = response.json()
        # Hermione has a pre-written wrong_suspect_response in YAML
        assert data["wrong_suspect_response"] is not None
        assert "MOODY" in data["wrong_suspect_response"]

    @pytest.mark.asyncio
    async def test_submit_verdict_confrontation_on_correct(self, client: AsyncClient) -> None:
        """Correct verdict includes confrontation dialogue."""
        response = await client.post(
            "/api/submit-verdict",
            json={
                "accused_suspect_id": "draco",
                "reasoning": "The evidence proves Draco did it.",
                "evidence_cited": ["frost_pattern"],
                "case_id": "case_001",
                "player_id": "test_confrontation",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["confrontation"] is not None
        assert "dialogue" in data["confrontation"]
        assert "aftermath" in data["confrontation"]
        assert len(data["confrontation"]["dialogue"]) >= 3

    @pytest.mark.asyncio
    async def test_submit_verdict_attempts_remaining_decrements(
        self, client: AsyncClient
    ) -> None:
        """Attempts remaining decrements with each wrong verdict."""
        player_id = "test_attempts_decrement"

        # First wrong attempt
        response = await client.post(
            "/api/submit-verdict",
            json={
                "accused_suspect_id": "hermione",
                "reasoning": "Wrong guess.",
                "evidence_cited": [],
                "case_id": "case_001",
                "player_id": player_id,
            },
        )
        assert response.json()["attempts_remaining"] == 9

        # Second wrong attempt
        response = await client.post(
            "/api/submit-verdict",
            json={
                "accused_suspect_id": "hermione",
                "reasoning": "Wrong again.",
                "evidence_cited": [],
                "case_id": "case_001",
                "player_id": player_id,
            },
        )
        assert response.json()["attempts_remaining"] == 8

    @pytest.mark.asyncio
    async def test_submit_verdict_case_not_found(self, client: AsyncClient) -> None:
        """404 for nonexistent case."""
        response = await client.post(
            "/api/submit-verdict",
            json={
                "accused_suspect_id": "draco",
                "reasoning": "Test",
                "evidence_cited": [],
                "case_id": "nonexistent_case",
                "player_id": "test_player",
            },
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_submit_verdict_scoring(self, client: AsyncClient) -> None:
        """Verdict scores reasoning quality."""
        # Good reasoning with evidence
        response = await client.post(
            "/api/submit-verdict",
            json={
                "accused_suspect_id": "draco",
                "reasoning": "The frost pattern matches Draco's wand signature. The witness testimony confirms it.",
                "evidence_cited": ["frost_pattern", "wand_signature"],
                "case_id": "case_001",
                "player_id": "test_scoring_good",
            },
        )

        good_score = response.json()["mentor_feedback"]["score"]

        # Poor reasoning without evidence
        response = await client.post(
            "/api/submit-verdict",
            json={
                "accused_suspect_id": "hermione",
                "reasoning": "x",
                "evidence_cited": [],
                "case_id": "case_001",
                "player_id": "test_scoring_poor",
            },
        )

        poor_score = response.json()["mentor_feedback"]["score"]

        assert good_score > poor_score

    @pytest.mark.asyncio
    async def test_submit_verdict_quality_levels(self, client: AsyncClient) -> None:
        """Verdict feedback includes quality level."""
        response = await client.post(
            "/api/submit-verdict",
            json={
                "accused_suspect_id": "draco",
                "reasoning": "The frost pattern and wand signature prove Draco cast the spell.",
                "evidence_cited": ["frost_pattern", "wand_signature"],
                "case_id": "case_001",
                "player_id": "test_quality",
            },
        )

        assert response.status_code == 200
        quality = response.json()["mentor_feedback"]["quality"]
        assert quality in ["excellent", "good", "fair", "poor", "failing"]

    @pytest.mark.asyncio
    async def test_submit_verdict_allows_retry_after_solved(
        self, client: AsyncClient
    ) -> None:
        """Can submit verdict after case is solved (educational retries)."""
        player_id = "test_retry_after_solved"

        # First: solve the case
        first_response = await client.post(
            "/api/submit-verdict",
            json={
                "accused_suspect_id": "draco",
                "reasoning": "Correct verdict.",
                "evidence_cited": [],
                "case_id": "case_001",
                "player_id": player_id,
            },
        )
        assert first_response.status_code == 200
        assert first_response.json()["case_solved"] is True

        # Second attempt should succeed (educational retries allowed)
        response = await client.post(
            "/api/submit-verdict",
            json={
                "accused_suspect_id": "hermione",
                "reasoning": "Testing retry.",
                "evidence_cited": [],
                "case_id": "case_001",
                "player_id": player_id,
            },
        )

        # Should work - no 400 error
        assert response.status_code == 200
        assert "mentor_feedback" in response.json()

    @pytest.mark.asyncio
    async def test_submit_verdict_adaptive_hints(self, client: AsyncClient) -> None:
        """Hints are now integrated into LLM analysis (hint field is None)."""
        player_id = "test_adaptive_hints"

        # First wrong attempt
        response = await client.post(
            "/api/submit-verdict",
            json={
                "accused_suspect_id": "hermione",
                "reasoning": "Wrong.",
                "evidence_cited": [],
                "case_id": "case_001",
                "player_id": player_id,
            },
        )
        # Hint field is now always None (integrated into analysis)
        first_hint = response.json()["mentor_feedback"]["hint"]
        assert first_hint is None

        # Make several more wrong attempts
        for _ in range(5):
            response = await client.post(
                "/api/submit-verdict",
                json={
                    "accused_suspect_id": "hermione",
                    "reasoning": "Wrong.",
                    "evidence_cited": [],
                    "case_id": "case_001",
                    "player_id": player_id,
                },
            )

        later_hint = response.json()["mentor_feedback"]["hint"]
        # Hint is always None now - hints integrated into LLM analysis
        assert later_hint is None
        # Analysis should have content though
        assert response.json()["mentor_feedback"]["analysis"]

    @pytest.mark.asyncio
    async def test_submit_verdict_confrontation_for_wrong_with_show_anyway(
        self, client: AsyncClient
    ) -> None:
        """Wrong verdict for hermione shows confrontation (confrontation_anyway: true)."""
        player_id = "test_confrontation_anyway"

        # Use up all attempts to trigger confrontation for wrong verdict
        for _ in range(10):
            response = await client.post(
                "/api/submit-verdict",
                json={
                    "accused_suspect_id": "hermione",
                    "reasoning": "Wrong.",
                    "evidence_cited": [],
                    "case_id": "case_001",
                    "player_id": player_id,
                },
            )

        # Last response should have confrontation and reveal
        data = response.json()
        assert data["attempts_remaining"] == 0
        assert data["reveal"] is not None
