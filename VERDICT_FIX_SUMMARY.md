# Verdict Submission Bug Fix

## Problems Identified

### Problem 1: Missing Check for `case_solved`
**Bug:** Backend only checked `attempts_remaining <= 0` but NOT `case_solved = True`

**Impact:**
- After submitting correct verdict, `case_solved = True` but `attempts_remaining = 9`
- No check prevented re-submission of verdict after solving case
- Confusion about whether case is complete

---

### Problem 2: Misleading Error Messages
**Bug:** Error message said "No attempts remaining" regardless of actual reason

**Impact:**
- User sees "10/10 attempts" in UI but gets "No attempts remaining" error
- No distinction between:
  - Case already solved (correct verdict submitted)
  - Actually out of attempts (all 10 used incorrectly)

---

## Solution Applied

**File:** `backend/src/api/routes.py` (lines 2424-2434)

### Before:
```python
# Check if out of attempts
if verdict_state.attempts_remaining <= 0:
    raise HTTPException(
        status_code=400,
        detail="No attempts remaining. Case resolution complete.",
    )
```

### After:
```python
# Check if case already solved
if verdict_state.case_solved:
    raise HTTPException(
        status_code=400,
        detail="Case already solved! You submitted the correct verdict. Use 'Reset Case' to try again.",
    )

# Check if out of attempts
if verdict_state.attempts_remaining <= 0:
    raise HTTPException(
        status_code=400,
        detail=f"No attempts remaining. You've used all {10 - verdict_state.attempts_remaining} attempts. Use 'Reset Case' to start over.",
    )
```

---

## Error Messages Now Clear

### Scenario 1: Case Already Solved
```
Status: 400 Bad Request
{
  "detail": "Case already solved! You submitted the correct verdict. Use 'Reset Case' to try again."
}
```

**When:** User previously submitted correct verdict, `case_solved = True`

---

### Scenario 2: Out of Attempts
```
Status: 400 Bad Request
{
  "detail": "No attempts remaining. You've used all 10 attempts. Use 'Reset Case' to start over."
}
```

**When:** User used all 10 attempts without solving, `attempts_remaining = 0`

---

## Testing

### Test 1: Submit Correct Verdict
```bash
cd backend
# Submit correct verdict for case_002
curl -X POST http://localhost:8000/api/submit-verdict \
  -H "Content-Type: application/json" \
  -d '{
    "case_id": "case_002",
    "accused_suspect_id": "adrian_clearmont",  # Correct suspect
    "reasoning": "Adrian is guilty based on the evidence."
  }'
# Should return: {"correct": true, "case_solved": true, ...}
```

### Test 2: Try Submitting Again (Should Fail)
```bash
# Try submitting again
curl -X POST http://localhost:8000/api/submit-verdict \
  -H "Content-Type": application/json" \
  -d '{
    "case_id": "case_002",
    "accused_suspect_id": "draco_malfoy",  # Different suspect
    "reasoning": "Maybe it was Draco?"
  }'
# Should return: 400 "Case already solved! ..."
```

### Test 3: Reset and Test Out of Attempts
```bash
# Reset case
curl -X POST http://localhost:8000/api/case/case_002/reset?player_id=default

# Submit 10 wrong verdicts
for i in {1..10}; do
  curl -X POST http://localhost:8000/api/submit-verdict \
    -H "Content-Type: application/json" \
    -d '{"case_id": "case_002", "accused_suspect_id": "wrong_suspect", "reasoning": "Test"}'
done

# Try 11th attempt
curl -X POST http://localhost:8000/api/submit-verdict \
  -H "Content-Type: application/json" \
  -d '{"case_id": "case_002", "accused_suspect_id": "adrian_clearmont", "reasoning": "Now I know!"}'
# Should return: 400 "No attempts remaining. You've used all 10 attempts..."
```

---

## UI Impact

**Before:**
- UI shows "10/10 attempts"
- User gets cryptic "No attempts remaining" error
- Confusing UX

**After:**
- UI shows "10/10 attempts" (or whatever remains)
- User gets clear message: "Case already solved!" or "Out of attempts"
- Can use "Reset Case" button to start over

---

## Verdict State Logic

```python
class VerdictState:
    attempts_remaining: int = 10       # Starts at 10
    case_solved: bool = False          # Starts False
    attempts: list[VerdictAttempt] = []  # Empty initially

    def add_attempt(correct, ...):
        self.attempts.append(attempt)
        self.attempts_remaining -= 1   # Decrement

        if correct:
            self.case_solved = True    # Mark solved
            self.final_verdict = attempt
```

**After correct verdict:**
- `attempts_remaining = 9`  ← Still has attempts left
- `case_solved = True`       ← But case is solved!

**Now we check BOTH conditions:**
1. First: Is case solved? → Block
2. Then: Out of attempts? → Block

---

## Status

✅ **Bug Fixed:**
- Added `case_solved` check before attempts check
- Clear error messages for both scenarios
- Proper game flow enforcement

✅ **Ready to Test:**
1. Restart backend: `cd backend && uv run uvicorn src.main:app --reload`
2. Try submitting verdict in UI
3. Should see clear error message if case already solved

---

## Next Steps for User

1. **Reload your browser** to clear any cached state
2. **Try submitting verdict again**
3. **You should now see:**
   - If case already solved: "Case already solved! You submitted the correct verdict. Use 'Reset Case' to try again."
   - If really out of attempts: "No attempts remaining. You've used all 10 attempts. Use 'Reset Case' to start over."

4. **To start fresh:**
   - Use "Reset Case" button in UI
   - OR run: `cd backend && uv run python reset_case_002.py`
