# PRP: Phase 5.1 - Menu System Foundation

## Overview

Phase 5.1 adds in-game menu modal accessible via ESC key, centralizing game controls (New Game, Load Game, Save Game, Settings) and replacing current "Restart Case" button in App.tsx. Menu uses React modal infrastructure with keyboard navigation (1-4 shortcuts) and terminal dark aesthetic.

**End State**: Player presses ESC → menu appears → selects option via click or number key → action executed or submenu opens → ESC closes menu, returns to game.

---

## Why

### User Impact
- **Accessibility**: ESC key universally expected for menu access (industry standard)
- **Organization**: Consolidates scattered controls (restart button, future save/load) into single interface
- **Discoverability**: Visible menu button + ESC hint helps new players find game controls
- **Non-intrusive**: Modal overlay doesn't interrupt game flow, ESC toggles on/off

### Business Value
- **Foundation for Phases 5.2-5.3**: Menu architecture enables save/load system (Phase 5.3), location nav (Phase 5.2)
- **User retention**: Professional menu system signals polished game quality
- **Scalability**: Easy to extend with new options (accessibility settings, keybind remapping, etc.)

### Integration
- **Fits Phase 4.8 complete**: Legilimency system working, no conflicts with spell system
- **Reuses existing patterns**: Modal.tsx, Button.tsx, ConfirmDialog.tsx all proven in Phases 3-4
- **No breaking changes**: Restart functionality moves to menu, other features unchanged

### Alignment
- **PLANNING.md Milestone**: Phase 5.1 complete (1-2 days), enables Phase 5.2 (Location Management) and 5.3 (Save/Load)
- **Game Design**: Respects terminal aesthetic (dark theme, keyboard-first), minimal UI philosophy (no clutter)

---

## What

### User-Visible Behavior

**Menu Access**:
- Press ESC key OR click "MENU" button (top-right corner) → menu modal opens
- Modal overlay (dark backdrop) with centered menu panel
- 4 menu options displayed vertically with keyboard shortcuts (1-4)
- Focus starts at first menu item (keyboard navigation immediate)

**Menu Options** (Phase 5.1):
1. **New Game** → Restart current case (confirmation dialog first) - **FUNCTIONAL**
2. **Load Game** → Disabled button with tooltip "Coming in Phase 5.3" (no click action)
3. **Save Game** → Disabled button with tooltip "Coming in Phase 5.3" (no click action)
4. **Settings** → Disabled button with tooltip "Coming soon" (no click action)

**Keyboard Navigation**:
- ESC: Toggle menu open/close
- 1: Select "New Game" (only functional option in Phase 5.1)
- 2-4: No action (buttons disabled)
- Tab/Shift+Tab: Cycle through options
- Enter: Activate focused option (only works on New Game)
- Arrow Up/Down: Navigate options (focus ring visible)

**Closing**:
- ESC key (closes menu, returns to game)
- Click backdrop outside menu
- Click X button (top-right of modal)
- Select "Return to Game" option (not listed in main 7, implied by closing)

### Technical Requirements

**Frontend** (React + Vite):
- `MainMenu.tsx` component (modal container + menu items)
- `useMainMenu.ts` hook (menu state management)
- Radix UI Dialog for accessibility (ESC handling, focus management)
- Keyboard shortcuts via `useEffect` listener (1-4 keys)
- Menu button in App.tsx header (top-right corner)
- Confirmation dialog for destructive operations (restart)

**Backend** (Python FastAPI):
- Reuse existing endpoints:
  - `POST /api/case/{case_id}/reset` (restart)
  - Placeholders for Phase 5.3: save/load endpoints (not implemented yet)
- No new backend code required for Phase 5.1

**State Management**:
- Local React state: `menuOpen` boolean in App.tsx
- No persistent state needed (menu is transient UI)
- Existing `resetCase()` API client function

**Styling**:
- Terminal dark theme: `bg-gray-900`, `text-amber-400`, `border-gray-700`
- Focus ring: `focus-visible:ring-2 focus-visible:ring-amber-400`
- Button variants: primary (amber-600), ghost (transparent hover)
- Disabled buttons: `opacity-50`, `cursor-not-allowed`, with tooltip on hover
- Modal z-index: 50 (above game UI, below confirmation dialogs)

### Success Criteria

- [ ] ESC key opens menu (global listener)
- [ ] ESC key closes menu (Radix Dialog + manual listener)
- [ ] Number key 1 selects "New Game" (keys 2-4 do nothing - buttons disabled)
- [ ] Tab navigation cycles through options with visible focus ring
- [ ] "New Game" shows confirmation dialog before restart
- [ ] Restart works (calls resetCase API, reloads game state)
- [ ] Disabled buttons with tooltips for Load/Save/Settings (no alerts/popups)
- [ ] Menu button visible in App.tsx header (top-right)
- [ ] Modal backdrop click closes menu
- [ ] X button closes menu
- [ ] All tests pass (frontend + backend, zero regressions)
- [ ] Lint/type check passes (ruff, mypy, TypeScript)
- [ ] No focus trapping bugs (focus returns to game after close)
- [ ] No modal z-index conflicts with other modals (briefing, evidence, etc.)

---

## Context & References

### Project Documentation

