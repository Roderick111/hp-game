# Work on Next GitHub Issue

Fetch open issues, pick the most relevant one, and start working on it.

## Step 1: Fetch Issues

Run `gh issue list --state open --limit 20 --json number,title,labels,body` to get open issues.

Pick the most relevant issue based on:
- Priority labels (critical > high > medium > low)
- If no labels, pick the one most aligned with recent work on the branch
- Prefer issues that unblock other work

Print which issue you chose and why (1 sentence). Update the issue to indicate that work is in progress.

## Step 2: Assess Complexity

Read the issue body carefully. Classify:

- **Simple** (single file, clear fix, no design decisions): Start implementing directly.
- **Medium** (2-5 files, clear scope but needs codebase awareness): Do a quick Grep/Read to understand context, then implement.
- **Complex** (multiple domains, unclear scope, architectural impact): Run `/research-plan` before implementing.

If the issue is ambiguous or missing acceptance criteria, **stop and ask clarification questions**. Do not guess.

## Step 3: Implement

Follow the project's standard workflow:
- Use agents for multi-domain work (see CLAUDE.md agent table)
- Run validation after changes (`tsc --noEmit`, `ruff check`, relevant tests)
- Do NOT commit — leave that for the user to decide

## Step 4: Update STATUS.md

Append a concise entry to STATUS.md:

```
### [DATE] — Issue #N: [title]
- Status: [done | in progress | blocked]
- Changes: [1-2 bullet points of what was done]
- Notes: [blockers, follow-ups, or decisions made — if any]
```

Keep it factual. No fluff.

After finishin you must update/close the issue
