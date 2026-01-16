# TypeScript Type System Audit Report

**Date**: 2026-01-16
**Auditor**: typescript-architect
**Scope**: `frontend/src/` (React 18 + TypeScript 5.6 + Vite)

---

## Executive Summary

The type system is **well-designed** with strong foundations. TypeScript strict mode is enabled and enforced. No critical `any` types exist in production code. Discriminated unions are used consistently for state management. Several medium-priority improvements can enhance type safety and documentation.

**Overall Grade**: **B+** (Good, with room for improvement)

| Category | Score | Status |
|----------|-------|--------|
| Strict Mode Compliance | A | Passing |
| Domain Modeling | B+ | Good |
| API Type Safety | B | Adequate |
| Component Props | A- | Good |
| Discriminated Unions | A | Excellent |
| Immutability | C | Needs Work |
| Documentation | B | Adequate |

---

## 1. Strict Mode Compliance

### tsconfig.json Analysis

```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noFallthroughCasesInSwitch": true,
  "noUncheckedSideEffectImports": true
}
```

**Status**: PASSING

**Findings**:
- All critical strict mode flags enabled
- Target ES2020 is appropriate for modern browsers
- `skipLibCheck: true` is acceptable for faster builds

**Missing Recommended Flags**:
```json
{
  "noPropertyAccessFromIndexSignature": true,  // Catch bracket notation issues
  "exactOptionalPropertyTypes": true,          // Stricter optional handling
  "noUncheckedIndexedAccess": true             // Catch undefined array access
}
```

**Severity**: LOW - Current config is production-ready

---

## 2. Type Safety Issues

### 2.1 Critical Issues

**None found.** The codebase does not use `any` in production code.

### 2.2 High Priority Issues

#### H1: Type Assertions in API Client (Medium Risk)

**Location**: `frontend/src/api/client.ts`

**Issue**: All API responses use unsafe type assertions:
```typescript
return (await response.json()) as InvestigateResponse;  // Line 178
return (await response.json()) as SaveResponse;         // Line 227
// ... 30+ similar patterns
```

**Risk**: If backend changes response shape, frontend will silently receive malformed data.

**Recommendation**: Use Zod or custom type guards for runtime validation:
```typescript
// Option 1: Zod schema (recommended for new code)
const InvestigateResponseSchema = z.object({
  narrator_response: z.string(),
  new_evidence: z.array(z.string()),
  already_discovered: z.boolean(),
});

// Option 2: Type guard (no new dependency)
function isInvestigateResponse(data: unknown): data is InvestigateResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'narrator_response' in data &&
    'new_evidence' in data
  );
}
```

#### H2: Error Type Assertions in Hooks (Medium Risk)

**Locations**:
- `frontend/src/hooks/useInvestigation.ts:162`
- `frontend/src/hooks/useWitnessInterrogation.ts:188, 215, 263, 311`
- `frontend/src/components/LocationView.tsx:317`

**Issue**: Catch blocks use direct type assertions:
```typescript
const apiError = err as ApiError;  // Unsafe if err is different type
```

**Recommendation**: Use existing `isApiError` type guard:
```typescript
// ALREADY EXISTS in investigation.ts:184
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'message' in error
  );
}

// USAGE (correct pattern in useVerdictFlow.ts):
if (isApiError(error)) {
  dispatch({ type: 'SUBMIT_ERROR', error: error.message });
} else {
  dispatch({ type: 'SUBMIT_ERROR', error: 'Unknown error' });
}
```

**Affected Files Need Update**:
- `useInvestigation.ts`
- `useWitnessInterrogation.ts`
- `LocationView.tsx`

### 2.3 Medium Priority Issues

#### M1: BriefingEngagement Unsafe Cast

**Location**: `frontend/src/components/BriefingEngagement.tsx:54`

```typescript
void handleSubmit(e as unknown as FormEvent);
```

**Issue**: Double cast through `unknown` is a code smell indicating type mismatch.

**Recommendation**: Fix event handler type signature or use proper form handling.

#### M2: TomChatInput Ref Cast

**Location**: `frontend/src/components/TomChatInput.tsx:83`

```typescript
const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;
```

**Issue**: Type assertion on forwarded ref.

**Recommendation**: Use proper forwardRef typing or conditional ref handling.

#### M3: Missing readonly Modifiers

