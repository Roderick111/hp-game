# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Milestone 7: Integration Testing & Playtesting

## [0.6.0] - 2026-01-01

### Added
- **Phase Transition Animations** (`src/components/ui/PhaseTransition.tsx`)
  - Smooth entrance animations for game phases (fade, slide-up, slide-down variants)
  - Configurable duration and delay
  - Built with framer-motion for performance
- **Metric Card Component** (`src/components/ui/MetricCard.tsx`)
  - Educational tooltips explaining what each scoring metric means
  - Visual score indicators (progress bars, color coding)
  - Consistent styling across Case Review phase
- **Evidence-Hypothesis Relevance System**
  - `src/components/ui/HypothesisRelevanceBadge.tsx` - Visual badges showing evidence impact
  - `src/utils/evidenceRelevance.ts` - Pure functions for calculating relevance scores
  - Displays which hypotheses each piece of evidence supports/contradicts
- **Phase Transition Hook** (`src/hooks/usePhaseTransition.ts`)
  - Manages animation state between game phases
  - Coordinates enter/exit animations
- **75 new unit tests** covering all UI/UX components and utilities

### Changed
- **HypothesisFormation.tsx** - Staggered card animations, tier badges, locked hypothesis styling
- **Investigation.tsx** - PhaseTransition wrapper, animated IP counter with visual depletion, evidence-hypothesis linking indicators
- **CaseReview.tsx** - MetricCard integration, staggered reveal animations, educational tooltips for all metrics
- **UnlockToast.tsx** - Enhanced with framer-motion animations, proper ARIA live regions
- **ContradictionPanel.tsx** - Dramatic entrance animation, shake effect on contradictions, enhanced accessibility
- **EvidenceCard.tsx** - Integrated hypothesis relevance badges showing evidence impact
- **tailwind.config.js** - Added phase-fade-in, phase-slide-up, phase-slide-down, toast-slide-in, ip-pulse animations

### Accessibility
- ARIA live regions for dynamic content updates (unlocks, contradictions)
- `prefers-reduced-motion` support - animations gracefully degrade
- Proper focus management during phase transitions
- Screen reader announcements for game state changes

### Technical Details
- Total test count: 264 (75 new + 189 existing)
- All validation gates passing (TypeScript, ESLint, Vitest)
- Bundle size remains under performance budget

## [0.5.0] - 2026-01-01

### Added
- **Mission 1 Case Redesign** with conditional hypotheses and contradictions
- `CaseData.contradictions` field in `src/types/game.ts` for case-level contradiction definitions
- 7 hypotheses in Mission 1: 4 Tier 1 (immediately available), 3 Tier 2 (unlockable)
- 4 distinct unlock paths for the correct answer (cursed-violin hypothesis)
- 3 narrative contradictions that guide players toward the truth:
  - `c1-victor-love`: Victor's protective behavior vs. guilty hypothesis
  - `c2-no-wand-magic`: No wand found vs. standard curse hypothesis
  - `c3-instrument-access`: Violin access pattern vs. external threat
- Comprehensive test suite for Mission 1 case data (`src/data/__tests__/mission1.test.ts`)
- 34 new unit tests covering case structure, unlock paths, contradictions, and IP economy

### Changed
- `src/data/mission1.ts` - Complete redesign with ConditionalHypothesis types
- Tier assignments: victor-guilty, helena-guilty, lucius-involved, something-else (Tier 1); cursed-violin, self-inflicted, unknown-person (Tier 2)
- IP economy balanced at 12 total Investigation Points

### Technical Details
- Total test count: 189 (34 new + 155 existing)
- All validation gates passing (TypeScript, ESLint, Vitest)

## [0.4.0] - 2025-12-31

### Added
- **Contradiction Detection System** (`src/utils/contradictions.ts`)
  - 6 pure functions for detecting and managing evidence contradictions
  - `detectContradictions()` - Find conflicts in collected evidence
  - `isContradictionResolved()` - Check resolution status
  - `getContradictionsByEvidence()` - Filter by evidence piece
  - `calculateContradictionScore()` - Score contradiction handling
- **Enhanced Scoring Metrics** (`src/utils/scoring.ts`)
  - `calculateInvestigationEfficiency()` - IP value analysis
  - `calculatePrematureClosureScore()` - Early closure detection
  - `calculateContradictionResolutionScore()` - Resolution tracking
  - `calculateTierDiscoveryScore()` - Hypothesis tier rewards
- `ContradictionPanel.tsx` - Visual component for contradiction display with animations
- 86 new unit tests across contradiction detection, scoring, and UI components

### Changed
- `src/types/game.ts` - Extended PlayerScores, added GameAction types for contradictions
- `Investigation.tsx` - Integrated real-time contradiction detection
- `CaseReview.tsx` - New metrics display for enhanced scoring
- `tailwind.config.js` - Added pulse and shake animations

## [0.3.0] - 2025-12-31

### Added
- **Conditional Unlocking System** (`src/utils/unlocking.ts`)
  - 5 pure evaluation functions for hypothesis unlock logic
  - Threshold-based unlock evaluation
  - Support for multiple unlock paths per hypothesis
- `UnlockToast.tsx` - Toast notification component for unlock feedback
- `useUnlockNotifications.ts` - React hook for unlock trigger management
- 61 unit tests for unlocking logic and UI components

### Changed
- `GameContext.tsx` - Added reducer cases for unlock actions
- `HypothesisFormation.tsx` - Integrated tier system for hypothesis display
- `Investigation.tsx` - Trigger unlock checks on evidence collection
- `tailwind.config.js` - Added unlock animations

## [0.2.0] - 2025-12-28

### Added
- **Enhanced Type System** (`src/types/enhanced.ts`)
  - `ConditionalHypothesis` interface with unlock requirements and tier assignments
  - `Contradiction` interface for evidence conflict tracking
  - `UnlockEvent` interface for trigger tracking
  - Extended `PlayerState` for hypothesis tiers and contradiction tracking
- `src/types/enhanced.fixtures.ts` - Test data for enhanced mechanics

## [0.1.0] - 2025-12-27

### Added
- Initial prototype clone and analysis
- Basic game loop with 6 phases: Briefing, Hypothesis Formation, Investigation, Prediction, Resolution, Case Review
- Core type definitions (`CaseData`, `PlayerState`, `GameAction`)
- React Context + useReducer state management
- Basic scoring system (Calibration + Confirmation Bias metrics)
- Mission 1 placeholder data
- Tailwind CSS styling
- Vitest testing setup

---

[Unreleased]: https://github.com/user/hp_game/compare/v0.6.0...HEAD
[0.6.0]: https://github.com/user/hp_game/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/user/hp_game/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/user/hp_game/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/user/hp_game/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/user/hp_game/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/user/hp_game/releases/tag/v0.1.0
