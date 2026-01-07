"""Tests for trust mechanics module."""

from src.utils.trust import (
    AGGRESSIVE_PENALTY,
    EMPATHETIC_BONUS,
    adjust_trust,
    check_secret_triggers,
    clamp_trust,
    detect_evidence_presentation,
    get_available_secrets,
    parse_trigger_condition,
    should_lie,
)


class TestAdjustTrust:
    """Tests for adjust_trust function."""

    def test_aggressive_question_decreases_trust(self) -> None:
        """Aggressive keywords reduce trust."""
        assert adjust_trust("You're lying!") == AGGRESSIVE_PENALTY
        assert adjust_trust("I accuse you of the crime") == AGGRESSIVE_PENALTY
        assert adjust_trust("Admit what you did") == AGGRESSIVE_PENALTY
        assert adjust_trust("You're guilty and I know it") == AGGRESSIVE_PENALTY

    def test_empathetic_question_increases_trust(self) -> None:
        """Empathetic keywords increase trust."""
        assert adjust_trust("I understand this is difficult") == EMPATHETIC_BONUS
        assert adjust_trust("Please help me understand") == EMPATHETIC_BONUS
        assert adjust_trust("Can you remember anything?") == EMPATHETIC_BONUS
        assert adjust_trust("Thank you for talking to me") == EMPATHETIC_BONUS

    def test_neutral_question_no_change(self) -> None:
        """Neutral questions don't change trust."""
        assert adjust_trust("Where were you at 9pm?") == 0
        assert adjust_trust("What did you see?") == 0
        assert adjust_trust("Describe the scene") == 0

    def test_case_insensitive(self) -> None:
        """Trust adjustment is case-insensitive."""
        assert adjust_trust("YOU'RE LYING!") == AGGRESSIVE_PENALTY
        assert adjust_trust("Please HELP me") == EMPATHETIC_BONUS


class TestClampTrust:
    """Tests for clamp_trust function."""

    def test_clamp_within_range(self) -> None:
        """Values within range unchanged."""
        assert clamp_trust(50) == 50
        assert clamp_trust(0) == 0
        assert clamp_trust(100) == 100

    def test_clamp_below_minimum(self) -> None:
        """Negative values clamped to 0."""
        assert clamp_trust(-10) == 0
        assert clamp_trust(-100) == 0

    def test_clamp_above_maximum(self) -> None:
        """Values above 100 clamped to 100."""
        assert clamp_trust(110) == 100
        assert clamp_trust(200) == 100


class TestParseTriggerCondition:
    """Tests for parse_trigger_condition function."""

    def test_parse_trust_greater_than(self) -> None:
        """Parse trust>N condition."""
        conditions = parse_trigger_condition("trust>70")
        assert len(conditions) == 1
        assert conditions[0]["type"] == "and_group"
        assert conditions[0]["conditions"][0]["type"] == "trust"
        assert conditions[0]["conditions"][0]["operator"] == ">"
        assert conditions[0]["conditions"][0]["value"] == 70

    def test_parse_trust_less_than(self) -> None:
        """Parse trust<N condition."""
        conditions = parse_trigger_condition("trust<30")
        assert len(conditions) == 1
        assert conditions[0]["conditions"][0]["operator"] == "<"
        assert conditions[0]["conditions"][0]["value"] == 30

    def test_parse_evidence_condition(self) -> None:
        """Parse evidence:X condition."""
        conditions = parse_trigger_condition("evidence:frost_pattern")
        assert len(conditions) == 1
        assert conditions[0]["conditions"][0]["type"] == "evidence"
        assert conditions[0]["conditions"][0]["value"] == "frost_pattern"

    def test_parse_or_condition(self) -> None:
        """Parse OR conditions."""
        conditions = parse_trigger_condition("evidence:frost_pattern OR trust>70")
        assert len(conditions) == 2  # Two OR groups

    def test_parse_and_condition(self) -> None:
        """Parse AND conditions."""
        conditions = parse_trigger_condition("evidence:frost_pattern AND trust>60")
        assert len(conditions) == 1  # One AND group
        assert len(conditions[0]["conditions"]) == 2  # Two conditions in group


