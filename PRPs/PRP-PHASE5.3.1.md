# Phase 5.3.1: Landing Page & Main Menu System - Product Requirement Plan

**Status**: READY FOR IMPLEMENTATION
**Date**: 2026-01-13
**Confidence**: 9/10 (All patterns from production code, 691 backend + 514+ frontend tests passing)
**Dependencies**: Phase 5.3 Complete (Save/Load System)

---

## Goal

Add landing page/main menu system that appears on app start, allowing players to start new cases, load saved games, and return to main menu from investigation.

**End State**:
- App loads to landing page (not directly into case_001)
- Landing page shows case selection + load game button
- ESC menu includes "Exit to Main Menu" option
- Confirmation dialog before exiting active case
- All navigation smooth (no broken states)
- B&W terminal aesthetic maintained

---

## Why

**User Impact**:
- Proper game entry point (not thrown into case_001)
- Can choose which case to start (future multi-case support)
- Can exit investigation and return to menu (not trapped in case)
- Professional UX (matches commercial games)

**Business Value**:
- Prepares architecture for multi-case system (Phase 6+)
- Reduces player confusion (clear game structure)
- Enables case progression tracking (unlock system future)

**Integration**:
- Builds on Phase 5.3 (save/load system already implemented)
- Extends Phase 5.1 (main menu system already exists)
- Prepares for Phase 6 (complete first case, then add Case 002+)

**Alignment**:
- **PLANNING.md Milestone**: Phase 5.3.1 (Landing Page & Main Menu)
- **Design Principle**: Obra Dinn model (player chooses when ready, clear navigation)

---

## What

### User-Visible Behavior

**On App Start**:
1. Landing page shows with game title
2. Shows available cases (initially just case_001)
3. Shows "Load Game" button (opens SaveLoadModal)
4. Player selects case or loads save
5. Briefing modal opens (existing flow)

**During Investigation** (ESC Menu):
1. Press ESC → Main Menu opens
2. Options: NEW GAME, LOAD GAME, SAVE GAME, SETTINGS, **EXIT TO MAIN MENU**
3. Click "Exit to Main Menu" → Confirmation dialog
4. Confirm → Returns to landing page (investigation state cleared)
5. Cancel → Stays in investigation

**Case Selection** (Phase 1):
- Single case card (case_001: The Restricted Section)
- Shows case title, description, difficulty
- "Start Case" button
- Future: Multiple cases with lock icons

### Technical Requirements

**Frontend**:
- `LandingPage.tsx` component (new file)
- App.tsx state: `currentGameState: 'landing' | 'game'`
- App.tsx conditional rendering (landing vs investigation)
- MainMenu.tsx: Add "Exit to Main Menu" button
- Confirmation dialog before exit (reuse ConfirmDialog from Phase 3.1)

**Backend** (Optional, can start with hardcoded list):
- `GET /api/cases` endpoint (list available cases)
- Returns `{ cases: [{ id, name, difficulty, status, description }] }`
- Uses existing `load_case()` function from loader.py

**Types**:
- `CaseMetadata` interface (id, name, difficulty, status, description)

**No Database Changes**: Everything uses existing YAML case files

### Success Criteria

- [x] Landing page shows on app start (before investigation)
- [x] Case selection displays case_001 metadata
- [x] "Start Case" button loads investigation (briefing → game)
- [x] "Load Game" button opens SaveLoadModal (Phase 5.3)
- [x] ESC menu has "Exit to Main Menu" option (5th button)
- [x] Confirmation dialog before exiting case
- [x] Confirmation resets investigation state (calls resetCase)
- [x] Landing page uses B&W terminal aesthetic (no colors)
- [x] All existing tests pass (691 backend, 514+ frontend)
- [x] Zero regressions in investigation flow

---

## Context & References

### Project Documentation

**From PLANNING.md**:
- Phase 5.3.1: Landing Page & Main Menu System (planned after Phase 5.3)
- Architecture: Modular frontend (React + Vite), case-based structure
- Design: Obra Dinn model (player chooses when ready)

**From STATUS.md**:
- Phase 5.3 complete: Save/Load System (3 manual + autosave slots)
- Phase 5.1 complete: Main Menu System (ESC toggle, keyboard shortcuts)
- Current state: 691 backend tests (100%), 514+ frontend tests passing

