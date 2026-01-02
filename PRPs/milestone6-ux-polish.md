# Milestone 6: UI/UX Polish and Game Flow Improvements - Product Requirement Plan

## Goal

Transform the Auror Academy game from a functional prototype into a polished, engaging player experience by fixing critical UX issues, adding dramatic feedback moments (unlocks, contradictions), improving information architecture, and making the game flow feel coherent and strategic. This milestone focuses exclusively on the presentation layer and user experience without changing core game mechanics.

**End State**: Players experience a cohesive, dramatic detective game where unlocks create "aha!" moments, contradictions feel integrated into investigation flow, IP economy creates meaningful tension, and every phase transition feels deliberate and polished.

---

## Why

### Business Value
- **Playability**: Current game flow feels broken and incoherent (user feedback)
- **Retention**: Unlock moments and dramatic feedback create memorable experiences
- **Educational Impact**: Clear information architecture helps players learn rationality principles
- **Polish**: Professional animations and transitions signal quality

### User Impact
- **Confusion → Clarity**: Players understand what they can do and why
- **Passive → Active**: Hypothesis Formation becomes interactive planning, not just viewing
- **Hidden → Dramatic**: Unlocks and contradictions become highlight moments
- **Generic → Strategic**: IP economy creates meaningful decision tension
- **Numbers → Learning**: Case Review metrics teach rationality concepts

### Problems Solved
1. **Hypothesis Formation is passive** - Players can't tell what they're supposed to do
2. **Investigation lacks strategy** - No evidence-hypothesis linking, no path planning
3. **Unlocks don't create impact** - Toast may not appear, no build-up or drama
4. **Contradictions feel disconnected** - Panel exists but doesn't integrate into flow
5. **IP economy lacks tension** - Doesn't feel scarce or strategic
6. **Case Review feels hollow** - Metrics shown as numbers without context

---

## What

### User-Visible Behavior Changes

#### Before (Milestone 5 State)
```
Hypothesis Formation:
❌ Shows locked hypotheses with gray cards
❌ No selection or investigation planning
❌ Just displays hypotheses passively

Investigation:
❌ Evidence cards show minimal info (title, cost)
❌ No visual link between evidence and hypotheses
❌ Contradiction panel exists but feels separate
❌ Unlock toast may or may not appear
❌ IP economy feels arbitrary

Case Review:
❌ Shows numeric metrics without context
❌ No educational explanations
❌ Doesn't connect metrics to player decisions
```

#### After (Milestone 6 Target)
```
Hypothesis Formation:
✅ Interactive hypothesis selection (toggle on/off)
✅ Locked Tier 2 hypotheses show as dramatic placeholder cards
✅ Visual tier distinction (badges, styling)
✅ Investigation strategy UI: "Which hypotheses do I want to pursue?"
✅ Smooth entrance animations for hypothesis cards

Investigation:
✅ Evidence cards show hypothesis relevance badges
✅ Visual indicators: "This evidence supports/contradicts Hypothesis A"
✅ Contradiction panel integrated with dramatic reveal animation
✅ UnlockToast guaranteed to appear with build-up animation
✅ IP counter creates scarcity tension with visual depletion
✅ Evidence-hypothesis relationship graph (optional visual)
✅ Phase transition animations (fade-in, slide-in)

Case Review:
✅ Metrics with educational tooltips/explanations
✅ Visual indicators of good vs poor performance
✅ "What this means" explanations for each metric
✅ Connection to player's investigation choices
```

### Success Criteria

- [ ] **Hypothesis Formation**: Players can toggle 3+ hypotheses for active investigation
- [ ] **Visual Tiers**: Locked Tier 2 hypotheses show placeholder cards with lock icon
- [ ] **Evidence Linking**: Evidence cards display which hypotheses they support/contradict
- [ ] **Unlock Feedback**: UnlockToast appears 100% of the time with dramatic entrance animation
- [ ] **Contradiction Integration**: ContradictionPanel appears with shake/pulse animation when discovered
- [ ] **Phase Transitions**: All 6 phases have smooth fade-in/slide-in animations (250-400ms)
- [ ] **IP Tension**: IP counter uses visual depletion animations (dots fade out)
- [ ] **Case Review Polish**: Metrics show with tooltips explaining meaning and educational value
- [ ] **Accessibility**: All animations respect `prefers-reduced-motion`
- [ ] **Performance**: Animations use transform/opacity only (GPU-accelerated)
- [ ] All tests pass (existing + new)
- [ ] Lint/type check passes

---

## Context & References

### Documentation (URLs for AI agent to reference)

```yaml
- url: https://motion.dev/docs/react-animation
  why: React animation library (v11+), AnimatePresence for mount/unmount, variants for staggered animations

- url: https://motion.dev/docs/react-transitions
  why: Layout animations, LayoutGroup API for smooth layout shifts, accessibility best practices

- url: https://blog.logrocket.com/creating-react-animations-with-motion/
  why: AnimatePresence patterns for unlock toasts and contradiction reveals

- url: https://tailwindcss.com/docs/animation
  why: Custom keyframe animations in Tailwind config, pulse/shake effects

- url: https://www.gameuidatabase.com/
  why: Detective game UI patterns, evidence board examples, phase transition references

- url: https://machinations.io/articles/game-systems-feedback-loops-and-how-they-help-craft-player-experiences
  why: Feedback loop design principles for unlock moments and IP economy tension

- url: https://www.cgspectrum.com/blog/game-design-principles-player-engagement
  why: Flow state principles, challenge-skill balance, pacing

- url: https://w3.org/WAI/WCAG21/Techniques/aria/ARIA19
  why: Accessible notifications (ARIA live regions) for screen readers
```

### Codebase Patterns (files to study)

