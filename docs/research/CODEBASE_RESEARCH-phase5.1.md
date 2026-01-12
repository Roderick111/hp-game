# Codebase Research: Phase 5.1 Menu System Foundation

**Feature**: Main Menu System (In-Game Menu Modal)
**Analysis Date**: 2026-01-12
**Scope**: Frontend UI patterns, state management, API integration, modal design
**Phase Dependency**: Phase 4.8 Complete (Legilimency system) - Ready for Phase 5.1

---

## Executive Summary

Phase 5.1 will add an in-game menu modal accessible via ESC key or menu button. The menu will centralize game controls (Restart Case, Save Game, Load Game, Settings placeholder) and replace the current "Restart Case" button in App.tsx.

**Key Findings**:
- Modal infrastructure fully established (ESC/backdrop/X button handling)
- State management patterns proven with multiple modal types (Briefing, Evidence, Auror Handbook)
- Reset/save/load API endpoints already implemented
- Button component system with variants ready for menu items
- Terminal UI aesthetic consistent across all existing modals

---

## Directory Structure & Patterns

### Frontend Components (`frontend/src/components/`)
```
components/
├── ui/
│   ├── Modal.tsx           # Reusable modal with ESC/backdrop/X close
│   ├── Button.tsx          # Variant-based button (primary/secondary/ghost)
│   └── Card.tsx            # Card container (optional for menu items)
├── ConfirmDialog.tsx       # Confirmation pattern (useful for destructive ops)
├── AurorHandbook.tsx       # Reference modal (isOpen/onClose pattern)
├── EvidenceModal.tsx       # Evidence display modal (modal nesting example)
├── BriefingModal.tsx       # Briefing flow modal (vertical message feed)
├── LocationView.tsx        # Main game view
└── App.tsx                 # Main app orchestration
```

### Backend Routes (`backend/src/api/routes.py`)
```
POST /api/case/{case_id}/reset          # Reset/restart case
POST /api/save                          # Save player state
GET /api/load/{case_id}                 # Load player state
GET /api/case/{case_id}/location/{id}   # Location data
```

---

## Existing UI Modal Patterns

### Modal.tsx - Base Component (ESTABLISHED PATTERN)

**Location**: `frontend/src/components/ui/Modal.tsx`
**Purpose**: Reusable modal container with accessibility and keyboard handling

**Key Features**:
- ESC key listener for close (lines 20-31)
- Backdrop click to close (line 42)
- X button close (lines 77-87)
- Two variants: `default` (yellow titles) and `terminal` (green titles)
- Responsive max-height (90vh), centered layout
- Dialog role + aria attributes for accessibility

**Code Pattern**:
```tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  variant?: 'default' | 'terminal';
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  variant = 'default',
}: ModalProps) {
  // ESC key listener
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div className={`relative rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden border-2 ${
        isTerminal
          ? 'bg-gray-900 border-gray-700'
          : 'bg-gray-900 border-gray-700'
      }`}>
        {/* Header with title and close button */}
        {/* Body with children */}
      </div>
    </div>
  );
}
```

**Integration Pattern** (from App.tsx):
```tsx
const [briefingModalOpen, setBriefingModalOpen] = useState(false);

// To open
setBriefingModalOpen(true);

// To close
const handleBriefingComplete = useCallback(async () => {
  await markBriefingComplete();
  setBriefingModalOpen(false);
}, [markBriefingComplete]);

// In JSX
<BriefingModal
  isOpen={briefingModalOpen}
  onClose={handleBriefingComplete}
  // ... other props
/>
```

### Button.tsx - Menu Item Building Block (ESTABLISHED PATTERN)

**Location**: `frontend/src/components/ui/Button.tsx`
**Purpose**: Reusable button with variants for styling consistency

**Features**:
- 3 variants: `primary` (amber), `secondary` (light amber), `ghost` (transparent)
- 3 sizes: `sm`, `md`, `lg`
- forwardRef for focus management (useful for keyboard nav)
- Disabled state with opacity reduction
- Tailwind styling with hover/transition effects

