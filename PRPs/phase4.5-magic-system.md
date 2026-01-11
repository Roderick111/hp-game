# Phase 4.5: Magic System - Product Requirement Plan

**Date**: 2026-01-09
**Phase**: 4.5
**Status**: ✅ COMPLETE (2026-01-09)
**Estimated Effort**: 2-3 days
**Actual Effort**: 2-3 days
**Confidence**: 9/10 (proven patterns, clear scope)

**Completion Summary**:
- Backend: 570/570 tests (78 new spell tests, 100% passing)
- Frontend: 440+ tests (46 new spell tests, all passing)
- Files changed: 13 (8 backend, 5 frontend)
- Zero regressions, production-ready
- All 15 success criteria met
- Agent execution: fastapi-specialist → react-vite-specialist → validation-gates → documentation-manager ✅

---

## Executive Summary

Add 6 investigation spells (Revelio, Homenum Revelio, Specialis Revelio, Lumos, Prior Incantato, Reparo) with risk/reward mechanics and evidence filtering. Players can cast spells during investigations to reveal hidden evidence, but risky spells carry consequences (relationship damage, warrant violations, backlash). System teaches consequence evaluation through gameplay.

**Implementation Strategy**: KISS principle - simple LLM evaluation (like narrator), static spell availability per-location (no progression yet), reuse existing Modal/Context patterns, minimal new components.

---

## Why (Business Value)

### User Impact
- **Magical Immersion**: Players use actual Auror spells from HP universe
- **Strategic Depth**: Choose when to risk illegal spell usage vs safe investigation
- **Educational**: Teaches consequence evaluation, risk assessment
- **Replay Value**: Different spell combinations reveal different evidence

### Business Value
- **Differentiation**: Unique magic mechanics (not standard detective game)
- **Engagement**: 6 spells × varied effects = replayable investigations
- **Narrative Richness**: Spell consequences drive character relationships

### Integration
- Fits naturally into Phase 1-4.4 investigation loop
- Leverages existing LLM context patterns (narrator, witness, Tom)
- Uses proven state management (PlayerState extension)
- Extends YAML case structure (spell_contexts per location)

### Alignment
- **PLANNING.md Milestone**: Phase 4.5 - Magic System (6 spells + risk/reward)
- **Game Design**: Lines 1034-1093 (Magic System section)
- **KISS Principle**: Simple > Complex (static availability, not progression)

---

## What (Detailed Requirements)

### User-Visible Behavior

**Spell Activation Flow** (Text-Only, No Modal Buttons):
```
1. Player in library investigating
2. Player opens Auror's Handbook (read-only reference modal - just shows spell descriptions)
3. Player closes Handbook
4. Player clicks "Revelio" quick action (adds "I'm casting Revelio" to text input)
   OR player types "cast revelio on desk" directly
5. Player submits text input
6. Narrator response: "Revelio shimmers across desk. Hidden compartment glows."
7. Evidence revealed: "Secret Compartment" added to board
8. Tom comments (30%): "Magic found it. But WHY was it hidden?"

**Key**: Handbook is read-only. All spell casting via text input only.
```

**Risky Spell Flow** (Legilimency - Natural Narrator Warning):
```
Scenario A: Success, undetected
1. Player types: "cast Legilimency on witness"
2. Narrator: "Legilimency on an unwilling subject risks backlash. Are you certain?"
3. Player types: "Yes, do it carefully"
4. Narrator: "You slip into their mind unnoticed. Flash: a figure in dark robes. The witness saw someone else that night."
5. Evidence revealed, no relationship damage

Scenario B: Success but detected
1. Player types: "cast Legilimency on suspect"
2. Narrator: "Unauthorized Legilimency is illegal. The suspect may resist. Continue?"
3. Player types: "I need the truth"
4. Narrator: "You breach their mind. Memories flood: guilt, fear, a hidden accomplice. But they FEEL you. Their eyes narrow. 'You... you're in my head!' Trust shattered."
5. Evidence revealed + relationship_damaged flag set

Scenario C: Complete failure - suspect attacks
1. Player types: "Use Legilimency"
2. Narrator: "This suspect is trained in Occlumency. Dangerous. Proceed?"
3. Player types: "Cast it"
4. Narrator: "Their mental shields SLAM into you. The suspect's wand is suddenly aimed at your chest. 'HOW DARE YOU!' They're fleeing—or about to curse you."
5. Suspect flees location OR combat scenario triggered

Scenario D: Backlash
1. Player types: "Legilimency"
2. Narrator: "Risky without consent. Sure?"
3. Player types: "Yes"
4. Narrator: "You push into their mind—but their defenses rebound. Pain splits your skull. You stumble, vision blurring. The suspect looks confused but suspicious."
5. No evidence, player takes mental strain penalty, suspect wary

**Key**: Narrator gives natural warnings in conversation. Player responds naturally (any text). LLM determines outcome based on suspect's power, not fixed percentages.
```

