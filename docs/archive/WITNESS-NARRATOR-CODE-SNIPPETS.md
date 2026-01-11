# Code Snippets: Witness & Narrator LLM Implementation

**Reference**: Direct code from project files
**Date**: 2026-01-09

---

## 1. Narrator: How It Currently Works (NO History)

### Source: `/backend/src/context/narrator.py`

```python
# Lines 83-147: Narrator prompt builder (NO conversation history parameter)
def build_narrator_prompt(
    location_desc: str,
    hidden_evidence: list[dict[str, Any]],
    discovered_ids: list[str],
    not_present: list[dict[str, Any]],
    player_input: str,
    surface_elements: list[str] | None = None,
) -> str:
    """Build narrator LLM prompt with strict rules.

    NOTE: ❌ No conversation_history parameter
    This means narrator doesn't know previous responses!
    """
    evidence_section = format_hidden_evidence(hidden_evidence, discovered_ids)
    not_present_section = format_not_present(not_present)
    discovered_section = ", ".join(discovered_ids) if discovered_ids else "None"
    surface_section = format_surface_elements(surface_elements or [])

    return f"""You are the narrator for a Harry Potter detective game set at Hogwarts.

== CURRENT LOCATION ==
{location_desc.strip()}

== VISIBLE ELEMENTS (weave naturally into descriptions) ==
{surface_section}

IMPORTANT: When describing the scene or responding to player actions, naturally incorporate
these visible elements into your atmospheric prose. Do NOT list them explicitly.

== HIDDEN EVIDENCE (reveal if player investigates correctly) ==
{evidence_section}

== ALREADY DISCOVERED (do not repeat discoveries) ==
{discovered_section}

== NOT PRESENT (use exact responses for these) ==
{not_present_section}

== RULES ==
1. If player action matches hidden evidence triggers -> reveal the evidence
2. If player asks about already discovered evidence -> respond with "You've already examined this thoroughly."
3. If player asks about not_present items -> use the EXACT defined response
4. If player asks about undefined/random things -> describe the atmosphere only, NO new clues
5. Keep responses to 2-4 sentences - atmospheric but concise
...

== PLAYER ACTION ==
"{player_input}"

Respond as the narrator (2-4 sentences):"""
    # ❌ NO HISTORY INCLUDED - Narrator won't know what it said before!
```

### Routes Integration: `/backend/src/api/routes.py` Lines 403-411

```python
# POST /api/investigate endpoint - Building narrator prompt
prompt = build_narrator_prompt(
    location_desc=location.get("description", ""),
    hidden_evidence=location.get("hidden_evidence", []),
    discovered_ids=state.discovered_evidence,
    not_present=location.get("not_present", []),
    player_input=request.player_input,
    surface_elements=location.get("surface_elements", []),
    # ❌ conversation_history NOT PASSED
)

narrator_response = await client.get_response(prompt, system=system_prompt)

# Save to global conversation (mixed with tom/player)
state.add_conversation_message("narrator", narrator_response)
```

---

## 2. Witness: How It Works Correctly (WITH History Per Witness)

### Source: `/backend/src/context/witness.py`

