# PRP: Phase 5.3 - localStorage Save/Load System

## Overview

Phase 5.3 adds industry-standard multi-slot save/load system with localStorage persistence, replacing single "default" save. System includes 3 manual save slots + 1 autosave slot, save metadata (timestamp, progress %, location), slot selection UI, and graceful error handling (corruption, quota exceeded).

**End State**: Player opens menu → clicks "SAVE GAME" → selects slot (1-3) → save created with metadata. Player clicks "LOAD GAME" → sees 3 slots + autosave → clicks slot → game restores. Autosave triggers after evidence discovery, witness interrogation, verdict submission (debounced 2s).

---

## Why

### User Impact
- **Data safety**: 3 manual slots prevent accidental overwrite (experiment without fear)
- **Progress visibility**: See save timestamp, location, progress % before loading
- **Autosave protection**: Autosave slot prevents data loss from browser crashes
- **Industry standard**: Multi-slot system matches player expectations from visual novels, RPGs

### Business Value
- **User retention**: Save system prevents frustration from lost progress (5-10 min/case)
- **Replay value**: Multiple slots enable experimenting with different investigation paths
- **Polish signal**: Professional save system elevates perceived quality
- **Future-proof**: Versioning system enables safe schema migrations (Phases 5.4+)

### Integration
- **Fits Phase 5.1 complete**: Menu buttons placeholder ("Coming in Phase 5.3") → now functional
- **Reuses existing patterns**: PlayerState, persistence.py, API routes, useInvestigation hook
- **No breaking changes**: Existing single-slot saves migrate to "autosave" slot automatically

### Alignment
- **PLANNING.md Milestone**: Phase 5.3 (2-3 days), enables Phase 5.4 (narrative polish), Phase 6 (first complete case)
- **Game Design**: Obra Dinn model (player-driven investigation) requires safe experimentation → multi-slot saves critical

---

## What

### User-Visible Behavior

**Save Flow**:
1. Player opens menu (ESC key) → clicks "SAVE GAME"
2. Modal opens showing 3 save slots (1-3) with metadata:
   - Empty slots: "Empty Slot" text, timestamp "--", progress "0%"
   - Filled slots: Save name (default: "Slot 1"), timestamp "2 minutes ago", location "Library", progress "40% (6/15 evidence)"
3. Player clicks slot → confirmation dialog if overwriting: "Overwrite Save? This will replace Slot 1 (created 2 minutes ago)"
4. Player confirms → save created, modal shows success toast "Saved to Slot 1", closes after 1s

**Load Flow**:
1. Player opens menu → clicks "LOAD GAME"
2. Modal opens showing 3 manual slots + 1 autosave slot (4 total)
   - Autosave slot: Special badge "AUTO", timestamp shows last autosave time
3. Player clicks slot → game loads immediately (no confirmation)
4. Modal closes, investigation view restores with all state (conversation, evidence, witnesses)

**Autosave Behavior**:
- Triggers after evidence discovery (debounced 2s)
- Triggers after witness interrogation complete (debounced 2s)
- Triggers after verdict submission (immediate, no debounce)
- Shows brief toast "Auto-saved" (1s duration, non-intrusive)
- Never interrupts gameplay (async background operation)

**Slot Display Format**:
```
┌─────────────────────────────────────┐
│ Slot 1: Library Investigation       │
│ 40% complete (6/15 evidence)        │
│ Library • 2 witnesses interrogated  │
│ Saved 2 minutes ago                 │
└─────────────────────────────────────┘
```

### Technical Requirements

**Frontend** (React + Vite):
- `SaveLoadModal.tsx` - Modal with slot selection UI
- `SaveSlot.tsx` - Individual slot display component
- `useSaveSlots.ts` - Hook for save slot management (list, save, load, delete)
- Extend `useInvestigation.ts` - Add autosave handlers
- Enable MainMenu buttons (remove "Coming in Phase 5.3" placeholders)
- Add confirmation dialog for overwrite

**Backend** (Python FastAPI):
- Extend `persistence.py` - Add slot-based functions (7 new)
- Extend `routes.py` - Add 5 new endpoints (list, save slot, load slot, delete slot, rename slot)
- New Pydantic models: `SaveMetadata`, `SaveSlotsResponse`, `SaveSlotRequest`
- Backward compatibility: Migrate `case_001_default.json` → `case_001_default_autosave.json`

**State Management**:
- LocalStorage keys: `auror_save_slot_1`, `auror_save_slot_2`, `auror_save_slot_3`, `auror_save_autosave`
- Each save includes: `{ version, timestamp, metadata, gameState }`
- Metadata separate for fast loading (no need to parse full state)

**Styling**:
- Terminal dark theme: `bg-gray-900`, `text-amber-400`, `border-gray-700`
- Save slots: Grid layout (1-column mobile, 2-column desktop)
- Autosave badge: `bg-amber-600`, special icon (💾)
- Progress bar: Visual indicator 0-100% (evidence count / total evidence)

### Success Criteria

- [ ] 3 manual save slots work independently (no cross-contamination)
- [ ] Autosave slot updates after evidence/witness/verdict (debounced correctly)
- [ ] Save metadata displays: timestamp, progress %, location, evidence count
- [ ] Load restores exact game state (evidence, witnesses, conversation, spells)
- [ ] Overwrite confirmation prevents accidental data loss
- [ ] Empty slots show "Empty Slot" placeholder
- [ ] Backward compatibility: existing `case_001_default.json` loads as autosave
- [ ] Corruption detection: Invalid saves show error, don't crash game
- [ ] Quota exceeded handled gracefully (shows "Storage full" error)
- [ ] All 691 backend + 466 frontend tests pass (zero regressions)
- [ ] TypeScript/ESLint/Build pass
- [ ] Manual testing checklist complete (see Validation section)

---

## Context & References

### Project Documentation

**From PLANNING.md**:
- Architecture: Python FastAPI backend, React + Vite frontend, Bun package manager
- Phase 5.3 goal: "Industry-Standard Save/Load (2-3 days) - Multiple save slots, metadata, autosave triggers"
- Current version: 0.9.1 (Phase 5.2 backend complete - location management)
- Tech stack: Tailwind CSS, React Context, Pydantic v2 validation
- Existing save system: Single-slot (`case_001_default.json` in `backend/saves/`)

**From game design** (AUROR_ACADEMY_GAME_DESIGN.md):
- Design pillar: "Player-driven deduction - No handholding; player decides when to submit verdict"
- Obra Dinn model: Player experiments freely → multi-slot saves enable experimentation
- Educational focus: Wrong verdicts are content → need safe saves to retry
- Terminal aesthetic: Minimal UI, dark theme, keyboard-first

