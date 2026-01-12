# Documentation Research: Phase 5.2 - Location Management System

**Date**: 2026-01-12
**Phase**: Phase 5.2 - Location Management System
**Docs Found**: 4 (React 18, FastAPI, Tailwind CSS, MDN Regex)
**Confidence**: HIGH - All official sources, production-ready patterns

---

## 1. React 18 - List Selection & Conditional Rendering

**URL**: https://react.dev/reference/react/useState
**Type**: Official React Documentation
**Relevance**: Core pattern for LocationSelector component - manage selected location state, highlight current via conditional CSS classes

### Key Patterns Extracted

#### Pattern 1: useState for Selected Item Tracking
```jsx
import { useState } from 'react';

function LocationSelector({ locations }) {
  const [selectedLocationId, setSelectedLocationId] = useState(null);

  return (
    <ul className="location-list">
      {locations.map(location => (
        <li
          key={location.id}
          onClick={() => setSelectedLocationId(location.id)}
          className={selectedLocationId === location.id ? 'selected' : ''}
        >
          {location.name}
          {selectedLocationId === location.id && <span> ✓</span>}
        </li>
      ))}
    </ul>
  );
}
```

**Usage**: Track which location player has selected. Update state on click without mutation.
**Gotcha**: State updates are snapshots—don't mutate selected location object. Always return new value via `setSelectedLocationId()`.

#### Pattern 2: Conditional CSS Classes for Highlighting
```jsx
// Use conditional expressions for dark theme highlighting
<li
  className={`
    px-4 py-3 cursor-pointer transition-colors
    ${selectedLocationId === location.id
      ? 'bg-amber-600 text-amber-100 font-semibold'
      : 'bg-gray-800 text-amber-400 hover:bg-gray-700'}
  `}
>
  {location.name}
</li>
```

**Usage**: Apply Tailwind classes based on `selectedLocationId` state. Terminal theme: selected = amber bg, unselected = gray hover.
**Gotcha**: Don't use ternary inside `className` without template literal. Template literal + `${}` prevents runtime errors.

#### Pattern 3: Map Over Array with Key Prop
```jsx
// Always use stable, unique ID as key (never array index)
{locations.map(location => (
  <li key={location.id}>  // ✓ Correct
    {location.name}
  </li>
))}

// ❌ DON'T DO THIS:
{locations.map((location, index) => (
  <li key={index}>  // ✗ Wrong - causes re-render bugs if list reorders
    {location.name}
  </li>
))}
```

**Usage**: Render list of locations. React uses key to match old/new elements during re-renders.
**Gotcha**: Using array index as key causes bugs if locations reorder. Always use stable ID.

---

## 2. FastAPI - POST Endpoint with Validation

**URL**: https://fastapi.tiangolo.com/tutorial/body/
**Type**: Official FastAPI Documentation
**Relevance**: Backend endpoint for `POST /api/change-location` - validate location, return success/error

### Key Patterns Extracted

#### Pattern 1: POST Endpoint with Pydantic Model
```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class ChangeLocationRequest(BaseModel):
    location_id: str
    # Optional validation metadata
    # location_id: str = Field(..., min_length=1, max_length=50)

@app.post("/api/change-location")
async def change_location(request: ChangeLocationRequest):
    """Change player's current location and clear narrator history."""
    # FastAPI auto-validates request body as JSON
    # Returns 422 if validation fails

    location_id = request.location_id
    # Process location change...

    return {
        "status": "success",
        "current_location": location_id,
        "cleared_narrator_history": True
    }
```

**Usage**: Handle location change POST requests. FastAPI validates JSON body against Pydantic model.
**Gotcha**: If request doesn't match model (missing field, wrong type), FastAPI returns 422 Unprocessable Entity automatically. No manual validation needed.

