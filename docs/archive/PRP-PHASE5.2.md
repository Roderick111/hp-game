# PRP: Phase 5.2 - Location Management System

**Date**: 2026-01-12
**Status**: Ready for Implementation
**Confidence**: 9/10
**Estimated Effort**: 2-3 days

---

## Overview

Add multi-location navigation to the investigation system. Players will navigate between 3 locations (library, dormitory, great_hall) via:
1. **Clickable LocationSelector** - Right-side panel with location buttons (similar to EvidenceBoard/WitnessSelector)
2. **Natural language** - "go to dormitory", "visit library", etc. detected in freeform input

**End State**: Players freely navigate locations. Evidence/witness states preserved globally. Narrator conversation history cleared per location (fresh descriptions each time).

---

## Why

### User Impact
- **Spatial depth**: Crimes span multiple locations (library, dormitory, great hall)
- **Discovery mechanic**: Evidence scattered across locations requires exploration
- **Investigation authenticity**: Real detectives visit multiple crime scene locations

### Business Value
- **Scalability**: Foundation for Cases 2-10 with 4+ locations per case
- **Replayability**: Multi-location cases increase complexity and replay value
- **Genre alignment**: Matches visual novel/adventure game conventions

### Integration
- **Builds on**: Phase 5.1 (Menu System complete with keyboard shortcuts)
- **Enables**: Phase 5.3 (Save/Load with location tracking)
- **Complements**: Phase 2 (Witness system with per-location availability)

### Alignment
- **PLANNING.md (lines 994-1015)**: Flat location graph (any → any), no unlocking, hybrid navigation
- **Game Design**: DnD-style freeform exploration across modular investigation spaces
- **KISS Principle**: Simple clickable selector + natural language (no complex routing)

---

## What

### User-Visible Behavior

**Initial State**:
- Player starts in "Hogwarts Library - Crime Scene" (default location)
- Right panel shows LocationSelector with 3 locations:
  - Library (highlighted as current)
  - Dormitory
  - Great Hall

**Location Change (Clickable)**:
1. Player clicks "Dormitory" in LocationSelector
2. Screen briefly updates (narrator area clears)
3. New location description appears: "You're in the warm stone dormitory common room..."
4. Narrator history is empty (fresh context)
5. Evidence Board shows same evidence (globally preserved)
6. WitnessSelector shows Ron (dormitory-specific witness)

**Location Change (Natural Language)**:
1. Player types "go to the great hall"
2. System detects location command
3. Location changes (same flow as clickable)
4. Narrator responds: "You travel to the Great Hall. The vast space stretches before you..."

**State Preservation**:
- **Preserved**: Discovered evidence (globally accessible)
- **Preserved**: Witness trust levels (Legilimency in library affects Hermione everywhere)
- **Preserved**: Visited locations list (tracks investigation history)
- **Cleared**: Narrator conversation history (fresh descriptions per location)
- **Updated**: Current location (reflects player position)

---

### Technical Requirements

#### Backend

**Endpoints**:
- `POST /api/change-location` - Change location, clear narrator history, return location data
- `GET /api/case/{case_id}/locations` - List all locations for LocationSelector (new)
- `GET /api/case/{case_id}/location/{location_id}` - Get location metadata (existing, reuse)

**State Management**:
- `PlayerState.visit_location(location_id)` - Update current location, track visited
- `PlayerState.clear_narrator_conversation()` - Clear narrator history on location change
- Evidence/witness states untouched (global persistence)

**YAML Extension**:
- Add `dormitory` and `great_hall` sections to `case_001.yaml`
- Each location has: description, surface_elements, witnesses_present, hidden_evidence, not_present

**Natural Language Detection** (backend):
- `LocationCommandParser` class - Detect "go to X", "visit X", "head to X" in player input
- Fuzzy matching against known location names
- Integration in investigate endpoint (detect before narrator call)

#### Frontend

**Components**:
- `LocationSelector.tsx` (NEW) - Right-side panel component
  - Shows all locations from case
  - Highlights current location (amber bg)
  - Keyboard shortcuts (1-3 for quick switching)
- `LocationView.tsx` (MODIFY) - Add natural language detection

**Hooks**:
- `useLocation.ts` (NEW) - Manage location state
  - Load locations on mount
  - Handle location changes (call API)
  - Return current location, list, loading state

**API Client**:
- `getLocations(caseId)` - Fetch location list for selector
- `changeLocation(caseId, locationId)` - Change location endpoint call

**App Integration**:
- Add LocationSelector to right panel (above EvidenceBoard)
- Pass `currentLocationId` to LocationView (dynamic, not hardcoded)
- Location change triggers useInvestigation reload

---

### Success Criteria

#### Core Functionality
- [ ] LocationSelector component displays 3 locations (library, dormitory, great_hall)
- [ ] Clicking location changes location (POST /api/change-location)
- [ ] Current location highlighted with amber background + "HERE" indicator
- [ ] Natural language detection: "go to dormitory" changes location
- [ ] Narrator conversation history cleared per location (fresh descriptions)
- [ ] Evidence Board unchanged after location change (global state preserved)
- [ ] Witness trust preserved across locations

#### Backend
- [ ] POST /api/change-location endpoint validates location, updates state
- [ ] GET /api/case/{case_id}/locations returns [{"id": "library", "name": "...", "type": "micro"}]
- [ ] PlayerState.visit_location() updates current_location + visited_locations
- [ ] PlayerState.clear_narrator_conversation() clears narrator_conversation_history
- [ ] case_001.yaml has 3 complete locations (description, evidence, witnesses)
- [ ] LocationCommandParser detects "go to X", "visit X", "head to X" patterns

#### Frontend
- [ ] LocationSelector styled with terminal theme (gray-900 bg, amber text)
- [ ] Hover states on unselected locations (gray-700 hover)
- [ ] Keyboard shortcuts: 1 (library), 2 (dormitory), 3 (great hall)
- [ ] useLocation hook loads locations, manages current location state
- [ ] Natural language detection in LocationView before narrator call
- [ ] Location change clears narrator output area

#### Integration
- [ ] Evidence discovered in library visible in dormitory
- [ ] Witness interrogated in library has same trust in great hall
- [ ] Visited locations tracked (could show "NEW" badge on unvisited)
- [ ] Spell usage reset per location (location-specific context)

#### Quality
- [ ] All existing tests pass (638 backend, 466 frontend)
- [ ] No regressions in Phase 1-5.1 features
- [ ] Dark theme consistent across LocationSelector
- [ ] Accessibility: aria-labels on location buttons, keyboard navigation

---

## Context & References

### Project Documentation

**From PLANNING.md (lines 994-1015)**:
- **Navigation UX**: Hybrid (clickable selector + natural language)
- **Location Graph**: Flat (any → any) - no connection restrictions
- **UI Placement**: Right side panel with Evidence Board / Witness Selector
- **Scope**: 3 locations for Case 1 (library, dormitory, great_hall)
- **Unlocking**: All locations accessible from start (no gating)

**From Game Design Philosophy**:
- **DnD-style exploration**: Freeform input, player-driven navigation
- **Location granularity**: Micro-locations (single room scenes, not large buildings)
- **State layering**: Global state (evidence, witnesses) vs per-location state (narrator history, spell counts)

**From STATUS.md**:
- Phase 5.1 complete: Menu system (ESC toggle, keyboard shortcuts 1-7)
- 1104 tests passing (638 backend, 466 frontend)
- Radix UI, TanStack Query, Tailwind patterns established

### Research Sources

**GitHub Research (GITHUB-RESEARCH-PHASE5.2.md)**:
- **Primary Pattern**: Ren'Py LocationScene (entry/exit hooks, state layers)
- **State Management**: Phaser-style global vs per-location state separation
- **UI Pattern**: Radix Tabs for accessible panel switching
- **Navigation**: React Router location.state for state preservation

**Codebase Research (CODEBASE_RESEARCH-phase5.2.md)**:
- **Backend**: PlayerState.visit_location() + clear_narrator_conversation() (existing methods, lines 297-445)
- **Frontend**: EvidenceBoard pattern (right panel structure, lines 1-141)
- **API**: GET /api/case/{case_id}/location/{location_id} (existing, lines 801-826)
- **YAML**: case_001.yaml locations structure (single location exists, extend to 3)

**Docs Research (DOCS-RESEARCH-PHASE5.2.md)**:
- **React 18**: useState for selection, conditional CSS, map with keys
- **FastAPI**: POST endpoint with Pydantic validation, auto 422 errors
- **Tailwind CSS**: Dark theme (bg-gray-900, text-amber-400), hover states, focus rings
- **MDN Regex**: Natural language detection patterns (go to X, visit X)

**Alignment Notes**:
- ✅ Research aligns with PLANNING.md flat graph, hybrid navigation
- ✅ Codebase patterns proven (638 backend tests passing)
- ✅ GitHub patterns from production repos (React Router 56k⭐, Ren'Py 6k⭐)
- ✅ No architectural conflicts with existing Phase 1-5.1 systems

---

## Quick Reference (Pre-Digested Context)

### Essential API Signatures

#### Backend: Location Change Endpoint
```python
# backend/src/api/routes.py (NEW)
from pydantic import BaseModel, Field

class ChangeLocationRequest(BaseModel):
    case_id: str
    location_id: str = Field(..., min_length=1)
    player_id: str = "default"

@router.post("/api/change-location")
async def change_location(request: ChangeLocationRequest) -> dict[str, Any]:
    """Change player location, clear narrator history."""

    # Load case + validate location
    try:
        case_data = load_case(request.case_id)
        location = get_location(case_data, request.location_id)  # Raises KeyError if invalid
    except FileNotFoundError:
        raise HTTPException(404, f"Case not found: {request.case_id}")
    except KeyError:
        raise HTTPException(404, f"Location not found: {request.location_id}")

    # Load/create player state
    state = load_state(request.case_id, request.player_id)
    if state is None:
        state = PlayerState(case_id=request.case_id, current_location=request.location_id)

    # Change location + clear narrator history
    state.visit_location(request.location_id)
    state.clear_narrator_conversation()
    save_state(state, request.player_id)

    return {
        "success": True,
        "location": {
            "id": location.get("id"),
            "name": location.get("name"),
            "description": location.get("description"),
        },
    }
```

#### Backend: List Locations Endpoint
```python
# backend/src/api/routes.py (NEW)
@router.get("/api/case/{case_id}/locations")
async def get_locations(case_id: str) -> list[dict[str, str]]:
    """Get all locations for LocationSelector."""
    try:
        case_data = load_case(case_id)
    except FileNotFoundError:
        raise HTTPException(404, f"Case not found: {case_id}")

    case = case_data.get("case", case_data)
    locations = case.get("locations", {})

    return [
        {
            "id": loc.get("id", loc_id),
            "name": loc.get("name", "Unknown"),
            "type": loc.get("type", "micro"),
        }
        for loc_id, loc in locations.items()
    ]
```

#### Frontend: LocationSelector Component
```tsx
// frontend/src/components/LocationSelector.tsx (NEW)
import { useMemo } from 'react';
import { Card } from '@/components/ui/card';

interface LocationInfo {
  id: string;
  name: string;
  type: string;
}

interface LocationSelectorProps {
  locations: LocationInfo[];
  currentLocationId: string;
  onSelectLocation: (locationId: string) => void;
}

export function LocationSelector({
  locations,
  currentLocationId,
  onSelectLocation,
}: LocationSelectorProps) {
  return (
    <Card className="font-mono bg-gray-900 text-gray-100 border-gray-700">
      {/* Header */}
      <div className="border-b border-gray-700 pb-2 mb-3">
        <h3 className="text-xl font-bold text-yellow-400 uppercase tracking-wide">
          LOCATIONS
        </h3>
      </div>

      {/* Location List */}
      <div className="space-y-2">
        {locations.map((loc) => {
          const isSelected = currentLocationId === loc.id;
          return (
            <button
              key={loc.id}
              onClick={() => onSelectLocation(loc.id)}
              className={`
                w-full text-left p-3 rounded border transition-colors
                ${isSelected
                  ? 'bg-amber-900/30 border-amber-600 text-amber-300 font-semibold'
                  : 'bg-gray-800/50 border-gray-700 text-gray-200 hover:border-gray-500 hover:bg-gray-700'
                }
              `}
              aria-pressed={isSelected}
              aria-label={`${isSelected ? 'Current location' : 'Go to'} ${loc.name}`}
            >
              <div className="flex items-center justify-between">
                <span>{loc.name}</span>
                {isSelected && (
                  <span className="text-amber-400 text-sm font-mono">&gt; HERE</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
```

#### Frontend: useLocation Hook
```typescript
// frontend/src/hooks/useLocation.ts (NEW)
import { useState, useEffect, useCallback } from 'react';
import { getLocations, changeLocation } from '@/api/client';

interface LocationInfo {
  id: string;
  name: string;
  type: string;
}

interface UseLocationOptions {
  caseId: string;
  initialLocationId?: string;
}

interface UseLocationReturn {
  locations: LocationInfo[];
  currentLocationId: string;
  loading: boolean;
  error: string | null;
  handleLocationChange: (locationId: string) => Promise<void>;
}

export function useLocation({
  caseId,
  initialLocationId = 'library',
}: UseLocationOptions): UseLocationReturn {
  const [locations, setLocations] = useState<LocationInfo[]>([]);
  const [currentLocationId, setCurrentLocationId] = useState(initialLocationId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load locations on mount
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const locs = await getLocations(caseId);
        setLocations(locs);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load locations');
      } finally {
        setLoading(false);
      }
    };

    void loadLocations();
  }, [caseId]);

  // Handle location change
  const handleLocationChange = useCallback(
    async (locationId: string) => {
      if (locationId === currentLocationId) return; // Already there

      try {
        await changeLocation(caseId, locationId);
        setCurrentLocationId(locationId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to change location');
      }
    },
    [caseId, currentLocationId]
  );

  return {
    locations,
    currentLocationId,
    loading,
    error,
    handleLocationChange,
  };
}
```

#### Frontend: API Client Functions
```typescript
// frontend/src/api/client.ts (ADD)

export async function getLocations(caseId: string): Promise<LocationInfo[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/case/${encodeURIComponent(caseId)}/locations`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } }
    );

    if (!response.ok) throw await createApiError(response);
    return (await response.json()) as LocationInfo[];
  } catch (error) {
    if (isApiError(error)) throw error;
    throw handleFetchError(error);
  }
}

