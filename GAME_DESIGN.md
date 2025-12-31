# Auror Academy: Case Files - Game Design Document

## Core Vision

A sophisticated detective game set in the Harry Potter universe that teaches advanced rationality and critical thinking through morally complex investigations. Players are Auror trainees solving cases that require synthesizing contradictory evidence, managing cognitive biases, and making decisions with incomplete information.

**Target Audience**: Adults who enjoy cerebral mysteries and want to improve their reasoning skills

**Tone**: Late Harry Potter novels (dark, morally ambiguous) meets detective procedurals (methodical, evidence-based)

---

## Core Gameplay Loop

### Phase Structure

Each case follows six phases:

1. **Briefing** - Receive case file with initial information
2. **Hypothesis Formation** - Generate multiple theories and assign initial probabilities
3. **Investigation** - Spend Investigation Points (IP) to gather evidence
4. **Prediction** - Lock in final probability estimates
5. **Resolution** - Truth is revealed
6. **Case Review** - Detailed feedback on reasoning quality and biases

---

## Core Mechanics

### 1. Conditional Hypothesis Unlocking

**Concept**: Investigation reveals new theories you couldn't have considered initially.

**How It Works**:
- **Tier 1 Hypotheses** (3-4): Available from briefing, represent surface-level reasoning
- **Tier 2 Hypotheses** (2-3): Unlock during investigation when you find contradictions or specific evidence

**Unlock System**:
- **Threshold-based**: Find ANY 2 of 4 related evidence pieces to unlock
- **Multiple paths**: 2-3 different investigation routes can unlock the same hypothesis
- **Design principle**: Correct answer is always Tier 2 (rewards deeper investigation)

**Example Flow**:
```
Start: "Suspect A did it" / "Suspect B did it" / "Suspect C did it"
    ↓
Investigate: Find timeline contradiction
    ↓
Unlock: "Someone is covering for someone else"
    ↓
Investigate: Find evidence type X
    ↓
Unlock: "This wasn't intentional" / "Multiple contributing factors"
```

---

### 2. Evidence Contradictions

**Concept**: Evidence that conflicts, forcing reconciliation and deeper reasoning.

**Mission 1 Types**:

**Direct Contradictions** (simple):
- Witness A says X happened at time T1
- Witness B says X happened at time T2
- Resolution: One is mistaken, or both are partially correct

**Design Principles**:
- Every contradiction has a logical resolution (no arbitrary "gotchas")
- Contradictions should point toward Tier 2 hypotheses
- Some contradictions are resolvable through additional investigation
- Others require logical inference

**Player Impact**:
- Must track conflicting information
- Learn to seek disambiguating evidence
- Understand that witnesses can be honest but wrong

---

### 3. Investigation Point Economy

**Mission 1 Allocation**: 12 IP total

**Strategic Tension**:
- **Minimum path to solve**: 6-7 IP (efficient route)
- **Thorough investigation**: 10-12 IP (explore multiple paths)
- **Can't do everything**: Creates meaningful choice

**Evidence Costs**:
- Low cost (1-2 IP): Readily available information, lower information value
- Medium cost (2-3 IP): Requires effort, moderate information gain
- High cost (3-4 IP): Difficult to obtain, high information value

**Multiple Paths Design**:
- 2-3 different evidence pieces can unlock the same hypothesis
- Players choose which path to pursue based on IP budget
- No single "mandatory" evidence piece (except narrative key moments)

---

### 4. Productive Failure System

**Principle**: Wrong investigation paths should teach, not just punish.

**Implementation**:
- **No zero-value actions**: Every investigation yields something
- **Red herrings give clues**: Investigating innocent Suspect X reveals info about Suspect Y
- **Elimination is valuable**: "Now we KNOW it's not X" is progress
- **Bias feedback**: Wrong paths reveal YOUR reasoning errors in debrief

**Example**:
```
Player investigates Suspect A heavily (confirmation bias)
→ Spends 5 IP on Suspect A evidence
→ All evidence weakens Suspect A hypothesis
→ Wasted IP? No:
   - Learned Suspect A is innocent (elimination)
   - One piece mentions Suspect B (bonus info)
   - Debrief shows: "You focused on A because briefing suggested it"
```

