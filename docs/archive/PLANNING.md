# Auror Academy - Project Planning

**Last Updated:** 2026-01-17
**Current Phase:** Phase 6 Complete (First Complete Case)
**Next Priority:** Phase 6.5 - UI/UX & Visual Polish

---

## 🎯 Immediate Next Steps (Ready to Start)

### Priority 1: UI/UX & Visual Polish (1-2 weeks)

**Phase 6.5: Interface Enhancement** (1-2 days)
- [x] Music ambience system (COMPLETE - 2026-01-24)
- [ ] Improve overall style and interface structure
  - [ ] More visually appealing design
  - [ ] Easier navigation patterns
  - [ ] More lightweight UX
  - [ ] Add more Harry Potter vibes to terminal strict theme
- [ ] Add artwork to locations and other screens
- [ ] Implement light theme option
  - [ ] Color palette design
  - [ ] Theme toggle component
  - [ ] CSS variables architecture
  - [ ] Accessibility compliance

### Priority 2: Production Readiness (1 week)

**Phase 7: Production Preparation**
- [ ] Update case template, guideline, and case 2 to reflect briefing changes from case 1
- [ ] Remove secret revealed notifications (cleanup UI clutter)
- [ ] Server key management (implement key manager for Infusion or similar)
  - [ ] Secure API key handling
  - [ ] Environment configuration
- [ ] Make application production-ready
  - [ ] Database migration strategy (JSON → PostgreSQL/SQLite)
  - [ ] Backup/restore procedures
  - [ ] Performance optimization review
  - [ ] Security hardening checklist
- [ ] Test saves after deployment
- [ ] Fix remaining frontend test failures (188/565 need investigation - optional)

---

## 📅 Short-Term Goals (1-2 Months)

### Additional Cases
- [ ] Case 3: Design + implementation (using enhanced template from Phase 5.5)
- [ ] Case 4: Design + implementation
- [ ] Case 5: Design + implementation

### Phase 7.5: Bayesian Probability Tracker (Optional Teaching Tool)
**Effort:** 3-4 days
**Status:** Optional polish feature (deferred)

- [ ] ProbabilityTracker component (split panel: evidence left, suspect rating right)
- [ ] Two-slider interface per suspect ("If guilty" + "If innocent")
- [ ] Real Bayesian calculation (`calculate_probability_bayesian()` in backend)
- [ ] `/api/probability/rate` and `/api/probability/view` endpoints
- [ ] Calculated probabilities view (bar charts showing suspect percentages)
- [ ] Teaching moments (Moody explains likelihood ratios, Tom comments)
- [ ] Keyboard shortcuts (P to open, 1-9 slider, Tab switch, S save)
- [ ] Completely optional (accessible from menu, never forced)

**Deliverable:** Optional numerical tool teaching Bayesian reasoning hands-on

---

## 🔮 Future Considerations (Backlog)

### Phase 8: Meta-Narrative (Expansion Content)
**Effort:** 7-10 days
**Status:** Deferred (post-MVP)

- Pattern recognition system (player notices odd details linking cases)
- Meta-case investigation (Case 10: investigate why cases selected for training)
- Institutional corruption reveal (Ministry official buried evidence)
- Branching world states (expose corruption vs maintain loyalty)
- Real field cases (11+)

**Deliverable:** Overarching narrative emerges from Cases 1-10; moral choice in Case 10

### Features (Post-Production)
- Achievement system
- Tutorial/onboarding improvements
- Advanced analytics/telemetry

### Technical (Post-Production)
- Mobile responsive design enhancements
- Advanced accessibility improvements (WCAG AAA)

### Polish (Post-Production)
- Sound effects (spell casting, UI interactions)
- Additional music tracks (alternative per case, fade on location change)
- Advanced animations
- Additional spell effects
- Enhanced visual feedback

---

## 📊 Definition of Done

### For Each Feature
- [ ] Code implemented and reviewed
- [ ] Tests written and passing
- [ ] Documentation updated (README, CHANGELOG, docs/)
- [ ] No TypeScript/ESLint errors
- [ ] No regressions in existing functionality
- [ ] Validated in local environment

