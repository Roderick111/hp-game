# Research & Planning Orchestration

  ## Step 1: Parallel Research
  Launch:
  - **codebase-researcher**: Extract patterns via Serena MCP — the goal is to understand what elements we already have, and what needs to be created. We must respect KISS framework and do not create duplicates, always prioritizing using existing patterns. → `CODEBASE_RESEARCH-phase_number.md`
  
  ## Step 2: Planning
  Launch **planner** agent to:
  - Validate research outputs (quickly verify completeness)
  - Creating clear and comprehensive PRP with Quick Reference (pre-digested APIs/patterns), based on the context from this research file and on the RESEARCH.md
  - At the end we must have a clear, comprehensive and well-structured plan to ready to hand it off to coding agents to implement the desired feature.
  - Do not imagine features and modules that were not described by user
  

  Each subagent must read the critical project documentation to understand the context: status.md, planning.md, readme.md (in the root), AUROR_ACADEMY_GAME_DESIGN.md (in the docs/game-design)

  **Result**: Complete research → implementation-ready PRP

Orchestrate this workflow to plan the following feature:
