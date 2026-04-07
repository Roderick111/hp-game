# Research & Planning Orchestration

## Step 1: Parallel Research
Launch simultaneously (single message, 3 Agent calls):
- **codebase-researcher**: Find existing patterns, integration points, conventions for the feature
- **github-researcher** (via general-purpose agent): Find production repos (1000+ stars) with similar implementations
- **docs-collector** (via general-purpose agent): Find official docs + Context7 for relevant libraries

Provide each agent with the specific feature context from your prompt. Do NOT tell them to read STATUS.md or PLANNING.md - you provide the relevant context.

## Step 2: Planning
Launch **planner** agent with:
- All 3 research outputs
- Relevant context you've pre-digested from project docs
- Clear scope of what user requested (don't imagine extra features)

**Result**: Complete research -> implementation-ready PRP

Orchestrate this workflow to plan the following feature:
