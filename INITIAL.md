# Phase 3.5: Intro Briefing System (Simplified)

## Overview
Moody teaches rationality concepts before each case via prewritten dialogue. Simple modal with static content from YAML, skippable, marks completion to prevent re-show.

## Components

### Frontend
1. **CaseBriefing.tsx** - Modal UI (dark terminal theme, skip/continue buttons). Follows MentorFeedback.tsx pattern: bg-gray-900, font-mono, amber accents
2. **useBriefing.ts** - Hook for briefing state (loading, error, completion)
3. **ConceptCard.tsx** - Single teaching card (title, explanation, example)

### Backend
1. **GET /api/briefing/{case_id}** - Load briefing from YAML, return concepts + greeting
2. **POST /api/briefing/{case_id}/complete** - Mark briefing complete, prevent re-show

### Data
1. **BriefingState** - `case_id`, `briefing_completed`, `completed_at`
2. **PlayerState extension** - Add `briefing_state: BriefingState | None`
3. **case_001.yaml briefing module** - `moody_greeting: str`, `concepts: []` (static text)

## Key Patterns
- **UI**: MentorFeedback.tsx (dark terminal, whitespace-pre-wrap prose, amber accents)
- **State**: Extend PlayerState.briefing_state, track completion
- **YAML**: Static briefing content (no variants, no dynamic generation)
- **Skip**: Always available, doesn't mark complete

## YAML Structure
```yaml
briefing:
  moody_greeting: |
    Alright, recruit. Before you start investigating, listen up.
    This case will test your rationality. Pay attention.
  concepts:
    - id: "base_rates"
      title: "Base Rate Fallacy"
      teaching: |
        Most rookies blame the obvious suspect. Mistake.
        Always check: how common is this crime? Who had motive AND means?
      example: "Frost spells are common at Hogwarts. Don't assume rare culprit."
```

## Integration Points
1. **App.tsx** - Show briefing modal on mount, hide after complete/skip
2. **PlayerState.py** - Add `briefing_state: BriefingState | None`, method `mark_briefing_complete()`
3. **case_001.yaml** - Add `briefing:` module with greeting + concepts
4. **routes.py** - Add GET `/api/briefing/{case_id}`, POST `/api/briefing/{case_id}/complete`
5. **API client.ts** - Add `getBriefing()`, `markBriefingComplete()` typed fetch

## Testing
- **Frontend**: Vitest + RTL, test greeting display, concept cards, skip/continue buttons
- **Backend**: pytest, test briefing load from YAML, completion persistence

## Success Criteria
- [ ] Briefing loads static content from case_001.yaml
- [ ] Moody greeting + 1-3 concepts displayed
- [ ] Skip button closes modal without marking complete
- [ ] Continue button marks complete, closes modal, starts investigation
- [ ] State persisted (no re-show on reload if completed)
- [ ] Dark terminal theme matches MentorFeedback
- [ ] All tests pass

## Patterns from Research
- **Codebase**: MentorFeedback.tsx (static prose display), PlayerState extension, routes.py GET endpoint, client.ts fetch
- **GitHub**: Simple modal pattern, skip button (no completion tracking needed)
