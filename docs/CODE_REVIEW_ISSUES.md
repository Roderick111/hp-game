# Code Review Issues Report — Auror Academy (hp_game)

**Date:** 2026-06-19  
**Branch:** feat/evidence-detection-natural-language  
**Version:** ~2.1.0 (post 5-wave refactor, 868 tests passing)  
**Review Method:** 9 parallel specialized `code-reviewer` sub-agents (one per objective)  
**Instructions followed:** Each ran listed tools *first* (exact output captured), then manual deep review. Every finding tagged `TOOL-caught` or `MANUAL-only`. Severity: CRITICAL / HIGH / MEDIUM / LOW. File:line references required.

**Project stack (critical context):**  
- Backend: Python 3.13 + FastAPI + SQLite (WAL) + bounded LRU `_state_cache` + LiteLLM (BYOK + server keys) + SSE streaming  
- Frontend: React 18 + TS + Vite + Bun + Zod `.strict()`  
- Core pattern: per-request `load_slot_state → mutate (evidence/trust/history) → save_slot_state` after LLM  
- Auth: HMAC player tokens (`X-Player-Token`) + `/api/session` bootstrap  
- State: `PlayerState` god object (evidence, witness_states, verdict, briefing, inner_voice, histories) persisted as JSON  
- Evidence: `discovery_guidance` (semantic) + LLM emits `[EVIDENCE: id]`  
- No Rust/Cargo in tree (cargo tools expected to fail)

**Key meta-finding (all 9 agents):**  
Tool hygiene was mostly clean (ruff only import-order, FE lint/type-check clean, tests green, machete "good job" on wrong manifest). **Every CRITICAL and HIGH issue was discovered by MANUAL review.** Tools gave baseline; LLM analysis found the real problems.

---

## Tool Outputs (Exact — as reported by agents)

### Listed Rust tools (run first by objectives 1,2,8)
```
cargo audit
    Fetching advisory database...
    Loaded 1134 security advisories
error: not found: Couldn't load Cargo.lock
```

```
cargo clippy -- -D warnings
error: could not find `Cargo.toml` in `/.../hp_game` or any parent directory
```

```
cargo bloat --release --crates -n 20
Error: could not find `Cargo.toml`...
```

```
cargo machete
cargo-machete didn't find any unused dependencies in this directory. Good job!
```

```
cargo tree --duplicates
error: could not find `Cargo.toml`...
```

`ls target/release/findr` / raycast-extension → not found (expected — Python/TS project)

### Actual project tools (run by agents)
- `uv run ruff check .` → **6 errors** (all `E402 Module level import not at top of file` in `backend/src/api/helpers.py:48-59`)
- `uv run mypy src/` → **51 errors** in 12 files (no-any-return, arg-type on `surface_elements: list[dict]` vs `list[str]|None`, missing annotations, call-arg `current_location`, dict type params, etc.)
- `uv run pytest --tb=no -q` → **868 passed, 4 skipped**
- `cd frontend && ~/.bun/bin/bun run lint` → clean (exit 0)
- `cd frontend && ~/.bun/bin/bun run type-check` → clean
- `cd frontend && ~/.bun/bin/bun run build` → success (JS chunk 592kB raw / ~176kB gz; one >500kB warning; PWA precache large)

**No Cargo.toml anywhere in tree.** No `raycast-extension`.

---

## 1. Security (OWASP)

**Focus:** injection, path traversal, auth/IDOR, info disclosure, rate limit bypass, supply chain, unsafe deserial.

**TOOL-caught:** Only ruff E402 + mypy noise. No CVEs surfaced (no lock).

### CRITICAL (MANUAL)
1. **backend/src/api/routes/session.py:36** (also auth.py:36-55, dependencies.py, base.ts:45-62, persistence.py)  
   `existing_player_id` accepted with zero ownership proof. `POST /api/session` mints valid HMAC token for any UUID. Leaked player_ids (localStorage, telemetry, test saves, shared devices) allow full impersonation of any player's state/saves. Classic IDOR / broken access control.  
   *Fix:* Remove `existing_player_id` or require proof (existing valid token re-mint only).

2. **backend/src/api/routes/saves.py:79-80,116-117** (and similar in load/reset paths)  
   Error responses include raw `f"Failed to save: {e}"`. Leaks internal details (SQLite errors, state corruption paths). CWE-209 info disclosure.  
   *Fix:* Generic client messages + full logging server-side.

### HIGH (MANUAL)
3. `backend/src/api/auth.py:42` + session.py — Tokens never expire. Compromise of `PLAYER_TOKEN_SECRET` = permanent access to everything. No rotation/revoke/nonce.
4. `backend/src/api/rate_limit.py:12-15` — Trusts first segment of `X-Forwarded-For` with no validation. Public endpoints (`/session`, `/cases`) can be bucket-isolated or DoS'd via spoofed headers behind proxy.
5. `backend/src/case_store/loader.py:44` vs `schemas.py` (InvestigateRequest etc.) — Inconsistent regex (`^[a-zA-Z0-9_]+$` vs `^[a-zA-Z0-9_-]+$`). Can cause 500s or bypass intent on `-`.
6. Public unauthed endpoints (`/case/{case_id}/location/...` in cases.py:32, saves.py:241) leak case structure without token.

### MEDIUM / LOW (MANUAL + 1 TOOL)
- CORS overly permissive (`allow_methods/headers=*`, creds true) in main.py:75-91.
- Partial exception details in llm_client.py, telemetry, saves.
- `json.loads` + `PlayerState(**data)` on persisted data + world-readable telemetry JSONL.
- `/llm/verify` (5/min) accepts arbitrary api_key/provider with no auth (key-testing abuse).
- Supply chain: loose `>=` pins in pyproject.toml, no hash pinning visible.
- TOOL: Wrong import prefix + E402 in helpers.py:644 (minor runtime risk).

**Good (noted):** Parameterized queries, `yaml.safe_load`, `compare_digest`, body size limits, no `eval`/`subprocess`/`shell`, keys not logged in responses.

---

## 2. Performance

**Focus:** hot paths, allocations, blocking I/O, linear scans, prompt bloat.

**TOOL:** bloat/clippy failed (no Cargo). Build size + du captured.

### CRITICAL (MANUAL)
1. `backend/src/state/persistence.py:143-147` (and all routes) — Sync `sqlite3.execute` + commit inside async handlers. Every `investigate`/`interrogate`/`present`/`verdict` blocks the event loop.
2. `backend/src/api/helpers.py:447,452,465` — `model_copy(deep=True)` on full `PlayerState` (histories + witness dicts) on every cache hit/miss + save. Plus `json.dumps(full_state)` every action.
3. `backend/src/api/helpers.py:430-432` — Manual LRU dict with `next(iter()) + del` = O(n) on every access under load.

### HIGH / MAJOR (MANUAL)
4. `investigation.py:68` + `location/parser.py:199-222` — New `LocationCommandParser` + full tokenization + `SequenceMatcher` per request. Candidates rebuilt every time.
5. `witnesses.py:74-87` + `calculate_pressure` / `_build_evidence_index` — Full scan of all locations + all hidden_evidence + `evidence_shown` lists on every interrogate/present.
6. Stream handlers (`investigation.py:378,401,427`, witnesses etc.) — `full_response += chunk`, `state.model_dump(mode='json')`, `json.dumps` inside generators on every token + done.
7. `context/narrator.py:61-88,216` + witness.py — Rebuilds full evidence sections, history slices, victim, not_present, surface for **every** LLM call. Linear growth with conversation.
8. `player_state.py:566` — `if x not in discovered_evidence` (list scan) on every evidence add.
9. No reuse of immutable case sub-structures (locations, evidence index). `list_locations` rebuilt multiple times per turn.
10. SSE `stream_with_keepalive` + per-chunk `wait_for(15s)` overhead on every LLM token.

**Build note:** Single ~592 kB JS chunk (exceeds 500 kB warning). Large PWA precache.

**Suggestions (from agent):** Pre-compute indexes on case load, use sets + proper LRU (cachetools), cap history harder, split FE chunks, offload DB to thread or aiosqlite.

---

## 3. Error Handling

**Focus:** swallowed errors, post-yield work, loss of work, user messages, recovery.

**No tools — pure manual.**

### CRITICAL (MANUAL)
1. `investigation.py:395-427` + `witnesses.py:419-449` — Evidence extraction, state mutation, and `save_slot_state` happen **after** yielding chunks to client. Any exception or client disconnect → partial UI text + "Connection lost". Server state not updated. Reload loses the turn.
2. `helpers.py:463-468` — `save_slot_state` returns False on failure (just pops cache + logs). Callers (streams, `save_conversation_and_return`, verdict, etc.) proceed to send `done` + `updated_state` anyway. Silent data loss. Only the explicit `/save` endpoint checks the bool.
3. Frontend `LocationView.tsx:461-476` + `useWitnessInterrogation.ts` — On stream error, placeholder + accumulated chunks stay in history forever (no rollback, no "failed" marker).
4. `verdict.py:88-162` — `add_attempt` + mutations before LLM feedback + save. Outer exception or save failure can consume attempts without persisting.

### MAJOR (MANUAL)
- `llm_client.py` fallback paths raise wrapped errors; streams return generic "An error occurred..." with no code/type.
- `main.py:97-109` top-level handler: only `str(exc)[:200]`, no traceback for client, streaming errors often bypass.
- `stream_with_keepalive` + generators have weak finally / reader cleanup.
- `frontend/base.ts streamSSE`: silent skips on parse fail; no reader release in all paths.
- `persistence.py`: broad `except Exception` → return False/None. `load` swallows most errors to "fresh state".
- Many routes return `success:false` or raw `e` to client with no retry guidance.

**Minor:** bare `except: pass` in health; some fallbacks swallow `exc_info`.

**Suggestion:** Typed error payloads (`{code: "persist_fail" | "llm_timeout"}`) instead of bare strings.

---

## 4. Concurrency

**Focus:** races, lost updates, shared mutable, TOCTOU, SSE closure issues.

**No tools — pure manual.**

### CRITICAL (MANUAL)
1. `helpers.py:442-452` + investigation/witnesses streams + saves — Classic lost-update: `load_slot_state` (deep copy) → mutate → `save_slot_state` (upsert). Two concurrent actions (multi-tab, rapid clicks, overlapping SSE) both write; last writer wins. Evidence, trust deltas, histories, verdict attempts disappear.
2. `helpers.py:420,427-433` — Global `_state_cache: dict` with zero locks. `get/pop/put/LRU eviction` are non-atomic. Concurrent requests interleave around awaits.
3. `persistence.py:35-46,111-121,143-147` — Single global `_conn` (`check_same_thread=False`) + blind `INSERT ... ON CONFLICT` with no transactions or version column around read-modify-write. WAL + busy_timeout insufficient at app level.

### MAJOR (MANUAL)
4. Slot load/copy paths in `saves.py` mix direct `load_player_state` (bypass) with cache invalidation → cache/DB divergence.
5. Inconsistent load paths (`load_slot_state`, `load_player_state`, `resolve_location`, `load_or_create_state`).
6. SSE generators close over `ctx.state` or `witness_state`. Mutations + save happen only after full LLM response. Abort/disconnect leaves partial state or skipped save.
7. Frontend hooks fire independent fetches/streams with only per-witness AbortControllers. No action queue or versioning.
8. Sync I/O + global cache increases race windows under load.

**Minor:** LRU eviction relies on dict insertion order and is racy.

**Test note:** `test_concurrency_state.py` exists but only exercises limited cases via sleeps + bypass helpers.

---

## 5. Architecture

**Focus:** atomicity, dual stores, coupling, scalability walls, god objects.

**No tools — pure manual.**

### CRITICAL (MANUAL)
1. No atomic "LLM work + state mutation + persist". Work after LLM is lost on any failure (see Error Handling + Concurrency).
2. `saves.py:49-68` — Named slot "save" is lossy. For non-autosave it does selective field overwrite on autosave copy instead of true snapshot. Discards witness history, verdict state, etc.
3. Triple-store with zero reconciliation: SQLite (authoritative) + `_state_cache` (LRU deep copies) + frontend useState/useReducer + `hp_game_location_*` localStorage. Direct bypass loads + copy-to-autosave on named load create drift.

### MAJOR (MANUAL)
4. `player_state.py:530-735` — God struct owns **everything**. Violates SRP. Every feature walks/mutates the same object.
5. `helpers.py` (load/save_slot_state etc.) called from nearly every route. No repository boundary. "Vertical slice" claim is thin wrappers around shared state.
6. Linear lists everywhere (`discovered_evidence`, `evidence_shown`, visited) + repeated full scans. No indexes.
7. Case YAML (immutable, cached) and runtime PlayerState have no cross-validation on load. Version field unused.
8. All persistence happens synchronously on request path after LLM. No background/outbox/retry.
9. Frontend optimistic slices (witness reducer, investigation evidence) + backend `updated_state` ignored in many paths → divergence on error.