**From PLANNING.md**:
- Architecture: Python FastAPI backend, React + Vite frontend, terminal UI aesthetic
- Phase 5.1 goal: "In-game menu modal with restart, save, load functionality" (1-2 days)
- Current version: 0.8.0 (Phase 4.8 complete - Legilimency system)
- Tech stack: Bun (frontend), uv (Python backend), Tailwind CSS, React Context state
- No phase system: Free investigation → verdict submission (Obra Dinn model)

**From game design** (AUROR_ACADEMY_GAME_DESIGN.md):
- Design pillar: "Respect player intelligence - No highlighted clues, no correct path markers"
- Terminal aesthetic philosophy: Minimal UI, dark theme, keyboard-first
- Menu should be non-intrusive, discoverable but not forced
- No complex menus or nested options (KISS principle)

**From STATUS.md**:
- Current state: Phase 4.8 complete (640 backend tests, 440+ frontend tests passing)
- Research complete: GitHub (Textual, Rich, Prompt Toolkit), Codebase (25+ patterns), Docs (Radix, React, Tailwind)
- Next milestone: Phase 5.1 → Phase 5.2 (location management) → Phase 5.3 (save/load system)
- No blockers: All dependencies installed, backend/frontend working

### Research Sources

**From GITHUB-RESEARCH-PHASE5.1.md (validated)**:
- ✅ Textual framework (20k stars): Modal stacking, keyboard shortcuts (BINDINGS), focus management
- ✅ Rich library (15k stars): Table display for settings, scrollable content paging
- ✅ Prompt Toolkit (9k stars): Low-level keyboard handling (arrow keys, custom sequences)
- **Recommendation**: Use React (not Textual) since frontend already React-based
- **Pattern adapted**: Keyboard shortcut system (BINDINGS concept → React useEffect listener)
- **Pattern adapted**: Modal focus management (Textual screen stacking → React state + Radix Dialog)

**Alignment notes**:
- ⚠️ Research suggested Textual (Python TUI framework) - NOT applicable (frontend is React, not Python terminal)
- ✅ Patterns still useful: Modal stacking concept, keyboard shortcut declaration, focus management
- ✅ Rich table display pattern applicable for Settings submenu (future)
- ✅ Scrollable content pattern applicable for Manual/Credits (Rich paging → React scroll divs)

**From CODEBASE-RESEARCH-phase5.1.md (validated)**:
- ✅ Modal.tsx: Reusable modal with ESC/backdrop/X close (lines 20-119)
- ✅ Button.tsx: 3 variants (primary, secondary, ghost), forwardRef for focus (lines 156-197)
- ✅ ConfirmDialog.tsx: Confirmation pattern for destructive operations (lines 461-488)
- ✅ App.tsx orchestration: Multiple hooks, local state for UI, callback pattern (lines 44-132)
- ✅ useInvestigation.ts: Hook state management pattern (lines 258-291)
- ✅ resetCase() API: Existing endpoint (lines 597-610 in client.ts)
- **Integration points**: App.tsx (menu state), Modal.tsx (reuse), Button.tsx (menu items)

**Alignment notes**:
- ✅ All patterns established and tested in Phases 3-4
- ✅ No conflicts with existing modals (briefing, evidence, handbook)
- ⚠️ ESC key coordination needed (Modal.tsx already has ESC listener, menu adds global listener)
- ✅ Backend reset endpoint already implemented, tested (Phase 3.1)

**From DOCS-RESEARCH-PHASE5.1.md (validated)**:
- ✅ Radix Dialog: Focus management, ESC handling, keyboard navigation (pattern 1)
- ✅ React useEffect: Keyboard listener with cleanup pattern (pattern 2)
- ✅ Tailwind dark mode: `dark:bg-gray-900`, `focus-visible:ring-amber-400` (pattern 3)
- **Key API**: `Dialog.Root`, `Dialog.Content onEscapeKeyDown`, `onOpenAutoFocus`
- **Gotcha**: Must use `Dialog.Portal` for z-index (documented line 33)
- **Gotcha**: `focus-visible` (keyboard only), NOT `focus` (mouse + keyboard)

**Alignment notes**:
- ✅ Radix Dialog is React library (perfect fit for frontend)
- ✅ All patterns from official documentation (React 18, Tailwind CSS V3, Radix UI)
- ✅ Terminal aesthetic matches existing game UI (amber-400 + gray-900)
- ✅ Focus ring patterns align with accessibility requirements

---

## Quick Reference (Pre-Digested Context)

### Essential API Signatures

**Radix Dialog** (from DOCS-RESEARCH-PHASE5.1.md):
```jsx
import * as Dialog from '@radix-ui/react-dialog';

<Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
  <Dialog.Trigger asChild>
    <button>Menu</button>
  </Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 bg-black/50" />
    <Dialog.Content
      onEscapeKeyDown={() => setIsOpen(false)}
      onOpenAutoFocus={(e) => { firstButtonRef.current?.focus(); e.preventDefault(); }}
    >
      <Dialog.Title>MENU</Dialog.Title>
      {/* Menu items */}
      <Dialog.Close asChild>
        <button>✕</button>
      </Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

**React Keyboard Listener** (from DOCS-RESEARCH-PHASE5.1.md + existing code):
```jsx
import { useEffect } from 'react';

// Global ESC key handler (opens/closes menu)
useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setMenuOpen(prev => !prev);
    }

    // Number keys for quick selection (1-4)
    if (menuOpen && e.key >= '1' && e.key <= '4') {
      const index = parseInt(e.key) - 1;
      if (index < menuOptions.length) {
        menuOptions[index].onClick();
      }
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown); // CRITICAL cleanup
}, [menuOpen]);
```

**Reset API Call** (from client.ts - existing):
```tsx
import { resetCase } from '../api/client';

async function handleRestart() {
  try {
    await resetCase('case_001', 'default');
    // Reload game state
    window.location.reload(); // Simple approach for Phase 5.1
  } catch (error) {
    console.error('Restart failed:', error);
    setError('Failed to restart case');
  }
}
```

### Key Patterns from Research

**Modal Container Pattern** (from Modal.tsx - CODEBASE-RESEARCH):
```tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  variant?: 'default' | 'terminal';
}

export function Modal({ isOpen, onClose, children, title, variant = 'default' }: ModalProps) {
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
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-gray-900 border-2 border-gray-700 rounded-lg max-w-4xl w-full">
        {title && <h2 className="text-xl font-bold text-amber-400">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
```

**Button with Focus Ring** (from DOCS-RESEARCH + Button.tsx):
```tsx
// Enabled button
<button
  className="w-full px-4 py-3 rounded-lg
             bg-amber-600 hover:bg-amber-700 text-white
             focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none
             transition-colors duration-200"
  onClick={handleAction}
>
  1. NEW GAME
</button>

// Disabled button with tooltip
<button
  className="w-full px-4 py-3 rounded-lg
             bg-gray-800 text-gray-400
             opacity-50 cursor-not-allowed
             focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:outline-none
             transition-colors duration-200"
  disabled
  title="Coming in Phase 5.3"
>
  2. LOAD GAME
</button>
```

**Disabled Button Pattern** (Phase 5.1 placeholders):
```tsx
// Option 1: Using Button component (recommended)
import { Button } from './ui/Button';

<Button
  variant="ghost"
  size="lg"
  className="w-full opacity-50"
  disabled
  title="Coming in Phase 5.3"
>
  2. LOAD GAME
</Button>

// Option 2: Raw button element
<button
  className="w-full px-4 py-3 rounded-lg
             bg-gray-800 text-gray-400
             opacity-50 cursor-not-allowed
             disabled:opacity-50"
  disabled
  title="Coming in Phase 5.3"
>
  2. LOAD GAME
</button>
```

**Confirmation Dialog Pattern** (from ConfirmDialog.tsx - existing):
```tsx
import { ConfirmDialog } from './components/ConfirmDialog';

const [confirmOpen, setConfirmOpen] = useState(false);

<ConfirmDialog
  open={confirmOpen}
  title="Restart Case?"
  message="This will delete all progress. Are you sure?"
  destructive={true}
  onConfirm={async () => {
    await resetCase('case_001');
    setConfirmOpen(false);
    window.location.reload();
  }}
  onCancel={() => setConfirmOpen(false)}
/>
```

### Integration Patterns (Actual Codebase)

**App.tsx Orchestration** (follow existing pattern - lines 117-132):
```tsx
// Add menu state to App.tsx
const [menuOpen, setMenuOpen] = useState(false);
const [confirmRestartOpen, setConfirmRestartOpen] = useState(false);

// Menu toggle callback
const handleMenuToggle = useCallback(() => {
  setMenuOpen(prev => !prev);
}, []);

// Restart callback (with confirmation)
const handleRestartCase = useCallback(() => {
  setConfirmRestartOpen(true);
  setMenuOpen(false); // Close menu before showing confirmation
}, []);

// Confirm restart callback
const handleConfirmRestart = useCallback(async () => {
  try {
    await resetCase(CASE_ID, 'default');
    setConfirmRestartOpen(false);
    window.location.reload(); // Simple reload for Phase 5.1
  } catch (error) {
    console.error('Restart failed:', error);
  }
}, []);

// In JSX
<MainMenu
  isOpen={menuOpen}
  onClose={() => setMenuOpen(false)}
  onRestart={handleRestartCase}
/>

<ConfirmDialog
  open={confirmRestartOpen}
  title="Restart Case?"
  message="This will delete all progress. Are you sure?"
  destructive={true}
  onConfirm={handleConfirmRestart}
  onCancel={() => setConfirmRestartOpen(false)}
/>
```

### Library-Specific Gotchas

**Radix Dialog** (from DOCS-RESEARCH):
- ⚠️ Must use `Dialog.Portal` to render outside DOM hierarchy (z-index issues otherwise)
- ⚠️ `onOpenAutoFocus` requires `event.preventDefault()` to override default focus behavior
- ⚠️ ESC handling: `onEscapeKeyDown` only fires inside Dialog.Content (use separate global listener for toggle)

**React useEffect** (from DOCS-RESEARCH):
- ⚠️ Always cleanup event listeners in return statement (memory leak prevention)
- ⚠️ Include `isOpen` in dependency array (stale closure otherwise)
- ⚠️ Check `isOpen` condition before processing keys (performance optimization)

**Tailwind Focus** (from DOCS-RESEARCH):
- ⚠️ Use `focus-visible` NOT `focus` (keyboard-only ring, not mouse)
- ⚠️ Color contrast: `text-amber-400` on `bg-gray-900` is WCAG compliant (checked)
- ⚠️ Dark mode: Must configure `darkMode: 'class'` in tailwind.config.js

**Existing Codebase** (from CODEBASE-RESEARCH):
- ⚠️ ESC key conflict: Modal.tsx already has ESC listener for closing modals
  - **Solution**: Menu ESC listener should toggle (open/close), not just close
  - **Solution**: Use `event.stopPropagation()` to prevent double-trigger
- ⚠️ Z-index stacking: Modal uses `z-50`, ConfirmDialog may need `z-60` if shown over menu
- ⚠️ Focus management: Use `forwardRef` on buttons for keyboard navigation (Button.tsx already does this)
- ⚠️ Disabled buttons: Must have `disabled` attribute AND visual styling (opacity-50, cursor-not-allowed)
  - **Solution**: Use both HTML disabled attribute and Tailwind classes for proper UX
  - **Solution**: Add `title` attribute for tooltip on hover

### Decision Tree

```
User presses ESC:
  1. Is any modal open?
     ├─ YES → Check which modal
     │    ├─ Menu open → Close menu (set menuOpen = false)
     │    └─ Other modal (briefing, evidence) → Close that modal (existing Modal.tsx behavior)
     └─ NO → Open menu (set menuOpen = true)

User clicks menu item:
  1. Item type?
     ├─ New Game (enabled) → Show confirmation dialog → Execute action → Close menu
     ├─ Load/Save/Settings (disabled) → No action, tooltip visible on hover
     └─ Note: Only New Game is functional in Phase 5.1

User presses number key (1-4):
  1. Is menu open?
     └─ YES → Only "1" key works (triggers New Game)
              Keys 2-4 do nothing (buttons disabled)

User clicks backdrop or X:
  1. Close menu (set menuOpen = false)
  2. Return focus to game input
```

### Configuration Requirements

**New Dependencies** (install with bun):
```bash
cd frontend
bun add @radix-ui/react-dialog
```

**No Backend Changes**: All endpoints already exist (resetCase)

**No New Environment Variables**: Reuse existing config

---

## Current Codebase Structure

```bash
# Existing structure (Phase 4.8 complete)
frontend/src/
├── components/
│   ├── ui/
│   │   ├── Modal.tsx           # REUSE - Base modal container
│   │   ├── Button.tsx          # REUSE - Button variants
│   │   └── Card.tsx            # OPTIONAL - Card for menu items
│   ├── ConfirmDialog.tsx       # REUSE - Confirmation pattern
│   ├── BriefingModal.tsx       # REFERENCE - Modal pattern example
│   ├── AurorHandbook.tsx       # REFERENCE - Keyboard shortcut pattern (Cmd+H)
│   └── App.tsx                 # MODIFY - Add menu state + button
├── hooks/
│   └── useInvestigation.ts     # REFERENCE - Hook pattern for menu hook
├── api/
│   └── client.ts               # REUSE - resetCase() function
└── types/
    └── investigation.ts        # EXTEND - Add menu types (optional)

backend/src/
├── api/
│   └── routes.py               # NO CHANGES - Endpoints already exist
```

## Desired Codebase Structure

```bash
frontend/src/
├── components/
│   ├── MainMenu.tsx            # CREATE - Main menu modal component
│   ├── __tests__/
│   │   └── MainMenu.test.tsx   # CREATE - Menu tests
└── hooks/
    └── useMainMenu.ts          # CREATE - Menu state hook
```

**Note**: validation-gates will handle test file creation. Don't include tests in implementation tasks.

---

## Files to Create/Modify

| File | Action | Purpose | Reference File |
|------|--------|---------|----------------|
| `frontend/src/components/MainMenu.tsx` | CREATE | Main menu modal UI | `BriefingModal.tsx` (modal pattern), `AurorHandbook.tsx` (keyboard shortcuts) |
| `frontend/src/hooks/useMainMenu.ts` | CREATE | Menu state management | `useInvestigation.ts` (hook pattern) |
| `frontend/src/App.tsx` | MODIFY | Add menu state, button, keyboard listener | Existing patterns (lines 117-132) |
| `frontend/src/api/client.ts` | OPTIONAL | Helper functions (saveGame, loadGame placeholders) | Existing patterns (lines 597-610) |

**Note**: Test files handled by validation-gates. Don't list in implementation tasks.

---

## Tasks (Ordered)

### Task 1: Install Radix Dialog Dependency
**Action**: Install @radix-ui/react-dialog package
**Command**: `cd frontend && bun add @radix-ui/react-dialog`
**Purpose**: Accessibility-focused dialog component for menu modal
**Reference**: DOCS-RESEARCH-PHASE5.1.md (Pattern 1)
**Depends on**: None
**Acceptance criteria**:
- [ ] Package appears in frontend/package.json
- [ ] `bun install` runs without errors
- [ ] No version conflicts with existing dependencies

### Task 2: Create useMainMenu Hook
**File**: `frontend/src/hooks/useMainMenu.ts`
**Action**: CREATE
**Purpose**: Manage menu state (isOpen, loading, error)
**Reference**: `useInvestigation.ts` (hook pattern - lines 258-291)
**Pattern**: Local state + callbacks, no API calls in Phase 5.1
**Depends on**: Task 1 (Radix installed)
**Acceptance criteria**:
- [ ] Hook exports: `isOpen`, `setIsOpen`, `handleToggle`, `loading`, `error`
- [ ] TypeScript types strict (no `any`)
- [ ] No API calls (placeholders only)
- [ ] Follows existing hook pattern (useState + useCallback)

**Implementation Guidance**:
```tsx
import { useState, useCallback } from 'react';

export function useMainMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    setIsOpen,
    handleToggle,
    handleClose,
    loading,
    error,
  };
}
```

### Task 3: Create MainMenu Component
**File**: `frontend/src/components/MainMenu.tsx`
**Action**: CREATE
**Purpose**: Main menu modal UI with 4 options (1 functional, 3 disabled) + keyboard navigation
**Reference**: `BriefingModal.tsx` (modal structure), `AurorHandbook.tsx` (keyboard shortcuts)
**Pattern**: Radix Dialog + Button.tsx components
**Depends on**: Task 2 (useMainMenu hook)
**Acceptance criteria**:
- [ ] Modal uses Radix Dialog (Dialog.Root, Dialog.Portal, Dialog.Content)
- [ ] 4 menu options displayed (New Game functional, Load/Save/Settings disabled)
- [ ] Keyboard shortcut "1" triggers New Game (keys 2-4 do nothing)
- [ ] Disabled buttons have tooltips (title attribute)
- [ ] ESC closes menu (Radix onEscapeKeyDown)
- [ ] Focus ring visible on keyboard navigation
- [ ] Terminal dark theme (bg-gray-900, text-amber-400)
- [ ] Backdrop click closes menu
- [ ] X button closes menu
- [ ] TypeScript props interface defined
- [ ] No alert() popups used

**Implementation Guidance**:
```tsx
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from './ui/Button';
import { useEffect, useRef } from 'react';

interface MainMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onRestart: () => void;
  loading?: boolean;
}

export function MainMenu({ isOpen, onClose, onRestart, loading = false }: MainMenuProps) {
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  // Number key shortcuts (1-4) - only for enabled items
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1') {
        onRestart(); // Only New Game is functional in Phase 5.1
      }
      // Keys 2-4 do nothing (buttons are disabled)
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onRestart]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                     bg-gray-900 border-2 border-gray-700 rounded-lg
                     w-full max-w-md p-6 shadow-xl"
          onEscapeKeyDown={onClose}
          onOpenAutoFocus={(e) => {
            firstButtonRef.current?.focus();
            e.preventDefault();
          }}
        >
          <Dialog.Title className="text-2xl font-bold text-amber-400 font-mono mb-6">
            MAIN MENU
          </Dialog.Title>

          <div className="space-y-3">
            <Button
              ref={firstButtonRef}
              variant="primary"
              size="lg"
              onClick={onRestart}
              disabled={loading}
              className="w-full"
            >
              1. NEW GAME
            </Button>

            <Button
              variant="ghost"
              size="lg"
              className="w-full"
              disabled
              title="Coming in Phase 5.3"
            >
              2. LOAD GAME
            </Button>

            <Button
              variant="ghost"
              size="lg"
              className="w-full"
              disabled
              title="Coming in Phase 5.3"
            >
              3. SAVE GAME
            </Button>

            <Button
              variant="ghost"
              size="lg"
              className="w-full"
              disabled
              title="Coming soon"
            >
              4. SETTINGS
            </Button>
          </div>

          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-white
                         focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none
                         rounded p-1"
              aria-label="Close menu"
            >
              ✕
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

### Task 4: Integrate Menu into App.tsx
**File**: `frontend/src/App.tsx`
**Action**: MODIFY
**Purpose**: Add menu state, button, keyboard listener, confirmation dialog
**Reference**: Existing patterns (lines 117-132)
**Pattern**: useState + useCallback for menu state
**Depends on**: Task 3 (MainMenu component)
**Acceptance criteria**:
- [ ] Menu state added: `const [menuOpen, setMenuOpen] = useState(false)`
- [ ] Confirmation state added: `const [confirmRestartOpen, setConfirmRestartOpen] = useState(false)`
- [ ] Menu button visible in header (top-right corner)
- [ ] ESC key opens menu (global listener)
- [ ] "Restart Case" button removed (functionality moved to menu)
- [ ] ConfirmDialog integrated for restart action
- [ ] TypeScript compiles without errors

**Implementation Guidance** (Add to App.tsx):
```tsx
import { MainMenu } from './components/MainMenu';
import { ConfirmDialog } from './components/ConfirmDialog';

// Add state (line ~130)
const [menuOpen, setMenuOpen] = useState(false);
const [confirmRestartOpen, setConfirmRestartOpen] = useState(false);

// Add global ESC listener (line ~140)
useEffect(() => {
  const handleGlobalKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && !briefingModalOpen && !confirmRestartOpen) {
      // Only toggle menu if no other modals open
      setMenuOpen(prev => !prev);
    }
  };
  document.addEventListener('keydown', handleGlobalKeydown);
  return () => document.removeEventListener('keydown', handleGlobalKeydown);
}, [briefingModalOpen, confirmRestartOpen]);

// Add restart callback (line ~150)
const handleRestartCase = useCallback(() => {
  setConfirmRestartOpen(true);
  setMenuOpen(false);
}, []);

const handleConfirmRestart = useCallback(async () => {
  try {
    await resetCase(CASE_ID, 'default');
    setConfirmRestartOpen(false);
    window.location.reload();
  } catch (error) {
    console.error('Restart failed:', error);
  }
}, []);

// In JSX (line ~400+), remove old restart button, add menu button + modals:
<div className="absolute top-4 right-4">
  <Button onClick={() => setMenuOpen(true)}>
    MENU
  </Button>
</div>

<MainMenu
  isOpen={menuOpen}
  onClose={() => setMenuOpen(false)}
  onRestart={handleRestartCase}
/>

<ConfirmDialog
  open={confirmRestartOpen}
  title="Restart Case?"
  message="This will delete all progress and start from the beginning. Are you sure?"
  destructive={true}
  onConfirm={handleConfirmRestart}
  onCancel={() => setConfirmRestartOpen(false)}
/>
```

