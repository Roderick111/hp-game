# Research & Planning Orchestration

  ## Step 1: Parallel Research
  Launch simultaneously (single message, 3 Task calls):
  - **github-researcher**: Find production repos (1000+ stars). First he must read research file, if we already have 1-3 highly relevant repos and putterns there, he may skip the web research → `GITHUB_RESEARCH-phase_number.md`. Before finishing the work he must update research.md
  - **codebase-researcher**: Extract patterns via Serena MCP — the goal is to understand what elements we already have, and what needs to be created. We must respect KISS framework and do not create duplicates, always prioritizing using existing patterns. → `CODEBASE_RESEARCH-phase_number.md`
  - **docs-collector**: Find official docs + Context7. First he must read research file, if we already have 1-3 highly relevant docs and putterns there, he may skip the web research → `DOCS_RESEARCH-phase_number.md`. Before finishing the work he must update research.md

  ## Step 2: Planning
  Launch **planner** agent to:
  - Validate research outputs (quickly verify completeness)
  - Creating clear and comprehensive PRP with Quick Reference (pre-digested APIs/patterns), based on the context from all 3 research files
  - At the end we must have a clear, comprehensive and well-structured plan to ready to hand it off to coding agents to implement the desired feature.
  - Do not imagine features and modules that were not described by user
  

  Each subagent must read the critical project documentation to understand the context: status.md, planning.md, readme.md (in the root), AUROR_ACADEMY_GAME_DESIGN.md (in the docs/game-design)

  **Result**: Complete research → implementation-ready PRP

Orchestrate this workflow to plan the following feature:
