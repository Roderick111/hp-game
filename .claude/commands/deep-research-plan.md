---
description: Deep research for new libraries/domains (3 agents + planner)
---

# Deep Research & Planning

Use when integrating something new (new library, unfamiliar pattern, new domain).
For features building on existing patterns, use `/research-plan` instead.

## Step 1: Parallel Research
Launch simultaneously (single message, 3 Agent calls):
- **codebase-researcher**: Find existing patterns, integration points, conventions
- **github-researcher** (via general-purpose agent): Find production repos (1000+ stars) with similar implementations
- **docs-collector** (via general-purpose agent): Find official docs + Context7 for relevant libraries

Provide each agent with specific feature context. Do NOT tell them to read STATUS.md or PLANNING.md — you provide the relevant context.

## Step 2: Planning
Launch **planner** with:
- All 3 research outputs
- Relevant context you've pre-digested from project docs
- Clear scope of what user requested (don't imagine extra features)

**Result**: Complete research -> implementation-ready PRP

Orchestrate this workflow to plan the following feature:
