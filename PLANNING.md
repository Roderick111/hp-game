# HP Game - Project Planning

*This document must be kept up-to-date, accurate, and very concise.*

## Project Overview

**Auror Academy: Case Files** - A sophisticated detective game teaching rationality through morally complex investigations in the Harry Potter universe. Players solve cases requiring evidence synthesis, contradiction resolution, and probabilistic thinking while learning to recognize cognitive biases.

**Target**: Adults seeking cerebral mysteries with educational value

---

## Architecture

### Tech Stack

- **Language**: TypeScript
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS + PostCSS
- **State Management**: React Context + useReducer
- **Testing**: Vitest (unit) + React Testing Library
- **Type Checking**: TypeScript strict mode
- **Package Manager**: npm

### Directory Structure

```
hp_game/
├── src/
│   ├── types/
│   │   ├── game.ts              # Core type definitions
│   │   └── enhanced.ts          # NEW: Enhanced mechanics types
│   ├── data/
│   │   ├── mission1.ts          # Mission 1 case data
│   │   └── missions/            # NEW: Future missions
│   ├── context/
│   │   └── GameContext.tsx      # Game state management
│   ├── hooks/
│   │   └── useGame.ts           # Game state hook
│   ├── utils/
│   │   ├── scoring.ts           # Scoring algorithms
│   │   ├── unlocking.ts         # NEW: Conditional unlock logic
│   │   └── contradictions.ts    # NEW: Contradiction detection
│   ├── components/
│   │   ├── ui/                  # Reusable UI components
│   │   ├── layout/              # Shell and header
│   │   ├── phases/              # 6 phase components
│   │   └── enhanced/            # NEW: Enhanced mechanics UI
│   │       ├── HypothesisTiers.tsx
│   │       ├── ContradictionPanel.tsx
│   │       └── UnlockNotification.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .claude/                     # Claude Code config
├── PRPs/                        # Product requirement plans
├── GAME_DESIGN.md              # Game design document
├── PLANNING.md                 # This file
└── TASK.md                     # Task tracking
```

---

## Design Decisions

### State Management

**Choice**: React Context + useReducer (no external libraries)

**Rationale**:
- Game state is moderately complex but self-contained
- No need for Redux/Zustand overhead
- Keeps bundle size minimal
- Easy to debug and understand

### Data Model Strategy

**Enhanced types extend prototype**:
- Keep existing `CaseData`, `PlayerState`, `GameAction` interfaces
- Add new interfaces for enhanced mechanics (`ConditionalHypothesis`, `Contradiction`, etc.)
- Backward compatible - prototype still works while enhancing

### Component Architecture

**Phase-based structure**:
- Each game phase is isolated component
- Shared UI in `components/ui/`
- Enhanced mechanics in `components/enhanced/`
- Clean separation of concerns

---

## Key Milestones

### Milestone 1: Enhanced Type System
**Goal**: Extend data model for new mechanics

**Tasks**:
- Create `types/enhanced.ts` with new interfaces
- Add `ConditionalHypothesis` type (unlock requirements, threshold system)
- Add `Contradiction` type (evidence conflicts, resolution status)
- Add `UnlockEvent` type (trigger tracking)
- Extend `PlayerState` for hypothesis tiers and contradiction tracking

---

### Milestone 2: Conditional Unlocking System
**Goal**: Implement hypothesis tier mechanics

**Tasks**:
- Build `utils/unlocking.ts` - threshold evaluation logic
- Update `GameContext` reducer - handle unlock actions
- Create `HypothesisTiers.tsx` component - visual tier separation
- Create `UnlockNotification.tsx` - "New hypothesis unlocked!" feedback
- Update `HypothesisFormation.tsx` - integrate tier system

---

### Milestone 3: Contradiction Detection
**Goal**: Implement evidence contradiction mechanics

**Tasks**:
- Build `utils/contradictions.ts` - detect conflicting evidence
- Create `ContradictionPanel.tsx` - show conflicts to player
- Update `Investigation.tsx` - highlight contradictions when found
- Add contradiction resolution tracking to state
- Update scoring to reward contradiction resolution

---

### Milestone 4: Enhanced Scoring
**Goal**: Expand metrics beyond confirmation bias

**Tasks**:
- Extend `calculateScores()` with new metrics
- Add `calculateInvestigationEfficiency()` - IP value analysis
- Add `calculatePrematureClosureScore()` - did player stop too early?
- Update `CaseReview.tsx` - display new metrics
- Add tier-based scoring (reward Tier 2 discovery)

---

### Milestone 5: Mission 1 Case Design
**Goal**: Create enhanced Mission 1 with new mechanics

**Tasks**:
- Design case plot (confidential from player)
- Write case data with conditional hypotheses
- Create 2-3 contradictions with resolutions
- Design 2-3 unlock paths per Tier 2 hypothesis
- Balance IP economy (12 IP, 16-20 actions)
- Playtest and tune difficulty

---

### Milestone 6: UI/UX Polish (COMPLETE)
**Goal**: Make enhanced mechanics feel natural

**Completed**:
- Phase transition animations with framer-motion (fade, slide-up, slide-down)
- Evidence-hypothesis relevance linking with visual badges
- Dramatic unlock/contradiction feedback with animations
- Educational metric tooltips in Case Review phase
- IP counter visual depletion with animations
- Full accessibility support (ARIA live regions, prefers-reduced-motion)
- 75 new tests (264 total)

---

### Milestone 7: Testing & Validation
**Goal**: Ensure quality and balance

**Tasks**:
- Unit tests for unlocking logic
- Unit tests for contradiction detection
- Unit tests for scoring algorithms
- Integration tests for full case flow
- Playtest for difficulty balance
- Playtest for educational effectiveness

---

## Technical Constraints

### Performance
- Bundle size target: <500KB (current prototype is ~200KB)
- First paint: <2s on 3G connection
- No backend dependency for MVP

### Browser Support
- Modern browsers only (ES2020+)
- No IE11 support needed
- Mobile-responsive but desktop-first

### Scalability Considerations
- Case data structure supports procedural generation (future)
- State management can migrate to external store if needed
- Component architecture supports code-splitting

---

## Code Style & Conventions

### TypeScript
- Strict mode enabled
- No `any` types (use `unknown` if necessary)
- Explicit return types on functions
- Interfaces over type aliases for objects

### React
- Functional components only
- Custom hooks for shared logic
- Props interfaces defined inline or in separate file if reused
- Avoid prop drilling - use Context where appropriate

### Naming
- Components: PascalCase
- Files: PascalCase for components, camelCase for utilities
- Functions: camelCase with verb prefixes (calculate, detect, update)
- Types: PascalCase with descriptive names

### File Organization
- One component per file
- Colocate types used only in that component
- Shared types in `types/`
- Utils are pure functions (no side effects)

---

## Implementation Strategy

### Phase 1: Foundation (Extend Prototype)
- Add enhanced types
- Implement unlocking logic
- Implement contradiction detection
- No UI changes yet (backend logic only)

### Phase 2: UI Integration
- Create new components for enhanced features
- Update existing phase components
- Add visual feedback for new mechanics

### Phase 3: Case Design
- Design Mission 1 plot with new mechanics
- Create case data structure
- Balance difficulty

### Phase 4: Testing & Polish
- Comprehensive testing
- UI/UX refinement
- Difficulty tuning based on playtests

---

## Migration from Prototype

### Keep As-Is
- Basic type structure (`CaseData`, `PlayerState`, `GameAction`)
- Phase component structure
- UI components (Card, Button, etc.)
- Scoring foundation
- Context/reducer pattern

### Extend
- Types (add enhanced mechanics)
- Reducer (add unlock/contradiction actions)
- Scoring (add new metrics)
- Phase components (integrate new features)

### Replace
- `mission1.ts` - redesign with enhanced mechanics
- Scoring display - show more metrics
- Hypothesis formation UI - add tier system

