# Trust System Implementation Plan

## Overview

Enhance witness trust mechanic with:
- Clean, unambiguous global keywords
- Evidence presentation bonus
- Authority/pressure detection (no penalty, just context)
- Flexible LLM-driven secret revelation based on: relevance, conversation context, safety, trust

**Philosophy:** Trust is a guide, not a gate. LLM decides naturally.

---

## File Changes

### File 1: `backend/src/utils/trust.py`

**Changes:**
1. Clean up AGGRESSIVE_KEYWORDS (remove ambiguous)
2. Clean up EMPATHETIC_KEYWORDS (remove ambiguous)
3. Add PRESSURE_KEYWORDS (for detection only)
4. Increase EVIDENCE_PRESENTATION_BONUS to 5
5. Add `detect_pressure()` helper

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

# NEW: Authority/Pressure keywords (detection only, NO penalty)
PRESSURE_KEYWORDS = [
    "order you",
    "ministry",
    "auror authority",
    "duty to answer",
    "legally required",
    "obstruction",
    "withholding information",
    "official investigation",
    "answer the question",
    "compliance",
]

AGGRESSIVE_PENALTY = -10
EMPATHETIC_BONUS = 5
EVIDENCE_PRESENTATION_BONUS = 5  # Increased from 3

# NEW: Simple pressure detection helper
def detect_pressure(question: str) -> bool:
    """Check if player is using authority/pressure.

    Args:
        question: Player's question

    Returns:
        True if pressure keywords detected
    """
    return any(kw in question.lower() for kw in PRESSURE_KEYWORDS)
