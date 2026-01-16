# PRP: Multiple Teaching Questions in Briefing

**Status**: PROPOSED
**Author**: Antigravity
**Date**: 2026-01-16
**Objective**: Support multiple teaching questions during the briefing phase to allow for more robust rationality training before the case begins.

---

## 1. Goal Description

The current system supports only a single "teaching question" per case. This limits the pedagogical depth, as complex rationality concepts often require multiple examples or a stepped approach to fully explain (e.g., first establishing a baseline, then introducing a complication).

We will refactor the system to support a **sequence of teaching questions**. The user will proceed through them one by one. The "Start Investigation" button will only become available after all questions are completed (and the existing Q&A requirement is met).

### Core Requirements
1.  **Backend Support**: Update data models to support a list of questions (`teaching_questions` instead of `teaching_question`).
2.  **Dataset Migration**: Convert `case_001.yaml` to the new list format.
3.  **Frontend Logic**: Update `useBriefing` hook to manage the index of the current question.
4.  **Frontend UI**: Update `BriefingModal` to show the current question, handle navigation ("Next Question"), and only show the final transition after the sequence is done.

---

## 2. Technical Specifications

### 2.1 Backend Changes

#### Schema Update (`backend/src/api/routes.py` & `backend/src/state/player_state.py`)

Current Model:
```python
class BriefingContent(BaseModel):
    # ...
    teaching_question: TeachingQuestion
```

New Model:
```python
class BriefingContent(BaseModel):
    # ...
    teaching_questions: list[TeachingQuestion]
```

#### YAML Structure (`backend/src/case_store/case_001.yaml`)

Current YAML:
```yaml
briefing:
  teaching_question:
    prompt: "..."
    choices: [...]
    concept_summary: "..."
```

New YAML:
```yaml
briefing:
  teaching_questions:
    - id: "bs_base_rates_1"   # Optional ID for tracking
      prompt: "..."
      choices: [...]
      concept_summary: "..."
    - id: "bs_base_rates_2"
      prompt: "..."
      choices: [...]
      concept_summary: "..."
```

### 2.2 Frontend Changes

#### State Management (`useBriefing.ts`)

We need to track progress through the list of questions.

*   **New State**: `currentQuestionIndex` (number, default 0).
*   **New State**: `answers` (Record<number, string>) to track selected choice for each question index (so we can go back/forward if needed, though linear progress is simpler).
    *   *Decision*: Keep it simple (KISS). Linear forward progress only. We only need `currentQuestionIndex`. If the user answers Q1, we show the summary and a "Next" button. Clicking "Next" increments `currentQuestionIndex`.
*   **Updated State**: `selectedChoice` and `choiceResponse` need to reset when moving to the next question.

#### UI Logic (`BriefingModal.tsx`)

*   **Render Loop**: Instead of rendering `briefing.teaching_question`, render `briefing.teaching_questions[currentQuestionIndex]`.
*   **Navigation**:
    *   If `choiceResponse` is present (question answered):
        *   If `currentQuestionIndex < totalQuestions - 1`: Show **"Next Question"** button.
        *   If `currentQuestionIndex === totalQuestions - 1`: Show **"Start Investigation"** (or waiting for Q&A).
*   **Progress Indicator**: (Optional but good) "Question 1 of 3".

---

## 3. Implementation Plan

### Phase 1: Backend & Data Migration

1.  ** Modify `backend/src/api/routes.py`**:
    *   Update `BriefingContent` model to use `teaching_questions: list[TeachingQuestion]`.
    *   *Self-Correction*: Check if existing loads will break. Yes, existing YAMLs will fail validation. We must update YAMLs *simultaneously* or support both fields temporarily. Since we have full control, we will update the code and YAML in one go.

2.  **Migrate `case_001.yaml`**:
    *   Change `teaching_question` block to `teaching_questions` list containing that single block.

### Phase 2: Frontend Logic (`useBriefing.ts`)

3.  **Refactor `useBriefing` hook**:
    *   Update `BriefingContent` TS type definition to match backend.
    *   Add `currentQuestionIndex` state.
    *   Add `nextQuestion` function: clears `selectedChoice`/`choiceResponse`, increments index.
    *   Update `selectChoice` to find the choice within `teaching_questions[currentQuestionIndex]`.

### Phase 3: Frontend UI (`BriefingModal.tsx`)

4.  **Refactor `BriefingModal`**:
    *   Accept `currentQuestionIndex`, `totalQuestions`, and `onNextQuestion` props.
    *   Update rendering to access correct question from list.
    *   Implement "Next Question" button logic.
    *   Ensure "Start Investigation" is hidden until the *last* question is answered.

---

## 4. Verification Plan

### Automated Tests
*   **Backend**: `uv run pytest backend/tests/api/test_routes_briefing.py` (if exists) or create a simple test to verify the new model parses the list correctly.
*   **Frontend**: Since we don't have extensive frontend component tests acting as gates, verification will be manual.

### Manual Verification
1.  **Load Case 001**: Verify it loads without crashing (migration success).
2.  **Briefing Interaction**:
    *   Confirm Question 1 appears.
    *   Answer Question 1.
    *   Confirm Concept Summary appears.
    *   (If we add a 2nd question to YAML for testing): Confirm "Next" button appears.
    *   Click "Next". Confirm Question 2 appears.
    *   Answer Question 2.
    *   Confirm "Start Investigation" button appears (assuming Q&A constraint met).
