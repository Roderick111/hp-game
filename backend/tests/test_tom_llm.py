"""Tests for Phase 4.1: Tom LLM-powered inner voice.

Tests:
- Tom LLM prompt building
- Trust system state
- Auto-comment endpoint (mocked LLM)
- Direct chat endpoint (mocked LLM)
- Fallback behavior
"""

from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from src.context.tom_llm import (
    build_context_prompt,
    build_tom_system_prompt,
    check_tom_should_comment,
    get_tom_fallback_response,
)
from src.main import app
from src.state.player_state import InnerVoiceState


class TestTomSystemPrompt:
    """Test Tom character prompt building."""

    def test_prompt_includes_trust_level(self) -> None:
        """Prompt includes trust percentage."""
        prompt = build_tom_system_prompt(trust_level=0.5, mode="helpful")
        assert "40-70%" in prompt or "Trust" in prompt

    def test_prompt_helpful_mode(self) -> None:
        """Helpful mode includes Socratic question guidance."""
        prompt = build_tom_system_prompt(trust_level=0.5, mode="helpful")
        assert "HELPFUL" in prompt
        assert "Socratic" in prompt or "question" in prompt.lower()

    def test_prompt_misleading_mode(self) -> None:
        """Misleading mode includes plausible wrong assertion guidance."""
        prompt = build_tom_system_prompt(trust_level=0.5, mode="misleading")
        assert "MISLEADING" in prompt
        assert "plausible" in prompt.lower() or "wrong" in prompt.lower()

    def test_prompt_includes_rule_10(self) -> None:
        """Prompt includes critical Rule #10 (no psychology explanation)."""
        prompt = build_tom_system_prompt(trust_level=0.5, mode="helpful")
        assert "RULE #10" in prompt or "PARAMOUNT" in prompt
        assert "psychology" in prompt.lower()

    def test_trust_level_zero_no_personal_stories(self) -> None:
        """Trust 0% prevents personal stories."""
        prompt = build_tom_system_prompt(trust_level=0.0, mode="helpful")
        assert "NO personal stories" in prompt or "0-30%" in prompt

    def test_trust_level_high_allows_sharing(self) -> None:
        """Trust 80%+ allows deeper sharing."""
        prompt = build_tom_system_prompt(trust_level=0.9, mode="helpful")
        assert "80-100%" in prompt or "deeper" in prompt.lower()


class TestContextPrompt:
    """Test context prompt building."""

    def test_context_includes_case_facts(self) -> None:
        """Context includes victim, location, suspects, witnesses."""
        case_context = {
            "victim": "Third-year student (petrified)",
            "location": "Hogwarts Library",
            "suspects": ["Hermione Granger", "Draco Malfoy"],
            "witnesses": ["Madam Pince"],
        }
        evidence = []

        prompt = build_context_prompt(case_context, evidence, [])

        assert "Third-year student" in prompt
        assert "Hogwarts Library" in prompt
        assert "Hermione Granger" in prompt or "Draco Malfoy" in prompt
        assert "Madam Pince" in prompt

    def test_context_includes_evidence(self) -> None:
        """Context includes discovered evidence."""
        case_context = {"victim": "Test", "location": "Test", "suspects": [], "witnesses": []}
        evidence = [
            {"name": "Frost Pattern", "description": "Ice on window"},
            {"name": "Wand Signature", "description": "Traces of magic"},
        ]

        prompt = build_context_prompt(case_context, evidence, [])

        assert "Frost Pattern" in prompt
        assert "Wand Signature" in prompt

    def test_context_handles_empty_evidence(self) -> None:
        """Context handles no evidence discovered."""
        case_context = {"victim": "Test", "location": "Test", "suspects": [], "witnesses": []}
        evidence = []

        prompt = build_context_prompt(case_context, evidence, [])

        assert "None discovered yet" in prompt

    def test_context_includes_user_message(self) -> None:
        """Context includes player's direct question."""
        case_context = {"victim": "Test", "location": "Test", "suspects": [], "witnesses": []}
        evidence = []
        user_message = "Tom, should I trust Hermione?"

        prompt = build_context_prompt(case_context, evidence, [], user_message)

        assert "should I trust Hermione" in prompt


class TestTrustSystem:
    """Test InnerVoiceState trust system."""

    def test_initial_trust_zero(self) -> None:
        """New InnerVoiceState starts with trust 0."""
        state = InnerVoiceState(case_id="test")
        assert state.trust_level == 0.0
        assert state.get_trust_percentage() == 0

    def test_increment_trust(self) -> None:
        """Trust increments correctly."""
        state = InnerVoiceState(case_id="test")
        state.increment_trust(0.1)
        assert state.trust_level == 0.1
        assert state.get_trust_percentage() == 10

    def test_trust_caps_at_one(self) -> None:
        """Trust cannot exceed 1.0."""
        state = InnerVoiceState(case_id="test", trust_level=0.95)
        state.increment_trust(0.2)
        assert state.trust_level == 1.0
        assert state.get_trust_percentage() == 100

    def test_mark_case_complete_increases_trust(self) -> None:
        """Completing a case increases trust by 10%."""
        state = InnerVoiceState(case_id="test")
        state.mark_case_complete()
        assert state.cases_completed == 1
        assert state.trust_level == 0.1

    def test_calculate_trust_from_cases(self) -> None:
        """Trust calculation from case count is correct."""
        state = InnerVoiceState(case_id="test", cases_completed=5)
        trust = state.calculate_trust_from_cases()
        assert trust == 0.5  # 5 cases * 10% = 50%

    def test_add_tom_comment(self) -> None:
        """Adding Tom comment updates state."""
        state = InnerVoiceState(case_id="test")
        state.add_tom_comment("What about Draco?", "Check his alibi first.")

        assert state.total_comments == 1
        assert len(state.conversation_history) == 1
        assert state.conversation_history[0]["user"] == "What about Draco?"
        assert state.conversation_history[0]["tom"] == "Check his alibi first."
        assert state.last_comment_at is not None


class TestShouldComment:
    """Test auto-comment probability."""

    @pytest.mark.asyncio
    async def test_critical_always_comments(self) -> None:
        """Critical evidence always triggers comment."""
        result = await check_tom_should_comment(is_critical=True)
        assert result is True

    @pytest.mark.asyncio
    async def test_non_critical_has_30_percent_chance(self) -> None:
        """Non-critical has ~30% chance (statistical test)."""
        # Run 1000 times and check roughly 30% are True
        results = [await check_tom_should_comment(is_critical=False) for _ in range(1000)]
        true_count = sum(results)
        # Should be roughly 300 +/- 50 (allowing for variance)
        assert 200 < true_count < 400


class TestFallbackResponses:
    """Test template fallback responses."""

    def test_helpful_fallback(self) -> None:
        """Helpful mode returns Socratic question."""
        response = get_tom_fallback_response("helpful", 0)
        assert "?" in response  # Should be a question

    def test_misleading_fallback(self) -> None:
        """Misleading mode returns confident assertion."""
        response = get_tom_fallback_response("misleading", 0)
        # Should be a statement, not a question (or at least confident)
        assert len(response) > 20

    def test_fallback_varies_by_evidence_count(self) -> None:
        """Different evidence counts give different responses."""
        r1 = get_tom_fallback_response("helpful", 0)
        r2 = get_tom_fallback_response("helpful", 1)
        r3 = get_tom_fallback_response("helpful", 2)

        # At least 2 of 3 should be different
        responses = {r1, r2, r3}
        assert len(responses) >= 2


class TestTomAutoCommentEndpoint:
    """Test POST /api/case/{case_id}/tom/auto-comment endpoint."""

    @pytest.mark.asyncio
    async def test_auto_comment_case_not_found(self) -> None:
        """Returns 404 for missing case."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/api/case/nonexistent/tom/auto-comment",
                json={"is_critical": True},
            )
            assert response.status_code == 404
            assert "Case not found" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_auto_comment_tom_stays_quiet(self) -> None:
        """Returns 404 when Tom chooses not to comment (mocked 0% chance)."""
        transport = ASGITransport(app=app)

        with patch(
            "src.context.tom_llm.check_tom_should_comment",
            new_callable=AsyncMock,
            return_value=False,
        ):
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post(
                    "/api/case/case_001/tom/auto-comment",
                    json={"is_critical": False},
                )
                assert response.status_code == 404
                assert "Tom stays quiet" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_auto_comment_success_with_mocked_llm(self) -> None:
        """Returns Tom response with mocked LLM."""
        transport = ASGITransport(app=app)

        mock_response = ("Check the frost pattern direction.", "helpful")

        with (
            patch(
                "src.context.tom_llm.check_tom_should_comment",
                new_callable=AsyncMock,
                return_value=True,
            ),
            patch(
                "src.context.tom_llm.generate_tom_response",
                new_callable=AsyncMock,
                return_value=mock_response,
            ),
        ):
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post(
                    "/api/case/case_001/tom/auto-comment",
                    json={"is_critical": True},
                )
                assert response.status_code == 200
                data = response.json()
                assert data["text"] == "Check the frost pattern direction."
                assert "auto_helpful" in data["mode"]
                assert data["trust_level"] >= 0

    @pytest.mark.asyncio
    async def test_auto_comment_fallback_on_llm_failure(self) -> None:
        """Falls back to template when LLM fails."""
        transport = ASGITransport(app=app)

        with (
            patch(
                "src.context.tom_llm.check_tom_should_comment",
                new_callable=AsyncMock,
                return_value=True,
            ),
            patch(
                "src.context.tom_llm.generate_tom_response",
                new_callable=AsyncMock,
                side_effect=Exception("LLM failed"),
            ),
        ):
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post(
                    "/api/case/case_001/tom/auto-comment",
                    json={"is_critical": True},
                )
                # Should still return 200 with fallback
                assert response.status_code == 200
                data = response.json()
                assert len(data["text"]) > 0  # Got a fallback response


class TestTomDirectChatEndpoint:
    """Test POST /api/case/{case_id}/tom/chat endpoint."""

    @pytest.mark.asyncio
    async def test_direct_chat_case_not_found(self) -> None:
        """Returns 404 for missing case."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/api/case/nonexistent/tom/chat",
                json={"message": "Tom, what do you think?"},
            )
            assert response.status_code == 404
            assert "Case not found" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_direct_chat_empty_message(self) -> None:
        """Rejects empty message."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/api/case/case_001/tom/chat",
                json={"message": ""},
            )
            assert response.status_code == 422  # Validation error

    @pytest.mark.asyncio
    async def test_direct_chat_success_with_mocked_llm(self) -> None:
        """Returns Tom response with mocked LLM."""
        transport = ASGITransport(app=app)

        mock_response = ("Trust the evidence, not your gut feeling.", "misleading")

        with patch(
            "src.context.tom_llm.generate_tom_response",
            new_callable=AsyncMock,
            return_value=mock_response,
        ):
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post(
                    "/api/case/case_001/tom/chat",
                    json={"message": "Tom, should I trust Hermione?"},
                )
                assert response.status_code == 200
                data = response.json()
                assert data["text"] == "Trust the evidence, not your gut feeling."
                assert "direct_chat_misleading" in data["mode"]
                assert data["trust_level"] >= 0

    @pytest.mark.asyncio
    async def test_direct_chat_always_responds(self) -> None:
        """Direct chat always responds (unlike auto-comment)."""
        transport = ASGITransport(app=app)

        mock_response = ("Good question. What does the evidence say?", "helpful")

        with patch(
            "src.context.tom_llm.generate_tom_response",
            new_callable=AsyncMock,
            return_value=mock_response,
        ):
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                # Call multiple times - should always get 200
                for _ in range(3):
                    response = await client.post(
                        "/api/case/case_001/tom/chat",
                        json={"message": "Tom?"},
                    )
                    assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_direct_chat_fallback_on_llm_failure(self) -> None:
        """Falls back to template when LLM fails."""
        transport = ASGITransport(app=app)

        with patch(
            "src.context.tom_llm.generate_tom_response",
            new_callable=AsyncMock,
            side_effect=Exception("LLM failed"),
        ):
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post(
                    "/api/case/case_001/tom/chat",
                    json={"message": "Tom, help me out here."},
                )
                # Should still return 200 with fallback
                assert response.status_code == 200
                data = response.json()
                assert len(data["text"]) > 0  # Got a fallback response


class TestPhase43BehavioralPatterns:
    """Test Phase 4.3: Tom personality enhancement patterns in prompt."""

    def test_trust_0_helpful_contains_verification_questions(self) -> None:
        """Trust 0%, helpful mode includes verification question templates."""
        prompt = build_tom_system_prompt(trust_level=0.0, mode="helpful")
        # Should include Case #1 failure reference (witness coordination)
        assert "witnesses" in prompt.lower() or "coordinate" in prompt.lower()
        assert "verify" in prompt.lower()
        # Should be in helpful mode
        assert "HELPFUL" in prompt

    def test_trust_0_misleading_contains_misapplied_principles(self) -> None:
        """Trust 0%, misleading mode includes confident misapplication structure."""
        prompt = build_tom_system_prompt(trust_level=0.0, mode="misleading")
        # Should include misapplied principle structure
        assert "MISLEADING" in prompt
        assert "Corroboration" in prompt or "Physical evidence" in prompt
        # Should have reassurance tone
        assert "solid" in prompt.lower() or "trust" in prompt.lower()

    def test_trust_50_contains_doubling_down_pattern(self) -> None:
        """Trust 50% prompt includes Alpha doubling down pattern."""
        prompt = build_tom_system_prompt(trust_level=0.5, mode="helpful")
        # Should include Pattern Alpha
        assert "Doubling Down" in prompt or "Alpha" in prompt
        # Should have 3-step structure
        assert "KNOW it" in prompt or "never admit" in prompt.lower()

    def test_trust_90_contains_full_marcus_details(self) -> None:
        """Trust 90% prompt includes full Marcus guilt acknowledgment."""
        prompt = build_tom_system_prompt(trust_level=0.9, mode="helpful")
        # Should include Marcus details at trust 80%+
        assert "Marcus" in prompt
        # Specific details: daughter age, Cell Block D, key phrase
        assert "daughter" in prompt.lower() or "Cell Block D" in prompt
        assert "I couldn't say" in prompt or "I'm not sure" in prompt

    def test_trust_90_contains_dark_humor_section(self) -> None:
        """Trust 90% prompt includes dark humor templates."""
        prompt = build_tom_system_prompt(trust_level=0.9, mode="helpful")
        # Should include dark humor guidance
        assert "DARK HUMOR" in prompt or "dark humor" in prompt.lower()
        # Should have examples
        assert "floor" in prompt.lower()  # "Check the floor" example

    def test_samuel_references_differ_by_trust(self) -> None:
        """Samuel invocations decrease from trust 30% to 80%."""
        prompt_low = build_tom_system_prompt(trust_level=0.2, mode="helpful")
        prompt_high = build_tom_system_prompt(trust_level=0.9, mode="helpful")

        # Low trust: idealized Samuel
        assert "Samuel" in prompt_low
        low_trust_section = prompt_low[prompt_low.find("TRUST 0-30%") : prompt_low.find("VOICE")]
        assert "Frequent" in low_trust_section or "idealized" in low_trust_section.lower()

        # High trust: awareness of fiction
        assert "Samuel I invented" in prompt_high or "fiction" in prompt_high.lower()

    def test_voice_progression_eager_at_low_trust(self) -> None:
        """Trust 0-30% has eager/proving voice tone."""
        prompt = build_tom_system_prompt(trust_level=0.2, mode="helpful")
        # Should include eager voice markers
        voice_section = prompt[prompt.find("VOICE") : prompt.find("CHARACTER RULES")]
        assert "Eager" in voice_section or "prove" in voice_section.lower()

    def test_voice_progression_wise_at_high_trust(self) -> None:
        """Trust 80%+ has wise/questioning voice tone."""
        prompt = build_tom_system_prompt(trust_level=0.9, mode="helpful")
        # Should include wisdom markers
        assert "Wisdom" in prompt or "I don't know" in prompt

    def test_relationship_markers_present(self) -> None:
        """Prompt includes relationship markers section."""
        prompt = build_tom_system_prompt(trust_level=0.5, mode="helpful")
        # Should have relationship section
        assert "RELATIONSHIPS" in prompt or "TO PLAYER" in prompt
        # Should have Moody marker
        assert "Moody" in prompt or "MOODY" in prompt

    def test_rule_10_enforced_no_psychology_explanations(self) -> None:
        """Rule #10 enforced: no psychology explanation examples."""
        prompt = build_tom_system_prompt(trust_level=0.5, mode="helpful")
        # Should have CANNOT say examples (optimized from FORBIDDEN)
        assert "CANNOT say" in prompt or "❌" in prompt
        assert "defensive because" in prompt.lower() or "trauma" in prompt.lower()
        # Should have INSTEAD behavior guidance (optimized from CORRECT)
        assert "INSTEAD" in prompt or "Show through" in prompt

    def test_mode_helpful_has_tom_case_failures(self) -> None:
        """Helpful mode references Tom's specific case failures."""
        prompt = build_tom_system_prompt(trust_level=0.5, mode="helpful")
        # Should reference Case #1 or Case #2 failures
        assert "Case #1" in prompt or "Case #2" in prompt

    def test_mode_misleading_sounds_professional(self) -> None:
        """Misleading mode structure sounds professional (not obviously wrong)."""
        prompt = build_tom_system_prompt(trust_level=0.5, mode="misleading")
        # Should have professional-sounding structure
        assert "Principle" in prompt or "principle" in prompt
        # Should have reassurance language
        assert "experienced" in prompt.lower() or "I've seen" in prompt

    def test_self_aware_deflection_pattern_present(self) -> None:
        """Beta pattern (self-aware deflection) included with 5% guidance."""
        prompt = build_tom_system_prompt(trust_level=0.5, mode="helpful")
        # Should include Beta pattern
        assert "Beta" in prompt or "Self-Aware Deflection" in prompt
        # Should have 5% frequency guidance
        assert "5%" in prompt

    def test_prompt_under_token_budget(self) -> None:
        """Full prompt stays under ~3000 token budget (Phase 4.3+ enhanced)."""
        prompt = build_tom_system_prompt(trust_level=0.9, mode="helpful")
        # Rough estimate: 1 token ~= 4 characters for English text
        # Phase 4.3 enhanced BACKGROUND: ~2400 tokens (~9500 chars)
        # Still well within Claude Haiku's 200K context window
        assert len(prompt) < 12000  # ~3000 tokens with buffer
