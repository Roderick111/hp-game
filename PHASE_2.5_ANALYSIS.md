# Phase 2.5 Planning Analysis - Terminal UX + Witness Integration

**Date**: 2026-01-05
**Planner**: Claude (planner agent)
**Status**: Ready for execution

---

## Executive Summary

**RECOMMENDATION: OPTION A - Include UX polish in Phase 2.5**

Combine terminal UX improvements + witness integration in single 1-2 day delivery. Creates cohesive playable experience with terminal aesthetic + functional witness interrogation.

---

## New Requirements (from User)

### 1. Remove "Investigate" Button → Terminal Shortcuts

**Current**:
```tsx
<Button onClick={handleSubmit}>Investigate</Button>
```

**New**:
```tsx
<textarea placeholder="> describe your action..." />
<div className="shortcuts">
  <button onClick={() => setInput("examine desk")}>examine desk</button>
  <button onClick={() => setInput("talk to Hermione")}>talk to Hermione</button>
</div>
```

**Why**: Terminal aesthetic (Obra Dinn/Disco Elysium pattern), immersive command-line style

---

### 2. Make Evidence Cards Interactive → Modal

**Current**:
```tsx
<div>[01] Hidden Note</div>
```

**New**:
```tsx
<div onClick={() => openModal("hidden_note")} className="cursor-pointer">
  [01] Hidden Note
</div>

<Modal>
  Name: Hidden Note
  Location: Hogwarts Library
  Description: Crumpled parchment shoved far under the desk...
</Modal>
```

**Why**: Evidence details not visible after discovery, user can't review findings

---

## Analysis of Current State

### Backend (case_001.yaml)

**Missing Data**:
- ❌ `witnesses_present` field in library location
- ❌ Evidence `name` field (player-facing)
- ❌ Evidence `location_found` field
- ❌ Evidence `description` field (player-facing narrative)

**Has Data**:
- ✅ Witnesses defined (Hermione, Draco) with full personality/secrets
- ✅ Hidden evidence with triggers
- ✅ Evidence `tag` field (narrator LLM sees this)

**Action Needed**:
```yaml
locations:
  library:
    # ADD THIS:
    witnesses_present:
      - "hermione"

hidden_evidence:
  - id: "hidden_note"
    # EXISTING (keep):
    triggers: [...]
    tag: "[EVIDENCE: hidden_note]"

    # ADD THESE:
    name: "Threatening Note"
    location_found: "Hogwarts Library"
    description: |
      Crumpled parchment shoved far under the desk. Someone wanted
      this hidden. Words "I know what you did" scrawled in hurried script.
```

---

### Frontend (LocationView.tsx)

**Current**:
- Line 232-246: "Investigate" button with loading state
- Line 218: Placeholder text: `"I check under the desk..."`

**Action Needed**:
- Remove button (lines 232-246)
- Change placeholder: `"> describe your action..."`
- Add shortcuts component below textarea (extract from locationData)

---

### Frontend (EvidenceBoard.tsx)

**Current**:
- Evidence displayed as static list: `[01] Hidden Note`
- formatEvidenceId() converts snake_case to Title Case

**Action Needed**:
- Add onClick handler to evidence cards
- Add useState for selectedEvidence
- Render Modal when selectedEvidence not null
- Fetch/display full evidence data in modal

**Potential Issue**:
- EvidenceBoard only receives evidence IDs (strings)
- Need full evidence data (name, location, description)
- **Solution 1**: Fetch from `/api/evidence/{id}` (add endpoint if missing)
- **Solution 2**: Pass full evidence objects from App.tsx (update investigation state)

---

### Frontend (App.tsx)

**Current**:
- Sidebar: EvidenceBoard, Case Status, Quick Help
- No witness UI visible

**Action Needed**:
- Import WitnessSelector, WitnessInterview
- Add `useState<string | null>` for selectedWitness
- Add WitnessSelector to sidebar (after Case Status, before Quick Help)
- Conditionally render WitnessInterview when selectedWitness not null

---

## Decision: Option A vs Option B

### Option A: Combined Delivery (RECOMMENDED)

**Scope**:
1. Terminal UX polish (shortcuts + evidence modal)
2. Witness integration (WitnessSelector + WitnessInterview)

**Effort**: 1-2 days total

**Tasks**:
- Task 1: YAML updates (witnesses_present + evidence metadata)
- Task 2: LocationView UX (remove button, add shortcuts)
- Task 3: EvidenceBoard UX (clickable cards, modal)
- Task 4: App.tsx integration (WitnessSelector + WitnessInterview)
- Task 5: Testing (validate complete flow)

**Pros**:
- ✅ Cohesive terminal experience in single delivery
- ✅ User gets playable witnesses + polished UX together
- ✅ No "half-finished" state (all Phase 2.5 features complete)
- ✅ Fast (1-2 days for everything)

**Cons**:
- ⚠️ Slightly more complex (5 tasks vs 3)
- ⚠️ Requires careful testing (more changes)

---

### Option B: Separate Phases (NOT RECOMMENDED)

**Scope**:
- Phase 2.5: Just witness integration (3 tasks, 3-5 hours)
- Phase 2.6: Terminal UX polish (2 tasks, 1 day)

**Effort**: 1-2 days total (same as Option A)

**Pros**:
- ✅ More granular (easier to test each piece)
- ✅ Can defer UX polish if urgent features needed