#### Pattern 2: Request Body + Path Parameters + Query
```python
@app.post("/api/case/{case_id}/change-location")
async def change_location(
    case_id: str,
    request: ChangeLocationRequest,
    preserve_state: bool = False  # Optional query param
):
    """
    Change location within a case.

    Args:
        case_id: Case identifier (from URL path)
        request: JSON request body with location_id
        preserve_state: Query param to keep evidence/witnesses (default=False)
    """
    return {
        "case_id": case_id,
        "location_id": request.location_id,
        "preserved_state": preserve_state
    }
```

**Usage**: Combine path param (case_id), request body (location), and query param (preserve_state).
**Gotcha**: Parameter recognition is automatic—path params in `{}`, query params with defaults, request body is Pydantic model.

#### Pattern 3: Validation Errors Response
```python
from pydantic import BaseModel, Field

class ChangeLocationRequest(BaseModel):
    location_id: str = Field(..., min_length=1, description="Location ID")

# If client sends {"location_id": ""}, FastAPI returns:
# {
#   "detail": [
#     {
#       "type": "string_too_short",
#       "loc": ["body", "location_id"],
#       "msg": "String should have at least 1 character",
#       "input": "",
#       "ctx": {"min_length": 1}
#     }
#   ]
# }

# Status code: 422 Unprocessable Entity
```

**Usage**: Use `Field()` to add validation constraints. FastAPI returns detailed error messages automatically.
**Gotcha**: Always validate location_id exists before changing. Add custom logic (not just Pydantic validation).

---

## 3. Tailwind CSS V3 - Dark Theme & List Styling

**URL**: https://tailwindcss.com/docs/dark-mode
**Type**: Official Tailwind CSS Documentation
**Relevance**: Terminal dark theme (bg-gray-900 + text-amber-400), hover states, focus rings for LocationSelector

### Key Patterns Extracted

#### Pattern 1: Dark Mode Base + Terminal Aesthetic
```html
<!-- Apply dark:bg-gray-900 to root to match terminal theme -->
<div class="bg-white dark:bg-gray-900 min-h-screen">

  <!-- LocationSelector component -->
  <div class="dark:bg-gray-800 dark:text-amber-400">
    <h2 class="text-gray-900 dark:text-amber-300 font-bold">
      Locations
    </h2>

    <ul class="dark:bg-gray-800 dark:border-amber-400 border">
      <!-- Location items below -->
    </ul>
  </div>
</div>
```

**Usage**: Use `dark:` prefix for all dark theme colors. App assumes dark mode active (Phase 5.1 uses gray-900 bg globally).
**Gotcha**: Must enable `darkMode: 'class'` in tailwind.config.js AND add `class="dark"` to `<html>` or parent. Or use CSS media query.

#### Pattern 2: Hover States + Selected Highlighting
```jsx
// LocationSelector list items with hover + selected states
<li
  className={`
    px-4 py-2 cursor-pointer transition-all duration-150 border-l-4 border-transparent
    ${selectedLocationId === location.id
      ? 'dark:bg-amber-600 dark:text-white dark:border-l-amber-400 dark:font-semibold'
      : 'dark:bg-gray-800 dark:text-amber-400 dark:hover:bg-gray-700 dark:hover:border-l-amber-300'
    }
  `}
  onClick={() => setSelectedLocationId(location.id)}
>
  {location.name}
</li>
```

**Usage**:
- Selected: solid amber background + left border accent (visual depth)
- Unselected: gray background, hover darken + border hint
- Transition smooths color changes (150ms)

**Gotcha**: Always include `transition-all duration-150` to prevent jarring hover state changes. Left border adds depth without layout shift.

#### Pattern 3: Focus Ring for Accessibility (Keyboard Nav)
```jsx
<button
  className="dark:bg-gray-800 dark:text-amber-400 dark:focus-visible:ring-2 dark:focus-visible:ring-amber-400"
  onClick={() => handleLocationSelect(location)}
>
  {location.name}
</button>

// Alternative: Custom focus ring style
<div
  className={`
    px-4 py-2 cursor-pointer rounded
    dark:focus-visible:outline-2 dark:focus-visible:outline-amber-400 dark:focus-visible:outline-offset-2
  `}
>
  {location.name}
</div>
```

