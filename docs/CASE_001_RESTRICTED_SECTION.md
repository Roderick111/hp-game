# Case 001: The Restricted Section

## Opening Scene: First Day at Auror Academy

```yaml
setting: "Auror Office, Ministry of Magic - Department of Magical Law Enforcement"
time: "8:00 AM, first day of training"
present: "Mad-Eye Moody, Player Character"

scene:
  description: |
    The Auror Office is smaller than you imagined. Battered desks crowd the
    space, case files stacked in precarious towers. Wanted posters line the
    walls—some faces you recognize from the war, others unfamiliar.

    In the corner office, Mad-Eye Moody sits behind a scarred oak desk. His
    magical eye spins independently, fixing on you as you enter. The normal
    eye remains cold, assessing.

  dialogue:
    - speaker: "moody"
      line: |
        "Close the door, recruit. Sit."

        [You sit. The magical eye continues its rotation, seeing through walls,
        through floors, never resting.]

        "You're fresh from Hogwarts. Top marks in Defense, I'm told. Dueling
        champion. Excellent. Completely USELESS for Auror work."

    - speaker: "player_reaction"
      options:
        - "[Stay silent]"
        - "\"I thought combat skills were important?\""
        - "\"Then why did you accept me?\""

    - speaker: "moody"
      line: |
        "Any fool can throw a Stunner. Real Auror work? THINKING. Deduction.
        Seeing what others miss. CONSTANT VIGILANCE isn't about wand reflexes—
        it's about your MIND.

        [Slides a thick file across the desk]

        This is your training program. Historical cases. Closed investigations
        from the past decade. Each one was solved, filed, forgotten. You're
        going to solve them AGAIN."

    - speaker: "player_reaction"
      options:
        - "\"Why solve cases that are already closed?\""
        - "\"What if I get it wrong?\""
        - "[Open the file]"

    - speaker: "moody"
      line: |
        "Because I need to know if you can THINK. Any idiot with a wand can
        follow orders. I need Aurors who question. Investigate. Find truth
        even when it's buried.

        [Leans forward, magical eye fixed on you, normal eye narrowed]

        You'll get ten attempts per case. Wrong answer? I'll tell you you're
        wrong. Wrong reasoning? I'll tell you you're PATHETIC. But I won't
        tell you the solution. You figure it out or you fail.

        And recruit? Some of these cases? The 'official' solution might not
        be the REAL solution. Ministry closes cases for lots of reasons.
        Politics. Convenience. Cowardice.

        Your job: find the TRUTH. Not the comfortable answer. The truth."

    - speaker: "player_reaction"
      options:
        - "\"Understood, sir.\""
        - "\"What if I find something the Ministry doesn't want found?\""
        - "\"I'm ready.\""

    - speaker: "moody"
      line: |
        [Grim smile]

        "Then we'll see what you're made of.

        [Pulls out a specific file, drops it on top]

        First case: Hogwarts, three years ago. Fourth-year Ravenclaw, Helena
        Blackwood. Found dead in the Restricted Section of the library. Bookshelf
        collapsed on her. Official ruling: tragic accident.

        [Magical eye swivels to the file, normal eye on you]

        You'll investigate the scene—it's been preserved magically for training
        purposes. Interview witnesses. Examine evidence. Submit your verdict to
        me when you're ready."

    - speaker: "player_reaction"
      options:
        - "\"An accident? Or something else?\""
        - "\"Where do I start?\""
        - "[Nod and listen]"

    - speaker: "moody"
      line: |
        [Leans back, magical eye fixing on you]

        "Good question. Where DO you start?

        Most recruits jump straight to theories. 'Murder!' 'Conspiracy!'
        'Dark wizards!' Dramatic thinking gets Aurors killed.

        Here's what I want from you, recruit: Before you even LOOK at
        the specific evidence in this case, answer me this—

        Out of 100 student deaths at Hogwarts ruled 'accidents,' how many
        actually ARE accidents? Not murders in disguise. Just... accidents."

    - speaker: "player_guess"
      prompt: "Your estimate?"
      options:
        - "○ 10-20% (Most are actually murders)"
        - "○ 40-60% (About half and half)"
        - "○ 80-90% (Most are genuine accidents)"
        - "○ I don't know"

    - speaker: "moody"
      line: |
        [If player guessed correctly]
        "85%. Not bad. You're thinking."

        [If player guessed dramatically low]
        "10%? You've been reading too many mystery novels, recruit."

        [All paths continue:]

        "85%. Eighty-five percent. Hogwarts is DANGEROUS. Moving staircases.
        Cursed artifacts. Students experimenting with magic they barely
        understand. Forbidden Forest full of things that want to eat them.

        Most of the time? An accident is just an accident.

        [Taps the case file]

        So THAT'S where you start with Helena Blackwood. Probably an accident.
        Tragic, but straightforward. Then you look at the EVIDENCE. Maybe it
        changes your mind. Maybe it doesn't.

        But you don't go looking for murder because it's more INTERESTING.
        You go looking for TRUTH—even if the truth is boring.

        [Magical eye swivels to fix on you]

        Start with what's LIKELY. Let evidence tell you if you're wrong.
        That's the first rule. Remember it."

    - speaker: "player_reaction"
      options:
        - "\"Start with likely scenarios. Got it.\""
        - "\"But if it's probably an accident, why investigate?\""
        - "[Stay silent]"

    - speaker: "moody"
      line: |
        [If player questions why investigate]
        "Because 15% of the time, it's NOT an accident. And if you assume
        it is, you let a killer walk free. We check. Always."

        [All paths continue:]

        "Right. Now here's what you need to know about investigation basics..."

  tutorial_briefing:
    moody_teaches: |
      MOODY: "Right. Investigation fundamentals. Pay attention.

      EXPLORATION: You can go anywhere in the crime scene. Examine anything.
      Ask about anything. Type what you want to investigate—I'm not holding
      your hand with a list of 'correct' actions.

      SPELLS: You have basic investigation spells. I'll teach you as needed.
      Start with REVELIO—reveals hidden objects and magical traces. Point your
      wand, say 'Revelio,' and pay attention to what it shows you.

      EVIDENCE: When you find something important, you'll know. It gets logged
      automatically. Check your evidence board anytime to review what you've found.

      WITNESSES: People lie. People forget. People see what they want to see.
      Your job is to figure out which. Press them. Show them evidence. Make
      them PROVE their story.

      VERDICT: When you think you know who did it and WHY, you submit to me.
      Name the culprit. Explain your reasoning. If you're wrong, I'll tell you.
      You get ten attempts. Use them wisely.

      [Stands, magical eye spinning]

      Questions?"

    player_options:
      - "\"What spells can I use?\""
      - "\"What if I get stuck?\""
      - "\"No questions. I'm ready to start.\""

    moody_responses:
      spells_question: |
        "REVELIO, HOMENUM REVELIO, SPECIALIS REVELIO, PRIOR INCANTATO. Basic
        investigation toolkit. I'll explain each when relevant. Don't try
        fancy magic you don't understand—you'll contaminate the crime scene."

      stuck_question: |
        "Then you THINK HARDER. I won't give you hints. Evidence is there.
        Logic is there. You find it, or you fail and learn why."

      ready_response: |
        "Good. Confident. We'll see if it's deserved.

        [Tosses you a file folder]

        Helena Blackwood. Fourth-year Ravenclaw. Brilliant student, obsessed
        with wandlore research. Found dead under a collapsed bookshelf in the
        Restricted Section, 10:30 PM, three years ago.

        The scene is preserved in the Hogwarts library. Witnesses are available
        for questioning. Evidence is waiting for you to FIND it.

        [Points to the door]

        Portkey to Hogwarts leaves in five minutes. Don't waste time. And recruit?

        CONSTANT. VIGILANCE."

  transition:
    narration: |
      You take the file. The weight of it feels significant—your first real case.
      Even if it's already solved, even if it's just training, someone DIED.
      Helena Blackwood deserves better than being a training exercise.

      Time to prove you can think like an Auror.

      [The Portkey—a battered quill—glows blue. You touch it, and the office
      spins away...]
```

