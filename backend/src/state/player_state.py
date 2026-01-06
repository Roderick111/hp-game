"""Player state models.

Tracks investigation progress:
- Discovered evidence
- Visited locations
- Conversation history
- Witness interrogation states
- Submitted verdict
"""
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from pydantic import BaseModel, Field


def _utc_now() -> datetime:
    """Get current UTC datetime."""
    return datetime.now(UTC)


class ConversationItem(BaseModel):
    """Single conversation exchange with witness."""

    question: str
    response: str
    timestamp: datetime = Field(default_factory=_utc_now)
    trust_delta: int = 0


class VerdictAttempt(BaseModel):
    """Single verdict attempt."""

    accused_suspect_id: str
    reasoning: str
    evidence_cited: list[str] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=_utc_now)
    correct: bool
    score: int
    fallacies_detected: list[str] = Field(default_factory=list)


class VerdictState(BaseModel):
    """Verdict submission state."""

    case_id: str
    attempts: list[VerdictAttempt] = Field(default_factory=list)
    attempts_remaining: int = 10
    case_solved: bool = False
    final_verdict: VerdictAttempt | None = None

    def add_attempt(
        self,
        accused_id: str,
        reasoning: str,
        evidence_cited: list[str],
        correct: bool,
        score: int,
        fallacies: list[str],
    ) -> None:
        """Add verdict attempt.

        Args:
            accused_id: Who player accused
            reasoning: Player's reasoning text
            evidence_cited: Evidence IDs player selected
            correct: Whether verdict was correct
            score: Reasoning quality score
            fallacies: Fallacies detected in reasoning
        """
        attempt = VerdictAttempt(
            accused_suspect_id=accused_id,
            reasoning=reasoning,
            evidence_cited=evidence_cited,
            correct=correct,
            score=score,
            fallacies_detected=fallacies,
        )
        self.attempts.append(attempt)
        self.attempts_remaining -= 1

        if correct:
            self.case_solved = True
            self.final_verdict = attempt

    def get_attempt_count(self) -> int:
        """Get number of attempts made."""
        return len(self.attempts)


class WitnessState(BaseModel):
    """State tracking for a specific witness interrogation."""

    witness_id: str
    trust: int
    conversation_history: list[ConversationItem] = Field(default_factory=list)
    secrets_revealed: list[str] = Field(default_factory=list)

    def add_conversation(
        self,
        question: str,
        response: str,
        trust_delta: int = 0,
    ) -> None:
        """Add conversation exchange to history."""
        self.conversation_history.append(
            ConversationItem(
                question=question,
                response=response,
                trust_delta=trust_delta,
            )
        )

    def reveal_secret(self, secret_id: str) -> None:
        """Mark secret as revealed (deduplicated)."""
        if secret_id not in self.secrets_revealed:
            self.secrets_revealed.append(secret_id)

    def adjust_trust(self, delta: int) -> None:
        """Adjust trust level (clamped 0-100)."""
        self.trust = max(0, min(100, self.trust + delta))

    def get_history_as_dicts(self) -> list[dict[str, Any]]:
        """Get conversation history as list of dicts for prompt building."""
        return [
            {"question": item.question, "response": item.response}
            for item in self.conversation_history
        ]


class PlayerState(BaseModel):
    """Player investigation state."""

    state_id: str = Field(default_factory=lambda: str(uuid4()))
    case_id: str
    current_location: str = "great_hall"
    discovered_evidence: list[str] = Field(default_factory=list)
    visited_locations: list[str] = Field(default_factory=list)
    conversation_history: list[dict[str, Any]] = Field(default_factory=list)
    witness_states: dict[str, WitnessState] = Field(default_factory=dict)
    submitted_verdict: dict[str, str] | None = None
    verdict_state: VerdictState | None = None
    created_at: datetime = Field(default_factory=_utc_now)
    updated_at: datetime = Field(default_factory=_utc_now)

    def add_evidence(self, evidence_id: str) -> None:
        """Add discovered evidence (deduplicated)."""
        if evidence_id not in self.discovered_evidence:
            self.discovered_evidence.append(evidence_id)
            self.updated_at = _utc_now()

    def visit_location(self, location_id: str) -> None:
        """Track visited location."""
        self.current_location = location_id
        if location_id not in self.visited_locations:
            self.visited_locations.append(location_id)
        self.updated_at = _utc_now()

    def get_witness_state(self, witness_id: str, base_trust: int = 50) -> WitnessState:
        """Get or create witness state.

        Args:
            witness_id: Witness identifier
            base_trust: Initial trust if creating new state

        Returns:
            WitnessState for the witness
        """
        if witness_id not in self.witness_states:
            self.witness_states[witness_id] = WitnessState(
                witness_id=witness_id,
                trust=base_trust,
            )
            self.updated_at = _utc_now()

        return self.witness_states[witness_id]

    def update_witness_state(self, witness_state: WitnessState) -> None:
        """Update witness state in player state.

        Args:
            witness_state: Updated witness state
        """
        self.witness_states[witness_state.witness_id] = witness_state
        self.updated_at = _utc_now()
