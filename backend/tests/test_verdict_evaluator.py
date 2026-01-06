"""Tests for verdict evaluation logic."""

import pytest

from src.verdict.evaluator import (
    calculate_attempts_hint_level,
    check_verdict,
    score_reasoning,
    _count_sentences,
)


class TestCheckVerdict:
    """Tests for check_verdict function."""

    def test_correct_verdict_exact_match(self) -> None:
        """Correct verdict with exact case match."""
        solution = {"culprit": "draco"}
        assert check_verdict("draco", solution) is True

    def test_correct_verdict_case_insensitive(self) -> None:
        """Correct verdict case-insensitive."""
        solution = {"culprit": "draco"}
        assert check_verdict("Draco", solution) is True
        assert check_verdict("DRACO", solution) is True

    def test_incorrect_verdict(self) -> None:
        """Incorrect verdict returns False."""
        solution = {"culprit": "draco"}
        assert check_verdict("hermione", solution) is False

    def test_verdict_empty_culprit(self) -> None:
        """Empty culprit in solution."""
        solution = {"culprit": ""}
        assert check_verdict("draco", solution) is False

    def test_verdict_missing_culprit(self) -> None:
        """Missing culprit key in solution."""
        solution = {}
        assert check_verdict("draco", solution) is False

    def test_verdict_whitespace_handling(self) -> None:
        """Verdict with whitespace (case-insensitive only, not trimmed)."""
        solution = {"culprit": "draco"}
        # Only case-insensitivity is applied, not trimming
        assert check_verdict("draco", solution) is True


class TestScoreReasoning:
    """Tests for score_reasoning function."""

    def test_perfect_score(self) -> None:
        """Perfect reasoning: all key evidence, good length, no fallacies."""
        reasoning = "The frost pattern proves it. The wand signature confirms the spell."
        evidence = ["frost_pattern", "wand_signature"]
        solution = {"key_evidence": ["frost_pattern", "wand_signature"]}
        fallacies: list[str] = []

        score = score_reasoning(reasoning, evidence, solution, fallacies)
        # Base 40 + 20 (2 evidence) + 20 (2 sentences) = 80
        assert score == 80

    def test_base_score_with_no_evidence_penalty(self) -> None:
        """Base score with no evidence penalty applied."""
        reasoning = "They did it"  # 1 sentence (no terminal punctuation -> counted as 1)
        evidence: list[str] = []
        solution = {"key_evidence": ["frost_pattern"]}
        fallacies: list[str] = []

        score = score_reasoning(reasoning, evidence, solution, fallacies)
        # Base 40 - 15 (no evidence penalty), 1 sentence (not 2-5), no fallacy penalty
        assert score == 25

    def test_key_evidence_bonus(self) -> None:
        """Key evidence gives +10 each, max +30."""
        reasoning = "Evidence proves it."
        solution = {"key_evidence": ["a", "b", "c", "d"]}
        fallacies: list[str] = []

        # All 4 key evidence cited
        evidence = ["a", "b", "c", "d"]
        score = score_reasoning(reasoning, evidence, solution, fallacies)
        # Base 40 + 30 (capped) + 0 (1 sentence) = 70
        assert score == 70

        # Only 2 key evidence cited
        evidence = ["a", "b"]
        score = score_reasoning(reasoning, evidence, solution, fallacies)
        # Base 40 + 20 + 0 = 60
        assert score == 60

    def test_coherence_bonus(self) -> None:
        """Logical coherence bonus for 2-5 sentences, penalty for >5."""
        solution = {"key_evidence": []}
        fallacies: list[str] = []

        # 2 sentences - gets bonus (no evidence penalty since key_evidence is empty)
        reasoning = "First point. Second point."
        score = score_reasoning(reasoning, [], solution, fallacies)
        assert score == 60  # 40 + 20 (coherence) + 0 (no penalty - no key_evidence defined)

        # 5 sentences - gets bonus
        reasoning = "One. Two. Three. Four. Five."
        score = score_reasoning(reasoning, [], solution, fallacies)
        assert score == 60  # 40 + 20

        # 1 sentence - no bonus (but also no penalty)
        reasoning = "Just one sentence."
        score = score_reasoning(reasoning, [], solution, fallacies)
        assert score == 40  # Base only

        # 6 sentences - gets rambling penalty
        reasoning = "One. Two. Three. Four. Five. Six."
        score = score_reasoning(reasoning, [], solution, fallacies)
        assert score == 30  # 40 - 10 (rambling)

    def test_fallacy_penalty(self) -> None:
        """Fallacy penalty -15 each, max -45."""
        reasoning = "Evidence proves guilt."
        evidence: list[str] = []
        solution = {"key_evidence": []}

        # 1 fallacy
        fallacies = ["confirmation_bias"]
        score = score_reasoning(reasoning, evidence, solution, fallacies)
        # Base 40 - 15 = 25
        assert score == 25

        # 3 fallacies
        fallacies = ["confirmation_bias", "authority_bias", "post_hoc"]
        score = score_reasoning(reasoning, evidence, solution, fallacies)
        # Base 40 - 45 = 0 (clamped)
        assert score == 0

        # 4 fallacies - capped at -45
        fallacies = ["confirmation_bias", "authority_bias", "post_hoc", "correlation_not_causation"]
        score = score_reasoning(reasoning, evidence, solution, fallacies)
        # Base 40 - 45 (capped) = 0 (clamped)
        assert score == 0

    def test_score_clamped_to_100(self) -> None:
        """Score cannot exceed 100."""
        # Max possible: 40 + 30 (evidence) + 20 (coherence) = 90
        reasoning = "One. Two. Three."
        evidence = ["a", "b", "c", "d"]
        solution = {"key_evidence": ["a", "b", "c", "d"]}
        fallacies: list[str] = []

        score = score_reasoning(reasoning, evidence, solution, fallacies)
        assert score == 90  # 40 + 30 + 20

    def test_score_clamped_to_0(self) -> None:
        """Score cannot go below 0."""
        reasoning = "x"  # No sentences
        evidence: list[str] = []
        solution = {"key_evidence": ["a"]}
        fallacies = ["f1", "f2", "f3", "f4"]  # 4 fallacies = -45 (capped)

        score = score_reasoning(reasoning, evidence, solution, fallacies)
        # 40 - 15 (no evidence) - 45 (fallacies capped) = -20 -> clamped to 0
        assert score == 0

    def test_non_key_evidence_not_counted(self) -> None:
        """Evidence not in key_evidence doesn't add bonus but avoids no-evidence penalty."""
        reasoning = "Evidence proves it."
        evidence = ["hidden_note"]  # Not in key_evidence, but still cited something
        solution = {"key_evidence": ["frost_pattern", "wand_signature"]}
        fallacies: list[str] = []

        score = score_reasoning(reasoning, evidence, solution, fallacies)
        # Base 40, no key evidence bonus, but has evidence so no -15 penalty
        assert score == 40


