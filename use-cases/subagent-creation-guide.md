# Subagent Creation Guide

Quick reference for using the `subagent-creator` agent to design and build production-ready Claude Code subagents.

## Quick Start

```bash
# Invoke the agent
/task subagent-creator "Create an agent that [describes functionality]"

# Example
/task subagent-creator "Create an agent that generates API documentation from OpenAPI specs"
```

## When to Create a New Agent

Create a new agent when you need:

- **Specialized expertise** not covered by existing agents
- **Focused workflow** with clear inputs and outputs
- **Repeatable task** that benefits from automation
- **Context preservation** for multi-step processes
- **Clear boundaries** separating concerns from other agents

## Don't Create an Agent When:

- Task is simple one-liner (use direct tools instead)
- Functionality overlaps with existing agent
- Task is too broad or vague
- No clear deliverables or success criteria

## Agent Design Decision Tree

```
Is this task repetitive?
├─ No → Use direct tools
└─ Yes
    │
    Is there a clear input/output?
    ├─ No → Refine requirements first
    └─ Yes
        │
        Does an existing agent handle this?
        ├─ Yes → Use existing agent or extend it
        └─ No → CREATE NEW AGENT
```

## Model Selection Guide

### Use Haiku (90% of agents)
- File creation and CRUD operations
- Simple transformations (formatting, linting)
- Template generation
- Basic searches and filtering
- **Benefits**: 2x speed, 3x cost savings, 90% capability

### Use Sonnet (complex reasoning)
- Code analysis and review
- Planning and architecture
- Multi-agent orchestration
- Validation and testing
- **Benefits**: Better reasoning, moderate cost

### Use Opus (critical tasks)
- Security audits and decisions
- Production deployments
- Complex migrations
- Performance optimization
- **Benefits**: Highest capability, use sparingly

## Token Budget Guidelines

| Token Range | Agent Type | Example |
|-------------|------------|---------|
| 250-500 | Simple CRUD | config-manager, file-formatter |
| 500-800 | Standard Agent | code-reviewer, test-generator |
| 800-1,000 | Complex Agent | architect, orchestrator |
| 1,000+ | Too Heavy | Split into multiple agents |

**Official Claude Code Agents:**
- explore: 516 tokens
- plan: 633 tokens
- task: 294 tokens

## Tool Allowlist Reference

### Core Tools (Most Agents)
```yaml
tools: [Read, Write, Grep, Glob]
```

### Add Bash (Command Execution)
```yaml
tools: [Read, Write, Grep, Glob, Bash]
```
Use when: Installing packages, running tests, executing builds

### Add WebSearch (Current Information)
```yaml
tools: [Read, Write, Grep, Glob, WebSearch]
```
Use when: Researching documentation, finding up-to-date info

### Add Task (Orchestration)
```yaml
tools: [Task, Read, Write, TodoWrite]
```
Use when: Coordinating multiple agents in workflow

### Add MCP Tools (Specialized)
```yaml
# Code navigation
tools: [Read, Write, mcp__serena__read_memory, mcp__serena__find_symbol]

# Library documentation
tools: [Read, Write, mcp__context7__get-library-docs]
```

## Common Agent Patterns

### Pattern 1: Generator Agent
**Purpose**: Creates files from templates or specifications

**Example**: schema-generator, boilerplate-creator, migration-generator

**Structure**:
```yaml
tools: [Read, Write, Grep, Glob]
model: haiku
```

**Workflow**:
1. Read specification or template
2. Generate content
3. Write to output file
4. Validate syntax

---

### Pattern 2: Analyzer Agent
**Purpose**: Reviews code/files and provides feedback

**Example**: code-reviewer, security-auditor, performance-analyzer

**Structure**:
```yaml
tools: [Read, Grep, Glob, mcp__serena__get_symbols_overview]
model: sonnet
```

