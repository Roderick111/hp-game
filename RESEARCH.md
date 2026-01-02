# Research Repository

## Code Examples

### React State Management

| Repository | URL | Relevance | Quality | Notes |
|------------|-----|-----------|---------|-------|
| pmndrs/zustand | [github.com/pmndrs/zustand](https://github.com/pmndrs/zustand) | State patterns | High | Simple store patterns, good for reducer inspiration |
| tanstack/query | [github.com/tanstack/query](https://github.com/tanstack/query) | Async state | High | Already in project, data fetching patterns |
| cassiozen/useStateMachine | [github.com/cassiozen/useStateMachine](https://github.com/cassiozen/useStateMachine) | State machines | High | Lightweight <1kb state machine hook for React |
| statelyai/xstate | [github.com/statelyai/xstate](https://github.com/statelyai/xstate) | Complex state | Medium | Actor-based state management, may be overkill |

### Toast/Notification Systems

| Repository | URL | Relevance | Quality | Notes |
|------------|-----|-----------|---------|-------|
| timolins/react-hot-toast | [github.com/timolins/react-hot-toast](https://github.com/timolins/react-hot-toast) | Toast UI | High | Lightweight, accessible toast patterns |
| emilkowalski/sonner | [github.com/emilkowalski/sonner](https://github.com/emilkowalski/sonner) | Toast UI | High | Modern toast with Tailwind support, smooth animations |

### Achievement/Unlock Systems

| Repository | URL | Relevance | Quality | Notes |
|------------|-----|-----------|---------|-------|
| dave-b-b/react-achievements-redux | [github.com/dave-b-b/react-achievements-redux](https://github.com/dave-b-b/react-achievements-redux) | Achievement system | High | Metric tracking, auto-unlock, toast notifications |
| joe307bad/points | [github.com/joe307bad/points](https://github.com/joe307bad/points) | Achievement tracking | Medium | React Native + TypeScript achievement app |

### Detective Games & Evidence Systems

| Repository | URL | Relevance | Quality | Notes |
|------------|-----|-----------|---------|-------|
| Mastra Detective Game | [mastra.ai/blog/the-detective-game](https://mastra.ai/blog/the-detective-game) | Contradiction detection | High | Cross-character contradictions, evidence confrontation system |
| scb-10x/typhoon-detective-game | [github.com/scb-10x/typhoon-detective-game](https://github.com/scb-10x/typhoon-detective-game) | Evidence analysis | Medium | Dynamic case generation, suspect interview patterns |

### TypeScript Patterns

| Repository | URL | Relevance | Quality | Notes |
|------------|-----|-----------|---------|-------|
| total-typescript/advanced-patterns | [github.com/total-typescript/advanced-patterns](https://github.com/total-typescript/advanced-patterns) | Type patterns | High | Discriminated unions, type guards |

## Documentation

### React

| Resource | URL | Type | Relevance |
|----------|-----|------|-----------|
| useReducer | [react.dev/reference/react/useReducer](https://react.dev/reference/react/useReducer) | Reference | Complex state management, conditional transitions |
| useContext | [react.dev/reference/react/useContext](https://react.dev/reference/react/useContext) | Reference | Global state access |

### TypeScript

| Resource | URL | Type | Relevance |
|----------|-----|------|-----------|
| Discriminated Unions | [typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions) | Reference | Type-safe requirement checking |

### Tailwind CSS

| Resource | URL | Type | Relevance |
|----------|-----|------|-----------|
| Animation | [tailwindcss.com/docs/animation](https://tailwindcss.com/docs/animation) | Reference | Toast entrance/exit effects |
| Dark Mode | [tailwindcss.com/docs/dark-mode](https://tailwindcss.com/docs/dark-mode) | Reference | Theme support |
| Custom Keyframes | [refine.dev/blog/tailwind-animations](https://refine.dev/blog/tailwind-animations/) | Tutorial | Custom fade-in, slide-in animations |

### Accessibility

| Resource | URL | Type | Relevance |
|----------|-----|------|-----------|
| WAI-ARIA Live Regions | [w3.org/WAI/WCAG21/Techniques/aria/ARIA19](https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA19) | Reference | Accessible notifications |

### Calibration & Decision Science

| Resource | URL | Type | Relevance |
|----------|-----|------|-----------|
| Smooth Calibration & Decision Making | [arxiv.org/html/2504.15582](https://arxiv.org/html/2504.15582) | Research Paper | Calibration error metrics for decision-making algorithms |
| Calibration for ML Decisions | [let-all.com/blog/2024/03/13/calibration-for-decision-making](https://www.let-all.com/blog/2024/03/13/calibration-for-decision-making-a-principled-approach-to-trustworthy-ml/) | Blog Post | Principled approach to trustworthy scoring systems |
| Calibration Feedback Study 2025 | [onlinelibrary.wiley.com/doi/full/10.1002/ffo2.199](https://onlinelibrary.wiley.com/doi/full/10.1002/ffo2.199) | Research Paper | Calibration training and rational thinking dispositions |

### Testing Patterns

| Resource | URL | Type | Relevance |
|----------|-----|------|-----------|
| Vitest Testing Library | [vitest.dev/guide](https://vitest.dev/guide/) | Reference | Unit test framework (Vite-native) |
| React Testing Library | [testing-library.com/docs/react-testing-library/intro](https://testing-library.com/docs/react-testing-library/intro/) | Reference | Component integration testing |

## Key Patterns for Milestone 2

### Unlock Evaluation Pattern
```typescript
// Recursive requirement evaluation (from enhanced.ts types)
function evaluateRequirement(req: UnlockRequirement, state: PlayerState): boolean {
  switch (req.type) {
    case 'evidence_collected':
      return state.collectedEvidenceIds.includes(req.evidenceId);
    case 'threshold_met':
      return getMetricValue(state, req.metric) >= req.threshold;
    case 'all_of':
      return req.requirements.every(r => evaluateRequirement(r, state));
    case 'any_of':
      return req.requirements.some(r => evaluateRequirement(r, state));
  }
}
```

### Toast Animation Keyframes
```css
@keyframes toast-enter {
  0% { opacity: 0; transform: translateY(-10px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes toast-exit {
  0% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-10px); }
}
```

## Key Patterns for Milestones 3 & 4

### Contradiction Detection Pattern (Milestone 3)
```typescript
// Pure function to detect newly discovered contradictions
function findNewlyDiscoveredContradictions(
  contradictions: readonly Contradiction[],
  state: EnhancedPlayerState
): string[] {
  return contradictions
    .filter(c => {
      // Both evidence pieces must be collected
      const hasEvidence1 = state.collectedEvidenceIds.includes(c.evidenceId1);
      const hasEvidence2 = state.collectedEvidenceIds.includes(c.evidenceId2);
      const bothCollected = hasEvidence1 && hasEvidence2;

      // Not yet discovered
      const notYetDiscovered = !state.discoveredContradictions.includes(c.id);

      return bothCollected && notYetDiscovered;
    })
    .map(c => c.id);
}
```

### Enhanced Scoring Metrics (Milestone 4)
```typescript
// Investigation efficiency: IP value per evidence piece
function calculateInvestigationEfficiency(state: PlayerState, initialIp: number): number {
  const ipSpent = initialIp - state.investigationPointsRemaining;
  const evidenceCount = state.collectedEvidenceIds.length;
  return evidenceCount > 0 ? ipSpent / evidenceCount : 0;
}

// Premature closure: Did player stop too early?
function calculatePrematureClosureScore(
  state: PlayerState,
  totalCriticalEvidence: number
): number {
  const criticalFound = state.collectedEvidenceIds.filter(
    id => isCritical(id)
  ).length;
  return totalCriticalEvidence > 0
    ? (criticalFound / totalCriticalEvidence) * 100
    : 100;
}
```

## Case Design & Narrative Patterns

### Detective Game Case Design

| Resource | URL | Type | Relevance |
|----------|-----|------|-----------|
| Phoenix Wright: Ace Attorney | [gamedeveloper.com/design/phoenix-wright-ace-attorney](https://www.gamedeveloper.com/design/phoenix-wright-ace-attorney) | Article | Contradiction mechanics, witness testimony patterns |
| Ace Attorney GitHub Topics | [github.com/topics/ace-attorney](https://github.com/topics/ace-attorney) | Code Examples | Fan-made case makers, evidence systems |
| Puzzle Game Patterns | [github.com/topics/puzzle-game](https://github.com/topics/puzzle-game) | Code Examples | Unlock conditions, branching progression |

### Key Design Insights (Milestone 5)

**Phoenix Wright Contradiction System**:
- Players find inconsistencies in witness testimony
- Present evidence that contradicts specific statements
- Evolved to include "mood matrix" (emotional contradictions) and "divination séances" (sensory contradictions)
- Case makers allow fan-created cases using same mechanics

**Unlock Path Design Philosophy**:
- Multiple paths prevent "moon logic" puzzles
- 2-3 evidence combinations per unlock reduces frustration
- Threshold-based unlocks reward thorough investigation
- "ANY_OF" requirements create strategic choice

**Narrative Best Practices**:
- Contradictions should point toward truth, not be arbitrary
- Every suspect needs plausible motive (no obvious red herrings)
- Morally grey characters create deeper engagement
- Resolution explains mechanism AND motive

## UI/UX and Game Flow Patterns (Milestone 6)

### Detective Game UI Examples

| Repository | URL | Relevance | Quality | Notes |
|------------|-----|-----------|---------|-------|
| Fungeey/detectiveboard | [github.com/fungeey/detectiveboard](https://github.com/Fungeey/detectiveboard) | Evidence board | High | Interactive web editor for detective boards, sticky notes + images |
| stefankober/detective-board | [github.com/stefankober/detective-board](https://github.com/stefankober/detective-board) | Minimal UI | Medium | Local-only, JS+HTML5 detective board, privacy-first |
| yashw22/deck-detective | [github.com/yashw22/deck-detective](https://github.com/yashw22/deck-detective) | Deduction game | Medium | React-based, multiplayer deduction mechanics |
| kayehld/mastermind | [github.com/kayehld/mastermind](https://github.com/kayehld/mastermind) | Deduction puzzle | Medium | React + TypeScript, board game patterns |

### Animation Libraries & Patterns

| Resource | URL | Type | Relevance |
|----------|-----|------|-----------|
| Motion (Framer Motion) | [motion.dev/docs/react-animation](https://motion.dev/docs/react-animation) | Library | React animation, v11+ with concurrent React support |
| AnimatePresence Pattern | [blog.logrocket.com/creating-react-animations-with-motion](https://blog.logrocket.com/creating-react-animations-with-motion/) | Tutorial | Mount/unmount transitions for unlocks, contradictions |
| Layout Animations | [motion.dev/docs/react-transitions](https://motion.dev/docs/react-transitions) | Reference | Smooth layout shifts, LayoutGroup API |
| Motion Examples | [motion.dev/examples](https://motion.dev/examples) | Examples | 330+ React/JS/Vue animation patterns |
| Best Practices | [ruixen.com/blog/react-anim-framer-spring](https://www.ruixen.com/blog/react-anim-framer-spring) | Article | Duration guidelines, accessibility, performance |

### Game Flow & Feedback Loops

| Resource | URL | Type | Relevance |
|----------|-----|------|-----------|
| Game Flow Theory | [vaia.com/en-us/explanations/computer-science/game-design-in-computer-science/game-flow](https://www.vaia.com/en-us/explanations/computer-science/game-design-in-computer-science/game-flow/) | Reference | Csikszentmihalyi flow theory for games |
| Feedback Loop Design | [machinations.io/articles/game-systems-feedback-loops-and-how-they-help-craft-player-experiences](https://machinations.io/articles/game-systems-feedback-loops-and-how-they-help-craft-player-experiences) | Article | Positive vs negative loops, balancing |
| Player Engagement | [cgspectrum.com/blog/game-design-principles-player-engagement](https://www.cgspectrum.com/blog/game-design-principles-player-engagement) | Article | Challenge-skill balance, flow states |
| Game Pacing | [meegle.com/en_us/topics/game-design/game-pacing](https://www.meegle.com/en_us/topics/game-design/game-pacing) | Reference | Adaptive difficulty, pacing tools |
| Engagement Loops | [helika.io/how-to-create-engagement-loops-in-game-design](https://www.helika.io/how-to-create-engagement-loops-in-game-design/) | Article | 3-step loops, core mechanics |

### Game UI/UX Resources

| Resource | URL | Type | Relevance |
|----------|-----|------|-----------|
| Game UI Database | [gameuidatabase.com](https://www.gameuidatabase.com/) | Database | 1,300+ games, 55,000+ screenshots, filter by category |
| Detective Game UI (Behance) | [behance.net/gallery/177854193/Detective-Adventure-Game-UI](https://www.behance.net/gallery/177854193/Detective-Adventure-Game-UI) | Portfolio | Detective game UI patterns |
| Game UI Best Practices | [genieee.com/best-practices-for-game-ui-ux-design](https://genieee.com/best-practices-for-game-ui-ux-design/) | Article | UI/UX fundamentals for games |

### Key Animation Patterns (Milestone 6)

**AnimatePresence Pattern** (for unlocks):
```typescript
import { motion, AnimatePresence } from 'framer-motion';

<AnimatePresence mode="wait">
  {unlockedHypotheses.map(h => (
    <motion.div
      key={h.id}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Hypothesis card */}
    </motion.div>
  ))}
</AnimatePresence>
```

**Layout Animation Pattern** (for evidence board):
```typescript
import { motion, LayoutGroup } from 'framer-motion';

<LayoutGroup>
  <motion.div layout>
    {/* Items will smoothly transition when layout changes */}
  </motion.div>
</LayoutGroup>
```

**Variants Pattern** (for staggered animations):
```typescript
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};
```

### Feedback Loop Design Insights

**Positive Feedback Loops** (Reinforcing):
- Unlock Tier 2 hypotheses → Better evidence relevance → More unlocks
- Contradiction discovery → Higher scores → More engagement
- Example: Call of Duty killstreaks

**Negative Feedback Loops** (Balancing):
- High IP spending → Lower efficiency score → Strategic constraint
- Premature closure → Lower score → Learn to investigate thoroughly
- Example: Mario Kart rubber-banding

**Design Principles**:
- 150-250ms: Micro-interactions (button clicks, card reveals)
- 250-400ms: Major transitions (phase changes, unlocks)
- Respect `prefers-reduced-motion`
- Use transform/opacity (GPU-accelerated)
- Avoid animating layout properties (performance)

---
Last Updated: 2026-01-01
