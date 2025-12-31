import { CaseData } from '../types/game';

export const mission1: CaseData = {
  id: 'AA-2847',
  title: 'The Vanishing Violinist',
  subtitle: 'Training Exercise - Level 1',

  briefing: {
    date: '14 November, 8:47 PM',
    location: 'Malfoy Manor, East Drawing Room',
    victim: 'Elara Thornwood (age 34, witch, professional musician)',
    status: 'Critical condition, St. Mungo\'s, Ward 49',
    summary: `Miss Thornwood was performing a private concert for approximately 12 guests when she collapsed mid-performance. Witnesses report she stopped playing suddenly, clutched her head, and fell unconscious. No visible curse light was observed. She has not regained consciousness despite Healer intervention.`,
    healerReport: `Curse damage consistent with close-range targeted hex, likely cast within the previous hour. Curse signature is unusual—does not match standard patterns in our diagnostic manuals. Victim shows no physical injuries.`,
    initialWitness: {
      name: 'Lucius Malfoy (host)',
      statement: `It was a perfectly normal evening until she collapsed. I have no idea who would want to harm her. She was mid-piece—playing beautifully—and then simply... stopped.`,
    },
    personsOfInterest: [
      {
        id: 'victor',
        name: 'Victor Ashworth',
        description: 'Former romantic partner of victim. Relationship ended acrimoniously 6 months ago. Was present at the concert.',
      },
      {
        id: 'helena',
        name: 'Helena Vance',
        description: 'Rival violinist who lost a prestigious competition to victim last year. Was present at the concert.',
      },
      {
        id: 'narcissa',
        name: 'Narcissa Malfoy',
        description: 'Hostess. No known connection to victim beyond hiring her for the performance.',
      },
    ],
    mentorIntro: `Right then, trainee. Your first real case—well, real enough. The witch is in St. Mungo's, the curse is unknown, and we've got three possible suspects sitting pretty at Malfoy Manor.

Now, I could tell you who I think did it. But that wouldn't teach you a thing, would it? So here's how this works: You investigate. You gather evidence. You tell me what you think happened. And then we'll see how good your thinking really is.

One piece of advice before you start: It's easy to pick a suspect and then look for evidence that proves you right. Feels efficient. Feels smart. But it's a trap. The best Aurors I know? They look for evidence that would prove them *wrong*. If they can't find it, *then* they know they're onto something.

Start by considering all the possibilities. Don't fall in love with a theory before you've done the legwork.

You've got 7 Investigation Points. Spend them wisely.`,
    investigationPoints: 7,
  },

  hypotheses: [
    {
      id: 'victor-guilty',
      label: 'Victor Ashworth (the ex-partner)',
      description: 'Victor Ashworth cast the curse out of revenge for the breakup. Classic "if I can\'t have her, no one can" pattern.',
      isCorrect: false,
    },
    {
      id: 'helena-guilty',
      label: 'Helena Vance (the rival)',
      description: 'Helena Vance cast the curse out of professional jealousy. Removing competition for future opportunities.',
      isCorrect: false,
    },
    {
      id: 'cursed-violin',
      label: 'The curse was on the violin',
      description: 'The curse was placed on the violin itself, not cast during the concert. This would explain why no one saw curse-light. The curse could have been placed earlier by someone with access to the instrument.',
      isCorrect: true,
    },
    {
      id: 'lucius-involved',
      label: 'Lucius Malfoy is involved',
      description: 'Lucius Malfoy is somehow responsible. The Malfoys have Dark Magic history. Worth considering.',
      isCorrect: false,
    },
    {
      id: 'self-inflicted',
      label: 'Self-inflicted (accident or intentional)',
      description: 'The victim cursed herself, either intentionally or accidentally. Motive unclear but should be considered.',
      isCorrect: false,
    },
    {
      id: 'unknown-person',
      label: 'Unknown person not on guest list',
      description: 'An unknown person not on the guest list is responsible. There may be suspects we haven\'t identified yet.',
      isCorrect: false,
    },
    {
      id: 'something-else',
      label: 'Something else entirely',
      description: 'Always keep some probability for possibilities we haven\'t thought of yet—epistemic humility.',
      isCorrect: false,
      isAlwaysAvailable: true,
    },
  ],

  investigationActions: [
    // LOCATIONS
    {
      id: 'crime-scene',
      title: 'Examine the Crime Scene',
      description: 'Search the East Drawing Room where the collapse occurred. Look for magical residue, physical evidence, signs of tampering.',
      cost: 2,
      category: 'location',
      evidence: {
        title: 'Crime Scene Analysis',
        content: `You examine the East Drawing Room where the collapse occurred.

FINDINGS:
• No residual wand-magic detected in the room
• No hidden Dark artifacts found
• Chairs arranged in concert formation; no signs of struggle
• The window was closed and locked from inside
• A faint magical residue lingers near the performance spot, but it's unclear if this is from the curse or normal performance magic`,
        interpretation: 'If someone cast a curse during the performance, they either used wandless magic (rare) or the curse was somehow delayed or indirect. There\'s no sign of a direct wand-based attack from the audience. This evidence weakens theories involving someone casting a curse during the concert.',
        isCritical: false,
      },
      hypothesisImpact: [
        { hypothesisId: 'victor-guilty', impact: 'weakens', weight: 2 },
        { hypothesisId: 'helena-guilty', impact: 'weakens', weight: 2 },
        { hypothesisId: 'cursed-violin', impact: 'supports', weight: 1 },
      ],
    },
    {
      id: 'examine-violin',
      title: 'Examine the Violin',
      description: 'The victim\'s instrument has been secured. Perform detailed magical analysis of the violin itself.',
      cost: 2,
      category: 'location',
      evidence: {
        title: 'Violin Analysis',
        content: `You cast diagnostic spells on the victim's violin.

FINDINGS:
• The violin itself carries a strong curse residue
• The curse appears to be embedded in the rosin on the bow
• Analysis indicates the curse was designed to activate after prolonged contact—approximately 45 minutes of playing
• The curse signature is complex, suggesting significant Dark Arts knowledge
• The rosin was recently applied—within the past week`,
        interpretation: 'The curse was delivered through the violin, not cast during the performance. Someone with access to the instrument cursed the rosin. The victim was doomed the moment she began playing. This strongly supports the "curse on the violin" hypothesis.',
        isCritical: true,
      },
      hypothesisImpact: [
        { hypothesisId: 'cursed-violin', impact: 'supports', weight: 3 },
        { hypothesisId: 'victor-guilty', impact: 'weakens', weight: 2 },
        { hypothesisId: 'helena-guilty', impact: 'weakens', weight: 2 },
      ],
    },
    {
      id: 'search-victor-quarters',
      title: 'Search Victor Ashworth\'s Quarters',
      description: 'He\'s been staying at a nearby inn. Search for evidence of curse preparation, Dark artifacts, or other incriminating items.',
      cost: 2,
      category: 'location',
      evidence: {
        title: 'Ashworth\'s Inn Room Search',
        content: `You search Victor Ashworth's room at the local inn.

FINDINGS:
• Standard traveling supplies, nothing suspicious
• A bundle of letters from Elara Thornwood, kept neatly
• A pressed flower in a book of poetry (sentimental)
• His wand shows no recent Dark magic
• No curse preparation materials, no Dark artifacts
• A concert program from the previous night, with "Good luck, E" written in the margin in his handwriting`,
        interpretation: 'He appears to still have feelings for her. This looks like a man who came to see someone he misses, not to attack them. This evidence weakens the Victor Ashworth hypothesis.',
        isCritical: false,
      },
      hypothesisImpact: [
        { hypothesisId: 'victor-guilty', impact: 'weakens', weight: 3 },
      ],
    },

    // WITNESSES
    {
      id: 'interview-victor',
      title: 'Interview Victor Ashworth',
      description: 'The ex-partner. Last saw victim 6 months ago... or did he?',
      cost: 2,
      category: 'witness',
      evidence: {
        title: 'Victor Ashworth Interview',
        content: `Victor Ashworth appears genuinely distressed. He speaks quickly and defensively.

KEY STATEMENTS:
"Yes, we ended badly. Yes, I was angry. But that was months ago. I came tonight because... I still care about her. I wanted to hear her play one more time. Is that so strange?"

"I was in the back of the room the entire concert. At least five people can confirm that. I never moved from my seat."

"I haven't touched a Dark curse in my life. Check my wand if you want. I'm a Potions supplier, for Merlin's sake."

OBSERVATIONS:
• His wand shows no recent curse activity
• His alibi for the time of the concert appears solid
• He does seem to have lingering feelings for the victim`,
        interpretation: 'His alibi is solid and his wand is clean. He appears to still care for the victim. This evidence weakens the Victor Ashworth hypothesis.',
        isCritical: false,
      },
      hypothesisImpact: [
        { hypothesisId: 'victor-guilty', impact: 'weakens', weight: 2 },
      ],
    },
    {
      id: 'interview-helena',
      title: 'Interview Helena Vance',
      description: 'The rival violinist. Competitive relationship with victim.',
      cost: 2,
      category: 'witness',
      evidence: {
        title: 'Helena Vance Interview',
        content: `Helena Vance is calm and collected. Perhaps too calm?

KEY STATEMENTS:
"Elara and I are competitors, yes. But that's professional, not personal. I don't wish her harm. The music world is richer with both of us in it."

"I was seated near the front, in full view of everyone. I didn't cast anything—anyone would have seen."

"Have you examined her violin? Musicians are very particular about their instruments. She would never let anyone else touch it... normally."

OBSERVATIONS:
• She volunteered the violin theory unprompted (interesting)
• Her alibi during the concert seems solid
• She showed no obvious signs of deception`,
        interpretation: 'She mentions the violin unprompted, which is interesting. Her alibi is solid for the time of the concert. This evidence is suggestive but not conclusive.',
        isCritical: false,
      },
      hypothesisImpact: [
        { hypothesisId: 'helena-guilty', impact: 'weakens', weight: 1 },
        { hypothesisId: 'cursed-violin', impact: 'supports', weight: 1 },
      ],
    },
    {
      id: 'interview-lucius',
      title: 'Interview Lucius Malfoy',
      description: 'The host. Knows the guest list and household arrangements.',
      cost: 1,
      category: 'witness',
      evidence: {
        title: 'Lucius Malfoy Interview',
        content: `Lucius Malfoy is cooperative but measured in his responses.

KEY STATEMENTS:
"I hired Miss Thornwood through her manager. We've had no prior interaction. I simply wanted quality entertainment for our guests."

"The guest list was quite small—intimate gathering. I can provide full names if needed. No one entered or left during the performance."

"Her violin? She brought it herself, of course. It never left her sight while she was here. She's quite protective of it."`,
        interpretation: 'This establishes the violin was brought by the victim herself—relevant to the cursed-object theory. The curse must have been placed before she arrived.',
        isCritical: false,
      },
      hypothesisImpact: [
        { hypothesisId: 'lucius-involved', impact: 'weakens', weight: 1 },
        { hypothesisId: 'cursed-violin', impact: 'supports', weight: 1 },
      ],
    },
    {
      id: 'interview-orchestra',
      title: 'Interview Orchestra Members',
      description: 'Other musicians who performed alongside the victim.',
      cost: 1,
      category: 'witness',
      evidence: {
        title: 'Orchestra Member Interviews',
        content: `You speak with the three other musicians who performed.

CELLIST (Margaret Hollow):
"Elara seemed fine before the performance. A little nervous maybe—she mentioned something about her violin feeling 'different' after the servicing. New strings, I assumed."

PIANIST (Theodore Mills):
"I was focused on my own playing. Didn't notice anything unusual until she collapsed. No one in the audience moved suspiciously."

FLAUTIST (Anna Chen):
"Where did she get her violin serviced? Marchetti's, I think. Same place I go. Odd man, but good with instruments."`,
        interpretation: 'The victim mentioned her violin felt "different" after servicing. This supports the violin/servicing theory and identifies the shop: Marchetti\'s.',
        isCritical: false,
      },
      hypothesisImpact: [
        { hypothesisId: 'cursed-violin', impact: 'supports', weight: 2 },
      ],
    },

    // RECORDS
    {
      id: 'records-victor',
      title: 'Ministry Records: Victor Ashworth',
      description: 'Criminal background, wand registration, past incidents.',
      cost: 1,
      category: 'records',
      evidence: {
        title: 'Victor Ashworth Background',
        content: `Official Ministry records for Victor Ashworth.

CRIMINAL HISTORY: None
WAND REGISTRATION: Elm, unicorn hair, registered age 11
OCCUPATION: Licensed Potions supplier, no violations
DARK ARTS HISTORY: No known associations

NOTES:
Mr. Ashworth has a clean record. His relationship with Miss Thornwood ended in May; she initiated the separation citing "incompatible life goals." No reports of harassment or concerning behavior since.`,
        interpretation: 'Clean record, no Dark Arts background. This evidence weakens the Victor Ashworth hypothesis—he has no history of this kind of behavior.',
        isCritical: false,
      },
      hypothesisImpact: [
        { hypothesisId: 'victor-guilty', impact: 'weakens', weight: 2 },
      ],
    },
    {
      id: 'records-helena',
      title: 'Ministry Records: Helena Vance',
      description: 'Criminal background, wand registration, past incidents.',
      cost: 1,
      category: 'records',
      evidence: {
        title: 'Helena Vance Background',
        content: `Official Ministry records for Helena Vance.

CRIMINAL HISTORY: None
WAND REGISTRATION: Willow, phoenix feather, registered age 11
OCCUPATION: Professional musician, no violations
DARK ARTS HISTORY: No known associations

NOTES:
Miss Vance competed against Thornwood for the Celestina Prize last year and lost. Some gossip columns reported tension, but no official complaints from either party.`,
        interpretation: 'Clean record. The rivalry is documented but appears to be professional, not personal. This evidence is neutral—neither supports nor weakens the Helena Vance hypothesis significantly.',
        isCritical: false,
      },
      hypothesisImpact: [
        { hypothesisId: 'helena-guilty', impact: 'neutral', weight: 1 },
      ],
    },
    {
      id: 'research-violin',
      title: 'Research: Violin History',
      description: 'Trace the instrument\'s provenance and recent handling.',
      cost: 1,
      category: 'records',
      evidence: {
        title: 'Violin Provenance Research',
        content: `You trace the recent history of Elara Thornwood's violin.

FINDINGS:
• The violin was serviced at "Marchetti's Magical Instruments" five days before the concert
• Standard service includes restringing and fresh rosin
• The shop owner, Orion Marchetti, handled the instrument
• Cross-referencing: Orion Marchetti filed for bankruptcy last year after a legal dispute with Elara Thornwood over payment for a custom instrument
• Thornwood won the dispute; Marchetti lost his savings

NEW PERSON OF INTEREST IDENTIFIED:
Orion Marchetti — instrument shop owner with financial motive and direct access to the violin's rosin`,
        interpretation: 'This identifies a new suspect with means, motive, and opportunity. Marchetti had access to the rosin and a grudge against the victim. This is critical evidence pointing to the true culprit.',
        isCritical: true,
      },
      hypothesisImpact: [
        { hypothesisId: 'cursed-violin', impact: 'supports', weight: 3 },
        { hypothesisId: 'unknown-person', impact: 'supports', weight: 2 },
      ],
    },
    {
      id: 'st-mungos',
      title: 'St. Mungo\'s Consultation',
      description: 'Speak with Healers about the specific curse characteristics.',
      cost: 1,
      category: 'records',
      evidence: {
        title: 'Healer\'s Technical Assessment',
        content: `You speak with the Healer treating Elara Thornwood.

KEY INFORMATION:
"The curse is sophisticated—designed to incapacitate rather than kill. It's almost... professional. Someone who wanted her dead would have used something more direct."

"The entry point for the curse is unusual. It came through prolonged skin contact—through her hands, we think. Not a spell cast at her, but something she was holding."

"If you can find the source object and reverse-engineer the curse, we have a much better chance of waking her."`,
        interpretation: 'The curse came through prolonged skin contact—through something she was holding. This strongly supports the cursed-object hypothesis.',
        isCritical: false,
      },
      hypothesisImpact: [
        { hypothesisId: 'cursed-violin', impact: 'supports', weight: 2 },
        { hypothesisId: 'victor-guilty', impact: 'weakens', weight: 1 },
        { hypothesisId: 'helena-guilty', impact: 'weakens', weight: 1 },
      ],
    },
  ],

  resolution: {
    truthSummary: `Orion Marchetti, owner of Marchetti's Magical Instruments, cursed Elara Thornwood's violin rosin during a routine servicing five days before the concert.

Marchetti lost his life savings in a legal dispute with Thornwood two years ago, when she refused to pay for a custom violin she claimed was defective. The courts sided with Thornwood. Marchetti never recovered financially—or emotionally.

When Thornwood brought her violin in for servicing, Marchetti saw his opportunity. He spent four days preparing a sophisticated incapacitation curse, embedded it in the rosin, and applied it to her bow. The curse was designed to activate after approximately 45 minutes of contact—enough time to ensure she was far from the shop when it triggered.

Marchetti has been apprehended and charged with assault with intent to harm. The curse signature from the rosin matches his wand. He has confessed.

Elara Thornwood is expected to make a full recovery now that Healers understand the curse's composition.`,
    culprit: 'Orion Marchetti',
    correctHypothesisId: 'cursed-violin',
    explanationOfDifficulty: `The briefing emphasized Victor Ashworth (the jealous ex) and Helena Vance (the professional rival). Both were present at the concert and had apparent motives.

But the true culprit wasn't at the concert at all. He didn't need to be—he cursed the instrument days earlier.

Solving this case required thinking about MECHANISM, not just MOTIVE. The question "How was the curse delivered?" led to the violin. The question "Who touched the violin recently?" led to Marchetti.`,
  },

  biasLessons: [
    {
      biasName: 'Availability Heuristic',
      explanation: '"Jealous ex-partner" is a familiar story pattern. When you hear about a woman being attacked, your mind quickly suggests "check the ex-boyfriend." This pattern is sometimes right—but its availability in memory makes it feel more likely than statistics would support.',
      howItApplied: 'Victor Ashworth fit the "jealous ex" narrative perfectly. He was present, he had motive, and the story was familiar. This made him seem like the obvious suspect.',
      counterTechnique: 'Ask yourself: "Am I reaching for this explanation because it\'s familiar, or because the evidence supports it?" Generate alternative explanations before settling on the first one that comes to mind.',
      realWorldExample: 'In the workplace: When a project fails, it\'s easy to blame the person who seems most stereotypically responsible—the new hire, the contractor, the team with a previous failure. But systematic analysis often reveals causes that weren\'t on anyone\'s initial list.',
    },
    {
      biasName: 'Confirmation Bias',
      explanation: 'Once you have a favorite theory, it feels efficient to look for evidence that confirms it. But this means you might miss evidence that points to the truth—especially if the truth is something you hadn\'t considered.',
      howItApplied: 'If you spent most of your investigation points on Victor Ashworth (interviewing him, searching his room, checking his records), you were looking for evidence to confirm your favorite theory rather than evidence that would distinguish between theories.',
      counterTechnique: 'Before investigating any single lead, ask: "What evidence would tell me whether Hypothesis A or Hypothesis B is true?" Seek discriminating evidence that tests your theories against each other.',
      realWorldExample: 'In relationships: When conflict arises, we often assume we understand the other person\'s motives ("they\'re just being selfish"). But the real cause might be something we haven\'t considered—something we\'d only discover by asking "What would have to be true for their behavior to make sense?"',
    },
    {
      biasName: 'Anchoring',
      explanation: 'The first information you receive can "anchor" your thinking, making it harder to consider alternatives that weren\'t mentioned initially.',
      howItApplied: 'The briefing mentioned three suspects by name: Victor, Helena, and Narcissa. This "anchored" thinking to those three possibilities, making it harder to consider that the true culprit might not be on the list at all.',
      counterTechnique: 'Always include a "something/someone else" hypothesis. Actively ask: "Who else could have done this? What am I not considering?"',
      realWorldExample: 'In current events: When something goes wrong in the news, narratives emerge quickly. "This happened because of [political party / group / individual]." Often, the real explanation is more complex, but the availability of familiar stories makes the simple narrative feel true.',
    },
  ],
};