---

### 5. Dual Metric Scoring System

**Calibration Score**: How accurate were your probability estimates?
- Compare final probabilities to truth
- Perfect calibration = assigned high probability to correct answer, low to wrong ones
- Measures Bayesian thinking quality

**Confirmation Bias Score**: Did you investigate your favorite theory too much?
- Tracks which hypothesis you initially favored
- Measures % of investigation focused on that hypothesis
- Low score (20-40%): Well-diversified investigation
- High score (70%+): Tunnel vision detected

**Additional Metrics** (shown in debrief):
- Critical evidence found vs. missed
- Investigation efficiency (information gained per IP spent)
- Probability update direction (did evidence move you toward or away from truth?)

---

## Mission 1: Design Specifications

### Complexity Level
- **Mechanics**: Conditional unlocking + Direct contradictions only
- **Hypothesis tiers**: 2 tiers (start with 3-4, unlock 2-3 more)
- **Contradictions**: 2-3 direct contradictions with clear resolutions
- **Hints at future mechanics**: One easy interpretive contradiction, evidence synthesis shown but not required

### Investigation Structure
- **Investigation Points**: 12 IP
- **Total evidence pieces**: 16-20 actions available
- **Unlock paths**: Each Tier 2 hypothesis has 2-3 paths to unlock
- **Red herrings**: 2-3 innocent suspects with plausible motives

### Narrative Elements
- **Morally grey characters**: All suspects have understandable motivations
- **No pure villains**: Even guilty party has sympathetic context
- **Moral orientation**: Plot shows why people do things, not just what they did
- **Mature themes**: Betrayal, desperation, professional jealousy with real consequences

### Learning Objectives
Players should learn:
- Surface-level theories are often wrong (Tier 1 vs Tier 2)
- Contradictions point to deeper truth
- Multiple investigation paths exist (strategic thinking)
- Confirmation bias makes you waste resources
- Probability calibration matters

### Difficulty Modes
- **Novice**: 15 IP, more obvious unlock paths
- **Normal**: 12 IP, balanced challenge (default)
- **Expert**: 9 IP, requires strategic planning

---

## ⚠️ SPOILER WARNING: Mission 1 Plot Details Below

**[User requested plot details remain secret - design to be completed separately]**

Mission 1 plot will be designed separately and kept confidential. General parameters:
- 3-4 initial suspects with plausible motives
- At least one major timeline contradiction
- Tier 2 hypotheses reveal mechanism/method not obvious from briefing
- Resolution involves understanding why not just who
- Morally complex - guilty party is sympathetic

---

## Future Missions: Raw Ideas

### Mission 2: "The Synthesis Case"
**New Mechanic**: Evidence Synthesis
- Individual clues are meaningless alone
- Must combine 3-4 pieces to see the pattern
- Teaches: Looking for connections, not just accumulating facts

**Thematic Element**: Class warfare
- House-elf testimony dismissed by pure-bloods
- Player must decide whether to trust "low status" witnesses

---

### Mission 3: "The Unreliable Narrator"
**New Mechanic**: Source Credibility Assessment
- Witnesses have hidden motives to lie
- Must investigate the investigators
- Evidence can be tampered with

**Thematic Element**: Institutional corruption
- Ministry pressure to close case quickly
- Political implications of different suspects

---

### Mission 4: "The Partial Truth"
**New Mechanic**: Multi-Causal Resolutions
- Multiple people partially responsible
- No single "correct answer"
- Nuanced probability distribution scores higher than binary choice

**Thematic Element**: Systemic injustice
- Crime is symptom of larger system failure
- Individual guilt vs. structural causes

---

### Mission 5: "The Underdetermined Case"
**New Mechanic**: Epistemic Humility
- Not all evidence can be found
- Multiple theories remain plausible
- Player must accept uncertainty

**Thematic Element**: Trauma and PTSD
- Witness memories are genuinely unreliable (not lying)
- Past violence affects present judgment

