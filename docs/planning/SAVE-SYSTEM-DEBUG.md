# Save System Debug Log

## Architecture

```
Browser (UUID in localStorage) → API requests with player_id + slot → Backend saves to:
  saves/{player_id}/{case_id}_{player_id}_{slot}.json
```

- **player_id**: UUID generated via `crypto.randomUUID()`, stored in `localStorage.hp_player_id`
- **slot**: "autosave" (default active play), "slot_1"/"slot_2"/"slot_3" (manual saves)
- **Strategy**: All gameplay autosaves to "autosave" slot. Manual "SAVE HERE" snapshots autosave → named slot.
- **Backend**: slot-aware `save_player_state`/`load_player_state` in `persistence.py`
- **Frontend**: `getOrCreatePlayerId()` in `utils/playerId.ts`, passed through App → hooks

---

## Current Status

| Flow | Status | Notes |
|------|--------|-------|
| Autosave (all gameplay actions) | **WORKS** | All API calls pass `player_id` + `slot: 'autosave'` |
| Initial state load on mount | **WORKS** | useInvestigation loads from autosave slot |
| All streaming/action endpoints | **WORKS** | slot + player_id wired through all client.ts functions |
| **Manual Save (SAVE HERE)** | **TESTING** | Fixed: named slots now snapshot full autosave state |
| **Manual Load (LOAD)** | **TESTING** | Fixed: backend copies named slot → autosave on load |

---

## All Fixes Applied

### Session 1: Backend + Core Frontend
1. Backend `persistence.py` — per-player subdirectories (`saves/{player_id}/`)
2. Backend `helpers.py` — `load_slot_state`/`save_slot_state` wrappers
3. Backend `schemas.py` — `slot` field on all 8 request models
4. Backend all 7 route files — migrated to slot-aware persistence
5. Frontend `utils/playerId.ts` — UUID generation
6. Frontend `App.tsx` — UUID player_id, slot tracking, session persistence
7. Frontend `client.ts` — slot in saveGameState body (was query param), loadState default "autosave"
8. Frontend `useSaveSlots.ts` — server API instead of localStorage
9. Frontend `SaveLoadModal.tsx` — server export/import, playerId prop, button styling
10. Frontend Zod schemas — added missing fields (witnesses_interrogated, progress_percent, case_id)
11. Frontend types — SaveSlotMetadata, DeleteSlotResponse updated
12. Deleted `localSaves.ts`
13. Renamed backup YAML files to `.yaml.bak`
14. Fixed load flow — SESSION_KEY updated before reload
15. Fixed reset endpoint — accepts player_id query param

### Session 2: slot + player_id in ALL API calls
16. `investigation.ts` types — added `slot?: string` to all request types
17. `LocationView.tsx` — added `playerId` prop, passes `player_id` + `slot: 'autosave'` to investigateStream
18. `App.tsx` — wired `playerId` prop to `<LocationView>`
19. `useWitnessInterrogation.ts` — `slot: 'autosave'` in interrogateStream + presentEvidence calls
20. `client.ts` — added `slot` to ALL remaining API functions (submit verdict, briefing, tom chat, inner voice, evidence, witnesses, change location)

### Session 2: Manual save/load fixes
21. Backend `saves.py` `save_game` — named slots now always snapshot autosave (not partial InvestigationState)
22. Backend `saves.py` `load_game` — loading from named slot copies full state → autosave
23. Frontend `App.tsx` — both load handlers set SESSION_KEY to `slot: "autosave"` after load (since backend already copied)
24. Deleted stale slot files that had broken partial state from before fix

---

## Root Causes Found & Fixed

### Issue 1: Autosave not per-player (Session 1)
All players shared `saves/case_001_default_autosave.json`. Fixed with UUID player_id + per-player subdirectories.

### Issue 2: Frontend not sending slot/player_id (Session 2)
Frontend TypeScript types lacked `slot` field. Backend defaulted to `player_id="default"`, `slot="autosave"`. Fixed by adding slot to all API calls.

### Issue 3: Manual save only saved stripped state (Session 2)
`saveGameState` sent only `InvestigationState` (5 fields: case_id, location, evidence, visited, verbosity). Named slots got a `PlayerState` created from this partial data — missing conversation_history, witness_states, briefing_state, etc.

**Root cause**: Backend `save_game` created `PlayerState(**request.state)` from partial data for new slots, or merged partial into existing broken state.

**Fix**: Named slots ALWAYS copy full state from autosave. Named slots = snapshots, not independent states.

### Issue 4: Manual load didn't copy to autosave (Session 2)
After loading from slot_1, SESSION_KEY stored `slot: "slot_1"`. But all gameplay saved to autosave. On reload, app loaded stale slot_1 instead of current autosave.

**Fix**: Backend copies named slot → autosave on load. Frontend sets SESSION_KEY to "autosave" after any load.

---

## Design Decision (Confirmed)

**"Always autosave" strategy**:
- All gameplay actions save to "autosave" slot
- Manual "SAVE HERE" = snapshot autosave → named slot (full copy)
- Manual "LOAD" = copy named slot → autosave, then reload from autosave
- SESSION_KEY always uses `slot: "autosave"` after any load
- Named slots are immutable snapshots until overwritten by user
