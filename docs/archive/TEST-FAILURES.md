# Test Failure Patterns

*Knowledge base of recurring test issues and fixes. Update after debugging.*

## Pattern 1: Pydantic Model Serialization

**Error Pattern**:
```
TypeError: Object of type 'datetime' is not JSON serializable
```

**Root Cause**: Pydantic v2 models need explicit `.model_dump()` or `.model_dump_json()`

**Fix Applied**:
```python
# ❌ Before
return jsonify(model)

# ✅ After
return jsonify(model.model_dump())
```

**Frequency**: 3 occurrences (2026-01-05, 2026-01-06, 2026-01-07)

**Files Affected**: `backend/src/api/routes.py`, `backend/src/context/mentor.py`

**Pattern Learned**: Always use `.model_dump()` when serializing Pydantic models to JSON

---

## Pattern 2: React Hook Dependency Arrays

**Error Pattern**:
```
React Hook useEffect has a missing dependency: 'loadData'
```

**Root Cause**: ESLint exhaustive-deps rule requires all used variables in deps array

**Fix Applied**:
```typescript
// ✅ Option 1: Add to deps
useEffect(() => {
  loadData();
}, [loadData]);

// ✅ Option 2: Disable if intentional
useEffect(() => {
  loadData();
}, []); // eslint-disable-line react-hooks/exhaustive-deps
```

**Frequency**: 5 occurrences

**Pattern Learned**: Either add all deps or explicitly disable with comment explaining why

---

## Pattern 3: TypeScript Type Narrowing

**Error Pattern**:
```
Property 'X' does not exist on type 'never'
```

**Root Cause**: Discriminated union not narrowed properly in conditional logic

**Fix Applied**:
```typescript
// ❌ Before
if (data.type === 'A') {
  return data.value; // Error: 'value' doesn't exist on union
}

// ✅ After
type DataA = { type: 'A'; value: string };
type DataB = { type: 'B'; count: number };
type Data = DataA | DataB;

if (data.type === 'A') {
  return data.value; // OK - TypeScript narrows to DataA
}
```

**Frequency**: 2 occurrences

**Files Affected**: Frontend type definitions

**Pattern Learned**: Use discriminated unions with literal type fields for proper narrowing

---

## Pattern 4: Async Test Timeouts

**Error Pattern**:
```
Test timeout of 5000ms exceeded
```

**Root Cause**: Async operation not awaited, test completes before assertion

**Fix Applied**:
```typescript
// ❌ Before
test('loads data', () => {
  loadData(); // No await
  expect(data).toBeDefined(); // Fails - runs before loadData completes
});

// ✅ After
test('loads data', async () => {
  await loadData();
  expect(data).toBeDefined();
});
```

**Frequency**: 4 occurrences

**Pattern Learned**: Always await async operations in tests, use async test functions

---

## Pattern 5: Missing Import/Export

**Error Pattern**:
```
Module '"./types"' has no exported member 'X'
```

**Root Cause**: Component/type imported before export added

**Fix Applied**:
```typescript
// ✅ Add to types/investigation.ts
export interface X {
  field: string;
}

// ✅ Or re-export from index
export { X } from './investigation';
```

**Frequency**: 3 occurrences

**Files Affected**: `frontend/src/types/*`

**Pattern Learned**: Add exports before importing, check barrel exports

---

## Pattern 6: Python Fixture Scope

**Error Pattern**:
```
ScopeMismatch: function-scoped fixture used by session-scoped fixture
```

**Root Cause**: Fixture scope hierarchy violation (session > module > function)

**Fix Applied**:
```python
# ❌ Before
@pytest.fixture(scope="session")
def session_fixture(function_fixture):  # Error
    pass

# ✅ After
@pytest.fixture(scope="function")
def session_fixture(function_fixture):
    pass
```

**Frequency**: 1 occurrence

**Pattern Learned**: Fixture can only depend on same or broader scope

---

## Pattern 7: State Not Reset Between Tests

**Error Pattern**:
```
Test passes in isolation but fails in suite
```

**Root Cause**: Global state or module-level variables persist across tests

**Fix Applied**:
```python
# ✅ Use fixtures to reset state
@pytest.fixture(autouse=True)
def reset_state():
    global_var.clear()
    yield
    global_var.clear()
```

**Frequency**: 2 occurrences

**Pattern Learned**: Use fixtures with autouse=True for test isolation

---

## Pattern 8: Tailwind Class Conflicts

**Error Pattern**:
```
CSS not applying, class name appears in DOM but styles missing
```

**Root Cause**: Tailwind purge config not including file path

**Fix Applied**:
```javascript
// ✅ Update tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // ...
}
```

**Frequency**: 1 occurrence

**Pattern Learned**: Check purge config includes all component file paths

---

## Pattern 9: Integration Test Gap - YAML Structure Mismatch

**Error Pattern**:
```
Production bug: Backend returns "No inner voice triggers configured"
Tests: 421/425 passing ✅ (false positive)
```

**Root Cause (5 Whys)**:
1. Why didn't Tom appear? → Backend returned "No triggers configured"
2. Why no triggers? → `load_tom_triggers()` returned empty dict
3. Why empty? → Code looked for `inner_voice.tier_1` directly
4. Why not found? → YAML has `inner_voice.triggers.tier_1` (nested)
5. **ROOT**: Code assumed flat structure, YAML was nested + unit tests used mocks

**Fix Applied**:
```python
# ❌ Before (backend/src/context/inner_voice.py)
def load_tom_triggers(case_id: str) -> dict[int, list[dict]]:
    inner_voice = case_data.get("inner_voice", {})
    tier_triggers[tier] = inner_voice.get(tier_key, [])  # Wrong nesting

def select_tom_trigger(...):
    for tier in [3, 2, 1]:
        tier_triggers = triggers_by_tier.get(tier, [])
        # No threshold validation - Tier 3 could fire at evidence_count=1!

# ✅ After
def load_tom_triggers(case_id: str) -> dict[int, list[dict]]:
    inner_voice = case_data.get("inner_voice", {})
    triggers_section = inner_voice.get("triggers", {})  # Access nested triggers
    tier_triggers[tier] = triggers_section.get(tier_key, [])

def select_tom_trigger(...):
    tier_thresholds = {3: 6, 2: 3, 1: 0}  # Enforce evidence requirements
    for tier in [3, 2, 1]:
        if evidence_count < tier_thresholds[tier]:
            continue  # Skip tier if threshold not met
```

**Why Tests Didn't Catch It**:
- Unit tests used mock trigger data (not real YAML)
- No integration test loading actual `case_001.yaml`
- Tier threshold logic wasn't validated (could fire Tier 3 at evidence=1)

**Frequency**: 1 occurrence (Phase 4, 2026-01-08)

**Files Affected**:
- `backend/src/context/inner_voice.py` (YAML access + threshold logic)
- `backend/tests/test_inner_voice.py` (added regression test)

**Pattern Learned**:
1. **Integration tests required** - Unit tests with mocks miss structure mismatches
2. **Validate YAML structure** - Add tests that load real case files
3. **Test business logic constraints** - Tier thresholds are business rules, not just tech
4. **Regression tests** - Added `test_tier_thresholds_enforced` to prevent recurrence

**New Test Added**:
```python
def test_tier_thresholds_enforced():
    """Regression test: Tier 3 should NOT fire with evidence_count < 6."""
    triggers_by_tier = {
        3: [{"id": "tier3", "condition": "evidence_count>=6", "type": "helpful", "text": "..."}],
        2: [{"id": "tier2", "condition": "evidence_count>=3", "type": "helpful", "text": "..."}],
    }

    # Evidence count 1 should NOT return Tier 3 trigger
    result = select_tom_trigger(triggers_by_tier, evidence_count=1, fired_triggers=[])
    assert result is None or result["id"] != "tier3"
```

**Impact**: High - Production bug affecting core Phase 4 feature, required debugger agent

**Prevention Checklist**:
- [ ] Add integration test loading real YAML when implementing YAML-driven features
- [ ] Validate business logic constraints (thresholds, priorities) in tests
- [ ] Test with actual data files, not just mocks
- [ ] Add regression tests for production bugs

---
