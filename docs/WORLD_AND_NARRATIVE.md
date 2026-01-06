# Auror Academy - World Design & Overarching Narrative

Comprehensive world design and narrative structure to ensure case consistency.

---

## Table of Contents

1. [Overarching Narrative](#overarching-narrative)
2. [Timeline & World State](#timeline--world-state)
3. [Locations](#locations)
4. [Organizations & Factions](#organizations--factions)
5. [Recurring Characters](#recurring-characters)
6. [Magic System Constraints](#magic-system-constraints)
7. [Consistency Guidelines](#consistency-guidelines)

---

## Overarching Narrative

### The Hidden Test

**Core Concept**: Moody is testing whether you can think independently when authority is corrupt.

### Three-Phase Structure

```
PHASE 1: TRAINING (Cases 1-8)
├─ Surface: Historical cases for training
├─ Reality: Moody selecting specific cases to test your thinking
└─ Player: Learns investigation, builds skills

PHASE 2: AWAKENING (Case 9)
├─ Surface: Another training case
├─ Reality: Pattern emerges—some cases connected
└─ Player: Optional discovery (rewards attention)

PHASE 3: THE TEST (Case 10)
├─ Surface: Final training case
├─ Reality: Meta-investigation of the pattern
└─ Player: Expose institutional corruption or follow orders?

EXPANSION: REAL WORK (Cases 11+)
├─ Surface: Active field cases
├─ Reality: Apply lessons to real stakes
└─ Player: Navigate corrupt system as working Auror
```

---

### Case 1-8: Training Cases (Historical)

**Frame**: "This case happened X years ago. It's closed. Solve it."

**Selection Criteria** (Moody's hidden agenda):
```yaml
Cases include:
  - Some straightforward (build confidence)
  - Some with institutional failures (test critical thinking)
  - 3 specific cases with pattern (Cases 3, 5, 7)
    └─ All involve Ministry officials
    └─ All closed quickly without thorough investigation
    └─ All share subtle detail (same corrupt official's signature)
```

**Player Experience**:
- Cases feel self-contained (they are)
- No explicit connection mentioned
- Optional: Attentive players notice pattern
- Moody gives no hints (wants to see if you notice)

**Individual Case Variety**:
- Different crimes (murder, theft, corruption, assault)
- Different locations (Hogwarts, Ministry, Diagon Alley, private homes)
- Different complexity (simple → advanced)
- Mix of tones (dark, morally complex, light)

---

### Case 9: Pattern Recognition

**Setup**: Appears to be another training case

**The Pattern** (optional discovery):
```yaml
If player reviews past cases, may notice:

  Case 3: Ministry Clerk Murder
  ├─ Victim: Albert Moresby (Ministry Records)
  ├─ Investigation closed: Ruled suicide
  ├─ Detail: Case file signed by Deputy Undersecretary Yaxley
  └─ Quick closure despite evidence of foul play

  Case 5: Gringotts Vault Theft
  ├─ Victim: Vault containing financial records
  ├─ Investigation closed: Inside job, low-priority
  ├─ Detail: Ministry liaison report signed by Yaxley
  └─ Quick closure despite high-value vault

  Case 7: Wizengamot Bribery
  ├─ Victim: Junior Wizengamot member (whistleblower)
  ├─ Investigation closed: Insufficient evidence
  ├─ Detail: Case dismissal authorized by Yaxley
  └─ Quick closure despite witness testimony

  Pattern: Yaxley appears in all three
  All three closed quickly and quietly
  All three involved potential Ministry embarrassment
```

**Moody's Reaction** (if player mentions pattern):
```
MOODY: [Eye swivels to you] "Good eye, recruit. Keep that
observation to yourself for now. Focus on the case at hand."

[First hint that training has deeper purpose]
```

**Case 9 Content**:
- Standalone case that works without pattern knowledge
- But contains additional evidence linking to pattern
- Prepares player for Case 10

---

### Case 10: The Meta-Case

**Assignment**:
```
MOODY: "New case. Except it's not new. You're going to
investigate why certain cases from your training were
selected—and why they were buried."

[Slides files across desk]

"Deputy Undersecretary Cornelius Yaxley. Died two weeks ago.
Ruled natural causes. I don't believe in coincidence. Find
out what he was covering up—and who benefits from his death."
```

**Investigation Structure**:
```yaml
crime_scene: Yaxley's Ministry office
  - Evidence of record tampering
  - Files related to Cases 3, 5, 7
  - Encrypted ledger (financial records)

suspects:
  - Minister's Chief of Staff (political motive)
  - Senior Auror (covering up past failure)
  - Yaxley's Assistant (discovered the corruption)
  - Wealthy donor (being blackmailed by Yaxley)

critical_evidence:
  - Cases 3, 5, 7 were all closed by Yaxley's authority
  - Each victim had discovered different pieces of embezzlement scheme
  - Yaxley was either orchestrating or covering up
  - His death: murdered to silence or prevent exposure

the_choice:
  option_a: "Expose full corruption (implicates senior Ministry officials)"
  option_b: "Solve murder quietly (maintain institutional stability)"

  moody_test: "Which do you choose? And why?"
```

**The Truth**:
```yaml
what_happened:
  - Yaxley was covering up systematic Ministry embezzlement
  - 10+ officials involved across departments
  - Cases 3, 5, 7 victims each discovered pieces
  - Yaxley silenced investigations to protect conspiracy
  - His death: One conspirator feared Yaxley would talk

moody_lesson:
  "You solved the murder. Good. But the real question:
  Do you have the courage to expose the corruption—knowing
  it will make you enemies in the Ministry you just joined?

  Or do you file a quiet report and pretend the problem
  is solved because one corrupt official is dead?

  There's no right answer, recruit. Only the one you
  can live with."
```

**Outcomes**:
```yaml
expose_corruption:
  immediate: "Case closed. Full report filed."
  consequence: "Ministry launches internal investigation."
  moody_reaction: "Brave. Or stupid. Time will tell."
  unlocks: "Cases 11+ involve navigating hostile Ministry"

quiet_report:
  immediate: "Case closed. Yaxley acted alone (officially)."
  consequence: "Conspiracy continues underground."
  moody_reaction: "Pragmatic. But remember: you know the truth."
  unlocks: "Cases 11+ involve subtle undermining of conspiracy"
```

**No Wrong Choice**: Both paths are valid. Player must live with consequences.

---

### Cases 11+: Real Field Work (Expansion)

**If Exposed Corruption**:
```yaml
world_state: "Ministry reform underway; conspirators cornered"
case_types:
  - Desperate conspirators striking back
  - Political assassinations
  - Evidence destruction
  - Whistleblowers needing protection

player_reputation: "Reformer - some admire, some hate"
allies: "Whistleblowers, honest officials, Moody"
enemies: "Corrupt officials (in retreat but dangerous)"
```

**If Quiet Report**:
```yaml
world_state: "Conspiracy continues; you're trusted insider"
case_types:
  - Investigating from within
  - Gathering evidence subtly
  - Protecting future victims
  - Navigating corrupt orders

player_reputation: "Reliable - trusted by both sides"
allies: "Moody (secretly), reform-minded officials"
enemies: "None overtly (but you know who's corrupt)"
```

---

## Timeline & World State

### Setting

**When**: ~2010s (post-Voldemort, pre-Cursed Child timeline)
**Years Since War**: 10-15 years
**World State**: Post-war recovery, institutional reform attempts

### Historical Context

```yaml
recent_past:
  - Second Wizarding War ended (Voldemort defeated)
  - Ministry purged Death Eaters
  - But: Old corruption networks survived
  - Auror Office expanded rapidly (oversight gaps)

current_era:
  - Ministry appears functional
  - But: Wartime emergency powers never fully revoked
  - Corruption shifted from ideology to profit
  - Public trusts Aurors (your investigations matter)

player_background:
  - Too young to fight in war (recent Hogwarts graduate)
  - No war trauma or allegiances
  - Fresh eyes on corrupt system
  - Moody sees you as potential for real change
```

### Key Events (Referenced in Cases)

```yaml
6_years_ago:
  - "Shacklebolt's Reforms" - attempted Ministry purge
  - Partially successful, created current factions
  - Some corruption survived underground

5_years_ago:
  - Ministry financial reorganization
  - New oversight positions created
  - Yaxley appointed Deputy Undersecretary
  - Embezzlement scheme begins

4_years_ago:
  - "Gringotts Accord" - treaty after war break-in
  - Goblin reparations established
  - Ongoing tension over implementation

3_years_ago:
  - "The Lestrange Trial" - last major Death Eater prosecution
  - Controversial verdict, still debated publicly
  - Case 3: Moresby discovers discrepancies (killed)
  - Case 5: Gringotts vault contains evidence (buried)

2_years_ago:
  - Case 7: Wizengamot whistleblower (silenced)
  - "The Azkaban Incident" - attempted breakout
  - Increased security, public fear spike

1_year_ago:
  - Daily Prophet editor bribery scandal exposed
  - Editor fired but culture remains

2_weeks_ago:
  - Yaxley dies (Case 10 catalyst)

present:
  - Player joins Auror Academy
  - Moody begins training program
  - Cases 1-10 unfold over ~3 months
```

### Ongoing Situations (Background Atmosphere)

```yaml
political:
  werewolf_rights_bill: "Debated in Wizengamot, creates faction tension"
  muggleborn_restitution_fund: "Returning stolen property, slow bureaucracy, pureblood resentment"
  death_eater_reintegration: "Controversial program, some reformed, others faking"

cultural:
  hogwarts_curriculum_reform: "Dark Arts defense vs. Dark Arts - parent controversy"
  remembrance_day_annual: "Battle of Hogwarts anniversary, public mood shifts, political speeches"

economic:
  war_reconstruction: "Building contracts (embezzlement source)"
  diagon_alley_gentrification: "Old shops closing, new businesses, tension"
  unemployment: "Former fighters struggle peacetime jobs"

international:
  portkey_regulations: "New security post-war, travel delays"
  icw_oversight: "International observers monitoring Britain's recovery"

minor_scandals:
  quidditch_betting_ring: "Professional sports corruption"
  st_mungos_fundraising: "Charity galleons missing"
  mysteries_department_leak: "Classified research sold to foreigners"
```

---

## Social & Cultural Context

### Post-War Society

```yaml
demographics:
  war_orphans: "Generation raised by extended family, social services strain"
  mixed_marriages: "More common post-war, pureblood families adapting (or resisting)"
  squib_integration: "New acceptance programs, old pureblood shame fading"

economic_conditions:
  reconstruction_economy: "Building boom (corruption opportunity)"
  wealth_shifts:
    declining: "Old pureblood families (Malfoys stripped of influence)"
    rising: "War profiteers, Muggleborn entrepreneurs"
    unchanged: "Goblin wealth unaffected (wizard resentment)"

cultural_shifts:
  muggle_influence: "Younger generation less traditional"
  dark_arts_stigma: "Even academic study controversial"
  authority_skepticism: "Public distrusts Ministry after war failures"

class_tensions:
  pureblood_traditionalists: "Resent equality laws, declining influence"
  muggleborn_advocacy: "Push for reforms, some radical"
  goblin_resentment: "Wizard economic struggles don't affect them"

public_mood:
  overall: "Recovery optimism mixed with institutional distrust"
  toward_aurors: "Trust high (your investigations matter)"
  toward_ministry: "Cynical but compliant"
```

---

## Locations

### Magical Britain Geography

**Major Hubs** (where cases can occur):

```yaml
london:
  - Ministry of Magic (Whitehall)
  - Diagon Alley (shopping district)
  - Knockturn Alley (black market)
  - St. Mungo's Hospital
  - Leaky Cauldron (gateway)

scotland:
  - Hogwarts Castle & Grounds
  - Hogsmeade Village
  - Forbidden Forest

regional:
  - Godric's Hollow (West Country)
  - Holyhead (Wales - Harpies stadium)
  - Shell Cottage (Cornwall coast)
  - Various wizard communities
```

---

### Location Catalog (Detailed)

#### 1. Ministry of Magic

```yaml
ministry_of_magic:
  type: "large_building"
  structure: "3-level (Atrium → Departments → Specific Rooms)"

  accessible_areas:
    atrium:
      type: "macro"
      description: "Grand entrance, Floo fireplaces, security desk, fountain"
      exits: ["dept_magical_law", "dept_mysteries", "dept_transportation", "courtrooms"]

    dept_magical_law:
      type: "macro"
      description: "Law enforcement hub"
      exits: ["auror_office", "interrogation_rooms", "evidence_storage"]

    auror_office:
      type: "micro"
      description: "Your base. Desks, case files, Moody's office in corner"

    dept_mysteries:
      type: "macro"
      description: "Secretive research department"
      exits: ["hall_of_prophecy", "death_chamber", "time_room", "space_room"]
      access: "restricted (need authorization for cases)"

    dept_transportation:
      type: "micro"
      description: "Floo Network Authority, Portkey Office, Apparition Test Center"

    courtrooms:
      type: "macro"
      exits: ["courtroom_10", "holding_cells", "wizengamot_chamber"]

  case_potential:
    - Murder in office (locked room, politics)
    - Theft of documents (inside job)
    - Corruption investigation
    - Evidence tampering
    - Departmental sabotage

  recurring_npcs:
    - Security guards (witnesses)
    - Departmental secretaries
    - Junior officials (suspects or victims)
    - Yaxley (Cases 3, 5, 7, 10)
```

#### 2. Diagon Alley

```yaml
diagon_alley:
  type: "multi_location"
  structure: "Separate buildings connected by street"

  locations:
    gringotts:
      type: "large_building"
      description: "Wizard bank, marble halls, deep vaults"
      exits: ["main_hall", "vault_corridor", "employee_area"]
      npcs: ["Goblin tellers", "Curse-breakers", "Security"]

    ollivanders:
      type: "single_room"
      description: "Wand shop, narrow, shelves to ceiling"
      npcs: ["Wandmaker (Ollivander or successor)"]

    flourish_and_blotts:
      type: "house"
      description: "Bookshop, multiple floors"
      exits: ["ground_floor", "rare_books_section", "storage"]

    leaky_cauldron:
      type: "house"
      description: "Pub and inn"
      exits: ["pub", "guest_rooms", "private_dining"]
      npcs: ["Barkeep", "Regulars", "Travelers"]

    borgin_and_burkes:
      type: "single_room"
      description: "Knockturn Alley. Dark artifacts shop"
      access: "legal but suspicious"

  case_potential:
    - Theft from Gringotts (heist)
    - Murder in Leaky Cauldron (public, witnesses)
    - Dark artifact smuggling (Knockturn Alley)
    - Poisoning (Apothecary)
    - Assault (street crime)

  atmosphere: "Commercial, busy, mix of legitimate and shady"
```

#### 3. Hogwarts

```yaml
hogwarts:
  type: "large_building"
  structure: "Castle with extensive grounds"
  access: "Only for cases involving students/staff"

  locations:
    great_hall:
      type: "micro"
      description: "Dining hall, enchanted ceiling"

    library:
      type: "macro"
      exits: ["main_library", "restricted_section"]

    common_rooms:
      type: "micro (one per case)"
      access: "House-specific"

    forbidden_forest:
      type: "macro"
      description: "Dangerous, magical creatures"

    grounds:
      type: "macro"
      exits: ["quidditch_pitch", "hagrid_hut", "lake"]

  case_potential:
    - Student assault (school politics)
    - Theft from Restricted Section
    - Illegal magic use
    - Creature-related incident
    - Staff corruption

  constraints:
    - Headmaster approval needed
    - Student safety paramount
    - Educational disruption minimized
    - Hogwarts reputation protected

  npcs: "Professors, students (witnesses), ghosts"
```

#### 4. Private Residences

```yaml
wizard_homes:
  types:
    manor:
      structure: "house (2-level: main floor + upstairs)"
      example: "Pureblood family estates"
      rooms: ["entrance_hall", "study", "library", "bedrooms", "cellar"]

    cottage:
      structure: "house (single level)"
      example: "Working wizards, retired officials"
      rooms: ["main_room", "bedroom", "study", "garden"]

    apartment:
      structure: "single_room or 2-room"
      example: "Young professionals, London flats"
      rooms: ["living_space", "bedroom"]

  case_potential:
    - Domestic murder (intimate, personal)
    - Burglary (theft, break-in)
    - Poisoning (family dinner)
    - Locked room mystery

  constraints:
    - Privacy wards (investigation challenges)
    - Family secrets
    - Class distinctions matter
```

#### 5. St. Mungo's Hospital

```yaml
st_mungos:
  type: "large_building"
  structure: "Multiple floors by ailment"

  floors:
    ground: "Reception, emergency, visitor areas"
    first: "Creature-induced injuries"
    second: "Magical bugs and diseases"
    third: "Potion and plant poisoning"
    fourth: "Spell damage"
    fifth: "Permanent residents (closed ward)"

  case_potential:
    - Assault victim testimony
    - Poisoning investigation
    - Medical malpractice
    - Healer corruption
    - Patient murder

  npcs: "Healers, patients (witnesses/victims), visitors"
```

#### 6. Other Locations

```yaml
hogsmeade:
  type: "multi_location"
  locations:
    three_broomsticks: "Pub, Madam Rosmerta owner, village social hub"
    hog's_head: "Seedy pub, criminal informant meetings"
    honeydukes: "Candy shop, secret passage to Hogwarts"
    zonko's: "Joke shop"
  case_potential: "Village crimes, student incidents"

godric's_hollow:
  type: "village"
  significance: "Historical (Potter connection)"
  case_potential: "Quiet village disrupted by crime"

azkaban:
  type: "prison"
  access: "very restricted"
  case_potential: "Prison break, guard corruption, prisoner interviews"

quidditch_stadium:
  type: "large_building"
  case_potential: "Public murder, sabotage, gambling corruption"

hidden_london:
  carkitt_market:
    type: "black market"
    description: "Questionable legality, informant meetings"
    access: "Need to know where to look"

  wizards_refuge:
    type: "seedy_pub"
    description: "Criminal hangout, dangerous interviews"
    npcs: ["Mundungus Fletcher", "fences", "informants"]

diagon_alley_details:
  weasleys_wizard_wheezes:
    owner: "George Weasley"
    role: "Potential witness, comic relief, war hero connection"

  slug_and_jiggers:
    type: "apothecary"
    case_potential: "Potion ingredients, poisoning cases"

  twilfitt_and_tattings:
    type: "tailors"
    significance: "Pureblood class marker"

ministry_specifics:
  level_9_cafeteria:
    description: "Department of Mysteries, Unspeakables eat separately"
    atmosphere: "Rumors, paranoia"

  courtroom_10:
    description: "Where you observe trials, learn procedures"

  auror_break_room:
    description: "Gossip central, case discussions, coffee"
```

---

## Organizations & Factions

### 1. Ministry of Magic

```yaml
ministry:
  official_function: "Magical government, law enforcement, regulation"

  structure:
    minister: "Kingsley Shacklebolt (or successor)"
    departments:
      - Magical Law Enforcement (your department)
      - Mysteries
      - Magical Transportation
      - International Cooperation
      - Magical Accidents & Catastrophes
      - Magical Games & Sports

  corruption_level: "Moderate to high (post-war opportunists)"

  factions:
    reformers:
      goal: "Clean up post-war corruption"
      members: "War veterans, idealists, Moody"

    old_guard:
      goal: "Maintain power, resist change"
      members: "Career bureaucrats, Yaxley's network"

    opportunists:
      goal: "Personal enrichment"
      members: "Embezzlement conspiracy"

  case_relevance:
    - Provides authority for investigations
    - Source of corruption (antagonist)
    - Bureaucratic obstacles
    - Political pressure on cases
```

### 2. Auror Office

```yaml
auror_office:
  function: "Elite magical law enforcement"

  structure:
    head: "Senior Auror (Moody's peer)"
    senior_aurors: "Experienced investigators"
    junior_aurors: "Field agents"
    trainees: "YOU (Auror Academy)"

  your_position:
    rank: "Trainee"
    authority: "Investigate assigned cases, limited arrest power"
    restrictions: "Need senior approval for raids, Azkaban visits"

  training_program:
    duration: "1 year (Cases 1-10 = first 3 months)"
    mentor: "Mad-Eye Moody"
    structure: "Historical cases → Real cases"

  office_culture:
    - Mix of war veterans and new recruits
    - Some resent "soft" new generation
    - Some embrace reform
    - Politics affect case assignments

  recurring_colleagues:
    moody: "Mentor, paranoid, secretly reformer"
    senior_auror_dawlish: "By-the-book, resistant to change"
    auror_proudfoot: "Friendly peer, war veteran"
    secretary_hopkirk: "Office manager, knows everything"
```

### 3. Wizengamot

```yaml
wizengamot:
  function: "Wizard high court and legislature"

  relevance:
    - Final authority on criminal justice
    - Your verdicts reviewed here (if contested)
    - Source of political pressure
    - Case 7 involves Wizengamot corruption

  corruption: "Some members take bribes (Case 7, 10)"

  case_interaction:
    - Rarely directly involved
    - Background pressure
    - Corrupt members as suspects/antagonists
```

### 4. Gringotts

```yaml
gringotts:
  function: "Wizard bank, run by goblins"

  structure:
    management: "Goblin-controlled (independent from Ministry)"
    employees:
      - Goblin tellers
      - Curse-breakers (human and goblin)
      - Security guards

  relationship_with_ministry:
    official: "Cooperative"
    actual: "Tense (goblins resent wizard authority)"

  case_relevance:
    - Theft cases (Case 5)
    - Financial investigation
    - Goblin/wizard tensions
    - Independent authority (won't always cooperate)

  constraints:
    - Goblin law applies inside bank
    - Limited Ministry jurisdiction
    - Need warrants for vault searches
```

### 5. Hogwarts

```yaml
hogwarts:
  function: "Wizarding school"

  authority:
    headmaster: "Independent from Ministry (mostly)"
    access: "Cases need Headmaster approval"

  case_relevance:
    - Student/staff cases
    - Witnesses (students/professors)
    - Limited jurisdiction (school handles internally when possible)

  atmosphere:
    - Post-war recovery
    - New generation (no war trauma)
    - Some students are children of Death Eaters (tensions)
```

### 6. The Daily Prophet

```yaml
daily_prophet:
  function: "Primary wizard newspaper"

  case_relevance:
    - Public pressure on high-profile cases
    - Leaks (someone feeding them info)
    - Reputation management
    - Case 10: Investigative journalist as ally or obstacle

  editorial_stance:
    - Pro-Ministry (generally)
    - Sensationalist
    - Can be bribed/influenced

  factions:
    prophet_loyalists: "Defend Ministry at all costs"
    independent_reporters: "Emerging post-war investigative journalism"
    quibbler_faction: "Alternative press, conspiracy theories (sometimes right)"
```

### 7. Post-War Tension Groups

```yaml
purity_watch:
  type: "pureblood traditionalist society"
  status: "Legal but problematic"
  goal: "Resist Muggleborn equality laws"
  case_relevance: "Hate crimes, harassment, suspects"

new_dawn_society:
  type: "Muggleborn advocacy group"
  goal: "Push for Ministry reform"
  members: "Mostly peaceful, some radical wing"
  case_relevance: "Victims of pureblood violence, occasional extremist suspects"

goblin_liberation_front:
  type: "militant goblin rights movement"
  goal: "Equality by force if necessary"
  status: "Terrorists or freedom fighters (perspective dependent)"
  case_relevance: "Bombings, sabotage, or victims of wizard violence"

death_eater_reintegration_program:
  type: "Ministry initiative"
  controversy: "High - some genuinely reformed, others faking"
  case_relevance: "Former Death Eaters as suspects, victims, or witnesses"
```

### 8. Criminal Organizations

```yaml
knockturn_crew:
  type: "organized crime"
  operations: "Dark artifacts, extortion, protection rackets"
  ideology: "None - purely profit"
  case_relevance: "Theft, assault, smuggling cases"

smuggling_rings:
  type: "international crime"
  goods: "Illegal potion ingredients, cursed items, restricted magic"
  case_relevance: "Customs violations, dangerous artifact cases"

the_unseen:
  type: "rumored assassin network"
  reality: "May or may not exist"
  case_relevance: "Professional hits, perfect murders, mystery"
```

### 9. International Organizations

```yaml
international_confederation_of_wizards:
  role: "ICW observers monitoring Britain's recovery"
  case_relevance: "Pressure on high-profile cases, international incidents"

foreign_auror_offices:
  french_aurors: "Cooperation on cross-border cases"
  german_aurors: "Rivalry over methods"
  case_relevance: "International suspects, extradition"

macusa_liaison:
  role: "American wizards, different investigative methods"
  tension: "Cultural friction, jurisdictional disputes"
  case_relevance: "American suspects or victims in Britain"
```

---

## Recurring Characters

### Mad-Eye Moody (Mentor)

```yaml
moody:
  role: "Training supervisor, mentor"
  personality: "Paranoid, demanding, brutally honest, secretly idealistic"

  background:
    - Legendary Auror
    - War veteran (both wars)
    - Captured by Death Eaters (fake Moody in Book 4)
    - Deeply distrustful of institutions

  relationship_to_player:
    surface: "Brutal taskmaster"
    reality: "Testing if you're incorruptible"

  hidden_agenda:
    - Knows Ministry is corrupt
    - Can't expose alone (would be dismissed as paranoid)
    - Needs new generation with courage to reform
    - You're his test: Will you think independently?

  character_arc:
    cases_1-8: "Brutal feedback, no hints about meta-narrative"
    case_9: "First crack in facade if you notice pattern"
    case_10: "Reveals true test, trusts you with choice"

  voice:
    - "CONSTANT VIGILANCE!"
    - "Don't trust anyone—especially not me"
    - "The right answer is the one you can live with"
```

### Cornelius Yaxley (Antagonist - Dead)

```yaml
yaxley:
  role: "Deputy Undersecretary (Cases 3, 5, 7); Victim (Case 10)"

  background:
    - Not a Death Eater (this timeline)
    - Career Ministry official
    - Rose during post-war reorganization
    - Opportunist, not ideologue

  crimes:
    - Orchestrated embezzlement scheme
    - Covered up Cases 3, 5, 7 to protect conspiracy
    - Accepted bribes from wealthy donors

  death:
    - Murdered by co-conspirator (feared Yaxley would talk)
    - Staged as natural causes
    - Case 10 unravels his network
```

### The Conspiracy (Antagonist Network)

```yaml
embezzlement_network:
  size: "10-15 Ministry officials across departments"

  structure:
    mastermind: "Senior official (Case 10 reveals identity)"
    yaxley: "Enforcer, silenced investigations"
    accomplices: "Department heads who turned blind eye"

  operation:
    - Skimming Ministry budgets
    - Shell companies
    - Magical Britain construction contracts
    - Amounts under audit thresholds

  cases_where_they_appear:
    case_3: "Victim discovered budget discrepancies"
    case_5: "Vault contained incriminating ledgers"
    case_7: "Wizengamot member threatened exposure"
    case_10: "Yaxley's death unravels network"
```

### Supporting Characters (Named NPCs)

#### Auror Office

```yaml
john_dawlish:
  rank: "Senior Auror"
  personality: "By-the-book, skeptical of player, suspects Moody shows favoritism"
  background: "Career Auror, not war hero, resents new generation"
  role: "Bureaucratic obstacle, occasionally ally on procedural matters"

eric_proudfoot:
  rank: "Auror"
  personality: "Friendly, war veteran, gossip, drinks after shifts"
  background: "Fought in war, modest about it"
  role: "Peer ally, information source, emotional support"

ted_tonks:
  rank: "Junior Auror (son of Tonks/Lupin)"
  personality: "Idealistic, inherited parents' courage"
  background: "War orphan, raised by family"
  role: "Potential ally in reform path, represents new generation"

gawain_robards:
  rank: "Head of Auror Office"
  personality: "Political animal, concerned with Ministry optics"
  background: "Appointed post-war, connected"
  role: "Authority figure, assigns cases, responds to pressure"

savage:
  rank: "Evidence Clerk"
  personality: "Knows where bodies buried (figuratively), bribeable"
  background: "30 years in evidence room"
  role: "Information source, can expedite or delay evidence access"
```

#### Ministry Officials

```yaml
corban_abernathy:
  position: "Minister's Chief of Staff"
  personality: "Ambitious, smooth, politically ruthless"
  background: "Rose during post-war reorganization"
  role: "Potential conspiracy mastermind (Case 10 suspect)"

perkins:
  position: "Ancient clerk, Misuse of Muggle Artifacts Office"
  personality: "Honest, overlooked, encyclopedic memory"
  background: "Worked with Arthur Weasley"
  role: "Helpful witness, remembers old cases"

dolores_umbridge:
  position: "Reinstated post-war (if using canon)"
  personality: "Bureaucratic villain, obstructs investigations"
  background: "Survived war trials, still connected"
  role: "Antagonist, creates procedural nightmares"

pius_thicknesse:
  position: "Former Minister, now consultant"
  personality: "Tainted by Imperius defense, trying to rebuild reputation"
  background: "Death Eater controlled during war"
  role: "Witness, suspect, or sympathetic figure depending on case"
```

#### Daily Prophet

```yaml
rita_skeeter:
  position: "Journalist"
  personality: "Sensationalist, unregistered Animagus, ruthless"
  background: "Famous for exposés, ethics questionable"
  role: "Can be ally or enemy, has dirt on everyone"

barnabas_cuffe:
  position: "Editor"
  personality: "Susceptible to Ministry pressure, business-focused"
  background: "Replaced scandal-plagued predecessor"
  role: "Decides what gets published, gatekeeps stories"

aspiring_journalist:
  position: "Young reporter"
  personality: "Idealistic, wants to expose corruption"
  background: "Post-war generation, believes in reform"
  role: "Potential ally Case 10+, can publish evidence"
```

#### Gringotts

```yaml
ragnok:
  position: "Senior Goblin, Vault Security"
  personality: "Remembers Trio's break-in, distrusts all wizards"
  background: "Witnessed war-era violations"
  role: "Obstacle, needs convincing to cooperate"

griphook_jr:
  position: "Young goblin, customer relations"
  personality: "Reformer, wants wizard-goblin cooperation"
  background: "Post-war generation, different views"
  role: "Ally, provides information if treated with respect"

bill_weasley:
  position: "Curse-breaker"
  personality: "Friendly, competent, war hero"
  background: "Order member, married to Fleur"
  role: "Expert testimony, connection to past cases"
```

#### Criminal Element

```yaml
mundungus_fletcher:
  position: "Petty criminal, informant"
  personality: "Cowardly, greedy, knows black market"
  background: "Order member, survived war"
  role: "Information source, witnessed Case 5 but didn't report"

borgin:
  position: "Borgin & Burkes owner"
  personality: "Fence for dark artifacts, legally ambiguous"
  background: "Knockturn Alley fixture"
  role: "Reluctant witness, suspect in smuggling cases"

rookwood:
  position: "Former Death Eater, 'legitimate businessman'"
  personality: "Suspicious, legally clean, probably still criminal"
  background: "Escaped serious punishment, connected"
  role: "Suspect, obstacle, represents unpunished war criminals"
```

#### Civilian Recurring NPCs

```yaml
hannah_abbott:
  position: "Leaky Cauldron owner (canon)"
  personality: "Friendly, observant, protective of customers"
  background: "Hogwarts contemporary, lost mother in war"
  role: "Frequent witness to pub incidents, alibi verification"

madam_rosmerta:
  position: "Three Broomsticks owner"
  personality: "Warm, knows Hogsmeade gossip"
  background: "Hogsmeade fixture, Imperiused during war"
  role: "Witness, source of village information"

madam_pomfrey:
  position: "Hogwarts healer"
  personality: "Protective of students, suspicious of Aurors"
  background: "Decades at Hogwarts, seen everything"
  role: "Medical testimony, obstacle if protecting students"

luna_lovegood:
  position: "Naturalist/journalist"
  personality: "Odd but perceptive, sees what others miss"
  background: "War hero, Quibbler writer"
  role: "Unusual witness, notices strange details"
```

---

## Character Relationships & Networks

### Moody's Network (Hidden Connections)

```yaml
old_order_members:
  still_active:
    - McGonagall (Hogwarts Headmistress)
    - Kingsley Shacklebolt (Minister or former Minister)
    - Bill Weasley (Gringotts)

  relationship: "Won't directly help, but provide info if asked right questions"
  moody_leverage: "Can pull strings subtly, won't be obvious"
```

### Ministry Rivalries

```yaml
reformers_vs_old_guard:
  visible: "Office politics, case assignments affected"
  player_impact: "Your success threatens certain careers"
  case_assignments: "Sometimes based on politics, not merit"

conspiracy_network:
  active_members: "10-15 officials across departments (Case 10)"
  post_case_10:
    if_exposed: "Scattered, defensive, dangerous"
    if_quiet: "Continues underground, unaware you know"
```

### Unexpected Connections (Investigation Opportunities)

```yaml
rita_skeeter:
  connection: "Dated someone in conspiracy (has dirt)"
  leverage: "Will trade information for exclusive story"

mundungus_fletcher:
  connection: "Witnessed event in Case 5, didn't report (afraid)"
  leverage: "Immunity deal or threaten prosecution"

bill_weasley:
  connection: "Curse-breaking work discovered Case 7 evidence (suppressed)"
  leverage: "Guilty conscience, will help if approached privately"

rookwood:
  connection: "Business dealings with conspiracy members"
  leverage: "Threaten investigation into his 'legitimate' business"
```

### Information Brokers

```yaml
secretary_network:
  members: "Ministry secretaries, know everything"
  access: "Treat with respect, they'll gossip"

barkeep_network:
  members: "Hannah Abbott, Rosmerta, Hog's Head owner"
  access: "Frequent visits, build rapport"

evidence_clerk:
  member: "Savage"
  access: "Small bribes or favors"
```

---

## Magic System for Investigations

### Core Philosophy

**"Magic is a tool, not a crutch. Your mind is the weapon."** - Moody

Investigation magic uses **risk/reward system**:
- Player can attempt any logical spell
- LLM evaluates context and presents risks
- Player makes informed choice
- Consequences teach lessons

### Core Spell Set (Auror's Toolkit)

```yaml
basic_investigation:
  revelio:
    function: "Reveals hidden objects, magical marks, concealed compartments"
    usage: "Cast in area to detect hidden evidence"
    limitations: "Only reveals what's physically present (can't create evidence)"

  homenum_revelio:
    function: "Detects hidden persons in area"
    usage: "Find suspects hiding, verify if location is empty"
    limitations: "Only detects living humans (doesn't work on ghosts, portraits)"

  specialis_revelio:
    function: "Identifies potions, substances, magical properties"
    usage: "Point at unknown substance to identify"
    limitations: "Requires magical knowledge to interpret results"

  lumos:
    function: "Illumination, enhanced forensic variants"
    usage: "Light source, can be modified to reveal specific traces"
    progression: "Player learns variations (blood detection, poison residue)"

forensic_magic:
  prior_incantato:
    function: "Shows wand's last spells cast"
    usage: "Requires physical wand, reveals spell sequence"
    limitations: "Only shows spells, not context or timing precision"
    complications: "Heavily-used wands show confused sequence"

  reparo:
    function: "Repairs broken objects, reveals how they broke"
    usage: "Reconstruct shattered evidence"
    creative_uses: "Repair broken wand to see last spell, fix torn letter"
    limitations: "Partial repairs common if pieces missing"

restricted_magic:
  legilimency:
    function: "Read surface thoughts, detect lies, access memories"
    restrictions: "Requires consent OR authorization for hostile use"
    risks:
      legal: "Illegal without consent = case dismissed"
      practical: "Occlumens can block and cause mental backlash"
      ethical: "Violates privacy, damages trust"
    usage: "Last resort, high risk/reward"
```

### Context Management System (Hybrid Approach)

**How LLM Evaluates Spell Attempts:**

```yaml
method_1_pre_defined:
  description: "Common spell uses pre-defined in case files"
  example:
    case_file_contains:
      spell_contexts:
        revelio:
          victims_study:
            works: true
            reveals: "hidden compartment behind bookshelf"
        prior_incantato:
          victims_wand:
            result: "Last spell: Protego (defensive), then Expelliarmus (disarmed)"

  llm_reads: "Context from case YAML, narrates naturally"

method_2_llm_evaluation:
  description: "Creative/unexpected attempts evaluated by LLM using general rules"
  example:
    player_attempts: "Use Aguamenti to flood room and reveal blood patterns"

    llm_evaluates:
      logical: "Yes - water spell exists, water reveals cleaned blood"
      risks: "Might damage evidence, but creative"

    llm_narrates: |
      Unorthodox approach. You cast Aguamenti—water spreads across floor.
      Near bookshelf, water pools strangely, flowing around invisible stain.
      Someone Scourgified blood here, but cleaning charm didn't change
      floor's porosity. The bloodstain still repels water slightly.

      MOODY: "Clever, recruit. Unorthodox, but clever."

general_rules_for_llm:
  legal_context:
    - No warrant = evidence inadmissible if obtained illegally
    - Restricted spells require authorization
    - Moody intervenes before illegal actions

  magical_context:
    - Wards block/alert on unauthorized magic
    - Occlumency blocks Legilimency (causes backlash)
    - Magical traces fade over time (historical cases harder)

  skill_context:
    - Cases 1-3: Basic spells only, Moody teaches
    - Cases 4-6: Spell variations, more autonomy
    - Cases 7-10: Advanced techniques, player should know limits
```

### Immersion-Friendly Restriction Communication

**Pre-emptive Warning (Before Risky Actions):**

```yaml
example_legilimency_attempt:
  player_considers: "I want to use Legilimency on hostile suspect"

  llm_response: |
    You grip your wand, considering Legilimency. But Moody's training
    echoes in your head:

    'Legilimency without consent is assault, recruit. You'll blow the
    case AND get disciplined. Only use it if they agree—or if you've
    got Wizengamot authorization.'

    The suspect is clearly hostile. They won't consent.

    Attempting Legilimency anyway would:
    - Risk mental backlash (suspect is trained Occlumens)
    - Invalidate evidence (illegal search)
    - Anger Moody (damages your training evaluation)

    > Try anyway (very risky)
    > Use different approach

  teaching: "Player makes informed choice, learns consequences"

example_warrant_issue:
  player_attempts: "Cast Accio to summon murder weapon from suspect's house"

  llm_response: |
    You point your wand toward the distant manor, about to cast Accio.

    Then you pause. The house is clearly warded—you can see the shimmer
    from here. Summoning something would trigger alarms.

    More importantly: you don't have a warrant. Any evidence obtained
    this way would be inadmissible. The suspect would walk free.

    MOODY: [Appears at your shoulder] "Thinking about doing something
    stupid, recruit? Get a warrant. Do it properly."

    > Get warrant first (legal, takes time)
    > Cast anyway (illegal, immediate)
    > Find another approach
```

**Natural Consequences (Spell Fails, Player Learns):**

```yaml
example_occlumency_block:
  player_attempts: "Deep Legilimency on trained Death Eater"

  llm_response: |
    You focus your mind and push into the suspect's thoughts.

    Immediately you hit a wall—solid, professional, unbreakable.
    Former Death Eater training.

    The mental shields slam back. Sharp pain lances through your skull.
    Vision blurs. You stagger.

    SUSPECT: [Smirks] "Trying to read me, Auror? You're not skilled enough."

    MOODY: "Told you Occlumens are dangerous, recruit. Now you believe me."

    [Learned: Suspect has Occlumency training = suspicious, but no evidence gained]

  teaching: "Failure teaches limit, provides clue (suspect is trained = hiding something)"
```

### Spell Discoverability (Auror's Handbook)

**In-Universe Reference:**

```yaml
aurors_handbook:
  access: "Menu option: 'Review Auror Handbook' (always available)"

  content: |
    ═══════════════════════════════════════════════════
    AUROR'S HANDBOOK - INVESTIGATION SPELLS
    ═══════════════════════════════════════════════════

    BASIC INVESTIGATION

    REVELIO - Reveals hidden objects and magical marks
      Usage: Point wand at area, say "Revelio"
      Example: Find hidden compartments, concealed evidence

    HOMENUM REVELIO - Detects hidden persons
      Usage: Cast in area to detect if anyone hiding
      Example: Search building for suspect

    SPECIALIS REVELIO - Identifies potions and substances
      Usage: Point at unknown substance
      Example: Identify poison in drink, analyze potion residue

    LUMOS - Illumination and forensic enhancement
      Usage: "Lumos" for light; variants reveal traces
      Example: Enhanced Lumos shows blood residue

    ───────────────────────────────────────────────────
    FORENSIC MAGIC

    PRIOR INCANTATO - Shows wand's last spells
      Usage: Point wand at another wand, say "Prior Incantato"
      Limitation: Requires physical wand
      Example: Victim's wand shows they cast Protego before death

    REPARO - Repairs broken objects
      Usage: Point at broken object, say "Reparo"
      Creative use: Shows how object was broken
      Example: Repair shattered mirror to see reflection

    ───────────────────────────────────────────────────
    RESTRICTED MAGIC

    LEGILIMENCY - Reads surface thoughts (REQUIRES AUTHORIZATION)
      Usage: Eye contact, focused mental probe
      Legal: Only with consent OR Wizengamot authorization
      Risk: Occlumens can block and cause mental backlash
      Warning: Illegal use = case dismissed, career damage

    ═══════════════════════════════════════════════════

    Moody's Note:
    "Six spells. Master them before you try anything fancy.
    Magic doesn't solve cases—thinking does. Magic just helps
    you find what your brain already figured out.

    Constant vigilance."
    ═══════════════════════════════════════════════════

tutorial:
  case_1: "Teaches Revelio, Homenum Revelio, Prior Incantato, Specialis Revelio"
  case_2_3: "Reinforces basics, introduces Reparo creative uses"
  case_4_plus: "Introduces Legilimency with heavy restrictions/consequences"
```

### Progression System

```yaml
cases_1-3:
  abilities: "Basic investigation spells (4 core spells)"
  restrictions: "Legilimency forbidden, Moody teaches fundamentals"
  moody_style: "Harsh correction, frequent instruction"

cases_4-6:
  abilities: "Spell variations (Lumos forensics, creative Reparo)"
  restrictions: "Can REQUEST Legilimency authorization (rarely granted)"
  moody_style: "Less hand-holding, expects player to know basics"

cases_7-9:
  abilities: "Advanced techniques, understand when NOT to use magic"
  restrictions: "Can attempt risky magic but understands consequences"
  moody_style: "Grudging respect, expects independent thinking"

case_10:
  abilities: "Full toolkit, can request extreme measures (Veritaserum, etc.)"
  wisdom: "Knows most magic isn't necessary—deduction is better"
  moody_style: "Trusts your judgment, final test of ethics"
```

### What's NOT Possible (Prevents Trivializing Cases)

```yaml
time_travel:
  restriction: "Time-Turners in Department of Mysteries vault"
  access: "Minister's authorization only (Case 10 possibility)"
  limitation: "Observation only, cannot interact, paradox risk"

perfect_lie_detection:
  veritaserum: "Requires Wizengamot authorization, can be resisted"
  legilimency: "Occlumens block, causes backlash, illegal without consent"

resurrection:
  limitation: "Can't question the dead (unless ghost)"

omniscience:
  divination: "Unreliable, can't solve cases"
  prophecies: "Vague, not investigative tools"
```

### Example: Complete Spell Attempt Flow

```yaml
scenario: "Player wants to use Legilimency on cooperative witness"

step_1_player_input:
  action: "I use Legilimency on Hannah Abbott to see if she's hiding something"

step_2_context_check:
  witness_state: "cooperative, nervous, willing to help"
  legal_status: "witness consenting to questioning"
  witness_training: "no Occlumency (standard civilian)"

step_3_evaluation:
  legal: "Gray area - she's cooperative but didn't explicitly consent to mind reading"
  risk: "Low (no Occlumency), but might damage trust"
  ethical: "Questionable - she's trying to help, using magic feels invasive"

step_4_llm_response:
  narrative: |
    You consider using Legilimency on Hannah. She's nervous, fidgeting.
    Clearly hiding something—but is it relevant, or just teenage anxiety?

    MOODY: [Eye swivels to you] "She's cooperative, recruit. You really
    need to violate her mind? Or can you just... ask questions? Build rapport?"

    Hannah is watching you, trusting. Using Legilimency without asking
    would betray that trust. She might clam up entirely.

    > Ask permission first ("May I use Legilimency to verify your memory?")
    > Use Legilimency without asking (risky to relationship)
    > Just ask better questions (build trust naturally)

step_5_player_chooses:
  option_a_ask_permission:
    hannah_response: "Oh! Um... I guess? If it helps? [nervous consent]"
    legilimency_result: "She's hiding that she has a crush on suspect - embarrassing but not relevant"
    moody_reaction: "Good. You asked. That's how you build trust."

  option_b_force:
    legilimency_result: "Same information"
    hannah_reaction: "Feels violated, refuses further cooperation"
    moody_reaction: "You got your answer. And lost a cooperative witness. Was it worth it?"
```

---

## Consistency Guidelines

### When Designing Cases

#### 1. Location Selection

```yaml
ask_yourself:
  - Does this location exist in our world catalog?
  - Is it accessible to player at this stage?
  - Does it fit the crime type?
  - Have we used it recently? (avoid repetition)

constraints:
  - Azkaban: Very limited access (need compelling reason)
  - Hogwarts: Need Headmaster approval (mention in case)
  - Private homes: Need warrants or permission
  - Ministry: Always accessible (you work there)
  - Diagon Alley: Public, always accessible
```

#### 2. Character Consistency

```yaml
recurring_characters:
  moody:
    - Always paranoid
    - Never reveals meta-narrative until Case 10
    - Brutal feedback early, grudging respect late
    - Catchphrase: "CONSTANT VIGILANCE"

  ministry_officials:
    - Bureaucratic, political, self-interested
    - Some honest, some corrupt
    - Fear scandal more than truth

  goblins:
    - Proud, resentful of wizard authority
    - Business-focused
    - Won't cooperate easily

new_characters:
  - Give distinct personalities
  - Motivations beyond "evil" or "good"
  - Moral complexity
```

#### 3. Timeline Coherence

```yaml
case_1-8: "3 months training period"
  - Space them out (1-2 weeks between cases)
  - Historical cases: 1-5 years old
  - References to ongoing Ministry work acceptable

case_9: "After 2 months training"
  - Pattern becomes noticeable
  - Yaxley still alive (dies between 9 and 10)

case_10: "After 3 months"
  - Yaxley died 2 weeks ago
  - Culmination of training

cases_11+: "Real-time field work"
  - Weeks to months between cases
  - World state changes based on Case 10 choice
```

#### 4. Magic System Consistency

```yaml
always_available:
  - Basic investigation spells (Revelio, Lumos)
  - Priori Incantatem (if wand available)
  - Basic Legilimency (can fail)

restricted:
  - Veritaserum (need senior authorization)
  - Time-Turners (Ministry vault, emergency only)
  - Unforgivables (illegal, even for Aurors)
  - Powerful curses (need justification)

never_trivialize:
  - Don't let magic solve case instantly
  - Wards, Occlumency, preparation can block spells
  - Physical evidence still matters most
```

#### 5. Institutional Politics

```yaml
ministry_pressure:
  - High-profile cases get political interference
  - Victims with connections = more scrutiny
  - Suspects with connections = pressure to go easy
  - Use this for complexity, not frustration

auror_office:
  - You're trainee (limited authority)
  - Senior Aurors can overrule you
  - But Moody backs you (within reason)

public_perception:
  - Daily Prophet can create pressure
  - Public trusts Aurors (your reputation matters)
  - Wrong accusations damage credibility
```

#### 6. Tone Consistency

```yaml
overall_tone: "Serious but not grimdark"
  - Murder happens, but not gratuitous
  - Moral complexity, not cynical nihilism
  - Hope for reform exists
  - Player agency matters

british_wizarding_culture:
  - Class-conscious (pureblood/half-blood/muggleborn)
  - Bureaucratic
  - Traditional but recovering from war
  - Mix of wonder (magic) and mundane (office politics)

avoid:
  - Edgelord darkness (this isn't Game of Thrones)
  - Perfect heroes or villains
  - Deus ex machina resolutions
  - Breaking HP canon unnecessarily
```

---

## Recurring Case Hooks

### Tension-Based Crime Sources

```yaml
goblin_wizard_incidents:
  type: "Banking disputes escalate to violence"
  example: "Wizard client attacks goblin teller over vault access denial"

former_death_eater_cases:
  type: "Revenge killings vs. legitimate justice"
  example: "Death Eater murdered - victim's family or vigilante?"

muggleborn_business_sabotage:
  type: "Traditionalists sabotage new enterprises"
  example: "Muggleborn shop burned down - accident or arson?"

international_smuggling:
  type: "Foreign criminals in Britain"
  example: "French smuggler caught with cursed artifacts"

ministry_leaks:
  type: "Classified info sold to foreigners"
  example: "Department of Mysteries research appears in foreign journals"

quidditch_corruption:
  type: "Betting, bribery, sabotage"
  example: "Player bribed to throw match, refuses, murdered"

magical_creature_rights:
  type: "Centaurs, house-elves, legal gray areas"
  example: "House-elf kills abusive master - murder or self-defense?"

historical_curses:
  type: "War-era magical traps still active"
  example: "Worker killed by forgotten Death Eater ward"
```

### Case Variety Matrix

```yaml
crime_types:
  - murder (personal, political, professional)
  - theft (artifacts, documents, galleons)
  - corruption (bribery, embezzlement, cover-ups)
  - assault (hate crimes, duels, creature attacks)
  - conspiracy (multiple perpetrators, complex)

motive_categories:
  - revenge (war-related, personal grudges)
  - profit (embezzlement, theft, smuggling)
  - ideology (pureblood, goblin rights, reform)
  - passion (jealousy, rage, fear)
  - desperation (blackmail, protection, survival)

victim_profiles:
  - Ministry officials (political implications)
  - Civilians (public pressure)
  - Students (protective Hogwarts, careful handling)
  - Former Death Eaters (complex sympathy)
  - Goblins (international tension)
  - Muggleborns (hate crime angle)

suspect_archetypes:
  - wronged_party (sympathetic)
  - opportunist (greedy)
  - ideologue (believes justified)
  - desperate (no choice)
  - professional (cold, calculated)
```

---

## Case Development Checklist

Before finalizing a case:

```yaml
narrative_consistency:
  ☐ Fits within Cases 1-10 structure (or 11+ if expansion)
  ☐ Timeline makes sense (historical or real-time)
  ☐ References to world state accurate
  ☐ Doesn't contradict other cases

location_consistency:
  ☐ Location exists in catalog
  ☐ Access makes sense for player's authority
  ☐ Description matches established catalog
  ☐ Not overused (check recent cases)

character_consistency:
  ☐ Recurring characters act in character
  ☐ New characters have depth (wants/fears)
  ☐ NPCs reference world appropriately
  ☐ Moody's role appropriate for case number

magic_consistency:
  ☐ Spells used are within player's access
  ☐ Magic doesn't trivialize investigation
  ☐ Limitations create meaningful puzzles
  ☐ Follows established rules

political_consistency:
  ☐ Ministry politics make sense
  ☐ Institutional pressure appropriate to case
  ☐ Corruption level matches world state
  ☐ Doesn't break Case 10 reveal early
```

---

## Expansion Considerations (Cases 11+)

### Divergent World States

```yaml
if_exposed_corruption:
  ministry_state: "Reform underway, old guard defensive"
  player_reputation: "Reformer (admired and hated)"
  case_types:
    - Conspirators striking back
    - Witness protection
    - Political assassinations
    - New corruption emerging

if_quiet_report:
  ministry_state: "Corruption continues covertly"
  player_reputation: "Reliable insider"
  case_types:
    - Investigating from within
    - Building case against conspirators
    - Protecting future whistleblowers
    - Navigating corrupt orders
```

### Maintaining Consistency Across Branches

```yaml
shared_elements:
  - Moody still mentor (trusts you either way)
  - Auror Office same structure
  - Locations unchanged
  - Magic system same

divergent_elements:
  - Ministry officials' attitudes toward player
  - Available allies
  - Type of political pressure
  - Long-term antagonist identity
```

---

*"A consistent world makes every case feel real." - Case Design Philosophy*
