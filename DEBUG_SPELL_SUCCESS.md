# Spell Success System Debug Mode

Quick debugging tool for testing Phase 4.7 spell success mechanics.

## How to Enable

### Option 1: Detailed Debug (shows calculation breakdown)
```bash
# In backend terminal:
cd ~/Documents/claude_projects/hp_game/backend
DEBUG_SPELLS=1 uv run uvicorn src.main:app --reload
```

### Option 2: Basic Logging (always on)
Just run the backend normally - basic spell cast info always logged:
```bash
cd ~/Documents/claude_projects/hp_game/backend
uv run uvicorn src.main:app --reload
```

## What You'll See

### Basic Mode (INFO level - always on):
```
INFO: 🪄 Spell Cast: revelio | Input: 'Revelio on desk to find clues' | Attempt #1 @ library | Outcome: SUCCESS
```

### Debug Mode (DEBUG_SPELLS=1 - detailed breakdown):
```
INFO: 🔍 SPECIFICITY: target=True (+10%), intent=True (+10%), total_bonus=20%
INFO: 🎲 SPELL SUCCESS: revelio @ library | base=70% + specificity=20% - decline=0% = 90% | roll=45.3 | ✅ SUCCESS
INFO: 🪄 Spell Cast: revelio | Input: 'Revelio on desk to find clues' | Attempt #1 @ library | Outcome: SUCCESS
```

## What to Test

### 1. Base Success Rate (70%)
```
Input: "Revelio"
Expected: 70% success rate (first attempt)
```

### 2. Target Bonus (+10%)
```
Input: "Revelio on desk"
Expected: 80% success rate (70% base + 10% target)
Look for: target=True in debug output
```

### 3. Intent Bonus (+10%)
```
Input: "Revelio to find clues"
Expected: 80% success rate (70% base + 10% intent)
Look for: intent=True in debug output
```

### 4. Both Bonuses (+20%)
```
Input: "Revelio on desk to find letters"
Expected: 90% success rate (70% base + 20% specificity)
Look for: target=True, intent=True, total_bonus=20%
```

### 5. Declining Success (per location)
```
Attempt 1: "Revelio" → 70% (base)
Attempt 2: "Revelio" → 60% (base - 10%)
Attempt 3: "Revelio" → 50% (base - 20%)
Look for: decline=0%, decline=10%, decline=20% in debug output
```

### 6. Location Reset
```
1. Cast "Revelio" 3 times in library
2. Move to different location (e.g., travel if available)
3. Cast "Revelio" again
Expected: Success rate resets to 70% in new location
```

### 7. Floor (10% minimum)
```
Cast "Revelio" 7+ times in same location
Expected: Never goes below 10% (even if calculation would be 70% - 60% = 10%)
Look for: success_rate capped at 10%
```

## Debug Output Legend

- **🪄** = Spell cast (basic info, always shown)
- **🔍** = Specificity bonus detection (DEBUG_SPELLS=1)
- **🎲** = Success calculation breakdown (DEBUG_SPELLS=1)
- **✅** = Success
- **❌** = Failure

## Testing Checklist

- [ ] Base 70% working
- [ ] Target bonus (+10%) detected correctly ("on X", "at X")
- [ ] Intent bonus (+10%) detected correctly ("to find", "to reveal", etc.)
- [ ] Both bonuses stack to 90% max
- [ ] Success declines by 10% per attempt in same location
- [ ] Success resets when moving to new location
- [ ] Floor of 10% enforced (never below)
- [ ] Narrator describes success/failure naturally (no mechanical language)
- [ ] Legilimency unchanged (trust-based, not affected by spell success)

## Disabling Debug Mode

Just restart backend without DEBUG_SPELLS=1:
```bash
# Press Ctrl+C to stop, then:
uv run uvicorn src.main:app --reload
```

Basic logging (🪄 Spell Cast) will still show, but detailed calculation (🔍🎲) won't.

## Remove Debug Code Later

When testing complete, search for:
- `DEBUG_SPELLS` in `backend/src/context/spell_llm.py`
- `DEBUG_SPELLS` in `backend/src/api/routes.py`
- Debug logging sections (marked with # Debug logging)

Or just leave it - it's behind an env var, so no performance impact when disabled.
