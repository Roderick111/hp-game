# Research Repository

**Last Updated**: 2026-01-07

## Core Documentation

### Python Backend

| Resource | URL | Type | Why Critical |
|----------|-----|------|--------------|
| Anthropic Python SDK | [github.com/anthropics/anthropic-sdk-python](https://github.com/anthropics/anthropic-sdk-python) | Official SDK | Async client, streaming, error handling |
| Anthropic Messages API | [docs.anthropic.com/en/api/messages](https://docs.anthropic.com/en/api/messages) | Official Docs | Messages API structure, system prompts |
| Claude Prompt Engineering | [docs.claude.com/prompt-engineering](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/claude-4-best-practices) | Official Docs | Claude 4.x best practices, instruction following |
| Claude Character Consistency | [docs.anthropic.com/claude/keep-in-character](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/keep-claude-in-character) | Official Docs | Prevent context bleeding, role isolation |
| Pydantic Models | [pydantic-docs.helpmanual.io/usage/models](https://pydantic-docs.helpmanual.io/usage/models/) | Official Docs | Type validation, JSON serialization |
| FastAPI Async Best Practices | [github.com/zhanymkanov/fastapi-best-practices](https://github.com/zhanymkanov/fastapi-best-practices) | Production Guide (14.1k⭐) | Project structure, async routes, migrations |
| FastAPI Async Routes | [fastapi.tiangolo.com/async](https://fastapi.tiangolo.com/async/) | Official Docs | When to use async vs sync |
| pytest | [docs.pytest.org](https://docs.pytest.org) | Official Docs | Python testing |

---

## Critical Patterns

### 1. AsyncAnthropic Client Pattern

```python
from anthropic import AsyncAnthropic
import os

client = AsyncAnthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

async def get_narrator_response(prompt: str) -> str:
    message = await client.messages.create(
        model="claude-haiku-4",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}]
    )
    return message.content[0].text
```

**Source**: `backend/src/api/claude_client.py`

---

### 2. State Persistence Pattern

```python
from pathlib import Path
import json

def save_state(state: PlayerState, player_id: str) -> Path:
    save_dir = Path("backend/saves")
    save_dir.mkdir(exist_ok=True)
    save_path = save_dir / f"{state.case_id}_{player_id}.json"

    with open(save_path, "w", encoding="utf-8") as f:
        json.dump(state.model_dump(mode="json"), f, indent=2, default=str)

    return save_path

def load_state(case_id: str, player_id: str) -> PlayerState | None:
    save_path = Path("backend/saves") / f"{case_id}_{player_id}.json"

    if not save_path.exists():
        return None

    with open(save_path, encoding="utf-8") as f:
        data = json.load(f)

    return PlayerState(**data)
```

**Source**: `backend/src/state/persistence.py`

---

### 3. LLM Prompt Structure (Strict Rules + Context)

```python
def build_narrator_prompt(location_data: dict, player_input: str) -> str:
    return f"""You are the narrator for a Harry Potter detective game.

== RULES ==
1. If player query matches hidden_evidence triggers → reveal with [EVIDENCE: id]
2. If already discovered → "You've already examined this thoroughly."
3. If not_present → use defined response
4. If undefined → describe atmosphere, NO new clues
5. Keep responses 2-4 sentences

== LOCATION ==
{location_data['description']}

== HIDDEN EVIDENCE ==
{location_data['hidden_evidence']}

== NOT PRESENT ==
{location_data['not_present']}

== PLAYER ACTION ==
"{player_input}"

Respond as narrator (2-4 sentences):"""
```

**Key Principle**: Strict conditional logic prevents hallucination.

**Source**: `backend/src/context/narrator.py`

---

### 4. Context Isolation (Multi-LLM Pattern)

**Critical for narrative integrity**:

- **Narrator**: Knows location, evidence, not_present (❌ witness secrets, solution)
- **Witness**: Knows personality, secrets, lies (❌ other witnesses, solution)
- **Mentor**: Knows solution, fallacies (❌ investigation details)

**Why**: Prevents knowledge leakage between LLM contexts.

**Source**: `docs/AUROR_ACADEMY_GAME_DESIGN.md` (lines 1556-1562)

---

### 5. Evidence Trigger Matching

```python
def matches_trigger(player_input: str, triggers: list[str]) -> bool:
    """Check if player input matches any trigger keyword."""
    input_lower = player_input.lower()
    return any(trigger in input_lower for trigger in triggers)
```

**Usage**: Compare player input against `hidden_evidence.triggers` in YAML.

**Source**: `backend/src/context/narrator.py`

---

### 6. LLM Feedback with Template Fallback

```python
import logging

logger = logging.getLogger(__name__)

def build_moody_feedback_llm(
    correct: bool,
    reasoning: str,
    accused_id: str,
    solution: dict,
) -> str:
    """Generate Moody's feedback via Claude Haiku with template fallback."""
    try:
        prompt = _build_moody_prompt(correct, reasoning, accused_id, solution)
        response = get_response(prompt, max_tokens=200)
        return response.strip()

    except Exception as e:
        logger.warning(f"LLM feedback failed, using template: {e}")
        return _build_template_feedback(correct, reasoning, accused_id, solution)
```

**Key Principle**: Always fallback, never crash on LLM failure.

**Source**: `PRPs/phase3.1-prp.md` (lines 439-547)

---

### 7. Evidence Presentation Detection

```python
import re

def detect_evidence_presentation(player_input: str) -> str | None:
    """Check if player is presenting evidence to witness."""
    patterns = [
        r"show (?:the )?(\w+)",
        r"present (?:the )?(\w+)",
        r"give (?:the )?(\w+)",
        r"reveal (?:the )?(\w+)"
    ]

    for pattern in patterns:
        match = re.search(pattern, player_input.lower())
        if match:
            return match.group(1)  # evidence_id

    return None
```

**Usage**: Check if player presenting evidence → trigger witness secrets.

**Source**: `PRPs/phase2-narrative-witness.md` (lines 203-232)

---

### 8. Trust Adjustment Logic

```python
def adjust_trust(question: str) -> int:
    """Calculate trust delta based on question tone."""

    # Aggressive/accusatory → decrease trust
    aggressive_keywords = ["lie", "lying", "accuse", "guilty", "did it"]
    if any(kw in question.lower() for kw in aggressive_keywords):
        return -10

    # Empathetic/neutral → increase trust
    empathetic_keywords = ["understand", "help", "remember", "tell me"]
    if any(kw in question.lower() for kw in empathetic_keywords):
        return +5

    return 0  # Neutral
```

**Usage**: Update witness trust based on player question tone (0-100 scale).

**Source**: `PRPs/phase2-narrative-witness.md` (lines 234-251)

---

### 9. Witness System Prompt Structure

```python
def build_witness_prompt(witness: dict, trust_level: int, player_input: str) -> str:
    return f"""You are {witness['name']} in a Harry Potter detective game.

== PERSONALITY ==
{witness['personality']}

== YOUR KNOWLEDGE ==
{format_knowledge(witness['knowledge'])}

== TRUST LEVEL: {trust_level}/100 ==
Trust behavior:
- 0-30: Evasive, may lie
- 30-70: Truthful but withhold secrets
- 70-100: Open, reveal secrets

== SECRETS (only reveal if trust/evidence triggers met) ==
{format_available_secrets(witness['secrets'], trust_level)}

== RULES ==
1. Stay in character as {witness['name']}
2. You DO NOT know: investigation details, other testimonies, case solution
3. Respond naturally in 2-4 sentences
4. If trust <30, be evasive about: {witness['lies']}

== PLAYER QUESTION ==
"{player_input}"

Respond as {witness['name']}:"""
```

**Key Principle**: Trust-based secret revelation, isolated context (no solution knowledge).

**Source**: `PRPs/phase2-narrative-witness.md` (lines 254-313)

---

### 10. Tutorial State Machine (Progressive Disclosure)

**From GitHub Research**: [github.com/YarnSpinnerTool/YarnSpinner](https://github.com/YarnSpinnerTool/YarnSpinner) (2.5k-3k⭐) + [github.com/nathanhoad/godot_dialogue_manager](https://github.com/nathanhoad/godot_dialogue_manager) (3k⭐)

```python
class TutorialState(Enum):
    """Tutorial progression stages - each gates complexity."""
    INTRO = "intro"              # Unskippable opening
    MECHANIC_1 = "mechanic_1"    # Core mechanic (skippable if proficient)
    MECHANIC_2 = "mechanic_2"    # Advanced mechanic (locked until MECHANIC_1)
    MENTOR_TRAINING = "mentor"   # Optional deep-dive (skippable)
    FREE_PLAY = "free_play"      # Unrestricted gameplay

# Track per-stage metrics for personalization
@dataclass
class TutorialMetrics:
    stage: TutorialState
    time_spent: float          # seconds
    mistakes_count: int        # failed attempts
    proficiency_score: float   # 0.0 (struggling) to 1.0 (expert)
    skip_requested: bool

def advance_tutorial(metrics: TutorialMetrics) -> TutorialState | None:
    """Gate next stage based on performance, support skip."""
    if metrics.skip_requested:
        # Check proficiency: if <0.3, don't allow skip
        if metrics.proficiency_score < 0.3:
            return None  # Require completion first
        return next_stage(metrics.stage)

    # Progress only if proficient enough
    if metrics.mistakes_count < 2 and metrics.proficiency_score > 0.5:
        return next_stage(metrics.stage)
    return None  # Replay current stage
```

**Key Principle**: Each tutorial stage has proficiency gate + skip option. Adapt next lesson based on performance metrics.

**Source**: [GITHUB_RESEARCH.md - Yarn Spinner + Godot Dialogue Manager patterns](GITHUB_RESEARCH.md)

---

### 11. Skip Functionality Pattern (Production-Ready)

**From GitHub Research**: [github.com/gilbarbara/react-joyride](https://github.com/gilbarbara/react-joyride) (4.7k-7k⭐)

```python
# Primary skip: Entire tutorial opt-out
def skip_tutorial_request(player_id: str, stage: TutorialState) -> bool:
    """
    Check if player can skip current tutorial stage.

    Returns:
        True if skip allowed, False if proficiency gate blocks skip
    """
    metrics = load_tutorial_metrics(player_id, stage)

    # Hard gates: No skip until proficient
    if stage == TutorialState.INTRO:
        return False  # Cannot skip intro

    if metrics.mistakes_count > 3:
        return False  # Too many mistakes, review required

    if metrics.time_spent < 30:
        return False  # Too quick, probably didn't learn

    # Soft gate: Warn but allow
    if metrics.proficiency_score < 0.4:
        # Return dialog: "You might not be ready. Continue anyway?"
        return "confirm"  # Requires player confirmation

    return True  # Skip allowed

# Fast-path when skip confirmed
def execute_tutorial_skip(player_id: str, stage: TutorialState) -> None:
    """Grant starter items, unlock areas, set completion flags."""
    case = load_case(player_id)

    # Award stage-appropriate starting equipment
    starter_items = get_stage_starter_items(stage)
    case.inventory.extend(starter_items)

    # Unlock next area (gate closure)
    case.unlock_area(get_next_area(stage))

    # Mark tutorial as complete (prevent re-running)
    case.tutorial_completed[stage.value] = True

    save_case(case, player_id)
```

**Key Principle**: Hard gates (safety) + soft gates (warnings) + completion skip support.

**Source**: [React Joyride callback system](https://github.com/gilbarbara/react-joyride) pattern

---

### 12. Dialogue-Based Personalization (Mentor Context Injection)

**From GitHub Research**: [github.com/YarnSpinnerTool/YarnSpinner](https://github.com/YarnSpinnerTool/YarnSpinner) (adaptive dialogue patterns)

```yaml
# Yarn Spinner: Inject player metrics into dialogue
title: Mentor_Combat_Lesson
---
<<if $player_mistakes > 2>>
    Mentor: I see you're struggling. Let's break this down step by step.
    <<set $lesson_pace = "slow">>
<<elseif $player_mistakes == 1>>
    Mentor: Good progress. Let me show you a faster technique.
    <<set $lesson_pace = "normal">>
<<else>>
    Mentor: You're a natural! Ready for advanced combinations?
    <<set $lesson_pace = "fast">>
<<endif>>

<<if $lesson_pace == "slow">>
    Mentor: First, hold the sword loosely. Watch as I demonstrate.
    <<run $show_sword_demo()>>
<<elseif $lesson_pace == "fast">>
    Mentor: Chain attacks like this: strike, parry, counter.
    <<run $show_combo_sequence()>>
<<endif>>
```

**Python Integration**:
```python
# Before showing dialogue, inject metrics context
def prepare_mentor_dialogue(player_id: str) -> dict:
    """Prepare dialogue context with player performance data."""
    metrics = load_player_metrics(player_id)

    return {
        "player_mistakes": metrics.current_stage_mistakes,
        "player_confidence": metrics.proficiency_score,
        "player_speed": metrics.average_completion_time,
        "previous_stage_passed": metrics.last_stage_mastered
    }

# Load dialogue with context
dialogue_context = prepare_mentor_dialogue(player_id)
mentor_response = yarn_spinner.run_dialogue(
    resource="mentor_lesson.yarn",
    title="combat_basics",
    context=dialogue_context
)
```

**Key Principle**: Mentor's teaching style adapts to real-time player metrics via dialogue variables.

**Source**: [GITHUB_RESEARCH.md - Yarn Spinner conditional pattern](GITHUB_RESEARCH.md)

---

### 13. React Multi-Step Dialogue State Management

**Official Pattern**: React 18 hooks with useTransition for async safety

```javascript
// BriefingFlow.tsx - Multi-step dialogue state
import { useReducer, useTransition, Suspense } from 'react'

type BriefingAction =
  | { type: 'NEXT_STEP' }
  | { type: 'SKIP_STEP' }
  | { type: 'RESPONSE_GIVEN'; response: string }
  | { type: 'DIALOGUE_RECEIVED'; dialogue: string }

interface BriefingState {
  currentStep: number  // 1 = assignment, 2 = teaching, 3 = transition
  responses: Record<number, string>
  skipped: number[]
  dialogueHistory: Array<{step: number; moodyText: string; playerInput?: string}>
  loading: boolean
}

function briefingReducer(state: BriefingState, action: BriefingAction): BriefingState {
  switch (action.type) {
    case 'NEXT_STEP':
      return {...state, currentStep: state.currentStep + 1}
    case 'SKIP_STEP':
      return {
        ...state,
        currentStep: state.currentStep + 1,
        skipped: [...state.skipped, state.currentStep]
      }
    case 'DIALOGUE_RECEIVED':
      return {
        ...state,
        loading: false,
        dialogueHistory: [
          ...state.dialogueHistory,
          {step: state.currentStep, moodyText: action.dialogue}
        ]
      }
    default:
      return state
  }
}

function BriefingFlow({caseId, playerId}: {caseId: string; playerId: string}) {
  const [state, dispatch] = useReducer(briefingReducer, initialState)
  const [isPending, startTransition] = useTransition()

  async function handleSkip() {
    // Abort any pending Claude request
    controller.abort()
    dispatch({type: 'SKIP_STEP'})
  }

  async function handleResponse(playerInput: string) {
    // Fetch Moody's response without blocking UI
    startTransition(async () => {
      try {
        const response = await fetch('/api/briefing/{caseId}/generate-dialogue', {
          method: 'POST',
          body: JSON.stringify({playerInput, teachingConcept})
        })
        const {dialogue} = await response.json()
        dispatch({type: 'DIALOGUE_RECEIVED', dialogue})
      } catch (e) {
        console.error('Failed to get Moody response:', e)
      }
    })
  }

  return (
    <Suspense fallback={<LoadingBriefing />}>
      <BriefingStep
        step={state.currentStep}
        isPending={isPending}
        onSkip={handleSkip}
        onRespond={handleResponse}
      />
    </Suspense>
  )
}
```

**Key Pattern**: `useTransition` prevents UI freeze during Claude API calls. `useReducer` tracks complex state (step, responses, dialogue history).

**Source**: Context7 `/websites/18_react_dev` + existing project patterns

---

### 14. FastAPI Session Dependency Pattern for Briefing State

**Official Pattern**: Dependency injection with yield context manager

```python
# briefing_router.py
from typing import Annotated
from fastapi import APIRouter, Depends
from sqlmodel import Session

router = APIRouter(prefix="/api/briefing", tags=["briefing"])

# 1. Session dependency
def get_session():
    with Session(engine) as session:
        yield session

SessionDep = Annotated[Session, Depends(get_session)]

# 2. Load briefing state (case data + player progress)
@router.get("/{case_id}")
async def get_briefing(
    case_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep
):
    # Load case YAML
    case_data = load_case_yaml(case_id)

    # Load player briefing progress (if resuming)
    briefing_state = session.query(BriefingProgress).filter(
        BriefingProgress.player_id == current_user.id,
        BriefingProgress.case_id == case_id
    ).first()

    return {
        "case": case_data,
        "player_state": briefing_state or default_state(current_user.id, case_id)
    }

# 3. Save briefing progress (called after each step)
@router.post("/{case_id}/progress")
async def save_briefing_progress(
    case_id: str,
    progress: BriefingProgress,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep
):
    # Update session expiry to prevent timeout during long briefing
    update_session_expiry(session, current_user.id, extend_by_seconds=300)

    # Upsert briefing state
    existing = session.query(BriefingProgress).filter(
        BriefingProgress.player_id == current_user.id,
        BriefingProgress.case_id == case_id
    ).first()

    if existing:
        for key, value in progress.dict().items():
            setattr(existing, key, value)
    else:
        session.add(progress)

    session.commit()
    return {"status": "saved", "step": progress.current_step}

# 4. Generate Moody dialogue dynamically
@router.post("/{case_id}/generate-dialogue")
async def generate_briefing_dialogue(
    case_id: str,
    payload: DialogueRequest,  # {playerInput, teachingConcept}
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep
):
    # Load teaching concept from case YAML
    case_data = load_case_yaml(case_id)
    teaching = case_data["briefing"]["teaching_concepts"][payload.teaching_concept_id]

    # Build Moody's system prompt with context
    system_prompt = build_moody_system_prompt(teaching, case_data)

    # Call Claude API
    message = await async_client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=150,
        system=system_prompt,
        messages=[{"role": "user", "content": payload.playerInput}]
    )

    moody_response = message.content[0].text

    # Save to history
    update_session_expiry(session, current_user.id)

    return {"dialogue": moody_response}
```

**Key Pattern**: `yield` ensures session cleanup. `Annotated[Session, Depends(get_session)]` injects session. `Depends(get_current_user)` injects authenticated user. All endpoints extend session timeout during briefing.

**Source**: Context7 `/websites/fastapi_tiangolo` + FastAPI patterns

---

### 15. Dynamic Moody System Prompt (Claude API Pattern)

```python
def build_moody_system_prompt(teaching_concept: dict, case_context: dict) -> str:
    """Build Moody's character prompt with teaching context."""
    return f"""You are Mad-Eye Moody, a gruff but fair Auror training instructor in a Harry Potter detective game.

== YOUR ROLE ==
Teach critical thinking through harsh mentorship. You're blunt, no-nonsense, impatient with excuses.

== TODAY'S TEACHING CONCEPT ==
**{teaching_concept['title']}**
{teaching_concept['lesson']}

== THE CASE ==
{case_context['title']}: {case_context['description']}

Why this matters: {teaching_concept['relevance_to_case']}

== DIALOGUE RULES ==
1. Speak as Moody (first person)
2. Keep response to 2-3 sentences max
3. Teach through example, not lecture
4. Connect lesson to the case at hand
5. Be direct and occasionally sarcastic
6. NEVER explain your teaching - just teach
7. If player asks unclear question, ask for clarification

== OUTPUT ==
Brief Moody dialogue (2-3 sentences, no meta-commentary):"""

# Usage in endpoint
async def generate_briefing_dialogue(case_id: str, payload: DialogueRequest):
    case = load_case_yaml(case_id)
    teaching = case["briefing"]["teaching_concepts"][payload.concept_id]

    system = build_moody_system_prompt(teaching, case)

    message = await client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=150,
        system=system,
        messages=[{"role": "user", "content": payload.playerInput}]
    )

    return message.content[0].text
```

**Key Pattern**: Dynamic system prompts allow one Moody endpoint to teach any concept. Fallback: if Claude fails, use template responses.

**Source**: Claude API docs + existing Moody mentor patterns

---

### 16. Case Briefing YAML Schema (Nested Structure Pattern)

```yaml
cases:
  case_001:
    id: "case_001"
    title: "The Vanishing Wand"
    description: "Gideon Crump's wand vanished from a locked chest in Diagon Alley."

    briefing:
      duration_minutes: 5

      teaching_concepts:
        - id: "confirmation_bias"
          title: "Confirmation Bias"
          lesson: |
            You see what you expect to see. That's a rookie mistake.
            A witness remembers details that fit their belief about what happened.
            Question every 'obvious' fact.
          relevance_to_case: "Witnesses will claim they saw the suspect. But did they really?"

          # Teaching variants for difficulty adaptation
          variants:
            - difficulty: "novice"
              example: "Most first-year Aurors blame the obvious suspect."
              duration_seconds: 4
            - difficulty: "expert"
              example: "Even experienced Aurors see what they expect. Crump had enemies among staff too."
              duration_seconds: 6

        - id: "burden_of_proof"
          title: "Burden of Proof"
          lesson: "Suspicion is not evidence. Find proof."
          relevance_to_case: "You must prove WHO took the wand and HOW."

      flow:
        1_assignment:
          speaker: "moody"
          type: "static"  # No Claude needed
          text_template: "You have a new case, recruit. {case.title}. Here's what we know: {case.description}"
          duration_seconds: 4

        2_teaching:
          speaker: "moody"
          type: "dynamic"  # Generated via Claude
          teaching_concept_id: "confirmation_bias"
          player_can_ask_questions: true
          question_timeout_seconds: 30

        3_transition:
          speaker: "moody"
          type: "static"
          text: "Now get to work. Question everything. Constant vigilance."
          duration_seconds: 3

      skip_options:
        - step_id: "2_teaching"
          text: "Skip lesson"
          requires_confirmation: true  # Warn player: "You might miss important insights"
          available_after_seconds: 5

    # Investigation-phase references
    case_data:
      location: "Diagon Alley"
      victim_name: "Gideon Crump"
      crime_type: "theft"
```

**Yamale Schema Validation** (`cases.yaml.schema`):
```yaml
cases: map(key(), include('case_schema'))

---
case_schema:
  id: str()
  title: str()
  description: str()
  briefing: include('briefing_schema')
  case_data: map()

briefing_schema:
  duration_minutes: int()
  teaching_concepts: list(include('teaching_concept'))
  flow: map()
  skip_options: list(include('skip_option'))

teaching_concept:
  id: str()
  title: str()
  lesson: str()
  relevance_to_case: str()
  variants: list(include('variant'))

variant:
  difficulty: enum('novice', 'intermediate', 'expert')
  example: str()
  duration_seconds: int()

skip_option:
  step_id: str()
  text: str()
  requires_confirmation: bool()
  available_after_seconds: int()
```

**Key Pattern**: Nested teaching_concepts with variants for difficulty adaptation. Dynamic flow steps marked `type: "dynamic"` (Claude-generated). Static steps use templates.

**Source**: Existing case YAML patterns + YAML best practices

---

### 17. React Testing Library: Multi-Step Dialogue Testing

```typescript
// BriefingFlow.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import BriefingFlow from './BriefingFlow'

describe('BriefingFlow', () => {
  it('completes full briefing flow with skip', async () => {
    const user = userEvent.setup()
    render(<BriefingFlow caseId="case_001" playerId="player123" />)

    // Step 1: Wait for case assignment (static, no API call)
    expect(await screen.findByText(/vanishing wand/i)).toBeInTheDocument()

    // Step 2: Moody's teaching moment (async Claude call)
    expect(await screen.findByText(/confirmation bias/i)).toBeInTheDocument()

    // Player skips after 5 seconds
    await new Promise(r => setTimeout(r, 5000))
    const skipButton = screen.getByRole('button', {name: /skip/i})
    expect(skipButton).not.toBeDisabled()
    await user.click(skipButton)

    // Step 3: Transition (static)
    expect(await screen.findByText(/constant vigilance/i)).toBeInTheDocument()

    // Complete briefing
    const startButton = screen.getByRole('button', {name: /start investigation/i})
    await user.click(startButton)

    // Verify briefing saved
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('allows player to ask clarifying questions', async () => {
    const user = userEvent.setup()
    render(<BriefingFlow caseId="case_001" playerId="player123" />)

    // Wait for teaching moment
    await screen.findByText(/confirmation bias/i)

    // Player asks question
    const questionInput = screen.getByPlaceholderText(/ask.*question/i)
    await user.type(questionInput, 'Can you give an example?')
    await user.click(screen.getByRole('button', {name: /ask/i}))

    // Wait for Moody's response (async Claude call)
    expect(await screen.findByText(/example/i)).toBeInTheDocument()
  })

  it('disables buttons during Claude API call', async () => {
    const user = userEvent.setup()
    render(<BriefingFlow caseId="case_001" playerId="player123" />)

    await screen.findByText(/confirmation bias/i)

    const questionInput = screen.getByPlaceholderText(/ask.*question/i)
    await user.type(questionInput, 'Tell me more')

    const askButton = screen.getByRole('button', {name: /ask/i})
    await user.click(askButton)

    // While Claude is responding, button should be disabled
    expect(askButton).toBeDisabled()

    // After response, button should be enabled again
    await screen.findByText(/moody response/)
    expect(askButton).not.toBeDisabled()
  })

  it('skips only allowed after minimum duration', async () => {
    const user = userEvent.setup()
    render(<BriefingFlow caseId="case_001" playerId="player123" />)

    await screen.findByText(/confirmation bias/i)

    // Skip button should be disabled immediately
    const skipButton = screen.getByRole('button', {name: /skip/i})
    expect(skipButton).toBeDisabled()

    // After 5 seconds, skip becomes enabled
    await new Promise(r => setTimeout(r, 5000))
    expect(skipButton).not.toBeDisabled()
  })
})
```

**Key Pattern**: Use `userEvent.setup()` + `await screen.findBy*()` for async dialogue. Test three flows: (1) happy path with skip, (2) ask questions, (3) disabled states during API calls.

**Source**: Context7 `/websites/testing-library` + React Testing Library patterns

---

**Total**: 550+ lines | **Focus**: 17 critical patterns covering frontend (React), backend (FastAPI), LLM (Claude), testing (RTL), and data (YAML)
**Details**: See DOCS_RESEARCH.md for comprehensive resource list, implementation guides, and performance considerations
