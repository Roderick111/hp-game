# Phase 2.5 - Witness System Integration - Product Requirement Plan

## Goal

Make witness interrogation system playable by integrating WitnessSelector and WitnessInterview components into App.tsx and assigning witnesses to library location. User can test complete witness flow: select witness → question → present evidence → reveal secrets.

## Why

- **Gap**: Phase 2 built witness system (173 backend + 164 frontend tests passing) but UI not accessible
- **User Impact**: Cannot test witness interrogation despite all backend/frontend code complete
- **Screenshot Evidence**: User stuck in library with no witness UI visible
- **Business Value**: Quick win (1-2 days) to enable playtesting before Phase 3 (Verdict System)
- **Integration**: Phase 1 single-location pattern extends cleanly (no multi-location complexity)

## What

### User-Visible Behavior
1. User sees "Witnesses" section in sidebar (below Case Status panel)
2. WitnessSelector shows available witnesses in library (Hermione initially)
3. Click witness → WitnessInterview modal/panel opens
4. User types freeform questions → witness responds in character
5. User clicks evidence item → presents to witness → may reveal secret
6. Trust meter updates based on question tone (aggressive -10, empathetic +5)
7. Secrets revealed when trust >70 OR evidence:frost_pattern presented
8. Conversation history persists (witness remembers prior questions)

### Technical Requirements
- **Backend**: Add `witnesses_present: ["hermione"]` to library location in case_001.yaml
- **Frontend**: Integrate WitnessSelector + WitnessInterview into App.tsx layout
- **API**: Use existing `/api/witnesses` and `/api/interrogate` endpoints (no new backend work)
- **UI**: Maintain terminal aesthetic (dark theme, monospace, amber/green accents)
- **State**: Leverage useWitnessInterrogation hook (already built)

### Success Criteria
- [ ] WitnessSelector visible in App.tsx sidebar
- [ ] Clicking witness opens WitnessInterview UI
- [ ] User can type questions → witness responds in character
- [ ] Presenting evidence triggers secret revelations
- [ ] Trust meter updates correctly (visual feedback)
- [ ] Conversation history displays (bubble UI)
- [ ] Secret revelation toasts appear
- [ ] All existing tests still pass (337 tests)
- [ ] No console errors
- [ ] Terminal UI aesthetic maintained

---

## Context & References

### Documentation (URLs for AI agent)
```yaml
- url: https://react.dev/reference/react/useReducer
  why: WitnessInterview uses useReducer state management pattern

- url: https://tailwindcss.com/docs/customizing-colors
  why: Maintain dark theme (gray-900/800, green-400, amber-400)
```

### Codebase Patterns (files to study)
```yaml
- file: frontend/src/App.tsx
  why: Current layout structure (LocationView + EvidenceBoard sidebar)
  symbol: App component lines 110-174

- file: frontend/src/components/WitnessSelector.tsx
  why: Built component ready to integrate
  symbol: WitnessSelector component (lines 1-180)

- file: frontend/src/components/WitnessInterview.tsx
  why: Built component ready to integrate
  symbol: WitnessInterview component (lines 1-370)

- file: frontend/src/hooks/useWitnessInterrogation.ts
  why: State management hook
  symbol: useWitnessInterrogation hook

- file: backend/src/case_store/case_001.yaml
  why: Current YAML structure
  symbol: locations.library (lines 10-101)
```

### Research (from Phase 2)
- Backend: All APIs functional (173 tests passing)
- Frontend: Components complete (164 tests passing)
- Trust mechanics: LA Noire-inspired (-10/+5/0)
- Secret triggers: Phoenix Wright evidence presentation pattern

---

## Quick Reference (Context Package)

### Essential API Signatures
```typescript
// From frontend/src/api/client.ts
async function getWitnesses(caseId: string, locationId: string): Promise<WitnessInfo[]>

async function interrogateWitness(
  caseId: string,
  witnessId: string,
  question: string,
  tone: 'aggressive' | 'empathetic' | 'neutral'
): Promise<InterrogateResponse>

async function presentEvidence(
  caseId: string,
  witnessId: string,
  evidenceId: string
): Promise<PresentEvidenceResponse>
```

### Key Pattern from Existing Code
```typescript
// App.tsx current structure (lines 110-174)
<main className="max-w-6xl mx-auto">
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
    {/* Main Investigation (2/3 width) */}
    <div className="lg:col-span-2">
      <LocationView ... />
    </div>

    {/* Sidebar (1/3 width) */}
    <div className="space-y-4">
      <EvidenceBoard ... />
      <CaseStatusPanel />
      <QuickHelpPanel />
      {/* ADD: WitnessPanel HERE */}
    </div>
  </div>
</main>
```

### YAML Addition Pattern
```yaml
# backend/src/case_store/case_001.yaml
locations:
  library:
    id: "library"
    name: "Hogwarts Library - Crime Scene"
    type: "micro"
    description: |
      ...

    # ADD THIS FIELD:
    witnesses_present:
      - "hermione"  # She was studying here per background
```

### UI Integration Pattern
```typescript
// New WitnessPanel component in App.tsx
const [selectedWitness, setSelectedWitness] = useState<string | null>(null);

// In sidebar:
<WitnessSelector
  caseId={CASE_ID}
  locationId={LOCATION_ID}
  onSelect={(witnessId) => setSelectedWitness(witnessId)}
/>

{selectedWitness && (
  <WitnessInterview
    caseId={CASE_ID}
    witnessId={selectedWitness}
    discoveredEvidence={state?.discovered_evidence ?? []}
    onClose={() => setSelectedWitness(null)}
  />
)}
```

### Library-Specific Gotcha
- **Backend API**: `/api/witnesses?case_id=X&location_id=Y` expects both params
- **Component Props**: WitnessInterview needs discoveredEvidence prop (from investigation state)
- **Trust Mechanic**: Aggressive tone = -10, empathetic = +5, neutral = 0
- **Secret Triggers**: Parse "evidence:frost_pattern OR trust>70" format

### Configuration Requirements
No new dependencies. No config changes. Use existing:
- Tailwind theme (already configured)
- API client functions (already built)
- useWitnessInterrogation hook (already built)

---

## Current Codebase Structure
```bash
frontend/src/
├── App.tsx                          # Main layout (MODIFY)
├── components/
│   ├── LocationView.tsx             # Investigation UI (keep)
│   ├── EvidenceBoard.tsx            # Evidence list (keep)
│   ├── WitnessSelector.tsx          # Built, integrate
│   └── WitnessInterview.tsx         # Built, integrate
├── hooks/
│   ├── useInvestigation.ts          # Location state (keep)
│   └── useWitnessInterrogation.ts   # Witness state (use)
└── api/
    └── client.ts                    # API functions (use)

backend/src/
├── case_store/
│   └── case_001.yaml                # Case file (MODIFY - add witnesses_present)
└── api/
    └── routes.py                    # API endpoints (keep - no changes)
```

## Desired Codebase Structure
```bash
# No new files. Just integrate existing components.

frontend/src/
├── App.tsx                          # MODIFY: Add WitnessPanel section
└── components/
    ├── WitnessSelector.tsx          # USE (already built)
    └── WitnessInterview.tsx         # USE (already built)

backend/src/
└── case_store/
    └── case_001.yaml                # MODIFY: Add witnesses_present field
```

---

## Files to Create/Modify

| File | Action | Purpose | Dependencies |
|------|--------|---------|--------------|
| `backend/src/case_store/case_001.yaml` | MODIFY | Add `witnesses_present: ["hermione"]` to library location | None |
| `frontend/src/App.tsx` | MODIFY | Integrate WitnessSelector + WitnessInterview into sidebar | WitnessSelector, WitnessInterview components |
| No new files | - | All components already built in Phase 2 | - |

---

## Tasks (ordered)