```python
# Lines 54-75: Conversation history formatter
def format_conversation_history(history: list[dict[str, Any]]) -> str:
    """Format conversation history for context.

    Args:
        history: List of conversation items (question/response pairs)

    Returns:
        Formatted string for prompt
    """
    if not history:
        return "This is the start of the conversation."

    lines = []
    for item in history[-5:]:  # ✅ Last 5 exchanges for context
        question = item.get("question", "")
        response = item.get("response", "")
        lines.append(f"Player: {question}")
        lines.append(f"You: {response}")
        lines.append("")

    return "\n".join(lines)


# Lines 114-203: Witness prompt builder WITH history
def build_witness_prompt(
    witness: dict[str, Any],
    trust: int,
    discovered_evidence: list[str],
    conversation_history: list[dict[str, Any]],  # ✅ INCLUDED
    player_input: str,
) -> str:
    """Build witness LLM prompt with personality, trust, and secrets.

    CRITICAL: This prompt is ISOLATED from narrator context.
    Witness does NOT know investigation details, case solution, or narrator content.
    """
    name = witness.get("name", "Unknown Witness")
    personality = witness.get("personality", "").strip()
    background = witness.get("background", "").strip()
    knowledge = witness.get("knowledge", [])
    lies = witness.get("lies", [])

    # Get available secrets based on trust + evidence
    available_secrets = get_available_secrets(witness, trust, discovered_evidence)

    # Check if witness should lie
    lie_response = should_lie(witness, player_input, trust)

    # Format sections
    knowledge_text = format_knowledge(knowledge)
    secrets_text = format_secrets_for_prompt(available_secrets, trust)
    history_text = format_conversation_history(conversation_history)  # ✅ FORMAT HISTORY
    lie_topics_text = format_lie_topics(lies)
    trust_behavior = get_trust_behavior_text(trust)

    return f"""You are {name}, a character in a Harry Potter detective game at Hogwarts.

== YOUR PERSONALITY ==
{personality}

== YOUR BACKGROUND ==
{background}

== YOUR KNOWLEDGE (what you remember from that night) ==
{knowledge_text}

== CURRENT TRUST LEVEL: {trust}/100 ==
Behavior at this trust level: {trust_behavior}

== AVAILABLE SECRETS (reveal ONLY if player asks directly and trust is sufficient) ==
{secrets_text}

== CONVERSATION HISTORY ==  # ✅ HISTORY INCLUDED HERE
{history_text}

== CRITICAL RULES (DO NOT VIOLATE) ==
1. You are {name} - stay in character at ALL times
2. You DO NOT know:
   - Investigation details beyond your personal knowledge
   - What other witnesses have said
   - The case solution or who committed the crime
   - What the narrator has described
   - Evidence the player hasn't shown you
3. Respond naturally in 2-4 sentences as {name} would speak
...

== PLAYER'S QUESTION ==
"{player_input}"

Respond as {name} (2-4 sentences, in character):"""
```

### State Definition: `/backend/src/state/player_state.py` Lines 92-130

```python
class ConversationItem(BaseModel):
    """Single conversation exchange with witness."""

    question: str
    response: str
    timestamp: datetime = Field(default_factory=_utc_now)
    trust_delta: int = 0


class WitnessState(BaseModel):
    """State tracking for a specific witness interrogation."""

    witness_id: str
    trust: int
    conversation_history: list[ConversationItem] = Field(default_factory=list)  # ✅ PER-WITNESS
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

    def get_history_as_dicts(self) -> list[dict[str, Any]]:
        """Get conversation history as list of dicts for prompt building."""
        return [
            {"question": item.question, "response": item.response}
            for item in self.conversation_history
        ]
```

### Routes Integration: `/backend/src/api/routes.py` Lines 716-820

```python
@router.post("/interrogate", response_model=InterrogateResponse)
async def interrogate_witness(request: InterrogateRequest) -> InterrogateResponse:
    """Interrogate a witness with a question."""
    # ... load case and witness ...

    # Step 1: Get or create witness state ✅ PER-WITNESS
    base_trust = witness.get("base_trust", 50)
    witness_state = state.get_witness_state(request.witness_id, base_trust)

    # Step 2: Adjust trust based on question tone
    trust_delta = adjust_trust(request.question, witness.get("personality", ""))
    witness_state.adjust_trust(trust_delta)

    # Step 3: Build witness prompt WITH history ✅
    prompt = build_witness_prompt(
        witness=witness,
        trust=witness_state.trust,
        discovered_evidence=state.discovered_evidence,
        conversation_history=witness_state.get_history_as_dicts(),  # ✅ PASSED
        player_input=request.question,
    )

    # Step 4: Get Claude response
    system_prompt = build_witness_system_prompt(witness.get("name", "Unknown"))
    witness_response = await client.get_response(prompt, system=system_prompt)

    # Step 5: Check if response reveals any secrets
    check_evidence_presentation(
        witness, witness_state.trust, state.discovered_evidence
    )

    # Step 6: Save conversation back to witness state ✅
    witness_state.add_conversation(
        question=request.question,
        response=witness_response,
        trust_delta=trust_delta,
    )
    state.update_witness_state(witness_state)

    return InterrogateResponse(
        response=witness_response,
        trust=witness_state.trust,
        trust_delta=trust_delta,
        secrets_revealed=newly_revealed_secrets,
    )
```

---

## 3. Tom: Hybrid Approach (WITH History, But Global)

### Source: `/backend/src/context/tom_llm.py`

