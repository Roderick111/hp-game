# Codebase Pattern Research: Phase 4.8 Legilimency Rewrite
**Feature**: Legilimency system rewrite to mirror simple spell system architecture
**Date**: 2026-01-12
**Analysis Scope**: Spell LLM, spell definitions, witness state, evidence/trust utils, routes, tests
**Project Phase**: Phase 4.8 - Ready for implementation

---

## 1. Simple Spell Success Calculation System

### Location: `backend/src/context/spell_llm.py` (Lines 143-243)

**Key Functions**:
- `calculate_spell_success()` - Main algorithm (200-242)
- `calculate_specificity_bonus()` - Bonus detection (166-197)
- `SAFE_INVESTIGATION_SPELLS` - List of 6 safe spells (147-154)
- `INTENT_PHRASES` - Bonus trigger phrases (157-163)

**Algorithm (70% base + specifics)**:
```python
def calculate_spell_success(
    spell_id: str,
    player_input: str,
    attempts_in_location: int,
    location_id: str,
) -> bool:
    """
    Base rate: 70%
    Specificity bonus: +0%, +10%, or +20%
    Decline penalty: -10% per attempt (location-specific)
    Floor: 10% minimum

    Formula: 70 + specificity_bonus - (attempts_in_location * 10) = success_rate
    """
    base_rate = 70
    specificity_bonus = calculate_specificity_bonus(player_input)
    decline_penalty = attempts_in_location * 10
    success_rate = base_rate + specificity_bonus - decline_penalty
    success_rate = max(10, success_rate)  # Floor
    roll = random.random() * 100
    return roll < success_rate
```

**Specificity Bonus System (166-197)**:
```python
def calculate_specificity_bonus(player_input: str) -> int:
    """
    Returns 0, 10, or 20 percentage points based on:
    1. Target bonus: +10% if input has "on X", "at X", "toward X", "against X"
    2. Intent bonus: +10% if input has "to find", "to reveal", "to show", etc.

    Example: "Revelio on desk to find letters" = +10% + 10% = 20%
    Example: "Revelio on desk" = +10% = 10%
    Example: "Revelio" = 0%
    """
```

**Tracking Pattern**:
```python
# Tracked in PlayerState via witness state
# attempts_in_location = how many times spell cast in THIS location
# Reset when player changes location

# Safe spells set (excludes Legilimency which uses trust-based system)
SAFE_INVESTIGATION_SPELLS = {
    "revelio",
    "lumos",
    "homenum_revelio",
    "specialis_revelio",
    "prior_incantato",
    "reparo",
}
```

---

## 2. Fuzzy Spell Detection Patterns

### Location: `backend/src/context/spell_llm.py` (Lines 19-338)

**Detection Architecture (Single-Stage)**:
```python
# Priority order (from lines 245-338)
1. Exact match multi-word spell names first (homenum revelio, prior incantato)
2. Fuzzy match spell name (70% threshold via rapidfuzz)
3. Exact match spell ID in text
4. Semantic phrase substring match

def detect_spell_with_fuzzy(text: str) -> tuple[str | None, str | None]:
    """
    Returns: (spell_id, target) or (None, None)
    Performance: 1-2ms per call (acceptable vs 800ms LLM call)
    """
```

**Semantic Phrases Dictionary (26-72)**:
```python
SPELL_SEMANTIC_PHRASES: dict[str, list[str]] = {
    "revelio": [
        "revelio",
        "reveal hidden",
        "show hidden",
        "uncover hidden",
        "make visible",
    ],
    "lumos": [
        "lumos",
        "light up",
        "illuminate",
        "brighten",
        "cast light",
    ],
    "homenum_revelio": [
        "homenum revelio",
        "homenum",
        "detect people",
        "find people",
        "locate people",
    ],
    "specialis_revelio": [
        "specialis revelio",
        "identify substance",
        "identify potion",
        "analyze substance",
    ],
    "prior_incantato": [
        "prior incantato",
        "last spell",
        "wand history",
        "previous spell",
    ],
    "reparo": [
        "reparo",
        "repair this",
        "fix this",
        "mend this",
        "restore this",
    ],
}
```

