# Research & Planning Orchestration

  ## Step 1: Parallel Research
  Launch simultaneously (single message, 3 Task calls):
  - **github-researcher**: Find production repos (1000+ stars) → `GITHUB_RESEARCH.md`
  - **codebase-researcher**: Extract patterns via Serena MCP → `CODEBASE_RESEARCH.md`
  - **docs-collector**: Find official docs + Context7 → `DOCS_RESEARCH.md`

  ## Step 2: Planning
  Launch **planner** agent to:
  - Validate research outputs (quickly verify completeness)
  - Synthesize context from all 3 research files, creating clear and comprehensive PRP with Quick Reference (pre-digested APIs/patterns)

  Each subagent must read the critical project documentation to understand the context: status.md, planning.md, readme.md, AUROR_ACADEMY_GAME_DESIGN.md

  **Result**: Complete research → implementation-ready PRP

Orchestrate this workflow to plan the following feature:
