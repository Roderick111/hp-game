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

## GitHub Production Repos (Updated: 2026-01-12)

### Phase 5.3: localStorage Save/Load System (2026-01-12)

**Repo 1**: localForage (mozilla/localForage) - 22.8k stars
- **Tech**: JavaScript/TypeScript, IndexedDB/WebSQL/localStorage abstraction
- **Pattern**: Unified storage API with automatic backend selection (IndexedDB > WebSQL > localStorage)
- **Found**: 2026-01-12 - Phase 5.3 Research
- **Status**: ✅ Active (maintained, current)
- **Use Case**: Drop-in replacement for localStorage, handles 3+ MB saves, graceful quota management
- **Key Patterns**:
  - Single API across all backends (auto-selects optimal based on browser)
  - Native object support (no JSON.stringify/parse needed)
  - Error distinction (QuotaExceededError vs other storage errors)
  - Browser capability detection (detect which backend is in use)

**Repo 2**: shapez.io (tobspr-games/shapez.io) - 6.8k stars
- **Tech**: JavaScript/TypeScript web game engine, Canvas API
- **Pattern**: Schema-based serialization, safe saves (atomic writes), corruption detection, versioning + migration
- **Found**: 2026-01-12 - Phase 5.3 Research
- **Status**: ✅ Active (maintained 2024-2025)
- **Use Case**: Production game with sophisticated save system, handles state validation, corruption recovery
- **Key Patterns**:
  - Schema-based save (static getSchema() methods define what each entity saves)
  - Safe saves (write to temp location, atomic swap, prevents corruption on crash)
  - Version + migration (tag saves with version, migrate schema on load)
  - Corruption detection (validate required fields, check referential integrity)

**Repo 3**: Ren'Py Visual Novel Engine (renpy/renpy) - 6.1k stars
- **Tech**: Python DSL for visual novels, file-based saves
- **Pattern**: Save slot metadata system, unlimited slots via pagination, save naming/descriptions
- **Found**: 2026-01-12 - Phase 5.3 Research
- **Status**: ✅ Active (maintained 2025)
- **Use Case**: Battle-tested VN save system, directly applicable to detective game structure
- **Key Patterns**:
  - Metadata separate from save data (timestamps, progress %, playtime, screenshots)
  - Unlimited slots via pagination (not fixed count, can grow from 3 → 100+)
  - User-defined save names + auto-generated descriptions (progress summaries)
  - Per-save versioning for compatibility across game updates

**Repo 4**: GameSaveSystem (dbeals/GameSaveSystem)
- **Tech**: JavaScript, auto-save + import/export focused
- **Pattern**: Event-driven auto-save triggers, safe saving, backup/restore functionality
- **Found**: 2026-01-12 - Phase 5.3 Research
- **Status**: ✅ Production-grade pattern (actively used)
- **Use Case**: Auto-save architecture for detective game (trigger on evidence, interrogation, verdict)
- **Key Patterns**:
  - Event-driven auto-save (not timer, only on significant events)
  - Time-based fallback (5-minute safety net)
  - Import/export with checksums (backup/restore for player convenience)
  - Corruption validation on import (detect bad save files before loading)

**Repo 5**: Universal Paperclips (stignarnia/UniversalPaperclipsButSaves)
- **Tech**: JavaScript, localStorage + console-based export
- **Pattern**: Full state serialization, size monitoring, quota warnings
- **Found**: 2026-01-12 - Phase 5.3 Research
- **Status**: ✅ Community maintained (200k+ plays)
- **Use Case**: Incremental game save patterns, full state snapshots, quota management
- **Key Patterns**:
  - Full state serialization to single localStorage key (simple, works for <5MB saves)
  - Size monitoring (log save size, warn approaching quota)
  - Storage quota API (navigator.storage.estimate() for proactive warnings)
  - Console export (manual backup mechanism, auto-copy to clipboard)

### Key Patterns Extracted (Phase 5.3)

#### Backend Patterns
- **Unified Storage API**: Use localForage instead of raw localStorage (automatic IndexedDB fallback)
- **Schema-Based Validation**: Define what to save via getSchema(), validate on load
- **Safe Save Pattern**: Write to temp location, atomic swap on success (prevent corruption)
- **Version + Migration**: Tag saves with version field, implement migrateIfNeeded() function
- **Corruption Detection**: Validate required fields, referential integrity, store checksums
- **Quota Monitoring**: Use navigator.storage.estimate(), warn at 80%+ before save fails