---

## Case Identity

```yaml
case:
  id: "case_001_restricted_section"
  title: "The Restricted Section"

  crime_type: "murder"
  hook: "Brilliant Ravenclaw found dead in Restricted Section with her own wand missing"
  twist: "Killer never touched victim - used Levitation to stage accident"

  rationality_lesson: "Confirmation bias - don't assume obvious suspect based on motive alone"

  tutorial_focus:
    - "Teaches Revelio (find hidden evidence)"
    - "Teaches Prior Incantato (wand analysis)"
    - "Teaches Homenum Revelio (find hidden person)"
    - "Teaches Specialis Revelio (identify substances)"
```

---

## Setting

```yaml
location_structure: "large_building"
primary_location: "hogwarts_library"

locations:
  library_main_hall:
    type: "macro"
    description: |
      The library's main hall stretches before you, towering shelves casting
      long shadows in the lamplight. Students' desks dot the space, most
      abandoned at this late hour. Madam Pince's desk sits empty near the
      entrance, her usual vigilance absent.

      The Restricted Section lies beyond a roped barrier to your left, its
      iron gate slightly ajar. Deeper in the main hall, study alcoves provide
      privacy for focused research.

    exits: ["restricted_section", "study_alcove", "madam_pince_office"]

    hidden_evidence:
      students_dropped_quill:
        triggers: ["examine desks", "search student area", "look at desks"]
        reveals: |
          You examine the nearest desk. Most are tidy, but one has a dropped
          quill, ink still wet. Someone left in a hurry—recently.
        evidence_id: "wet_quill"

  restricted_section:
    type: "micro"
    description: |
      Past the iron gate, the Restricted Section feels different. Colder.
      Darker books line these shelves—grimoires, forbidden texts, dangerous
      knowledge. The air itself feels heavy with old magic.

      Near the back, between shelves on Advanced Transfiguration and Dark
      Creature Defenses, you find her: Helena Blackwood, fourth-year Ravenclaw.
      She lies crumpled beneath a toppled bookshelf, ancient tomes scattered
      around her body. Her eyes stare at nothing, brilliant mind gone silent.

      You remember her from the library—always buried in wandlore texts,
      muttering about core resonance frequencies. Someone silenced that
      curiosity permanently.

    crime_scene: true

    surface_elements:
      - "Victim (Helena Blackwood) beneath toppled bookshelf"
      - "Scattered books from Dark Creature Defenses section"
      - "Broken lantern on floor, oil spread"
      - "Victim's reading notes on nearby table"

    hidden_evidence:
      victim_hand_position:
        triggers: ["examine victim closely", "check helena", "inspect body"]
        reveals: |
          Her right hand is outstretched, fingers curled as if grasping for
          something. Her wand is missing. Defensive bruises on her forearm—
          she raised her arm to shield herself from the falling shelf.
        evidence_id: "missing_wand_defensive_posture"

      bookshelf_base:
        triggers: ["examine bookshelf", "check shelf base", "inspect toppled shelf"]
        reveals: |
          The heavy oak bookshelf lies across her torso. You examine the base.
          The floor shows scuff marks—not from falling, but from sliding.
          Someone moved this shelf recently.
        evidence_id: "shelf_moved_deliberately"

      ceiling_marks:
        triggers: ["look up", "examine ceiling", "revelio"]
        reveals: |
          You cast Revelio upward. Faint scorch marks on the ceiling beam
          above where the shelf stood. The mark pattern—Wingardium Leviosa,
          powerful enough to lift several hundred pounds.
        evidence_id: "levitation_scorch_marks"

      reading_notes:
        triggers: ["examine notes", "check table", "read notes"]
        reveals: |
          Her notes cover wandcore resonance theory. The last entry, written
          minutes before death: "Argus claims Mrs. Norris detected 'dark magic'
          in Restricted Section last week. Investigating. Dragon heartstring
          cores show unusual reaction to—"

          The sentence cuts off mid-thought.
        evidence_id: "helena_research_notes"

  study_alcove:
    type: "micro"
    description: |
      A private study alcove between shelves. A desk, chair, and small lamp.
      Someone was here recently—the lamp is still warm.

    hidden_evidence:
      slytherin_scarf:
        triggers: ["search alcove", "examine desk", "revelio"]
        reveals: |
          Behind the desk, a green Slytherin scarf, hastily shoved out of sight.
          The silver embroidery shows the initials "M.F."—Marcus Flint.
        evidence_id: "flints_scarf"

      listening_position:
        triggers: ["where does alcove connect", "proximity to restricted section"]
        reveals: |
          You realize this alcove is adjacent to the Restricted Section wall.
          Someone sitting here could hear conversations through the shelves.
        evidence_id: "alcove_proximity"

  madam_pince_office:
    type: "micro"
    description: |
      Madam Pince's small office behind the main desk. Meticulously organized,
      every book catalogued, every quill in place. She's not here—Moody
      mentioned she's being interviewed separately.

    hidden_evidence:
      checkout_log:
        triggers: ["check records", "examine log", "library records"]
        reveals: |
          The checkout log shows Helena signed in to Restricted Section at
          9:47 PM (requires prefect permission).

          Argus Filch's patrol log: last walked past library at 9:30 PM.

          No other official entries, but—you notice eraser marks on 10:15 PM
          line. Someone removed an entry.
        evidence_id: "erased_log_entry"
```

