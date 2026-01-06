# INITIAL: Phase 3 - Verdict System + Post-Verdict Confrontation

## FEATURE

- Player can submit verdict (suspect + reasoning + key evidence)
- Mentor (Moody) evaluates verdict (correct/incorrect)
- Mentor analyzes reasoning quality (fallacies, logic gaps, score 0-100)
- If correct: Post-verdict confrontation dialogue plays (culprit, Moody, player)
- If incorrect: Moody shows correct answer + explanation
- Aftermath text displays (sentencing/consequences)
- Attempt tracking (10 max, feedback adapts to attempts remaining)

## EXAMPLES

### Code Patterns
- `backend/src/context/narrator.py` - LLM prompt structure (apply to mentor feedback)
- `backend/src/context/witness.py` - Isolated context builder (apply to mentor)
- `backend/src/utils/trust.py` - State management pattern (apply to verdict state)
- `frontend/src/components/WitnessInterview.tsx` - Dialogue UI (apply to confrontation)
- `frontend/src/hooks/useWitnessInterrogation.ts` - useReducer pattern (apply to verdict flow)

### Design References
- `docs/CASE_001_TECHNICAL_SPEC.md` (lines 1034-1163) - Verdict data structure, wrong suspect responses, confrontation dialogue
- `docs/AUROR_ACADEMY_GAME_DESIGN.md` (lines 398-439) - Three-act resolution structure
- `docs/CASE_DESIGN_GUIDE.md` (lines 450-567) - Solution module, post-verdict scenes, culprit reactions

### Similar Games
- **LA Noire**: Accusation system with correct/incorrect feedback
- **Return of the Obra Dinn**: Verdict evaluation (deductions, not pre-selected answers)
- **Phoenix Wright**: Post-trial breakdown scenes (culprit confession)

## DOCUMENTATION

- [Claude API - Multi-context isolation](https://docs.anthropic.com/claude/docs/guide-to-anthropics-prompt-engineering-resources) - Mentor context builder
- [React Patterns - useReducer for complex state](https://react.dev/reference/react/useReducer) - Verdict flow state management
- [Bayesian Reasoning](https://docs/rationality-thinking-guide.md) - Fallacy detection logic

## OTHER CONSIDERATIONS

### Constraints
- INITIAL.md ≤120 lines (strict)
- Keep simple: Template-based feedback first (not LLM-generated)
- Educational focus: Teach rationality, not punish
- Maintain 80%+ test coverage
- Don't break Phases 1, 2, 2.5 features

### Decision Points
1. **Mentor Feedback**: Template-based (faster) vs LLM-based (dynamic)?
   - **Recommend**: Templates (Phase 7 can add LLM)
2. **Wrong Verdict**: Game over vs retry vs show answer?
   - **Recommend**: Show answer (educational, not punishing)
3. **Confrontation**: Static YAML vs dynamic LLM?
   - **Recommend**: Static (simpler, Phase 7 dynamic)
4. **Reasoning Required**: Force player to explain vs optional?
   - **Recommend**: Required (educational value)
5. **Tom's Role**: Include in verdict vs defer to Phase 4?
   - **Recommend**: Defer to Phase 4 (keep focused)

### Architecture Decisions
- **Backend**: New verdict module (`src/verdict/`) with evaluation logic
- **Frontend**: New VerdictSubmission + MentorFeedback + ConfrontationDialogue components
- **YAML**: Add `solution`, `wrong_suspects`, `post_verdict` modules to case_001.yaml
- **State**: Add `verdict_state` to PlayerState (attempts, submitted_verdicts history)

### Success Criteria
- [ ] Player can submit verdict (suspect + reasoning + evidence)
- [ ] System evaluates correctness (compare to solution.culprit)
- [ ] Mentor provides feedback (analysis, fallacies, score)
- [ ] If correct: Confrontation plays (3-4 dialogue exchanges)
- [ ] If incorrect: Correct answer shown with explanation
- [ ] Aftermath displays (sentencing text)
- [ ] All backend tests pass (verdict logic, fallacy detection)
- [ ] All frontend tests pass (verdict UI, feedback display)
- [ ] User can complete full case end-to-end

### Task Breakdown (8-12 tasks)

**Backend (4-5 days)**:
1. Update case_001.yaml - Add solution, wrong_suspects, post_verdict modules
2. Create verdict evaluation logic - check_verdict(), score_reasoning(), detect_fallacies()
3. Create mentor feedback generator - build_mentor_prompt(), template-based responses
4. Add POST /api/submit-verdict endpoint - Handles verdict submission, returns feedback
5. Add confrontation loader - load_confrontation_dialogue()
6. Add tests - verdict logic (20 tests), fallacy detection (15 tests), API endpoint (10 tests)

**Frontend (3-4 days)**:
7. Create VerdictSubmission component - Suspect selector, reasoning textarea, evidence checklist
8. Create MentorFeedback component - Analysis display, fallacy list, score meter
9. Create ConfrontationDialogue component - Dialogue bubbles, aftermath text
10. Integrate into App.tsx - Verdict flow, modal/route decision
11. Add API client - submitVerdict() function
12. Add tests - component tests (30 tests), integration (10 tests)

**Testing (1 day)**:
13. Integration testing - Full verdict flow validation
14. Validation gates - All tests pass, TypeScript compiles

### Effort Estimate
- **Total**: 7-8 days
- **Priority**: CRITICAL (completes core game loop)
- **Dependencies**: Phase 2.5 complete (✅)

### Out of Scope (Defer to Later Phases)
- Tom's inner voice during verdict (Phase 4)
- Dynamic LLM-based mentor feedback (Phase 7)
- Bayesian probability tracker integration (Phase 5.5)
- Multiple case support (Phase 6+)