**Cons**:
- ❌ User waits 2 phases for complete experience
- ❌ "Half-finished" feel (witnesses work but UX rough)
- ❌ More overhead (2 planning docs, 2 agent handoffs)

---

## Files Modified (Option A)

| File | Lines Changed | Complexity |
|------|---------------|------------|
| `backend/src/case_store/case_001.yaml` | ~20 lines added | LOW (just metadata) |
| `frontend/src/components/LocationView.tsx` | ~30 lines (remove button, add shortcuts) | MEDIUM |
| `frontend/src/components/EvidenceBoard.tsx` | ~50 lines (clickable cards, modal) | MEDIUM |
| `frontend/src/App.tsx` | ~30 lines (witness integration) | LOW (components built) |

**Total**: ~130 lines changed across 4 files

---

## Risk Assessment

### Low Risk
- ✅ All witness components built (WitnessSelector, WitnessInterview)
- ✅ All witness APIs functional (173 backend tests passing)
- ✅ Modal component exists (reuse from Phase 1)
- ✅ Terminal aesthetic established (dark theme, monospace)

### Medium Risk
- ⚠️ Evidence modal needs full data (may need new endpoint OR state restructure)
- ⚠️ Shortcut extraction logic (parse surface_elements dynamically)
- ⚠️ Multiple modals (evidence + witness) may overlap (z-index management)

### Mitigation
- Evidence data: Fetch from `/api/evidence/{id}` endpoint (add if missing)
- Shortcuts: Simple parsing ("Oak desk" → "examine desk")
- Modal overlap: Use z-index hierarchy (witness z-50, evidence z-40)

---

## Quality Gates

### Must Pass
- [ ] All 337 tests still passing (no regressions)
- [ ] No console errors
- [ ] Lint + type-check clean
- [ ] Terminal shortcuts work (click fills input)
- [ ] Evidence modal works (click shows details)
- [ ] Witness interrogation works (select → question → present evidence)

### User Acceptance
- [ ] "Investigate" button not visible
- [ ] Terminal prompt placeholder: `> describe your action...`
- [ ] Quick actions below input
- [ ] Click evidence card → modal opens
- [ ] Modal shows name, location, description
- [ ] ESC closes modal
- [ ] Click Hermione → WitnessInterview opens
- [ ] Ask question → Hermione responds
- [ ] Present evidence → Secret revealed

---

## Agent Execution Plan

**Sequential Track** (all dependent):
1. **fastapi-specialist** (30 min)
   - Task 1: Update case_001.yaml
   - Add witnesses_present, evidence metadata

2. **react-vite-specialist** (4-6 hours)
   - Task 2: LocationView terminal shortcuts
   - Task 3: EvidenceBoard interactive modal
   - Task 4: App.tsx witness integration

3. **validation-gates** (1 hour)
   - Task 5: Run all tests + manual verification

4. **documentation-manager** (30 min)
   - Update STATUS.md, CHANGELOG.md, PLANNING.md

**Total Estimated Time**: 6-8 hours (fits 1-2 day window)

---

## Open Questions (for User)

1. **Evidence modal data source**:
   - Option 1: Fetch from `/api/evidence/{id}` (add new endpoint)
   - Option 2: Embed in locationData (pass full objects, not IDs)
   - Recommendation: Option 1 (cleaner API design)

2. **Terminal shortcut behavior**:
   - Option 1: Click fills input (user presses Ctrl+Enter)
   - Option 2: Click triggers action immediately (no confirm)
   - Recommendation: Option 1 (gives user chance to modify)

3. **Version bump**:
   - 0.2.1 (minor polish) OR 0.3.0 (new feature: evidence modal + witnesses)?
   - Recommendation: 0.3.0 (significant UX changes + new playable feature)

---

## Confidence Score: 8/10

**Why 8/10**:
- ✅ All components built (WitnessSelector, WitnessInterview, Modal)
- ✅ Clear patterns for terminal shortcuts + evidence modal
- ✅ Backend witness APIs functional (173 tests)
- ✅ YAML structure simple (just add metadata)
- ⚠️ Evidence modal data source needs decision (API endpoint vs embedded)
- ⚠️ Shortcut extraction logic needs testing (parse surface_elements)

**Why not 9/10**:
- Evidence modal data source unclear (may need new endpoint)
- Multiple simultaneous modals (z-index/focus management)

**Why not 10/10**:
- Always room for unexpected edge cases in UX changes

---

## Recommendation

**APPROVE OPTION A: Combined Delivery**

**Rationale**:
1. Same effort as separate phases (1-2 days)
2. Better UX (cohesive terminal aesthetic + playable witnesses)
3. All components already built (low risk)
4. Clear patterns provided (Quick Reference in PRP)
5. User gets complete Phase 2.5 in single delivery

**Next Steps**:
1. User reviews this analysis
2. User decides on open questions (evidence data source, shortcut behavior, version)
3. User approves → Launch fastapi-specialist (Task 1: YAML updates)

---

**Documents Ready**:
- ✅ INITIAL.md (37 lines, well under 120 limit)
- ✅ PRPs/phase2.5-terminal-ux-witness.md (comprehensive plan)
- ✅ PLANNING.md (Phase 2.5 section updated)
- ✅ STATUS.md (agent coordination updated)
