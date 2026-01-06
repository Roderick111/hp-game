"""Verdict evaluation module for case resolution."""

from .evaluator import (
    calculate_attempts_hint_level,
    check_verdict,
    score_reasoning,
)
from .fallacies import detect_fallacies

__all__ = [
    "check_verdict",
    "score_reasoning",
    "calculate_attempts_hint_level",
    "detect_fallacies",
]