#### Frontend Patterns
- **Save Slot Management**: 3-5 manual slots + 1 auto-save slot (keep separate)
- **Metadata UI**: Display timestamp, progress %, location without parsing full save data
- **Auto-Save Triggers**: Event-driven (evidence found, interrogated, verdict submitted)
- **Time-Based Fallback**: 5-minute minimum interval for background auto-save
- **Import/Export**: Allow players to backup/restore saves as JSON files
- **Slot Naming**: Let players rename saves, show auto-generated progress descriptions

## GitHub Production Repos (Updated: 2026-01-09)

### Phase 4.5: State Management & Dialog Systems

**Repo 1**: Zustand (pmndrs/zustand) - 46.7k stars
- **Tech**: TypeScript, React hooks, minimal dependencies
- **Pattern**: Hooks-based state store (alternative to Context for spell inventory)
- **Found**: 2026-01-09 - Research Phase 4.5
- **Status**: ✅ Active (consistent updates 2024-2025)
- **Use Case**: Optional client-side spell state cache, conversation indexing

**Repo 2**: Radix UI Primitives (radix-ui/primitives) - 18k stars
- **Tech**: TypeScript, React 16.8+, zero external dependencies
- **Pattern**: Accessible dialog/modal with focus trapping, keyboard nav (ESC, Tab)
- **Found**: 2026-01-09 - Research Phase 4.5
- **Status**: ✅ Active (maintained by WorkOS 2024-2025)
- **Use Case**: Reference patterns for spell modal, risk confirmation dialogs

**Repo 3**: FastAPI (tiangolo/fastapi) - 73.7k stars
- **Tech**: Python, Pydantic v2, async/await, dependency injection
- **Pattern**: Request-scoped dependency injection + Pydantic validation for state
- **Found**: 2026-01-09 - Research Phase 4.5
- **Status**: ✅ Active (maintained by Tiangolo 2024-2025)
- **Use Case**: Spell endpoints with composition, state validation

### Key Patterns Extracted (Phase 4.5)

#### React State Management
- **Zustand hooks-based store**: Spell inventory without Context provider nesting (3-5 lines per action)
- **Radix Dialog focus management**: Accessible modals with focus trapping, ESC closes, automatic screen reader support
- **AlertDialog pattern**: For destructive actions (spell risk confirmation) - defaults to "Cancel" for safety
- **Nested dialogs**: Support spell list + detail view without stacking issues

#### FastAPI Session Handling
- **Dependency composition**: Layer dependencies (get_case → get_player → get_spell_context) for clean composition
- **Pydantic field validation**: Auto-validates spell names, risk ranges on model load
- **Request-scoped sessions**: Automatic commit/rollback via dependency context manager
- **Spell inventory model**: Type-safe SpellUsage with constraints (max_length, min/max values)

#### Trade-offs Documentation
- Zustand: +6KB gzipped but eliminates Context overhead
- Radix reference: +0KB (reference only, no new dependency)
- Pydantic validation: No cost (already in use), adds type safety
- JSON persistence: Proven, simple, sufficient for single-case scope

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

### Phase 5.1: Menu System Foundation (2026-01-12)

#### Radix UI Dialog
- **Official Docs**: https://www.radix-ui.com/docs/primitives
- **Key Sections**: Dialog component, focus management, ESC key handling, Portal
- **Context7 ID**: `/websites/radix-ui`
- **Status**: ✅ Current (v1.0+)
- **Key Patterns Found**:
  - Dialog.Root + Dialog.Portal for proper modal rendering (z-index safe)
  - `onEscapeKeyDown` handler automatically closes on ESC (built-in)
  - `onOpenAutoFocus` for keyboard navigation (focus first/custom element)
  - Focus trapping within dialog (accessibility standard)

#### React 18 Keyboard Events
- **Official Docs**: https://18.react.dev/reference/react-dom/components/common
- **Key Sections**: onKeyDown/onKeyUp handlers, useEffect cleanup pattern
- **Status**: ✅ Current (React 18.2+)
- **Key Patterns Found**:
  - `e.key === 'Escape'` for ESC detection
  - `addEventListener` + cleanup function (prevent memory leaks)
  - Dependency array management (include callbacks in deps)
  - Modifier keys: `e.ctrlKey`, `e.metaKey`, `e.shiftKey`