---

### Mission 6: "The Time Pressure"
**New Mechanic**: Evidence Expiration
- Some leads go cold if not pursued quickly
- Strategic triage of investigation priorities
- Real-time consequences

**Thematic Element**: Justice vs. Revenge
- Victim's family wants vengeance, not due process
- Player must navigate competing demands

---

## Progressive Complexity Curve

### Mechanical Progression
- **Mission 1**: Conditional unlocking + Contradictions
- **Mission 2**: Add Evidence synthesis
- **Mission 3**: Add Unreliable sources
- **Mission 4**: Add Multi-causal resolutions
- **Mission 5**: Add Epistemic uncertainty
- **Mission 6**: Add Time pressure

### Thematic Progression
- **Mission 1**: Individual moral greyness
- **Mission 2**: Class and status
- **Mission 3**: Institutional power
- **Mission 4**: Systemic justice
- **Mission 5**: Personal trauma
- **Mission 6**: Competing values

### Hypothesis Tier Progression
- **Mission 1**: 2 tiers
- **Mission 2-3**: 2 tiers (more complex)
- **Mission 4-5**: 3 tiers
- **Mission 6**: 3 tiers + dynamic generation

---

## Design Principles

### 1. Realism Over Contrivance
- Hypotheses must have reasonable base rates
- No "what are the odds?" coincidences
- Evidence follows logical chains
- Human behavior makes psychological sense

### 2. Multiple Paths to Truth
- 2-3 investigation routes per major discovery
- No single mandatory evidence (except narrative beats)
- Different players can solve via different reasoning

### 3. Failure Teaches
- Wrong paths yield partial information
- Biases are revealed through gameplay, not lectures
- Debrief explains WHY you made mistakes

### 4. Complexity Scaffolds
- Each mission adds ONE new mechanic
- Previous mechanics are reinforced
- Final missions combine all skills

### 5. Mature Without Gratuitous
- Adult themes serve the mystery
- Violence/drama are contextual, not exploitative
- Social questions emerge from plot, not preached

---

## Player Progression System

### Across Multiple Cases

**Calibration Curve**: Track probability accuracy over time
- Shows if player is improving at Bayesian thinking
- Graphs confidence vs. actual correctness

**Bias Reduction**: Track confirmation bias scores
- Shows learning to investigate diversely
- Celebrates improvement, not just perfection

**Strategic Efficiency**: Information gained per IP spent
- Shows if player is learning to prioritize high-value evidence
- Identifies investigation style (thorough vs. efficient)

**Mastery Levels** (per rationality skill):
- Novice → Competent → Proficient → Expert → Master
- Each mechanic (synthesis, source evaluation, etc.) tracks separately
- Unlocks harder cases when skills improve

### Rank Progression
- **Trainee** (Mission 1)
- **Junior Auror** (Mission 2-3)
- **Auror** (Mission 4-5)
- **Senior Auror** (Mission 6+)
- **Head Auror** (Mastery of all skills)

---

## Success Metrics

### Case Completion Quality

**Novice**: Found answer but poor strategy (high bias, missed critical evidence)
**Competent**: Found answer with decent strategy
**Proficient**: Found answer, low bias, good calibration
**Expert**: Optimal investigation path, excellent calibration
**Master**: Expert + identified additional insights beyond official resolution

### What "Good Play" Looks Like
- Generates 3+ hypotheses before investigating
- Updates probabilities based on evidence (visible Bayesian thinking)
- Investigates competing theories (low confirmation bias)
- Resolves contradictions rather than ignoring them
- Acknowledges uncertainty (doesn't force 100% confidence inappropriately)
- Synthesizes evidence rather than just accumulating it

---

## Design Document Status

**Version**: 1.0
**Last Updated**: 2025-12-28
**Status**: Foundation established, Mission 1 design in progress

**Next Steps**:
1. Complete Mission 1 plot design (confidential)
2. Create technical specification for implementation
3. Design Mission 2 conceptually
4. Prototype Mission 1 mechanics
