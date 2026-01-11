# Legilimency Issues: Quick Reference

## 3 Critical Issues Found

### Issue 1: No Narrator Warning Before Spell ⚠️ CRITICAL

**What happens**: Player types "I'm using Legilimency on her" → Spell executes immediately

**What should happen**: Narrator warns "Legilimency risks backlash. Are you certain?" → Player confirms → Effect applies

**Root Cause**: Spell detection never wired into investigate route (routes.py line 413)

**Key Files**:
- `backend/src/api/routes.py:42` - Missing import of `build_narrator_or_spell_prompt`
- `backend/src/api/routes.py:413` - Always calls `build_narrator_prompt`, never checks for spells
- `backend/src/context/narrator.py:205-280` - Spell router exists but never called
- `backend/src/context/spell_llm.py:342-352` - Spell detection functions never invoked

**Fix**: Route spell detection through narrator before executing spell effect

---

### Issue 2: No Evidence Description

**What happens**: Secret revealed as ID only: `["saw_draco"]`

**What should happen**: Show full secret text: "I saw Draco Malfoy near the window at 9:00pm..."

**Root Cause**: Two-part failure
1. Backend only returns secret IDs in response (routes.py:906-911)
2. Frontend has no YAML access to look up descriptions

**Key Files**:
- `backend/src/api/routes.py:867-877` - LLM sees full text but only IDs returned
- `backend/src/api/routes.py:906-911` - InterrogateResponse only includes `secrets_revealed: string[]` (IDs)
- `frontend/src/types/investigation.ts` - InterrogateResponse has no secret text fields
- `backend/src/case_store/case_001.yaml:178-188` - Secret text lives here, never accessed by frontend

**Mitigation**: Trust that witness LLM naturally incorporates secret text in narrative response (already works)

**Fix Option A** (Better): Return full secret text in response
**Fix Option B** (Simpler): Remove ID display, rely on LLM narrative (already good)

---

### Issue 3: No Relationship Degradation

**What happens**: Unauthorized Legilimency → Trust stays at 50%

**What should happen**: Unauthorized mind-reading → Trust drops to ~35-40%

**Root Cause**: Flag extraction never implemented (routes.py:442)

**Design Intent** (spell_llm.py:220):
```
LLM should include: [FLAG: relationship_damaged]
Backend should extract and apply trust penalty
```

**Current Status**:
- ✓ Prompt tells LLM to include flags
- ✓ LLM would include them in response
- ✗ Routes.py only extracts `[EVIDENCE: ...]`, not `[FLAG: ...]`
- ✗ Witness state never updated
- ✗ No trust penalty applied

**Key Files**:
- `backend/src/context/spell_llm.py:220` - Flag instruction in prompt (never used)
- `backend/src/api/routes.py:442-446` - Evidence extraction, no flag extraction

**Fix**:
1. Add `extract_flags_from_response()` function
2. Check response for `[FLAG: relationship_damaged]`
3. Apply trust penalty to target witness

---

## Why These Happen Together

**All 3 root causes trace to same issue**: Spell system was designed but **never integrated into investigate route**

```
Phase 4.5 Spell System (isolated, works fine):
  ✓ spell_llm.py: Legilimency prompts, warnings, flags
  ✓ narrator.py: Spell router (build_narrator_or_spell_prompt)
  ✓ Tests pass

Integration Gap:
  ✗ routes.py investigate() never calls build_narrator_or_spell_prompt
  ✗ Spell detection functions never invoked
  ✗ Flag extraction never happens
  ✗ Trust updates never applied

Result:
  - Spells don't work via location investigation
  - Players attempt spells via witness interrogation (wrong system)
  - Witness mode doesn't have warning/flag system
  - Trust damage never happens
```

---

## Current Workaround

Legilimency currently works (partially) **only in witness interrogation**:
- Player can attempt Legilimency as a question to witness
- Witness responds (often hostile to mind-reading)
- Secret revealed via normal secret trigger system
- BUT: No warning first, no trust penalty

**Status**: Phase 4.5 spells incomplete but witness system works independently.

---

## Files with Issues at a Glance

### Backend
- `backend/src/api/routes.py` - All 3 issues (missing imports, flag extraction, trust updates)
- `backend/src/context/narrator.py` - Issue 1 (spell router never called)
- `backend/src/context/spell_llm.py` - Issue 3 (flags defined, never extracted)

### Frontend
- `frontend/src/types/investigation.ts` - Issue 2 (response model)

### Data
- `backend/src/case_store/case_001.yaml` - Issue 2 (secret text source)

---

## Severity & Priority

| Issue | Severity | Impact | Fix Effort |
|-------|----------|--------|-----------|
| 1. No Warning | CRITICAL | No game flow, spell executes uncontrolled | 2-3 hours |
| 2. No Description | MEDIUM | UX issue, secret ID confusing | 1-2 hours |
| 3. No Trust Penalty | HIGH | Balance broken, no consequence for forbidden spell | 2-3 hours |

**Total to fix all 3**: ~6-8 hours (sequential work)

**Recommendation**: All 3 should be fixed together since they're interconnected (all trace to spell integration gap).

---

## Full Analysis

See: `/Users/danielmedina/Documents/claude_projects/hp_game/PRPs/CODEBASE-RESEARCH-PHASE4.5-LEGILIMENCY-ISSUES.md` for:
- Detailed code snippets with line numbers
- Architecture diagrams
- How-it-should-work explanations
- Complete file inventory
- Designed vs. implemented comparison
- Integration point analysis