### Task 5: Update Button.tsx for forwardRef (Optional Check)
**File**: `frontend/src/components/ui/Button.tsx`
**Action**: VERIFY (no changes likely needed)
**Purpose**: Ensure Button component supports ref forwarding for focus management
**Reference**: Existing Button.tsx (lines 168-197)
**Pattern**: forwardRef already implemented (confirmed in CODEBASE-RESEARCH)
**Depends on**: None (verification only)
**Acceptance criteria**:
- [ ] Button component uses `forwardRef<HTMLButtonElement, ButtonProps>`
- [ ] `ref` prop passed to underlying `<button>` element
- [ ] TypeScript types correct for ref

**Implementation Guidance**: CODEBASE-RESEARCH confirms Button.tsx already has forwardRef (lines 168-197). No changes needed. Just verify during testing.

### Task 6: Manual Testing & UX Validation
**Action**: Test menu interactions manually
**Purpose**: Ensure keyboard navigation, focus management, and UX smooth
**Reference**: Success criteria section
**Depends on**: Tasks 1-4 complete
**Acceptance criteria**:
- [ ] ESC opens menu from game
- [ ] ESC closes menu (returns to game)
- [ ] Number key 1 selects "New Game" (2-4 keys disabled)
- [ ] Tab cycles through menu items with visible focus ring
- [ ] Enter activates focused item
- [ ] Arrow keys navigate (if supported by browser focus)
- [ ] Backdrop click closes menu
- [ ] X button closes menu
- [ ] "New Game" shows confirmation dialog
- [ ] Confirmation dialog "Yes" restarts game
- [ ] Confirmation dialog "Cancel" returns to menu
- [ ] Disabled buttons with tooltips for Load/Save/Settings (no alerts)
- [ ] No focus trapping (focus returns to game input after close)
- [ ] No visual regressions (terminal aesthetic maintained)
- [ ] No modal z-index conflicts (menu appears above game, below confirmation)

---

## Integration Points

### Frontend - App.tsx Orchestration
**Where**: `frontend/src/App.tsx` (lines 117-132, 400+)
**What**: Add menu state, button, keyboard listener
**Pattern**: Follow existing modal integration (briefing, evidence, handbook)
**Code**:
```tsx
const [menuOpen, setMenuOpen] = useState(false);
const [confirmRestartOpen, setConfirmRestartOpen] = useState(false);

<Button onClick={() => setMenuOpen(true)}>MENU</Button>

<MainMenu
  isOpen={menuOpen}
  onClose={() => setMenuOpen(false)}
  onRestart={() => { setConfirmRestartOpen(true); setMenuOpen(false); }}
/>
```

### Frontend - Modal Container
**Where**: `frontend/src/components/MainMenu.tsx`
**What**: Use Radix Dialog for accessibility
**Pattern**: Dialog.Root + Portal + Content (DOCS-RESEARCH pattern 1)
**Code**: See Task 3 implementation guidance

### Frontend - Button Component
**Where**: `frontend/src/components/ui/Button.tsx`
**What**: Reuse existing Button with forwardRef
**Pattern**: Already implemented (CODEBASE-RESEARCH lines 168-197)
**Code**: No changes needed (just use in MainMenu.tsx)

### Frontend - Confirmation Dialog
**Where**: `frontend/src/components/ConfirmDialog.tsx`
**What**: Reuse for destructive restart action
**Pattern**: Already implemented (CODEBASE-RESEARCH lines 461-488)
**Code**: See Task 4 implementation guidance

### Backend - Reset Endpoint
**Where**: `backend/src/api/routes.py` (existing endpoint)
**What**: Reuse existing `POST /api/case/{case_id}/reset`
**Pattern**: Already implemented (client.ts lines 597-610)
**Code**: No backend changes needed

### Frontend - Keyboard Shortcuts
**Where**: `frontend/src/components/MainMenu.tsx` (useEffect hook)
**What**: Number keys (1-7) for quick menu selection
**Pattern**: Similar to AurorHandbook.tsx (Cmd+H shortcut - lines 163-169)
**Code**: See Task 3 implementation guidance

---

## Known Gotchas

### ESC Key Conflict (HIGH PRIORITY)
**Issue**: Modal.tsx already has ESC listener to close modals. Menu ESC should toggle (open/close), not just close.
**Solution**:
- App.tsx global listener checks if other modals open before toggling menu
- Use `event.stopPropagation()` if needed to prevent double-trigger
- Test with briefing modal open (ESC should close briefing, not open menu)

