# Work on Next GitHub Issue

Fetch open issues, pick one, clarify with user, research, propose, then implement.

## Step 1: Pick Issue

Run `gh issue list --state open --limit 20 --json number,title,labels,body` to get open issues.

Pick the most relevant issue based on:
- Priority labels (critical > high > medium > low)
- If no labels, pick the one most aligned with recent work on the branch
- Prefer issues that unblock other work

Print which issue you chose and why (1 sentence).

**Immediately update the issue** to indicate work is in progress (add a comment or update body).

## Step 2: Clarify with User

**STOP HERE.** Before any research or planning, ask the user clarifying questions:

- What's the expected behavior / acceptance criteria?
- Any design preferences or constraints?
- Anything that should NOT change?
- Priority / scope boundaries?

Keep questions concise and specific to the issue. Skip obvious ones.

**Do NOT proceed until the user answers.** This is the first gate.

## Step 3: Research

**Always research before proposing anything.** Never skip this step.

Assess complexity:
- **Simple** (single file, clear fix): Quick Grep/Read of relevant files.
- **Medium** (2-5 files, clear scope): Read all affected files, trace data flow, check patterns.
- **Complex** (multiple domains, unclear scope): Run `/research-plan` for deep multi-agent research.

## Step 4: Propose Plan

**STOP HERE and present to the user before implementing.** Include:

1. **Your understanding** of the problem (1-2 sentences)
2. **What you found** during research (current state of relevant code)
3. **Proposed approach** — concrete changes, file by file
4. **Alternatives considered** (if any)
5. **Questions** — anything still unclear

**Do NOT implement until the user explicitly approves.** This is the second gate.

## Step 5: Implement

Only after user approval:
- Follow the project's standard workflow
- Use agents for multi-domain work (see CLAUDE.md agent table)
- Run validation after changes (`tsc --noEmit`, `ruff check`, relevant tests)
- Do NOT commit — leave that for the user to decide

## Step 6: Close Out

- Update/close the issue with a summary of changes
- Append a concise entry to STATUS.md:

```
### [DATE] — Issue #N: [title]
- Status: [done | in progress | blocked]
- Changes: [1-2 bullet points of what was done]
- Notes: [blockers, follow-ups, or decisions made — if any]
```