#### Tailwind CSS V3 Dark Mode & Focus
- **Official Docs**: https://v3.tailwindcss.com/docs/dark-mode
- **Key Sections**: dark: modifier, focus-visible pseudo-class, ring utilities
- **Status**: ✅ Current (v3.3+)
- **Key Patterns Found**:
  - `dark:` prefix for night theme (matches gray-900 + amber-400 aesthetic)
  - `focus-visible:` for keyboard-only focus ring (not on mouse click)
  - Dark mode activated via `darkMode: 'class'` in config or CSS media query

---

## Strong Patterns Discovered (Phase 5.2)

### Frontend: LocationSelector Component
- **Component**: LocationSelector.tsx using useState for selectedLocationId
- **Pattern**: Conditional Tailwind classes for selected/hover states
- **File Reference**: `frontend/src/components/LocationSelector.tsx`
- **Benefits**: Simple, no extra dependencies, integrates with existing dark theme
- **Key Code**: Template literals with conditional expressions for className

### Backend: Location Change Endpoint
- **Endpoint**: POST /api/change-location
- **Pattern**: Pydantic model + FastAPI auto-validation + HTTPException for business logic
- **File Reference**: `backend/src/api/routes.py` (location routes)
- **Benefits**: Auto-validates location_id format, returns 422 on invalid input
- **Key Code**: ChangeLocationRequest model with Field constraints

### Natural Language Detection
- **Pattern**: Regex with named groups for "go to [location]" commands
- **File Reference**: `frontend/src/utils/commandParser.ts`
- **Validation**: Always cross-check extracted location against valid location list (no false positives)
- **Pattern**: `/^(?<action>go|visit|head)\s+(?:to\s+)?(?<location>.+?)$/i`

### Tailwind Dark Theme Consistency
- **Pattern**: Terminal aesthetic (bg-gray-900 + text-amber-400) extended to LocationSelector
- **Selected state**: bg-amber-600 (solid highlight) + left border accent
- **Hover state**: bg-gray-700 with subtle border hint
- **Benefits**: Matches Phase 5.1 menu styling, accessible focus-visible rings

---

## Strong Patterns Discovered (Phase 5.1)

### Frontend: Menu Modal Dialog
- **Component**: MainMenu.tsx using Radix Dialog.Root
- **Pattern**: Dialog.Portal + onEscapeKeyDown + onOpenAutoFocus
- **File Reference**: To be implemented in `frontend/src/components/MainMenu.tsx`
- **Benefits**: Zero extra dependencies (Radix can be shared with Phase 4.5), WAI-ARIA accessible, proper focus trap

### Frontend: Keyboard Navigation
- **Pattern**: useEffect with addEventListener + cleanup, check isOpen condition
- **File Reference**: Custom hook `frontend/src/hooks/useMenuKeyboard.ts`
- **Usage**: Global shortcuts (ESC closes, arrow keys navigate menu items)
- **Benefits**: Simple, no library overhead, prevents memory leaks

### Frontend: Terminal Aesthetic Styling
- **Pattern**: Tailwind `dark:bg-gray-900 dark:text-amber-400` + `focus-visible:ring-amber-400`
- **File Reference**: MainMenu.tsx component classes
- **Benefits**: Matches existing game UI (gray background + amber text)

---

### Phase 5.2: Location Management System (2026-01-12)

#### React 18 - List Selection & Conditional Rendering
- **Official Docs**: https://react.dev/reference/react/useState
- **Key Sections**: useState hook, conditional CSS classes, map with key prop
- **Context7 ID**: N/A (React official)
- **Status**: ✅ Current (React 18.2+)
- **Key Patterns Found**:
  - `useState(selectedId)` for tracking selected location
  - Conditional CSS: `${selectedId === id ? 'bg-amber-600' : 'dark:hover:bg-gray-700'}`
  - Map with stable ID key: `locations.map(loc => <li key={loc.id}>`
  - Template literals for class composition (no ternary outside template)

#### FastAPI - POST Request Body with Pydantic
- **Official Docs**: https://fastapi.tiangolo.com/tutorial/body/
- **Key Sections**: POST endpoint, Pydantic model validation, automatic error responses
- **Status**: ✅ Current (FastAPI 0.100+)
- **Key Patterns Found**:
  - `class ChangeLocationRequest(BaseModel): location_id: str`
  - Auto-validation: FastAPI returns 422 on invalid input (no manual checks)
  - Path params + request body + query params combined seamlessly
  - HTTPException for business logic validation (location exists, etc.)

