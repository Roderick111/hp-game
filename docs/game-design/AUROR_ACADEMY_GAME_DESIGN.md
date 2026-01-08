# Auror Academy - Game Design Document

## Overview

**Title:** Auror Academy
**Genre:** Detective Visual Novel / Rationality Training Game
**Setting:** Harry Potter Universe
**Platform:** Web-based (Python backend + simple frontend)
**LLM:** Claude Haiku
**Multiplayer:** No (single-player only)

### Core Concept

A detective game where players solve magical crimes as Auror trainees. The game teaches rationality and logical thinking through investigation mechanics, with an emphasis on Bayesian reasoning and identifying logical fallacies.

Players investigate diverse cases—murders, thefts, corruption, conspiracies—across magical Britain. Training begins with historical cases, building toward real investigations and uncovering institutional corruption within the Ministry itself.

### Design Pillars

1. **Player-driven deduction** - No handholding; player decides what to investigate and when to submit verdict
2. **Failure as content** - Wrong answers lead to narrative consequences, not blocked progress
3. **Rationality through play** - Learn logical thinking by doing, not by reading
4. **Immersive investigation** - DnD-style freeform exploration via LLM narrator
5. **Respect player intelligence** - No highlighted clues, no "correct path" markers

### Reference Games

| Game | What We Take |
|------|--------------|
| **Return of the Obra Dinn** | Player decides when "enough" evidence; self-assessment; no batching |
| **Disco Elysium** | Failure as content; inner voice system; narrative consequences |
| **Ace Attorney** | Evidence presentation; witness interrogation; theatrical payoff |

---

## Player Character

### Minimal Characterization

**Background** (one paragraph intro):
```
You're a recent Hogwarts graduate, first year at Auror Academy.
Mad-Eye Moody is your training supervisor. These are historical
cases—closed investigations you'll solve to prove you can think
like an Auror. Moody's watching. Constant vigilance.
```

**Design Philosophy**:
- Minimal characterization to maintain focus on learning/deduction
- Simple background provides context without complexity
- Character progression shown through Moody's changing feedback tone
- Link between cases through training progression

**Name**: Player chooses or accepts default