---

## Characters

### Victim

```yaml
victim:
  name: "Helena Blackwood"
  age: "Fourth-year Ravenclaw"
  status: "deceased"

  humanization: |
    Fourth-year Ravenclaw. You remember her from the library—always
    buried in wandlore texts, muttering about core resonance frequencies.
    Brilliant, obsessive, the kind of student who'd sneak into the Restricted
    Section for research long after curfew. Someone silenced that curious
    mind permanently.

  connection: "classmate"
  memorable_trait: "Wandlore obsessive, talked to herself while researching"

  background:
    - Top of her year in Charms and Transfiguration
    - Known for asking uncomfortable questions in Defense Against Dark Arts
    - Recently became interested in "dark magic detection theory"
    - Had public argument with Marcus Flint two days ago about "Slytherin cheating"

  time_of_death: "approximately 10:05 PM (Moody's estimate based on body temp)"
```

### Suspects

```yaml
suspects:
  marcus_flint:
    name: "Marcus Flint"
    role: "Seventh-year Slytherin, Quidditch Captain"
    age: 17

    personality: "Aggressive, competitive, defensive about house reputation"

    wants: "Protect Slytherin house honor, win Quidditch Cup"
    fears: "Being expelled so close to graduation, father's disappointment"
    moral_complexity: |
      Marcus has a temper and makes poor choices, but he's not a killer.
      He's terrified of authority and genuinely believes following rules
      (even unfair ones) is how you survive. The confrontation with Helena
      was public and stupid, but he'd never risk Azkaban over an insult.

    means_motive_opportunity:
      means: "Knows Wingardium Leviosa, powerful enough for heavy objects"
      motive: "Helena publicly accused him of cheating in Potions (house points deducted)"
      opportunity: "Was in library that night (scarf proves presence)"

    alibi: "Claims he was in Slytherin common room 9-11 PM"
    alibi_strength: "weak - other students asleep, can't confirm"

    interrogation:
      initial_demeanor: "Defensive, angry, demands to know why he's being questioned"

      knowledge:
        knows:
          - "Had argument with Helena two days ago (public, in Great Hall)"
          - "Helena accused him of using Felix Felicis in Potions class"
          - "He WAS in library earlier (7-8 PM) but left before curfew"
          - "Lost his scarf somewhere in library, couldn't find it"
        doesnt_know:
          - "Helena was researching dark magic detection"
          - "Who actually killed her"
          - "About erased log entry"

      secrets:
        - id: "was_being_blackmailed"
          trigger: "show evidence of potion cheating OR press about Helena's accusations"
          reveals: |
            "Fine! YES, I used Felix Felicis in Potions. Once. ONCE. My father
            expects perfection and I was failing. Helena saw me, threatened to
            report me unless I threw the next Quidditch match.

            I went to the library that night to BEG her not to ruin my life.
            But she wasn't there when I arrived—or I couldn't find her. I left
            my scarf by accident and got out before curfew. That's ALL."
          emotional_cost: "Breaks down, terrified of expulsion"

      lies:
        - claim: "Never went to library that night"
          truth: "Went at 7 PM to find Helena, left before curfew"
          exposed_by: "His scarf in study alcove"

  argus_filch:
    name: "Argus Filch"
    role: "Hogwarts Caretaker (Squib)"
    age: "~60s"

    personality: "Bitter, resentful, petty, obsessed with catching rule-breakers"

    wants: "Punish students who flaunt their magic, maintain order HIS way"
    fears: "Being seen as useless, losing job (his only power), wizards' contempt"
    moral_complexity: |
      Filch has spent decades watching magical children learn what he can
      never do. That kind of resentment festers. He HATES students in the
      Restricted Section after hours—it's everything he can't have, being
      flaunted. But he's not a murderer. He's a small, mean man who lives
      for petty authority. Killing would make him the monster wizards already
      think he is.

    means_motive_opportunity:
      means: "NO magical ability (squib), but knows castle layout, could stage accident physically"
      motive: "Helena caught him trying to read Restricted books (humiliating for a squib)"
      opportunity: "Patrol route passes library, was in area around 10 PM"

    alibi: "Claims he was patrolling corridor outside library 9:30-10:30 PM"
    alibi_strength: "weak - alone, no witnesses"

    interrogation:
      initial_demeanor: "Hostile, defensive, assumes he's being blamed because he's a squib"

      knowledge:
        knows:
          - "Helena was in Restricted Section frequently (against rules)"
          - "Saw her enter Restricted Section at 9:47 PM (from doorway)"
          - "Mrs. Norris detected 'something wrong' in library last week (unusual behavior)"
          - "Heard raised voices from inside around 10 PM but didn't investigate"
        doesnt_know:
          - "Who else was in library"
          - "What Helena was researching specifically"
          - "About the levitation scorch marks"

      secrets:
        - id: "found_helena_body_first"
          trigger: "press about timeline OR show evidence he was closer"
          reveals: |
            "Fine. I heard a CRASH around 10:05. Went inside and found her.
            Bookshelf on top of her, clearly dead. I KNEW how it would look—
            squib caretaker, dead magical student, Restricted Section. They'd
            blame ME.

            So I left. Came back at 10:30 with Madam Pince, 'discovered' the
            body together. Let HER report it. I'm not stupid. This school's
            been waiting for an excuse to get rid of me for years."
          emotional_cost: "Bitter, angry, but also afraid"

        - id: "tried_to_read_restricted_books"
          trigger: "ask about Mrs. Norris behavior OR why he cares about Restricted Section"
          reveals: |
            "Last week I... I was in there. Late night. Trying to read about
            squib reversal treatments. Mrs. Norris started yowling—someone
            was coming. I left fast.

            Next day, Helena approached me. Said she saw me. Said she was
            researching 'magical residue detection' and my presence showed
            up. Offered to help me—HELP me!—like I'm some charity case.

            I told her to mind her own business. But I didn't KILL her!"
          emotional_cost: "Humiliated, vulnerable"

      lies:
        - claim: "Heard nothing unusual"
          truth: "Heard crash at 10:05 PM, found body"
          exposed_by: "Timeline inconsistency when he 'discovered' body"

  adrian_clearmont:
    name: "Adrian Clearmont"
    role: "Sixth-year Ravenclaw Prefect"
    age: 16

    personality: "Brilliant but insecure, compulsively competitive, perfectionist"

    wants: "Be recognized as brightest in Ravenclaw, earn Outstanding in all N.E.W.T.s, secure Ministry Honors Program placement"
    fears: "Being outshined by younger students, losing prefect status, disappointing parents"
    moral_complexity: |
      Adrian has spent six years being the smartest Ravenclaw. It defines him.
      Then Helena—two years younger—starts asking questions he can't answer,
      solving problems faster than him, making HIM look average.

      He's not evil. He's terrified. His entire identity is "the brilliant one,"
      and a fourth-year is dismantling that. But Adrian solves problems with
      studying harder, not violence. He's a teenager drowning in pressure, not
      a killer.

    means_motive_opportunity:
      means: "Knows Wingardium Leviosa, but not powerful enough for bookshelf (established as weaker caster)"
      motive: "Helena's brilliance threatened his academic standing and prefect reputation"
      opportunity: "Gave Helena permission to enter Restricted Section, could have followed"

    alibi: "Claims he was in Ravenclaw common room studying 9 PM - 11 PM"
    alibi_strength: "moderate - other students saw him, but left briefly around 10 PM"

    interrogation:
      initial_demeanor: "Cooperative but visibly shaken, guilty (but about what?)"

      knowledge:
        knows:
          - "Signed Helena's permission slip to enter Restricted Section at 9:45 PM"
          - "Helena was researching wandlore resonance (he'd been researching same topic)"
          - "She'd recently asked him for help, then surpassed his understanding"
          - "Heard about her death the next morning, felt immediate guilt"
        doesnt_know:
          - "Who actually killed Helena"
          - "About the levitation scorch marks"
          - "About Vector's jealousy or Filch finding the body"

      secrets:
        - id: "followed_helena"
          trigger: "press about timeline OR show evidence he left common room"
          reveals: |
            "I... I did follow her. Not to hurt her! I wanted to see what
            books she was looking at. I needed to understand how she was so
            far ahead.

            I got to the library around 10 PM. Stood outside the Restricted
            Section gate, listening. I heard her talking to someone—an adult,
            sounded like. Arguing about 'collaboration' and 'credit.'

            Then I heard a crash. I panicked and ran. I should have gone in,
            should have helped, but I just... RAN. Back to common room. Pretended
            I'd been there all night.

            If I'd stayed, if I'd been braver, maybe she'd still be alive."
          emotional_cost: "Breaks down crying, consumed with guilt"

        - id: "stole_research_notes"
          trigger: "press about what he was really after OR confront with inconsistency"
          reveals: |
            "Fine. It's worse than just following her. Last week, I took some
            of her research notes from the library. Borrowed them, I told myself.
            To 'understand her methodology.'

            Really? I wanted to beat her to the breakthrough. Use her work,
            publish first, take credit. I'm not proud of it.

            But I gave them BACK two days ago. They're in her notes at the
            crime scene—check them! I couldn't do it. Couldn't steal from her.
            She was just... better than me. And I had to accept that."
          emotional_cost: "Shame, self-loathing"

      lies:
        - claim: "Never left common room that night"
          truth: "Followed Helena to library around 10 PM, fled after crash"
          exposed_by: "Another Ravenclaw mentions he left briefly"

        - claim: "Didn't know what Helena was researching specifically"
          truth: "Had stolen her notes the week before, knew exactly what she was working on"
          exposed_by: "Overly detailed knowledge when pressed"

  professor_vector:
    name: "Professor Septima Vector"
    role: "Arithmancy Professor"
    age: "~40s"

    personality: "Precise, cold, values knowledge above all else"

    wants: "Advance her research, be recognized as leading Arithmancy scholar"
    fears: "Being intellectually surpassed, her research being stolen"
    moral_complexity: |
      Vector is brilliant and knows it. She saw Helena's potential and felt
      THREATENED. A fourth-year asking questions Vector couldn't answer?
      Intolerable. But Vector is also a professor—she has other ways to
      destroy talented students. Harsh grades, denial of recommendations,
      academic sabotage. Murder is beneath her. She fights with equations,
      not violence.

    means_motive_opportunity:
      means: "Powerful witch, expert at Arithmancy and Transfiguration"
      motive: "Helena's wandlore research was approaching breakthrough that would eclipse Vector's work"
      opportunity: "Was in castle, has access to Restricted Section"

    alibi: "Claims she was grading papers in her office 8 PM - midnight"
    alibi_strength: "moderate - office lights were on (ghost confirms), but alone"

    interrogation:
      initial_demeanor: "Cool, professional, slightly annoyed at interruption"

      knowledge:
        knows:
          - "Helena was researching wandcore resonance (impressive for her year)"
          - "Helena asked Vector for permission to access specific Restricted books"
          - "Vector DENIED the request (thought Helena wasn't ready)"
          - "Helena got prefect permission instead (went around Vector)"
        doesnt_know:
          - "Helena was in library that specific night"
          - "Details of Helena's recent discoveries"
          - "About the confrontation with Flint"

      secrets:
        - id: "erased_log_entry"
          trigger: "confront with erased log OR show checkout evidence"
          reveals: |
            "Yes, I was in the Restricted Section that night. I signed in at
            10:15 PM—after Helena, obviously. I wanted to see what books she'd
            requested. Academic curiosity.

            When I arrived, I saw the shelf had fallen. Saw her body. I realized
            how it would appear: jealous professor, dead talented student. So I
            erased my entry and left.

            Cowardly? Perhaps. Murder? Absolutely not. Check my wand if you
            don't believe me."
          emotional_cost: "Admits fear, maintains cold composure"

      lies:
        - claim: "Didn't know Helena was researching that night"
          truth: "Went to Restricted Section specifically to see Helena's progress"
          exposed_by: "Erased log entry at 10:15 PM"

  solution:
    culprit: "professor_vector"

    what_really_happened: |
      Helena made a breakthrough in wandcore resonance theory that would
      revolutionize Arithmancy applications. Vector realized this when Helena
      asked for specific books—books Vector had consulted for her own research.

      Vector went to Restricted Section at 10:15 PM to confront Helena, demand
      to see her notes, possibly threaten her academically to slow her down.
      They argued. Helena refused to share her discovery.

      In a moment of rage and panic—seeing her life's work about to be eclipsed
      by a CHILD—Vector used Wingardium Leviosa to lift the heavy bookshelf
      and dropped it on Helena. The "accident" would be believable: student
      alone in Restricted Section, shelf collapsed, tragic but explainable.

      Vector then took Helena's wand (to prevent Prior Incantato revealing
      Helena had her wand out defensively), erased the library log entry,
      and left. The wand is hidden in Vector's office.

    timeline:
      - time: "9:47 PM"
        event: "Helena enters Restricted Section (logged)"
      - time: "~9:50 PM"
        event: "Filch patrols past library"
      - time: "~10:00 PM"
        event: "Filch hears voices inside (Helena arguing with someone)"
      - time: "10:05 PM"
        event: "CRASH - bookshelf falls, Helena killed"
      - time: "10:05-10:10 PM"
        event: "Filch enters, finds body, panics and leaves"
      - time: "10:15 PM"
        event: "Vector enters (erased from log)"
      - time: "10:15-10:20 PM"
        event: "Vector stages scene, takes wand, erases log entry"
      - time: "10:30 PM"
        event: "Filch returns with Madam Pince, 'discovers' body officially"

    critical_evidence:
      - "levitation_scorch_marks" (proves Wingardium Leviosa used - powerful caster, rules out Adrian who's known as weaker at practical magic)
      - "erased_log_entry" (proves Vector was there)
      - "missing_wand_defensive_posture" (proves Helena saw attack coming)
      - "shelf_moved_deliberately" (proves not accident)
      - "adrian_heard_adult_voice" (from his testimony - proves Helena argued with adult, not peer)

    correct_reasoning_requires:
      - "Recognize scorch marks = Wingardium Leviosa at HIGH POWER (not physical push)"
      - "Connect erased log entry to Vector (only she had motive AND was in area)"
      - "Eliminate Flint (left before 9 PM, scarf proves earlier presence only)"
      - "Eliminate Filch (no magical ability for Wingardium Leviosa)"
      - "Eliminate Adrian (heard adult voice, his power level too weak for that shelf, fled before murder)"
      - "Understand Vector's academic jealousy as motive (professional threat, not peer rivalry)"

    common_mistakes:
      - "Accuse Flint (obvious suspect, strong motive, but wrong timeline)"
      - "Accuse Filch (found body first, suspicious behavior, but no magical means)"
      - "Accuse Adrian (guilty behavior, followed her, stole notes, but fled BEFORE murder + too weak for shelf)"
      - "Miss the levitation evidence (assumes physical shelf collapse)"
      - "Ignore the erased log entry (key proof of Vector's presence)"
      - "Ignore power level (Adrian couldn't lift bookshelf, Vector could)"
```

---

## Evidence List

```yaml
evidence:
  physical:
    missing_wand_defensive_posture:
      description: "Victim's wand missing; hand outstretched, defensive bruises"
      location: "restricted_section"
      significance: "Helena saw attack coming, tried to defend"

    shelf_moved_deliberately:
      description: "Bookshelf base shows scuff marks from being slid, not fallen"
      location: "restricted_section"
      significance: "Shelf was moved into position before being dropped"

    flints_scarf:
      description: "Green Slytherin scarf with 'M.F.' initials in study alcove"
      location: "study_alcove"
      significance: "Proves Marcus was in library, but timing unclear"

    wet_quill:
      description: "Dropped quill at student desk, ink still wet"
      location: "library_main_hall"
      significance: "Someone left recently and hastily"

  magical:
    levitation_scorch_marks:
      description: "Scorch marks on ceiling beam above shelf - Wingardium Leviosa pattern"
      location: "restricted_section"
      significance: "CRITICAL - Proves shelf was levitated magically, not pushed physically"
      trigger: "Revelio on ceiling"

    helena_research_notes:
      description: "Notes on wandcore resonance, mentions Filch and 'dark magic' claim"
      location: "restricted_section"
      significance: "Shows Helena was investigating something, cut off mid-sentence"

  documentary:
    erased_log_entry:
      description: "Library checkout log shows eraser marks at 10:15 PM entry"
      location: "madam_pince_office"
      significance: "CRITICAL - Someone removed their entry, proves presence and cover-up"

    filch_patrol_log:
      description: "Shows Filch patrolled past library at 9:30 PM"
      location: "madam_pince_office"
      significance: "Establishes Filch's movements"

  complication_evidence:
    id: "flints_scarf"
    appears_after_evidence_count: 4
    contradicts: "Initial theory that Flint killed Helena in library"
    teaches: |
      Presence in location ≠ guilt. Need to establish TIMELINE, not just
      opportunity. Flint was there EARLIER (7-8 PM), but that doesn't prove
      he returned at 10 PM. Don't assume first suspicious person is guilty.
```

