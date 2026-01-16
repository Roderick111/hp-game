# Documentation Research: Phase 4.5 (Magic System)

**Date**: 2026-01-09
**Phase**: Phase 4.5 - Magic System (6 spells with risk/reward, evidence filtering)
**Docs Found**: 3 official sources (React 18, FastAPI, TypeScript)

---

## Overview

Phase 4.5 adds a **Magic System** with 6 investigation spells. Implementation requires:
- **Frontend**: Spell menu component (Auror's Handbook), spell selection UI, risk/reward dialogue
- **Backend**: Spell context evaluation (LLM-based), risk assessment, spell trigger system in YAML
- **State**: Spell usage tracking, magical signature filtering for evidence
- **Type Safety**: Spell definitions, effect types, risk/consequence types

Focus is on **SIMPLE patterns** - no complex state machines, no advanced libraries.

---

## 1. React State Management (useState + Context API)

**URL**: https://18.react.dev/learn/managing-state
**Type**: Official React 18 Documentation
**Relevance**: Phase 4.5 needs spell menu state (selected spell, menu visibility) + investigation context (spells cast). useReducer + Context Pattern proven in codebase (see BriefingModal, WitnessInterview).

### Key Patterns Extracted

#### Pattern 1: Context + useReducer for Investigation State

```typescript
// Store spell cast history + current menu state
const [spellsState, dispatch] = useReducer(spellsReducer, initialState);

function spellsReducer(state, action) {
  switch (action.type) {
    case 'cast_spell':
      return {
        ...state,
        spellsCast: [...state.spellsCast, action.spell],
        lastSpell: action.spell
      };
    case 'toggle_handbook':
      return {
        ...state,
        handbookOpen: !state.handbookOpen
      };
    default:
      return state;
  }
}
```

**Usage**: Track spells cast during investigation. Persist to backend via `add_conversation_message()` pattern (Phase 4.4).

**Gotcha**: Spell history should NOT grow unbounded. Limit to last 10 spell casts (reuse 20-message limit pattern from conversation_history).

---

#### Pattern 2: Provider Pattern for Spell Context Access

```typescript
<SpellsContext.Provider value={spellsState}>
  <SpellsDispatchContext.Provider value={dispatch}>
    <LocationView />
    <AurorHandbook />
    <SpellResultModal />
  </SpellsDispatchContext.Provider>
</SpellsContext.Provider>
```

**Usage**: Make current spell state + dispatch available to all components (Auror's Handbook, LocationView, result display). NO prop drilling.

**Gotcha**: Separate context for state vs dispatch (as React docs show) to prevent unnecessary rerenders of components that only need dispatch.

---

#### Pattern 3: Local useState for Menu Visibility

```typescript
const [handbookOpen, setHandbookOpen] = useState(false);
const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);

// Toggle via Cmd+H or menu button
const toggleHandbook = () => setHandbookOpen(!handbookOpen);

// Select spell from menu
const selectSpell = (spell: Spell) => {
  setSelectedSpell(spell);
  setHandbookOpen(false); // Close menu on selection
};
```

**Usage**: Simple boolean state for menu visibility. No backend sync needed (transient UI state).

**Gotcha**: Keep menu state LOCAL to App component. Spell history goes to reducer context (global). Don't confuse temporary UI state with persistent game state.

---

## 2. FastAPI Request State & Middleware

**URL**: https://fastapi.tiangolo.com/reference/request
**Type**: Official FastAPI Documentation
**Relevance**: Phase 4.5 needs spell evaluation via LLM. Request.state pattern enables passing spell context through middleware → route handler → LLM service (no global variables).

### Key Patterns Extracted

#### Pattern 1: Store Request-Scoped State (Spell Evaluation Context)

```python
# In route handler
@app.post("/api/case/{case_id}/cast-spell")
async def cast_spell(case_id: str, request: Request, payload: SpellCastRequest):
    # Store investigation context for this spell evaluation
    request.state.case_id = case_id
    request.state.location = payload.current_location
    request.state.discovered_evidence = payload.discovered_evidence

    # Pass to LLM service
    result = await generate_spell_result(request.state)

    return {"result": result.description, "risks": result.risks}
```

**Usage**: Attach investigation context (location, evidence discovered) to request, pass through to spell evaluation function. Clean alternative to function parameters.

**Gotcha**: request.state is scoped to single request. Do NOT store state that persists across requests (use PlayerState for that). Use request.state only for temporary evaluation context.

---

#### Pattern 2: Middleware for Spell Evaluation Setup

```python
@app.middleware("http")
async def setup_spell_context(request: Request, call_next):
    # Initialize state dict
    request.state.spell_context = {}

    # Call route handler
    response = await call_next(request)

    return response
```

**Usage**: Pre-populate request.state before route handler. Avoids checking if attributes exist.

**Gotcha**: Middleware runs for EVERY request. Keep it lightweight. Complex spell logic belongs in route handler, not middleware.

---

#### Pattern 3: Access Request Session (For Spell Authorization)

```python
# Check if player has learned spell yet (from session/player_state)
@app.post("/api/case/{case_id}/cast-spell")
async def cast_spell(case_id: str, request: Request, payload: SpellCastRequest):
    player_state = await load_player_state(case_id)

    # Check if spell is available in this case
    if payload.spell_name not in player_state.available_spells:
        return {"error": "Spell not learned yet"}

    # Proceed with spell casting
    ...
```

**Usage**: Validate spell availability from PlayerState (persistent) vs request.state (temporary evaluation).

**Gotcha**: Session/player_state = persistent game data. request.state = temporary request context. Keep separate.

---

## 3. TypeScript Union Types & Discriminated Unions

**URL**: https://www.typescriptlang.org/docs/handbook/2/everyday-types
**Type**: Official TypeScript Handbook
**Relevance**: Phase 4.5 needs type-safe spell definitions. Union types express spell kinds (Revelio, Homenum Revelio, etc.), risk types (illegal use, backlash, etc.), and effects. Discriminated unions prevent invalid state combinations.

### Key Patterns Extracted

#### Pattern 1: Spell Type Definition with Discriminated Union

```typescript
// Union of all spell types with discriminant 'kind'
type Spell =
  | { kind: 'revelio'; range: 'close' | 'room' | 'area' }
  | { kind: 'homenum_revelio'; detects: 'hidden_people' }
  | { kind: 'specialis_revelio'; reveals: 'potions' | 'substances' }
  | { kind: 'lumos'; intensity: 'dim' | 'bright'; forensic: boolean }
  | { kind: 'prior_incantato'; requiresWand: true }
  | { kind: 'reparo'; targetType: 'object' | 'effect' }
  | { kind: 'legilimency'; requiresConsent: boolean; restricted: true };

// Usage - type-safe, can't mix properties
const spell: Spell = {
  kind: 'revelio',
  range: 'room'  // ✅ Valid
};

const spell2: Spell = {
  kind: 'legilimency',
  restricted: true,  // ✅ Required for this kind
  requiresConsent: false  // ✅ Illegal use path
};
```

**Usage**: Define all 6 spells + restricted spell with specific properties per type. Compiler prevents invalid combinations (e.g., Revelio doesn't have restricted property).

**Gotcha**: Discriminant field (kind) MUST be literal type ('revelio' not string). Otherwise type narrowing fails.

---

#### Pattern 2: Risk & Consequence Types

```typescript
// Spell effect result
type SpellResult = {
  success: boolean;
  description: string;
  effect?: EffectType;
};

// Risk consequences (discriminated by type)
type Risk =
  | { type: 'none' }
  | { type: 'backlash'; damage: 'mental' | 'physical' }
  | { type: 'illegal_use'; consequence: 'warrant_violation' | 'evidence_invalidation' }
  | { type: 'occlumency'; strength: 'weak' | 'strong'; backlashDamage: number }
  | { type: 'relationship_damage'; target: 'moody' | 'witness'; trustLoss: number };

// Safe to use - compiler ensures all risk types handled
function handleSpellRisk(risk: Risk) {
  switch (risk.type) {
    case 'none':
      return "No consequences";
    case 'backlash':
      return `Mental backlash: ${risk.damage}`;  // ✅ 'damage' exists
    case 'illegal_use':
      return `Evidence invalidated`;  // ✅ 'consequence' exists
    // etc...
  }
}
```

**Usage**: Type-safe spell result handling. Compiler prevents missing risk handlers.

**Gotcha**: If you add new risk type, must update all switch statements. This is GOOD (catch errors at compile time).

---

#### Pattern 3: Union Types for Spell Availability Filtering

```typescript
// Evidence has magical_signature field
type Evidence = {
  id: string;
  name: string;
  location: string;
  magical_signature?: 'wand' | 'potion' | 'artifact' | 'curse' | 'none';
};

// Spell reveals certain signature types
type SpellFilter = {
  spellKind: Spell['kind'];
  revealsSignatures: Evidence['magical_signature'][];
};

// Create filter mappings
const SPELL_FILTERS: SpellFilter[] = [
  { spellKind: 'revelio', revealsSignatures: ['artifact', 'curse'] },
  { spellKind: 'specialis_revelio', revealsSignatures: ['potion'] },
  { spellKind: 'prior_incantato', revealsSignatures: ['wand'] }
];

// Filter evidence by spell
function filterEvidenceForSpell(evidence: Evidence[], spell: Spell): Evidence[] {
  const filter = SPELL_FILTERS.find(f => f.spellKind === spell.kind);
  if (!filter) return [];

  return evidence.filter(e =>
    filter.revealsSignatures.includes(e.magical_signature || 'none')
  );
}
```

**Usage**: Type-safe filtering of evidence by spell type. Compiler ensures spell kind exists in SPELL_FILTERS.

**Gotcha**: If you change Spell definition, must update SPELL_FILTERS. Use strict type checking (tsconfig: "noImplicitAny": true) to catch this.

---

## 4. React Modal/Dialog Patterns (Accessible)

**URL**: https://18.react.dev/learn/managing-state
**Type**: React 18 Official Docs + Existing Modal.tsx Pattern
**Relevance**: Phase 4.5 uses Modal for spell result display + risk confirmation. Existing Modal.tsx (Phase 2.5) already handles accessibility (ESC key, backdrop click). Reuse pattern.

### Key Patterns Extracted

#### Pattern 1: Modal for Spell Result Display (Reuse Existing)

```typescript
// Use existing Modal.tsx from project
// File: frontend/src/components/ui/Modal.tsx (already accessible)

// In LocationView.tsx or new SpellResultModal.tsx
const [spellResult, setSpellResult] = useState<SpellResult | null>(null);
const [showRisks, setShowRisks] = useState(false);

// Open result modal after spell cast
async function handleCastSpell(spell: Spell) {
  const result = await castSpellOnBackend(spell);
  setSpellResult(result);

  if (result.risks.length > 0) {
    setShowRisks(true);  // Show confirmation modal for risky spells
  }
}

// Render modal
return (
  <Modal
    isOpen={spellResult !== null}
    onClose={() => setSpellResult(null)}
    title={`${spellResult?.description}`}
  >
    {spellResult && (
      <div className="space-y-4">
        <p>{spellResult.description}</p>

        {spellResult.risks.length > 0 && (
          <div className="bg-yellow-900 p-4 rounded">
            <h3>Risks:</h3>
            <ul>
              {spellResult.risks.map(risk => (
                <li key={risk.type}>{riskDescription(risk)}</li>
              ))}
            </ul>
          </div>
        )}

        <button onClick={() => setSpellResult(null)}>Continue</button>
      </div>
    )}
  </Modal>
);
```

**Usage**: Leverage existing Modal component (Phase 2.5). No new accessibility code needed. ESC/backdrop click already works.

**Gotcha**: Modal.tsx terminal variant adds brackets `[Title]`. For spell result, use default variant for consistency with verdict/feedback modals.

---

#### Pattern 2: Confirmation Modal for Risky Spells

```typescript
type RiskConfirmation = {
  spell: Spell;
  risks: Risk[];
  userConfirmed: boolean;
};

// Simple yes/no for risky spells
const [riskConfirm, setRiskConfirm] = useState<RiskConfirmation | null>(null);

function handleRiskySpell(spell: Spell, risks: Risk[]) {
  if (risks.some(r => r.type !== 'none')) {
    setRiskConfirm({ spell, risks, userConfirmed: false });
  } else {
    // No risks, proceed immediately
    executeSpell(spell);
  }
}

return (
  <Modal
    isOpen={riskConfirm !== null}
    onClose={() => setRiskConfirm(null)}
    title="Spell Risk Warning"
  >
    <p>This spell carries risks:</p>
    <RiskList risks={riskConfirm?.risks || []} />

    <div className="flex gap-2">
      <button onClick={() => {
        if (riskConfirm) {
          executeSpell(riskConfirm.spell);
          setRiskConfirm(null);
        }
      }}>
        Cast Anyway
      </button>
      <button onClick={() => setRiskConfirm(null)}>
        Use Different Approach
      </button>
    </div>
  </Modal>
);
```

**Usage**: Confirm risky spell casts (e.g., Legilimency without consent). Reuse Modal, add action buttons.

**Gotcha**: Keep state minimal. Don't track full investigation state in modal - just the spell + risks being confirmed. Backend evaluation happens on cast confirmation, not before.

---

## Quick Reference: Implementation Checklist

### Frontend Tasks
- [ ] Create `AurorHandbook.tsx` component (spell list, descriptions)
- [ ] Create `SpellResultModal.tsx` (results + risks display)
- [ ] Add `useSpells.ts` hook (cast spell logic, track history)
- [ ] Add SpellsContext + SpellsDispatchContext (global spell state)
- [ ] Update LocationView to show "Cast spell" quick action
- [ ] Type-safe spell definitions in `types/spell.ts`

### Backend Tasks
- [ ] Create `src/context/spell_llm.py` (evaluate spell effects via LLM)
- [ ] Add spell endpoints to routes.py:
  - `POST /api/case/{case_id}/cast-spell` (evaluate spell, return results + risks)
  - `GET /api/case/{case_id}/spells` (list available spells)
- [ ] Add SpellCastRequest/SpellResult models to models.py
- [ ] Update case_001.yaml: add `spell_contexts` per location
- [ ] Add spell history to InnerVoiceState (track spells cast)
- [ ] Tests: 5-10 new backend spell evaluation tests

### State Management
- [ ] PlayerState.available_spells (list of learned spells)
- [ ] PlayerState.spells_cast_history (last 10 spell casts, for risk tracking)
- [ ] LocationView.spellsState (useReducer: selected spell, menu visibility)
- [ ] Persistence: spell history saved/loaded like conversation_history

### Type Safety
- [ ] Discriminated union for all 6 spells + restricted spell
- [ ] Risk type union (none | backlash | illegal_use | etc.)
- [ ] Evidence.magical_signature field (wand | potion | artifact | curse | none)
- [ ] SpellFilter mapping (spell → revealed signatures)

---

## Sources

1. **React 18 Hooks & Context API**: https://18.react.dev/learn/managing-state
   - useReducer pattern for complex state
   - Context API for global state (spell history, available spells)
   - Dual context pattern (separate state & dispatch)

2. **FastAPI Request State & Middleware**: https://fastapi.tiangolo.com/reference/request
   - request.state for request-scoped spell evaluation context
   - Middleware for setup/teardown (optional)
   - Session access for spell availability validation

3. **TypeScript Union & Discriminated Unions**: https://www.typescriptlang.org/docs/handbook/2/everyday-types
   - Spell definitions with discriminated unions
   - Risk type unions for safe result handling
   - Type-safe spell filtering by signature

---

**KISS Principle Applied**: Only critical patterns extracted. No advanced state libs (Redux/Zustand). Reuse existing Modal/Context patterns from codebase. Spell evaluation via simple LLM call (like tom_llm.py, mentor.py).

**Total Patterns**: 8 key patterns across 3 docs. All implementation-ready with code examples.

**Next Step**: Use this research to inform Phase 4.5 PRP creation (TBD).