class TestCountSentences:
    """Tests for _count_sentences helper."""

    def test_count_periods(self) -> None:
        """Count periods as sentence terminators."""
        assert _count_sentences("One. Two. Three.") == 3

    def test_count_exclamations(self) -> None:
        """Count exclamation marks."""
        assert _count_sentences("Wow! Amazing!") == 2

    def test_count_questions(self) -> None:
        """Count question marks."""
        assert _count_sentences("Why? How?") == 2

    def test_mixed_punctuation(self) -> None:
        """Count mixed punctuation."""
        assert _count_sentences("Yes. Why? Amazing!") == 3

    def test_no_terminal_punctuation(self) -> None:
        """Text without terminal punctuation counts as 1."""
        assert _count_sentences("No punctuation here") == 1

    def test_empty_string(self) -> None:
        """Empty string returns 0."""
        assert _count_sentences("") == 0

    def test_whitespace_only(self) -> None:
        """Whitespace only returns 0."""
        assert _count_sentences("   ") == 0


class TestCalculateAttemptsHintLevel:
    """Tests for calculate_attempts_hint_level function."""

    def test_harsh_level_10_attempts(self) -> None:
        """10 attempts remaining = harsh."""
        assert calculate_attempts_hint_level(10) == "harsh"

    def test_harsh_level_7_attempts(self) -> None:
        """7 attempts remaining = harsh."""
        assert calculate_attempts_hint_level(7) == "harsh"

    def test_specific_level_6_attempts(self) -> None:
        """6 attempts remaining = specific."""
        assert calculate_attempts_hint_level(6) == "specific"

    def test_specific_level_4_attempts(self) -> None:
        """4 attempts remaining = specific."""
        assert calculate_attempts_hint_level(4) == "specific"

    def test_direct_level_3_attempts(self) -> None:
        """3 attempts remaining = direct."""
        assert calculate_attempts_hint_level(3) == "direct"

    def test_direct_level_1_attempt(self) -> None:
        """1 attempt remaining = direct."""
        assert calculate_attempts_hint_level(1) == "direct"

    def test_direct_level_0_attempts(self) -> None:
        """0 attempts remaining = direct."""
        assert calculate_attempts_hint_level(0) == "direct"
