# Validation-Gates Learning System - Product Requirement Plan

## Goal
Transform validation-gates from simple test runner to learning agent that builds mental models through documented patterns, enabling faster failure resolution and knowledge accumulation over time.

## Why
- **Current gap**: Agent runs tests but doesn't learn from failures - each bug feels "new"
- **Anthropic principle**: Validation = labeled data - each failure is training signal
- **Knowledge loss**: Patterns discovered during debugging aren't persisted
- **Context blindness**: Agent doesn't read project docs (PLANNING.md, PRPs) before testing
- **Impact**: 30-60min investment → faster future debugging, better mental models, educational value

## What
Lightweight improvements (markdown files, no new tools) enabling validation-gates to:
1. Read project documentation BEFORE running tests (understand WHY code exists)
2. Document test failure patterns in TEST-FAILURES.md (knowledge base)
3. Check known patterns before fixing (learn from history)
4. Report with business context (not just "398 tests passed")

### Success Criteria
- [ ] validation-gates reads PLANNING.md + STATUS.md + relevant PRP before testing
- [ ] TEST-FAILURES.md exists with 5-10 documented patterns
- [ ] Agent checks TEST-FAILURES.md when tests fail
- [ ] New patterns added after debugging
- [ ] STATUS.md includes learning context ("Pattern #2: Pydantic serialization applied")
- [ ] Future agents fix known issues 2-3x faster
- [ ] All existing tests pass
- [ ] Lint/type check passes

## Context & References

### Documentation (for agent reference)
```yaml
- url: https://www.anthropic.com/research/building-effective-agents
  why: Validation best practices - agents learn from clear error messages

- url: Internal - validation-gates.md
  why: Current agent workflow to enhance
```

### Codebase Patterns
```yaml
- file: ~/.claude/agents/validation-gates.md
  why: Current workflow (lines 1-625) - add Step 0 before testing

- file: PLANNING.md
  why: Architecture, current phase, constraints to understand

- file: STATUS.md
  why: Recent completions, what was just implemented

- file: PRPs/phase*.md
  why: Business requirements for features being tested
```

### Anthropic Research (Validation Context)
Key insights from Anthropic engineering:
- **Clear error messages = labeled data**: Each failure teaches agents what "correct" means
- **Project documentation critical**: Agents need WHY code exists, business constraints
- **Objective validation + actionable feedback**: Teaches agents mental models
- **Without context, can't learn**: Must read docs to understand codebase expectations

## Quick Reference (Context Package)

### TEST-FAILURES.md Template
```markdown
# Test Failure Patterns

*Knowledge base of recurring test issues and fixes. Update after debugging.*

## Pattern 1: Pydantic Model Serialization

**Error Pattern**:
```
TypeError: Object of type 'datetime' is not JSON serializable
```

**Root Cause**: Pydantic v2 models need explicit `.model_dump()` or `.model_dump_json()`

**Fix Applied**:
```python
# ❌ Before
return jsonify(model)

# ✅ After
return jsonify(model.model_dump())
```

**Frequency**: 3 occurrences (2026-01-05, 2026-01-06, 2026-01-07)

**Files Affected**: `backend/src/api/routes.py`, `backend/src/context/mentor.py`

**Pattern Learned**: Always use `.model_dump()` when serializing Pydantic models to JSON

---

## Pattern 2: React Hook Dependency Arrays

**Error Pattern**:
```
React Hook useEffect has a missing dependency: 'loadData'
```

**Root Cause**: ESLint exhaustive-deps rule requires all used variables in deps array

**Fix Applied**:
```typescript
// ✅ Option 1: Add to deps
useEffect(() => {
  loadData();
}, [loadData]);

// ✅ Option 2: Disable if intentional
useEffect(() => {
  loadData();
}, []); // eslint-disable-line react-hooks/exhaustive-deps
```

**Frequency**: 5 occurrences

**Pattern Learned**: Either add all deps or explicitly disable with comment explaining why

---

[Continue for 5-10 common patterns...]
```

### Enhanced validation-gates.md Steps

**Step 0: Read Project Context (NEW)**
```markdown
### Step 0: Read Project Context

**BEFORE running tests, understand the project:**

```bash
# Read current state
cat PLANNING.md              # Architecture, current phase
cat STATUS.md                # What was just implemented
```

**Extract:**
- What feature was just implemented?
- What are the success criteria from PRP?
- What constraints matter (tech stack, performance)?
- What phase are we in?

**Why**: Context helps interpret test failures correctly. E.g., "BriefingModal test failing" → check Phase 3.5 PRP for expected behavior.
```