**Code Pattern**:
```tsx
const variantStyles = {
  primary: 'bg-amber-600 hover:bg-amber-700 text-white border-amber-700',
  secondary: 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300',
  ghost: 'bg-transparent hover:bg-amber-50 text-amber-700 border-transparent',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({
    children,
    onClick,
    disabled = false,
    variant = 'primary',
    size = 'md',
    className = '',
    type = 'button',
  }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`
          font-semibold rounded-lg border-2 transition-colors duration-200
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${className}
        `}
      >
        {children}
      </button>
    );
  }
);
```

**Usage for Menu Items**:
```tsx
<Button
  variant="primary"
  size="md"
  onClick={() => handleSaveGame()}
>
  SAVE GAME
</Button>
```

---

## State Management Patterns

### App.tsx Orchestration (ESTABLISHED PATTERN)

**Location**: `frontend/src/App.tsx`
**Pattern**: Composition of multiple hooks, centralized component orchestration

**Key Patterns** (lines 44-106):
1. **Multiple specialized hooks**:
   - `useInvestigation` - Investigation state + save/load
   - `useWitnessInterrogation` - Witness conversation state
   - `useVerdictFlow` - Verdict submission state
   - `useBriefing` - Briefing modal state
   - `useTomChat` - Tom's ghost mentor state

2. **Local state for UI** (lines 117-132):
   - Modal open/close states with `useState`
   - Message restoration on load
   - Conditional modal opening based on backend state

3. **Callback pattern**:
```tsx
const handleBriefingComplete = useCallback(async () => {
  await markBriefingComplete();
  setBriefingModalOpen(false);
}, [markBriefingComplete]);
```

**For Phase 5.1**: Main menu will follow same pattern:
```tsx
const [menuOpen, setMenuOpen] = useState(false);

const handleMenuClose = useCallback(() => {
  setMenuOpen(false);
}, []);

const handleRestartCase = useCallback(async () => {
  // Trigger reset via resetCase() API
  // Show confirmation dialog
  // Call backend reset
  // Reload game state
  setMenuOpen(false);
}, []);
```

### Hook State Management Pattern (ESTABLISHED)

**Example from useInvestigation.ts**:
```tsx
const [state, setState] = useState<InvestigationState | null>(null);
const [location, setLocation] = useState<LocationResponse | null>(null);
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [error, setError] = useState<string | null>(null);
const [restoredMessages, setRestoredMessages] = useState<Message[] | null>(null);

// Expose methods
const handleLoad = useCallback(async () => {
  setLoading(true);
  try {
    const loadedState = await loadState(caseId, 'default');
    setState(loadedState);
    // ... restore messages
  } catch (e) {
    setError('Failed to load');
  } finally {
    setLoading(false);
  }
}, [caseId]);

return {
  state,
  location,
  loading,
  error,
  saving,
  handleSave,
  handleLoad,
  // ... more methods
};
```

**For Phase 5.1**: Menu hook will be simpler:
```tsx
function useMainMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = useCallback(async (caseId: string) => {
    setLoading(true);
    try {
      await saveCase(caseId);
    } catch (e) {
      setError('Save failed');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    isOpen,
    setIsOpen,
    loading,
    error,
    handleSave,
    // ... more methods
  };
}
```

---

## API Integration Pattern (ESTABLISHED)

### Client.ts Pattern

**Location**: `frontend/src/api/client.ts`
**Pattern**: Type-safe fetch wrappers with error handling

**Key Features**:
1. **Custom ApiError class** (lines 40-50):
```tsx
class ApiError extends Error implements ApiErrorType {
  status: number;
  details?: string;

  constructor(status: number, message: string, details?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}
```

2. **Error handling helpers** (lines 70-119):
```tsx
async function createApiError(response: Response): Promise<ApiError> {
  let message = `API error: ${response.status} ${response.statusText}`;
  let details: string | undefined;

  try {
    const errorBody = (await response.json()) as ErrorResponseBody;
    if (errorBody.detail) {
      message = errorBody.detail;
    }
    // ... set details
  } catch {
    // Response body is not JSON, use default message
  }

  return new ApiError(response.status, message, details);
}
```