**Medium:** Inconsistent "default" vs "autosave" handling, location split (LS vs server), outdated CLAUDE.md claiming PostgreSQL + clean vertical slices.

**Suggestions:** Compose PlayerState from feature slices behind a Repository. Add reconcile step. Pre-compute case indexes.

---

## 6. API / CLI Ergonomics

**Focus:** error messages, defaults, discoverability, schema correctness, edge cases.

**No tools — pure manual.**

### CRITICAL (MANUAL)
1. `frontend/src/api/schemas.ts:68` (SaveResponse) omits `slot`. Backend always returns it. Divergent strict Zod = runtime parse failures surface as ugly "Invalid API response".
2. SSE `onDone` paths receive raw `Record` (no Zod validation) despite "all responses validated" contract. `InvestigateResponse` etc. drift.

### MAJOR (MANUAL)
3. "autosave" + "default" magic defaults everywhere (20+ call sites, schemas, UI). Users expect independent slots.
4. Raw `detail` from HTTPException / 422 / pydantic errors bubble directly to toasts ("Case not found...", "Invalid slot...").
5. Discoverability disasters: Tom requires "tom " prefix (no UI hint), spells require exact phrasing (handbook only), evidence presentation hidden in modals.
6. `useLocation.ts` localStorage restore independent of server `current_location`. Reload surprises user.
7. No client-side length caps. Backend 1000/2000 char limits produce raw validation errors.

**Minor:** Some deprecated fields kept for compat; BYOK paths bypass apiCall+Zod.

**Suggestion:** Central error formatter + visible hints for Tom/spells.

---

## 7. Testability

**Focus:** seams, coverage of edges, globals, flakiness.

**No tools — pure manual.**

### CRITICAL (MANUAL)
1. `tests/conftest.py:118` — `disable_rate_limiting` autouse fixture. **Rate limiting logic, per-player buckets, 429 paths, XFF handling never exercised in normal test runs.**
2. Persistence seam is 10+ `monkeypatch.setattr` on module globals + direct imports. Extremely fragile. Adding an import breaks tests.
3. `llm_client.py:352` singleton `get_client()` + env side-effects. Every test patches at the caller's import path. Mid-stream, BYOK, fallback paths are painful to test.
4. Module globals (`_state_cache`, `_conn`, `_case_cache`) make true isolation/race testing nearly impossible.

### MAJOR (MANUAL)
5. Route handlers mix load, detection, prompt build, client call, stream framing, post-processing, save, telemetry — almost no pure logic units.
6. Auth override is too permissive; real 401 paths lightly tested.
7. `_case_cache` shared across all tests (mutation pollution risk).
8. Many edges untested or only incidental: unicode in inputs, cache eviction, concurrent named vs autosave, mid-stream persist failure outcomes (explicitly marked REGRESSION in some tests).
9. Heavy use of `asyncio.sleep` + patching `_KEEPALIVE_INTERVAL` for timing-sensitive SSE/concurrency tests. No fake clock.
10. Large parts of frontend hooks (`useSaveSlots`, `useGameActions`, `useTomChat`, etc.) have no tests or only full-module mocks.

**Minor:** Duplicated client fixtures, patching of private names (`_KEEPALIVE_INTERVAL`, `_state_cache`).

**Suggestion:** Introduce `LLMClient` protocol + `StateRepository` protocol now.

---

## 8. Dead Code & Dependencies

**Focus:** unused code, stale imports, bloat, config drift.

**TOOL first** (see above — machete "clean" on non-Rust tree; ruff only E402; FE clean).

### MAJOR (MANUAL)
1. `backend/src/state/player_state.py:62+` — ~180+ lines of dead Phase 5.5 models: `Victim`, `EvidenceEnhanced`, `WitnessEnhanced`, `TimelineEntry`, `SolutionEnhanced` etc. Never imported or used in `src/`. Only old tests/docs.
2. Root `package.json` + `bun.lock` (and frontend `package-lock.json`) are dead artifacts from pre-split layout. All real work is inside `frontend/`.