**Code**:
```tsx
useEffect(() => {
  const handleGlobalKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && !briefingModalOpen && !confirmRestartOpen) {
      setMenuOpen(prev => !prev);
    }
  };
  document.addEventListener('keydown', handleGlobalKeydown);
  return () => document.removeEventListener('keydown', handleGlobalKeydown);
}, [briefingModalOpen, confirmRestartOpen]);
```

### Focus Management (MEDIUM PRIORITY)
**Issue**: When menu closes, focus should return to game input (not lost in void).
**Solution**:
- Use `onOpenAutoFocus` to focus first menu item when opening
- Test Tab navigation cycles through menu items correctly
- Test focus returns to game after close (may need manual `inputRef.current?.focus()`)

**Code**: See Task 3 implementation (onOpenAutoFocus pattern)

### Z-Index Stacking (LOW PRIORITY)
**Issue**: Modal uses `z-50`, ConfirmDialog may need higher z-index if shown over menu.
**Solution**:
- Menu modal: `z-50` (same as other modals)
- ConfirmDialog: `z-60` (higher than menu)
- Test: Open menu → click "New Game" → confirmation appears above menu

**Code**: Add `z-60` to ConfirmDialog wrapper if needed

### Number Key Shortcuts (LOW PRIORITY)
**Issue**: Number key "1" triggers New Game when menu open, might interfere with typing in game input.
**Solution**:
- Only listen for "1" key when `isOpen === true`
- Keys 2-4 do nothing (buttons disabled, no listeners needed)
- Cleanup listener when menu closes (useEffect cleanup)
- Test: Type "1" in game input → should type "1", not trigger menu item

**Code**: See Task 3 implementation (useEffect with `isOpen` dependency)

### Radix Dialog Portal (LOW PRIORITY)
**Issue**: Radix Dialog requires `Dialog.Portal` to render outside DOM hierarchy (z-index issues).
**Solution**:
- Always wrap `Dialog.Overlay` and `Dialog.Content` in `Dialog.Portal`
- Test: Menu appears above game UI, not hidden behind

**Code**: See Task 3 implementation (Dialog.Portal wrapper)

---

## Validation

### Syntax & Style (Pre-commit)
```bash
cd frontend
bun run lint          # ESLint check
bun run type-check    # TypeScript check
bun run format        # Prettier format
# Expected: No errors
```

### Unit Tests (validation-gates handles)
**Note**: validation-gates agent will create comprehensive tests. Developers focus on implementation only.

**Expected tests** (validation-gates will create):
- MainMenu component: renders 7 options, keyboard shortcuts work, ESC closes
- useMainMenu hook: state management, toggle function
- App.tsx integration: menu button visible, ESC opens menu
- ConfirmDialog: restart confirmation flow

### Manual Verification (Developer checks)
```bash
cd frontend
bun run dev
# Open http://localhost:5173

# Test checklist:
1. Press ESC → Menu opens
2. Press ESC again → Menu closes
3. Press 1 key → "New Game" confirmation appears
4. Click "Yes" → Case restarts
5. Press 2-4 keys → Nothing happens (buttons disabled)
6. Hover over Load/Save/Settings → Tooltip shows "Coming in Phase 5.3" or "Coming soon"
7. Click disabled buttons (Load/Save/Settings) → Nothing happens, no alerts
8. Visual check: Disabled buttons have reduced opacity (50%), gray text
9. Click backdrop → Menu closes
10. Click X button → Menu closes
11. Tab key → Focus cycles through menu items with visible ring
12. Arrow keys → Focus moves (if browser supports)
13. Click "MENU" button → Menu opens
```

---

## Dependencies

**New packages** (install with bun):
```bash
cd frontend
bun add @radix-ui/react-dialog
```

**Existing packages** (no changes):
- react ^18.2.0
- tailwindcss ^3.3.0
- All other dependencies from package.json

**Configuration**:
- No new env vars needed
- Reuse existing `API_BASE_URL` from client.ts

---

## Out of Scope (Phase 5.1)

- **Save/Load functionality**: Disabled buttons with tooltips (Phase 5.3 implements)
- **Settings submenu**: Disabled button with tooltip (future phase)
- **Multiple save slots**: Phase 5.3 feature (not Phase 5.1)
- **Autosave triggers**: Phase 5.3 feature (not Phase 5.1)
- **Location navigation from menu**: Phase 5.2 feature (not Phase 5.1)
- **Credits/Manual/Tutorial screens**: Not included in Phase 5.1 (removed from scope)

---

## Agent Orchestration Plan

### Execution Strategy

**Sequential Track** (dependencies):
1. `react-vite-specialist` → Frontend implementation (Tasks 1-6)
2. `validation-gates` → Run all tests, create missing tests
3. `documentation-manager` → Update README, CHANGELOG

**Why Sequential**: Frontend changes only, no backend work needed. Tests run after implementation complete.

### Agent-Specific Guidance

#### For react-vite-specialist
- **Input**: Tasks 1-6 (frontend implementation)
- **Context**: Quick Reference section above (no doc reading needed)
- **Pattern**: Follow BriefingModal.tsx (modal structure), AurorHandbook.tsx (keyboard shortcuts)
- **Integration**: Add menu to App.tsx (lines 117-132 for state, 400+ for JSX)
- **Output**: Menu modal working, keyboard shortcuts functional, restart working