### Technical Requirements

#### Backend (5 files)
1. **New File**: `backend/src/context/spell_llm.py` (~200 lines)
   - `build_spell_system_prompt()` - Spell evaluation constraints (includes risk warnings)
   - `build_spell_context()` - Case facts + discovered evidence + suspect magical strength
   - `generate_spell_effect(spell_id, target_id, context)` - LLM call for narrative + dynamic risk outcomes
   - No `calculate_spell_risk()` - LLM determines outcomes based on context (suspect Occlumency skill, relationship trust, etc.)

2. **Modified**: `backend/src/state/player_state.py` (add SpellState)
   ```python
   class SpellState(BaseModel):
       available_spells: list[str] = Field(default_factory=list)
       spells_cast_history: list[SpellCast] = Field(default_factory=list, max_length=10)
       failed_spells: list[SpellFailure] = Field(default_factory=list)

   class SpellCast(BaseModel):
       spell_id: str
       target_id: str
       timestamp: datetime
       result: str  # "success" | "failure"

   class SpellFailure(BaseModel):
       spell_id: str
       consequence: str  # "relationship_damage" | "backlash" | etc.
       timestamp: datetime
   ```

3. **Modified**: `backend/src/api/routes.py` (add 2 endpoints)
   - `POST /api/case/{case_id}/spell/cast` - Evaluate spell, return result + risks
   - `GET /api/case/{case_id}/spells` - List spells available at current location

4. **Modified**: `backend/src/case_store/loader.py`
   - `get_available_spells(case_id, location_id)` - Parse spell_contexts from YAML
   - `SPELL_DEFINITIONS` constant - 6 spell metadata (name, description, risk, category)

5. **Modified**: `backend/src/case_store/case_001.yaml` (add spell_contexts)
   ```yaml
   locations:
     library:
       spell_contexts:
         - spell_id: "revelio"
           available: true
           targets: ["desk", "shelves", "window", "victim"]
         - spell_id: "prior_incantato"
           available: true
           requires_target: "wand"
           targets: ["victim_wand"]
   ```

#### Frontend (4 files)
1. **New File**: `frontend/src/components/AurorHandbook.tsx` (~150 lines)
   - **Read-only reference modal** (6 spells + descriptions, NO action buttons)
   - Keyboard shortcut Cmd+H to open
   - Spell selection does NOTHING (just close modal - player must type spell manually)

2. **Modified**: `frontend/src/hooks/useInvestigation.ts`
   - **Remove `castSpell()` handler** (spell casting happens via text input → narrator endpoint)
   - Spell parsing: Detect "cast [spell]" or "[spell] quick action" → send to narrator
   - Narrator backend handles spell detection and calls spell_llm.py automatically

3. **Modified**: `frontend/src/types/investigation.ts`
   - **No new spell-specific types** (spells handled via narrator endpoint)
   - Spell effects come back as narrator responses (same InvestigateResponse type)
   - Evidence revealed via same mechanism as regular investigation

