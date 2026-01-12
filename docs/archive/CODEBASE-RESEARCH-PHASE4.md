# Codebase Pattern Research: Phase 4 - Tom's Inner Voice System
**Date**: 2026-01-08
**Feature**: Tom's Ghost - 50% helpful / 50% misleading inner voice with three-tier trigger system
**Analysis Scope**: Evidence trigger parsing, state tracking, random selection, modal/toast UI, YAML structures

---

## Directory Structure

```
backend/src/
  ├── case_store/
  │   ├── loader.py          # YAML loading + evidence parsing
  │   └── case_001.yaml      # Complete case definition with triggers
  ├── context/
  │   ├── witness.py         # Witness prompts + secret evaluation
  │   ├── briefing.py        # Moody dialogue prompts
  │   └── rationality_context.py  # Concept references
  ├── state/
  │   └── player_state.py    # State models (WitnessState, BriefingState, etc.)
  ├── utils/
  │   ├── trust.py           # Trigger parsing + evaluation (CRITICAL for Tom)
  │   └── evidence.py        # Evidence matching utilities
  └── api/
      └── routes.py          # API endpoints (briefing, witness, verdict)

frontend/src/
  ├── components/
  │   ├── ui/
  │   │   └── Modal.tsx      # Base modal component (terminal variant)
  │   ├── BriefingModal.tsx  # Modal UI pattern (dialogue feed)
  │   ├── EvidenceModal.tsx  # Evidence modal pattern
  │   └── BriefingMessage.tsx # Message component (reusable)
  ├── hooks/
  │   └── useBriefing.ts     # State management + API integration
  ├── types/
  │   └── investigation.ts   # TypeScript interfaces
  └── api/
      └── client.ts          # API client methods
```

**Naming Convention**: `snake_case` for Python files/functions, `PascalCase` for React components
**File Organization**: Vertical slice architecture (by feature, not by type)

---

## Pattern 1: Evidence Trigger System (Confidence: 9/10)

### Location
`backend/src/utils/trust.py` (lines 86-207)
`backend/src/case_store/case_001.yaml` (secrets section)

### Pattern Overview
Complex condition parsing supporting OR/AND logic with trust thresholds and evidence requirements.
Used for witness secrets - directly applicable to Tom's trigger system.

### Core Implementation

```python
# From: backend/src/utils/trust.py

def parse_trigger_condition(trigger: str) -> list[dict[str, Any]]:
    """Parse trigger string into evaluable conditions.

    Supports:
    - "trust>N" or "trust<N" (trust threshold)
    - "evidence:X" (requires evidence)
    - "AND" / "OR" operators

    Args:
        trigger: Trigger string (e.g., "evidence:frost_pattern OR trust>70")

    Returns:
        List of condition dicts with type, operator, value
    """
    conditions: list[dict[str, Any]] = []

    # Split by OR first (lower precedence)
    or_parts = re.split(r"\s+OR\s+", trigger, flags=re.IGNORECASE)

    for or_part in or_parts:
        # Split by AND (higher precedence)
        and_parts = re.split(r"\s+AND\s+", or_part, flags=re.IGNORECASE)
        and_conditions: list[dict[str, Any]] = []

        for part in and_parts:
            part = part.strip()

            # Parse trust condition: trust>N or trust<N
            trust_match = re.match(r"trust\s*([<>])\s*(\d+)", part, re.IGNORECASE)
            if trust_match:
                and_conditions.append(
                    {
                        "type": "trust",
                        "operator": trust_match.group(1),
                        "value": int(trust_match.group(2)),
                    }
                )
                continue

            # Parse evidence condition: evidence:X
            evidence_match = re.match(r"evidence:(\w+)", part, re.IGNORECASE)
            if evidence_match:
                and_conditions.append(
                    {
                        "type": "evidence",
                        "value": evidence_match.group(1),
                    }
                )
                continue

        if and_conditions:
            conditions.append(
                {
                    "type": "and_group",
                    "conditions": and_conditions,
                }
            )

    return conditions


def evaluate_condition(
    condition: dict[str, Any],
    trust: int,
    discovered_evidence: list[str],
) -> bool:
    """Evaluate a single parsed condition.

    Args:
        condition: Parsed condition dict
        trust: Current trust level
        discovered_evidence: List of discovered evidence IDs

    Returns:
        True if condition is met
    """
    cond_type = condition.get("type")

    if cond_type == "trust":
        operator = condition.get("operator")
        threshold = condition.get("value", 0)

        if operator == ">":
            return trust > threshold
        elif operator == "<":
            return trust < threshold

    elif cond_type == "evidence":
        evidence_id = condition.get("value", "")
        return evidence_id in discovered_evidence

    elif cond_type == "and_group":
        # All conditions in AND group must be true
        sub_conditions = condition.get("conditions", [])
        return all(evaluate_condition(c, trust, discovered_evidence) for c in sub_conditions)

    return False


def check_secret_triggers(
    secret: dict[str, Any],
    trust: int,
    discovered_evidence: list[str],
) -> bool:
    """Check if secret trigger conditions are met.

    Args:
        secret: Secret dict with 'trigger' field
        trust: Current trust level (0-100)
        discovered_evidence: List of discovered evidence IDs

    Returns:
        True if trigger conditions are met and secret should be revealed
    """
    trigger = secret.get("trigger", "")
    if not trigger:
        return False

    conditions = parse_trigger_condition(trigger)

    # OR logic: any condition group being true triggers the secret
    return any(evaluate_condition(cond, trust, discovered_evidence) for cond in conditions)
```