**From game design**:
- Terminal aesthetic: Minimal B&W UI (no colored elements except warnings)
- Player agency: No forced progression, clear navigation
- Case structure: YAML-based, modular, future multi-case

### Research Sources

**Codebase patterns (validated)**:
- `App.tsx`: Modal state management, conditional rendering, ESC handler
- `MainMenu.tsx`: Radix Dialog, keyboard shortcuts (1-4), loading states
- `SaveLoadModal.tsx`: Slot grid pattern, metadata display
- `ConfirmDialog.tsx`: Destructive action confirmation (Phase 3.1)
- `terminal-theme.ts`: Centralized design tokens (B&W theme)
- `loader.py`: Case loading (load_case, list_cases functions)

**No GitHub research needed**: All patterns from production code

**Docs reference**:
- Radix Dialog: Dialog.Root, Dialog.Portal, Dialog.Content
- Tailwind: Existing utility classes (bg-gray-900, border-gray-700)

**Alignment notes**:
- ✅ Research patterns align with project architecture
- ✅ Minimal changes (KISS principle)
- ✅ Reuses existing components (Modal, Button, ConfirmDialog)

---

## Quick Reference (Pre-Digested Context)

### Essential Component APIs

```typescript
// Modal (from ui/Modal.tsx)
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  variant?: 'default' | 'terminal';  // default = yellow header, terminal = green
}

// Button (from ui/Button.tsx)
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';  // primary = amber, secondary = gray
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  title?: string;  // Tooltip on hover
}

// ConfirmDialog (from Phase 3.1)
interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';  // destructive = red confirm button
}
```

### Key Patterns from Codebase

**Pattern 1: App-Level Modal State** (App.tsx lines 151-158):
```typescript
// Modal states in App.tsx (not in child components)
const [briefingModalOpen, setBriefingModalOpen] = useState(false);
const [menuOpen, setMenuOpen] = useState(false);
const [saveModalOpen, setSaveModalOpen] = useState(false);
const [loadModalOpen, setLoadModalOpen] = useState(false);

// Conditional rendering
{menuOpen && (
  <MainMenu
    isOpen={menuOpen}
    onClose={() => setMenuOpen(false)}
    onRestart={handleRestart}
    onLoad={() => { setMenuOpen(false); setLoadModalOpen(true); }}
    onSave={() => { setMenuOpen(false); setSaveModalOpen(true); }}
  />
)}
```

**Pattern 2: ESC Key Handler** (App.tsx lines 413-434):
```typescript
// Global ESC listener in App.tsx
useEffect(() => {
  const handleGlobalKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      // Check if other modals open
      const hasOtherModal =
        briefingModalOpen ||
        witnessModalOpen ||
        verdictModalOpen ||
        showRestartConfirm ||
        selectedEvidence !== null;

      if (!hasOtherModal) {
        setMenuOpen((prev) => !prev);  // Toggle menu
      }
    }
  };
  document.addEventListener('keydown', handleGlobalKeydown);
  return () => document.removeEventListener('keydown', handleGlobalKeydown);
}, [briefingModalOpen, witnessModalOpen, verdictModalOpen, showRestartConfirm, selectedEvidence]);
```

**Pattern 3: MainMenu Keyboard Shortcuts** (MainMenu.tsx lines 48-72):
```typescript
// Number key shortcuts (1-4) in MainMenu
useEffect(() => {
  if (!isOpen) return;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (loading) return;  // Disable during async

    if (e.key === '1') {
      e.preventDefault();
      onRestart();
    } else if (e.key === '2') {
      e.preventDefault();
      onLoad();
    } else if (e.key === '3') {
      e.preventDefault();
      onSave();
    }
    // Add: else if (e.key === '5') { onExitToMainMenu(); }
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [isOpen, onRestart, onLoad, onSave, loading]);
```

**Pattern 4: Case Reset Before Navigation** (Phase 3.1):
```typescript
// Reset case before returning to menu
const handleExitToMainMenu = useCallback(async () => {
  try {
    await resetCase(CASE_ID);  // Clear backend state
    setCurrentGameState('landing');
    setSelectedCaseId(null);
  } catch (error) {
    console.error('Failed to reset case:', error);
    setToastMessage('Failed to exit to main menu');
    setToastVariant('error');
  }
}, []);
```

### Integration Patterns (Actual Codebase)