```python
# Lines 213-243: Tom's conversation history formatter
def format_tom_conversation_history(history: list[dict[str, str]]) -> str:
    """Format Tom's conversation history for prompt.

    Args:
        history: List of exchanges from InnerVoiceState.conversation_history

    Returns:
        Formatted conversation history string (last 3 exchanges)
    """
    if not history:
        return "No previous conversation"

    # Take last 3 exchanges (most recent) ✅
    recent = history[-3:]

    lines = []
    for exchange in recent:
        user_msg = exchange.get("user", "")
        tom_msg = exchange.get("tom", "")

        # Skip auto-comments (no player input) for brevity
        if user_msg == "[auto-comment]":
            continue

        lines.append(f"Player: {user_msg}")
        lines.append(f"Tom: {tom_msg}")
        lines.append("")  # Blank line between exchanges

    result = "\n".join(lines).strip()
    return result if result else "No previous conversation"


# Lines 245-312: Tom context prompt WITH history
def build_context_prompt(
    case_context: dict[str, Any],
    evidence_discovered: list[dict[str, Any]],
    conversation_history: list[dict[str, str]],  # ✅ INCLUDED
    user_message: str | None = None,
) -> str:
    """Build context message for Tom's response.

    Args:
        case_context: Case facts (victim, location, suspects, witnesses)
        evidence_discovered: List of evidence dicts with descriptions
        conversation_history: Previous exchanges with Tom (for memory) ✅
        user_message: If player directly asked Tom something

    Returns:
        Formatted context prompt
    """
    # Format evidence list
    if evidence_discovered:
        evidence_str = "\n".join(
            [
                f"- {e.get('name', e.get('id', 'Unknown'))}: {e.get('description', 'No description')[:100]}"
                for e in evidence_discovered
            ]
        )
    else:
        evidence_str = "None discovered yet"

    # Format suspects
    suspects = case_context.get("suspects", [])
    suspects_str = ", ".join(suspects) if suspects else "Unknown"

    # Format witnesses
    witnesses = case_context.get("witnesses", [])
    witnesses_str = ", ".join(witnesses) if witnesses else "Unknown"

    # Format conversation history ✅
    history_str = format_tom_conversation_history(conversation_history)

    context = f"""CASE FACTS (what you know):
Victim: {case_context.get("victim", "Unknown")}
Location: {case_context.get("location", "Unknown")}
Suspects: {suspects_str}
Witnesses: {witnesses_str}

EVIDENCE DISCOVERED SO FAR:
{evidence_str}

RECENT CONVERSATION (avoid repetition, build on previous exchanges):  # ✅ HISTORY SECTION
{history_str}
"""

    if user_message:
        context += f"""
PLAYER'S QUESTION TO YOU:
"{user_message}"

Respond as Tom Thornfield.
CRITICAL: 2-3 sentences MAX. 30-50 words TOTAL. Plain text, NO formatting."""
    else:
        context += """
The player just discovered new evidence. Comment on it as Tom would.
React to the evidence, the suspects, or the investigation approach.

Respond as Tom Thornfield.
CRITICAL: 2-3 sentences MAX. 30-50 words TOTAL. Plain text, NO formatting."""

    return context
```

### State Definition: `/backend/src/state/player_state.py` Lines 175-290

```python
class InnerVoiceState(BaseModel):
    """State for Tom's inner voice system.

    Tracks:
    - Fired triggers (to prevent repeats) - LEGACY
    - Trigger history (for analytics/debugging)
    - Total comment count
    - Trust level (0.0-1.0, grows 10% per case completed)
    - Conversation history (for Phase 4.1+ LLM mode) ✅
    """

    case_id: str
    fired_triggers: list[str] = Field(default_factory=list)  # LEGACY
    trigger_history: list[TomTriggerRecord] = Field(default_factory=list)
    total_interruptions: int = 0

    # Phase 4.1: Trust system and LLM mode
    trust_level: float = Field(default=0.0, ge=0.0, le=1.0)  # 0.0-1.0
    cases_completed: int = Field(default=0, ge=0)
    conversation_history: list[dict[str, str]] = Field(default_factory=list)  # ✅ GLOBAL
    total_comments: int = 0
    last_comment_at: datetime | None = None

    def add_tom_comment(self, user_msg: str | None, tom_response: str) -> None:
        """Add Tom conversation exchange to history.

        Args:
            user_msg: Player's message (None if auto-comment)
            tom_response: Tom's response text
        """
        self.conversation_history.append(
            {
                "user": user_msg or "[auto-comment]",
                "tom": tom_response,
                "timestamp": _utc_now().isoformat(),
            }
        )
        self.total_comments += 1
        self.last_comment_at = _utc_now()
```