### Task 1: Add Witnesses to Library Location (Backend YAML)
**File**: `backend/src/case_store/case_001.yaml`
**Action**: MODIFY
**Purpose**: Make Hermione available in library location
**Pattern**: Follow existing location field structure
**Depends on**: None
**Acceptance criteria**:
- Add `witnesses_present: ["hermione"]` field to library location (after description)
- No changes to witness definitions (already complete)
- Backend tests still pass (`bun --cwd backend run test`)

### Task 2: Integrate WitnessSelector into App.tsx Sidebar
**File**: `frontend/src/App.tsx`
**Action**: MODIFY
**Purpose**: Display available witnesses in sidebar
**Integration**: Below Case Status panel, above Quick Help
**Depends on**: None (component already built)
**Acceptance criteria**:
- Import WitnessSelector component
- Add witness panel in sidebar (after Case Status, before Quick Help)
- Pass caseId and locationId props
- Handle onSelect callback (stores selectedWitness in state)
- Maintains terminal UI aesthetic (dark theme, borders)
- No console errors

### Task 3: Add WitnessInterview Modal Integration
**File**: `frontend/src/App.tsx`
**Action**: MODIFY
**Purpose**: Open interrogation UI when witness selected
**Integration**: Conditionally render WitnessInterview based on selectedWitness state
**Depends on**: Task 2
**Acceptance criteria**:
- Add useState for selectedWitness (string | null)
- Conditionally render WitnessInterview when selectedWitness not null
- Pass caseId, witnessId, discoveredEvidence props
- Handle onClose callback (clears selectedWitness)
- Modal/panel opens smoothly
- No layout shifts

### Task 4: Manual Testing Verification
**File**: N/A (user testing)
**Action**: Manual verification
**Purpose**: Ensure complete witness flow works
**Depends on**: Tasks 1-3
**Acceptance criteria**:
- Start frontend + backend (`bun run dev` in both)
- Navigate to http://localhost:5173
- See "Witnesses" panel in sidebar
- See Hermione listed
- Click Hermione → WitnessInterview opens
- Type question → Hermione responds in character
- Click evidence item → Secret revealed (if trigger met)
- Trust meter updates correctly
- Close interview → Returns to investigation

---

## Integration Points

### State Management
- **Where**: `frontend/src/App.tsx` (add useState for selectedWitness)
- **What**: Track which witness currently being interviewed
- **Pattern**: Follow existing state pattern (similar to error/loading state)

### Component Integration
- **Trigger**: Click witness in WitnessSelector
- **Event**: `onSelect(witnessId)` callback
- **Render**: WitnessInterview modal/panel
- **Close**: `onClose()` callback clears selectedWitness

### API Integration
- **Endpoint**: `/api/witnesses?case_id=X&location_id=Y`
- **When**: WitnessSelector mounts (useEffect)
- **Response**: `WitnessInfo[]` array
- **Pattern**: Follow useInvestigation hook pattern

---

## Known Gotchas

### Backend YAML Structure
- **Issue**: `witnesses_present` must be array of witness IDs (strings), NOT objects
- **Solution**: `witnesses_present: ["hermione"]` NOT `witnesses_present: [{id: "hermione"}]`

### Component Props
- **Issue**: WitnessInterview needs discoveredEvidence prop for evidence presentation
- **Solution**: Pass `state?.discovered_evidence ?? []` from useInvestigation hook

### Layout Positioning
- **Issue**: WitnessInterview modal may overlap investigation area
- **Solution**: Use `position: fixed` with high z-index OR slide-in panel from right

### API Loading State
- **Issue**: Witnesses may not load if location_id param missing
- **Solution**: Ensure WitnessSelector passes both case_id AND location_id to getWitnesses()

---

## Validation Loop

### Level 1: Syntax & Style
```bash
# Frontend
cd frontend
bun run lint        # ESLint
bun run type-check  # TypeScript

# Backend
cd backend
bun run lint        # Ruff

# Expected: No new errors
```

### Level 2: Unit Tests
```bash
# Frontend
cd frontend
bun test

# Backend
cd backend
bun test

# Expected: All 337 tests still passing (no regressions)
```