### For Production Release
- [ ] All P1 tasks complete
- [ ] Security audit passed
- [ ] Performance benchmarks met (bundle <200KB gzipped)
- [ ] Backup/restore tested
- [ ] Monitoring/alerting configured
- [ ] At least 2 complete cases playable
- [ ] Frontend tests >80% passing
- [ ] Backend tests 100% passing

---

## 🏗️ Architecture Overview

### Tech Stack
- **Backend:** Python 3.13.3 + FastAPI + Anthropic Claude (Haiku)
- **Frontend:** React 18 + TypeScript 5.6 + Vite 6 + Tailwind CSS
- **Validation:** Zod 4.3.5 (24 schemas, runtime type safety)
- **State:** File-based JSON persistence (4 save slots)
- **Testing:** pytest (backend), Vitest (frontend)
- **Package Managers:** UV (Python), Bun (frontend)

### Key Architecture Decisions

**LLM-First Architecture**
- Claude Haiku as game narrator (not pre-scripted)
- DnD-style freeform investigation (player types any action)
- Context isolation (narrator, witness, mentor have separate contexts)
- No pixel hunting (if it makes sense, LLM allows it)

**Python Backend + React Frontend**
- Backend: Claude API integration, YAML case loading, state management
- Frontend: Clean terminal UI, fast iteration, component reuse
- Separation: Backend = game logic/LLM, Frontend = display only

**Case Structure (YAML-based)**
- Portable case design separate from code
- Iterable by non-technical designers
- Version control friendly
- Standardized victim/suspect/evidence/solution modules

**No Phase System**
- Free investigation → Verdict submission (Obra Dinn model)
- Player decides when "ready" to submit verdict
- No artificial gates or phases

---

## 🔗 Related Documents

**Core Documentation:**
- `STATUS.md` - Current project status and metrics
- `README.md` - Project overview, features, setup
- `CHANGELOG.md` - Version history (Keep a Changelog format)
- `CLAUDE.md` - Agent orchestration guide

**Design Documents:**
- `docs/game-design/AUROR_ACADEMY_GAME_DESIGN.md` - Complete game design
- `docs/CASE_DESIGN_GUIDE.md` - Case creation guidelines
- `docs/game-design/WORLD_AND_NARRATIVE.md` - HP universe integration
- `docs/game-design/TOM_THORNFIELD_CHARACTER.md` - Tom's psychology

**Type Safety & Validation:**
- `docs/TYPE_SYSTEM_AUDIT.md` - TypeScript architecture audit
- `VALIDATION-GATES-ZOD-REPORT.md` - Zod validation report

**Case Files:**
- `docs/case-files/CASE_001_RESTRICTED_SECTION.md` - Case 001 narrative spec
- `docs/case-files/CASE_002_RESTRICTED_SECTION.md` - Case 002 spec
- `backend/src/case_store/case_template.yaml` - Enhanced case template

**Phase Research & PRPs:**
- `docs/research/` - Phase-specific research documents
- `PRPs/` - Phase Requirements & Plans

---

## 📈 Effort Estimates

| Phase | Effort | Priority | Status |
|-------|--------|----------|--------|
| **P5.5: YAML Schema Enhancement** | 1-2 days | HIGH | ✅ Complete |
| **P6: First Complete Case** | 3-4 days | CRITICAL | ✅ Complete |
| **P6.5: UI/UX & Visual Polish** | 1-2 days | HIGH | Planned |
| **P7: Production Prep** | 1 week | HIGH | Planned |
| **P7.5: Bayesian Tracker (Optional)** | 3-4 days | LOW | Optional |
| **P8: Meta-Narrative** | 7-10 days | LOW | Deferred |

---

## ✅ Completed Phases Summary

**All phases 1-6 complete** (see STATUS.md for detailed completion history)

