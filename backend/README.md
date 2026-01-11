# HP Game Backend

FastAPI backend with Claude LLM narrator for Harry Potter investigation game.

**Current Version**: 0.6.10 (Spell Description Polish)
- 603 pytest tests passing (100% pass rate)
- All quality gates passing (ruff, mypy, coverage)
- Model: claude-haiku-4-5-20250929

**Key Features**:
- Freeform DnD-style investigation (narrator responds to any action)
- Witness interrogation (trust mechanics, secret revelation)
- Tom Thornfield LLM conversation (50% helpful / 50% misleading)
- Verdict evaluation (reasoning analysis, fallacy detection)
- Conversation history persistence (investigation log saved/loaded)
- Intro briefing system (Moody teaching + interactive Q&A)
- Magic system (7 spells, single-stage detection, programmatic Legilimency)

## Setup

### Prerequisites
- Python 3.11+
- `uv` package manager
- Claude API key (from console.anthropic.com)

### Installation

```bash
# Create venv and install deps
uv venv
uv sync

# Configure environment
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

### Development

```bash
# Run server
uv run uvicorn src.main:app --reload --port 8000

# OpenAPI docs
open http://localhost:8000/docs
```

### Testing

```bash
# Run all tests
uv run pytest tests/ -v

# With coverage
uv run pytest --cov=src --cov-report=term-missing

# Lint
uv run ruff check .

# Auto-fix lint issues
uv run ruff check --fix .

# Type check
uv run mypy src/
```

## API Endpoints (Phase 1)

### POST /api/investigate
Freeform investigation input → narrator response with evidence discovery

**Request**:
```bash
curl -X POST http://localhost:8000/api/investigate \
  -H "Content-Type: application/json" \
  -d '{
    "player_input": "I check under the desk for clues",
    "case_id": "case_001",
    "player_id": "default"
  }'
```

**Response**:
```json
{
  "narrator_response": "You kneel down and peer beneath the ancient oak desk...",
  "new_evidence": ["desk_scratches"],
  "case_id": "case_001",
  "player_id": "default"
}
```

### POST /api/save
Save player state to JSON file

**Request**:
```bash
curl -X POST http://localhost:8000/api/save \
  -H "Content-Type: application/json" \
  -d '{
    "case_id": "case_001",
    "player_id": "default",
    "discovered_evidence": ["desk_scratches"],
    "conversation_history": [...]
  }'
```

### GET /api/load/{case_id}
Load player state from JSON

**Request**:
```bash
curl "http://localhost:8000/api/load/case_001?player_id=default"
```

**Response**:
```json
{
  "case_id": "case_001",
  "player_id": "default",
  "discovered_evidence": ["desk_scratches"],
  "conversation_history": [...],
  "last_updated": "2026-01-05T15:30:00Z"
}
```

### GET /api/evidence
List all discovered evidence for a case

### GET /api/cases
List available cases

### GET /health
Health check endpoint

## Architecture

```
src/
├── case_store/       # YAML case files
├── context/          # LLM context builders (narrator, witness, mentor, spell_llm)
├── api/              # FastAPI routes + Claude client
├── spells/           # Spell definitions
└── state/            # Player state + persistence
```

See `PLANNING.md` (root) for full architecture.

## Recent Changes

### v0.6.10: Spell Description Polish (2026-01-11)

**Immersive Spell Descriptions**:
- Rewrote all 7 spell descriptions with mysterious, atmospheric language
- Removed formal "RESTRICTED" warning from Legilimency
- Changed from technical descriptions to evocative narrative style
- Descriptions now read like passages from forbidden knowledge texts

**Example (Legilimency)**:
- Before: "RESTRICTED: Mind reading spell - HIGH RISK..."
- After: "Slip past the barriers of the mind... but the mind fights back..."

**Files Modified**:
- `src/spells/definitions.py` - All spell descriptions rewritten for immersion

### Phase 4.6.2: Spell Detection System (2026-01-11)

**Single-Stage Detection** (spell_llm.py):
- `SPELL_SEMANTIC_PHRASES`: Defines action phrases for all 7 spells
- `detect_spell_with_fuzzy()`: Fuzzy matching + semantic phrase detection
- `extract_target_from_input()`: Parses spell targets ("on hermione")
- `extract_intent_from_input()`: Parses focused intent ("to find out about X")
- `detect_focused_legilimency()`: Determines focused vs unfocused search
- `build_legilimency_narration_prompt()`: 4 outcome templates

**Endpoints Updated**:
- `/api/investigate`: Uses new detection for all 7 spells
- `/api/interrogate`: Legilimency with programmatic outcomes

**Dependency**: rapidfuzz ^3.0.0 (fuzzy string matching)
