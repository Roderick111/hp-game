# Case Design Guide - Harry Potter Investigation Game

Complete guide to creating professional-quality cases using the enhanced YAML schema (Phase 5.5+).

---

## Quick Start

1. Copy `docs/case-files/case_template.yaml` to `backend/src/case_store/case_NNN.yaml`
2. Follow the [REQUIRED] field annotations
3. Reference `CASE_002_RESTRICTED_SECTION.md` for complete example
4. Test: Drop file in case_store/, restart server or call GET /api/cases

---

## Design Philosophy: Story First, Rationality Second

**The core principle**: This game succeeds when it tells compelling character stories through investigation. If stories are boring and linear, players won't engage—and they won't learn rationality principles even if we teach them perfectly.

### Priority Hierarchy

**1. CHARACTER STORIES (First Priority)**
- Investigate to reveal interesting, human stories about complex characters
- Each witness should have wants, fears, moral dilemmas that emerge through dialogue
- Evidence should reveal character depth, not just plot mechanics
- Player should care about the people involved, not just "solving the puzzle"

**Example**: Hermione isn't just "the student who found the body." She's a loyal friend secretly teaching Neville defensive spells after he was bullied. Her badge at the crime scene creates conflict: tell the truth and get Neville expelled, or withhold details and look guilty herself.

**2. MYSTERY STRUCTURE (Second Priority)**
- Create solid, logically structured narratives with ambiguity and contradictions
- Multiple suspects with plausible motives
- Evidence that creates hypothesis shifts (initial theory → red herring → truth)
- Timeline and physical evidence as the keys to resolution
- Avoid linear "collect evidence against obvious suspect" gameplay

**Example**: Players suspect Hermione (found body, badge at scene) → consider Dobby (theft conflict, "D." note) → evidence shifts to Draco (Hand of Glory letter, timeline, witnesses). Each phase feels earned, not arbitrary.

**3. TEACHING RATIONALITY (Third Priority)**
- Rationality concepts emerge naturally from solving complex mysteries
- Don't sacrifice story quality to force a teaching moment
- Let players discover biases by making mistakes, then show them why
- Use Moody's feedback to highlight fallacies AFTER verdict, not during investigation

**Example**: Players accusing Hermione teaches "don't assume person who found body is guilty" more effectively than lecturing about availability bias upfront.

### What Makes a Case Engaging

**✅ Good Mystery Design:**
- Three witnesses with different secrets (only one is the culprit)
- Red herring evidence that initially points to wrong suspect
- Ambiguous notes or evidence (e.g., "D." could mean Draco or Dobby)
- Timeline that eliminates suspects with alibis
- Physical evidence that shifts theories (Hand of Glory proves magic was used)
- Moral complexity (accident vs intentional, reckless vs evil)

**❌ Boring Mystery Design:**
- One obvious suspect, all evidence points to them
- Linear evidence collection (find clue A → B → C → solved)
- No contradictions or hypothesis shifts
- Witnesses have no depth beyond "helpful" or "lying"
- Solution is clear from the briefing

### Balancing Story and Structure

**Technical constraints** (must preserve for code compatibility):
- Evidence IDs must be unique strings (e.g., `hidden_note`, `torn_letter`)
- Witness IDs must match YAML keys exactly
- Solution.culprit must reference a witness ID
- Timeline uses consistent time format
- Trigger phrases must be lowercase strings

**Creative freedom** (tell your story here):
- Victim humanization (who they were, what was lost)
- Witness psychology (wants, fears, moral_complexity)
- Evidence significance (why it matters narratively)
- Secrets and lies (what characters hide, when they reveal)
- Post-verdict confrontation dialogue
- Teaching moments in wrong verdict responses

### Case Design Checklist

Before finalizing your case, ask:

1. **Character Stories**: Do witnesses have compelling internal conflicts beyond "helpful witness" or "lying suspect"?
2. **Mystery Flow**: Will players form multiple hypotheses, or is the solution obvious from the start?
3. **Evidence Ambiguity**: Is there at least one piece of evidence that could support multiple theories?
4. **Timeline**: Does the timeline eliminate at least one plausible suspect with an alibi?
5. **Moral Complexity**: Is the culprit purely evil, or do they have understandable (if not excusable) motivations?
6. **Teaching Integration**: Do rationality concepts emerge naturally from mistakes, or are they forced?

If you answered "no" to questions 1-4, your case may be too linear. Revise to add complexity.

---

## Field Usage Guidelines

### Victim Humanization

**Purpose**: Make players care emotionally about solving the case

**name** (required if victim section present):
- Full name, proper capitalization
- Example: "Helena Blackwood", "Theodore Nott"

**age** (required if victim section present):
- Age descriptor that gives context
- Good: "Fourth-year Ravenclaw", "First-year Hufflepuff", "Sixth-year transfer student"
- Bad: "14 years old" (too clinical)

**humanization** (required if victim section present):
- 2-3 sentences creating emotional connection
- Include: What they were like, what made them memorable, what was lost
- Good: "You remember her from the library—always buried in wandlore texts, muttering about core resonance frequencies. Brilliant, obsessive, the kind of student who'd sneak into the Restricted Section for research long after curfew. Someone silenced that curious mind permanently."
- Bad: "A student who was killed." (too vague)

**memorable_trait** (required if victim section present):
- One distinctive detail that sticks
- Examples: "Wandlore obsessive", "Always wore mismatched socks", "Hummed while studying"

**cause_of_death** (required for complete cases):
- **Critical**: First word becomes crime type shown to all witnesses automatically
- Format: "[Simple action] [by/with/from] [details]"
- Examples:
  - "Petrification curse from cursed object discharge" → Witnesses see "Petrification"
  - "Crushed by a massive bookshelf (staged as accident)" → Witnesses see "Crushed"
  - "Stabbed with enchanted letter opener" → Witnesses see "Stabbed"
- Bad: "Died" (too vague), "Killed" (not specific)
- Used by: Witness context (automatic extraction), Moody (verdict evaluation)

**time_of_death** (optional, recommended):
- Precise time for timeline coordination
- Example: "10:05 PM"
- Used by: Moody (verdict evaluation), Timeline cross-referencing

---

### Evidence Enhancement

**significance** (optional, recommended):
- One sentence: WHY this evidence matters to the case
- Example: "Proves Wingardium Leviosa was used at high power"
- Used by: Narrator (subtle emphasis), Moody (feedback), Tom (commentary)

