# Legilimency Issues: Visual Reference & Diagrams

## Problem Overview

```
┌─────────────────────────────────────────────────────────┐
│  PHASE 4.5 MAGIC SYSTEM - LEGILIMENCY ISSUES           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Issue 1: NO NARRATOR WARNING                          │
│  ├─ Player types: "I'm using Legilimency on her"      │
│  ├─ Expected: Narrator warns + player confirms        │
│  └─ Actual: Spell executes immediately in wrong system│
│                                                         │
│  Issue 2: NO EVIDENCE DESCRIPTION                      │
│  ├─ Secret revealed as: ["saw_draco"]                 │
│  ├─ Expected: Full text: "I saw Draco..."             │
│  └─ Actual: Only ID shown, text lost                  │
│                                                         │
│  Issue 3: NO RELATIONSHIP DEGRADATION                  │
│  ├─ Trust before: 50%                                  │
│  ├─ Expected: Trust after: 35-40% (penalty)           │
│  └─ Actual: Trust after: 50% (no change)              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Architecture: What Was Built vs. Integrated

```
┌──────────────────────────────────────────────────────────────┐
│                   SPELL SYSTEM ARCHITECTURE                  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ✅ BUILT (Isolated Components)                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  spell_llm.py                                          │ │
│  │  ├─ build_spell_effect_prompt()                       │ │
│  │  ├─ build_spell_system_prompt()                       │ │
│  │  ├─ is_spell_input()                                  │ │
│  │  ├─ parse_spell_from_input()                          │ │
│  │  ├─ _build_legilimency_section()                      │ │
│  │  │  └─ [FLAG: relationship_damaged] instruction ✓    │ │
│  │  └─ Tests: 43 passing                                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ✅ BUILT (Narrator Router)                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  narrator.py                                           │ │
│  │  ├─ build_narrator_or_spell_prompt()                  │ │
│  │  │  ├─ Detects spell input ✓                          │ │
│  │  │  ├─ Routes to spell_llm.py ✓                       │ │
│  │  │  └─ Returns (prompt, system_prompt, is_spell)      │ │
│  │  └─ Tests: 14 passing                                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ✅ BUILT (Spell Definitions)                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  definitions.py                                        │ │
│  │  ├─ SPELL_DEFINITIONS dict (7 spells)                │ │
│  │  ├─ get_spell()                                       │ │
│  │  ├─ is_restricted_spell()                             │ │
│  │  └─ Tests: 21 passing                                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ❌ NOT INTEGRATED (Routes)                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  routes.py investigate() endpoint                     │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │ Line 42:  Missing import ❌                      │ │ │
│  │  │ Line 413: Always builds narrator prompt ❌       │ │ │
│  │  │ Never calls:                                     │ │ │
│  │  │   - is_spell_input()                            │ │ │
│  │  │   - build_narrator_or_spell_prompt()            │ │ │
│  │  │   - extract_flags_from_response()               │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Current Data Flow: How Legilimency Actually Works

```
Player Input: "I'm using Legilimency on her"
    │
    ├──> routes.py investigate()
    │
    ├──> Line 413: build_narrator_prompt()
    │    (Always narrates, NEVER checks for spells)
    │
    ├──> Claude LLM narrates as regular action
    │    (Treats as normal location query)
    │
    └──> Narrator response returned
         (No spell processing, no warning, no flags)

         User confused: "Where's the spell warning?"
```

---

## Designed Data Flow: How Legilimency Should Work

```
Player Input: "I'm using Legilimency on her"
    │
    ├──> routes.py investigate()
    │
    ├──> is_spell_input(player_input) ✓ YES
    │
    ├──> build_narrator_or_spell_prompt()
    │    ├─ parse_spell_from_input() → ("legilimency", "her")
    │    ├─ Get witness context
    │    └─ Call build_spell_effect_prompt()
    │
    ├──> Claude LLM (spell_llm system prompt)
    │    └─ Response includes warning:
    │       "Legilimency on unwilling subject risks backlash.
    │        Moody won't approve. Are you certain?"
    │
    └──> Return spell warning response
         (Player must respond to confirm)

Player Confirms: "yes" / "do it"
    │
    ├──> routes.py investigate() again
    │
    ├──> is_spell_input() ✓ YES (still spell cast)
    │
    ├──> Claude LLM (spell_llm prompt)
    │    ├─ Determines outcome based on Occlumency skill
    │    ├─ Response example:
    │    │  "Your mind touches Hermione's thoughts...
    │    │   [Successfully reads her memory]
    │    │   [FLAG: relationship_damaged]"
    │    └─ Returns outcome
    │
    ├──> Extract flags: [FLAG: relationship_damaged]
    │
    ├──> Apply trust penalty to Hermione (-15)
    │
    └──> Response with outcome + trust change
         (Player sees consequence)
```

---

## Issue 1: Missing Spell Router - Visual

```
┌─────────────────────────────────────────────────────────┐
│                   ROUTES.PY LINE 42                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  CURRENT (WRONG):                                       │
│  from src.context.narrator import \                    │
│      build_narrator_prompt,        ← Only this         │
│      build_system_prompt                               │
│                                                         │
│  NEEDED (MISSING):                                      │
│  from src.context.narrator import \                    │
│      build_narrator_or_spell_prompt,  ← Add this!      │
│      build_narrator_prompt,                             │
│      build_system_prompt                               │
│                                                         │
│  from src.context.spell_llm import \                    │
│      is_spell_input,                 ← Add this!       │
│      parse_spell_from_input          ← Add this!       │
│                                                         │
│  IMPACT: Spell detection functions never available     │
│          for use in investigate() endpoint             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Issue 2: Secret Text Lost - Data Flow

```
Backend Data Flow:

case_001.yaml
    │
    └──> secrets:
         └──> id: "saw_draco"
         └──> text: "I saw Draco Malfoy at window..."
              │
              ├──> routes.py:871
              │    secret_texts = [secret.get("text") ...]
              │    ✓ Retrieved successfully
              │
              ├──> routes.py:877
              │    LLM prompt: "Reveal: [full secret text]"
              │    ✓ LLM sees full text
              │
              ├──> LLM narrates:
              │    "...I saw Draco Malfoy... at the window..."
              │    ✓ Incorporated naturally
              │
              └──> routes.py:906-911
                   return InterrogateResponse(
                       secrets_revealed=["saw_draco"]  ← ID ONLY
                   )
                   ❌ Text lost here!

Frontend:

receives InterrogateResponse
    │
    └──> secrets_revealed: ["saw_draco"]
         │
         ├──> No YAML access (confidential backend data)
         ├──> Can't look up text
         └──> Displays raw ID: ["saw_draco"]
              ❌ User confused: "What's saw_draco?"
```

---

## Issue 3: Flag Never Extracted - Processing Gap

```
┌────────────────────────────────────────────────────────┐
│           SPELL OUTCOME FLAG SYSTEM                    │
├────────────────────────────────────────────────────────┤
│                                                        │
│  DESIGNED (spell_llm.py:220)                          │
│  ┌──────────────────────────────────────────────────┐ │
│  │  "Include flags in your response if applicable: │ │
│  │   [FLAG: relationship_damaged]                   │ │
│  │   [FLAG: mental_strain]"                         │ │
│  └──────────────────────────────────────────────────┘ │
│         │                                              │
│         └──> LLM Would Include Flags                  │
│              (if spell routing worked)                │
│                                                        │
│  ACTUAL (routes.py:442-446)                           │
│  ┌──────────────────────────────────────────────────┐ │
│  │  response_evidence =                             │ │
│  │    extract_evidence_from_response(narrator_resp) │ │
│  │    ↓                                              │ │
│  │    Only looks for [EVIDENCE: ...] tags           │ │
│  │    Never checks for [FLAG: ...] tags             │ │
│  │                                                   │ │
│  │  Result: Flags ignored even if present ❌         │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  MISSING                                               │
│  ┌──────────────────────────────────────────────────┐ │
│  │  No function: extract_flags_from_response()      │ │
│  │  No logic: relationship_damaged → trust penalty  │ │
│  │  No update: witness state not modified           │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## Trust Penalty System: What Should Happen

```
Normal Question in Witness Interrogation:

Player: "Why were you in the library?"
    │
    ├──> adjust_trust() analyzes tone
    │    ├─ Empathetic: +5
    │    ├─ Neutral: 0
    │    └─ Aggressive: -10
    │
    └──> Witness state updated
         trust = 50 + delta

Unauthorized Legilimency (DESIGNED but not working):

Player: "I'm using Legilimency on her"
    │
    ├──> Narrator responds:
    │    "Unauthorized mind-reading detected"
    │    [FLAG: relationship_damaged]
    │
    ├──> routes.py should extract flag ❌ (missing)
    │    if "[FLAG: relationship_damaged]" in response:
    │
    ├──> routes.py should apply penalty ❌ (missing)
    │    witness_state.adjust_trust(-15)
    │
    └──> Result: Trust unchanged (NO PENALTY)
         trust = 50 (unchanged) ❌

         Should be: trust = 35 ✓
```

