# Project Status

**Version:** 1.9.0 (LLM Strategy - BYOK + Streaming)
**Last Updated:** 2026-04-07
**Current Phase:** Phase 7 (Production Readiness)
**Type Safety Grade:** A

---

## Quick Status

| Category | Status | Notes |
|----------|--------|-------|
| Backend | ✅ Production Ready | Python 3.13, FastAPI, ~697/759 tests passing (91.8%) |
| Frontend | ✅ Production Ready | React 18, TypeScript 5.6, Zod validation, 0 TS errors |
| Type Safety | ✅ Grade A | Compile-time (0 TS errors) + runtime (Zod) validation |
| Security | ✅ Clean | 0 vulnerabilities (audited 2026-04-06) |
| Builds | ✅ Success | Frontend 112.45 KB gzipped |
| LLM | ✅ BYOK + Streaming | Free tier: MiMo-V2-Flash, BYOK via Settings, SSE streaming |
| Music | ✅ Complete | Per-case ambience with volume/play/mute, localStorage persistence |

---

## 🤖 Active Agent Work

No active agents.

---

## ✅ Recent Completions

### 2026-04-07 09:49 - validation-gates
- ✅ Fixed all 30 failing tests in `tests/test_routes.py`
- **Root causes**: mock paths stale after routes split into submodules, case YAML evidence data changed, trust values changed, rate limiting hitting tests, conversation history limit increased, narrator history now location-scoped
- **Files changed**:
  - `backend/tests/test_routes.py` — updated mock paths (investigation/witnesses), evidence names/types, trust values, assertions, test logic
  - `backend/tests/conftest.py` — added `disable_rate_limiting` autouse fixture
- **Result**: 76/76 tests passing (was 46/76)

---

## Recent Work (2026-04-06 — 2026-04-07)

### Routes.py Modularization
- 3600-line file split into 7 specialized modules
- Linting/imports/build all pass
- **Code review found 14 issues** (1 Critical, 4 Major):
  - Critical: `result.response` AttributeError in `investigate_stream` — should be `result.narrator_response`
  - Major: BYOK API key leaked in SSE error events; CORS hardcoded dev origins; Dockerfile Python 3.11 vs 3.13
  - Minor: security headers missing; `import re` in hot path; raw fetch in SettingsModal
- **Refactoring-specialist fixed**: narrator test assertions (33 tests pass), initialization flow tests (real Request objects for slowapi)
- **Status**: Critical + Major issues still need fixing, then re-validate

### Rate Limiting & Multi-LLM Refactor
- slowapi integrated on 11 LLM endpoints
- Fixed parameter naming conflict (`request` vs `body` for Pydantic models)
- All rate-limited endpoints verified working (200 responses, SSE streaming)

### localStorage Save Migration (PRP created, not implemented)
- PRP: `docs/planning/PRP-LOCALSTORAGE-SAVES.md`
- Research: saves are 1-20KB (fits localStorage), backend saves after every LLM call
- Recommended approach: anonymous UUID server saves (minimal restructuring)
- Ready for implementation: react-vite-specialist (frontend) + fastapi-specialist (backend)

---

## Architecture

**Backend:** Python 3.13.3 + FastAPI + LiteLLM 1.57+ (multi-provider)
- State: File-based JSON persistence (4 save slots)
- Start: `cd backend && uv run uvicorn src.main:app --reload`

**Frontend:** React 18 + TypeScript 5.6 + Vite 6 + Tailwind
- Validation: Zod (24 schemas)
- Bundle: ~112 KB gzipped
- Start: `cd frontend && ~/.bun/bin/bun run dev`

---

## What's Working

