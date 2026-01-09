# Phase 2: Narrative Polish + Witness Interrogation - Product Requirement Plan

## Goal

Fix UI narrative flow (remove explicit "You can see:" list) and build witness interrogation system with isolated LLM contexts, trust mechanics, and evidence-triggered secret revelations.

## Why

- **UX Issue**: Phase 1 UI shows explicit bulleted list of surface elements - breaks narrative immersion (Obra Dinn/Disco Elysium integrate lists into prose)
- **Core Gameplay**: Witness interrogation central to detective game - Phoenix Wright evidence presentation, LA Noire trust system
- **Educational Value**: Teaches interviewing techniques (rapport building, evidence presentation timing)
- **Foundation**: Establishes multi-context LLM pattern (narrator/witness/mentor isolation) for Phase 3+

## What

**Part A - UI Narrative Fix** (Quick Win):
1. Remove lines 164-178 from LocationView.tsx (explicit surface_elements list)
2. Update narrator.py: Include surface_elements in atmospheric description (weave into prose)
3. Test: Verify LLM describes visible items naturally without explicit UI list

**Part B - Witness Interrogation System**:
1. YAML witness structure (personality, knowledge, secrets, lies, trust mechanics)
2. Witness LLM context builder (isolated from narrator - no knowledge leakage)
3. WitnessInterview React component (freeform questioning)
4. Evidence presentation detection ("I show X to Y" → trigger secret)
5. Trust level tracking (0-100, affects lies/truth/secret revelations)
6. Backend API routes (/interrogate, /present-evidence)