### MINOR (MANUAL)
3. `helpers.py:356` — `is_affirmative_mention` (marked legacy) — zero callers in src.
4. `case_store/loader.py:291` — `load_wrong_suspects` — unused (verdict uses different loader).
5. `spells/definitions.py` — `list_safe_spells` / `list_all_spells` — unused outside tests.
6. `context/inner_voice.py:180` — `clear_trigger_cache` — no callers.
7. `pyproject.toml:53` — `exclude = ["src/api/routes_old.py"]` — file does not exist.
8. `helpers.py:644` — `from backend.src.spells...` (wrong prefix, triggers mypy).
9. State `__init__.py` exports dead names (`save_state`, `load_state`, etc.) not used outside the package.
10. Empty `frontend/src/components/phases/` dir.
11. Stale docs references to deleted files (`useInnerVoice.ts`, old types, etc.).

**Suggestions:** Delete root manifests + package-lock. Remove dead models + legacy funcs. Clean stale excludes.

---

## 9. API Design

**Focus:** signatures, abstractions, consistency, contracts, god objects.

**No tools — pure manual.**

### CRITICAL (MANUAL)
1. `backend/src/api/schemas.py:60` (and 8 other response models) — `updated_state: dict[str, Any] | None` leaks the entire internal `PlayerState` (including witness_states, multi-histories, etc.) as raw JSON on the public wire. Violates encapsulation. Zod `.strict()` on other fields cannot save you.
2. `backend/src/state/player_state.py:530` — God struct. One class owns evidence, all histories, all witness state, verdict, briefing, inner_voice, spell counters. Cross-domain ownership is unclear.

### MAJOR (MANUAL)
3. Prompt/context builders have terrible signatures:
   - `build_narrator_or_spell_prompt(...)` — 15 params
   - Similar for witness, moody variants, spell effects (9–12 params each).
   - Return raw tuples `(str, str, bool)`.
4. Every request model (`InvestigateRequest`, `InterrogateRequest`, ..., `SaveRequest` etc.) duplicates `case_id`, `player_id`, `slot` (with magic defaults). No `PlayerContext` / `Session` type.
5. Schema drift between backend Pydantic and frontend Zod (`InvestigateResponse` missing fields in TS; `SaveResponse` missing `slot`; trust_delta optionality mismatches; deprecated fields).
6. Public endpoints return full `state.model_dump()` or raw dicts instead of narrow DTOs.
7. Complex assembly logic (`resolve_location`, `save_conversation_and_return`) lives in helpers and leaks into routes.

**Minor:** Tuple returns instead of NamedTuple/dataclass, re-exports for tests in routes/__init__.py, manual body dicts in frontend saves.ts.

**Suggestions:** Extract `PlayerContext`. Define narrow public response models. Never dump internal state. Use builders or context objects for the big signatures. Treat Zod as the contract source of truth and gate changes.

---

## Cross-Cutting Themes (hit by multiple agents)

- **State & Persistence is the biggest risk area**: lost updates, silent save failures, non-atomic LLM+save, god object, triple-store drift, sync-in-async.
- **SSE post-processing anti-pattern**: work after `yield` + client-visible partial state.
- **Auth surface**: session bootstrap is too permissive; tokens immortal.
- **Contract & schema hygiene**: `updated_state` leaks + repeated drift between Pydantic/Zod.
- **Test seams are rotting**: globals + singletons + global disables mean real concurrency, rate limiting, and error recovery are under-tested.
- **Linear everything**: lists, scans, prompt rebuilds, parser rebuilds on every hot-path request.
- **Legacy bloat**: Phase 5.5 models, inner_voice vs Tom naming, "default" vs "autosave", stale docs/config.

---

## Overall Verdict

**CHANGES REQUESTED — MULTIPLE CRITICAL BLOCKERS**

- Security: session takeover is production-blocker for any real users.
- Concurrency + Error Handling + Architecture: data loss under normal multi-tab / network hiccup usage.
- State management and contract leaks are systemic.

**Tool value assessment (from this run):**  
cargo-* tools: low signal (wrong stack).  
ruff/mypy/pytest/bun: useful hygiene baseline.  
**Manual LLM review**: 100% of the important findings.

---

## Prioritized Remediation (suggested order)