3. **Existing reset function** (lines 597-610):
```tsx
export async function resetCase(
  caseId: string,
  playerId = 'default'
): Promise<ResetResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/case/${encodeURIComponent(caseId)}/reset?player_id=${encodeURIComponent(playerId)}`,
      { method: 'POST' /* ... */ }
    );

    if (!response.ok) {
      throw await createApiError(response);
    }

    return (await response.json()) as ResetResponse;
  } catch (error) {
    if (isApiError(error)) {
      throw error;
    }
    throw handleFetchError(error);
  }
}
```

**For Phase 5.1**: New menu API functions:
```tsx
export async function saveGame(
  caseId: string,
  playerId = 'default'
): Promise<SaveResponse> {
  // Reuse existing saveState() or add wrapper
}

export async function getGameState(
  caseId: string,
  playerId = 'default'
): Promise<LoadResponse | null> {
  // Reuse existing loadState()
}
```

---

## Keyboard Shortcuts Pattern

### Established Patterns from Existing Code

**AurorHandbook.tsx** (lines 163-169):
```tsx
useEffect(() => {
  if (isOpen) {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'h') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }
}, [isOpen, onClose]);
```

**Pattern**: Global keyboard listeners at component level with cleanup

**For Phase 5.1 Menu**:
```tsx
useEffect(() => {
  const handleGlobalKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      // ESC opens/closes menu
      setMenuOpen(prev => !prev);
    }

    if (menuOpen && e.key >= '1' && e.key <= '6') {
      // Number keys for quick menu item selection
      const itemIndex = parseInt(e.key) - 1;
      if (itemIndex < menuItems.length) {
        menuItems[itemIndex].onClick();
      }
    }
  };

  document.addEventListener('keydown', handleGlobalKeydown);
  return () => document.removeEventListener('keydown', handleGlobalKeydown);
}, [menuOpen]);
```

---

## Confirmation Dialog Pattern

### ConfirmDialog.tsx (ESTABLISHED PATTERN)

**Location**: `frontend/src/components/ConfirmDialog.tsx`
**Purpose**: Confirmation modal for destructive operations (e.g., restart case)

**Features**:
- Two-button dialog (Cancel, Confirm)
- Modal wrapper with terminal variant
- Focus management for keyboard navigation
- Destructive mode option

**Usage Pattern from App.tsx**:
```tsx
const [confirmOpen, setConfirmOpen] = useState(false);

<ConfirmDialog
  open={confirmOpen}
  title="Restart Case?"
  message="This will delete all progress. Are you sure?"
  destructive={true}
  onConfirm={async () => {
    await resetCase(CASE_ID);
    setConfirmOpen(false);
    // Reload game state
  }}
  onCancel={() => setConfirmOpen(false)}
/>
```

**For Phase 5.1**: Reuse for restart/save operations

---

## TypeScript Types Structure

### Investigation Types (`frontend/src/types/investigation.ts`)

**Key Interfaces**:
```tsx
interface InvestigationState {
  state_id: string;
  case_id: string;
  current_location: string;
  discovered_evidence: string[];
  visited_locations: string[];
  witness_states: Record<string, WitnessState>;
  verdict_state: VerdictState | null;
  briefing_state: BriefingState | null;
  // ... more fields
}

interface LoadResponse {
  state: InvestigationState;
  location: LocationResponse;
}

interface SaveStateRequest {
  player_id: string;
  state: InvestigationState;
}

interface SaveResponse {
  success: boolean;
  message: string;
}
```

**For Phase 5.1 - New Types**:
```tsx
interface MenuState {
  isOpen: boolean;
  selectedIndex: number; // For keyboard nav
}

interface GameStatus {
  caseId: string;
  location: string;
  progressPercent: number; // Evidence found / total
  timeSeconds: number;
}

interface SaveSlot {
  slotId: string;
  timestamp: number;
  caseId: string;
  location: string;
  progressPercent: number;
}
```

---

## Component Composition Examples

### Modal as Container Pattern (ESTABLISHED)

All existing modals follow: `Modal(isOpen, onClose) → Content`

**Briefing Modal** (in App.tsx, lines 320-328):
```tsx
<BriefingModal
  isOpen={briefingModalOpen}
  onClose={handleBriefingComplete}
  briefing={briefing}
  conversation={briefingConversation}
  selectedChoice={briefingSelectedChoice}
  choiceResponse={briefingChoiceResponse}
  loading={briefingLoading}
  onSelectChoice={selectBriefingChoice}
  onAskQuestion={askBriefingQuestion}