---

## Magic System Tutorial

```yaml
spell_contexts:
  revelio:
    restricted_section_ceiling:
      works: true
      reveals: "levitation_scorch_marks"
      narration: |
        You cast Revelio upward. The spell illuminates faint scorch marks
        on the ceiling beam—the unmistakable pattern of Wingardium Leviosa
        at high power. Someone lifted something HEAVY here.

        MOODY: "Good instinct. Always check what's NOT at eye level."

      tutorial_moment: |
        MOODY: "Revelio reveals hidden objects and magical residue. Point
        your wand and say 'Revelio.' Works on areas or specific objects.

        Remember: magic leaves traces. CONSTANT VIGILANCE."

    study_alcove:
      works: true
      reveals: "flints_scarf"
      narration: |
        Your wand movement reveals a shimmer behind the desk. You pull out
        a green Slytherin scarf, hastily shoved out of sight. Silver embroidery:
        'M.F.'—Marcus Flint.

  prior_incantato:
    helena_wand_attempt:
      works: false
      reason: "Wand is missing (taken by killer)"
      narration: |
        You search Helena's robes, her hands, the surrounding area. Her wand
        isn't here. That's... unusual. Students don't drop their wands, especially
        not in the Restricted Section where they need light.

        TOM: "Missing wand. Taken by killer? Or did it fall somewhere?"

      tutorial_moment: |
        MOODY: "Prior Incantato shows a wand's last spells. But you need the
        PHYSICAL WAND. Can't cast it on thin air, recruit."

    suspect_wands_later:
      available_after: "Case progression, can request to examine suspect wands"
      flints_wand_result: "Lumos, Alohomora, Lumos (nothing suspicious)"
      vectors_wand_result: "Wingardium Leviosa (very powerful), Obliviate (minor), Lumos"
      filch_has_no_wand: "He's a squib - reinforces he couldn't have cast Wingardium Leviosa"

  homenum_revelio:
    library_sweep:
      works: true
      reveals: "No one currently hiding in library"
      narration: |
        You cast Homenum Revelio, the detection spell spreading through the
        library. The spell returns empty—whoever was here is long gone.

        MOODY: "Homenum Revelio detects hidden persons. Useful for searching
        large areas. But it only shows you WHO'S HERE NOW. Doesn't tell you
        who WAS here."

      tutorial_moment: |
        MOODY: "Homenum Revelio—detects living humans in the area. Won't find
        ghosts, portraits, or animals. And it's NOW, not the past. Remember that."

  specialis_revelio:
    broken_lantern_oil:
      works: true
      reveals: "Standard lamp oil, nothing suspicious"
      narration: |
        You point your wand at the spilled oil. "Specialis Revelio."

        The spell identifies it: standard lamp oil, no poisons, no magical
        enhancement. The lantern broke when the shelf fell—collateral damage,
        not evidence.

      tutorial_moment: |
        MOODY: "Specialis Revelio identifies potions and substances. Useful
        for poisons, unknown liquids, or checking if something's been tampered
        with. Doesn't work on people—only substances."

  general_guidelines:
    wards_present: false
    legal_status: "full_access (Hogwarts investigation, Headmaster authorized)"
    legilimency_forbidden: "Case 1 - Moody will NOT authorize, forbids attempts"
```

