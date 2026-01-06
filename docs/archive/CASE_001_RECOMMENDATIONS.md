# Case 001: Implementation Recommendations

**Date**: 2026-01-06
**Status**: Ready for phased implementation
**Source**: CASE_001_TECHNICAL_SPEC.md

---

## Executive Summary

**Verdict**: Current `case_001.yaml` contains a **completely different case** (Draco/Hermione freezing charm) than the narrative design (Vector bookshelf murder).

**Recommendation**: **Rebuild case_001.yaml incrementally** across phases, preserving narrative vision.

---

## Phase-by-Phase Recommendations

### Phase 2.5 (CURRENT - 1-2 days)

**Goal**: Integrate witness system WITHOUT breaking current implementation

**MINIMAL YAML Changes** (preserve current system):

```yaml
# backend/src/case_store/case_001.yaml

# 1. ADD evidence metadata (for modal display)
evidence:
  physical:
    hidden_note:
      name: "Threatening Note"  # NEW
      location: "library"        # NEW
      description: |             # EXPAND
        Crumpled parchment with threatening words: "I know what you did."
        The handwriting is hurried, angry.

# 2. ADD witnesses_present to location
locations:
  library:
    witnesses_present: []  # NEW - empty for now (no witnesses in Phase 2.5)
```

**Why minimal**:
- Current YAML works for Phase 2 witness testing
- Don't break working code during integration phase
- Full case replacement happens in Phase 6 (content phase)

**Deliverables**:
- ✅ Terminal UX polish
- ✅ Witness integration
- ✅ Evidence modal with name/location/description
- ⚠️ Keep current Draco/Hermione case for testing

---

### Phase 3 (Verdict System - 7-8 days)

**Goal**: Add verdict evaluation WITHOUT full case content

**YAML Additions** (still minimal):

```yaml
# ADD minimal solution module for testing
solution:
  culprit: "draco"  # Keep current case for testing
  method: "Freezing charm from window"
  motive: "Practice spell (accident vs intentional—player decides)"

  critical_evidence:
    - "frost_pattern"
    - "wand_signature"
    - "hermione_testimony"

  deductions_required:
    - "Connect frost pattern to Draco's freezing charm"
    - "Determine if intentional or accident"

# ADD minimal post-verdict
post_verdict:
  wrong_suspect_examples:
    hermione:
      moody_response: |
        MOODY: "Hermione? She was a WITNESS, recruit. Not the culprit.
        Check the evidence. Who was casting the spell?"

  correct_suspect:
    confrontation:
      setting: "Draco confronted in Slytherin common room"
      dialogue:
        - speaker: "moody"
          line: "Malfoy. Explain the frost pattern."
        - speaker: "draco"
          line: "[Defensive] I was practicing! I didn't know anyone was inside!"
```