/>
```

**Auror Handbook** (in LocationView, lines 547-548):
```tsx
<AurorHandbook
  isOpen={isHandbookOpen}
  onClose={() => setIsHandbookOpen(false)}
/>
```

**Evidence Modal** (in App.tsx):
```tsx
{selectedEvidence && (
  <EvidenceModal
    evidence={selectedEvidence}
    onClose={() => setSelectedEvidence(null)}
  />
)}
```

**For Phase 5.1 - MainMenu Modal**:
```tsx
<MainMenu
  isOpen={menuOpen}
  onClose={() => setMenuOpen(false)}
  onRestart={() => handleRestart()}
  onSave={() => handleSave()}
  onLoad={() => handleLoad()}
  loading={loading}
  error={error}
/>
```

---

## Styling Conventions (ESTABLISHED)

### Tailwind Theme

**Terminal Dark Theme** (used across all modals):
- Background: `bg-gray-900` (dark)
- Text: `text-gray-100` (light)
- Borders: `border-gray-700` (dark gray)
- Accents: `text-amber-400` (warm yellow)
- Hover: `hover:bg-gray-800`, `hover:text-amber-300`

**Title Styling**:
- Main titles: `text-xl font-bold text-amber-400 font-mono uppercase`
- Terminal titles: `text-green-400 font-mono` (with brackets)

**Button Colors**:
- Primary: `bg-amber-600 hover:bg-amber-700`
- Secondary: `bg-amber-100 hover:bg-amber-200`
- Ghost: `bg-transparent hover:bg-amber-50`

**For Phase 5.1 Menu Items** (follow existing patterns):
```tsx
<div className="space-y-3">
  <button className="w-full px-4 py-3 rounded-lg border-2 border-amber-600 bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-colors">
    SAVE GAME
  </button>
  <button className="w-full px-4 py-3 rounded-lg border-2 border-amber-300 bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold transition-colors">
    LOAD GAME
  </button>
  <button className="w-full px-4 py-3 rounded-lg border-2 border-transparent bg-transparent hover:bg-amber-50 text-amber-700 font-semibold transition-colors">
    SETTINGS
  </button>
</div>
```

---

## Backend State Management

### PlayerState Classes (`backend/src/state/player_state.py`)

**Core Classes**:
```python
class PlayerState(BaseModel):
    """Player investigation state."""
    state_id: str = Field(default_factory=lambda: str(uuid4()))
    case_id: str
    current_location: str = "great_hall"
    discovered_evidence: list[str] = Field(default_factory=list)
    visited_locations: list[str] = Field(default_factory=list)
    witness_states: dict[str, WitnessState] = Field(default_factory=dict)
    verdict_state: VerdictState | None = None
    briefing_state: BriefingState | None = None
    # ... more fields

    def add_evidence(self, evidence_id: str) -> None:
        """Add discovered evidence (deduplicated)."""
        if evidence_id not in self.discovered_evidence:
            self.discovered_evidence.append(evidence_id)
            self.updated_at = _utc_now()

    def visit_location(self, location_id: str) -> None:
        """Track visited location."""
        self.current_location = location_id
        if location_id not in self.visited_locations:
            self.visited_locations.append(location_id)
        self.updated_at = _utc_now()
