# Investigation Page Layout Redesign - PRP

## Goal
Redesign investigation page to improve visual hierarchy, reduce cognitive load, and create clearer separation between primary (narrative), secondary (context), and tertiary (reference) information.

## Why
- **User value**: Cleaner interface → easier to focus on investigation → better learning experience
- **Aligns with**: Phase 6.5 UI/UX & Visual Polish (STATUS.md)

## What

**User-Visible Behavior:**
Players see a redesigned investigation layout with:
- **Header**: Unframed location description (left) + larger location illustration (right) + horizontal location tabs below
- **Main area**: 70% central narrative panel (conversation history, input) + 30% compact sidebar (witnesses names only, evidence item names only, quick help)
- **Cleaner data**: Trust % removed from witness list, "recently discovered" tags removed from evidence

**Technical Requirements:**
- Transform `LocationSelector` from vertical sidebar list → horizontal tabs in header
- Move location context (name + description) from `LocationView` → new header area
- Adjust grid layout: header (full width) + main (70/30 split)
- Remove trust percentages from `WitnessSelector` display (keep in modal)
- Simplify `EvidenceBoard` to show item names only (details in modal)

**Success Criteria:**
- [ ] Location context in header with horizontal tabs
- [ ] Central narrative panel occupies 70% width
- [ ] Sidebar panels compact (names/items only, no extra metadata)
- [ ] Trust % only visible in WitnessInterview modal, not sidebar
- [ ] Layout responsive on mobile (stack vertically)
- [ ] All existing keyboard shortcuts (1-3 for locations) still work
- [ ] Tests/lint pass, no regressions

---

## Quick Reference

**Current Layout** (from CODEBASE_RESEARCH.md):
```tsx
// App.tsx Line 718-814: Current 2-column grid
<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
  <div className="lg:col-span-2">
    <LocationView {...} />  // Contains: location name, desc, conversation, input
  </div>
  <div className="space-y-4">
    <LocationSelector {...} />  // Vertical list with [1] ▸ Library
    <WitnessSelector {...} />   // Shows Trust: [████░░] 76%, 2 secrets
    <EvidenceBoard {...} />     // Shows evidence items
    <TerminalPanel>QUICK HELP</TerminalPanel>
  </div>
</div>
```

**Design Tokens** (terminal-theme.ts):
```typescript
// Always use these, NEVER hardcode Tailwind classes
TERMINAL_THEME.colors.text.primary       // text-white (headers)
TERMINAL_THEME.colors.text.secondary     // text-gray-200 (body)
TERMINAL_THEME.colors.interactive.text   // text-amber-400 (links)
TERMINAL_THEME.colors.bg.primary         // bg-gray-900 (main bg)
TERMINAL_THEME.spacing.panelGap          // mb-6 (between panels)
TERMINAL_THEME.typography.header         // text-white font-mono uppercase...
TERMINAL_THEME.symbols.current           // '▸' (active indicator)
```

**Reusable Components** (DO NOT recreate):
```tsx
// TerminalPanel - Use for all panels (collapsible, localStorage persistence)
<TerminalPanel
  title="WITNESSES"
  subtitle={`${witnesses.length} AVAILABLE`}
  collapsible={true}
  defaultCollapsed={false}
  persistenceKey="sidebar-witness-selector"
>
  {children}
</TerminalPanel>

// Modal - All overlays (witness interview, evidence details, etc.)
<Modal isOpen={open} onClose={close} title="TITLE" variant="terminal">
  {content}
</Modal>
```

**State Management Hooks** (DO NOT modify):
- `useInvestigation` (lines 421-431 in research) - Manages investigation state, auto-fetches location data
- `useLocation` (lines 434-457) - Manages location list, current selection, keyboard shortcuts
- `useWitnessInterrogation` (lines 460-488) - Witness state, trust, secrets (keep trust logic, just hide from sidebar)

**Layout Patterns**:
```tsx
// Responsive grid (use this pattern)
grid grid-cols-1 lg:grid-cols-3 gap-4    // 3-column grid
lg:col-span-2                             // Span 2 of 3 columns
space-y-4                                 // Vertical spacing between panels

// Horizontal tabs (new pattern needed)
flex gap-2                                // Horizontal layout
border-b-2 border-amber-500               // Active tab indicator
```

**Critical Gotchas:**
- Issue: Keyboard shortcuts (1-3) currently target vertical list → Solution: Keep same data-index logic, just style horizontally
- Issue: LocationView includes location name/desc at top → Solution: Extract to header, leave only conversation + input
- Issue: WitnessSelector shows trust bars → Solution: Keep data in state, hide from render (still show in modal)
- Issue: MAX_HISTORY_LENGTH = 5 prevents DOM bloat → Solution: Keep this limit, don't increase

**New Dependencies:**
- None (all needed components and patterns exist)

---

## Files to Create/Modify

| File | Action | Purpose | Follow Pattern From |
|------|--------|---------|---------------------|
| `frontend/src/components/layout/InvestigationLayout.tsx` | CREATE | Orchestrates 3-part layout (header + main + sidebar) | `App.tsx` (L718-814) grid pattern |
| `frontend/src/components/LocationHeaderBar.tsx` | CREATE | Horizontal location tabs + context area | `LocationSelector.tsx` + `LocationView.tsx` (L400-410) |
| `frontend/src/App.tsx` | MODIFY | Replace grid layout with InvestigationLayout wrapper | Existing grid pattern, same file |
| `frontend/src/components/LocationView.tsx` | MODIFY | Remove location name/description header (moved to LocationHeaderBar) | Existing pattern, L396-410 removal |
| `frontend/src/components/WitnessSelector.tsx` | MODIFY | Hide trust bars and secret counts from display | Existing render, hide `trust` and `secrets_revealed` |
| `frontend/src/components/EvidenceBoard.tsx` | MODIFY | Simplify to item names only (no extra metadata) | Existing evidence list, keep minimal |

---

## Tasks

### 1. Create InvestigationLayout Wrapper Component
- **File**: `frontend/src/components/layout/InvestigationLayout.tsx`
- **Action**: CREATE
- **What**: Orchestrates 3-part layout (header + 70/30 main grid + sidebar)
- **Pattern**: Follow `App.tsx` (L718-814) grid structure
- **Implementation**:
  ```tsx
  // Props: header (ReactNode), mainContent (ReactNode), sidebar (ReactNode)
  // Structure:
  // <div className="space-y-4">
  //   <div>{header}</div>
  //   <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
  //     <div className="lg:col-span-7">{mainContent}</div>
  //     <div className="lg:col-span-3 space-y-4">{sidebar}</div>
  //   </div>
  // </div>
  ```
- **Depends**: None

### 2. Create LocationHeaderBar Component
- **File**: `frontend/src/components/LocationHeaderBar.tsx`
- **Action**: CREATE
- **What**: Horizontal location tabs + location name/description area (no illustration yet)
- **Pattern**: Extract from `LocationView.tsx` (L396-410) + transform `LocationSelector.tsx` to horizontal
- **Implementation**:
  ```tsx
  // Props: locations, currentLocationId, locationData (name, description), onSelectLocation
  // Structure:
  // <div className="space-y-3">
  //   <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
  //     <div className="lg:col-span-2">
  //       <h2>{locationData.name}</h2>
  //       <p>{locationData.description}</p>
  //     </div>
  //     <div className="lg:col-span-1">
  //       {/* Reserved for location illustration (Phase 6.5 future) */}
  //       <div className="h-32 bg-gray-800/30 border border-gray-700 rounded" />
  //     </div>
  //   </div>
  //   <div className="flex gap-2 border-b border-gray-700 pb-2">
  //     {locations.map((loc, idx) => (
  //       <button
  //         className={currentLocationId === loc.id ? 'border-b-2 border-amber-500' : ''}
  //         onClick={() => onSelectLocation(loc.id)}
  //       >
  //         {currentLocationId === loc.id ? '▸' : '·'} {loc.name}
  //       </button>
  //     ))}
  //   </div>
  // </div>
  ```
- **Depends**: Task 1 (InvestigationLayout exists)

### 3. Modify App.tsx Layout
- **File**: `frontend/src/App.tsx`
- **Action**: MODIFY
- **What**: Replace current grid with InvestigationLayout wrapper
- **Pattern**: Existing grid (L718-814), same components passed as props
- **Implementation**:
  ```tsx
  // Replace lines 718-814 with:
  // <InvestigationLayout
  //   header={<LocationHeaderBar locations={} currentLocationId={} locationData={} onSelect={} />}
  //   mainContent={<LocationView {...} showLocationHeader={false} />}
  //   sidebar={
  //     <>
  //       <WitnessSelector {...} />
  //       <EvidenceBoard {...} />
  //       <TerminalPanel title="QUICK HELP">...</TerminalPanel>
  //     </>
  //   }
  // />
  ```
- **Depends**: Tasks 1-2 (new components created)