Latest completions:
- **Phase 6** (2026-01-17): First Complete Case - Case 001 & Case 002 complete
- **Phase 5.5** (2026-01-17): YAML Schema Enhancement - Enhanced case template with professional fields
- **Phase 5.8** (2026-01-17): Type safety & Zod validation, dependency audits, security CLEAN
- **Phase 5.7** (2026-01-15): Spell deduplication, witness spell support, improved detection
- **Phase 5.4** (2026-01-13): Case creation infrastructure, dynamic case loading
- **Phase 5.3.1** (2026-01-13): Landing page & main menu system
- **Phase 5.3** (2026-01-12): Industry-standard save/load (3 manual slots + autosave)
- **Phase 5.2** (2026-01-12): Location management system
- **Phase 5.1** (2026-01-12): Main menu system
- **Phase 4.8** (2026-01-12): Legilimency formula-based system
- **Phase 4.7** (2026-01-11): Spell success probabilities
- **Phase 4.6.2** (2026-01-11): Programmatic Legilimency + generalized spell detection
- **Phase 4.5** (2026-01-09): 7 investigation spells with text-only casting
- **Phase 4.4** (2026-01-09): Conversation persistence, UI polish
- **Phase 4.3** (2026-01-09): Tom personality enhancement
- **Phase 4.1** (2026-01-09): LLM-powered Tom conversation
- **Phase 3.9** (2026-01-07): Validation-gates learning system
- **Phase 3.5-3.8** (2026-01-07): Briefing system with Moody Q&A
- **Phase 3.1** (2026-01-07): Natural LLM feedback
- **Phase 3** (2026-01-06): Verdict system + post-verdict confrontation
- **Phase 2.5** (2026-01-06): Terminal UX + witness integration
- **Phase 2** (2026-01-05): Narrative polish + witness system
- **Phase 1** (2026-01-05): Core investigation loop

**Total Effort Invested:** ~48-58 days over 13 days (intensive development with multi-agent orchestration)

---

## 🎓 Success Criteria (Overall Project)

### Functional Requirements (All Met ✅)
- [x] Player can explore locations via freeform input
- [x] LLM narrator responds to any logical action
- [x] Evidence discovery works (trigger keywords + 5+ variants)
- [x] Witness interrogation functional (LLM plays character)
- [x] Secrets reveal when triggered (Legilimency, evidence, trust)
- [x] Verdict submission works (suspect + reasoning freeform)
- [x] Mentor evaluates reasoning (identifies fallacies)
- [x] Correct verdict closes case (post-verdict scene)
- [x] Wrong verdict loses attempt (brutal but educational feedback)
- [x] Save/load state persists between sessions (4 slots)
- [x] Magic system functional (7 investigation spells)
- [x] Tom's ghost mentor (50/50 helpful/misleading)
- [x] Briefing system with interactive Q&A
- [x] Location management (3+ locations per case)
- [x] Case creation ("drop YAML → case works")

### Quality Gates (Current Status)
- [x] Backend: 154/154 tests passing (100%)
- [x] Frontend: 377/565 tests passing (66.7%, infrastructure issues)
- [x] TypeScript: 0 errors (Grade A type safety)
- [x] ESLint: 0 errors
- [x] Security: 0 vulnerabilities (audited 2026-01-17)
- [x] Bundle size: 104.67 KB gzipped (well under 200KB limit)
- [ ] Playtest by 2+ people (pending Phase 6 complete case)
- [ ] Investigation feels like DnD exploration (user feedback positive so far)
- [ ] Witness characters feel human (wants/fears/moral_complexity - Phase 5.5)
- [ ] Moody feedback brutal but educational (user feedback positive)
- [ ] Fallacy detection accurate (template-based, working)

---

## 🚨 Known Issues

**Frontend Tests:** 188/565 failing (pre-existing test infrastructure issues, not Phase 5.8 regressions)
- Not blocking production
- Need investigation in separate cleanup phase

**Backend Type Hints:** 14 mypy errors in non-core modules (documented in STATUS.md)
- Not blocking production
- Low priority cleanup

---

*"CONSTANT VIGILANCE!" - Mad-Eye Moody*