export async function changeLocation(
  caseId: string,
  locationId: string,
  playerId: string = 'default'
): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/change-location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ case_id: caseId, location_id: locationId, player_id: playerId }),
    });

    if (!response.ok) throw await createApiError(response);
    return (await response.json()) as { success: boolean };
  } catch (error) {
    if (isApiError(error)) throw error;
    throw handleFetchError(error);
  }
}
```

### Key Patterns from Research

#### Pattern 1: State Preservation (Ren'Py LocationScene)
```python
# backend/src/state/player_state.py (EXISTING, lines 297-445)
class PlayerState(BaseModel):
    current_location: str = "library"
    discovered_evidence: list[str] = Field(default_factory=list)  # GLOBAL
    visited_locations: list[str] = Field(default_factory=list)    # GLOBAL
    narrator_conversation_history: list[ConversationItem] = []    # PER-LOCATION (cleared)

    def visit_location(self, location_id: str) -> None:
        """Track location visit."""
        self.current_location = location_id
        if location_id not in self.visited_locations:
            self.visited_locations.append(location_id)
        self.updated_at = _utc_now()

    def clear_narrator_conversation(self) -> None:
        """Clear narrator history (on location change)."""
        self.narrator_conversation_history = []
        self.updated_at = _utc_now()
```

**Key Insight**: Call `visit_location()` then `clear_narrator_conversation()` in sequence. Evidence/witness state automatically preserved (not cleared).

#### Pattern 2: Natural Language Detection (MDN Regex)
```python
# backend/src/location/parser.py (NEW)
import re
from rapidfuzz import fuzz

class LocationCommandParser:
    def __init__(self, locations: list[str]):
        self.locations = locations
        self.fuzzy_threshold = 75  # 75% match required

    def parse(self, input_text: str) -> str | None:
        """Detect location change command in input."""

        # Pattern 1: Explicit "go to X" / "visit X"
        match = re.search(r'\b(go|visit|head|travel)\s+(?:to\s+)?(\w+)', input_text.lower())
        if match:
            location_name = match.group(2)
            # Fuzzy match against known locations
            for loc in self.locations:
                score = fuzz.ratio(location_name, loc.lower())
                if score >= self.fuzzy_threshold:
                    return loc

        # Pattern 2: Direct keyword match ("dormitory" in input)
        for loc in self.locations:
            if loc.lower() in input_text.lower():
                return loc

        return None
```

**Key Insight**: Two-pass detection: (1) explicit commands with fuzzy match, (2) direct keyword match as fallback.

#### Pattern 3: Right-Side Panel UI (EvidenceBoard)
```tsx
// frontend/src/components/EvidenceBoard.tsx (EXISTING, lines 1-141)
// PATTERN TO FOLLOW for LocationSelector

<Card className="font-mono bg-gray-900 text-gray-100 border-gray-700">
  {/* Header */}
  <div className="border-b border-gray-700 pb-2 mb-3">
    <h3 className="text-xl font-bold text-yellow-400 uppercase tracking-wide">
      EVIDENCE BOARD
    </h3>
  </div>

  {/* Content */}
  {evidence.length === 0 ? (
    <div className="py-6 text-center">
      <p className="text-gray-500 text-sm">No evidence discovered yet</p>
    </div>
  ) : (
    <ul className="space-y-2">
      {evidence.map((item) => (
        <li key={item.id}>
          <button onClick={() => onEvidenceClick?.(item.id)}>
            {/* Item rendering */}
          </button>
        </li>
      ))}
    </ul>
  )}
</Card>
```

**Key Insight**: Follow same Card structure, header styling, and item list pattern. Terminal dark theme (gray-900 bg, amber accents).

---

### Library-Specific Gotchas

#### React 18
**Issue**: Mutating state objects doesn't trigger re-render
**Solution**: Always use `setState(newValue)`, never mutate existing state
```typescript
// ❌ DON'T
const newLoc = currentLocation;
newLoc.id = 'dormitory';
setCurrentLocation(newLoc); // Won't trigger re-render

// ✅ DO
setCurrentLocation({ ...currentLocation, id: 'dormitory' });
```

**Issue**: Using array index as key causes re-render bugs
**Solution**: Use stable ID (`location.id`) as key, not array index
```tsx
// ❌ DON'T
{locations.map((loc, index) => <li key={index}>...</li>)}

// ✅ DO
{locations.map((loc) => <li key={loc.id}>...</li>)}
```

#### FastAPI
**Issue**: Pydantic validation returns 422 Unprocessable Entity automatically
**Solution**: Use Field() constraints, add custom validation for location existence
```python
# FastAPI auto-validates request body against Pydantic model
# Returns 422 if missing field or wrong type
# BUT: Must manually check if location_id exists in case YAML
if location_id not in case["locations"]:
    raise HTTPException(404, f"Location not found: {location_id}")
```

**Issue**: Forgetting to save state after changes
**Solution**: Always call `save_state(state, player_id)` after `visit_location()` + `clear_narrator_conversation()`
```python
state.visit_location(location_id)
state.clear_narrator_conversation()
save_state(state, player_id)  # ← CRITICAL
```

#### Tailwind CSS
**Issue**: Dark mode requires `class="dark"` on root element + config
**Solution**: Verify `darkMode: 'class'` in tailwind.config.js, add `dark:` prefix to all colors
```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',  // ← Required for dark: prefix
  // ...
};
```

**Issue**: Focus ring appears on mouse click (looks jarring)
**Solution**: Use `focus-visible:` (keyboard only), not `focus:` (both mouse + keyboard)
```tsx
// ❌ DON'T (focus ring on mouse click)
className="focus:ring-2 focus:ring-amber-400"

