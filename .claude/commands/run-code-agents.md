---
description: Launch coding agents to implement a PRP
---

## Context

Read the PRP specified by the user: $ARGUMENTS

If no PRP path given, find the most recent PRP:
!`ls -t PRPs/PRP-*.md | head -1`

## Your task

1. **Read the PRP** - understand tasks, files, agent orchestration section
2. **Launch agents** based on PRP's orchestration plan:
   - Provide each agent with ONLY the context it needs (relevant PRP sections, file paths, patterns)
   - Launch independent agents in parallel
3. **After implementation** - launch `validation-gates` to verify
4. **Report results** - summarize what was built, what passed/failed
