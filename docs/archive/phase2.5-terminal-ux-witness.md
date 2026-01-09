# Phase 2.5 - Terminal UX + Witness Integration - Product Requirement Plan

**STATUS**: COMPLETE ✅ (2026-01-06) - User tested and confirmed working

---

## Goal

Polish investigation UX with terminal-style shortcuts + evidence modals, then integrate witness interrogation UI. Create cohesive playable experience: explore location → discover evidence → interrogate witness → present evidence → reveal secrets.

## Why

- **UX Gap**: "Investigate" button breaks terminal immersion (should be command-line style)
- **Evidence Gap**: Evidence cards not interactive (can't see details after discovery)
- **Integration Gap**: Witness system built (337 tests passing) but UI not accessible
- **User Impact**: Friction in investigation flow + missing witness mechanics
- **Business Value**: Complete Phase 2.5 in single delivery (1-2 days total)
- **Design Alignment**: Obra Dinn/Disco Elysium terminal aesthetic + Phoenix Wright evidence presentation

## What

### User-Visible Behavior

**Terminal Shortcuts**:
1. Input has terminal prompt placeholder: `> describe your action...`
2. Below input: Quick action shortcuts (contextual to location/witnesses)
   - "examine desk" (location-specific)
   - "check window" (location-specific)
   - "talk to Hermione" (if witness present)
3. Click shortcut → fills input OR triggers action immediately
4. Ctrl+Enter still submits (keep existing)
5. No "Investigate" button visible

**Evidence Modal**:
1. Evidence card shows: `[01] Hidden Note` (existing)
2. Click evidence card → Modal opens:
   - Evidence name
   - Location found
   - Description (simple text)
3. ESC OR click outside → Modal closes
4. Example modal:
   ```
   [Evidence Details]
   Name: Hidden Note
   Location: Hogwarts Library
   Description: Crumpled parchment shoved far under the desk...
   [Close]
   ```

**Witness Integration**:
1. Witnesses panel in sidebar (below Case Status)
2. Shows available witnesses (Hermione)
3. Click witness → WitnessInterview opens
4. Interrogate → present evidence → reveal secrets
5. Trust meter, conversation history, secret toasts

### Technical Requirements

**Backend YAML Updates**:
- Add `witnesses_present: ["hermione"]` to library location
- Add `location_found: "Hogwarts Library"` to each evidence
- Add `description: "Full description text"` to each evidence (player-facing)

**Frontend LocationView Changes**:
- Remove "Investigate" button (line 232-246)
- Add terminal shortcuts component below input
- Shortcuts: extract surface_elements + witnesses_present from location data
- Keep Ctrl+Enter submit logic

**Frontend EvidenceBoard Changes**:
- Make evidence cards clickable (onClick handler)
- Add state for selectedEvidence
- Render Modal when selectedEvidence not null

**Frontend App.tsx Changes**:
- Import WitnessSelector, WitnessInterview
- Add state for selectedWitness
- Render WitnessSelector in sidebar
- Conditionally render WitnessInterview modal

### Success Criteria

- [ ] No "Investigate" button visible in LocationView
- [ ] Terminal-style input with `>` prompt placeholder
- [ ] Quick action shortcuts render below input
- [ ] Click shortcut → fills input OR triggers action
- [ ] Click evidence card → modal shows name/location/description
- [ ] Evidence modal has close button (ESC works)
- [ ] WitnessSelector visible in sidebar
- [ ] Click witness → WitnessInterview opens
- [ ] Interrogate → present evidence → secret revealed
- [ ] All 337 tests still pass (no regressions)
- [ ] No console errors
- [ ] Terminal UI aesthetic maintained

---

## Context & References

### Documentation (URLs for AI agent)

```yaml
- url: https://tailwindcss.com/docs/backdrop-blur
  why: Evidence modal backdrop styling

- url: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
  why: Accessible modal patterns (focus trap, ESC close)

- url: https://react.dev/reference/react/useReducer
  why: WitnessInterview state management pattern
```

### Codebase Patterns (files to study)

```yaml
- file: frontend/src/components/LocationView.tsx
  why: Remove button, add shortcuts component
  symbol: LocationView lines 207-248

- file: frontend/src/components/EvidenceBoard.tsx
  why: Make cards clickable, add modal logic
  symbol: EvidenceBoard lines 59-82

- file: frontend/src/components/ui/Modal.tsx
  why: Reuse for evidence details modal
  symbol: Modal component

- file: frontend/src/App.tsx
  why: Sidebar layout, add WitnessSelector
  symbol: App lines 110-174

- file: backend/src/case_store/case_001.yaml
  why: Current YAML structure, add metadata
  symbol: locations.library, hidden_evidence
```

---

## Quick Reference (Context Package)

### Terminal Shortcuts Pattern

```tsx
// Below textarea, above submit button
<div className="terminal-shortcuts mt-2 mb-3">
  <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
    Quick Actions:
  </div>
  <div className="flex flex-wrap gap-2">
    {surfaceElements.map(element => (
      <button
        key={element}
        onClick={() => setInputValue(`examine ${element}`)}
        className="text-xs px-2 py-1 bg-gray-800 border border-gray-700 rounded
                   hover:bg-gray-700 text-gray-300"
      >
        examine {element}
      </button>
    ))}
    {witnessesPresent.map(witness => (
      <button
        key={witness.id}
        onClick={() => openWitnessModal(witness.id)}
        className="text-xs px-2 py-1 bg-amber-900/30 border border-amber-700 rounded
                   hover:bg-amber-800/40 text-amber-400"
      >
        talk to {witness.name}
      </button>
    ))}
  </div>
</div>
```

### Evidence Modal Pattern

```tsx
// In EvidenceBoard.tsx
const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);

// Make card clickable
<div
  onClick={() => setSelectedEvidence(evidenceId)}
  className="cursor-pointer hover:border-yellow-500 transition-colors"
>
  ...existing card content...
</div>

// Render modal
{selectedEvidence && (
  <Modal
    isOpen={true}
    onClose={() => setSelectedEvidence(null)}
    title="[Evidence Details]"
  >
    <div className="space-y-3">
      <div>
        <span className="text-xs text-gray-500 uppercase">Name:</span>
        <p className="text-gray-200">{evidenceData.name}</p>
      </div>
      <div>
        <span className="text-xs text-gray-500 uppercase">Location:</span>
        <p className="text-gray-200">{evidenceData.location_found}</p>
      </div>
      <div>
        <span className="text-xs text-gray-500 uppercase">Description:</span>
        <p className="text-gray-300 text-sm leading-relaxed">
          {evidenceData.description}
        </p>
      </div>
    </div>
  </Modal>
)}
```

### YAML Evidence Structure (Updated)

```yaml
hidden_evidence:
  - id: "hidden_note"
    type: "physical"
    triggers:
      - "under desk"
      - "search desk"
    # Narrator sees this when revealing:
    tag: "[EVIDENCE: hidden_note]"

    # NEW: Add these fields for player-facing modal
    name: "Threatening Note"
    location_found: "Hogwarts Library"
    description: |
      Crumpled parchment shoved far under the desk. Someone wanted
      this hidden. Words "I know what you did" scrawled in hurried script.
      The handwriting is rushed, angry. Ink slightly smudged as if
      the writer's hand was shaking.
```

### Witness Integration Pattern

```tsx
// In App.tsx sidebar (after Case Status)
const [selectedWitness, setSelectedWitness] = useState<string | null>(null);

<div className="space-y-4">
  <EvidenceBoard ... />
  <CaseStatusPanel ... />

  {/* NEW: Witness Panel */}
  <WitnessSelector
    caseId={CASE_ID}
    locationId={LOCATION_ID}
    onSelect={(id) => setSelectedWitness(id)}
  />

  <QuickHelpPanel />
</div>

{/* NEW: Witness Interview Modal */}
{selectedWitness && (
  <WitnessInterview
    caseId={CASE_ID}
    witnessId={selectedWitness}
    discoveredEvidence={state?.discovered_evidence ?? []}
    onClose={() => setSelectedWitness(null)}
  />
)}
```

### Library-Specific Gotchas

**Terminal Shortcuts**:
- Extract surface_elements from locationData (not hardcoded)
- Extract witnesses_present from locationData (dynamic list)
- "talk to X" only shows if witness present in current location

**Evidence Modal**:
- Need full evidence data (not just ID) - fetch from `/api/evidence/{id}` OR embed in locationData
- Modal must trap focus (accessibility)
- ESC key closes modal (add keydown listener)

**YAML Structure**:
- `location_found` is string (not object)
- `description` is player-facing (different from narrator `tag`)
- Keep `tag` field for narrator LLM (separate concern)

---

## Current Codebase Structure

```bash
frontend/src/
├── App.tsx                          # Main layout (MODIFY)
├── components/
│   ├── LocationView.tsx             # Remove button, add shortcuts (MODIFY)
│   ├── EvidenceBoard.tsx            # Make clickable, add modal (MODIFY)
│   ├── WitnessSelector.tsx          # Built, integrate
│   └── WitnessInterview.tsx         # Built, integrate
├── hooks/
│   └── useWitnessInterrogation.ts   # Use
└── api/
    └── client.ts                    # Use

backend/src/
└── case_store/
    └── case_001.yaml                # Add metadata (MODIFY)
```

---

## Files to Create/Modify

| File | Action | Purpose | Dependencies |
|------|--------|---------|--------------|
| `backend/src/case_store/case_001.yaml` | MODIFY | Add witnesses_present, evidence name/location/description | None |
| `frontend/src/components/LocationView.tsx` | MODIFY | Remove button, add terminal shortcuts | None |
| `frontend/src/components/EvidenceBoard.tsx` | MODIFY | Make cards clickable, add evidence modal | Modal.tsx |
| `frontend/src/App.tsx` | MODIFY | Integrate WitnessSelector + WitnessInterview | WitnessSelector, WitnessInterview |

---

## Tasks (ordered)

### Task 1: Update YAML Evidence Metadata
**File**: `backend/src/case_store/case_001.yaml`
**Action**: MODIFY
**Purpose**: Add player-facing evidence metadata for modal display
**Pattern**: Add name, location_found, description to each hidden_evidence item
**Depends on**: None
**Acceptance criteria**:
- Each evidence has `name` field (string, Title Case)
- Each evidence has `location_found` field (string, "Hogwarts Library")
- Each evidence has `description` field (multiline string, player-facing narrative)
- Add `witnesses_present: ["hermione"]` to library location
- Backend tests still pass

### Task 2: Remove Investigate Button + Add Terminal Shortcuts
**File**: `frontend/src/components/LocationView.tsx`
**Action**: MODIFY
**Purpose**: Replace button with terminal-style shortcuts
**Pattern**: Extract surface_elements/witnesses from locationData, render as buttons
**Depends on**: None
**Acceptance criteria**:
- Remove "Investigate" button (lines 232-246)
- Change placeholder to `> describe your action...`
- Add shortcuts component below textarea
- Shortcuts extracted from locationData.surface_elements
- Click shortcut fills input field
- Ctrl+Enter still submits
- No console errors

### Task 3: Make Evidence Cards Clickable + Add Modal
**File**: `frontend/src/components/EvidenceBoard.tsx`
**Action**: MODIFY
**Purpose**: Show evidence details modal on click
**Pattern**: Add onClick handler, useState for selectedEvidence, render Modal
**Depends on**: Task 1 (YAML metadata available)
**Acceptance criteria**:
- Evidence cards have cursor-pointer, hover effect
- Click evidence → opens modal
- Modal shows name, location_found, description
- ESC OR click outside closes modal
- Modal accessible (focus trap, aria-labels)
- No console errors

### Task 4: Integrate WitnessSelector + WitnessInterview
**File**: `frontend/src/App.tsx`
**Action**: MODIFY
**Purpose**: Make witness interrogation accessible
**Pattern**: Add WitnessSelector to sidebar, conditionally render WitnessInterview
**Depends on**: Task 1 (witnesses_present in YAML)
**Acceptance criteria**:
- WitnessSelector visible in sidebar
- Click witness → WitnessInterview opens
- Pass discoveredEvidence prop from investigation state
- Close callback clears selectedWitness
- No layout shifts
- No console errors

### Task 5: End-to-End Testing
**File**: N/A (manual verification)
**Action**: Manual testing
**Purpose**: Verify complete flow
**Depends on**: Tasks 1-4
**Acceptance criteria**:
- Terminal shortcuts work (click fills input)
- Evidence modal works (click shows details)
- Witness selection works (click opens interview)
- Interrogation works (question → response)
- Evidence presentation works (triggers secret)
- All 337 tests still pass
- No console errors

---

## Integration Points

### State Management
- **LocationView**: No new state (shortcuts use existing setInputValue)
- **EvidenceBoard**: Add useState<string | null> for selectedEvidence
- **App.tsx**: Add useState<string | null> for selectedWitness

### Component Integration
- **LocationView**: Extract surface_elements/witnesses from locationData prop
- **EvidenceBoard**: Import Modal component, render conditionally
- **App.tsx**: Import WitnessSelector, WitnessInterview, add to sidebar

### API Integration
- **Evidence Modal**: Fetch full evidence data from `/api/evidence/{id}` OR embed in locationData
- **Witness System**: Use existing `/api/witnesses`, `/api/interrogate` endpoints

---

## Known Gotchas

### Terminal Shortcuts
- **Issue**: surface_elements are strings ("Oak desk"), need to extract noun for shortcut
- **Solution**: Parse "Oak desk" → "examine desk" (lowercase, drop adjectives)

### Evidence Modal Data
- **Issue**: EvidenceBoard only has evidence IDs, not full data
- **Solution 1**: Fetch from `/api/evidence/{id}` endpoint (add if missing)
- **Solution 2**: Pass full evidence data from App.tsx (embed in investigation state)

### YAML Evidence Structure
- **Issue**: Two description fields - one for narrator, one for player
- **Solution**: Keep `tag` for narrator LLM, add `description` for player modal

### Witness Modal Overlap
- **Issue**: WitnessInterview modal may overlap evidence modal
- **Solution**: Use high z-index for WitnessInterview (z-50), evidence modal z-40

### Accessibility
- **Issue**: Modals need focus trap, ESC handler
- **Solution**: Use existing Modal component (already has accessibility features)

---

## Validation Loop

### Level 1: Syntax & Style
```bash
cd frontend && bun run lint && bun run type-check
cd backend && bun run lint
# Expected: No new errors
```

### Level 2: Unit Tests
```bash
cd frontend && bun test
cd backend && bun test
# Expected: All 337 tests passing (no regressions)
```

### Level 3: Manual/Integration
```bash
# Terminal 1: Backend
cd backend && bun run dev

# Terminal 2: Frontend
cd frontend && bun run dev

# Browser: http://localhost:5173
# 1. Verify no "Investigate" button
# 2. Verify terminal shortcuts below input
# 3. Click "examine desk" → fills input
# 4. Discover evidence → click evidence card → modal opens
# 5. Modal shows name, location, description
# 6. ESC closes modal
# 7. Click Hermione in sidebar → WitnessInterview opens
# 8. Ask question → Hermione responds
# 9. Present evidence → Secret revealed
# Expected: All steps work, no errors
```

---

## Dependencies

No new dependencies. Use existing:
- Modal component (Phase 1)
- WitnessSelector (Phase 2)
- WitnessInterview (Phase 2)
- useWitnessInterrogation hook (Phase 2)
- Backend witness APIs (Phase 2)

---

## Out of Scope

- Multiple locations (Phase 3/4)
- Location navigation (Phase 3/4)
- Adding Draco witness (Phase 2.6 - Hermione first)
- Advanced shortcut parsing (Phase 3 - keep simple for now)
- Evidence filtering/search (Phase 3)
- Witness discovery mechanics (Phase 3 - visible by default)

---

## Agent Orchestration Plan

### Execution Strategy

**Sequential Track** (all dependent):
1. fastapi-specialist → Task 1 (YAML updates) → WAIT
2. react-vite-specialist → Tasks 2-4 (frontend UX + integration) → WAIT
3. validation-gates → Task 5 (testing) → WAIT
4. documentation-manager → Update docs
5. User → Manual playtesting

**No Parallel Work** (each task depends on prior)

### Agent-Specific Guidance

#### For fastapi-specialist
- **Input**: Task 1 (YAML metadata)
- **File**: `backend/src/case_store/case_001.yaml`
- **Actions**:
  - Add `witnesses_present: ["hermione"]` to library location
  - Add `name`, `location_found`, `description` to each hidden_evidence
- **Pattern**: Follow existing YAML field structure
- **Output**: Updated YAML with metadata
- **Verification**: Backend tests pass

#### For react-vite-specialist
- **Input**: Tasks 2-4 (frontend UX + witness integration)
- **Dependencies**: Wait for Task 1 (YAML updates)
- **Files**: LocationView.tsx, EvidenceBoard.tsx, App.tsx
- **Pattern**: Follow Quick Reference patterns above
- **Context**: Terminal aesthetic, accessible modals, witness integration
- **Output**: Polished UX + integrated witness system
- **Verification**: Frontend tests pass, no console errors

#### For validation-gates
- **Input**: Task 5 (end-to-end testing)
- **Level 1**: Lint + type-check (both frontend/backend)
- **Level 2**: Run test suites (expect 337 tests passing)
- **Level 3**: Manual testing checklist
- **Success**: All tests pass + manual flow works

#### For documentation-manager
- **Input**: All tasks complete
- **Actions**: Update STATUS.md, CHANGELOG.md, PLANNING.md
- **Version**: Bump to 0.2.1 OR 0.3.0 (user decision)
- **Output**: Documentation reflects Phase 2.5 completion

### Handoff Context

**Next agent receives**:
- This PRP (full context)
- Quick Reference (patterns pre-digested)
- Specific task number
- Pattern files (no research needed)

**Next agent does NOT need**:
- ❌ Research terminal UI patterns (in Quick Reference)
- ❌ Design evidence modal UI (pattern provided)
- ❌ Research witness system (already built)
- ❌ Read Phase 2 PRP (context extracted here)

---

## Anti-Patterns to Avoid

- ❌ Hardcoding shortcuts (extract from locationData dynamically)
- ❌ Creating new witness components (already built)
- ❌ Complex shortcut parsing (keep simple: "examine X")
- ❌ Fetching evidence on every modal open (cache in state)
- ❌ Multiple modals open simultaneously (manage z-index)
- ❌ Breaking existing functionality (all 337 tests must pass)

---

Generated: 2026-01-05
Source: User UX requirements + Phase 2.5 integration plan
Research: Obra Dinn terminal patterns, Phoenix Wright evidence presentation
Confidence Score: 8/10 (straightforward UX polish + integration, all components built)

**Why 8/10**:
- ✅ All components already built (WitnessSelector, WitnessInterview, Modal)
- ✅ Clear patterns for terminal shortcuts + evidence modal
- ✅ Backend witness APIs functional (173 tests)
- ⚠️ Evidence modal needs full data (may need new endpoint OR state restructure)
- ⚠️ Shortcut extraction logic needs testing (parse surface_elements)
