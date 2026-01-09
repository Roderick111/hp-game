# Auror Academy: Case Files

DnD-style detective game with LLM narrator in Harry Potter universe. Freeform investigation, witness interrogation, verdict submission, fallacy detection.

**Target Audience**: Adults seeking cerebral mysteries
**Current Version**: 0.6.2 (Phase 4.3 - Tom Personality Enhancement Complete)

---

## Architecture

**Monorepo Structure**:
- **Backend**: Python FastAPI + Claude Haiku (narrator, witness, mentor contexts)
- **Frontend**: React + Vite (minimal terminal UI)
- **Cases**: YAML files (modular evidence/suspect/witness data)

---

## Getting Started

### Prerequisites

- **Backend**: Python 3.11+, `uv`, Claude API key
- **Frontend**: Bun (BHVR stack)

### Installation

```bash
# Backend setup
cd backend
uv venv
uv sync
cp .env.example .env
# Edit .env - add ANTHROPIC_API_KEY

# Frontend setup
cd ../frontend
bun install
```

### Development

```bash
# Terminal 1: Backend (port 8000)
cd backend
uv run uvicorn src.main:app --reload

# Terminal 2: Frontend (port 5173)
cd frontend
bun run dev
```

Open `http://localhost:5173`

### Testing

```bash
# Backend
cd backend
uv run pytest              # Run tests
uv run pytest --cov=src    # With coverage
uv run ruff check .        # Lint
uv run mypy src/           # Type check

# Frontend
cd frontend
bun test                   # Run tests
bun run test:coverage      # With coverage
```

---

## Project Structure

```
hp_game/
├── backend/                # Python FastAPI + Claude LLM
│   ├── src/
│   │   ├── case_store/     # YAML case files
│   │   ├── context/        # LLM context builders (narrator, witness, mentor)
│   │   ├── api/            # FastAPI routes + Claude client
│   │   └── state/          # Player state + persistence
│   ├── data/               # Reference data for prompts
│   │   └── rationality-thinking-guide-condensed.md
│   ├── tests/
│   └── pyproject.toml
├── frontend/               # React + Vite
│   ├── src/
│   │   ├── components/     # LocationView, EvidenceBoard, VerdictSubmission
│   │   ├── hooks/          # useInvestigation
│   │   └── api/            # Backend client
│   └── package.json
├── cases/                  # YAML case design files
├── docs/                   # Documentation
│   ├── game-design/        # Game design documents
│   │   ├── AUROR_ACADEMY_GAME_DESIGN.md
│   │   ├── CASE_DESIGN_GUIDE.md
│   │   ├── WORLD_AND_NARRATIVE.md
│   │   └── rationality-thinking-guide.md
│   ├── case-files/         # Case specifications
│   │   ├── CASE_001_RESTRICTED_SECTION.md
│   │   └── CASE_001_TECHNICAL_SPEC.md
│   ├── planning/           # Planning documents
│   │   ├── INITIAL.md (original Phase 1 requirements)
│   │   └── PHASE_3.1_INVESTIGATION_REPORT.md
│   └── research/           # Research & analysis
│       ├── phase-3-codebase.md
│       ├── phase-3-docs.md
│       ├── phase-3-github.md
│       └── general-patterns.md
├── PLANNING.md             # Phase-by-phase technical plan
└── STATUS.md               # Task tracking
```

---

## Tech Stack

### Backend
| Component | Technology |
|-----------|-----------|
| Framework | FastAPI |
| LLM | Claude Haiku (Anthropic) |
| Validation | Pydantic v2 |
| Server | Uvicorn |
| Testing | pytest + pytest-asyncio |
| Linting | Ruff + mypy |

### Frontend
| Component | Technology |
|-----------|-----------|
| Framework | React 18 + Vite |
| Package Manager | Bun (BHVR stack) |
| Styling | Tailwind CSS |
| State | React Context |
| Testing | Vitest + RTL |

---

## Gameplay Overview

**Investigation Flow**:
1. **Freeform Input** - Type any action (inspect wand, interview Hermione, check potions)
2. **LLM Narrator** - Claude responds with immersive descriptions
3. **Evidence Discovery** - Trigger keywords reveal clues (auto-added to EvidenceBoard)
4. **Witness Interrogation** - Ask questions, present evidence, reveal secrets (trust-based)
5. **Verdict Submission** - Submit suspect + reasoning + evidence (Moody evaluates, provides feedback)
6. **Confrontation** - If correct: Post-verdict dialogue scene → Case solved

**Design Principles**:
- **Player Agency**: No predefined options, DnD-style freedom
- **Obra Dinn Model**: Investigate freely, submit verdict when ready
- **Educational**: Teach critical thinking via fallacy detection
- **Immersive**: Harry Potter world with LLM narrator

See `docs/AUROR_ACADEMY_GAME_DESIGN.md` for full design.

---

## Phase 1 Features (COMPLETE)

**Core Investigation Loop** - Freeform DnD-style gameplay powered by Claude Haiku LLM:
- **Freeform Input**: Type any action (inspect wand, interview Hermione, check desk)
- **LLM Narrator**: Claude responds with immersive Harry Potter world descriptions
- **Evidence Discovery**: Trigger keywords auto-reveal clues (5+ variants per evidence)
- **State Persistence**: Save/load player progress to JSON files
- **Terminal UI**: Minimal React interface with conversation history + evidence sidebar

**Implementation Complete** (2026-01-05):
- Backend: 93 pytest tests passing, 100% coverage on critical paths
- Frontend: 96 Vitest tests passing, full component coverage
- Bundle: 158KB JS (50KB gzipped), 22KB CSS (4KB gzipped)
- Quality Gates: All passing (ruff, mypy, ESLint, TypeScript)

**Note**: v0.7.0 prototype (quiz-style) deprecated and archived to `_deprecated_v0.7.0/`

---

## Phase 2 Features (COMPLETE)

**Witness Interrogation System** - LA Noire-inspired trust mechanics + Phoenix Wright evidence presentation:
- **Freeform Questioning**: Ask witnesses anything (Claude LLM responds in character)
- **Trust Mechanics**: Aggressive (-10), empathetic (+5), neutral (0) tone affects honesty
- **Evidence Presentation**: Show evidence → trigger secret revelations (complex trigger parsing)
- **Context Isolation**: Separate Claude contexts (narrator doesn't know witness secrets)
- **Trust Visualization**: Color-coded meter (red <30, yellow 30-70, green >70)
- **Conversation History**: Persistent dialog with trust delta tracking
- **UI Narrative Enhancement**: Surface elements integrated into prose (no explicit lists)

**Implementation Complete** (2026-01-05):
- Backend: 173 tests (94% coverage), 24 trust + 19 witness + 10 routes + 11 loader + 5 persistence
- Frontend: 164 tests, 14 hook + 34 interview + 20 selector + 96 existing
- Total: 337 tests passing
- Quality Gates: All passing (pytest, Vitest, TypeScript)

---

## Phase 2.5 Features (COMPLETE)

**Terminal UX + Witness Integration** - Cohesive command-line aesthetic + playable witness system:
- **Terminal UX**: Removed "Investigate" button, Ctrl+Enter submission only
- **Quick Actions**: Context-aware shortcuts (examine desk, check window, talk to hermione)
- **Clickable Evidence**: Cards open modal with name, location found, description
- **Evidence Modal**: Simple overlay with full evidence details (ESC/click-outside closes)
- **Witness Integration**: WitnessSelector + WitnessInterview in App.tsx sidebar
- **YAML Updates**: witnesses_present field, evidence metadata (name, location, description)
- **Dark Theme**: Terminal variant for modals, consistent styling

**Implementation Complete** (2026-01-06):
- Backend: 192 tests (0 errors), evidence metadata endpoints
- Frontend: 182 tests (0 errors), EvidenceModal component
- Total: 374 tests passing
- Quality Gates: All passing (pytest, Vitest, TypeScript)
- User Tested: Confirmed working ✅

---

## Phase 3.5-3.9 Features (COMPLETE)

**Phase 3.5: Intro Briefing System** - Interactive Moody briefing:
- Case Assignment (WHO/WHERE/WHEN/WHAT), Teaching Moment (rationality concepts)
- Interactive Q&A with Moody (LLM-powered), Conversation History
- Dark terminal theme, "CONSTANT VIGILANCE" transition

**Phase 3.6: Dialogue Briefing UI** - Flowing conversation interface:
- Removed boxed sections, created BriefingMessage component
- Multiple-choice teaching question (4 button options)
- Chat-like vertical message feed

**Phase 3.7: Briefing UI Polish** - Transition timing + scrollbar fixes:
- Transition appears only after player asks ≥1 follow-up question
- Single scrollbar (fixed double scrollbar issue)

**Phase 3.8: Enhanced Moody Context** - Improved LLM responses:
- Enhanced Moody personality in briefing and feedback
- More natural dialogue flow, consistent characterization

**Phase 3.9: Validation-Gates Learning System** - Pattern documentation:
- TEST-FAILURES.md knowledge base (8 starter patterns)
- TESTING-CONVENTIONS.md quick reference
- validation-gates agent learns from documented failures

**Implementation Complete** (2026-01-07):
- Backend: 385 tests, 3 briefing endpoints
- Frontend: 417 tests, BriefingModal + BriefingMessage + BriefingConversation
- Total: 802 tests passing
- Quality Gates: All passing

---

## Phase 4.1-4.3 Features (COMPLETE)

**Tom's Inner Voice (LLM-Powered)** - Real-time conversation with ghost mentor:

Tom Thornfield's ghost provides real-time, context-aware commentary using Claude Haiku LLM. Responds naturally to evidence discoveries and can engage in direct conversation. Players learn to critically evaluate advice rather than blindly trusting.

**Core Features (Phase 4.1)**:
- **Auto-comments**: Tom observes investigation, comments 30% of time after evidence discovery
- **Direct chat**: Type "Tom, <question>" to ask him directly (e.g., "Tom, should I trust Hermione?")
- **Trust system**: 0% Case 1 → 100% Case 11+, affects personal story sharing depth
- **50/50 split**: Half helpful Socratic questions, half misleading plausible advice
- **Natural dialogue**: Psychology shown through behavior, not exposition (enforced by character prompt Rule #10)
- **Context-aware**: Tom learns evidence/witnesses as investigation progresses

**Personality Depth (Phase 4.3)**:
- **Behavioral patterns**: Doubling down when challenged, self-aware deflection, Samuel invocation
- **Marcus 3-tier progression**: Deflects (trust 30%) → Vague (50%) → Full ownership with details (80%+)
- **Voice evolution**: Eager to prove → Questioning self → Wisdom through failure
- **Mode authenticity**: Helpful = Tom's lessons from death, Misleading = Tom's living habits
- **Relationship depth**: Player, Moody, Samuel, Marcus evolve naturally through dialogue
- **Dark humor**: Self-deprecating about death ("Check floor. I didn't. Fell two stories.")

**UI**:
- Inline conversation with 💀 TOM: prefix and amber text (text-amber-300/90)
- Messages appear chronologically after narrator response (not stacked)
- Amber border on input when typing to Tom

**How to use**:
```
> examine frost pattern
NARRATOR: You find frost on the window...
💀 TOM: "Which side of the glass? Inside or outside?"

> Tom, should I trust Hermione?
💀 TOM: "She was inside. Physical presence is strong indicator..."

> Tom, what happened to Marcus Bellweather?
💀 TOM: [at trust 80%+] "Marcus Bellweather. Father, husband.
      His daughter was three when I testified. She's eighteen now.
      Because I couldn't say 'I'm not sure.'"
```

**Implementation Complete** (2026-01-09):
- Backend: 469 tests (44 new Phase 4.1-4.3 tests)
- Frontend: 430 tests (no new regressions)
- 14 files changed Phase 4.1 (7 backend, 7 frontend)
- 1 file enhanced Phase 4.3 (tom_llm.py system prompt)
- Total: 899 tests passing
- Quality Gates: All passing

**Technical**: Claude Haiku LLM with enhanced 1300-token character prompt including behavioral templates, Marcus progression, voice evolution, mode-specific dialogue, relationship markers, dark humor structure

**See Also**: `docs/game-design/TOM_THORNFIELD_CHARACTER.md` (complete character psychology)

---

## Phase 3 Features (COMPLETE)

**Verdict System + Post-Verdict Confrontation** - Full case completion with educational feedback:
- **Verdict Submission**: Select suspect, explain reasoning (50 char min), cite evidence
- **Mentor Feedback**: Moody analyzes reasoning, detects fallacies, scores 0-100
- **Fallacy Detection**: 4 types (confirmation bias, correlation≠causation, authority bias, post-hoc)
- **Adaptive Hints**: Feedback adapts based on attempts remaining (brutal → specific → direct)
- **Post-Verdict Confrontation**: 3-4 dialogue exchanges, aftermath text, case resolution
- **Retry System**: Up to 10 attempts, educational focus (show correct answer after max attempts)
- **Color-Coded Score**: Red <50, yellow 50-75, green >=75

**Implementation Complete** (2026-01-06):
- Backend: 317 tests (125 new), verdict evaluation, fallacy detection, mentor feedback
- Frontend: 287 tests (105 new), VerdictSubmission, MentorFeedback, ConfrontationDialogue
- Total: 604 tests passing (95% backend coverage)
- Quality Gates: All passing (pytest, Vitest, TypeScript, build)
- User Tested: Confirmed working ✅ (minor issues noted for future investigation)

---

## Development Roadmap

### Phase 1: Core Investigation Loop (COMPLETE - 2026-01-05)
- ✅ Project restructure (backend/frontend monorepo)
- ✅ FastAPI routes + Claude Haiku client
- ✅ YAML case loading (case_001: The Restricted Section)
- ✅ Freeform input → narrator response
- ✅ Evidence discovery triggers (substring matching)
- ✅ React LocationView + EvidenceBoard
- ✅ State persistence (save/load JSON)

### Phase 2: Witness System (COMPLETE - 2026-01-05)
- ✅ UI narrative enhancement (surface elements in prose)
- ✅ Witness interrogation (freeform questioning)
- ✅ Trust mechanics (LA Noire-inspired)
- ✅ Evidence presentation (Phoenix Wright-style secret triggers)
- ✅ Context isolation (narrator vs witness)
- ✅ WitnessInterview + WitnessSelector components

### Phase 2.5: Terminal UX + Witness Integration (COMPLETE - 2026-01-06)
- ✅ Terminal UX polish (removed button, quick actions)
- ✅ Evidence modal (clickable cards with details)
- ✅ Witness integration (WitnessSelector + WitnessInterview in App)
- ✅ YAML updates (witnesses_present, evidence metadata)
- ✅ Dark theme cohesion (terminal variant modals)

### Phase 3.5-3.9: Intro Briefing System + Polish + Learning (COMPLETE - 2026-01-07)
- Phase 3.5: Moody case briefing (case assignment + teaching moment)
- Phase 3.5: Rationality concept teaching (Case 1: Base rates)
- Phase 3.5: Interactive Q&A with Moody (LLM-powered)
- Phase 3.6: Dialogue UI (flowing conversation, multiple-choice teaching)
- Phase 3.7: UI polish (transition timing, single scrollbar)
- Phase 3.8: Enhanced Moody context (better characterization)
- Phase 3.9: Validation-gates learning system (pattern documentation)

### Phase 3: Verdict System + Post-Verdict Confrontation (COMPLETE - 2026-01-06)
- ✅ Verdict submission (suspect + reasoning + evidence citation)
- ✅ Mentor feedback (template-based, Moody personality)
- ✅ Fallacy detection (4 types: confirmation bias, correlation≠causation, authority bias, post-hoc)
- ✅ Reasoning scoring (0-100 scale)
- ✅ Attempt tracking (10 max, adaptive hints)
- ✅ Post-verdict confrontation (dialogue, aftermath, case resolution)
- ✅ User tested and confirmed working

### Phase 4: Tom's Inner Voice (COMPLETE - 2026-01-08)
- ✅ Evidence-count-based trigger system (3 tiers)
- ✅ 50% helpful Socratic questioning, 50% misleading advice
- ✅ Inline UI with skull icon (💀) + amber text
- ✅ 11 Tom triggers (5 helpful, 5 misleading, 1 rare)
- ✅ useInnerVoice hook for non-blocking async checks
- ✅ InnerVoiceState model for fired trigger tracking
- ✅ **Superseded by Phase 4.1** (YAML triggers → LLM conversation)

### Phase 4.1: LLM-Powered Tom (COMPLETE - 2026-01-09)
- ✅ Replaced YAML scripted triggers with Claude Haiku LLM
- ✅ Real-time conversation (auto-comments + direct chat)
- ✅ Trust system (0-100%, grows 10% per case)
- ✅ Character prompt with Rule #10 (no psychology exposition)
- ✅ Fixed message ordering (inline chronological)
- ✅ 30 new backend tests, 0 frontend regressions

### Phase 4.3: Tom Personality Enhancement (COMPLETE - 2026-01-09)
- ✅ Behavioral pattern templates (doubling down, deflection, Samuel invocation)
- ✅ Marcus Bellweather 3-tier guilt progression (deflect → vague → full ownership)
- ✅ Voice progression tied to trust (eager → questioning → wise)
- ✅ Mode-specific dialogue templates (helpful=lessons, misleading=habits)
- ✅ Relationship evolution markers (player, Moody, Samuel, Marcus)
- ✅ Dark humor expansion (3 template examples)
- ✅ 14 new behavioral pattern tests

### Phase 4.5: Magic System (2-3 days)
- Magic system (6 investigation spells with risk/reward)
- Evidence type filters (magical signatures)
- Spell trigger system in YAML

**MVP Target**: ~40 days (Phases 1-4.5)

See `PLANNING.md` for detailed timeline.

---

## Key Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Agent orchestration guide |
| `PLANNING.md` | 7-phase technical roadmap |
| `STATUS.md` | Real-time task tracking |
| `docs/game-design/AUROR_ACADEMY_GAME_DESIGN.md` | Game design document |
| `docs/planning/INITIAL.md` | Original Phase 1 requirements |
| `docs/research/` | Phase 3 research + general patterns |
| `PRPs/phase1-core-loop.md` | Phase 1 implementation plan |

---

## API Endpoints (Phase 1 Target)

```
POST /api/investigate
  Body: { "input": "inspect the wand" }
  Response: { "narrator_response": "...", "new_evidence": ["wand_broken"] }

GET /api/state
  Response: { "state_id": "...", "discovered_evidence": [...], ... }

POST /api/state
  Body: { "state_id": "...", ... }
  Response: { "status": "saved" }
```

---

## License

[Add license]

---

**Last Updated**: 2026-01-09
**Status**: Phase 4.3 Complete (Tom Personality Enhancement)
**Next**: Phase 4.5 (Magic System) or Phase 5 (Narrative Polish)