**Usage**: `dark:focus-visible:` applies ring ONLY on keyboard focus (not mouse). 2px ring with amber color.
**Gotcha**: Use `focus-visible` (keyboard only), NOT `focus` (both mouse + keyboard). Prevents blue ring on mouse click.

---

## 4. JavaScript Regex - Natural Language Detection

**URL**: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions
**Type**: MDN Official Reference
**Relevance**: Parse player input like "go to dormitory" → detect location change intent + extract location name

### Key Patterns Extracted

#### Pattern 1: Basic Command + Location Extraction
```javascript
// Match "go to [location]", "visit [location]", etc.
const locationCommandPattern = /^(?<action>go|visit|head|travel)\s+(?:to\s+)?(?<location>.+?)$/i;

const input = "go to the dormitory";
const match = input.match(locationCommandPattern);

if (match) {
  const { action, location } = match.groups;
  console.log(`Action: ${action}, Location: ${location}`);
  // Output: Action: go, Location: the dormitory
}
```

**Usage**: Parse freeform input. Named groups (`?<action>`, `?<location>`) organize extracted data clearly.
**Gotcha**: Case-insensitive flag `i` catches "GO", "Go", "go" equally. `.+?` is non-greedy (stops at first match, not greedy).

#### Pattern 2: Multi-Variant Command Matching
```javascript
// Pattern with multiple command variants
const commandPattern = /\b(go to|visit|head to|travel to|move to)\s+(.+)/i;

const tests = [
  "go to the library",
  "visit dormitory",
  "head to great hall",
  "travel to restricted section"
];

tests.forEach(input => {
  const match = input.match(commandPattern);
  if (match) {
    const location = match[2].trim();
    console.log(`Detected location: ${location}`);
  }
});
```

**Usage**: Capture variations of "go to" commands. Group `(.+)` captures full location string (handles "the dormitory", "great hall", etc.).
**Gotcha**: Use word boundaries `\b` to avoid matching "goodbye" as "go". Use `\s+` for flexible spacing.

#### Pattern 3: Safe Extraction (No False Positives)
```javascript
class LocationCommandParser {
  constructor(validLocations = []) {
    this.validLocations = validLocations; // e.g., ["library", "dormitory", "great_hall"]
    // Pattern: "go to X" OR "visit X" (strict command prefix)
    this.pattern = /^(?<action>go\s+to|visit|head\s+to|travel\s+to)\s+(?<location>.+?)(?:\.|$)/i;
  }

  parse(input) {
    const match = input.match(this.pattern);
    if (!match) return null; // No match = no false positive

    const location = match.groups.location.trim().toLowerCase();

    // Optional: Validate against known locations
    if (this.validLocations.length > 0) {
      const found = this.validLocations.find(loc =>
        location.includes(loc) || loc.includes(location)
      );
      if (!found) return null;
    }

    return { isLocationChange: true, location };
  }
}

// Usage
const parser = new LocationCommandParser(["library", "dormitory", "great hall"]);
console.log(parser.parse("go to the library")); // {isLocationChange: true, location: "the library"}
console.log(parser.parse("What's in your library?")); // null (no false positive)
```

**Usage**: Ensure "go to" is PREFIX (not substring). Validate extracted location against known list. Return null if no match.
**Gotcha**: Regex alone can't validate location exists. Always cross-check against valid locations AFTER regex match.

---

## Quick Reference