**Issue**: Most interfaces lack `readonly` modifiers, allowing accidental mutation.

**Example** in `investigation.ts`:
```typescript
// CURRENT (mutable)
export interface InvestigationState {
  case_id: string;
  discovered_evidence: string[];
}

// RECOMMENDED (immutable)
export interface InvestigationState {
  readonly case_id: string;
  readonly discovered_evidence: readonly string[];
}
```

**Affected Types**: 50+ interfaces across all type files.

### 2.4 Low Priority Issues

#### L1: `any` in Test Files (Acceptable)

**Location**: `frontend/src/components/__tests__/LandingPage.test.tsx`

```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
(client.getCases as any).mockResolvedValue(mockCasesResponse);
```

**Status**: Acceptable for test mocking. ESLint directive is properly scoped.

#### L2: Deprecated Types Still in Use

**Location**: `frontend/src/types/enhanced.ts`

Types marked `@deprecated` are still imported:
- `UnlockTrigger`
- `Contradiction`
- `ConditionalHypothesis`

**Recommendation**: Complete migration or remove deprecated markers if still needed.

---

## 3. Domain Modeling Review

### 3.1 Strengths

**Excellent discriminated union usage** in state management:

```typescript
// GameAction (game.ts:168-194) - Exemplary pattern
export type GameAction =
  | { type: 'START_GAME'; investigationPoints: number }
  | { type: 'ADVANCE_PHASE' }
  | { type: 'GO_TO_PHASE'; phase: GamePhase }
  | { type: 'SELECT_HYPOTHESIS'; hypothesisId: string }
  // ... 14 action types total

// VerdictAction (useVerdictFlow.ts:53-59)
type VerdictAction =
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS'; payload: SubmitVerdictResponse }
  | { type: 'SUBMIT_ERROR'; error: string }
  | { type: 'RESET' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'CONFIRM_CONFRONTATION' };

// Message type (investigation.ts:554-557)
export type Message =
  | { type: 'player'; text: string; timestamp?: number }
  | { type: 'narrator'; text: string; timestamp?: number }
  | { type: 'tom_ghost'; text: string; tone?: 'helpful' | 'misleading'; ... };
```

**Well-defined phase literals**:
```typescript
export type GamePhase =
  | 'briefing'
  | 'hypothesis'
  | 'investigation'
  | 'prediction'
  | 'resolution'
  | 'review';
```

### 3.2 Areas for Improvement

#### D1: Missing Branded Types for Domain Primitives

**Issue**: String IDs are not type-distinguished:
```typescript
// Current: All IDs are plain strings
interface WitnessInfo {
  id: string;        // Could accidentally use evidenceId
  case_id: string;   // Could accidentally use witnessId
}
```

**Recommendation**: Use branded types for compile-time ID safety:
```typescript
// Branded type pattern
type Brand<T, B> = T & { __brand: B };

export type WitnessId = Brand<string, 'WitnessId'>;
export type EvidenceId = Brand<string, 'EvidenceId'>;
export type CaseId = Brand<string, 'CaseId'>;
export type LocationId = Brand<string, 'LocationId'>;

// Type-safe usage
interface WitnessInfo {
  readonly id: WitnessId;
  readonly case_id: CaseId;
}

// Prevents: presentEvidence(witnessId, evidenceId) <- Would catch if args swapped
```

#### D2: Inconsistent Timestamp Types

**Issue**: Mixed timestamp representations:
```typescript
// Date object
interface ConversationItem {
  timestamp: Date;           // investigation.ts:162
}

// ISO string
interface WitnessConversationItem {
  timestamp: string;         // investigation.ts:206
}

// Unix milliseconds
interface ConversationMessage {
  timestamp: number;         // investigation.ts:74
}

// Optional number
interface Message {
  timestamp?: number;        // investigation.ts:555
}
```

**Recommendation**: Standardize on one format (ISO string or Unix ms) with conversion utilities.

#### D3: Duplicate Type Definitions

**Issue**: Some types are defined in both components and type files:

- `Fallacy` in `investigation.ts` and `MentorFeedback.tsx`
- `DialogueLine` in `investigation.ts` and `ConfrontationDialogue.tsx`
- `Suspect`, `Evidence` in `VerdictSubmission.tsx` (should be in types/)

**Recommendation**: Single source of truth in `types/` directory.

---

## 4. API Type Safety

### 4.1 Strengths

- Comprehensive type definitions for all endpoints (40+ request/response types)
- Type-safe error handling with `ApiError` class
- Good JSDoc documentation with examples

### 4.2 Weaknesses

#### A1: No Runtime Validation

All API responses are cast without validation. Backend schema changes will cause silent failures.

**Recommended Pattern**:
```typescript
// Create validation layer
import { z } from 'zod';

const InvestigateResponseSchema = z.object({
  narrator_response: z.string(),
  new_evidence: z.array(z.string()),
  already_discovered: z.boolean(),
});

export async function investigate(request: InvestigateRequest): Promise<InvestigateResponse> {
  // ... fetch logic ...
  const data = await response.json();
  return InvestigateResponseSchema.parse(data);  // Runtime validation
}
```

#### A2: Inconsistent Optional vs Nullable

```typescript
// Mixed patterns
interface BriefingContent {
  transition?: string;                    // Optional (may not exist)
  case_assignment?: string;               // Optional
}

interface SubmitVerdictResponse {
  confrontation: ConfrontationDialogueData | null;  // Nullable (explicitly null)
  reveal: string | null;                            // Nullable
}
```

**Recommendation**: Document and standardize: `?` for "may not exist", `| null` for "explicitly null from API".

---

## 5. Component Props Analysis

### 5.1 Strengths

- **No React.FC usage** (modern pattern, avoids implicit children)
- All components use explicit props interfaces
- Props are well-documented with JSDoc
- Proper callback typing (`onSubmit: (args) => Promise<void>`)

### 5.2 Sample Analysis

**LocationViewProps** (exemplary):
```typescript
interface LocationViewProps {
  caseId: string;
  locationId: string;
  locationData: LocationResponse | null;
  onEvidenceDiscovered: (evidenceIds: string[]) => void;
  discoveredEvidence?: string[];
  _witnessesPresent?: WitnessPresent[];  // Prefixed unused for future
  _onWitnessClick?: (witnessId: string) => void;
  inlineMessages?: Message[];
  onTomMessage?: (message: string) => void;
  tomLoading?: boolean;
}
```

**Issues Found**:
- `_` prefix for unused props (acceptable but adds noise)
- Missing `readonly` on array props

### 5.3 Component Count by Props Status

| Status | Count |
|--------|-------|
| Well-typed with JSDoc | 38 |
| Missing JSDoc | 8 |
| Overly permissive props | 0 |

---

## 6. Type System Patterns

### 6.1 Discriminated Unions - EXCELLENT

**Usage Rating**: A

The codebase consistently uses discriminated unions for:
- Game state actions (`GameAction`)
- Hook state actions (`VerdictAction`, `WitnessAction`)
- Message types (`Message`)
- Conversation types (`ConversationMessage`)

**Exhaustiveness checking** is implicitly enforced via TypeScript strict mode.

### 6.2 Branded Types - NOT USED

**Usage Rating**: N/A (Opportunity for improvement)

No branded types exist. Would benefit:
- ID types (WitnessId, EvidenceId, CaseId, LocationId)
- Percentage values (TrustLevel: 0-100)
- Timestamp formats

### 6.3 Utility Types - ADEQUATE

**Usage Rating**: B

Common utility types used:
- `Record<string, string>` for dictionaries
- `Partial<T>` not observed (could be useful)
- `Pick<T, K>` not observed
- `Readonly<T>` not observed (should be used more)

### 6.4 Generic Constraints - MINIMAL

**Usage Rating**: C

Very few generic types. The `Extract<>` utility is used once:
```typescript
// useTomChat.ts:22
export interface TomMessage extends Extract<Message, { type: 'tom_ghost' }> {
```

---

## 7. Recommendations Summary

### Immediate Actions (High Priority)

1. **Add type guards** for error handling in hooks
   - Estimated effort: 1 hour
   - Files: `useInvestigation.ts`, `useWitnessInterrogation.ts`, `LocationView.tsx`

2. **Fix unsafe casts** in `BriefingEngagement.tsx` and `TomChatInput.tsx`
   - Estimated effort: 30 minutes

### Short-term Actions (Medium Priority)

3. **Add readonly modifiers** to all interface properties
   - Estimated effort: 2 hours
   - Affects: All files in `types/`

4. **Standardize timestamp types**
   - Estimated effort: 1 hour
   - Create utility type and conversion functions

5. **Consolidate duplicate types**
   - Move `Suspect`, `Evidence`, `Fallacy`, `DialogueLine` to `types/`
   - Estimated effort: 1 hour

### Long-term Actions (Low Priority)

6. **Add runtime validation with Zod**
   - Estimated effort: 4-6 hours
   - Create schema file parallel to type definitions

7. **Implement branded types for IDs**
   - Estimated effort: 3-4 hours
   - Create `types/branded.ts`

8. **Add stricter tsconfig flags**
   - `noUncheckedIndexedAccess`
   - `exactOptionalPropertyTypes`
   - Estimated effort: 2-3 hours (fixing resulting errors)

9. **Remove deprecated types** in `enhanced.ts`
   - Or remove deprecation if types are still needed
   - Estimated effort: 30 minutes

---

## 8. Recommended Type Improvements

### 8.1 Create `types/branded.ts`

```typescript
/**
 * Branded Types for Domain Primitives
 *
 * Provides compile-time type safety for string IDs.
 *
 * @module types/branded
 */

type Brand<T, B> = T & { readonly __brand: B };

// Domain IDs
export type WitnessId = Brand<string, 'WitnessId'>;
export type EvidenceId = Brand<string, 'EvidenceId'>;
export type CaseId = Brand<string, 'CaseId'>;
export type LocationId = Brand<string, 'LocationId'>;
export type HypothesisId = Brand<string, 'HypothesisId'>;

// Constrained values
export type TrustLevel = Brand<number, 'TrustLevel'>;  // 0-100
export type Probability = Brand<number, 'Probability'>; // 0-1

// Factory functions
export const toWitnessId = (id: string): WitnessId => id as WitnessId;
export const toEvidenceId = (id: string): EvidenceId => id as EvidenceId;
export const toCaseId = (id: string): CaseId => id as CaseId;
export const toLocationId = (id: string): LocationId => id as LocationId;

// Validation factories
export function toTrustLevel(value: number): TrustLevel {
  if (value < 0 || value > 100) {
    throw new RangeError(`Trust level must be 0-100, got ${value}`);
  }
  return value as TrustLevel;
}
```

### 8.2 Update `types/investigation.ts` with Immutability

```typescript
// BEFORE
export interface InvestigationState {
  case_id: string;
  current_location: string;
  discovered_evidence: string[];
  visited_locations: string[];
}

// AFTER
export interface InvestigationState {
  readonly case_id: string;
  readonly current_location: string;
  readonly discovered_evidence: readonly string[];
  readonly visited_locations: readonly string[];
}
```

### 8.3 Create `api/schemas.ts` for Runtime Validation

```typescript
import { z } from 'zod';

export const InvestigateResponseSchema = z.object({
  narrator_response: z.string(),
  new_evidence: z.array(z.string()),
  already_discovered: z.boolean(),
});

export const WitnessInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  personality: z.string().optional(),
  trust: z.number().min(0).max(100),
  conversation_history: z.array(z.object({
    question: z.string(),
    response: z.string(),
    timestamp: z.string(),
    trust_delta: z.number().optional(),
  })).optional(),
  secrets_revealed: z.array(z.string()),
  image_url: z.string().optional(),
});

// Export inferred types to ensure schema/type sync
export type InvestigateResponseFromSchema = z.infer<typeof InvestigateResponseSchema>;
```

---

## 9. Conclusion

The Harry Potter investigation game frontend has a **well-architected type system** with excellent discriminated union patterns and no critical type safety issues. The main areas for improvement are:

1. **Adding runtime validation** for API responses (Zod recommended)
2. **Enforcing immutability** with readonly modifiers
3. **Using type guards** instead of type assertions in error handling
4. **Considering branded types** for ID strings

The codebase demonstrates TypeScript best practices including:
- No React.FC (modern pattern)
- Discriminated unions for actions
- Type-safe callback props
- Good JSDoc documentation

**Recommended Next Steps**:
1. Fix high-priority type assertion issues (H1, H2)
2. Add readonly modifiers to types (M3)
3. Evaluate Zod for runtime validation in Phase 6

---

*Report generated by typescript-architect agent*
*Last updated: 2026-01-16*
