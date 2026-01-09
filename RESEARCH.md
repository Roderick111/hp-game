# Research & Documentation Knowledge Base

*Permanent knowledge base of strong patterns, libraries, and documentation findings. Updated after each major research phase.*

---

## Documentation Resources (Updated: 2026-01-08)

### Phase 4: Tom's Inner Voice System

#### react-hot-toast
- **Official Docs**: https://react-hot-toast.com/docs
- **Key Sections**: Styling (dark theme), Positioning, Custom Components, API Reference
- **Context7 ID**: N/A (not on Context7)
- **Status**: ✅ Current (v2.6.0)
- **Key Patterns Found**:
  - Dark theme configuration via `toastOptions.style`
  - Custom toast components with `toast.custom()`
  - Stacking control with `gutter` prop (vertical spacing)
  - Position options: top-right (investigation recommended)

#### Pydantic v2
- **Official Docs**: https://docs.pydantic.dev/latest/
- **Key Sections**: Models, Validators, ConfigDict, Field Validation
- **Validator Types**: field_validator (before/after/wrap), model_validator (after validators)
- **Context7 ID**: N/A (not on Context7)
- **Status**: ✅ Current (v2.9+)
- **Key Patterns Found**:
  - Nested models auto-validate from dicts (perfect for YAML → Python)
  - `@field_validator` for single-field rules (condition syntax)
  - `@model_validator(mode='after')` for cross-field validation (trigger uniqueness)
  - `ConfigDict(populate_by_name=True)` for flexible field naming
  - `ConfigDict(validate_assignment=True)` for mutable state validation

#### React Hooks (Official)
- **Official Docs**: https://react.dev/reference/react/useReducer
- **Key Sections**: useReducer API, useContext API, Custom Hooks, State Management Patterns
- **Context7 ID**: N/A (React is official)
- **Status**: ✅ Current (React 18.2+)
- **Key Patterns Found**:
  - `useReducer` pattern for complex state (reducer function, dispatch, initial state)
  - `useContext` + `useReducer` combination for global state
  - Custom hooks pattern (`use*` naming convention)
  - `useCallback` for memoizing dispatch functions (performance)
  - `useMemo` for memoizing context values with objects/functions

---

## Strong Patterns Discovered

### Frontend: React State Management

**Pattern**: useReducer + Context for voice trigger state
- **File**: To be implemented in `frontend/src/hooks/useInnerVoice.ts`
- **Usage**: Tracks fired triggers (Set<string>), evidence count, current tier
- **Found in**: DOCS-RESEARCH-PHASE4.md (Pattern 1-3)
- **Benefit**: Clear action dispatch, immutable state updates, easy testing

**Pattern**: Custom hook for Tom's voice display logic
- **File**: To be implemented in `frontend/src/hooks/useTomVoice.ts`
- **Usage**: Tier selection, random trigger picking, backend sync
- **Found in**: DOCS-RESEARCH-PHASE4.md (Pattern 3)
- **Benefit**: Encapsulates all voice logic, reusable across components