### Routes Integration: `/backend/src/api/routes.py` Lines 1550-1692

```python
@router.post("/case/{case_id}/tom/auto-comment")
async def tom_auto_comment(
    case_id: str,
    request: TomAutoCommentRequest,
    player_id: str = "default",
) -> dict[str, Any]:
    """Tom auto-comment endpoint (30% chance when evidence discovered)."""
    # ... load state and case ...

    # Get Tom's inner voice state ✅
    inner_voice_state = state.get_inner_voice_state()

    # Build context WITH history ✅
    prompt = build_context_prompt(
        case_context=case_context,
        evidence_discovered=evidence_filtered,
        conversation_history=inner_voice_state.conversation_history,  # ✅ PASSED
        user_message=None,  # Auto-comment has no direct question
    )

    # Generate Tom response
    try:
        response_text, mode_used = await generate_tom_response(
            case_context=case_context,
            evidence_discovered=evidence_filtered,
            trust_level=inner_voice_state.trust_level,
            conversation_history=inner_voice_state.conversation_history,  # ✅ PASSED
            mode=None,
            user_message=None,
        )
    except Exception:
        response_text, mode_used = tom_fallback(), "fallback"

    # Save Tom comment ✅
    inner_voice_state.add_tom_comment(None, response_text)

    # Save message to global conversation ✅
    state.add_conversation_message("tom", response_text)


@router.post("/case/{case_id}/tom/chat")
async def tom_chat(
    case_id: str,
    request: TomChatRequest,
    player_id: str = "default",
) -> dict[str, Any]:
    """Tom direct chat endpoint (always responds)."""
    # ... load state and case ...

    # Get Tom's inner voice state ✅
    inner_voice_state = state.get_inner_voice_state()

    # Generate Tom response WITH history and user message ✅
    response_text, mode_used = await generate_tom_response(
        case_context=case_context,
        evidence_discovered=evidence_filtered,
        trust_level=inner_voice_state.trust_level,
        conversation_history=inner_voice_state.conversation_history,  # ✅ PASSED
        mode=None,
        user_message=request.message,  # ✅ DIRECT QUESTION
    )

    # Save Tom comment ✅
    inner_voice_state.add_tom_comment(request.message, response_text)

    # Save messages to global conversation ✅
    state.add_conversation_message("player", request.message)
    state.add_conversation_message("tom", response_text)
```

---

## 4. Proposed: How Narrator Would Work With History

### What We'd Add to `narrator.py`

```python
# NEW: Function similar to witness.py line 54
def format_narrator_conversation_history(history: list[dict[str, Any]]) -> str:
    """Format location-specific narrator conversation history for context.

    Args:
        history: List of conversation items from NarratorLocationState

    Returns:
        Formatted string for prompt (last 3 exchanges)
    """
    if not history:
        return "This is the start of your investigation in this location."

    lines = []
    recent = history[-3:]  # Last 3 narrator responses

    for item in recent:
        text = item.get("text", "")
        if text:
            lines.append(f"Narrator: {text}")
            lines.append("")

    result = "\n".join(lines).strip()
    return result if result else "This is the start of your investigation in this location."


# MODIFIED: Add conversation_history parameter (line 83)
def build_narrator_prompt(
    location_desc: str,
    hidden_evidence: list[dict[str, Any]],
    discovered_ids: list[str],
    not_present: list[dict[str, Any]],
    player_input: str,
    surface_elements: list[str] | None = None,
    conversation_history: list[dict[str, Any]] | None = None,  # ✅ NEW PARAM
) -> str:
    """Build narrator LLM prompt with strict rules.

    NOW INCLUDES: conversation_history parameter for location-specific memory
    """
    evidence_section = format_hidden_evidence(hidden_evidence, discovered_ids)
    not_present_section = format_not_present(not_present)
    discovered_section = ", ".join(discovered_ids) if discovered_ids else "None"
    surface_section = format_surface_elements(surface_elements or [])

    # ✅ NEW: Format conversation history
    history_section = format_narrator_conversation_history(conversation_history or [])

    return f"""You are the narrator for a Harry Potter detective game set at Hogwarts.

== CURRENT LOCATION ==
{location_desc.strip()}

== VISIBLE ELEMENTS (weave naturally into descriptions) ==
{surface_section}

== PREVIOUS OBSERVATIONS IN THIS LOCATION ==  # ✅ NEW SECTION
{history_section}

IMPORTANT: When describing the scene, naturally incorporate visible elements AND reference
previous observations you've made. Avoid repeating the same details. Build on context.

== HIDDEN EVIDENCE (reveal if player investigates correctly) ==
{evidence_section}

== ALREADY DISCOVERED (do not repeat discoveries) ==
{discovered_section}

== NOT PRESENT (use exact responses for these) ==
{not_present_section}

== RULES ==
1. Reference previous observations naturally if relevant (avoid repetition) ✅
2. If player asks about something you already described, acknowledge it ✅
3. If player action matches hidden evidence triggers -> reveal the evidence
...

== PLAYER ACTION ==
"{player_input}"

Respond as the narrator (2-4 sentences):"""
```

