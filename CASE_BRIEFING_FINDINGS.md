# Case Briefing Modal - Frontend Architecture Findings

**Date**: 2026-01-09
**Scope**: Frontend Case Briefing modal component, state management, and modal opening logic
**Status**: Complete

---

## Overview

The Case Briefing modal is a full-featured component system for displaying Moody's case introduction. It currently opens on **every app reload** due to the `useEffect` hook in App.tsx that calls `loadBriefing()` without checking persistent completion state.

---

## File Locations & Structure

### Core Files

| File | Location | Purpose |
|------|----------|---------|
| **BriefingModal** | `/frontend/src/components/BriefingModal.tsx` | Main modal content component (dialogue UI) |
| **Modal** | `/frontend/src/components/ui/Modal.tsx` | Generic modal wrapper with title rendering |
| **useBriefing** | `/frontend/src/hooks/useBriefing.ts` | State management hook for briefing logic |
| **App** | `/frontend/src/App.tsx` | Modal integration & opening conditions |
| **Types** | `/frontend/src/types/investigation.ts` | TypeScript interfaces for briefing data |
| **API Client** | `/frontend/src/api/client.ts` | Backend API calls for briefing endpoints |

---

## 1. Modal Title Rendering

### Location: Modal Component (`/frontend/src/components/ui/Modal.tsx`)

**Lines**: 65-75

```tsx
{title && (
  <h2
    id="modal-title"
    className={`text-xl font-bold ${
      isTerminal
        ? 'text-green-400 font-mono'
        : 'text-amber-900 font-serif'
    }`}
  >
    {isTerminal ? `[${title}]` : title}
  </h2>
)}
```

**Key Details**:
- Title is passed via `title` prop to Modal component
- Terminal variant adds square brackets: `[Case Briefing]`
- Uses `text-green-400` color (bright green terminal style)
- Font is `font-mono` (monospace terminal font)
- For "Case Briefing" text, renders as: **`[Case Briefing]`**

### Location: Where Title is Set (App.tsx)

**Lines**: 487

```tsx
<Modal
  isOpen={briefingModalOpen}
  onClose={() => void handleBriefingComplete()}
  variant="terminal"
  title="Case Briefing"  // <-- TITLE SET HERE
>
```

---

## 2. Modal Opening Logic (THE ISSUE)

### Location: App.tsx

**Lines**: 118-132

```tsx
// Briefing modal state
const [briefingModalOpen, setBriefingModalOpen] = useState(false);

// Load briefing on mount
useEffect(() => {
  const initBriefing = async () => {
    const content = await loadBriefing();
    // Show briefing modal if content loaded and not completed
    if (content && !briefingCompleted) {
      setBriefingModalOpen(true);
    }
  };
  void initBriefing();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

**Problem Analysis**:

1. **Empty dependency array** (`[]`) means this effect runs once on mount
2. **Condition checks**: `if (content && !briefingCompleted)`
   - `content`: Will load fresh briefing from backend
   - `briefingCompleted`: State from `useBriefing` hook
3. **The Bug**: `briefingCompleted` is derived from local state (`completed`), NOT persisted
   - When page reloads, `completed` resets to `false`
   - So condition `!briefingCompleted` is always `true` on page load
   - Modal opens **every reload** regardless of backend completion status

**Critical State Flow**:
```
App mount
  ↓
useEffect fires (empty deps)
  ↓
loadBriefing() called
  ↓
briefingCompleted = false (fresh hook state)
  ↓
if (content && !briefingCompleted) → TRUE
  ↓
setBriefingModalOpen(true) ← ALWAYS OPENS
```

---

## 3. Briefing Completion State Management

### Location: useBriefing Hook (`/frontend/src/hooks/useBriefing.ts`)

**State Definition**:

Lines 69-80:
```tsx
export function useBriefing({
  caseId = 'case_001',
  playerId = 'default',
}: UseBriefingOptions = {}): UseBriefingReturn {
  // State
  const [briefing, setBriefing] = useState<BriefingContent | null>(null);
  const [conversation, setConversation] = useState<BriefingConversation[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [choiceResponse, setChoiceResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);  // <-- LOCAL STATE ONLY
```

**Key Issue**:
- `completed` state initialized as `false`
- Set to `true` in `markComplete()` function (lines 139-151)
- **NOT** persisted across page reloads
- **NOT** checked against backend state

**Mark Complete Function**:

Lines 139-151:
```tsx
// Mark briefing as complete
const markComplete = useCallback(async () => {
  setLoading(true);
  setError(null);

  try {
    const response = await markBriefingCompleteAPI(caseId, playerId);
    if (response.success) {
      setCompleted(true);  // <-- Sets local state
    }
  } catch (err) {
    const apiError = err as ApiError;
    setError(apiError.message || 'Failed to complete briefing');
  } finally {
    setLoading(false);
  }
}, [caseId, playerId]);
```

---

## 4. BriefingModal Component

### Location: `/frontend/src/components/BriefingModal.tsx`

**Props Interface** (Lines 25-42):

```tsx
export interface BriefingModalProps {
  /** Briefing content from backend */
  briefing: BriefingContent;
  /** Q&A conversation history */
  conversation: BriefingConversationType[];
  /** Selected choice ID (null if not yet answered) */
  selectedChoice: string | null;
  /** Moody's response to selected choice */
  choiceResponse: string | null;
  /** Callback when player selects a choice */
  onSelectChoice: (choiceId: string) => void;
  /** Callback when player asks a question */
  onAskQuestion: (question: string) => Promise<void>;
  /** Callback when player clicks "Start Investigation" */
  onComplete: () => void;
  /** Whether an API call is in progress */
  loading: boolean;
}
```

**Component Structure** (Lines 91-189):

1. **Dialogue Feed Section** (Lines 94-140)
   - Case assignment message from backend
   - Teaching question prompt
   - Choice buttons (if not answered)
   - Player's choice + Moody's response (if answered)
   - Conversation history (Q&A)

2. **Divider** (Line 143)

3. **Text Input Section** (Lines 146-187)
   - Textarea for questions with placeholder: "Ask Mad-Eye a question..."
   - Submit button with loading state ("Asking...")
   - "Start Investigation" button to close modal
   - Ctrl+Enter support for submission

**CSS Styling**:
- Dark terminal theme: `bg-gray-900`
- Text color: `text-gray-100` (light gray)
- Input: `bg-gray-800 border-gray-600`
- Focus state: `focus:border-amber-500 focus:ring-amber-500`

---

## 5. Modal Integration in App.tsx

### Rendering Location (Lines 481-500):

```tsx
{/* Briefing Modal */}
{briefingModalOpen && briefing && (
  <Modal
    isOpen={briefingModalOpen}
    onClose={() => void handleBriefingComplete()}
    variant="terminal"
    title="Case Briefing"
  >
    <BriefingModal
      briefing={briefing}
      conversation={briefingConversation}
      selectedChoice={briefingSelectedChoice}
      choiceResponse={briefingChoiceResponse}
      onSelectChoice={selectBriefingChoice}
      onAskQuestion={askBriefingQuestion}
      onComplete={() => void handleBriefingComplete()}
      loading={briefingLoading}
    />
  </Modal>
)}
```

### Closing Handler (Lines 135-138):

```tsx
// Handle briefing complete
const handleBriefingComplete = useCallback(async () => {
  await markBriefingComplete();
  setBriefingModalOpen(false);
}, [markBriefingComplete]);
```

---

## 6. Backend API Endpoints

### Location: `/frontend/src/api/client.ts`

All briefing API calls are defined here with full documentation:

#### GET /api/briefing/{case_id}

**Lines**: 701-727

```tsx
export async function getBriefing(
  caseId: string,
  playerId = 'default'
): Promise<BriefingContent> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/briefing/${encodeURIComponent(caseId)}?player_id=${encodeURIComponent(playerId)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );
    if (!response.ok) {
      throw await createApiError(response);
    }
    return (await response.json()) as BriefingContent;
  } catch (error) {
    if (isApiError(error)) {
      throw error;
    }
    throw handleFetchError(error);
  }
}
```

#### POST /api/briefing/{case_id}/question

**Lines**: 744-772

```tsx
export async function askBriefingQuestion(
  caseId: string,
  question: string,
  playerId = 'default'
): Promise<BriefingQuestionResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/briefing/${encodeURIComponent(caseId)}/question?player_id=${encodeURIComponent(playerId)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      }
    );
    if (!response.ok) {
      throw await createApiError(response);
    }
    return (await response.json()) as BriefingQuestionResponse;
  } catch (error) {
    if (isApiError(error)) {
      throw error;
    }
    throw handleFetchError(error);
  }
}
```

#### POST /api/briefing/{case_id}/complete

**Lines**: 790-809

```tsx
export async function markBriefingComplete(
  caseId: string,
  playerId = 'default'
): Promise<BriefingCompleteResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/briefing/${encodeURIComponent(caseId)}/complete?player_id=${encodeURIComponent(playerId)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }
    );
    if (!response.ok) {
      throw await createApiError(response);
    }
    return (await response.json()) as BriefingCompleteResponse;
  } catch (error) {
    if (isApiError(error)) {
      throw error;
    }
    throw handleFetchError(error);
  }
}
```

---

## 7. Type Definitions

### Location: `/frontend/src/types/investigation.ts`

#### BriefingState (Lines 456-465)

```tsx
/**
 * Briefing state tracking for persistence
 */
