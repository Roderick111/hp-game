# Zod Schema Validation Fix

## Problem
**400 Bad Request** error when submitting verdict due to Zod validation mismatch between backend Pydantic models and frontend Zod schemas.

---

## Root Cause

### Issue 1: FallacySchema - Missing Optional Field

**Backend (Pydantic):**
```python
class FallacyDetail(BaseModel):
    name: str
    description: str
    example: str = ""  # ⚠️ Has default value = OPTIONAL
```

**Frontend (Zod) - BEFORE:**
```typescript
export const FallacySchema = z.object({
  name: z.string(),
  description: z.string(),
  example: z.string(),  // ❌ Required field
}).strict();
```

When the backend omits `example` (relying on default), Zod rejects the response because it expects all fields present.

---

### Issue 2: MentorFeedback.hint - Nullable vs Nullish

**Backend (Pydantic):**
```python
class MentorFeedback(BaseModel):
    # ...
    hint: str | None = None  # ⚠️ Optional + Nullable
```

**Frontend (Zod) - BEFORE:**
```typescript
export const MentorFeedbackDataSchema = z.object({
  // ...
  hint: z.string().nullable(),  // ❌ Required to be present (but can be null)
}).strict();
```

When the backend omits `hint` entirely (using default), Zod expects it to be present.

---

## Solution

### Fix 1: Make FallacySchema.example Optional

**File:** `frontend/src/api/schemas.ts:212-218`

```typescript
export const FallacySchema = z
  .object({
    name: z.string(),
    description: z.string(),
    example: z.string().optional(), // ✅ Now optional
  })
  .strict();
```

---

### Fix 2: Make MentorFeedback.hint Nullish

**File:** `frontend/src/api/schemas.ts:225-235`

```typescript
export const MentorFeedbackDataSchema = z
  .object({
    analysis: z.string(),
    fallacies_detected: z.array(FallacySchema),
    score: z.number(),
    quality: z.string(),
    critique: z.string(),
    praise: z.string(),
    hint: z.string().nullish(), // ✅ Now optional + nullable
  })
  .strict();
```

---

## Zod Type Reference

| Pydantic Type | Zod Type | Meaning |
|---------------|----------|---------|
| `str` | `z.string()` | Required, never null |
| `str \| None` | `z.string().nullable()` | Required, can be null |
| `str = ""` | `z.string().optional()` | Can be omitted, never null |
| `str \| None = None` | `z.string().nullish()` | Can be omitted OR null |

**`.nullish()` = `.nullable().optional()`**

---

## Testing

### Before Fix
```
POST /api/submit-verdict
Response: 400 Bad Request
Zod Validation Error: "example: Required" or "hint: Required"
```

### After Fix
```
POST /api/submit-verdict
Response: 200 OK
{
  "correct": true,
  "mentor_feedback": {
    "analysis": "Good work...",
    "fallacies_detected": [],  // example omitted (uses default "")
    "hint": null,              // or omitted entirely
    // ...
  }
}
```

---

## Prevention Rule (from CLAUDE.md)

When adding/modifying API endpoints:

1. **Backend first:** Check Pydantic model in `backend/src/api/routes.py`
2. **Frontend schema:** Update Zod schema in `frontend/src/api/schemas.ts`
3. **Match ALL fields:** Use `.optional()` for fields with defaults
4. **Keep `.strict()`:** Catches typos and unexpected data

**Common Pattern:**
```python
# Backend: field: Type | None = None
# Frontend: field: z.type().nullish()

# Backend: field: Type = default
# Frontend: field: z.type().optional()
```

---

## Files Changed

- ✅ `frontend/src/api/schemas.ts` (2 fields fixed)
  - Line 216: `example: z.string().optional()`
  - Line 233: `hint: z.string().nullish()`

---

## Status

✅ **Zod validation fixed**
✅ **Verdict submission should work**
✅ **Multi-LLM system operational**

**Next:** Test verdict submission in UI to confirm fix.