**Key Files to Reference**:
- `frontend/src/components/BriefingModal.tsx` (modal structure pattern)
- `frontend/src/components/ui/Modal.tsx` (base modal if NOT using Radix)
- `frontend/src/components/ui/Button.tsx` (button variants with forwardRef)
- `frontend/src/components/ConfirmDialog.tsx` (confirmation pattern)
- `frontend/src/App.tsx` (integration pattern - lines 117-132)
- `frontend/src/hooks/useInvestigation.ts` (hook pattern)

**Critical Patterns**:
- Radix Dialog for accessibility (DOCS-RESEARCH pattern 1)
- useEffect keyboard listener with cleanup (DOCS-RESEARCH pattern 2)
- forwardRef on buttons for focus management (CODEBASE-RESEARCH)
- Confirmation dialog for destructive actions (CODEBASE-RESEARCH)

**ESC Key Handling** (CRITICAL):
- App.tsx global listener checks if other modals open before toggling menu
- Don't interfere with existing Modal.tsx ESC listener (briefing, evidence, handbook)
- Test: Open briefing → ESC closes briefing (not opens menu)

#### For validation-gates
- **Input**: All code complete
- **Runs**: Tests, lint, type check, build
- **Output**: Pass/fail report
- **Note**: validation-gates creates tests if needed (MainMenu.test.tsx)

**Expected test coverage**:
- MainMenu component: 4 options render, keyboard shortcut "1" works, keys 2-4 ignored, ESC closes
- Disabled buttons: Load/Save/Settings have `disabled` attribute, `title` attribute for tooltips, correct styling
- Button click behavior: Only New Game button fires onClick handler, disabled buttons don't
- useMainMenu hook: state management, toggle function
- App.tsx integration: menu button visible, ESC opens/closes, restart flow
- No regressions: existing tests still pass (briefing, evidence, etc.)

#### For documentation-manager
- **Input**: Code complete, validation passed
- **Files changed**:
  - `frontend/src/components/MainMenu.tsx` (new)
  - `frontend/src/hooks/useMainMenu.ts` (new)
  - `frontend/src/App.tsx` (modified - menu state + button)
  - `frontend/package.json` (new dependency: @radix-ui/react-dialog)
- **Output**: Updated README (Phase 5.1 features), CHANGELOG (v0.9.0), STATUS.md

**Documentation updates**:
- README.md: Add "Menu System" section (ESC key, 4 options, keyboard shortcuts)
- CHANGELOG.md: Version 0.9.0 entry (Phase 5.1 complete)
- STATUS.md: Mark Phase 5.1 complete, update current version
- PLANNING.md: Mark Phase 5.1 complete (if needed)

### Handoff Context

**Next agent receives**:
- This PRP (full context)
- Quick Reference (no doc reading needed)
- Specific task numbers (1-6 for react-vite-specialist)
- Actual file paths to modify (`App.tsx`, `MainMenu.tsx`, etc.)
- Pattern files to follow (`BriefingModal.tsx`, `Button.tsx`, etc.)

**Next agent does NOT need**:
- ❌ Read research files (GITHUB, CODEBASE, DOCS)
- ❌ Search for examples (patterns provided in Quick Reference)
- ❌ Read 5-10 docs (Quick Reference has everything)
- ❌ Explore codebase (integration points provided)

---

## Anti-Patterns to Avoid

**From project experience**:
- ❌ Creating new modal infrastructure (use existing Modal.tsx OR Radix Dialog, not both)
- ❌ Duplicating keyboard listeners (one global listener in App.tsx, not per component)
- ❌ Missing cleanup in useEffect (memory leaks + double-trigger bugs)
- ❌ Using `focus:` instead of `focus-visible` (mouse + keyboard ring annoying)
- ❌ Forgetting `Dialog.Portal` wrapper (z-index issues with Radix)
- ❌ Not checking `isOpen` before processing keys (performance waste)
- ❌ Missing confirmation dialog for destructive actions (bad UX)
- ❌ Using alert() popups for placeholders (breaks terminal aesthetic, jarring UX - use disabled buttons instead)

---

## Unresolved Questions

None - all decisions finalized:

1. ✅ **Radix Dialog**: Use Radix (better accessibility than Modal.tsx)
2. ✅ **Menu button placement**: Top-right corner (matches minimal UI)
3. ✅ **Placeholder UI**: Disabled buttons with tooltips (no alerts/popups)
4. ✅ **Number key shortcuts**: Only "1" key active (menu open only), keys 2-4 ignored

---

**Generated**: 2026-01-12
**Source**: Research files (GITHUB, CODEBASE, DOCS) + project documentation (PLANNING.md, STATUS.md, game design)
**Confidence Score**: 9/10 (high likelihood of one-pass implementation success)
- All patterns proven in existing codebase (Modal.tsx, Button.tsx, ConfirmDialog.tsx)
- Radix Dialog is production-ready, widely used library
- Keyboard shortcuts follow established React patterns
- No backend changes needed (reset endpoint already exists)
- Clear integration points in App.tsx
**Alignment**: Validated against PLANNING.md (Phase 5.1 requirements) and game design principles (minimal UI, keyboard-first, terminal aesthetic)