### What We'd Add to `player_state.py`

```python
# NEW: Class (before line 292)
class NarratorLocationState(BaseModel):
    """Separate conversation history per location."""

    location_id: str
    conversation_history: list[dict[str, Any]] = Field(default_factory=list)
    discovered_evidence_count: int = 0
    last_visited: datetime | None = None

    def add_response(self, text: str, timestamp: int | None = None) -> None:
        """Add narrator response for this location."""
        self.conversation_history.append({
            "type": "narrator",
            "text": text,
            "timestamp": timestamp or int(_utc_now().timestamp() * 1000),
        })
        self.last_visited = _utc_now()

    def get_last_n_exchanges(self, n: int = 3) -> list[dict[str, Any]]:
        """Get last N narrator responses for prompt."""
        return self.conversation_history[-n:]


# MODIFIED: Add to PlayerState (after line 299)
class PlayerState(BaseModel):
    """Player investigation state."""

    # ... existing fields ...
    conversation_history: list[dict[str, Any]] = Field(default_factory=list)  # EXISTING
    narrator_states: dict[str, NarratorLocationState] = Field(default_factory=dict)  # ✅ NEW
    witness_states: dict[str, WitnessState] = Field(default_factory=dict)  # EXISTING

    # ... existing methods ...

    def get_narrator_state(self, location_id: str) -> NarratorLocationState:
        """Get or create narrator state for location. ✅ NEW METHOD"""
        if location_id not in self.narrator_states:
            self.narrator_states[location_id] = NarratorLocationState(location_id=location_id)
            self.updated_at = _utc_now()
        return self.narrator_states[location_id]

    def update_narrator_state(self, narrator_state: NarratorLocationState) -> None:
        """Update narrator state for location. ✅ NEW METHOD"""
        self.narrator_states[narrator_state.location_id] = narrator_state
        self.updated_at = _utc_now()
```

### What We'd Change in `routes.py`

```python
# MODIFIED: Post /api/investigate endpoint (around line 403)

# Step 1: Get narrator state for this location ✅
narrator_state = state.get_narrator_state(request.location_id)

# Step 2: Extract location-specific conversation history ✅
narrator_history = narrator_state.get_last_n_exchanges(n=3)

# Step 3: Build narrator prompt WITH history ✅
prompt = build_narrator_prompt(
    location_desc=location.get("description", ""),
    hidden_evidence=location.get("hidden_evidence", []),
    discovered_ids=state.discovered_evidence,
    not_present=location.get("not_present", []),
    player_input=request.player_input,
    surface_elements=location.get("surface_elements", []),
    conversation_history=narrator_history,  # ✅ NOW PASSED
)

# Step 4: Get LLM response
narrator_response = await client.get_response(prompt, system=system_prompt)

# Step 5: Save response to location-specific state ✅
narrator_state.add_response(narrator_response)
state.update_narrator_state(narrator_state)

# Step 6: Also save to global conversation (for backward compat)
state.add_conversation_message("narrator", narrator_response)
```

---

## 5. Side-by-Side Comparison

### Current Interrogate Flow (CORRECT)

```python
# Step 1: Load per-witness state
witness_state = state.get_witness_state(request.witness_id, base_trust)

# Step 2: Extract history for THIS witness
history = witness_state.get_history_as_dicts()  # ✅ Per-witness

# Step 3: Pass to prompt builder
prompt = build_witness_prompt(..., conversation_history=history)

# Step 4: Save to THIS witness's state
witness_state.add_conversation(question, response)
state.update_witness_state(witness_state)

# Result: ✅ Witness remembers all previous exchanges with THIS witness
```