### 4. Modify LocationView to Remove Header
- **File**: `frontend/src/components/LocationView.tsx`
- **Action**: MODIFY
- **What**: Remove location name and description from component (Lines 396-410)
- **Pattern**: Keep conversation history + input + quick actions, remove header section
- **Implementation**:
  ```tsx
  // Remove lines 396-410 (location name, description, separator)
  // Start component with conversation history directly
  // Optional: Add prop `showLocationHeader?: boolean` to conditionally show (default false)
  ```
- **Depends**: Task 2 (LocationHeaderBar handles this now)

### 5. Simplify WitnessSelector Display
- **File**: `frontend/src/components/WitnessSelector.tsx`
- **Action**: MODIFY
- **What**: Hide trust percentage and secret count from sidebar display
- **Pattern**: Keep data in state, render name only
- **Implementation**:
  ```tsx
  // WitnessCard component: Remove trust bar and "2 secrets revealed" line
  // Show only: [4] Hannah Abbott (name + keyboard shortcut)
  // Keep full details (trust, secrets) in WitnessInterview modal (don't touch)
  ```
- **Depends**: None

### 6. Simplify EvidenceBoard Display
- **File**: `frontend/src/components/EvidenceBoard.tsx`
- **Action**: MODIFY
- **What**: Show only evidence item names (no metadata or tags)
- **Pattern**: Minimal list, click to open modal for details
- **Implementation**:
  ```tsx
  // Remove any "recently discovered" tags or extra metadata
  // Show only: • Hidden Note (formatted name)
  // Keep click-to-open modal (don't modify EvidenceModal)
  ```
- **Depends**: None

---

## Agent Orchestration

**Execution:**
1. `react-vite-specialist` or `frontend-design` → Tasks 1-6 (can parallelize Tasks 5-6, but 1-4 sequential)
2. `validation-gates` → Run type check, lint, tests
3. `documentation-manager` → Update CHANGELOG.md with redesign notes (if significant changes)

**Estimated Time:**
- Tasks 1-2: 2-3 hours (new components)
- Tasks 3-4: 1 hour (modifications)
- Tasks 5-6: 30 min (hide fields)
- Validation: 15 min
- **Total**: ~4 hours

---

## Design Specifications

### Layout Proportions
```
HEADER (full width):
├─ Location context: 66% (2/3)
│  ├─ Name (h2, text-xl)
│  └─ Description (p, text-sm)
└─ Illustration area: 33% (1/3) - placeholder for Phase 6.5

HORIZONTAL TABS (full width):
├─ Tab buttons (flex gap-2)
├─ Active: border-b-2 border-amber-500
└─ Inactive: border-b-2 border-transparent hover:border-gray-500

MAIN CONTENT (70/30 split):
├─ Narrative panel: 70% (lg:col-span-7 of 10)
│  ├─ Conversation history (max-h-96 overflow-y-auto)
│  ├─ Input textarea
│  └─ Quick actions grid
└─ Sidebar: 30% (lg:col-span-3 of 10)
   ├─ Witnesses (names only, collapsible)
   ├─ Evidence (items only, collapsible)
   └─ Quick help (collapsible)
```

### Typography Hierarchy
```
Location name:        text-xl font-bold (from theme.typography.headerLg)
Location description: text-sm text-gray-200 (from theme.typography.body)
Tab buttons:          text-sm uppercase (from theme.typography.header)
Sidebar titles:       text-sm uppercase (from TerminalPanel default)
Witness names:        text-amber-400 (from theme.colors.interactive.text)
Evidence items:       text-amber-400 (same)
```

### Spacing & Visual Weight
```
Header to tabs:       mb-3 (from theme.spacing.sectionGap)
Tabs to main:         mb-6 (from theme.spacing.panelGap)
Panels in sidebar:    space-y-4 (existing pattern)
Tab padding:          px-4 py-2 (standard button padding)
Active tab border:    border-b-2 (visual weight for selected state)
```

### Responsive Breakpoints
```
Mobile (<1024px):     Stack all vertically (grid-cols-1)
Desktop (≥1024px):    3-part layout (header full, 70/30 main)
                      Horizontal tabs visible only on desktop
                      Mobile: Tabs vertical or dropdown (optional future)
```

---

**Confidence**: 9/10 | **Generated**: 2026-01-17 | **Validated**: ✅ Aligned with PLANNING.md Phase 6.5

**Notes**:
- Location illustration placeholder added (ready for Phase 6.5 artwork)
- All existing keyboard shortcuts preserved (1-3 for locations)
- No new dependencies needed (pure layout reorganization)
- KISS principle: Reuse TerminalPanel, Modal, hooks - no reinvention
- Mobile responsive handled by Tailwind grid breakpoints
