# Phase 3.8: Enhanced Moody Context + Documentation Updates - Product Requirement Plan

## Goal
Give Moody detailed case context + rationality principles for natural dialogue in:
1. Briefing Q&A (already has basic case facts)
2. Verdict feedback Q&A (needs case context)

**End State**: Moody can answer investigation questions naturally using:
- Witness personalities/backgrounds (NOT secrets/lies)
- Suspect list (NOT revealing culprit)
- Location descriptions
- Non-spoiler case overview
- Condensed rationality guide (200-300 lines)

## Why
- **Current Issue**: Moody's Q&A lacks case context. If player asks "Who are the suspects?" Moody can't answer naturally.
- **User Impact**: More natural investigation flow. Player can ask "What do we know about Draco?" and get useful context.
- **Educational Value**: Rationality guide gives Moody framework for teaching without repeating concepts.

## What
### Success Criteria
- [x] YAML `briefing_context:` section added to case_001.yaml
- [x] `witnesses:[]` list (name, personality, background - NO secrets/lies)
- [x] `suspects:[]` list (potential suspects - NO culprit reveal)
- [x] `location:` description
- [x] `case_overview:` non-spoiler summary
- [x] Condensed rationality guide created (200-300 lines)
- [x] `briefing.py` prompt updated to inject context
- [x] `mentor.py` feedback prompt updated to inject context
- [x] Moody answers "Who are the suspects?" naturally
- [x] Moody answers "Tell me about Hermione" with background, NOT secrets
- [x] All tests pass
- [x] Lint/type check passes

## Context & References

### Documentation (URLs for reference)
```yaml
- url: /backend/src/case_store/case_001.yaml
  why: Current YAML structure, witnesses section

- url: /backend/src/context/briefing.py
  why: build_moody_briefing_prompt function to update

- url: /backend/src/context/mentor.py
  why: Mentor feedback prompt (may need context injection)

- url: /docs/rationality-thinking-guide.md
  why: 632 lines to condense into 200-300 lines
```

### Codebase Patterns (files to study)
```yaml
- file: backend/src/case_store/case_001.yaml
  why: YAML structure for new briefing_context section
  symbol: witnesses, briefing sections

- file: backend/src/context/briefing.py
  why: Prompt building pattern
  symbol: build_moody_briefing_prompt

- file: backend/src/context/mentor.py
  why: LLM prompt pattern with context injection
  symbol: build_moody_roast_prompt, build_moody_praise_prompt
```

## Quick Reference (Context Package)

### YAML briefing_context Structure
```yaml
# Add to case_001.yaml AFTER briefing: section
briefing_context:
  witnesses:
    - name: "Hermione Granger"
      personality: "Brilliant third-year. Values truth and logic. Nervous when hiding something."
      background: "Top student, best friends with Harry and Ron. Was in library that night."
      # NOTE: NO secrets or lies here - keep non-spoiler

    - name: "Draco Malfoy"
      personality: "Arrogant Slytherin. Quick to deflect blame. Defensive when accused."
      background: "Son of Lucius Malfoy. Skilled at freezing charms. Seen near library."
      # NOTE: NO mention of guilt, just observable facts

  suspects:
    - "Hermione Granger"
    - "Draco Malfoy"
    # NOTE: List potential suspects, NOT revealing who's actually guilty

  location: "Hogwarts Library - small enclosed space with frost-covered window, oak desk, dark arts books on shelves"

  case_overview: "Third-year student found petrified near library window at 9:15pm. Witnesses present. Frost pattern on window suggests magical attack. Investigation required."
```

