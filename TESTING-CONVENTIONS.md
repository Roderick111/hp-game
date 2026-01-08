# Testing Conventions - Quick Reference

*One-liner rules extracted from TEST-FAILURES.md patterns.*

## Python/Backend

- **Always use `.model_dump()` for Pydantic JSON serialization** (Pattern #1)
- **Fixture can only depend on same or broader scope** (Pattern #6)
- **Use fixtures with `autouse=True` for test isolation** (Pattern #7)

## TypeScript/React/Frontend

- **Either add all deps to useEffect or explicitly disable with comment** (Pattern #2)
- **Use discriminated unions with literal type fields for proper narrowing** (Pattern #3)
- **Always await async operations in tests, use async test functions** (Pattern #4)
- **Add exports before importing, check barrel exports** (Pattern #5)
- **Check Tailwind purge config includes all component file paths** (Pattern #8)

## General

- **Check TEST-FAILURES.md FIRST when tests fail** (saves 10-20 min)
- **Document new patterns after debugging recurring issues** (2+ occurrences)
- **Read PLANNING.md + STATUS.md before running tests** (understand context)

---

For detailed error messages, fixes, and code examples, see [TEST-FAILURES.md](./TEST-FAILURES.md).