class TestCheckSecretTriggers:
    """Tests for check_secret_triggers function."""

    def test_trust_threshold_met(self) -> None:
        """Secret revealed when trust threshold met."""
        secret = {"id": "test", "trigger": "trust>70", "text": "Secret"}

        assert check_secret_triggers(secret, 80, []) is True
        assert check_secret_triggers(secret, 70, []) is False  # Not greater than
        assert check_secret_triggers(secret, 50, []) is False

    def test_evidence_trigger_met(self) -> None:
        """Secret revealed when evidence discovered."""
        secret = {"id": "test", "trigger": "evidence:frost_pattern", "text": "Secret"}

        assert check_secret_triggers(secret, 50, ["frost_pattern"]) is True
        assert check_secret_triggers(secret, 50, ["hidden_note"]) is False
        assert check_secret_triggers(secret, 50, []) is False

    def test_or_trigger_any_met(self) -> None:
        """Secret revealed if any OR condition met."""
        secret = {"id": "test", "trigger": "evidence:frost_pattern OR trust>70", "text": "Secret"}

        # Evidence alone
        assert check_secret_triggers(secret, 50, ["frost_pattern"]) is True
        # Trust alone
        assert check_secret_triggers(secret, 80, []) is True
        # Neither
        assert check_secret_triggers(secret, 50, []) is False

    def test_and_trigger_all_required(self) -> None:
        """Secret revealed only if ALL AND conditions met."""
        secret = {"id": "test", "trigger": "evidence:frost_pattern AND trust>60", "text": "Secret"}

        # Both met
        assert check_secret_triggers(secret, 70, ["frost_pattern"]) is True
        # Only evidence
        assert check_secret_triggers(secret, 50, ["frost_pattern"]) is False
        # Only trust
        assert check_secret_triggers(secret, 70, []) is False
        # Neither
        assert check_secret_triggers(secret, 50, []) is False


class TestGetAvailableSecrets:
    """Tests for get_available_secrets function."""

    def test_returns_triggered_secrets(self) -> None:
        """Returns secrets whose triggers are met."""
        witness = {
            "secrets": [
                {"id": "secret1", "trigger": "trust>70", "text": "Text 1"},
                {"id": "secret2", "trigger": "evidence:hidden_note", "text": "Text 2"},
                {"id": "secret3", "trigger": "trust>90", "text": "Text 3"},
            ]
        }

        available = get_available_secrets(witness, 80, ["hidden_note"])

        assert len(available) == 2
        secret_ids = [s["id"] for s in available]
        assert "secret1" in secret_ids  # trust>70 met (80)
        assert "secret2" in secret_ids  # evidence:hidden_note met
        assert "secret3" not in secret_ids  # trust>90 not met (80)

    def test_no_secrets_available(self) -> None:
        """Returns empty list if no triggers met."""
        witness = {
            "secrets": [
                {"id": "secret1", "trigger": "trust>90", "text": "Text 1"},
            ]
        }

        available = get_available_secrets(witness, 50, [])
        assert available == []


class TestShouldLie:
    """Tests for should_lie function."""

    def test_lie_when_trust_low_and_topic_matches(self) -> None:
        """Witness lies when trust is low and question matches topic."""
        witness = {
            "lies": [
                {
                    "condition": "trust<30",
                    "topics": ["where were you", "that night"],
                    "response": "I was in the common room.",
                }
            ]
        }

        lie = should_lie(witness, "Where were you that night?", 20)
        assert lie is not None
        assert lie["response"] == "I was in the common room."

    def test_no_lie_when_trust_high(self) -> None:
        """No lie when trust is above threshold."""
        witness = {
            "lies": [
                {
                    "condition": "trust<30",
                    "topics": ["where were you"],
                    "response": "I was in the common room.",
                }
            ]
        }

        lie = should_lie(witness, "Where were you?", 50)
        assert lie is None

    def test_no_lie_when_topic_not_matched(self) -> None:
        """No lie when question doesn't match any topic."""
        witness = {
            "lies": [
                {
                    "condition": "trust<30",
                    "topics": ["draco", "malfoy"],
                    "response": "I didn't see Draco.",
                }
            ]
        }

        lie = should_lie(witness, "What's your favorite book?", 20)
        assert lie is None


class TestDetectEvidencePresentation:
    """Tests for detect_evidence_presentation function."""

    def test_detect_show_pattern(self) -> None:
        """Detect 'show X' pattern."""
        assert detect_evidence_presentation("I show the note to you") == "note"
        assert detect_evidence_presentation("show frost_pattern") == "frost_pattern"

    def test_detect_present_pattern(self) -> None:
        """Detect 'present X' pattern."""
        assert detect_evidence_presentation("I present the evidence") == "evidence"
        assert detect_evidence_presentation("present wand_signature") == "wand_signature"

    def test_detect_with_article(self) -> None:
        """Detect patterns with 'the' article."""
        assert detect_evidence_presentation("show the hidden_note") == "hidden_note"
        assert detect_evidence_presentation("present the frost_pattern") == "frost_pattern"

    def test_no_evidence_presentation(self) -> None:
        """Return None if no evidence presentation detected."""
        assert detect_evidence_presentation("Where were you?") is None
        assert detect_evidence_presentation("Tell me more") is None

    def test_case_insensitive(self) -> None:
        """Detection is case-insensitive."""
        assert detect_evidence_presentation("SHOW THE NOTE") == "note"
        assert detect_evidence_presentation("Present Evidence") == "evidence"