### Prompt Injection Pattern (from mentor.py)
```python
# In build_moody_briefing_prompt():
def build_moody_briefing_prompt(
    question: str,
    case_assignment: str,
    teaching_moment: str,
    rationality_concept: str,
    concept_description: str,
    conversation_history: list[dict[str, str]],
    briefing_context: dict[str, Any],  # NEW parameter
    rationality_guide: str,  # NEW parameter (condensed guide)
) -> str:
    # Extract context
    witnesses = briefing_context.get("witnesses", [])
    suspects = briefing_context.get("suspects", [])
    location = briefing_context.get("location", "")
    case_overview = briefing_context.get("case_overview", "")

    # Build witness summary (non-spoiler)
    witness_summary = "\n".join([
        f"- {w['name']}: {w['personality']} Background: {w['background']}"
        for w in witnesses
    ])

    # Inject into prompt
    return f"""You are Alastor "Mad-Eye" Moody, veteran Auror trainer.

CASE CONTEXT (for answering questions - DO NOT reveal culprit):
Location: {location}
Overview: {case_overview}

Witnesses:
{witness_summary}

Potential Suspects: {', '.join(suspects)}

RATIONALITY PRINCIPLES (for teaching):
{rationality_guide}

CURRENT QUESTION: "{question}"

RESPONSE GUIDELINES:
- If asked about witness: Use personality/background info, NOT secrets
- If asked about suspects: List potential suspects, DO NOT reveal culprit
- If asked about rationality: Use concepts from guide above
- 2-4 sentences MAX, Moody's gruff voice
- Natural integration of context - NO bullet points to player

...
"""
```

### Rationality Guide Condensing Pattern
```markdown
# Target: 200-300 lines (from 632)

## Structure:
# [Concept Name]
[2-3 sentence explanation]
Example: [1 concrete example, 1-2 sentences]

---

# Base Rates
Start with what's LIKELY before examining specifics. 85% of incidents are accidents - begin there.
Example: DNA matches 1 in million. In city of 1 million, there's 1 other match. Base rate says 50% chance before other evidence.

# Confirmation Bias
Focusing only on evidence supporting your theory while ignoring contradictions.
Example: Suspect was present, so you ignore frost pattern showing spell came from outside. Presence ≠ guilt.

# Correlation vs Causation
Two events happening together doesn't mean one caused the other.
Example: Rooster crows at sunrise. Rooster doesn't cause sun to rise.

...
```

## Current Codebase Structure
```bash
backend/
├── src/
│   ├── case_store/
│   │   └── case_001.yaml  # MODIFY: Add briefing_context section
│   ├── context/
│   │   ├── briefing.py    # MODIFY: Inject context into prompt
│   │   └── mentor.py      # MODIFY: Inject context into feedback prompt (optional)
│   └── api/
│       └── routes.py      # READ: Understand how case_store loaded
docs/
├── rationality-thinking-guide.md  # READ: 632 lines to condense
└── rationality-thinking-guide-condensed.md  # CREATE: 200-300 lines
```

## Files to Create/Modify

| File | Action | Purpose | Dependencies |
|------|--------|---------|--------------|
| `docs/rationality-thinking-guide-condensed.md` | CREATE | Prompt-ready rationality reference (200-300 lines) | None |
| `backend/src/case_store/case_001.yaml` | MODIFY | Add `briefing_context:` section | None |
| `backend/src/context/briefing.py` | MODIFY | Inject context + guide into prompt | case_001.yaml |
| `backend/src/context/mentor.py` | MODIFY | Inject context into feedback (optional) | case_001.yaml |
| `backend/tests/test_briefing.py` | MODIFY | Update tests for new params | briefing.py |
| `docs/AUROR_ACADEMY_GAME_DESIGN.md` | MODIFY | Update briefing system docs | None |
| `docs/CASE_DESIGN_GUIDE.md` | MODIFY | Add YAML structure reference | None |

## Tasks (ordered)

### Task 1: Condense Rationality Guide
**File**: `docs/rationality-thinking-guide-condensed.md`
**Action**: CREATE
**Purpose**: Scannable 200-300 line reference for LLM prompt injection
**Pattern**: Extract core concepts, keep 1 example each
**Depends on**: None
**Acceptance criteria**:
- 200-300 lines total
- 15-20 key concepts (base rates, confirmation bias, correlation vs causation, etc.)
- 2-3 sentence explanation per concept
- 1 concrete example per concept (1-2 sentences)
- Structured for easy prompt injection
- Preserves accuracy from original guide

### Task 2: Add briefing_context to case_001.yaml
**File**: `backend/src/case_store/case_001.yaml`
**Action**: MODIFY
**Purpose**: Provide case context for Moody's Q&A
**Pattern**: Add new top-level section after `briefing:`
**Depends on**: None
**Acceptance criteria**:
- `briefing_context:` section added
- `witnesses:[]` with name, personality, background (2 witnesses)
- `suspects:[]` list (2 names)
- `location:` description (1 sentence)
- `case_overview:` non-spoiler summary (2 sentences)
- NO secrets, NO lies, NO culprit reveal
- YAML syntax valid