**Step 0.5: Check Known Patterns (NEW)**
```markdown
### Step 0.5: Check Known Failure Patterns

**IF tests fail, check known patterns first:**

```bash
cat TEST-FAILURES.md | grep -A 10 "Error Pattern"
```

**Before debugging:**
1. Does error match known pattern?
2. If yes → apply documented fix
3. If no → proceed with debugging, document new pattern after

**Why**: Saves 10-20 min on known issues. Builds institutional knowledge.
```

**Step 3: Handle Failures (ENHANCED)**
```markdown
### Step 3: Handle Failures

**When tests fail:**

1. **Check TEST-FAILURES.md** for matching error pattern
2. **Read error messages carefully** (labeled data - what's wrong?)
3. **Use grep/search to find related code**
4. **Fix issues one at a time**
5. **Re-run failed tests after each fix**
6. **If new pattern discovered** → document in TEST-FAILURES.md:
   - Error pattern (exact message)
   - Root cause (why it happened)
   - Fix applied (code changes)
   - Pattern learned (rule for this codebase)

**Why**: Each failure = learning opportunity. Documenting patterns prevents future occurrences.
```

### STATUS.md Enhanced Reporting Template
```markdown
### [Date] [Time] - validation-gates
- ✅ All automated quality gates PASSED for [feature name]
- **Linting**: ✅ 0 errors
- **Type checking**: ✅ 0 errors
- **Tests**: ✅ [X] tests passed, [Y]% coverage
- **Retries**: 2 (Pattern #2: Pydantic serialization, Pattern #5: Missing hook deps)
- **New patterns**: 1 documented (Pattern #12: Tailwind purge config)
- **Build**: ✅ Production build successful
- **Security**: ✅ No vulnerabilities
- **Handoff to**: code-reviewer
- **Context**: Used known patterns to fix 2 issues in 5 min. Documented new Tailwind pattern for future.
```

### Decision Tree for Pattern Documentation
```
Test Fails:
  → Check TEST-FAILURES.md for exact error message
  → Match found?
      YES → Apply documented fix (1-2 min)
          → Tests pass?
              YES → Update pattern frequency count
              NO → Debug further, pattern may have evolved
      NO → Debug from scratch
          → Fix found?
              YES → Is this a recurring issue? (check git history)
                  YES → Document as new pattern in TEST-FAILURES.md
                  NO → One-off fix, no documentation needed

Pattern Documentation Criteria:
- Occurred 2+ times OR likely to recur
- Has clear error message signature
- Fix is repeatable/teachable
- Not environment-specific (e.g., not "Mac vs Linux")
```

## Current Codebase Structure
```bash
~/.claude/agents/
└── validation-gates.md       # Current agent (625 lines)

hp_game/
├── PLANNING.md               # Project architecture, phases
├── STATUS.md                 # Current state, completions
├── PRPs/
│   ├── phase3.5-briefing-system.md
│   ├── phase3.6-dialogue-briefing-ui.md
│   └── [other PRPs]
├── backend/
│   └── tests/                # 398 pytest tests
└── frontend/
    └── src/__tests__/        # 405 Vitest tests
```

## Desired Codebase Structure
```bash
~/.claude/agents/
└── validation-gates.md       # Enhanced (add Steps 0, 0.5, update 3)

hp_game/
├── TEST-FAILURES.md          # NEW - Pattern knowledge base
├── TESTING-CONVENTIONS.md    # OPTIONAL - Quick reference
├── PLANNING.md               # (unchanged)
├── STATUS.md                 # (unchanged)
└── PRPs/                     # (unchanged)
```

## Files to Create/Modify

| File | Action | Purpose | Dependencies |
|------|--------|---------|--------------|
| `~/.claude/agents/validation-gates.md` | MODIFY | Add Steps 0, 0.5; enhance Step 3 | None |
| `hp_game/TEST-FAILURES.md` | CREATE | Pattern knowledge base | None |
| `hp_game/TESTING-CONVENTIONS.md` | CREATE (OPTIONAL) | Quick reference from patterns | TEST-FAILURES.md |

## Tasks (ordered)

### Task 1: Create TEST-FAILURES.md Structure
**File**: `hp_game/TEST-FAILURES.md`
**Action**: CREATE
**Purpose**: Establish pattern documentation template
**Pattern**: Follow markdown template above (Pattern sections)
**Depends on**: None
**Acceptance criteria**:
- Template structure matches Quick Reference example
- Contains 2-3 starter patterns from current codebase
- Clear sections: Error Pattern, Root Cause, Fix Applied, Frequency, Pattern Learned

