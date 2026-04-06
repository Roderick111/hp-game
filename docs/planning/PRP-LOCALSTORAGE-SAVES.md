# localStorage Save Migration - PRP

## Goal
Move game saves from server-side JSON files to browser localStorage. Backend becomes stateless regarding persistence — it processes actions and returns updated state, frontend owns all storage.

## Why
- **User value**: Saves survive server restarts/redeploys; no user data on server; enables offline-style resilience
- **Aligns with**: Phase 7 (Production Readiness) — BYOK + free-tier model means users own their data

## What

**User-Visible Behavior:**
- 4-slot save UI unchanged (slot_1, slot_2, slot_3, autosave)
- New "Export Save" button (downloads .json) and "Import Save" button (uploads .json) in SaveLoadModal
- Save/load is instantaneous (no network round-trip)
- Autosave still works silently every 30s

**Technical Requirements:**
- Backend: All game endpoints return full updated `PlayerState` in response
- Backend: Remove server-side save/load/delete endpoints (or stub with 410 Gone)
- Frontend: `useSaveSlots` reads/writes localStorage instead of calling API
- Frontend: Export = `JSON.stringify` + `URL.createObjectURL` download; Import = `<input type="file">` + Zod validate + store
- Frontend: Call `navigator.storage.persist()` on app startup (one-time)

**Success Criteria:**
- [ ] All game actions (investigate, interrogate, verdict, briefing) return `updated_state: PlayerState` in response
- [ ] `useSaveSlots` uses zero network calls — pure localStorage
- [ ] Export downloads valid `.json`; Import restores game state correctly
- [ ] `navigator.storage.persist()` called on mount
- [ ] Existing 4-slot UX unchanged
- [ ] Frontend tests pass; backend tests pass; lint clean

---

## Architecture: Before vs After

**Before:**
```
frontend action → POST /api/investigate → backend mutates state → saves to disk
frontend save   → POST /api/save        → writes case_{id}_{player_id}_{slot}.json
frontend load   → POST /api/load        → reads from disk → returns state
```

**After:**
```
frontend action → POST /api/investigate → backend mutates state → returns updated_state
frontend        → receives updated_state → saves to localStorage[hp_save_{caseId}_{slot}]
frontend save   → pure localStorage.setItem (no network)
frontend load   → pure localStorage.getItem (no network)
export          → JSON.stringify(state) → file download
import          → file upload → Zod validate → localStorage.setItem
```

---

## Quick Reference

**localStorage key schema:**
```typescript
// Save data (per slot)
const SAVE_KEY = (caseId: string, slot: string) => `hp_save_${caseId}_${slot}`;
// e.g. "hp_save_case_001_slot_1", "hp_save_case_001_autosave"

// Slot metadata index (for UI listing)
const META_KEY = (caseId: string) => `hp_saves_meta_${caseId}`;
// Value: JSON array of SaveSlotMetadata

// Existing keys (DO NOT CHANGE)
// "hp-detective-active-session" → {caseId, slot}
// "hp_llm_settings"            → LLM BYOK config
// "hp_theme"                   → theme
// "hp_music_*"                 → music settings
```

**Metadata computed from state (replaces server-side `get_save_metadata`):**
```typescript
function computeSlotMetadata(state: InvestigationState, slot: string): SaveSlotMetadata {
  return {
    slot,
    case_id: state.case_id,
    timestamp: new Date().toISOString(),
    location: state.current_location,
    evidence_count: state.discovered_evidence.length,
    witnesses_interrogated: Object.keys(state.witness_states ?? {}).length,
    progress_percent: Math.min(100, Math.round((state.discovered_evidence.length / 15) * 100)),
    version: state.version ?? "1.0.0",
  };
}
```

**Backend response pattern — add `updated_state` to action endpoints:**
```python
class InvestigateResponse(BaseModel):
    narrator_response: str
    new_evidence: list[str] = Field(default_factory=list)
    already_discovered: bool = False
    updated_state: dict[str, Any]  # ADD THIS — full PlayerState as dict

# In the endpoint, replace bare save_state() call:
save_state(state, body.player_id)           # REMOVE
return InvestigateResponse(
    narrator_response=...,
    new_evidence=...,
    updated_state=state.model_dump(mode="json"),  # ADD
)
```