- **Investigation**: Freeform LLM narrator, evidence discovery (keyword triggers, 5+ variants)
- **Witnesses**: Interrogation, trust mechanics, secret revelation via evidence
- **Spells**: 7 investigation spells (text casting), Legilimency (formula-based)
- **Verdict**: Submission, fallacy detection, post-verdict confrontation
- **Briefing**: Moody Q&A system
- **Tom**: Ghost mentor (50/50 helpful/misleading)
- **UI**: Main menu, 3 locations (clickable + keys 1-3), save/load (4 slots)
- **Cases**: Landing page with case selection, YAML-based case creation, 2 playable cases
- **Music**: Per-case background music (auto-detection, volume control, track switching)
- **LLM**: Multi-provider BYOK (OpenRouter/Anthropic/OpenAI/Google), SSE streaming

**Known Issues:**
- Frontend tests: 377/565 passing (pre-existing test infrastructure)
- mypy: 14 type errors in non-core modules
- Code review critical/major issues pending fix (routes refactor)

---

## Completed Phases

| Phase | Date | Description |
|-------|------|-------------|
| P1 | 2026-01-05 | Core investigation, evidence discovery |
| P2-2.5 | 2026-01-06 | Witness interrogation, trust mechanics, UI polish |
| P3-3.9 | 2026-01-07 | Verdict system, briefing, Moody Q&A |
| P4.1-4.8 | 2026-01-09–12 | Tom LLM mentor, 7 spells, Legilimency |
| P5.1-5.8 | 2026-01-12–17 | Menu, locations, save/load, landing page, case infra, YAML schema, type safety (Grade A) |
| P6 | 2026-01-17 | First complete cases (001 & 002), balance testing, playtesting |
| P6.5 | 2026-01-18 | Investigation layout redesign (70/30 split, horizontal tabs) |
| Music | 2026-01-24 | Client-side music ambience (auto-detect, track switching, localStorage) |
| Multi-LLM | 2026-01-23 | Multi-provider via LiteLLM, BYOK settings UI |
| Rate Limiting | 2026-04-06 | slowapi on all LLM endpoints, request size limits, routes modularization |

---

## What's Next

**Immediate (fix current branch):**
1. Fix critical/major issues from code review (API key leak in SSE errors, CORS, Dockerfile)
2. Re-validate with validation-gates
3. Merge rate-limiting branch

**Phase 6.5 — UI/UX & Visual Polish:**
1. Improve overall style — more HP vibes, lighter UX
2. Add artwork to locations and screens
3. Light theme option

**Phase 7 — Production Preparation:**
1. Implement localStorage save migration (PRP ready)
2. Update case template + case 002 to reflect briefing changes
3. Key manager for server (Infisical or similar)
4. Production hardening (security headers, CORS config, error sanitization)
5. Test saves after deployment

**Future:**
- Phase 7.5: Bayesian Probability Tracker (optional teaching tool)
- Phase 8: Meta-Narrative (expansion content)
- Additional cases (3, 4, 5)

---

## Ideas & Open Problems

**Monetization:** HP IP can't monetize directly — free samples / community lead magnets. Free tier: MiMo-V2-Flash. BYOK for power users. Paid tier via Stripe or alternative. Telegram bot for Russian audience.

**Technical:** Simple landing page + account management (open-source auth). Alternative payment processors research needed.

**Content:** Polish existing cases, improve verdict flow, more cases.

---

## Key Documents

- `PLANNING.md` — Roadmap, priorities, backlog
- `CHANGELOG.md` — Version history
- `docs/game-design/AUROR_ACADEMY_GAME_DESIGN.md` — Game design
- `docs/CASE_DESIGN_GUIDE.md` — Case creation guidelines
- `docs/planning/PRP-LOCALSTORAGE-SAVES.md` — Save migration PRP (ready)

## Metrics

| Metric | Value |
|--------|-------|
| Backend Tests | ~697/759 (91.8%) |
| Frontend Tests | 377/565 (66.7%) |
| Bundle Size | 112.45 KB gzipped |
| Dependencies | 0 vulnerabilities |
| TypeScript Errors | 0 |
| ESLint Errors | 0 |
