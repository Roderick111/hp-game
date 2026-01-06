# Auror Academy - Case Design Guide

Comprehensive guide for creating varied, engaging detective cases using the modular system.

---

## Table of Contents

1. [Crime Type Variety](#crime-type-variety)
2. [Module Templates](#module-templates)
   - [Victim Module](#victim-module)
   - [Location Module](#location-module)
   - [Suspect Module](#suspect-module)
   - [Witness Module](#witness-module)
   - [Evidence Module](#evidence-module)
   - [Solution Module](#solution-module)
   - [Post-Verdict Scene Module](#post-verdict-scene-module)
   - [Tom's Voice Module](#toms-voice-module)
3. [Magic System Implementation](#magic-system-implementation)
4. [Case Variation Rules](#case-variation-rules)
5. [Variation Checklist](#variation-checklist)

---

## Crime Type Variety

Cases cover diverse crimes across magical Britain:

```yaml
CRIME_TYPES:
  murder:
    - Locked room murder
    - Public assassination
    - Staged suicide
    - Magical duel gone wrong

  theft:
    - Gringotts vault heist
    - Ministry document theft
    - Magical artifact smuggling
    - Inside job

  corruption:
    - Bribery (Wizengamot, Ministry officials)
    - Embezzlement (Ministry funds)
    - Evidence tampering
    - Abuse of power

  assault:
    - Dark magic attack
    - Unforgivable Curse use
    - Revenge attack
    - Mistaken target

  conspiracy:
    - Coup plot
    - Insurgency planning
    - Frame job (innocent person set up)
    - Cover-up (hiding past crimes)
```

**Design Philosophy**:
- Variety prevents repetition
- Different crimes teach different rationality lessons
- No rigid difficulty classification (theft can be harder than murder)
- First case = murder (classic detective opening)

---

## Module Templates

### Victim Module

```yaml
victim:
  name: "Helena Blackwood"
  status: "deceased"  # deceased, alive, missing

  # Humanization (2-3 sentences woven into crime scene description)
  humanization: |
    Fourth-year Ravenclaw. You remember her from the library—always
    buried in wandlore texts, muttering about core resonance frequencies.
    Someone silenced that brilliant mind permanently.

  # Connection to player
  connection: "classmate"  # classmate, met_once, stranger, authority_figure
  memorable_trait: "Brilliant, obsessed with wandlore research"

  # For alive victims (theft, assault cases)
  # can_be_interviewed: true
  # knows: [...]
  # traumatized: true  # Affects testimony reliability
```

**Examples by Crime Type**:

```yaml
# Murder - Close connection
victim:
  name: "Helena Blackwood"
  humanization: "Fourth-year Ravenclaw. You remember her from the library..."
  connection: "classmate"

# Theft - Stranger, less emotional
victim:
  name: "Gringotts Vault 713"
  humanization: "High-security vault. Belongs to wealthy pureblood family."
  connection: "none"

# Assault - Alive victim
victim:
  name: "Marcus Bellweather"
  status: "alive"
  humanization: "Three Broomsticks regular. Survived Cruciatus attack."
  can_be_interviewed: true
  traumatized: true
```

---

### Location Module

```yaml
location:
  id: "ministry_archives"
  name: "Ministry of Magic - Record Room"
  type: "micro"  # macro (hub with exits), micro (specific room)

  # Natural description covering ALL examinable elements
  # No explicit "points of interest" list—everything flows naturally
  description: |
    You enter a cramped office in the Ministry Archives. Filing cabinets
    tower on three sides, stuffed with parchment organized by year.
    A small desk sits against the far wall, buried under file folders
    labeled "Budget Discrepancies" in neat script.

    Near the frost-covered window, the victim lies face-down in the
    papers, one arm outstretched toward a broken quill on the floor.
    The room smells of old parchment and something acrid—recently
    cast magic. The single door shows no signs of forced entry, lock intact.

  # What's visible without investigation
  surface_elements:
    - "Filing cabinets (3 walls, organized by year)"
    - "Desk covered in budget files"
    - "Victim's body near window, arm outstretched"
    - "Broken quill on floor"
    - "Window with frost, locked from inside"
    - "Door with intact lock"
    - "Acrid smell (recent magic)"

  # What requires specific examination
  hidden_evidence:
    - id: "hidden_note"
      triggers: ["under desk", "beneath desk", "search desk", "check drawers"]
      description: |
        Crumpled parchment shoved far under the desk. Someone wanted
        this hidden. Words "I know what you did" scrawled in hurried script.
      tag: "[EVIDENCE: Threatening Note]"

    - id: "missing_file"
      triggers: ["examine cabinets", "check files", "search for gaps", "revelio"]
      description: |
        A gap in the cabinet catches your eye—folder removed recently.
        Label reads "Budget Audit 2020" but folder is gone.
      tag: "[EVIDENCE: Missing File]"

  # Prevent LLM hallucination
  not_present:
    - triggers: ["secret passage", "hidden door", "escape route"]
      response: "The walls are solid stone. No hidden passages."

    - triggers: ["other bodies", "more victims", "witnesses"]
      response: "The victim appears to be alone. No one else here."

  # Magical investigation results
  available_spells:
    revelio: "The hidden note glows faintly. Gap in cabinet becomes obvious."
    priori_incantatem: "Requires finding a wand first."
    homenum_revelio: "No hidden persons detected."

  # Navigation (for macro locations only)
  exits: []  # Micro location—no sub-locations
  # For macro locations:
  # exits:
  #   - "Main Hall"
  #   - "Other Room"
```

**Location Granularity Structure**:

```yaml
# SIMPLE (2-level): Private House
locations:
  - id: "main_hall"
    name: "Blackwood Manor - Main Hall"
    type: "macro"
    exits: ["victim_study", "bedroom", "kitchen", "cellar"]

  - id: "victim_study"
    name: "Blackwood Manor - Study"
    type: "micro"
    description: "..."  # Full description, all evidence

# COMPLEX (3-level): Ministry Building
locations:
  - id: "ministry_atrium"
    name: "Ministry of Magic - Atrium"
    type: "macro"
    exits: ["dept_mysteries", "dept_law_enforcement", "courtrooms"]

  - id: "dept_mysteries"
    name: "Department of Mysteries"
    type: "macro"  # Department hub
    exits: ["hall_of_prophecy", "death_chamber", "time_room"]

  - id: "hall_of_prophecy"
    name: "Department of Mysteries - Hall of Prophecy"
    type: "micro"
    description: "..."  # Full description, all evidence
```

**Design Principles**:
- Description covers ALL examinable elements naturally (no explicit POI list)
- Player sees everything immediately; investigation = examining in detail
- No pixel hunting, no guessing keywords
- Hidden evidence = results of examination, not finding objects
- Flexible structure: 2-3 levels depending on location size

---

### Suspect Module

```yaml
suspect:
  id: "marcus_flint"
  name: "Marcus Flint"
  role: "Former Slytherin student"

  is_guilty: false  # Red herring

  # Character depth (makes suspects feel human)
  personality: "Aggressive, defensive, carries old grudges"
  wants: "Clear his name (knows he looks guilty)"
  fears: "Azkaban for crime he didn't commit"
  moral_complexity: |
    Flint's a bully, but not a murderer. His wand was used,
    but someone borrowed it. He's sympathetic in his panic
    despite being generally unpleasant.

  # Classic means/motive/opportunity
  motive:
    apparent: "Public argument with victim last week over grades"
    actual: "Argument was minor, unrelated to murder"

  means:
    has_wand: true
    knows_relevant_spells: true
    physical_capability: true

  opportunity:
    alibi: "Claims Three Broomsticks, 8-10pm"
    alibi_witness: "Barkeep Tom"
    alibi_strength: "verifiable"  # weak/verifiable/airtight

  # Evidence web
  evidence_against:
    - "wand_found_at_scene"
    - "witness_saw_him_nearby"
    - "public_argument_motive"

  evidence_for:
    - "alibi_receipt"  # If player finds it
    - "wand_timing_mismatch"
    - "second_wand_signature"

  # Relationships (simple - who knows who, natural connections)
  relationships:
    - character: "assistant"
      nature: "Classmates, not close"
      relevance: "Assistant could have borrowed his wand"

  # Interrogation behavior
  interrogation:
    initial_demeanor: "Defensive, aggressive, clearly scared"

    knowledge:
      knows:
        - "He was at Three Broomsticks that evening"
        - "His wand went missing for an hour"
        - "Victim gave him failing grade"
      doesnt_know:
        - "Who borrowed his wand"
        - "What actually happened to victim"

    secrets:
      - id: "wand_borrowed"
        trigger: "show wand evidence OR press about timeline"
        reveals: |
          "Fine! My wand was gone for an hour. I left it in the
          common room, came back, it was there again. I didn't
          think anything of it until now."
        emotional_cost: "Admits vulnerability (losing track of wand)"

    lies:
      - claim: "I was at Three Broomsticks the whole time"
        truth: "True, but initially forgets 30-minute gap"
        exposed_by: "Timeline questioning, bartender specific times"
```

**Character Archetypes** (mix freely, not rigid templates):
- **Obvious culprit**: All evidence points here, but they're innocent
- **Sympathetic guilty**: Likeable person who actually did it
- **Red herring**: Suspicious behavior, unrelated reason
- **Hidden connection**: Seems uninvolved, actually central
- **Accomplice**: Helped real culprit, didn't do crime directly

---

### Witness Module

```yaml
witness:
  name: "Hannah Abbott"
  role: "Student"
  personality: "Nervous, people-pleaser, conflict-averse"

  # Character depth (makes witnesses feel human)
  wants: "Help investigation without getting friends in trouble"
  fears: "Retaliation from Slytherins if she names names"
  moral_complexity: |
    Hannah saw something important but doesn't want to betray
    someone who helped her before. She's not malicious—just
    caught between loyalty and truth.

  interrogation:
    initial_demeanor: "Helpful but evasive, wringing hands"

    knowledge:
      knows:
        - "Saw someone near library at 8pm"
        - "Heard argument earlier that day"
        - "Flint helped her pass Potions last year"
      doesnt_know:
        - "Who actually committed the murder"
        - "Content of the hidden note"

    secrets:
      - id: "saw_flint_clearly"
        trigger: "legilimency OR show contradicting evidence OR gain trust"
        reveals: |
          "Okay, yes, I saw Marcus clearly. He looked nervous,
          kept glancing around. I didn't say anything because he
          tutored me last year when I was failing. I owe him."
        emotional_cost: "Cries, feels like she's betraying a friend"

    lies:
      - claim: "I only passed by briefly, didn't see much"
        truth: "She lingered and observed for several minutes"
        exposed_by: "Details she knows that brief pass-by wouldn't reveal"

    contamination_risk: false  # Did she talk to other witnesses?

  reliability: "honest_but_biased"  # reliable, unreliable_honest, lying, contaminated
```

**Witness Types** (mix freely):
- **Reliable**: Tells truth, good memory, no bias
- **Unreliable honest**: Thinks they're telling truth, but wrong
- **Protecting someone**: Lying to protect loved one
- **Contaminated**: Heard story from others, thinks they saw it
- **Opportunist**: Lying for personal gain unrelated to crime

---

### Evidence Module

```yaml
# Standard evidence piece
evidence:
  - id: "hidden_note"
    type: "physical"  # physical, testimonial, magical, documentary

    location: "library"
    triggers: ["under desk", "beneath desk", "search desk"]

    description: |
      Crumpled parchment with threatening words: "I know what you did."
      The handwriting is hurried, angry.

    surface_meaning: "Someone was threatening the victim"

    deeper_analysis:
      - "Handwriting analysis → matches suspect X"
      - "Paper type → same as victim's journal (victim wrote it?)"
      - "Could be planted to mislead"

    connects_to:
      - evidence: "victim_journal"
        how: "Same paper type"
      - suspect: "flint"
        how: "Handwriting analysis possible"

# Complication evidence (contradicts obvious theory)
complication_evidence:
  id: "alibi_receipt"
  type: "documentary"

  when_discoverable: "After player has 4-5 evidence pieces pointing at Flint"

  location: "flint_dormitory"  # Requires investigating obvious suspect's space
  triggers: ["search room", "check desk", "examine papers"]

  description: |
    Timestamped receipt from Three Broomsticks: Marcus Flint,
    8:00-10:00pm. Bartender's magical signature confirms authenticity.
    Cannot be faked.

  contradicts: "Flint was at crime scene theory"
  forces_question: "If not Flint, then who used his wand?"

  rationality_lesson: "Don't ignore evidence that contradicts your theory"
```

**Evidence Pattern Examples**:

```yaml
# Linear chain (beginner)
evidence:
  - id: "wand_at_scene" → leads_to: "wand_timing"
  - id: "wand_timing" → leads_to: "second_signature"
  - id: "second_signature" → leads_to: "assistant_motive"

# Web pattern (intermediate)
evidence:
  - id: "financial_records" ────┐
  - id: "witness_testimony" ────┤→ All point to same culprit
  - id: "magical_signature" ────┘

# Elimination (intermediate)
evidence:
  - id: "suspect_a_alibi" → Exonerates A
  - id: "suspect_b_alibi" → Exonerates B
  - Therefore: Suspect C is guilty (prove it)
```

---

### Solution Module

```yaml
solution:
  culprit: "assistant_character"

  # Truth (what actually happened)
  timeline:
    - "7:30pm - Assistant borrows Flint's wand from common room"
    - "8:00pm - Flint arrives at Three Broomsticks (alibi begins)"
    - "8:15pm - Assistant confronts victim in library"
    - "8:20pm - Argument escalates, assistant casts Stupefy"
    - "8:25pm - Assistant stages scene, returns wand to common room"
    - "9:00pm - Body discovered"

  motive: "Victim discovered assistant's academic fraud"
  method: "Borrowed Flint's wand to frame him, cast Stupefy, staged scene"

  # What player must prove
  critical_evidence:
    required:  # Must cite these
      - "wand_timing_mismatch"
      - "second_wand_trace"
      - "flint_alibi"
    supporting:  # Strengthens case
      - "motive_letter"
      - "assistant_opportunity"

  correct_reasoning:
    must_establish:
      - "Flint's wand timing doesn't match death time"
      - "Flint has airtight alibi (can't have used his own wand)"
      - "Someone else borrowed the wand"
      - "Assistant had motive (fraud discovery) AND opportunity"

  # Mentor feedback templates
  common_mistakes:
    - wrong_suspect: "flint"
      error: "Accusing Flint based on wand location"
      fallacy: "Circumstantial evidence as proof"
      moody_response: |
        "His wand, so he's guilty? What about the alibi receipt?
        What about the timing mismatch? You saw what you expected
        to see. CONFIRMATION BIAS."

    - wrong_suspect: "flint"
      error: "Trusting witness testimonies that corroborate"
      fallacy: "Witness contamination"
      moody_response: |
        "Two people saw him near the library, so case closed?
        Did those witnesses talk to each other first? Did someone
        feed them the same story? CONSTANT VIGILANCE means questioning
        everything."
```

---

### Post-Verdict Scene Module

```yaml
post_verdict:
  # After correct verdict only
  culprit_reaction: "remorseful"  # defiant, remorseful, broken, angry, resigned

  confrontation:
    - speaker: "assistant"
      line: |
        "I didn't mean for it to go that far. I just wanted him
        to stop. He was going to destroy my career over one mistake."

    - speaker: "player"
      options:
        - "That doesn't justify murder."
        - "[Say nothing]"
        - "I understand why you did it."

    - speaker: "assistant"
      line: |
        "I know! You think I don't know that? I borrowed Flint's
        wand thinking I'd just scare him. But he fought back and
        I panicked and—" [breaks down]

    - speaker: "moody"
      line: |
        "Take her to holding." [Watches her led away, turns to player]
        "Good work. But don't confuse understanding with sympathy.
        She made her choice."

  aftermath: |
    Case Status: SOLVED
    Attempts Used: 3/10

    The assistant confessed fully after confrontation. Sentenced
    to 12 years in Azkaban for manslaughter (not premeditated murder).

    Flint's name was cleared. The victim's family was notified.
```

**Culprit Reaction Examples**:

```yaml
# Defiant
culprit_reaction: "defiant"
confrontation:
  - speaker: "culprit"
    line: "So what? He had it coming. You'd have done the same."

# Broken
culprit_reaction: "broken"
confrontation:
  - speaker: "culprit"
    line: "[Silent sobbing. Can't even look at you.]"

# Angry
culprit_reaction: "angry"
confrontation:
  - speaker: "culprit"
    line: "This is YOUR fault! If you'd looked the other way..."
```

---

### Tom's Voice Module

**WHO:** Thomasin "Tom" Thornfield - Ghost of failed Auror recruit who haunts the Academy.

**PURPOSE:** Provides player with investigative thoughts that are 50% helpful (Socratic rational thinking) and 50% misleading (plausible but wrong). Player must learn to evaluate advice, not blindly trust.

**PERSONALITY:** Self-aware disaster. Enthusiastic but repeats the mistakes that got him killed. Sometimes brilliant, sometimes confidently wrong—both sound equally reasonable.

#### Trigger Structure

```yaml
tom_voice_triggers:
  # Each trigger should have BOTH helpful and misleading variants
  # System randomly selects which type (50/50 split)

  trigger_name:
    condition: "specific_game_state"

    helpful_version:
      type: "socratic"
      text: "Asks question that prompts rational thinking"

    misleading_version:
      type: "plausible_wrong"
      text: "Makes convincing argument that leads astray"
```

#### Writing Guidelines

**HELPFUL Tom (Socratic Rational Thinking):**
```yaml
DO:
  - Ask questions that guide discovery
  - Prompt player to check assumptions
  - Model systematic thinking
  - Point out inconsistencies naturally

DON'T:
  - Give direct answers
  - Sound like a teacher/lecture
  - Use pedagogical language
  - Break immersion with meta-commentary

EXAMPLES:
  GOOD: "Scorch marks on the ceiling. What kind of spell makes that
         pattern? That'll tell you who could've cast it."

  BAD:  "Ask yourself: what spell creates scorch marks? This is
         called deductive reasoning."
```

**MISLEADING Tom (Plausible But Wrong):**
```yaml
DO:
  - Use real investigative concepts incorrectly
  - Sound professional and experienced
  - Make arguments that seem logical
  - Lead to wrong conclusions subtly

DON'T:
  - Be obviously stupid/wrong
  - Contradict himself immediately
  - Sound incompetent
  - Make player distrust ALL advice

EXAMPLES:
  GOOD: "Three witnesses saw him near the library. That's corroboration.
         Independent witnesses agreeing makes testimony stronger."
         [Sounds right, but doesn't check if witnesses contaminated each other]

  BAD:  "I'm SURE it's this guy! Just like I was sure in Case #2
         when I was completely wrong!"
         [Obviously unreliable, player won't be fooled]
```

#### Example Trigger Pairs

**Finding Physical Evidence:**
```yaml
evidence_found_flints_wand:
  condition: "player_examines(flints_wand) AND at_crime_scene"

  helpful:
    text: "Flint's wand at the scene. What would need to be true for Flint
           to be the killer? He'd need to be here at the time of death.
           So when did she die, and where was he?"

  misleading:
    text: "Flint's wand at the scene. Physical evidence placing him at the
           location. That's usually enough for a conviction—motive plus means."
```

**Meeting Witness:**
```yaml
witness_testimony_hannah:
  condition: "interrogating(hannah_abbott) AND hannah_cooperative"

  helpful:
    text: "She seems certain she saw Flint. How certain can she actually be?
           What was the lighting like? How far away was she?"

  misleading:
    text: "She knew Flint from class, recognized him immediately. Familiar
           faces are easier to identify correctly than strangers."
```

**Finding Contradiction:**
```yaml
alibi_contradicts_theory:
  condition: "has(flint_alibi) AND player_suspects(flint)"

  helpful:
    text: "Magical timestamp on this receipt. Can those be faked? That's
           the question. If they can't, this changes everything."

  misleading:
    text: "Alibi shows he was at the pub. But time of death is approximate—
           she could've died earlier or later. Don't let one piece override
           the bigger picture."
```

#### Rare Special Triggers (5-10% activation)

**Self-Aware Moments:**
```yaml
tom_self_awareness:
  condition: "player_repeating_toms_mistake"
  rarity: 0.05

  examples:
    - "Oh no. You're doing what I did in Case #1. Please don't.
       It didn't end well for me."

    - "I jumped to that conclusion in Case #2. Arrested the wrong
       person. Don't be me."
```

**Dark Humor:**
```yaml
tom_death_jokes:
  condition: "examining_dangerous_location OR walking_on_old_floors"
  rarity: 0.03

  examples:
    - "Check the floor before you walk. Trust me on that one."

    - "I was so focused on being right, I didn't notice the rotted
       floorboards. Very embarrassing way to die."
```

**Emotional Moments:**
```yaml
tom_marcus_regret:
  condition: "about_to_convict_someone OR high_confidence_wrong_suspect"
  rarity: 0.02

  examples:
    - "[quiet] Marcus Bellweather is still in Azkaban because of me.
       Please don't add another name to that list."

    - "I sent an innocent man to prison because I was too confident.
       Too sure. Just... be careful."
```

#### Integration Checklist

When designing Tom's triggers for a case:

```
☐ Each major evidence piece has BOTH helpful and misleading triggers
☐ Helpful triggers ask questions, don't give answers
☐ Misleading triggers sound professional and plausible
☐ Both types are indistinguishable in tone
☐ Include 1-2 rare self-aware moments tied to case events
☐ Triggers fire at natural investigation moments
☐ Tom references his own failures when relevant
☐ No explicit teaching or meta-commentary
```

#### Common Trigger Conditions

```yaml
evidence_triggers:
  - first_evidence_found
  - critical_evidence_discovered
  - contradictory_evidence_found
  - pattern_noticed_across_evidence

witness_triggers:
  - meeting_cooperative_witness
  - witness_stories_match
  - witness_seems_nervous
  - multiple_witnesses_available

theory_triggers:
  - player_forming_theory (3+ evidence)
  - player_high_confidence (focusing on one suspect)
  - player_about_to_submit_verdict
  - player_ignoring_contradiction

location_triggers:
  - examining_crime_scene
  - finding_hidden_evidence
  - noticing_physical_details
  - environmental_clues
```

---

## Magic System Implementation

> **Reference**: See [WORLD_AND_NARRATIVE.md - Magic System](WORLD_AND_NARRATIVE.md#magic-system-for-investigations) for full system details.

### Core Spells Available

**Basic Investigation** (Cases 1+):
- `revelio` - Reveals hidden objects/marks
- `homenum_revelio` - Detects hidden persons
- `specialis_revelio` - Identifies substances
- `lumos` - Illumination, forensic variants

**Forensic Magic** (Cases 1+):
- `prior_incantato` - Shows wand's last spells
- `reparo` - Repairs broken objects

**Restricted** (Cases 4+ with heavy consequences):
- `legilimency` - Reads thoughts (requires consent/authorization)

### Implementing Spell Contexts in Cases

**Method 1: Pre-Define Common Actions** (Recommended)

```yaml
# In case file, define expected spell uses:

spell_contexts:
  revelio:
    victims_study:
      works: true
      reveals: "hidden compartment behind bookshelf containing journal"
      narration: |
        Your wand movement reveals a faint seam behind the bookshelf.
        The wood shimmers—a concealment charm. You cancel it and find
        a hidden compartment containing a leather-bound journal.

    suspects_office:
      works: true
      reveals: "nothing (office is clean)"
      narration: |
        You cast Revelio throughout the office. No magical signatures,
        no hidden compartments. Either the suspect is genuinely innocent,
        or they're very good at covering their tracks.

  prior_incantato:
    victims_wand:
      result: "Protego → Expelliarmus → (wand destroyed)"
      narration: |
        The broken wand barely responds, but you catch ghostly echoes:
        Protego—the victim tried to shield. Then Expelliarmus—they were
        disarmed. Then the wand shattered. They never got to fight back.

  homenum_revelio:
    manor_search:
      result: "detects suspect hiding in cellar"
      narration: |
        You cast Homenum Revelio. A faint pulse from below—someone's
        in the cellar. They're not as alone as they claimed.
```

**Method 2: LLM Handles Creative Attempts**

```yaml
# LLM evaluates unexpected spells using general rules from WORLD_AND_NARRATIVE.md
# No need to pre-define every possibility

# Case designer just ensures:
general_guidelines:
  wards_present: true  # Alerts if player tries Accio or unauthorized magic
  legal_status: "no_warrant"  # LLM knows evidence inadmissible if illegal
  suspect_training:
    john_doe: "occlumency"  # LLM knows Legilimency will fail/backfire
```

### Risk/Reward Examples

**Example 1: Legal Risk (Warrant Issue)**

```yaml
scenario: "Player wants to summon evidence from suspect's warded home"

case_context:
  location: "outside_suspects_manor"
  legal_status: "no_warrant"
  wards_present: true

llm_response: |
  You point your wand toward the manor, about to cast Accio.

  Then you pause. The house is clearly warded—you can see the shimmer.
  Summoning something would trigger alarms.

  More importantly: no warrant. Evidence obtained illegally = inadmissible.

  MOODY: "Get a warrant first, recruit. Do it properly."

  > Get warrant (legal, takes time, suspect might hide weapon)
  > Cast anyway (illegal, immediate, case gets dismissed)
  > Find informant to verify weapon's there first
```

**Example 2: Skill Risk (Occlumency Block)**

```yaml
scenario: "Player attempts Legilimency on trained suspect"

suspect_context:
  name: "Augustus Rookwood"
  background: "former Death Eater, Occlumency master"

llm_response: |
  You focus your mind and push into Rookwood's thoughts.

  His mental shields slam into you like a wall. Sharp pain lances
  through your skull. Vision blurs. You stagger back.

  ROOKWOOD: [Smirks] "You're not skilled enough, Auror."

  MOODY: "Told you. Occlumens are dangerous for the caster."

  [Learned: Rookwood has Occlumency = suspicious, but no evidence gained]
```

**Example 3: Ethical Risk (Cooperative Witness)**

```yaml
scenario: "Player considers Legilimency on helpful witness"

witness_context:
  name: "Hannah Abbott"
  state: "cooperative, nervous, hiding something minor"

llm_response: |
  You consider using Legilimency on Hannah. She's nervous, clearly
  hiding something.

  MOODY: "She's cooperative. You really need to violate her mind?
  Or just ask better questions?"

  Using Legilimency without asking would damage trust.

  > Ask permission first (she consents, reveals crush on suspect)
  > Force it (she feels violated, refuses further cooperation)
  > Just question naturally (build rapport, she opens up later)
```

### Progression-Based Access

```yaml
cases_1-3:
  allowed_spells: [revelio, homenum_revelio, specialis_revelio, lumos, prior_incantato, reparo]
  legilimency: "Forbidden - Moody shuts it down immediately"

cases_4-6:
  allowed_spells: [all basic + spell_variations]
  legilimency: "Can request authorization (rarely granted, must justify)"
  creative_uses: "Encouraged (Aguamenti for blood patterns, etc.)"

cases_7-10:
  allowed_spells: [full toolkit]
  legilimency: "Can attempt but player understands consequences"
  wisdom: "Player knows when NOT to use magic"
```

### Case Design Guidelines

**DO:**
- Pre-define outcomes for obvious spell uses (Revelio in crime scene)
- Include risks for restricted magic (wards, Occlumency, legal issues)
- Reward creative spell use (Aguamenti revealing cleaned blood)
- Make Moody teach lessons through consequences

**DON'T:**
- Make magic solve cases instantly
- Block spells without explanation
- Forget legal consequences (warrants, authorization)
- Let player skip deduction by using magic

### Example: Complete Spell Implementation

```yaml
case_3_ministry_clerk_murder:

  crime_scene: "victim's_office_ministry"

  spell_contexts:
    revelio:
      office:
        reveals: "hidden envelope under desk drawer (blackmail evidence)"

    prior_incantato:
      victims_wand:
        result: "Stupefy (cast at attacker), then wand taken"
        implication: "Victim tried to defend, was disarmed, then killed"

    specialis_revelio:
      tea_cup:
        result: "traces of Veritaserum (victim was interrogated before death)"

    homenum_revelio:
      office:
        result: "no one hiding (crime happened hours ago)"

    legilimency:
      prime_suspect:
        difficulty: "moderate"
        risk: "suspect is Ministry official - political consequences"
        moody_blocks: "Need authorization. This is a Ministry official, recruit."

  wards:
    present: false  # Ministry office, no personal wards

  legal_status: "full_access"  # Ministry crime scene, official investigation

  creative_opportunities:
    reparo_on_shattered_photo_frame:
      reveals: "photo of victim with Yaxley (connection to conspiracy)"
      moody_reaction: "Good thinking. Reparo isn't just for fixing things."
```

### Auror's Handbook Reference

**Remind players of available spells:**

```yaml
tutorial_moments:
  case_1_scene_1:
    moody_briefing: |
      MOODY: "Here's your toolkit: Revelio reveals hidden objects.
      Homenum Revelio finds hidden people. Prior Incantato shows a
      wand's last spells. Specialis Revelio identifies substances.

      Six spells. Master them. Constant vigilance."

  case_4_intro:
    moody_warning: |
      MOODY: "You can REQUEST Legilimency authorization now. But you
      better have a damn good reason. And if the suspect has Occlumency?
      You'll regret it."

  handbook_access:
    always_available: "Menu: 'Review Auror Handbook'"
    contains: "All 6 core spells with usage examples"
```

---

## Case Variation Rules

### Rule 1: Vary Complexity Through Numbers

**Simple case**:
- 2-3 suspects
- 1-2 witnesses
- 5-7 evidence pieces
- 1-2 locations
- 1 red herring

**Complex case**:
- 4-6 suspects
- 3-4 witnesses
- 10-12 evidence pieces
- 4-6 locations
- 2-3 red herrings

**Principle**: More components = more complexity. Scale naturally.

---

### Rule 2: Vary Investigation Structure

**Linear** (beginner):
```
Evidence A → Evidence B → Evidence C → Solution
Sequential discovery, straightforward chain
```

**Web** (intermediate):
```
Location 1 → Evidence A ────┐
                            ├──→ Solution
Location 2 → Evidence B ────┤
                            │
Witness → Evidence C ───────┘
Multiple threads converge
```

**Elimination** (intermediate):
```
3 suspects, each with apparent motive
Evidence 1 → exonerates Suspect A
Evidence 2 → exonerates Suspect B
Therefore Suspect C (prove it)
```

**Contradiction Resolution** (advanced):
```
Evidence A: X happened at 8pm
Evidence B: X happened at 9pm
Both seem reliable → contradiction
Resolution: Polyjuice/Time-Turner/misidentification
```

---

### Rule 3: Vary Emotional Tone

**Dark/Serious**:
- Victim: Someone player knew well
- Culprit: Cruel motive
- Stakes: High (multiple victims, dark magic)

**Morally Complex**:
- Victim: Flawed person (corrupt, cruel)
- Culprit: Sympathetic motive, wrong choice
- Stakes: Medium (personal vendetta)

**Light/Puzzle**:
- Victim: Object stolen, or stranger
- Culprit: Professional thief, no malice
- Stakes: Low (property, no deaths)

**Principle**: Victim humanization + culprit motivation = tone.

---

### Rule 4: Vary Misdirection Methods

Don't repeat same tricks:

```
Case 1: Planted evidence (obvious suspect's wand at scene)
Case 2: Timeline manipulation (Time-Turner, Polyjuice duration)
Case 3: Unreliable witnesses (coordinated false story)
Case 4: Motive subversion (theft for evidence, not money)
Case 5: Red herring character (suspicious for unrelated reason)
```

**Principle**: Each case teaches different skepticism.

---

### Rule 5: Vary Crime + Location Combinations

```
Murder + Locked Room = Classic puzzle (how?)
Murder + Public = Timeline (when?)
Murder + Multi-Location = Chase (where?)

Theft + Gringotts = Heist (bypass security?)
Theft + Ministry = Inside job (who had access?)

Corruption + Ministry = Document trail (follow money)
Corruption + Wizengamot = Legal conspiracy (who benefits?)
```

**Principle**: Same crime, different location = different feel.

---

### Rule 6: Vary Complication Timing

**Early** (after 2-3 evidence):
- Player forms wrong theory quickly
- Complication forces early rethink
- Teaches: Don't jump to conclusions

**Mid** (after 5-6 evidence):
- Player confident in theory
- Complication shatters confidence
- Teaches: Update beliefs with new evidence

**Late** (after 8-9 evidence):
- Player almost ready to submit
- Last-minute revelation changes everything
- Teaches: Keep investigating

**Principle**: Vary timing for different pacing.

---

### Rule 7: Vary Witness Configuration

```
Case 1: 1 reliable witness (can trust, but still corroborate)
Case 2: 2 contaminated witnesses (discussed story first)
Case 3: 1 liar + 1 honest (determine who's truthful)
Case 4: No witnesses (only physical evidence)
Case 5: Victim alive (traumatized testimony)
```

**Principle**: Change reliability patterns each case.

---

### Rule 8: Balance Red Herrings

- **Simple**: 1 red herring (innocent suspect OR irrelevant evidence)
- **Medium**: 2 red herrings (innocent suspect + planted evidence)
- **Complex**: 3 red herrings (multiple layers)

**Too many** = frustrating
**Too few** = too easy

**Principle**: Player can rule them out through thorough investigation.

---

### Rule 9: Vary Location Patterns

```
Case 1: Private house (4 rooms)
Case 2: Ministry (8 locations, 3 levels)
Case 3: Diagon Alley (3 separate buildings)
Case 4: Single room (Gringotts vault)
Case 5: Moving location (Hogwarts Express)
Case 6: Outdoor + indoor (Forbidden Forest + cabin)
```

**Principle**: Location variety prevents repetition.

---

### Rule 10: Hook + Twist Pairing

Every case needs:

**Hook** (Act 1 - immediate intrigue):
- Locked room with no entry
- Victim requested files day before "suicide"
- Thief left more gold than they stole
- Three witnesses saw different culprits

**Twist** (Act 2/3 - subverts expectations):
- Victim let killer in (knew them)
- Was investigating corruption
- Wanted evidence, not money
- All lying, or Polyjuice used

**Principle**: Hook creates question. Twist answers unexpectedly.

---

## Variation Checklist

When designing new case, **vary at least 3-5 of these**:

```
☐ Number of suspects (2-6)
☐ Number of witnesses (0-4)
☐ Crime type (murder, theft, corruption, assault, conspiracy)
☐ Location structure (single room, house, large building, multi-location)
☐ Investigation pattern (linear, web, elimination, contradiction)
☐ Misdirection method (planted evidence, timeline, witnesses, motive, character)
☐ Emotional tone (dark, morally complex, light)
☐ Complication timing (early, mid, late)
☐ Red herring count (1-3)
☐ Location setting (Hogwarts, Ministry, Diagon Alley, Gringotts, private home, etc.)
```

**If you vary 3-5 dimensions**, case will feel fresh.

---

## Tom's Voice Checklist

When designing Tom's triggers for a case:

```
☐ 4-6 evidence triggers (BOTH helpful and misleading versions)
☐ 2-3 witness/interrogation triggers
☐ 2-3 theory-building triggers
☐ 1 "before verdict" trigger (helpful version prompts self-check)
☐ 1-2 rare self-aware moments (tied to Tom's past failures)
☐ 1 rare emotional moment (if case involves wrongful conviction theme)
☐ Helpful triggers ask Socratic questions, don't give answers
☐ Misleading triggers sound professional and plausible
☐ Both types indistinguishable in tone and naturalness
☐ Triggers fire at investigation moments, not randomly
☐ No explicit teaching or breaking the fourth wall
```

---

## Example: Complete Case Skeleton

```yaml
case:
  id: "gilded_heist"
  title: "The Gilded Heist"

  # CORE IDENTITY
  crime_type: "theft"
  hook: "Thief left 100 galleons while stealing worthless ledger"
  twist: "Ledger contains evidence of goblin embezzlement; thief was whistleblower"

  # SETTING
  location_structure: "large_building"
  locations:
    - Gringotts main hall (macro)
    - Vault corridor (micro)
    - Vault 713 (micro - crime scene)
    - Employee break room (micro)

  # CHARACTERS
  victim:
    name: "Vault 713"
    status: "property"
    humanization: "High-security vault belonging to wealthy family"

  suspects:
    - Senior curse-breaker (red herring - had argument with manager)
    - Security guard (obvious suspect - on duty)
    - Junior curse-breaker (actual culprit - sympathetic)
    - Goblin manager (suspicious - hiding embezzlement)

  witnesses:
    - Guard (contaminated - heard story from manager)
    - Customer (reliable - saw someone in corridor)

  # EVIDENCE (6 pieces)
  evidence:
    - Vault entry log (shows access times)
    - 100 galleons left behind (confusing motive)
    - Ledger contents (reveals embezzlement)
    - Maintenance schedule (shows opportunity)
    - Magical signature (identifies curse-breaker level magic)
    - Junior's father's termination letter (establishes motive)

  complication_evidence:
    id: "entry_log_impossible_time"
    contradicts: "Guard couldn't have done it (wrong skill level)"

  # SOLUTION
  solution:
    culprit: "aria_blackwood"
    motive: "Expose embezzlement that cost her father his job"
    method: "Used maintenance access during shift change"

  # NARRATIVE
  post_verdict:
    culprit_reaction: "defiant"
    aftermath: "Sentenced for theft, but embezzlement exposed"

  # TOM'S VOICE TRIGGERS
  tom_triggers:
    # Evidence triggers
    - id: "found_galleons"
      condition: "player_examines(100_galleons)"
      helpful: "100 galleons left behind. Why would a thief LEAVE money? What were they actually after?"
      misleading: "Thief probably got spooked, dropped the gold while escaping. Focus on who had access."

    - id: "found_ledger"
      condition: "player_reads(ledger_contents)"
      helpful: "Embezzlement evidence. So this wasn't about stealing gold—it was about stealing PROOF. Who benefits from exposing this?"
      misleading: "Financial records. Could be valuable on the black market. Lots of people would pay for insider information."

    - id: "guard_testimony"
      condition: "interrogating(security_guard)"
      helpful: "He's very certain about the timeline. How does he know the exact time? Was he watching constantly, or did someone tell him?"
      misleading: "Security guard saw everything. That's his job—he's trained to observe. His testimony should be reliable."

    # Theory triggers
    - id: "suspecting_guard"
      condition: "player_suspects(guard) AND has(3+_evidence)"
      helpful: "Guard had access and opportunity. But did he have the SKILL? What level of magic did this theft require?"
      misleading: "Inside job. Guard had access, knew the schedule. When you eliminate the impossible, whoever remains must be the thief."

    - id: "before_verdict"
      condition: "about_to_submit_verdict"
      helpful: "You're about to accuse someone of theft. What's your weakest piece of evidence? What assumption are you making?"
      misleading: "You've investigated thoroughly. Sometimes cases really are as simple as they appear. Trust your evidence."

    # Rare triggers
    - id: "self_aware_moment"
      condition: "player_high_confidence_wrong_suspect"
      rarity: 0.05
      text: "I was this confident in Case #2. Turned out I'd arrested the victim. Maybe... double-check?"

    - id: "emotional_moment"
      condition: "about_to_convict_innocent"
      rarity: 0.02
      text: "[quiet] Please verify one more time. Marcus Bellweather looked guilty too. I was so sure."

  # Variation dimensions used:
  # - Crime: theft (not murder)
  # - Tone: morally complex (sympathetic thief)
  # - Misdirection: motive subversion (not after gold)
  # - Location: large building (Gringotts)
  # - Investigation: web pattern (multiple threads)
```

---

*"Variety is the spice of investigation." - Case Design Philosophy*
