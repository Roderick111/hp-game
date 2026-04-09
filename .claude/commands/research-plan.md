# Research & Planning Orchestration

Default: codebase research + planning. For mature codebase, this is usually enough.
Use `/deep-research-plan` when integrating new libraries/domains you haven't used before.

## Step 1: Codebase Research
Launch **codebase-researcher**: Find existing patterns, integration points, conventions for the feature.

Provide specific feature context from your prompt. 

## Step 2: Planning
Launch **planner** with:
- Codebase research output
- Relevant context you've pre-digested from project docs
- Clear scope of what user requested (don't imagine extra features)

**Result**: Codebase research -> implementation-ready PRP

Orchestrate this workflow to plan the following feature:
