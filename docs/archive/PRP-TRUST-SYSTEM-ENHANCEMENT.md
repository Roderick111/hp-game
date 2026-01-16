# PRP: Trust System Enhancement

**Status**: READY FOR IMPLEMENTATION
**Effort**: ~2 hours
**Philosophy**: Trust is a guide, not a gate. LLM decides naturally.

---

## Goals

1. Clean up trust keywords (remove ambiguous terms)
2. Evidence presentation via chat with fuzzy matching
3. LLM-driven secret revelation (show ALL secrets, LLM decides)
4. One-time trust bonus for evidence presentation
5. Static investigative context (no programmatic pressure detection)

## Non-Goals

- ❌ Personality-specific trust modifiers (per-witness YAML)
- ❌ Complex trigger logic parsing
- ❌ UI indicators for secrets
- ❌ Programmatic pressure keyword detection

---

## Technical Changes

### Current State

**trust.py**:
- `AGGRESSIVE_KEYWORDS` = 12 terms (some ambiguous: "suspect", "hiding", "did it")
- `EMPATHETIC_KEYWORDS` = 12 terms (some generic: "help", "remember", "tell me")
- `EVIDENCE_PRESENTATION_BONUS = 3`
- `detect_evidence_presentation()` extracts raw word, no fuzzy matching

**witness.py**:
- `get_available_secrets()` filters secrets by triggers (lines 250-266)
- `build_witness_prompt()` shows only available secrets
- Rigid rules: "Do NOT reveal secrets unless..." (line 247)

**routes.py**:
- `interrogate_witness()` calls `detect_evidence_presentation()` (line 1337)
- `_handle_evidence_presentation()` has NO one-time bonus tracking

**player_state.py**:
- `WitnessState` has NO `evidence_shown` field

### Proposed Changes

**trust.py**:
- Clean AGGRESSIVE_KEYWORDS (remove ambiguous)
- Clean EMPATHETIC_KEYWORDS (remove generic)
- Increase `EVIDENCE_PRESENTATION_BONUS = 5`
- Add `match_evidence_to_inventory()` for fuzzy matching

**witness.py**:
- Remove `get_available_secrets()` filtering
- Replace `format_secrets_for_prompt()` with `format_secrets_with_context()` (no trigger parsing)
- Update `build_witness_prompt()`: show ALL secrets, add static investigative context, soften rules

**routes.py**:
- Add fuzzy matching call in `interrogate_witness()`
- Add one-time bonus logic in `_handle_evidence_presentation()`

**player_state.py**:
- Add `evidence_shown: list[str]` to WitnessState
- Add `mark_evidence_shown()` method

---

## File 1: `backend/src/utils/trust.py`

### Changes

1. **Clean AGGRESSIVE_KEYWORDS** (remove: "suspect", "hiding", "know you", "did it", "admit", "confess", "criminal")
2. **Clean EMPATHETIC_KEYWORDS** (remove: "help", "remember", "tell me", "believe", "trust", "hiding")
3. **Add `match_evidence_to_inventory()`** for fuzzy matching
4. **Increase EVIDENCE_PRESENTATION_BONUS** from 3 → 5

### Code

