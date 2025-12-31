# Subagent Creator Workflow

Visual guide showing the complete process of creating a new Claude Code agent.

## Complete Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUBAGENT CREATION WORKFLOW                    │
└─────────────────────────────────────────────────────────────────┘

USER REQUEST
    │
    ├─ "I need an agent that [functionality]"
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 1: DISCOVERY & RESEARCH (subagent-creator)                │
└─────────────────────────────────────────────────────────────────┘
    │
    ├─► 🔍 Clarify Requirements
    │   ├─ What problem does it solve?
    │   ├─ What triggers its use?
    │   ├─ What are the boundaries?
    │   ├─ What deliverables?
    │   └─ How does it fit ecosystem?
    │
    ├─► 🌐 Research Best Practices
    │   ├─ Search Anthropic docs
    │   ├─ Search community patterns
    │   ├─ Analyze similar agents
    │   └─ Review Piebald-AI insights
    │
    ├─► 📊 Analyze Existing Agents
    │   ├─ Read from ~/.claude/agents/
    │   ├─ Identify successful patterns
    │   ├─ Note token budgets
    │   └─ Ensure no overlap
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 2: DESIGN & VALIDATION                                     │
└─────────────────────────────────────────────────────────────────┘
    │
    ├─► 🏗️ Design Architecture
    │   ├─ Name (kebab-case)
    │   ├─ Description (third person)
    │   ├─ Color selection
    │   ├─ Model selection:
    │   │   ├─ haiku (90% of agents)
    │   │   ├─ sonnet (complex reasoning)
    │   │   └─ opus (critical tasks)
    │   ├─ Tool allowlist (minimal)
    │   └─ Token budget (<1,000)
    │
    ├─► ✅ Validate Design
    │   ├─ Single responsibility?
    │   ├─ Clear boundaries?
    │   ├─ No overlap?
    │   ├─ Third person?
    │   ├─ Claude 4.5 compatible?
    │   └─ Token count OK?
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 3: GENERATION & REFINEMENT                                │
└─────────────────────────────────────────────────────────────────┘
    │
    ├─► 📝 Generate Agent Prompt
    │   │
    │   ├─ Part 1: YAML Frontmatter
    │   │   ├─ name
    │   │   ├─ description
    │   │   ├─ tools
    │   │   ├─ model
    │   │   ├─ color
    │   │   └─ hooks
    │   │
    │   ├─ Part 2: Role Definition
    │   │   ├─ Expertise & philosophy
    │   │   ├─ Primary objective
    │   │   ├─ Core principles
    │   │   └─ Boundaries (YOU DO vs DON'T DO)
    │   │
    │   └─ Part 3: Workflow & Examples
    │       ├─ Step-by-step phases
    │       ├─ Concrete code examples
    │       ├─ Decision trees
    │       ├─ Handoff protocol
    │       └─ Deliverables checklist
    │
    ├─► 🎯 Optimize Tokens
    │   ├─ Target: 500-800 tokens
    │   ├─ Remove redundancy
    │   ├─ Condense examples
    │   ├─ Use bullet points
    │   └─ Reference CLAUDE.md
    │
    ├─► 🔍 Quality Review
    │   ├─ Frontmatter valid?
    │   ├─ Third person throughout?
    │   ├─ No aggressive language?
    │   ├─ Clear examples?
    │   └─ <1,000 tokens?
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 4: DOCUMENTATION & TESTING                                │
└─────────────────────────────────────────────────────────────────┘
    │
    ├─► 💾 Create Agent File
    │   └─ Save to ~/.claude/agents/[name].md
    │
    ├─► 📚 Document in CLAUDE.md
    │   ├─ Add to "Available Agents" section
    │   ├─ Include purpose and triggers
    │   ├─ Provide usage examples
    │   └─ List key features
    │
    ├─► 🧪 Generate Testing Guide
    │   ├─ Smoke test commands
    │   ├─ Integration test scenarios
    │   ├─ Edge case handling
    │   └─ Success criteria
    │
    ├─► 🔗 Create Integration Examples
    │   ├─ Standalone usage
    │   ├─ Sequential orchestration
    │   ├─ Parallel execution
    │   └─ Workflow patterns
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DELIVERABLES COMPLETE                         │
└─────────────────────────────────────────────────────────────────┘
    │
    ├─► 1. Agent file at ~/.claude/agents/[name].md
    ├─► 2. CLAUDE.md entry snippet
    ├─► 3. Testing guide with examples
    └─► 4. Integration workflow examples
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ USER TESTING & ITERATION                                         │
└─────────────────────────────────────────────────────────────────┘
    │
    ├─► 🚀 Run Smoke Test
    │   └─ /task [agent-name] "[simple request]"
    │
    ├─► 🔗 Test Integration
    │   └─ Use with other agents in workflow
    │
    ├─► 🐛 Test Edge Cases
    │   ├─ Missing dependencies
    │   ├─ Invalid input
    │   ├─ Boundary violations
    │   └─ Handoff scenarios
    │
    ├─► 📊 Validate Success
    │   ├─ Completes without errors?
    │   ├─ Produces deliverables?
    │   ├─ Stays in boundaries?
    │   ├─ Clear status updates?
    │   └─ Hooks fire correctly?
    │
    ├─► ✅ Production Ready!
    │
    └─► ♻️ Iterate if needed
        └─ Refine based on real usage
```

## Decision Trees

### When to Create a New Agent?

```
                    ┌─────────────────────┐
                    │  Task Description   │
                    └──────────┬──────────┘
                               │
                    Is it repetitive?
                               │
                    ┌──────────┴──────────┐
                    │                     │
                   No                    Yes
                    │                     │
          Use Direct Tools    Does it have clear I/O?
                               │
                    ┌──────────┴──────────┐
                    │                     │
                   No                    Yes
                    │                     │
           Refine Requirements   Existing agent?
                                  │
                       ┌──────────┴──────────┐
                       │                     │
                      Yes                   No
                       │                     │
              Use/Extend Existing    CREATE NEW AGENT!
```

### Model Selection Decision Tree

```
                    ┌─────────────────────┐
                    │   Agent Purpose     │
                    └──────────┬──────────┘
                               │
                      Complexity Level?
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
    SIMPLE                MODERATE               COMPLEX
        │                      │                      │
        ├─ File CRUD          ├─ Code analysis       ├─ Security audits
        ├─ Formatting         ├─ Planning            ├─ Deployments
        ├─ Templates          ├─ Orchestration       ├─ Migrations
        ├─ Searches           ├─ Validation          ├─ Optimization
        │                      │                      │
        ▼                      ▼                      ▼
    ┌───────┐              ┌───────┐              ┌───────┐
    │ HAIKU │              │SONNET │              │ OPUS  │
    └───────┘              └───────┘              └───────┘
    2x speed               Balanced               Highest
    3x cheaper            capability             capability
    90% power
```

### Tool Selection Decision Tree

```
                    ┌─────────────────────┐
                    │   Agent Function    │
                    └──────────┬──────────┘
                               │
              What does it need to do?
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
    Read/Write            Execute Code          Orchestrate
    Files                     │                      │
        │                     │                      │
        ▼                     ▼                      ▼
  [Read, Write]    [Read, Write, Bash]    [Task, TodoWrite]
  [Grep, Glob]
        │
        │
   Need current
    web info?
        │
    ┌───┴───┐
   Yes     No
    │       │
    ▼       │
[+WebSearch]│
            │
   Need code│
  navigation?
        │
    ┌───┴───┐
   Yes     No
    │       │
    ▼       │
[+serena]   │
            │
   Need lib │
    docs?   │
        │
    ┌───┴───┐
   Yes     No
    │       │
    ▼       ▼
[+context7] DONE
```

## Example Agent Creation Session

```
USER:
"I need an agent that generates TypeScript interfaces from JSON schemas"

SUBAGENT-CREATOR:
🔍 Phase 1: Discovery
✅ Problem: Convert JSON Schema to TypeScript types
✅ Trigger: When working with API schemas or data models
✅ Boundaries: Only generation, not validation
✅ Deliverables: .ts files with interfaces

🌐 Researching best practices...
✅ Found JSON Schema to TS patterns
✅ Analyzed similar generator agents
✅ No overlap with existing agents

🏗️ Phase 2: Design
✅ Name: json-schema-to-ts
✅ Description: "JSON Schema to TypeScript interface generator. Use PROACTIVELY..."
✅ Model: haiku (simple transformation)
✅ Tools: [Read, Write, Bash] (for validation)
✅ Token estimate: 650 tokens

📝 Phase 3: Generation
✅ Created YAML frontmatter
✅ Defined role and boundaries
✅ Added workflow with examples
✅ Included handoff protocol

📚 Phase 4: Documentation
✅ Agent file: ~/.claude/agents/json-schema-to-ts.md
✅ CLAUDE.md entry prepared
✅ Testing guide created

COMPLETE!
Test with: /task json-schema-to-ts "Convert user-schema.json to TypeScript"
```

## Token Budget Visualization

```
TARGET TOKEN BUDGET: <1,000 tokens (500-800 ideal)

┌────────────────────────────────────────────────────────────┐
│ YAML Frontmatter          │ ~50-100 tokens                 │
├────────────────────────────────────────────────────────────┤
│ Role Definition            │ ~150-250 tokens                │
│  ├─ Expertise              │                                │
│  ├─ Primary objective      │                                │
│  ├─ Core principles        │                                │
│  └─ Boundaries             │                                │
├────────────────────────────────────────────────────────────┤
│ Workflow                   │ ~200-400 tokens                │
│  ├─ Phases                 │                                │
│  ├─ Steps                  │                                │
│  └─ Decision trees         │                                │
├────────────────────────────────────────────────────────────┤
│ Examples                   │ ~200-300 tokens                │
│  ├─ Code samples           │                                │
│  ├─ Output formats         │                                │
│  └─ Edge cases             │                                │
├────────────────────────────────────────────────────────────┤
│ Handoff & Deliverables     │ ~50-100 tokens                 │
└────────────────────────────────────────────────────────────┘

TOTAL: 650-1,150 tokens
OPTIMIZE TO: <1,000 tokens

If over budget:
1. Remove redundancy
2. Condense examples
3. Use bullet points
4. Reference CLAUDE.md
5. Split if necessary
```

## Orchestration Patterns

### Pattern 1: Sequential Pipeline

```
planner
   │ Creates INITIAL.md
   ▼
[your-agent]
   │ Processes requirements
   ▼
validation-gates
   │ Validates output
   ▼
documentation-manager
   │ Updates docs
   ▼
COMPLETE
```

### Pattern 2: Parallel Execution

```
                  ┌─► ui-engineer ──────────┐
                  │                         │
planner ──────────┼─► [your-agent] ─────────┤
                  │                         ├─► synthesizer
                  └─► api-designer ─────────┘
```

### Pattern 3: Validation Loop

```
[your-agent]
   │ Generates code
   ▼
validation-gates
   │ Runs tests
   ▼
 Pass? ─Yes─► COMPLETE
   │
   No
   │
   ▼
code-reviewer
   │ Analyzes issues
   ▼
[your-agent]
   │ Fixes issues
   └─► (loop back to validation-gates)
```

## Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: The Monolith

```
┌─────────────────────────────────────────┐
│ super-agent (3,500 tokens)              │
│                                         │
│ Does EVERYTHING:                        │
│ - Planning                              │
│ - Code generation                       │
│ - Testing                               │
│ - Deployment                            │
│ - Documentation                         │
└─────────────────────────────────────────┘

Problem: Too heavy, slow orchestration, unclear boundaries
```

### ✅ Better: Focused Agents

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ planner  │──►│generator │──►│ tester   │──►│  docs    │
│(650 tok) │   │(550 tok) │   │(700 tok) │   │(450 tok) │
└──────────┘   └──────────┘   └──────────┘   └──────────┘

Benefits: Fast, clear responsibilities, easy to orchestrate
```

### ❌ Anti-Pattern 2: Vague Boundaries

```
Agent: code-improver

Responsibilities: "Makes code better"
```

### ✅ Better: Clear Boundaries

```
Agent: performance-optimizer

YOU DO:
- Identify performance bottlenecks
- Suggest optimization strategies
- Generate benchmark comparisons

YOU DON'T DO:
- Fix bugs (debugger agent)
- Run tests (validation-gates)
- Refactor architecture (architect)
```

### ❌ Anti-Pattern 3: Over-Specification

```yaml
description: "CRITICAL: You MUST ALWAYS validate input BEFORE processing.
NEVER proceed without checking! ALWAYS use proper error handling!
You MUST follow PEP8! CRITICAL: Never skip steps!"
```

### ✅ Better: Trust the Model

```yaml
description: "Code validator. Use PROACTIVELY when processing user input.
Validates syntax, checks PEP8 compliance, and reports errors clearly."
```

## Success Metrics

After creating an agent, measure success:

```
┌─────────────────────────────────────────────────────────┐
│ AGENT SUCCESS METRICS                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ✅ Completes task without errors         (Pass/Fail)   │
│ ✅ Produces expected deliverables         (Pass/Fail)   │
│ ✅ Stays within boundaries                (Pass/Fail)   │
│ ✅ Clear status updates                   (Pass/Fail)   │
│ ✅ Hooks fire correctly                   (Pass/Fail)   │
│                                                         │
│ 📊 Token count                            (<1,000)     │
│ 📊 Execution time                         (<30s avg)   │
│ 📊 User satisfaction                      (High/Med)   │
│ 📊 Integration success                    (Pass/Fail)  │
│                                                         │
└─────────────────────────────────────────────────────────┘

All metrics should be GREEN before production deployment.
```

## Quick Reference Commands

```bash
# Create new agent
/task subagent-creator "Create agent that [functionality]"

# Test agent (smoke test)
/task [agent-name] "[simple request]"

# Integration test
/task planner "Requirements for X"
/task [agent-name] "Process INITIAL.md"

# Check agent file
cat ~/.claude/agents/[agent-name].md

# Count tokens (approximate)
cat ~/.claude/agents/[agent-name].md | wc -w
# Multiply by 1.3 for token estimate

# List all agents
ls ~/.claude/agents/

# Review agent in CLAUDE.md
grep -A 20 "your-agent-name" /path/to/CLAUDE.md
```

---

**Remember**: Start simple! A focused 500-token agent that does one thing well is better than a 2,000-token agent that tries to do everything.
