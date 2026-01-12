# Codebase Pattern Research - Phase 4.5 (Magic System)

**Feature**: Magic System - 6 investigation spells with risk/reward mechanics
**Date**: 2026-01-09
**Analysis Scope**: Backend API patterns, frontend integration patterns, YAML case structure, state management
**Total Symbols Extracted**: 45 core endpoints/methods, 25+ type definitions
**Files Analyzed**: 18 backend/frontend files
**Confidence**: HIGH (9/10 - all patterns proven in Phases 1-4.4)

---

## Directory Structure & Organization

```
hp_game/
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── routes.py              # FastAPI endpoints (1600+ lines)
│   │   │   ├── claude_client.py       # Claude API wrapper
│   │   │   └── __init__.py
│   │   ├── context/
│   │   │   ├── narrator.py            # Location LLM (171 lines)
│   │   │   ├── witness.py             # Witness LLM (236 lines)
│   │   │   ├── mentor.py              # Verdict feedback LLM
│   │   │   ├── briefing.py            # Briefing LLM context
│   │   │   ├── tom_llm.py             # Tom Thornfield LLM (431 lines)
│   │   │   ├── inner_voice.py         # Deprecated (kept for fallback)
│   │   │   └── rationality_context.py # Rationality concepts for briefing
│   │   ├── case_store/
│   │   │   ├── case_001.yaml          # Case definition (YAML)
│   │   │   ├── loader.py              # Case file parser
│   │   │   └── templates/             # Future case templates
│   │   ├── state/
│   │   │   ├── player_state.py        # PlayerState model (400+ lines)
│   │   │   └── persistence.py         # JSON save/load logic
│   │   ├── verdict/
│   │   │   ├── evaluator.py           # Verdict checking logic
│   │   │   └── fallacies.py           # Fallacy detection
│   │   └── utils/
│   │       ├── evidence.py            # Evidence trigger matching
│   │       └── trust.py               # Trust calculation
│   └── tests/
│       └── test_*.py                  # 492 tests (100% passing)
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts              # Type-safe API wrapper
│   │   ├── types/
│   │   │   └── investigation.ts       # Shared type definitions (350+ lines)
│   │   ├── hooks/
│   │   │   ├── useInvestigation.ts    # State + save/load logic
│   │   │   ├── useTomChat.ts          # Tom conversation
│   │   │   ├── useBriefing.ts         # Briefing state
│   │   │   └── useVerdictFlow.ts      # Verdict submission
│   │   ├── components/
│   │   │   ├── LocationView.tsx       # Main investigation UI (600+ lines)
│   │   │   ├── WitnessSelector.tsx    # Witness list sidebar
│   │   │   ├── WitnessInterview.tsx   # Witness interrogation modal
│   │   │   ├── EvidenceBoard.tsx      # Evidence display
│   │   │   ├── EvidenceModal.tsx      # Evidence detail modal
│   │   │   ├── VerdictSubmission.tsx  # Verdict form
│   │   │   ├── MentorFeedback.tsx     # Moody feedback display
│   │   │   ├── ConfrontationDialogue.tsx
│   │   │   ├── BriefingModal.tsx      # Intro briefing
│   │   │   └── TomChatInput.tsx       # Tom chat input field
│   │   └── ui/
│   │       ├── Modal.tsx              # Reusable modal component
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       └── ConfirmDialog.tsx
│   └── tests/
│       └── *.test.tsx/.test.ts        # 440+ tests (RTL + Vitest)
│
└── backend/src/case_store/case_001.yaml  # Case definition template
```

---

## Existing Patterns by Category

### A. STATE MANAGEMENT PATTERNS

#### File: `/backend/src/state/player_state.py`

**Core PlayerState Model**:
```python
class PlayerState(BaseModel):
    """Main player state container with nested state classes"""
    player_id: str
    case_id: str
    current_location: str
    discovered_evidence: list[str]
    visited_locations: list[str]
    created_at: datetime
    updated_at: datetime

    # Nested state objects (Phase-specific data)
    verdict_state: VerdictState
    witness_states: dict[str, WitnessState]
    briefing_state: BriefingState
    inner_voice_state: InnerVoiceState
    conversation_history: list[ConversationMessage]
    narrator_conversation_history: list[ConversationItem]
```

