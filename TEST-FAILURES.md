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