4. **Modified**: `frontend/src/components/LocationView.tsx`
   - Add quick action buttons for each spell (e.g., "Revelio", "Homenum Revelio")
   - Quick action click → adds "I'm casting [Spell]" to text input (doesn't submit automatically)
   - No spell result modal (spell effects come back as narrator responses in conversation)
   - Player can type "cast [spell] on [target]" directly instead of using quick actions

#### Database/State Changes
- No database (JSON persistence)
- PlayerState.spell_state persisted in JSON file (backward compatible via Field(default_factory=...))

### Success Criteria
- [ ] 6 spells defined in SPELL_DEFINITIONS constant
- [ ] Spell parsing in narrator detects "cast [spell]" input
- [ ] Narrator LLM evaluates spells via spell_llm.py (no separate endpoint needed)
- [ ] Legilimency warnings natural (no modal, narrator text only)
- [ ] LLM determines dynamic risk outcomes (not fixed percentages) based on suspect strength
- [ ] Evidence revealed by spells triggers properly (same as investigation)
- [ ] UI: AurorHandbook is read-only (NO action buttons, just reference)
- [ ] Quick actions add spell text to input (don't auto-submit)
- [ ] Tests: 15+ new tests (10 backend spell evaluation, 5 frontend Handbook)
- [ ] All 492 backend tests still passing
- [ ] All 440+ frontend tests still passing
- [ ] Zero regressions from Phases 1-4.4

---

## Context & References

### Project Documentation
**From PLANNING.md**:
- Architecture: Modular case structure (YAML), LLM integration (narrator, witness, mentor), state persistence (JSON)
- Phase 4.5 Milestone (lines 806-828): 6 spells, risk/reward, evidence filtering
- Tech Stack: FastAPI + Claude Haiku (backend), React + Vite (frontend), Pydantic v2 validation

**From Game Design Doc**:
- Magic System (lines 1034-1093): 6 core spells, restricted spells (Legilimency), risk evaluation, Auror's Handbook
- Design Philosophy: "Magic is a tool, not a crutch. Your mind is the weapon." - Moody

**From STATUS.md**:
- Current Version: 0.6.6 (Phase 4.42 complete)
- Test Coverage: 492 backend, 440+ frontend (932+ total)
- All quality gates passing

### Research Sources
**From GITHUB-RESEARCH-PHASE4.5.md** (validated):
- ✅ Zustand state management patterns (optional, reference only)
- ✅ Radix UI accessible modal patterns (project Modal.tsx already correct)
- ✅ FastAPI dependency injection (request.state for spell context)

**From CODEBASE-RESEARCH-PHASE4.5.md** (validated):
- ✅ PlayerState extension pattern (add SpellState like VerdictState, BriefingState)
- ✅ API endpoint pattern (POST with side effects, Pydantic models)
- ✅ LLM context builder pattern (narrator.py, tom_llm.py structure)
- ✅ YAML case structure (locations, hidden_evidence, spell_contexts extension)
- ✅ Frontend hook pattern (useInvestigation, message persistence)

**From DOCS-RESEARCH-PHASE4.5.md** (validated):
- ✅ React useReducer + Context API (spell menu state)
- ✅ FastAPI request.state (temporary spell evaluation context)
- ✅ TypeScript discriminated unions (spell types, risk types)

**Alignment Notes**:
- ✅ Research aligns with project architecture (LLM-first, YAML cases, JSON persistence)
- ✅ Patterns proven in Phases 1-4.4 (PlayerState extension, LLM context, Modal reuse)
- ✅ KISS principle maintained (no progression system yet, static availability)

---

## Quick Reference (Pre-Digested Context)

### 1. Spell Definitions (Backend Constant)

```python
# backend/src/case_store/loader.py

SPELL_DEFINITIONS = {
    "revelio": {
        "name": "Revelio",
        "description": "Reveals hidden objects, magical marks, concealed items",
        "risk": "low",
        "category": "revelation",
        "restricted": False,
    },
    "homenum_revelio": {
        "name": "Homenum Revelio",
        "description": "Detects living beings nearby, hidden persons",
        "risk": "low",
        "category": "investigation",
        "restricted": False,
    },
    "specialis_revelio": {
        "name": "Specialis Revelio",
        "description": "Identifies potions, substances, magical properties",
        "risk": "low",
        "category": "investigation",
        "restricted": False,
    },
    "lumos": {
        "name": "Lumos",
        "description": "Illumination, reveals traces in darkness",
        "risk": "low",
        "category": "utility",
        "restricted": False,
    },
    "prior_incantato": {
        "name": "Prior Incantato",
        "description": "Shows wand's last spells cast (requires physical wand)",
        "risk": "medium",
        "category": "investigation",
        "restricted": False,
        "requires_wand": True,
    },
    "reparo": {
        "name": "Reparo",
        "description": "Repairs broken objects, reveals how they broke",
        "risk": "low",
        "category": "utility",
        "restricted": False,
    },
    "legilimency": {
        "name": "Legilimency",
        "description": "Reads thoughts (RESTRICTED - requires consent OR authorization)",
        "risk": "high",
        "category": "interrogation",
        "restricted": True,
        "failure_rate": 0.3,  # 30% chance if used illegally
        "consequences": [
            "relationship_damage",
            "evidence_invalidation",
            "occlumency_backlash",
        ],
    },
}
```

### 2. LLM Spell Evaluation Pattern (Integrated with Narrator)

```python
# backend/src/context/spell_llm.py

async def build_spell_system_prompt(spell_id: str, suspect_strength: str = "average") -> str:
    """System prompt for spell evaluation (like narrator.py) with dynamic risk"""
    spell = SPELL_DEFINITIONS[spell_id]

    base_prompt = f"""You are evaluating the effect of a magical spell in an Auror investigation.

SPELL: {spell['name']}
EFFECT: {spell['description']}
CATEGORY: {spell['category']}

CRITICAL CONSTRAINTS:
- Respond in 2-4 sentences only
- Describe what the spell reveals, not what player already knows
- Be mysterious but helpful (Obra Dinn style)
- If spell reveals nothing new, say "The spell reveals nothing new here."
- NEVER reveal evidence not in ALLOWED_EVIDENCE list
- Maintain immersion (no meta-commentary)

ALLOWED EVIDENCE THIS LOCATION:
{{allowed_evidence}}

ALREADY DISCOVERED:
{{discovered_evidence}}
"""

    # Add risk warnings for Legilimency (natural text, not modal)
    if spell_id == "legilimency":
        base_prompt += f"""

LEGILIMENCY SPECIAL RULES:
- If player attempts without consent: Give natural warning first ("Legilimency on unwilling subject risks backlash. Are you certain?")
- If player confirms: Determine outcome based on suspect's Occlumency skill ({suspect_strength})
- Outcomes vary:
  * SUCCESS UNDETECTED: Reveal memory, suspect unaware
  * SUCCESS DETECTED: Reveal memory BUT suspect notices ("You... you're in my head!")
  * FAILURE BACKLASH: "Mental shields SLAM into you. Pain splits skull."
  * FAILURE FLEE: Suspect runs away or attacks player
- Consequences are narrative, not mechanical (relationship damage shown through dialogue, not stats)
- NEVER use fixed percentages - determine outcome organically from context
"""

    return base_prompt

async def generate_spell_effect(
    spell_id: str,
    target_id: str,
    case_facts: str,
    discovered_evidence: list[str],
    suspect_occlumency: str = "weak"  # weak, average, strong
) -> str:
    """Call Claude Haiku for spell effect narrative (includes dynamic risk evaluation)"""
    system_prompt = await build_spell_system_prompt(spell_id, suspect_occlumency)

    user_prompt = f"""
CASE FACTS:
{case_facts}

TARGET: {target_id}
DISCOVERED SO FAR: {', '.join(discovered_evidence) if discovered_evidence else 'None'}

Player casts {spell_id} on {target_id}.

Describe the spell's effect in 2-4 sentences. If it reveals new evidence, mention it.
If nothing new, say so clearly. If risky spell (Legilimency), give warning first, then determine outcome.
"""

    response = await claude_client.call_llm(
        model="claude-haiku-4-5-20250929",
        max_tokens=400,  # Increased for warnings + outcomes
        temperature=0.7,
        system=system_prompt,
        user_message=user_prompt,
    )

    return response.content
```

### 3. YAML Suspect Profiles (for Dynamic Risk)

```yaml
# backend/src/case_store/case_001.yaml

# Add magical strength to suspects for dynamic Legilimency outcomes
witnesses:
  - id: "hermione"
    name: "Hermione Granger"
    occlumency_skill: "weak"  # NEW: weak, average, strong
    personality: |
      ...existing personality...

  - id: "draco"
    name: "Draco Malfoy"
    occlumency_skill: "strong"  # NEW: trained Occlumens, resists intrusion
    personality: |
      ...existing personality...

# Narrator detects spell in player input, calls spell_llm.py with suspect context
# Example: "cast legilimency on draco" → spell_llm knows draco has strong Occlumency
```

### 4. YAML Spell Context Extension

```yaml
# backend/src/case_store/case_001.yaml

locations:
  library:
    id: "library"
    name: "Hogwarts Library - Crime Scene"
    description: |
      You enter the library. A heavy oak desk dominates the center...

    # Add spell contexts (NEW in Phase 4.5)
    spell_contexts:
      - spell_id: "revelio"
        available: true
        targets:
          - "desk"
          - "shelves"
          - "window"
          - "victim"
        hidden_evidence_revealed:
          - "hidden_compartment"  # Evidence ID that Revelio can reveal

      - spell_id: "prior_incantato"
        available: true
        requires_target: "wand"
        targets:
          - "victim_wand"
        hidden_evidence_revealed:
          - "last_spell_stupefy"

      - spell_id: "legilimency"
        available: true
        restricted: true
        targets:
          - "hermione"
          - "draco"
        risk_warning: |
          RESTRICTED SPELL. Requires suspect consent OR Ministry authorization.
          Illegal use consequences:
          - Evidence inadmissible in court
          - Relationship damage with Moody (-20 trust)
          - Occlumency backlash risk (30% chance)
```

### 5. Frontend Spell Hook Pattern

```typescript
// frontend/src/hooks/useInvestigation.ts (extend existing)

interface InvestigationState {
  // ... existing fields
  spellResult: SpellResult | null;
  showSpellHandbook: boolean;
}

export const useInvestigation = () => {
  const [state, setState] = useState<InvestigationState>(/* ... */);

  // Cast spell handler (NEW)
  const castSpell = async (spellId: string, targetId: string) => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await client.castSpell({
        spell_id: spellId,
        target_id: targetId,
        case_id: state.caseId,
        location_id: state.currentLocation,
      });

      // Show result modal
      setState(prev => ({
        ...prev,
        spellResult: response,
        discoveredEvidence: [
          ...new Set([...prev.discoveredEvidence, ...response.new_evidence])
        ],
      }));

      // Auto-trigger Tom comment (30% chance, like Phase 4.1)
      if (Math.random() < 0.3 && response.success) {
        await checkTomAutoComment({ is_critical: false });
      }

    } catch (error) {
      setState(prev => ({ ...prev, error: error.message }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  return {
    state,
    investigate,
    castSpell,  // NEW
    toggleHandbook: () => setState(prev => ({
      ...prev,
      showSpellHandbook: !prev.showSpellHandbook
    })),
  };
};
```

### 6. TypeScript Spell Types (Discriminated Unions)

```typescript
// frontend/src/types/investigation.ts

export type Spell =
  | { kind: 'revelio'; range: 'close' | 'room' }
  | { kind: 'homenum_revelio'; detects: 'hidden_people' }
  | { kind: 'specialis_revelio'; reveals: 'potions' | 'substances' }
  | { kind: 'lumos'; intensity: 'dim' | 'bright' }
  | { kind: 'prior_incantato'; requiresWand: true }
  | { kind: 'reparo'; targetType: 'object' }
  | { kind: 'legilimency'; restricted: true; requiresConsent: boolean };

export type Risk =
  | { type: 'none' }
  | { type: 'backlash'; damage: 'mental' | 'physical' }
  | { type: 'illegal_use'; consequence: string }
  | { type: 'occlumency'; strength: 'weak' | 'strong' }
  | { type: 'relationship_damage'; target: string; trust_loss: number };

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
  risks: Risk[];
  state_updates?: {
    relationship_changes?: Record<string, number>;
  };
}

export interface SpellResult {
  spell_id: string;
  effect: string;
  evidence_revealed: string[];
  risks: Risk[];
}
```

### 7. Library-Specific Gotchas

**React Context + useReducer**:
- ✅ DO: Use Context for spell history (global), useState for menu visibility (local)
- ❌ DON'T: Mix transient UI state with persistent game state

**FastAPI request.state**:
- ✅ DO: Use for temporary spell evaluation context (case facts, evidence)
- ❌ DON'T: Store persistent state in request.state (use PlayerState)

**TypeScript Discriminated Unions**:
- ✅ DO: Use literal types for discriminant ('revelio' not string)
- ❌ DON'T: Forget to handle all union variants (compiler will catch)

**Pydantic Validation**:
- ✅ DO: Use field_validator for spell_id validation (must be in SPELL_DEFINITIONS)
- ❌ DON'T: Trust frontend to only send valid spell IDs (always validate backend)

**Modal Accessibility**:
- ✅ DO: Reuse existing Modal.tsx (ESC, backdrop, focus trap already work)
- ❌ DON'T: Create new modal types (use variant prop for styling)

---

## Current Codebase Structure

```bash
# Existing files (Phase 1-4.4)
backend/src/
├── api/
│   ├── routes.py           # 1600+ lines, 492 tests passing
│   └── claude_client.py    # LLM wrapper (Haiku)
├── context/
│   ├── narrator.py         # 171 lines, proven LLM pattern
│   ├── witness.py          # 236 lines, conversation history
│   ├── tom_llm.py          # 431 lines, character LLM
│   └── mentor.py           # Verdict feedback
├── state/
│   ├── player_state.py     # 400+ lines, nested state classes
│   └── persistence.py      # JSON save/load
└── case_store/
    ├── case_001.yaml       # YAML case template
    └── loader.py           # Case parser

frontend/src/
├── hooks/
│   ├── useInvestigation.ts # Main state container
│   ├── useTomChat.ts       # Tom conversation
│   └── useBriefing.ts      # Briefing state
├── components/
│   ├── LocationView.tsx    # Main UI (600+ lines)
│   ├── WitnessInterview.tsx
│   ├── EvidenceModal.tsx
│   └── ui/Modal.tsx        # Accessible modal (reuse)
└── types/
    └── investigation.ts    # 350+ lines, type definitions
```

## Desired Codebase Structure

```bash
backend/src/
├── context/
│   └── spell_llm.py           # CREATE - Spell effect evaluation
├── api/
│   └── routes.py              # MODIFY - Add 2 spell endpoints
├── state/
│   └── player_state.py        # MODIFY - Add SpellState class
├── case_store/
│   ├── loader.py              # MODIFY - Add get_available_spells()
│   └── case_001.yaml          # MODIFY - Add spell_contexts section

frontend/src/
├── components/
│   └── AurorHandbook.tsx      # CREATE - Spell list modal
├── hooks/
│   └── useInvestigation.ts    # MODIFY - Add castSpell handler
├── types/
│   └── investigation.ts       # MODIFY - Add spell types
└── api/
    └── client.ts              # MODIFY - Add castSpell function
```

**Note**: Test files handled by validation-gates. Don't include in structure.

---

## Files to Create/Modify

| File | Action | Purpose | Reference File |
|------|--------|---------|----------------|
| `backend/src/context/spell_llm.py` | CREATE | Spell evaluation (LLM warns + determines outcomes) | `narrator.py` (lines 51-168) |
| `backend/src/context/narrator.py` | MODIFY | Detect spell input, call spell_llm.py | Existing evidence trigger pattern |
| `backend/src/state/player_state.py` | MODIFY | Add SpellState class (optional - track spell usage) | Existing VerdictState, BriefingState pattern |
| `backend/src/case_store/loader.py` | MODIFY | Add SPELL_DEFINITIONS constant | Existing loader patterns |
| `backend/src/case_store/case_001.yaml` | MODIFY | Add occlumency_skill to witnesses | Existing witness structure |
| `frontend/src/components/AurorHandbook.tsx` | CREATE | Read-only spell reference modal (NO buttons) | `WitnessSelector.tsx` layout |
| `frontend/src/components/LocationView.tsx` | MODIFY | Add spell quick actions (populate text input) | Existing quick actions pattern |

**Note**:
- No separate spell API endpoint - spells handled via narrator
- No spell-specific frontend types - reuse narrator response types
- Test files created by validation-gates

---

## Tasks (Ordered)

### Task 1: Define Spell Metadata (Backend)
**File**: `backend/src/case_store/loader.py`
**Action**: CREATE constant `SPELL_DEFINITIONS`
**Purpose**: Central spell metadata (name, description, risk, category)
**Reference**: Pattern from game design doc (lines 1034-1093)
**Depends on**: None
**Acceptance criteria**:
- [ ] `SPELL_DEFINITIONS` dict with 7 spells (6 core + 1 restricted)
- [ ] Each spell has: name, description, risk level, category, restricted flag
- [ ] Legilimency has failure_rate (0.3) and consequences list

### Task 2: Add Spell Contexts to YAML (Backend)
**File**: `backend/src/case_store/case_001.yaml`
**Action**: MODIFY locations section
**Purpose**: Define spell availability per location
**Reference**: Existing hidden_evidence structure (lines 260-282)
**Depends on**: Task 1
**Acceptance criteria**:
- [ ] `spell_contexts` section added to library location
- [ ] Revelio, Prior Incantato, Legilimency defined with targets
- [ ] hidden_evidence_revealed field maps spells to evidence IDs

### Task 3: Create Spell LLM Service (Backend)
**File**: `backend/src/context/spell_llm.py` (NEW)
**Action**: CREATE
**Purpose**: LLM-based spell effect narrative generation with dynamic risk
**Reference**: `narrator.py` structure (lines 51-168)
**Depends on**: Task 1, Task 2
**Acceptance criteria**:
- [ ] `build_spell_system_prompt(spell_id, suspect_strength)` function exists
- [ ] Legilimency prompt includes natural warnings + varied outcomes (4 scenarios)
- [ ] `generate_spell_effect(spell_id, target, context, occlumency)` calls Claude Haiku
- [ ] NO fixed risk percentages - LLM determines outcomes organically
- [ ] Follows narrator.py pattern (2-4 sentence limit, no hallucination)

### Task 4: Extend PlayerState with SpellState (Backend)
**File**: `backend/src/state/player_state.py`
**Action**: MODIFY
**Purpose**: Track spell usage, failures, history
**Reference**: Existing VerdictState, BriefingState pattern (lines 100-106)
**Depends on**: Task 3
**Acceptance criteria**:
- [ ] `SpellState` class created with Pydantic
- [ ] Fields: available_spells, spells_cast_history (max 10), failed_spells
- [ ] `PlayerState.spell_state: SpellState` field added with default_factory
- [ ] Method: `add_spell_cast(spell_id, target, result)`

### Task 5: Integrate Spell Detection in Narrator (Backend)
**File**: `backend/src/context/narrator.py`
**Action**: MODIFY
**Purpose**: Detect spell input, call spell_llm.py before normal narrator processing
**Reference**: Existing evidence trigger pattern (lines 82-168)
**Depends on**: Task 3, Task 4
**Acceptance criteria**:
- [ ] Detect "cast [spell]" or "I'm casting [spell]" in player_input
- [ ] Extract spell_id + target from input (e.g., "cast revelio on desk" → spell_id="revelio", target="desk")
- [ ] Call `generate_spell_effect()` from spell_llm.py with suspect's occlumency_skill
- [ ] Return spell effect as narrator response (reuse existing InvestigateResponse)
- [ ] No new API endpoints needed (spells integrated into `/investigate`)

### Task 6: Skip Frontend Type Changes
**File**: N/A
**Action**: SKIP (spells use existing narrator types)
**Purpose**: Spells handled via text input → narrator endpoint → same response type
**Reference**: No new types needed
**Depends on**: Task 5
**Acceptance criteria**:
- [x] No new spell-specific types required (reuse InvestigateRequest/Response)
- [x] Spell effects come back as narrator_response field
- [x] Evidence revealed via new_evidence field (same as regular investigation)

### Task 7: Skip Spell API Functions (Frontend)
**File**: N/A
**Action**: SKIP
**Purpose**: No new API functions needed (spells use existing investigate endpoint)
**Reference**: Existing `investigate()` function
**Depends on**: Task 6
**Acceptance criteria**:
- [x] No new API functions needed
- [x] Spells sent via existing `investigate()` → narrator detects them

### Task 8: Skip useInvestigation Hook Changes (Frontend)
**File**: N/A
**Action**: SKIP
**Purpose**: No spell handler needed (text input → investigate endpoint)
**Reference**: Existing `investigate()` handler already works
**Depends on**: Task 7
**Acceptance criteria**:
- [x] No `castSpell()` function needed
- [x] Spell quick actions populate text input with "I'm casting [Spell]"
- [x] Player submits via existing investigate() → narrator handles spell detection

### Task 9: Create Auror's Handbook Component (Frontend)
**File**: `frontend/src/components/AurorHandbook.tsx` (NEW)
**Action**: CREATE
**Purpose**: **Read-only** spell reference modal (NO action buttons)
**Reference**: `WitnessSelector.tsx` layout (display only)
**Depends on**: None (standalone reference)
**Acceptance criteria**:
- [ ] Modal displays 6 spells + descriptions from SPELL_DEFINITIONS
- [ ] Keyboard shortcut Cmd+H opens handbook
- [ ] **NO spell selection buttons** (read-only reference only)
- [ ] Close button only (ESC, backdrop, X button)
- [ ] Reuses existing Modal.tsx component

### Task 10: Add Spell Quick Actions to LocationView (Frontend)
**File**: `frontend/src/components/LocationView.tsx`
**Action**: MODIFY
**Purpose**: Add quick action buttons that populate text input with spell text
**Reference**: Existing quick actions pattern (lines 580-585)
**Depends on**: Task 9
**Acceptance criteria**:
- [ ] Quick action buttons for each spell (e.g., "Revelio", "Homenum Revelio", "Legilimency")
- [ ] Click "Revelio" → adds "I'm casting Revelio" to text input (doesn't auto-submit)
- [ ] Player can edit text before submitting (e.g., add target: "I'm casting Revelio on desk")
- [ ] Player can also type directly: "cast revelio on bookshelf" (skip quick actions)
- [ ] No spell result modal (effects come back as narrator responses in conversation)
- [ ] Integration with Tom auto-comment happens automatically (existing Phase 4.1 logic)

---

## Integration Points

### Backend Narrator Integration
**Where**: `backend/src/context/narrator.py`
**What**: Detect spell input before normal narrator processing, call spell_llm.py
**Pattern**: Follow existing evidence trigger detection pattern (lines 82-168)

### State Management
**Where**: `backend/src/state/player_state.py`
**What**: Add `SpellState` class alongside `VerdictState`, `BriefingState`
**Pattern**: Pydantic BaseModel with Field(default_factory=...) for backward compatibility

### LLM Context
**Where**: `backend/src/context/spell_llm.py` (new file)
**What**: Spell effect evaluation (spell-specific prompts, risk assessment)
**Pattern**: Same structure as `narrator.py` (system prompt, context builder, LLM call)

### YAML Extension
**Where**: `backend/src/case_store/case_001.yaml`
**What**: Add `spell_contexts` section to locations
**Pattern**: Similar to `hidden_evidence` (trigger-based, target-specific)

---

## Known Gotchas

### Claude API (from research + project experience)
- **Issue**: Legilimency warnings + outcomes need more tokens (was 300)
- **Solution**: Increase to max_tokens=400 for spell_llm.py (warnings + varied outcomes = 2-4 sentences)
- **Reference**: `narrator.py` uses max_tokens=300 for simple responses, spell_llm needs more for dynamic risk

### Pydantic Serialization (from project codebase)
- **Issue**: `datetime` objects in SpellCast don't serialize to JSON by default
- **Solution**: Use `model_dump(mode="json")` with `default=str` (Phase 4.4 pattern)
- **Reference**: `player_state.py` line 53 (conversation_history uses same pattern)

### FastAPI Async (from project architecture)
- **Issue**: Mixing sync/async can block spell evaluation
- **Solution**: Use `async def` for all spell endpoints (LLM calls are I/O-bound)
- **Reference**: All routes in `backend/src/api/routes.py` use async

### Spell Input Parsing (new pattern)
- **Issue**: Need to detect "cast [spell]" or "I'm casting [spell]" reliably
- **Solution**: Simple regex in narrator.py: `r'cast\s+(\w+)|I\'m casting (\w+)'i`
- **Reference**: Similar to Tom prefix detection in Phase 4.1 (`/^tom[,:\s]+/i`)

---

## Validation

### Syntax & Style (Pre-commit)
```bash
cd backend
uv run ruff check .
uv run ruff format .
uv run mypy src/
# Expected: No errors

cd ../frontend
bun run lint
bun run type-check
# Expected: No errors
```

### Manual Verification (Optional)
```bash
cd backend
uv run uvicorn src.main:app --reload

# Quick smoke test:
# 1. Open http://localhost:5173
# 2. Press Cmd+H → Auror's Handbook opens (read-only, no action buttons)
# 3. Close handbook
# 4. Click "Revelio" quick action → text input populated with "I'm casting Revelio"
# 5. Add target: "I'm casting Revelio on desk"
# 6. Submit → narrator response describes spell effect + evidence revealed
# 7. Type "cast legilimency on suspect" → narrator gives natural warning
# 8. Type "yes" → narrator determines outcome (varied scenarios)
```

**Note**: validation-gates agent handles comprehensive testing. No need to specify test scenarios in PRP.

---

## Dependencies

**New packages** (use `uv add` or `bun add`):
- None - reuse existing anthropic, fastapi, pydantic, react

**Configuration**:
- No new env vars needed
- Reuse existing `ANTHROPIC_API_KEY`
- No new build tools

---

## Out of Scope

- Dynamic spell unlocking (Phase 5 - progression system)
- Spell combo effects (Phase 6+ - advanced mechanics)
- Tom comments on specific spells (Phase 4.5 optional, defer if complex)
- Spell cooldown system (not in game design doc, defer)
- Evidence filtering UI (basic spell → evidence mapping only)

---

## Agent Orchestration Plan

### Execution Strategy

**Sequential Track** (dependencies):
1. `fastapi-specialist` → Backend changes (Tasks 1-5)
2. `react-vite-specialist` → Frontend changes (Tasks 6-10)
3. `validation-gates` → Run all tests
4. `documentation-manager` → Update docs

**Why Sequential**: Backend must define spell endpoints before frontend can call them.

### Agent-Specific Guidance

#### For fastapi-specialist
- **Input**: Tasks 1-5 (backend implementation)
- **Context**: Quick Reference sections above (no doc reading needed)
- **Pattern**: Follow `narrator.py` structure for spell_llm.py
- **Integration**: Add endpoints to `routes.py` like `/investigate`
- **Output**: 2 spell endpoints working, YAML updated

**Key Files to Reference**:
- `narrator.py` (LLM context structure, lines 51-168)
- `player_state.py` (state extension pattern, lines 100-106)
- `routes.py` (async endpoint pattern, lines 330-448)

#### For react-vite-specialist
- **Input**: Tasks 6-10 (frontend implementation)
- **Context**: Quick Reference section 5-6 above
- **Pattern**: Follow `useInvestigation.ts` for castSpell handler
- **Integration**: Add AurorHandbook.tsx like WitnessSelector.tsx
- **Output**: Spell UI working, Modal reused

**Key Files to Reference**:
- `useInvestigation.ts` (state hook pattern, lines 463-490)
- `LocationView.tsx` (quick actions, modal display, lines 580-585)
- `WitnessSelector.tsx` (list UI layout for Handbook)

#### For validation-gates
- **Input**: All code complete
- **Runs**: Tests, lint, type check, build
- **Output**: Pass/fail report
- **Note**: validation-gates creates tests if needed

#### For documentation-manager
- **Input**: Code complete, validation passed
- **Files changed**: List from "Files to Create/Modify" section
- **Output**: Updated README, PLANNING.md, STATUS.md

### Handoff Context

**Next agent receives**:
- This PRP (full context)
- Quick Reference (no doc reading needed)
- Specific task numbers
- Actual file paths to modify
- Pattern files to follow

**Next agent does NOT need**:
- ❌ Read research files
- ❌ Search for examples
- ❌ Read 5-10 docs (Quick Reference has everything)
- ❌ Explore codebase (integration points provided)

---

## Anti-Patterns to Avoid

**From project experience**:
- ❌ Creating new files when existing ones can be extended (use narrator.py pattern)
- ❌ Duplicating LLM patterns (follow narrator/tom_llm structure)
- ❌ Mixing sync/async incorrectly (all LLM calls are async)
- ❌ Not using template fallbacks for LLM calls (add try/except like narrator)
- ❌ Forgetting `model_dump(mode="json")` for datetime (SpellCast has timestamps)
- ❌ Creating new modal types (reuse Modal.tsx with variant prop)
- ❌ Storing transient UI state in PlayerState (spell menu visibility is local)

---

**Generated**: 2026-01-09
**Source**: Research files + project documentation
**Confidence Score**: 9/10 (proven patterns, clear scope, KISS principle)
**Alignment**: Validated against PLANNING.md (lines 806-828) and game design doc (lines 1034-1093)
