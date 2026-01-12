# Save/Load System Test Plan

## Prerequisites
1. Start backend: `cd backend && uv run uvicorn src.main:app --reload`
2. Start frontend: `cd frontend && ~/.bun/bin/bun run dev`
3. Open http://localhost:5173

---

## Test 1: Verify Autosave (Automatic)

**Steps**:
1. Play the game for a few seconds (collect evidence, move locations)
2. Wait 3 seconds
3. Check terminal/browser console for autosave logs

**Expected Result**:
- Autosave triggers automatically every 2+ seconds
- No toast notification (silent autosave)
- Console log: "Auto-saved successfully" or similar

**Verification**:
```bash
# Check if autosave file updated
ls -lh backend/saves/case_001_default_autosave.json

# View autosave content
cat backend/saves/case_001_default_autosave.json | grep -E "version|current_location|discovered_evidence" | head -10
```

---

## Test 2: Manual Save to Slot 1

**Steps**:
1. Press **ESC** (opens main menu)
2. Press **3** (or click "SAVE GAME" button)
3. Save modal appears with 3 slots
4. Click **"SAVE HERE"** on Slot 1
5. Toast notification appears: "Saved to slot 1"

**Expected Result**:
- Modal shows 3 empty slots (or previous saves with timestamps)
- After saving, toast notification shows success
- Modal closes automatically

**Verification**:
```bash
# Check if slot_1 file created
ls -lh backend/saves/case_001_default_slot_1.json

# View slot_1 content
cat backend/saves/case_001_default_slot_1.json | grep -E "version|current_location|discovered_evidence" | head -10
```

---

## Test 3: Load from Slot 1

**Steps**:
1. Continue playing (collect more evidence, change location)
2. Press **ESC** → Press **2** (or click "LOAD GAME")
3. Load modal appears showing Slot 1 with metadata
4. Click **"LOAD"** on Slot 1
5. Page reloads with previous state

**Expected Result**:
- Load modal shows:
  - Slot 1: timestamp, location, evidence count
  - Autosave: timestamp, location, evidence count
- After clicking LOAD:
  - Toast: "Loaded from slot 1"
  - Page reloads
  - Game state restored to Slot 1 save

**Verification**:
- Evidence board shows items from Slot 1 save (not current progress)
- Location matches Slot 1 save
- Conversation history restored

---

## Test 4: Overwrite Existing Save

**Steps**:
1. Press **ESC** → **3** (Save Game)
2. Slot 1 now shows previous save with timestamp
3. Click **"OVERWRITE"** on Slot 1
4. Confirmation: save overwrites previous data

**Expected Result**:
- Slot 1 shows "OVERWRITE" button (not "SAVE HERE")
- Metadata shows previous save details
- After overwrite, toast confirms success

---

## Test 5: Multiple Save Slots

**Steps**:
1. Save current progress to **Slot 1**
2. Continue playing, collect new evidence
3. Save to **Slot 2**
4. Continue playing further
5. Save to **Slot 3**
6. Press **ESC** → **2** (Load Game)
7. Verify all 3 slots visible with different timestamps

**Expected Result**:
- Load modal shows all 3 slots with different:
  - Timestamps
  - Locations
  - Evidence counts
- Each slot represents a different save point

**Verification**:
```bash
# List all save files
ls -lh backend/saves/case_001_default_*.json

# Should see:
# - case_001_default_autosave.json
# - case_001_default_slot_1.json
# - case_001_default_slot_2.json
# - case_001_default_slot_3.json
```

---

## Test 6: Keyboard Shortcuts

**Steps**:
1. Press **ESC** (main menu opens)
2. Press **1** → Restart confirmation appears
3. Press **ESC** (close menu)
4. Press **ESC** → **2** → Load modal opens
5. Press **ESC** (close load modal)
6. Press **ESC** → **3** → Save modal opens

**Expected Result**:
- All keyboard shortcuts work (1-4)
- ESC toggles menu open/close
- ESC closes modals

---

## Test 7: Toast Notifications

**Steps**:
1. Save to Slot 1 → Toast: "Saved to slot 1" (green)
2. Load from Slot 1 → Toast: "Loaded from slot 1" (green)
3. Try to save with no state → Toast: "Save failed" (red)

**Expected Result**:
- Toast appears top-right corner
- Auto-dismisses after 3 seconds
- Different colors: green (success), red (error)

---

## Test 8: Error Handling

**Steps**:
1. Stop backend server
2. Try to save → Toast: "Save failed"
3. Try to load → Toast: "Load failed"

**Expected Result**:
- User-friendly error messages
- No crashes
- Toast shows error (red background)

---

## Success Criteria

✅ Autosave triggers every 2+ seconds
✅ Manual save to slots 1-3 works
✅ Load from slots restores game state
✅ Overwrite confirmation works
✅ Toast notifications appear and dismiss
✅ Keyboard shortcuts functional (1-4, ESC)
✅ Save files created in backend/saves/
✅ Metadata displays correctly (timestamp, location, evidence count)
✅ Error handling graceful
✅ No console errors

---

## Quick Verification Commands

```bash
# Watch autosave in real-time (run while playing)
watch -n 1 'ls -lh backend/saves/case_001_default_autosave.json'

# View all save files
ls -lh backend/saves/case_001_default_*.json

# Check autosave content
cat backend/saves/case_001_default_autosave.json | jq '.version, .current_location, .discovered_evidence'

# Check slot 1 content
cat backend/saves/case_001_default_slot_1.json | jq '.version, .current_location, .discovered_evidence'

# Compare autosave vs slot 1
diff <(cat backend/saves/case_001_default_autosave.json | jq -S) \
     <(cat backend/saves/case_001_default_slot_1.json | jq -S)
```

---

## Troubleshooting

**Autosave not triggering?**
- Check browser console for errors
- Verify backend running on port 8000
- Check debounce delay (2s minimum between saves)

**Manual save not working?**
- Check if save modal appears (ESC → 3)
- Verify backend API endpoint: `http://localhost:8000/api/case/case_001/save?slot=slot_1`
- Check network tab in browser DevTools

**Load doesn't restore state?**
- Page should reload after load
- Check if save file exists in backend/saves/
- Verify slot parameter in API call

---

**Last Updated**: 2026-01-12
**Phase**: 5.3 - Save/Load System Testing
