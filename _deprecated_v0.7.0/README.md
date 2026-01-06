# Deprecated v0.7.0 Files

This folder contains all files from the **quiz-style prototype** (v0.1.0 - v0.7.0) that are incompatible with the new **DnD-style freeform investigation** design.

**Archived**: 2026-01-05
**Reason**: Complete game design pivot (see `docs/AUROR_ACADEMY_GAME_DESIGN.md`)

---

## What Changed

### Old Design (v0.7.0)
- **Gameplay**: Quiz-style (click predefined options)
- **Structure**: 6 phases (Briefing → Hypothesis → Investigation → Prediction → Resolution → Review)
- **Mechanics**: Hypothesis tiers, contradiction detection, IP-based scoring
- **Frontend-only**: No backend, TypeScript mission1.ts

### New Design (v0.1.0+)
- **Gameplay**: DnD-style freeform (type any action, LLM responds)
- **Structure**: Obra Dinn model (investigate freely → submit verdict)
- **Mechanics**: Witness interrogation, fallacy detection, Moody AI judge
- **Backend**: Python FastAPI + Claude Haiku narrator

---

## Deprecated Files

### Types (Hypothesis System)
- `types/enhanced.ts` - Hypothesis, contradiction, unlocking types
- `types/enhanced.fixtures.ts` - Test fixtures

### Utils (Game Logic)
- `utils/unlocking.ts` - Conditional hypothesis unlocking (69 tests)
- `utils/contradictions.ts` - Narrative contradiction detection (58 tests)
- `utils/scoring.ts` - 7 scoring metrics (28 tests)
- `utils/evidenceRelevance.ts` - Evidence-hypothesis relevance (37 tests)

### Data (Case Files)
- `data/mission1.ts` - "The Violin Virtuoso's Demise" (34 tests)
  - Replaced by `backend/src/case_store/case_001.yaml`

### Components (UI)
- **Phases**: Briefing, HypothesisFormation, Investigation, Prediction, Resolution, CaseReview (75 tests)
- **UI**: HypothesisRelevanceBadge, MetricCard, UnlockToast, PhaseTransition
- **Layout**: GameShell, Header

### Context & Hooks
- `context/GameContext.tsx` - Quiz-style game state (useReducer)
- `hooks/useGame.ts` - Game state hook
- `hooks/usePhaseTransition.ts` - Phase navigation
- `hooks/useUnlockNotifications.ts` - Hypothesis unlock toasts

### Entry Points
- `App.tsx` - Old quiz-style app
- `main.tsx` - Vite entry point

---

## Statistics (v0.7.0)

- **Total Tests**: 301 passing
- **Coverage**: 85%+
- **Bundle Size**: 208.67 KB (gzipped: 64.40 KB)
- **Milestones Completed**: 7 (Enhanced Type System → Active Hypothesis Selection)

---

## Restoration (If Needed)

If you need to reference old implementation patterns:

```bash
# View old Investigation component logic
cat _deprecated_v0.7.0/components/phases/Investigation.tsx

# View old scoring algorithms
cat _deprecated_v0.7.0/utils/scoring.ts

# Run old tests (would need to restore to frontend/src)
# NOT RECOMMENDED - tests won't pass without full restoration
```

---

## Safe to Delete?

**Not yet**. Keep until Phase 1 MVP is stable (freeform investigation working).

After Phase 1 validation:
```bash
rm -rf _deprecated_v0.7.0/
```

---

**See**: `PLANNING.md` for new roadmap (Phases 1-7)
