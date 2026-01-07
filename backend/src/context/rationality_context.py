"""Rationality thinking guide for Moody's context.

Condensed from docs/rationality-thinking-guide-condensed.md (290 lines).
Used to inject into Moody's LLM prompts for natural Q&A about rationality concepts.
"""

RATIONALITY_PRINCIPLES = """
# Core Rationality Concepts for Investigation

## Bayesian Thinking (Base Rates)
Start with prior probabilities (how common is this?) then update based on evidence.
Example: If 85% of school incidents are accidents, start there before jumping to conspiracy.

## Confirmation Bias
Focusing only on evidence supporting your theory while ignoring contradictory evidence.
Example: Focusing on a suspect's presence while dismissing evidence that exonerates them.

## Scout Mindset vs Soldier Mindset
Scout: Truth-seeking, willing to update beliefs. Soldier: Defending pre-existing beliefs.
Example: A scout investigator follows evidence wherever it leads, even if contradicting initial theory.

## Correlation vs Causation
Two events happening together doesn't mean one caused the other.
Example: A suspect arguing with the victim earlier doesn't prove they committed the later crime.

## Burden of Proof
The person making a claim must provide evidence, not the other way around.
Example: "Prove you're innocent" is wrong. The accuser must prove guilt.

## Motivated Reasoning
Unconsciously reasoning toward a desired conclusion rather than following evidence.
Example: Wanting a rival to be guilty and finding "evidence" to support it.

## Availability Heuristic
Judging probability by how easily examples come to mind (often wrong).
Example: Thinking murder is common because it's memorable, when accidents are more frequent.

## Anchoring Bias
Over-relying on the first piece of information encountered.
Example: If the first witness blames someone, you might unconsciously favor that theory.

## Sunk Cost Fallacy
Continuing a course of action because of past investment, even when evidence suggests it's wrong.
Example: Sticking with an accusation because you've spent hours interrogating that suspect.

## Appeal to Authority
Believing something is true just because an authority figure said it, without verifying.
Example: Trusting a witness's testimony without checking if physical evidence supports it.

## Ad Hominem
Attacking the person making an argument rather than addressing the argument itself.
Example: Dismissing a witness's statement because you don't like their personality.

## Occam's Razor
The simplest explanation that fits the evidence is usually correct (but not always).
Example: If a window is frosty, a freezing charm is more likely than a rare magical artifact.

## False Dilemma
Presenting only two options when more exist.
Example: "Either it was murder or an accident" (could be self-defense, magical malfunction, etc.)

## Post Hoc Ergo Propter Hoc
Assuming that because B came after A, A caused B.
Example: "They argued, then the victim died, so the argument caused the death" (maybe unrelated).

## Hasty Generalization
Drawing broad conclusions from limited evidence.
Example: "This student lied once, so everything they say is false."

## Black and White Thinking
Seeing situations as all-good or all-bad with no middle ground.
Example: "If they're not completely innocent, they must be guilty of everything."

## Gears-Level Thinking
Know WHY something works, not just THAT it works. Understand the mechanism.
Example: "Caffeine blocks adenosine receptors" vs just "coffee wakes me up."

## Alternative Hypotheses
If suspect DIDN'T do it, how else could this evidence exist?
Example: Wand signature matches suspect. Alternative: Wand was borrowed. Must rule out alternatives.

## Premortem
Imagine your theory is wrong. Why did it fail? What did you miss?
Example: Before submitting verdict, ask "If I'm wrong, what evidence am I ignoring?"

## Red Teaming
Deliberately make strongest case AGAINST your position.
Example: "What if Hermione lied? What if frost pattern was faked?"

## Evidence Strength
Strong: Physical (wand residue, spell traces), recorded (magical records).
Weak: Eyewitness alone, motive alone, presence alone.
Fix: Combine multiple independent evidence types.

## Timeline Reasoning
Establish sequence of events with precision from evidence, not assumptions.
Example: 9:00pm Draco at window, 9:15pm victim casts Stupefy, 9:20pm victim found.
"""


def get_rationality_context() -> str:
    """Get rationality principles for Moody's LLM context.

    Returns:
        Condensed rationality guide for prompt injection.
    """
    return RATIONALITY_PRINCIPLES
