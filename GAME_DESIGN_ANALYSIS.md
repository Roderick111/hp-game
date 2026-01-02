# Game Design Analysis: Investigation Phase Critical Issues

**Date**: 2026-01-02
**Analyzer**: Game Design Expert
**Project**: HP Detective Game (Hypothesis Formation & Investigation)

---

## 1. Executive Summary

**What's Broken**: The investigation phase lacks meaningful player agency. Players passively select hypotheses in Phase 2, then collect evidence in Phase 3 without the ability to dynamically pivot, develop new theories, or strategically choose which hypothesis to actively investigate. This creates a "quiz with extra steps" experience where the correct answer is predetermined and player choices feel cosmetic rather than strategic.

**Root Cause**: The game architecture separates hypothesis selection (Phase 2) from investigation (Phase 3) with no feedback loop between them. Evidence collection is divorced from hypothesis testing, creating a linear "view hypotheses → collect random evidence → submit answer" flow that prevents iterative detective work.

---

## 2. Current State Analysis

### 2.1 What Mechanics Exist

**Hypothesis Unlocking System** (`src/utils/unlocking.ts`):
- Tier 1 hypotheses: Always visible (7 hypotheses in mission1)
- Tier 2 hypotheses: Unlock based on evidence collected via `unlockRequirements` (any_of/all_of logic)
- Unlock conditions are passive: evidence unlocks hypotheses automatically

**Evidence Relevance System** (`src/utils/evidenceRelevance.ts`):
- Calculates `supports`, `contradicts`, or `neutral` relationships between evidence and hypotheses
- Checks evidence against unlock requirements and contradiction definitions
- **CRITICAL**: This system exists but is not surfaced to the player during investigation

**Investigation Point Economy**:
- Players spend IP to collect evidence from three categories: locations, witnesses, records
- Evidence costs 1-2 IP each
- No guidance on which evidence supports which hypothesis

**Scoring System** (`src/utils/scoring.ts`):
- Tracks IP efficiency, contradictions discovered, bias identification
- Calculated AFTER the game ends (Phase 6: Review)
- **CRITICAL**: No real-time feedback during investigation

**Contradiction Detection** (`src/utils/contradictions.ts`):
- Detects when collected evidence contradicts hypotheses
- Shows toast notifications when contradictions are discovered
- **LIMITATION**: Only tells player "X contradicts Y" without guidance on what to do next

### 2.2 What's Missing

**Active Hypothesis Selection During Investigation**:
- Phase 2 (Hypothesis Formation): Players can toggle hypotheses and assign probabilities
- Phase 3 (Investigation): NO mechanism to choose which hypothesis to actively pursue
- Players cannot say "I want to investigate Victor's guilt" and get relevant evidence suggestions

**Dynamic Hypothesis Pivoting**:
- Once Phase 3 begins, players cannot update their hypothesis probabilities
- If evidence contradicts their initial theory, they cannot shift focus mid-investigation
- No "working hypothesis" vs "alternative theories" distinction

**Strategic Investigation Guidance**:
- No visual indicators showing which evidence supports/contradicts which hypotheses
- No "confidence meter" showing hypothesis strength based on collected evidence
- No recommendation system suggesting next best evidence to collect

**Hypothesis Development Mechanic**:
- Players cannot develop NEW hypotheses based on discovered evidence
- Tier 2 unlocks happen automatically but don't prompt strategic re-evaluation
- No "aha moment" mechanic where player creates composite theories

### 2.3 Why It Feels Like "A Quiz With Extra Steps"

| Quiz Characteristic | Current Game Implementation |
|---------------------|----------------------------|
| One correct answer predetermined | Yes - `isCorrect: true/false` in hypothesis data |
| Linear progression (question → answer) | Yes - Briefing → Hypothesis → Investigation → Submit |
| No strategic choices | Correct - Evidence collection order doesn't matter |
| Passive information gathering | Correct - Click evidence, read text, repeat |
| Single submission at end | Correct - Only one final answer in Case Review |
| No iteration/refinement | Correct - Cannot update hypotheses during investigation |

**The Missing Element**: Detective games require **hypothesis-driven inquiry** where players:
1. Form initial theory
2. Seek evidence to test theory
3. Update theory based on findings
4. Repeat until confident

Currently, the game skips steps 2-4 entirely.

---

## 3. Player Experience Problems

### 3.1 Lack of Agency (Primary Issue)

**Problem**: Players cannot choose what to investigate based on their working hypothesis.

**User Quote**: "We can not develop and investigate a new hypothesis"

**Current Flow**:
```
Phase 2: View 7 hypotheses → Toggle 3-4 → Assign probabilities → Next
Phase 3: Collect evidence in any order → Tier 2 unlocks happen → Next
Phase 4: Submit final answer
```

**What Players Want**:
```
Phase 2: Form initial hypothesis → "I think Victor did it"
Phase 3: "Show me evidence about Victor" → Collect targeted evidence
          → "Wait, this contradicts my theory"
          → "Let me pivot to investigate the cursed violin instead"
          → Continue until confident
Phase 4: Submit answer based on accumulated evidence
```

