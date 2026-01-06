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

## Investigation Enhancement Patterns (Milestones 7-11)

### Active Hypothesis Selection Examples

| Repository | URL | Relevance | Quality | Notes |
|------------|-----|-----------|---------|-------|
| detective board selection | [Search: "hypothesis selection UI React"](https://github.com/search?q=hypothesis+selection+ui+react&type=repositories) | Interactive selection | - | Real-time filtering based on active choice |
| strategic choice highlight | [Search: "active filter visualization"](https://github.com/search?q=active+filter+visualization+react&type=repositories) | Visual feedback | - | Color-coded relevance indicators |

### Evidence Relevance Visualization

**Pattern: Color-coded relevance badges**
```typescript
// Use existing evidenceRelevance.ts utility
const relevance = calculateEvidenceRelevance(
  evidenceId,
  activeHypothesis,
  contradictions
);

// Apply color coding
const borderColor = {
  supports: 'border-l-4 border-green-500',
  contradicts: 'border-l-4 border-red-500',
  neutral: 'border-l-4 border-gray-300'
}[relevance];
```

**Pattern: Relevance badge with icons**
```typescript
const badges = {
  supports: { icon: '✓', color: 'bg-green-100 text-green-800', label: 'Supports' },
  contradicts: { icon: '✗', color: 'bg-red-100 text-red-800', label: 'Contradicts' },
  neutral: { icon: '○', color: 'bg-gray-100 text-gray-600', label: 'Neutral' }
};
```

### State Management for Active Hypothesis

**Pattern: activeHypothesisId state**
```typescript
interface EnhancedPlayerState {
  activeHypothesisId: string | null;
  hypothesisPivots: Array<{
    fromHypothesisId: string | null;
    toHypothesisId: string;
    timestamp: Date;
  }>;
}

// Reducer actions
case 'SET_ACTIVE_HYPOTHESIS':
  return {
    ...state,
    activeHypothesisId: action.hypothesisId,
    hypothesisPivots: [
      ...state.hypothesisPivots,
      {
        fromHypothesisId: state.activeHypothesisId,
        toHypothesisId: action.hypothesisId,
        timestamp: new Date()
      }
    ]
  };
```

### Key Design Insights (Milestones 7-11)

**Active Hypothesis Selection Benefits**:
- Restores player agency (choose what to investigate)
- Creates strategic tension (focused vs exploratory)
- Enables iterative detective work (hypothesis → test → pivot)
- Teaches scientific method (update beliefs based on evidence)

**Evidence Relevance Visualization Benefits**:
- Makes strategic choices visible before spending IP
- Reduces random evidence collection
- Provides real-time feedback loop
- Shows impact of evidence on theories

**Pivot Tracking Benefits**:
- Records investigation strategy for scoring
- Enables future analytics (pivot quality metrics)
- Teaches adaptive reasoning (changing theory when contradicted)
- No immediate scoring impact (future enhancement)

**Accessibility Considerations**:
- Color-blind safe: icons + text labels, not just colors
- Keyboard navigation: Tab + Enter for hypothesis selection
- Screen reader: ARIA live regions for hypothesis changes
- Reduced motion: Respect prefers-reduced-motion setting

## LLM Integration & Text Adventure Patterns (Phase 1 Rebuild)

### Claude API Python SDK

| Resource | URL | Type | Relevance |
|----------|-----|------|-----------|
| Anthropic Python SDK | [github.com/anthropics/anthropic-sdk-python](https://github.com/anthropics/anthropic-sdk-python) | Official SDK | Async client, streaming, error handling |
| Claude Agent SDK (Python) | [docs.anthropic.com/en/docs/agent-sdk/python](https://docs.anthropic.com/en/docs/agent-sdk/python) | Official Docs | Agent patterns, context isolation |
| FastAPI Async Best Practices | [github.com/zhanymkanov/fastapi-best-practices](https://github.com/zhanymkanov/fastapi-best-practices) | GitHub (4.8k⭐) | Project structure, testing, async routes |
| FastAPI Async Routes | [fastapi.tiangolo.com/async/](https://fastapi.tiangolo.com/async/) | Official Docs | When to use async vs sync, concurrency |

### Text Adventure LLM Mechanics

| Repository | URL | Relevance | Quality | Notes |
|------------|-----|-----------|---------|-------|
| iankelk/llm-text-adventure | [github.com/iankelk/llm-text-adventure](https://github.com/iankelk/llm-text-adventure) | Freeform input | Medium | LLM as game master, player action handling |
| ronaldstoner/LLMLabyrinth | [github.com/ronaldstoner/LLMLabyrinth](https://github.com/ronaldstoner/LLMLabyrinth) | Text-based | Medium | Console adventure, local GPT |
| nferraz/gpt-adventures | [github.com/nferraz/gpt-adventures](https://github.com/nferraz/gpt-adventures) | Game engine | Medium | GPT-3.5 game master, text-based RPG |

### Key Patterns (Phase 1)

**AsyncAnthropic Client Pattern**:
```python
from anthropic import AsyncAnthropic
import os

client = AsyncAnthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

async def get_narrator_response(prompt: str) -> str:
    message = await client.messages.create(
        model="claude-haiku-4",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}]
    )
    return message.content[0].text
```

**FastAPI Async Route Pattern**:
```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class InvestigateRequest(BaseModel):
    player_input: str
    case_id: str
    location_id: str

@app.post("/investigate")
async def investigate(request: InvestigateRequest):
    # Async route for I/O-bound LLM call
    response = await get_narrator_response(request.player_input)
    return {"narrator_response": response}
```

**Evidence Trigger Matching Pattern**:
```python
def matches_trigger(player_input: str, triggers: list[str]) -> bool:
    """Check if player input matches any trigger keyword."""
    input_lower = player_input.lower()
    return any(trigger in input_lower for trigger in triggers)
```

### Design Insights (Rebuild)

**LLM Narrator Benefits**:
- Freeform investigation (type anything, LLM responds)
- No pixel hunting (if it makes sense, LLM allows it)
- Natural language processing (no rigid command syntax)
- Atmospheric descriptions (DnD-style narration)

**Hallucination Prevention**:
- `not_present` items in YAML (strict prompt rules)
- `hidden_evidence` triggers (only reveal if investigated)
- `discovered_evidence` tracking (no re-discovery)
- Prompt engineering: "If undefined → atmosphere only, NO new clues"

**Context Isolation**:
- Narrator: Knows location, evidence, not_present (no witness secrets)
- Witness: Knows personality, secrets, lies (no other characters' info)
- Mentor: Knows solution, fallacies (no investigation details)

## Witness Interrogation & LLM Character Systems (Phase 2)

### Interrogation Mechanics

| Resource | URL | Type | Relevance |
|----------|-----|------|-----------|
| LA Noire Interrogation System | [significant-bits.com/l-a-noires-interrogation-system/](https://significant-bits.com/l-a-noires-interrogation-system/) | Article | Truth/Doubt/Lie mechanics, trust-based systems |
| LA Noire Dialogue Options (Remaster) | [pastemagazine.com/games/l-a-noire/](https://pastemagazine.com/games/l-a-noire/la-noire-how-do-the-new-dialogue-options-hold-up) | Article | Good Cop/Bad Cop/Accuse pattern |
| Phoenix Wright Mechanics | [neogaf.com/threads/whats-the-solution-to-phoenix-wright-la-noire](https://www.neogaf.com/threads/so-whats-the-solution-to-the-fundamental-phoenix-wright-la-noire-issue.480876/) | Discussion | Evidence presentation triggers |

### LLM Character Personality & Context Isolation

| Resource | URL | Type | Relevance |
|----------|-----|------|-----------|
| Claude 4.5 Role Prompting | [platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/keep-claude-in-character](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/keep-claude-in-character) | Official Docs | Keep witness in character, prevent context bleeding |
| Claude 4.5 Best Practices | [platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-4-best-practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-4-best-practices) | Official Docs | Character personality prompts, system prompts |
| Claude Messages API | [docs.anthropic.com/en/api/messages](https://docs.anthropic.com/en/api/messages) | Official Docs | Multiple isolated contexts pattern |

### Key Patterns (Phase 2)

**LA Noire Trust Mechanics**:
- Trust-based responses (low trust = lies, high trust = truth)
- Evidence presentation increases trust
- Aggressive questions decrease trust (-10), empathetic increase (+5)

**Phoenix Wright Evidence Pattern**:
- Present evidence to witness → triggers secret revelation
- Evidence contradicts testimony → narrative progress
- Scripted critical path (all players experience key reveals)

**Claude 4.5 Character Isolation**:
```python
# Separate context for witness (isolated from narrator)
witness_system_prompt = f"""You are {name}, a character in Harry Potter detective game.

PERSONALITY: {personality}
TRUST LEVEL: {trust}/100

YOU DO NOT KNOW:
- Investigation details
- Other witness testimony
- Case solution
- Narrator context

RULES:
1. Stay in character
2. If trust < 30: Be evasive, may lie
3. If trust > 70: Reveal secrets when appropriate
4. Keep responses 2-4 sentences
"""
```

**Trust Adjustment Pattern**:
```python
def adjust_trust(question: str) -> int:
    """Calculate trust delta based on question tone."""
    aggressive = ["lie", "lying", "accuse", "guilty"]
    empathetic = ["understand", "help", "remember", "tell me"]

    if any(kw in question.lower() for kw in aggressive):
        return -10  # Bad cop
    elif any(kw in question.lower() for kw in empathetic):
        return +5   # Good cop
    else:
        return 0    # Neutral
```

**Evidence Presentation Detection**:
```python
import re

def detect_evidence_presentation(player_input: str) -> str | None:
    """Check if player is presenting evidence."""
    patterns = [
        r"show (?:the )?(\w+)",
        r"present (?:the )?(\w+)",
        r"give (?:the )?(\w+)"
    ]

    for pattern in patterns:
        match = re.search(pattern, player_input.lower())
        if match:
            return match.group(1)  # Evidence ID

    return None
```

### Design Insights (Phase 2)

**Witness Interrogation Benefits**:
- Freeform questioning (no predefined dialogue trees)
- Trust mechanics create strategic tension
- Evidence presentation feels meaningful (triggers secrets)
- Character-driven responses (personality-based)

**Context Isolation Benefits**:
- Prevents knowledge leakage between LLM contexts
- Maintains narrative integrity (witness doesn't know solution)
- Enables realistic character behavior (secrets remain hidden)
- Supports future multi-agent systems (narrator/witness/mentor)

**Trust System Benefits**:
- Player agency (choose question tone)
- Feedback loop (see trust change after questions)
- Educational value (teach interview techniques)
- Strategic depth (when to be aggressive vs empathetic)

---
Last Updated: 2026-01-05
