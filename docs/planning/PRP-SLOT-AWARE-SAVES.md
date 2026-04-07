# Slot-Aware Saves with Anonymous UUID — PRP

## Goal
Make saves actually work: each browser gets a unique ID, each save slot is a separate file on the server. Backend is the source of truth. No auth required.

## Why
- Current system broken: all 26 `load_state()` calls read one file regardless of slot
- All users share `player_id="default"` — saves collide
- localStorage migration created a disconnected frontend/backend state

## What

**User-Visible:**
- First visit: invisible UUID generated, stored in localStorage
- 4-slot save system works correctly (different slots = different game state)
- Export/import buttons stay (download/upload server save as JSON)
- No login, no signup, nothing visible changes

**Technical:**
- Frontend generates UUID on first visit → sends as `player_id` with every request
- Frontend tracks active `slot` → sends with every request
- Backend uses `load_player_state(case_id, player_id, slot)` → per-user per-slot files
- Backend remains source of truth — no localStorage save system

**Success Criteria:**
- [ ] Save to slot_1, play more, load slot_1 → state reverts (different conversation, evidence, etc.)
- [ ] Two browsers get different UUIDs, saves don't collide
- [ ] Export downloads correct slot's data; import restores it
- [ ] All existing tests pass
- [ ] Build clean (0 TS errors)

---

## Architecture

```
Browser localStorage:
  hp_player_id = "abc-123"        ← generated once, persists
  hp_active_slot = "autosave"     ← changes on save/load

Every API request includes:
  { player_id: "abc-123", slot: "autosave", ... }

Backend saves/:
  abc-123/
    case_001_abc-123_autosave.json     ← active play state
    case_001_abc-123_slot_1.json       ← manual save 1
    case_001_abc-123_slot_2.json       ← manual save 2
```

---

## Quick Reference

**Existing slot-aware functions in `persistence.py` (ALREADY EXIST, just unused):**
```python
save_player_state(case_id, player_id, state, slot)  # atomic write with temp file
load_player_state(case_id, player_id, slot)          # returns PlayerState | None
delete_player_save(case_id, player_id, slot)         # delete slot file
get_save_metadata(case_id, player_id, slot)           # slot metadata for UI
list_player_saves(player_id)                          # list all slots
VALID_SLOTS = {"slot_1", "slot_2", "slot_3", "autosave", "default"}
```

**New helper functions (add to `helpers.py`):**
```python
def load_slot_state(case_id: str, player_id: str, slot: str = "autosave") -> PlayerState | None:
    """Load state from slot-aware persistence."""
    return load_player_state(case_id, player_id, slot)

def save_slot_state(state: PlayerState, player_id: str, slot: str = "autosave") -> None:
    """Save state to slot-aware persistence."""
    save_player_state(state.case_id, player_id, state, slot)
```

Update `load_or_create_state`:
```python
def load_or_create_state(case_id, player_id, case_data, slot="autosave") -> PlayerState:
    state = load_slot_state(case_id, player_id, slot)
    if state is None:
        first_location = get_first_location_id(case_data)
        state = PlayerState(case_id=case_id, current_location=first_location)
    return state
```

**Frontend UUID generation (add to App.tsx or a utils file):**
```typescript
function getOrCreatePlayerId(): string {
  const KEY = "hp_player_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
```

**Frontend active slot tracking:**
```typescript
// Track which slot is active (changes on save/load)
const [activeSlot, setActiveSlot] = useState<string>("autosave");

// Every API call sends both:
{ player_id: playerId, slot: activeSlot, ... }
```

**Persistence directory change** — saves go in per-player subdirectory:
```python
# _get_slot_save_path needs update:
# Before: saves/case_001_default_slot_1.json
# After:  saves/{player_id}/case_001_{player_id}_{slot}.json
def _get_slot_save_path(case_id, player_id, slot, saves_dir=None):
    save_dir = (saves_dir or SAVES_DIR) / player_id
    save_dir.mkdir(parents=True, exist_ok=True)
    return save_dir / f"{case_id}_{player_id}_{slot}.json"
```

---

## Files to Modify

**Backend:**

| File | Change |
|------|--------|
| `backend/src/api/schemas.py` | Add `slot: str = "autosave"` to 8 request models |
| `backend/src/api/helpers.py` | Add `load_slot_state`/`save_slot_state`, update `load_or_create_state` + `save_conversation_and_return` + `resolve_location` |
| `backend/src/api/routes/investigation.py` | `load_state` → `load_slot_state`, `save_state` → `save_slot_state` |
| `backend/src/api/routes/witnesses.py` | Same pattern, 5 load + 4 save sites |
| `backend/src/api/routes/verdict.py` | Same pattern, 1 site |
| `backend/src/api/routes/briefing.py` | Same pattern, 3 load + 2 save sites |
| `backend/src/api/routes/inner_voice.py` | Same pattern, 3 sites |
| `backend/src/api/routes/evidence.py` | Same pattern, 3 load sites (read-only) |
| `backend/src/api/routes/saves.py` | Already slot-aware, update to use new helpers |
| `backend/src/state/persistence.py` | Update `_get_slot_save_path` for per-player subdirectories, add "autosave" to VALID_SLOTS if missing |
| `backend/tests/` | Update tests to pass `slot` param |

