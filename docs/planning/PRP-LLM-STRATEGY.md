# PRP: LLM Cost & Model Strategy

**Status:** IMPLEMENTED (needs testing)
**Priority:** HIGH
**Created:** 2026-04-06
**Depends on:** Phase 1 Multi-LLM (COMPLETE — see `PRP-MULTI-LLM-PROVIDER.md`)

---

## Problem

1. **No free tier** — current default is `claude-sonnet-4` via OpenRouter, costs real money per request
2. **No BYOK** — users can't bring their own API keys, locked to server-side keys
3. **No streaming** — all LLM calls block until full response, bad UX for longer outputs
4. **Dead code** — `claude_client.py` still exists, exported from `api/__init__.py`, used by nothing

---

## Current State

| Component | Status | File |
|-----------|--------|------|
| LiteLLM unified client | DONE | `backend/src/api/llm_client.py` |
| Pydantic LLM settings | DONE | `backend/src/config/llm_settings.py` |
| 4 providers (OR/Anthropic/OpenAI/Google) | DONE | via LiteLLM |
| Fallback mechanism | DONE | primary → fallback model |
| Cost logging | DONE | per-request logging |
| Old claude_client.py | DEAD CODE | `backend/src/api/claude_client.py` |
| SettingsModal | EXISTS | theme + verbosity + audio only, no LLM settings |
| BYOK | NOT STARTED | — |
| Streaming | NOT STARTED | — |
| Free tier model | NOT STARTED | — |

Modules calling `get_client()`: `routes.py` (narrator L1171, witness L1929, spells L2042, L2244), `briefing.py` (L225), `mentor.py` (L670)

---

## Implementation Plan

### Step 1: Cleanup + Free Tier Default

**Goal:** Delete dead code, set MiMo-V2-Flash as default free model.

**Backend:**

1. Delete `backend/src/api/claude_client.py`
2. Update `backend/src/api/__init__.py` — remove claude_client imports, export from llm_client
3. Update `llm_settings.py` default model:
   ```python
   DEFAULT_MODEL: str = "openrouter/moonshotai/mimo-v2-flash"
   FALLBACK_MODEL: str = "openrouter/google/gemini-2.0-flash-001"
   ```
4. Test MiMo-V2-Flash works via OpenRouter + LiteLLM (need to verify model ID on OpenRouter)

**Verification:**
- All 6 LLM call sites still work
- No imports of claude_client anywhere
- MiMo generates coherent game responses

**Open questions:**
- MiMo-V2-Flash exact model ID on OpenRouter? need to check
- Is MiMo actually free on OpenRouter or just cheap?
- Quality good enough for narrator/witness/verdict prompts?

---

### Step 2: BYOK (Bring Your Own Key)

**Goal:** Users enter their own API key + choose model via Settings UI. Keys stay client-side, sent per-request in headers.

#### Backend

**2.1 — Extend `LLMClient.get_response()` to accept user overrides:**

```python
# llm_client.py — add api_key and model params
async def get_response(
    self,
    prompt: str,
    system: str | None = None,
    max_tokens: int = 1024,
    temperature: float = 0.7,
    api_key: str | None = None,    # user-provided
    model: str | None = None,      # user-provided
) -> str:
```

In `_call_llm`, pass `api_key` to `acompletion()` if provided. Use `model` override if provided.

**2.2 — Add dependency to extract user config from headers:**

```python
# backend/src/api/dependencies.py (new file)
from fastapi import Header
from dataclasses import dataclass

@dataclass
class UserLLMConfig:
    api_key: str | None = None
    model: str | None = None

def get_user_llm_config(
    x_user_api_key: str | None = Header(None),
    x_user_model: str | None = Header(None),
) -> UserLLMConfig:
    return UserLLMConfig(api_key=x_user_api_key, model=x_user_model)
```

**2.3 — Update all 6 LLM call sites in `routes.py`** to accept `UserLLMConfig` dependency and pass to `get_response()`.

**2.4 — Add `/api/llm/verify` endpoint:**

```python
@router.post("/llm/verify")
async def verify_api_key(provider: str, api_key: str) -> dict:
    """Test user's API key with minimal LLM call."""
    # acompletion with api_key param, max_tokens=5
    # Return {"valid": True} or {"valid": False, "error": "..."}
```

**2.5 — Add `/api/llm/models` endpoint (optional, stretch):**

Return curated list of recommended models per provider. Can be static initially, dynamic later.

#### Frontend

**2.6 — Add LLM section to `SettingsModal.tsx`:**

New section between "NARRATOR STYLE" and "AUDIO":

- Provider dropdown (OpenRouter / Anthropic / OpenAI / Google / None)
- API key input (password field + show/hide toggle)
- Verify button → calls `/api/llm/verify`
- Model text input (e.g. `anthropic/claude-sonnet-4`) or dropdown of recommended models
- "Using free tier (MiMo-V2-Flash)" indicator when no key set

**2.7 — Store in localStorage:**

```typescript
interface LLMSettings {
  provider: string | null;
  apiKey: string | null;
  model: string | null;
}
// Key: 'hp_llm_settings'
```

No encryption — keys are user's own, stored locally like any browser extension. Users who enter API keys understand the browser trust model.

**2.8 — Update API client to send headers:**

```typescript
// frontend/src/api/client.ts or wherever fetch calls live
const getLLMHeaders = (): Record<string, string> => {
  const raw = localStorage.getItem('hp_llm_settings');
  if (!raw) return {};
  const settings = JSON.parse(raw);
  const headers: Record<string, string> = {};
  if (settings.apiKey) headers['X-User-API-Key'] = settings.apiKey;
  if (settings.model) headers['X-User-Model'] = settings.model;
  return headers;
};
```

Add these headers to all fetch calls that hit LLM endpoints.

**Security:**
- Keys never stored on server
- Keys only sent to LLM providers via LiteLLM (not logged)
- No server-side key validation beyond the verify endpoint
- CORS already configured for frontend origin

---

### Step 3: Streaming

**Goal:** Stream LLM responses token-by-token via SSE for better UX.

#### Backend

**3.1 — Add streaming method to `LLMClient`:**

```python
async def get_response_stream(
    self,
    prompt: str,
    system: str | None = None,
    max_tokens: int = 1024,
    temperature: float = 0.7,
    api_key: str | None = None,
    model: str | None = None,
) -> AsyncGenerator[str, None]:
    """Stream LLM response chunks."""
    response = await acompletion(
        model=model or self.settings.DEFAULT_MODEL,
        messages=messages,
        max_tokens=max_tokens,
        temperature=temperature,
        api_key=api_key,
        stream=True,
    )
    async for chunk in response:
        content = chunk.choices[0].delta.content
        if content:
            yield content
```

**3.2 — Add SSE streaming endpoints:**

Create streaming variants of key endpoints. Use `StreamingResponse` from FastAPI:

```python
from fastapi.responses import StreamingResponse

@router.post("/investigate/stream")
async def investigate_stream(request: InvestigateRequest, ...):
    async def event_generator():
        async for chunk in client.get_response_stream(prompt, system=system_prompt):
            yield f"data: {json.dumps({'text': chunk})}\n\n"
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
```

Priority endpoints for streaming:
1. `/investigate/stream` — narrator (longest responses)
2. `/interrogate/stream` — witness responses
3. Others can stay non-streaming initially

**3.3 — Non-streaming fallback:** Keep existing endpoints as-is. Streaming is opt-in from frontend.

#### Frontend

**3.4 — Create `useStreamingResponse` hook:**

```typescript
function useStreamingResponse() {
  const [text, setText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const stream = async (url: string, body: object) => {
    setIsStreaming(true);
    setText('');
    const response = await fetch(url, { method: 'POST', body: JSON.stringify(body), headers: {...} });
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      // Parse SSE chunks, append text
      setText(prev => prev + parsed.text);
    }
    setIsStreaming(false);
  };

  return { text, isStreaming, stream };
}
```

**3.5 — Update investigation/interrogation UI** to use streaming hook. Show text appearing character-by-character. Fall back to non-streaming if SSE fails.

---

## Execution Order

```
Step 1 (cleanup + free tier)  →  Step 2 (BYOK)  →  Step 3 (streaming)
         ~1 hour                    ~3-4 hours            ~2-3 hours
```

Steps are independent enough to ship separately. Each is useful on its own.

---

## Unresolved Questions

1. MiMo-V2-Flash model ID on OpenRouter? free or just cheap?
2. MiMo quality sufficient for complex prompts (verdict, witness psychology)?
3. Streaming — does LiteLLM `stream=True` work with all 4 providers?
4. Should non-streaming endpoints be deprecated or kept forever?
5. Model list — static curated list vs dynamic OpenRouter API fetch?
6. Need rate limiting per-user when using server keys (free tier abuse)?
