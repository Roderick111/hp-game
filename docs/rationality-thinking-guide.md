# Practical Guide to Advanced Rationality & Problem-Solving

*A handbook for actually using these techniques, not just knowing about them*

---

## I. BAYESIAN THINKING IN PRACTICE

### What It Actually Means
Stop thinking "this is true/false." Start thinking "how confident am I, and what would change my mind?"

### The 3-Step Process

**Step 1: Start with Base Rates (Not the Specific Case)**

Before looking at evidence, ask: "Out of 100 similar situations, how many times does X happen?"

**Example - Evaluating a Suspect:**
- WRONG: "DNA matches 1 in million people, so 99.9999% chance guilty"
- RIGHT: "In this city of 1 million, ~10 violent crimes/year. If DNA matches 1 in million, there's 1 other person who'd match. Base rate says suspect has ~50% chance of being the actual perpetrator before considering other evidence."

**Step 2: Update Based on Evidence**

New evidence should shift your probability, not replace it.

**Template:**
```
Prior belief: [X]% confident
New evidence: [describe]
Direction: Makes hypothesis [more/less] likely because [reason]
Updated belief: [Y]% confident
What would change my mind: [specific evidence]
```

**Example - Medical Diagnosis:**
```
Prior: 2% of people with these symptoms have Disease X (base rate)
Evidence: Test positive (test is 95% accurate)
BUT: Test also gives false positives 10% of the time
Calculation: Even with positive test, only ~16% chance of having disease
Action: Get second test, don't panic
```

**Step 3: Avoid the Prosecutor's Fallacy**

**The Trap:** Confusing "probability of evidence IF innocent" with "probability of innocence GIVEN evidence"

**Real-World Check:**
- Someone says: "Only 1% chance this evidence appears if innocent"
- Ask yourself: "What's the chance I'd see this evidence if guilty? What's the base rate of guilt?"
- Calculate both directions before concluding

**Practical Exercise:**
Every time you hear a statistic in news/court/business:
1. Write down the base rate
2. Write down what the statistic actually measures
3. Ask: "Does this answer the question I care about?"

---

## II. SCOUT MINDSET: CHECKING YOUR OWN BULLSHIT

### The Core Question
"Am I trying to find the truth, or defend what I already believe?"

### Practical Detection Methods

