# HP Game Backend

FastAPI backend with Claude LLM narrator for Harry Potter investigation game.

**Phase 1 Status**: COMPLETE (2026-01-05)
- 93 pytest tests passing (0.50s execution)
- All quality gates passing (ruff, mypy, coverage)
- Model: claude-3-5-haiku-20241022

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
├── context/          # LLM context builders (narrator, witness, mentor)
├── api/              # FastAPI routes + Claude client
└── state/            # Player state + persistence
```

See `PLANNING.md` (root) for full architecture.