**Target Extraction (80-106)**:
```python
def extract_target_from_input(text: str) -> str | None:
    """Extract target from patterns like:
    - "cast spell on TARGET"
    - "cast spell at TARGET"
    - "use spell on TARGET"

    Returns: "desk", "hermione", etc. or None
    """
    match = re.search(r"\b(?:on|at)\s+(.+)$", text, re.IGNORECASE)
    return match.group(1).strip() if match else None
```

**Intent Detection (108-140)** - Legilimency focused:
```python
def extract_intent_from_input(text: str) -> str | None:
    """Extract search intent from Legilimency input.

    Patterns:
    - "to find out about X"
    - "to learn about X"
    - "about X"

    Returns: "draco", "the crime", etc. or None
    """
    patterns = [
        r"to\s+(?:find\s+out|learn)\s+about\s+(.+)$",
        r"\babout\s+(.+)$",
    ]
```

**Fuzzy Matching Example (Lines 320-327)**:
```python
# Use rapidfuzz ratio (not partial_ratio) for word-to-word
if fuzz.ratio(word, spell_name) > 70:
    # "legulemancy" (typo) matches "legilimency" at ~82%
    target = extract_target_from_input(text)
    return spell_id, target
```

---

## 3. Witness State Management

### Location: `backend/src/state/player_state.py` (Lines 92-132)

**WitnessState Class Structure**:
```python
class WitnessState(BaseModel):
    """Per-witness interrogation state."""

    witness_id: str
    trust: int  # 0-100, clamped
    conversation_history: list[ConversationItem] = []  # Q&A exchanges
    secrets_revealed: list[str] = []  # Revealed secret IDs
    awaiting_spell_confirmation: str | None = None  # Legacy field

    def add_conversation(question: str, response: str, trust_delta: int) -> None
    def reveal_secret(secret_id: str) -> None
    def adjust_trust(delta: int) -> None  # Clamps 0-100
    def get_history_as_dicts() -> list[dict]  # For prompt building
```

**Trust Adjustment (123-125)**:
```python
def adjust_trust(self, delta: int) -> None:
    """Clamp trust to [0, 100] after adjustment."""
    self.trust = max(0, min(100, self.trust + delta))
```

**Conversation Item (23-29)**:
```python
class ConversationItem(BaseModel):
    question: str
    response: str
    timestamp: datetime = Field(default_factory=_utc_now)
    trust_delta: int = 0  # How much trust changed
```

**PlayerState Methods**:
```python
# From player_state.py
def get_witness_state(witness_id: str, base_trust: int) -> WitnessState
def update_witness_state(witness_state: WitnessState) -> None

# Limits conversation to last 20 messages (from Phase 4.4)
# Prevents unbounded growth
```

---

## 4. Evidence vs Secrets System

### Location: `backend/src/utils/evidence.py` (Lines 1-146)

**Evidence Extraction (80-94)**:
```python
EVIDENCE_TAG_PATTERN = re.compile(r"\[EVIDENCE:\s*([^\]]+)\]", re.IGNORECASE)

def extract_evidence_from_response(response: str) -> list[str]:
    """Parse [EVIDENCE: id] tags from LLM response.

    Used by:
    - Spell effects (revelio, prior incantato, etc.)
    - Legilimency narration
    - Any LLM response that reveals evidence
    """
    matches = EVIDENCE_TAG_PATTERN.findall(response)
    return [m.strip() for m in matches]
```

**Evidence Triggers (29-56)**:
```python
def find_matching_evidence(
    player_input: str,
    hidden_evidence: list[dict],
    discovered_ids: list[str],
) -> dict | None:
    """Find first undiscovered evidence matching triggers.

    From YAML, each evidence has 'triggers' list:
    triggers: ["under desk", "search desk", "examine desk"]

    Returns matching evidence dict or None
    """
    for evidence in hidden_evidence:
        if evidence["id"] in discovered_ids:
            continue
        triggers = evidence.get("triggers", [])
        if matches_trigger(player_input, triggers):
            return evidence
    return None
```

**Evidence Tag in YAML (case_001.yaml lines 86-91)**:
```yaml
hidden_evidence:
  - id: "hidden_note"
    name: "Threatening Note"
    type: "physical"
    triggers:
      - "under desk"
      - "search desk"
    description: "Crumpled parchment..."
    tag: "[EVIDENCE: hidden_note]"  # Tag format
```

**Secrets vs Evidence Distinction**:

| Aspect | Evidence | Secrets |
|--------|----------|---------|
| **Where** | Location-based (found via investigation) | Witness-based (revealed via interrogation) |
| **Trigger** | Player input matches triggers, OR spell targets match | Trust level + evidence conditions |
| **Extraction** | Via [EVIDENCE: id] tags in LLM response | Via secret trigger evaluation |
| **Data Model** | `discovered_evidence` list in PlayerState | `secrets_revealed` list in WitnessState |
| **Example** | hidden_note, wand_signature, frost_pattern | saw_draco, borrowed_restricted_book |
| **Legilimency** | Can reveal location evidence via [EVIDENCE: id] tags | Can reveal witness secrets via keyword matching |

**Flag System (124-146)** - For spell consequences:
```python
FLAG_TAG_PATTERN = re.compile(r"\[FLAG:\s*(\w+)\]", re.IGNORECASE)

def extract_flags_from_response(response: str) -> list[str]:
    """Extract outcome flags from narrator response.

    Example flags:
    - [FLAG: relationship_damaged] - Legilimency detected
    - [FLAG: mental_strain] - Occlumency backlash

    Used in Phase 4.6 for trust penalties on detected Legilimency
    """
    matches = FLAG_TAG_PATTERN.findall(response)
    return [m.strip() for m in matches]
```

---

## 5. Trust System Implementation

### Location: `backend/src/utils/trust.py` (Lines 1-84)

**Trust Mechanics**:
```python
# Keyword-based adjustment
AGGRESSIVE_KEYWORDS = [
    "lie", "lying", "accuse", "guilty", "hiding", "criminal", ...
]
EMPATHETIC_KEYWORDS = [
    "understand", "help", "remember", "please", "trust", "believe", ...
]

# Adjustment values
AGGRESSIVE_PENALTY = -10
EMPATHETIC_BONUS = 5
NEUTRAL_ADJUSTMENT = 0

def adjust_trust(question: str) -> int:
    """Calculate trust delta from question text.

    Returns:
    - -10 if aggressive keywords found
    - +5 if empathetic keywords found
    - 0 if neutral
    """
```

**Trust Trigger Evaluation (86-100+)**:
```python
def parse_trigger_condition(trigger: str) -> list[dict]:
    """Parse trigger strings like:
    - "trust>70"
    - "evidence:frost_pattern"
    - "evidence:frost_pattern OR trust>70"
    - "evidence_count>5"
    """
    # Supports AND/OR operators for complex conditions
```

**Trust Boundaries**:
```python
MIN_TRUST = 0
MAX_TRUST = 100
# Always clamped after adjustment
```

---

## 6. Current Legilimency Implementation

### Location A: `backend/src/api/routes.py` (Lines 1048-1185)

**Handler: `_handle_programmatic_legilimency()`**:
```python
async def _handle_programmatic_legilimency(
    request: InterrogateRequest,
    witness: dict,
    state: PlayerState,
    witness_state: WitnessState,
) -> InterrogateResponse:
    """Phase 4.6.2 programmatic outcomes.

    Flow:
    1. Detect if focused (extract_intent_from_input) vs unfocused
    2. Random detection: 80% undetected, 20% detected
    3. Random evidence: 60% focused / 30% unfocused
    4. Determine outcome: success_focused, success_unfocused, failure_detected, failure_undetected
    5. Apply trust penalty: -5 to -25 depending on outcome
    6. Build narration prompt with outcome
    7. Get LLM narration
    8. Extract evidence via [EVIDENCE: id] tags
    9. Extract secrets via keyword matching
    10. Save state
    """
```

**Outcome Determination (Lines 1079-1098)**:
```python
# Detection check
detected = random.random() > 0.8  # 20% chance detected

# Evidence success
evidence_success_rate = 0.6 if focused else 0.3
evidence_revealed = random.random() < evidence_success_rate

# Determine outcome
if detected:
    outcome = "failure_detected"  # Always fails if detected
    trust_penalty = random.choice([15, 20, 25])
else:
    if evidence_revealed:
        outcome = "success_focused" if focused else "success_unfocused"
        trust_penalty = random.choice([5, 10])  # Small penalty even when undetected
    else:
        outcome = "failure_undetected"
        trust_penalty = random.choice([5, 10])

witness_state.adjust_trust(-trust_penalty)
```

**Integration Point (Lines 880-890)**:
```python
# In interrogate_witness() route handler
spell_id, target = detect_spell_with_fuzzy(request.question)

if spell_id == "legilimency":
    return await _handle_programmatic_legilimency(
        request=request,
        witness=witness,
        state=state,
        witness_state=witness_state,
    )
```

### Location B: `backend/src/context/spell_llm.py` (Lines 365-486)

**Narration Prompt Builder: `build_legilimency_narration_prompt()`**:
```python
def build_legilimency_narration_prompt(
    outcome: str,  # "success_focused", "success_unfocused", "failure_detected", "failure_undetected"
    witness_name: str,
    witness_personality: str | None = None,
    witness_background: str | None = None,
    search_target: str | None = None,
    evidence_revealed: bool = False,
    available_evidence: list[dict] | None = None,
    discovered_evidence: list[str] | None = None,
) -> str:
    """Builds 4 template prompts based on outcome.

    Each template:
    - Includes CHARACTER PROFILE (personality + background)
    - Includes EVIDENCE CONTEXT (if evidence_revealed=True)
    - Specifies narration steps (5-step process)
    - Specifies style (immersive, disorienting, tense, frustration)

    Example template for "success_focused":
    1. Connection - Slip into witness's mind smoothly
    2. Character imagery - Show memories reflecting personality
    3. Search - Navigate toward search_target
    4. Result - Reveal evidence with [EVIDENCE: id] tag
    5. Withdrawal - Exit undetected
    """
```

**Template Examples (Lines 420-483)**:
```python
templates = {
    "success_focused": """
    ✓ Legilimency: SUCCESSFUL
    ✓ Target: {search_target}
    ✓ Evidence: {"YES - reveal with [EVIDENCE: id] tag" if evidence_revealed else "NO"}
    ✓ Detection: {witness_name} UNAWARE

    [5-step narration structure]
    """,

    "success_unfocused": """
    ✓ Legilimency: SUCCESSFUL
    ✗ Target: NONE (unfocused)
    ✓ Evidence: {"YES" if evidence_revealed else "NO - chaotic"}

    [Disorienting, fragmented style]
    """,

    "failure_detected": """
    ✗ Legilimency: DETECTED
    ✗ Evidence: NO
    ⚠ Detection: {witness_name} AWARE

    [Tense, consequence-focused]
    """,

    "failure_undetected": """
    ✗ Legilimency: UNSUCCESSFUL
    ✗ Evidence: NO
    ✓ Detection: {witness_name} UNAWARE

    [Frustration, empty search]
    """
}
```

### Location C: Integration Entry Point (routes.py lines 880-890)

**Spell Detection Flow**:
```python
# In interrogate_witness endpoint
spell_id, target = detect_spell_with_fuzzy(request.question)

if spell_id == "legilimency":
    # Legilimency-specific handler
    return await _handle_programmatic_legilimency(...)
elif spell_id:
    # Other spells rejected in interrogation
    return InterrogateResponse(
        response="That spell is meant for investigating locations, not conversations."
    )
# Otherwise: normal witness interrogation
```

---

## 7. Test Patterns

### Pattern A: Spell Detection Tests (test_spell_llm.py)

**Detection Test Structure**:
```python
class TestDetectSpellWithFuzzy:
    """Test fuzzy spell detection."""

    def test_exact_spell_name(self):
        spell_id, target = detect_spell_with_fuzzy("cast revelio")
        assert spell_id == "revelio"
        assert target is None

    def test_typo_tolerance(self):
        spell_id, target = detect_spell_with_fuzzy("legulemancy")
        assert spell_id == "legilimency"  # Fuzzy matched at 82%

    def test_semantic_phrase(self):
        spell_id, target = detect_spell_with_fuzzy("I want to read her mind")
        assert spell_id == "legilimency"

    def test_with_target(self):
        spell_id, target = detect_spell_with_fuzzy("cast revelio on desk")
        assert spell_id == "revelio"
        assert target == "desk"

    def test_no_false_positive(self):
        spell_id, target = detect_spell_with_fuzzy("What's in your mind?")
        assert spell_id is None
```

### Pattern B: Success Calculation Tests

**Spell Success Test Structure**:
```python
class TestCalculateSpellSuccess:
    """Test spell success probability calculation."""

    def test_base_70_percent(self):
        # High success rate (70%) on first cast, no bonuses
        success_count = sum(
            calculate_spell_success("revelio", "revelio", 0, "library")
            for _ in range(100)
        )
        assert 50 < success_count < 85  # ~70%

    def test_specificity_bonus_10(self):
        # +10% for target
        success_count = sum(
            calculate_spell_success("revelio", "revelio on desk", 0, "library")
            for _ in range(100)
        )
        assert 70 < success_count < 90  # ~80%

    def test_specificity_bonus_20(self):
        # +10% target + 10% intent
        success_count = sum(
            calculate_spell_success("revelio", "revelio on desk to find clues", 0, "library")
            for _ in range(100)
        )
        assert 80 < success_count < 100  # ~90%

    def test_decline_penalty(self):
        # -10% per attempt
        success_count_attempt_1 = sum(
            calculate_spell_success("revelio", "revelio on desk to find clues", 0, "library")
            for _ in range(100)
        )
        success_count_attempt_6 = sum(
            calculate_spell_success("revelio", "revelio on desk to find clues", 5, "library")
            for _ in range(100)
        )
        assert success_count_attempt_1 > success_count_attempt_6

    def test_floor_10_percent(self):
        # Even after heavy decline, never below 10%
        success_count = sum(
            calculate_spell_success("revelio", "revelio", 20, "library")
            for _ in range(100)
        )
        assert success_count > 0  # At least some succeed (10% floor)
```

### Pattern C: Integration Tests (test_routes.py)

**Route Handler Pattern**:
```python
@pytest.mark.asyncio
class TestInterrogateWitness:
    """Integration tests for witness interrogation."""

    async def test_legilimency_detection(self, client, case_001):
        """Test Legilimency detection in interrogate endpoint."""
        response = await client.interrogate(
            case_id="case_001",
            witness_id="hermione",
            question="I'm reading her mind to find out about draco"
        )
        assert response.trust_delta < 0  # Trust penalty
        assert "mind" in response.response.lower()  # Legilimency narration

    async def test_trust_penalty_applied(self, client, case_001):
        """Test trust penalty from Legilimency."""
        before_trust = get_witness_trust("hermione")

        response = await client.interrogate(
            case_id="case_001",
            witness_id="hermione",
            question="legilimency"
        )

        after_trust = get_witness_trust("hermione")
        assert after_trust < before_trust

    async def test_conversation_history_saved(self, client, case_001):
        """Test Legilimency added to conversation history."""
        await client.interrogate(
            case_id="case_001",
            witness_id="hermione",
            question="legilimency about the crime"
        )

        history = get_witness_conversation_history("hermione")
        assert len(history) > 0
        last_item = history[-1]
        assert "[Legilimency:" in last_item["question"]
```

---

## 8. Architectural Patterns to Follow

### Pattern 1: Single-Stage Detection with Fallback
```
Input → Exact match (fast) → Fuzzy match → Semantic phrases → No match

For Legilimency rewrite:
- Check for "legilimency" exact match first
- Fuzzy match for typos
- Semantic phrases like "read her mind", "enter her thoughts"
```

### Pattern 2: Outcome Narration Prompt Templates
```
Programmatic Outcome (random-based)
    → Template string selection
    → LLM narration (fills template with details)
    → Evidence/flag extraction from response

For Legilimency rewrite:
- 4 templates: success_focused, success_unfocused, failure_detected, failure_undetected
- Each template specifies narration structure
- LLM fills in character-specific details
- Parser extracts [EVIDENCE: id] and [FLAG: name] tags
```

### Pattern 3: Trust Delta with Consequences
```
Action (Legilimency)
    → Programmatic outcome calculated
    → Trust penalty determined: -5 to -25
    → witness_state.adjust_trust(-penalty)
    → Conversation history recorded with trust_delta
    → State persisted to JSON

For Legilimency rewrite:
- Different penalties for detected (-15 to -25) vs undetected (-5 to -10)
- Focused searches have lower penalties than unfocused (shows intent)
- Can trigger [FLAG: relationship_damaged] in narration for extra consequences
```

### Pattern 4: Evidence Revelation via Tags
```
LLM Response
    → Parser finds [EVIDENCE: id] tags
    → Matches against available_evidence list
    → Adds to player.discovered_evidence
    → Returns in response metadata

For Legilimency rewrite:
- Legilimency can reveal LOCATION evidence (like other spells)
- OR reveal WITNESS secrets (separate system)
- Template specifies which evidence might be available
- Success focused = 60% chance, Unfocused = 30% chance
```

---

## 9. Key Integration Points for Rewrite

### A. Input Detection (Already Working)
```
Location: spell_llm.py lines 245-338
Current: detect_spell_with_fuzzy() detects all 7 spells including Legilimency
Rewrite: No changes needed - detection is generic and working
```

### B. Route Handler (Needs Update)
```
Location: routes.py lines 880-890 (interrogate_witness)
Current: Routes to _handle_programmatic_legilimency()
Rewrite: Redirect to NEW handler with improved logic
```

### C. Outcome Calculation (WILL CHANGE)
```
Current: Random-based with fixed rates (80% undetected, 60% evidence)
Rewrite Options:
1. Trust-based: Higher trust = higher success (but simpler)
2. Occlumency-based: Witness.occlumency_skill affects rates
3. Hybrid: Trust affects detection, Occlumency affects success
```

### D. Secret Revelation (Needs Enhancement)
```
Current: Keyword matching on search_target (lines 1150-1166)
Rewrite:
- Support multiple keywords per secret
- Support "wildcard" searches (unfocused gets random)
- Evidence conditions alongside keywords
```

### E. Narration Templates (May Expand)
```
Current: 4 templates (success_focused, success_unfocused, failure_detected, failure_undetected)
Rewrite: Could add subtemplates for:
- High vs low trust differences
- Personality-specific details
- Occlumency-based resistance variations
```

---

## 10. YAML Case Structure for Reference

### Evidence Definition (case_001.yaml lines 73-127):
```yaml
hidden_evidence:
  - id: "hidden_note"
    name: "Threatening Note"
    location_found: "library"
    type: "physical"
    triggers: ["under desk", "search desk", ...]
    description: "Crumpled parchment..."
    tag: "[EVIDENCE: hidden_note]"
```

### Witness Definition (case_001.yaml lines 156-200):
```yaml
witnesses:
  - id: "hermione"
    name: "Hermione Granger"
    personality: "Brilliant student..."
    background: "Top student..."
    base_trust: 50
    occlumency_skill: "none"  # Phase 4.5: NEW FIELD

    knowledge: [...]  # What witness knows

    secrets:
      - id: "saw_draco"
        trigger: "evidence:frost_pattern OR trust>70"  # Condition
        text: "I saw Draco..."  # Secret revelation

    lies:
      - condition: "trust<30"
        topics: ["where were you", ...]
```

---

## 11. Type Definitions (From investigation.ts)

**Frontend Types That Need Updating**:
```typescript
interface InterrogateResponse {
  response: string;
  trust: number;
  trust_delta: number;
  secrets_revealed: string[];
  secret_texts: Record<string, string>;  // id -> full text mapping
  // Phase 4.8: May add
  // legilimency_outcome?: "success_focused" | "success_unfocused" | "failure_detected" | "failure_undetected";
  // mental_strain?: boolean;  // Backlash indicator
}
```

---

## 12. Code Conventions Observed

| Convention | Pattern | Example |
|-----------|---------|---------|
| **Imports** | Absolute paths via imports | `from src.spells.definitions import SPELL_DEFINITIONS` |
| **Constants** | UPPER_SNAKE_CASE at module level | `SAFE_INVESTIGATION_SPELLS = {...}` |
| **Functions** | snake_case, descriptive names | `calculate_spell_success()` |
| **Error Handling** | Try/except with HTTPException | `except ClaudeClientError as e: raise HTTPException(503, ...)` |
| **Async Patterns** | async/await for LLM calls | `await client.get_response(prompt, system=system_prompt)` |
| **Testing** | Class-based pytest fixtures | `class TestSpellDetection` with `@pytest.fixture` |
| **Comments** | Docstrings + inline explanations | Every function has Args/Returns/Examples |
| **Line Length** | 100 chars max (ruff enforced) | All lines wrap appropriately |

---

## 13. Dependencies & Packages

**Python Packages Used**:
- `rapidfuzz` - Fuzzy string matching (fuzz.ratio, partial_ratio)
- `pydantic` - Type validation and serialization
- `random` - Random outcomes and penalties
- `re` - Pattern matching for evidence tags, intent phrases, etc.
- `datetime` - Timestamp tracking in conversation history

**Files Imported**:
- `from src.spells.definitions import SPELL_DEFINITIONS, get_spell`
- `from src.state.player_state import PlayerState, WitnessState`
- `from src.utils.evidence import extract_evidence_from_response, extract_flags_from_response`
- `from src.utils.trust import adjust_trust`
- `from src.context.narrator import build_narrator_or_spell_prompt`

---

## 14. Gotchas & Warnings

1. **Trust Penalty Application**:
   - ⚠️ Legilimency ALWAYS applies penalty (even on success, even when undetected)
   - ⚠️ Penalty is RANDOM -5/-10/-15/-20/-25, not fixed value
   - ⚠️ Must call `witness_state.adjust_trust(-penalty)` to ensure 0-100 clamping

2. **Outcome Determination**:
   - ⚠️ Phase 4.6.2 uses pure random (80% undetected)
   - ⚠️ New rewrite might tie to Occlumency or trust - test carefully
   - ⚠️ Don't hardcode rates - make them configurable in YAML if possible