**Test 1: The Reversal Test**
- Take your conclusion
- Imagine someone you dislike/disagree with made the exact same argument
- Does it suddenly seem weaker? (You're in soldier mindset)

**Test 2: The Selective Skeptic**
- Notice when you immediately accept evidence supporting your view
- Notice when you scrutinize evidence against your view
- If you're doing both, you're not truth-seeking

**Test 3: The Update Test**
Ask: "What would change my mind?" 
- If answer is "nothing" or vague → soldier mindset
- If you have specific, concrete criteria → scout mindset

### The Thought Experiment Technique

**When Making Important Decisions:**

1. **Write down your current belief**
2. **Imagine the opposite is true**
3. **Spend 5 minutes genuinely arguing for the opposite**
4. **Notice which arguments made you uncomfortable** (these threaten your belief)
5. **Investigate those specific arguments**

**Example - Hiring Decision:**
```
Belief: "Candidate A is clearly the best"
Reversal: "What if Candidate B is actually better?"
Uncomfortable argument: "Candidate A reminds me of myself, maybe I'm biased"
Investigation: Review both candidates' work samples blind, without names
```

---

## III. GEARS-LEVEL UNDERSTANDING

### What This Means
Don't just know THAT something works. Know WHY it works well enough to predict what happens when you change it.

### The Test
Can you:
1. Explain the mechanism in simple terms?
2. Predict what happens if you change one variable?
3. Explain why it might fail?

**Example:**

**Black-Box:** "Drinking coffee makes me alert"
**Gears-Level:** "Caffeine blocks adenosine receptors, which prevents drowsiness signals. Takes 20-30min to absorb. Half-life ~5hrs. If I drink coffee at 4pm, half the caffeine is still active at 9pm, disrupting sleep, creating cycle where I need more coffee."

**Predictions I can now make:**
- Coffee on empty stomach → faster effect but crash
- Afternoon coffee → poor sleep → more tired tomorrow
- Tolerance builds → need more for same effect
- L-theanine might smooth the response curve

### How to Build Gears-Level Models

**The 5 Why's Method:**

1. Observe phenomenon
2. Ask "why does this happen?"
3. Answer, then ask "why?" about that answer
4. Repeat 5 times until you hit fundamental mechanism
5. Test your model by making predictions

**Example - Code is Slow:**
1. Why? → The API call takes 3 seconds
2. Why? → It's fetching 10,000 records
3. Why? → No pagination implemented
4. Why? → Initial design assumed <100 records
5. Why? → Didn't consider growth over time

**Model:** Performance degrades as data grows without pagination
**Prediction:** Other endpoints will slow down as they accumulate data
**Test:** Check other endpoints' record counts
**Fix:** Implement pagination proactively

---

## IV. FERMI ESTIMATION: SOLVING "IMPOSSIBLE" PROBLEMS

### The Method

When faced with "I have no idea how to estimate this":

**Step 1: Decompose**
Break into parts you CAN estimate

**Step 2: Bound**
Find upper and lower limits (even crude ones)

**Step 3: Refine**
Focus effort on the parts with biggest uncertainty

### Real Example: "How many piano tuners in Chicago?"

**Bad approach:** "I don't know" or wild guess

**Good approach:**
```
Chicago population: ~3 million
Households: ~1 million (3 people/household)
% with pianos: ~3% = 30,000 pianos
Tunings per year: 1 per piano
Total tunings: 30,000/year

One tuner can do: 4 tunings/day × 250 work days = 1,000/year
Piano tuners needed: 30,000 ÷ 1,000 = 30 tuners
```

(Actual answer: ~290, off by 10x but in right ballpark)

### Business Application: "Should we build this feature?"

**Instead of endless debate:**

```
Users who'd use it: 20% of 10,000 users = 2,000
Increased retention: 5% of those = 100 users stay
Value per user: $50/month
Lifetime value: 12 months average = $600
Total value: 100 × $600 = $60,000

Development cost: 2 engineers × 3 weeks × $3k/week = $18,000
Opportunity cost: Could build Feature Y instead (similar analysis)

Simple decision: If we believe those estimates ± 50%, build it
If unsure on key assumptions, test them first
```

### Criminal Investigation Application

**Question:** "Did suspect have time to commit crime and reach alibi location?"

```
Crime scene to alibi: 15 miles
Time window: 45 minutes
Required speed: 15 miles ÷ 0.75 hours = 20 mph

Traffic at that time: Heavy (rush hour)
Realistic speed: 10-15 mph average
Lights/stops: 3-4 minutes

Conclusion: Tight but possible. Check:
- Traffic camera footage
- Phone GPS data
- Specific route taken
```

---

## V. PREMORTEM: KILLING YOUR PROJECT BEFORE IT KILLS YOU

### The Protocol

**Setup (5 minutes):**
1. Gather team
2. Present the plan
3. Say: "It's [6 months/1 year] from now. The project has failed spectacularly."

**Generation (10 minutes):**
4. Everyone silently writes reasons for failure
5. No judgment, no debate, just list everything
6. Encourage specific, detailed failure modes

**Sharing (20 minutes):**
7. Go around the room, each person shares one reason
8. Write all reasons on board
9. Continue until all reasons are shared

**Analysis (30 minutes):**
10. Group similar failure modes
11. Identify which are most likely
12. Identify which would be most damaging
13. Assign owners to mitigate top 5-10 risks

### Why This Works

**Psychology:** "Prospective hindsight" increases forecasting accuracy by 30%. Easier to imagine reasons for a failure that "already happened" than things that "might go wrong."

**Culture:** Permission to criticize without seeming negative. Junior members can point out issues seniors might miss.

### Real Example Template

**Project:** Launch new product feature

**Premortem Failures:**
- "Users didn't understand how to use it" → Add onboarding flow
- "Performance was terrible at scale" → Load test with 10x expected traffic
- "Sales team didn't know how to pitch it" → Create demo script and practice
- "Legal compliance issue we missed" → Early legal review
- "Key engineer left mid-project" → Documentation and knowledge sharing
- "Competitor launched similar feature first" → Monitor competitive landscape

**Mitigations Added:**
Week 1: Legal review (1 day)
Week 2: Create demo script (2 days)
Week 4: Load testing (3 days)
Ongoing: Weekly knowledge-sharing sessions

---

## VI. RED TEAMING: ATTACKING YOUR OWN POSITION

### What This Is

Deliberately take the opposing view and make the strongest possible case against your position.

### The Process

**Step 1: State Your Position Clearly**
Write it down. Be specific.

**Step 2: Become the Adversary**
Your job is now to destroy this position. You win by finding fatal flaws.

**Step 3: Adversarial Questions**

Ask:
- "What assumptions must be true for this to work?"
- "What if the opposite is true?"
- "Who benefits if I'm wrong?"
- "What evidence am I ignoring?"
- "What's the worst-case scenario?"
- "How could this backfire?"

**Step 4: Steelman (Not Strawman)**
Make the STRONGEST argument against your position, not the weakest.

**Step 5: Address or Adapt**
Either:
- Defend against the attack (strengthens your position)
- Modify your position (you found a real flaw)
- Abandon your position (you were wrong)

### Real Application: Investment Decision

**Position:** "We should invest $100k in Company X"

**Red Team Mode:**

```
Assumption check:
- Assumes market will grow 20%/year (what if recession?)
- Assumes team can execute (what if key person leaves?)
- Assumes no competition (what if Google enters space?)

Ignore check:
- Recent negative review from former employee
- Customer churn rate is 15% (above industry average)
- Two advisors declined to participate in this round

Worst case:
- Company fails, lose entire $100k
- Opportunity cost: could've invested in safer option
- Time cost: managing this investment

Devil's advocate:
"The team has no exits. The market is crowded. The tech isn't defensible. Customer acquisition cost is high and rising. This is a gamble, not an investment."
```

**Result:** Either strengthen the case with counterarguments or reduce investment amount.

---

## VII. CALIBRATION TRAINING: KNOWING WHAT YOU DON'T KNOW

### The Problem
Most people are either:
- Overconfident (90% sure but only right 60% of time)
- Underconfident (50% sure but right 80% of time)

### The Solution: Practice

**Week 1-2: Build Awareness**

1. Make 20 predictions about things you'll verify within 24 hours
2. Assign confidence: 50%, 60%, 70%, 80%, 90%, 95%
3. Track results
4. Calculate calibration

**Examples:**
- "Email response within 2 hours" - 70% confident
- "Meeting will start late" - 85% confident  
- "Coffee shop has seats available" - 60% confident
- "Code passes tests on first run" - 40% confident

**Week 3-4: Adjust**

Review results:
- If your "70% confident" predictions are only right 50% of time → you're overconfident
- If your "60% confident" predictions are right 80% of time → you're underconfident

**Week 5+: Refine**

Use platforms like Metaculus or Good Judgment Open to practice on real questions with feedback.

### Calibration in Practice: Business Decisions

**Before:** "This will definitely work" → fails 40% of time
**After:** "I'm 60% confident this will work" → accurate, can hedge bets

**Template for Major Decisions:**
```
Decision: [What we're deciding]
Base rate: [How often does this type of thing succeed?]
Inside view: [Specific factors making this case different]
My estimate: [X]% chance of success
If I'm right: [outcome]
If I'm wrong: [outcome]
At what probability would I change my decision? [threshold]
```

**Example:**
```
Decision: Hire this candidate
Base rate: 70% of hires work out in first year
Inside view: Great interview, relevant experience, culture fit concerns
My estimate: 65% chance of success
If right: Strong contributor, ship 2 major features
If wrong: $50k cost + 3 months lost + team disruption
Threshold: Would still hire at 55%, wouldn't hire below 50%
Action: Hire, but have 30-60-90 day check-ins to catch issues early
```

---

## VIII. INTEGRATION: SOLVING COMPLEX REAL-WORLD PROBLEMS

### The Complete Framework

When facing complex problem, run this checklist:

#### **Phase 1: Frame (10 minutes)**

- [ ] Scout mindset check: Am I defending a position or seeking truth?
- [ ] Reversal test: What if the opposite were true?
- [ ] Write down what I currently believe and why

#### **Phase 2: Decompose (20 minutes)**

- [ ] Break into sub-problems (Fermi approach)
- [ ] Identify which parts matter most
- [ ] What's the base rate for this type of problem?
- [ ] Estimate bounds (best/worst/likely case)

#### **Phase 3: Build Model (30 minutes)**

- [ ] What's the mechanism? (Gears-level)
- [ ] What are the causal relationships?
- [ ] What assumptions must hold?
- [ ] What could I test to validate model?

#### **Phase 4: Red Team (20 minutes)**

- [ ] Premortem: Imagine this failed, why?
- [ ] What evidence am I ignoring?
- [ ] What's the strongest case against this?
- [ ] Who disagrees and why?

#### **Phase 5: Bayesian Update (15 minutes)**

- [ ] Prior probability (base rate)
- [ ] What evidence do I have?
- [ ] How does evidence update my beliefs?
- [ ] What's my confidence level? (calibration)
- [ ] What would change my mind?

#### **Phase 6: Decide & Document (10 minutes)**

- [ ] Given uncertainty, what action maximizes expected value?
- [ ] What's my confidence level?
- [ ] What will I check to know if I'm right/wrong?
- [ ] When will I review this decision?

---

## IX. WORKED EXAMPLE: INVESTIGATING BUSINESS FAILURE

**Scenario:** Your e-commerce store's sales dropped 40% last month.

### **Phase 1: Frame**

**Scout check:** 
- Temptation: Blame external factors (economy, competition)
- Truth-seeking: Look at all data objectively

**Write current belief:**
"Sales dropped because [I don't know yet]"

### **Phase 2: Decompose**

**Sub-problems:**
- Traffic to site (down/same/up?)
- Conversion rate (down/same/up?)
- Average order value (down/same/up?)
- Return customers vs new (changed?)

**Fermi bounds:**
- Best case: Temporary blip, recovers next month
- Worst case: Permanent structural change
- Likely: Identifiable cause we can fix

### **Phase 3: Build Model**

**Check data:**
- Traffic: Down 15%
- Conversion: Down 30%
- AOV: Same
- Returns: Down 45%

**Gears-level model:**
"New customers converting similarly, but returning customers dropped sharply. Traffic drop is secondary effect."

**Mechanism hypothesis:**
Something broke the repeat purchase loop.

### **Phase 4: Red Team**

**Premortem:** "It's next month. Sales dropped another 40%. Why?"
- Email system broken, customers not getting reminders
- Competitor launched aggressive campaign
- Website performance degraded
- Pricing increased and customers left
- Seasonal effect we ignored

**Check each:**
- Email: Open rates normal
- Competitors: No major changes
- Performance: Load time increased from 2s to 6s (FOUND IT)
- Pricing: No changes
- Seasonality: Not typical for our business

### **Phase 5: Bayesian Update**

**Prior:** "Could be many things" - 20% any single cause
**Evidence:** Page load time 3x slower
**Knowledge:** 1 second delay → 7% conversion drop (industry data)
**Calculation:** 4 second delay → ~28% conversion drop
**Observation:** 30% conversion drop

**Updated belief:** 80% confident slow page load is primary cause

**What would change my mind:**
- Fix load time, conversions don't recover → look elsewhere
- Find other sites had same issue, no impact → different cause

### **Phase 6: Decide**

**Decision:** Prioritize fixing page performance

**Confidence:** 80%

**Expected value:**
- Cost to fix: $5k (2 days engineering)
- If correct (80%): Recover $60k/month revenue
- If wrong (20%): Lost $5k + 2 days, need different solution

**EV = 0.8 × $60k - 0.2 × $5k = $47k** → Clear yes

**Validation plan:**
- Fix performance this week
- Monitor conversions daily
- If no improvement in 1 week, investigate other causes

**Review:**
- 1 week: Check if conversions recovered
- 1 month: Post-mortem on what we learned

---

## X. COMMON TRAPS & HOW TO AVOID THEM

### **Trap 1: Analysis Paralysis**
**Symptom:** Gathering more data instead of deciding
**Fix:** Set decision deadline. Ask "what decision would I make with current info?" If more data wouldn't change it, decide now.

### **Trap 2: Fake Precision**
**Symptom:** "There's a 73.4% chance of success"
**Fix:** Use bins: <10%, ~25%, ~50%, ~75%, >90%. False precision suggests certainty you don't have.

### **Trap 3: Ignoring Your Gut Entirely**
**Symptom:** "Analysis says X but it feels wrong" → do X anyway
**Fix:** Your gut is data. Ask "why does this feel wrong?" Might be pattern recognition your conscious mind hasn't articulated.

### **Trap 4: Motivated Skepticism**
**Symptom:** Immediately scrutinizing evidence you dislike, accepting evidence you like
**Fix:** Set evaluation criteria BEFORE seeing evidence. Apply same standard to both.

### **Trap 5: Sunk Cost Fallacy**
**Symptom:** "We've already invested $50k, can't stop now"
**Fix:** Ask "If I were starting fresh today, would I invest $50k?" If no, stop.

### **Trap 6: Planning Fallacy**
**Symptom:** "This will take 2 weeks" → takes 6 weeks
**Fix:** Reference class forecasting. Ask "how long did similar projects take?" Use that, not inside view.

### **Trap 7: Confirmation Bias**
**Symptom:** Only looking for evidence supporting your hypothesis
**Fix:** Actively search for disconfirming evidence. Ask "what would prove me wrong?"

---

## XI. DAILY PRACTICES

### **Morning (5 minutes)**
- Make 3 predictions about today (with confidence levels)
- Note one assumption you're making about your day

### **During Decisions (2 minutes each)**
- "What's the base rate?"
- "What would change my mind?"
- "Am I in scout or soldier mindset?"

### **Evening (5 minutes)**
- Review predictions: Were you calibrated?
- Note one time you noticed motivated reasoning
- Note one gears-level insight you gained

### **Weekly Review (30 minutes)**
- Track calibration: Are your X% predictions right X% of time?
- Review major decisions: What did you learn?
- Premortem next week: What could go wrong?

### **Monthly Deep Dive (2 hours)**
- Pick one belief you hold strongly
- Red team it thoroughly
- Update or strengthen based on results
- Document reasoning for future reference

---

## XII. RESOURCES FOR PRACTICE

### **Calibration Training:**
- Metaculus.com - Practice forecasting
- Good Judgment Open - Real-world predictions
- PredictionBook.com - Track personal predictions

### **Applied Practice:**
- Keep decision journal
- Review quarterly: What worked? What failed? Why?
- Share with accountability partner

### **Mental Models:**
- Test each model: Make prediction, check result
- Build your own library of gears-level models
- Share and debug with others

---

## FINAL NOTE

**These techniques are useless unless practiced.**

Start with ONE:
1. This week: Track 3 predictions daily (calibration)
2. Next decision: Run through Phase 1-6 checklist
3. Next project: Run a premortem

Build from there. 

The goal isn't to be perfectly rational. It's to be less wrong than yesterday.