### Current Investigate Flow (MISSING HISTORY)

```python
# Step 1: Load location
location = load_location(case_data, request.location_id)

# Step 2: ❌ NO state loading for narrator
# (Would need: narrator_state = state.get_narrator_state(request.location_id))

# Step 3: ❌ NO history extraction
# (Would need: history = narrator_state.get_history_as_dicts())

# Step 4: ❌ NO history passed to prompt
prompt = build_narrator_prompt(...)  # conversation_history missing

# Step 5: ❌ NO location-specific state saving
state.add_conversation_message("narrator", response)  # Global only

# Result: ❌ Narrator doesn't remember what it said at this location
#         ❌ May repeat descriptions
#         ❌ No context continuity per location
```

---

## 6. Key Functions Summary

| Function | File | Lines | Purpose | Has History? |
|----------|------|-------|---------|--------------|
| build_narrator_prompt() | narrator.py | 83-147 | Build narrator prompt | ❌ NO |
| build_witness_prompt() | witness.py | 114-203 | Build witness prompt | ✅ YES |
| format_conversation_history() | witness.py | 54-75 | Format witness history | ✅ YES |
| format_tom_conversation_history() | tom_llm.py | 213-243 | Format Tom history | ✅ YES |
| build_context_prompt() | tom_llm.py | 245-312 | Build Tom context | ✅ YES |
| get_witness_state() | player_state.py | 322-339 | Get per-witness state | ✅ YES |
| get_narrator_state() | player_state.py | NEW | Get per-location state | (WOULD ADD) |
| interrogate_witness() | routes.py | 716-820 | Interrogate endpoint | ✅ CORRECT |
| investigate() | routes.py | 337-448 | Investigate endpoint | ❌ MISSING |

---

## 7. Data Structure Examples

### Witness Conversation Storage (Current)

```python
PlayerState.witness_states = {
    "hermione_granger": WitnessState(
        witness_id="hermione_granger",
        trust=50,
        conversation_history=[
            ConversationItem(question="Where were you?", response="In library"),
            ConversationItem(question="Did you see him?", response="No, but..."),
        ],
        secrets_revealed=["time_together"],
    ),
    "draco_malfoy": WitnessState(
        witness_id="draco_malfoy",
        trust=25,
        conversation_history=[
            ConversationItem(question="Where were you?", response="Dormitory"),
        ],
        secrets_revealed=[],
    ),
}
```

### Narrator Conversation Storage (Current)

```python
PlayerState.conversation_history = [
    {"type": "player", "text": "examine frost", "timestamp": 123},
    {"type": "narrator", "text": "You see frost on window...", "timestamp": 124},  # ❌ Global
    {"type": "narrator", "text": "Another frost pattern...", "timestamp": 125},  # ❌ Not location-specific
    {"type": "tom", "text": "Check the frost direction", "timestamp": 126},
    {"type": "player", "text": "examine desk", "timestamp": 127},
    {"type": "narrator", "text": "Desk has papers...", "timestamp": 128},  # ❌ Which location?
]
```

### Narrator Storage (Proposed)

```python
PlayerState.narrator_states = {
    "library": NarratorLocationState(
        location_id="library",
        conversation_history=[
            {"type": "narrator", "text": "You see frost on window...", "timestamp": 124},
            {"type": "narrator", "text": "Another frost pattern visible", "timestamp": 125},
        ],
        last_visited=datetime(...),
    ),
    "great_hall": NarratorLocationState(
        location_id="great_hall",
        conversation_history=[
            {"type": "narrator", "text": "Candles flicker overhead...", "timestamp": 200},
        ],
        last_visited=datetime(...),
    ),
}
```

---

## 8. Token Budget Impact

### Current Prompts

**Narrator**: ~2000 tokens (location, evidence, not_present, rules)
**Witness**: ~2800 tokens (personality, knowledge, secrets, trust, rules, **history**)
**Tom**: ~2600 tokens (case facts, evidence, rules, **history**)

### With Narrator History Added

**Narrator**: ~2150 tokens (adds ~150 tokens for last 3 responses)
- Well within budget
- Claude Haiku handles 4K context easily

### Potential Improvements

If implementing Tom per-witness:
- Add witness context to Tom prompts (~100 extra tokens)
- Total: ~2700 tokens (still comfortable)

---

**Research Complete**: Direct code references
**Date**: 2026-01-09
**Confidence**: 100% (Direct from codebase)