**Key Methods** (pattern for extending state):
- `add_evidence()` - Append to discovered_evidence list, update timestamp
- `visit_location()` - Append to visited_locations, update timestamp
- `get_witness_state()` - Retrieve nested WitnessState by witness_id
- `update_witness_state()` - Merge updates into nested witness state
- `add_conversation_message()` - Append message with 20-message limit (lines 378-399)
- `add_narrator_conversation()` - Append to narrator history with 5-exchange limit
- `get_narrator_history_as_dicts()` - Format for LLM prompt injection

**Pattern for New Features**:
When adding spell system, follow this pattern:
```python
class SpellState(BaseModel):
    """Track spell usage per case"""
    available_spells: list[str]  # Spell IDs player knows
    spell_uses: dict[str, int]   # spell_id -> usage_count (for cooldowns)
    spell_effects: dict[str, SpellEffect]  # Persistent spell effects
    failed_spells: list[SpellFailure]  # Risk tracking

class PlayerState(BaseModel):
    # Add alongside other nested states
    spell_state: SpellState = Field(default_factory=SpellState)
```

**Persistence Pattern**:
- Save happens in `PlayerState.save_state()` via `persistence.py`
- Load in `persistence.py:load_state()` deserializes JSON → PlayerState
- Backward compatibility: Use `Field(default_factory=...)` for new fields

---

### B. API ENDPOINT PATTERNS

#### File: `/backend/src/api/routes.py`

**Endpoint Structure** (proven pattern from Phases 1-4.4):

```python
router = APIRouter(prefix="/api", tags=["investigation"])

# Pattern 1: Simple GET for data retrieval
@router.get("/case/{case_id}/evidence/{evidence_id}")
async def get_evidence_details(case_id: str, evidence_id: str) -> EvidenceDetailResponse:
    """Retrieve full evidence details (name, location, description)"""
    # 1. Load case (case validation)
    # 2. Get evidence by ID (loader.get_evidence_by_id)
    # 3. Return typed response
    pass

# Pattern 2: POST with side effects (state mutation)
@router.post("/investigate")
async def investigate(req: InvestigateRequest) -> InvestigateResponse:
    """Main gameplay endpoint - processes player action"""
    # 1. Load player state from file (persistence.load_state)
    # 2. Validate location exists (get_location)
    # 3. Call LLM with context (narrator.build_narrator_prompt)
    # 4. Match triggers for evidence (evidence.py pattern matching)
    # 5. Update state (add_evidence, add_narrator_conversation)
    # 6. Save state (persistence.save_state)
    # 7. Return response with narrator_response + new_evidence
    pass

# Pattern 3: Contextual LLM call
@router.post("/case/{case_id}/tom/auto-comment")
async def tom_auto_comment(case_id: str, req: TomAutoCommentRequest) -> TomResponseModel:
    """LLM-powered character interaction (30% chance trigger)"""
    # 1. Load state
    # 2. Check trigger condition (random 30%)
    # 3. Build context (evidence discovered, case facts)
    # 4. Call LLM (tom_llm.generate_tom_response with context)
    # 5. Save Tom message (add_conversation_message)
    # 6. Return message with timestamp
    pass
```

**Request/Response Pattern** (all use Pydantic models):

```python
# Request
class SpellCastRequest(BaseModel):
    spell_id: str           # "revelio", "homenum_revelio", etc.
    target_id: str          # location_id, evidence_id, or witness_id
    player_id: str = "default"
    case_id: str = "case_001"

# Response
class SpellCastResponse(BaseModel):
    success: bool
    spell_effect: str       # Narrative description of spell result
    new_evidence: list[str] = []  # Evidence revealed by spell
    side_effects: list[str] = []  # Risk consequences if spell failed
    state_updates: dict     # Any state changes (relationship damage, etc.)
```