**Character Arc** (through Moody's feedback):
```
Early cases: "Pathetic, recruit"
Mid cases: "Better. Still sloppy."
Late cases: "Acceptable work"
Meta-cases: "You're thinking like an Auror now"
```

---

## Overarching Narrative Thread

> **📖 Full Details**: See [WORLD_AND_NARRATIVE.md](WORLD_AND_NARRATIVE.md) for complete world design, location catalog, organizations, recurring characters, and consistency guidelines.

### Training Cases → Real Cases

**Structure**:
```
CASES 1-8: Historical Training Cases
├─ Self-contained investigations
├─ Explicitly framed as "Academy training exercises"
├─ Moody assigns: "This happened X years ago. Solve it."
└─ Diverse crime types, locations, complexity

CASE 9: Pattern Recognition
├─ Player may notice: previous cases share odd details
├─ Optional discovery (rewards attentive players)
├─ Moody: "Good eye. Keep that to yourself."
└─ Hints at institutional corruption

CASE 10: Meta-Investigation
├─ Investigate why certain cases were selected for training
├─ Reveals: Ministry official buried evidence, miscarried justice
├─ Training was a test: Would you expose corruption or follow orders?
└─ Transition: "Training's over. Time for real work."

CASES 11+: Real Field Cases (expansion content)
├─ Active investigations, real stakes
├─ Player applies everything learned
└─ Ongoing institutional corruption subplot
```

**Institutional Corruption Theme**:
- Cases 1-8 appear to be random historical training
- Case 9 reveals pattern: some cases were wrongly closed
- Case 10 exposes: Ministry official covered up evidence to close cases quickly
- Moral question: Expose corruption or maintain institutional loyalty?
- Moody's true test: Can you think independently when authority is wrong?

**Design Benefits**:
- Justifies modular case structure (they're training exercises)
- Natural difficulty scaling (historical → active)
- Meta-narrative emerges organically, not forced
- Optional engagement (can ignore pattern, just do cases)
- Thematic depth without complexity

---

## Core Gameplay Loop

```
┌─────────────────────────────────────────────────────────────┐
│                     CASE START                               │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    INVESTIGATION                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                                                      │    │
│  │   EXPLORE          INTERROGATE        ANALYZE       │    │
│  │   (Locations)      (Witnesses)        (Evidence)    │    │
│  │        │                │                 │         │    │
│  │        └────────────────┼─────────────────┘         │    │
│  │                         │                           │    │
│  │                         ▼                           │    │
│  │              ┌──────────────────┐                   │    │
│  │              │  INNER VOICE     │                   │    │
│  │              │  (Tier-based)    │                   │    │
│  │              └──────────────────┘                   │    │
│  │                                                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│         Player decides when ready to submit verdict          │
│                                                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    VERDICT SUBMISSION                        │
│                                                              │
│   Player provides:                                          │
│   • Suspect name                                            │
│   • Reasoning (freeform text)                               │
│                                                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    MENTOR REVIEW (LLM)                       │
│                                                              │
│   Mad-Eye Moody evaluates:                                  │
│   • Is suspect correct?                                     │
│   • Is reasoning sound?                                     │
│                                                              │
│   ┌─────────────┐              ┌─────────────┐             │
│   │   WRONG     │              │   CORRECT   │             │
│   │             │              │             │             │
│   │ Brutal      │              │ "Constant   │             │
│   │ feedback    │              │ vigilance   │             │
│   │             │              │ paid off."  │             │
│   │ Try again   │              │             │             │
│   │ (attempts   │              │ CASE CLOSED │             │
│   │ remaining)  │              │             │             │
│   └─────────────┘              └─────────────┘             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Intro Briefing System

**Status**: ✅ IMPLEMENTED (Phase 3.5 - 2026-01-07)

### Philosophy

**Moody teaches rationality concepts naturally through character dialogue.** Before each case, Moody's briefing introduces or reinforces rationality techniques relevant to that investigation. Teaching emerges from his personality and training philosophy, not academic lectures.

### Design Principles

1. **Character-driven** - All teaching through Moody's voice and perspective
2. **Progressive** - Each case introduces 1-2 new concepts, builds on previous
3. **Natural language** - No jargon, no "lesson plans," just investigation wisdom
4. **Optional reflection** - Player can ask questions or proceed directly to case
5. **Contextual** - Concepts tie directly to upcoming case challenges

### Briefing Structure (Actual Implementation)

**Flow**:
1. **Case Assignment** - Moody presents case file (WHO, WHERE, WHEN, WHAT)
2. **Teaching Question** - Multiple choice (4 options) teaching rationality concept
3. **Concept Summary** - Moody reinforces concept after answer
4. **Q&A Phase** - Player asks follow-up questions (LLM-powered)
5. **Transition** - "CONSTANT VIGILANCE" → Start Investigation button (appears after ≥1 Q&A)

**Implementation** (Phases 3.5-3.7):
```yaml
# Dialogue flow (no boxes, vertical message feed)
MOODY: *tosses case file* Case details...
MOODY: Before you start, question: [teaching question]
[4 button choices appear]
PLAYER: [Clicks choice]
MOODY: [Response to choice]
MOODY: [Concept summary]
MOODY: [Transition - only after ≥1 Q&A]
[Start Investigation button appears]
```

**Old Design** (Deprecated):
```yaml
# This was the PLANNED structure, NOT what was implemented
briefing_flow:
  1_case_assignment: Basic facts
  2_teaching_moment: Monologue (changed to interactive question)
  3_transition: Immediate (changed to conditional)
```

### Progressive Teaching Path (Cases 1-10)

**Case 1: Base Rates**
```
MOODY: "Before you start: Out of 100 school deaths ruled
'accidents,' how many actually ARE accidents?

[Player guesses]

85%. Hogwarts is dangerous. Most accidents are just accidents.
Start there. Evidence might change your mind. Might not."
```
**Teaches:** Start with likely scenarios (base rates), not dramatic theories

---

**Case 2: Updating Beliefs**
```
MOODY: "Last case, you found evidence against Flint. Good.
Then you found the timeline didn't fit. And you... hesitated.

Evidence doesn't care about your theory. You find something
that says you're wrong? Change your mind. Don't defend it."
```
**Teaches:** Bayesian updating, following evidence over ego

---

**Case 3: Mechanisms Matter**
```
MOODY: "When you accuse someone, I want to know HOW.
Not just 'they had motive.' HOW did they physically do it?
What sequence of actions? What spell, what timing?

If you can't explain the mechanism, you're guessing."
```
**Teaches:** Gears-level thinking, mechanistic reasoning

---

**Case 4: Timeline Reconstruction**
```
MOODY: "Suspect claims he was across town at 8 PM. Murder
at 7:45. Can't both be true, right?

Wrong. HOW LONG to get from scene to alibi location?
Break it down. Distance, speed, obstacles. CALCULATE.
Don't just assume 'impossible' or 'possible.'"
```
**Teaches:** Fermi estimation, decomposition

---

**Case 5: Alternative Hypotheses**
```
MOODY: "You'll find evidence that points at someone. Easy to
think 'case closed.' But ask yourself: If they DIDN'T do it,
how else could this evidence exist?

If there's no other explanation, that's strong proof.
If there are ten other explanations... that's not."
```
**Teaches:** Likelihood ratios, diagnostic evidence

---

**Cases 6-10:** Continue pattern with witness reliability, calibration, pattern recognition, etc.

### Dynamic Briefings

**Moody's dialogue adapts based on:**
- Player's performance in previous case
- Mistakes made (addresses specific errors)
- Successes (acknowledges good reasoning)
- Rationality tool usage (comments if player used probability tracker effectively)

**Example - Player made confirmation bias error:**
```
MOODY: "Last case, you locked onto a theory and ignored
contradicting evidence. I saw it. That gets people killed.

This case: I want to see you question your OWN theories
as hard as you question the suspects. Understand?"
```

**Example - Player performed well:**
```
MOODY: "Last case, you changed your theory twice when
evidence contradicted it. Some recruits call that indecisive.
I call it following the truth.

Keep that up."
```

### Implementation Notes

- **Length:** 2-4 minutes dialogue (skippable for returning players)
- **Tone:** Gruff, direct, no-nonsense Moody voice maintained
- **Interactivity:** Player can ask questions, but briefing flows naturally without forced choices
- **No quizzes:** Never test player on concepts, just introduce them
- **Show don't tell:** Moody explains through examples, not theory

### Current Implementation (Phase 3.5-3.8)

**Phase 3.5** (2026-01-07): Basic Briefing System
- ✅ Case assignment (WHO, WHERE, WHEN, WHAT format)
- ✅ Teaching question with multiple choice (4 options, NOT monologue)
- ✅ Interactive Q&A with Moody (Claude Haiku LLM-powered)
- ✅ Conversation history display (YOU: / MOODY: prefixes)
- ✅ "Start Investigation" transition (appears after ≥1 Q&A)
- ✅ Dark terminal theme modal (bg-gray-900, amber accents)

**Phase 3.6** (2026-01-07): Dialogue Flow UI
- ✅ Removed boxed sections (artificial separation)
- ✅ Vertical message feed (BriefingMessage component)
- ✅ Interactive teaching question (buttons NOT monologue)
- ✅ Text input at bottom for follow-up questions

**Phase 3.7** (2026-01-07): UI Polish
- ✅ Transition timing (only after player asks ≥1 question)
- ✅ Single scrollbar (Modal overflow-hidden, inner div overflow-y-auto)

**Phase 3.8** (PLANNED): Enhanced Context
- ⏳ Case context injection (witnesses/suspects/location)
- ⏳ Rationality guide condensed (200-300 lines for prompts)
- ⏳ Moody answers "Who are suspects?" naturally
- ⏳ Non-spoiler context (NO secrets, NO culprit reveal)

**Backend**: 3 endpoints (GET briefing, POST question, POST complete), BriefingState model with conversation_history

**Frontend**: BriefingModal component, BriefingConversation component, useBriefing hook

**YAML Structure** (Phase 3.5-3.7):
```yaml
briefing:
  case_assignment: |
    *Mad-Eye Moody tosses case file*
    VICTIM: Third-year student
    LOCATION: Hogwarts Library
    TIME: 9:15pm
    STATUS: Found petrified

  teaching_question:
    prompt: "Out of 100 accidents, how many ARE accidents?"
    choices:
      - id: "25_percent"
        text: "25%"
        response: "*eye narrows* Too low. 85% ARE accidents."
      - id: "85_percent"
        text: "85%"
        response: "*nods* Correct. Start with likely, not dramatic."
    concept_summary: "That's base rates. Start likely, let evidence move you."

  rationality_concept: "base_rates"
  concept_description: "Start with likely scenarios (base rates), not dramatic theories."
```

**Future Enhancements** (Not Yet Implemented):
- ⏳ Dynamic briefings based on previous case performance
- ⏳ Adaptive dialogue (addresses player's specific errors)
- ⏳ Progressive teaching path (Cases 2-10 concepts)
- ⏳ Performance-based feedback in briefings

---

## Three-Act Case Structure

### Philosophy

**Organize existing investigation into narrative beats.** Not adding complexity—adding structure to information revelation and pacing.

Each act serves different rationality skill:
- **Act 1** → Observation (gather initial data, avoid jumping to conclusions)
- **Act 2** → Hypothesis testing (Bayesian updating, handle contradictions)
- **Act 3** → Commitment under uncertainty (decide when "enough" evidence)

### Act 1: Setup (5-10 minutes)

**Purpose**: Establish crime, context, emotional hook

**Beats**:
```
BEAT 1: Case Briefing
├─ Moody assigns case: "Historical case from [year]. Solve it."
├─ Basic facts: who, where, when
└─ No theories yet—just facts

BEAT 2: Crime Scene Discovery
├─ Player arrives at location
├─ Scene description (covers all examinable elements naturally)
├─ Victim humanization (2-3 sentences—who they were)
└─ Initial observations available

BEAT 3: Initial Suspects/Witnesses
├─ 2-3 names mentioned in briefing or discovered at scene
├─ Surface-level info only
└─ No deep investigation yet

BEAT 4: Hook (something unexpected)
├─ One detail that doesn't fit clean narrative
├─ Creates question player wants answered
└─ Example: "Victim requested files day before 'suicide'"
```

**Victim Humanization Examples**:
```
"Near the window lies Helena Blackwood, fourth-year Ravenclaw.
You remember her from the library—always buried in wandlore texts,
muttering about core resonance frequencies. Someone silenced that
brilliant mind permanently."

"The body is Marcus Bellweather, Three Broomsticks regular.
Loudmouth, terrible at chess, but always bought drinks for broke
students. Didn't deserve this."
```

### Act 2: Investigation (15-30 minutes)

**Purpose**: Player explores freely, gathers evidence, faces complications

**Structure**:
```
PHASE 1: Free Exploration
├─ Player investigates locations (existing system)
├─ Examines evidence
├─ Interrogates witnesses
└─ Inner Voice triggers based on evidence gathered

PHASE 2: Pattern Formation
├─ Player accumulates 3-5 evidence pieces
├─ Inner Voice asks Socratic questions
├─ Player begins forming theory
└─ Evidence seems to point in one direction

PHASE 3: Complication
├─ Player discovers evidence contradicting theory
├─ Forces re-evaluation (Bayesian update)
├─ Teaches: Don't lock onto first theory; follow evidence
└─ May happen multiple times in complex cases
```

**Complication Evidence**:
- Designed piece that contradicts "obvious" answer
- Appears after player has 4-6 evidence (enough to form theory)
- Example: Alibi receipt proving obvious suspect couldn't have done it
- Forces question: "If not them, then who?"
- Teaches resistance to confirmation bias

### Act 3: Resolution (5-10 minutes)

**Purpose**: Player commits to verdict, receives feedback, sees consequences

**Beats**:
```
BEAT 1: Verdict Submission
├─ Player selects suspect
├─ Explains reasoning (freeform text)
└─ Submits to Moody

BEAT 2: Mentor Evaluation
├─ Moody checks: Correct suspect? Sound reasoning?
├─ Wrong → Brutal feedback, try again
└─ Correct → Proceed to Beat 3

BEAT 3: Culprit Confrontation (NEW)
├─ 3-4 dialogue exchanges
├─ Culprit explains motive in own words
├─ Player sees human consequences
└─ Moody final word

BEAT 4: Aftermath (optional, 1 sentence)
├─ SUCCESS: Brief positive outcome
├─ FAILURE: Brief negative consequence
└─ Transition to next case
```

**Post-Verdict Scene Example**:
```
You confront the assistant. She won't meet your eyes.

ASSISTANT: "I didn't mean for it to go that far. He was going
to destroy my career over one mistake. I just wanted to scare him..."

> [Player choice: respond or stay silent]

MOODY: "Take her to holding." [Watches her led away] "Good work.
But don't confuse understanding with sympathy. She made her choice."

CASE CLOSED
```

### Design Benefits

**For Player Experience**:
- Clear phases: Opening → Investigation → Resolution
- Emotional arc: Hook (care) → Complication (challenged) → Confrontation (payoff)
- Pacing variety: Slow exploration + urgency + reflection

**For Teaching Rationality**:
- Act 1: Gather data before theorizing
- Act 2: Update beliefs as evidence emerges
- Act 3: Judge when you have "enough" evidence

**For Case Design**:
- Framework ensures all necessary beats present
- Quality control checklist for complete narrative arc
- Prevents cases lacking hooks or complications

---

## Investigation System

### Philosophy

**DnD-style freeform exploration.** Player types what they want to investigate. LLM narrator responds based on case truth file. No "click all buttons" gameplay.

### Two Input Modes

| Mode | Description | Example |
|------|-------------|---------|
| **Freeform** | Player types any investigation action | "I look under the desk" |
| **Quick actions** | Predefined common options | Cast Revelio, Examine victim |

Freeform always available and encouraged. Quick actions for convenience.

### Scene Structure

```
SURFACE ELEMENTS (always mentioned in description):
├── Obvious items and features
├── Body/victim if present
└── Atmosphere and setting

HIDDEN EVIDENCE (only found if player investigates):
├── Triggered by specific queries
├── Each has trigger keywords
└── Revealed with [EVIDENCE: id] tag

NOT PRESENT (prevents hallucination):
├── Things that don't exist
├── Defined responses for common wrong guesses
└── "You search but find nothing of note"
```

### LLM Narrator Behavior

**Rules for narrator:**
1. If player query matches hidden evidence triggers → reveal it
2. If player asks about not_present items → use defined response
3. If player asks about already-found evidence → "You've already examined this"
4. If player asks about undefined things → describe atmosphere only, NO new clues
5. Keep responses to 2-4 sentences (atmospheric but concise)
6. Failed searches → "You search but find nothing of note"
7. Re-examination → same response as before

### Example Interaction

```
┌─────────────────────────────────────────────────────────────┐
│  LOCATION: Library Crime Scene                               │
│                                                              │
│  You enter the library. A heavy oak desk dominates the      │
│  center, papers scattered across its surface. Dark arts     │
│  books line the towering shelves. Near the frost-covered    │
│  window, the victim lies motionless, wand clutched in hand. │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  > I check under the desk                                   │
│                                                              │
│  You crouch and peer beneath the heavy desk. In the         │
│  shadows, your fingers find a crumpled piece of parchment   │
│  someone tried to hide. The words "I know what you did"     │
│  are scrawled in hurried script.                            │
│                                                              │
│  [EVIDENCE FOUND: Hidden Note]                              │
│                                                              │
│  TOM: "Someone hid this deliberately.                       │
│  What were they afraid of?"                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Witness Interrogation System

### Philosophy

**LLM plays each witness as a character.** Player can ask anything. Witnesses have knowledge, secrets, lies, and personalities.

### Witness Properties

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

### Interrogation Mechanics

| Action | How It Works |
|--------|--------------|
| **Ask questions** | Freeform text; witness responds in character |
| **Show evidence** | Select from discovered evidence; may trigger reactions |
| **Cast Legilimency** | May reveal secrets (based on trigger conditions) |
| **Press harder** | Risk: witness may clam up or reveal more |

### LLM Witness Behavior

**Rules for witness characters:**
1. Stay in character (personality, speech patterns)
2. Only answer based on defined knowledge
3. Maintain lies unless directly contradicted with evidence
4. Reveal secrets only when trigger conditions met
5. Never volunteer information unprompted
6. If asked about unknown things, respond naturally that they don't know

---

## Evidence System

### Evidence Types

| Type | Examples | Discovery Method |
|------|----------|------------------|
| **Physical** | Wand, note, potion vial | Location examination |
| **Testimonial** | Witness statements | Interrogation |
| **Magical** | Spell traces, enchantments | Spell casting |
| **Documentary** | Letters, receipts, records | Location examination |

### Evidence Properties

```yaml
evidence:
  id: "hidden_note"
  type: "physical"

  location: "library"
  triggers: ["under desk", "beneath desk", "search desk drawers"]

  description: "A crumpled parchment with threatening words."

  surface_meaning: "Someone was threatening the victim"
  possible_interpretations:
    - "Victim was being blackmailed"
    - "Victim wrote this to someone else"
    - "Planted to mislead investigation"

  connects_to:
    - suspect: "flint"
      how: "Handwriting analysis possible"
    - evidence: "victim_journal"
      how: "Same paper type"
```

### Evidence Board (Player's View)

```
┌─────────────────────────────────────────────────────────────┐
│  COLLECTED EVIDENCE                                          │
│  ═══════════════════════════════════════════════════════════│
│                                                              │
│  PHYSICAL:                                                   │
│    • Hidden Note - "I know what you did" (Library)          │
│    • Wand - Victim's, shows Stupefy at 9:15pm (Library)     │
│                                                              │
│  TESTIMONIAL:                                                │
│    • Hannah Abbott - Saw figure near library at 8pm         │
│    • Tom (Barkeep) - Confirms Flint's alibi                 │
│                                                              │
│  MAGICAL:                                                    │
│    • Priori Incantatem - Stupefy cast at 9:15pm            │
│                                                              │
│  DOCUMENTARY:                                                │
│    • Alibi receipt - Three Broomsticks, 8-10pm              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Inner Voice System (Tom's Ghost)

### The Character

**Thomasin "Tom" Thornfield** - Ghost of a spectacularly failed Auror recruit.

**Background:**
- **Age at death:** 23 (first-year Academy recruit, 1994)
- **How he died:** Arrested wrong suspect with absolute confidence, ignored contradicting evidence, real killer tracked him down during the botched arrest
- **The absurd part:** Also died from falling through a rotted floorboard while confronting the killer—he was so focused on being right, he didn't watch where he was walking
- **His record:** 3 cases attempted
  - Case #1: Arrested the victim's cousin (actual killer was the victim's uncle)
  - Case #2: Arrested himself briefly due to paperwork mix-up, then arrested the victim (who was already dead)
  - Case #3: Finally found the right killer, walked into obvious trap, died
- **The person he wrongly convicted:** Marcus Bellweather, still in Azkaban 15 years later for a murder he didn't commit
- **Why he haunts the Academy:** Unfinished business—can't move on until someone who actually THINKS solves cases properly. Also finds it darkly amusing to watch new recruits make his mistakes.

**Personality:**
- Enthusiastic but self-aware disaster
- Genuinely wants player to succeed where he failed
- Oscillates between helpful insight and confident wrongness
- Makes dark jokes about his own incompetence
- Haunted by Marcus Bellweather (brings him up occasionally)
- Only visible/audible to the player

**Relationship with Moody:**
```
TOM: "Moody tried to fail me out after Case #2. I complained to
the Ministry, got reinstated. Then died three weeks later on
Case #3. He was trying to save my life. I thought he was just
being cruel."
```

**Moody never acknowledges Tom** (can't see him, or chooses not to).

### Philosophy

**50% Socratic rational thinking + 50% plausible but misleading.** Guides thinking without spoiling. Sometimes brilliantly helpful, sometimes confidently wrong—both sound equally reasonable. Player must learn to evaluate his advice, not blindly trust it.

### Voice Personality

```
TOM'S GHOST: Failed Auror recruit who wants to help but repeats his mistakes.

HELPFUL MODE (50%):
- Asks Socratic questions that prompt rational thinking
- Models good investigative reasoning
- Guides player to discover answers themselves
- "What would need to be true for that theory to work?"

MISLEADING MODE (50%):
- Makes plausible-sounding but flawed arguments
- Uses real investigative concepts incorrectly
- Sounds professional and experienced
- "Three witnesses agree—that's strong corroboration"

BOTH modes sound natural, relevant, and helpful.
Player cannot tell which mode is active until they think it through.

RARE MOMENTS:
- Self-aware comments about his failures (~5% of triggers)
- Dark humor about his death (~3% of triggers)
- Emotional moments about Marcus Bellweather (~2% of triggers)
```

### Three-Tier Trigger System

| Tier | Condition | Priority |
|------|-----------|----------|
| **Tier 3** | Strong evidence base (6+ pieces OR critical evidence) | Highest |
| **Tier 2** | Some relevant evidence (3-5 pieces) | Medium |
| **Tier 1** | Minimal evidence (0-2 pieces) | Lowest |

**Selection logic:**
1. Check highest tier first
2. Filter to unlocked, unfired triggers
3. Random selection within tier
4. Mark as fired (won't repeat)

### Trigger Examples

```yaml
voice_triggers:
  tier_1:
    - id: "first_clue"
      condition: "evidence_count == 1"
      type: "helpful"
      text: "First piece of evidence. What does it actually prove? That someone was here? When? Why?"

    - id: "first_clue_misleading"
      condition: "evidence_count == 1"
      type: "misleading"
      text: "Good find! That's usually enough to point you toward the right suspect."

    - id: "early_accusation"
      condition: "suspect_accused AND evidence_count < 3"
      type: "helpful"
      text: "You're focusing on them already. What are you basing that on? Hunch or evidence?"

  tier_2:
    - id: "matching_witnesses_helpful"
      condition: "witness_A AND witness_B AND stories_match"
      type: "helpful"
      text: "Two witnesses, same story. Did they see it independently? Or did they talk to each other first?"

    - id: "matching_witnesses_misleading"
      condition: "witness_A AND witness_B AND stories_match"
      type: "misleading"
      text: "Two witnesses corroborating each other. That's solid testimony. Multiple independent sources."

    - id: "alibi_contradiction_helpful"
      condition: "alibi AND witness_testimony AND contradicts"
      type: "helpful"
      text: "The alibi says one thing, the witness another. Which one's more reliable? How do you check?"

    - id: "alibi_contradiction_misleading"
      condition: "alibi AND witness_testimony AND contradicts"
      type: "misleading"
      text: "Alibi contradicts the witness. But witnesses make mistakes all the time. The physical evidence doesn't lie."

  tier_3:
    - id: "critical_found_helpful"
      condition: "has(critical_evidence)"
      type: "helpful"
      text: "That's significant. Does this confirm your theory, or does it contradict it? Be honest."

    - id: "critical_found_misleading"
      condition: "has(critical_evidence)"
      type: "misleading"
      text: "There it is. That's the evidence that cracks the case. Everything else supports this."

    - id: "major_contradiction"
      condition: "has_major_contradiction"
      type: "helpful"
      text: "Something doesn't fit. Either your theory is wrong, or you're missing something. Which is it?"

  # RARE TRIGGERS (5-10% chance when conditions met)
  rare_triggers:
    - id: "self_aware_failure"
      condition: "player_made_mistake_similar_to_tom"
      rarity: 0.05
      text: "Oh no. You're doing what I did in Case #1. Please don't. It didn't end well for me."

    - id: "death_joke"
      condition: "examining_dangerous_location"
      rarity: 0.03
      text: "Check the floor before you walk. Trust me on that one."

    - id: "marcus_mention"
      condition: "about_to_accuse_wrong_person"
      rarity: 0.02
      text: "[quiet] Marcus Bellweather is still in Azkaban because of me. Please don't add another name to that list."
```

### Voice Tone Examples

**HELPFUL (Socratic rational thinking):**
```
TOM: "Flint's wand at the scene. What would need to be true for Flint
to be the killer? He'd need to be there at the time of death, right?
So when did she die, and where was he?"

TOM: "Hannah says she saw him clearly. What affects how reliable that
is? Lighting, distance, how well she knows him... Did you ask about those?"

TOM: "You're confident it's Flint. That's fine. But what evidence would
prove you WRONG? If you can't think of any, that's a problem."
```

**MISLEADING (plausible but wrong):**
```
TOM: "Three witnesses saw him near the library. That's corroboration.
Independent witnesses agreeing makes testimony stronger. You can trust that."

TOM: "Flint's wand at the scene means he was there recently. And he had
motive from that argument. When you have physical evidence plus motive,
that's usually your answer."

TOM: "You found contradicting evidence, but witnesses make mistakes. The
receipt could be wrong, timestamps glitch. Trust the pattern of evidence,
not one outlier."
```

**RARE SELF-AWARE MOMENTS:**
```
TOM: "I'm giving you advice on investigation. Me. The person who died
falling through a floor because I was too busy staring at evidence to
watch where I was walking. Take that for what it's worth."

TOM: "That's EXACTLY what I did in Case #2! Worked out terribly. I mean,
do what you want, but just so you know—that theory got me laughed out of
the Wizengamot."
```

**RARE EMOTIONAL MOMENTS:**
```
TOM: [quiet] "Marcus Bellweather. That was his name. The man I sent to
Azkaban. He had a wife, two kids. I was so SURE he did it. He's still
there. Fifteen years now. Because I didn't think, I just... decided."
```

---

## Mentor System (Mad-Eye Moody)

### Philosophy

**LLM-powered brutal feedback.** Reviews player's reasoning, identifies fallacies, blocks case closure until correct answer + sound reasoning.

### When Mentor Appears

Only at verdict submission. Not during investigation.

### Mentor Behavior

```
PLAYER SUBMITS:
├── Suspect name
└── Reasoning (freeform text, can be messy)

MENTOR EVALUATES:
├── Is suspect correct? (binary)
└── Is reasoning sound? (identifies fallacies)

MENTOR RESPONDS:
├── If wrong suspect: Brutal rejection, hint at flaw
├── If right suspect, weak reasoning: Pushback, demand better
└── If right suspect, sound reasoning: "Case closed"
```

### Mentor Personality

```
Mad-Eye Moody style:
- Paranoid, demanding, no-nonsense
- "CONSTANT VIGILANCE!"
- Brutally honest about logical flaws
- Respects good reasoning, even if path was messy
- Names specific fallacies (confirmation bias, etc.)
```

### Example Interactions

**Wrong answer:**
```
MOODY: "PATHETIC! You're telling me you'd send a wizard
to Azkaban because he 'looked suspicious'? That's not
evidence, that's gut feeling dressed up as reasoning.

Those two witnesses—were they together? Did you even
check if their stories were independent or if they
contaminated each other's memory?

You've got CONFIRMATION BIAS written all over this case.
Back to the evidence. 8 attempts remaining."
```

**Right answer, weak reasoning:**
```
MOODY: "The name's right, but your reasoning is SLOPPY.
You got lucky. 'He seemed guilty' isn't an argument.

Tell me: What EVIDENCE proves means, motive, and
opportunity? I want LOGIC, not hunches.

Try again. Properly this time."
```

**Correct:**
```
MOODY: "Constant vigilance paid off, recruit. You
identified the wand timing discrepancy, traced the
second wand, and connected the motive evidence.

THAT'S how an Auror thinks. Case closed.

Final score: 7/10 attempts remaining. Acceptable."
```

### Attempt System

- **Maximum attempts:** 10
- **Final attempt:** Warning displayed, then forced closure
- **Wrong on attempt 10:** Bad ending, case marked FAILED
- **Solution reveal:** Only if player explicitly requests after failure

---

## Magic System

> **📖 Full Details**: See [WORLD_AND_NARRATIVE.md - Magic System](WORLD_AND_NARRATIVE.md#magic-system-for-investigations) for complete risk/reward system, progression, and implementation guide.

**Core Philosophy**: *"Magic is a tool, not a crutch. Your mind is the weapon."* - Moody

### Core Investigation Spells (6 Total)

**Basic Investigation** (Cases 1+):
- **Revelio** - Reveals hidden objects, magical marks
- **Homenum Revelio** - Detects hidden persons
- **Specialis Revelio** - Identifies potions/substances
- **Lumos** - Illumination, forensic variants

**Forensic Magic** (Cases 1+):
- **Prior Incantato** - Shows wand's last spells (requires physical wand)
- **Reparo** - Repairs broken objects (reveals how they broke)

**Restricted** (Cases 4+, heavy consequences):
- **Legilimency** - Reads thoughts (requires consent OR authorization)

### Risk/Reward System

Magic uses **flexible evaluation**:
- Player can attempt any logical spell
- LLM evaluates context and presents risks
- Player makes informed choice
- Consequences teach lessons

**Example:**
```
> "I use Legilimency on the suspect"

  You grip your wand, considering Legilimency. But Moody's
  training echoes: 'Legilimency without consent is assault,
  recruit. You'll blow the case AND get disciplined.'

  Attempting anyway would:
  - Risk mental backlash (suspect is trained Occlumens)
  - Invalidate evidence (illegal search)
  - Anger Moody

  > Try anyway (very risky)
  > Use different approach
```

### Progression

**Cases 1-3**: Basic spells only, Moody teaches fundamentals
**Cases 4-6**: Spell variations, can REQUEST Legilimency authorization
**Cases 7-10**: Full toolkit, understands when NOT to use magic

### Auror's Handbook

Players have access to "Auror's Handbook" (menu reference):
- Lists all 6 spells with usage examples
- Available anytime during investigation
- Moody's note: "Six spells. Master them. Constant vigilance."

### Non-Magical Investigation

Magic supplements but doesn't replace deduction:
- Physical examination
- Witness interviews
- Document analysis
- Timeline reconstruction
- Logical reasoning (primary skill)

---

## Bayesian Probability Tracker (Optional)

### Philosophy

**Optional tool for players who want to track beliefs numerically.** Teaches Bayesian reasoning through hands-on practice: rate evidence impact on each suspect, watch probabilities update. Completely optional—can win without ever using it.

### Design Principles

1. **Evidence-focused** - Rate each piece of evidence's diagnostic value
2. **Two-question framework** - "If guilty, how likely?" + "If innocent, how likely?"
3. **Real Bayesian math** - Uses likelihood ratios under the hood
4. **Transparent** - Player sees how probabilities calculated
5. **Non-intrusive** - Accessible from menu, never forced

### Access

```
During investigation:
  [P] or select "Probability Tracker" from menu

First time opening:
  MOODY: "Some Aurors track theories numerically. Helps them see
  when evidence changes their thinking. Optional tool. Use it or don't."
```

### UI: Split Panel (Version 3)

**Evidence on left, suspect rating on right:**

```
┌─────────────────────────────────────────────────────────────┐
│  PROBABILITY TRACKER: Green Scarf with "M.F." Initials      │
│  ═══════════════════════════════════════════════════════════│
│                                                              │
│  Evidence Description   │  Rate Suspect                     │
│  ───────────────────────┼──────────────────────────────────│
│                         │                                   │
│  Found in study alcove  │  SELECT SUSPECT:                  │
│  behind desk, hastily   │  ● Marcus Flint      [NOT RATED] │
│  hidden.                │  ○ Prof. Vector      [NOT RATED] │
│                         │  ○ Adrian Clearmont  [NOT RATED] │
│  Silver embroidery      │  ○ Argus Filch       [NOT RATED] │
│  shows "M.F." initials  │                                   │
│  matching Marcus Flint. │  ─────────────────────────────── │
│                         │                                   │
│  Alcove is adjacent to  │  IF GUILTY:                       │
│  Restricted Section.    │  How likely would this evidence   │
│  Someone here could     │  exist?                           │
│  hear through wall.     │                                   │
│                         │  [───────────●────] 80%           │
│                         │  0%       50%    100%             │
│                         │                                   │
│                         │  IF INNOCENT:                     │
│                         │  How likely would this evidence   │
│                         │  exist?                           │
│                         │                                   │
│                         │  [───●─────────────] 30%          │
│                         │  0%       50%    100%             │
│                         │                                   │
│                         │  Ratio: 2.7x | Moderate support  │
│                         │                                   │
│                         │  [Save]                           │
│                         │                                   │
│  ─────────────────────────────────────────────────────────  │
│  [← Evidence List] [View Probabilities →]                   │
└─────────────────────────────────────────────────────────────┘
```

### Workflow

**Step 1: Find evidence during investigation**
- Evidence logged automatically: "Flint's Scarf"

**Step 2: Open Probability Tracker (optional)**
- Select evidence to rate
- See full evidence description on left

**Step 3: Rate for each suspect**
- Click suspect (e.g., Marcus Flint)
- Adjust two sliders:
  - "If guilty: How likely would this evidence exist?" (0-100%)
  - "If innocent: How likely would this evidence exist?" (0-100%)
- System calculates likelihood ratio
- Save rating

**Step 4: Repeat for other suspects**
- Each suspect rated independently
- Can skip suspects (leave unrated)
- Marked as [RATED: 2.7x] when done

**Step 5: View calculated probabilities**
- See overall guilt probabilities for all suspects
- Based on aggregated evidence ratings
- Updates automatically as more evidence rated

### Calculated Probabilities View

```
┌─────────────────────────────────────────────────────────────┐
│  CALCULATED PROBABILITIES                                    │
│  ═══════════════════════════════════════════════════════════│
│                                                              │
│  Based on 4 rated evidence pieces                           │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  MARCUS FLINT                                                │
│    ███████░░░ 68%                                           │
│                                                              │
│    Evidence:                                                │
│      • Flint's Scarf        (2.7x for guilt)                │
│      • Public argument      (3.0x for guilt)                │
│      • Levitation marks     (0.5x against guilt)            │
│      • Timeline             (0.4x against guilt)            │
│                                                              │
│    Started: 25% (4 equal suspects)                          │
│    After scarf: 47%                                         │
│    After argument: 63%                                      │
│    After levitation: 54%                                    │
│    After timeline: 68% (current)                            │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  PROFESSOR VECTOR: ████████░░ 75%                           │
│  ADRIAN CLEARMONT: ████░░░░░░ 35%                           │
│  ARGUS FILCH: █░░░░░░░░░ 8%                                 │
│                                                              │
│  [Expand Details] [Rate More Evidence] [Close]             │
└─────────────────────────────────────────────────────────────┘
```

### Algorithm: Real Bayesian Calculation

```python
def calculate_probability_bayesian(suspect, evidence_ratings, num_suspects):
    """
    True Bayesian calculation using likelihood ratios.

    Args:
        suspect: Suspect name
        evidence_ratings: Dict of {evidence_id: (p_guilty, p_innocent)}
        num_suspects: Total number of suspects

    Returns:
        Posterior probability (0-100%)
    """

    # Prior: equal probability for all suspects
    prior_prob = 1.0 / num_suspects  # e.g., 25% for 4 suspects
    prior_odds = prior_prob / (1 - prior_prob)  # e.g., 1:3

    # Start with prior odds
    current_odds = prior_odds

    # Apply each evidence sequentially
    for evidence_id, (p_if_guilty, p_if_innocent) in evidence_ratings.items():
        # Calculate likelihood ratio
        if p_if_innocent == 0:
            # Evidence impossible if innocent → infinite support for guilt
            likelihood_ratio = float('inf')
        else:
            likelihood_ratio = p_if_guilty / p_if_innocent

        # Bayesian update: multiply odds by likelihood ratio
        current_odds = current_odds * likelihood_ratio

    # Convert odds back to probability
    posterior_prob = current_odds / (1 + current_odds)

    # Return as percentage, clamped 0-100
    return min(100, max(0, posterior_prob * 100))


# Example calculation:
# Prior: 25% guilty (4 suspects) → odds 1:3
# Evidence 1: Scarf (80% if guilty, 30% if innocent) → LR = 2.67
#   New odds: (1:3) × 2.67 = 2.67:3 = 0.89:1 → 47% probability
# Evidence 2: Timeline (20% if guilty, 60% if innocent) → LR = 0.33
#   New odds: 0.89:1 × 0.33 = 0.29:1 → 23% probability
```

### Teaching Moments

**First use (Moody explains):**
```
MOODY: "Here's how this works. When you rate evidence, you're
asking: 'How much MORE likely is this evidence if the suspect
is guilty versus innocent?'

If evidence is equally likely either way, it tells you nothing.
If it's much more likely when guilty, that's strong proof.

Try it. Rate the scarf. See how your beliefs update."
```

**After rating conflicting evidence:**
```
TOM (Inner Voice): "You rated the scarf as supporting Flint,
then the timeline as contradicting him. Watch how the
probability shifted: 70% → 48%.

That's Bayesian updating. Evidence changes your mind."
```

**When player rates everything for one suspect:**
```
MOODY (if player opens tracker): "I see you're tracking
probabilities. Good. Vector's at 75%, Flint dropped to 35%.
You're following the evidence. That's how it's done."
```

### Features

**Progressive Disclosure:**
- Case 1: Tracker introduced, basic explanation
- Case 2: Can view history of probability changes
- Case 3+: Fully integrated, no hand-holding

**Keyboard Shortcuts:**
- `P` - Open probability tracker
- `1-9` - Adjust slider position
- `Tab` - Switch between guilty/innocent slider
- `S` - Save rating
- `N` - Next suspect

**Optional Explanations:**
- Tooltip: "What's a likelihood ratio?"
- Help menu: Brief Bayesian primer
- Never required reading

### Design Notes

**Why Two Questions?**
- Forces player to consider alternative hypotheses
- Core Bayesian insight: Evidence only matters if MORE likely under one hypothesis
- Example: Scarf in library (80% if guilty, 30% if innocent) → 2.7x ratio
- Example: Squib can't cast spell (0% if guilty, 100% if innocent) → Eliminates suspect

**Why Real Bayesian Math?**
- Teaches accurate reasoning, not approximation
- Likelihood ratios are the "correct" way to update beliefs
- System is mathematically sound under the hood
- Player doesn't need to understand math—just rate evidence

**Why Optional?**
- Accessibility: Not everyone wants numerical tracking
- Respect player choice: Some prefer intuitive reasoning
- Non-punitive: Can win without using tracker
- Incentive: Using it well → Moody acknowledges good thinking

---

## Case Structure (Modular)

> **📖 Full Details**: See [CASE_DESIGN_GUIDE.md](CASE_DESIGN_GUIDE.md) for comprehensive module templates, examples, and variation rules.

### Case Components

```yaml
case:
  id: "case_001"
  title: "The Restricted Section"

  # CORE IDENTITY
  crime_type: "murder"  # murder, theft, corruption, assault, conspiracy
  hook: "One sentence - what's immediately intriguing"
  twist: "One sentence - what subverts player's theory"

  # SETTING
  location_structure: "house"  # single_room, house, large_building, multi_location
  locations: [...]

  # CHARACTERS
  victim: {...}       # name, status, humanization, connection
  suspects: [...]     # 2-6 suspects with depth
  witnesses: [...]    # 0-4 witnesses with wants/fears

  # EVIDENCE
  evidence: [...]               # 5-12 pieces
  complication_evidence: {...}  # Contradicts obvious theory

  # SOLUTION
  solution: {...}     # culprit, timeline, critical_evidence, reasoning

  # NARRATIVE
  post_verdict: {...} # confrontation, aftermath

  # SYSTEMS
  voice_triggers: [...]
  mentor_criteria: {...}
```

### Crime Type Variety

Cases cover diverse crimes:
- **Murder**: Locked room, staged suicide, public assassination
- **Theft**: Gringotts heist, Ministry documents, artifact smuggling
- **Corruption**: Bribery, embezzlement, evidence tampering
- **Assault**: Dark magic, Unforgivables, revenge attacks
- **Conspiracy**: Coup plots, frame jobs, cover-ups

**Principle**: Variety prevents repetition. No rigid difficulty by crime type.

### Module Structure

All modules use simple YAML structure. See [CASE_DESIGN_GUIDE.md](CASE_DESIGN_GUIDE.md) for detailed templates and examples.

**Location**: Natural descriptions (no POI lists), macro/micro granularity, hidden evidence triggers
**Victim**: Humanization (2-3 sentences), connection to player, memorable trait
**Suspect**: Wants/fears/moral_complexity, means/motive/opportunity, interrogation behavior
**Witness**: Wants/fears/moral_complexity, knowledge/secrets/lies, reliability type
**Evidence**: Standard pieces + complication evidence (contradicts obvious theory)
**Solution**: Timeline, critical evidence, correct reasoning, common mistakes
**Post-Verdict**: Culprit reaction, confrontation dialogue, aftermath

---

## Case Variation Guidelines

> **📖 Full Details**: See [CASE_DESIGN_GUIDE.md](CASE_DESIGN_GUIDE.md) for 10 detailed variation rules and examples.

### Quick Variation Checklist

When designing new case, **vary at least 3-5 of these**:

- Number of suspects (2-6) and witnesses (0-4)
- Crime type (murder, theft, corruption, assault, conspiracy)
- Location structure (single room, house, large building, multi-location)
- Investigation pattern (linear, web, elimination, contradiction)
- Misdirection method (planted evidence, timeline tricks, unreliable witnesses, motive subversion)
- Emotional tone (dark, morally complex, light)
- Complication timing (early, mid, late)
- Red herring count (1-3)

**Principle**: Modular system enables variety. Mix and match to keep cases fresh.

---

## Verdict System

### Submission Flow

```
┌─────────────────────────────────────────────────────────────┐
│  SUBMIT VERDICT                                              │
│  ═══════════════════════════════════════════════════════════│
│                                                              │
│  Attempts remaining: ████████░░ (8/10)                      │
│                                                              │
│  WHO IS GUILTY?                                              │
│  > Marcus Flint                                             │
│    Helena Ravenclaw                                         │
│    Professor's Assistant                                     │
│    Someone else (specify)                                    │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  EXPLAIN YOUR REASONING:                                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ I think it was Flint because his wand was at the      │ │
│  │ scene and Hannah saw him near the library. He had     │ │
│  │ a public argument with the victim so he had motive... │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [Submit Verdict]    [Back to Investigation]                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Mentor Evaluation Criteria

```yaml
mentor_criteria:
  correct_suspect: "assistant_character"

  required_evidence_cited:
    - "wand_timing_mismatch"
    - "second_wand_trace"

  required_reasoning:
    - "Explains why Flint is innocent despite wand"
    - "Identifies who had access to Flint's wand"
    - "Establishes assistant's motive"

  fallacies_to_catch:
    - "confirmation_bias"
    - "appeal_to_authority"
    - "circumstantial_as_proof"
```

### Outcomes

| Outcome | Condition | Result |
|---------|-----------|--------|
| **Success** | Correct suspect + sound reasoning | Case closed, good ending |
| **Partial** | Correct suspect + weak reasoning | Mentor pushback, retry |
| **Failure** | Wrong suspect | Mentor rejection, lose attempt |
| **Game Over** | 10 failures | Bad ending, case marked FAILED |

### After Case Closure

```
SUCCESS:
├── Victory scene
├── Final score (attempts remaining)
├── Mentor commendation
└── Unlock next case

FAILURE (10 attempts):
├── Bad ending scene (real culprit escapes/mocks)
├── Case marked FAILED in stats
├── Mentor's brutal debrief
├── Option to see solution (player must request)
└── Can replay case from start
```

---

## Consequences Philosophy

### Soft Consequences Only

| Event | Consequence | NOT a consequence |
|-------|-------------|-------------------|
| Wrong verdict | Lose attempt, mentor mockery | Game over (until attempt 10) |
| Miss evidence | Harder to solve | Locked out of solution |
| Bad reasoning | Mentor rejection | Progress blocked |
| Case failure | Bad ending, stats reflect | Can't continue playing |

### Narrative Flavor Examples

**Wrong accusation:**
```
The Wizengamot releases Flint due to insufficient evidence.
Three days later, another victim is found. The real killer
is still at large—and now they know someone's hunting them.
```

**Case failure:**
```
Moody slams the case file on his desk. "Ten chances and you
couldn't piece it together. The assistant fled the country
while you were chasing shadows."

He slides a new file across. "Next case. Try not to
embarrass the department again."
```

---

## Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       FRONTEND                               │
│                   (Web - Terminal UI)                        │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                     PYTHON BACKEND                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │    CASE     │  │   PLAYER    │  │   PROMPT    │         │
│  │   STORE     │  │   STATE     │  │   BUILDER   │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                 │
│         └────────────────┼────────────────┘                 │
│                          ▼                                  │
│                  ┌──────────────┐                           │
│                  │   CONTEXT    │                           │
│                  │  ASSEMBLER   │                           │
│                  └──────┬───────┘                           │
│                         │                                   │
│                         ▼                                   │
│                  ┌──────────────┐                           │
│                  │  CLAUDE API  │                           │
│                  │   (Haiku)    │                           │
│                  └──────┬───────┘                           │
│                         │                                   │
│                         ▼                                   │
│                  ┌──────────────┐                           │
│                  │   RESPONSE   │                           │
│                  │    PARSER    │                           │
│                  └──────┬───────┘                           │
│                         │                                   │
│                         ▼                                   │
│                  ┌──────────────┐                           │
│                  │    STATE     │                           │
│                  │   UPDATER    │                           │
│                  └──────────────┘                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Data Structures

**Case Store (Static):**
```python
case_store = {
    "case_id": str,
    "title": str,
    "locations": dict,      # Location configs
    "witnesses": dict,      # Witness configs
    "suspects": list,       # Suspect configs
    "evidence": list,       # Evidence definitions
    "solution": dict,       # Correct answer + criteria
    "voice_triggers": dict  # Tier-organized triggers
}
```

**Player State (Mutable):**
```python
player_state = {
    "case_id": str,
    "current_location": str,
    "discovered_evidence": dict,    # id -> {found_at, description}
    "witness_states": dict,         # witness_id -> conversation state
    "triggered_voices": list,       # Already fired trigger IDs
    "verdict_attempts": int,
    "recent_history": list          # Last 5-10 interactions
}
```

### LLM Context Isolation

| Context Type | Contains | Never Contains |
|--------------|----------|----------------|
| **Narrator** | Location, hidden evidence, not_present | Witness secrets, solution |
| **Witness** | Witness knowledge, secrets, lies | Other witnesses, solution |
| **Mentor** | Solution, player reasoning, fallacy list | Investigation details |

### State Persistence

```python
# Save after every interaction
save_path = f"saves/{case_id}_{player_id}.json"

# Saved data
{
    "player_state": {...},
    "timestamp": "...",
    "version": "1.0"
}
```

---

## UI/UX Design

### Terminal Aesthetic

```
┌─────────────────────────────────────────────────────────────┐
│  AUROR ACADEMY v1.0                    Case #001            │
│  ═══════════════════════════════════════════════════════════│
│                                                              │
│  [Location/Scene text here]                                 │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  > Freeform input option (always first)                     │
│    Predefined choice 1                                      │
│    Predefined choice 2                                      │
│    Predefined choice 3                                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Input Modes

```
FREEFORM (highlighted, first option):
> I search under the desk for hidden items

SELECTION (arrow keys):
  > Cast Revelio
    Examine the victim
    Check collected evidence
    Leave location
```

### Visual Feedback

```
EVIDENCE FOUND:
══════════════════════════════════════
  NEW EVIDENCE: Hidden Note
  "A crumpled parchment with threatening words"
══════════════════════════════════════

INNER VOICE:
┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄
  TOM: "Someone hid this deliberately.
  What were they afraid of?"
┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄

MENTOR (on verdict):
╔════════════════════════════════════════╗
║  MOODY: "CONSTANT VIGILANCE!"          ║
║                                         ║
║  [Mentor feedback here]                 ║
║                                         ║
║  Attempts remaining: 8/10               ║
╚════════════════════════════════════════╝
```

---

## Rationality Concepts Taught

### Primary Focus

| Concept | How Taught |
|---------|------------|
| **Bayesian reasoning** | Evidence updates probability; mentor discusses priors |
| **Confirmation bias** | Mentor calls out when player ignores contradicting evidence |
| **Witness reliability** | Witnesses can be wrong, lying, or contaminated |
| **Circumstantial vs direct** | Mentor distinguishes evidence types |
| **Independent corroboration** | Voice questions if witnesses talked to each other |

### Teaching Moments

**During investigation (Inner Voice):**
- Questions that model good thinking
- Sometimes naive statements player should recognize as flawed

**After verdict (Mentor):**
- Explicit naming of fallacies
- Explanation of correct reasoning
- Comparison of player's logic to ideal logic

---

## Development Priorities

### Phase 1: Core Loop
- [ ] Basic narrator LLM integration
- [ ] Evidence discovery and tracking
- [ ] Location navigation (macro/micro structure)
- [ ] Save/load state

### Phase 2: Characters
- [ ] Witness LLM integration (with wants/fears/moral_complexity)
- [ ] Witness state tracking
- [ ] Evidence presentation to witnesses
- [ ] Suspect interrogation system

### Phase 3: Verdict System
- [ ] Mentor LLM integration
- [ ] Verdict submission flow
- [ ] Attempt tracking
- [ ] Case closure logic
- [ ] Post-verdict confrontation scenes

### Phase 4: Inner Voice
- [ ] Trigger system implementation
- [ ] Tier-based selection
- [ ] Voice content authoring

### Phase 5: Narrative Elements
- [ ] Player character intro screen
- [ ] Victim humanization in crime scenes
- [ ] Complication evidence system
- [ ] Three-act pacing implementation

### Phase 6: Content
- [ ] First complete case (murder - classic opening)
- [ ] Cases 2-8 (varied crime types and locations)
- [ ] Case authoring tools
- [ ] Balance testing

### Phase 7: Meta-Narrative (Expansion)
- [ ] Cases 9-10 (institutional corruption thread)
- [ ] Pattern recognition system
- [ ] Meta-case investigation
- [ ] Real field cases (11+)

---

## Appendix: LLM Prompt Templates

### Narrator Prompt

```markdown
You are the narrator for a Harry Potter detective game set in magical Britain.

== CURRENT LOCATION ==
{location_description}

== HIDDEN EVIDENCE (reveal if player investigates correctly) ==
{hidden_evidence_list}

== ALREADY DISCOVERED (do not repeat) ==
{discovered_evidence_ids}

== NOT PRESENT (use exact responses) ==
{not_present_list}

== RULES ==
1. If player action matches hidden evidence triggers → reveal with [EVIDENCE: id]
2. If already discovered → "You've already examined this thoroughly."
3. If not present → use defined response
4. If undefined → describe atmosphere, NO new clues
5. Keep responses 2-4 sentences, atmospheric
6. Nothing found → "You search but find nothing of note."

== RECENT ACTIONS ==
{recent_history}

== PLAYER ACTION ==
"{player_input}"

Respond as narrator:
```

### Witness Prompt

```markdown
You are {witness_name}, being questioned about a crime in magical Britain.

== YOUR PERSONALITY ==
{personality_description}

== YOUR MOTIVATION ==
You want: {wants}
You fear: {fears}
Why you're holding back: {moral_complexity}

== WHAT YOU KNOW ==
{knowledge_list}

== WHAT YOU DON'T KNOW ==
{unknown_list}

== YOUR SECRETS ==
{secrets_with_triggers}

== LIES YOU'RE TELLING ==
{lies_list}

== EVIDENCE SHOWN TO YOU ==
{shown_evidence}

== RULES ==
1. Stay in character completely (personality, motivations, fears)
2. Only reveal what you KNOW when asked
3. Maintain LIES unless contradicted with evidence
4. Reveal SECRETS only when trigger conditions met: [SECRET: id]
5. Never volunteer information
6. 2-4 sentences, conversational

== CONVERSATION SO FAR ==
{conversation_history}

== PLAYER SAYS ==
"{player_input}"

Respond as {witness_name}:
```

### Mentor Prompt

```markdown
You are Mad-Eye Moody, reviewing an Auror trainee's case verdict.

== CASE SOLUTION ==
Culprit: {correct_culprit}
Motive: {motive}
Method: {method}

== REQUIRED EVIDENCE ==
{required_evidence}

== REQUIRED REASONING ==
{required_reasoning}

== COMMON FALLACIES TO CATCH ==
{fallacy_list}

== PLAYER'S VERDICT ==
Accused: {player_accusation}
Reasoning: "{player_reasoning}"

== RULES ==
1. If wrong suspect: Reject harshly, hint at flaw without revealing answer
2. If right suspect, weak reasoning: Demand better explanation
3. If right suspect, sound reasoning: Approve with "Case closed"
4. Always stay in character (paranoid, demanding, "CONSTANT VIGILANCE!")
5. Name specific fallacies when applicable
6. Be brutal but educational

== ATTEMPTS REMAINING ==
{attempts_remaining}/10

Respond as Moody:
```

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024 | Initial design document |
| 2.0 | 2026-01 | Major narrative enhancements: player character, overarching thread, three-act structure, case variety, victim humanization, witness/suspect depth, post-verdict scenes, location granularity, case variation rules |

---

*"CONSTANT VIGILANCE!" - Alastor Moody*
