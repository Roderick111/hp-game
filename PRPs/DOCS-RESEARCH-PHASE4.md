# Documentation Research: Phase 4 - Tom's Inner Voice System
**Date**: 2026-01-08
**Phase**: Phase 4 - Tom's Ghost (50% Helpful / 50% Misleading Inner Voice)
**Docs Found**: 3 critical libraries + React Context

---

## 1. react-hot-toast (Toast Notifications)

**URL**: https://react-hot-toast.com/docs
**Type**: Official Documentation
**Relevance**: Primary library for Tom's ghost voice messages. Needed for dark theme toast display, positioning (top-right during investigation), auto-dismiss timing, and stacking multiple messages.

### Key Patterns Extracted

#### Pattern 1: Basic Toast Setup with Dark Theme
```typescript
import toast, { Toaster } from 'react-hot-toast';

// Global dark theme configuration
export function InvestigationApp() {
  return (
    <>
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a2e',  // Dark terminal background
            color: '#ffffff',
            border: '1px solid #2d3561',
            borderRadius: '4px',
            fontFamily: 'monospace',
          },
          success: {
            style: { background: '#1a3a1a' },
            iconTheme: { primary: '#4ade80', secondary: '#1a3a1a' },
          },
          error: {
            style: { background: '#3a1a1a' },
            iconTheme: { primary: '#f87171', secondary: '#3a1a1a' },
          },
        }}
      />
      <YourComponents />
    </>
  );
}
```
**Usage**: Wrap app root with `<Toaster>` once. Set dark theme via `toastOptions.style` (applies globally). Use `gutter` to control vertical spacing between stacked messages.
**Gotcha**: Position "top-right" during investigation to avoid covering evidence board or verdict submission UI.

#### Pattern 2: Custom Toast Component for Tom's Voice
```typescript
// Styled toast for Tom's character
const tomVoiceToast = (message: string, type: 'helpful' | 'misleading') => {
  const colors = {
    helpful: { bg: '#1a3a1a', border: '#4ade80', icon: '?' },
    misleading: { bg: '#3a1a2e', border: '#f59e0b', icon: '!' },
  };

  const style = colors[type];

  toast.custom((t) => (
    <div
      className={`
        p-4 rounded text-white font-mono text-sm
        border-l-4 opacity-95
      `}
      style={{
        background: style.bg,
        borderLeftColor: style.border,
      }}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg font-bold">{style.icon}</span>
        <div>
          <strong>Tom's Voice:</strong>
          <p className="mt-1">{message}</p>
        </div>
      </div>
    </div>
  ), { duration: 5000 });
};

// Usage:
tomVoiceToast("What would need to be true for that theory to work?", 'helpful');
tomVoiceToast("Three witnesses agree—that's strong corroboration.", 'misleading');
```
**Usage**: Create `toast.custom()` component for full control over Tom's styling. `duration: 5000` allows time for player to read (5 seconds).
**Gotcha**: Don't override `toastOptions.duration` per-toast; it won't work. Use `duration` option in `toast()` call or `toast.custom(component, { duration })`.

#### Pattern 3: Managing Toast Stack & Positioning
```typescript
// Override positioning with containerStyle for non-standard layouts
<Toaster
  position="top-right"
  gutter={16}  // 16px between stacked toasts
  containerStyle={{
    top: 20,
    right: 20,
  }}
  toastOptions={{
    duration: 4000,
    // Use this to adjust message visibility area
  }}
/>

// Optional: Use Toaster without Portal for custom positioning
// (advanced use case if you need absolute positioning relative to element)
```
**Usage**: Adjust `gutter` (vertical spacing) based on expected number of stacked Tom messages (2-3 typically). Use `containerStyle` to avoid covering important UI.
**Gotcha**: `position` must be one of: `top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right`.

---

## 2. Pydantic v2 (Backend Voice Triggers)

**URL**: https://docs.pydantic.dev/latest/concepts/validators/
**Type**: Official Documentation
**Relevance**: Critical for modeling TierTrigger structure (three tiers based on evidence count), validating trigger conditions (evidence_count >= 6), preventing duplicate fires, and handling 50/50 helpful/misleading split.

### Key Patterns Extracted

