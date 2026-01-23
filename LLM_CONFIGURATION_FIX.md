# Multi-LLM Configuration Fix

## Issues Found

### 1. Empty Responses from Free Model
Your primary model `openrouter/z-ai/glm-4.5-air:free` is returning empty responses. This typically indicates:
- Rate limiting on free tier
- Model incompatibility
- Free models may have limited availability

### 2. Incorrect Fallback Model Format
Current: `google/gemini-2.5-flash-lite`
**Should be:** `openrouter/google/gemini-2.5-flash-lite`

LiteLLM requires the provider prefix (`openrouter/`) for all OpenRouter models.

---

## Recommended Configuration

Update your `backend/.env` file:

```bash
# LLM Provider Configuration
DEFAULT_LLM_PROVIDER=openrouter

# OpenRouter API Key
OPENROUTER_API_KEY=sk-or-v1-your-key-here

# Primary Model (RECOMMENDED: Use a reliable paid model)
DEFAULT_MODEL=openrouter/anthropic/claude-sonnet

# Fallback Model (FIXED FORMAT with openrouter/ prefix)
FALLBACK_MODEL=openrouter/google/gemini-2.0-flash-lite
ENABLE_FALLBACK=true

# OpenRouter Metadata (optional)
OR_SITE_URL=https://github.com/yourusername/hp-investigation-game
OR_APP_NAME=HP Investigation Game
```

---

## Alternative Free Models to Try

If you want to test with free models first:

```bash
# Option 1: Gemini Flash (more reliable than GLM)
DEFAULT_MODEL=openrouter/google/gemini-2.0-flash-lite

# Option 2: Meta Llama
DEFAULT_MODEL=openrouter/meta-llama/llama-3.1-8b-instruct:free

# Option 3: Microsoft Phi
DEFAULT_MODEL=openrouter/microsoft/phi-4:free
```

**Note:** Free models have:
- Rate limits
- Lower quality responses
- Less reliability
- May return empty responses

---

## Recommended Paid Models

For production use, recommended paid models (low cost, high quality):

```bash
# Best Quality (Recommended)
DEFAULT_MODEL=openrouter/anthropic/claude-sonnet  # Auto-updates to latest version

# Fast & Cheap
DEFAULT_MODEL=openrouter/anthropic/claude-haiku

# Alternatives
DEFAULT_MODEL=openrouter/google/gemini-2.0-flash
DEFAULT_MODEL=openrouter/openai/gpt-4o-mini
```

---

## Testing After Configuration

After updating your `.env`:

```bash
cd backend
uv run python test_llm_quick.py
```

This will show:
- Your current configuration
- Whether API calls return actual content
- Fallback behavior

---

## Current Status

✅ **Multi-LLM system is installed and working**
✅ **Configuration loads correctly**
✅ **API connectivity established**
⚠️  **Model returns empty responses** (fix by changing model)
❌ **Fallback format incorrect** (add `openrouter/` prefix)

---

## Quick Fix Commands

1. Edit your .env file:
   ```bash
   cd backend
   nano .env  # or use your preferred editor
   ```

2. Update these two lines:
   ```bash
   DEFAULT_MODEL=openrouter/anthropic/claude-sonnet
   FALLBACK_MODEL=openrouter/google/gemini-2.0-flash-lite
   ```

3. Test again:
   ```bash
   uv run python test_llm_quick.py
   ```

Expected output:
```
✅ Response: 'Hello, detective!'
```

---

## Model Selection Guide

| Model | Cost | Speed | Quality | Use Case |
|-------|------|-------|---------|----------|
| `claude-sonnet` | Medium | Medium | Highest | Production |
| `claude-haiku` | Low | Fast | Good | Testing |
| `gemini-2.0-flash` | Low | Fast | Good | Budget option |
| `gpt-4o-mini` | Low | Fast | Good | Alternative |
| Free models | Free | Varies | Variable | Development only |

---

## Next Steps

1. Update `.env` with recommended configuration
2. Run `uv run python test_llm_quick.py`
3. If successful, run full integration test: `uv run python test_llm_integration.py`
4. Start backend: `uv run uvicorn src.main:app --reload`

---

**Need help?** Check OpenRouter dashboard for:
- Available models: https://openrouter.ai/models
- API credits: https://openrouter.ai/credits
- Usage stats: https://openrouter.ai/activity