**From STATUS.md**:
- Current state: Phase 5.2 backend complete (691 backend tests, 466 frontend tests passing)
- Research complete: GitHub (localForage, shapez.io, Ren'Py), Codebase (25+ patterns), Docs (MDN, React, Zod)
- Next milestone: Phase 5.3 → Phase 5.4 (narrative polish) → Phase 6 (first complete case)
- No blockers: All dependencies installed, backend/frontend working

### Research Sources

**From GITHUB-RESEARCH-PHASE5.3.md (validated)**:
- ✅ localForage (22.8k⭐): IndexedDB/localStorage abstraction, quota management, error handling
- ✅ shapez.io (6.8k⭐): Schema-based serialization, safe saves (atomic write), versioning + migration, corruption detection
- ✅ Ren'Py (6.1k⭐): Save slot metadata system, unlimited slots via pagination, save naming
- ✅ GameSaveSystem: Auto-save trigger strategy (event-driven, not timer), import/export for backup
- **Recommendation**: Use localStorage directly (not localForage) - text game saves ~5-10MB, simpler API
- **Pattern adapted**: Safe save pattern (write to temp, verify, swap atomically)
- **Pattern adapted**: Metadata separate from game state (fast slot list loading)

**Alignment notes**:
- ✅ All patterns from production-ready systems (22.8k-6.8k stars, actively maintained)
- ⚠️ localForage overkill for Phase 5.3 (IndexedDB complexity not needed for text game)
- ✅ shapez.io patterns directly applicable (schema validation, safe saves, versioning)
- ✅ Ren'Py slot metadata system perfect for visual novel-style game

**From CODEBASE-RESEARCH-phase5.3.md (validated)**:
- ✅ Existing save system: `persistence.py` functions (save_state, load_state, delete_state, list_saves)
- ✅ Backend routes: `POST /api/save`, `GET /api/load/{case_id}`, `POST /api/case/{case_id}/reset`
- ✅ Frontend client: `saveState()`, `loadState()`, `resetCase()` in `client.ts`
- ✅ PlayerState structure: 15+ fields (conversation_history, witness_states, verdict_state, etc.) - 9.1KB typical
- ✅ Hook pattern: `useInvestigation.ts` (handleSave, handleLoad, handleEvidenceDiscovered)
- **Integration points**: MainMenu (enable buttons), LocationView (autosave trigger), WitnessInterview (autosave trigger)

**Alignment notes**:
- ✅ All patterns established and tested in Phases 1-5.2
- ✅ Minimal backend changes needed (extend existing functions, add endpoints)
- ✅ Frontend uses existing Modal, Button, ConfirmDialog patterns
- ⚠️ Existing saves use `{case_id}_{player_id}.json` pattern → migrate to slot-based naming

**From DOCS-RESEARCH-PHASE5.3.md (validated)**:
- ✅ MDN localStorage API: Write with QuotaExceededError handling, read with corruption detection, quota estimation
- ✅ React custom hooks: `useLocalStorage` hook, `useAutoSave` with debouncing, cross-tab sync via StorageEvent
- ✅ Zod validation: SaveFileSchema, version detection, migration chain pattern
- **Key API**: `localStorage.setItem()`, `localStorage.getItem()`, `JSON.stringify/parse`, `SaveFileSchema.safeParse()`
- **Gotcha**: Private browsing = 0 quota (test availability first)
- **Gotcha**: JSON.parse can fail on corrupted data (always wrap in try/catch)

**Alignment notes**:
- ✅ localStorage sufficient for 5-10MB saves (typical case: 9.1KB per save × 4 slots = 36KB)
- ✅ React 18 custom hook patterns match existing codebase style
- ✅ Zod validation adds safety (already used in backend for Pydantic, add to frontend for saves)
- ✅ Debouncing prevents autosave spam (2s delay after evidence discovery)

---

## Quick Reference (Pre-Digested Context)

### Essential API Signatures

**localStorage API** (from DOCS-RESEARCH-PHASE5.3.md):
```typescript
// Save to slot with error handling
function saveToSlot(slotId: string, gameState: GameState): boolean {
  try {
    const serialized = JSON.stringify({
      version: '1.0.0',
      timestamp: Date.now(),
      metadata: {
        location: gameState.current_location,
        evidenceCount: gameState.discovered_evidence.length,
        witnessesInterrogated: Object.keys(gameState.witness_states).length,
      },
      gameState,
    });
    localStorage.setItem(`auror_save_slot_${slotId}`, serialized);
    return true;
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.error('Storage quota exceeded');
      return false; // Show "Storage full" error to user
    }
    throw e;
  }
}

// Load from slot with validation
function loadFromSlot(slotId: string): GameState | null {
  try {
    const saved = localStorage.getItem(`auror_save_slot_${slotId}`);
    if (!saved) return null;

    const parsed = JSON.parse(saved);
    if (!parsed.version || !parsed.gameState) return null;

    // Validate structure (Zod schema)
    const validated = SaveFileSchema.safeParse(parsed);
    if (!validated.success) {
      console.error('Corrupted save:', validated.error);
      localStorage.removeItem(`auror_save_slot_${slotId}`); // Delete corrupted
      return null;
    }

    return parsed.gameState;
  } catch (e) {
    console.error('Failed to load save:', e);
    return null;
  }
}
```

**React useLocalStorage Hook** (from DOCS-RESEARCH-PHASE5.3.md):
```typescript
// Reusable hook for save slots
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Failed to load ${key}:`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T) => {
    try {
      setStoredValue(value);
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to save ${key}:`, error);
    }
  }, [key]);

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove ${key}:`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
```

**Backend Save Slot Functions** (from CODEBASE-RESEARCH-phase5.3.md + patterns):
```python
# New functions to add to persistence.py

def save_to_slot(state: PlayerState, slot_id: str, player_id: str = "default") -> Path:
    """Save player state to specific slot."""
    save_dir = get_saves_dir()
    save_dir.mkdir(parents=True, exist_ok=True)
    save_path = save_dir / f"{state.case_id}_{player_id}_{slot_id}.json"

    # Safe save: write to temp, verify, rename
    temp_path = save_path.with_suffix('.tmp')

    with open(temp_path, "w", encoding="utf-8") as f:
        json.dump(state.model_dump(mode="json"), f, indent=2, default=str)

    # Verify temp file is readable
    with open(temp_path, encoding="utf-8") as f:
        verified = json.load(f)
        if not verified.get("state_id"):
            raise ValueError("Save verification failed")

    # Atomic rename (if crash here, old save intact)
    temp_path.rename(save_path)
    return save_path

def list_save_slots(case_id: str, player_id: str = "default") -> list[SaveMetadata]:
    """List all save slots with metadata."""
    save_dir = get_saves_dir()
    slots = []

    for slot_id in ["slot1", "slot2", "slot3", "autosave"]:
        save_path = save_dir / f"{case_id}_{player_id}_{slot_id}.json"
        if save_path.exists():
            with open(save_path, encoding="utf-8") as f:
                data = json.load(f)
                slots.append(SaveMetadata(
                    slot_id=slot_id,
                    timestamp=data.get("updated_at"),
                    location=data.get("current_location"),
                    evidence_count=len(data.get("discovered_evidence", [])),
                    witnesses_interrogated=len(data.get("witness_states", {})),
                ))

    return slots

def load_from_slot(case_id: str, slot_id: str, player_id: str = "default") -> PlayerState | None:
    """Load player state from specific slot."""
    save_path = get_saves_dir() / f"{case_id}_{player_id}_{slot_id}.json"

    if not save_path.exists():
        return None

    with open(save_path, encoding="utf-8") as f:
        data = json.load(f)

    # Validate structure (basic check)
    if not data.get("state_id") or not data.get("case_id"):
        raise ValueError(f"Corrupted save in slot {slot_id}")

    return PlayerState(**data)
```

### Key Patterns from Research

**Safe Save Pattern** (from shapez.io - GITHUB-RESEARCH):
```python
# Atomic write prevents corruption on crash
async def safe_save(slot_id: str, state: PlayerState):
    temp_key = f"save_{slot_id}_temp"
    final_key = f"save_{slot_id}"

    # Step 1: Write to temporary location
    temp_path = save_to_temp(state)

    # Step 2: Verify temp save is readable
    verified = load_from_temp(temp_path)
    if not verified or verified.state_id != state.state_id:
        raise ValueError('Save verification failed')

    # Step 3: Atomic swap (if crash before this, old save intact)
    temp_path.rename(final_path)
```

**Auto-Save with Debouncing** (from DOCS-RESEARCH-PHASE5.3.md):
```typescript
// Don't spam localStorage on every action
function useAutoSave(gameState: GameState, delayMs: number = 2000) {
  const [isSaving, setIsSaving] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // Set new timeout for delayed save
    timeoutRef.current = setTimeout(() => {
      setIsSaving(true);
      try {
        localStorage.setItem('auror_save_autosave', JSON.stringify({
          version: '1.0.0',
          timestamp: Date.now(),
          data: gameState,
        }));
      } finally {
        setIsSaving(false);
      }
    }, delayMs);

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [gameState, delayMs]);

  return isSaving;
}
```

**Corruption Detection** (from shapez.io - GITHUB-RESEARCH):
```typescript
// Validate save on load, show recovery UI if corrupted
function validateSave(saveData: unknown, slotId: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required fields
  if (!saveData || typeof saveData !== 'object') errors.push('Invalid format');
  const data = saveData as any;

  if (!data.version) errors.push('Missing version');
  if (!data.timestamp || typeof data.timestamp !== 'number') errors.push('Invalid timestamp');
  if (!data.gameState) errors.push('Missing game state');
  if (!Array.isArray(data.gameState?.discovered_evidence)) errors.push('Evidence not array');

  return { valid: errors.length === 0, errors };
}

// Show recovery UI if corrupted
function showCorruptionRecovery(slotId: string, errors: string[]) {
  return (
    <ConfirmDialog
      open={true}
      title="Save File Corrupted"
      message={`Slot ${slotId} is corrupted: ${errors.join(', ')}`}
      destructive={true}
      confirmText="Delete Corrupted Save"
      cancelText="Cancel"
      onConfirm={() => deleteSaveSlot(slotId)}
      onCancel={() => {}}
    />
  );
}
```

### Integration Patterns (Actual Codebase)

**Backend API Endpoint Pattern** (from routes.py - CODEBASE-RESEARCH):
```python
# New endpoint: List all save slots
@router.get("/api/saves", response_model=SaveSlotsResponse)
async def list_saves_endpoint(
    case_id: str = Query(default="case_001"),
    player_id: str = Query(default="default")
):
    """List all save slots with metadata."""
    try:
        slots = list_save_slots(case_id, player_id)
        return SaveSlotsResponse(case_id=case_id, slots=slots)
    except Exception as e:
        logger.error(f"Failed to list saves: {e}")
        raise HTTPException(status_code=500, detail="Failed to list saves")

# New endpoint: Save to specific slot
@router.post("/api/saves/{slot_id}", response_model=SaveSlotResponse)
async def save_to_slot_endpoint(
    slot_id: str,
    request: SaveSlotRequest
):
    """Save player state to specific slot."""
    try:
        # Load existing state to preserve conversation history
        existing = load_from_slot(request.case_id, slot_id, request.player_id)

        if existing:
            state = existing
            state.current_location = request.state.get("current_location", state.current_location)
            state.discovered_evidence = request.state.get("discovered_evidence", state.discovered_evidence)
            # ... update other fields
        else:
            state = PlayerState(**request.state)

        save_path = save_to_slot(state, slot_id, request.player_id)
        return SaveSlotResponse(success=True, slot_id=slot_id, message="Saved successfully")
    except Exception as e:
        logger.error(f"Failed to save slot {slot_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Save failed: {str(e)}")
```

**Frontend API Client Pattern** (from client.ts - CODEBASE-RESEARCH):
```typescript
// New API client functions
export async function listSaveSlots(
  caseId: string,
  playerId = 'default'
): Promise<SaveSlotsResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/saves?case_id=${encodeURIComponent(caseId)}&player_id=${encodeURIComponent(playerId)}`,
    { method: 'GET' }
  );

  if (!response.ok) {
    throw await createApiError(response);
  }

  return (await response.json()) as SaveSlotsResponse;
}

export async function saveToSlot(
  slotId: string,
  playerId: string,
  state: InvestigationState
): Promise<SaveSlotResponse> {
  const request: SaveSlotRequest = {
    player_id: playerId,
    slot_id: slotId,
    state,
  };

  const response = await fetch(`${API_BASE_URL}/api/saves/${encodeURIComponent(slotId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await createApiError(response);
  }

  return (await response.json()) as SaveSlotResponse;
}
```

**Frontend Hook Pattern** (new useSaveSlots.ts):
```typescript
// New hook for save slot management
interface SaveSlot {
  slot_id: string;
  timestamp: number;
  location: string;
  evidence_count: number;
  witnesses_interrogated: number;
  progress_percent: number;
}

export function useSaveSlots(caseId: string, playerId = 'default') {
  const [slots, setSlots] = useState<SaveSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listSlots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listSaveSlots(caseId, playerId);
      setSlots(response.slots);
    } catch (e) {
      setError(isApiError(e) ? e.message : 'Failed to list saves');
    } finally {
      setLoading(false);
    }
  }, [caseId, playerId]);

  const saveToSlot = useCallback(async (slotId: string, state: InvestigationState) => {
    setLoading(true);
    setError(null);
    try {
      await saveToSlotAPI(slotId, playerId, state);
      await listSlots(); // Refresh slot list
    } catch (e) {
      setError(isApiError(e) ? e.message : 'Save failed');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [playerId, listSlots]);

  const loadFromSlot = useCallback(async (slotId: string) => {
    setLoading(true);
    setError(null);
    try {
      const state = await loadFromSlotAPI(slotId, playerId);
      return state;
    } catch (e) {
      setError(isApiError(e) ? e.message : 'Load failed');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  return { slots, loading, error, listSlots, saveToSlot, loadFromSlot };
}
```

### Library-Specific Gotchas

**localStorage API** (from DOCS-RESEARCH):
- ⚠️ Private browsing mode = 0 quota (test `localStorage.length === 0` after initialization)
- ⚠️ QuotaExceededError = storage full (5-10MB limit per origin)
- ⚠️ JSON.parse can fail on corrupted data (always wrap in try/catch, delete corrupted)
- ⚠️ Synchronous API (blocks UI thread) → keep saves small (<1MB), debounce autosave

**React Hooks** (from DOCS-RESEARCH):
- ⚠️ useEffect cleanup CRITICAL (clear timeouts, remove event listeners)
- ⚠️ Include all dependencies in dependency array (stale closure otherwise)
- ⚠️ Test SSR safety (check `typeof window !== 'undefined'`)

**Pydantic Serialization** (from CODEBASE-RESEARCH):
- ⚠️ Must use `model_dump(mode="json")` for datetime serialization (not `model_dump()`)
- ⚠️ `default=str` needed for JSON.dump if datetime fields present

**File I/O** (from CODEBASE-RESEARCH):
- ⚠️ No existing error handling for disk full, permission denied
- ⚠️ Concurrent saves can corrupt (add file locking or save-in-progress flag)
- ⚠️ Atomic writes prevent corruption (write to temp, verify, rename)

**Backward Compatibility** (from CODEBASE-RESEARCH):
- ⚠️ Existing saves use `{case_id}_{player_id}.json` → migrate to `{case_id}_{player_id}_autosave.json`
- ⚠️ On first load, check for old saves, migrate automatically
- ⚠️ PlayerState `state_id` is UUID (each slot gets unique ID - don't try to match them)

### Decision Tree

```
Player clicks "SAVE GAME":
  1. Open SaveLoadModal with save mode
  2. List all slots (API call)
  3. Player clicks slot:
     ├─ Empty slot → Save immediately → Success toast → Close modal
     └─ Filled slot → Show confirmation "Overwrite?" → Player confirms → Save → Success toast

Player clicks "LOAD GAME":
  1. Open SaveLoadModal with load mode
  2. List all slots (API call)
  3. Player clicks slot:
     ├─ Valid save → Load immediately → Close modal → Game restores
     ├─ Corrupted save → Show error dialog "Corrupted save, delete?" → Player confirms → Delete
     └─ Empty slot → No action (button disabled)

Autosave triggers:
  1. Evidence discovered:
     ├─ Check debounce timer (last autosave < 2s ago?) → Skip
     └─ Timer expired → Save to autosave slot → Toast "Auto-saved" (1s)
  2. Witness interrogation complete:
     ├─ Check debounce timer → Skip if too soon
     └─ Timer expired → Save to autosave slot
  3. Verdict submitted:
     └─ Force save (bypass debounce) → Save to autosave slot → No toast (verdict feedback shown)
```

### Configuration Requirements

**No New Dependencies**:
- Frontend: Use existing React 18, Radix Dialog, Tailwind CSS
- Backend: Use existing FastAPI, Pydantic, pathlib, json (all built-in)

**localStorage Keys** (new):
```bash
# Save slots
auror_save_slot_1
auror_save_slot_2
auror_save_slot_3
auror_save_autosave
```

**Backend Save Files** (new naming):
```bash
# Old format (Phase 1-5.2)
backend/saves/case_001_default.json

# New format (Phase 5.3+)
backend/saves/case_001_default_slot1.json
backend/saves/case_001_default_slot2.json
backend/saves/case_001_default_slot3.json
backend/saves/case_001_default_autosave.json
```

---

## Current Codebase Structure

```bash
# Existing structure (Phase 5.2 complete)
backend/src/
├── api/
│   ├── routes.py           # MODIFY - Add 5 new endpoints
│   └── models.py           # MODIFY - Add SaveMetadata, SaveSlotsResponse
├── state/
│   ├── player_state.py     # KEEP AS-IS - No changes needed
│   └── persistence.py      # MODIFY - Add 7 new functions
└── tests/
    ├── test_routes.py      # MODIFY - Add slot endpoint tests
    └── test_persistence.py # MODIFY - Add slot function tests

frontend/src/
├── components/
│   ├── MainMenu.tsx        # MODIFY - Enable Save/Load buttons
│   ├── LocationView.tsx    # MODIFY - Add autosave trigger
│   └── WitnessInterview.tsx # MODIFY - Add autosave trigger
├── hooks/
│   └── useInvestigation.ts # MODIFY - Add autosave handlers
├── api/
│   └── client.ts           # MODIFY - Add 5 new functions
└── types/
    └── investigation.ts    # MODIFY - Add 4 new interfaces
```

## Desired Codebase Structure

```bash
backend/src/
├── api/
│   ├── routes.py           # 5 new endpoints + 3 new models
│   └── models.py           # SaveMetadata, SaveSlotsResponse, SaveSlotRequest
├── state/
│   └── persistence.py      # 7 new functions (slot management)

frontend/src/
├── components/
│   ├── SaveLoadModal.tsx   # CREATE - Slot selection UI
│   ├── SaveSlot.tsx        # CREATE - Individual slot display
│   ├── MainMenu.tsx        # Enable buttons
│   ├── LocationView.tsx    # Autosave trigger
│   └── WitnessInterview.tsx # Autosave trigger
├── hooks/
│   ├── useSaveSlots.ts     # CREATE - Save slot management
│   └── useInvestigation.ts # Autosave handlers
├── api/
│   └── client.ts           # 5 new functions
└── types/
    └── investigation.ts    # 4 new interfaces
```

**Note**: validation-gates handles test file creation. Don't include tests in structure.

---

## Files to Create/Modify

| File | Action | Purpose | Reference File |
|------|--------|---------|----------------|
| `backend/src/state/persistence.py` | MODIFY | Add 7 slot management functions | Existing functions (save_state, load_state pattern) |
| `backend/src/api/routes.py` | MODIFY | Add 5 slot endpoints + 3 models | Existing endpoints (POST /api/save pattern) |
| `frontend/src/components/SaveLoadModal.tsx` | CREATE | Slot selection UI | BriefingModal.tsx (modal pattern) |
| `frontend/src/components/SaveSlot.tsx` | CREATE | Individual slot display | Card.tsx (display pattern) |
| `frontend/src/hooks/useSaveSlots.ts` | CREATE | Save slot management hook | useInvestigation.ts (hook pattern) |
| `frontend/src/api/client.ts` | MODIFY | Add 5 slot API functions | Existing functions (saveState, loadState pattern) |
| `frontend/src/types/investigation.ts` | MODIFY | Add 4 new interfaces | Existing types (SaveStateRequest pattern) |
| `frontend/src/components/MainMenu.tsx` | MODIFY | Enable Save/Load buttons | Existing button handlers |
| `frontend/src/hooks/useInvestigation.ts` | MODIFY | Add autosave handlers | Existing handleSave method |
| `frontend/src/components/LocationView.tsx` | MODIFY | Autosave after evidence | Existing handleEvidenceDiscovered |
| `frontend/src/components/WitnessInterview.tsx` | MODIFY | Autosave after interrogation | Existing handleQuestionSubmit |

**Note**: Test files handled by validation-gates. Don't list in PRP.

---

## Tasks (Ordered)

### Task 1: Add Backend Slot Management Functions
**File**: `backend/src/state/persistence.py`
**Action**: MODIFY (add 7 new functions)
**Purpose**: Extend persistence layer with slot-based save/load
**Reference**: Existing functions (lines 1-103) - Follow `save_state()` pattern
**Pattern**: Safe save (write to temp, verify, rename), error handling, backward compatibility
**Depends on**: None
**Acceptance criteria**:
- [ ] `save_to_slot(state, slot_id, player_id)` function exists
- [ ] `load_from_slot(case_id, slot_id, player_id)` function exists
- [ ] `list_save_slots(case_id, player_id)` returns list of SaveMetadata
- [ ] `delete_save_slot(case_id, slot_id, player_id)` removes save file
- [ ] `migrate_old_save(case_id, player_id)` migrates `case_001_default.json` → `case_001_default_autosave.json`
- [ ] Safe save pattern: write to `.tmp` file, verify, rename atomically
- [ ] Error handling for disk full, permission denied, corrupted saves
- [ ] Backward compatible: old saves load as autosave slot

**Implementation Guidance**:
```python
# New functions to add

def save_to_slot(state: PlayerState, slot_id: str, player_id: str = "default") -> Path:
    """Save player state to specific slot (safe save pattern)."""
    save_dir = get_saves_dir()
    save_dir.mkdir(parents=True, exist_ok=True)
    save_path = save_dir / f"{state.case_id}_{player_id}_{slot_id}.json"
    temp_path = save_path.with_suffix('.tmp')

    # Write to temp file
    with open(temp_path, "w", encoding="utf-8") as f:
        json.dump(state.model_dump(mode="json"), f, indent=2, default=str)

    # Verify temp file readable
    with open(temp_path, encoding="utf-8") as f:
        verified = json.load(f)
        if not verified.get("state_id"):
            raise ValueError("Save verification failed")

    # Atomic rename
    temp_path.rename(save_path)
    return save_path

def list_save_slots(case_id: str, player_id: str = "default") -> list[SaveMetadata]:
    """List all save slots with metadata."""
    save_dir = get_saves_dir()
    slots = []

    for slot_id in ["slot1", "slot2", "slot3", "autosave"]:
        save_path = save_dir / f"{case_id}_{player_id}_{slot_id}.json"
        if save_path.exists():
            with open(save_path, encoding="utf-8") as f:
                data = json.load(f)
                slots.append({
                    "slot_id": slot_id,
                    "timestamp": data.get("updated_at"),
                    "location": data.get("current_location"),
                    "evidence_count": len(data.get("discovered_evidence", [])),
                    "witnesses_interrogated": len(data.get("witness_states", {})),
                    "progress_percent": calculate_progress(data),
                })

    return slots

def load_from_slot(case_id: str, slot_id: str, player_id: str = "default") -> PlayerState | None:
    """Load player state from specific slot."""
    save_path = get_saves_dir() / f"{case_id}_{player_id}_{slot_id}.json"

    if not save_path.exists():
        return None

    with open(save_path, encoding="utf-8") as f:
        data = json.load(f)

    # Validate required fields
    if not data.get("state_id") or not data.get("case_id"):
        raise ValueError(f"Corrupted save in slot {slot_id}")

    return PlayerState(**data)

def delete_save_slot(case_id: str, slot_id: str, player_id: str = "default") -> bool:
    """Delete save slot."""
    save_path = get_saves_dir() / f"{case_id}_{player_id}_{slot_id}.json"
    if save_path.exists():
        save_path.unlink()
        return True
    return False

def migrate_old_save(case_id: str, player_id: str = "default") -> bool:
    """Migrate old save format to autosave slot."""
    old_path = get_saves_dir() / f"{case_id}_{player_id}.json"
    new_path = get_saves_dir() / f"{case_id}_{player_id}_autosave.json"

    if old_path.exists() and not new_path.exists():
        old_path.rename(new_path)
        return True

    return False
```

---

### Task 2: Add Backend Slot API Endpoints
**File**: `backend/src/api/routes.py`
**Action**: MODIFY (add 5 new endpoints + 3 Pydantic models)
**Purpose**: Expose slot management via REST API
**Reference**: Existing endpoints (lines 566-663) - Follow `POST /api/save` pattern
**Pattern**: Standard FastAPI route with error handling, Pydantic models, logger
**Depends on**: Task 1
**Acceptance criteria**:
- [ ] `GET /api/saves` endpoint lists all slots with metadata
- [ ] `POST /api/saves/{slot_id}` saves to specific slot
- [ ] `GET /api/saves/{slot_id}` loads from specific slot
- [ ] `DELETE /api/saves/{slot_id}` deletes slot
- [ ] `PATCH /api/saves/{slot_id}` renames slot (optional enhancement)
- [ ] SaveMetadata, SaveSlotsResponse, SaveSlotRequest models defined
- [ ] Error handling: 404 (not found), 500 (save failed), 400 (invalid request)
- [ ] Backward compatibility: auto-migrate old saves on first access

**Implementation Guidance**:
```python
# New Pydantic models

class SaveMetadata(BaseModel):
    """Save slot metadata."""
    slot_id: str
    timestamp: str
    location: str
    evidence_count: int
    witnesses_interrogated: int
    progress_percent: int

class SaveSlotsResponse(BaseModel):
    """List of save slots."""
    case_id: str
    slots: list[SaveMetadata]

class SaveSlotRequest(BaseModel):
    """Request to save to specific slot."""
    player_id: str
    case_id: str
    state: dict[str, Any]

class SaveSlotResponse(BaseModel):
    """Response from save slot operation."""
    success: bool
    slot_id: str
    message: str | None = None

# New API endpoints

@router.get("/api/saves", response_model=SaveSlotsResponse)
async def list_saves_endpoint(
    case_id: str = Query(default="case_001"),
    player_id: str = Query(default="default")
):
    """List all save slots with metadata."""
    try:
        # Auto-migrate old saves on first access
        migrate_old_save(case_id, player_id)

        slots = list_save_slots(case_id, player_id)
        return SaveSlotsResponse(case_id=case_id, slots=slots)
    except Exception as e:
        logger.error(f"Failed to list saves: {e}")
        raise HTTPException(status_code=500, detail="Failed to list saves")

@router.post("/api/saves/{slot_id}", response_model=SaveSlotResponse)
async def save_to_slot_endpoint(
    slot_id: str,
    request: SaveSlotRequest
):
    """Save player state to specific slot."""
    try:
        # Load existing state to preserve conversation history (follow routes.py:576-590)
        existing = load_from_slot(request.case_id, slot_id, request.player_id)

        if existing:
            state = existing
            # Update fields from request
            state.current_location = request.state.get("current_location", state.current_location)
            state.discovered_evidence = request.state.get("discovered_evidence", state.discovered_evidence)
            state.visited_locations = request.state.get("visited_locations", state.visited_locations)
        else:
            state = PlayerState(**request.state)

        save_path = save_to_slot(state, slot_id, request.player_id)
        return SaveSlotResponse(success=True, slot_id=slot_id, message="Saved successfully")
    except Exception as e:
        logger.error(f"Failed to save slot {slot_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Save failed: {str(e)}")

@router.get("/api/saves/{slot_id}", response_model=StateResponse)
async def load_from_slot_endpoint(
    slot_id: str,
    case_id: str = Query(default="case_001"),
    player_id: str = Query(default="default")
):
    """Load player state from specific slot."""
    try:
        state = load_from_slot(case_id, slot_id, player_id)
        if not state:
            raise HTTPException(status_code=404, detail=f"Slot {slot_id} not found")

        return StateResponse(
            case_id=state.case_id,
            current_location=state.current_location,
            discovered_evidence=state.discovered_evidence,
            visited_locations=state.visited_locations,
            conversation_history=[msg.model_dump() for msg in state.conversation_history],
        )
    except ValueError as e:
        logger.error(f"Corrupted save in slot {slot_id}: {e}")
        raise HTTPException(status_code=400, detail=f"Corrupted save: {str(e)}")
    except Exception as e:
        logger.error(f"Failed to load slot {slot_id}: {e}")
        raise HTTPException(status_code=500, detail="Load failed")

@router.delete("/api/saves/{slot_id}", response_model=SaveSlotResponse)
async def delete_slot_endpoint(
    slot_id: str,
    case_id: str = Query(default="case_001"),
    player_id: str = Query(default="default")
):
    """Delete save slot."""
    try:
        success = delete_save_slot(case_id, slot_id, player_id)
        if not success:
            raise HTTPException(status_code=404, detail=f"Slot {slot_id} not found")

        return SaveSlotResponse(success=True, slot_id=slot_id, message="Deleted successfully")
    except Exception as e:
        logger.error(f"Failed to delete slot {slot_id}: {e}")
        raise HTTPException(status_code=500, detail="Delete failed")
```

---

### Task 3: Add Frontend API Client Functions
**File**: `frontend/src/api/client.ts`
**Action**: MODIFY (add 5 new functions)
**Purpose**: Wrap backend slot endpoints in typed API client
**Reference**: Existing functions (lines 184-262) - Follow `saveState()` pattern
**Pattern**: Fetch with error handling, type checking, createApiError wrapper
**Depends on**: Task 2
**Acceptance criteria**:
- [ ] `listSaveSlots(caseId, playerId)` function exists
- [ ] `saveToSlot(slotId, playerId, state)` function exists
- [ ] `loadFromSlot(slotId, playerId)` function exists
- [ ] `deleteSaveSlot(slotId, playerId)` function exists
- [ ] All functions use createApiError for error handling
- [ ] TypeScript types match backend models

**Implementation Guidance**:
```typescript
// New types (add to frontend/src/types/investigation.ts)
export interface SaveSlotMetadata {
  slot_id: string;
  timestamp: string;
  location: string;
  evidence_count: number;
  witnesses_interrogated: number;
  progress_percent: number;
}

export interface SaveSlotsResponse {
  case_id: string;
  slots: SaveSlotMetadata[];
}

export interface SaveSlotRequest {
  player_id: string;
  case_id: string;
  state: InvestigationState;
}

export interface SaveSlotResponse {
  success: boolean;
  slot_id: string;
  message?: string;
}

// New API client functions (add to client.ts)
export async function listSaveSlots(
  caseId: string,
  playerId = 'default'
): Promise<SaveSlotsResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/saves?case_id=${encodeURIComponent(caseId)}&player_id=${encodeURIComponent(playerId)}`,
    { method: 'GET' }
  );

  if (!response.ok) {
    throw await createApiError(response);
  }

  return (await response.json()) as SaveSlotsResponse;
}

export async function saveToSlot(
  slotId: string,
  playerId: string,
  caseId: string,
  state: InvestigationState
): Promise<SaveSlotResponse> {
  const request: SaveSlotRequest = {
    player_id: playerId,
    case_id: caseId,
    state,
  };

  const response = await fetch(`${API_BASE_URL}/api/saves/${encodeURIComponent(slotId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await createApiError(response);
  }

  return (await response.json()) as SaveSlotResponse;
}

export async function loadFromSlot(
  slotId: string,
  caseId: string,
  playerId = 'default'
): Promise<LoadResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/saves/${encodeURIComponent(slotId)}?case_id=${encodeURIComponent(caseId)}&player_id=${encodeURIComponent(playerId)}`,
    { method: 'GET' }
  );

  if (response.status === 404) {
    throw new Error(`Slot ${slotId} not found`);
  }

  if (response.status === 400) {
    throw new Error('Corrupted save file');
  }

  if (!response.ok) {
    throw await createApiError(response);
  }

  return (await response.json()) as LoadResponse;
}

export async function deleteSaveSlot(
  slotId: string,
  caseId: string,
  playerId = 'default'
): Promise<SaveSlotResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/saves/${encodeURIComponent(slotId)}?case_id=${encodeURIComponent(caseId)}&player_id=${encodeURIComponent(playerId)}`,
    { method: 'DELETE' }
  );

  if (!response.ok) {
    throw await createApiError(response);
  }

  return (await response.json()) as SaveSlotResponse;
}
```

---

### Task 4: Create useSaveSlots Hook
**File**: `frontend/src/hooks/useSaveSlots.ts`
**Action**: CREATE
**Purpose**: Save slot management hook (list, save, load, delete)
**Reference**: `useInvestigation.ts` (lines 105-240) - Follow hook pattern
**Pattern**: useState for state, useCallback for handlers, error handling
**Depends on**: Task 3
**Acceptance criteria**:
- [ ] `useSaveSlots(caseId, playerId)` hook exists
- [ ] Returns `{ slots, loading, error, listSlots, saveToSlot, loadFromSlot, deleteSlot }`
- [ ] listSlots() fetches all slots from API
- [ ] saveToSlot(slotId, state) saves to specific slot
- [ ] loadFromSlot(slotId) loads from specific slot, returns state
- [ ] deleteSlot(slotId) deletes slot
- [ ] Error handling updates `error` state
- [ ] Loading indicators during async operations

**Implementation Guidance**:
```typescript
// Create frontend/src/hooks/useSaveSlots.ts

import { useState, useCallback } from 'react';
import { listSaveSlots, saveToSlot as saveToSlotAPI, loadFromSlot as loadFromSlotAPI, deleteSaveSlot } from '../api/client';
import { SaveSlotMetadata, InvestigationState, LoadResponse } from '../types/investigation';
import { isApiError } from '../api/errors';

interface UseSaveSlots {
  slots: SaveSlotMetadata[];
  loading: boolean;
  error: string | null;
  listSlots: () => Promise<void>;
  saveToSlot: (slotId: string, state: InvestigationState) => Promise<void>;
  loadFromSlot: (slotId: string) => Promise<LoadResponse>;
  deleteSlot: (slotId: string) => Promise<void>;
  clearError: () => void;
}

export function useSaveSlots(caseId: string, playerId = 'default'): UseSaveSlots {
  const [slots, setSlots] = useState<SaveSlotMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const listSlots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listSaveSlots(caseId, playerId);
      setSlots(response.slots);
    } catch (e) {
      setError(isApiError(e) ? e.message : 'Failed to list saves');
    } finally {
      setLoading(false);
    }
  }, [caseId, playerId]);

  const saveToSlot = useCallback(async (slotId: string, state: InvestigationState) => {
    setLoading(true);
    setError(null);
    try {
      await saveToSlotAPI(slotId, playerId, caseId, state);
      await listSlots(); // Refresh slot list after save
    } catch (e) {
      setError(isApiError(e) ? e.message : 'Save failed');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [caseId, playerId, listSlots]);

  const loadFromSlot = useCallback(async (slotId: string): Promise<LoadResponse> => {
    setLoading(true);
    setError(null);
    try {
      const state = await loadFromSlotAPI(slotId, caseId, playerId);
      return state;
    } catch (e) {
      if (e instanceof Error && e.message.includes('Corrupted')) {
        setError('Save file corrupted. Try another slot or delete this one.');
      } else {
        setError(isApiError(e) ? e.message : 'Load failed');
      }
      throw e;
    } finally {
      setLoading(false);
    }
  }, [caseId, playerId]);

  const deleteSlot = useCallback(async (slotId: string) => {
    setLoading(true);
    setError(null);
    try {
      await deleteSaveSlot(slotId, caseId, playerId);
      await listSlots(); // Refresh slot list after delete
    } catch (e) {
      setError(isApiError(e) ? e.message : 'Delete failed');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [caseId, playerId, listSlots]);

  return { slots, loading, error, listSlots, saveToSlot, loadFromSlot, deleteSlot, clearError };
}
```

---

### Task 5: Create SaveLoadModal Component
**File**: `frontend/src/components/SaveLoadModal.tsx`
**Action**: CREATE
**Purpose**: Modal UI for slot selection (save/load modes)
**Reference**: `BriefingModal.tsx` (lines 1-150) - Follow modal pattern
**Pattern**: Radix Dialog, dark theme, keyboard navigation
**Depends on**: Task 4
**Acceptance criteria**:
- [ ] SaveLoadModal component exists
- [ ] Props: `isOpen`, `onClose`, `mode: 'save' | 'load'`, `onSave(slotId)`, `onLoad(slotId)`
- [ ] Lists all slots using useSaveSlots hook
- [ ] Empty slots show "Empty Slot" placeholder
- [ ] Filled slots show metadata (timestamp, location, progress %)
- [ ] Save mode: clicking filled slot shows confirmation dialog
- [ ] Load mode: clicking empty slot does nothing (button disabled)
- [ ] Autosave slot has special badge "AUTO"
- [ ] Loading state shows spinner
- [ ] Error state shows error message
- [ ] ESC key closes modal

**Implementation Guidance**:
```typescript
// Create frontend/src/components/SaveLoadModal.tsx

import * as Dialog from '@radix-ui/react-dialog';
import { useState, useEffect } from 'react';
import { useSaveSlots } from '../hooks/useSaveSlots';
import { SaveSlot } from './SaveSlot';
import { ConfirmDialog } from './ConfirmDialog';
import { InvestigationState } from '../types/investigation';

interface SaveLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'save' | 'load';
  caseId: string;
  playerId?: string;
  currentState: InvestigationState | null;
  onLoadComplete: (state: InvestigationState) => void;
}

export function SaveLoadModal({
  isOpen,
  onClose,
  mode,
  caseId,
  playerId = 'default',
  currentState,
  onLoadComplete,
}: SaveLoadModalProps) {
  const { slots, loading, error, listSlots, saveToSlot, loadFromSlot, deleteSlot, clearError } = useSaveSlots(caseId, playerId);
  const [confirmSlot, setConfirmSlot] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load slots when modal opens
  useEffect(() => {
    if (isOpen) {
      listSlots();
      setSuccessMessage(null);
      clearError();
    }
  }, [isOpen, listSlots, clearError]);

  const handleSlotClick = async (slotId: string, isFilled: boolean) => {
    if (mode === 'save') {
      if (isFilled) {
        // Show confirmation for overwrite
        setConfirmSlot(slotId);
      } else {
        // Save immediately to empty slot
        await handleSave(slotId);
      }
    } else {
      // Load mode
      if (isFilled) {
        await handleLoad(slotId);
      }
      // Empty slot: do nothing (button disabled)
    }
  };

  const handleSave = async (slotId: string) => {
    if (!currentState) return;

    try {
      await saveToSlot(slotId, currentState);
      setSuccessMessage(`Saved to ${slotId === 'autosave' ? 'Auto-save' : `Slot ${slotId}`}`);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1000);
    } catch (e) {
      // Error handled by hook
    }
  };

  const handleLoad = async (slotId: string) => {
    try {
      const loadedState = await loadFromSlot(slotId);
      onLoadComplete(loadedState as any); // Type conversion handled by parent
      onClose();
    } catch (e) {
      // Error handled by hook
    }
  };

  const handleDelete = async (slotId: string) => {
    try {
      await deleteSlot(slotId);
    } catch (e) {
      // Error handled by hook
    }
  };

  return (
    <>
      <Dialog.Root open={isOpen} onOpenChange={onClose}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900 border-2 border-gray-700 rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto z-50">
            <Dialog.Title className="text-2xl font-bold text-amber-400 mb-4">
              {mode === 'save' ? 'SAVE GAME' : 'LOAD GAME'}
            </Dialog.Title>

            {loading && (
              <div className="text-gray-400 text-center py-8">Loading slots...</div>
            )}

            {error && (
              <div className="bg-red-900/20 border border-red-700 text-red-400 px-4 py-2 rounded mb-4">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="bg-green-900/20 border border-green-700 text-green-400 px-4 py-2 rounded mb-4">
                {successMessage}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {['slot1', 'slot2', 'slot3', 'autosave'].map(slotId => {
                const slotData = slots.find(s => s.slot_id === slotId);
                return (
                  <SaveSlot
                    key={slotId}
                    slotId={slotId}
                    slotData={slotData}
                    mode={mode}
                    onClick={() => handleSlotClick(slotId, !!slotData)}
                    onDelete={slotData ? () => handleDelete(slotId) : undefined}
                  />
                );
              })}
            </div>

            <Dialog.Close asChild>
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-200"
                aria-label="Close"
              >
                ✕
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Confirmation dialog for overwrite */}
      {confirmSlot && (
        <ConfirmDialog
          open={true}
          title="Overwrite Save?"
          message={`This will replace ${confirmSlot === 'autosave' ? 'Auto-save' : `Slot ${confirmSlot}`}. Are you sure?`}
          destructive={true}
          onConfirm={() => {
            handleSave(confirmSlot);
            setConfirmSlot(null);
          }}
          onCancel={() => setConfirmSlot(null)}
        />
      )}
    </>
  );
}
```

---

### Task 6: Create SaveSlot Component
**File**: `frontend/src/components/SaveSlot.tsx`
**Action**: CREATE
**Purpose**: Individual save slot display (filled/empty)
**Reference**: Card.tsx (lines 1-50) - Follow card pattern
**Pattern**: Terminal theme, hover effects, metadata display
**Depends on**: None (UI component)
**Acceptance criteria**:
- [ ] SaveSlot component exists
- [ ] Props: `slotId`, `slotData`, `mode`, `onClick`, `onDelete`
- [ ] Empty slots show "Empty Slot" text, disabled in load mode
- [ ] Filled slots show timestamp (relative: "2 minutes ago"), location, progress bar
- [ ] Autosave slot has badge "AUTO" with amber background
- [ ] Hover effect (border color change)
- [ ] Delete button (X) on hover for manual slots (not autosave)
- [ ] Disabled slots have visual feedback (opacity-50, cursor-not-allowed)

**Implementation Guidance**:
```typescript
// Create frontend/src/components/SaveSlot.tsx

import { SaveSlotMetadata } from '../types/investigation';

interface SaveSlotProps {
  slotId: string;
  slotData?: SaveSlotMetadata;
  mode: 'save' | 'load';
  onClick: () => void;
  onDelete?: () => void;
}

export function SaveSlot({ slotId, slotData, mode, onClick, onDelete }: SaveSlotProps) {
  const isEmpty = !slotData;
  const isDisabled = mode === 'load' && isEmpty;
  const isAutosave = slotId === 'autosave';

  // Format timestamp as relative time
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`relative border-2 rounded-lg p-4 text-left transition-colors
        ${isDisabled
          ? 'border-gray-700 bg-gray-900/50 opacity-50 cursor-not-allowed'
          : 'border-gray-700 bg-gray-900 hover:border-amber-600 cursor-pointer'}
      `}
    >
      {/* Slot header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-amber-400">
          {isAutosave ? 'Auto-save' : `Slot ${slotId.replace('slot', '')}`}
        </h3>
        {isAutosave && (
          <span className="bg-amber-600 text-white px-2 py-1 rounded text-xs font-bold">
            AUTO
          </span>
        )}
        {!isAutosave && onDelete && !isEmpty && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-red-400 hover:text-red-300 text-sm"
            aria-label="Delete save"
          >
            ✕
          </button>
        )}
      </div>

      {/* Slot content */}
      {isEmpty ? (
        <div className="text-gray-500 text-sm">Empty Slot</div>
      ) : (
        <>
          <div className="text-gray-300 text-sm mb-2">
            {slotData.location} • {slotData.evidence_count} evidence • {slotData.witnesses_interrogated} interrogated
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
            <div
              className="bg-amber-600 h-2 rounded-full"
              style={{ width: `${slotData.progress_percent}%` }}
            />
          </div>

          <div className="text-gray-400 text-xs">
            {slotData.progress_percent}% complete • {formatTimestamp(slotData.timestamp)}
          </div>
        </>
      )}
    </button>
  );
}
```

---

### Task 7: Enable MainMenu Save/Load Buttons
**File**: `frontend/src/components/MainMenu.tsx`
**Action**: MODIFY
**Purpose**: Enable Save/Load buttons, open SaveLoadModal
**Reference**: Existing button handlers (lines 50-100)
**Pattern**: useState for modal state, callback handlers
**Depends on**: Task 5
**Acceptance criteria**:
- [ ] "SAVE GAME" button enabled (remove disabled attribute, tooltip)
- [ ] "LOAD GAME" button enabled (remove disabled attribute, tooltip)
- [ ] Clicking "SAVE GAME" opens SaveLoadModal in save mode
- [ ] Clicking "LOAD GAME" opens SaveLoadModal in load mode
- [ ] Modal closes after successful save/load
- [ ] Error handling shows toast notification

**Implementation Guidance**:
```typescript
// Modify frontend/src/components/MainMenu.tsx