```

**Note:** Keep existing `calculate_trust_delta()`, `adjust_trust()`, `clamp_trust()` functions as-is.

---

### File 2: `backend/src/context/witness.py`

**Changes:**
1. Import `detect_pressure` from trust.py
2. Add `format_secrets_with_context()` helper function
3. Update `build_witness_prompt()` to:
   - Show all secrets with context hints
   - Detect pressure and add context
   - Soften all rules to flexible guidelines

**Add new import at top:**
```python
from src.utils.trust import get_available_secrets, should_lie, detect_pressure
```

**Add new helper function:**
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

    # Detect if pressure is being applied
    pressure_applied = detect_pressure(player_input)

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

    pressure_context = ""
    if pressure_applied:
        pressure_context = """
== AUTHORITY INVOKED ==
The Auror is using their official authority. Consider:
- You're compelled to engage more directly
- You may show resentment/fear but it's harder to completely refuse
- You might reveal information reluctantly
"""

    return f"""You are {name}, a character in a Harry Potter detective game at Hogwarts.

== YOUR PERSONALITY ==
{personality}

== YOUR BACKGROUND ==
{background}

{psychology_section}== YOUR KNOWLEDGE ==
{knowledge_text}

== CURRENT TRUST: {trust}/100 ==
{pressure_context}
== SECRETS YOU KNOW (what you're hiding) ==
{secrets_text}

YOU decide whether to reveal any secrets based on:
- Is the question directly relevant to this secret?
- Does the conversation flow naturally lead here?
- Do you feel safe revealing this? (consider trust level, pressure, your fears)
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

---

### File 3: `backend/src/api/routes.py`

**Changes:** None required!

The existing `interrogate_witness()` function already:
- Calls `calculate_trust_delta()` for trust adjustment
- Calls `build_witness_prompt()` with all context
- Passes player question and state to prompt builder
- Lets LLM generate natural responses

No modifications needed. The updated `trust.py` and `witness.py` will be used automatically.

---

## Summary

**Total changes:**
- 2 files modified
- 1 new helper function (`format_secrets_with_context`)
- 1 new detection function (`detect_pressure`)
- 0 new files created

**Result:**
- ✅ Clean, unambiguous keyword detection
- ✅ Evidence presentation bonus = 5
- ✅ Pressure detection adds context (no penalty)
- ✅ Flexible LLM-driven secret revelation
- ✅ Natural conversation flow
- ✅ Trust as guide, not gate

**Testing checklist:**
1. Aggressive language → -10 trust
2. Empathetic language → +5 trust
3. Evidence presentation → +5 trust bonus
4. Pressure keywords → No penalty, but witness responds more directly
5. Secrets revealed naturally when relevant + trust sufficient
6. Mandatory lies still trigger at low trust

---

## Evidence Presentation via Chat

**Feature:** Allow players to show evidence by typing "Look at this diary" instead of only using UI buttons.

**Current state:** Detection exists in `trust.py:314` (`detect_evidence_presentation()`), but only extracts raw word. Need fuzzy matching and one-time bonus tracking.

---

### Additional File Changes

#### File 1: `backend/src/utils/trust.py` (Additional Changes)

**Add fuzzy evidence matcher:**

```python
def match_evidence_to_inventory(
    extracted_word: str,
    discovered_evidence: list[str],
    case_data: dict[str, Any],
) -> str | None:
    """Fuzzy match player's word to actual evidence ID.

    Matches against:
    1. Exact evidence ID
    2. Evidence name (case-insensitive)
    3. Words in evidence description

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

**Keep existing `detect_evidence_presentation()` as-is.**

---

#### File 2: `backend/src/state/player_state.py`

**Add evidence tracking to WitnessState:**

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

    # ... existing methods ...

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
```

---

#### File 3: `backend/src/api/routes.py` (Additional Changes)

**Update `interrogate_witness()` function (around line 1340):**

```python
async def interrogate_witness(request: InterrogateRequest) -> InterrogateResponse:
    # ... existing code until evidence detection ...

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

    # ... rest of function ...
```

**Update `_handle_evidence_presentation()` function (around line 1310):**

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
    """
    # Get evidence details
    evidence_name = "the evidence"  # Fetch from case data
    # ... existing code to get evidence details ...

    # NEW: Check if evidence already shown to this witness
    is_first_time = witness_state.mark_evidence_shown(evidence_id)

    # Calculate trust delta (bonus only first time)
    trust_delta = EVIDENCE_PRESENTATION_BONUS if is_first_time else 0
    witness_state.adjust_trust(trust_delta)

    # Build prompt with evidence context
    prompt = f"The investigator shows you {evidence_name}. How do you respond?"
    # ... rest of existing evidence handling ...

    # Include first_time status in response metadata
    return InterrogateResponse(
        response=witness_response,
        trust=witness_state.trust,
        trust_delta=trust_delta,
        secrets_revealed=secrets_revealed,
        secret_texts=secret_texts,
        # Could add: evidence_already_seen=not is_first_time
    )