### Task 2: Enhance validation-gates Step 0 (Read Context)
**File**: `~/.claude/agents/validation-gates.md`
**Action**: MODIFY (add before Step 1)
**Purpose**: Agent reads project docs before testing
**Integration**: Insert before "Step 1: Initial Assessment" (current line ~111)
**Depends on**: None
**Acceptance criteria**:
- Step 0 documented with example commands
- Instructs reading PLANNING.md, STATUS.md
- Extracts: current feature, success criteria, constraints
- Explains WHY context matters

### Task 3: Enhance validation-gates Step 0.5 (Check Patterns)
**File**: `~/.claude/agents/validation-gates.md`
**Action**: MODIFY (add after Step 0)
**Purpose**: Agent checks known patterns on failure
**Integration**: Insert between Step 0 and Step 1
**Depends on**: Task 1 (TEST-FAILURES.md exists)
**Acceptance criteria**:
- Step 0.5 instructs checking TEST-FAILURES.md
- Grep command example provided
- Decision tree: match found → apply fix, no match → debug
- Explains time savings

### Task 4: Update validation-gates Step 3 (Document Patterns)
**File**: `~/.claude/agents/validation-gates.md`
**Action**: MODIFY (lines ~131-142)
**Purpose**: Add pattern documentation to failure handling
**Integration**: Enhance existing "Handle Failures" section
**Depends on**: Task 1 (TEST-FAILURES.md exists)
**Acceptance criteria**:
- Step 3 includes "document new patterns" instruction
- Template for what to document (error, cause, fix, learned)
- Criteria for when to document (2+ occurrences, teachable)

### Task 5: Seed TEST-FAILURES.md with 5-10 Patterns
**File**: `hp_game/TEST-FAILURES.md`
**Action**: MODIFY
**Purpose**: Populate with real patterns from hp_game history
**Pattern**: Review git history, test failures in STATUS.md
**Depends on**: Task 1 (template exists)
**Acceptance criteria**:
- 5-10 real patterns documented
- Sources: Pydantic serialization, React hooks, TypeScript errors, Tailwind purge
- Each pattern complete (error, cause, fix, frequency, learned)

### Task 6: Update STATUS.md Reporting Template
**File**: `~/.claude/agents/validation-gates.md`
**Action**: MODIFY (lines ~489-531)
**Purpose**: Add learning context to STATUS.md updates
**Integration**: Enhance "After Completion" section
**Depends on**: None
**Acceptance criteria**:
- STATUS.md template includes "Retries" field with pattern references
- Template includes "New patterns" field
- Example shows: "Pattern #2: Pydantic serialization applied"
- Explains educational value

### Task 7: Create TESTING-CONVENTIONS.md (OPTIONAL)
**File**: `hp_game/TESTING-CONVENTIONS.md`
**Action**: CREATE
**Purpose**: Quick reference extracted from patterns
**Pattern**: Auto-generate from TEST-FAILURES.md "Pattern Learned" sections
**Depends on**: Task 5 (patterns documented)
**Acceptance criteria**:
- Bulleted list of rules
- One-liner per pattern
- Example: "Always use .model_dump() for Pydantic JSON serialization"
- Links to TEST-FAILURES.md for details

### Task 8: Add "Learning Loop" to validation-gates Principles
**File**: `~/.claude/agents/validation-gates.md`
**Action**: MODIFY (lines ~351-363)
**Purpose**: Add learning principle to "Important Principles"
**Integration**: Add as principle #11
**Depends on**: None
**Acceptance criteria**:
- New principle: "Learn from Failures: Each test failure is a learning opportunity"
- Explains: Check patterns, apply fixes, document new patterns
- References TEST-FAILURES.md

## Integration Points

### Project Documentation
- **Where**: `PLANNING.md`, `STATUS.md`, `PRPs/*.md`
- **What**: validation-gates reads BEFORE testing
- **Pattern**: `cat PLANNING.md` to extract architecture, phase, constraints

### STATUS.md Updates
- **Where**: Lines ~489-531 in validation-gates.md
- **What**: Enhanced reporting with pattern references
- **Example**: "Retries: 2 (Pattern #2, Pattern #5)"

### Agent Workflow
- **Current**: Execute Validation → Handle Failures → Report
- **Enhanced**: **Read Context** → Execute Validation → **Check Patterns** → Handle Failures → **Document Patterns** → Report

## Known Gotchas

### Pattern Documentation
- **Issue**: Over-documenting one-off issues (noise)
- **Solution**: Criteria - 2+ occurrences OR high likelihood of recurrence

### Context Reading Overhead
- **Issue**: Reading docs adds 1-2 min per test run
- **Solution**: Only read on first run or when unclear about feature purpose

### Pattern Staleness
- **Issue**: Documented fixes become outdated as codebase evolves
- **Solution**: Add "Last Verified" date to patterns, review quarterly