---

## File Dependency Graph

```
                    ┌──────────────────┐
                    │   case_001.yaml  │
                    │  (Secret text)   │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  Case Loader     │
                    │  (parse YAML)    │
                    └────────┬─────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐      ┌───────▼──────┐     ┌──────▼─────┐
   │Narrator │      │  Witness     │     │ Spell LLM  │
   │System   │      │  System      │     │  System    │
   └────┬────┘      └───────┬──────┘     └──────┬─────┘
        │                   │                   │
        │    ROUTES.PY      │                   │
        │  ┌───────────┐    │                   │
        └─►│investigate├◄───┴───────────────────┘
           │ endpoint  │  ← ALL 3 ISSUES HERE
           └───────────┘
                │
            Frontend
         (Interrogation)
```

**Problem**: Routes.py never calls spell system
**Impact**: All spell functionality isolated, unreachable

---

## Implementation Checklist

```
┌─────────────────────────────────────────────────────────┐
│         FIX IMPLEMENTATION CHECKLIST                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ISSUE 1: NO NARRATOR WARNING                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ [ ] Add spell imports to routes.py:42            │  │
│  │     - build_narrator_or_spell_prompt             │  │
│  │     - is_spell_input                             │  │
│  │     - parse_spell_from_input                     │  │
│  │                                                  │  │
│  │ [ ] Replace spell detection in routes.py:413     │  │
│  │     - Check if is_spell_input()                  │  │
│  │     - Call build_narrator_or_spell_prompt()      │  │
│  │     - Get witness context for Legilimency        │  │
│  │                                                  │  │
│  │ [ ] Test: "I'm using Legilimency" → Warning     │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ISSUE 2: NO EVIDENCE DESCRIPTION                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │ OPTION A: Return Secret Text                     │  │
│  │ [ ] Extend InterrogateResponse model             │  │
│  │ [ ] Add secret_texts field                       │  │
│  │ [ ] Populate in interrogate endpoint             │  │
│  │ [ ] Update frontend type definition              │  │
│  │ [ ] Display in UI component                      │  │
│  │                                                  │  │
│  │ OPTION B: Simpler (Don't show ID)                │  │
│  │ [ ] Remove secrets_revealed display              │  │
│  │ [ ] Trust LLM narrative (already works)          │  │
│  │                                                  │  │
│  │ [ ] Test: Secret revealed → See full text       │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ISSUE 3: NO RELATIONSHIP DEGRADATION                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ [ ] Add extract_flags_from_response() function   │  │
│  │ [ ] Add import in routes.py:46                   │  │
│  │ [ ] Add flag processing after LLM response       │  │
│  │ [ ] Extract [FLAG: relationship_damaged]         │  │
│  │ [ ] Apply -15 trust penalty to witness           │  │
│  │                                                  │  │
│  │ [ ] Test: Legilimency → Trust reduced            │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  VALIDATION                                            │
│  ┌──────────────────────────────────────────────────┐  │
│  │ [ ] All 3 unit tests pass                        │  │
│  │ [ ] Integration tests pass                       │  │
│  │ [ ] Full spell flow works end-to-end             │  │
│  │ [ ] Status.md updated                            │  │
│  │ [ ] Documentation updated                        │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Summary Table

| Aspect | Current | Expected | Gap |
|--------|---------|----------|-----|
| **Warning** | None | "Risks backlash. Certain?" | Spell routing missing |
| **Description** | "saw_draco" | Full secret text | Response model incomplete |
| **Trust Penalty** | None | -15 from 50 → 35 | Flag extraction missing |
| **Routing** | Witness interrogation | Location narrator | Not integrated |
| **Flag Processing** | Not implemented | Extracted & applied | Never implemented |

---

## Key Takeaway

```
┌─────────────────────────────────────────────────────┐
│  THE ISOLATED SYSTEM THAT WORKS PERFECTLY          │
│  BUT IS COMPLETELY DISCONNECTED                    │
│                                                    │
│  Phase 4.5 spell system:                          │
│  ✓ 78 tests passing                               │
│  ✓ All components working                         │
│  ✓ Beautiful prompt engineering                   │
│  ✓ Complete flag system designed                  │
│                                                    │
│  Problem: NEVER CALLED FROM routes.py             │
│                                                    │
│  Solution: Wire it in (6-8 hours)                 │
└─────────────────────────────────────────────────────┘
```