```yaml
- file: src/components/phases/HypothesisFormation.tsx
  why: Current implementation shows locked hypotheses but no selection UX for investigation planning
  symbol: HypothesisFormation component

- file: src/components/phases/Investigation.tsx
  why: Evidence collection flow, unlock triggering, contradiction detection
  symbol: Investigation component, useUnlockNotifications hook

- file: src/components/ui/UnlockToast.tsx
  why: Existing toast component - verify it's properly integrated and visible
  symbol: UnlockToast component

- file: src/components/ui/ContradictionPanel.tsx
  why: Existing contradiction UI - needs enhanced visibility and integration
  symbol: ContradictionPanel component

- file: src/components/ui/EvidenceCard.tsx
  why: Current evidence display - needs redesign for hypothesis linking and information architecture
  symbol: EvidenceCard component

- file: src/hooks/useUnlockNotifications.ts
  why: Notification management hook - may need debugging for reliability
  symbol: useUnlockNotifications hook

- file: tailwind.config.js
  why: Existing animations (pulse, shake, toast-enter, toast-exit) - extend with new animations
  symbol: theme.extend.animation

- file: src/context/GameContext.tsx
  why: State management for selected hypotheses, unlock events, contradictions
  symbol: GameContext, gameReducer
```

### Research (from RESEARCH.md)

- GitHub: [Fungeey/detectiveboard](https://github.com/Fungeey/detectiveboard) - Evidence board with sticky notes + images connecting evidence
- GitHub: [stefankober/detective-board](https://github.com/stefankober/detective-board) - Minimalist detective board UI patterns
- Motion Examples: [motion.dev/examples](https://motion.dev/examples) - 330+ animation patterns for React
- Feedback Loops: [Machinations article](https://machinations.io/articles/game-systems-feedback-loops-and-how-they-help-craft-player-experiences) - Positive vs negative loops

---

## Current Codebase Structure

```bash
src/
├── components/
│   ├── phases/
│   │   ├── Briefing.tsx
│   │   ├── HypothesisFormation.tsx       # MODIFY: Add hypothesis selection UX
│   │   ├── Investigation.tsx             # MODIFY: Add evidence-hypothesis linking
│   │   ├── Prediction.tsx
│   │   ├── Resolution.tsx
│   │   └── CaseReview.tsx                # MODIFY: Add metric tooltips/explanations
│   └── ui/
│       ├── Card.tsx
│       ├── Button.tsx
│       ├── EvidenceCard.tsx              # MODIFY: Redesign with hypothesis relevance
│       ├── UnlockToast.tsx               # VERIFY: Ensure visibility and animation
│       ├── ContradictionPanel.tsx        # MODIFY: Enhance visibility and integration
│       ├── Modal.tsx
│       └── ProbabilitySlider.tsx
├── hooks/
│   ├── useGame.ts
│   └── useUnlockNotifications.ts         # DEBUG: Verify notification reliability
├── context/
│   └── GameContext.tsx                   # MODIFY: Add active hypothesis tracking
├── types/
│   ├── game.ts
│   └── enhanced.ts
└── utils/
    ├── unlocking.ts
    ├── contradictions.ts
    └── scoring.ts

tailwind.config.js                        # MODIFY: Add phase transition animations
```

---

## Desired Codebase Structure

```bash
src/
├── components/
│   ├── phases/
│   │   ├── HypothesisFormation.tsx       # Enhanced with selection + animations
│   │   ├── Investigation.tsx             # Enhanced with evidence-hypothesis links
│   │   └── CaseReview.tsx                # Enhanced with tooltips + explanations
│   └── ui/
│       ├── EvidenceCard.tsx              # Redesigned with hypothesis relevance
│       ├── UnlockToast.tsx               # Verified + enhanced animations
│       ├── ContradictionPanel.tsx        # Enhanced drama + visibility
│       ├── PhaseTransition.tsx           # NEW: Reusable phase transition wrapper
│       ├── MetricCard.tsx                # NEW: Case review metric display
│       └── HypothesisRelevanceBadge.tsx  # NEW: Shows evidence-hypothesis links
├── hooks/
│   ├── useUnlockNotifications.ts         # Debugged for reliability
│   └── usePhaseTransition.ts             # NEW: Phase transition animation hook
├── context/
│   └── GameContext.tsx                   # Enhanced with active hypothesis state
└── utils/
    └── evidenceRelevance.ts              # NEW: Calculate evidence-hypothesis relevance

tailwind.config.js                        # Extended with phase transition keyframes
```

---

## Files to Create/Modify

| File | Action | Purpose | Dependencies |
|------|--------|---------|--------------|
| `src/components/ui/PhaseTransition.tsx` | CREATE | Reusable wrapper for phase entrance animations | framer-motion |
| `src/components/ui/MetricCard.tsx` | CREATE | Metric display with tooltips and explanations | Tailwind tooltips |
| `src/components/ui/HypothesisRelevanceBadge.tsx` | CREATE | Badge showing evidence supports/contradicts hypothesis | Tailwind, types |
| `src/hooks/usePhaseTransition.ts` | CREATE | Hook for managing phase transition states | react, framer-motion |
| `src/utils/evidenceRelevance.ts` | CREATE | Pure functions for evidence-hypothesis relevance | enhanced.ts types |
| `src/components/phases/HypothesisFormation.tsx` | MODIFY | Add hypothesis selection UX + animations | PhaseTransition |
| `src/components/phases/Investigation.tsx` | MODIFY | Add evidence-hypothesis linking + enhanced unlock visibility | HypothesisRelevanceBadge |
| `src/components/phases/CaseReview.tsx` | MODIFY | Add metric tooltips and educational content | MetricCard |
| `src/components/ui/EvidenceCard.tsx` | MODIFY | Redesign with hypothesis relevance indicators | HypothesisRelevanceBadge |
| `src/components/ui/UnlockToast.tsx` | MODIFY | Enhance animations + verify visibility | framer-motion |
| `src/components/ui/ContradictionPanel.tsx` | MODIFY | Add dramatic reveal animation | framer-motion |
| `src/hooks/useUnlockNotifications.ts` | DEBUG | Verify notification reliability and fix issues | None |
| `src/context/GameContext.tsx` | MODIFY | Add active hypothesis tracking (optional) | game.ts types |
| `tailwind.config.js` | MODIFY | Add phase transition animations (fade-in, slide-in) | None |
| `package.json` | MODIFY | Install framer-motion dependency | None |

---

## Tasks (Ordered)

### Task 1: Install Dependencies
**File**: `package.json`
**Action**: MODIFY
**Purpose**: Add framer-motion for production-grade React animations
**Pattern**: Standard npm install
**Depends on**: None
**Acceptance criteria**:
- `framer-motion` installed (latest stable version)
- `npm run dev` works without errors
- Type definitions available

**Implementation**:
```bash
npm install framer-motion
```

---

### Task 2: Create Phase Transition Component
**File**: `src/components/ui/PhaseTransition.tsx`
**Action**: CREATE
**Purpose**: Reusable wrapper for phase entrance animations with accessibility support
**Pattern**: AnimatePresence + motion.div wrapper
**Depends on**: Task 1
**Acceptance criteria**:
- Supports fade-in, slide-in animation variants
- Respects `prefers-reduced-motion`
- 250-400ms duration for phase transitions
- Accessible (no layout shift, smooth)

**Implementation Pattern**:
```typescript
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PhaseTransitionProps {
  children: ReactNode;
  variant?: 'fade' | 'slide-up' | 'slide-down';
  duration?: number; // Default 300ms
}

export function PhaseTransition({
  children,
  variant = 'fade',
  duration = 0.3
}: PhaseTransitionProps) {
  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    },
    'slide-up': {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 }
    },
    'slide-down': {
      initial: { opacity: 0, y: -20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 20 }
    }
  };

  return (
    <motion.div
      initial={variants[variant].initial}
      animate={variants[variant].animate}
      exit={variants[variant].exit}
      transition={{
        duration,
        ease: 'easeInOut',
        // Respect user preferences
        ...(window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? { duration: 0.01 }
          : {})
      }}
    >
      {children}
    </motion.div>
  );
}
```

---

### Task 3: Create Evidence Relevance Utilities
**File**: `src/utils/evidenceRelevance.ts`
**Action**: CREATE
**Purpose**: Pure functions to calculate which hypotheses an evidence piece supports/contradicts
**Pattern**: Follow `src/utils/unlocking.ts` pure function pattern
**Depends on**: None
**Acceptance criteria**:
- Type-safe with enhanced.ts types
- Pure functions (no side effects)
- Clear return types (supports, contradicts, neutral)
- Unit tested

**Implementation Pattern**:
```typescript
import type { InvestigationAction } from '../types/game';
import type { ConditionalHypothesis } from '../types/enhanced';

/**
 * Relevance types for evidence-hypothesis relationships
 */
export type EvidenceRelevance = 'supports' | 'contradicts' | 'neutral';

/**
 * Calculate relevance of evidence to a hypothesis
 *
 * Logic:
 * - SUPPORTS: Evidence ID appears in hypothesis unlock requirements
 * - CONTRADICTS: Evidence ID appears in case contradictions for this hypothesis
 * - NEUTRAL: No direct relationship
 */
export function calculateEvidenceRelevance(
  evidenceId: string,
  hypothesis: ConditionalHypothesis,
  contradictionIds: string[]
): EvidenceRelevance {
  // Check if evidence is part of unlock requirements (supports)
  if (hypothesis.unlockRequirement) {
    const isInRequirement = checkEvidenceInRequirement(
      evidenceId,
      hypothesis.unlockRequirement
    );
    if (isInRequirement) return 'supports';
  }

  // Check if evidence is part of contradiction (contradicts)
  // This requires contradiction data - passed as IDs for now
  if (contradictionIds.includes(evidenceId)) {
    return 'contradicts';
  }

  return 'neutral';
}

/**
 * Recursively check if evidence ID appears in unlock requirements
 */
function checkEvidenceInRequirement(
  evidenceId: string,
  requirement: UnlockRequirement
): boolean {
  switch (requirement.type) {
    case 'evidence_collected':
      return requirement.evidenceId === evidenceId;
    case 'all_of':
    case 'any_of':
      return requirement.requirements.some(r =>
        checkEvidenceInRequirement(evidenceId, r)
      );
    case 'threshold_met':
      return false; // Threshold requirements don't reference specific evidence
  }
}

/**
 * Get all hypotheses relevant to an evidence piece
 */
export function getRelevantHypotheses(
  evidenceId: string,
  hypotheses: readonly ConditionalHypothesis[],
  contradictionIds: string[]
): Array<{ hypothesisId: string; relevance: EvidenceRelevance }> {
  return hypotheses
    .map(h => ({
      hypothesisId: h.id,
      relevance: calculateEvidenceRelevance(evidenceId, h, contradictionIds)
    }))
    .filter(r => r.relevance !== 'neutral');
}
```

---

### Task 4: Create Hypothesis Relevance Badge Component
**File**: `src/components/ui/HypothesisRelevanceBadge.tsx`
**Action**: CREATE
**Purpose**: Visual badge showing evidence supports/contradicts a hypothesis
**Pattern**: Simple presentational component with Tailwind styling
**Depends on**: Task 3
**Acceptance criteria**:
- Shows "Supports H1" or "Contradicts H2" with color coding
- Green for supports, red for contradicts
- Compact (badge/pill style)
- Accessible (ARIA labels)

**Implementation Pattern**:
```typescript
interface HypothesisRelevanceBadgeProps {
  hypothesisLabel: string; // e.g., "H1", "H2"
  relevance: 'supports' | 'contradicts';
}

export function HypothesisRelevanceBadge({
  hypothesisLabel,
  relevance
}: HypothesisRelevanceBadgeProps) {
  const styles = relevance === 'supports'
    ? 'bg-green-100 text-green-700 border-green-300'
    : 'bg-red-100 text-red-700 border-red-300';

  const icon = relevance === 'supports' ? '↑' : '↓';
  const label = relevance === 'supports' ? 'Supports' : 'Contradicts';

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${styles}`}
      aria-label={`${label} hypothesis ${hypothesisLabel}`}
    >
      <span aria-hidden="true">{icon}</span>
      <span>{label} {hypothesisLabel}</span>
    </span>
  );
}
```

---

### Task 5: Create Metric Card Component
**File**: `src/components/ui/MetricCard.tsx`
**Action**: CREATE
**Purpose**: Display case review metrics with tooltips and educational explanations
**Pattern**: Card component with hover tooltip
**Depends on**: None
**Acceptance criteria**:
- Shows metric name, value, and explanation
- Tooltip appears on hover with educational content
- Visual indicator of good/poor performance (color coding)
- Accessible (keyboard navigation, ARIA)

**Implementation Pattern**:
```typescript
interface MetricCardProps {
  name: string;
  value: number | string;
  explanation: string;
  educationalNote?: string;
  performanceLevel?: 'excellent' | 'good' | 'fair' | 'poor';
}

export function MetricCard({
  name,
  value,
  explanation,
  educationalNote,
  performanceLevel = 'fair'
}: MetricCardProps) {
  const performanceColors = {
    excellent: 'text-green-700 bg-green-50 border-green-300',
    good: 'text-blue-700 bg-blue-50 border-blue-300',
    fair: 'text-amber-700 bg-amber-50 border-amber-300',
    poor: 'text-red-700 bg-red-50 border-red-300'
  };

  return (
    <div className="group relative">
      <Card className={`transition-all duration-200 ${performanceColors[performanceLevel]}`}>
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wide mb-1">{name}</h4>
            <p className="text-xs opacity-80">{explanation}</p>
          </div>
          <div className="text-2xl font-bold">{value}</div>
        </div>
      </Card>

      {/* Tooltip on hover */}
      {educationalNote && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-sm rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200 pointer-events-none z-10">
          <p>{educationalNote}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}
```

---

### Task 6: Create Phase Transition Hook
**File**: `src/hooks/usePhaseTransition.ts`
**Action**: CREATE
**Purpose**: Hook for managing phase transition state (entering/exiting)
**Pattern**: Custom React hook with state management
**Depends on**: Task 2
**Acceptance criteria**:
- Returns isEntering/isExiting states
- Triggers transitions on phase change
- Works with PhaseTransition component

**Implementation Pattern**:
```typescript
import { useState, useEffect } from 'react';
import { GamePhase } from '../types/game';

export function usePhaseTransition(currentPhase: GamePhase) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previousPhase, setPreviousPhase] = useState(currentPhase);

  useEffect(() => {
    if (currentPhase !== previousPhase) {
      setIsTransitioning(true);
      setPreviousPhase(currentPhase);

      // Reset after animation duration
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [currentPhase, previousPhase]);

  return { isTransitioning };
}
```

---

### Task 7: Enhance UnlockToast Component
**File**: `src/components/ui/UnlockToast.tsx`
**Action**: MODIFY
**Purpose**: Enhance with dramatic entrance animation and ensure visibility
**Pattern**: AnimatePresence with motion variants
**Depends on**: Task 1
**Acceptance criteria**:
- Guaranteed visibility (verify z-index, positioning)
- Dramatic entrance animation (slide-in + scale)
- Auto-dismiss with progress bar
- Accessible (ARIA live region)
- Respects prefers-reduced-motion

**Current State**: Toast exists but may not be visible or dramatic enough

**Enhancement Pattern**:
```typescript
import { motion, AnimatePresence } from 'framer-motion';

// Enhance with variants for dramatic entrance
const toastVariants = {
  initial: {
    opacity: 0,
    y: -20,
    scale: 0.9
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20
    }
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.9,
    transition: {
      duration: 0.2
    }
  }
};

// Wrap existing toast in AnimatePresence + motion.div
<AnimatePresence>
  {isVisible && (
    <motion.div
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="fixed top-4 right-4 z-[9999] max-w-md"
      role="status"
      aria-live="polite"
    >
      {/* Existing toast content */}
    </motion.div>
  )}
</AnimatePresence>
```

---

### Task 8: Enhance ContradictionPanel Component
**File**: `src/components/ui/ContradictionPanel.tsx`
**Action**: MODIFY
**Purpose**: Add dramatic reveal animation when contradictions are discovered
**Pattern**: AnimatePresence with shake/pulse animation
**Depends on**: Task 1
**Acceptance criteria**:
- Dramatic entrance when contradiction discovered (shake + pulse)
- Clear visual separation from other content
- Integrated into investigation flow (not feeling separate)
- Accessible announcements

**Current State**: Panel exists but feels disconnected from investigation flow

**Enhancement Pattern**:
```typescript
import { motion } from 'framer-motion';

// Add shake animation on entrance
const contradictionVariants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: -10
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 15
    }
  },
  shake: {
    x: [0, -5, 5, -5, 5, 0],
    transition: {
      duration: 0.4,
      ease: 'easeInOut'
    }
  }
};