#### Tailwind CSS V3 - Dark Mode & List Styling
- **Official Docs**: https://tailwindcss.com/docs/dark-mode
- **Key Sections**: dark: modifier, hover states, focus-visible (keyboard nav)
- **Status**: ✅ Current (v3.3+)
- **Key Patterns Found**:
  - Dark theme: `dark:bg-gray-900 dark:text-amber-400` (matches Phase 5.1 terminal aesthetic)
  - Hover effects: `dark:hover:bg-gray-700 dark:hover:border-l-amber-300`
  - Focus rings: `dark:focus-visible:ring-amber-400` (keyboard only, not mouse)
  - Border accents for depth: `border-l-4 dark:border-l-amber-400`

#### JavaScript Regex - Natural Language Location Detection
- **Official Reference**: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions
- **Key Patterns Found**:
  - Basic: `/^(?<action>go|visit|head)\s+(?:to\s+)?(?<location>.+?)$/i`
  - Multi-variant: `/(go to|visit|head to|travel to)\s+(.+)/i`
  - Safe extraction: Always validate location exists after regex match (no false positives)

---

## GitHub Production Repos (Phase 5.2: Location Management)

### React Router v6 (remix-run/react-router) - 56k stars
- **Tech**: TypeScript, React 16.8+
- **Pattern**: Location state navigation, useLocation hook, useNavigate for state preservation
- **Found**: 2026-01-12 - Phase 5.2 Research
- **Status**: ✅ Active (consistent updates 2025)
- **Use Case**: Navigation with state object carrying evidence/witnesses across locations

### Radix UI Primitives (radix-ui/primitives) - 18k stars
- **Tech**: TypeScript, React 16.8+, zero external deps
- **Pattern**: Tabs component for location switching, keyboard navigation, accessibility
- **Found**: 2026-01-12 - Phase 5.2 Research
- **Status**: ✅ Active (maintained 2025)
- **Use Case**: LocationSelector panel with accessible tab-like switching

### Ren'Py Visual Novel Engine (renpy/renpy) - 6.1k stars
- **Tech**: Python, visual novel DSL
- **Pattern**: Scene/location system with entry/exit hooks, global vs per-location state, YAML structure
- **Found**: 2026-01-12 - Phase 5.2 Research
- **Status**: ✅ Active (updated 2026-01-06)
- **Use Case**: Location model structure, state preservation pattern, narrator reset per location

### Phaser Game Engine - 8.7k stars (CE), 2.8k (current)
- **Tech**: TypeScript/JavaScript game engine
- **Pattern**: Game state manager pattern, location as scene, unload/load lifecycle
- **Found**: 2026-01-12 - Phase 5.2 Research
- **Status**: ✅ Active (maintained 2025)
- **Use Case**: LocationManager backend design, clear separation of global vs per-location state

### TanStack Router (TanStack/router) - 8k stars
- **Tech**: TypeScript, React 16.8+, full-stack framework
- **Pattern**: Search params for location state, URL-based routing, type-safe routing
- **Found**: 2026-01-12 - Phase 5.2 Research
- **Status**: ✅ Active (updated 2025)
- **Use Case**: Alternative to location.state; bookmarkable location state in URL

### react-stateful-tabs (erictooth/react-stateful-tabs) - 1.2k stars
- **Tech**: React 16.8+, TypeScript
- **Pattern**: Per-location state preservation hook, independent state per tab
- **Found**: 2026-01-12 - Phase 5.2 Research
- **Status**: ✅ Maintained (last update 2024-06)
- **Use Case**: Per-location state hook for preserving narrator_history while clearing per-location metrics

---

## Key Patterns Extracted (Phase 5.2)

### Location State Architecture
- **Global Layer**: evidence[], witnesses[], trust levels (PRESERVED across locations)
- **Per-Location Layer**: narratorHistory[], spellUsageCount (CLEARED per location)
- **Location Metadata**: name, description, available_npcs (from YAML)

### Frontend Patterns
- **Location Selector**: Radix Tabs or simple button list with selected state
- **Keyboard Shortcuts**: 1-3 for locations, Alt+G for natural language dialog (future)
- **State Flow**: onClick location → clear narratorHistory → POST /api/change-location → update UI

### Backend Patterns
- **LocationManager**: change_location(id) → unload current → load new → return metadata + prompt
- **Natural Language Parser**: Detect "go to X" in freeform input via regex + fuzzy match
- **YAML Structure**: locations[id] = {name, description, initial_prompt, available_npcs, investigation_points}

### State Preservation Pattern
```
React Router location.state OR TanStack search params for "carryforward" layer
Combined with component useState for "per-location" layer
Example:
- location.state.evidence = [evidence items] (global)
- location.narratorHistory = [] (cleared on location change)
```

---

## Implementation Notes (Phase 5.2)