1. **Security CRITICAL** — Fix `/api/session` (remove or prove `existing_player_id`). Add token expiry/claims.
2. **State atomicity + persistence** — Make load-mutate-save atomic (version column + optimistic locking or per-key locks). Fix `save_slot_state` to raise on failure for critical paths. Move saves off the hot path where possible.
3. **Kill deep copies on hot path** + replace manual LRU or protect it.
4. **Remove `updated_state: dict` leaks** (replace with narrow typed summary or deltas). Align all Pydantic <-> Zod exactly.
5. **Split or heavily encapsulate PlayerState** (or introduce repository + feature slices).
6. **Fix SSE post-processing** — process evidence/state mutations before or in a guaranteed finally, or use two-phase (provisional then commit).
7. **Test seams** — Introduce protocols for LLMClient + StateRepository. Enable rate limiting in some test matrix. Add fake clock for SSE/concurrency.
8. **Dead code removal** — Delete Phase 5.5 enhanced models, legacy funcs, root package artifacts, stale excludes.
9. **Ergonomics & discoverability** — Friendly errors, visible Tom/spell hints, consistent slot naming in UI.
10. **Performance follow-ups** — Precompute case indexes, async DB driver (or offload), reduce per-turn serialization/prompt rebuilds.

---

## Files Heavily Reviewed (representative)

**Backend core:**  
`src/api/{main.py, helpers.py, llm_client.py, schemas.py, auth.py, dependencies.py, rate_limit.py, llm_config.py}`  
`src/api/routes/{investigation.py, witnesses.py, saves.py, verdict.py, session.py, cases.py, briefing.py, inner_voice.py, legilimency.py, ...}`  
`src/state/{persistence.py, player_state.py}`  
`src/case_store/loader.py`  
`src/context/{narrator.py, witness.py, ...}`  
`src/location/parser.py`  
`src/utils/{evidence.py, trust.py}`

**Frontend core:**  
`src/api/{base.ts, schemas.ts, client.ts, investigation.ts, witnesses.ts, saves.ts, ...}`  
`src/hooks/{useInvestigation.ts, useWitnessInterrogation.ts, useSaveSlots.ts, useGameActions.ts, useLocation.ts, ...}`  
`src/components/{LocationView.tsx, ErrorBoundary.tsx, AurorHandbook.tsx, SaveLoadModal.tsx, ...}`

**Tests & config:** `backend/tests/conftest.py` + many test_*.py (concurrency, sse, auth, routes), `frontend/src/test/`, pyproject.toml, package.json(s).

**Docs:** root CLAUDE.md, backend/CLAUDE.md, frontend/CLAUDE.md, STATUS.md.

---

**Generated by orchestrator after 9 parallel code-reviewer agents.**  
Do not edit this file manually without re-running the process. For fixes, create focused PRs per theme or per severity.

Next step recommendation: Pick the top 3 CRITICAL clusters (session auth, atomic persist, `updated_state` leak) and produce a minimal PRP + implementation.

---

## Gemini Cross-Review Delta (2026-06-19)

Additional review run against the same codebase. This section lists **new or differently-emphasized issues** found by the Gemini analysis that were **not explicitly called out** (or were only weakly covered) in the 9-agent report above.

All items below were manually verified against current source.

### Confirmed New / Stronger Issues

**Security / Ergonomics**
- **frontend/src/api/telemetry.ts** (no `getAuthHeaders()`, no `X-Player-Token`): All telemetry calls omit the player token. Backend routes (`telemetry.py`) require `Depends(get_authenticated_player_id)`. Result: every telemetry event and error is rejected with 401. Fire-and-forget so it is silent.
  - Tag: MANUAL
  - Severity: HIGH (lost observability)
- **frontend/src/api/base.ts:66-73** (`ensureSession`): Only bootstraps if `getStoredToken()` is falsy. On secret rotation or invalid token → 401s. No clearing of bad token + re-bootstrap. Clients stuck until manual localStorage clear.
  - Tag: MANUAL
  - Severity: MEDIUM-HIGH (support pain)
- **frontend/src/api/investigation.ts:90** (`changeLocation`): Hardcodes `slot: 'autosave'` and ignores the active slot from the caller. Mutations on manual slots leak into autosave.
  - Tag: MANUAL
  - Severity: MEDIUM

**Error Handling + Concurrency**
- **backend/src/api/routes/legilimency.py:71-82** (and similar spell paths): Trust penalties, `legilimency_detected`, and `spell_attempts` incremented **before** the LLM narration call. On `ClaudeClientError` or timeout, penalties are permanent even though the spell "didn't happen" from player view.
  - Tag: MANUAL
  - Severity: HIGH (unfair punishment)

**Architecture / API Design**
- **backend/src/api/routes/verdict.py:97-106**: `build_mentor_feedback(...)` is called but its return value is completely discarded. Response then hardcodes `critique=""`, `praise=""`, `fallacies_detected=[]`. Detailed template feedback is thrown away.
  - Tag: MANUAL
  - Severity: HIGH
- **backend/src/api/routes/verdict.py:60-64** (no early guard): Expensive `evaluate_reasoning_llm` + `build_moody_feedback_llm` are always run even when `verdict_state.case_solved` is already True. Only `attempts_remaining` is checked.
  - Tag: MANUAL
  - Severity: MEDIUM-HIGH (wasted LLM spend)
- **backend/src/context/narrator.py:538** + **investigation.py:338** + **spell_llm.py**: Two different spell detectors in the hot path.
  - Route: `detect_spell_with_fuzzy` (fuzzy + semantic phrases)
  - Narrator path: `is_spell_input` + `parse_spell_from_input` (regex-based)
  - Minor typos can trigger "spell mode" in route but fall back to plain narrator inside the prompt builder.
  - Tag: MANUAL
  - Severity: MEDIUM (inconsistent UX)
- **backend/src/api/model_catalog.py:23**: `_refresh_lock = asyncio.Lock()` at module import time. Binds to whatever event loop is active at first import. Breaks on uvicorn reloads and in test environments (`RuntimeError: ... attached to a different loop`).
  - Tag: MANUAL
  - Severity: MEDIUM

**Testability**
- **frontend/src/App.tsx:51**: `const PLAYER_ID = getOrCreatePlayerId();` runs at module evaluation time (top level). Calls `localStorage` during import. Breaks JSDOM/headless test environments before any React render.
  - Tag: MANUAL
  - Severity: HIGH (many frontend tests fragile or skipped)

**Dead Code / Hygiene**
- **backend/src/case_store/loader.py:291**: `load_wrong_suspects(...) -> list[dict[str, Any]]` but implementation does `case.get("wrong_suspects", [])` and the YAML + `fallacies.py` treat it as a dict (`wrong_suspects.items()`). Type lie + wrong default.
  - Tag: MANUAL
  - Severity: MEDIUM
- **.gitignore:64-65**: Explicitly ignores `frontend/src/api/telemetry.ts` and `frontend/src/test/render.tsx`. Both are required for production telemetry and test rendering.
  - Tag: MANUAL
  - Severity: LOW-MEDIUM (broken builds/tests in clean clones)

**Performance (new angle)**
- **frontend/src/components/LocationHeaderBar.tsx** + `investigation.ts:81`: Location tab clicks trigger `changeLocation` + subsequent `loadState` + `getLocation` (3 round-trips). State should be returned in the change-location response.
  - Tag: MANUAL
  - Severity: MEDIUM (already partially noted in perf section)

### Issues That Largely Overlap (already covered)
- Session IDOR / public token minting
- Post-stream exception suppression + silent save failures
- Concurrent load-mutate-save lost updates
- Sync SQLite on event loop
- Sync telemetry appends
- God PlayerState + cache deepcopy races
- `updated_state: dict` leaks
- Global mocking making real persistence untested
- Bundle size >500kB
- Schema drift / player_id redundancy

### Gemini Remediation Ideas Worth Considering
1. Real DB in tests via `HP_GAME_DB_PATH` env + per-test `DELETE FROM saves` (better than pure monkeypatch).
2. Simple per-(player,case,slot) `asyncio.Lock` registry in helpers for the critical LLM+save sections.
3. Treat player UUID as secret + audit all logs/telemetry/error paths for leakage (good hygiene).

### Overall Delta Assessment
Gemini found ~10-12 additional concrete, actionable items (mostly integration, frontend-global, mutation-ordering, and detector-split issues) that the 9-agent pass did not surface explicitly. Most are MEDIUM-HIGH rather than new CRITICALs.

No major contradictions. The two reviews are complementary.

**Recommendation**: Merge the new items above into the main issues list or a follow-up wave. Prioritize the telemetry auth bypass, pre-LLM mutation penalties, discarded mentor feedback, and App.tsx global side-effect.