**Why keep current case**:
- Verdict system needs SOMETHING to test against
- Full Vector case requires all mechanics (magic system, Tom's voice, briefing)
- Test mentor evaluation logic with simple case first

**Deliverables**:
- ✅ Mentor LLM evaluation
- ✅ Fallacy detection
- ✅ Post-verdict confrontation system
- ⚠️ Still using Draco/Hermione case for testing

---

### Phase 3.5 (Intro Briefing - 2-3 days)

**Goal**: Add briefing system

**YAML Additions**:

```yaml
# ADD briefing module (Vector case rationality lesson)
briefing:
  rationality_lesson: "base_rates"

  moody_teaches: |
    MOODY: "Before you start: Out of 100 school deaths ruled 'accidents,'
    how many actually ARE accidents?

    [Player guesses]

    85%. Hogwarts is dangerous. Most accidents are just accidents.
    Start there. Evidence might change your mind. Might not."

  player_guess:
    prompt: "Your estimate?"
    options:
      - "10-20% (Most are actually murders)"
      - "40-60% (About half and half)"
      - "80-90% (Most are genuine accidents)"
```

**Still using**: Draco/Hermione case for testing briefing flow

---

### Phase 4 (Tom's Inner Voice - 3-4 days)

**Goal**: Add Tom trigger system

**YAML Additions**:

```yaml
# ADD Tom triggers (minimal for testing)
tom_triggers:
  introduction:
    - id: "tom_appears"
      condition: "first_evidence_discovered"
      text: |
        TOM: "Oh! A new recruit. I'm Tom. Let's investigate together."

  tier_1:
    - id: "first_clue_helpful"
      condition: "evidence_count == 1"
      type: "helpful"
      text: "TOM: "What does this evidence actually prove?""

    - id: "first_clue_misleading"
      condition: "evidence_count == 1"
      type: "misleading"
      text: "TOM: "First clue usually points to the culprit. Follow it.""
```

**Still using**: Draco/Hermione case for testing Tom triggers

---

### Phase 4.5 (Magic System - 2-3 days)

**Goal**: Add spell context system

**YAML Additions**:

```yaml
# ADD spell contexts
spell_contexts:
  revelio:
    library_ceiling:
      works: true
      reveals: "frost_pattern"  # Current case
      narration: |
        Revelio illuminates frost on the window—recent freezing charm.

  prior_incantato:
    victims_wand:
      works: true
      result: "Stupefy cast at 9:15 PM"  # Current case
```

**Still using**: Draco/Hermione case for spell testing

---

### Phase 6 (Content - FULL REPLACEMENT)

**Goal**: Replace Draco/Hermione case with Vector case (full narrative)

**COMPLETE YAML Replacement**:

```yaml
# DELETE entire current case_001.yaml contents
# REBUILD from CASE_001_TECHNICAL_SPEC.md:

case:
  id: "case_001_restricted_section"
  title: "The Restricted Section"
  crime_type: "murder"

victim:
  name: "Helena Blackwood"
  # ... (full victim module from spec)

locations:
  library_main_hall:    # 4 locations total
  restricted_section:
  study_alcove:
  madam_pince_office:
  # ... (full location modules from spec)

suspects:
  marcus_flint:         # 4 suspects total
  argus_filch:
  adrian_clearmont:
  professor_vector:
  # ... (full suspect modules from spec)

evidence:
  # 10 evidence pieces (levitation_scorch_marks, erased_log_entry, etc.)

solution:
  culprit: "professor_vector"
  # ... (full solution from spec)

post_verdict:
  # ... (full confrontation scenes from spec)

briefing:
  # ... (base rates lesson from spec)

tom_triggers:
  # ... (full trigger list from spec)

spell_contexts:
  # ... (full spell tutorial from spec)
```

**Why wait until Phase 6**:
- All mechanics must be implemented FIRST (verdict, briefing, Tom, spells)
- Vector case is COMPLEX (4 suspects, 10 evidence, timeline reconstruction)
- Simple Draco/Hermione case tests mechanics WITHOUT complexity
- Full replacement = comprehensive integration test

---

## Decision Tree

### Option A: Incremental Replacement (RECOMMENDED)

**Timeline**:
```
Phase 2.5 → Phase 3 → Phase 3.5 → Phase 4 → Phase 4.5 → Phase 6
  (keep      (keep      (keep        (keep     (keep       (REPLACE
   Draco)     Draco)     Draco)       Draco)    Draco)      with Vector)
```

**Pros**:
- ✅ Test each mechanic independently with simple case
- ✅ Don't break working code during development
- ✅ Full Vector case = comprehensive validation of ALL systems
- ✅ Lower risk (iterative approach)

**Cons**:
- ⚠️ Players see "wrong" case in Phases 2.5-5
- ⚠️ Maintain two case versions (current + spec)

---

### Option B: Immediate Full Replacement (NOT RECOMMENDED)

**Timeline**:
```
Phase 2.5 → DELETE Draco, BUILD Vector → Test all phases with Vector case
```

**Pros**:
- ✅ "Correct" case immediately
- ✅ Single source of truth

**Cons**:
- ❌ High risk (big-bang replacement)
- ❌ Can't test mechanics until ALL content ready
- ❌ Debugging nightmare (is it mechanic bug or content bug?)
- ❌ Delays all downstream phases

---

## Recommended Path: OPTION A

### Rationale

1. **Validate mechanics first**: Verdict system, briefing, Tom's voice, spells must work BEFORE complex case
2. **Simple test case**: Draco/Hermione case is PERFECT for testing (2 witnesses, 3 evidence, clear solution)
3. **Risk management**: Incremental changes = easier debugging
4. **Comprehensive test**: Vector case = validates ALL systems together in Phase 6

### Implementation Plan

**Phase 2.5** (NOW):
- ✅ Keep current YAML
- ✅ Add `name`/`location`/`description` to evidence
- ✅ Add `witnesses_present: []` to locations
- ⚠️ **DO NOT** replace case content yet

**Phases 3-4.5** (Next 15-20 days):
- ✅ Build verdict/briefing/Tom/spell mechanics
- ✅ Test with current Draco/Hermione case
- ✅ Validate each mechanic independently
- ⚠️ **DO NOT** replace case content yet

**Phase 6** (Content milestone - 3-4 days):
- ❌ **DELETE** entire case_001.yaml contents (except structure)
- ✅ **REBUILD** from CASE_001_TECHNICAL_SPEC.md
- ✅ **TEST** all mechanics with full Vector case
- ✅ **VALIDATE** complete experience start-to-finish

---

## YAML Update Checklist

### Phase 2.5 Updates (MINIMAL)

```yaml
# ✅ ADD to each evidence piece
evidence:
  physical:
    hidden_note:
      id: "hidden_note"
      type: "physical"
      name: "Threatening Note"           # NEW
      location: "library"                # NEW
      description: "Full description"    # EXPAND
      triggers: [...]
      tag: "[EVIDENCE: ...]"

# ✅ ADD to each location
locations:
  library:
    id: "library"
    type: "micro"
    name: "Hogwarts Library"
    witnesses_present: []                # NEW
    description: |
      ...
```

### Phase 3 Updates (MINIMAL)

```yaml
# ✅ ADD solution module (simple)
solution:
  culprit: "draco"
  method: "Freezing charm"
  critical_evidence: ["frost_pattern", "hermione_testimony"]

# ✅ ADD post_verdict module (simple)
post_verdict:
  wrong_suspect_examples:
    hermione:
      moody_response: "..."
  correct_suspect:
    confrontation: "..."
```

### Phase 6 Updates (COMPLETE REPLACEMENT)

```yaml
# ❌ DELETE ALL current content
# ✅ COPY from CASE_001_TECHNICAL_SPEC.md lines 1-2400
# ✅ VALIDATE against CASE_DESIGN_GUIDE.md templates
```

---

## Content Gap Analysis

### What's Complete (in CASE_001_TECHNICAL_SPEC.md)

✅ **Victim** - Helena Blackwood (full humanization, background)
✅ **Locations** - 4 locations (main hall, restricted section, alcove, office)
✅ **Suspects** - 4 suspects (Flint, Filch, Adrian, Vector) with full interrogations
✅ **Evidence** - 10 evidence pieces (physical, magical, documentary)
✅ **Timeline** - 10 events from 9:30 PM to 10:30 PM
✅ **Solution** - Complete (culprit, method, motive, deductions, fallacies)
✅ **Post-Verdict** - 3 wrong suspect responses + Vector confrontation + aftermath
✅ **Briefing** - Base rates rationality lesson (85% accidents are accidents)
✅ **Tom Triggers** - 15+ triggers (introduction, tier 1-3, rare variants)
✅ **Magic Tutorial** - Revelio, Prior Incantato, Homenum Revelio, Specialis Revelio

### What's Missing (needs design)

❓ **Vector's Wand Location** - Spec mentions "hidden in Vector's office" but no specific location
- **Recommendation**: Add in Phase 6 as hidden evidence in Vector's office location
- **Trigger**: "search office", "check desk drawers", "revelio"
- **Description**: "Helena's wand, hidden in locked drawer. Prior Incantato shows last spell: Protego (defensive)"

❓ **Adrian's Power Level Details** - Spec establishes "weaker caster" but no mechanics
- **Recommendation**: NOT NEEDED - narrative exposition sufficient
- **Moody's feedback**: "Adrian couldn't lift a CHAIR that high, let alone a bookshelf"
- **No gameplay impact** (player can't measure power level directly)

✅ **No other gaps identified** - Spec is comprehensive

---

## Validation Checklist

### Plot Consistency

- ✅ Timeline coherent (9:30 PM - 10:30 PM, all events accounted for)
- ✅ Suspect alibis align (Flint left 8:30 PM, Adrian fled 10:05 PM, Vector entered 10:15 PM)
- ✅ Evidence supports solution (levitation + erased log + missing wand = Vector)
- ✅ No contradictions (all witness testimony matches timeline)

### Evidence Web

- ✅ Critical evidence identified (levitation_scorch_marks, erased_log_entry, missing_wand)
- ✅ Red herrings present (flints_scarf, filch_found_body_first, adrian_guilty_behavior)
- ✅ Complication evidence (flints_scarf contradicts "Flint guilty at 10 PM" theory)
- ✅ Elimination logic (Filch = no magic, Adrian = too weak + fled before, Flint = timeline wrong)

### Character Depth

- ✅ Suspects have wants/fears/moral_complexity (not flat archetypes)
- ✅ Guilty character sympathetic (Vector = desperate, not evil)
- ✅ Red herrings sympathetic (Flint = terrified, Filch = bitter, Adrian = ashamed)
- ✅ Victim humanized (Helena = brilliant, curious, silenced)

### Rationality Teaching

- ✅ Base rates lesson (85% accidents are accidents—start with likely)
- ✅ Confirmation bias (Flint obvious suspect = trap)
- ✅ Authority bias (professor can be guilty)
- ✅ Timeline reconstruction (when was each person present?)
- ✅ Mechanism reasoning (HOW did killer do it? Magic = eliminates Filch)

---

## Next Steps

### Immediate (Phase 2.5 - 1-2 days)

1. ✅ Read STATUS.md to update completion status
2. ✅ Minimal YAML updates (evidence metadata, witnesses_present)
3. ✅ Terminal UX polish
4. ✅ Witness integration
5. ✅ Update PLANNING.md with case content status

### Short-term (Phases 3-4.5 - 15-20 days)

1. ✅ Build verdict system (test with Draco case)
2. ✅ Build briefing system (test with Draco case)
3. ✅ Build Tom's voice (test with Draco case)
4. ✅ Build magic system (test with Draco case)

### Medium-term (Phase 6 - 3-4 days)

1. ❌ DELETE Draco/Hermione case from YAML
2. ✅ REBUILD with Vector case from CASE_001_TECHNICAL_SPEC.md
3. ✅ Comprehensive integration test (all mechanics + full content)
4. ✅ Playtesting (3 runs, validate difficulty)

---

## Risk Assessment

### High Risk

❌ **Immediate full replacement** (Option B) - Don't do this

### Medium Risk

⚠️ **Phase 6 big-bang replacement** - Mitigated by:
- Testing mechanics with simple case first (Phases 2.5-4.5)
- Comprehensive spec (CASE_001_TECHNICAL_SPEC.md complete)
- Clear validation checklist (above)

### Low Risk

✅ **Incremental approach** (Option A) - Recommended
✅ **Phase 2.5 minimal updates** - Add metadata only
✅ **Spec completeness** - No content gaps identified

---

## Success Criteria

### Phase 2.5 Success

- [ ] Evidence modal shows name/location/description
- [ ] Witnesses can be selected (UI integrated)
- [ ] Terminal shortcuts visible
- [ ] No breaking changes to current case

### Phase 3-4.5 Success

- [ ] Verdict system evaluates Draco case correctly
- [ ] Briefing system displays base rates lesson
- [ ] Tom's voice triggers at appropriate evidence counts
- [ ] Magic system responds to spell keywords

### Phase 6 Success

- [ ] Vector case playable start-to-finish
- [ ] All 4 suspects interrogatable
- [ ] 10 evidence pieces discoverable
- [ ] Correct verdict (Vector) triggers confrontation
- [ ] Wrong verdicts (Flint, Filch, Adrian) trigger appropriate Moody feedback
- [ ] Timeline reconstruction possible from evidence
- [ ] 3+ playtesters solve case in <10 attempts

---

**RECOMMENDATION: Proceed with Option A (Incremental Replacement)**

**Next Action**: Phase 2.5 minimal YAML updates → Terminal UX polish → Witness integration