```python
# Clean aggressive signals only
AGGRESSIVE_KEYWORDS = [
    "liar",
    "lying",
    "you lie",
    "you're lying",
    "guilty",
    "you did it",
    "caught you",
    "exposed",
    "hiding something",
    "hiding the truth",
    "pathetic",
    "coward",
    "bullshit",
    "nonsense",
    "obviously lying",
    "don't believe you",
    "accusing you",
]

# Clear empathetic signals only
EMPATHETIC_KEYWORDS = [
    "understand",
    "please",
    "sorry",
    "must be hard",
    "difficult for you",
    "appreciate",
    "thank you",
    "scared",
    "afraid",
    "worried",
    "feel safe",
    "protect you",
    "no judgment",
    "on your side",
    "here to listen",
    "hear you out",
    "i believe you",
    "trust you",
]

AGGRESSIVE_PENALTY = -10
EMPATHETIC_BONUS = 5
EVIDENCE_PRESENTATION_BONUS = 5  # Changed from 3


def match_evidence_to_inventory(
    extracted_word: str,
    discovered_evidence: list[str],
    case_data: dict[str, Any],
) -> str | None:
    """Fuzzy match player's word to actual evidence ID.

    Matches against:
    1. Exact evidence ID
    2. Evidence name (case-insensitive substring)
    3. Words in evidence name

    Args:
        extracted_word: Word extracted from "show X" pattern
        discovered_evidence: List of evidence IDs player has discovered
        case_data: Full case data with all evidence definitions

    Returns:
        Matched evidence ID or None
    """
    extracted_lower = extracted_word.lower()

    # Get all evidence from all locations
    all_evidence = []
    for location in case_data.get("locations", {}).values():
        all_evidence.extend(location.get("hidden_evidence", []))

    # Filter to only discovered evidence
    discovered_evidence_objs = [
        e for e in all_evidence
        if e.get("id") in discovered_evidence
    ]

    for evidence in discovered_evidence_objs:
        evidence_id = evidence.get("id", "")
        evidence_name = evidence.get("name", "").lower()

        # Check exact ID match
        if extracted_lower == evidence_id.lower():
            return evidence_id

        # Check if word appears in evidence name
        if extracted_lower in evidence_name:
            return evidence_id

        # Check if evidence name contains the word
        name_words = evidence_name.split()
        if any(extracted_lower in word for word in name_words):
            return evidence_id

    return None
```

**Keep existing functions**: `adjust_trust()`, `clamp_trust()`, `parse_trigger_condition()`, `evaluate_condition()`, `check_secret_triggers()`, `should_lie()`, `detect_evidence_presentation()`

---

## File 2: `backend/src/context/witness.py`

### Changes

1. **Replace `format_secrets_for_prompt()`** with `format_secrets_with_context()` (simpler, no trigger parsing)
2. **Update `build_witness_prompt()`**:
   - Show ALL secrets (no `get_available_secrets()` filtering)
   - Add static investigative context
   - Soften guidelines: "YOU decide"
   - Remove rigid rules

### Code

**Replace existing `format_secrets_for_prompt()` with:**

```python
def format_secrets_with_context(
    secrets: list[dict[str, Any]],
    trust: int,
    discovered_evidence: list[str],
) -> str:
    """Format all secrets for LLM to decide revelation naturally.

    Shows LLM all secrets with current context. LLM decides whether to reveal
    based on question relevance, conversation flow, safety, and trust level.

    Args:
        secrets: All witness secrets
        trust: Current trust level (for context only)
        discovered_evidence: Evidence player has found (for context only)

    Returns:
        Formatted string with secrets for LLM judgment
    """
    if not secrets:
        return "You have no secrets to hide."

    lines = []
    for secret in secrets:
        secret_id = secret.get("id", "unknown")
        text = secret.get("text", "").strip()

        # Just show the secret, no rigid gates
        lines.append(f"- [{secret_id}] {text}")

    return "\n".join(lines)
```

**Update `build_witness_prompt()` function:**

