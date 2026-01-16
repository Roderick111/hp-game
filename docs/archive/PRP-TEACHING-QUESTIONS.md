# PRP: Teaching Question Multiplicity Analysis

**Status**: DECIDED (KEEP AS-IS)
**Effort**: N/A (Decision Record)
**Philosophy**: Simplicity for onboarding > Complex mechanics without pedagogical need.

---

## Goals

1.  Analyze the current "Single Question" constraints in the Teaching Question system.
2.  Evaluate the technical cost of implementing "Multiple Questions" support.
3.  Document the decision to maintain the current single-question design.

## Non-Goals

-   ❌ Implementing support for multiple teaching questions per case.
-   ❌ Updating the frontend to loop through questions.
-   ❌ Migrating YAML case files to a list structure.

---

## Technical Analysis

### Current State (Single Question)

The current system is strictly designed for a 1:1 relationship between a Case and a Teaching Question (Briefing).

1.  **Frontend (`BriefingModal.tsx`)**:
    -   Accesses `briefing.teaching_question` as a singular object (Line 87-89).
    -   Renders exactly one prompt, one set of choices, and one concept summary.
    -   UI logic assumes a single pass; there is no state management for "next question" or progress tracking within the briefing.

2.  **Backend (`routes.py`)**:
    -   The Pydantic model defines `teaching_question: TeachingQuestion` (Singular) (Line 385).
    -   API responses return a single object.

3.  **Data Structure (`case_*.yaml`)**:
    -   YAML files define `teaching_question:` as a single dictionary block (e.g., `case_001.yaml`, Line 890).
    -   Structure: One prompt, multiple choices, one `concept_summary`.

### Required Changes for "Multiple Questions"

To support multiple questions (e.g., from Moody), the following would be required:

1.  **Data Model Change**:
    -   Update Backend models to `teaching_questions: list[TeachingQuestion]`.
    -   Migration of all existing YAML files to use a list structure (even for single questions).

2.  **Frontend Logic**:
    -   Refactor `BriefingModal` to handle a queue/list of questions.
    -   Implement "Next" navigation or sequential flow.
    -   Manage state for which questions have been answered vs. remaining.
    -   Accumulate results/scores if applicable.

3.  **Complexity**:
    -   Adds significant state management overhead to the onboarding flow.
    -   Increases potential for friction before the game actually starts.

---

## Recommendation

**Keep As-Is.**

The current single-question design is clean, focused, and sufficient for the primary goal: on-boarding the player with a specific concept context.
-   Adding multiple questions increases complexity without a clear benefit.
-   Players can ask unlimited follow-up questions via the interactive Q&A section ("Any questions?") immediately after the briefing.
-   If deep pedagogical verification is needed, it should likely happen *during* the gameplay (via interactions) rather than a front-loaded quiz.

**Decision**: Maintain single `teaching_question` structure. Only revisit if a specific pedagogical need requires structured multi-step verification before gameplay.