// Wrap panel in motion.div
<motion.div
  variants={contradictionVariants}
  initial="initial"
  animate={["animate", isNewlyDiscovered ? "shake" : undefined]}
  className="border-2 border-red-500 bg-red-50"
>
  {/* Existing panel content */}
</motion.div>
```

---

### Task 9: Enhance EvidenceCard Component
**File**: `src/components/ui/EvidenceCard.tsx`
**Action**: MODIFY
**Purpose**: Redesign with hypothesis relevance indicators and better information architecture
**Pattern**: Enhanced layout with HypothesisRelevanceBadge integration
**Depends on**: Task 3, Task 4
**Acceptance criteria**:
- Shows hypothesis relevance badges (Supports H1, Contradicts H2)
- Improved information hierarchy (title, relevance, content, interpretation)
- IP cost displayed prominently
- Critical evidence indicator
- Unlock potential hint ("May unlock new hypotheses")

**Current State**: Shows basic evidence info (title, content, interpretation, critical flag)

**Enhancement Pattern**:
```typescript
import { HypothesisRelevanceBadge } from './HypothesisRelevanceBadge';
import { getRelevantHypotheses } from '../../utils/evidenceRelevance';

interface EvidenceCardProps {
  evidence: EvidenceData;
  hypotheses: readonly ConditionalHypothesis[];
  contradictionIds?: string[];
  showRelevance?: boolean; // Default true in Investigation phase
}