## Validation Loop

### Level 1: Syntax & Style
```bash
# No changes to validation commands
# Context reading happens BEFORE these
cat PLANNING.md STATUS.md
rg "Pattern" TEST-FAILURES.md
uv run ruff check .
bun run lint
```

### Level 2: Agent Testing
- Test scenario: Introduce known failure (Pydantic serialization error)
- Expected: Agent checks TEST-FAILURES.md, applies documented fix
- Success: Fixed in 1-2 min without debugging

### Level 3: Pattern Accumulation
- After 2-3 weeks: TEST-FAILURES.md has 15-20 patterns
- Future failures: 50%+ match known patterns
- Time savings: 10-15 min per matched pattern

## Dependencies
- None (markdown files only, no new packages)

## Out of Scope
- AI-powered test selection tools (overkill for 802 tests)
- Test folder reorganization (vertical slice works)
- Speed optimization (tests run in 2-3s already)
- Automated pattern extraction (manual documentation fine)

## Agent Orchestration Plan

### Execution Strategy
**Sequential Track** (single agent, documentation work):
- documentation-manager → Modify validation-gates.md (Tasks 2-4, 6, 8)
- documentation-manager → Create TEST-FAILURES.md (Tasks 1, 5)
- documentation-manager → Create TESTING-CONVENTIONS.md (Task 7 - optional)

**No parallel execution** (all tasks edit overlapping files)

### Agent-Specific Guidance

#### For documentation-manager
- **Input**: All 8 tasks (documentation updates)
- **Pattern**: Follow validation-gates.md existing structure (Steps 1-5)
- **Context**: Use Quick Reference templates above
- **Output**: Enhanced validation-gates.md + TEST-FAILURES.md + (optional) TESTING-CONVENTIONS.md

### Handoff Context
**Next agent receives**:
- This PRP (full implementation plan)
- Quick Reference (templates for all files)
- Task list (8 tasks with acceptance criteria)
- Examples (STATUS.md reporting, pattern documentation)

**Next agent does NOT need**:
- ❌ Search for examples (all templates provided)
- ❌ Read validation-gates.md fully (specific line numbers given)
- ❌ Research pattern formats (template in Quick Reference)

## Anti-Patterns to Avoid
- ❌ Over-documenting one-off issues (creates noise)
- ❌ Vague pattern descriptions (must be actionable)
- ❌ Skipping context reading (defeats learning purpose)
- ❌ Not updating pattern frequency (loses signal)
- ❌ Creating new tools/automation (KISS - markdown sufficient)

---
Generated: 2026-01-07
Source: User request (Anthropic validation principles)
Research: Anthropic blog, current validation-gates.md
Confidence Score: 9/10 (simple markdown changes, proven pattern, clear value)

## Effort Estimates

| Task | Effort | Priority |
|------|--------|----------|
| Task 1: TEST-FAILURES.md template | 10 min | HIGH |
| Task 2: Step 0 (Read Context) | 15 min | HIGH |
| Task 3: Step 0.5 (Check Patterns) | 10 min | HIGH |
| Task 4: Step 3 enhancement | 10 min | MEDIUM |
| Task 5: Seed 5-10 patterns | 30 min | HIGH |
| Task 6: STATUS.md template | 10 min | MEDIUM |
| Task 7: TESTING-CONVENTIONS.md | 15 min | LOW (optional) |
| Task 8: Learning principle | 5 min | LOW |
| **Total (core)** | **1-1.5 hours** | |
| **Total (with optional)** | **1.5-2 hours** | |

## Expected Outcomes

**Immediate (Week 1)**:
- validation-gates reads project docs before testing
- 5-10 patterns documented in TEST-FAILURES.md
- Enhanced STATUS.md reporting includes learning context

**Short-term (Month 1)**:
- 15-20 patterns accumulated
- 40-50% of failures match known patterns
- 10-15 min time savings per matched pattern
- Future agents learn faster from documented knowledge

**Long-term (Month 3+)**:
- Comprehensive pattern library (30+ patterns)
- 60-70% of failures instantly recognized
- New developers/agents can reference conventions
- Institutional knowledge persists across sessions

## Educational Value

**For AI Agents**:
- Build mental models of codebase expectations
- Learn from labeled data (each failure = training signal)
- Pattern recognition improves over time
- Context-aware debugging (understand WHY, not just WHAT)

**For Human Developers**:
- Quick reference for common pitfalls
- Onboarding resource (learn project conventions)
- Debugging playbook (known issues + fixes)
- Educational tool (rationality through clear error interpretation)

---

**Philosophy**: Every test failure is a learning opportunity. Document it, learn from it, never repeat it.