### YAML Structure Example

```yaml
# From: backend/src/case_store/case_001.yaml (lines 113-150)

witnesses:
  - id: "hermione"
    name: "Hermione Granger"
    base_trust: 50

    secrets:
      - id: "saw_draco"
        trigger: "evidence:frost_pattern OR trust>70"
        text: |
          I saw Draco Malfoy near the window at 9:00pm. He was casting
          something - the frost pattern on the glass looked just like his
          wand signature. I didn't say anything because... I was afraid
          of retaliation.

      - id: "borrowed_restricted_book"
        trigger: "trust>80"
        text: |
          I... I borrowed a restricted dark arts book two days ago. I needed
          it for my Defence Against the Dark Arts essay. I know it's wrong,
          but the library was supposed to be locked that night. I returned
          it before the incident.
```

### Adaptation for Tom's Triggers

**Key differences for Tom system**:
1. Add `evidence_count` condition type (instead of specific evidence IDs)
   - Support: `evidence_count>N`, `evidence_count<N`, `evidence_count==N`
2. Add `fired_triggers` tracking (witness secrets don't repeat, but Tom can return)
3. Extend condition types:
   - `tier: "1|2|3"` - explicit tier specification
   - `rare_chance: "5|3|2"` - percentage-based rare triggers

**New condition types to parse**:
```
evidence_count>5          # Tier 3: Strong evidence base
evidence_count>2          # Tier 2: Some evidence
evidence_count==0         # Tier 1: No evidence yet
rare_chance:5             # 5% chance (rare self-aware moments)
suspect_accused AND evidence_count<3   # Complex: AND suspects
```

**Tom trigger parsing signature**:
```python
def parse_tom_trigger_condition(trigger: str) -> list[dict[str, Any]]:
    """Extended version supporting evidence_count, rare_chance, etc."""
    # Extends parse_trigger_condition logic
    pass

def check_tom_trigger(
    trigger: dict[str, Any],
    evidence_count: int,
    fired_triggers: list[str],
    random_chance: float = random.random(),
) -> bool:
    """Evaluate if Tom trigger should fire."""
    # Returns True if condition met AND not already fired AND (not rare OR passes random check)
    pass
```

### Integration Points

- **API Route**: Need new endpoint `/api/inner-voice/{case_id}` (POST)
- **State Storage**: Extend `PlayerState` with `InnerVoiceState` (fired_triggers, last_fired_at)
- **Condition Evaluation**: Reuse `parse_trigger_condition`, extend `evaluate_condition`

---

## Pattern 2: State Tracking (Confidence: 9/10)

### Location
`backend/src/state/player_state.py` (lines 1-157)

### Pattern Overview
Nested state models with Pydantic BaseModel. Each state type (conversation, verdict, briefing) tracks its own data with methods for updates.

### Core Model Structures

```python
# From: backend/src/state/player_state.py

class ConversationItem(BaseModel):
    """Single conversation exchange with witness."""

    question: str
    response: str
    timestamp: datetime = Field(default_factory=_utc_now)
    trust_delta: int = 0


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
        """Add verdict attempt."""
        attempt = VerdictAttempt(...)
        self.attempts.append(attempt)
        self.attempts_remaining -= 1

        if correct:
            self.case_solved = True
            self.final_verdict = attempt


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
        """Add Q&A exchange to conversation history."""
        self.conversation_history.append(
            ConversationItem(
                question=question,
                response=response,
                trust_delta=trust_delta,
            )
        )


class BriefingState(BaseModel):
    """State for intro briefing with Mad-Eye Moody.

    Tracks:
    - Briefing completion status
    - Q&A conversation history
    - Completion timestamp
    """

    case_id: str
    briefing_completed: bool = False
    conversation_history: list[dict[str, str]] = Field(default_factory=list)
    completed_at: datetime | None = None

    def add_question(self, question: str, answer: str) -> None:
        """Add Q&A exchange to conversation history."""
        self.conversation_history.append({"question": question, "answer": answer})

    def mark_complete(self) -> None:
        """Mark briefing as completed."""
        self.briefing_completed = True
        self.completed_at = _utc_now()
```

### Tom's Inner Voice State Model

**New state class needed**:
```python
class TomTriggerRecord(BaseModel):
    """Single Tom inner voice trigger."""

    trigger_id: str
    text: str
    type: str  # "helpful" | "misleading" | "self_aware" | "dark_humor" | "emotional"
    tier: int  # 1 | 2 | 3
    timestamp: datetime = Field(default_factory=_utc_now)
    evidence_count_at_fire: int  # For debugging


class InnerVoiceState(BaseModel):
    """State for Tom's inner voice system.

    Tracks:
    - Fired triggers (no repeats)
    - Conversation instances with Tom
    - Investigation statistics
    """

    case_id: str
    fired_triggers: list[str] = Field(default_factory=list)  # trigger IDs already fired
    trigger_history: list[TomTriggerRecord] = Field(default_factory=list)
    total_interruptions: int = 0
    last_interruption_at: datetime | None = None

    def fire_trigger(self, trigger_id: str, text: str, trigger_type: str, tier: int, evidence_count: int) -> None:
        """Record a fired trigger."""
        self.fired_triggers.append(trigger_id)
        self.trigger_history.append(
            TomTriggerRecord(
                trigger_id=trigger_id,
                text=text,
                type=trigger_type,
                tier=tier,
                evidence_count_at_fire=evidence_count,
            )
        )
        self.total_interruptions += 1
        self.last_interruption_at = _utc_now()

    def has_fired(self, trigger_id: str) -> bool:
        """Check if trigger already fired."""
        return trigger_id in self.fired_triggers

    def get_last_n_triggers(self, n: int = 5) -> list[TomTriggerRecord]:
        """Get recent trigger history."""
        return self.trigger_history[-n:]
```

**Extend PlayerState**:
```python
class PlayerState(BaseModel):
    """Master state for entire investigation."""

    # ... existing fields ...
    inner_voice_state: InnerVoiceState | None = None

    def get_inner_voice_state(self) -> InnerVoiceState:
        """Get or create inner voice state."""
        if self.inner_voice_state is None:
            self.inner_voice_state = InnerVoiceState(case_id=self.case_id)
        return self.inner_voice_state
```

### Integration Points

- **State Persistence**: Save/load with existing `save_state()` / `load_state()` functions
- **API Response Models**: New `InnerVoiceResponse` with `text`, `type`, `tier`
- **Frontend State**: Track in React via hook (similar to `useBriefing`)

---

## Pattern 3: Random Selection Logic (Confidence: 8/10)

### Location
`frontend/src/hooks/useBriefing.ts` (lines 101-112)
`backend/src/api/routes.py` (lines 1174-1213, briefing choice selection)

### Pattern Overview
Frontend selects choice via callback, backend returns pre-written response. No randomization on backend.
Teaching question choices are statically defined in YAML - selection is deterministic.

### Frontend Implementation

```typescript
// From: frontend/src/hooks/useBriefing.ts

const selectChoice = useCallback(
  (choiceId: string) => {
    if (!briefing) return;

    const choice = briefing.teaching_question.choices.find((c) => c.id === choiceId);
    if (choice) {
      setSelectedChoice(choiceId);
      setChoiceResponse(choice.response);  // Immediate feedback (no API call)
    }
  },
  [briefing]
);
```

### YAML Structure for Choices

```yaml
# From: backend/src/case_store/case_001.yaml (lines 354-387)

teaching_question:
  prompt: |
    Before you start, recruit - a question:

    Out of 100 school incidents ruled "accidents," how many actually ARE accidents?

  choices:
    - id: "25_percent"
      text: "25%"
      response: |
        *eye narrows* Too low. You're being paranoid. Not everything's a conspiracy.
        85% ARE accidents. Hogwarts is dangerous - staircases move, potions explode.

    - id: "50_percent"
      text: "50%"
      response: |
        Not quite. You're guessing, not deducing.
        85% ARE accidents. Start with what's LIKELY, then let evidence move you.

    - id: "85_percent"
      text: "85%"
      response: |
        *nods* Correct. 85%. Hogwarts is dangerous. Most accidents ARE accidents.
        START THERE. Don't chase dramatic theories before ruling out the obvious.

    - id: "almost_all"
      text: "Almost all (95%+)"
      response: |
        Close, but overcorrecting. 85% is the number.
        Base rates matter - start with likely scenarios, not rare conspiracies.

  concept_summary: |
    That's base rates, recruit. Always start with what's LIKELY,
    then let evidence move you. Not the other way around. Now investigate.
```

### Tom's Random Selection Pattern

**For Tom**: Need **random selection within tier** + **rare chance evaluation**.

**Backend approach (recommended)**:
```python
import random

def get_eligible_tom_triggers(
    all_triggers: list[dict[str, Any]],
    evidence_count: int,
    fired_triggers: list[str],
    suspect_accused: bool = False,
) -> list[dict[str, Any]]:
    """Get triggers that can fire based on current state.

    Returns: List of eligible triggers grouped by tier.
    """
    eligible_by_tier = {1: [], 2: [], 3: []}

    for trigger in all_triggers:
        if trigger["id"] in fired_triggers:
            continue  # Already fired

        if not _check_trigger_condition(trigger["condition"], evidence_count, suspect_accused):
            continue  # Condition not met

        tier = trigger.get("tier", 1)
        eligible_by_tier[tier].append(trigger)

    return eligible_by_tier


def select_tom_trigger(
    all_triggers: list[dict[str, Any]],
    evidence_count: int,
    fired_triggers: list[str],
    suspect_accused: bool = False,
) -> dict[str, Any] | None:
    """Select a Tom trigger to fire.

    1. Find highest tier with eligible triggers
    2. Check for rare trigger chance (5-10%)
    3. Random selection within tier
    4. Return None if no eligible triggers
    """
    eligible = get_eligible_tom_triggers(
        all_triggers, evidence_count, fired_triggers, suspect_accused
    )

    # Check highest tier first (3 > 2 > 1)
    for tier in [3, 2, 1]:
        if not eligible[tier]:
            continue

        # Filter for rare triggers if applicable
        rare_triggers = [t for t in eligible[tier] if t.get("is_rare", False)]
        regular_triggers = [t for t in eligible[tier] if not t.get("is_rare", False)]

        # 5% chance to pick rare trigger if available
        if rare_triggers and random.random() < 0.05:
            return random.choice(rare_triggers)

        # Otherwise pick regular trigger
        if regular_triggers:
            return random.choice(regular_triggers)

        # Fall back to rare if no regular
        if rare_triggers:
            return random.choice(rare_triggers)

    return None
```

### Integration Points

- **API Endpoint**: `POST /api/case/{case_id}/inner-voice/trigger`
- **Request**: Include `evidence_count`, `suspect_accused` (optional)
- **Response**: `InnerVoiceResponse` with `id`, `text`, `type`, `tier`
- **Frontend**: Display via Toast/Modal (see Pattern 4)

---

## Pattern 4: Modal/Toast UI Patterns (Confidence: 9/10)

### Location
`frontend/src/components/ui/Modal.tsx` (lines 1-83)
`frontend/src/components/BriefingModal.tsx` (lines 48-120+)
`frontend/src/components/EvidenceModal.tsx` (lines 33-83)

### Pattern Overview
Reusable `Modal` component with terminal variant support. BriefingModal shows dialogue feed pattern.
No toast library used - all UI is modal-based or inline.

### Base Modal Component

```typescript
// From: frontend/src/components/ui/Modal.tsx

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  /** Terminal variant for dark theme */
  variant?: 'default' | 'terminal';
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  variant = 'default',
}: ModalProps) {
  if (!isOpen) return null;

  const isTerminal = variant === 'terminal';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop - click to close */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div
        className={`relative rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border-2 ${
          isTerminal
            ? 'bg-gray-900 border-gray-700'
            : 'bg-parchment-50 border-amber-700'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Header */}
        <div
          className={`sticky top-0 px-6 py-4 border-b flex items-center justify-between ${
            isTerminal
              ? 'bg-gray-800 border-gray-700'
              : 'bg-amber-100 border-amber-300'
          }`}
        >
          {title && (
            <h2
              id="modal-title"
              className={`text-xl font-bold ${
                isTerminal
                  ? 'text-green-400 font-mono'
                  : 'text-amber-900 font-serif'
              }`}
            >
              {isTerminal ? `[${title}]` : title}
            </h2>
          )}
          <button
            onClick={onClose}
            className={`text-2xl font-bold ml-auto ${
              isTerminal
                ? 'text-gray-400 hover:text-gray-200'
                : 'text-amber-600 hover:text-amber-900'
            }`}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className={`p-6 ${isTerminal ? 'font-mono text-gray-100' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
```

### Briefing Modal Pattern (Reusable for Tom)

```typescript
// From: frontend/src/components/BriefingModal.tsx (simplified)

export function BriefingModal({
  briefing,
  conversation,
  selectedChoice,
  choiceResponse,
  onSelectChoice,
  onAskQuestion,
  onComplete,
  loading,
}: BriefingModalProps) {
  const [question, setQuestion] = useState('');

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!question.trim() || loading) return;

      const currentQuestion = question.trim();
      setQuestion('');
      await onAskQuestion(currentQuestion);
    },
    [question, loading, onAskQuestion]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        void handleSubmit(e as unknown as FormEvent);
      }
    },
    [handleSubmit]
  );

  return (
    <div className="bg-gray-900 rounded-lg p-6 font-mono max-h-[80vh] overflow-y-auto">
      {/* Dialogue Feed */}
      <div className="space-y-2">
        {/* Messages displayed as BriefingMessage components */}
        {conversation.map((item, i) => (
          <div key={i}>
            <BriefingMessage speaker="recruit" text={item.question} />
            <BriefingMessage speaker="moody" text={item.answer} />
          </div>
        ))}
      </div>

      {/* Question Input */}
      <form onSubmit={handleSubmit} className="mt-4">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Moody... (Ctrl+Enter to send)"
          className="w-full p-2 bg-gray-800 border border-gray-700 text-gray-100 rounded"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="mt-2 px-4 py-2 bg-green-900 text-green-400 rounded disabled:opacity-50"
        >
          {loading ? 'Waiting...' : 'Ask'}
        </button>
      </form>
    </div>
  );
}
```

### Tom Inner Voice Modal Pattern

**New component structure**:
```typescript
interface InnerVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: InnerVoiceMessage | null;
  loading?: boolean;
}

export function InnerVoiceModal({
  isOpen,
  onClose,
  message,
  loading = false,
}: InnerVoiceModalProps) {
  if (!isOpen || !message) return null;

  const typeStyles = {
    helpful: 'text-blue-300',
    misleading: 'text-yellow-300',
    self_aware: 'text-cyan-300',
    dark_humor: 'text-purple-300',
    emotional: 'text-red-300',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tom's Voice"
      variant="terminal"
    >
      <div className={`space-y-3 ${typeStyles[message.type]}`}>
        <div className="text-sm text-gray-400">[TIER {message.tier}]</div>
        <p className="text-sm leading-relaxed">{message.text}</p>
        <div className="text-xs text-gray-500">
          [{message.type.toUpperCase()}]
        </div>
      </div>
    </Modal>
  );
}
```

**Or as inline toast-like notification** (if modal feels too blocking):
```typescript
interface ToastNotificationProps {
  message: string;
  type: 'helpful' | 'misleading' | 'self_aware' | 'dark_humor' | 'emotional';
  duration?: number;  // ms to auto-dismiss
  onDismiss: () => void;
}

export function ToastNotification({
  message,
  type,
  duration = 5000,
  onDismiss,
}: ToastNotificationProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  // Render as fixed position notification (bottom right, terminal styled)
  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 bg-gray-800 border-2 border-gray-700 rounded max-w-sm">
      <div className="text-xs text-gray-400 mb-1">[TOM: {type.toUpperCase()}]</div>
      <p className="text-sm text-gray-100">{message}</p>
    </div>
  );
}
```

### Integration Points

- **Display Method**: Modal or Toast (recommendation: modal for clarity, matches briefing pattern)
- **Dismissal**: Click X button (modal) or auto-dismiss after 5s (toast)
- **Keyboard**: ESC to close modal (standard)
- **Position**: Center screen modal or bottom-right toast
- **Styling**: Use existing `terminal` variant (gray-900 bg, gray-700 borders, green-400 text)

---

## Pattern 5: YAML Structure (Confidence: 9/10)

### Location
`backend/src/case_store/case_001.yaml` (entire file)

### Pattern Overview
Hierarchical YAML structure with case section containing locations, witnesses, secrets, and briefing.
Each section uses similar nesting patterns for extensibility.

### Tom Triggers YAML Structure

**Add new section to case.yaml**:
```yaml
case:
  id: "case_001"
  title: "The Restricted Section"

  # ... existing locations, witnesses, solution ...

  # NEW: Tom's Inner Voice System (Phase 4)
  inner_voice:
    character: "Tom Thornfield"
    backstory: |
      Failed Auror recruit, died 1994. Wrong suspect conviction (Marcus Bellweather).
      Haunts the Academy. 50% helpful, 50% misleading.

    base_trust: 50  # Player opinion of Tom (optional, for future expansion)

    triggers:
      tier_3:  # Strong evidence base (6+ pieces OR critical)
        - id: "critical_found_helpful"
          condition: "evidence_count>5"
          type: "helpful"
          is_rare: false
          text: |
            That's significant. Does this confirm your theory, or does it contradict it? Be honest.

        - id: "critical_found_misleading"
          condition: "evidence_count>5"
          type: "misleading"
          is_rare: false
          text: |
            There it is. That's the evidence that cracks the case. Everything else supports this.

        - id: "marcus_regret"
          condition: "evidence_count>6"
          type: "emotional"
          is_rare: true  # 5% chance trigger
          text: |
            You know... Marcus Bellweather's still in Azkaban. 15 years.
            For something he didn't do. Because I was so certain, so blind.
            Don't make my mistake. Certainty is a cage.

      tier_2:  # Some relevant evidence (3-5 pieces)
        - id: "matching_witnesses_helpful"
          condition: "evidence_count>2"
          type: "helpful"
          is_rare: false
          text: |
            Two witnesses, same story. Did they see it independently? Or did they talk to each other first?

        - id: "matching_witnesses_misleading"
          condition: "evidence_count>2"
          type: "misleading"
          is_rare: false
          text: |
            Two witnesses corroborating each other. That's solid testimony. Multiple independent sources.

        - id: "dark_humor_1"
          condition: "evidence_count>3"
          type: "dark_humor"
          is_rare: true  # 3% chance trigger
          text: |
            You know what's funny? I investigated three cases. Got two wrong, died on the third.
            And here you are, one room, probably gonna solve it. Some of us are just natural disasters.

      tier_1:  # Minimal evidence (0-2 pieces)
        - id: "first_clue"
          condition: "evidence_count==1"
          type: "helpful"
          is_rare: false
          text: |
            First piece of evidence. What does it actually prove? That someone was here? When? Why?

        - id: "first_clue_misleading"
          condition: "evidence_count==1"
          type: "misleading"
          is_rare: false
          text: |
            Good find! That's usually enough to point you toward the right suspect.

        - id: "self_aware_1"
          condition: "evidence_count==0"
          type: "self_aware"
          is_rare: true  # 5% chance trigger
          text: |
            I'm a ghost haunting a school because I was too confident to think straight.
            Funny that. Moody can't even see me. Pretty sure he's relieved.

# End of inner_voice section
```

### Trigger Condition Syntax

**Supported conditions**:
```yaml
# Simple evidence count conditions
condition: "evidence_count>5"      # Tier 3
condition: "evidence_count>2"      # Tier 2
condition: "evidence_count==1"     # Tier 1
condition: "evidence_count==0"     # Starting state

# Combined conditions (AND)
condition: "evidence_count>4 AND suspect_accused"

# Combined conditions (OR) - for future expansion
condition: "evidence_count>5 OR critical_evidence"

# Trust-based (if needed)
condition: "evidence_count>3 AND player_trust>50"
```

### Structure Notes

1. **Tiers are explicit** in YAML (tier_1, tier_2, tier_3)
   - Backend iterates through tiers in order [3, 2, 1]
   - First tier with eligible triggers is selected

2. **is_rare flag** indicates special triggers (5-10% chance)
   - Triggers like Marcus regret, dark humor, self-aware moments
   - Filtered separately in selection logic

3. **type field** determines UI styling
   - Values: `helpful`, `misleading`, `self_aware`, `dark_humor`, `emotional`
   - Frontend uses for color/styling in modal

4. **No state tracking in YAML**
   - Fired triggers tracked in `PlayerState.inner_voice_state.fired_triggers`
   - YAML is read-only reference
   - Backend checks `fired_triggers` list during selection

### Tom vs Witness Secrets Key Differences

```yaml
# WITNESS SECRETS (existing pattern)
witness.secrets:
  - id: "saw_draco"
    trigger: "evidence:frost_pattern OR trust>70"  # Trust-based
    text: |
      I saw Draco Malfoy...

# TOM TRIGGERS (new pattern)
inner_voice.triggers:
  - id: "critical_found_helpful"
    condition: "evidence_count>5"  # Count-based, not specific evidence
    type: "helpful"               # NEW: type field for UI styling
    is_rare: false               # NEW: rare chance indicator
    text: |
      That's significant...
```

---

## Architectural Patterns

### Evidence Trigger Evaluation
**Pattern**: Recursive parsing of complex conditions with OR/AND support
**Used in**: Witness secrets (proof of concept)
**Confidence**: HIGH - Direct reuse of `parse_trigger_condition()` and `evaluate_condition()`
**Tom Application**: Extend to support `evidence_count` conditions

### State Management
**Pattern**: Pydantic BaseModel for each state type, nested in master PlayerState
**Used in**: WitnessState, BriefingState, VerdictState
**Confidence**: HIGH - Proven pattern with save/load infrastructure
**Tom Application**: New `InnerVoiceState` class with fired_triggers list

### UI Component Hierarchy
**Pattern**: Reusable Modal (base) > Specialized modals (BriefingModal, EvidenceModal)
**Confidence**: HIGH - Used successfully in briefing system
**Tom Application**: Use Modal with `variant="terminal"` for consistent dark theme

### Random Selection
**Pattern**: Backend selects from eligible pool, frontend displays
**Confidence**: MEDIUM - Briefing uses pre-written choices, not random selection
**Tom Application**: Implement tier-based random selection on backend

---

## Integration Points Mapped

### Backend API
- **New Endpoint**: `POST /api/case/{case_id}/inner-voice/trigger`
  - Input: `evidence_count: int`, `suspect_accused?: bool`
  - Output: `InnerVoiceResponse` with id, text, type, tier
  - Error: 404 if no eligible triggers

### State Persistence
- **Extend PlayerState**: Add `inner_voice_state: InnerVoiceState | None`
- **Save/Load**: Existing `save_state()` / `load_state()` handle new field
- **No migration needed**: JSON serialization handles nullable field

### Frontend Hook
- **New Hook**: `useInnerVoice(caseId, playerId)`
  - Return: `{ message, loading, error, dismiss }`
  - Call: `POST /api/case/{case_id}/inner-voice/trigger`
  - Like `useBriefing` pattern

### UI Display
- **Modal**: Use existing `Modal` component with `variant="terminal"`
- **Title**: "Tom's Voice" or "[TOM: TIER 2]"
- **Color**: Type-based styling (helpful=blue, misleading=yellow, etc.)
- **Dismiss**: Click X or auto-close after 5s (configurable)

### YAML Case Definition
- **New Section**: `case.inner_voice` with triggers organized by tier
- **No breaking changes**: Existing parser skips unknown sections
- **Backward compatible**: Phase 3 cases work without this section

---

## Code Conventions Observed

- **Imports**: Absolute paths via aliases (`from src.utils.trust import...`)
- **Error Handling**: HTTPException with status codes (404, 400, 503)
- **Async Patterns**: `async def` + `await` for LLM calls, sync for YAML parsing
- **Typing**: Full type hints on all functions (Pydantic models for data)
- **Testing**: Test files co-located with code (e.g., `tests/test_witness.py`)
- **Formatting**: 100 char line limit (ruff enforced)
- **Docstrings**: Google-style with Args/Returns/Raises sections

---

## Files Analyzed

**Backend**:
- `backend/src/utils/trust.py` (272 lines) - ✅ Trigger parsing
- `backend/src/state/player_state.py` (200+ lines) - ✅ State models
- `backend/src/case_store/loader.py` (200+ lines) - YAML loading (checked)
- `backend/src/case_store/case_001.yaml` (500+ lines) - ✅ YAML structure
- `backend/src/context/witness.py` (236 lines) - ✅ Witness prompt patterns
- `backend/src/context/briefing.py` (200+ lines) - ✅ Dialogue patterns
- `backend/src/api/routes.py` (1300+ lines) - ✅ Briefing endpoints (lines 1174-1313)

**Frontend**:
- `frontend/src/components/ui/Modal.tsx` (83 lines) - ✅ Modal base
- `frontend/src/components/BriefingModal.tsx` (150+ lines) - ✅ Modal pattern
- `frontend/src/components/EvidenceModal.tsx` (100+ lines) - ✅ Modal variant
- `frontend/src/hooks/useBriefing.ts` (177 lines) - ✅ Hook pattern
- `frontend/src/types/investigation.ts` (checked) - Type definitions

**Total files analyzed**: 12
**Symbols extracted**: 50+
**Integration points identified**: 8
**New code patterns needed**: 5

---

## Gotchas & Warnings

⚠️ **Rare Trigger Randomness**: 5-10% chance for special triggers (Marcus regret, dark humor) must be seeded server-side. Don't rely on frontend random(). Use `import random; random.random()` on backend.

⚠️ **Fired Triggers Persistence**: Store in `PlayerState.inner_voice_state.fired_triggers` list. Must NOT reset on case reload. Test replay scenario carefully.

⚠️ **Trigger Condition Parsing**: Test edge cases:
  - Empty trigger string → should return False (not trigger)
  - Malformed regex → should gracefully skip (log warning, not crash)
  - Mixed case operators ("Trust>5" vs "trust>5") → already case-insensitive regex

⚠️ **Modal vs Toast**: Briefing uses full modal (blocks interaction). Consider toast for Tom (non-blocking). But modal is safer for important warnings. Recommendation: **Start with modal** (predictable), add toast polish in Phase 4.5 if UX testing shows it works better.

⚠️ **YAML Compatibility**: Don't break existing case YAML structure. Add `inner_voice` as optional sibling to `briefing`, not nested. Existing loader ignores unknown top-level sections.

⚠️ **Evidence Count Logic**: Is it cumulative (total discovered) or current location only? Recommendation: **Total discovered** (simpler, matches design doc). Test with Tier 3 threshold at 6+ pieces.

⚠️ **Tom vs Witness Secrets**: Similar trigger logic but:
  - Witness: Trust-based + evidence-specific ("evidence:frost_pattern")
  - Tom: Evidence count-based + can fire multiple times per session
  Don't cross-reference implementations carelessly.

---

## Confidence Scores Summary

| Pattern | Confidence | Reason |
|---------|-----------|--------|
| Evidence Trigger Parsing | 9/10 | Exact parallel in witness secrets code; proven in production |
| State Tracking | 9/10 | Established Pydantic pattern; proven with WitnessState, BriefingState |
| Random Selection | 8/10 | Briefing proves UI pattern; random selection algo is straightforward |
| Modal/Toast UI | 9/10 | Proven in BriefingModal, EvidenceModal; simple reuse |
| YAML Structure | 9/10 | Exact parallel format to witness/secrets; well-tested parser |

**Overall Confidence**: 9/10 - All patterns have proven implementations in codebase. Tom system is extension, not reinvention.

---

**Date Generated**: 2026-01-08
**Research Quality**: COMPREHENSIVE (12 files, 50+ symbols, 8 integration points)
**Ready for**: INITIAL.md/PRP creation