export function EvidenceCard({
  evidence,
  hypotheses,
  contradictionIds = [],
  showRelevance = true
}: EvidenceCardProps) {
  const relevantHypotheses = showRelevance
    ? getRelevantHypotheses(evidence.id, hypotheses, contradictionIds)
    : [];

  return (
    <div className="space-y-4">
      {/* Header with title + relevance badges */}
      <div className="border-b-2 border-amber-700 pb-2">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-xl font-serif font-bold text-amber-900">
            {evidence.isCritical && <span className="text-red-600">* </span>}
            {evidence.title}
          </h3>

          {/* Hypothesis relevance badges */}
          {relevantHypotheses.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-end">
              {relevantHypotheses.map(({ hypothesisId, relevance }) => (
                <HypothesisRelevanceBadge
                  key={hypothesisId}
                  hypothesisLabel={hypothesisId}
                  relevance={relevance}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Existing content sections... */}
    </div>
  );
}
```

---

### Task 10: Enhance Investigation Phase
**File**: `src/components/phases/Investigation.tsx`
**Action**: MODIFY
**Purpose**: Add evidence-hypothesis linking, ensure unlock toast visibility, enhance IP tension
**Pattern**: Integrate HypothesisRelevanceBadge, verify useUnlockNotifications
**Depends on**: Task 3, Task 4, Task 7
**Acceptance criteria**:
- Evidence cards show hypothesis relevance
- UnlockToast appears reliably when hypotheses unlock
- IP counter shows visual depletion (fade-out animation)
- Phase wraps in PhaseTransition component
- Contradiction panel appears dramatically

**Current State**: Evidence cards basic, unlock toast may not appear, IP counter static

**Enhancement Pattern**:
```typescript
import { PhaseTransition } from '../ui/PhaseTransition';
import { motion } from 'framer-motion';

export function Investigation({ caseData }: Props) {
  // Wrap entire phase in PhaseTransition
  return (
    <PhaseTransition variant="slide-up">
      <div className="space-y-6">
        {/* Enhanced IP Counter with animation */}
        <Card variant="official">
          <div className="flex gap-1.5 mt-2 justify-end">
            {Array.from({ length: caseData.briefing.investigationPoints }).map((_, i) => (
              <motion.div
                key={i}
                className={`w-5 h-5 rounded-full ${
                  i < ip ? 'bg-amber-500' : 'bg-amber-200'
                }`}
                animate={{
                  scale: i === ip ? [1, 1.2, 1] : 1,
                  opacity: i >= ip ? 0.3 : 1
                }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
        </Card>

        {/* Pass hypotheses to EvidenceCard for relevance display */}
        <Modal
          isOpen={showEvidenceModal}
          onClose={() => setShowEvidenceModal(false)}
          title="Evidence Collected"
        >
          {activeEvidence && (
            <EvidenceCard
              evidence={activeEvidence.evidence}
              hypotheses={hypotheses}
              contradictionIds={contradictions.map(c => c.id)}
              showRelevance={true}
            />
          )}
        </Modal>

        {/* Ensure UnlockToast is visible with proper z-index */}
        {notifications.map((notification, index) => (
          <div
            key={notification.eventId}
            className="fixed right-4 z-[9999]"
            style={{ top: `${16 + index * 100}px` }}
          >
            <UnlockToast
              hypothesisLabel={notification.hypothesisLabel}
              onDismiss={() => acknowledgeNotification(notification.eventId)}
            />
          </div>
        ))}
      </div>
    </PhaseTransition>
  );
}
```

---

### Task 11: Enhance Hypothesis Formation Phase
**File**: `src/components/phases/HypothesisFormation.tsx`
**Action**: MODIFY
**Purpose**: Add hypothesis selection UX for investigation planning, enhance animations
**Pattern**: PhaseTransition wrapper, staggered hypothesis card animations
**Depends on**: Task 2
**Acceptance criteria**:
- Phase wraps in PhaseTransition component
- Hypothesis cards animate in with stagger (0.1s delay each)
- Locked Tier 2 cards have dramatic lock icon + placeholder text
- Selection toggles work smoothly
- Tier badges visible ("Tier 1", "Tier 2 - Unlocked")

**Current State**: Basic hypothesis display with locked cards, no selection for investigation planning

**Enhancement Pattern**:
```typescript
import { PhaseTransition } from '../ui/PhaseTransition';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25
    }
  }
};

export function HypothesisFormation({ caseData }: Props) {
  return (
    <PhaseTransition variant="fade">
      <div className="space-y-6">
        <Card>
          <h2 className="text-2xl font-serif font-bold text-amber-900 mb-4">
            Hypothesis Formation
          </h2>
          <p className="text-amber-800 mb-4">
            Select <strong>at least 3 hypotheses</strong> to actively investigate.
            Locked hypotheses will reveal themselves as you gather evidence.
          </p>
        </Card>

        {/* Staggered hypothesis cards */}
        <motion.div
          className="space-y-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {hypotheses.map(hypothesis => {
            const isLocked = hypothesis.tier === 2 && !isHypothesisUnlocked(hypothesis, state, initialIp);

            return (
              <motion.div
                key={hypothesis.id}
                variants={cardVariants}
              >
                {isLocked ? (
                  <LockedHypothesisCard hypothesis={hypothesis} />
                ) : (
                  <SelectableHypothesisCard
                    hypothesis={hypothesis}
                    isSelected={state.selectedHypotheses.includes(hypothesis.id)}
                    onToggle={toggleHypothesis}
                  />
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </PhaseTransition>
  );
}
```

---

### Task 12: Enhance Case Review Phase
**File**: `src/components/phases/CaseReview.tsx`
**Action**: MODIFY
**Purpose**: Add metric tooltips and educational explanations
**Pattern**: MetricCard component integration
**Depends on**: Task 5
**Acceptance criteria**:
- Metrics use MetricCard component
- Educational tooltips explain meaning
- Visual performance indicators (color coding)
- Connection to player decisions ("You spent X IP on Hypothesis A")
- Phase wraps in PhaseTransition

**Current State**: Shows numeric metrics without context or explanations

**Enhancement Pattern**:
```typescript
import { MetricCard } from '../ui/MetricCard';
import { PhaseTransition } from '../ui/PhaseTransition';

export function CaseReview({ caseData }: Props) {
  // Calculate performance levels
  const calibrationLevel = scores.calibrationScore >= 80 ? 'excellent'
    : scores.calibrationScore >= 60 ? 'good'
    : scores.calibrationScore >= 40 ? 'fair' : 'poor';

  return (
    <PhaseTransition variant="fade">
      <div className="space-y-6">
        <Card>
          <h2 className="text-2xl font-serif font-bold text-amber-900 mb-4">
            Case Review
          </h2>
        </Card>

        {/* Metrics Grid with Educational Tooltips */}
        <div className="grid md:grid-cols-2 gap-4">
          <MetricCard
            name="Calibration Score"
            value={`${scores.calibrationScore}%`}
            explanation="How accurate were your probability estimates?"
            educationalNote="Calibration measures your ability to quantify uncertainty. A well-calibrated investigator assigns high probability to true hypotheses and low probability to false ones. This is a core rationality skill."
            performanceLevel={calibrationLevel}
          />

          <MetricCard
            name="Confirmation Bias"
            value={`${scores.confirmationBias}%`}
            explanation="Did you investigate your favorite theory too much?"
            educationalNote="Confirmation bias is the tendency to seek evidence that supports pre-existing beliefs. A score below 40% indicates healthy investigative diversity. Above 70% suggests tunnel vision."
            performanceLevel={scores.confirmationBias < 40 ? 'excellent' : 'poor'}
          />

          {/* Additional metrics... */}
        </div>
      </div>
    </PhaseTransition>
  );
}
```

---

### Task 13: Debug useUnlockNotifications Hook
**File**: `src/hooks/useUnlockNotifications.ts`
**Action**: DEBUG
**Purpose**: Verify notification reliability and ensure unlock events trigger consistently
**Pattern**: Add console logging, verify state tracking
**Depends on**: None
**Acceptance criteria**:
- Unlock events trigger 100% of the time
- Notifications appear for all unlocked hypotheses
- No duplicate notifications
- Acknowledgment clears notifications properly

**Current Issue**: Unlock toast may not appear reliably

**Debugging Steps**:
1. Add console.log to verify unlock events are dispatched
2. Verify state.unlockedHypotheses updates correctly
3. Check notification filtering logic
4. Ensure acknowledgment state persists

---

### Task 14: Add Phase Transition Animations to Tailwind Config
**File**: `tailwind.config.js`
**Action**: MODIFY
**Purpose**: Add custom keyframes for phase transitions
**Pattern**: Extend theme.animation and theme.keyframes
**Depends on**: None
**Acceptance criteria**:
- fade-in animation (opacity 0 → 1)
- slide-up animation (translate-y + opacity)
- slide-down animation (translate-y + opacity)
- 250-400ms durations
- Existing animations preserved (pulse, shake, toast-enter, toast-exit)

**Implementation**:
```javascript
module.exports = {
  theme: {
    extend: {
      animation: {
        // Existing animations
        'pulse': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shake': 'shake 0.5s ease-in-out',
        'toast-enter': 'toast-enter 0.3s ease-out',
        'toast-exit': 'toast-exit 0.2s ease-in',

        // NEW: Phase transition animations
        'fade-in': 'fade-in 0.3s ease-in-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
      },
      keyframes: {
        // Existing keyframes
        pulse: { /* ... */ },
        shake: { /* ... */ },
        'toast-enter': { /* ... */ },
        'toast-exit': { /* ... */ },

        // NEW: Phase transition keyframes
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      }
    }
  }
}
```

---

### Task 15: Update GameContext for Active Hypothesis Tracking (Optional)
**File**: `src/context/GameContext.tsx`
**Action**: MODIFY (OPTIONAL)
**Purpose**: Add state for tracking which hypotheses player is actively investigating
**Pattern**: Extend PlayerState and reducer
**Depends on**: None
**Acceptance criteria**:
- `activeHypotheses: string[]` field in PlayerState
- `SET_ACTIVE_HYPOTHESES` action type
- Reducer case to update active hypotheses
- Optional: Use in Investigation phase to filter evidence

**Note**: This is OPTIONAL - only if we want to track investigation strategy beyond selected hypotheses. May be deferred to future milestone.

---

## Integration Points

### State Management
- **Where**: `src/context/GameContext.tsx`
- **What**: Existing unlock, contradiction, and evidence collection state
- **Pattern**: No changes needed unless adding active hypothesis tracking (Task 15 - optional)
- **Integration**: Components read from state, animations trigger on state changes

### Component Integration
- **PhaseTransition**: Wraps all phase components (HypothesisFormation, Investigation, Prediction, Resolution, CaseReview)
- **HypothesisRelevanceBadge**: Used in EvidenceCard to show evidence-hypothesis links
- **MetricCard**: Used in CaseReview to display metrics with tooltips
- **Framer Motion**: Used in UnlockToast, ContradictionPanel, and phase components for animations

### Animation Timing
- **Micro-interactions**: 150-250ms (button hover, card selection)
- **Phase transitions**: 250-400ms (phase entrance, exit)
- **Unlock/contradiction reveals**: 300-500ms (dramatic moments)
- **Auto-dismiss**: 5000ms (unlock toast auto-dismiss)

### Event Flow
```
Evidence Collected
  ↓
Unlock Check (Investigation.tsx useEffect)
  ↓
Dispatch UNLOCK_HYPOTHESIS
  ↓
useUnlockNotifications detects new unlock
  ↓
UnlockToast appears with animation
  ↓
User dismisses or auto-dismiss after 5s
```

### Accessibility Integration
- **ARIA live regions**: UnlockToast, ContradictionPanel
- **Keyboard navigation**: All interactive elements focusable
- **prefers-reduced-motion**: All animations respect user preference
- **Focus management**: Phase transitions don't break focus
- **Screen reader announcements**: Unlock and contradiction events announced

---

## Known Gotchas

### Animation Performance
- **Issue**: Animating layout properties (width, height, top, left) causes reflow/repaint
- **Solution**: Only animate transform and opacity (GPU-accelerated)
- **Implementation**: Use `transform: translateY()` instead of `top`, `opacity` instead of `display: none`

### AnimatePresence Key Prop
- **Issue**: AnimatePresence requires unique `key` prop for exit animations to work
- **Solution**: Ensure all animated children have stable, unique keys
- **Implementation**: Use `key={hypothesis.id}` or `key={notification.eventId}`, never `key={index}`

### Z-Index Stacking
- **Issue**: UnlockToast may be hidden behind modals or other components
- **Solution**: Use very high z-index (9999) for toast, ensure no parent has `overflow: hidden`
- **Implementation**: `className="fixed right-4 z-[9999]"` and verify no parent restricts stacking context

### prefers-reduced-motion
- **Issue**: Users with vestibular disorders need reduced motion
- **Solution**: Check `window.matchMedia('(prefers-reduced-motion: reduce)')` and reduce durations to ~10ms
- **Implementation**: Framer Motion automatically respects this, but verify with test

### State Synchronization
- **Issue**: useUnlockNotifications may miss events if state updates too fast
- **Solution**: Use `useEffect` with proper dependencies, ensure unlock events are in state before hook reads them
- **Implementation**: `useEffect([state.unlockedHypotheses], ...)` with stable dependency array

### Hypothesis Relevance Edge Cases
- **Issue**: Evidence may support/contradict multiple hypotheses
- **Solution**: Show all relevant badges, don't overflow
- **Implementation**: Use `flex-wrap` on badge container, limit to 2-3 badges per evidence card

### Toast Auto-Dismiss Timing
- **Issue**: Multiple toasts may overlap if unlocks happen rapidly
- **Solution**: Stack toasts vertically with offset (`top: 16 + index * 100px`)
- **Implementation**: Already implemented in Investigation.tsx, verify spacing

---

## Validation Loop

### Level 1: Syntax & Style
```bash
npm run lint
# Expected: 0 errors, 0-1 warnings (react-refresh context export)

npm run type-check
# Expected: 0 errors
```

### Level 2: Unit Tests
- **Test file locations**:
  - `src/utils/__tests__/evidenceRelevance.test.ts` - Evidence-hypothesis relevance logic
  - `src/components/ui/__tests__/PhaseTransition.test.tsx` - Phase transition component
  - `src/components/ui/__tests__/MetricCard.test.tsx` - Metric display component
  - `src/components/ui/__tests__/HypothesisRelevanceBadge.test.tsx` - Relevance badge component

- **Coverage target**: >80% for new files

- **Scenarios to test** (validation-gates agent will implement):
  - **evidenceRelevance.ts**:
    - Evidence supports hypothesis (in unlock requirements)
    - Evidence contradicts hypothesis (in contradiction data)
    - Evidence is neutral (no relationship)
    - Multiple hypotheses relevant to one evidence piece

  - **PhaseTransition.tsx**:
    - Renders children correctly
    - Applies fade animation variant
    - Applies slide-up/slide-down variants
    - Respects prefers-reduced-motion

  - **MetricCard.tsx**:
    - Displays metric name and value
    - Shows tooltip on hover
    - Color codes performance levels correctly

  - **HypothesisRelevanceBadge.tsx**:
    - Shows "Supports" badge with green styling
    - Shows "Contradicts" badge with red styling
    - Includes ARIA labels

### Level 3: Integration/Manual Testing
```bash
npm run dev
# Manual verification steps:

# 1. Phase Transitions
# - Navigate through all 6 phases
# - Verify smooth fade-in/slide-up animations
# - Check no jarring layout shifts

# 2. Hypothesis Formation
# - Locked Tier 2 hypotheses show placeholder cards
# - Can toggle hypothesis selection
# - Tier badges visible
# - Staggered entrance animation plays

# 3. Investigation
# - Evidence cards show hypothesis relevance badges
# - IP counter dots fade out as IP spent
# - UnlockToast appears when Tier 2 unlocks
# - Toast is visible (not hidden behind anything)
# - ContradictionPanel appears dramatically when contradiction found

# 4. Case Review
# - Metrics show with tooltips on hover
# - Educational notes appear
# - Color coding indicates performance
# - "What this means" content is helpful

# 5. Accessibility
# - Test with keyboard only (Tab navigation)
# - Enable prefers-reduced-motion in browser dev tools
# - Verify animations reduce to ~10ms
# - Use screen reader to verify ARIA announcements
```

### Level 4: Performance
```bash
npm run build
# Check bundle size (target: <500KB total, <250KB for main chunk)

# Performance metrics:
# - Lighthouse audit: >90 performance score
# - No layout shift (CLS < 0.1)
# - First Contentful Paint < 1.5s
# - All animations use GPU-accelerated properties (transform/opacity)
```

---

## Testing Strategy

### Unit Tests (Vitest + React Testing Library)

**New Test Files**:
1. `src/utils/__tests__/evidenceRelevance.test.ts` (≥20 tests)
   - Test evidence-hypothesis relevance calculation
   - Test supports/contradicts/neutral logic
   - Test edge cases (no unlock requirement, multiple hypotheses)

2. `src/components/ui/__tests__/PhaseTransition.test.tsx` (≥10 tests)
   - Test animation variants render correctly
   - Test prefers-reduced-motion support
   - Test children rendering

3. `src/components/ui/__tests__/MetricCard.test.tsx` (≥8 tests)
   - Test metric display
   - Test tooltip visibility
   - Test performance color coding

4. `src/components/ui/__tests__/HypothesisRelevanceBadge.test.tsx` (≥6 tests)
   - Test supports/contradicts rendering
   - Test ARIA labels
   - Test styling

**Enhanced Test Files**:
1. `src/components/ui/__tests__/UnlockToast.test.tsx` (add 5 tests)
   - Test AnimatePresence integration
   - Test z-index visibility
   - Test auto-dismiss timing

2. `src/components/ui/__tests__/ContradictionPanel.test.tsx` (add 5 tests)
   - Test dramatic entrance animation
   - Test shake animation trigger

**Total New Tests**: ~54 tests
**Total Project Tests**: 189 existing + 54 new = **243 tests**

### Integration Tests (Manual)

**Test Scenarios**:
1. **Full Case Playthrough**:
   - Start from Briefing
   - Select hypotheses in Hypothesis Formation
   - Collect evidence in Investigation
   - Verify unlock toast appears
   - Discover contradiction, verify panel appears
   - Complete Prediction and Resolution
   - Check Case Review tooltips

2. **Edge Cases**:
   - Unlock multiple hypotheses simultaneously (verify toast stacking)
   - Discover contradictions rapidly (verify panel animation)
   - Spend all IP (verify counter depletion)
   - Switch phases rapidly (verify no animation glitches)

3. **Accessibility**:
   - Keyboard-only navigation
   - Screen reader announcements
   - prefers-reduced-motion compliance
   - Focus management during phase transitions

---

## Documentation Updates

### STATUS.md
- Update "Current Milestone Tasks" → Move Milestone 6 to "Completed Archive"
- Update "Active Agent Work" → Next agent: validation-gates or integration testing
- Add "Recent Completions" entry for react-vite-specialist (Milestone 6)

### PLANNING.md
- Mark Milestone 6 as COMPLETE
- Update "Current Version" to 0.6.0
- Update test count (189 → 243 tests)
- Add Milestone 6 to "Completed Milestones" section

### CHANGELOG.md
- Add entry for v0.6.0 with Milestone 6 features:
  - Phase transition animations
  - Evidence-hypothesis linking
  - Enhanced unlock and contradiction feedback
  - Metric tooltips and educational content
  - IP economy visual tension

### README.md (if needed)
- Update screenshots (if we have visual assets)
- Add note about animations and accessibility

---

## Dependencies

### New Dependencies
- `framer-motion` (latest stable) - React animation library
  - Why: Production-grade animations, AnimatePresence, layout animations
  - Bundle size: ~60KB gzipped (acceptable for animation value)
  - Alternatives considered: react-spring (more complex API), CSS-only (less flexible)

### No Changes to Existing Dependencies
- React 18, Vite, Tailwind CSS, TypeScript - all remain same versions

---

## Out of Scope

### Deferred to Future Milestones
- **Tutorial/Onboarding System** - Guided walkthrough for new players (Milestone 8)
- **Multi-Case Progression** - Save progress across cases (Milestone 9)
- **Advanced Analytics Dashboard** - Deep dive into reasoning patterns (Milestone 10)
- **Mobile Responsive Design** - Touch-optimized UI (Milestone 11)
- **Evidence Board Visualization** - Interactive graph of evidence-hypothesis relationships (Milestone 12)
- **Difficulty Settings** - Easy/Medium/Hard modes with adjustable IP (Milestone 13)

### Not Part of This Milestone
- Backend/persistence - Still client-side only
- Multiplayer/social features
- Additional cases beyond Mission 1
- Advanced contradiction types (belief contradictions, temporal contradictions)
- Dynamic case generation
- AI-powered hints or assistance

---

## Anti-Patterns to Avoid

### Animation Anti-Patterns
- ❌ Animating layout properties (width, height, top, left) - causes reflow
- ✅ Animate transform and opacity only (GPU-accelerated)

- ❌ Using `display: none` for exit animations (instant removal)
- ✅ Use AnimatePresence with `exit` variants (smooth exit)

- ❌ Hardcoding animation durations inconsistently
- ✅ Use consistent timing (150-250ms micro, 250-400ms phase, 300-500ms dramatic)

### React Anti-Patterns
- ❌ Using array index as `key` prop in AnimatePresence
- ✅ Use stable, unique IDs (`hypothesis.id`, `notification.eventId`)

- ❌ Mutating state directly in animations
- ✅ Trigger animations from state changes, never mutate state in animation callbacks

### UX Anti-Patterns
- ❌ Too many animations (overwhelming)
- ✅ Strategic animation on key moments (unlocks, contradictions, phase transitions)

- ❌ Ignoring prefers-reduced-motion
- ✅ Always check media query and reduce durations to ~10ms

- ❌ Tooltips that disappear too fast or require precise mouse control
- ✅ Generous hover delay (200ms) and persistent on hover

### Code Organization Anti-Patterns
- ❌ Inline animation variants in every component
- ✅ Centralize common variants in PhaseTransition component

- ❌ Mixing animation logic with business logic
- ✅ Separate presentational (animation) from behavioral (state) concerns

---

## Design Principles (from GAME_DESIGN.md)

### Core Principles to Uphold
1. **Realism over contrivance** - Animations should feel natural, not gimmicky
2. **Multiple paths to truth** - Evidence-hypothesis linking shows multiple investigation strategies
3. **Failure teaches** - Case Review tooltips turn mistakes into learning moments
4. **Complexity scaffolds gradually** - Don't overwhelm with all animations at once
5. **Mature without gratuitous** - Polished UI without childish effects

### Application to This Milestone
- **Unlock animations**: Dramatic but not cartoonish (spring physics, professional timing)
- **IP economy**: Scarcity tension through visual depletion, not arbitrary restrictions
- **Metric explanations**: Educational without condescension ("What this means" vs "You did bad")
- **Evidence-hypothesis links**: Show relationships without dictating investigation path

---

## Performance Targets

### Bundle Size
- **Current**: ~208KB total, ~64KB gzipped
- **After Milestone 6**: <280KB total, <90KB gzipped (framer-motion adds ~60KB gzipped)
- **Threshold**: <500KB total (still well under budget)

### Animation Performance
- **Frame rate**: 60 FPS for all animations (use Chrome DevTools Performance tab to verify)
- **No layout thrashing**: Only animate transform/opacity
- **Smooth phase transitions**: No visible jank or stuttering

### Load Time
- **First Contentful Paint**: <1.5s on 3G connection
- **Time to Interactive**: <3s on 3G connection
- **Lighthouse Performance**: >90 score

---

## Confidence Score

**8/10** - High likelihood of one-pass implementation success

### Why 8/10?
**Strengths**:
- ✅ Clear requirements with specific UX improvements
- ✅ Well-researched animation patterns (Motion docs, RESEARCH.md)
- ✅ Existing components to enhance (not building from scratch)
- ✅ Pure function patterns established (unlocking.ts, contradictions.ts)
- ✅ Strong type system (enhanced.ts) supports refactoring
- ✅ 189 tests passing provides safety net

**Risks** (why not 10/10):
- ⚠️ framer-motion integration may have unexpected edge cases
- ⚠️ useUnlockNotifications reliability unknown (needs debugging)
- ⚠️ Animation timing may need iteration to feel "right"
- ⚠️ Evidence-hypothesis relevance calculation needs careful testing

### Mitigation Strategies
1. **Incremental implementation**: Build PhaseTransition first, test thoroughly, then apply to phases
2. **Early testing**: Test unlock toast and contradiction panel visibility ASAP
3. **Animation prototyping**: Use Motion DevTools to preview animations before finalizing
4. **Accessibility audit**: Test prefers-reduced-motion early in development

---

Generated: 2026-01-01
Source: INITIAL.md (Milestone 6)
Research: RESEARCH.md (Motion patterns, Game UI Database, Feedback Loop Design)
Estimated Implementation Time: 8-12 hours (react-vite-specialist)
Estimated Testing Time: 3-4 hours (validation-gates)