// ✅ DO (focus ring only on keyboard nav)
className="focus-visible:ring-2 focus-visible:ring-amber-400"
```

#### Regex (Natural Language Detection)
**Issue**: Regex matches too broadly ("goodbye" matches "go")
**Solution**: Use word boundaries `\b` to match whole words
```python
# ❌ DON'T (matches "goodbye", "goat", "cargo")
pattern = r'(go|visit)\s+(.+)'

# ✅ DO (matches only "go" as standalone word)
pattern = r'\b(go|visit)\s+(.+)'
```

**Issue**: Greedy `.+` captures too much
**Solution**: Use non-greedy `.+?` for location extraction
```python
# ❌ DON'T (greedy: "go to library and check desk" → captures "library and check desk")
pattern = r'go to (.+)'

# ✅ DO (non-greedy: captures "library")
pattern = r'go to (.+?)\s+(and|,|$)'
```

---

## Current Codebase Structure

```bash
backend/src/
├── api/
│   └── routes.py           # MODIFY - Add /api/change-location, /api/case/{id}/locations
├── state/
│   └── player_state.py     # EXISTING - visit_location(), clear_narrator_conversation()
├── case_store/
│   ├── loader.py           # EXISTING - get_location() (reuse), ADD list_locations()
│   └── case_001.yaml       # MODIFY - Add dormitory + great_hall sections
└── context/
    └── narrator.py         # EXISTING - build_narrator_prompt() (no changes needed)

frontend/src/
├── components/
│   ├── LocationSelector.tsx  # CREATE - Right panel location list
│   ├── LocationView.tsx      # MODIFY - Add natural language detection
│   ├── EvidenceBoard.tsx     # REFERENCE - Right panel pattern
│   └── WitnessSelector.tsx   # REFERENCE - Selection UI pattern
├── hooks/
│   ├── useLocation.ts        # CREATE - Location state management
│   └── useInvestigation.ts   # MODIFY - Add locationId to dependencies
├── api/
│   └── client.ts             # MODIFY - Add getLocations(), changeLocation()
└── App.tsx                   # MODIFY - Add LocationSelector, pass currentLocationId
```

---

## Desired Codebase Structure

```bash
backend/src/
├── api/
│   └── routes.py           # +2 endpoints: POST /api/change-location, GET /api/case/{id}/locations
├── location/               # NEW directory
│   └── parser.py           # CREATE - LocationCommandParser (natural language detection)
├── case_store/
│   ├── loader.py           # +1 function: list_locations()
│   └── case_001.yaml       # +2 locations: dormitory, great_hall

frontend/src/
├── components/
│   ├── LocationSelector.tsx  # CREATE - Location panel
│   └── LocationView.tsx      # MODIFY - Natural language hook
├── hooks/
│   └── useLocation.ts        # CREATE - Location management hook
├── api/
│   └── client.ts             # +2 functions: getLocations(), changeLocation()
```

**Note**: validation-gates handles test file creation. Don't list tests in structure.

---

## Files to Create/Modify

| File | Action | Purpose | Reference File |
|------|--------|---------|----------------|
| `backend/src/api/routes.py` | MODIFY | Add 2 endpoints (/change-location, /case/{id}/locations) | Existing patterns (lines 351-561, 801-826) |
| `backend/src/location/parser.py` | CREATE | Natural language detection (LocationCommandParser) | GitHub research: Ren'Py pattern |
| `backend/src/case_store/loader.py` | MODIFY | Add list_locations() function | Existing get_location() pattern (lines 43-68) |
| `backend/src/case_store/case_001.yaml` | MODIFY | Add dormitory + great_hall locations | Existing library section (lines 327-369) |
| `frontend/src/components/LocationSelector.tsx` | CREATE | Right panel location list | EvidenceBoard.tsx pattern (lines 1-141) |
| `frontend/src/hooks/useLocation.ts` | CREATE | Location state hook | useInvestigation.ts pattern (lines 105-240) |
| `frontend/src/api/client.ts` | MODIFY | Add getLocations(), changeLocation() | Existing getLocation() pattern (lines 364-390) |
| `frontend/src/App.tsx` | MODIFY | Add LocationSelector, pass currentLocationId | Existing panel layout (lines 1-300) |
| `frontend/src/hooks/useInvestigation.ts` | MODIFY | Add locationId to dependency array | Existing useEffect (line 670) |

**Note**: Test files handled by validation-gates. Don't include in table.

---

## Tasks (Ordered)

### Task 1: Backend - List Locations Function
**File**: `backend/src/case_store/loader.py`
**Action**: CREATE new function `list_locations()`
**Purpose**: Return list of location metadata for LocationSelector
**Reference**: `get_location()` function (lines 43-68)
**Pattern**: Extract location IDs, names, types from case YAML
**Depends on**: None
**Acceptance criteria**:
- [ ] `list_locations(case_data)` returns `[{"id": "library", "name": "...", "type": "micro"}]`
- [ ] Handles missing locations gracefully (return empty list)
- [ ] Backward compatible (adds witnesses_present if missing)
- [ ] Type hints: `def list_locations(case_data: dict[str, Any]) -> list[dict[str, str]]`

**Implementation**:
```python
def list_locations(case_data: dict[str, Any]) -> list[dict[str, str]]:
    """List all locations in a case."""
    case: dict[str, Any] = case_data.get("case", case_data)
    locations: dict[str, dict[str, Any]] = case.get("locations", {})

    result = []
    for location_id, location in locations.items():
        result.append({
            "id": location.get("id", location_id),
            "name": location.get("name", "Unknown"),
            "type": location.get("type", "micro"),
        })
    return result
```

---

### Task 2: Backend - Change Location Endpoint
**File**: `backend/src/api/routes.py`
**Action**: CREATE new endpoint `POST /api/change-location`
**Purpose**: Change player location, clear narrator history, return success
**Reference**: Existing `investigate()` endpoint location change logic (lines 383-389)
**Pattern**: Load case + state, validate location, call visit_location() + clear_narrator_conversation(), save state
**Depends on**: Task 1 (list_locations for validation)
**Acceptance criteria**:
- [ ] Endpoint exists at `POST /api/change-location`
- [ ] Validates case_id and location_id (404 if not found)
- [ ] Calls `state.visit_location(location_id)`
- [ ] Calls `state.clear_narrator_conversation()`
- [ ] Calls `save_state(state, player_id)`
- [ ] Returns `{"success": True, "location": {...}}`
- [ ] Error handling: 404 for invalid case/location, 500 for save errors

**Implementation**:
```python
class ChangeLocationRequest(BaseModel):
    case_id: str
    location_id: str = Field(..., min_length=1)
    player_id: str = "default"

