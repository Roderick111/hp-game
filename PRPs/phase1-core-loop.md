# Phase 1: Core Investigation Loop - Product Requirement Plan

**Status Update (2026-01-05)**: Project restructured. Monorepo with `backend/` (Python) and `frontend/` (React). Old prototype archived to `_deprecated_v0.7.0/` (33 files, 301 tests). Backend skeleton created with placeholder files. Task 1 ✅ complete, ready for implementation.

**Note**: YAML cases in `backend/src/case_store/` (not `cases/` as originally planned). Loader path: `backend/src/case_store/loader.py`.

---

## Goal

Build foundational investigation mechanics: LLM-powered narrator responding to freeform player input, evidence discovery via trigger keywords, state persistence. Player can explore single location, discover evidence, save/load progress.

## Why

- **Complete rebuild**: Current quiz-based prototype doesn't match new DnD-style detective design
- **Foundation for all features**: Narrator LLM integration required for witness interrogation (Phase 2), verdict system (Phase 3)
- **User impact**: Transforms gameplay from "click predefined options" to "type anything and LLM responds"
- **Educational**: Teaches investigation through exploration, not quiz answers

## What

**User-visible behavior**:
1. Player types freeform action ("I check under the desk")
2. LLM narrator responds in 2-4 sentences (atmospheric, concise)
3. If action matches evidence trigger → evidence auto-discovered, added to Evidence Board
4. If action asks about not_present item → predefined response (prevents hallucination)
5. If action asks about already-found evidence → "You've already examined this"
6. Save/load button persists progress (JSON file)

**Technical requirements**:
- Python FastAPI backend with Claude Haiku integration
- YAML case files (location descriptions, hidden evidence, triggers)
- React frontend (terminal UI aesthetic, freeform textarea input)
- Evidence Board component (displays discovered evidence)
- JSON state persistence (location, evidence, history)

### Success Criteria
- [ ] Player can type ANY logical action, LLM responds
- [ ] Evidence discovery works (5+ trigger variants per evidence)
- [ ] Evidence auto-added to board (no "collect" button)
- [ ] Not_present items handled (no hallucination)
- [ ] Save/load preserves state across sessions
- [ ] Terminal UI aesthetic (monospace font, ASCII borders)
- [ ] Python tests pass (pytest: narrator prompt, evidence matching)
- [ ] Frontend tests pass (Vitest: LocationView, EvidenceBoard)

---

## Context & References

### Documentation (URLs for AI agent to reference)

```yaml
- url: https://docs.anthropic.com/en/docs/agent-sdk/python
  why: Claude Python SDK setup, async client patterns

- url: https://fastapi.tiangolo.com/async/
  why: FastAPI async routes, when to use async vs sync

- url: https://pydantic-docs.helpmanual.io/usage/models/
  why: Pydantic models for state validation

- url: https://github.com/zhanymkanov/fastapi-best-practices
  why: FastAPI project structure, testing patterns
```

### Codebase Patterns (files to study)

```yaml
- file: src/components/ui/Card.tsx
  why: Reusable card component structure (keep this for Evidence Board)
  symbol: Card (React component)

- file: src/components/ui/Button.tsx
  why: Reusable button component (keep for Save/Load buttons)
  symbol: Button (React component)

- file: tailwind.config.js
  why: Tailwind setup (monospace fonts, terminal theme)
```

### Research (from web search)