#### Pattern 1: Nested Models for Voice Trigger Structure
```python
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum
from typing import Literal

class TriggerType(str, Enum):
    HELPFUL = "helpful"
    MISLEADING = "misleading"

class VoiceTrigger(BaseModel):
    """Individual Tom's voice message"""
    id: str = Field(..., description="Unique trigger ID")
    condition: str = Field(..., description="e.g., 'evidence_count >= 1'")
    type: TriggerType
    text: str = Field(..., description="Tom's actual message")
    fired: bool = False  # Track if already used
    rarity: Literal["common", "rare"] = "common"  # ~5% rare triggers

    model_config = ConfigDict(
        validate_assignment=True,  # Allow post-init validation
        use_enum_values=True,
    )

class TierTriggers(BaseModel):
    """Voice triggers grouped by evidence tier"""
    tier_1: list[VoiceTrigger] = Field(default_factory=list)  # 0-2 evidence
    tier_2: list[VoiceTrigger] = Field(default_factory=list)  # 3-5 evidence
    tier_3: list[VoiceTrigger] = Field(default_factory=list)  # 6+ evidence

class InnerVoiceState(BaseModel):
    """Global inner voice system state"""
    triggers: TierTriggers
    evidence_count: int = 0
    last_fired_id: str | None = None

    model_config = ConfigDict(
        populate_by_name=True,  # Allow both snake_case and camelCase
    )
```
**Usage**: Load `TierTriggers` from YAML file, validate structure with Pydantic. `fired: bool` prevents repeats. `rarity` field gates rare emotional moments.
**Gotcha**: Ensure YAML trigger `id` values are unique—Pydantic won't validate this automatically. Add a custom validator if needed.

#### Pattern 2: Custom Validators for Condition Parsing
```python
from pydantic import field_validator, model_validator
import re

class VoiceTrigger(BaseModel):
    id: str
    condition: str  # e.g., "evidence_count >= 6"
    type: TriggerType
    text: str
    fired: bool = False

    @field_validator('condition')
    @classmethod
    def validate_condition(cls, v: str) -> str:
        """Ensure condition is valid expression format"""
        # Simple regex check: "field operator value"
        pattern = r'^(\w+)\s*(==|!=|>=|<=|>|<)\s*(\d+)$'
        if not re.match(pattern, v):
            raise ValueError(
                f"Invalid condition format: '{v}'. "
                "Use: 'evidence_count >= 6' (field operator value)"
            )
        return v

class InnerVoiceState(BaseModel):
    """State with validation"""
    triggers: TierTriggers
    evidence_count: int = 0
    last_fired_id: str | None = None

    @model_validator(mode='after')
    def validate_trigger_uniqueness(self) -> 'InnerVoiceState':
        """Ensure all trigger IDs are unique across tiers"""
        all_triggers = (
            self.triggers.tier_1 +
            self.triggers.tier_2 +
            self.triggers.tier_3
        )
        ids = [t.id for t in all_triggers]
        if len(ids) != len(set(ids)):
            raise ValueError("Duplicate trigger IDs found")
        return self
```
**Usage**: Use `@field_validator` for simple field rules (condition syntax). Use `@model_validator(mode='after')` for cross-field validation (uniqueness).
**Gotcha**: Validators run in order they're defined. Place dependent validators after their dependencies.

#### Pattern 3: ConfigDict Patterns for Flexible Input
```python
class InnerVoiceState(BaseModel):
    """Flexible model for YAML + JSON loading"""
    triggers: TierTriggers
    evidence_count: int = 0
    last_fired_id: str | None = None
    fired_trigger_ids: set[str] = Field(default_factory=set)

    model_config = ConfigDict(
        # Allow loading from both camelCase (frontend) and snake_case (backend)
        populate_by_name=True,

        # Ignore extra fields (future-proof for schema changes)
        extra='ignore',

        # Immutable after creation (prevents accidental state corruption)
        frozen=False,  # Keep mutable for dispatch updates

        # Use enum values in serialization
        use_enum_values=True,

        # Validate assignments to ensure consistency
        validate_assignment=True,
    )

    def mark_fired(self, trigger_id: str) -> None:
        """Mark trigger as fired (no repeats)"""
        if trigger_id not in self.fired_trigger_ids:
            self.fired_trigger_ids.add(trigger_id)
```
**Usage**: `populate_by_name=True` allows JSON from frontend to use either naming convention. `validate_assignment=True` ensures state remains valid after mutations.
**Gotcha**: Setting `frozen=True` prevents all mutations—use only if state is truly immutable. For dispatch pattern, keep mutable.

---

## 3. React State Management (useReducer + Context)

**URL**: https://react.dev/reference/react/useReducer
**Type**: Official React Documentation
**Relevance**: Manage complex voice system state: which triggers have fired, current tier, evidence count changes, and coordinate between investigation (evidence discovery) and inner voice display.

### Key Patterns Extracted