export interface BriefingState {
  /** Case identifier */
  case_id: string;
  /** Whether the briefing has been completed */
  briefing_completed: boolean;  // <-- Backend-persisted flag
  /** Q&A conversation history */
  conversation_history: BriefingConversation[];
  /** ISO timestamp when briefing was completed */
  completed_at: string | null;
}
```

#### BriefingConversation (Lines 447-451)

```tsx
export interface BriefingConversation {
  /** Player's question */
  question: string;
  /** Moody's answer */
  answer: string;
}
```

**Critical Gap**:
- Backend has `BriefingState` with `briefing_completed` flag
- Frontend's `useBriefing` hook does NOT load or check this flag
- Frontend only tracks local state that resets on reload

---

## 8. Styling & Theme

### Terminal Variant Styling

Located in `/frontend/src/components/ui/Modal.tsx` (Lines 48-75):

**Modal Header**:
```tsx
className={`sticky top-0 px-6 py-4 border-b flex items-center justify-between ${
  isTerminal
    ? 'bg-gray-800 border-gray-700'  // Dark header
    : 'bg-amber-100 border-amber-300'
}`}
```

**Title Text**:
```tsx
className={`text-xl font-bold ${
  isTerminal
    ? 'text-green-400 font-mono'  // Green monospace
    : 'text-amber-900 font-serif'
}`}
```

**Body**:
```tsx
className={`p-6 ${isTerminal ? 'font-mono text-gray-100' : ''}`}
```

---

## 9. Test Files

Comprehensive test coverage exists:

| File | Lines | Coverage |
|------|-------|----------|
| `BriefingModal.test.tsx` | 702 | Component rendering, choices, Q&A, loading, completion |
| `useBriefing.test.ts` | 530+ | Hook state, loading, error handling, API calls |

---

## Root Cause Summary

### Modal Opens on Every Reload

**Why**:
1. App mounts → `useEffect` fires with empty deps
2. Calls `loadBriefing()` → fetches fresh content from backend
3. Checks `if (content && !briefingCompleted)`
4. `briefingCompleted` is local hook state, resets to `false` on mount
5. Condition is always `true` → modal always opens

**Missing Link**:
- Backend stores `briefing_completed` in `BriefingState`
- Frontend doesn't fetch or check this persistent flag
- Solution: Query backend state and only show modal if `briefing_completed === false`

---

## Integration Points

### Data Flow for Modal Opening

```
App.tsx line 122-132
  └─ useEffect (mount)
      └─ loadBriefing() from useBriefing hook
          └─ getBriefing() API call (line 88)
              └─ GET /api/briefing/{caseId}
                  └─ Returns BriefingContent
          └─ Local state: completed = false (line 80)
      └─ Check: if (content && !completed) → TRUE
          └─ setBriefingModalOpen(true)
              └─ Renders Modal with "Case Briefing" title
```

### State Update Flow on Completion

```
User clicks "Start Investigation"
  ↓
onComplete callback (line 496)
  ↓
handleBriefingComplete() (lines 135-138)
  ↓
markBriefingComplete() hook call
  ↓
markBriefingCompleteAPI() → POST /api/briefing/{caseId}/complete
  ↓
Backend updates briefing_completed = true
  ↓
Frontend: setCompleted(true) (local state only)
  ↓
setBriefingModalOpen(false) (modal closes)
```

---

## Files to Modify for Fix

To prevent modal opening on every reload, changes needed in:

1. **`/frontend/src/App.tsx`** (lines 118-132)
   - Check backend briefing state instead of relying on local state

2. **`/frontend/src/hooks/useBriefing.ts`** (lines 69-98)
   - Load `briefing_completed` flag from backend on hook init
   - Store as persistent state

3. **`/frontend/src/api/client.ts`**
   - May need to expose endpoint to check briefing state separately

---

## Summary

| Element | Location | Key Detail |
|---------|----------|-----------|
| **Title Text** | Modal.tsx:74 | `[Case Briefing]` with green-400 color |
| **Title Render** | Modal.tsx:65-75 | Terminal variant adds brackets |
| **Modal Open Logic** | App.tsx:118-132 | **BUG**: Uses local state, not backend state |
| **Completion Flag** | useBriefing.ts:80 | **BUG**: Not persisted, resets on reload |
| **Component** | BriefingModal.tsx | Dialogue UI with teaching moment + Q&A |
| **API Endpoints** | client.ts:701-809 | GET, POST question, POST complete |
| **Backend State** | investigation.ts:456 | Has `briefing_completed` flag |

---

**Analysis Complete**: All Case Briefing modal files identified and documented with code snippets showing exact lines and implementation details.