**Workflow**:
1. Scan files for issues
2. Analyze patterns
3. Generate report with recommendations
4. Prioritize findings

---

### Pattern 3: Orchestrator Agent
**Purpose**: Coordinates multiple agents in sequence

**Example**: feature-builder, release-manager, migration-orchestrator

**Structure**:
```yaml
tools: [Task, Read, Write, TodoWrite]
model: sonnet
```

**Workflow**:
1. Break down task into phases
2. Invoke agents in sequence
3. Validate each handoff
4. Track overall progress

---

### Pattern 4: Transformer Agent
**Purpose**: Converts files from one format to another

**Example**: openapi-to-typescript, markdown-to-html, sql-to-orm

**Structure**:
```yaml
tools: [Read, Write]
model: haiku
```

**Workflow**:
1. Read source file
2. Parse and transform
3. Write target format
4. Validate output

---

## Example Agent Requests

### Good Agent Requests (Clear & Focused)

```bash
# ✅ Generator with clear scope
/task subagent-creator "Create an agent that generates TypeScript types from JSON schemas"

# ✅ Analyzer with specific domain
/task subagent-creator "Create an agent that audits Python code for security vulnerabilities"

# ✅ Orchestrator with defined workflow
/task subagent-creator "Create an agent that coordinates database migrations from planning to execution"

# ✅ Transformer with clear I/O
/task subagent-creator "Create an agent that converts Markdown documentation to interactive HTML"
```

### Poor Agent Requests (Too Vague)

```bash
# ❌ Too broad
/task subagent-creator "Create an agent that helps with coding"

# ❌ Unclear deliverables
/task subagent-creator "Create an agent that improves code quality"

# ❌ No clear boundaries
/task subagent-creator "Create an agent that does testing and deployment"

# ❌ Overlaps with existing
/task subagent-creator "Create an agent that writes tests"
# (validation-gates already handles this)
```

## Three-Part Formula Checklist

Every agent should follow this structure:

### Part 1: YAML Frontmatter ✅
- [ ] Name is kebab-case (e.g., "api-doc-generator")
- [ ] Description is third person with "Use PROACTIVELY when"
- [ ] Tools are minimal security-first allowlist
- [ ] Model explicitly selected (haiku/sonnet/opus)
- [ ] Hooks provide next steps
- [ ] Color assigned (blue, green, yellow, orange, purple, red, pink, cyan)

### Part 2: Role Definition ✅
- [ ] Clear expertise and philosophy statement
- [ ] Primary objective (1-2 sentences)
- [ ] Core principles (3-5 key guidelines)
- [ ] Boundaries: YOU DO vs DON'T DO

### Part 3: Workflow & Examples ✅
- [ ] Step-by-step workflow with phases
- [ ] Concrete code examples (copy-pasteable)
- [ ] Decision trees for edge cases
- [ ] Handoff protocol to next agent
- [ ] Deliverables checklist

## Validation Checklist

Before deploying an agent, verify:

### Structure ✅
- [ ] YAML frontmatter is valid
- [ ] All required fields present (name, description, tools, model)
- [ ] Hooks configured for SubagentStop/Stop

### Content ✅
- [ ] Third person throughout description
- [ ] No aggressive language ("CRITICAL", "MUST")
- [ ] Clear role and single responsibility
- [ ] Boundaries prevent overlap
- [ ] Workflow has concrete examples

### Quality ✅
- [ ] Token count <1,000 (ideally 500-800)
- [ ] Claude 4.5 compatible
- [ ] Valid markdown syntax
- [ ] Grammar and spelling correct

### Integration ✅
- [ ] Fits into agent ecosystem
- [ ] No duplicate responsibilities
- [ ] References CLAUDE.md conventions
- [ ] Clear trigger conditions

### Testing ✅
- [ ] Smoke test provided
- [ ] Edge cases documented
- [ ] Success criteria defined
- [ ] Integration examples included

## Optimization Techniques

If your agent exceeds 1,000 tokens:

### 1. Remove Redundancy
- Eliminate repeated concepts
- Consolidate similar guidelines
- Remove obvious behaviors

### 2. Condense Examples
- Keep 1-2 best examples
- Use inline code instead of blocks where possible
- Reference documentation instead of duplicating

### 3. Use Bullet Points
- Convert paragraphs to lists
- Use decision trees for conditionals
- Shorten descriptions

### 4. Reference CLAUDE.md
- Link to project conventions instead of repeating
- Trust agent to follow existing patterns
- Focus on agent-specific behavior

### 5. Split if Necessary
- If still >1,000 tokens, split into two focused agents
- Example: "api-doc-generator" + "api-doc-validator"

## Common Mistakes to Avoid

### 1. Over-Specification ❌
```markdown
# ❌ Too prescriptive
Always check if the file exists, then read it line by line,
ensuring each line is properly formatted with correct indentation,
and validate that all variables are defined...
```

```markdown
# ✅ Trust the model
Read the file and validate syntax.
```

### 2. Aggressive Language ❌
```markdown
# ❌ Claude 4.5 doesn't need this
CRITICAL: You MUST always validate input!
NEVER proceed without checking!
```

```markdown
# ✅ Clear and direct
Use PROACTIVELY to validate input before processing.
```

### 3. Vague Boundaries ❌
```markdown
# ❌ Unclear
You handle testing-related tasks.
```

```markdown
# ✅ Specific
## Boundaries

### ✅ YOU DO
- Generate unit tests from source code
- Create test fixtures
- Write integration test scaffolds

### ❌ YOU DON'T DO
- Run tests (validation-gates handles this)
- Fix failing tests (implementer handles this)
- Configure test runners (dependency-manager handles this)
```

### 4. Missing Examples ❌
```markdown
# ❌ Abstract
Analyze the code for issues and report them.
```

```markdown
# ✅ Concrete
Analyze the code for issues and report them.

Example output:
\`\`\`markdown
## Security Issues
- Line 42: SQL injection vulnerability in user_query()
  Fix: Use parameterized queries

## Performance
- Line 103: N+1 query in get_users()
  Fix: Use eager loading
\`\`\`
```

## After Agent Creation

The subagent-creator will provide:

1. **Agent file** at `~/.claude/agents/[name].md`
2. **CLAUDE.md entry** to add to documentation
3. **Testing guide** with smoke tests and edge cases
4. **Integration examples** showing usage in workflows

## Testing Your New Agent

### Smoke Test
```bash
# Basic functionality test
/task [agent-name] "[simple test request]"
```

### Integration Test
```bash
# Test with other agents
/task planner "Create requirements for X"
/task [your-new-agent] "Process INITIAL.md"
```

### Edge Case Testing
- Missing dependencies
- Invalid input
- Boundary violations (what it should refuse)
- Handoffs to next agent

### Success Criteria
- ✅ Completes task without errors
- ✅ Produces expected deliverables
- ✅ Stays within role boundaries
- ✅ Provides clear status updates
- ✅ Hooks fire correctly

## Resources

### Official Documentation
- Claude Code: https://docs.anthropic.com/claude-code
- Claude 4.5 System Prompts: https://docs.anthropic.com/system-prompts

### Community Resources
- awesome-claude-code-subagents: https://github.com/search?q=awesome-claude-code-subagents
- Piebald-AI Analysis: Official Claude Code architecture insights
- ClaudeLog: Real-world agent patterns

### Project Files
- Agent directory: `~/.claude/agents/`
- Project conventions: `/Users/danielmedina/Documents/claude_projects/hp_game/CLAUDE.md`
- This guide: `/Users/danielmedina/Documents/claude_projects/hp_game/use-cases/subagent-creation-guide.md`

---

**Quick Tip**: Start simple! A focused 500-token agent that does one thing well beats a 2,000-token agent that tries to do everything.