**Code Impact**:
- `HypothesisFormation.tsx` has `toggleHypothesis()` but only works in Phase 2
- `Investigation.tsx` has no concept of "active hypothesis" to guide evidence collection
- `GameContext.tsx` stores `selectedHypotheses` but doesn't use it after Phase 2

### 3.2 Lack of Feedback

**Problem**: Players cannot see how collected evidence affects hypothesis validity.

**User Quote**: "Missing feedback"

**What Exists But Isn't Visible**:
- `evidenceRelevance.ts` calculates supports/contradicts relationships
- `contradictions.ts` detects conflicting evidence
- Both systems work correctly but don't provide **real-time strategic feedback**

**What Players Need**:
- **Before collecting evidence**: "This evidence supports hypothesis A, contradicts B, neutral to C"
- **After collecting evidence**: "Hypothesis A: 3 supports, 1 contradiction, confidence 65%"
- **Visual indicators**: Color-coded evidence cards (green = supports active hypothesis, red = contradicts, gray = neutral)

**Implementation Gap**:
```typescript
// Current: Evidence cards show title, description, cost
// Missing: Evidence cards should show relevance badges

<EvidenceCard
  evidence={action.evidence}
  cost={action.cost}
  relevance="supports"  // NEW
  affectedHypotheses={["victor-guilty", "cursed-violin"]}  // NEW
/>
```

### 3.3 Lack of Depth

**Problem**: Investigation is breadth-only (collect all evidence) with no depth (targeted inquiry).

**User Quote**: "Investigation is too flat now, not deep enough - that's a problem of game mechanics, not of the narrative"

**Current Mechanics**:
- 12 investigation actions in mission1.ts
- Players collect 7-9 pieces (limited by 7 IP)
- Order doesn't matter (all evidence visible upfront)
- No strategic choices (just pick cheapest or most interesting)

**Missing Strategic Layer**:
- **Investigation Paths**: Different evidence chains lead to different hypotheses
  - Victor path: St Mungo's records → Victor's quarters → Relationship history
  - Violin path: Examine violin → Provenance research → Curse detection
  - Rivalry path: Interview witnesses → Check professional records → Motive analysis

- **Resource Tension**: Should I spend 2 IP on definitive evidence or 1 IP on two clues?

- **Information Asymmetry**: Some evidence is more valuable than appears (teaches meta-skill)

**Code Impact**:
```typescript
// Current: InvestigationAction has category, cost, evidence
// Missing: InvestigationAction needs relevanceMap

interface InvestigationAction {
  id: string;
  category: 'location' | 'witness' | 'records';
  title: string;
  cost: number;
  evidence: Evidence;

  // NEW: Show which hypotheses this evidence affects
  relevanceMap?: {
    [hypothesisId: string]: 'supports' | 'contradicts' | 'neutral';
  };
}
```

### 3.4 Lack of Flexibility

**Problem**: Cannot change strategy mid-investigation after discovering new evidence.

**User Quote**: "Right now the ending is forced, but what if I changed my mind after unlocking some evidence? Why can not I continue developing another hypothesis?"

**Current Constraints**:
- `selectedHypotheses` is set in Phase 2 (Hypothesis Formation)
- Phase 3 (Investigation) cannot modify this array
- Phase 4 (Prediction) only allows probability updates, not hypothesis changes

**Real Detective Work**:
```
Initial Theory: "Victor attacked Elara out of jealousy"
Evidence Found: Victor has alibi (St Mungo's records)
Pivot: "Wait, maybe it's the cursed violin instead"
Evidence Found: Violin provenance shows no curse history
Pivot: "What if it's professional rivalry with Marcus?"
Evidence Found: Marcus had motive + opportunity
Final Answer: "Marcus is guilty"
```

**Missing Code**:
```typescript
// Investigation.tsx needs new action
const switchActiveHypothesis = (hypothesisId: string) => {
  dispatch({
    type: 'SET_ACTIVE_HYPOTHESIS',
    hypothesisId,
    timestamp: Date.now()
  });
};

// GameContext needs new state
interface PlayerState {
  // ...existing fields
  activeHypothesisId: string | null;  // NEW: Which hypothesis player is currently investigating
  hypothesisHistory: Array<{  // NEW: Track pivots for scoring
    hypothesisId: string;
    timestamp: number;
    triggeredByEvidence?: string;
  }>;
}
```

---

## 4. Recommended Solutions (Prioritized)

### Priority 1: Active Hypothesis Selection (HIGH IMPACT, 1-2 days)

**What**: Add "Focus Investigation" button to each hypothesis card in Investigation phase.

**Why**: Solves primary agency problem - players can choose what to investigate.

**How**:

**Step 1**: Add active hypothesis state to GameContext
```typescript
// src/context/GameContext.tsx
interface EnhancedPlayerState {
  // ...existing fields
  activeHypothesisId: string | null;
  investigationStrategy: 'exploratory' | 'focused';
}

// Add new action
type GameAction =
  | { type: 'SET_ACTIVE_HYPOTHESIS'; hypothesisId: string }
  | { type: 'CLEAR_ACTIVE_HYPOTHESIS' }
  | ...existing actions;

// In reducer
case 'SET_ACTIVE_HYPOTHESIS':
  return {
    ...state,
    activeHypothesisId: action.hypothesisId,
    investigationStrategy: 'focused',
  };
```

**Step 2**: Update Investigation.tsx UI
```typescript
// src/components/phases/Investigation.tsx
export function Investigation({ caseData }: Props) {
  const { state, dispatch } = useGame();
  const activeHypId = state.activeHypothesisId;

  return (
    <div>
      {/* NEW: Active Hypothesis Panel */}
      {activeHypId && (
        <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-300 rounded">
          <h3 className="font-bold text-blue-900">
            Currently Investigating: {caseData.hypotheses.find(h => h.id === activeHypId)?.label}
          </h3>
          <button
            onClick={() => dispatch({ type: 'CLEAR_ACTIVE_HYPOTHESIS' })}
            className="text-sm text-blue-600 hover:underline"
          >
            Switch to exploratory mode
          </button>
        </div>
      )}

      {/* NEW: Hypothesis selection sidebar */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3">
          <h3 className="font-bold mb-2">Choose Focus:</h3>
          {caseData.hypotheses.map(h => (
            <button
              key={h.id}
              onClick={() => dispatch({ type: 'SET_ACTIVE_HYPOTHESIS', hypothesisId: h.id })}
              className={`w-full p-2 mb-2 rounded ${
                activeHypId === h.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>

        <div className="col-span-9">
          {/* Existing evidence collection UI */}
        </div>
      </div>
    </div>
  );
}
```

**Step 3**: Filter/highlight evidence based on active hypothesis
```typescript
// In Investigation.tsx, when rendering evidence cards
const getEvidenceRelevance = (evidenceId: string): string => {
  if (!state.activeHypothesisId) return 'neutral';
  const hypothesis = caseData.hypotheses.find(h => h.id === state.activeHypothesisId);
  // Use existing evidenceRelevance.ts utility
  return calculateEvidenceRelevance(evidenceId, hypothesis, caseData.contradictions);
};

// Apply visual treatment
<EvidenceCard
  {...action}
  relevance={getEvidenceRelevance(action.id)}
  className={
    getEvidenceRelevance(action.id) === 'supports'
      ? 'border-green-400 bg-green-50'
      : getEvidenceRelevance(action.id) === 'contradicts'
        ? 'border-red-400 bg-red-50'
        : ''
  }
/>
```

**Effort**: 8-12 hours
**Impact**: HIGH - Directly addresses "we can not choose any other hypothesis"

---

### Priority 2: Hypothesis Confidence System (HIGH IMPACT, 1-2 days)

**What**: Real-time confidence meters showing hypothesis strength based on collected evidence.

**Why**: Provides feedback loop missing from current design - players see impact of evidence.

**How**:

**Step 1**: Calculate dynamic confidence scores
```typescript
// src/utils/confidence.ts (NEW FILE)
import type { ConditionalHypothesis, PlayerState, CaseData } from '../types/game';
import { getRelevantHypotheses } from './evidenceRelevance';

export interface HypothesisConfidence {
  hypothesisId: string;
  supportingEvidence: string[];
  contradictingEvidence: string[];
  neutralEvidence: string[];
  confidenceScore: number; // 0-100
  recommendation: 'strong' | 'moderate' | 'weak' | 'refuted';
}

export function calculateHypothesisConfidence(
  hypothesis: ConditionalHypothesis,
  collectedEvidenceIds: string[],
  caseData: CaseData
): HypothesisConfidence {
  const supporting: string[] = [];
  const contradicting: string[] = [];
  const neutral: string[] = [];

  // Use existing evidenceRelevance.ts logic
  collectedEvidenceIds.forEach(evidenceId => {
    const relevance = calculateEvidenceRelevance(
      evidenceId,
      hypothesis,
      caseData.contradictions
    );

    if (relevance === 'supports') supporting.push(evidenceId);
    else if (relevance === 'contradicts') contradicting.push(evidenceId);
    else neutral.push(evidenceId);
  });

  // Calculate confidence score
  const supportWeight = 15; // Each supporting evidence adds 15%
  const contradictWeight = -25; // Each contradiction removes 25%
  const baseScore = 30; // Start at 30% (some plausibility)

  const confidenceScore = Math.max(
    0,
    Math.min(
      100,
      baseScore + (supporting.length * supportWeight) + (contradicting.length * contradictWeight)
    )
  );

  // Determine recommendation
  let recommendation: HypothesisConfidence['recommendation'];
  if (contradicting.length > 0) recommendation = 'refuted';
  else if (confidenceScore >= 70) recommendation = 'strong';
  else if (confidenceScore >= 40) recommendation = 'moderate';
  else recommendation = 'weak';

  return {
    hypothesisId: hypothesis.id,
    supportingEvidence: supporting,
    contradictingEvidence: contradicting,
    neutralEvidence: neutral,
    confidenceScore,
    recommendation,
  };
}

export function getAllHypothesisConfidences(
  hypotheses: ConditionalHypothesis[],
  collectedEvidenceIds: string[],
  caseData: CaseData
): HypothesisConfidence[] {
  return hypotheses.map(h => calculateHypothesisConfidence(h, collectedEvidenceIds, caseData));
}
```

**Step 2**: Display confidence meters in Investigation phase
```typescript
// src/components/ui/ConfidenceMeter.tsx (NEW FILE)
interface Props {
  confidence: HypothesisConfidence;
  isActive: boolean;
}

export function ConfidenceMeter({ confidence, isActive }: Props) {
  const { confidenceScore, recommendation, supportingEvidence, contradictingEvidence } = confidence;

  const colors = {
    strong: 'bg-green-500',
    moderate: 'bg-yellow-500',
    weak: 'bg-orange-500',
    refuted: 'bg-red-500',
  };

  return (
    <div className={`p-3 rounded ${isActive ? 'border-2 border-blue-500' : 'border border-gray-300'}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold text-sm">{confidence.hypothesisId}</span>
        <span className={`px-2 py-1 rounded text-xs text-white ${colors[recommendation]}`}>
          {recommendation.toUpperCase()}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full ${colors[recommendation]}`}
          style={{ width: `${confidenceScore}%` }}
        />
      </div>

      {/* Evidence summary */}
      <div className="text-xs text-gray-600 flex gap-3">
        <span className="text-green-700">✓ {supportingEvidence.length} supporting</span>
        <span className="text-red-700">✗ {contradictingEvidence.length} contradicting</span>
      </div>
    </div>
  );
}
```

**Step 3**: Integrate into Investigation.tsx
```typescript
// Add to Investigation.tsx
const allConfidences = getAllHypothesisConfidences(
  caseData.hypotheses,
  state.collectedEvidenceIds,
  caseData
);

return (
  <div>
    {/* Confidence Dashboard */}
    <div className="mb-6 p-4 bg-gray-50 rounded">
      <h3 className="font-bold mb-3">Hypothesis Confidence</h3>
      <div className="grid grid-cols-2 gap-3">
        {allConfidences.map(conf => (
          <ConfidenceMeter
            key={conf.hypothesisId}
            confidence={conf}
            isActive={state.activeHypothesisId === conf.hypothesisId}
          />
        ))}
      </div>
    </div>
    {/* ... rest of Investigation UI */}
  </div>
);
```

**Effort**: 10-14 hours
**Impact**: HIGH - Provides missing feedback loop, makes evidence collection feel meaningful

---

### Priority 3: Mid-Investigation Hypothesis Pivoting (HIGH IMPACT, 1 day)

**What**: Allow players to switch active hypothesis during investigation with visual feedback.

**Why**: Solves flexibility problem - "what if I changed my mind after unlocking evidence?"

**How**:

**Step 1**: Add pivot tracking to GameContext
```typescript
// src/context/GameContext.tsx
interface EnhancedPlayerState {
  // ...existing
  hypothesisPivots: Array<{
    fromHypothesisId: string | null;
    toHypothesisId: string;
    timestamp: number;
    triggeredByEvidence?: string; // Optional: which evidence caused pivot
  }>;
}

// New action
case 'PIVOT_HYPOTHESIS':
  return {
    ...state,
    activeHypothesisId: action.toHypothesisId,
    hypothesisPivots: [
      ...state.hypothesisPivots,
      {
        fromHypothesisId: state.activeHypothesisId,
        toHypothesisId: action.toHypothesisId,
        timestamp: Date.now(),
        triggeredByEvidence: action.evidenceId,
      },
    ],
  };