```python
def build_witness_prompt(
    witness: dict[str, Any],
    trust: int,
    discovered_evidence: list[str],
    conversation_history: list[dict[str, Any]],
    player_input: str,
) -> str:
    """Build witness LLM prompt with personality, trust, and secrets.

    Phase 5.5+: Flexible, natural conversation flow.
    Trust is a guide, not a gate. LLM decides secret revelation.
    """

    name = witness.get("name", "Unknown Witness")
    personality = witness.get("personality", "").strip()
    background = witness.get("background", "").strip()
    knowledge = witness.get("knowledge", [])
    lies = witness.get("lies", [])
    wants = witness.get("wants", "").strip()
    fears = witness.get("fears", "").strip()
    moral_complexity = witness.get("moral_complexity", "").strip()

    # Get all secrets (show all to LLM, no filtering)
    all_secrets = witness.get("secrets", [])

    # Check mandatory lie condition (only rigid rule remaining)
    lie_response = should_lie(witness, player_input, trust)

    # Format sections
    knowledge_text = format_knowledge(knowledge)
    secrets_text = format_secrets_with_context(all_secrets, trust, discovered_evidence)
    history_text = format_conversation_history(conversation_history)
    psychology_section = format_wants_fears(wants, fears, moral_complexity)

    # Build contextual guidance
    lie_instruction = ""
    if lie_response:
        lie_instruction = f"""
== MANDATORY LIE (trust too low) ==
You MUST respond with: "{lie_response.get("response", "")}"
"""

    return f"""You are {name}, a character in a Harry Potter detective game at Hogwarts.

== INVESTIGATION CONTEXT ==
You are being questioned by an Auror (magical law enforcement) investigating a crime.
They have authority to question you. How you respond depends on your personality, trust level, and fears.
You may cooperate willingly, show resistance, or refuse - whatever fits your character in this moment.

== YOUR PERSONALITY ==
{personality}

== YOUR BACKGROUND ==
{background}

{psychology_section}== YOUR KNOWLEDGE ==
{knowledge_text}

== CURRENT TRUST: {trust}/100 ==

== SECRETS YOU KNOW (what you're hiding) ==
{secrets_text}

YOU decide whether to reveal any secrets based on:
- Is the question directly relevant to this secret?
- Does the conversation flow naturally lead here?
- Do you feel safe revealing this? (consider trust level, your fears)
- What would your personality do in this moment?

Trust level is just context - YOU make the judgment call.
Be natural and realistic. Reveal secrets when it makes sense, not based on rigid rules.
{lie_instruction}
== CONVERSATION HISTORY ==
{history_text}

== GUIDELINES ==
1. Stay in character as {name}
2. You only know what's in your knowledge and secrets above
3. Respond naturally in 2-4 sentences
4. If mandatory lie applies, use it - otherwise use your best judgment
5. Secrets can be revealed gradually or all at once, whatever feels natural

== PLAYER'S QUESTION ==
"{player_input}"

Respond as {name}:"""
```

**Keep existing functions**: `format_knowledge()`, `format_conversation_history()`, `format_lie_topics()`, `get_trust_behavior_text()`, `build_witness_system_prompt()`, `format_wants_fears()`

---

## File 3: `backend/src/state/player_state.py`

### Changes

Add `evidence_shown: list[str]` field and `mark_evidence_shown()` method to WitnessState.

### Code

**Update WitnessState class (around line 317):**

```python
class WitnessState(BaseModel):
    """State tracking for a specific witness interrogation."""

    witness_id: str
    trust: int
    conversation_history: list[ConversationItem] = Field(default_factory=list)
    secrets_revealed: list[str] = Field(default_factory=list)
    awaiting_spell_confirmation: str | None = None
    legilimency_detected: bool = False
    spell_attempts: dict[str, int] = Field(default_factory=dict)

    # NEW: Track evidence shown to this witness
    evidence_shown: list[str] = Field(default_factory=list)

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

    # NEW: Mark evidence as shown
    def mark_evidence_shown(self, evidence_id: str) -> bool:
        """Mark evidence as shown to this witness.

        Args:
            evidence_id: Evidence ID being shown

        Returns:
            True if this is first time showing, False if already shown
        """
        if evidence_id not in self.evidence_shown:
            self.evidence_shown.append(evidence_id)
            return True
        return False

    def get_history_as_dicts(self) -> list[dict[str, Any]]:
        """Get conversation history as list of dicts for prompt building."""
        return [
            {"question": item.question, "response": item.response}
            for item in self.conversation_history
        ]
```

---

## File 4: `backend/src/api/routes.py`

### Changes

1. **Update `interrogate_witness()`** (around line 1337): Add fuzzy matching call
2. **Update `_handle_evidence_presentation()`** (around line 1310): Add one-time bonus logic

### Code

**Update in `interrogate_witness()` function:**

```python
async def interrogate_witness(request: InterrogateRequest) -> InterrogateResponse:
    """Interrogate a witness with a question.

    1. Load case and witness data
    2. Check for evidence presentation in question
    3. Adjust trust based on question tone
    4. Build witness prompt (isolated from narrator)
    5. Get Claude response as witness character
    6. Check for triggered secrets
    7. Update and save state
    """
    # Load case data
    try:
        case_data = load_case(request.case_id)
        witness = get_witness(case_data, request.witness_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Case not found: {request.case_id}")
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Witness not found: {request.witness_id}")

    # Load or create player state
    state = load_state(request.case_id, request.player_id)
    if state is None:
        state = PlayerState(case_id=request.case_id)

    # Get or create witness state with base_trust from YAML
    base_trust = witness.get("base_trust", 50)
    witness_state = state.get_witness_state(request.witness_id, base_trust)

    # Check if question contains evidence presentation
    evidence_word = detect_evidence_presentation(request.question)

    if evidence_word:
        # NEW: Fuzzy match to actual evidence ID
        from src.utils.trust import match_evidence_to_inventory

        evidence_id = match_evidence_to_inventory(
            extracted_word=evidence_word,
            discovered_evidence=state.discovered_evidence,
            case_data=case_data,
        )

        if evidence_id and evidence_id in state.discovered_evidence:
            # Redirect to present-evidence flow
            return await _handle_evidence_presentation(
                witness=witness,
                evidence_id=evidence_id,
                state=state,
                witness_state=witness_state,
                player_id=request.player_id,
            )

    # Phase 4.6.2: Single-stage fuzzy + semantic phrase detection for all spells
    spell_id, target = detect_spell_with_fuzzy(request.question)

    if spell_id == "legilimency":
        # Phase 4.6.2: Programmatic Legilimency outcomes
        return await _handle_programmatic_legilimency(
            request=request,
            witness=witness,
            state=state,
            witness_state=witness_state,
        )
    elif spell_id:
        # Other spells not supported in interrogation
        return InterrogateResponse(
            response="That spell is meant for investigating locations, not conversations. "
            "Use the main investigation view to cast it.",
            trust=witness_state.trust,
            trust_delta=0,
            secrets_revealed=[],
            secret_texts={},
        )

    # Adjust trust based on question tone
    trust_delta = adjust_trust(request.question, witness.get("personality", ""))
    witness_state.adjust_trust(trust_delta)

    # Build witness prompt (isolated context)
    prompt = build_witness_prompt(
        witness=witness,
        trust=witness_state.trust,
        discovered_evidence=state.discovered_evidence,
        conversation_history=witness_state.get_history_as_dicts(),
        player_input=request.question,
    )

    # Get Claude response
    try:
        client = get_client()
        system_prompt = build_witness_system_prompt(witness.get("name", "Unknown"))
        witness_response = await client.get_response(prompt, system=system_prompt)
    except ClaudeClientError as e:
        raise HTTPException(status_code=503, detail=f"LLM service error: {e}")

    # Check for newly available secrets in this response
    secrets_revealed: list[str] = []
    # NOTE: No longer using get_available_secrets() - all secrets always available to LLM
    all_secrets = witness.get("secrets", [])

    for secret in all_secrets:
        secret_id = secret.get("id", "")
        if secret_id and secret_id not in witness_state.secrets_revealed:
            # Check if secret content appears in response (LLM chose to reveal)
            secret_text = secret.get("text", "").lower()
            if any(phrase in witness_response.lower() for phrase in secret_text.split()[:3]):
                witness_state.reveal_secret(secret_id)
                secrets_revealed.append(secret_id)

    # Add to conversation history
    witness_state.add_conversation(
        question=request.question,
        response=witness_response,
        trust_delta=trust_delta,
    )

    # Build secret_texts dict for revealed secrets
    secret_texts: dict[str, str] = {}
    for secret in all_secrets:
        secret_id = secret.get("id", "")
        if secret_id in secrets_revealed:
            secret_texts[secret_id] = secret.get("text", "").strip()

    # Save updated state
    state.update_witness_state(witness_state)
    save_state(state, request.player_id)

    return InterrogateResponse(
        response=witness_response,
        trust=witness_state.trust,
        trust_delta=trust_delta,
        secrets_revealed=secrets_revealed,
        secret_texts=secret_texts,
    )
```

**Update `_handle_evidence_presentation()` function:**

```python
async def _handle_evidence_presentation(
    witness: dict[str, Any],
    evidence_id: str,
    state: PlayerState,
    witness_state: WitnessState,
    player_id: str,
) -> InterrogateResponse:
    """Handle evidence presentation to witness.

    Trust bonus only given first time evidence shown to this witness.

    Args:
        witness: Witness data dict
        evidence_id: Evidence ID being presented
        state: Player state
        witness_state: Current witness state
        player_id: Player ID for saving

    Returns:
        Interrogate response with witness reaction
    """
    # Get evidence details (existing code to find evidence in case data)
    evidence_name = "the evidence"
    evidence_desc = ""
    # ... existing code to populate evidence_name and evidence_desc ...

    # NEW: Check if evidence already shown to this witness
    is_first_time = witness_state.mark_evidence_shown(evidence_id)

    # Calculate trust delta (bonus only first time)
    from src.utils.trust import EVIDENCE_PRESENTATION_BONUS
    trust_delta = EVIDENCE_PRESENTATION_BONUS if is_first_time else 0
    witness_state.adjust_trust(trust_delta)

    # Build prompt with evidence context
    prompt = f"""The Auror shows you {evidence_name}.

Evidence description: {evidence_desc}

How do you respond? Stay in character. Consider:
- Your personality: {witness.get("personality", "")}
- Your knowledge about this evidence
- Your trust level: {witness_state.trust}/100
- What you're hiding (your secrets)

Respond naturally in 2-4 sentences as {witness.get("name", "Unknown")}:"""

    # Get Claude response (existing code)
    try:
        client = get_client()
        system_prompt = build_witness_system_prompt(witness.get("name", "Unknown"))
        witness_response = await client.get_response(prompt, system=system_prompt)
    except ClaudeClientError as e:
        raise HTTPException(status_code=503, detail=f"LLM service error: {e}")

    # Check for secret revelation (existing code)
    secrets_revealed: list[str] = []
    all_secrets = witness.get("secrets", [])

    for secret in all_secrets:
        secret_id = secret.get("id", "")
        if secret_id and secret_id not in witness_state.secrets_revealed:
            secret_text = secret.get("text", "").lower()
            if any(phrase in witness_response.lower() for phrase in secret_text.split()[:3]):
                witness_state.reveal_secret(secret_id)
                secrets_revealed.append(secret_id)

    # Add to conversation history
    witness_state.add_conversation(
        question=f"[SHOWED EVIDENCE: {evidence_name}]",
        response=witness_response,
        trust_delta=trust_delta,
    )

    # Build secret_texts dict
    secret_texts: dict[str, str] = {}
    for secret in all_secrets:
        secret_id = secret.get("id", "")
        if secret_id in secrets_revealed:
            secret_texts[secret_id] = secret.get("text", "").strip()

    # Save updated state
    state.update_witness_state(witness_state)
    save_state(state, player_id)

    return InterrogateResponse(
        response=witness_response,
        trust=witness_state.trust,
        trust_delta=trust_delta,
        secrets_revealed=secrets_revealed,
        secret_texts=secret_texts,
    )
```

---

## Implementation Tasks

**Total: ~2 hours**

1. **Clean keywords** (15 min)
   - Update AGGRESSIVE_KEYWORDS in trust.py (remove: "suspect", "hiding", "know you", "did it", "admit", "confess", "criminal")
   - Update EMPATHETIC_KEYWORDS in trust.py (remove: "help", "remember", "tell me", "believe", "trust")
   - Update EVIDENCE_PRESENTATION_BONUS = 5

2. **Add fuzzy evidence matching** (30 min)
   - Add `match_evidence_to_inventory()` function in trust.py
   - Test: "diary" → "hidden_note", "frost" → "frost_pattern", "wand" → "wand_signature"

3. **Add evidence tracking** (10 min)
   - Add `evidence_shown: list[str]` field to WitnessState in player_state.py
   - Add `mark_evidence_shown()` method

4. **Simplify secret formatting** (20 min)
   - Replace `format_secrets_for_prompt()` with `format_secrets_with_context()` in witness.py
   - Remove trigger parsing logic
   - Just list secrets with IDs

5. **Update witness prompt** (20 min)
   - Update `build_witness_prompt()` in witness.py
   - Remove `get_available_secrets()` filtering call
   - Add static investigative context
   - Soften guidelines: "YOU decide"

6. **Update evidence detection** (15 min)
   - Add fuzzy matching call in `interrogate_witness()` in routes.py
   - Import and call `match_evidence_to_inventory()`

7. **Update evidence handler** (15 min)
   - Update `_handle_evidence_presentation()` in routes.py
   - Call `witness_state.mark_evidence_shown()`
   - Apply trust bonus only if `is_first_time`

8. **Integration testing** (30 min)
   - Test full conversation flows
   - Verify trust adjustments
   - Check evidence fuzzy matching
   - Verify secrets revealed naturally
   - Check one-time bonus logic

---

## Testing Checklist

### Trust Keywords (trust.py)
- [ ] "You're lying" → -10 trust
- [ ] "liar" → -10 trust
- [ ] "I believe you" → +5 trust
- [ ] "please help" → +5 trust
- [ ] Neutral question → 0 trust
- [ ] Removed terms ("suspect", "help") don't trigger bonuses/penalties

### Evidence Presentation (trust.py, routes.py, player_state.py)
- [ ] `match_evidence_to_inventory("diary", [...], case_data)` → "hidden_note"
- [ ] `match_evidence_to_inventory("frost", [...], case_data)` → "frost_pattern"
- [ ] `match_evidence_to_inventory("note", [...], case_data)` → "hidden_note"
- [ ] Invalid word → None
- [ ] First presentation to witness → +5 trust
- [ ] Second presentation same evidence to same witness → +0 trust
- [ ] Same evidence to different witness → +5 trust (separate tracking)
- [ ] Different evidence to same witness → +5 trust

### Secrets (witness.py, routes.py)
- [ ] LLM sees all secrets regardless of trust level
- [ ] Low trust (20) + irrelevant question → secret not revealed
- [ ] High trust (80) + relevant question → secret revealed
- [ ] Medium trust (50) + perfect question → secret may be revealed (LLM judgment)
- [ ] Mandatory lie triggers at low trust (existing behavior)
- [ ] Secrets revealed naturally in conversation flow

### Investigation Context (witness.py)
- [ ] Base prompt includes "You are being questioned by an Auror"
- [ ] "I order you to answer" → witness reacts naturally (no crash)
- [ ] "This is official business" → witness shows appropriate response
- [ ] Normal questions → normal responses

### Integration (full flow)
- [ ] Chat evidence presentation: "show the diary" → fuzzy match → +5 trust first time
- [ ] Repeated evidence: "present frost again" → +0 trust
- [ ] Secret revelation: High trust + relevant question → natural reveal
- [ ] Cross-witness: Learn from Hermione → confront Draco → natural reaction
- [ ] All backend tests pass
- [ ] Lint passes (ruff)
- [ ] Type check passes (mypy)

---

## Success Criteria

1. ✅ All backend tests pass (expected: 839 total = 754 existing + 85 new)
2. ✅ Lint (ruff check .) passes with 0 errors
3. ✅ Type check (mypy src/) passes with 0 errors
4. ✅ Test coverage >95% on modified files
5. ✅ case_001.yaml and case_002.yaml load without errors
6. ✅ Manual verification:
   - Trust adjustments work correctly
   - Evidence fuzzy matching works
   - One-time bonus applies correctly
   - Secrets revealed naturally (not rigidly gated)
   - Witness conversations feel natural

---

## Backward Compatibility

**YAML files**: No changes required. Existing `trigger` fields in secrets are ignored (not removed).

**Example (no changes needed):**
```yaml
witnesses:
  - id: "hermione"
    secrets:
      - id: "saw_draco"
        trigger: "trust>70 OR evidence:frost_pattern"  # Ignored, but kept for compat
        text: "I saw Draco near the window at 9pm"
```

**State files**: New `evidence_shown` field defaults to empty list (backward compatible with existing save files).

---

## Key Philosophy

**Before:**
- `get_available_secrets()` filters by triggers
- Rigid gates: `trust>70` must be TRUE
- LLM sees only "available" secrets

**After:**
- Show ALL secrets to LLM always
- Trust is context, not rule
- LLM decides based on: relevance, flow, safety, personality
- Static investigative context (no programmatic pressure detection)