### Frontend Components
1. **LocationPanel.tsx**: Radix Tabs root with location buttons
2. **LocationSelector.tsx**: Clickable location list with keyboard shortcuts
3. **useLocationKeyboard.ts**: Hook for 1-3 shortcuts + Alt+G
4. **LocationCommandParser.ts**: Regex + fuzzy match for "go to X" detection (optional frontend)

### Backend Components
1. **LocationManager**: class handling change_location() lifecycle
2. **LocationCommandParser**: Python regex + rapidfuzz for natural language
3. **POST /api/change-location**: Endpoint taking location_id, returning metadata + prompt
4. **YAML Enhancement**: case_001.yaml with locations[id] section

### YAML Structure (Recommended)
```yaml
locations:
  library:
    id: library
    name: "Hogwarts Library"
    description: "..."
    initial_prompt: "You stand in the library..."
    available_npcs: [hermione, madame_pince]
    investigation_points: [wand_dust, frost_pattern]

# Global state (not per-location)
evidence: [...]
witnesses: [...]
```

---

### Phase 5.3: Save/Load Management System (2026-01-12)

#### MDN Web Storage API
- **Official Docs**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
- **Key Sections**: setItem/getItem, QuotaExceededError handling, storage limits (5-10MB per origin)
- **Status**: ✅ Current (living standard, continuously updated)
- **Key Patterns Found**:
  - Safe write with try/catch for QuotaExceededError (e.name === 'QuotaExceededError')
  - Safe read with JSON.parse wrapped in try/catch (catches SyntaxError for corrupted saves)
  - Quota detection via test-write-delete pattern (no reliable query method)

#### React 18 Custom Hooks
- **Official Docs**: https://18.react.dev/learn/reusing-logic-with-custom-hooks
- **Key Sections**: useState, useEffect, useCallback, custom hook patterns
- **Status**: ✅ Current (React 18.2+)
- **Key Patterns Found**:
  - useLocalStorage<T> hook with generics (returns [value, setValue, removeValue])
  - useAutoSave hook with debouncing (2s delay to prevent spam)
  - useSyncSavesAcrossTabs hook with StorageEvent listener (for multi-window sync)

#### Zod Schema Validation
- **Official Docs**: https://zod.dev/
- **Key Sections**: z.object, z.safeParse, schema validation, type inference
- **Status**: ✅ Current (latest version)
- **Key Patterns Found**:
  - SaveFileSchema with version, timestamp, gameState fields
  - safeParse() for non-throwing validation (returns {success, data, error})
  - Migration chain for version-to-version upgrades (1.0.0 → 1.1.0 → 2.0.0)

#### Game Save System Best Practices
- **Sources**: GameDev.net, bool.dev, Steam community guides
- **Key Concepts**: Multi-slot saves, autosave triggers, corruption detection, recovery strategies
- **Status**: ✅ Industry-standard patterns verified across 5+ games
- **Key Patterns Found**:
  - SaveManager class (listSaves, save, load, autosave, deleteSlot methods)
  - 3 manual slots + 1 autosave (total 4 save containers)
  - Autosave triggers: evidence discovered, witness interrogated, verdict submitted (debounced)
  - 3-tier corruption recovery: detect → repair → restore from backup
  - Metadata storage separate from game state (for save slot UI preview)

---

## Strong Patterns Discovered (Phase 5.3)

### Frontend: useLocalStorage Hook
- **Component**: SavePanel.tsx using useLocalStorage<GameState>
- **Pattern**: Custom hook with generic type, automatic serialization, error handling
- **File Reference**: `frontend/src/hooks/useLocalStorage.ts`
- **Benefits**: Declarative state sync, no manual localStorage calls in components
- **Key Code**: `const [slot1, setSlot1, clearSlot1] = useLocalStorage<GameState | null>('save_slot_1', null);`

### Frontend: Auto-Save with Debouncing
- **Hook**: useAutoSave(gameState, delayMs = 2000)
- **Pattern**: useRef for timeout tracking, useEffect cleanup pattern
- **Benefits**: Prevents storage spam, survives page close with 2s delay
- **Key Code**: Clear previous timeout, set new one on state change, cleanup on unmount

### Backend: Save File Schema (Zod)
- **Schema**: SaveFileSchema with version, timestamp, caseId, gameState fields
- **Pattern**: z.object with nested validation, safeParse for non-throwing parse
- **File Reference**: `backend/src/state/save_schema.py` or `save_models.ts`
- **Benefits**: Type-safe validation, catches corrupted saves before game tries to use them