### Add New
- Unlocking logic (`utils/unlocking.ts`)
- Contradiction detection (`utils/contradictions.ts`)
- Enhanced UI components (`components/enhanced/`)
- New case data files

---

## Success Criteria

### MVP Complete When:
- [x] Enhanced type system implemented
- [x] Conditional unlocking works (2+ paths per unlock) - 69 tests
- [x] Contradiction detection functional - 58 tests
- [x] Enhanced scoring calculates all metrics - 28 tests
- [x] Mission 1 redesigned with new mechanics - 34 tests
- [x] UI shows tiers, unlocks, contradictions clearly - 75 tests
- [x] All tests passing (264 total)
- [ ] Playable end-to-end with good UX (Milestone 7)

### Quality Gates:
- TypeScript compiles with no errors
- All unit tests pass
- Playtest by 2+ people shows:
  - Mechanics are understandable
  - Difficulty is challenging but fair
  - Educational goals are met (bias reduction visible in debrief)

---

## Future Roadmap (Post-MVP)

### Mission 2-6 Development
- One new mechanic per mission (see GAME_DESIGN.md)
- Progressive complexity curve
- Thematic variety

### Backend Integration
- User accounts and progression tracking
- Save/load game state
- Cross-device sync

### Advanced Features
- Case editor for community cases
- Procedural case generation
- Multiplayer cooperative mode
- Analytics dashboard

### Platform Expansion
- Mobile app (React Native)
- Offline mode
- Desktop app (Electron)

---

## Current Status

**Version**: 0.6.0 (264 tests passing)
**Last Updated**: 2026-01-01

**Completed**:
- Milestone 1: Enhanced Type System
- Milestone 2: Conditional Unlocking (69 tests)
  - `src/utils/unlocking.ts` - 5 pure evaluation functions
  - `src/hooks/useUnlockNotifications.ts` - unlock trigger hook
  - `src/components/ui/UnlockToast.tsx` - toast notification component
- Milestone 3: Contradiction Detection (58 tests)
  - `src/utils/contradictions.ts` - 6 pure detection functions
  - `src/components/ui/ContradictionPanel.tsx` - contradiction display component
  - Integrated into Investigation phase with real-time detection
- Milestone 4: Enhanced Scoring (28 tests)
  - `calculateInvestigationEfficiency()` - IP value analysis
  - `calculatePrematureClosureScore()` - early closure detection
  - `calculateContradictionResolutionScore()` - resolution tracking
  - `calculateTierDiscoveryScore()` - hypothesis tier rewards
  - Updated CaseReview phase with new metrics display
- Milestone 5: Mission 1 Case Redesign (34 tests)
  - `src/types/game.ts` - Added `contradictions` field to CaseData
  - `src/data/mission1.ts` - Redesigned with conditional hypotheses
  - 7 hypotheses: 4 Tier 1 (initial), 3 Tier 2 (unlockable)
  - Correct answer (cursed-violin) in Tier 2 with 4 unlock paths
  - 3 narrative contradictions pointing toward truth
  - Balanced IP economy (12 IP total)
  - `src/data/__tests__/mission1.test.ts` - comprehensive test coverage
- Milestone 6: UI/UX Polish (75 tests)
  - `src/components/ui/PhaseTransition.tsx` - Phase entrance animations
  - `src/components/ui/MetricCard.tsx` - Metric display with educational tooltips
  - `src/components/ui/HypothesisRelevanceBadge.tsx` - Evidence-hypothesis relevance badges
  - `src/utils/evidenceRelevance.ts` - Pure functions for relevance calculation
  - `src/hooks/usePhaseTransition.ts` - Phase transition state management
  - Enhanced phase components (HypothesisFormation, Investigation, CaseReview)
  - Framer Motion animations with ARIA accessibility
  - `prefers-reduced-motion` support throughout

**Next Up**:
- Milestone 7: Integration Testing & Playtesting