**Error Handling Pattern**:
```python
try:
    # Load case, validate inputs
    player_state = persistence.load_state(case_id, player_id)
    spell_data = loader.get_spell_context(case_id, spell_id)

    # Business logic
    result = apply_spell(spell_data, target_id, player_state)

    # Persist
    persistence.save_state(case_id, player_id, player_state)
    return SpellCastResponse(success=True, spell_effect=result)

except CaseNotFoundError as e:
    raise HTTPException(status_code=404, detail=f"Case {case_id} not found")
except ValueError as e:
    raise HTTPException(status_code=400, detail=str(e))
```

---

### C. YAML CASE STRUCTURE PATTERNS

#### File: `/backend/src/case_store/case_001.yaml`

**Current Case Structure** (template for all cases):

```yaml
case:
  id: "case_001"
  title: "The Restricted Section"
  difficulty: beginner  # beginner, intermediate, advanced

  locations:
    library:
      id: "library"
      name: "Hogwarts Library - Crime Scene"
      type: "micro"      # Location granularity level

      # Description for narrator (no explicit lists)
      description: |
        Single paragraph flowing prose. Include environmental
        details, mood, victim placement, surface elements.
        (50-100 words, feeds to Claude for immersion)

      surface_elements:  # For narrator context
        - "Oak desk with scattered papers"
        - "Dark arts books on shelves"
        - "Frost-covered window"
        - "Victim's body near window"

      witnesses_present: ["hermione", "dumbledore"]  # Array of witness IDs

      # Evidence hidden in location (triggers on substring match)
      hidden_evidence:
        - id: "hidden_note"
          name: "Threatening Note"  # Display name for UI
          location_found: "library"
          type: "physical"           # physical, magical, testimonial, documentary

          triggers:              # Substring patterns (5+ variants recommended)
            - "under desk"
            - "beneath desk"
            - "search desk"
            - "check drawers"
            - "examine desk closely"

          description: |
            Multi-sentence evidence description. Appears in
            EvidenceModal when player clicks card.

          tag: "[EVIDENCE: hidden_note]"  # For quick copy-paste in narrator

      # Things narrator should NOT mention (prevents hallucination)
      not_present:
        - triggers:
            - "secret passage"
            - "hidden door"
          response: "The walls are solid stone. No passages."

  # Witness/suspect definitions
  witnesses:
    - id: "hermione"
      name: "Hermione Granger"
      personality: |
        Multi-line character description. Narrator reads this
        to generate natural witness dialogue (2-3 sentences max).

      background: |
        Context for how witness knows victim, their role in case.

      base_trust: 50  # Initial trust level (0-100)

      knowledge:      # What witness knows (factual info)
        - "Was in library from 8:30pm to 9:30pm studying"
        - "Heard raised voices around 9:00pm"

      secrets:        # Secrets witness only reveals if trust/evidence met
        - id: "saw_draco"
          trigger: "evidence:frost_pattern OR trust>70"
          text: |
            Secret text revealed when trigger condition met.

  # Verdict system data
  solution:
    culprit: "draco"
    timeline: |
      Multi-line timeline of what happened.
      Helps mentor evaluate player's reasoning.

  wrong_suspects:
    draco:  # suspect_id
      could_have_done_it: true  # Is alibi plausible?
      evidence_confusion: |
        What misconceptions might player have?
```

**Integration Points** (how YAML feeds into APIs):
- `loader.load_case(case_id)` → Returns case dict with all sections
- `loader.get_location(case_id, location_id)` → Returns location + hidden_evidence
- `loader.get_evidence_by_id(case_id, evidence_id)` → Returns evidence data + tag
- `loader.load_solution(case_id)` → Used by verdict evaluator

---

### D. LLM INTEGRATION PATTERNS

#### File: `/backend/src/context/narrator.py`

**Narrator Pattern** (template for all LLM services):