#### Pattern 1: useReducer Pattern for Voice Trigger Dispatch
```typescript
import { useReducer, useCallback } from 'react';

// State shape
interface InnerVoiceState {
  evidenceCount: number;
  firedTriggerIds: Set<string>;
  lastFiredId: string | null;
  currentTier: 1 | 2 | 3;
}

// Action types
type InnerVoiceAction =
  | { type: 'EVIDENCE_DISCOVERED' }  // increment evidence_count
  | { type: 'TRIGGER_FIRED'; payload: string }  // mark trigger ID as fired
  | { type: 'RESET_STATE' };  // for case restart

// Reducer function
function innerVoiceReducer(
  state: InnerVoiceState,
  action: InnerVoiceAction
): InnerVoiceState {
  switch (action.type) {
    case 'EVIDENCE_DISCOVERED': {
      const newCount = state.evidenceCount + 1;
      return {
        ...state,
        evidenceCount: newCount,
        currentTier: calculateTier(newCount),
      };
    }
    case 'TRIGGER_FIRED': {
      const newFired = new Set(state.firedTriggerIds);
      newFired.add(action.payload);
      return {
        ...state,
        firedTriggerIds: newFired,
        lastFiredId: action.payload,
      };
    }
    case 'RESET_STATE': {
      return {
        evidenceCount: 0,
        firedTriggerIds: new Set(),
        lastFiredId: null,
        currentTier: 1,
      };
    }
  }
}

function calculateTier(count: number): 1 | 2 | 3 {
  if (count >= 6) return 3;
  if (count >= 3) return 2;
  return 1;
}

// Hook usage in component
function useInnerVoice() {
  const [state, dispatch] = useReducer(innerVoiceReducer, {
    evidenceCount: 0,
    firedTriggerIds: new Set(),
    lastFiredId: null,
    currentTier: 1,
  });

  const onEvidenceDiscovered = useCallback(() => {
    dispatch({ type: 'EVIDENCE_DISCOVERED' });
  }, []);

  const onTriggerFired = useCallback((triggerId: string) => {
    dispatch({ type: 'TRIGGER_FIRED', payload: triggerId });
  }, []);

  const onReset = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  return { state, onEvidenceDiscovered, onTriggerFired, onReset };
}
```
**Usage**: Call `useInnerVoice()` in investigation component. When evidence discovered, call `onEvidenceDiscovered()`. When Tom speaks, call `onTriggerFired(id)` to track.
**Gotcha**: Use `new Set()` for fired trigger tracking (fast O(1) lookup). Don't mutate state—always return new objects.

#### Pattern 2: React Context for Global Inner Voice Access
```typescript
import { createContext, useContext, ReactNode } from 'react';

// Create context
interface InnerVoiceContextType {
  state: InnerVoiceState;
  dispatch: (action: InnerVoiceAction) => void;
  selectRandomTrigger: (tierTriggers: VoiceTrigger[]) => VoiceTrigger | null;
}

const InnerVoiceContext = createContext<InnerVoiceContextType | undefined>(undefined);

// Provider component
export function InnerVoiceProvider({ children }: { children: ReactNode }) {
  const { state, dispatch } = useReducer(innerVoiceReducer, initialState);

  // Selection logic: highest tier first, random within tier, no repeats
  const selectRandomTrigger = useCallback(
    (tierTriggers: VoiceTrigger[]): VoiceTrigger | null => {
      const available = tierTriggers.filter(
        (t) => !state.firedTriggerIds.has(t.id)
      );
      if (available.length === 0) return null;

      const randomIndex = Math.floor(Math.random() * available.length);
      return available[randomIndex];
    },
    [state.firedTriggerIds]
  );

  const value = { state, dispatch, selectRandomTrigger };

  return (
    <InnerVoiceContext.Provider value={value}>
      {children}
    </InnerVoiceContext.Provider>
  );
}

// Custom hook to access context
export function useInnerVoice() {
  const context = useContext(InnerVoiceContext);
  if (!context) {
    throw new Error('useInnerVoice must be used within InnerVoiceProvider');
  }
  return context;
}
```
**Usage**: Wrap app with `<InnerVoiceProvider>` at high level (above Investigation component). Any component can call `useInnerVoice()` to access state and trigger selection logic.
**Gotcha**: Context re-renders all subscribers when value changes. Wrap callbacks with `useCallback` to avoid unnecessary re-renders (see Pattern 1).