```

**Step 2**: Add pivot UI with confirmation
```typescript
// src/components/ui/PivotConfirmation.tsx (NEW FILE)
interface Props {
  fromHypothesis: ConditionalHypothesis;
  toHypothesis: ConditionalHypothesis;
  reason?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PivotConfirmation({ fromHypothesis, toHypothesis, reason, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md">
        <h3 className="font-bold text-lg mb-3">Switch Investigation Focus?</h3>
        <p className="text-gray-700 mb-2">
          You are currently investigating: <strong>{fromHypothesis.label}</strong>
        </p>
        <p className="text-gray-700 mb-4">
          Switch to: <strong>{toHypothesis.label}</strong>
        </p>
        {reason && (
          <p className="text-sm text-amber-700 bg-amber-50 p-2 rounded mb-4">
            💡 Reason: {reason}
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Switch Focus
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Step 3**: Trigger pivots based on contradictions
```typescript
// In Investigation.tsx, after collecting evidence
const collectEvidence = (action: InvestigationAction) => {
  if (ip < action.cost || isCollected(action.id)) return;

  dispatch({
    type: 'COLLECT_EVIDENCE',
    actionId: action.id,
    cost: action.cost,
  });

  // NEW: Check if this evidence contradicts active hypothesis
  if (state.activeHypothesisId) {
    const activeHyp = caseData.hypotheses.find(h => h.id === state.activeHypothesisId);
    const relevance = calculateEvidenceRelevance(action.id, activeHyp, caseData.contradictions);

    if (relevance === 'contradicts') {
      // Find alternative hypothesis this evidence supports
      const alternatives = caseData.hypotheses.filter(h => {
        const rel = calculateEvidenceRelevance(action.id, h, caseData.contradictions);
        return rel === 'supports';
      });

      if (alternatives.length > 0) {
        // Suggest pivot
        setShowPivotSuggestion({
          from: activeHyp,
          to: alternatives[0],
          reason: `Evidence "${action.title}" contradicts your current theory`,
          evidenceId: action.id,
        });
      }
    }
  }
};
```

**Effort**: 6-8 hours
**Impact**: HIGH - Enables iterative detective work, core to genre

---

### Priority 4: Evidence Relevance Visualization (MEDIUM IMPACT, 4-6 hours)

**What**: Color-code and badge evidence cards based on relevance to active hypothesis.

**Why**: Makes strategic choices visible before spending IP.

**How**:

**Step 1**: Add relevance badges to EvidenceCard component
```typescript
// src/components/ui/EvidenceCard.tsx (MODIFY EXISTING)
interface EvidenceCardProps {
  // ...existing props
  relevanceToActiveHypothesis?: 'supports' | 'contradicts' | 'neutral';
  affectedHypotheses?: Array<{ id: string; label: string; type: 'supports' | 'contradicts' }>;
}

export function EvidenceCard({ relevanceToActiveHypothesis, affectedHypotheses, ...props }: EvidenceCardProps) {
  const badges = {
    supports: { icon: '✓', color: 'bg-green-100 text-green-800', label: 'Supports' },
    contradicts: { icon: '✗', color: 'bg-red-100 text-red-800', label: 'Contradicts' },
    neutral: { icon: '○', color: 'bg-gray-100 text-gray-600', label: 'Neutral' },
  };

  const badge = relevanceToActiveHypothesis ? badges[relevanceToActiveHypothesis] : null;

  return (
    <div className={`evidence-card ${badge ? `border-l-4 ${badge.color.split(' ')[0].replace('bg-', 'border-')}` : ''}`}>
      {/* Existing card content */}

      {badge && (
        <div className={`mt-2 inline-flex items-center px-2 py-1 rounded text-xs ${badge.color}`}>
          <span className="mr-1">{badge.icon}</span>
          <span>{badge.label} active hypothesis</span>
        </div>
      )}

      {affectedHypotheses && affectedHypotheses.length > 0 && (
        <div className="mt-2 text-xs text-gray-600">
          <details>
            <summary className="cursor-pointer hover:text-gray-800">
              Affects {affectedHypotheses.length} hypothesis(es)
            </summary>
            <ul className="mt-1 ml-4 space-y-1">
              {affectedHypotheses.map(h => (
                <li key={h.id} className={h.type === 'supports' ? 'text-green-700' : 'text-red-700'}>
                  {h.type === 'supports' ? '✓' : '✗'} {h.label}
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </div>
  );
}
```

**Step 2**: Calculate and pass relevance data in Investigation.tsx
```typescript
// In Investigation.tsx, when rendering evidence
const renderEvidenceCard = (action: InvestigationAction) => {
  const affectedHypotheses = caseData.hypotheses
    .map(h => ({
      id: h.id,
      label: h.label,
      type: calculateEvidenceRelevance(action.id, h, caseData.contradictions),
    }))
    .filter(h => h.type !== 'neutral');

  const relevanceToActive = state.activeHypothesisId
    ? calculateEvidenceRelevance(
        action.id,
        caseData.hypotheses.find(h => h.id === state.activeHypothesisId)!,
        caseData.contradictions
      )
    : undefined;

  return (
    <EvidenceCard
      {...action}
      relevanceToActiveHypothesis={relevanceToActive}
      affectedHypotheses={affectedHypotheses}
    />
  );
};
```

**Effort**: 4-6 hours
**Impact**: MEDIUM - Improves strategic clarity, low implementation risk

---

### Priority 5: Investigation Strategy Layer (MEDIUM IMPACT, 1-2 days)

**What**: Add "Investigation Paths" feature - guided evidence chains that teach optimal strategies.

**Why**: Adds depth without complexity, teaches meta-skill of systematic inquiry.

**How**:

**Step 1**: Define investigation paths in mission data
```typescript
// src/data/mission1.ts (ADD TO EXISTING)
export const mission1: CaseData = {
  // ...existing fields

  // NEW: Investigation paths
  investigationPaths: [
    {
      id: 'victor-path',
      name: 'Investigate Victor Ashworth',
      description: 'Follow the ex-partner angle',
      targetHypothesis: 'victor-guilty',
      recommendedEvidence: [
        'stmungos-records',    // 1 IP - shows Victor visited
        'victor-quarters',     // 2 IP - finds incriminating evidence
        'witness-interview-1', // 1 IP - witnesses saw argument
      ],
      totalCost: 4,
      expectedOutcome: 'This path will reveal Victor had motive and opportunity, but also an alibi.',
    },
    {
      id: 'violin-path',
      name: 'Investigate the Violin',
      description: 'Examine the instrument itself',
      targetHypothesis: 'cursed-violin',
      recommendedEvidence: [
        'examine-violin',      // 2 IP - magical residue detected
        'provenance-research', // 1 IP - cursed history
        'curse-detection',     // 1 IP - confirms curse
      ],
      totalCost: 4,
      expectedOutcome: 'This path will establish the violin as the source of the curse.',
    },
    {
      id: 'rivalry-path',
      name: 'Investigate Professional Rivalry',
      description: 'Look into Marcus Bellamy',
      targetHypothesis: 'marcus-guilty',
      recommendedEvidence: [
        'witness-interview-2', // 1 IP - witnesses saw tension
        'professional-records',// 1 IP - shows rivalry history
        'marcus-quarters',     // 2 IP - finds curse materials
      ],
      totalCost: 4,
      expectedOutcome: 'This path will reveal Marcus had both motive and means to curse Elara.',
    },
  ],
};
```

**Step 2**: Add path selection UI
```typescript
// src/components/ui/InvestigationPathCard.tsx (NEW FILE)
interface InvestigationPath {
  id: string;
  name: string;
  description: string;
  targetHypothesis: string;
  recommendedEvidence: string[];
  totalCost: number;
  expectedOutcome: string;
}

interface Props {
  path: InvestigationPath;
  isActive: boolean;
  onSelect: () => void;
  collectedEvidenceIds: string[];
}

export function InvestigationPathCard({ path, isActive, onSelect, collectedEvidenceIds }: Props) {
  const completedSteps = path.recommendedEvidence.filter(id =>
    collectedEvidenceIds.includes(id)
  ).length;
  const totalSteps = path.recommendedEvidence.length;
  const progress = (completedSteps / totalSteps) * 100;

  return (
    <div
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
        isActive
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
      }`}
      onClick={onSelect}
    >
      <h4 className="font-bold text-lg mb-1">{path.name}</h4>
      <p className="text-sm text-gray-600 mb-3">{path.description}</p>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progress</span>
          <span>{completedSteps}/{totalSteps} evidence</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="text-xs text-gray-500">
        <div>Cost: {path.totalCost} IP</div>
        <div className="mt-1 italic">{path.expectedOutcome}</div>
      </div>
    </div>
  );
}
```

**Step 3**: Integrate paths into Investigation phase
```typescript
// In Investigation.tsx
const [activePath, setActivePath] = useState<string | null>(null);

return (
  <div>
    {/* Investigation Paths Section */}
    <div className="mb-6">
      <h3 className="font-bold text-xl mb-3">Investigation Strategies</h3>
      <div className="grid grid-cols-3 gap-4">
        {caseData.investigationPaths?.map(path => (
          <InvestigationPathCard
            key={path.id}
            path={path}
            isActive={activePath === path.id}
            onSelect={() => {
              setActivePath(path.id);
              // Also set active hypothesis
              dispatch({ type: 'SET_ACTIVE_HYPOTHESIS', hypothesisId: path.targetHypothesis });
            }}
            collectedEvidenceIds={state.collectedEvidenceIds}
          />
        ))}
      </div>
    </div>

    {/* When path is active, highlight recommended evidence */}
    {activePath && renderEvidenceWithPathHighlights()}
  </div>
);
```

**Effort**: 8-12 hours
**Impact**: MEDIUM - Adds strategic depth, good for educational goals

---

## 5. Implementation Roadmap

### Phase 1: Quick Wins (Days 1-3)

**Goal**: Restore player agency with minimal code changes

**Tasks**:
1. **Day 1**: Implement Priority 1 (Active Hypothesis Selection)
   - Add `activeHypothesisId` to GameContext
   - Add hypothesis selection sidebar to Investigation.tsx
   - Basic visual highlighting of active hypothesis
   - **Deliverable**: Players can choose which hypothesis to investigate

2. **Day 2**: Implement Priority 4 (Evidence Relevance Visualization)
   - Modify EvidenceCard component to show relevance badges
   - Calculate relevance using existing evidenceRelevance.ts
   - Color-code evidence cards (green/red/gray borders)
   - **Deliverable**: Players can see which evidence supports/contradicts theories

3. **Day 3**: Testing & Polish
   - Playtest Phase 1 changes
   - Fix bugs and UX issues
   - Write unit tests for new GameContext actions
   - **Deliverable**: Stable build with agency improvements

**Success Criteria**:
- Players can select active hypothesis during investigation
- Evidence cards show relevance to active hypothesis
- No regressions in existing functionality

---

### Phase 2: Core Mechanics (Days 4-10)

**Goal**: Add feedback loops and strategic depth

**Tasks**:
4. **Days 4-5**: Implement Priority 2 (Hypothesis Confidence System)
   - Create confidence.ts utility with scoring algorithm
   - Build ConfidenceMeter component
   - Integrate confidence dashboard into Investigation phase
   - **Deliverable**: Real-time confidence metrics for all hypotheses

5. **Days 6-7**: Implement Priority 3 (Mid-Investigation Pivoting)
   - Add pivot tracking to GameContext
   - Build PivotConfirmation modal component
   - Implement auto-suggestion when contradictions found
   - **Deliverable**: Players can switch hypotheses mid-investigation with feedback

6. **Days 8-9**: Implement Priority 5 (Investigation Strategy Layer)
   - Add investigationPaths to mission1.ts
   - Build InvestigationPathCard component
   - Integrate paths into Investigation UI
   - **Deliverable**: Guided investigation paths teach optimal strategies

7. **Day 10**: Integration Testing
   - Test all features working together
   - Balance confidence scoring algorithm
   - Fix edge cases (e.g., switching paths mid-investigation)
   - **Deliverable**: Cohesive investigation experience

**Success Criteria**:
- Confidence scores update in real-time as evidence collected
- Players receive pivot suggestions when contradictions found
- Investigation paths provide clear strategic guidance
- All features work together without conflicts

---

### Phase 3: Polish & Educational Integrity (Days 11-14)

**Goal**: Ensure educational goals intact, improve replayability

**Tasks**:
8. **Day 11**: Scoring System Updates
   - Update scoring.ts to reward strategic pivots
   - Penalize excessive random evidence collection
   - Bonus for completing investigation paths
   - **Deliverable**: Scoring encourages thoughtful investigation

9. **Day 12**: Educational Content Verification
   - Verify bias lessons still triggered correctly
   - Ensure confirmation bias still teachable (players commit to wrong theory, evidence proves otherwise)
   - Add reflection prompts when pivoting ("What made you change your mind?")
   - **Deliverable**: Educational integrity maintained

10. **Day 13**: Replayability Features
    - Add "different path" achievement system
    - Track which investigation paths used across playthroughs
    - Unlock "expert mode" after completing all paths
    - **Deliverable**: Incentive to replay with different strategies

11. **Day 14**: Final Testing & Documentation
    - Full playthrough testing (3-4 complete runs)
    - Document new mechanics in game tutorial
    - Update CHANGELOG.md with all changes
    - **Deliverable**: Production-ready build

**Success Criteria**:
- Players understand new mechanics without extensive tutorial
- Bias lessons trigger at appropriate moments
- Game rewards strategic thinking over random guessing
- Multiple valid paths to correct answer

---

## 6. Discussion Points

### 6.1 Trade-offs and Risks

**Complexity vs Accessibility**:
- **Risk**: Adding hypothesis selection, confidence meters, and pivoting increases cognitive load
- **Mitigation**:
  - Make all features optional (players can ignore paths and collect evidence freely)
  - Progressive disclosure (only show confidence when evidence collected)
  - Tutorial teaches one feature at a time

**Linear vs Branching**:
- **Trade-off**: Current linear flow is simple but boring; full branching is complex but engaging
- **Recommendation**: Hybrid approach - multiple paths converge to same endpoint
  - All paths can lead to correct answer (Marcus is guilty)
  - Different paths teach different biases (Victor path = confirmation bias, Violin path = anchoring bias)
  - Scoring rewards efficiency, not specific path

**Performance**:
- **Risk**: Real-time confidence calculations on every evidence collection
- **Mitigation**:
  - Memoize confidence calculations (only recalculate when collectedEvidenceIds changes)
  - Pre-compute relevance maps in mission data (add to InvestigationAction interface)

### 6.2 Educational Integrity

**Does This Still Teach Cognitive Biases?**

**Confirmation Bias** (original goal):
- **Before**: Players form hypothesis, collect evidence, ignore contradictions
- **After**: Players form hypothesis, actively choose to investigate it, pivot when evidence contradicts
- **Verdict**: STILL TEACHES - Now more realistic (real detectives pivot when evidence contradicts theory)

**Anchoring Bias**:
- **Before**: First hypothesis seen biases final answer
- **After**: Confidence system shows initial hypothesis may be weak
- **Verdict**: ENHANCED - Players learn to update beliefs based on evidence

**Availability Heuristic**:
- **Before**: Players choose most memorable/dramatic hypothesis
- **After**: Investigation paths guide toward less obvious theories
- **Verdict**: STILL TEACHES - Expert mode can hide paths, forcing independent thinking

**New Educational Opportunity: Iterative Inquiry**
- Teaches scientific method: hypothesize → test → revise → repeat
- Shows value of evidence-based reasoning
- Demonstrates importance of considering alternative explanations

**Recommendation**: This is now a BETTER educational game because it teaches:
1. Original biases (confirmation, anchoring, availability)
2. Scientific reasoning process
3. Strategic information gathering
4. Updating beliefs based on evidence

### 6.3 Complexity Management

**How to Avoid Overwhelming Players?**

**Strategy 1: Progressive Unlocking**
```
First playthrough:
- Only show active hypothesis selection
- Confidence meters hidden until 3+ evidence collected
- Investigation paths locked until second playthrough

Second playthrough:
- "You've mastered the basics. Try following an investigation path!"
- Unlock confidence dashboard
- Show pivot suggestions

Expert mode (after 3 playthroughs):
- All features visible
- No guided paths
- Scoring stricter
```

**Strategy 2: Modes**
```
Tutorial Mode:
- Single investigation path forced
- Auto-pivot when contradictions found
- Explicit hints ("This evidence supports the violin theory!")

Normal Mode (current plan):
- All features available
- Suggestions optional
- Balanced scoring

Detective Mode:
- No hints or paths
- Confidence meters hidden
- Scoring rewards efficiency
```

**Recommendation**: Start with Normal Mode as default, add Tutorial Mode in Phase 3 if playtesting shows confusion.

### 6.4 Testing Strategy

**Unit Tests** (Days 3, 10):
```typescript
// src/utils/__tests__/confidence.test.ts
describe('calculateHypothesisConfidence', () => {
  it('increases confidence when supporting evidence collected', () => {
    const conf = calculateHypothesisConfidence(hypothesis, ['supporting-evidence-1'], caseData);
    expect(conf.confidenceScore).toBeGreaterThan(30); // Base score
  });

  it('decreases confidence when contradicting evidence collected', () => {
    const conf = calculateHypothesisConfidence(hypothesis, ['contradicting-evidence-1'], caseData);
    expect(conf.recommendation).toBe('refuted');
  });

  it('handles mixed evidence correctly', () => {
    const conf = calculateHypothesisConfidence(
      hypothesis,
      ['support-1', 'support-2', 'contradict-1'],
      caseData
    );
    expect(conf.confidenceScore).toBe(30 + 30 - 25); // 35
  });
});
```

**Integration Tests** (Day 10):
```typescript
// src/components/__tests__/InvestigationFlow.test.tsx
describe('Investigation Flow', () => {
  it('allows switching active hypothesis', () => {
    render(<Investigation caseData={mission1} />);

    fireEvent.click(screen.getByText('Victor Ashworth'));
    expect(screen.getByText('Currently Investigating: Victor Ashworth')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Marcus Bellamy'));
    expect(screen.getByText('Currently Investigating: Marcus Bellamy')).toBeInTheDocument();
  });

  it('suggests pivot when contradiction found', async () => {
    const { dispatch } = renderWithContext(<Investigation caseData={mission1} />);

    dispatch({ type: 'SET_ACTIVE_HYPOTHESIS', hypothesisId: 'victor-guilty' });
    fireEvent.click(screen.getByText('Collect Evidence: Victor has alibi'));

    await waitFor(() => {
      expect(screen.getByText(/Switch Investigation Focus/)).toBeInTheDocument();
    });
  });
});
```

**Playtest Protocol** (Days 13-14):
1. **Scenario 1: Linear Player**
   - Player who wants simple quiz experience
   - **Test**: Can they ignore paths and just collect evidence?
   - **Success**: Yes, game works without using new features

2. **Scenario 2: Strategic Player**
   - Player who wants optimal IP efficiency
   - **Test**: Do investigation paths guide them?
   - **Success**: Following path leads to correct answer in 5-6 IP

3. **Scenario 3: Exploratory Player**
   - Player who wants to test multiple theories
   - **Test**: Can they pivot between hypotheses smoothly?
   - **Success**: Pivoting works without bugs, confidence updates correctly

4. **Scenario 4: Educational Tester**
   - Check if bias lessons still trigger
   - **Test**: Does player learn from wrong hypotheses?
   - **Success**: Pivoting away from wrong theory triggers reflection

---

## 7. Quick Reference: Code Files to Modify

| Priority | Files to Modify | New Files to Create | Effort |
|----------|----------------|---------------------|--------|
| **P1: Active Hypothesis Selection** | `src/context/GameContext.tsx`<br>`src/components/phases/Investigation.tsx` | None | 8-12h |
| **P2: Confidence System** | `src/components/phases/Investigation.tsx` | `src/utils/confidence.ts`<br>`src/components/ui/ConfidenceMeter.tsx` | 10-14h |
| **P3: Pivoting** | `src/context/GameContext.tsx`<br>`src/components/phases/Investigation.tsx` | `src/components/ui/PivotConfirmation.tsx` | 6-8h |
| **P4: Evidence Relevance** | `src/components/ui/EvidenceCard.tsx`<br>`src/components/phases/Investigation.tsx` | None | 4-6h |
| **P5: Investigation Paths** | `src/data/mission1.ts`<br>`src/types/game.ts`<br>`src/components/phases/Investigation.tsx` | `src/components/ui/InvestigationPathCard.tsx` | 8-12h |

**Total Estimated Effort**: 36-52 hours (roughly 1.5-2 weeks for one developer)

---

## 8. Immediate Next Steps

1. **Review this document** with stakeholders/users - get feedback on priorities
2. **Create PRPs** for Priority 1 and Priority 4 (quickest wins)
3. **Prototype confidence algorithm** (Priority 2) - test scoring balance
4. **Update mission1.ts** to include investigation paths (Priority 5)
5. **Begin Phase 1 implementation** (Days 1-3)

---

## Appendix: User Feedback Mapping

| User Quote | Root Cause | Recommended Solution |
|------------|-----------|---------------------|
| "Investigation simply feels broken!" | No agency in choosing what to investigate | Priority 1: Active Hypothesis Selection |
| "We can not even choose any other hypothesis before finishing!" | Hypothesis selection locked in Phase 2 | Priority 1 + Priority 3 |
| "We can not develop and investigate a new hypothesis" | No mechanism to pivot mid-investigation | Priority 3: Mid-Investigation Pivoting |
| "Missing feedback" | No real-time confidence metrics | Priority 2: Confidence System |
| "Investigation is too flat now, not deep enough" | No strategic layer, all evidence equal | Priority 5: Investigation Paths |
| "Right now the ending is forced" | Linear flow with no branching | Priority 3 + Priority 5 (multiple paths) |
| "What if I changed my mind after unlocking evidence?" | Cannot update hypothesis during investigation | Priority 3: Pivoting |
| "The gameplay is simple and linear, that wouldn't be fun even for kids" | Entire game flow from briefing → investigation → submit | All priorities combined |

---

**End of Analysis**

**Document Status**: COMPLETE
**Next Action**: Review priorities with team, create PRPs for Phase 1
**Questions**: Contact game design expert for clarification on any recommendations