**Pattern**: Dark theme toast notifications
- **Library**: react-hot-toast v2.6.0+
- **Config**: Toaster wrapper with `toastOptions.style` (dark colors)
- **Position**: top-right (doesn't cover evidence board)
- **Duration**: 4-5 seconds for readable text
- **Found in**: DOCS-RESEARCH-PHASE4.md (Pattern 1-2)

### Backend: Pydantic Models

**Pattern**: Nested models for voice trigger hierarchy
- **File**: To be implemented in `backend/src/inner_voice/models.py`
- **Structure**: TierTriggers (tier_1, tier_2, tier_3) → VoiceTrigger[]
- **Validation**: condition syntax via @field_validator, uniqueness via @model_validator
- **Found in**: DOCS-RESEARCH-PHASE4.md (Pattern 1-2)
- **Benefit**: Type-safe YAML loading, automatic validation

**Pattern**: ConfigDict for flexible field naming
- **Usage**: `populate_by_name=True` for camelCase (frontend) ↔ snake_case (backend)
- **Also**: `validate_assignment=True` for state mutations in dispatch pattern
- **Found in**: DOCS-RESEARCH-PHASE4.md (Pattern 3)
- **Benefit**: Seamless frontend/backend integration, safer mutations

---

## Libraries Evaluated (Phase 4)

| Library | Status | Reason | Alternative |
|---------|--------|--------|-------------|
| **react-hot-toast** | ✅ SELECTED | Lightweight, dark theme support, TypeScript, React 18 compatible | react-toastify (heavier), sonner |
| **pydantic** | ✅ SELECTED | Already in use (v2), nested validation, ConfigDict patterns | marshmallow (older), dataclasses |
| **react** | ✅ SELECTED | Built-in useReducer + useContext, no external dependency | Redux (overkill), Zustand |

---

## Implementation Priority (From DOCS-RESEARCH-PHASE4.md)

1. **High Priority** (Core to Phase 4)
   - Pydantic TierTriggers model + validators
   - React Context + useReducer for trigger state
   - useTomVoice() custom hook (tier selection logic)
   - toast.custom() component for styling

2. **Medium Priority** (Integration)
   - Backend API endpoints (/api/inner-voice/triggers, /api/inner-voice/fire-trigger)
   - Evidence discovery → evidence_count increment
   - Trigger loading from case YAML files

3. **Low Priority** (Polish)
   - Rare trigger animations
   - Toast sound effects (optional)
   - Accessibility (aria labels)

---

## Testing Patterns (Future Reference)

### Backend Tests (Pydantic)
- Validate trigger structure from YAML
- Test condition parsing (valid/invalid syntax)
- Test trigger uniqueness validation
- Test tier assignment based on evidence count
- Test no-repeat logic (fired_trigger_ids)

### Frontend Tests (React)
- Test useInnerVoice() reducer actions
- Test selectRandomTrigger() avoids fired triggers
- Test toast display on trigger selection
- Test tier changes as evidence_count increases
- Test Context provider error handling

---

## Gotchas & Lessons Learned

### react-hot-toast
1. ❌ Don't override `toastOptions.duration` per-toast—use `duration` in `toast()` call
2. ❌ Don't use `position` outside fixed set (top-left, top-right, etc.)
3. ✅ Use `gutter` for spacing, not manual margin

### Pydantic v2
1. ❌ Validators run in definition order—place dependent validators after dependencies
2. ❌ YAML keys must match field names exactly (or use `populate_by_name`)
3. ✅ Use `@model_validator(mode='after')` for cross-field validation
4. ✅ Use Sets (not lists) for fired trigger tracking (O(1) lookup)

### React
1. ❌ Don't mutate state—always return new objects/arrays
2. ❌ Context re-renders all subscribers—use useCallback/useMemo to optimize
3. ✅ useReducer shines with 3+ related state variables
4. ✅ Custom hooks are just functions—can have side effects if wrapped in useEffect

---

## Documentation Maintenance

**Last Updated**: 2026-01-08 (Phase 4 Research)
**Next Review**: Before Phase 4.5 (Magic System) or Phase 5 (Narrative Polish)

**To Update This File**:
1. After each major research phase, append new library findings
2. Document strong patterns discovered
3. Add gotchas as they surface during implementation
4. Link to corresponding PRP files (DOCS-RESEARCH-PHASE*.md)

---

## Quick Reference: Library Versions

| Library | Version | Install Command |
|---------|---------|-----------------|
| react-hot-toast | 2.6.0+ | `bun add react-hot-toast` |
| pydantic | 2.9+ | `uv add pydantic` (already installed) |
| react | 18.2+ | Already in frontend |
| Python | 3.11+ | Already configured |

---

**Purpose**: This file prevents redundant web searches for the same libraries/patterns. Refer here before researching Phase 4.5+ features.