**LLM Integration**:
- GitHub: [anthropic-sdk-python](https://github.com/anthropics/anthropic-sdk-python) - Official Python SDK
- Pattern: Async client with context managers, streaming responses, rate limiting

**Text Adventure Mechanics**:
- GitHub: [llm-text-adventure](https://github.com/iankelk/llm-text-adventure) - Freeform input handling
- Pattern: Player input → LLM game master → structured response parsing

**FastAPI Async**:
- [FastAPI async best practices](https://github.com/zhanymkanov/fastapi-best-practices) - Project structure, testing
- Pattern: Async routes for I/O-bound (LLM calls), sync for CPU-bound

---

## Quick Reference (Context Package)

### Essential API Signatures

**Claude Python SDK** (from official docs):
```python
from anthropic import AsyncAnthropic

# Async client setup
client = AsyncAnthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

# Create message (non-streaming)
async def get_response(prompt: str) -> str:
    message = await client.messages.create(
        model="claude-haiku-4",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}]
    )
    return message.content[0].text

# Streaming response
async def stream_response(prompt: str):
    async with client.messages.stream(
        model="claude-haiku-4",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}]
    ) as stream:
        async for text in stream.text_stream:
            yield text
```

**FastAPI Async Routes** (from official docs):
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
    response = await get_llm_response(request.player_input)
    return {"narrator_response": response}
```

**PyYAML Case Loading** (standard library):
```python
import yaml
from pathlib import Path

def load_case(case_id: str) -> dict:
    case_path = Path(f"cases/{case_id}.yaml")
    with open(case_path, "r") as f:
        return yaml.safe_load(f)

# Access location data
case = load_case("case_001")
location = case["locations"]["ministry_archives"]
print(location["description"])
print(location["hidden_evidence"])
```

### Key Patterns from Research

**Evidence Trigger Matching** (from llm-text-adventure):
```python
def matches_trigger(player_input: str, triggers: list[str]) -> bool:
    """Check if player input matches any trigger keyword."""
    input_lower = player_input.lower()
    return any(trigger in input_lower for trigger in triggers)

# Usage
evidence = {
    "id": "hidden_note",
    "triggers": ["under desk", "beneath desk", "search desk", "check drawers"]
}
if matches_trigger("I look under the desk", evidence["triggers"]):
    # Reveal evidence
    pass
```

**Narrator Prompt Template** (from game design docs):
```python
def build_narrator_prompt(
    location_desc: str,
    hidden_evidence: list[dict],
    discovered_ids: list[str],
    not_present: list[dict],
    player_input: str
) -> str:
    """Build narrator LLM prompt with strict rules."""
    return f"""You are narrator for Harry Potter detective game.

== CURRENT LOCATION ==
{location_desc}

== HIDDEN EVIDENCE (reveal if player investigates correctly) ==
{format_hidden_evidence(hidden_evidence, discovered_ids)}

== ALREADY DISCOVERED (do not repeat) ==
{', '.join(discovered_ids) if discovered_ids else 'None'}

== NOT PRESENT (use exact responses) ==
{format_not_present(not_present)}

== RULES ==
1. If player action matches hidden evidence triggers → reveal with [EVIDENCE: id] tag
2. If already discovered → "You've already examined this thoroughly."
3. If asks about not_present items → use exact defined response
4. If undefined action → describe atmosphere only, NO new clues
5. Keep responses 2-4 sentences, atmospheric but concise
6. Failed searches → "You search but find nothing of note."

== PLAYER ACTION ==
"{player_input}"

Respond as narrator (2-4 sentences):"""
```

**State Persistence** (from FastAPI best practices):
```python
from pydantic import BaseModel
from datetime import datetime
import json

class PlayerState(BaseModel):
    case_id: str
    current_location: str
    discovered_evidence: dict[str, dict]  # {id: {found_at, description}}
    recent_history: list[str]  # Last 10 interactions
    timestamp: datetime

def save_state(state: PlayerState, player_id: str):
    """Save player state to JSON file."""
    save_path = Path(f"saves/{state.case_id}_{player_id}.json")
    save_path.parent.mkdir(parents=True, exist_ok=True)
    with open(save_path, "w") as f:
        json.dump(state.model_dump(mode="json"), f, indent=2)

def load_state(case_id: str, player_id: str) -> PlayerState | None:
    """Load player state from JSON file."""
    save_path = Path(f"saves/{case_id}_{player_id}.json")
    if not save_path.exists():
        return None
    with open(save_path, "r") as f:
        data = json.load(f)
    return PlayerState(**data)
```

### Library-Specific Gotchas

**Claude API**:
- **Issue**: Async client requires event loop
- **Solution**: Use FastAPI's async routes (provides event loop)
- **Example**: `async def investigate(...) -> dict:` not `def investigate(...)`

**FastAPI**:
- **Issue**: Mixing sync and async routes can cause blocking
- **Solution**: Use `async def` for I/O-bound (LLM calls), `def` for CPU-bound (evidence matching)
- **Pattern**: All LLM routes = async, all utility functions = sync

**YAML Case Files**:
- **Issue**: YAML multiline strings need pipe `|` for proper formatting
- **Solution**: Always use `description: |` for location descriptions
- **Example**: See Quick Reference YAML structure below

### Decision Tree

**When player submits action**:
```
1. Load current location data from YAML
   ↓
2. Check if action matches any hidden_evidence triggers
   ├─ YES → Extract evidence, add to discovered_evidence
   │         Build prompt with [EVIDENCE: id] instruction
   │         Send to LLM → Return response + evidence
   │
   └─ NO → Continue
         ↓
3. Check if action mentions already_discovered evidence
   ├─ YES → Return "You've already examined this thoroughly."
   │
   └─ NO → Continue
         ↓
4. Check if action matches any not_present triggers
   ├─ YES → Return predefined not_present response
   │
   └─ NO → Continue
         ↓
5. Build narrator prompt (generic exploration)
   → Send to LLM → Return atmospheric response
```

### Configuration Requirements

**Environment Variables**:
```bash
# .env file
ANTHROPIC_API_KEY=sk-ant-...  # Required for Claude API
PYTHON_ENV=development  # development | production
SAVE_DIRECTORY=./saves  # Where to store player state JSON files
```

**Python Dependencies** (pyproject.toml):
```toml
[project]
name = "auror-academy-backend"
version = "0.0.1"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.109.0",
    "anthropic>=0.40.0",
    "pydantic>=2.5.0",
    "pyyaml>=6.0.1",
    "uvicorn>=0.27.0",  # ASGI server
    "python-dotenv>=1.0.0",
]

[tool.uv]
dev-dependencies = [
    "pytest>=7.4.0",
    "pytest-asyncio>=0.21.0",
    "httpx>=0.26.0",  # For testing FastAPI routes
]
```

**Frontend Dependencies** (package.json):
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "vite": "^5.0.0",
    "vitest": "^1.2.0"
  }
}
```

### YAML Case Structure (Quick Reference)

```yaml
# cases/case_001.yaml
case:
  id: "case_001"
  title: "The Restricted Section"

  locations:
    library:
      id: "library"
      name: "Hogwarts Library - Crime Scene"
      type: "micro"  # Single room, no exits

      description: |
        You enter the library. A heavy oak desk dominates the center,
        papers scattered across its surface. Dark arts books line the
        towering shelves. Near the frost-covered window, the victim lies
        motionless, wand clutched in hand.

      surface_elements:  # Always visible (mentioned in description)
        - "Oak desk with scattered papers"
        - "Dark arts books on shelves"
        - "Frost-covered window"
        - "Victim's body near window"
        - "Wand in victim's hand"

      hidden_evidence:  # Only revealed if player investigates
        - id: "hidden_note"
          type: "physical"
          triggers:
            - "under desk"
            - "beneath desk"
            - "search desk"
            - "check drawers"
            - "examine desk closely"
          description: |
            Crumpled parchment shoved far under the desk. Someone wanted
            this hidden. Words "I know what you did" scrawled in hurried script.
          tag: "[EVIDENCE: Threatening Note]"

        - id: "wand_signature"
          type: "magical"
          triggers:
            - "examine wand"
            - "inspect wand"
            - "prior incantato"
            - "check last spell"
          description: |
            You cast Prior Incantato on the victim's wand. Ghostly echo:
            Stupefy, cast at 9:15pm. Then the wand was dropped.
          tag: "[EVIDENCE: Wand Last Spell]"

      not_present:  # Prevent hallucination
        - triggers:
            - "secret passage"
            - "hidden door"
            - "escape route"
          response: "The walls are solid stone. No hidden passages here."

        - triggers:
            - "other bodies"
            - "more victims"
            - "witnesses hiding"
          response: "The victim appears to be alone. No one else in the library."

  # More locations would go here for multi-location cases
  # Phase 1 focuses on single location only
```

---

## Current Codebase Structure (After Restructure - 2026-01-05)

```bash
hp_game/
├── backend/                          # ✅ Created
│   ├── src/
│   │   ├── main.py                   # ✅ Created (placeholder)
│   │   ├── api/
│   │   │   └── routes.py             # ✅ Created (placeholder)
│   │   ├── context/
│   │   │   └── narrator.py           # ✅ Created (placeholder)
│   │   ├── state/
│   │   │   └── player_state.py       # ✅ Created (PlayerState model)
│   │   ├── case_store/
│   │   │   └── case_001.yaml         # ✅ Created (template)
│   │   └── tests/                    # ✅ Created (empty)
│   ├── pyproject.toml                # ✅ Created (UV deps)
│   ├── .env                          # ✅ Created (API key configured)
│   ├── .gitignore                    # ✅ Created
│   └── README.md                     # ✅ Created
├── frontend/                         # ✅ Moved from root
│   ├── src/
│   │   ├── components/
│   │   │   └── ui/
│   │   │       ├── Card.tsx          # ✅ Reusable (keep)
│   │   │       ├── Button.tsx        # ✅ Reusable (keep)
│   │   │       ├── Modal.tsx         # ✅ Reusable (keep)
│   │   │       └── EvidenceCard.tsx  # ✅ Reusable (keep)
│   │   ├── types/
│   │   │   └── game.ts               # ✅ Keep (base types)
│   │   ├── index.css                 # ✅ Keep (Tailwind)
│   │   └── vite-env.d.ts             # ✅ Keep
│   ├── package.json                  # ✅ Moved
│   ├── tailwind.config.js            # ✅ Keep (terminal theme)
│   └── vite.config.ts                # ✅ Keep
├── _deprecated_v0.7.0/               # ✅ Created (old prototype archived)
│   ├── README.md                     # ✅ Explains what's archived
│   ├── types/                        # hypothesis system
│   ├── utils/                        # scoring, unlocking, contradictions
│   ├── components/phases/            # 6 phase components
│   ├── data/mission1.ts              # old case file
│   └── [33 files, 301 tests]
├── docs/                             # ✅ Created
│   ├── AUROR_ACADEMY_GAME_DESIGN.md  # ✅ Moved
│   ├── CASE_DESIGN_GUIDE.md          # ✅ Moved
│   └── WORLD_AND_NARRATIVE.md        # ✅ Moved
├── cases/                            # ✅ Created (empty, for Phase 2)
└── PRPs/phase1-core-loop.md          # ✅ This file
```

**Status**: Directory restructure complete. Backend skeleton created. Frontend cleaned.

---

## Target Codebase Structure (After Phase 1 Implementation)

```bash
hp_game/
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── routes.py (CREATE) - FastAPI routes (/investigate, /evidence, /save, /load)
│   │   │   └── claude_client.py (CREATE) - Claude Haiku async client wrapper
│   │   ├── context/
│   │   │   └── narrator.py (CREATE) - Narrator LLM prompt builder
│   │   ├── state/
│   │   │   ├── player_state.py (CREATE) - PlayerState Pydantic model
│   │   │   └── persistence.py (CREATE) - JSON save/load functions
│   │   ├── case_loader/
│   │   │   └── loader.py (CREATE) - YAML case file loader
│   │   └── main.py (CREATE) - FastAPI app entry point
│   ├── tests/
│   │   ├── test_narrator.py (CREATE) - Narrator prompt tests
│   │   ├── test_evidence_matching.py (CREATE) - Trigger matching tests
│   │   └── test_routes.py (CREATE) - API route tests
│   ├── pyproject.toml (CREATE) - Python dependencies (uv)
│   └── .env.example (CREATE) - Environment variables template
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LocationView.tsx (CREATE) - Freeform input + LLM response
│   │   │   ├── EvidenceBoard.tsx (CREATE) - Discovered evidence list
│   │   │   └── ui/
│   │   │       ├── Card.tsx (KEEP) - Reusable card
│   │   │       └── Button.tsx (KEEP) - Reusable button
│   │   ├── api/
│   │   │   └── client.ts (CREATE) - Backend API client (fetch wrappers)
│   │   ├── hooks/
│   │   │   └── useInvestigation.ts (CREATE) - Investigation state hook
│   │   ├── types/
│   │   │   └── investigation.ts (CREATE) - PlayerState, Evidence types
│   │   └── App.tsx (REWRITE) - Main app with LocationView + EvidenceBoard
│   ├── tests/
│   │   ├── LocationView.test.tsx (CREATE)
│   │   └── EvidenceBoard.test.tsx (CREATE)
│   └── package.json (UPDATE) - Keep React/Vite, remove hypothesis deps
├── cases/
│   └── case_001.yaml (CREATE) - First case file
└── README.md (UPDATE) - Rebuild instructions
```

---

## Files to Create/Modify

| File | Status | Action | Purpose | Dependencies |
|------|--------|--------|---------|--------------|
| `backend/src/main.py` | ✅ CREATED | ENHANCE | Add routes import, CORS config | fastapi, uvicorn |
| `backend/src/api/routes.py` | ✅ CREATED | IMPLEMENT | API routes (investigate, save, load) | FastAPI, narrator.py |
| `backend/src/api/claude_client.py` | ⏳ PENDING | CREATE | Claude Haiku async client | anthropic SDK |
| `backend/src/context/narrator.py` | ✅ CREATED | IMPLEMENT | Narrator prompt builder | None (pure function) |
| `backend/src/state/player_state.py` | ✅ CREATED | ENHANCE | Add methods, validation | pydantic |
| `backend/src/state/persistence.py` | ⏳ PENDING | CREATE | JSON save/load | json, pathlib |
| `backend/src/case_store/loader.py` | ⏳ PENDING | CREATE | YAML case loader | pyyaml |
| `backend/src/case_store/case_001.yaml` | ✅ CREATED | POPULATE | Library case (evidence, triggers) | None |
| `backend/tests/test_narrator.py` | ⏳ PENDING | CREATE | Narrator prompt tests | pytest |
| `backend/tests/test_routes.py` | ⏳ PENDING | CREATE | API route tests | pytest, httpx |
| `backend/pyproject.toml` | ✅ CREATED | VERIFY | Python dependencies correct | uv package manager |
| `frontend/src/components/LocationView.tsx` | ⏳ PENDING | CREATE | Freeform input + response UI | React |
| `frontend/src/components/EvidenceBoard.tsx` | ⏳ PENDING | CREATE | Evidence list UI | React, Card.tsx |
| `frontend/src/api/client.ts` | ⏳ PENDING | CREATE | Backend API client | fetch |
| `frontend/src/hooks/useInvestigation.ts` | ⏳ PENDING | CREATE | Investigation state hook | React |
| `frontend/src/types/investigation.ts` | ⏳ PENDING | CREATE | PlayerState, Evidence types | None |
| `frontend/src/App.tsx` | ⏳ PENDING | CREATE | Main app (LocationView + EvidenceBoard) | React |
| `frontend/src/main.tsx` | ⏳ PENDING | CREATE | Vite entry point | React |

**Legend**:
- ✅ CREATED = File exists with placeholder/skeleton code
- ⏳ PENDING = Needs implementation in this PRP
- ENHANCE = Placeholder exists, needs full implementation
- IMPLEMENT = Placeholder exists, needs logic
- CREATE = Doesn't exist yet

---

## Tasks (ordered)

### Task 1: Backend Setup & Dependencies ✅ DONE
**Files**:
- `backend/pyproject.toml` ✅ Created
- `backend/.env` ✅ Created (API key configured)
- `backend/src/main.py` ✅ Created (placeholder)

**Action**: VERIFY
**Purpose**: Verify Python backend dependencies work
**Pattern**: Follow FastAPI best practices structure
**Depends on**: None
**Acceptance criteria**:
- ✅ `pyproject.toml` has dependencies (fastapi, anthropic, pydantic, pyyaml)
- ⏳ `uv sync` installs dependencies without errors
- ⏳ `uv run uvicorn src.main:app --reload` starts server on localhost:8000
- ⏳ FastAPI docs accessible at `http://localhost:8000/docs`

### Task 2: YAML Case File & Loader
**Files**:
- `backend/src/case_store/case_001.yaml` ✅ Created (template - needs population)
- `backend/src/case_store/loader.py` ⏳ Create
- `backend/tests/test_case_loader.py` ⏳ Create

**Action**: POPULATE + CREATE
**Purpose**: Define case structure, load from YAML
**Pattern**: Follow YAML structure from Quick Reference
**Depends on**: Task 1 ✅
**Acceptance criteria**:
- `case_001.yaml` has library location with 2+ hidden evidence, 2+ not_present
- `load_case("case_001")` returns dict with locations, evidence
- Pytest tests pass for case loading

### Task 3: Player State & Persistence
**Files**:
- `backend/src/state/player_state.py` ✅ Created (basic model - needs enhancement)
- `backend/src/state/persistence.py` ⏳ Create
- `backend/tests/test_persistence.py` ⏳ Create

**Action**: ENHANCE + CREATE
**Purpose**: Pydantic model for state, JSON save/load
**Pattern**: Follow PlayerState model from Quick Reference
**Depends on**: Task 1 ✅
**Acceptance criteria**:
- PlayerState validates required fields (case_id, location, evidence) ✅
- PlayerState has `add_evidence()`, `visit_location()` methods ✅
- `save_state()` writes JSON to `saves/` directory
- `load_state()` reads JSON and returns PlayerState instance
- Pytest tests pass for save/load roundtrip

### Task 4: Claude Haiku Client
**Files**:
- `backend/src/api/claude_client.py` (CREATE)
- `backend/tests/test_claude_client.py` (CREATE)

**Action**: CREATE
**Purpose**: Async Claude Haiku client wrapper
**Pattern**: Follow AsyncAnthropic pattern from Quick Reference
**Depends on**: Task 1
**Acceptance criteria**:
- `get_response(prompt)` returns LLM text response
- Async client uses context manager (`async with`)
- Error handling for API failures (rate limit, network)
- Pytest tests pass (mocked LLM responses)

### Task 5: Narrator Prompt Builder
**Files**:
- `backend/src/context/narrator.py` (CREATE)
- `backend/tests/test_narrator.py` (CREATE)

**Action**: CREATE
**Purpose**: Build narrator LLM prompt with strict rules
**Pattern**: Follow narrator prompt template from Quick Reference
**Depends on**: Task 2 (case loader)
**Acceptance criteria**:
- `build_narrator_prompt()` includes location, evidence, rules
- Prompt enforces 2-4 sentence responses
- Prompt includes [EVIDENCE: id] tag instruction
- Pytest tests verify prompt structure

### Task 6: Evidence Trigger Matching
**Files**:
- `backend/src/utils/evidence.py` (CREATE)
- `backend/tests/test_evidence.py` (CREATE)

**Action**: CREATE
**Purpose**: Match player input to evidence triggers
**Pattern**: Follow trigger matching from Quick Reference
**Depends on**: Task 2
**Acceptance criteria**:
- `matches_trigger("I check under the desk", triggers)` returns True
- Case-insensitive matching
- Supports multiple trigger variants per evidence
- Pytest tests cover 5+ trigger variants

### Task 7: API Routes (Investigate, Save, Load)
**Files**:
- `backend/src/api/routes.py` (CREATE)
- `backend/tests/test_routes.py` (CREATE)

**Action**: CREATE
**Purpose**: FastAPI routes for investigation, persistence
**Pattern**: Follow FastAPI async routes from Quick Reference
**Depends on**: Tasks 3, 4, 5, 6
**Acceptance criteria**:
- `POST /investigate` returns narrator response + discovered evidence
- `POST /save` saves player state to JSON
- `GET /load/{case_id}` loads player state from JSON
- `GET /evidence` returns discovered evidence list
- Pytest tests pass (httpx.AsyncClient)

### Task 8: Frontend API Client
**Files**:
- `frontend/src/api/client.ts` (CREATE)
- `frontend/src/types/investigation.ts` (CREATE)

**Action**: CREATE
**Purpose**: Type-safe backend API client
**Pattern**: Fetch wrappers with error handling
**Depends on**: Task 7 (backend routes ready)
**Acceptance criteria**:
- `investigate(input)` calls `POST /investigate`, returns response
- `saveState(state)` calls `POST /save`
- `loadState(caseId)` calls `GET /load/{caseId}`
- Error handling for network failures, 500 errors
- TypeScript types match backend Pydantic models

### Task 9: LocationView Component
**Files**:
- `frontend/src/components/LocationView.tsx` (CREATE)
- `frontend/tests/LocationView.test.tsx` (CREATE)

**Action**: CREATE
**Purpose**: Freeform input + LLM response display
**Pattern**: Terminal UI aesthetic (monospace, ASCII borders)
**Depends on**: Task 8
**Acceptance criteria**:
- Textarea for freeform input (player action)
- Submit button calls `investigate()` API
- Displays LLM narrator response (2-4 sentences)
- Terminal aesthetic (monospace font, card border)
- Loading state while awaiting LLM response
- Vitest tests pass (render, submit, response display)

### Task 10: EvidenceBoard Component
**Files**:
- `frontend/src/components/EvidenceBoard.tsx` (CREATE)
- `frontend/tests/EvidenceBoard.test.tsx` (CREATE)

**Action**: CREATE
**Purpose**: Display discovered evidence list
**Pattern**: Reuse Card.tsx from existing codebase
**Depends on**: Task 8
**Acceptance criteria**:
- Displays evidence list (auto-updates when new evidence discovered)
- Shows evidence type (physical, testimonial, magical, documentary)
- Shows where found (location name)
- Empty state ("No evidence discovered yet")
- Vitest tests pass (render, empty state, evidence list)

### Task 11: Main App Integration
**Files**:
- `frontend/src/App.tsx` (MODIFY)
- `frontend/src/hooks/useInvestigation.ts` (CREATE)

**Action**: MODIFY + CREATE
**Purpose**: Integrate LocationView + EvidenceBoard
**Pattern**: React Context for investigation state
**Depends on**: Tasks 9, 10
**Acceptance criteria**:
- App renders LocationView (top) + EvidenceBoard (sidebar)
- `useInvestigation()` hook manages state (location, evidence, history)
- Save/Load buttons call API (persist state)
- State updates when evidence discovered
- Vitest integration tests pass

### Task 12: End-to-End Testing
**Files**:
- `backend/tests/test_e2e.py` (CREATE)
- `frontend/tests/integration.test.tsx` (CREATE)

**Action**: CREATE
**Purpose**: Verify full investigation flow
**Pattern**: Backend: httpx.AsyncClient. Frontend: Vitest integration
**Depends on**: Task 11
**Acceptance criteria**:
- Backend: Player submits action → evidence discovered → state saved
- Frontend: Type action → LLM response → evidence appears on board
- Save/load roundtrip works (persist state, reload page, state restored)
- No hallucination (not_present items handled correctly)
- All tests pass (pytest + Vitest)

---

## Integration Points

### Backend → Claude API
- **Where**: `backend/src/api/claude_client.py`
- **What**: AsyncAnthropic client calls `messages.create()`
- **Pattern**: Async/await with error handling (rate limit, network)

### Backend → Frontend
- **Where**: FastAPI routes (`/investigate`, `/save`, `/load`)
- **What**: REST API with JSON responses
- **Pattern**: CORS enabled for localhost:5173 (Vite dev server)

### Frontend → Backend
- **Where**: `frontend/src/api/client.ts`
- **What**: Fetch wrappers with TypeScript types
- **Pattern**: Error boundaries for API failures

### YAML → Python
- **Where**: `backend/src/case_loader/loader.py`
- **What**: PyYAML loads `cases/*.yaml` into dict
- **Pattern**: Validate YAML structure (locations, evidence, triggers)

### State → JSON
- **Where**: `backend/src/state/persistence.py`
- **What**: Pydantic model → JSON file in `saves/` directory
- **Pattern**: `model.model_dump(mode="json")` for serialization

---

## Known Gotchas

### Claude API Rate Limiting
- **Issue**: Free tier has 50 requests/min limit
- **Solution**: Implement exponential backoff retry logic in `claude_client.py`
- **Example**: `@retry(tries=3, delay=1, backoff=2)` decorator

### YAML Multiline Strings
- **Issue**: Forgetting pipe `|` causes description to be single line
- **Solution**: Always use `description: |` for location descriptions
- **Check**: Pytest test verifies description has newlines

### Evidence Trigger Matching
- **Issue**: Player types "I search the desk" but trigger is "search desk" (exact match)
- **Solution**: Use `trigger in player_input.lower()` not `trigger == player_input.lower()`
- **Example**: "I search the desk thoroughly" matches trigger "search desk"

### Not_Present Hallucination
- **Issue**: LLM invents details not in YAML (e.g., "You find a secret passage")
- **Solution**: Strict prompt rules + not_present list in YAML
- **Validation**: Pytest test with LLM mock ensures no hallucination

### Async Event Loop
- **Issue**: Mixing sync and async in FastAPI routes causes blocking
- **Solution**: All LLM routes = `async def`, all utils = sync `def`
- **Pattern**: `await claude_client.get_response()` in async route

---

## Validation Loop

### Level 1: Backend Tests (pytest)
```bash
cd backend
uv run pytest tests/ -v
# Expected: All tests pass
# - test_case_loader.py: YAML loading
# - test_narrator.py: Prompt building
# - test_evidence.py: Trigger matching
# - test_routes.py: API routes
# - test_persistence.py: Save/load
```

### Level 2: Frontend Tests (Vitest)
```bash
cd frontend
bun test
# Expected: All tests pass
# - LocationView.test.tsx: Freeform input UI
# - EvidenceBoard.test.tsx: Evidence display
# - integration.test.tsx: Full flow
```

### Level 3: Manual Testing
```bash
# Terminal 1: Backend
cd backend
uv run uvicorn src.main:app --reload

# Terminal 2: Frontend
cd frontend
bun run dev

# Browser: http://localhost:5173
# 1. Type action: "I check under the desk"
# 2. Verify: LLM response appears (2-4 sentences)
# 3. Verify: Evidence appears on Evidence Board
# 4. Click Save
# 5. Refresh page
# 6. Click Load
# 7. Verify: Evidence still present (state persisted)
```

---

## Dependencies

**Backend (Python)**:
- `fastapi>=0.109.0` - Web framework
- `anthropic>=0.40.0` - Claude API client
- `pydantic>=2.5.0` - State validation
- `pyyaml>=6.0.1` - YAML case loading
- `uvicorn>=0.27.0` - ASGI server
- `python-dotenv>=1.0.0` - Environment variables

**Frontend (React)**:
- No new dependencies (keep existing React, Vite, Tailwind)

---

## Out of Scope

**Phase 1 focuses ONLY on core loop:**
- ✅ Freeform investigation (LLM narrator)
- ✅ Evidence discovery (trigger keywords)
- ✅ State persistence (JSON save/load)
- ✅ Single location (no navigation)

**Deferred to later phases:**
- ❌ Witness interrogation (Phase 2)
- ❌ Suspect interrogation (Phase 2)
- ❌ Verdict submission (Phase 3)
- ❌ Mentor feedback / Moody (Phase 3)
- ❌ Inner Voice system (Phase 4)
- ❌ Magic spells (Phase 4)
- ❌ Multiple locations (Phase 4)
- ❌ Three-act pacing (Phase 5)
- ❌ Post-verdict scenes (Phase 5)

---

## Agent Orchestration Plan

### Execution Strategy

**Sequential Track** (dependencies required):
1. **dependency-manager** → Setup Python backend (`uv` + deps) + verify bun frontend
2. **fastapi-specialist** → Build backend (routes, Claude client, narrator, persistence)
3. **react-vite-specialist** → Build frontend (LocationView, EvidenceBoard, API client)
4. **validation-gates** → Run tests (pytest + Vitest), lint, type-check
5. **documentation-manager** → Update README, add setup instructions

**No parallel execution** - Each phase depends on previous completion.

### Agent-Specific Guidance

#### For dependency-manager
- **Input**: Tasks 1 (backend setup) ✅ PARTIAL - pyproject.toml created
- **Actions**:
  - ✅ `backend/pyproject.toml` created with dependencies
  - ⏳ Run `uv sync` to verify installation works
  - ✅ `.env` created with ANTHROPIC_API_KEY
  - ⏳ Verify `bun install` works for frontend (should work, no changes made)
  - ⏳ Add `python-dotenv` if missing (for loading .env)
- **Output**: Dependencies verified, both backend and frontend ready

#### For fastapi-specialist
- **Input**: Tasks 2-7 (backend implementation)
- **Dependencies**: Wait for dependency-manager
- **Pattern**: Follow FastAPI async route patterns from Quick Reference
- **Context**: Use narrator prompt template, evidence matching patterns
- **Output**: Backend API functional (`POST /investigate`, save/load)

#### For react-vite-specialist
- **Input**: Tasks 8-11 (frontend implementation)
- **Dependencies**: Wait for fastapi-specialist (backend routes ready)
- **Pattern**: Reuse Card.tsx, Button.tsx from existing codebase
- **Context**: Terminal UI aesthetic (monospace font, ASCII borders)
- **Output**: Frontend UI functional (LocationView + EvidenceBoard)

#### For validation-gates
- **Input**: Task 12 (testing)
- **Dependencies**: Wait for react-vite-specialist
- **Actions**:
  - Run `uv run pytest backend/tests/ -v` → verify all pass
  - Run `bun test` in frontend → verify all pass
  - Manual testing flow (documented in Validation Loop)
- **Success**: All tests pass, manual flow works

#### For documentation-manager
- **Input**: All tasks complete
- **Actions**:
  - Update README.md with setup instructions (backend + frontend)
  - Add `.env.example` documentation
  - Update CHANGELOG.md with Phase 1 completion
- **Output**: Documentation reflects Phase 1 rebuild

### Handoff Context

**Next agent receives**:
- This PRP (full context)
- Quick Reference (no doc reading needed)
- Specific task numbers to implement
- Pattern files to follow (Card.tsx, Button.tsx)

**Next agent does NOT need**:
- ❌ Read AUROR_ACADEMY_GAME_DESIGN.md (context extracted in PRP)
- ❌ Search for FastAPI examples (patterns in Quick Reference)
- ❌ Research Claude API (signatures in Quick Reference)
- ❌ Invent YAML structure (template in Quick Reference)

---

## Anti-Patterns to Avoid

**Backend**:
- ❌ Mixing sync and async in FastAPI routes (use `async def` for LLM calls)
- ❌ Forgetting CORS for frontend (enable CORS middleware)
- ❌ Hardcoding API key in code (use environment variables)
- ❌ Not validating YAML structure (add Pydantic model for case validation)

**Frontend**:
- ❌ Not handling loading state (show spinner while awaiting LLM)
- ❌ Not handling error state (show error message if API fails)
- ❌ Not clearing input after submit (clear textarea on successful submit)
- ❌ Not updating Evidence Board automatically (use state hook to trigger re-render)

**LLM Integration**:
- ❌ Not including not_present items in prompt (causes hallucination)
- ❌ Not limiting response length (LLM may write paragraphs, need 2-4 sentences)
- ❌ Not parsing [EVIDENCE: id] tag (need to extract evidence from response)
- ❌ Not preventing re-discovery (track discovered_evidence, return "already examined")

---

Generated: 2026-01-05
Source: INITIAL.md, new game design/ docs
Research: Claude SDK, FastAPI, llm-text-adventure
Confidence Score: 8/10

**Why 8/10**:
- ✅ Clear API patterns (Claude SDK official docs)
- ✅ FastAPI well-documented (async best practices)
- ✅ YAML structure defined (from game design docs)
- ✅ Evidence matching logic straightforward (trigger substring matching)
- ⚠️ LLM hallucination prevention requires strict prompt engineering (test thoroughly)
- ⚠️ Trigger matching needs tuning (5+ variants per evidence, may need iteration)

**Sources**:
- [Claude Python SDK](https://docs.anthropic.com/en/docs/agent-sdk/python)
- [FastAPI Async Routes](https://fastapi.tiangolo.com/async/)
- [FastAPI Best Practices](https://github.com/zhanymkanov/fastapi-best-practices)
- [llm-text-adventure GitHub](https://github.com/iankelk/llm-text-adventure)