@router.post("/api/change-location")
async def change_location(request: ChangeLocationRequest) -> dict[str, Any]:
    """Change player location, clear narrator history."""
    try:
        case_data = load_case(request.case_id)
        location = get_location(case_data, request.location_id)
    except FileNotFoundError:
        raise HTTPException(404, f"Case not found: {request.case_id}")
    except KeyError:
        raise HTTPException(404, f"Location not found: {request.location_id}")

    state = load_state(request.case_id, request.player_id)
    if state is None:
        state = PlayerState(case_id=request.case_id, current_location=request.location_id)

    state.visit_location(request.location_id)
    state.clear_narrator_conversation()
    save_state(state, request.player_id)

    return {
        "success": True,
        "location": {
            "id": location.get("id"),
            "name": location.get("name"),
            "description": location.get("description"),
        },
    }
```

---

### Task 3: Backend - Get Locations Endpoint
**File**: `backend/src/api/routes.py`
**Action**: CREATE new endpoint `GET /api/case/{case_id}/locations`
**Purpose**: Return list of all locations for LocationSelector
**Reference**: Existing `get_location_info()` endpoint (lines 801-826)
**Pattern**: Load case, call list_locations(), return JSON
**Depends on**: Task 1 (list_locations function)
**Acceptance criteria**:
- [ ] Endpoint exists at `GET /api/case/{case_id}/locations`
- [ ] Returns `[{"id": "library", "name": "Hogwarts Library", "type": "micro"}, ...]`
- [ ] 404 if case not found
- [ ] Empty list if no locations defined (not an error)

**Implementation**:
```python
@router.get("/api/case/{case_id}/locations")
async def get_locations(case_id: str) -> list[dict[str, str]]:
    """Get all locations for LocationSelector."""
    try:
        case_data = load_case(case_id)
    except FileNotFoundError:
        raise HTTPException(404, f"Case not found: {case_id}")

    return list_locations(case_data)
```

---

### Task 4: Backend - Natural Language Parser
**File**: `backend/src/location/parser.py` (NEW)
**Action**: CREATE LocationCommandParser class
**Purpose**: Detect "go to X", "visit X" commands in player input
**Reference**: GitHub research - Ren'Py pattern + MDN Regex docs
**Pattern**: Regex + fuzzy matching against known locations
**Depends on**: None (standalone utility)
**Acceptance criteria**:
- [ ] `LocationCommandParser(locations)` class exists
- [ ] `parse(input_text)` returns location ID or None
- [ ] Detects: "go to X", "visit X", "head to X", "travel to X"
- [ ] Fuzzy matches: "dormitory" matches "dorm", "dormitry"
- [ ] Returns None if no match (no false positives)
- [ ] Case-insensitive matching

**Implementation**:
```python
import re
from rapidfuzz import fuzz

class LocationCommandParser:
    def __init__(self, locations: list[str]):
        self.locations = locations
        self.fuzzy_threshold = 75  # 75% match required

    def parse(self, input_text: str) -> str | None:
        """Detect location change command."""
        # Pattern: "go to X", "visit X", etc.
        match = re.search(r'\b(go|visit|head|travel)\s+(?:to\s+)?(\w+)', input_text.lower())
        if match:
            location_name = match.group(2)
            for loc in self.locations:
                score = fuzz.ratio(location_name, loc.lower())
                if score >= self.fuzzy_threshold:
                    return loc

        # Fallback: Direct keyword match
        for loc in self.locations:
            if loc.lower() in input_text.lower():
                return loc

        return None
```

---

### Task 5: Backend - Extend case_001.yaml with 3 Locations
**File**: `backend/src/case_store/case_001.yaml`
**Action**: MODIFY - Add dormitory and great_hall sections
**Purpose**: Provide 3 complete locations for Phase 5.2
**Reference**: Existing library section (lines 327-369)
**Pattern**: Copy library structure, change description/evidence/witnesses
**Depends on**: None
**Acceptance criteria**:
- [ ] `locations` section has 3 keys: library, dormitory, great_hall
- [ ] Each location has: id, name, type, description, surface_elements, witnesses_present
- [ ] Each location has: hidden_evidence (at least 1-2 items), not_present
- [ ] Witnesses differ per location: library (hermione), dormitory (ron), great_hall (draco)
- [ ] Evidence IDs unique across locations (no duplicate IDs)

**Implementation** (dormitory example):
```yaml
dormitory:
  id: "dormitory"
  name: "Gryffindor Tower - Dormitory"
  type: "micro"
  description: |
    You climb through the portrait hole into the Gryffindor common room.
    The fire crackles softly in the stone hearth. Comfortable armchairs
    are arranged around low tables, and a staircase spirals up to the dormitories.

  surface_elements:
    - "Roaring fireplace with crackling logs"
    - "Comfortable red armchairs and sofas"
    - "Desk piled with parchment and books"

  witnesses_present: ["ron"]

  spell_contexts:
    available_spells:
      - "revelio"
      - "lumos"
      - "homenum_revelio"

  hidden_evidence:
    - id: "torn_letter"
      name: "Torn Letter"
      triggers:
        - "desk"
        - "papers"
        - "parchment"
        - "check desk"
      description: |
        Under a pile of parchments, you find a torn letter with hurried handwriting.
        Only fragments remain: "...meet me at midnight..." and "...don't tell anyone..."
      tag: "[EVIDENCE: torn_letter]"

  not_present:
    - triggers:
        - "victim"
        - "body"
      response: "The victim isn't here. You're in the Gryffindor dormitory, far from the crime scene."
```

---

### Task 6: Frontend - LocationSelector Component
**File**: `frontend/src/components/LocationSelector.tsx` (NEW)
**Action**: CREATE LocationSelector component
**Purpose**: Right-side panel with clickable location list
**Reference**: EvidenceBoard.tsx structure (lines 1-141)
**Pattern**: Card with header, list of buttons, highlight current location
**Depends on**: None (standalone component)
**Acceptance criteria**:
- [ ] Component renders with terminal theme (gray-900 bg, amber text)
- [ ] Header: "LOCATIONS" (yellow-400, uppercase, bold)
- [ ] List of location buttons (one per location)
- [ ] Current location highlighted (amber-900 bg, amber-300 text, "HERE" indicator)
- [ ] Unselected locations: gray-800 bg, hover gray-700
- [ ] onClick calls `onSelectLocation(locationId)`
- [ ] aria-pressed and aria-label for accessibility

**Implementation**:
```tsx
import { Card } from '@/components/ui/card';

interface LocationInfo {
  id: string;
  name: string;
  type: string;
}

interface LocationSelectorProps {
  locations: LocationInfo[];
  currentLocationId: string;
  onSelectLocation: (locationId: string) => void;
}