```python
def build_system_prompt() -> str:
    """System prompt defines LLM character/constraints"""
    return """
You are the narrator of an Auror Academy investigation game.

CRITICAL CONSTRAINTS:
- Respond in 2-4 sentences only
- Describe only what player directly interacted with
- NEVER mention items not listed in surface_elements
- NEVER reveal hidden evidence unless triggered
- Maintain immersion (no meta-commentary)

ALLOWED ITEMS THIS LOCATION:
{surface_elements}

NOT PRESENT (refuse these):
{not_present_refusals}
"""

async def build_narrator_prompt(
    location_id: str,
    player_input: str,
    conversation_history: list[ConversationItem],  # Last 5 exchanges
) -> str:
    """Build context-injected prompt with player action"""
    location = get_location(location_id)

    # Format conversation history (pattern from witness.py)
    history_text = format_narrator_conversation_history(conversation_history)

    return f"""
{build_system_prompt()}

CONVERSATION SO FAR:
{history_text}

PLAYER ACTION: {player_input}

Respond naturally. If player action makes sense, describe outcome.
If nonsensical, explain why it doesn't work. Never break character.
"""

async def generate_narrator_response(prompt: str) -> str:
    """Call Claude Haiku LLM"""
    response = await claude_client.call_llm(
        model="claude-haiku-4-5-20250929",
        max_tokens=300,
        temperature=0.7,
        system="You are a narrator...",
        user_message=prompt
    )
    return response.content
```

**Proven Context Patterns** (what to inject into prompts):
1. **Surface Elements** - Safe items narrator can reference
2. **Conversation History** - Last 5 exchanges (prevents repetition)
3. **Evidence Already Discovered** - So narrator doesn't re-reveal
4. **Location-Specific Constraints** - NOT_PRESENT list
5. **Case Facts** - For Tom/witness contexts (not narrator)

**Formatting Helper Pattern**:
```python
def format_narrator_conversation_history(
    history: list[ConversationItem],
) -> str:
    """Convert history to prompt-ready format"""
    if not history:
        return "FIRST EXCHANGE"

    lines = []
    for item in history:
        lines.append(f"PLAYER: {item.player_input}")
        lines.append(f"NARRATOR: {item.narrator_response}")

    return "\n\n".join(lines)
```

---

### E. FRONTEND STATE & HOOKS PATTERNS

#### File: `/frontend/src/hooks/useInvestigation.ts`

**State Hook Pattern** (container for investigation state):

```typescript
interface InvestigationState {
  caseId: string;
  playerId: string;
  currentLocation: string;
  discoveredEvidence: string[];
  visitedLocations: string[];
  inlineMessages: Message[];  // Conversation display (last 20)
  isLoading: boolean;
  error: string | null;
}

export const useInvestigation = () => {
  const [state, setState] = useState<InvestigationState>(initialState);

  // Load game on mount
  useEffect(() => {
    const loadGame = async () => {
      try {
        const response = await client.loadGame(state.caseId);

        // Conversation restoration pattern (Phase 4.4)
        const restoredMessages = convertConversationMessages(
          response.conversation_history || []
        );

        setState(prev => ({
          ...prev,
          currentLocation: response.current_location,
          discoveredEvidence: response.discovered_evidence,
          visitedLocations: response.visited_locations,
          inlineMessages: restoredMessages,  // Restore conversation
        }));
      } catch (error) {
        setState(prev => ({ ...prev, error: error.message }));
      }
    };

    loadGame();
  }, [state.caseId]);

  // Main investigation handler
  const investigate = async (playerInput: string) => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await client.investigate({
        player_input: playerInput,
        case_id: state.caseId,
        location_id: state.currentLocation,
      });

      // Add messages to display
      setState(prev => ({
        ...prev,
        inlineMessages: [
          ...prev.inlineMessages,
          { type: 'player', text: playerInput, timestamp: Date.now() },
          { type: 'narrator', text: response.narrator_response, timestamp: Date.now() },
        ],
        discoveredEvidence: [
          ...new Set([...prev.discoveredEvidence, ...response.new_evidence])
        ],
      }));
    } catch (error) {
      setState(prev => ({ ...prev, error: error.message }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  return {
    state,
    investigate,
    changeLocation,
    saveGame,
    loadGame,
  };
};
```

**Helper: Message Conversion** (used in load/restore):
```typescript
function convertConversationMessages(
  messages: ConversationMessage[]
): Message[] {
  return messages.map(msg => {
    // Convert 'tom' type to 'tom_ghost' for rendering
    const type = msg.type === 'tom' ? 'tom_ghost' : msg.type;
    return {
      ...msg,
      type: type as MessageType,
    };
  });
}
```

---

### F. COMPONENT PATTERNS

#### File: `/frontend/src/components/LocationView.tsx`

**Component Structure** (exemplar for investigation UI):

```typescript
interface Props {
  location: LocationData;
  evidence: EvidenceCard[];
  isLoading: boolean;
  onInvestigate: (input: string) => Promise<void>;
  onTomMessage?: (message: string) => void;
  messages: Message[];
}

export const LocationView: React.FC<Props> = ({
  location,
  evidence,
  isLoading,
  onInvestigate,
  onTomMessage,
  messages,
}) => {
  // Unified message array with timestamps
  const unifiedMessages = [
    ...messages
  ].sort((a, b) => a.timestamp - b.timestamp);

  const handleSubmit = async (input: string) => {
    if (!input.trim() || isLoading) return;

    // Handle Tom prefix (pattern from Phase 4.1)
    if (input.toLowerCase().startsWith('tom')) {
      onTomMessage?.(input);
    } else {
      await onInvestigate(input);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Location Title */}
      <h2 className="text-xl font-bold text-yellow-400 uppercase">
        {location.name}
      </h2>

      {/* Location Description (flowing prose) */}
      <p className="whitespace-normal text-amber-100">
        {location.description}
      </p>

      {/* Messages Display (max height, scrollable) */}
      <div className="max-h-96 overflow-y-auto rounded border border-amber-700 bg-gray-900 p-4">
        {unifiedMessages.map(msg => (
          <MessageLine key={msg.timestamp} message={msg} />
        ))}
      </div>

      {/* Investigation Input */}
      <InvestigationInput
        onSubmit={handleSubmit}
        isLoading={isLoading}
        hasTomPrefix={/* detect tom prefix */}
      />
    </div>
  );
};
```

**Key Patterns**:
- Title: Yellow uppercase, no brackets (Phase 4.4)
- Description: `whitespace-normal` (flows prose, Phase 4.4)
- Messages: `max-h-96` scrollable (Phase 4.4)
- Tom integration: Input prefix detection (Phase 4.1)

---

### G. TYPE PATTERNS

#### File: `/frontend/src/types/investigation.ts`

**Type Organization** (how to structure new types):

```typescript
// 1. Enums for fixed values
export type MessageType = 'player' | 'narrator' | 'tom_ghost';
export type EvidenceType = 'physical' | 'magical' | 'testimonial' | 'documentary';

// 2. Request types (match backend Pydantic models)
export interface InvestigateRequest {
  player_input: string;
  case_id?: string;
  location_id?: string;
  player_id?: string;
}

// 3. Response types
export interface InvestigateResponse {
  narrator_response: string;
  new_evidence: string[];
  already_discovered: boolean;
}

// 4. UI types (don't cross API boundary)
export interface Message {
  type: MessageType;
  text: string;
  timestamp: number;
}

export interface EvidenceCard {
  id: string;
  name: string;
  type: EvidenceType;
  discoveredAt: number;
}

// 5. Nested types (complex structures)
export interface InvestigationState {
  caseId: string;
  currentLocation: string;
  discoveredEvidence: string[];
  inlineMessages: Message[];
  // ... more fields
}
```

**Pattern for New Spell Types**:
```typescript
// Request
export interface CastSpellRequest {
  spell_id: string;  // "revelio", "homenum_revelio"
  target_id: string; // location_id, evidence_id
  case_id?: string;
  location_id?: string;
  player_id?: string;
}

// Response
export interface CastSpellResponse {
  success: boolean;
  spell_effect: string;      // Narrative description
  new_evidence: string[];
  side_effects: string[];    // Risk consequences
  state_updates?: {
    relationship_changes?: Record<string, number>;  // witness_id -> trust delta
    cooldowns?: Record<string, number>;  // spell_id -> remaining cooldown
  };
}

// Display type (for UI rendering)
export interface SpellCardProps {
  spellId: string;
  name: string;
  description: string;
  risk: 'low' | 'medium' | 'high';
  onCast: (targetId: string) => Promise<void>;
  isAvailable: boolean;  // Based on unlocks/cooldowns
}
```

---

## Integration Points & Gaps

### ✅ PROVEN PATTERNS (Ready to Reuse)

1. **State Management** ✅
   - PlayerState nested classes (verdict, witness, briefing, inner_voice)
   - Pattern: Add `spell_state: SpellState` alongside others
   - Persistence automatic via `save_state()` / `load_state()`

2. **API Endpoints** ✅
   - Request/Response Pydantic models
   - POST with side effects (state mutation + save)
   - Error handling (HTTPException 404/400/500)
   - Pattern: `POST /api/case/{case_id}/spell/cast` following tom endpoints

3. **YAML Case Structure** ✅
   - Modular location/witness/evidence/solution sections
   - Trigger matching for evidence discovery
   - Pattern: Add `spell_contexts` section per location

4. **LLM Prompts** ✅
   - System prompt with constraints
   - Context injection (surface elements, conversation history)
   - Proven with narrator (171 lines), witness (236), tom (431)
   - For spells: Build `spell_effect_prompt()` following narrator pattern

5. **Frontend State + Hooks** ✅
   - useInvestigation for main state container
   - Message array with timestamps (for unified display)
   - Conversation restoration on load (Phase 4.4)
   - Pattern: Add spell state to useInvestigation + display in LocationView

6. **Component Patterns** ✅
   - LocationView displays messages, handles input
   - Modal component for detail views (evidence, witness, verdict)
   - Button + Card reusable UI components
   - Pattern: Create `SpellMenu.tsx` component following WitnessSelector layout

---

### ⚠️ GAPS & DECISIONS NEEDED FOR PHASE 4.5

#### Gap 1: Spell Availability System
**Current State**: No spell access/unlock system exists

**Two Options**:

**Option A: Static per-location** (KISS - simpler)
```yaml
# In case_001.yaml, add per-location:
spell_contexts:
  - spell_id: "revelio"
    location_ids: ["library"]  # Available in library only
    description: "Reveals hidden objects and details"
```
- Implement: `loader.get_available_spells(location_id)`
- Frontend: Filter button list based on location
- **Effort**: 2 hours (quick win)

**Option B: Progression-based** (richer gameplay)
```python
class SpellState(BaseModel):
    known_spells: list[str]  # ["revelio"] after tutorial
    spell_unlocks: dict[str, int]  # spell_id -> case_num unlocked
```
- Implement: Track spell learning through cases
- Unlock triggers on correct verdicts, special achievements
- **Effort**: 1 day (more complex, deferred to Phase 5)

**Recommendation**: Use Option A for Phase 4.5 (KISS), upgrade to Option B in Phase 5

#### Gap 2: Spell Effect Narrative System
**Current State**: Need `build_spell_effect_prompt()` function

**Pattern to Follow** (from narrator.py):
```python
async def build_spell_effect_prompt(
    spell_id: str,
    target_id: str,
    case_facts: str,
    current_evidence: list[str],
) -> str:
    """Build LLM prompt for spell result"""
    spell = SPELL_DEFINITIONS[spell_id]  # See below

    return f"""
You are describing the magical effect of a spell cast in an investigation.

SPELL: {spell['name']}
EFFECT: {spell['description']}
TARGET: {target_id}

CASE FACTS:
{case_facts}

Describe what the spell reveals in 2-3 sentences.
Be mysterious but helpful.
"""
```

**Required Data Structure**:
```python
SPELL_DEFINITIONS = {
    "revelio": {
        "name": "Revelio",
        "description": "Reveals hidden or concealed objects",
        "risk": "low",
        "category": "revelation",  # revelation, investigation, binding, insight
    },
    "homenum_revelio": {
        "name": "Homenum Revelio",
        "description": "Detects living beings nearby",
        "risk": "medium",
        "category": "investigation",
    },
    # ... 4 more spells
}
```

**Effort**: 1 day (simple data structure + prompt, reusable pattern)

#### Gap 3: Risk/Consequences System
**Current State**: No failure tracking or relationship damage

**Implementation Pattern**:
```python
class SpellFailure(BaseModel):
    spell_id: str
    target_id: str
    failed_at: datetime
    consequence: str  # "Dumbledore warns you", "Trust dropped with Moody"

class SpellState(BaseModel):
    failed_spells: list[SpellFailure]  # For feedback/consequences
    relationship_changes: dict[str, int]  # witness_id -> trust_delta

# In routes.py:
if spell_risky and random.random() > 0.7:  # 30% failure chance
    consequence = generate_spell_consequence(spell_id)
    state.spell_state.failed_spells.append(SpellFailure(...))
    # Adjust witness trust based on consequence
```

**Effort**: 1 day (logic + testing)

---

## Anti-Patterns to Avoid

**Based on Phases 1-4.4 experience**:

❌ **Don't** hardcode spell effects in routes.py
- **Pattern**: Keep LLM prompts in context/ files (narrator.py, witness.py, tom_llm.py)
- **Why**: Maintains separation, easier to test, reusable

❌ **Don't** store large state objects in frontend local state
- **Pattern**: Use backend PlayerState as source of truth
- **Why**: Saves survive only if backend persists; frontend is display layer
- **Example**: Phase 4.4 conversation_history initially lost because frontend-only

❌ **Don't** add spell triggers to narrator system prompt
- **Pattern**: Keep spell results separate endpoint (POST /spell/cast)
- **Why**: Narrator already handles navigation/evidence; spells are different action type
- **Example**: Tom system prompt separate from narrator (lines 51-128 vs narrator lines 51-100)

❌ **Don't** create new modal types for every feature
- **Pattern**: Reuse Modal.tsx component with variant prop (terminal vs default)
- **Why**: Consistent styling, smaller bundle
- **Example**: Phase 4.4 moved all to consistent yellow uppercase titles

---

## Quick Reference: Adding a New Endpoint

**4-Step Pattern** (proven from Phases 1-4.4):

### Step 1: Define Types (frontend/src/types/investigation.ts)
```typescript
export interface CastSpellRequest {
  spell_id: string;
  target_id: string;
  case_id?: string;
  location_id?: string;
  player_id?: string;
}

export interface CastSpellResponse {
  success: boolean;
  spell_effect: string;
  new_evidence: string[];
  side_effects: string[];
}
```

### Step 2: Backend Model (routes.py)
```python
class CastSpellRequest(BaseModel):
    spell_id: str
    target_id: str
    case_id: str = "case_001"
    location_id: str = "library"
    player_id: str = "default"

class CastSpellResponse(BaseModel):
    success: bool
    spell_effect: str
    new_evidence: list[str] = []
    side_effects: list[str] = []
```

### Step 3: Route Handler (routes.py)
```python
@router.post("/case/{case_id}/spell/cast")
async def cast_spell(
    case_id: str,
    req: CastSpellRequest,
) -> CastSpellResponse:
    # Load state
    player_state = persistence.load_state(case_id, req.player_id)

    # Validate spell available at location
    available = loader.get_available_spells(case_id, req.location_id)
    if req.spell_id not in available:
        raise HTTPException(400, "Spell not available at this location")

    # Build context & call LLM for spell effect
    spell_effect = await generate_spell_effect(
        req.spell_id, req.target_id, player_state
    )

    # Check for new evidence revealed
    new_evidence = extract_revealed_evidence(spell_effect, req.spell_id)
    player_state.add_evidence(new_evidence)

    # Apply consequences if risky spell
    side_effects = apply_spell_consequences(req.spell_id, player_state)

    # Persist
    persistence.save_state(case_id, req.player_id, player_state)

    return CastSpellResponse(
        success=True,
        spell_effect=spell_effect,
        new_evidence=new_evidence,
        side_effects=side_effects,
    )
```

### Step 4: Frontend Client (api/client.ts)
```typescript
export async function castSpell(req: CastSpellRequest): Promise<CastSpellResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/case/${req.case_id}/spell/cast`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    }
  );

  if (!response.ok) {
    throw await createApiError(response);
  }

  return response.json() as Promise<CastSpellResponse>;
}
```

---

## Key Files to Reference During Implementation

| File | Purpose | Lines | Key Functions |
|------|---------|-------|----------------|
| `routes.py` | API endpoints | 1600+ | `investigate`, `tom_auto_comment`, `submit_verdict` |
| `player_state.py` | State model | 400+ | `add_evidence()`, `add_conversation_message()` |
| `narrator.py` | LLM context builder | 171 | `build_narrator_prompt()`, conversation history pattern |
| `tom_llm.py` | Character LLM | 431 | System prompt structure, mode selection, risk/reward |
| `loader.py` | YAML parser | - | `load_case()`, `get_location()` |
| `case_001.yaml` | Case template | 350+ | Structure for locations, witnesses, evidence, solution |
| `useInvestigation.ts` | Frontend state | 300+ | Save/load pattern, conversation restoration |
| `LocationView.tsx` | Main UI | 600+ | Message display, input handling, unified array pattern |
| `investigation.ts` | Type definitions | 350+ | Request/response shapes |

---

## Phase 4.5 Success Criteria

✅ All criteria from PLANNING.md + STATUS.md:

- [ ] 6 investigation spells defined in SPELL_DEFINITIONS
- [ ] Spell availability per-location in YAML (spell_contexts)
- [ ] POST /api/case/{case_id}/spell/cast endpoint working
- [ ] Spell effect narrative generation (LLM prompt)
- [ ] Risk/consequence system (30-50% failure for high-risk)
- [ ] Evidence revealed by spells triggers properly
- [ ] UI: SpellMenu component or button list in LocationView
- [ ] Tests: 20+ new tests for spell logic + endpoints
- [ ] All 492+ backend tests still passing
- [ ] All 440+ frontend tests still passing
- [ ] Zero regressions from Phases 1-4.4

---

## Unresolved Questions (For User/Planner)

1. **Spell Unlocking Model**: Static per-location (KISS) OR progression-based (richer)?
2. **Risk Balance**: 30% failure rate feels right, or adjust per spell?
3. **Spell Limit**: Cap spells per case (e.g., 5 max)? Or unlimited?
4. **Tom Comments on Spells**: Should Tom auto-comment after spell cast? (0.5 day extra)
5. **Spell Evidence**: Can spells reveal evidence already discovered? (affects deduplication logic)

---

## Files That Will Be Modified

**Backend (5 files)**:
1. `routes.py` - Add `/spell/cast` endpoint
2. `player_state.py` - Add SpellState class + methods
3. `loader.py` - Add `get_available_spells()`, spell definitions
4. `case_001.yaml` - Add spell_contexts section
5. New: `context/spell_effects.py` - LLM prompt builder for spells

**Frontend (4 files)**:
1. `types/investigation.ts` - Add CastSpellRequest/Response types
2. `api/client.ts` - Add `castSpell()` function
3. `hooks/useInvestigation.ts` - Add spell handling + state
4. `components/LocationView.tsx` - Add spell menu/buttons

**Tests (3 files)**:
1. `test_routes.py` - Add spell endpoint tests (10+)
2. `test_spell_effects.py` - New file, LLM prompt tests (5+)
3. Frontend spell tests (5+)

---

**Total Files Analyzed**: 18
**Total Symbols Extracted**: 45 core functions/classes, 25+ types
**Code Lines Reviewed**: 3,500+
**Confidence Level**: HIGH (9/10)
**Ready for Implementation**: YES ✅
