# Witness Modal Duplicate Title Analysis

## Issue Summary
The witness interrogation modal renders the witness name twice:
1. **Modal header title** (from Modal component)
2. **Modal content title** (from WitnessInterview component)

This creates visual redundancy with both titles displaying the same information.

---

## File Locations & Code

### 1. App.tsx - Modal Title Prop (Line 508)
**File**: `/Users/danielmedina/Documents/claude_projects/hp_game/frontend/src/App.tsx`

**Lines 503-521**:
```tsx
{/* Witness Interview Modal */}
{witnessModalOpen && witnessState.currentWitness && (
  <Modal
    isOpen={witnessModalOpen}
    onClose={handleWitnessModalClose}
    variant="terminal"
    title={`Interrogating: ${witnessState.currentWitness.name}`}  {/* ← TITLE 1 */}
  >
    <WitnessInterview
      witness={witnessState.currentWitness}
      conversation={witnessState.conversation}
      trust={witnessState.trust}
      secretsRevealed={witnessState.secretsRevealed}
      discoveredEvidence={state?.discovered_evidence ?? []}
      loading={witnessState.loading}
      error={witnessState.error}
      onAskQuestion={askQuestion}
      onPresentEvidence={presentEvidenceToWitness}
    />
  </Modal>
)}
```

**Result**: Modal renders in header as `[Interrogating: Draco Malfoy]` (terminal variant wraps in brackets)

---

### 2. WitnessInterview.tsx - Component Title (Line 231)
**File**: `/Users/danielmedina/Documents/claude_projects/hp_game/frontend/src/components/WitnessInterview.tsx`

**Lines 226-238**:
```tsx
return (
  <Card className="font-mono bg-gray-900 text-gray-100 border-gray-700">
    {/* Witness Header */}
    <div className="border-b border-gray-700 pb-3 mb-4">
      <h2 className="text-xl font-bold text-amber-400 tracking-wide">
        Interrogating: {witness.name}  {/* ← TITLE 2 */}
      </h2>
      {witness.personality && (
        <p className="text-xs text-gray-500 mt-1">
          Personality: {witness.personality}
        </p>
      )}
    </div>
    {/* Rest of component... */}
  </Card>
)
```

**Result**: Component renders inside modal content as `Interrogating: Draco Malfoy` (in amber-400 color)

---

## Modal Component Rendering

### Modal.tsx - Header Rendering (Lines 57-88)
**File**: `/Users/danielmedina/Documents/claude_projects/hp_game/frontend/src/components/ui/Modal.tsx`

**Key part** (lines 65-75):
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
    {isTerminal ? `[${title}]` : title}  {/* ← WRAPS IN BRACKETS FOR TERMINAL */}
  </h2>
)}
```

**Result for terminal variant**:
- Modal header: `[Interrogating: Draco Malfoy]` (green-400, monospace)
- Modal body: `Interrogating: Draco Malfoy` (amber-400, inside Card)

---

## Visual Hierarchy

Current rendering structure:
```
┌─────────────────────────────────────────┐
│ [Interrogating: Draco Malfoy]           │  ← TITLE 1 (Modal header)
├─────────────────────────────────────────┤
│                                         │
│  Interrogating: Draco Malfoy           │  ← TITLE 2 (Card header inside)
│  Personality: Cunning, ambitious       │
│                                         │
│  [Trust Level: 45%]                     │
│  ▓▓▓▓░░░░░░░░░░░░░░░░                  │
│                                         │
│  ...conversation...                     │
│                                         │
└─────────────────────────────────────────┘
```

---

## Component Hierarchy

```
Modal (UI wrapper)
  ├─ Header: "[Interrogating: Draco Malfoy]"  (Terminal variant with brackets)
  └─ Body:
      └─ WitnessInterview (Card component)
          ├─ Header: "Interrogating: Draco Malfoy"  (Inside card)
          ├─ TrustMeter
          ├─ SecretRevealedToast
          ├─ Conversation history
          ├─ Evidence menu
          └─ Question input
```

---

## Design Issues

1. **Visual Redundancy**: Same text appears twice with different styling
2. **Space Inefficiency**: Duplicate title uses valuable modal space
3. **Styling Mismatch**:
   - Modal header: green-400, monospace, bracketed
   - Card header: amber-400, bold, no brackets
4. **Unclear Visual Hierarchy**: Two prominent headers confuse focus

---

## Solutions

### Option 1: Remove Modal Title
Remove `title` prop from Modal in App.tsx, rely on WitnessInterview header only.

**Change**:
```tsx
<Modal
  isOpen={witnessModalOpen}
  onClose={handleWitnessModalClose}
  variant="terminal"
  // Remove: title={`Interrogating: ${witnessState.currentWitness.name}`}
>
```

**Pros**: Cleaner modal, single title source
**Cons**: Loses visual feedback in modal header

### Option 2: Remove WitnessInterview Internal Title
Remove the h2 header from WitnessInterview, use Modal title only.

**Change**:
```tsx
// Remove this block from WitnessInterview:
<div className="border-b border-gray-700 pb-3 mb-4">
  <h2 className="text-xl font-bold text-amber-400 tracking-wide">
    Interrogating: {witness.name}
  </h2>
  {witness.personality && (
    <p className="text-xs text-gray-500 mt-1">
      Personality: {witness.personality}
    </p>
  )}
</div>
```

**Pros**: Clean separation, modal title handles identification
**Cons**: Loses personality info display, removes internal structure

### Option 3: Consolidate Headers
Move personality info to modal title or create styled subtitle.

**Change**:
```tsx
title={`Interrogating: ${witnessState.currentWitness.name}${witnessState.currentWitness.personality ? ` (${witnessState.currentWitness.personality})` : ''}`}
```

**Pros**: Unified header, all info in one place
**Cons**: Long title, formatting challenges

### Option 4: Keep Only Modal Title, Enhance Content
Use Modal title only, style WitnessInterview as a minimal content card.

---

## Test Case

From: `/Users/danielmedina/Documents/claude_projects/hp_game/frontend/src/components/__tests__/WitnessInterview.test.tsx`

**Line 76**:
```typescript
expect(screen.getByText(/Interrogating: Hermione Granger/i)).toBeInTheDocument();
```

This test expects the WitnessInterview internal title. After any fix, this test may need updating.

---

## Summary Table

| Location | Component | Text | Line | Styling |
|----------|-----------|------|------|---------|
| Modal Header | `Modal.tsx` | `[Interrogating: Draco Malfoy]` | 74 | green-400, monospace, bracketed |
| Card Header | `WitnessInterview.tsx` | `Interrogating: Draco Malfoy` | 231 | amber-400, bold |
| Card Subtitle | `WitnessInterview.tsx` | `Personality: Cunning, ambitious` | 235 | gray-500, small text |

---

## Affected Files

1. **Frontend/src/App.tsx** (Lines 503-521)
   - Modal instantiation with title prop

2. **Frontend/src/components/WitnessInterview.tsx** (Lines 226-238)
   - Component internal header rendering

3. **Frontend/src/components/ui/Modal.tsx** (Lines 57-88)
   - Modal header rendering logic

4. **Frontend/src/components/__tests__/WitnessInterview.test.tsx** (Line 76)
   - Test expecting internal title text