**strength** (optional, recommended):
- 0-100 rating of evidence quality
- Calibration:
  - 100: Critical, case-solving evidence (levitation scorch marks, erased log)
  - 80-90: Strong evidence that implicates/eliminates (missing wand, shelf marks)
  - 60-70: Moderate evidence (witness testimony, circumstantial)
  - 40-50: Weak evidence (presence, opportunity)
  - 20-30: Red herring or misleading (Flint's scarf)
- Used by: Tom (targets strong evidence), Moody (feedback quality)

**points_to** (optional, recommended):
- List of suspect IDs this evidence implicates
- Example: `["professor_vector", "marcus_flint"]`
- Used by: Moody (evaluating player reasoning)

**contradicts** (optional, recommended):
- List of suspect IDs or theory names this evidence exonerates
- Example: `["filch_guilty", "adrian_guilty", "accident_theory"]`
- Used by: Moody (catching player mistakes)

---

### Witness Psychological Depth

**wants** (required for complete cases):
- What the witness is trying to achieve in this situation
- Drives their behavior during interrogation
- Good: "Help investigation without getting friends in trouble", "Protect house reputation while cooperating"
- Bad: "Tell the truth" (too generic)
- Used by: Witness LLM (shapes responses based on trust level)

**fears** (required for complete cases):
- What stops them from helping fully
- Creates internal conflict
- Good: "Retaliation from Slytherins if she names names", "Expulsion so close to graduation"
- Bad: "Being caught lying" (too generic)
- Used by: Witness LLM (low trust = fear dominates, high trust = trust overcomes fear)

**moral_complexity** (required for complete cases):
- 2-4 sentences describing internal conflict
- Why they're torn between competing values
- What makes them human, not just an NPC
- Good: "Hannah saw something important but doesn't want to betray Marcus, who helped her pass Potions last year. She's not malicious—just caught between loyalty to someone who was kind to her and doing what's right. The guilt of staying silent wars with fear of social consequences."
- Bad: "She's conflicted." (too vague)
- Used by: Witness LLM (informs roleplay nuance), Moody (feedback on witness handling)

**secrets** (optional):
- Hidden information witness may reveal during interrogation
- **LLM decides naturally** when to reveal based on:
  - Question relevance to the secret
  - Natural conversation flow
  - Character personality and trust level
  - Safety/self-preservation instincts
- Structure:
  ```yaml
  secrets:
    - id: "secret_identifier"
      text: |
        What witness says when revealing this secret.
        Written in character voice (first person, 2-4 sentences).
        Include emotional authenticity and hesitation if appropriate.
      keywords: ["word1", "word2"]  # Optional: For Legilimency spell targeting
  ```
- Write in character voice, not clinical/robotic
- Good: "Alright. I... I saw Draco Malfoy. Running. From the Restricted Section. He looked absolutely terrified."
- Bad: "I observed suspect flee scene at 9:15 PM" (too clinical)
- Used by: Witness LLM (decides when to reveal), Legilimency (keyword matching)

---

### Automatic Witness Context System

**Purpose**: Every witness automatically receives basic case facts without manual configuration.

**What's Provided Automatically**:

When any witness is interrogated, the system automatically injects:

```
== CASE CONTEXT (public knowledge) ==
Victim: [victim.name]
What happened: [first word of victim.cause_of_death]
Where: [first location.name]
```

**Fields Used for Auto-Extraction**:
1. `victim.name` → Displayed as-is to all witnesses
2. `victim.cause_of_death` → First word extracted and simplified
   - "Petrification curse from..." → "Petrification"
   - "Crushed by a massive..." → "Crushed"
3. `locations` dict → First location's `name` field used as crime scene

**Why This Matters**:
- Everyone at Hogwarts would know these basic facts
- McGonagall doesn't need "investigating Snape" in her `knowledge` - she already knows
- Witnesses can reference the victim by name naturally
- Keeps witness `knowledge` focused on their unique observations

**Implementation** (routes.py:1457-1472):
```python
victim_info = case_data.get("victim", {})
cause_of_death = victim_info.get("cause_of_death", "")
crime_type = cause_of_death.split()[0]  # First word only

case_context = {
    "victim_name": victim_info.get("name", ""),
    "crime_type": crime_type,
    "location": first_location.get("name", ""),
}
```

**Best Practices**:

✅ **DO use witness.knowledge for**:
- Specific personal observations: "Caught Draco at 11:00 PM trying to re-enter library"
- What they personally did: "Secured Draco's belongings, found letter"
- Sensory details: "Heard voices before crash"
- Relationships: "Draco is in my Potions class"

❌ **DON'T use witness.knowledge for**:
- Victim's identity ("Investigating Snape's petrification") - auto-provided
- Crime location ("Crime happened in library") - auto-provided
- Crime type ("Looking into the attack") - auto-provided

**Example**:

```yaml
# Case YAML structure
victim:
  name: "Severus Snape"
  cause_of_death: "Petrification curse from cursed object discharge"

locations:
  library:
    name: "Hogwarts Library - Restricted Section"
    # ... rest of location config

# Witness definition
witnesses:
  - id: "mcgonagall"
    name: "Professor Minerva McGonagall"
    knowledge:
      # ✅ SPECIFIC observations only
      - "Caught Draco trying to re-enter the library at 11:00 PM"
      - "Draco claimed he 'forgot a book' despite crime scene tape"
      - "Secured Draco's belongings, found Lucius's letter"

# What McGonagall's LLM prompt receives:
# == CASE CONTEXT (public knowledge) ==
# Victim: Severus Snape
# What happened: Petrification
# Where: Hogwarts Library - Restricted Section
#
# == YOUR KNOWLEDGE ==
# - Caught Draco trying to re-enter the library at 11:00 PM
# - Draco claimed he 'forgot a book' despite crime scene tape
# - Secured Draco's belongings, found Lucius's letter
```

---

### Witness Portrait System

**Purpose**: Provide visual immersion for each character without requiring complex YAML configuration.

**Convention-Based Approach**:
The system automatically looks for portrait images based on the witness `id` defined in the YAML.

1. **File Format**: `.png`
2. **File Name**: Must match the `id` of the witness exactly (e.g., `professor_vector.png`).
3. **Location**: `frontend/public/portraits/`

**Workflow for Designers**:
1. Generate or create a 16-bit pixel art portrait.
2. Ensure the witness ID in your `case_NNN.yaml` is something concise like `adrian_clearmont`.
3. Name your image file `adrian_clearmont.png`.
4. Drop it into `frontend/public/portraits/`.
5. The game will automatically detect and render the image in the interrogation modal.

**Graceful Fallback**:
If no image is found in the `portraits/` folder, the interface will automatically display a terminal-themed `?` placeholder. No code changes or YAML field updates are necessary to add new portraits.

---


### Timeline System

**Purpose**: Enable alibi checking and temporal reconstruction

**Structure**:
```yaml
timeline:
  - time: "9:30 PM"
    event: "Filch patrols past library entrance"
    witnesses: ["argus_filch"]  # Who can confirm
    evidence: ["checkout_log"]   # What proves it
```

**Guidelines**:
- Use consistent time format (e.g., "9:30 PM")
- Order chronologically
- Include crime timing explicitly
- Mark witnesses who can confirm each event
- Link to supporting evidence

**Used by**: Moody (alibi evaluation), Narrator (timeline references)

---

### Enhanced Solution Fields

**deductions_required** (optional, recommended):
- List of logical steps player must make
- Example:
  ```yaml
  - "Levitation scorch marks prove Wingardium Leviosa used"
  - "High power eliminates weak casters (Adrian) and non-magical (Filch)"
  - "Erased log entry at 10:15 PM connects to Vector's presence"
  ```

**correct_reasoning_requires** (optional, recommended):
- What player must understand conceptually
- Example:
  ```yaml
  - "Base rates: Most accidents are accidents (start with likely)"
  - "Timeline eliminates suspects with alibis"
  - "Magical capability limits suspect pool"
  ```

**common_mistakes** (optional, recommended):
- Errors players are likely to make
- Structure:
  ```yaml
  - error: "Accuse Flint"
    reason: "Obvious suspect, strong motive, scarf at scene"
    why_wrong: "Timeline proves he left before 9 PM"
  ```

**fallacies_to_catch** (optional, recommended):
- Logical fallacies to teach
- Structure:
  ```yaml
  - fallacy: "confirmation_bias"
    example: "Player locks onto Flint, ignores timeline evidence"
  ```

**Used by**: Moody (verdict evaluation, educational feedback)

---

### Case Identity Fields

**crime_type** (optional, recommended):
- One of: "murder", "theft", "corruption", "assault", "conspiracy"
- Sets tone and teaching focus
- Used by: Narrator (atmosphere)

**hook** (optional, recommended):
- One sentence that creates intrigue
- Goes on landing page (case.description)
- Good: "A brilliant Ravenclaw found dead under a collapsed bookshelf. Accident, or murder disguised?"
- Bad: "There was a death in the library." (too plain)

**twist** (optional, recommended):
- What subverts player's initial theory
- Example: "The obvious suspect (Flint) left before the crime. The real killer never physically touched the victim—used Wingardium Leviosa to stage an 'accident'."
- Used by: Narrator (foreshadowing), Moody (teaching moment)

---

## Field Requirement Levels

**[REQUIRED]**: Case won't load without it (validator fails)
- case.id, case.title, case.difficulty
- victim.name (if victim section present)
- witness.name, witness.personality
- solution.culprit

**[REQUIRED for complete cases]**: Not blocking, but needed for professional quality
- victim.age, victim.humanization, victim.memorable_trait
- witness.wants, witness.fears, witness.moral_complexity

**[OPTIONAL but recommended]**: Enhances case quality significantly
- evidence.significance, evidence.strength, evidence.points_to
- timeline section
- solution.deductions_required, solution.common_mistakes
- case.crime_type, case.hook, case.twist

**[OPTIONAL]**: Nice to have, not essential
- victim.time_of_death, victim.cause_of_death
- evidence.contradicts
- post_verdict.wrong_suspects (per-suspect responses)

---

## LLM Context Distribution

| Field | Witness LLM | Narrator LLM | Moody LLM | Tom LLM |
|-------|-------------|--------------|-----------|---------|
| wants/fears/moral_complexity | ✅ Core | ❌ | ✅ Feedback | ❌ |
| victim.humanization | ❌ | ✅ Crime scene | ✅ Context | ✅ Emotion |
| evidence.significance | ❌ | ✅ Subtle | ✅ Evaluation | ✅ Commentary |
| evidence.strength | ❌ | ❌ | ✅ Rating | ✅ Targets strong |
| solution fields | ❌ | ❌ | ✅ Teaching | ❌ |
| timeline | ❌ | ✅ Partial | ✅ Alibis | ❌ |

**Principle**: Each LLM gets only relevant context (efficiency + isolation)

---

## Examples

See `docs/case-files/CASE_002_RESTRICTED_SECTION.md` for complete implementation of all Phase 5.5 fields.

### Evidence Enhancement Example

```yaml
hidden_evidence:
  - id: "levitation_scorch_marks"
    name: "Levitation Scorch Marks"
    type: "magical"
    triggers:
      - "look up"
      - "examine ceiling"
      - "revelio"
    description: |
      Faint scorch marks on ceiling above bookshelf.
      Signature of high-powered Wingardium Leviosa.
    tag: "[EVIDENCE: levitation_scorch_marks]"

    # Phase 5.5 enhancements
    significance: "Proves Wingardium Leviosa used at high power"
    strength: 100
    points_to: ["professor_vector", "marcus_flint"]
    contradicts: ["filch_guilty", "adrian_guilty", "accident_theory"]
```

### Witness Psychological Depth Example

```yaml
witnesses:
  - id: "hannah_abbott"
    name: "Hannah Abbott"
    personality: "Nervous, people-pleaser, conflict-averse"
    background: "Hufflepuff third-year, friends with both victim and suspect"

    # Phase 5.5 enhancements
    wants: "Help investigation without betraying friend Marcus"
    fears: "Retaliation from Slytherins, being seen as snitch"
    moral_complexity: |
      Hannah saw something critical but doesn't want to betray Marcus,
      who helped her pass Potions last year. She's torn between loyalty
      to a friend and duty to justice. Her people-pleasing nature makes
      this internal conflict especially painful.

    knowledge:
      - "Saw Marcus near library around 10 PM"
    secrets:
      - id: "saw_marcus_with_wand"
        text: |
          I... I saw Marcus's wand. It was glowing—faintly, but I know what
          I saw. He was near the Restricted Section entrance around 10 PM.
          I didn't want to believe it, but the light was unmistakable.
        keywords: ["marcus", "wand", "glowing", "restricted section"]
```

### Timeline Example

```yaml
timeline:
  - time: "9:30 PM"
    event: "Filch patrols past library entrance"
    witnesses: ["argus_filch"]
    evidence: ["checkout_log"]

  - time: "9:47 PM"
    event: "Helena enters Restricted Section"
    witnesses: ["madam_pince"]
    evidence: ["checkout_log"]

  - time: "10:05 PM"
    event: "Loud crash heard from Restricted Section"
    witnesses: ["hannah_abbott", "adrian_clearmont"]
    evidence: ["bookshelf_collapse"]
```

### Enhanced Solution Example

```yaml
solution:
  culprit: "professor_vector"
  method: "Used Wingardium Leviosa to topple bookshelf"
  motive: "Helena discovered Vector's use of dark magic for research"
  key_evidence:
    - "levitation_scorch_marks"
    - "erased_log_entry"

  # Phase 5.5 enhancements
  deductions_required:
    - "Scorch marks prove levitation spell used (not accident)"
    - "Shelf positioned deliberately before being dropped"
    - "Helena's missing wand suggests killer took it"

  correct_reasoning_requires:
    - "Evidence of magical involvement (scorch marks)"
    - "Proof of premeditation (shelf positioning)"
    - "Alibi verification (Vector's lie)"

  common_mistakes:
    - error: "Accusing Marcus Flint"
      reason: "Presence near scene + hostile relationship with victim"
      why_wrong: "Alibi confirmed by multiple witnesses, no magical skill for levitation"

  fallacies_to_catch:
    - fallacy: "confirmation_bias"
      example: "Focusing only on Marcus's hostility, ignoring contradictory alibi evidence"
```

---

## Testing Your Case

1. Drop YAML in `backend/src/case_store/`
2. Restart server or call `GET /api/cases`
3. Check logs for validation warnings
4. Test case discovery: Landing page shows new case
5. Test evidence discovery: Triggers work
6. Test witness depth: wants/fears affect responses
7. Test verdict: Moody uses enhanced solution fields

---

## Common Pitfalls

❌ **Vague humanization**: "A student who died" → ✅ "You remember her from the library—always buried in wandlore texts..."

❌ **Generic wants/fears**: "Tell the truth" / "Being caught" → ✅ "Help investigation without betraying friend Marcus" / "Retaliation from Slytherins"

❌ **Strength not calibrated**: Guessing numbers → ✅ Use calibration scale (100=critical, 80=strong, 50=moderate)

❌ **Missing timeline**: Can't check alibis → ✅ Include key events with witnesses who can confirm

❌ **No common_mistakes**: Generic Moody feedback → ✅ Specific per-suspect wrong verdict responses

---

## Field Summary Table

| Field | Tier | Used By | Purpose |
|-------|------|---------|---------|
| victim.name | REQUIRED | All | Identify victim |
| victim.humanization | TIER 1 | Narrator, Moody, Tom | Emotional connection |
| witness.wants | TIER 1 | Witness LLM, Moody | Drive behavior |
| witness.fears | TIER 1 | Witness LLM, Moody | Inhibit honesty |
| witness.moral_complexity | TIER 1 | Witness LLM, Moody | Internal conflict |
| evidence.significance | TIER 1 | Narrator, Moody, Tom | Strategic importance |
| evidence.strength | TIER 1 | Moody, Tom | Quality rating |
| evidence.points_to | TIER 1 | Moody, Tom | Suspect implications |
| evidence.contradicts | TIER 2 | Moody, Tom | Theory elimination |
| timeline | TIER 2 | Narrator, Moody | Alibi checking |
| solution.deductions_required | TIER 2 | Moody | Teaching steps |
| solution.common_mistakes | TIER 2 | Moody | Per-suspect feedback |
| solution.fallacies_to_catch | TIER 2 | Moody | Logical fallacies |
| case.crime_type | TIER 2 | Narrator | Tone setting |
| case.hook | TIER 2 | Landing page | Intrigue |
| case.twist | TIER 2 | Narrator, Moody | Theory subversion |

---

**Version**: 1.0 (Phase 5.5)
**Last Updated**: 2026-01-13
**For**: Case designers creating professional-quality mysteries