```

---

### Evidence Presentation Summary

**Total additional changes:**
- 1 new function in `trust.py` (`match_evidence_to_inventory`)
- 1 new field in `WitnessState` (`evidence_shown`)
- 1 new method in `WitnessState` (`mark_evidence_shown`)
- Updates to 2 functions in `routes.py`

**Flow:**
1. Player types "Look at this diary"
2. `detect_evidence_presentation()` extracts "diary"
3. `match_evidence_to_inventory()` fuzzy matches to "hidden_note" ID
4. Check if "hidden_note" in discovered evidence
5. Call `_handle_evidence_presentation()`
6. Check if first time showing to this witness
7. Apply +5 trust bonus if first time, 0 if repeated
8. Track in `witness_state.evidence_shown`

**UI button integration:**
- UI can call same endpoint with pre-validated evidence ID
- Same one-time bonus logic applies
- Both chat and UI use identical backend flow

**Testing checklist (additional):**
1. "show diary" matches "hidden_note" evidence
2. First presentation → +5 trust
3. Second presentation of same evidence → +0 trust
4. Different evidence → +5 trust (separate tracking)
5. UI button and chat produce same behavior

---

## Secrets System Philosophy

**What secrets are:**
- Conditional witness knowledge (hidden behind trust/evidence triggers)
- Intelligence player uses to unlock dialogue options and witness reactions
- Information that strengthens reasoning at verdict (but not strictly required)

**What secrets are NOT:**
- Not formal evidence items in inventory
- Not tracked with UI indicators
- Not mechanically required for case solution
- Not explicitly linked between witnesses

---

### How Secrets Work

**Discovery flow:**
1. Player asks questions and builds relationship with witness
2. LLM always sees ALL secrets (no filtering, no gates)
3. LLM decides whether to reveal based on:
   - Question relevance to secret
   - Natural conversation flow
   - Safety/trust level (as context, not rule)
   - Witness personality and fears
4. Player mentally tracks what they learned

**Cross-witness usage:**
Player learns from Hermione: "I saw Draco at the window"

Later, player talks to Draco:
- Player: "Hermione told me she saw you at the window that night"
- Draco's prompt shows his own secrets (what he's hiding)
- LLM naturally reacts to confrontation (deny/admit/deflect based on personality and trust)
- No explicit cross-witness tracking system needed

**Key insight:** Each witness has their own secrets (what they know/hide). When player mentions information from another witness, current witness reacts naturally based on context.

---

### Secrets at Verdict

**Role in reasoning:**
Secrets strengthen the player's argument by providing corroborating testimony:

Example strong reasoning:
> "Draco is guilty because the frost pattern evidence shows a freezing charm was cast from outside, Hermione testified she saw him at the window at 9pm, and when I confronted Draco with this information, he became defensive and eventually admitted he was there."

**Scoring approach:**
- Physical evidence: Core points
- Revealed secrets (testimony): Bonus points
- Cross-referencing witnesses: Additional bonus
- Winning without secrets: Still possible, but harder

**No strict requirements:**
- Secrets are "good to have" not "must have"
- Player can win with just physical evidence + strong reasoning
- Secrets make the case stronger and more compelling

---

### Implementation Notes for Secrets

**Changes needed:**
1. **Remove trigger enforcement:** Show ALL secrets to LLM always (no filtering)
2. **Simplify prompt:** Remove rigid rules, emphasize LLM judgment
3. **Keep tracking:** Still detect and track revealed secrets for scoring/progression
4. **Keep lies:** Mandatory lies at low trust remain (only rigid rule)

**YAML structure stays simple:**
```yaml
secrets:
  - id: "saw_draco"
    text: "I saw Draco near the window at 9pm"
  - id: "borrowed_book"
    text: "I borrowed a restricted book"
```

No triggers needed. LLM sees all secrets and decides naturally.

**Code changes needed:**
- Remove `get_available_secrets()` filtering logic
- Pass all secrets to `format_secrets_with_context()`
- Simplify context hints (no trigger parsing)
- Emphasize flexibility in prompt

**No cross-witness tracking needed:**
- Player tracks what they learned mentally
- Player mentions it explicitly in questions
- Witness reacts based on their own personality/trust/secrets
- Natural conversation flow, no mechanical linking

---

### Secrets Design Principles

1. **Player agency:** Player decides what to pursue and when to mention
2. **Natural flow:** No rigid "unlock X to proceed" gates
3. **Mental engagement:** Player remembers and connects information
4. **Flexible reasoning:** Multiple paths to solve case
5. **Reward thoroughness:** Secrets make case stronger but aren't required

**Example case structure:**
```yaml
witnesses:
  - id: "hermione"
    personality: "Brilliant, logical, nervous when hiding something"
    fears: "Retaliation from Slytherins"
    secrets:
      - id: "saw_draco"
        text: "I saw Draco near the window at 9pm"
      - id: "borrowed_book"
        text: "I borrowed a restricted book for my essay"

  - id: "draco"
    personality: "Arrogant, defensive, values family reputation"
    fears: "Father's disappointment, expulsion"
    secrets:
      - id: "was_watching_victim"
        text: "Fine. I was outside the window practicing charms"
```

**No triggers.** LLM decides based on:
- Hermione's fear of retaliation → Won't reveal "saw_draco" until she feels safe
- Draco's arrogance → Won't admit "was_watching_victim" until cornered
- Natural conversation flow and question relevance

When player tells Draco "Hermione saw you," Draco sees his own secret and realizes player has corroborating information. Natural tension emerges without explicit linking.