### Task 3: Update briefing.py Prompt
**File**: `backend/src/context/briefing.py`
**Action**: MODIFY
**Purpose**: Inject case context + rationality guide into Moody's Q&A prompt
**Pattern**: Add parameters to `build_moody_briefing_prompt`
**Depends on**: Task 1, Task 2
**Acceptance criteria**:
- `build_moody_briefing_prompt` accepts `briefing_context: dict` param
- `build_moody_briefing_prompt` accepts `rationality_guide: str` param
- Prompt includes witness summary (non-spoiler)
- Prompt includes suspect list
- Prompt includes location + case overview
- Prompt includes rationality guide text
- Instructions: "DO NOT reveal culprit"
- Instructions: "Use context naturally, no bullet points"
- Function signature updated

### Task 4: Update routes.py to Load Context
**File**: `backend/src/api/routes.py`
**Action**: MODIFY
**Purpose**: Load briefing_context from YAML and pass to prompt builder
**Pattern**: Follow existing case loading pattern
**Depends on**: Task 2, Task 3
**Acceptance criteria**:
- `POST /api/briefing/{case_id}/question` endpoint loads `briefing_context` from case YAML
- Loads condensed rationality guide from file (cache it)
- Passes both to `build_moody_briefing_prompt`
- Handles missing `briefing_context` gracefully (empty dict)

### Task 5: Update mentor.py Feedback Prompt (Optional)
**File**: `backend/src/context/mentor.py`
**Action**: MODIFY
**Purpose**: Add case context to verdict feedback Q&A (if future feature)
**Pattern**: Same as Task 3
**Depends on**: Task 2
**Acceptance criteria**:
- **SKIP FOR NOW** - Future enhancement when feedback Q&A added
- Document placeholder in comments

### Task 6: Update Tests
**File**: `backend/tests/test_briefing.py`
**Action**: MODIFY
**Purpose**: Tests pass with new prompt params
**Pattern**: Add mock briefing_context + rationality_guide
**Depends on**: Task 3, Task 4
**Acceptance criteria**:
- All existing tests updated for new function signature
- New test: "includes witness summary in prompt"
- New test: "includes suspect list in prompt"
- New test: "includes rationality guide in prompt"
- New test: "handles missing briefing_context"
- 5 new tests, all passing

### Task 7: Manual Testing
**Action**: Manual verification
**Purpose**: Verify Moody answers naturally
**Depends on**: All previous tasks
**Acceptance criteria**:
- Start briefing, complete teaching question
- Ask: "Who are the suspects?" → Moody lists Hermione and Draco
- Ask: "Tell me about Hermione" → Moody gives personality + background, NO secrets
- Ask: "What is base rates?" → Moody explains using rationality guide
- Responses feel natural (no bullet points, no "Here's the context:")

### Task 8: Update AUROR_ACADEMY_GAME_DESIGN.md
**File**: `docs/AUROR_ACADEMY_GAME_DESIGN.md`
**Action**: MODIFY
**Purpose**: Document Phase 3.8 implementation
**Pattern**: Update "Intro Briefing System" section
**Depends on**: None (parallel track)
**Acceptance criteria**:
- "Intro Briefing System" section updated with Phase 3.8 features
- Mentions case context injection
- Mentions rationality guide condensing
- Examples of Q&A with context

### Task 9: Update CASE_DESIGN_GUIDE.md
**File**: `docs/CASE_DESIGN_GUIDE.md`
**Action**: MODIFY
**Purpose**: Add briefing_context YAML reference for future case designers
**Pattern**: Add example to module templates
**Depends on**: None (parallel track)
**Acceptance criteria**:
- New section: "Briefing Context Module"
- YAML structure documented with full example
- Field descriptions (witnesses, suspects, location, case_overview)
- Warning: "NO secrets, NO lies, NO culprit reveal"
- Copy-paste ready template

## Integration Points

### Case Loading (routes.py)
- **Where**: `POST /api/briefing/{case_id}/question` endpoint
- **What**: Load `briefing_context` from case YAML
- **Pattern**: Same as loading `briefing` section
- **Data Flow**: YAML → dict → prompt builder