---

## Tom's Voice Triggers

**Tom Thornfield:** Failed Auror recruit, Case 1 is player's first time meeting him.

**Introduction:** Tom appears when player finds first evidence, introduces himself casually.

```yaml
tom_triggers:
  # INTRODUCTION (First trigger of game)
  introduction:
    - id: "tom_appears"
      condition: "first_evidence_discovered"
      text: |
        [A translucent figure materializes beside you—young man, early twenties,
        Auror trainee robes from the '90s]

        TOM: "Oh! A new recruit. Haven't seen one in ages. I'm Tom. Thomas
        Thornfield. Well, I WAS. Now I'm... this. [Gestures at his ghostly form]

        Don't worry, Moody can't see me. Or he pretends not to. Either way,
        I can help. Probably. Sometimes. Let's investigate together, yeah?"

  # TIER 1: Early investigation (0-2 evidence pieces)
  tier_1:
    - id: "first_evidence_helpful"
      condition: "evidence_count == 1"
      type: "helpful"
      text: |
        TOM: "First piece of evidence. What does it actually prove? That
        someone was here? When exactly? Why?"

    - id: "first_evidence_misleading"
      condition: "evidence_count == 1"
      type: "misleading"
      text: |
        TOM: "Good find! First clue usually points you toward the culprit.
        Follow that lead."

    - id: "flints_scarf_helpful"
      condition: "discovered(flints_scarf) AND evidence_count < 4"
      type: "helpful"
      text: |
        TOM: "Slytherin scarf, Flint's initials. So he was in the library
        at some point. Students don't usually abandon scarves... unless
        they left in a hurry. When was he here?"

    - id: "flints_scarf_misleading"
      condition: "discovered(flints_scarf) AND evidence_count < 4"
      type: "misleading"
      text: |
        TOM: "Flint's scarf at the crime scene, plus that public argument.
        Physical evidence and motive together—that's usually enough for
        a conviction."

  # TIER 2: Building theory (3-5 evidence pieces)
  tier_2:
    - id: "missing_wand_helpful"
      condition: "discovered(missing_wand_defensive_posture)"
      type: "helpful"
      text: |
        TOM: "Her wand is gone. Why would someone take it? What does a
        wand tell you that the body doesn't? What are they hiding?"

    - id: "missing_wand_misleading"
      condition: "discovered(missing_wand_defensive_posture)"
      type: "misleading"
      text: |
        TOM: "Missing wand probably got buried under the books when the
        shelf fell. Chaotic scene, things get lost. Focus on the suspects."

    - id: "filch_behavior_helpful"
      condition: "filch_admits(found_body_first)"
      type: "helpful"
      text: |
        TOM: "Filch found her and didn't report it. Two possibilities:
        guilty and fleeing, or scared of being blamed. How do you tell which?"

    - id: "filch_behavior_misleading"
      condition: "filch_admits(found_body_first)"
      type: "misleading"
      text: |
        TOM: "He found the body and ran. That's classic guilty behavior.
        Innocent people call for help, they don't flee the scene."

    - id: "adrian_followed_helpful"
      condition: "adrian_admits(followed_helena)"
      type: "helpful"
      text: |
        TOM: "Adrian followed her, heard arguing, ran when the shelf crashed.
        But he said the other voice was an ADULT. If he left before the
        murder, what does that make him?"

    - id: "adrian_followed_misleading"
      condition: "adrian_admits(followed_helena)"
      type: "misleading"
      text: |
        TOM: "Adrian admits he was there, following her, acting suspicious.
        When someone confesses to being at the crime scene, that's strong
        evidence against them."

    - id: "shelf_deliberate_helpful"
      condition: "discovered(shelf_moved_deliberately)"
      type: "helpful"
      text: |
        TOM: "Scuff marks. The shelf was positioned before it fell. Why
        position it? What was the killer setting up?"

    - id: "shelf_deliberate_misleading"
      condition: "discovered(shelf_moved_deliberately)"
      type: "misleading"
      text: |
        TOM: "Scuff marks prove premeditation. This wasn't spontaneous—
        someone planned it. That means someone with a serious grudge,
        like Flint after that argument."

    - id: "timeline_matters_helpful"
      condition: "evidence_count >= 5"
      type: "helpful"
      text: |
        TOM: "You've got suspects and evidence. Now: when was each person
        actually here? Can you verify their timeline?"

    - id: "timeline_matters_misleading"
      condition: "evidence_count >= 5"
      type: "misleading"
      text: |
        TOM: "You've gathered enough evidence to make a case. Don't
        overthink it—the obvious suspect with clear motive is usually right."

  # TIER 3: Critical evidence (6+ pieces OR major revelation)
  tier_3:
    - id: "levitation_marks_helpful"
      condition: "discovered(levitation_scorch_marks)"
      type: "helpful"
      text: |
        TOM: "Scorch marks from Wingardium Leviosa. Someone lifted that
        shelf and dropped it on her. What skill level does that kind of
        power require? Who could cast it?"

    - id: "levitation_marks_misleading"
      condition: "discovered(levitation_scorch_marks)"
      type: "misleading"
      text: |
        TOM: "Wingardium Leviosa scorch marks. Everyone learns that in
        first year—any student could have cast it. Doesn't narrow the
        suspects much."

    - id: "erased_entry_helpful"
      condition: "discovered(erased_log_entry)"
      type: "helpful"
      text: |
        TOM: "Someone erased their library entry after the murder. Who
        would even think to do that? Who has access to the logbook?"

    - id: "erased_entry_misleading"
      condition: "discovered(erased_log_entry)"
      type: "misleading"
      text: |
        TOM: "Erased entry in the logbook. Classic cover-up. Students know
        about the sign-in system—anyone trying to hide would erase it."

    - id: "flint_contradiction_helpful"
      condition: "suspecting(marcus_flint) AND discovered(levitation_scorch_marks)"
      type: "helpful"
      text: |
        TOM: "You're thinking Flint. But when was his scarf there? And
        those levitation marks—check if his skill level matches that power."

    - id: "flint_contradiction_misleading"
      condition: "suspecting(marcus_flint) AND discovered(levitation_scorch_marks)"
      type: "misleading"
      text: |
        TOM: "All roads lead to Flint. His scarf, his motive, magic at
        the scene. Sometimes the obvious answer really is correct."

  # RARE: Self-aware moments (5% chance)
  rare_self_aware:
    - id: "overconfident_like_me"
      condition: "suspecting(marcus_flint) AND high_confidence"
      rarity: 0.05
      text: |
        TOM: "You're very confident it's Flint. I was that confident in
        Case #1. Arrested the wrong person. Maybe check the timeline one
        more time?"

    - id: "rushing_verdict"
      condition: "submitting_verdict AND evidence_count < 5"
      rarity: 0.05
      text: |
        TOM: "Submitting already? I did that in Case #2. 'Enough evidence,'
        I said. There were three rooms I never even searched. Don't be me."

  # RARE: Emotional moment (2% chance)
  rare_emotional:
    - id: "marcus_bellweather"
      condition: "about_to_submit_verdict AND wrong_suspect"
      rarity: 0.02
      text: |
        TOM: [quiet] "Marcus Bellweather. That's who I convicted. He's
        still in Azkaban. Please double-check. Just once more."

  # RARE: Dark humor (3% chance)
  rare_humor:
    - id: "watch_your_step"
      condition: "moving_through_library"
      rarity: 0.03
      text: |
        TOM: "Watch the floorboards. I was so focused on evidence I didn't
        notice the rotten ones. Fell right through. Very undignified death."

    - id: "arrested_wrong_relative"
      condition: "evidence_count >= 3"
      rarity: 0.03
      text: |
        TOM: "At least you're being thorough. In Case #1, I arrested the
        victim's cousin. Turned out to be the uncle. Family trees are
        confusing."
```

