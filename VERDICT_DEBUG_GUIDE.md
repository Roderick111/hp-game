# Verdict Submission 400 Error - Debug Guide

## Problem
Getting **400 Bad Request** when submitting verdict.

---

## Quick Diagnosis Steps

### Step 1: Check Browser Console

Open browser DevTools (F12) and check:

```
Console tab → Look for:
- "Zod validation failed" errors
- "Failed to parse response" errors
- Any red error messages

Network tab → Click on "submit-verdict" request → Look at:
- Request Payload (what frontend sent)
- Response (what backend returned)
- Response Headers (status code details)
```

---

### Step 2: Check Backend Logs

If backend is running, check terminal output for:

```
INFO: 400 Bad Request
ValidationError: ...
```

---

## Most Likely Causes

### Cause 1: Request Validation Failed (Backend rejected request)

**Symptoms:**
- 400 error BEFORE response parsing
- Backend logs show "ValidationError"

**Common Issues:**
1. Empty `accused_suspect_id` or `reasoning`
2. Reasoning > 2000 characters
3. Invalid characters in suspect ID (must be alphanumeric + `_` and `-` only)

**Fix:**
Check the form inputs:
- Suspect ID is not empty
- Reasoning is not empty
- Reasoning is < 2000 chars
- No special characters in suspect ID

---

### Cause 2: Response Validation Failed (Zod schema mismatch)

**Symptoms:**
- 200 OK from backend
- Error in browser console: "Zod validation failed"
- Error mentions specific field names

**Fix:**
I already fixed 2 Zod schema issues:
- `FallacySchema.example` now `.optional()`
- `MentorFeedback.hint` now `.nullish()`

If still failing, check console for EXACT field name causing error.

---

## Manual Testing

### Test 1: Check Request Format

**What frontend should send:**
```json
{
  "case_id": "case_001",
  "player_id": "default",
  "accused_suspect_id": "draco_malfoy",  // Must be alphanumeric + _-
  "reasoning": "The evidence clearly shows...",  // 1-2000 chars
  "evidence_cited": ["evidence_1", "evidence_2"]
}
```

**Validation rules:**
- `accused_suspect_id`: REQUIRED, 1-64 chars, pattern `^[a-zA-Z0-9_-]+$`
- `reasoning`: REQUIRED, 1-2000 chars
- `evidence_cited`: Optional, defaults to `[]`
- `case_id`: Optional, defaults to `"case_001"`
- `player_id`: Optional, defaults to `"default"`

---

### Test 2: Check Response Format

**What backend returns:**
```json
{
  "correct": true,
  "attempts_remaining": 2,
  "case_solved": false,
  "mentor_feedback": {
    "analysis": "LLM-generated feedback...",
    "fallacies_detected": [],  // Can be empty
    "score": 85,
    "quality": "good",
    "critique": "",  // Can be empty string
    "praise": "",    // Can be empty string
    "hint": null     // Can be null
  },
  "confrontation": null,  // Can be null
  "reveal": null,         // Can be null
  "wrong_suspect_response": null  // Can be null
}
```

---

## Debugging Commands

### Backend: Test Request Validation
```bash
cd backend
uv run python test_verdict_request.py
```

This shows all validation rules.

### Backend: Test Response Structure
```bash
cd backend
uv run python test_verdict_response.py
```

This shows exact JSON structure backend sends.

### Backend: Test Full Endpoint
```bash
cd backend
uv run python test_verdict_endpoint.py
```

This tests actual endpoint logic.

---

## Common Fix Patterns

### Pattern 1: Field Can Be Omitted OR Null

**Backend:**
```python
field: str | None = None
```

**Zod:**
```typescript
field: z.string().nullish()  // Can be undefined OR null
```

### Pattern 2: Field Has Default Value

**Backend:**
```python
field: str = ""
```

**Zod:**
```typescript
field: z.string().optional()  // Can be undefined (uses default)
// OR
field: z.string()  // If backend always includes it (even if empty)
```

### Pattern 3: Field Can Be Null But Must Be Present

**Backend:**
```python
field: str | None  // No default
```

**Zod:**
```typescript
field: z.string().nullable()  // Must be present, can be null
```

---

## Next Steps

1. **Run backend server with logging:**
   ```bash
   cd backend
   uv run uvicorn src.main:app --reload --log-level debug
   ```

2. **Try submitting verdict in UI**

3. **Check console output** - should see exact error

4. **Report back with:**
   - Exact error message from console
   - Request payload from Network tab
   - Response from Network tab (if any)

---

## Already Fixed

✅ `FallacySchema.example` - now optional
✅ `MentorFeedback.hint` - now nullish

---

## Potential Remaining Issues

Check these in Zod schemas (`frontend/src/api/schemas.ts`):

1. **Line 247 - DialogueLineSchema.tone**
   - Backend: Not always present (optional)
   - Zod: Currently `.optional()` ✅ Should be OK

2. **All other nullable fields**
   - Check if using `.nullable()` vs `.nullish()`
   - Use `.nullish()` if backend might omit the field

---

## Contact Info

If still stuck, provide:
1. Browser console error (exact message)
2. Network tab → Request payload
3. Network tab → Response (if 200) or error details (if 400/500)