### LocationSelector Component Template
```jsx
import { useState } from 'react';

export function LocationSelector({ locations, onLocationSelect, currentLocationId }) {
  const [selectedId, setSelectedId] = useState(currentLocationId);

  const handleClick = (locationId) => {
    setSelectedId(locationId);
    onLocationSelect(locationId); // Notify parent to call API
  };

  return (
    <div className="dark:bg-gray-800 dark:text-amber-400 border dark:border-amber-400">
      <h2 className="px-4 py-2 font-bold text-amber-300">Locations</h2>
      <ul className="divide-y dark:divide-gray-700">
        {locations.map(location => (
          <li
            key={location.id}
            onClick={() => handleClick(location.id)}
            className={`px-4 py-3 cursor-pointer transition-colors ${
              selectedId === location.id
                ? 'dark:bg-amber-600 dark:text-white dark:font-semibold'
                : 'dark:bg-gray-800 dark:text-amber-400 dark:hover:bg-gray-700'
            }`}
          >
            {location.name}
            {selectedId === location.id && ' ✓'}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### API Endpoint Template
```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI()

class ChangeLocationRequest(BaseModel):
    location_id: str = Field(..., min_length=1, description="Location to change to")

@app.post("/api/change-location")
async def change_location(request: ChangeLocationRequest):
    """Change location and clear narrator history per location."""

    # Validate location exists
    if request.location_id not in ["library", "dormitory", "great_hall"]:
        raise HTTPException(status_code=400, detail="Invalid location")

    # Clear narrator history, preserve evidence/witnesses
    # (Narrator conversation clears per location, not globally)

    return {
        "status": "success",
        "current_location": request.location_id,
        "narrator_history_cleared": True
    }
```

### Natural Language Detection Template
```javascript
const locationCommandPattern = /^(?<action>go|visit|head)\s+(?:to\s+)?(?<location>.+?)$/i;

function detectLocationChange(input) {
  const match = input.match(locationCommandPattern);
  if (!match) return null;

  return {
    isLocationChange: true,
    location: match.groups.location.trim()
  };
}

// Usage in investigation handler:
const result = detectLocationChange(playerInput);
if (result?.isLocationChange) {
  // Call changeLocation API instead of narrator
  await api.post('/api/change-location', { location_id: result.location });
}
```

---

## Gotchas Summary

### React 18
1. ❌ Don't mutate state objects—always return new value via setState
2. ❌ Array index as key causes bugs if list reorders—use stable ID
3. ✅ Use template literals for conditional Tailwind classes

### FastAPI
1. ❌ Manual validation unnecessary—Pydantic + FastAPI auto-validate, return 422
2. ❌ Don't forget to validate location_id EXISTS in database/YAML
3. ✅ Use Field() for constraints (min_length, description, etc.)

### Tailwind CSS
1. ❌ dark: prefix requires `class="dark"` on root AND `darkMode: 'class'` in config
2. ❌ Use `focus-visible` (keyboard only), not `focus` (both keyboard + mouse)
3. ✅ Add `transition-all duration-150` to hover states for smooth UX

### Regex
1. ❌ Regex alone can't validate locations—always cross-check against valid list
2. ❌ Greedy `.+` matches too much—use non-greedy `.+?` for location extraction
3. ✅ Use named groups `(?<name>...)` for code clarity in complex patterns

---

## Context7 / Advanced References

**If using Context7 MCP** (for additional patterns):
- Query: "React list component selection example"
- Query: "FastAPI POST validation custom error handling"
- Query: "Tailwind CSS dark mode list styling hover effects"

These docs cover the critical patterns. Additional advanced topics (animations, optimistic updates, error boundaries) can be researched in Phase 5.3.

---

## Files Needing Research

**Already researched** (not needed for Phase 5.2):
- React Context API (from Phase 5.1 research)
- Radix Dialog (from Phase 5.1 research)
- Keyboard event handling (from Phase 5.1 research)

**For Phase 5.3** (Save/Load System):
- FastAPI file operations + JSON persistence
- React Context for multi-slot state management
- Pydantic serialization (model_dump, model_validate)

---

**KISS Principle Applied**: Only 4 critical docs extracted. 2-5 patterns per doc. No redundant tutorials. Max 500 lines.

**Status**: Ready for Phase 5.2 implementation.