### Backend: SaveManager Class
- **Methods**: listSaves(), save(), load(), autosave(), deleteSlot(), migrate()
- **Pattern**: Central save system abstraction, all localStorage access here
- **File Reference**: `backend/src/save/manager.py` (Python) or `frontend/src/utils/SaveManager.ts`
- **Benefits**: Single source of truth for save logic, easier testing, versioning in one place

### Error Handling: Quota Exceeded
- **Pattern**: Catch DOMException with name === 'QuotaExceededError', offer user options
- **Options**: Delete autosave, delete old manual slot, compress saves, clear browser cache
- **User UX**: "Storage full (X MB used). Clear saves or cache to continue."

### Corruption Recovery: 3-Tier System
- **Tier 1**: isSaveValid() via Zod schema check
- **Tier 2**: attemptRepair() reconstructs minimal valid save from partial data
- **Tier 3**: showRecoveryUI() with options [Delete] [Repair] [Restore Backup] [Cancel]

---

## Implementation Notes (Phase 5.3)

### Save Slot Strategy
- **Manual Slots**: 1, 2, 3 (player explicitly clicks "Save Here")
- **Autosave Slot**: Separate entry (auto-updates, player won't see overwrites)
- **Metadata**: Timestamp, progress %, location, playtime (shown in load UI)
- **Full State**: Stored separately, loaded only when player selects slot

### Autosave Triggers (Debounced 2s, Force on Verdict)
1. Evidence discovered → autosave(force=false)
2. Witness interrogated → autosave(force=false)
3. Verdict submitted → autosave(force=true) [bypass debounce]
4. Spell cast → autosave(force=false)
5. Location changed → autosave(force=true) [preserve narrator state]

### Versioning Strategy
- Store `version: '1.0.0'` in save file
- Create SaveMigration object with version → function mappings
- On load, migrate from saved version to current version via chain
- Test 2+ version jumps (1.0 → 2.0, skipping 1.1)

### Storage Quota Estimates
- Typical game state: ~50KB (locations + evidence + witness states)
- Slot metadata: ~1KB (timestamp, progress, location)
- Total for 3 manual + autosave: ~200KB (4.5% of 5MB quota)
- Warning threshold: 8MB (leaves 2MB buffer on 10MB limit)

---

## GitHub Production Repos (Updated: 2026-01-13)

### Phase 5.4: Case Creation Infrastructure (2026-01-13)

**Repo 1**: Ren'Py Visual Novel Engine (renpy/renpy) - 6.1k stars
- **Tech**: Python, YAML configuration, modular content loading
- **Pattern**: Case discovery with safe file scanning, graceful error handling
- **Found**: 2026-01-13 - Phase 5.4 Research
- **Status**: ✅ Active (maintained 2025-2026, 8000+ games built)
- **Key Patterns**:
  - Metadata structure (id, title, difficulty, description) separate from content
  - Safe file scanning (try/except YAML parse, continue on error)
  - Lazy loading (metadata first for listing, full case on selection)
  - Validation via schema (required/optional fields clearly marked)

**Repo 2**: MkDocs (mkdocs/mkdocs) - 20,000+ stars
- **Tech**: Python, YAML configuration, directory walking, plugin system
- **Pattern**: Auto-discovery + configuration-driven with template system
- **Found**: 2026-01-13 - Phase 5.4 Research
- **Status**: ✅ Active (maintained 2024-2025, community-supported)
- **Key Patterns**:
  - Directory walking with file filtering (skip hidden dirs, match pattern)
  - Lazy loading architecture (metadata from config, content on demand)
  - Configuration-driven discovery (mkdocs.yml controls what exists)
  - Annotated template files for content creation

**Repo 3**: Watchdog (gorakhargosh/watchdog) - 4,100+ stars
- **Tech**: Python, cross-platform file monitoring, event-driven architecture
- **Pattern**: Background file monitoring for hot-reload (Phase 5.5+)
- **Found**: 2026-01-13 - Phase 5.4 Research
- **Status**: ✅ Active (maintained 2024-2025)
- **Key Patterns**:
  - Event-driven callbacks (on_created, on_modified, on_deleted)
  - Background thread safety (errors in callbacks don't crash watcher)
  - Graceful degradation (missing files logged, continue monitoring)

### Key Patterns Extracted (Phase 5.4)

- **Metadata-only discovery**: Extract id, title, difficulty, description on scan (fast listing)
- **Lazy full load**: Load case content only when player selects (efficient)
- **Safe scanning**: try/except each file, log errors, skip + continue
- **Required fields**: id, title, difficulty, briefing, locations (≥1), witnesses (≥1), evidence (≥2), solution
- **Annotated template**: case_template.yaml with [REQUIRED]/[OPTIONAL] comments + examples
- **Validation errors**: Clear messages, not stack traces (Pydantic auto-validates)
- **Hot-reload ready**: Watchdog pattern for file monitoring (future enhancement)

---

## Documentation Maintenance

**Last Updated**: 2026-01-13 (Phase 5.4 Research)
**Next Review**: Before Phase 5.5 (Bayesian Tracker) or Phase 6 (Complete Case 1)

**To Update This File**:
1. After each major research phase, append new library findings
2. Document strong patterns discovered
3. Add gotchas as they surface during implementation
4. Link to corresponding research files (GITHUB-RESEARCH-PHASE*.md, DOCS-RESEARCH-PHASE*.md)

---

## Quick Reference: Library Versions

| Library | Version | Install Command |
|---------|---------|-----------------|
| react-hot-toast | 2.6.0+ | `bun add react-hot-toast` |
| pydantic | 2.9+ | `uv add pydantic` (already installed) |
| react | 18.2+ | Already in frontend |
| radix-ui | 1.0+ | Already using (Phase 5.1) |
| zod | 3.20+ | `bun add zod` (Phase 5.3) |
| Python | 3.11+ | Already configured |
| rapidfuzz | 3.0+ | `uv add rapidfuzz` (Phase 5.2) |

---

### Phase 5.4: Case Creation Infrastructure (2026-01-13)

#### PyYAML
- **Official Docs**: https://pyyaml.org/wiki/PyYAMLDocumentation
- **Key Sections**: safe_load, YAMLError handling, security (no FullLoader/UnsafeLoader)
- **Status**: ✅ Current (v6.0+, security-focused)
- **Key Patterns Found**:
  - `yaml.safe_load()` for untrusted YAML files (case_*.yaml)
  - Error handling with `yaml.YAMLError` catches parse errors
  - Batch loading with error collection (discover_cases returns both cases and errors)
  - Empty YAML returns None (not dict)

#### Pydantic v2
- **Official Docs**: https://docs.pydantic.dev/latest/concepts/models/
- **Key Sections**: BaseModel, field_validator, model_validate, model_dump, ValidationError
- **Status**: ✅ Current (v2.5+)
- **Key Patterns Found**:
  - Nested models (CaseFile > Location > Evidence)
  - `@field_validator` for single-field rules (lowercase IDs, min/max lengths)
  - `model_validate()` with error collection (returns ValidationError with .errors() list)
  - Optional fields with `Optional[T] = None` or `Field(default_factory=list)`
  - `model_dump()` converts model to JSON-serializable dict for API responses

#### FastAPI
- **Official Docs**: https://fastapi.tiangolo.com/tutorial/handling-errors/
- **Key Sections**: HTTPException, RequestValidationError, exception handlers, graceful error handling
- **Status**: ✅ Current (0.100+)
- **Key Patterns Found**:
  - HTTPException(status_code=422, detail=...) for validation errors
  - Partial success pattern (return valid cases + error list)
  - Custom exception handler for RequestValidationError
  - Structured error responses with field + message

---

## Strong Patterns Discovered (Phase 5.4)

### Backend: YAML Case Discovery
- **Function**: `discover_cases(case_store_dir)` → (cases[], errors[])
- **Pattern**: Batch load all case_*.yaml files, skip malformed ones, return both
- **File Reference**: `backend/src/case_store/loader.py` (enhancement)
- **Benefits**: Partial success (3/4 cases load even if 1 malformed), clear error logging
- **Key Code**: glob, try/except, yaml.safe_load, error collection

### Backend: Case Validation (Pydantic)
- **Model**: `CaseFile(BaseModel)` with id, title, locations, witnesses, evidence, solution
- **Pattern**: Required fields enforce minimum schema, @field_validator for data integrity
- **File Reference**: `backend/src/case_store/models.py` (new)
- **Benefits**: Type-safe validation, clear error messages per field, auto-validates nested models
- **Key Code**: Field(), field_validator, Optional fields with defaults

### Backend: Case API Endpoint
- **Endpoint**: `GET /api/cases` → returns {cases[], count, errors[]}
- **Pattern**: Graceful degradation (partial success OK), HTTPException only if ALL fail
- **File Reference**: `backend/src/api/routes.py` (new endpoint)
- **Benefits**: Frontend shows "3/4 cases loaded" if 1 malformed, helpful error list
- **Key Code**: discover_cases(), HTTPException with helpful detail

### Frontend: Dynamic Case Loading
- **Hook**: `useCases()` → {cases[], loading, error}
- **Pattern**: useEffect with API call on mount, handle loading/error states
- **File Reference**: `frontend/src/hooks/useCases.ts` (new)
- **Benefits**: Cases populate from API, not hardcoded in LandingPage
- **Key Code**: useEffect, setLoading, catch error, setError

### YAML Templates
- **File**: `backend/src/case_store/case_template.yaml`
- **Pattern**: Annotated template with REQUIRED/OPTIONAL comments, field descriptions
- **Benefits**: Copy-paste ready, non-technical designers can create cases
- **Key Code**: YAML comments for humans, Pydantic descriptions for machines

---

## Key Patterns Extracted (Phase 5.4)

### YAML Safe Loading Pattern
```python
import yaml
from pathlib import Path

def load_case_safe(file_path: str) -> Optional[dict]:
    try:
        with open(file_path, 'r') as f:
            data = yaml.safe_load(f)
            return data if data else None
    except yaml.YAMLError as e:
        logger.error(f"YAML parse error: {e}")
        return None
```

### Batch Discovery with Error Collection
```python
def discover_cases(case_dir: str) -> tuple[list[dict], list[str]]:
    cases, errors = [], []
    for yaml_file in Path(case_dir).glob("case_*.yaml"):
        case = load_case_safe(str(yaml_file))
        if case:
            cases.append(case)
        else:
            errors.append(f"{yaml_file.name}: malformed")
    return cases, errors
```

### Pydantic Case Validation
```python
from pydantic import BaseModel, Field, field_validator

class CaseFile(BaseModel):
    id: str = Field(..., description="Unique case ID")
    title: str = Field(..., description="Case title")
    locations: list = Field(..., description="At least 1 location")

    @field_validator('id')
    @classmethod
    def id_lowercase(cls, v):
        if not v.islower():
            raise ValueError("ID must be lowercase")
        return v

# Usage
case_data = yaml.safe_load(file)
try:
    case = CaseFile.model_validate(case_data)
except ValidationError as e:
    for error in e.errors():
        print(f"{error['loc']}: {error['msg']}")
```

### Graceful Degradation in API
```python
@app.get("/api/cases")
async def list_cases():
    cases, errors = discover_cases('case_store')
    if not cases and errors:
        raise HTTPException(status_code=400, detail=f"No valid cases. Errors: {errors[:3]}")
    return {
        "cases": cases,
        "count": len(cases),
        "errors": errors if errors else None
    }
```

---

## Gotchas & Lessons Learned (Phase 5.4)

### PyYAML
1. ❌ NEVER use `yaml.load()` without explicit Loader (security risk)
2. ❌ Don't expect yaml.safe_load() to catch FileNotFoundError (wrap in try)
3. ✅ Use yaml.safe_load() ALWAYS for case files (safe_load rejects Python objects)
4. ✅ Empty YAML returns None, not {} (check with `if data is None`)

### Pydantic
1. ❌ Don't forget `mode='after'` for list validators (@field_validator)
2. ❌ YAML keys must match field names (or use populate_by_name=True)
3. ✅ Use `Optional[T] = None` for optional fields (not Field(default=None))
4. ✅ Use `Field(default_factory=list)` for mutable defaults (not Field(default=[]))

### FastAPI
1. ❌ Don't throw 500 on malformed case YAML (it's user-created, use 400)
2. ❌ Don't return empty error list in API (return None or omit field instead)
3. ✅ Return partial success (3/4 cases + error list) when some YAML is malformed
4. ✅ Include field names + messages in error responses (helps users fix issues)

---

**Purpose**: This file prevents redundant web searches for the same libraries/patterns. Refer here before researching Phase 4.5+ features.

**Research Files**:
- `PRPs/DOCS-RESEARCH-PHASE5.4.md` - PyYAML, Pydantic, FastAPI patterns (LATEST - 2026-01-13)
- `docs/research/DOCS-RESEARCH-PHASE5.3.md` - localStorage API, React hooks, Zod, game save patterns
- `docs/research/GITHUB-RESEARCH-PHASE5.2.md` - 9 production patterns for location management
- `docs/research/DOCS-RESEARCH-PHASE5.1.md` - Radix UI, React 18, Tailwind patterns
- `docs/research/CODEBASE_RESEARCH-phase5.1.md` - App.tsx, Hook integration patterns