#### Pattern 3: Custom Hook for Tom's Voice Display Logic
```typescript
import { useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';

export function useTomVoice() {
  const { state, selectRandomTrigger } = useInnerVoice();
  const [allTriggers, setAllTriggers] = useState<TierTriggers | null>(null);

  // Load triggers from backend on mount
  useEffect(() => {
    async function loadTriggers() {
      const response = await fetch('/api/inner-voice/triggers');
      const data = await response.json();
      setAllTriggers(data);
    }
    loadTriggers();
  }, []);

  const displayTomVoice = useCallback(
    async (evidenceCount: number) => {
      if (!allTriggers) return;

      // Determine tier based on evidence count
      let tier: VoiceTrigger[] = [];
      if (evidenceCount >= 6) {
        tier = allTriggers.tier_3;
      } else if (evidenceCount >= 3) {
        tier = allTriggers.tier_2;
      } else {
        tier = allTriggers.tier_1;
      }

      // Select random trigger from tier (avoiding fired triggers)
      const trigger = selectRandomTrigger(tier);
      if (!trigger) {
        console.log('No more triggers available in this tier');
        return;
      }

      // Display as toast
      tomVoiceToast(trigger.text, trigger.type);

      // Mark as fired in backend
      await fetch('/api/inner-voice/fire-trigger', {
        method: 'POST',
        body: JSON.stringify({ triggerId: trigger.id }),
      });
    },
    [allTriggers, selectRandomTrigger]
  );

  return { displayTomVoice, state };
}
```
**Usage**: Call `displayTomVoice(evidenceCount)` when investigation discovers new evidence. Hook handles tier selection, random pick, and backend sync.
**Gotcha**: Fetch triggers on mount, not on every render. Use dependency array `[]` to run once. Keep async call simple—don't block on response for immediate toast.

---

## 4. Pydantic Models Documentation (Nested Reference)

**URL**: https://docs.pydantic.dev/latest/concepts/models/
**Type**: Official Documentation
**Relevance**: Ensure proper YAML loading of trigger structures into Python models. ConfigDict patterns for flexible field naming (camelCase from frontend → snake_case in Python).

### Key Pattern: Loading YAML Nested Models
```python
import yaml
from pathlib import Path

# Load YAML case file with voice triggers
case_yaml = Path('cases/case_001.yaml').read_text()
case_data = yaml.safe_load(case_yaml)

# Validate and convert nested YAML to Pydantic models
try:
    voice_triggers = TierTriggers(**case_data['voice_triggers'])
except ValidationError as e:
    print(f"Invalid voice triggers structure: {e}")

# Now you have fully typed, validated nested models
# tier_1, tier_2, tier_3 are lists of VoiceTrigger instances
print(voice_triggers.tier_3[0].text)  # Type-safe access
```
**Usage**: Load YAML, pass dict to Pydantic model constructor. Pydantic auto-validates nested structure.
**Gotcha**: YAML keys must match Python field names exactly (or use `populate_by_name=True` for alternate names).

---

## Context7 Queries (If Used Later)

None needed—all documentation accessed directly from official sources.

---

## Summary

**Total Patterns**: 11 key patterns across 3 libraries
**Confidence**: HIGH - All from official documentation
**Coverage**:
- ✅ Toast notifications (dark theme, positioning, stacking)
- ✅ Pydantic nested models (TierTrigger structure, validation)
- ✅ React state management (useReducer, Context, custom hooks)
- ✅ YAML loading (ConfigDict flexibility)
- ❌ Gaps: YAML parsing internals (use PyYAML docs if needed), advanced Pydantic validators (covered basics)

---

## Implementation Checklist

1. **Backend (Pydantic)**
   - [ ] Create VoiceTrigger, TierTriggers, InnerVoiceState models
   - [ ] Add validators for condition syntax and trigger uniqueness
   - [ ] Load triggers from case YAML files
   - [ ] Implement trigger selection logic (tier → random → fired)

2. **Frontend (React)**
   - [ ] Install react-hot-toast: `bun add react-hot-toast`
   - [ ] Wrap app with `<Toaster>` (dark theme config)
   - [ ] Create InnerVoiceProvider (useReducer + Context)
   - [ ] Create useTomVoice() custom hook
   - [ ] Create tomVoiceToast() component function

3. **Integration**
   - [ ] Sync evidence discovery → increment evidence_count in reducer
   - [ ] Connect trigger firing → backend API call to mark fired
   - [ ] Test 50/50 helpful/misleading distribution
   - [ ] Verify no trigger repeats during single case

---

**KISS Principle Applied**: Only critical patterns extracted (2-5 per library), max 500 lines, well-structured and actionable.

Sources:
- [react-hot-toast Official Documentation](https://react-hot-toast.com/docs)
- [react-hot-toast Styling Guide](https://react-hot-toast.com/docs/styling)
- [Pydantic Validators Documentation](https://docs.pydantic.dev/latest/concepts/validators/)
- [Pydantic Models Documentation](https://docs.pydantic.dev/latest/concepts/models/)
- [React useReducer Hook Reference](https://react.dev/reference/react/useReducer)
- [React useContext Hook Reference](https://react.dev/reference/react/useContext)