import { useState } from 'react';
import { SaveLoadModal } from './SaveLoadModal';

export function MainMenu({ isOpen, onClose, onRestart, currentState, onLoadComplete }: MainMenuProps) {
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [loadModalOpen, setLoadModalOpen] = useState(false);

  const handleSaveGame = () => {
    onClose(); // Close menu
    setSaveModalOpen(true); // Open save modal
  };

  const handleLoadGame = () => {
    onClose(); // Close menu
    setLoadModalOpen(true); // Open load modal
  };

  return (
    <>
      <Dialog.Root open={isOpen} onOpenChange={onClose}>
        {/* ... existing menu structure ... */}

        {/* Change these buttons from disabled to enabled */}
        <button
          className="w-full px-4 py-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white"
          onClick={handleSaveGame}
        >
          2. SAVE GAME
        </button>

        <button
          className="w-full px-4 py-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white"
          onClick={handleLoadGame}
        >
          3. LOAD GAME
        </button>
      </Dialog.Root>

      {/* Save/Load modals */}
      <SaveLoadModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        mode="save"
        caseId="case_001"
        currentState={currentState}
        onLoadComplete={() => {}}
      />

      <SaveLoadModal
        isOpen={loadModalOpen}
        onClose={() => setLoadModalOpen(false)}
        mode="load"
        caseId="case_001"
        currentState={null}
        onLoadComplete={onLoadComplete}
      />
    </>
  );
}
```

---

### Task 8: Add Autosave Handlers to useInvestigation
**File**: `frontend/src/hooks/useInvestigation.ts`
**Action**: MODIFY
**Purpose**: Add autosave functionality (debounced)
**Reference**: Existing handleSave method (lines 150-180)
**Pattern**: useRef for debounce timer, useCallback for handlers
**Depends on**: Task 4
**Acceptance criteria**:
- [ ] `handleAutoSave()` method exists
- [ ] Debounce logic (2s delay, force flag bypasses)
- [ ] Uses useSaveSlots hook internally
- [ ] Saves to "autosave" slot
- [ ] Returns success/failure boolean
- [ ] Shows toast notification on success ("Auto-saved")
- [ ] No toast on failure (silent failure, don't interrupt gameplay)

**Implementation Guidance**:
```typescript
// Modify frontend/src/hooks/useInvestigation.ts

import { useRef } from 'react';
import { useSaveSlots } from './useSaveSlots';

export function useInvestigation(caseId: string, playerId = 'default', autoLoad = true) {
  // ... existing state ...
  const { saveToSlot } = useSaveSlots(caseId, playerId);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastAutosaveTimeRef = useRef<number>(0);
  const AUTOSAVE_DEBOUNCE_MS = 2000;

  const handleAutoSave = useCallback(async (force = false): Promise<boolean> => {
    if (!state) return false;

    const now = Date.now();

    // Check debounce (skip if too soon, unless forced)
    if (!force && now - lastAutosaveTimeRef.current < AUTOSAVE_DEBOUNCE_MS) {
      console.log('Autosave debounced (too soon)');
      return false;
    }

    // Clear existing timeout
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    // Set new timeout (or execute immediately if forced)
    const executeAutosave = async () => {
      try {
        await saveToSlot('autosave', {
          case_id: state.case_id,
          current_location: state.current_location,
          discovered_evidence: state.discovered_evidence,
          visited_locations: state.visited_locations,
        });
        lastAutosaveTimeRef.current = Date.now();

        // Show toast notification (optional - can be silent)
        // toast('Auto-saved', { duration: 1000 });

        return true;
      } catch (e) {
        console.error('Autosave failed:', e);
        // Don't show error toast (silent failure)
        return false;
      }
    };

    if (force) {
      return await executeAutosave();
    } else {
      autosaveTimeoutRef.current = setTimeout(executeAutosave, AUTOSAVE_DEBOUNCE_MS);
      return true;
    }
  }, [state, saveToSlot]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, []);

  return {
    // ... existing return values ...
    handleAutoSave,
  };
}
```

---

### Task 9: Add Autosave Trigger to LocationView
**File**: `frontend/src/components/LocationView.tsx`
**Action**: MODIFY
**Purpose**: Autosave after evidence discovery
**Reference**: Existing handleEvidenceDiscovered (lines 200-220)
**Pattern**: Call handleAutoSave after evidence added
**Depends on**: Task 8
**Acceptance criteria**:
- [ ] After evidence discovered, call `handleAutoSave()` (debounced)
- [ ] No blocking UI (async background operation)
- [ ] No error notification if autosave fails (silent)

**Implementation Guidance**:
```typescript
// Modify frontend/src/components/LocationView.tsx

// After evidence discovery (existing handleEvidenceDiscovered)
const handleEvidenceDiscovered = useCallback((evidenceIds: string[]) => {
  // ... existing evidence handling ...
  onEvidenceDiscovered(evidenceIds);

  // Trigger autosave (debounced 2s)
  handleAutoSave(false); // Don't force, use debounce
}, [onEvidenceDiscovered, handleAutoSave]);
```

---

### Task 10: Add Autosave Trigger to WitnessInterview
**File**: `frontend/src/components/WitnessInterview.tsx`
**Action**: MODIFY
**Purpose**: Autosave after witness interrogation complete
**Reference**: Existing handleQuestionSubmit (lines 150-180)
**Pattern**: Call handleAutoSave after question answered
**Depends on**: Task 8
**Acceptance criteria**:
- [ ] After witness response received, call `handleAutoSave()` (debounced)
- [ ] No blocking UI (async background operation)
- [ ] No error notification if autosave fails (silent)

**Implementation Guidance**:
```typescript
// Modify frontend/src/components/WitnessInterview.tsx

// After witness response received (existing handleQuestionSubmit)
const handleQuestionSubmit = useCallback(async (question: string) => {
  // ... existing interrogation logic ...

  // After response received
  setConversation(prev => [...prev, userMessage, witnessMessage]);

  // Trigger autosave (debounced 2s)
  handleAutoSave(false); // Don't force, use debounce
}, [handleAutoSave]);
```

---

### Task 11: Add Autosave Trigger to VerdictSubmission
**File**: `frontend/src/components/VerdictSubmission.tsx`
**Action**: MODIFY
**Purpose**: Autosave after verdict submitted (force, no debounce)
**Reference**: Existing handleSubmit (lines 100-130)
**Pattern**: Call handleAutoSave with force=true
**Depends on**: Task 8
**Acceptance criteria**:
- [ ] After verdict submitted, call `handleAutoSave(true)` (force, bypass debounce)
- [ ] No blocking UI (async background operation)
- [ ] No error notification if autosave fails (silent)

**Implementation Guidance**:
```typescript
// Modify frontend/src/components/VerdictSubmission.tsx

// After verdict submitted (existing handleSubmit)
const handleSubmit = useCallback(async (verdict: Verdict) => {
  // ... existing verdict submission logic ...

  // After verdict response received
  setVerdictResponse(response);

  // Trigger autosave (FORCE, bypass debounce)
  handleAutoSave(true); // Critical event, force save immediately
}, [handleAutoSave]);
```

---

## Integration Points

### Backend API
**Where**: `backend/src/api/routes.py`
**What**: Add 5 new endpoints after existing save/load routes (lines 566-663)
**Pattern**: Follow existing `/api/save`, `/api/load` pattern (error handling, Pydantic models, logger)

**New Endpoints**:
- `GET /api/saves` - List all slots with metadata
- `POST /api/saves/{slot_id}` - Save to specific slot
- `GET /api/saves/{slot_id}` - Load from specific slot
- `DELETE /api/saves/{slot_id}` - Delete slot
- `PATCH /api/saves/{slot_id}` - Rename slot (optional)

### Frontend API Client
**Where**: `frontend/src/api/client.ts`
**What**: Add 5 new functions after existing `saveState()`, `loadState()` (lines 184-262)
**Pattern**: Fetch with error handling, type checking, createApiError wrapper

**New Functions**:
- `listSaveSlots(caseId, playerId)` → SaveSlotsResponse
- `saveToSlot(slotId, playerId, state)` → SaveSlotResponse
- `loadFromSlot(slotId, playerId)` → LoadResponse
- `deleteSaveSlot(slotId, playerId)` → SaveSlotResponse

### Frontend State Management
**Where**: `frontend/src/hooks/useInvestigation.ts`
**What**: Add autosave handlers (handleAutoSave method)
**Pattern**: useRef for debounce timer, useCallback for handlers, same as existing handleSave

**New Methods**:
- `handleAutoSave(force?: boolean)` - Autosave to autosave slot (debounced 2s, force bypasses)

---

## Known Gotchas

### High Priority

**localStorage Quota (5-10MB)**:
- **Issue**: Browser storage limit varies (5MB mobile, 10MB desktop). QuotaExceededError thrown on overflow.
- **Solution**: Test save size (<1MB per save). Show "Storage full, delete old saves" error to user.
- **Reference**: DOCS-RESEARCH Pattern 1, DOCS-RESEARCH Pattern 3

**Private Browsing Mode (0 quota)**:
- **Issue**: Private/incognito mode = 0 storage quota. localStorage writes fail silently or throw errors.
- **Solution**: Test availability: `localStorage.setItem('test', 'test'); localStorage.removeItem('test');` on app load.
- **Reference**: DOCS-RESEARCH Pattern 3

**JSON.parse Corruption**:
- **Issue**: Corrupted saves (partial write, browser crash) cause JSON.parse to throw SyntaxError.
- **Solution**: Wrap ALL localStorage.getItem + JSON.parse in try/catch. Delete corrupted save, show recovery UI.
- **Reference**: DOCS-RESEARCH Pattern 2, GITHUB-RESEARCH shapez.io Pattern 4

**Pydantic mode="json" Required**:
- **Issue**: `PlayerState.model_dump()` without mode="json" fails to serialize datetime fields.
- **Solution**: ALWAYS use `state.model_dump(mode="json")` in persistence.py.
- **Reference**: CODEBASE-RESEARCH Part 8

### Medium Priority

**Concurrent Save Corruption**:
- **Issue**: User presses Save twice quickly → two simultaneous file writes → corrupted save.
- **Solution**: Add `save_in_progress` flag. Block second save if first still writing. OR use atomic write (write to .tmp, rename).
- **Reference**: CODEBASE-RESEARCH Part 8, GITHUB-RESEARCH shapez.io Pattern 2

**Autosave Debounce Critical**:
- **Issue**: Evidence discovery triggers autosave. Rapid evidence discovery (5 items in 3s) = 5 saves = performance hit.
- **Solution**: Debounce 2s (useRef + setTimeout). Force save on verdict submission (critical event).
- **Reference**: DOCS-RESEARCH Pattern 2, DOCS-RESEARCH Pattern 3

**Backward Compatibility Migration**:
- **Issue**: Existing saves use `{case_id}_{player_id}.json`. New system uses `{case_id}_{player_id}_slot1.json`.
- **Solution**: On first load, check for old save. If exists, rename to `_autosave.json`. Log migration for debugging.
- **Reference**: CODEBASE-RESEARCH Part 8

**File I/O Error Handling**:
- **Issue**: No error handling in persistence.py for disk full, permission denied, network drive disconnected.
- **Solution**: Wrap file operations in try/except. Catch OSError, IOError. Show user-friendly error ("Save failed, check disk space").
- **Reference**: CODEBASE-RESEARCH Part 8

### Low Priority

**SaveMetadata Separate from GameState**:
- **Issue**: Loading full PlayerState (9.1KB) just to show timestamp/progress in UI is slow.
- **Solution**: Store metadata separate (fast load). Option 1: separate `.meta` file. Option 2: embed in save, extract only metadata.
- **Reference**: GITHUB-RESEARCH Ren'Py Pattern 1

**Cross-Tab Sync (Optional)**:
- **Issue**: Player opens game in 2 tabs. Save in Tab A doesn't update Tab B slot list.
- **Solution**: Listen to StorageEvent (fires on other tabs). Refresh slot list when storage changes.
- **Reference**: DOCS-RESEARCH Pattern 3

**Save File Versioning (Future)**:
- **Issue**: Phase 5.4+ changes PlayerState structure. Old saves incompatible.
- **Solution**: Add `version: "1.0.0"` to save format. Implement migration chain (v1.0 → v1.1 → v2.0).
- **Reference**: GITHUB-RESEARCH shapez.io Pattern 3, DOCS-RESEARCH Pattern 2

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
bun run type-check
bun run lint
# Expected: No errors
```