**Frontend: receive and persist updated_state:**
```typescript
// In useInvestigation.ts, after investigate API call:
const response = await investigate(request);
if (response.updated_state) {
  // Persist to autosave slot immediately
  saveToLocalStorage(caseId, "autosave", response.updated_state as InvestigationState);
  setState(response.updated_state as InvestigationState);
}
```

**Export pattern:**
```typescript
function exportSave(state: InvestigationState, slot: string): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `hp_save_${state.case_id}_${slot}_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
```

**Import pattern:**
```typescript
async function importSave(file: File, slot: string, caseId: string): Promise<boolean> {
  const text = await file.text();
  try {
    const raw = JSON.parse(text) as unknown;
    const validated = InvestigationStateSchema.parse(raw); // Zod validates
    saveToLocalStorage(caseId, slot, validated);
    return true;
  } catch {
    return false; // Invalid file
  }
}
```

**storage.persist() on mount (App.tsx):**
```typescript
useEffect(() => {
  void navigator.storage?.persist();
}, []); // once on mount
```

**Critical gotchas:**
- `InvestigateResponse`, `InterrogateResponse`, `SubmitVerdictResponse`, `BriefingQuestionResponse`, `BriefingCompleteResponse`, and Tom/mentor responses ALL need `updated_state` added — about 8-10 response classes
- Zod schemas in `frontend/src/api/schemas.ts` must add `updated_state: InvestigationStateSchema` to every updated response schema
- `InvestigationStateSchema` is already defined in `frontend/src/api/schemas.ts` — reuse it
- `SaveSlotsListResponseSchema` — the Zod `.strict()` check will fail if backend still returns old format; remove strict or update to match
- `progress_percent` hardcodes `15` evidence items for case_001 — acceptable for now, note it
- localStorage size: 4 slots × 20 KB max = 80 KB well within 5 MB limit
- Session recovery (`SESSION_KEY`) already works — it stores `{caseId, slot}` and on reload the frontend calls `loadFromSlot` which will now hit localStorage instead of server

---

## Files to Create/Modify/Delete

| File | Action | Purpose |
|------|--------|---------|
| `frontend/src/api/localSaves.ts` | CREATE | All localStorage save/load/list/delete/export/import logic |
| `frontend/src/hooks/useSaveSlots.ts` | MODIFY | Replace API calls with `localSaves.ts` functions |
| `frontend/src/api/client.ts` | MODIFY | Remove `saveGameState`, `loadGameState`, `listSaveSlots`, `deleteSaveSlot` exports (or keep as no-ops during transition) |
| `frontend/src/api/schemas.ts` | MODIFY | Add `updated_state` field to action response schemas |
| `frontend/src/components/SaveLoadModal.tsx` | MODIFY | Add Export/Import buttons |
| `frontend/src/App.tsx` | MODIFY | Add `navigator.storage.persist()` on mount |
| `backend/src/api/routes.py` | MODIFY | Add `updated_state` to all action response models + endpoints; stub or remove save/load/delete/list endpoints |
| `backend/src/state/persistence.py` | KEEP | Retain for potential server backup path; no changes required now |
| `backend/tests/` | MODIFY | Update test assertions for new response shapes |

---

## Implementation Phases

### Phase 1 — Backend: Add `updated_state` to action responses (backend-only, no breaking change)

Add `updated_state: dict[str, Any]` to response models and populate in endpoints. Keep existing `save_state()` calls as-is for now (belt-and-suspenders). Frontend ignores the new field until Phase 2.

**Endpoints to update** (search `save_state(state` in routes.py — ~30 call sites):
- `InvestigateResponse` — `/api/investigate`, `/api/investigate-stream`
- `InterrogateResponse` — `/api/interrogate`, `/api/interrogate-stream`
- `SubmitVerdictResponse` — `/api/verdict` (and confrontation variants)
- `BriefingQuestionResponse`, `BriefingCompleteResponse` — `/api/briefing/*`
- Tom/mentor responses — `/api/mentor`, `/api/inner-voice`
- `ChangeLocationResponse` — `/api/change-location`

Pattern for each endpoint (routes.py):
```python
# Before
save_state(state, body.player_id)
return SomeResponse(field=value, ...)

# After
save_state(state, body.player_id)   # keep for now
return SomeResponse(
    field=value,
    ...,
    updated_state=state.model_dump(mode="json"),
)
```

For streaming endpoints (`investigate-stream`, `interrogate-stream`) — add `updated_state` to the final `done: True` SSE message:
```python
yield f"data: {json.dumps({'done': True, ..., 'updated_state': state.model_dump(mode='json')})}\n\n"
```

### Phase 2 — Frontend: Create `localSaves.ts` + wire up `useSaveSlots`

1. Create `frontend/src/api/localSaves.ts` with:
   - `saveToLocalStorage(caseId, slot, state)`
   - `loadFromLocalStorage(caseId, slot): InvestigationState | null`
   - `deleteFromLocalStorage(caseId, slot)`
   - `listLocalSlots(caseId): SaveSlotMetadata[]`
   - `exportSaveFile(state, slot)`
   - `importSaveFile(file, slot, caseId): Promise<boolean>`

2. Rewrite `useSaveSlots.ts` — replace all API calls with `localSaves.ts` functions. No async network calls; all ops are synchronous except import (file read).

3. Update Zod schemas (`schemas.ts`) to add `updated_state: InvestigationStateSchema.optional()` to all modified response schemas. Use `.optional()` to avoid breaking if backend not yet updated.

4. Update `useInvestigation.ts`, `useWitnessInterrogation.ts`, and similar hooks — after each API call, check for `updated_state` in response and call `saveToLocalStorage(caseId, "autosave", updated_state)`.

### Phase 3 — Frontend: Remove old API save/load calls + add Export/Import UI

1. In `App.tsx`: add `navigator.storage?.persist()` in mount effect.

2. In `SaveLoadModal.tsx`: add Export button (calls `exportSaveFile`) and Import button (`<input type="file" accept=".json">`).

3. Remove `saveGameState`, `loadGameState`, `listSaveSlots`, `deleteSaveSlot` from `client.ts` (or mark deprecated with `@deprecated` JSDoc and remove callers first).

4. Session recovery in `App.tsx` — `loadFromSlot()` now hits localStorage, so page-reload recovery works without any changes (the hook change is transparent).

### Phase 4 — Backend cleanup (optional, do last)

- Stub `/api/save`, `/api/load`, `/api/delete`, `/api/saves/list` with 410 Gone + message "Saves moved to client"
- Remove `save_state()` / `save_player_state()` calls from action endpoints (no longer needed)
- Keep `persistence.py` in place (may be needed for future server-side backup feature)

---

## Migration Path

**No migration needed for existing users** — server-side saves exist on disk but localStorage is empty. On first play after deploy, the game starts fresh (or user can use Import to upload a server-side `.json` manually).

If backward compatibility is needed: add a one-time migration endpoint `GET /api/saves/export-all` that returns all server saves as JSON — user can download and import manually. This is optional.

---

## Testing Strategy

**Backend:**
- `backend/tests/test_routes.py` — update response assertions to include `updated_state` field
- Verify `updated_state` in response matches state after mutation (spot-check investigate + interrogate)
- No new test files needed

**Frontend:**
- `frontend/src/api/__tests__/localSaves.test.ts` — CREATE: unit test each function with mocked `localStorage`
- `frontend/src/hooks/__tests__/useSaveSlots.test.ts` — UPDATE: mock localStorage instead of API
- Import/export round-trip test: `exportSaveFile` → read blob → `importSaveFile` → compare state

**Manual smoke test checklist:**
- [ ] Investigate, check autosave slot populated in localStorage DevTools
- [ ] Manual save to slot_1, refresh page, load from slot_1 — state restored
- [ ] Export slot_1 → download .json; delete slot_1; import .json → state restored
- [ ] `navigator.storage.persisted()` returns `true` after mount

---

## Unresolved Questions

1. Streaming endpoints — does the frontend currently read `updated_state` from SSE `done` events, or only from the final response? If streaming consumers parse SSE events directly (not via `client.ts`), each streaming hook needs separate handling.
2. `PLAYER_ID = "default"` is hardcoded everywhere — localStorage keys will be per-case, not per-player. Is multi-player (different player IDs) in scope? If yes, keys need `hp_save_{caseId}_{playerId}_{slot}`.
3. Should the server-side `save_state()` calls be removed in Phase 4 immediately, or kept as a server-side backup indefinitely?
4. Are frontend tests (377/565 passing) blocking? Will adding `updated_state` to response schemas break more tests, or fix some?
5. `progress_percent` hardcodes 15 evidence items — is this acceptable to leave as-is, or fix now?