**Frontend:**

| File | Change |
|------|--------|
| `frontend/src/App.tsx` | Generate UUID, track activeSlot, pass to hooks, revert localStorage autosave |
| `frontend/src/api/client.ts` | Add `slot` param to all API call functions |
| `frontend/src/hooks/useInvestigation.ts` | Revert to server-side load/save, pass `slot` |
| `frontend/src/hooks/useWitnessInterrogation.ts` | Add `slot` to interrogate/present-evidence calls |
| `frontend/src/components/LocationView.tsx` | Pass `slot` to investigate calls, remove localStorage autosave |
| `frontend/src/components/SaveLoadModal.tsx` | Keep export/import, remove localStorage save/load |
| `frontend/src/api/localSaves.ts` | DELETE — no longer needed |

---

## Implementation Phases

### Phase 1 — Backend: slot-aware helpers (no breaking change)

1. In `persistence.py`: update `_get_slot_save_path` to use per-player subdirectory. Verify "autosave" is in VALID_SLOTS.

2. In `helpers.py`: add `load_slot_state(case_id, player_id, slot)` and `save_slot_state(state, player_id, slot)`. Update `load_or_create_state` to accept and pass `slot`. Update `save_conversation_and_return` to accept and pass `slot`.

3. In `schemas.py`: add `slot: str = Field(default="autosave", pattern=r"^[a-zA-Z0-9_]+$")` to all request models that have `player_id`. Add `slot` as query param on GET endpoints that take `player_id`.

All default to `"autosave"` — existing behavior unchanged until frontend sends explicit slot.

### Phase 2 — Backend: route migration (mechanical, per-file)

For each route file, replace:
```python
# Before
state = load_state(body.case_id, body.player_id)
save_state(state, body.player_id)

# After
state = load_slot_state(body.case_id, body.player_id, body.slot)
save_slot_state(state, body.player_id, body.slot)
```

For `load_or_create_state` calls:
```python
# Before
state = load_or_create_state(body.case_id, body.player_id, case_data)

# After
state = load_or_create_state(body.case_id, body.player_id, case_data, body.slot)
```

For GET endpoints with `player_id` query param, add `slot: str = "autosave"` query param.

Order: investigation.py → witnesses.py → briefing.py → inner_voice.py → verdict.py → evidence.py → saves.py

### Phase 3 — Frontend: UUID + slot tracking

1. Create `getOrCreatePlayerId()` utility — generates UUID, stores in localStorage.

2. In App.tsx: use `getOrCreatePlayerId()` instead of `PLAYER_ID = "default"`. Track `activeSlot` state (default: `"autosave"`). On save: `setActiveSlot(slot)`. On load: `setActiveSlot(slot)`.

3. Pass `playerId` and `activeSlot` down to all hooks and components that make API calls.

### Phase 4 — Frontend: wire slot into API calls

1. `client.ts`: add `slot` param to `investigateStream`, `interrogateStream`, `submitVerdict`, `askBriefingQuestion`, `changeLocation`, `saveState`, `loadState`, etc.

2. `useInvestigation.ts`: revert to server-side `loadState()` (remove `loadFromLocalStorage` call). Pass `slot` to all API calls.

3. `useWitnessInterrogation.ts`: pass `slot` to interrogate/present-evidence calls.

4. `LocationView.tsx`: pass `slot` to `investigateStream`. Remove `saveToLocalStorage` autosave from `onDone`.

5. `SaveLoadModal.tsx`: revert to server API for save/load/list/delete. Keep export/import buttons (download server save as file).

### Phase 5 — Cleanup

1. Delete `frontend/src/api/localSaves.ts`.
2. Remove `loadFromLocalStorage`/`saveToLocalStorage` imports everywhere.
3. Remove `navigator.storage.persist()` (only protected UUID now, optional to keep).
4. Clean up old `saves/*.json` files that used flat naming.

---

## Testing Strategy

**Backend:**
- Test `load_slot_state`/`save_slot_state` with different player_ids and slots → different files
- Test two player_ids saving to same slot → no collision (different directories)
- Test UUID-format player_id passes `_validate_identifier`
- Run existing test suite — all should pass with `slot="autosave"` default

**Frontend:**
- Build must pass (0 TS errors)
- Manual: save slot_1, play more, load slot_1 → state reverts
- Manual: open incognito → different UUID → no access to first browser's saves
- Manual: export slot_1 → download JSON → delete slot_1 → import → restored

---

## Unresolved Questions

1. Migrate existing `saves/case_001_default.json` to new format? Suggest: leave them, new UUIDs create new files. Old data accessed only by `player_id="default"`.
2. Clean up orphaned save directories? Not urgent — revisit when adding DB.
3. Keep `updated_state` in responses? Suggest: keep, costs nothing, useful for future optimistic UI.
4. Max save directories per server? At scale this is a concern, but file-based saves will be replaced by DB before that matters.