### Unit Tests
```bash
# Backend (691+ tests expected)
cd backend
uv run pytest
# Expected: All tests pass, 0 regressions

# Frontend (466+ tests expected)
cd frontend
bun test
# Expected: All tests pass, 0 regressions
```

### Manual Verification Checklist

**Save Flow**:
- [ ] Open menu (ESC) → click "SAVE GAME"
- [ ] Modal opens, shows 3 empty slots + 1 autosave
- [ ] Click empty slot → save created, success toast shown
- [ ] Click filled slot → confirmation dialog appears
- [ ] Confirm overwrite → save updated, success toast shown
- [ ] Close modal → menu reopens (not game)

**Load Flow**:
- [ ] Open menu (ESC) → click "LOAD GAME"
- [ ] Modal opens, shows slots with metadata (timestamp, location, progress %)
- [ ] Click empty slot → nothing happens (button disabled)
- [ ] Click filled slot → game loads, investigation view restores
- [ ] All state restored: evidence, witnesses, conversation history, spells

**Autosave**:
- [ ] Discover evidence → wait 2s → toast "Auto-saved" appears
- [ ] Discover 3 evidence rapidly (<2s apart) → only 1 autosave after 2s delay
- [ ] Interrogate witness → wait 2s → autosave triggers
- [ ] Submit verdict → autosave immediate (no 2s delay)

