# Phase 3.1: State Management Fixes + LLM Mentor Feedback - INITIAL

## ISSUES IDENTIFIED

**Verdict Blocking**:
- Submit correct verdict → `case_solved=true` persists to disk
- Server restart → loads saved state → blocks all future verdicts
- Root cause: `routes.py:938` checks `verdict_state.case_solved`
- Error: `HTTPException(400, "Case already solved.")`

**State Persistence**:
- Auto-saves after every verdict (`routes.py:1041`)
- No reset/restart endpoint exists
- User locked out after testing correct answer once

**Mechanical Feedback**:
- Templates feel robotic (`mentor.py` uses fixed strings)
- User wants natural LLM-generated Moody responses
- Feedback doesn't reference player's specific reasoning

## FEATURES

**1. Reset/Restart System**:
- Endpoint: `POST /api/case/{case_id}/reset?player_id={id}`
- Deletes save file via existing `delete_state()` function
- Frontend: "Restart Case" button with confirm dialog
- Clears: evidence, witnesses, verdict attempts
- Fresh investigation start

**2. Allow Retries After Solved**:
- Remove `case_solved` check from `/api/submit-verdict`
- Educational game: encourage learning from mistakes
- Keep attempt history for analytics
- 10-attempt limit still applies

**3. LLM Mentor Feedback**:
- Replace `build_mentor_feedback()` templates with Claude Haiku
- **Incorrect verdict**: Moody roasts player, explains error, cites missing evidence
- **Correct verdict**: Acknowledges success, critiques weak reasoning if score <85
- Inputs: reasoning text, accused, correct answer, evidence cited/missed, fallacies, score
- Fallback to templates on LLM failure (reliability)

## EXAMPLES

**Codebase Patterns**:
- `backend/src/api/routes.py:submit_verdict` - Current verdict logic
- `backend/src/state/persistence.py:delete_state` - Reset mechanism
- `backend/src/context/narrator.py:build_narrator_prompt` - LLM prompt pattern
- `backend/src/context/mentor.py:build_mentor_feedback` - Current templates (replace)

**LLM Roast (Incorrect)**:
```
Accused: Hermione | Actual: Draco
Reasoning: "She was in the library and borrowed a restricted book"
Missed: frost_pattern (cast from OUTSIDE window)
Fallacy: correlation_not_causation

Moody: "WRONG. You accused Granger because she was there? That's correlation, not causation. The frost pattern was cast from OUTSIDE the window - did you check casting direction? Malfoy was lurking out there. Sloppy work."
```

**LLM Feedback (Correct, weak reasoning)**:
```
Accused: Draco (CORRECT) | Score: 60
Reasoning: "he is evil and suspicious! hermione said so!"
Fallacy: authority_bias

Moody: "Lucky guess, recruit. Yes, it's Malfoy, but 'evil' isn't evidence. Hermione's word helps, but you need corroboration - frost pattern + wand signature. That's proof, not prejudice."
```

## DOCUMENTATION

- Claude Haiku API: Reuse existing client from Phase 1 narrator
- Prompt engineering: Context isolation (mentor doesn't know investigation details beyond what's passed)

## OTHER CONSIDERATIONS

**Constraints**:
- INITIAL ≤120 lines
- Don't break Phase 3 verdict system
- Maintain test coverage (80%+)
- Fast UX: Show loading during LLM call (~2s)

**Decisions**:
1. **Retry policy**: Remove `case_solved` check ✅ (educational)
2. **LLM fallback**: Always try LLM, fallback to templates ✅ (reliability)
3. **Button placement**: Header (always visible) ✅
4. **Keep attempt history**: Yes ✅ (analytics value)

**Architecture**:
- Backend: Add `POST /api/case/{case_id}/reset`, modify `/api/submit-verdict`, replace `build_mentor_feedback()`
- Frontend: Add "Restart Case" button, loading spinner for LLM, confirm dialog
- Prompts: `build_moody_roast_prompt()`, `build_moody_praise_prompt()`

**Dependencies**:
- `anthropic` library (existing)
- `delete_state()` function (existing)
- Modal component (existing)

**Out of Scope**:
- Multiple save slots (Phase 6)
- Undo last verdict (low value)
- Replay confrontation (not requested)

**Success Criteria**:
- [ ] User can restart case (all state cleared)
- [ ] User can retry verdicts after solving
- [ ] Moody feedback natural (LLM-generated)
- [ ] Feedback references specific player reasoning
- [ ] Template fallback works (no LLM crash)
- [ ] Loading state shown during LLM call
- [ ] Tests pass (backend + frontend)

---
**Lines**: 119
**Effort**: 2-3 days
**Impact**: HIGH (fixes critical UX bug + major quality boost)