### Success Criteria
- [ ] LocationView shows NO "You can see:" list - prose only
- [ ] Narrator LLM weaves surface elements into description
- [ ] Player can ask witness freeform questions
- [ ] Witness responds in character (personality-driven, consistent)
- [ ] Trust level visible in UI (0-100, changes based on questions)
- [ ] Presenting evidence triggers secret revelations
- [ ] Witness lies if trust <30, truth if trust >70
- [ ] Witness context isolated (doesn't know narrator details)
- [ ] All tests pass (pytest + Vitest)

---

## Context & References

### Documentation (URLs for AI agent to reference)

```yaml
- url: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-4-best-practices
  why: Role prompting, character personality, system prompts

- url: https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/keep-claude-in-character
  why: Keep witness in character, prevent context bleeding

- url: https://docs.anthropic.com/en/api/messages
  why: Multiple isolated contexts pattern (narrator vs witness)

- url: https://react.dev/reference/react/useReducer
  why: Witness state management (trust, conversation history)
```

### Codebase Patterns (files to study)

```yaml
- file: backend/src/context/narrator.py
  why: Pattern for witness.py (same structure, different prompt)
  symbol: build_narrator_prompt

- file: backend/src/api/routes.py
  why: Add /interrogate route (follow /investigate pattern)
  symbol: investigate_endpoint

- file: frontend/src/components/LocationView.tsx
  why: Pattern for WitnessInterview.tsx (freeform input + LLM response)
  lines: 164-178 (DELETE these - surface_elements list)

- file: backend/src/case_store/case_001.yaml
  why: Extend with witnesses section
```

### Research (from web search)

**Interrogation Mechanics**:
- LA Noire: Truth/Doubt/Lie → renamed Good Cop/Bad Cop/Accuse (trust-based)
- Phoenix Wright: Evidence presentation triggers contradictions, scripted reveals
- Pattern: Freeform questions + evidence triggers (hybrid approach)

**LLM Character Isolation**:
- Claude 4.5 best practices: Separate system prompts for each character role
- Context awareness: Track conversation without leaking narrator knowledge
- Role prompting: Define personality, background, quirks in system prompt

---

## Quick Reference (Context Package)

### Essential API Signatures

**Claude Role Prompting** (from official docs):
```python
from anthropic import AsyncAnthropic

# Separate context for witness (isolated from narrator)
async def interrogate_witness(
    witness_id: str,
    question: str,
    conversation_history: list,
    trust_level: int
) -> dict:
    """Query witness LLM with isolated context."""

    witness_data = load_witness(witness_id)

    system_prompt = f"""You are {witness_data['name']}, a character in Harry Potter detective game.

PERSONALITY: {witness_data['personality']}
BACKGROUND: {witness_data['background']}

CURRENT TRUST LEVEL: {trust_level}/100
- If trust < 30: Be evasive, may lie about {witness_data['lies']}
- If trust 30-70: Answer truthfully but withhold secrets
- If trust > 70: Begin revealing {witness_data['secrets']}

KNOWLEDGE (what you know):
{format_knowledge(witness_data['knowledge'])}

SECRETS (only reveal if triggered):
{format_secrets(witness_data['secrets'], trust_level)}

RULES:
1. Stay in character - you are {witness_data['name']}
2. Do NOT know about: investigation details, other witness testimony, narrator context
3. Respond naturally as this character would
4. If asked about things you don't know, say "I don't know" in character
5. Keep responses 2-4 sentences
"""

    messages = conversation_history + [
        {"role": "user", "content": question}
    ]

    response = await client.messages.create(
        model="claude-haiku-4",
        max_tokens=512,
        system=system_prompt,
        messages=messages
    )

    return {
        "response": response.content[0].text,
        "secrets_revealed": detect_secrets(response, witness_data)
    }
```

**React useReducer Pattern** (for witness state):
```typescript
interface WitnessState {
  witnessId: string;
  name: string;
  trust: number;
  conversationHistory: ConversationItem[];
  secretsRevealed: string[];
}

type WitnessAction =
  | { type: 'ASK_QUESTION'; question: string; response: string }
  | { type: 'PRESENT_EVIDENCE'; evidenceId: string; secretRevealed?: string }
  | { type: 'ADJUST_TRUST'; delta: number };

function witnessReducer(state: WitnessState, action: WitnessAction): WitnessState {
  switch (action.type) {
    case 'ASK_QUESTION':
      return {
        ...state,
        conversationHistory: [
          ...state.conversationHistory,
          { question: action.question, response: action.response }
        ]
      };

    case 'PRESENT_EVIDENCE':
      return {
        ...state,
        trust: state.trust + 10, // Evidence presentation increases trust
        secretsRevealed: action.secretRevealed
          ? [...state.secretsRevealed, action.secretRevealed]
          : state.secretsRevealed
      };

    case 'ADJUST_TRUST':
      return {
        ...state,
        trust: Math.max(0, Math.min(100, state.trust + action.delta))
      };

    default:
      return state;
  }
}
```

### Key Patterns from Research

**Evidence Presentation Detection** (from Phoenix Wright pattern):
```python
import re

def detect_evidence_presentation(player_input: str) -> str | None:
    """Check if player is presenting evidence to witness."""

    # Pattern: "I show X to Y" or "present X" or "show X"
    patterns = [
        r"show (?:the )?(\w+)",
        r"present (?:the )?(\w+)",
        r"give (?:the )?(\w+)",
        r"reveal (?:the )?(\w+)"
    ]

    for pattern in patterns:
        match = re.search(pattern, player_input.lower())
        if match:
            evidence_id = match.group(1)
            return evidence_id

    return None

# Usage in interrogate endpoint
evidence_id = detect_evidence_presentation(player_input)
if evidence_id and evidence_id in discovered_evidence:
    # Check if evidence triggers any secrets
    triggered_secrets = check_triggers(witness, evidence_id, trust_level)
    if triggered_secrets:
        witness_response += f"\n\n[SECRET REVEALED: {triggered_secrets[0]}]"
```

**Trust Adjustment Logic** (from LA Noire pattern):
```python
def adjust_trust(question: str, witness_personality: str) -> int:
    """Calculate trust delta based on question tone."""

    # Aggressive/accusatory questions decrease trust
    aggressive_keywords = ["lie", "lying", "accuse", "guilty", "did it"]
    if any(kw in question.lower() for kw in aggressive_keywords):
        return -10

    # Empathetic/neutral questions increase trust
    empathetic_keywords = ["understand", "help", "remember", "tell me"]
    if any(kw in question.lower() for kw in empathetic_keywords):
        return +5

    # Neutral questions (default)
    return 0
```

**Witness Prompt Template** (role prompting):
```python
def build_witness_prompt(
    witness: dict,
    trust_level: int,
    discovered_evidence: list[str],
    conversation_history: list[dict]
) -> str:
    """Build witness LLM prompt with personality and secrets."""

    # Determine available secrets based on trust + evidence
    available_secrets = []
    for secret in witness['secrets']:
        trigger = secret['trigger']

        # Parse trigger conditions
        if 'trust>' in trigger:
            threshold = int(trigger.split('trust>')[1].split()[0])
            if trust_level > threshold:
                available_secrets.append(secret)

        if 'evidence:' in trigger:
            evidence_id = trigger.split('evidence:')[1].split()[0]
            if evidence_id in discovered_evidence:
                available_secrets.append(secret)

    return f"""You are {witness['name']} in Harry Potter detective game.

== PERSONALITY ==
{witness['personality']}

== YOUR KNOWLEDGE (what you remember) ==
{chr(10).join(f"- {k}" for k in witness['knowledge'])}

== TRUST LEVEL ==
{trust_level}/100

Trust behavior:
- 0-30: Evasive, may lie about sensitive topics
- 30-70: Truthful but withhold secrets
- 70-100: Open, willing to share secrets

== SECRETS (only reveal if trust/evidence triggers met) ==
{format_secrets_for_prompt(available_secrets, trust_level)}

== CONVERSATION HISTORY ==
{format_conversation(conversation_history)}

== RULES ==
1. You are {witness['name']} - stay in character at all times
2. You DO NOT know: investigation details, other testimonies, case solution
3. Respond naturally in 2-4 sentences as this character would
4. If asked about unknown things, say "I don't know" in character
5. If trust is low (<30), be evasive or lie about: {format_lie_topics(witness['lies'])}
6. If trust is high (>70) or evidence presented, reveal secrets when appropriate

== PLAYER QUESTION ==
"{player_input}"

Respond as {witness['name']}:"""
```

### Library-Specific Gotchas

**Claude API**:
- **Issue**: Multiple contexts can leak information if not careful
- **Solution**: Each context (narrator/witness/mentor) has separate system prompts with strict "DO NOT know" rules
- **Example**: Witness system prompt explicitly states "You DO NOT know: investigation details, case solution"

**Trust Mechanics**:
- **Issue**: Trust can feel arbitrary if not visible to player
- **Solution**: Show trust meter in UI (0-100), update in real-time after each question
- **Pattern**: Green (70-100), Yellow (30-70), Red (0-30)

**Evidence Presentation**:
- **Issue**: Player types "I show the note" but which note? (ambiguous)
- **Solution**: Evidence selector UI or fuzzy matching against discovered evidence IDs
- **Fallback**: If ambiguous, witness asks "Which evidence do you mean?"

**Secret Triggers**:
- **Issue**: Complex trigger logic (trust>70 OR evidence:X OR legilimency)
- **Solution**: Parse trigger strings, evaluate conditions, include in witness prompt if met
- **Example**: "evidence:frost_pattern OR trust>70" → check if frost_pattern in discovered_evidence OR trust > 70

### Decision Tree

**When player submits question to witness**:
```
1. Check if question contains evidence presentation pattern
   ├─ YES → Extract evidence_id
   │         ├─ Evidence in discovered_evidence?
   │         │   ├─ YES → Check if triggers any secrets
   │         │   │         ├─ YES → Add secret to available_secrets
   │         │   │         │         Build witness prompt with secret
   │         │   │         │         Send to witness LLM
   │         │   │         │         Return response + [SECRET REVEALED]
   │         │   │         └─ NO → Build witness prompt (no new secret)
   │         │   └─ NO → Return "You don't have that evidence"
   │         └─ Continue to step 2
   │
   └─ NO → Continue to step 2

2. Adjust trust based on question tone
   ├─ Aggressive keywords → trust -= 10
   ├─ Empathetic keywords → trust += 5
   └─ Neutral → trust += 0

3. Build witness prompt with:
   - Personality, knowledge, trust level
   - Available secrets (based on trust + evidence triggers)
   - Conversation history

4. Send to witness LLM context (isolated from narrator)
   → Return response

5. Update witness state:
   - Add question + response to conversation history
   - Update trust level
   - Track secrets revealed
```

### Configuration Requirements

**YAML Witness Structure**:
```yaml
# Extend backend/src/case_store/case_001.yaml

witnesses:
  - id: "hermione"
    name: "Hermione Granger"
    personality: |
      Brilliant third-year student. Values truth and logic above all.
      Cautious when rules are broken, but loyal to friends. Speaks precisely.

    background: |
      Top student in year. Best friends with Harry and Ron. Known for
      following rules obsessively. Was in library the night of incident.

    base_trust: 50  # Starting trust level (0-100)

    knowledge:  # What witness knows (always available)
      - "Was in library from 8:30pm to 9:30pm studying"
      - "Heard raised voices around 9:00pm"
      - "Saw someone running past the stacks"
      - "Library was nearly empty that night"

    secrets:  # Revealed only if trigger conditions met
      - id: "saw_draco"
        trigger: "evidence:frost_pattern OR trust>70"
        text: |
          I saw Draco Malfoy near the window at 9:00pm. He was casting
          something - the frost pattern on the glass looked just like his
          wand signature. I didn't say anything because... I was afraid
          of retaliation.

      - id: "borrowed_restricted_book"
        trigger: "trust>80 OR legilimency"
        text: |
          I... I borrowed a restricted dark arts book two days ago. I needed
          it for my Defence Against the Dark Arts essay. I know it's wrong,
          but the library was supposed to be locked that night. I returned
          it before the incident.

    lies:  # What witness will lie about if trust is low
      - condition: "trust<30"
        question_pattern: "where were you|what did you see"
        response: "I was in the common room all night. I didn't see anything."

      - condition: "trust<40"
        question_pattern: "draco|malfoy"
        response: "I didn't see Draco. Why would he be in the library?"

  - id: "draco"
    name: "Draco Malfoy"
    personality: |
      Arrogant Slytherin third-year. Quick to deflect blame, values
      family reputation. Hostile to Gryffindors. Defensive when accused.

    base_trust: 20  # Starts with low trust (hostile)

    knowledge:
      - "Was near library around 9:00pm"
      - "Practicing freezing charm for exam"
      - "Saw Hermione in library"

    secrets:
      - id: "was_watching_victim"
        trigger: "evidence:frost_pattern AND trust>60"
        text: |
          Fine. I was outside the window practicing charms. I saw the victim
          inside. But I didn't do anything! I left when I saw someone else
          approaching.
```

**Backend File Structure**:
```
backend/src/
├── context/
│   ├── narrator.py (existing)
│   └── witness.py (CREATE) - Witness LLM context builder
├── api/
│   └── routes.py (MODIFY) - Add /interrogate, /present-evidence
├── state/
│   └── player_state.py (MODIFY) - Add witness_states field
└── case_store/
    ├── case_001.yaml (MODIFY) - Add witnesses section
    └── loader.py (MODIFY) - Load witnesses
```

**Frontend File Structure**:
```
frontend/src/
├── components/
│   ├── LocationView.tsx (MODIFY) - Remove lines 164-178
│   ├── WitnessInterview.tsx (CREATE) - Interrogation UI
│   └── WitnessSelector.tsx (CREATE) - Select which witness to interview
├── hooks/
│   └── useWitnessInterrogation.ts (CREATE) - Witness state hook
└── types/
    └── investigation.ts (MODIFY) - Add WitnessState types
```

---

## Current Codebase Structure

```bash
hp_game/
├── backend/
│   ├── src/
│   │   ├── context/
│   │   │   └── narrator.py ✅ (Keep - pattern for witness.py)
│   │   ├── api/
│   │   │   ├── routes.py ✅ (Modify - add /interrogate)
│   │   │   └── claude_client.py ✅ (Keep - reuse for witness)
│   │   ├── state/
│   │   │   └── player_state.py ✅ (Modify - add witness_states)
│   │   └── case_store/
│   │       ├── case_001.yaml ✅ (Modify - add witnesses)
│   │       └── loader.py ✅ (Modify - load witnesses)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LocationView.tsx ⚠️ (Fix - remove lines 164-178)
│   │   │   └── EvidenceBoard.tsx ✅ (Keep)
│   │   ├── hooks/
│   │   │   └── useInvestigation.ts ✅ (Keep)
│   │   └── api/
│   │       └── client.ts ✅ (Modify - add interrogate())
```

---

## Desired Codebase Structure (After Phase 2)

```bash
hp_game/
├── backend/
│   ├── src/
│   │   ├── context/
│   │   │   ├── narrator.py ✅
│   │   │   └── witness.py (CREATE) - build_witness_prompt()
│   │   ├── api/
│   │   │   └── routes.py (MODIFY) - Add POST /interrogate, POST /present-evidence
│   │   ├── state/
│   │   │   └── player_state.py (MODIFY) - Add witness_states: dict[str, WitnessState]
│   │   ├── case_store/
│   │   │   ├── case_001.yaml (MODIFY) - Add witnesses: [hermione, draco]
│   │   │   └── loader.py (MODIFY) - load_witnesses()
│   │   └── utils/
│   │       ├── evidence.py ✅
│   │       └── trust.py (CREATE) - adjust_trust(), check_secret_triggers()
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LocationView.tsx (FIX) - Delete lines 164-178
│   │   │   ├── WitnessInterview.tsx (CREATE) - Interrogation UI
│   │   │   └── WitnessSelector.tsx (CREATE) - Choose witness to interview
│   │   ├── hooks/
│   │   │   └── useWitnessInterrogation.ts (CREATE) - Witness state management
│   │   └── types/
│   │       └── investigation.ts (MODIFY) - Add WitnessState, Secret types
```

---

## Files to Create/Modify

| File | Action | Purpose | Dependencies |
|------|--------|---------|--------------|
| `frontend/src/components/LocationView.tsx` | MODIFY | Delete lines 164-178 (surface_elements list) | None |
| `backend/src/context/narrator.py` | MODIFY | Include surface_elements in description prose | None |
| `backend/src/context/witness.py` | CREATE | Build witness LLM prompt (personality, secrets, trust) | narrator.py (pattern) |
| `backend/src/utils/trust.py` | CREATE | adjust_trust(), check_secret_triggers() | None |
| `backend/src/api/routes.py` | MODIFY | Add POST /interrogate, POST /present-evidence | witness.py, trust.py |
| `backend/src/state/player_state.py` | MODIFY | Add witness_states: dict[str, WitnessState] | Pydantic |
| `backend/src/case_store/case_001.yaml` | MODIFY | Add witnesses: [hermione, draco] | None |
| `backend/src/case_store/loader.py` | MODIFY | Add load_witnesses() function | PyYAML |
| `frontend/src/components/WitnessInterview.tsx` | CREATE | Interrogation UI (freeform questions + trust meter) | LocationView.tsx (pattern) |
| `frontend/src/components/WitnessSelector.tsx` | CREATE | Select witness to interview | None |
| `frontend/src/hooks/useWitnessInterrogation.ts` | CREATE | Witness state hook (useReducer) | React |
| `frontend/src/types/investigation.ts` | MODIFY | Add WitnessState, Secret, ConversationItem types | None |
| `frontend/src/api/client.ts` | MODIFY | Add interrogate(), presentEvidence() functions | fetch |
| `backend/tests/test_witness.py` | CREATE | Test witness prompt building, trust, secrets | pytest |
| `backend/tests/test_trust.py` | CREATE | Test trust adjustment logic | pytest |
| `frontend/src/components/__tests__/WitnessInterview.test.tsx` | CREATE | Test witness UI component | Vitest, RTL |

---

## Tasks (ordered)

### Task 1: UI Narrative Fix (Quick Win)
**Files**:
- `frontend/src/components/LocationView.tsx` (MODIFY - lines 164-178)
- `backend/src/context/narrator.py` (MODIFY - add surface_elements to prose)
- `frontend/src/components/__tests__/LocationView.test.tsx` (MODIFY - update tests)

**Action**: DELETE + MODIFY
**Purpose**: Remove explicit "You can see:" list, integrate into narrative
**Pattern**: Obra Dinn/Disco Elysium - no UI lists, prose only
**Depends on**: None (independent quick win)
**Acceptance criteria**:
- LocationView.tsx lines 164-178 deleted
- Narrator prompt includes surface_elements in scene description
- LLM describes visible items naturally ("The desk is covered in papers...")
- Tests pass (no surface_elements prop expected)

---

### Task 2: Witness YAML Structure
**Files**:
- `backend/src/case_store/case_001.yaml` (MODIFY)
- `backend/src/case_store/loader.py` (MODIFY)
- `backend/tests/test_case_loader.py` (MODIFY)

**Action**: EXTEND + MODIFY
**Purpose**: Define witness data (Hermione, Draco) with personality, secrets, trust
**Pattern**: Follow existing case_001.yaml structure
**Depends on**: Task 1
**Acceptance criteria**:
- witnesses section added to case_001.yaml
- 2 witnesses: hermione (base_trust: 50), draco (base_trust: 20)
- Each has: personality, knowledge, secrets (with triggers), lies
- load_witnesses() function returns dict of witnesses
- Pytest tests pass

---

### Task 3: Trust Mechanics
**Files**:
- `backend/src/utils/trust.py` (CREATE)
- `backend/tests/test_trust.py` (CREATE)

**Action**: CREATE
**Purpose**: Trust adjustment logic, secret trigger evaluation
**Pattern**: Pure functions (no side effects)
**Depends on**: Task 2
**Acceptance criteria**:
- `adjust_trust(question, personality) -> int` returns trust delta
- `check_secret_triggers(secret, trust, evidence) -> bool` evaluates trigger conditions
- Aggressive questions → -10 trust, empathetic → +5, neutral → 0
- Trigger parsing: "evidence:X OR trust>70" → boolean evaluation
- Pytest tests cover all trigger types

---

### Task 4: Witness LLM Context Builder
**Files**:
- `backend/src/context/witness.py` (CREATE)
- `backend/tests/test_witness.py` (CREATE)

**Action**: CREATE
**Purpose**: Build witness prompt with personality, secrets, trust
**Pattern**: Follow narrator.py structure
**Depends on**: Tasks 2, 3
**Acceptance criteria**:
- `build_witness_prompt(witness, trust, evidence, history) -> str` returns prompt
- Prompt includes: personality, knowledge, trust level, available secrets
- Secrets only included if trigger conditions met
- Prompt has strict "DO NOT know" rules (no narrator context leakage)
- Pytest tests verify prompt structure, secret availability

---

### Task 5: Witness State Tracking
**Files**:
- `backend/src/state/player_state.py` (MODIFY)
- `backend/tests/test_persistence.py` (MODIFY)

**Action**: EXTEND
**Purpose**: Track witness interrogation state (trust, conversation, secrets)
**Pattern**: Pydantic model
**Depends on**: Task 4
**Acceptance criteria**:
- PlayerState has `witness_states: dict[str, WitnessState]` field
- WitnessState model: witness_id, trust, conversation_history, secrets_revealed
- Save/load includes witness states (JSON serialization)
- Pytest tests verify persistence

---

### Task 6: Backend API Routes
**Files**:
- `backend/src/api/routes.py` (MODIFY)
- `backend/tests/test_routes.py` (MODIFY)

**Action**: ADD ROUTES
**Purpose**: /interrogate (ask question), /present-evidence (show evidence)
**Pattern**: Follow /investigate endpoint
**Depends on**: Tasks 4, 5
**Acceptance criteria**:
- `POST /interrogate` - body: {witness_id, question}, returns: {response, trust_delta, secrets_revealed}
- `POST /present-evidence` - body: {witness_id, evidence_id}, returns: {response, secret_revealed}
- Evidence presentation detection (regex "show X", "present X")
- Trust adjustment applied after each question
- Pytest tests pass (httpx.AsyncClient)

---

### Task 7: Frontend Witness Types
**Files**:
- `frontend/src/types/investigation.ts` (MODIFY)

**Action**: ADD TYPES
**Purpose**: TypeScript types for witness state
**Pattern**: Match backend Pydantic models
**Depends on**: None (can run in parallel)
**Acceptance criteria**:
- WitnessState interface: witnessId, name, trust, conversationHistory, secretsRevealed
- Secret interface: id, trigger, text
- ConversationItem interface: question, response, timestamp
- Types match backend exactly

---

### Task 8: Frontend API Client
**Files**:
- `frontend/src/api/client.ts` (MODIFY)

**Action**: ADD FUNCTIONS
**Purpose**: interrogate(), presentEvidence() API calls
**Pattern**: Follow investigate() function
**Depends on**: Task 7
**Acceptance criteria**:
- `interrogate(witnessId, question) -> Promise<InterrogationResponse>`
- `presentEvidence(witnessId, evidenceId) -> Promise<EvidenceResponse>`
- Error handling for network failures
- TypeScript types match backend responses

---

### Task 9: useWitnessInterrogation Hook
**Files**:
- `frontend/src/hooks/useWitnessInterrogation.ts` (CREATE)

**Action**: CREATE
**Purpose**: React hook for witness state management
**Pattern**: useReducer (like GameContext)
**Depends on**: Tasks 7, 8
**Acceptance criteria**:
- useReducer with witnessReducer (ASK_QUESTION, PRESENT_EVIDENCE, ADJUST_TRUST actions)
- State: currentWitness, trust, conversationHistory, secretsRevealed
- Functions: askQuestion(), presentEvidence(), selectWitness()
- State updates trigger re-renders

---

### Task 10: WitnessInterview Component
**Files**:
- `frontend/src/components/WitnessInterview.tsx` (CREATE)
- `frontend/src/components/__tests__/WitnessInterview.test.tsx` (CREATE)

**Action**: CREATE
**Purpose**: Interrogation UI (questions + responses + trust meter)
**Pattern**: LocationView.tsx structure
**Depends on**: Task 9
**Acceptance criteria**:
- Freeform textarea for questions
- Submit button calls askQuestion()
- Displays conversation history (question + response pairs)
- Trust meter visible (0-100, color-coded: green/yellow/red)
- Loading state while awaiting LLM
- Evidence presentation button ("Show Evidence" → selector modal)
- Vitest tests pass (render, submit, trust display)

---

### Task 11: WitnessSelector Component
**Files**:
- `frontend/src/components/WitnessSelector.tsx` (CREATE)
- `frontend/src/components/__tests__/WitnessSelector.test.tsx` (CREATE)

**Action**: CREATE
**Purpose**: Select which witness to interview
**Pattern**: Card-based selector
**Depends on**: None (UI only)
**Acceptance criteria**:
- Displays available witnesses (name, brief description)
- Click to select → loads witness in WitnessInterview
- Shows current trust level for each witness
- Vitest tests pass

---

### Task 12: Integration & Testing
**Files**:
- `backend/tests/test_e2e_witness.py` (CREATE)
- `frontend/tests/integration.test.tsx` (MODIFY)

**Action**: CREATE + MODIFY
**Purpose**: End-to-end witness interrogation flow
**Pattern**: httpx.AsyncClient (backend), Vitest integration (frontend)
**Depends on**: All previous tasks
**Acceptance criteria**:
- Player asks question → witness responds in character
- Trust adjusts based on question tone (visible in UI)
- Presenting evidence triggers secret revelation
- Witness lies if trust <30, truth if trust >70
- Witness context isolated (doesn't know narrator details)
- All tests pass (pytest + Vitest)

---

## Integration Points

### Narrator → Witness Context Isolation
- **Where**: `backend/src/context/narrator.py` vs `backend/src/context/witness.py`
- **What**: Separate system prompts, no shared state
- **Pattern**: Narrator doesn't know secrets, witness doesn't know investigation details

### Frontend → Backend API
- **Where**: `frontend/src/api/client.ts` → `POST /interrogate`
- **What**: Freeform question → witness response + trust delta
- **Pattern**: Same as /investigate (async fetch, error handling)

### Evidence Presentation → Secret Triggers
- **Where**: `backend/src/utils/trust.py` → check_secret_triggers()
- **What**: Player shows evidence → check if triggers witness secret
- **Pattern**: Parse trigger string ("evidence:X OR trust>Y"), evaluate conditions

### Witness State → Player State
- **Where**: `backend/src/state/player_state.py`
- **What**: witness_states dict tracks all witness interrogations
- **Pattern**: Nested Pydantic models, JSON serialization

---

## Known Gotchas

### Context Leakage
- **Issue**: Witness LLM might "know" things it shouldn't (narrator context bleeding)
- **Solution**: Explicit "DO NOT know" rules in witness system prompt
- **Test**: Verify witness doesn't reference investigation details in responses

### Trust Oscillation
- **Issue**: Trust can swing wildly if every question adjusts it
- **Solution**: Cap trust deltas (±10 max), require multiple questions for big changes
- **Pattern**: Empathetic questions +5, neutral +0, aggressive -10

### Ambiguous Evidence Presentation
- **Issue**: Player types "show note" but there are 3 notes
- **Solution**: Fuzzy match against discovered evidence IDs, ask for clarification if ambiguous
- **Fallback**: UI selector modal ("Which evidence do you want to show?")

### Secret Trigger Complexity
- **Issue**: Trigger logic can be complex ("evidence:X AND trust>70 OR legilimency")
- **Solution**: Support simple operators (AND, OR), evaluate left-to-right
- **Test**: Pytest tests cover all trigger combinations

### Witness Personality Consistency
- **Issue**: LLM might respond out of character if prompt is vague
- **Solution**: Detailed personality descriptions, background, quirks in system prompt
- **Example**: "Hermione values truth, speaks precisely, follows rules obsessively"

---

## Validation Loop

### Level 1: Backend Tests (pytest)
```bash
cd backend
uv run pytest tests/ -v
# Expected: All tests pass
# - test_witness.py: Prompt building, secret availability
# - test_trust.py: Trust adjustment, trigger evaluation
# - test_routes.py: /interrogate, /present-evidence endpoints
# - test_case_loader.py: Witness YAML loading
```

### Level 2: Frontend Tests (Vitest)
```bash
cd frontend
bun test
# Expected: All tests pass
# - WitnessInterview.test.tsx: UI rendering, question submission
# - WitnessSelector.test.tsx: Witness selection
# - LocationView.test.tsx: No surface_elements list (updated)
# - integration.test.tsx: Full interrogation flow
```

### Level 3: Manual Testing
```bash
# Terminal 1: Backend
cd backend
uv run uvicorn src.main:app --reload

# Terminal 2: Frontend
cd frontend
bun run dev

# Browser: http://localhost:5173
# 1. Verify: LocationView shows NO "You can see:" list
# 2. Verify: Narrator describes surface elements in prose
# 3. Click: Select Hermione (trust: 50, yellow)
# 4. Type: "Where were you last night?" (empathetic)
# 5. Verify: Hermione responds in character, trust increases to 55
# 6. Type: "You're lying!" (aggressive)
# 7. Verify: Trust decreases to 45, Hermione becomes defensive
# 8. Click: "Show Evidence" → select frost_pattern
# 9. Verify: Secret revealed (saw Draco), trust increases
# 10. Verify: Witness context isolated (doesn't reference narrator details)
```

---

## Dependencies

**Backend**:
- No new packages (existing anthropic SDK, pydantic, pyyaml)

**Frontend**:
- No new packages (existing React hooks, fetch)

---

## Out of Scope

**Phase 2 focuses on:**
- ✅ UI narrative fix (remove explicit lists)
- ✅ Witness interrogation (freeform questions, trust, secrets)
- ✅ Context isolation (narrator vs witness)

**Deferred to later phases:**
- ❌ Fallacy detection (Phase 3 - Mentor LLM judges reasoning)
- ❌ Verdict submission (Phase 3 - Submit culprit + motive + method)
- ❌ Inner Voice system (Phase 4 - Socratic questions)
- ❌ Magic spell mechanics (Phase 4 - Legilimency, Veritaserum)
- ❌ Multiple locations (Phase 4 - Navigation between rooms)
- ❌ Three-act pacing (Phase 5 - Complication evidence)

---

## Agent Orchestration Plan

### Execution Strategy

**Parallel Track 1** (UI fix - quick win):
- react-vite-specialist → Fix LocationView (delete lines 164-178) + update narrator prompt

**Sequential Track 2** (witness system - dependencies):
1. fastapi-specialist → Witness YAML + trust mechanics + context builder (Tasks 2-4)
2. fastapi-specialist → Witness state + API routes (Tasks 5-6)
3. react-vite-specialist → Witness UI (Tasks 7-11)
4. validation-gates → Testing (Task 12)

**Total**: Quick win (1 day) + Witness system (4-6 days) = 5-7 days

---

### Agent-Specific Guidance

#### For react-vite-specialist (Task 1 - UI fix)
- **Input**: Task 1 (LocationView fix)
- **Pattern**: Delete explicit list, verify tests still pass
- **Context**: Narrative should flow naturally (Obra Dinn/Disco Elysium)
- **Output**: No "You can see:" list, prose only
- **Duration**: 1 day

#### For fastapi-specialist (Tasks 2-6 - Witness backend)
- **Input**: Tasks 2-6 (YAML, trust, context, routes)
- **Dependencies**: None (start after UI fix OR run in parallel)
- **Pattern**: Follow narrator.py structure for witness.py
- **Context**: Use trust mechanics from LA Noire research, isolation from Claude docs
- **Output**: Backend API functional (/interrogate, /present-evidence)
- **Duration**: 3-4 days

#### For react-vite-specialist (Tasks 7-11 - Witness frontend)
- **Input**: Tasks 7-11 (types, API client, hook, components)
- **Dependencies**: Wait for fastapi-specialist (backend routes ready)
- **Pattern**: Follow LocationView.tsx structure for WitnessInterview.tsx
- **Context**: Trust meter UI (green/yellow/red), conversation history display
- **Output**: Frontend UI functional (interrogation + trust + secrets)
- **Duration**: 2-3 days

#### For validation-gates (Task 12 - Testing)
- **Input**: Task 12 (E2E testing)
- **Dependencies**: Wait for react-vite-specialist
- **Actions**:
  - Run `uv run pytest backend/tests/ -v` → verify all pass
  - Run `bun test` in frontend → verify all pass
  - Manual testing flow (documented in Validation Loop)
- **Success**: All tests pass, manual flow works, context isolation verified
- **Duration**: 1 day

---

### Handoff Context

**Next agent receives**:
- This PRP (full context)
- Quick Reference (witness prompt pattern, trust logic, trigger evaluation)
- Specific task numbers to implement
- Pattern files (narrator.py, LocationView.tsx)

**Next agent does NOT need**:
- ❌ Read LA Noire game design docs (patterns extracted in Quick Reference)
- ❌ Search for LLM character prompts (Claude docs referenced)
- ❌ Research trust mechanics (logic provided in Decision Tree)
- ❌ Invent YAML structure (template in Configuration Requirements)

---

## Anti-Patterns to Avoid

**Backend**:
- ❌ Witness context knows narrator details (strict isolation required)
- ❌ Trust adjusts by large amounts per question (cap at ±10)
- ❌ Secrets always revealed at same trigger (evaluate conditions each time)
- ❌ Hardcoding witness data in code (use YAML)

**Frontend**:
- ❌ Not showing trust meter (player needs feedback)
- ❌ Not handling ambiguous evidence (fuzzy matching or UI selector)
- ❌ Not clearing input after submit (UX issue)
- ❌ Not displaying conversation history (player loses context)

**LLM Integration**:
- ❌ Witness responds with narrator knowledge (context leakage)
- ❌ Witness personality inconsistent (detailed system prompt required)
- ❌ Secrets revealed without trigger check (violates game mechanics)
- ❌ Trust doesn't affect responses (low trust = lies, high trust = truth)

---

Generated: 2026-01-05
Source: INITIAL.md, Phase 1 codebase, LA Noire/Phoenix Wright research, Claude 4.5 docs
Research: Interrogation mechanics, LLM role prompting, context isolation patterns
Confidence Score: 8/10

**Why 8/10**:
- ✅ UI fix straightforward (delete lines, update prompt)
- ✅ Witness prompt pattern established (follow narrator.py)
- ✅ Trust mechanics clear (LA Noire research)
- ✅ Secret triggers well-defined (Phoenix Wright pattern)
- ✅ Context isolation documented (Claude 4.5 best practices)
- ⚠️ Trust oscillation risk (need tuning during testing)
- ⚠️ Witness personality consistency requires detailed prompts (test thoroughly)

**Sources**:
- [LA Noire Interrogation System](https://significant-bits.com/l-a-noires-interrogation-system/)
- [LA Noire Dialogue Options](https://pastemagazine.com/games/l-a-noire/la-noire-how-do-the-new-dialogue-options-hold-up)
- [Claude Role Prompting](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/keep-claude-in-character)
- [Claude 4.5 Best Practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-4-best-practices)
- [Claude Messages API](https://docs.anthropic.com/en/api/messages)