```

**Helper Methods Pattern**:
- `get_witness_state(witness_id, base_trust)` - Lazy init
- `get_briefing_state()` - Lazy init
- `add_conversation_message()` - Append to history
- `update_at` timestamp for auto-save triggers

**For Phase 5.1**: No new backend classes needed initially (Phase 5.3 adds SaveManager)

---

## Integration Points Summary

### Where Menu Connects

1. **App.tsx - Main orchestrator**
   - Menu state: `const [menuOpen, setMenuOpen] = useState(false)`
   - Menu callback: `const handleMenuClose = useCallback(...)`
   - Menu render: `<MainMenu isOpen={menuOpen} onClose={handleMenuClose} />`

2. **Modal Container** - Reuse existing `Modal.tsx`
   - Pass `isOpen` and `onClose` props
   - Add title: "MAIN MENU"
   - Add variant: "default" (yellow titles)

3. **Button Component** - Reuse existing `Button.tsx`
   - Menu items as buttons
   - Variants: primary (main actions), ghost (secondary)
   - Sizes: `lg` for visibility

4. **API Integration** - Existing functions
   - `resetCase()` from client.ts (restart)
   - `saveState()` and `loadState()` (save/load)
   - `handleSave()` from useInvestigation hook (auto-persist)

5. **Confirmation** - Reuse `ConfirmDialog.tsx`
   - Confirm restart: "This will delete all progress"
   - Confirm overwrite on load: "Replace current game?"

6. **Keyboard Shortcuts** - Establish pattern
   - ESC key opens/closes menu
   - Number keys (1-4) for quick access to menu items
   - Similar to AurorHandbook pattern

---

## Known Gotchas & Warnings

- ⚠️ **ESC key handling**: Modal.tsx already has ESC listener. Menu ESC should open/close (not close). Consider event.stopPropagation() to prevent conflicts.
- ⚠️ **Z-index stacking**: Modal uses `z-50`. Ensure menu menu appears above other modals (may need higher z-index if nested).
- ⚠️ **Focus management**: Use forwardRef on buttons for keyboard navigation (existing pattern in Button.tsx).
- ⚠️ **State preservation**: Menu close should NOT reset game state - use callbacks only.
- ⚠️ **Modal nesting**: Be careful with multiple modals open (menu + confirmation). Test backdrop click behavior.
- ⚠️ **Error handling**: API calls can fail (network, backend errors). Show error toast/message in menu, don't crash.
- ⚠️ **Loading states**: Reset/save/load are async. Show loading spinner, disable buttons during operations.

---

## Success Criteria for Phase 5.1 Implementation

- [ ] MainMenu component created with terminal UI aesthetic
- [ ] Menu accessible via ESC key or menu button
- [ ] Menu items: Restart Case, Save Game, Load Game, Settings (placeholder), Return to Game
- [ ] Keyboard shortcuts work (1-4 for items, ESC to toggle)
- [ ] All buttons functional with proper callbacks
- [ ] Confirmation dialog on restart (destructive operation)
- [ ] Error handling and loading states for API calls
- [ ] All tests passing (frontend + backend)
- [ ] Zero modal nesting conflicts or regressions
- [ ] TypeScript types complete and strict

---

## Files That Need Changes

**New Files** (Phase 5.1):
- `frontend/src/components/MainMenu.tsx` (main menu component)
- `frontend/src/hooks/useMainMenu.ts` (menu state hook)
- `frontend/src/components/__tests__/MainMenu.test.tsx` (tests)

**Modified Files** (Phase 5.1):
- `frontend/src/App.tsx` (integrate menu, remove restart button)
- `frontend/src/api/client.ts` (may add menu helper functions)
- `frontend/src/types/investigation.ts` (may add MenuState types)

**Backend** (Phase 5.1):
- No changes needed (existing reset/save/load endpoints suffice)

---

## Files Analyzed

**Frontend**:
- ✅ `frontend/src/components/ui/Modal.tsx` (modal container pattern)
- ✅ `frontend/src/components/ui/Button.tsx` (button variants)
- ✅ `frontend/src/components/ConfirmDialog.tsx` (confirmation pattern)
- ✅ `frontend/src/App.tsx` (state orchestration, modal integration)
- ✅ `frontend/src/api/client.ts` (API error handling, reset/save/load functions)
- ✅ `frontend/src/hooks/useInvestigation.ts` (hook state management pattern)
- ✅ `frontend/src/types/investigation.ts` (type definitions)

**Backend**:
- ✅ `backend/src/api/routes.py` (API endpoint structure)
- ✅ `backend/src/state/player_state.py` (state classes, methods)

**Total Patterns Extracted**: 25+ reusable patterns with code examples

---

## Confidence Level

**HIGH (9/10)**

Rationale:
- Modal infrastructure fully proven (5+ modals working)
- State management patterns established and tested
- API integration patterns consistent across codebase
- Type safety strict (TypeScript)
- All necessary endpoints already implemented
- No breaking changes required
- Clear examples to follow

**Risk Areas** (Minor):
- ESC key handling needs careful coordination (low risk)
- Modal z-index stacking if too many layers (low risk)
- Error messages display strategy not yet decided (easily addressed)

---

**Analysis Complete** ✓
**Ready for Phase 5.1 Implementation** ✓
