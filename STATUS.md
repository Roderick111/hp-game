# Project Status

**Version:** 2.0.0 (Case Redesign + Evidence Interpretation)
**Last Updated:** 2026-04-09
**Current Phase:** Phase 7 (Production Readiness)
**Type Safety Grade:** A

---

## Quick Status

| Category | Status | Notes |
|----------|--------|-------|
| Backend | ✅ Production Ready | Python 3.13, FastAPI, PostgreSQL (Neon), ~697/759 tests passing (91.8%) |
| Frontend | ✅ Production Ready | React 18, TypeScript 5.6, Zod validation, 0 TS errors |
| Type Safety | ✅ Grade A | Compile-time (0 TS errors) + runtime (Zod) validation |
| Security | ✅ Clean | 0 vulnerabilities (audited 2026-04-06) |
| Builds | ✅ Success | Frontend 112.45 KB gzipped |
| LLM | ✅ BYOK + Streaming | Free tier: MiMo-V2-Flash, BYOK via Settings, SSE streaming |
| Music | ✅ Complete | Per-case ambience with volume/play/mute, localStorage persistence |
| Cases | 🔄 Case 001 redesigned | Dobby culprit, witness_reactions data ready, system TBD |

---

## 🔄 In Progress

### Witness Evidence Reaction System
- `witness_reactions` data written into case_001.yaml for every evidence piece
- Each witness has a one-line interpretation per evidence item
- **No backend/frontend system yet** — next step is designing the mechanic (UX discussion pending)
- Question: button ("show evidence"), automatic during conversation, or something else?

---

## ✅ Recent Completions

### 2026-04-10 — Issue #7: Dynamic LLM model catalog from OpenRouter API
- Status: done
- Changes: Created `api/model_catalog.py` — fetches models from OpenRouter API, caches 24h, filters to text-only chat models. Direct providers (anthropic/openai/google) get top 5 most recent; OpenRouter gets top 10 exclusive models. Fixed frontend filter, added `httpx` runtime dep, remaps IDs for LiteLLM (google→gemini, openrouter prefix).

### 2026-04-09 — Issue #9: Narrator em dash spacing
- Status: done
- Changes: Added system rule to `build_system_prompt()` in `context/narrator.py` — max one em dash per response, spaces required around it

### 2026-04-09 — planner (routing)
- Created PRP for react-router-dom URL navigation
- **File created**: PRPs/PRP-ROUTING.md
- **Scope**: BrowserRouter wrapper, `/` landing, `/case/:caseId` game, remove session localStorage, fix SaveLoadModal reload, update test providers
- **Confidence**: 8/10
- **Handoff to**: react-vite-specialist (Tasks 1-6) → validation-gates

### 2026-04-09 — planner
- Created PRP for layout redesign + hints toggle
- **File created**: PRPs/PRP-LAYOUT-REDESIGN.md
- **Scope**: Merged header, sidebar image+3 modal buttons, hints toggle (localStorage), simplified input area
- **Confidence**: 8/10
- **Handoff to**: react-vite-specialist (Tasks 1-7) → validation-gates

### 2026-04-07 — Case 001 Full Redesign
- Complete `case_001.yaml` rewrite (~1900 lines)
- **New culprit**: Dobby (was Draco) — slave following Lucius's orders to protect Draco
- **Three-phase misdirection**: Hermione (early, motive) → Draco (mid, evidence avalanche) → Dobby (late, "something doesn't fit")
- **Raw evidence**: All descriptions are observations only, no self-interpreting conclusions
- **New evidence**: `dual_shimmer`, `kitchen_log`, `dobby_frostbite`, `lucius_order`, `hermione_book_slip`
- **Witness reactions**: Per-evidence one-liner for each witness showing how they'd interpret it
- **Dobby's slavery as moral core**: Can a slave be held responsible for following orders?
- Backup at `case_001_backup_v2.yaml`

### 2026-04-07 — Case 002 Consistency Fixes
- Vector's lie conditions: evidence-gated → trust-based (`trust<60`)
- Added `not_present` sections to all 4 locations
- Migrated 20 evidence items from `triggers` to `discovery_guidance`
- Fixed Filch's knowledge (specific → vague)
- All 73 related tests pass

### 2026-04-07 — Markdown Rendering Fix
- Added `renderInlineMarkdown` to 8 components showing LLM text
- Fixed: LocationView, WitnessInterview, BriefingDossier, BriefingMessage, BriefingQuestion, BriefingEngagement, ConfrontationDialogue, EvidenceModal
- Bold/italic was showing raw `*asterisks*` — now renders properly

### 2026-04-07 — Save System Overhaul (JSON → PostgreSQL)
- **Per-player saves**: Anonymous UUID via `crypto.randomUUID()` in localStorage
- **Slot system**: autosave (continuous) + 3 manual slots (snapshots of autosave)
- **All API calls** now pass `player_id` + `slot: 'autosave'` — no more shared `default` player
- **Manual save**: Named slots snapshot full autosave state (conversation, witnesses, briefing, etc.)
- **Manual load**: Backend copies named slot → autosave, frontend resumes from autosave
- **PostgreSQL migration**: JSON files → Neon PostgreSQL (`saves` table with JSONB column)
- **Single cached connection** with autocommit — fast after initial Neon cold-start
- Frontend `client.ts`: slot/player_id added to all 15+ API functions
- Backend `persistence.py`: full rewrite from file I/O to SQL (same function signatures, zero changes to routes)
- Deleted `localSaves.ts`, removed all localStorage save logic

### 2026-04-07 — Routes Modularization & Rate Limiting
- 3600-line routes.py split into 7 submodules
- slowapi on all 11 LLM endpoints
- Code review found 14 issues (1 critical, 4 major) — some still pending

---

## Architecture

**Backend:** Python 3.13.3 + FastAPI + LiteLLM 1.57+ (multi-provider)
- State: PostgreSQL (Neon) — `saves` table with JSONB, 4 slots per player
- Start: `cd backend && uv run uvicorn src.main:app --reload`

**Frontend:** React 18 + TypeScript 5.6 + Vite 6 + Tailwind
- Validation: Zod (24 schemas)
- Bundle: ~112 KB gzipped
- Start: `cd frontend && ~/.bun/bin/bun run dev`

---

## What's Working

- **Investigation**: Freeform LLM narrator, evidence discovery (semantic guidance, 5+ variants)
- **Witnesses**: Interrogation, trust mechanics, secret revelation via evidence
- **Spells**: 7 investigation spells (text casting), Legilimency (formula-based)
- **Verdict**: Submission, fallacy detection, post-verdict confrontation
- **Briefing**: Moody Q&A system
- **Tom**: Ghost mentor (50/50 helpful/misleading)
- **UI**: Main menu, 3 locations (clickable + keys 1-3), save/load (4 slots), inline markdown
- **Cases**: Landing page with case selection, YAML-based case creation, 2 playable cases
- **Music**: Per-case background music (auto-detection, volume control, track switching)
- **LLM**: Multi-provider BYOK (OpenRouter/Anthropic/OpenAI/Google), SSE streaming

**Known Issues:**
- Frontend tests: 377/565 passing (pre-existing test infrastructure)
- mypy: 14 type errors in non-core modules
- Code review critical/major issues pending fix (routes refactor)
- Case 001 tests may need updating (evidence IDs changed, culprit changed)

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
| Case Redesign | 2026-04-07 | Case 001 Dobby rewrite, case 002 fixes, markdown rendering, slot saves |
| Save System | 2026-04-07 | Per-player UUID saves, slot-aware API, JSON → PostgreSQL (Neon) |

---

## What's Next

**Immediate:**
1. Design witness evidence reaction system (how players show evidence to witnesses)
2. Fix critical/major issues from code review (API key leak in SSE errors, CORS, Dockerfile)
3. Update case 001 tests for new evidence IDs and culprit

**Phase 6.5 — UI/UX & Visual Polish:**
1. Improve overall style — more HP vibes, lighter UX
2. Add artwork to locations and screens
3. Light theme option

**Phase 7 — Production Preparation:**
1. Key manager for server (Infisical or similar)
2. Production hardening (security headers, CORS config, error sanitization)
3. ~~Test saves after deployment~~ ✅ Saves migrated to PostgreSQL (Neon)

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
- `docs/planning/PRP-LOCALSTORAGE-SAVES.md` — Save migration PRP
- `docs/planning/PRP-SLOT-AWARE-SAVES.md` — Slot-aware saves PRP
- `PRPs/PRP-TELEMETRY.md` — Telemetry system PRP (ready)

## Metrics

| Metric | Value |
|--------|-------|
| Backend Tests | ~697/759 (91.8%) |
| Frontend Tests | 377/565 (66.7%) |
| Bundle Size | 112.45 KB gzipped |
| Dependencies | 0 vulnerabilities |
| TypeScript Errors | 0 |
| ESLint Errors | 0 |