**Backward Compatibility**:
- [ ] Old save (`case_001_default.json`) exists
- [ ] Load game → old save appears as "Auto-save" slot
- [ ] Load old save → game state restores correctly
- [ ] Old save file renamed to `case_001_default_autosave.json` after migration

**Error Handling**:
- [ ] Corrupt save (manually edit JSON to invalid format)
- [ ] Load corrupted slot → error dialog "Save file corrupted, delete?"
- [ ] Confirm delete → slot removed, modal refreshes
- [ ] Fill all 4 slots, save again → no quota error (saves are small enough)

**UI/UX**:
- [ ] Autosave badge "AUTO" visible on autosave slot
- [ ] Progress bar shows correct percentage (evidence count / 15 for Case 001)
- [ ] Timestamp shows relative time ("2 minutes ago", not ISO string)
- [ ] Empty slots show "Empty Slot" placeholder
- [ ] Delete button (X) appears on hover for manual slots (not autosave)
- [ ] ESC key closes modal
- [ ] Loading spinner shows during async operations

---

## Dependencies

**No New NPM Dependencies Required**:
- React 18 (already installed)
- Radix UI Dialog (already installed in Phase 5.1)
- Tailwind CSS (already installed)

**No New Python Dependencies Required**:
- FastAPI (already installed)
- Pydantic (already installed)
- pathlib (built-in)
- json (built-in)

---

## Out of Scope

**Cloud Saves** (Phase 6+ feature):
- No backend sync to server
- No cross-device save sync
- No account system integration

**Import/Export** (Phase 5.4+ enhancement):
- No "Export Save" button (download JSON file)
- No "Import Save" button (upload JSON file)
- Pattern documented in GITHUB-RESEARCH GameSaveSystem Pattern 2

**Save Compression** (Phase 5.4+ optimization):
- No gzip/lz4 compression for large saves
- Pattern documented if Phase 6 save files exceed 1MB

**Save Slot Pagination** (Phase 6+ enhancement):
- Fixed 3 manual slots + 1 autosave (not unlimited)
- Pagination pattern documented in GITHUB-RESEARCH Ren'Py Pattern 2

**Save Naming/Renaming** (Phase 5.4+ polish):
- No custom save names ("Slot 1 - Before verdict")
- Auto-generated names only (Slot 1, Slot 2, etc.)
- Pattern documented in GITHUB-RESEARCH Ren'Py Pattern 3

---

## Agent Orchestration Plan

### Execution Strategy

**Sequential Track** (dependencies):
1. `fastapi-specialist` → Backend changes (Tasks 1-2)
2. `react-vite-specialist` → Frontend implementation (Tasks 3-11)
3. `validation-gates` → Run all tests
4. `documentation-manager` → Update docs

**Why Sequential**: Backend must exist before frontend can integrate.

### Agent-Specific Guidance

#### For fastapi-specialist
- **Input**: Tasks 1-2 (backend slot management + API endpoints)
- **Context**: Quick Reference section above (no doc reading needed)
- **Pattern**: Follow existing `persistence.py` and `routes.py` patterns (safe save, error handling)
- **Integration**: Extend existing save/load system, backward compatible
- **Output**: 5 new endpoints, 7 new persistence functions, 3 new Pydantic models

**Key Files to Reference**:
- `backend/src/state/persistence.py` (existing functions lines 1-103)
- `backend/src/api/routes.py` (existing endpoints lines 566-663)
- `backend/src/state/player_state.py` (PlayerState structure lines 297-445)

#### For react-vite-specialist
- **Input**: Tasks 3-11 (frontend slot UI + autosave integration)
- **Context**: Quick Reference section above (no doc reading needed)
- **Pattern**: Follow existing Modal, Button, Hook patterns from codebase
- **Integration**: Enable MainMenu buttons, add SaveLoadModal, extend useInvestigation
- **Output**: Save/Load modal functional, autosave triggers working

**Key Files to Reference**:
- `frontend/src/components/BriefingModal.tsx` (modal pattern)
- `frontend/src/hooks/useInvestigation.ts` (hook pattern)
- `frontend/src/api/client.ts` (API client pattern)

#### For validation-gates
- **Input**: All code complete
- **Runs**: Tests, lint, type check, build
- **Output**: Pass/fail report
- **Note**: validation-gates creates tests if needed

#### For documentation-manager
- **Input**: Code complete, validation passed
- **Files changed**: List from "Files to Create/Modify" section
- **Output**: Updated README, CHANGELOG, STATUS

### Handoff Context

**Next agent receives**:
- This PRP (full context)
- Quick Reference (no doc reading needed)
- Specific task numbers
- Actual file paths to modify
- Pattern files to follow

**Next agent does NOT need**:
- ❌ Read research files
- ❌ Search for examples
- ❌ Read 5-10 docs (Quick Reference has everything)
- ❌ Explore codebase (integration points provided)

---

## Anti-Patterns to Avoid

**From project experience**:
- ❌ Using `model_dump()` without `mode="json"` (datetime serialization fails)
- ❌ Not wrapping JSON.parse in try/catch (corrupted saves crash game)
- ❌ Autosave without debouncing (spams localStorage, performance hit)
- ❌ Ignoring QuotaExceededError (silent failure, data loss)
- ❌ Not migrating old saves (backward incompatibility, user frustration)
- ❌ Showing error toasts on autosave failure (interrupts gameplay)
- ❌ Blocking UI during save/load (async operations should be background)

---

## Unresolved Questions

None - All design decisions made based on research and project requirements.

---

**Generated**: 2026-01-12
**Source**: Research files (GitHub, Codebase, Docs) + project documentation
**Confidence Score**: 9/10 (likelihood of one-pass implementation success)
**Alignment**: Validated against PLANNING.md Phase 5.3 milestone, game design principles