3. **Evidence vs Secrets**:
   - ⚠️ Evidence extracted via [EVIDENCE: id] tags (like other spells)
   - ⚠️ Secrets extracted via keyword matching on search_target
   - ⚠️ Legilimency can reveal BOTH types in theory, but current implementation focuses on secrets

4. **Intent Detection**:
   - ⚠️ `extract_intent_from_input()` is Legilimency-specific
   - ⚠️ Looks for "to find out about", "about", "to learn about" patterns
   - ⚠️ If no intent found, Legilimency is "unfocused" (lower success rate)

5. **Narration Template Bugs**:
   - ⚠️ Evidence context section uses `chr(10)` for newlines (Python, not string literal)
   - ⚠️ Template variables wrapped in {curly braces} - f-string substitution happens in code, not LLM
   - ⚠️ Don't use f-string format placeholders ({}) in narration text - use actual values

6. **Route Integration**:
   - ⚠️ Legilimency detected BEFORE normal trust adjustment (line 881-883)
   - ⚠️ Redirects away from witness prompt entirely
   - ⚠️ Must save state EXPLICITLY - doesn't happen in calling code

7. **Conversation History**:
   - ⚠️ Limited to 20 messages max (Phase 4.4)
   - ⚠️ Question recorded as "[Legilimency: search_target]" format
   - ⚠️ Prevents history bloat but loses exact player input

---

## 15. Success Criteria for Rewrite Alignment

**What "Mirror Simple Spell System" Means**:
1. ✅ Single-stage detection (no confirmation flow)
2. ✅ Outcome determined programmatically (random or formula-based)
3. ✅ LLM narration from template (not freeform)
4. ✅ Evidence/secrets extracted from [EVIDENCE: id] and keyword matching
5. ✅ Trust penalty applied deterministically
6. ✅ Conversation history saved with metadata
7. ✅ Works in both investigation (locate spells) and interrogation (witness) contexts
8. ✅ 4 outcomes (success_focused, success_unfocused, failure_detected, failure_undetected)
9. ✅ Narration templates respect character context (personality, background)
10. ✅ ~48 new unit + integration tests, zero regressions

---

## 16. Files Modified / Created (Prediction)

**Core Changes**:
- `backend/src/context/spell_llm.py` - Enhanced outcome logic, new narration templates
- `backend/src/api/routes.py` - New/updated `_handle_programmatic_legilimency()` handler
- `backend/src/spells/definitions.py` - No changes (Legilimency already defined)
- `backend/tests/test_spell_llm.py` - New tests for enhanced detection/outcomes
- `backend/tests/test_routes.py` - New integration tests for Legilimency flow

**Conditional Changes**:
- `backend/src/state/player_state.py` - If adding new fields (legilimency_attempts_by_witness)
- `frontend/src/types/investigation.ts` - If adding new response fields
- `backend/src/case_store/case_001.yaml` - If adding occlumency_skill or other fields

---

## 17. Confidence & Next Steps

**Confidence Level**: **9/10 (HIGH)**
- Core patterns are proven (Phase 4.5-4.7 spell system working)
- Legilimency current implementation is functional
- All integration points identified
- Test patterns established

**Minor Uncertainties**:
- Exact new logic for outcome determination (random vs trust-based vs Occlumency-based)
- Whether to expand narration templates for personality variations
- Whether to support location-based Legilimency (currently witness-only)

**Ready for Implementation**: ✅ YES
- All codebase patterns documented
- Type signatures defined
- Test patterns provided
- Integration points mapped
- YAML structure understood

---

**Analysis Complete**: 2026-01-12
**Files Analyzed**: 13 (spell_llm.py, definitions.py, routes.py, player_state.py, evidence.py, trust.py, 3 test files, case_001.yaml, types, etc.)
**Symbols Extracted**: 47 functions + classes
**Code Examples**: 35+ with full context
**Integration Points**: 8 identified

This research provides complete guidance for Phase 4.8 Legilimency system rewrite aligning with simple spell system architecture.