---

## Post-Verdict Scene

```yaml
post_verdict:
  wrong_suspect_examples:
    adrian_clearmont:
      moody_response: |
        MOODY: "Clearmont? The PREFECT? Let me guess: he followed her, stole
        her notes, acted guilty. So he must be the killer, right?

        Wrong. He heard an ADULT voice arguing with Helena. He RAN when he
        heard the crash—before the murder, not after. And check the scorch
        marks: that level of Wingardium Leviosa? Adrian couldn't lift a
        CHAIR that high, let alone a bookshelf.

        Guilt doesn't equal murder, recruit. He's guilty of being a coward
        and a cheat. Not a killer. Think harder. {attempts_remaining}/10."

    marcus_flint:
      moody_response: |
        MOODY: "FLINT? You're accusing a student of MURDER based on a scarf
        and an argument? Did you check the TIMELINE, recruit?

        His scarf proves he was there EARLIER. That's it. The shelf fell at
        10:05 PM. He was in his common room by then.

        You've got CONFIRMATION BIAS written all over this case. See suspicious
        person, ignore everything else. PATHETIC.

        Back to the evidence. {attempts_remaining}/10 attempts remaining."

    argus_filch:
      moody_response: |
        MOODY: "Filch. You're accusing a SQUIB of a magical murder. Think about
        that for a second.

        Wingardium Leviosa powerful enough to lift a bookshelf? Filch can't
        even light a candle with magic. Yes, he behaved suspiciously—because
        he was TERRIFIED of being blamed. Fear isn't guilt.

        Use your HEAD. Check the magical evidence. {attempts_remaining}/10."

  correct_suspect:
    confrontation:
      setting: "Professor Vector's office, Moody escorts you"

      dialogue:
        - speaker: "moody"
          line: |
            [Bursts into office] "Professor Vector. We need to discuss what
            happened in the Restricted Section three nights ago."

        - speaker: "vector"
          line: "[Looks up from papers, cool] Tragic accident. I've already given my statement."

        - speaker: "player_presents_evidence"
          line: "[Show levitation scorch marks, erased log entry, missing wand]"

        - speaker: "vector"
          line: |
            [Long pause. Composure cracks slightly]

            "She was a child. A FOURTH-YEAR. And she was about to publish a
            breakthrough in wandcore resonance that I've been researching for
            FIFTEEN YEARS.

            Do you understand what that would mean? My career, my reputation,
            eclipsed by a teenager who barely understood the foundational theory.

            I went to talk to her. To... to slow her down. Offer to collaborate—
            make it OUR discovery. She refused. Called me 'threatened' and
            'small-minded.'

            I just wanted her to WAIT. To give me time. But she wouldn't listen,
            and I... I panicked."

        - speaker: "moody"
          line: |
            "Panicked. You MURDERED a student and you call it panic?"

        - speaker: "vector"
          line: |
            [Quiet, hollow]
            "I took her wand. I thought if there was no evidence of defensive
            magic... it would look like an accident. Just a shelf that fell.

            But you found the scorch marks. I should have known. Arithmancy
            never lies. The equations are always there, if you know where to look."

        - speaker: "moody"
          line: |
            [To player] "Good work, recruit. Take her to holding."

            [To Vector] "Fifteen years of research. And you threw it all away
            because you couldn't stand a student being smarter than you.
            Pathetic."

    aftermath:
      outcome: |
        Professor Vector is arrested and held for trial at the Wizengamot.
        Helena's research notes are turned over to the Department of Magical
        Research, where they credit her posthumously with advancing wandlore
        theory by a decade.

        The Restricted Section is closed for a week while new safety measures
        are implemented. Students hold a candlelight vigil for Helena in the
        library—Ravenclaws turn out in full, and even some Slytherins attend.

        Marcus Flint writes you a short note: "Thanks for not assuming I did it."

        Filch nods at you in the corridor the next day. For him, that's practically
        a thank-you speech.

      moody_final_word: |
        MOODY: "Case closed. {attempts_remaining}/10 attempts remaining.

        You identified the levitation evidence, traced the timeline, and didn't
        fall for the obvious suspect. That's acceptable work.

        But you hesitated when it came to a PROFESSOR. Remember: authority
        doesn't make someone innocent. Question everyone. CONSTANT VIGILANCE."
```

