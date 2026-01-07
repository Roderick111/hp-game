"""Tests for witness context builder module."""

import pytest

from src.context.witness import (
    build_witness_prompt,
    build_witness_system_prompt,
    format_conversation_history,
    format_knowledge,
    format_lie_topics,
    format_secrets_for_prompt,
    get_trust_behavior_text,
)


@pytest.fixture
def sample_witness() -> dict:
    """Sample witness data for testing."""
    return {
        "id": "hermione",
        "name": "Hermione Granger",
        "personality": "Brilliant student. Values truth and logic.",
        "background": "Top student. Best friends with Harry and Ron.",
        "base_trust": 50,
        "knowledge": [
            "Was in library from 8:30pm to 9:30pm",
            "Heard raised voices around 9:00pm",
            "Saw someone running past the stacks",
        ],
        "secrets": [
            {
                "id": "saw_draco",
                "trigger": "evidence:frost_pattern OR trust>70",
                "text": "I saw Draco near the window at 9pm.",
            },
            {
                "id": "borrowed_book",
                "trigger": "trust>80",
                "text": "I borrowed a restricted book.",
            },
        ],
        "lies": [
            {
                "condition": "trust<30",
                "topics": ["where were you", "that night"],
                "response": "I was in the common room all night.",
            },
        ],
    }


class TestFormatKnowledge:
    """Tests for format_knowledge function."""

    def test_format_knowledge_list(self) -> None:
        """Formats knowledge as bullet points."""
        knowledge = ["Fact 1", "Fact 2", "Fact 3"]
        result = format_knowledge(knowledge)

        assert "- Fact 1" in result
        assert "- Fact 2" in result
        assert "- Fact 3" in result

    def test_format_empty_knowledge(self) -> None:
        """Returns placeholder for empty knowledge."""
        result = format_knowledge([])
        assert "No specific knowledge" in result


class TestFormatSecretsForPrompt:
    """Tests for format_secrets_for_prompt function."""

    def test_format_available_secrets(self) -> None:
        """Formats secrets with IDs."""
        secrets = [
            {"id": "secret1", "text": "Secret text 1"},
            {"id": "secret2", "text": "Secret text 2"},
        ]
        result = format_secrets_for_prompt(secrets, 80)

        assert "[secret1]" in result
        assert "Secret text 1" in result
        assert "[secret2]" in result

    def test_format_no_secrets(self) -> None:
        """Returns placeholder when no secrets available."""
        result = format_secrets_for_prompt([], 50)
        assert "No secrets available" in result


class TestFormatConversationHistory:
    """Tests for format_conversation_history function."""

    def test_format_history(self) -> None:
        """Formats conversation history."""
        history = [
            {"question": "Where were you?", "response": "In the library."},
            {"question": "What did you see?", "response": "Someone running."},
        ]
        result = format_conversation_history(history)

        assert "Player: Where were you?" in result
        assert "You: In the library." in result

    def test_format_empty_history(self) -> None:
        """Returns start message for empty history."""
        result = format_conversation_history([])
        assert "start of the conversation" in result

    def test_limits_to_last_5_exchanges(self) -> None:
        """Only includes last 5 exchanges."""
        history = [{"question": f"Q{i}", "response": f"R{i}"} for i in range(10)]
        result = format_conversation_history(history)

        # Should have Q5-Q9, not Q0-Q4
        assert "Q5" in result
        assert "Q9" in result


class TestFormatLieTopics:
    """Tests for format_lie_topics function."""

    def test_format_lie_topics(self) -> None:
        """Formats lie topics as comma-separated."""
        lies = [
            {"condition": "trust<30", "topics": ["where were you", "that night"]},
            {"condition": "trust<40", "topics": ["draco"]},
        ]
        result = format_lie_topics(lies)

        assert "where were you" in result
        assert "that night" in result
        assert "draco" in result

    def test_format_empty_lies(self) -> None:
        """Returns placeholder for no lies."""
        result = format_lie_topics([])
        assert "nothing specific" in result


class TestGetTrustBehaviorText:
    """Tests for get_trust_behavior_text function."""

    def test_low_trust_evasive(self) -> None:
        """Low trust returns evasive behavior."""
        result = get_trust_behavior_text(20)
        assert "evasive" in result.lower() or "defensive" in result.lower()

    def test_medium_trust_cautious(self) -> None:
        """Medium trust returns cautious behavior."""
        result = get_trust_behavior_text(50)
        assert "cautious" in result.lower() or "truthfully" in result.lower()

    def test_high_trust_open(self) -> None:
        """High trust returns open behavior."""
        result = get_trust_behavior_text(80)
        assert "open" in result.lower() or "share" in result.lower()


class TestBuildWitnessPrompt:
    """Tests for build_witness_prompt function."""

    def test_prompt_contains_witness_name(self, sample_witness: dict) -> None:
        """Prompt contains witness name."""
        prompt = build_witness_prompt(
            witness=sample_witness,
            trust=50,
            discovered_evidence=[],
            conversation_history=[],
            player_input="Where were you?",
        )

        assert "Hermione Granger" in prompt

    def test_prompt_contains_personality(self, sample_witness: dict) -> None:
        """Prompt contains personality description."""
        prompt = build_witness_prompt(
            witness=sample_witness,
            trust=50,
            discovered_evidence=[],
            conversation_history=[],
            player_input="Where were you?",
        )

        assert "Brilliant student" in prompt

    def test_prompt_contains_knowledge(self, sample_witness: dict) -> None:
        """Prompt contains witness knowledge."""
        prompt = build_witness_prompt(
            witness=sample_witness,
            trust=50,
            discovered_evidence=[],
            conversation_history=[],
            player_input="Where were you?",
        )

        assert "library from 8:30pm" in prompt

    def test_prompt_contains_trust_level(self, sample_witness: dict) -> None:
        """Prompt contains current trust level."""
        prompt = build_witness_prompt(
            witness=sample_witness,
            trust=65,
            discovered_evidence=[],
            conversation_history=[],
            player_input="Where were you?",
        )

        assert "65/100" in prompt

    def test_prompt_contains_player_input(self, sample_witness: dict) -> None:
        """Prompt contains player's question."""
        prompt = build_witness_prompt(
            witness=sample_witness,
            trust=50,
            discovered_evidence=[],
            conversation_history=[],
            player_input="What did you see at 9pm?",
        )

        assert "What did you see at 9pm?" in prompt

    def test_prompt_contains_isolation_rules(self, sample_witness: dict) -> None:
        """Prompt contains context isolation rules."""
        prompt = build_witness_prompt(
            witness=sample_witness,
            trust=50,
            discovered_evidence=[],
            conversation_history=[],
            player_input="Where were you?",
        )

        assert "DO NOT know" in prompt
        assert "investigation details" in prompt.lower()

    def test_secret_available_with_high_trust(self, sample_witness: dict) -> None:
        """Secret appears when trust threshold met."""
        prompt = build_witness_prompt(
            witness=sample_witness,
            trust=75,  # Above trust>70 threshold
            discovered_evidence=[],
            conversation_history=[],
            player_input="What else do you know?",
        )

        # saw_draco secret should be available (trust>70)
        assert "saw_draco" in prompt or "Draco" in prompt

    def test_secret_available_with_evidence(self, sample_witness: dict) -> None:
        """Secret appears when evidence trigger met."""
        prompt = build_witness_prompt(
            witness=sample_witness,
            trust=50,  # Below trust threshold
            discovered_evidence=["frost_pattern"],  # Evidence trigger
            conversation_history=[],
            player_input="What about this frost pattern?",
        )

        # saw_draco secret should be available (evidence:frost_pattern)
        assert "saw_draco" in prompt or "Draco" in prompt

    def test_lie_instruction_when_trust_low(self, sample_witness: dict) -> None:
        """Lie instruction included when trust low and topic matches."""
        prompt = build_witness_prompt(
            witness=sample_witness,
            trust=20,  # Below trust<30 threshold
            discovered_evidence=[],
            conversation_history=[],
            player_input="Where were you that night?",  # Matches lie topic
        )

        assert "MANDATORY LIE" in prompt or "common room" in prompt


class TestBuildWitnessSystemPrompt:
    """Tests for build_witness_system_prompt function."""

    def test_system_prompt_contains_name(self) -> None:
        """System prompt contains witness name."""
        prompt = build_witness_system_prompt("Hermione Granger")

        assert "Hermione Granger" in prompt

    def test_system_prompt_contains_isolation(self) -> None:
        """System prompt contains isolation rules."""
        prompt = build_witness_system_prompt("Hermione Granger")

        assert "ISOLATION" in prompt or "SEPARATE" in prompt
        assert "narrator" in prompt.lower()

    def test_system_prompt_contains_style_guidance(self) -> None:
        """System prompt contains style guidance."""
        prompt = build_witness_system_prompt("Hermione Granger")

        assert "first person" in prompt.lower()
        assert "2-4 sentences" in prompt


class TestPromptIntegration:
    """Integration tests for witness prompts."""

    def test_full_prompt_structure(self, sample_witness: dict) -> None:
        """Full prompt has all expected sections."""
        prompt = build_witness_prompt(
            witness=sample_witness,
            trust=50,
            discovered_evidence=[],
            conversation_history=[
                {"question": "Hello", "response": "Hello there."},
            ],
            player_input="Tell me more.",
        )

        # Check all sections present
        assert "PERSONALITY" in prompt
        assert "BACKGROUND" in prompt
        assert "KNOWLEDGE" in prompt
        assert "TRUST LEVEL" in prompt
        assert "SECRETS" in prompt
        assert "CONVERSATION HISTORY" in prompt
        assert "CRITICAL RULES" in prompt
        assert "PLAYER'S QUESTION" in prompt
