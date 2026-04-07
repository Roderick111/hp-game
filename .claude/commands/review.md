---
description: Review current changes with code-reviewer agent
---

## Context

- Current diff: !`git diff --stat HEAD`
- Changed files detail: !`git diff HEAD --name-only`
- Branch: !`git branch --show-current`

## Your task

1. Read the diff above and understand what changed
2. Launch **code-reviewer** agent with:
   - The specific files changed and what was modified
   - Pre-digested context about the feature/fix (read relevant files if needed)
   - Do NOT tell the agent to read STATUS.md — you provide context
3. Report the reviewer's findings to the user