**From App.tsx** (lines 1-762):
```typescript
// Current flow:
function App() {
  // 1. useInvestigation hook loads case_001 immediately
  const { state, isLoading, error, ... } = useInvestigation({ caseId: CASE_ID, ... });

  // 2. Conditional modal rendering
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      {/* Investigation UI */}
      {menuOpen && <MainMenu {...} />}
      {briefingModalOpen && <BriefingModal {...} />}
      {/* etc */}
    </div>
  );
}

// NEW flow with Landing Page:
function App() {
  const [currentGameState, setCurrentGameState] = useState<'landing' | 'game'>('landing');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  // 1. Show landing page if currentGameState === 'landing'
  if (currentGameState === 'landing') {
    return (
      <LandingPage
        onStartNewCase={(caseId) => {
          setSelectedCaseId(caseId);
          setCurrentGameState('game');
        }}
        onLoadGame={() => {
          setLoadModalOpen(true);
          // On successful load, setCurrentGameState('game')
        }}
      />
    );
  }

  // 2. Investigation flow (only if currentGameState === 'game')
  const { state, ... } = useInvestigation({
    caseId: selectedCaseId || CASE_ID,
    ...
  });

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      {/* Existing investigation UI */}
    </div>
  );
}
```

**From MainMenu.tsx** (enhancement):
```typescript
// Add 5th button:
<Button
  variant="secondary"
  size="lg"
  onClick={onExitToMainMenu}
  className="w-full font-mono"
  disabled={loading}
>
  5. EXIT TO MAIN MENU
</Button>
```

### Library-Specific Gotchas

**Synthesized from codebase + Phase 5.1/5.3 research**:

1. **Radix Dialog ESC Handling**:
   - Issue: Radix Dialog automatically closes on ESC
   - Solution: Use `onEscapeKeyDown={onClose}` in Dialog.Content
   - Reference: MainMenu.tsx line 122

2. **Focus Management**:
   - Issue: Focus can get trapped between landing page → investigation
   - Solution: Use `onOpenAutoFocus` to focus first button
   - Reference: MainMenu.tsx lines 89-93

3. **State Reset Timing**:
   - Issue: Navigating to landing page without reset leaves old state
   - Solution: Call `resetCase()` API before changing currentGameState
   - Reference: Phase 3.1 implementation

4. **useInvestigation Hook Loading**:
   - Issue: Hook loads case immediately on mount (breaks landing page)
   - Solution: Conditional rendering (don't mount investigation until case selected)
   - Pattern: Wrap investigation UI in `if (currentGameState === 'game')`

5. **Keyboard Shortcut Conflicts**:
   - Issue: Number keys (1-5) could fire in both landing and investigation
   - Solution: Separate listeners per component, check `isOpen` state
   - Reference: MainMenu.tsx lines 50-51

6. **Modal Z-Index Stacking**:
   - Issue: ConfirmDialog must appear above MainMenu
   - Solution: Radix Dialog uses z-50, confirm dialog needs z-60+
   - Reference: Modal.tsx z-index layering

### Decision Tree

```
App Start:
  → Check currentGameState
  ├─ 'landing' → Show LandingPage
  │   ├─ Click "Start Case" → setCurrentGameState('game'), setSelectedCaseId
  │   └─ Click "Load Game" → Open SaveLoadModal → window.location.reload()
  └─ 'game' → Show Investigation UI (existing flow)

During Investigation (ESC pressed):
  → Check hasOtherModal
  ├─ TRUE → Do nothing (other modal handling ESC)
  └─ FALSE → Toggle menuOpen

In MainMenu (5 pressed or clicked):
  → Show ConfirmDialog
  ├─ Confirm → resetCase() → setCurrentGameState('landing')
  └─ Cancel → Close dialog, stay in investigation
```

### Configuration Requirements

**No new dependencies needed**:
- ✅ Radix Dialog (@radix-ui/react-dialog) - already installed (Phase 5.1)
- ✅ React hooks (useState, useEffect, useCallback) - core React
- ✅ Existing API client (client.ts) - extend with listCases() if needed

**No .env changes needed**: All functionality uses existing endpoints

---

## Current Codebase Structure

```bash
frontend/src/
├── components/
│   ├── MainMenu.tsx                # MODIFY - Add button 5 "Exit to Main Menu"
│   ├── SaveLoadModal.tsx           # REUSE - Already functional
│   ├── ConfirmDialog.tsx           # REUSE - From Phase 3.1
│   ├── ui/
│   │   ├── Modal.tsx               # REUSE
│   │   ├── Button.tsx              # REUSE
│   │   └── TerminalPanel.tsx       # REUSE (for case cards)
│   └── __tests__/
├── hooks/
│   ├── useMainMenu.ts              # REUSE - No changes needed
│   ├── useInvestigation.ts         # REUSE - No changes needed
│   └── useSaveSlots.ts             # REUSE - No changes needed
├── api/
│   └── client.ts                   # MODIFY - Add listCases() (optional)
├── types/
│   └── investigation.ts            # MODIFY - Add CaseMetadata interface
├── App.tsx                         # MODIFY - Add landing page state + conditional rendering
└── styles/
    └── terminal-theme.ts           # REUSE - Design tokens

backend/src/
├── case_store/
│   ├── loader.py                   # REUSE - load_case(), list_cases() already exist
│   └── case_001.yaml               # REUSE - No changes needed
└── api/
    └── routes.py                   # MODIFY (optional) - Add GET /api/cases
```

## Desired Codebase Structure

```bash
frontend/src/
├── components/
│   ├── LandingPage.tsx             # CREATE - Landing page component
│   ├── MainMenu.tsx                # MODIFY - Add button 5
│   └── __tests__/
│       └── LandingPage.test.tsx    # CREATE - Component tests
├── App.tsx                         # MODIFY - Add state + conditional rendering

backend/src/api/
└── routes.py                       # MODIFY (optional) - Add GET /api/cases
```

**Note**: validation-gates handles test file creation. Don't include backend tests in structure.

---

## Files to Create/Modify

| File | Action | Purpose | Reference File |
|------|--------|---------|----------------|
| `frontend/src/components/LandingPage.tsx` | CREATE | Landing page UI | `MainMenu.tsx` (Radix Dialog pattern) |
| `frontend/src/App.tsx` | MODIFY | Add state + conditional rendering | Existing modal state pattern (lines 151-158) |
| `frontend/src/components/MainMenu.tsx` | MODIFY | Add button 5 "Exit to Main Menu" | Existing buttons (lines 132-168) |
| `frontend/src/types/investigation.ts` | MODIFY | Add CaseMetadata interface | Existing types (InvestigationState, LocationInfo) |
| `frontend/src/api/client.ts` | MODIFY (optional) | Add listCases() function | Existing API functions (loadGame, getLocations) |
| `backend/src/api/routes.py` | MODIFY (optional) | Add GET /api/cases endpoint | Existing GET endpoints (get_locations) |

**Note**: Test files handled by validation-gates. Don't list in PRP.

---

## Tasks (Ordered)

### Task 1: Add CaseMetadata Type Definition
**File**: `frontend/src/types/investigation.ts`
**Action**: MODIFY (add interface)
**Purpose**: Type safety for case listing
**Reference**: Existing types in same file (InvestigationState, LocationInfo)
**Depends on**: None
**Acceptance criteria**:
- [ ] `CaseMetadata` interface exists
- [ ] Fields: id, name, difficulty, status, description
- [ ] Imported and used in LandingPage component

**Code Example**:
```typescript
// Add to investigation.ts:
export interface CaseMetadata {
  id: string;
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'locked' | 'unlocked';
  description: string;
}
```

---

### Task 2: Create LandingPage Component
**File**: `frontend/src/components/LandingPage.tsx`
**Action**: CREATE
**Purpose**: Landing page UI (game entry point)
**Reference**: `MainMenu.tsx` (Radix Dialog pattern), `SaveLoadModal.tsx` (grid pattern)
**Depends on**: Task 1
**Acceptance criteria**:
- [ ] Component renders with game title
- [ ] Shows case selection (initially case_001 only)
- [ ] "Start Case" button calls onStartNewCase(caseId)
- [ ] "Load Game" button calls onLoadGame()
- [ ] Uses B&W terminal aesthetic (no colors)
- [ ] Keyboard shortcut: 1 for Start Case, 2 for Load Game

**Code Example**:
```typescript
// LandingPage.tsx (new file)
import React, { useEffect, useState } from 'react';
import { Button } from './ui/Button';
import { TERMINAL_THEME } from '../styles/terminal-theme';
import type { CaseMetadata } from '../types/investigation';

export interface LandingPageProps {
  onStartNewCase: (caseId: string) => void;
  onLoadGame: () => void;
}

export function LandingPage({ onStartNewCase, onLoadGame }: LandingPageProps) {
  // For Phase 1: Hardcoded case list
  const cases: CaseMetadata[] = [
    {
      id: 'case_001',
      name: 'The Restricted Section',
      difficulty: 'Medium',
      status: 'unlocked',
      description: 'Third-year student found petrified in Hogwarts Library. Investigate the crime scene and identify the culprit.',
    },
  ];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1') {
        e.preventDefault();
        onStartNewCase(cases[0].id);
      } else if (e.key === '2') {
        e.preventDefault();
        onLoadGame();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onStartNewCase, onLoadGame, cases]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-8">
      {/* Title */}
      <h1 className="text-5xl font-bold text-white font-mono tracking-widest mb-2">
        AUROR ACADEMY
      </h1>
      <p className="text-gray-500 text-sm font-mono mb-12">
        Case Investigation System v1.0
      </p>

      {/* Case Grid */}
      <div className="max-w-4xl w-full space-y-8">
        <h2 className="text-2xl font-bold text-white font-mono tracking-wider">
          AVAILABLE CASES
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cases.map((caseItem) => (
            <div
              key={caseItem.id}
              className="border border-gray-700 rounded bg-gray-800/50 p-6 hover:border-gray-500 hover:bg-gray-800 transition-colors"
            >
              <h3 className="text-xl font-bold text-white font-mono uppercase mb-2">
                {caseItem.name}
              </h3>
              <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                {caseItem.description}
              </p>
              <div className="text-gray-500 text-xs mb-4">
                Difficulty: {caseItem.difficulty}
              </div>
              <Button
                onClick={() => onStartNewCase(caseItem.id)}
                className="w-full font-mono"
                variant="primary"
                size="lg"
                disabled={caseItem.status === 'locked'}
              >
                {caseItem.status === 'locked' ? 'LOCKED' : 'START CASE'}
              </Button>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <Button
            onClick={onLoadGame}
            className="flex-1 font-mono"
            variant="secondary"
            size="lg"
          >
            2. LOAD GAME
          </Button>
        </div>

        <p className="text-center text-gray-500 text-xs font-mono mt-6">
          Press 1 to Start Case | Press 2 to Load Game
        </p>
      </div>
    </div>
  );
}
```

---

### Task 3: Modify App.tsx for Landing Page Integration
**File**: `frontend/src/App.tsx`
**Action**: MODIFY (add state + conditional rendering)
**Purpose**: Control navigation between landing and investigation
**Reference**: Existing modal state pattern (lines 151-158)
**Depends on**: Task 2
**Acceptance criteria**:
- [ ] `currentGameState` state exists ('landing' | 'game')
- [ ] `selectedCaseId` state exists
- [ ] Conditional rendering: landing page vs investigation
- [ ] `onStartNewCase` handler sets state correctly
- [ ] `onLoadGame` handler opens SaveLoadModal
- [ ] useInvestigation hook only runs when currentGameState === 'game'

**Code Example**:
```typescript
// App.tsx modifications:
import { LandingPage } from './components/LandingPage';

function App() {
  // NEW: Landing page state
  const [currentGameState, setCurrentGameState] = useState<'landing' | 'game'>('landing');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  // Existing states...
  const [menuOpen, setMenuOpen] = useState(false);
  const [loadModalOpen, setLoadModalOpen] = useState(false);
  // ...

  // NEW: Landing page handlers
  const handleStartNewCase = useCallback((caseId: string) => {
    setSelectedCaseId(caseId);
    setCurrentGameState('game');
  }, []);

  const handleLoadGameFromLanding = useCallback(() => {
    setLoadModalOpen(true);
  }, []);

  // NEW: Exit to main menu handler
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const handleExitToMainMenu = useCallback(() => {
    setMenuOpen(false);
    setShowExitConfirm(true);
  }, []);

  const handleConfirmExit = useCallback(async () => {
    try {
      await resetCase(selectedCaseId || CASE_ID);
      setCurrentGameState('landing');
      setSelectedCaseId(null);
      setShowExitConfirm(false);
    } catch (error) {
      console.error('Failed to reset case:', error);
      setToastMessage('Failed to exit to main menu');
      setToastVariant('error');
    }
  }, [selectedCaseId]);

  // NEW: Conditional rendering
  if (currentGameState === 'landing') {
    return (
      <>
        <LandingPage
          onStartNewCase={handleStartNewCase}
          onLoadGame={handleLoadGameFromLanding}
        />

        {/* SaveLoadModal can open from landing page */}
        {loadModalOpen && (
          <SaveLoadModal
            isOpen={loadModalOpen}
            onClose={() => setLoadModalOpen(false)}
            mode="load"
            onLoad={async (slot) => {
              await loadFromSlot(slot);
              setLoadModalOpen(false);
              window.location.reload();  // Existing pattern
            }}
            slots={slots}
            loading={loadingSaveSlot}
          />
        )}

        {/* Toast for errors */}
        {toastMessage && (
          <Toast
            message={toastMessage}
            variant={toastVariant}
            onClose={() => setToastMessage(null)}
          />
        )}
      </>
    );
  }

  // Existing investigation UI (only if currentGameState === 'game')
  const { state, isLoading, error, ... } = useInvestigation({
    caseId: selectedCaseId || CASE_ID,
    ...
  });

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      {/* Existing investigation UI */}

      {/* MainMenu with new exit handler */}
      {menuOpen && (
        <MainMenu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          onRestart={handleRestart}
          onLoad={handleLoadGame}
          onSave={handleSaveGame}
          onExitToMainMenu={handleExitToMainMenu}  // NEW
          loading={loadingSaveSlot}
        />
      )}

      {/* Exit confirmation dialog */}
      {showExitConfirm && (
        <ConfirmDialog
          isOpen={showExitConfirm}
          onConfirm={handleConfirmExit}
          onCancel={() => setShowExitConfirm(false)}
          title="Exit to Main Menu"
          message="Are you sure? Current progress will be lost unless saved."
          confirmText="Exit"
          cancelText="Cancel"
          variant="destructive"
        />
      )}

      {/* Existing modals... */}
    </div>
  );
}
```

---

### Task 4: Add "Exit to Main Menu" Button to MainMenu
**File**: `frontend/src/components/MainMenu.tsx`
**Action**: MODIFY (add button 5 + keyboard shortcut)
**Purpose**: Allow player to exit investigation
**Reference**: Existing buttons (lines 132-168)
**Depends on**: Task 3
**Acceptance criteria**:
- [ ] `onExitToMainMenu` prop added to MainMenuProps
- [ ] Button 5 "Exit to Main Menu" exists
- [ ] Keyboard shortcut: Press 5 → calls onExitToMainMenu
- [ ] Button disabled when loading === true

**Code Example**:
```typescript
// MainMenu.tsx modifications:
export interface MainMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onRestart: () => void;
  onLoad: () => void;
  onSave: () => void;
  onExitToMainMenu: () => void;  // NEW
  loading?: boolean;
}

export function MainMenu({
  isOpen,
  onClose,
  onRestart,
  onLoad,
  onSave,
  onExitToMainMenu,  // NEW
  loading = false,
}: MainMenuProps) {
  // Keyboard shortcuts (add key '5')
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (loading) return;

      if (e.key === '1') {
        e.preventDefault();
        onRestart();
      } else if (e.key === '2') {
        e.preventDefault();
        onLoad();
      } else if (e.key === '3') {
        e.preventDefault();
        onSave();
      } else if (e.key === '5') {  // NEW
        e.preventDefault();
        onExitToMainMenu();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onRestart, onLoad, onSave, onExitToMainMenu, loading]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                     bg-gray-900 border-2 border-gray-700 rounded-lg
                     w-full max-w-md p-6 shadow-xl"
          onEscapeKeyDown={onClose}
        >
          <Dialog.Title className="text-2xl font-bold text-amber-400 font-mono mb-6 tracking-wider">
            MAIN MENU
          </Dialog.Title>

          <div className="space-y-3">
            <Button variant="primary" size="lg" onClick={onRestart} disabled={loading}>
              1. NEW GAME
            </Button>
            <Button variant="secondary" size="lg" onClick={onLoad} disabled={loading}>
              2. LOAD GAME
            </Button>
            <Button variant="secondary" size="lg" onClick={onSave} disabled={loading}>
              3. SAVE GAME
            </Button>
            <Button variant="ghost" size="lg" disabled title="Coming soon">
              4. SETTINGS
            </Button>
            {/* NEW BUTTON */}
            <Button
              variant="secondary"
              size="lg"
              onClick={onExitToMainMenu}
              disabled={loading}
              className="w-full font-mono"
            >
              5. EXIT TO MAIN MENU
            </Button>
          </div>

          <p className="mt-6 text-center text-gray-500 text-xs font-mono">
            Press ESC to close | Press 1-5 to select
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

---

### Task 5 (OPTIONAL): Add Backend Case Listing Endpoint
**File**: `backend/src/api/routes.py`
**Action**: MODIFY (add GET /api/cases endpoint)
**Purpose**: Return list of available cases with metadata
**Reference**: Existing GET /api/case/{case_id}/locations (lines 1130-1145)
**Depends on**: None (can hardcode in frontend initially)
**Acceptance criteria**:
- [ ] `GET /api/cases` endpoint exists
- [ ] Returns list of CaseMetadata (id, name, difficulty, status, description)
- [ ] Uses existing `list_cases()` and `load_case()` from loader.py
- [ ] No new dependencies

**Code Example**:
```python
# routes.py (add endpoint):
from src.case_store.loader import list_cases, load_case

class CaseMetadataResponse(BaseModel):
    """Case metadata for listing."""
    id: str
    name: str
    difficulty: str
    status: str  # 'locked' | 'unlocked'
    description: str

@router.get("/api/cases", response_model=list[CaseMetadataResponse])
async def list_available_cases() -> list[CaseMetadataResponse]:
    """List all available cases with metadata."""
    case_ids = list_cases()
    cases = []

    for case_id in case_ids:
        try:
            case_data = load_case(case_id)
            cases.append(
                CaseMetadataResponse(
                    id=case_id,
                    name=case_data.get("case", {}).get("title", case_id),
                    difficulty=case_data.get("case", {}).get("difficulty", "Medium"),
                    status="unlocked",  # TODO: Implement unlock system
                    description=case_data.get("case", {}).get("description", ""),
                )
            )
        except Exception as e:
            # Skip invalid cases
            logger.warning(f"Failed to load case {case_id}: {e}")
            continue

    return cases
```

---

### Task 6 (OPTIONAL): Add Frontend API Client Function
**File**: `frontend/src/api/client.ts`
**Action**: MODIFY (add listCases function)
**Purpose**: Fetch available cases from backend
**Reference**: Existing getLocations() function (lines 219-227)
**Depends on**: Task 5
**Acceptance criteria**:
- [ ] `listCases()` function exists
- [ ] Returns Promise<CaseMetadata[]>
- [ ] Error handling matches existing pattern

**Code Example**:
```typescript
// client.ts (add function):
export async function listCases(): Promise<CaseMetadata[]> {
  const response = await fetch(`${API_BASE_URL}/api/cases`);
  if (!response.ok) {
    throw await createApiError(response);
  }
  return (await response.json()) as CaseMetadata[];
}
```

---

## Integration Points

### Landing Page → Investigation Flow
**Where**: `App.tsx` conditional rendering
**What**: Landing page shows until player starts case
**Pattern**: State-based routing (currentGameState: 'landing' | 'game')
**Reference**: App.tsx lines 151-762 (investigation UI)

### ESC Menu → Exit to Main Menu
**Where**: `MainMenu.tsx` button + `App.tsx` handler
**What**: Player can exit investigation and return to landing
**Pattern**: Confirmation dialog (destructive action) + state reset
**Reference**: ConfirmDialog from Phase 3.1 (lines 340-360 in PLANNING.md)

### Landing Page → Load Game
**Where**: `LandingPage.tsx` button → `App.tsx` SaveLoadModal
**What**: Player can load saved game from landing page
**Pattern**: Open SaveLoadModal, then window.location.reload()
**Reference**: App.tsx line 381 (existing load pattern)

---

## Known Gotchas

### From Project Codebase

1. **Issue**: useInvestigation hook loads case immediately on mount
   - **Solution**: Conditional rendering (don't render investigation until case selected)
   - **Reference**: App.tsx hook calls (lines 240+)

2. **Issue**: Modal z-index conflicts (ConfirmDialog above MainMenu)
   - **Solution**: Radix Dialog uses z-50, confirm dialog needs z-60+
   - **Reference**: Modal.tsx overlay styling

3. **Issue**: ESC key conflicts (multiple handlers)
   - **Solution**: Check `hasOtherModal` before toggling menu
   - **Reference**: App.tsx global ESC handler (lines 413-434)

4. **Issue**: State not cleared when exiting to menu
   - **Solution**: Call resetCase() API before setCurrentGameState('landing')
   - **Reference**: Phase 3.1 restart implementation

5. **Issue**: Keyboard shortcuts fire in wrong context
   - **Solution**: Separate listeners per component, check `isOpen` state
   - **Reference**: MainMenu.tsx line 50 (`if (!isOpen) return;`)

6. **Issue**: Focus trap between landing page and investigation
   - **Solution**: Use Radix Dialog's `onOpenAutoFocus` to focus first button
   - **Reference**: MainMenu.tsx lines 89-93

---

## Validation

### Syntax & Style (Pre-commit)
```bash
# Frontend
cd frontend
bun run typecheck  # TypeScript errors
bun run lint       # ESLint errors
bun test          # Component tests

# Backend (if Task 5 implemented)
cd backend
uv run ruff check .
uv run mypy src/
# Expected: No errors
```

### Manual Verification (Optional)
```bash
# Quick smoke test:
# 1. App loads to landing page (not case_001)
# 2. Click "Start Case" → briefing modal opens
# 3. ESC → Main Menu → "Exit to Main Menu" → Confirmation
# 4. Confirm → Returns to landing page
# 5. Click "Load Game" → SaveLoadModal opens
```

**Note**: validation-gates agent handles comprehensive testing. No need to specify test scenarios in PRP.

---

## Dependencies

**No new packages**:
- ✅ Radix Dialog - already installed (Phase 5.1)
- ✅ React hooks - core React
- ✅ Existing API client - extend if needed

**No .env changes**:
- ✅ All endpoints use existing API_BASE_URL

---

## Out of Scope

- Multiple case selection (Phase 6+, after complete Case 001)
- Case unlock progression system (future enhancement)
- Settings page (Phase 5.1 marked as "Coming soon")
- Backend case listing endpoint (optional, can hardcode initially)
- Case search/filter UI (not needed with 1 case)

---

## Agent Orchestration Plan

### Execution Strategy

**Sequential Track** (dependencies):
1. `react-vite-specialist` → Frontend implementation (Tasks 1-4)
2. `validation-gates` → Run all tests
3. `documentation-manager` → Update docs

**Why Sequential**: Frontend must be complete before tests can run.

**Optional**: If backend endpoint needed (Task 5-6), run `fastapi-specialist` in parallel with `react-vite-specialist` Task 1-2.

### Agent-Specific Guidance

#### For react-vite-specialist
- **Input**: Tasks 1-4 (frontend implementation)
- **Context**: Quick Reference section above (no doc reading needed)
- **Pattern**: Follow App.tsx modal state pattern, MainMenu button pattern
- **Integration**: LandingPage uses same B&W theme as investigation UI
- **Output**: Landing page working, ESC menu has exit button

**Key Files to Reference**:
- `App.tsx` (modal state pattern, conditional rendering)
- `MainMenu.tsx` (Radix Dialog, keyboard shortcuts)
- `ConfirmDialog.tsx` (destructive action confirmation)
- `terminal-theme.ts` (B&W design tokens)

#### For validation-gates
- **Input**: All code complete
- **Runs**: Tests, lint, type check, build
- **Output**: Pass/fail report
- **Note**: validation-gates creates tests if needed

#### For documentation-manager
- **Input**: Code complete, validation passed
- **Files changed**: List from "Files to Create/Modify" section
- **Output**: Updated README, docstrings added

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

**From project experience:**
- ❌ Creating modals inside child components (always in App.tsx)
- ❌ Not checking hasOtherModal before toggling menu (ESC conflicts)
- ❌ Not resetting state before navigation (old state leaks)
- ❌ Not disabling keyboard shortcuts during loading (race conditions)
- ❌ Not using conditional rendering for investigation (hook loads immediately)

---

**Generated**: 2026-01-13
**Source**: Research files + project documentation
**Confidence Score**: 9/10 (one-pass implementation highly likely)
**Alignment**: Validated against PLANNING.md, game design principles, and production codebase

---

## Unresolved Questions

None - All patterns clear from production code. Optional backend endpoint (Task 5-6) can be deferred if hardcoded case list sufficient initially.