### Prompt Building (briefing.py)
- **Where**: `build_moody_briefing_prompt` function
- **What**: Inject witness/suspect/location context
- **Format**: Natural text, NOT bullet points
- **Instruction**: "DO NOT reveal culprit"

### Rationality Guide Loading
- **Where**: routes.py module level or lazy load
- **What**: Read `docs/rationality-thinking-guide-condensed.md` once, cache
- **Pattern**: Global variable or function with `@lru_cache`

## Known Gotchas

### Context Injection
- **Issue**: LLM might cite context explicitly ("According to briefing_context...")
- **Solution**: Instruction in prompt: "Use context naturally, no bullet points to player"

### Culprit Revelation
- **Issue**: If Draco is in suspect list, LLM might infer he's guilty
- **Solution**: Instruction: "List ALL potential suspects, DO NOT reveal who's actually guilty"

### Rationality Guide Size
- **Issue**: 200-300 lines still large for token budget
- **Solution**: Only inject when player asks rationality question (detect keywords)

### Test Fixtures
- **Issue**: All tests need mock briefing_context
- **Solution**: Create fixture in conftest.py with sample context

## Validation Loop

### Level 1: Syntax & Style
```bash
cd backend
uv run ruff check .
uv run ruff format .
uv run mypy src/
# Expected: No errors in modified files
```

### Level 2: Unit Tests
- Test file: `backend/tests/test_briefing.py`
- Coverage target: 90%+
- Scenarios:
  - Prompt includes witness summary
  - Prompt includes suspect list
  - Prompt includes rationality guide
  - Handles missing briefing_context
  - Natural language instruction present

### Level 3: Integration/Manual
```bash
# Start backend
cd backend && uv run python -m src.main

# Start frontend
cd frontend && bun run dev

# Manual steps:
# 1. Start investigation
# 2. Complete briefing teaching question
# 3. Ask: "Who are the suspects?"
#    → Expected: "Hermione Granger and Draco Malfoy. Both were present or nearby..."
# 4. Ask: "Tell me about Hermione"
#    → Expected: "Granger? Brilliant third-year, top student. Was in library that night..."
# 5. Ask: "What are base rates?"
#    → Expected: Natural explanation using condensed guide
```

## Dependencies
- No new dependencies (uses existing Claude Haiku client)

## Out of Scope
- **Verdict feedback Q&A**: Defer to future phase (mentor.py update)
- **Dynamic context generation**: Static YAML only for Phase 3.8
- **Multiple cases**: Only case_001.yaml updated
- **Frontend changes**: No UI changes needed (backend only)

## Agent Orchestration Plan

### Execution Strategy
**Sequential Track** (backend-only feature):
1. planner → Create PRP + update docs (Tasks 8-9 parallel)
2. fastapi-specialist → Condense guide (Task 1) → YAML update (Task 2) → Prompt updates (Tasks 3-4) → Tests (Task 6)
3. validation-gates → Run tests + manual verification (Task 7)
4. documentation-manager → Update docs (if not done in parallel)

### Agent-Specific Guidance

#### For fastapi-specialist
- **Input**: Tasks 1-6 (sequential)
- **Pattern**: Follow briefing.py existing prompt pattern
- **Output**: Natural Q&A with case context
- **Critical**: Test "Who are suspects?" and "Tell me about [witness]"

#### For validation-gates
- **Input**: Task 7 (manual testing)
- **Success**: Moody answers naturally without exposing secrets/culprit
- **Verification**: Ask 3 test questions in briefing Q&A

### Handoff Context
**Next agent receives**:
- This PRP (full context)
- Condensed rationality guide (Task 1 output)
- YAML structure example
- Prompt injection pattern

**Next agent does NOT need**:
- ❌ Read full 632-line rationality guide (use condensed version)
- ❌ Understand verdict feedback system (out of scope)
- ❌ Modify frontend (backend only)

## Anti-Patterns to Avoid
- ❌ Including secrets/lies in briefing_context (spoils investigation)
- ❌ Revealing culprit in suspect list context
- ❌ Making rationality guide > 300 lines (defeats purpose)
- ❌ LLM citing context explicitly ("According to case_overview...")
- ❌ Bullet points in Moody's responses (breaks immersion)

---
Generated: 2026-01-07
Effort: 1-1.5 days
Confidence Score: 8/10 (straightforward YAML + prompt injection, proven pattern)