export function LocationSelector({
  locations,
  currentLocationId,
  onSelectLocation,
}: LocationSelectorProps) {
  return (
    <Card className="font-mono bg-gray-900 text-gray-100 border-gray-700">
      <div className="border-b border-gray-700 pb-2 mb-3">
        <h3 className="text-xl font-bold text-yellow-400 uppercase tracking-wide">
          LOCATIONS
        </h3>
      </div>

      <div className="space-y-2">
        {locations.map((loc) => {
          const isSelected = currentLocationId === loc.id;
          return (
            <button
              key={loc.id}
              onClick={() => onSelectLocation(loc.id)}
              className={`
                w-full text-left p-3 rounded border transition-colors
                ${isSelected
                  ? 'bg-amber-900/30 border-amber-600 text-amber-300 font-semibold'
                  : 'bg-gray-800/50 border-gray-700 text-gray-200 hover:border-gray-500 hover:bg-gray-700'
                }
              `}
              aria-pressed={isSelected}
              aria-label={`${isSelected ? 'Current location' : 'Go to'} ${loc.name}`}
            >
              <div className="flex items-center justify-between">
                <span>{loc.name}</span>
                {isSelected && (
                  <span className="text-amber-400 text-sm font-mono">&gt; HERE</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
```

---

### Task 7: Frontend - useLocation Hook
**File**: `frontend/src/hooks/useLocation.ts` (NEW)
**Action**: CREATE useLocation hook
**Purpose**: Manage location state, load locations, handle location changes
**Reference**: useInvestigation.ts pattern (lines 105-240)
**Pattern**: useState + useEffect for loading, useCallback for location change
**Depends on**: Task 3 (GET /locations endpoint), Task 2 (POST /change-location endpoint)
**Acceptance criteria**:
- [ ] Hook returns: `{ locations, currentLocationId, loading, error, handleLocationChange }`
- [ ] Loads locations on mount via getLocations(caseId)
- [ ] handleLocationChange calls changeLocation API, updates currentLocationId
- [ ] Error handling: sets error state on API failure
- [ ] Loading state during initial load

**Implementation**:
```typescript
import { useState, useEffect, useCallback } from 'react';
import { getLocations, changeLocation } from '@/api/client';

interface LocationInfo {
  id: string;
  name: string;
  type: string;
}

interface UseLocationOptions {
  caseId: string;
  initialLocationId?: string;
}

interface UseLocationReturn {
  locations: LocationInfo[];
  currentLocationId: string;
  loading: boolean;
  error: string | null;
  handleLocationChange: (locationId: string) => Promise<void>;
}

export function useLocation({
  caseId,
  initialLocationId = 'library',
}: UseLocationOptions): UseLocationReturn {
  const [locations, setLocations] = useState<LocationInfo[]>([]);
  const [currentLocationId, setCurrentLocationId] = useState(initialLocationId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLocations = async () => {
      try {
        const locs = await getLocations(caseId);
        setLocations(locs);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load locations');
      } finally {
        setLoading(false);
      }
    };

    void loadLocations();
  }, [caseId]);

  const handleLocationChange = useCallback(
    async (locationId: string) => {
      if (locationId === currentLocationId) return;

      try {
        await changeLocation(caseId, locationId);
        setCurrentLocationId(locationId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to change location');
      }
    },
    [caseId, currentLocationId]
  );

  return {
    locations,
    currentLocationId,
    loading,
    error,
    handleLocationChange,
  };
}
```

---

### Task 8: Frontend - API Client Functions
**File**: `frontend/src/api/client.ts`
**Action**: MODIFY - Add getLocations() and changeLocation() functions
**Purpose**: Call backend location endpoints
**Reference**: Existing getLocation() pattern (lines 364-390)
**Pattern**: fetch with error handling, return typed response
**Depends on**: Task 2 (change-location endpoint), Task 3 (locations endpoint)
**Acceptance criteria**:
- [ ] `getLocations(caseId)` returns `Promise<LocationInfo[]>`
- [ ] `changeLocation(caseId, locationId)` returns `Promise<{ success: boolean }>`
- [ ] Error handling: throws ApiError on non-ok response
- [ ] Type-safe: uses LocationInfo interface

**Implementation**:
```typescript
export async function getLocations(caseId: string): Promise<LocationInfo[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/case/${encodeURIComponent(caseId)}/locations`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } }
    );

    if (!response.ok) throw await createApiError(response);
    return (await response.json()) as LocationInfo[];
  } catch (error) {
    if (isApiError(error)) throw error;
    throw handleFetchError(error);
  }
}

export async function changeLocation(
  caseId: string,
  locationId: string,
  playerId: string = 'default'
): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/change-location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ case_id: caseId, location_id: locationId, player_id: playerId }),
    });

    if (!response.ok) throw await createApiError(response);
    return (await response.json()) as { success: boolean };
  } catch (error) {
    if (isApiError(error)) throw error;
    throw handleFetchError(error);
  }
}
```

---

### Task 9: Frontend - Integrate LocationSelector in App
**File**: `frontend/src/App.tsx`
**Action**: MODIFY - Add LocationSelector to right panel, pass currentLocationId to LocationView
**Purpose**: Wire up LocationSelector with location state
**Reference**: Existing panel layout with EvidenceBoard/WitnessSelector (lines 1-300)
**Pattern**: useLocation hook, pass currentLocationId to components
**Depends on**: Task 6 (LocationSelector), Task 7 (useLocation hook)
**Acceptance criteria**:
- [ ] useLocation hook called in App.tsx
- [ ] LocationSelector added to right panel (above EvidenceBoard)
- [ ] currentLocationId passed to LocationView (not hardcoded)
- [ ] handleLocationChange passed to LocationSelector
- [ ] Location change triggers useInvestigation reload (via locationId dependency)

**Implementation**:
```tsx
// In App.tsx
import { LocationSelector } from '@/components/LocationSelector';
import { useLocation } from '@/hooks/useLocation';

export default function App() {
  const CASE_ID = 'case_001';

  // Location hook (NEW)
  const {
    locations,
    currentLocationId,
    handleLocationChange,
  } = useLocation({ caseId: CASE_ID });

  // Investigation hook (MODIFY: locationId now dynamic)
  const { state, location, loading } = useInvestigation({
    caseId: CASE_ID,
    locationId: currentLocationId,  // Dynamic (not hardcoded)
    playerId: 'default',
    autoLoad: true,
  });

  // ... rest of existing hooks

  return (
    <div className="flex min-h-screen bg-black">
      {/* Left: Main investigation area */}
      <div className="flex-1">
        <LocationView
          caseId={CASE_ID}
          locationId={currentLocationId}  // Dynamic
          // ... other props
        />
      </div>

      {/* Right: Panels */}
      <div className="w-80 border-l border-gray-700 bg-black p-4 overflow-y-auto space-y-4">
        {/* NEW: Location Selector */}
        <LocationSelector
          locations={locations}
          currentLocationId={currentLocationId}
          onSelectLocation={handleLocationChange}
        />

        {/* Existing panels */}
        <EvidenceBoard evidence={state?.discovered_evidence ?? []} />
        <WitnessSelector witnesses={witnessState.witnesses} />
      </div>
    </div>
  );
}
```

---

### Task 10: Frontend - Add locationId to useInvestigation Dependencies
**File**: `frontend/src/hooks/useInvestigation.ts`
**Action**: MODIFY - Add locationId to useEffect dependency array
**Purpose**: Trigger reload when location changes
**Reference**: Existing useEffect pattern (line 670)
**Pattern**: Add locationId to dependency array
**Depends on**: Task 9 (App passes dynamic locationId)
**Acceptance criteria**:
- [ ] locationId added to useEffect dependency array
- [ ] Location change triggers loadInitialData()
- [ ] Narrator conversation history cleared (backend handles this)
- [ ] Evidence/witness states preserved

**Implementation**:
```typescript
// In useInvestigation.ts
useEffect(() => {
  if (autoLoad) {
    void loadInitialData();
  }
}, [autoLoad, loadInitialData, locationId]);  // Add locationId here
```

---

### Task 11: Frontend - Natural Language Detection (Stretch Goal)
**File**: `frontend/src/components/LocationView.tsx`
**Action**: MODIFY - Add detectLocationChange() before investigate() call
**Purpose**: Detect "go to X" in player input, change location if detected
**Reference**: GitHub research - natural language pattern
**Pattern**: Regex match → call handleLocationChange → skip investigate
**Depends on**: Task 7 (useLocation hook with handleLocationChange)
**Acceptance criteria**:
- [ ] detectLocationChange(input, locations) function exists
- [ ] Detects: "go to X", "visit X", "head to X"
- [ ] Fuzzy matches location names (dormitory vs dorm)
- [ ] If detected: calls handleLocationChange(), returns early (no investigate call)
- [ ] If not detected: normal investigate flow

**Implementation**:
```typescript
// In LocationView.tsx
function detectLocationChange(input: string, locations: string[]): string | null {
  const lowerInput = input.toLowerCase();

  // Match "go to X", "visit X", etc.
  const patterns = [
    /\b(go|visit|head|travel)\s+(?:to\s+)?(\w+)/i,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      const targetLocation = match[2].toLowerCase();
      // Fuzzy match against available locations
      const found = locations.find(loc =>
        loc.toLowerCase().includes(targetLocation) ||
        targetLocation.includes(loc.toLowerCase())
      );
      if (found) return found;
    }
  }

  return null;
}

// In handleSubmitAction:
const handleSubmitAction = useCallback(async (playerInput: string) => {
  // Check for location change first
  const newLocation = detectLocationChange(playerInput, locations.map(l => l.id));

  if (newLocation) {
    await handleLocationChange(newLocation);
    setPlayerInput('');
    return;
  }

  // Otherwise, normal investigation action
  // ... existing investigate logic
}, [locations, handleLocationChange]);
```

---

## Integration Points

### Backend State Flow
**Location Change Sequence**:
```
POST /api/change-location
  ↓
Load case_data (validate location exists)
Load player_state (or create new)
  ↓
state.visit_location(location_id)      # Update current_location, visited_locations
state.clear_narrator_conversation()    # Clear narrator_conversation_history
save_state(state, player_id)           # Persist to JSON
  ↓
Return { success: true, location: {...} }
```

**State Layers**:
- **Global** (preserved): discovered_evidence, witness_states, trust_levels, visited_locations
- **Per-Location** (cleared): narrator_conversation_history, spell_usage_count
- **Updated**: current_location

### Frontend Component Flow
**Clickable Navigation**:
```
LocationSelector.onClick(locationId)
  ↓
App.handleLocationChange(locationId)
  ↓
useLocation.handleLocationChange(locationId)
  ↓
API: changeLocation(caseId, locationId)
  ↓
setCurrentLocationId(locationId)
  ↓
useInvestigation detects locationId change (dependency)
  ↓
Reloads location data: getLocation(caseId, locationId)
  ↓
LocationView displays new description
```

**Natural Language Navigation**:
```
LocationView: player input "go to dormitory"
  ↓
detectLocationChange("go to dormitory", locations) → "dormitory"
  ↓
handleLocationChange("dormitory")
  ↓
[same flow as clickable]
```

### Evidence/Witness Preservation
```
Player discovers evidence in library:
  state.discovered_evidence = ["hidden_note"]

Player changes to dormitory:
  state.visit_location("dormitory")
  state.clear_narrator_conversation()  # Only this cleared
  state.discovered_evidence = ["hidden_note"]  # PRESERVED

Player returns to library:
  state.discovered_evidence = ["hidden_note"]  # Still there
  state.narrator_conversation_history = []     # Cleared (fresh context)
```

---

## Known Gotchas

### Backend
1. **Sequence Matters**: Call `visit_location()` BEFORE `clear_narrator_conversation()`. If reversed, old location's history persists.
2. **Save State**: Always call `save_state(state, player_id)` after modifying state. Forgetting this loses location change.
3. **Location Validation**: Use `get_location()` to validate location exists. Raises KeyError if not found (caught as 404).
4. **Default Location**: PlayerState defaults to `current_location: "great_hall"`. May need to change to "library" for case_001.

### Frontend
5. **State Mutation**: Don't mutate `currentLocationId` directly. Always use `setCurrentLocationId(newValue)`.
6. **Array Keys**: Use `location.id` as key, not array index. Index causes re-render bugs.
7. **locationId Dependency**: Add `locationId` to useInvestigation useEffect dependency array. Without it, location change won't trigger reload.
8. **Focus Rings**: Use `focus-visible:` (keyboard only), not `focus:` (both mouse + keyboard). Prevents jarring blue ring on mouse click.

### Natural Language
9. **Regex Boundaries**: Use `\b` word boundaries to avoid matching "goodbye" as "go".
10. **Greedy vs Non-Greedy**: Use `.+?` (non-greedy), not `.+` (greedy). Greedy captures too much.
11. **Fuzzy Matching**: Always validate regex match against known locations. Regex alone can't guarantee valid location.
12. **Rapidfuzz Dependency**: If using rapidfuzz for fuzzy matching, ensure it's installed (`uv add rapidfuzz` for backend).

### YAML
13. **Unique Evidence IDs**: Evidence IDs must be unique across all locations. Duplicate IDs cause state bugs.
14. **Witnesses Per Location**: Each location should have different witnesses (hermione in library, ron in dormitory). Same witness can appear in multiple locations.

---

## Validation

### Syntax & Style (Pre-commit)
```bash
# Backend
cd backend
uv run ruff check .
uv run ruff format .
uv run mypy src/
# Expected: No errors

# Frontend
cd frontend
bunx tsc --noEmit
bunx eslint src/
# Expected: No errors
```

### Manual Verification (Optional)
```bash
# 1. Start backend
cd backend
uv run uvicorn src.main:app --reload

# 2. Start frontend
cd frontend
~/.bun/bin/bun run dev

# 3. Quick smoke test:
# - Click "Dormitory" in LocationSelector
# - Verify description changes
# - Verify Evidence Board unchanged
# - Type "go to great hall"
# - Verify location changes
# - Return to library
# - Verify narrator history empty (fresh context)
```

**Note**: validation-gates agent handles comprehensive testing. No need to specify detailed test scenarios in PRP.

---

## Dependencies

### Backend
**New packages**: None (reuse existing: fastapi, pydantic, pyyaml)
**Optional**: `rapidfuzz` (fuzzy matching for natural language detection)
```bash
cd backend
uv add rapidfuzz  # If using fuzzy matching
```

### Frontend
**New packages**: None (reuse existing: React, TanStack Query, Radix UI, Tailwind)

### Configuration
**No new env vars needed**. Reuse existing:
- Backend: case_001.yaml (extend with 2 locations)
- Frontend: API_BASE_URL (already configured)

---

## Out of Scope (Phase 5.3+)

### Not in Phase 5.2
- **Location unlocking mechanics** (Phase 6+ feature)
- **Connection restrictions** (e.g., can't go to dormitory from great hall). Phase 5.2 uses flat graph (any → any)
- **Keyboard shortcuts 4-9** (reserved for future 6+ location cases)
- **"NEW" badge on unvisited locations** (nice-to-have, not required)
- **Location transitions with animations** (polish for later)
- **Search params routing** (TanStack pattern, optional enhancement)

### Future Enhancements (Post-5.2)
- Location-specific spell success modifiers (Phase 4.7 extended)
- Dynamic location availability based on case progress (Phase 6+)
- Location maps/floor plans (visual enhancement)
- Location-specific ambient sounds (audio polish)

---

## Agent Orchestration Plan

### Execution Strategy

**Sequential Track** (dependencies exist):
1. **fastapi-specialist** → Backend (Tasks 1-5) - Endpoints, YAML, parser
2. **react-vite-specialist** → Frontend (Tasks 6-11) - Components, hooks, integration
3. **validation-gates** → Run all tests, lint, type check, build
4. **documentation-manager** → Update README, CHANGELOG, PLANNING, STATUS

**Why Sequential**:
- Frontend depends on backend endpoints (Tasks 2-3 must exist before Tasks 8-9)
- Testing requires both backend + frontend complete
- Documentation reflects final state

### Agent-Specific Guidance

#### For fastapi-specialist
**Input**: Tasks 1-5 (backend implementation)
**Context**: Quick Reference section (no doc reading needed)
**Key Files**:
- `backend/src/api/routes.py` - Add 2 endpoints (change-location, locations list)
- `backend/src/case_store/loader.py` - Add list_locations() function
- `backend/src/location/parser.py` - Create LocationCommandParser (natural language)
- `backend/src/case_store/case_001.yaml` - Add dormitory + great_hall sections

**Pattern**: Follow existing endpoint patterns (lines 351-561, 801-826)
**Critical**: Call `visit_location()` BEFORE `clear_narrator_conversation()` (sequence matters)
**Output**: 2 endpoints working, 3 locations in YAML, parser detecting "go to X"

#### For react-vite-specialist
**Input**: Tasks 6-11 (frontend implementation)
**Context**: Quick Reference section (no doc reading needed)
**Key Files**:
- `frontend/src/components/LocationSelector.tsx` - Create right panel
- `frontend/src/hooks/useLocation.ts` - Create location state hook
- `frontend/src/api/client.ts` - Add getLocations(), changeLocation()
- `frontend/src/App.tsx` - Integrate LocationSelector, pass currentLocationId

**Pattern**: Follow EvidenceBoard structure (lines 1-141), useInvestigation hook pattern (lines 105-240)
**Critical**: Add `locationId` to useInvestigation useEffect dependency array
**Output**: LocationSelector visible, clickable, natural language working

#### For validation-gates
**Input**: All code complete (backend + frontend)
**Runs**: Tests, lint, type check, build
**Expected**: 638+ backend tests passing, 466+ frontend tests passing, zero regressions
**Note**: validation-gates creates new tests if needed (location endpoint tests, LocationSelector tests)
**Output**: Pass/fail report (MUST pass for Phase 5.2 complete)

#### For documentation-manager
**Input**: Code complete, validation passed
**Files to update**:
- `README.md` - Add Phase 5.2 section (version 0.10.0)
- `CHANGELOG.md` - Create v0.10.0 entry (Phase 5.2 features)
- `PLANNING.md` - Mark Phase 5.2 complete (lines 994-1015)
- `STATUS.md` - Update latest completion, version, test counts

**Output**: All project docs reflect Phase 5.2 completion

---

### Handoff Context

**Next agent receives**:
- This PRP (full context, 850+ lines)
- Quick Reference (API signatures, code patterns - no doc reading needed)
- Specific task numbers (Tasks 1-5 for backend, 6-11 for frontend)
- Actual file paths with line numbers (from CODEBASE_RESEARCH-phase5.2.md)
- Pattern files to follow (EvidenceBoard.tsx, useInvestigation.ts, existing routes.py patterns)

**Next agent does NOT need**:
- ❌ Read research files (GITHUB-RESEARCH-PHASE5.2.md, CODEBASE_RESEARCH-phase5.2.md, DOCS-RESEARCH-PHASE5.2.md)
- ❌ Search for examples (Quick Reference has everything)
- ❌ Read 5-10 docs (patterns extracted and provided)
- ❌ Explore codebase for integration points (all mapped in Integration Points section)

---

## Anti-Patterns to Avoid

**From project experience:**
- ❌ Creating new state management when existing PlayerState suffices
- ❌ Duplicating panel structure (follow EvidenceBoard pattern exactly)
- ❌ Mutating state objects (always use setState with new value)
- ❌ Using array index as key (causes re-render bugs)
- ❌ Forgetting to save state after changes (call save_state after visit_location)
- ❌ Not adding locationId to useEffect dependency (location change won't trigger reload)
- ❌ Complex routing logic (Phase 5.2 uses simple flat graph, any → any)
- ❌ Hardcoding location IDs (read from YAML dynamically)

---

## Unresolved Questions

None. All design decisions finalized in PLANNING.md (lines 994-1015):
- ✅ Navigation UX: Hybrid (clickable + natural language)
- ✅ Location Graph: Flat (any → any)
- ✅ UI Placement: Right side panel
- ✅ Scope: 3 locations for Case 1
- ✅ Unlocking: All accessible from start

---

**Generated**: 2026-01-12
**Source**: Research files + project documentation
**Confidence Score**: 9/10
**Alignment**: Validated against PLANNING.md Phase 5.2 + game design principles
**Ready for**: fastapi-specialist (backend implementation)