---

## Mentor Evaluation Criteria

```yaml
mentor_criteria:
  correct_suspect: "professor_vector"

  required_evidence_cited:
    - "levitation_scorch_marks (proves magical attack, not accident)"
    - "erased_log_entry (proves Vector was there and covered it up)"
    - "missing_wand (proves Vector took it to hide defensive magic evidence)"

  required_reasoning:
    - "Explain why levitation = magical attack requiring HIGH POWER (Filch can't do it, Adrian too weak)"
    - "Connect erased log entry to Vector's presence at 10:15 PM"
    - "Establish Vector's academic jealousy motive (professional threat, stronger than Adrian's peer rivalry)"
    - "Rule out Flint via timeline (scarf from earlier, not 10 PM)"
    - "Rule out Adrian via testimony (heard adult voice, fled before crash, power level too low)"

  fallacies_to_catch:
    confirmation_bias: "If player ignores evidence to focus on Flint"
    appeal_to_authority: "If player assumes professor couldn't be guilty"
    correlation_not_causation: "If player assumes scarf presence = guilt at time of death"

  acceptable_reasoning_variations:
    - "Can suspect Flint initially, but must UPDATE based on timeline evidence"
    - "Can be unsure about Vector's motive, but must recognize she had MEANS and OPPORTUNITY"
    - "Doesn't need to find wand in Vector's office (player can deduce she took it)"
```

---

*CASE 001 COMPLETE - Tutorial Foundation*