### Level 3: Manual/Integration
```bash
# Terminal 1: Backend
cd backend
bun run dev

# Terminal 2: Frontend
cd frontend
bun run dev

# Manual steps:
# 1. Open http://localhost:5173
# 2. Verify "Witnesses" panel visible in sidebar
# 3. Click Hermione → WitnessInterview opens
# 4. Type "Where were you?" → Hermione responds
# 5. Click evidence item → Present to Hermione
# 6. Verify trust meter updates
# 7. Verify conversation history displays
# 8. Close interview → Returns to investigation
# Expected: All steps work smoothly, no errors
```

---

## Dependencies

No new dependencies. Use existing:
- WitnessSelector component (Phase 2)
- WitnessInterview component (Phase 2)
- useWitnessInterrogation hook (Phase 2)
- API client functions (Phase 2)
- Backend witness system (Phase 2)

---

## Out of Scope

- Multiple locations (Phase 3/4 - defer location navigation)
- Adding Draco to library (Phase 2.6 - focus Hermione first)
- Witness discovery mechanics (Phase 3/4 - witnesses visible by default for now)
- Location-based witness filtering (Phase 3/4 - single location for now)
- Witness movement between locations (Phase 3/4)

---

## Agent Orchestration Plan

### Execution Strategy

**Sequential Track** (all dependent):
1. fastapi-specialist → Task 1 (YAML modification) → WAIT
2. react-vite-specialist → Tasks 2-3 (App.tsx integration) → WAIT
3. validation-gates → Level 1-2 tests → WAIT
4. User → Task 4 (manual testing)

**No Parallel Work** (all tasks dependent on prior completion)

### Agent-Specific Guidance

#### For fastapi-specialist
- **Input**: Task 1 (YAML modification)
- **File**: `backend/src/case_store/case_001.yaml`
- **Action**: Add single line `witnesses_present: ["hermione"]` after library description
- **Pattern**: Follow existing YAML field structure
- **Output**: Modified YAML file
- **Verification**: Run `bun --cwd backend run test` (should still pass)

#### For react-vite-specialist
- **Input**: Tasks 2-3 (App.tsx integration)
- **Dependencies**: Wait for Task 1 (YAML) to complete
- **Files**: Modify only `frontend/src/App.tsx`
- **Imports**: Add WitnessSelector, WitnessInterview
- **Pattern**: Follow existing sidebar layout (lines 124-172)
- **State**: Add `useState<string | null>(null)` for selectedWitness
- **Context**: Use Quick Reference API signatures above
- **Output**: Integrated witness UI in App.tsx

#### For validation-gates
- **Input**: All tasks complete
- **Level 1**: Run lint + type-check (frontend + backend)
- **Level 2**: Run test suites (expect 337 tests passing)
- **Level 3**: Manual testing checklist (Task 4)
- **Success**: All tests pass + no console errors + witness flow works

### Handoff Context

**Next agent receives**:
- This PRP (full context)
- Quick Reference (no doc reading needed)
- Specific task number to implement
- Pattern files to follow (App.tsx, case_001.yaml)

**Next agent does NOT need**:
- ❌ Read Phase 2 PRP
- ❌ Research witness system architecture
- ❌ Build new components (already built)
- ❌ Design UI layout (pattern in Quick Reference)

---

## Anti-Patterns to Avoid

- ❌ Creating new witness components (WitnessSelector/WitnessInterview already exist)
- ❌ Modifying backend API routes (all endpoints ready)
- ❌ Building location navigation system (defer to Phase 3)
- ❌ Adding Draco before Hermione works (one witness first)
- ❌ Changing witness YAML structure (keep as-is, only add witnesses_present)
- ❌ Over-engineering modal logic (simple useState + conditional render)

---

Generated: 2026-01-05
Source: INITIAL.md (Phase 2.5)
Research: Phase 2 completion analysis, screenshot review
Confidence Score: 9/10 (straightforward integration, all components built, minimal changes)
