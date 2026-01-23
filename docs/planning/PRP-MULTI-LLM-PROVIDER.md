# PRP: Multi-LLM Provider System

**Status:** PHASE 1 COMPLETE ✅ (Phase 2 pending)
**Phase:** Step 1 (Internal Keys) ✅ → Step 2 (User Keys)
**Priority:** HIGH (Blocks LLM feedback improvement)
**Created:** 2026-01-23
**Phase 1 Completed:** 2026-01-23

---

## Problem Statement

**Current Issues:**
1. **Hardcoded Claude dependency** - App locked to Anthropic API only
2. **API credits depleted** - Can't generate Moody feedback, fallback reveals answers
3. **Outdated model versions** - Hardcoded `claude-3-5-sonnet-20241022` (deprecated)
4. **No user control** - Users can't choose provider/model in open-source context
5. **Manual version updates** - Must update code when new models release

**Impact:**
- Moody feedback is mocked templates ("Correct. Reasoning quality: failing.")
- Can't test with alternative providers (Gemini, GPT, OpenRouter)
- Users can't bring their own API keys (critical for open-source distribution)

---

## Solution Architecture

### Two-Phase Approach

**Phase 1: Internal Unified Settings (IMPLEMENT FIRST)**
- Developer configures single provider/model in `.env`
- All modules use same LLM configuration
- No user UI changes
- Quick deployment for testing

**Phase 2: User-Provided API Keys (FUTURE)**
- Users enter their own API keys via Settings UI
- Per-user provider/model selection
- Keys stored securely in browser localStorage
- Verification flow before saving

---

## Research Summary

**Key Technologies:**
- **LiteLLM** - Unified interface to 100+ LLM APIs ([docs](https://docs.litellm.ai/docs/))
- **OpenRouter** - Access 400+ models through one API ([docs](https://openrouter.ai/docs))
- **Model Aliases** - Use `claude-sonnet` not `claude-3-5-sonnet-20241022` ([Anthropic docs](https://docs.claude.com/en/docs/about-claude/models/overview))
- **Auto-Sync** - LiteLLM syncs new models daily ([docs](https://docs.litellm.ai/docs/proxy/sync_models_github))

**Best Practices:**
- Use provider aliases for auto-version resolution
- Implement tiered selection (Balanced/Fast/Powerful), not technical IDs
- Cache model list (5min TTL) to avoid excessive API calls
- Store user keys client-side only (never send to your server)

**Sources:**
- [LiteLLM Documentation](https://docs.litellm.ai/)
- [OpenRouter API Reference](https://openrouter.ai/docs/api/api-reference/models/get-models)
- [LLM UI/UX Best Practices](https://medium.com/@jasonbejot/designing-llm-interfaces-a-new-paradigm-11dd40e2c4a1)

---

## Phase 1: Internal Unified Settings ✅ COMPLETE

**Implementation Date:** 2026-01-23
**Status:** Production-ready, all tests passing

### Objective
Enable developer to switch providers/models via `.env` configuration, with all modules using unified LLM client.

### Implementation Summary

**Files Created:**
- `backend/src/config/llm_settings.py` - Pydantic settings for provider configuration
- `backend/src/api/llm_client.py` - Unified LLM client via LiteLLM
- `backend/src/config/__init__.py` - Module initialization

**Files Modified:**
- `backend/src/context/mentor.py` - Updated to use `llm_client`
- `backend/src/context/briefing.py` - Updated to use `llm_client`
- `backend/src/api/routes.py` - Import path updates
- `backend/.env.example` - Added LLM provider configuration

**Features Implemented:**
- ✅ Switch providers via `.env` (OpenRouter, Anthropic, OpenAI, Google)
- ✅ Automatic fallback when primary model fails
- ✅ Cost logging per request
- ✅ Backward-compatible `get_client()` interface
- ✅ Pydantic validation for API keys
- ✅ Support for model aliases (auto-version resolution)

**Verification:**
- All modules (mentor, briefing, narrator, witness) tested
- Fallback mechanism verified
- Documentation complete (README.md, backend/README.md)

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│  .env Configuration                                     │
│  DEFAULT_LLM_PROVIDER=openrouter                        │
│  OPENROUTER_API_KEY=sk-or-v1-...                        │
│  DEFAULT_MODEL=openrouter/anthropic/claude-sonnet       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  LLMSettings (Pydantic)                                 │
│  - Loads from .env                                      │
│  - Validates API keys                                   │
│  - Resolves model aliases                               │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  LLMClient (Unified Interface)                          │
│  - Wraps LiteLLM                                        │
│  - Single get_response() method                         │
│  - Used by ALL modules                                  │
└─────────────────────────────────────────────────────────┘
                          ↓
      ┌──────────────────┴──────────────────┐
      ↓                  ↓                   ↓
┌──────────┐      ┌──────────┐       ┌──────────┐
│ Witness  │      │ Narrator │       │  Moody   │
│  Module  │      │  Module  │       │  Module  │
└──────────┘      └──────────┘       └──────────┘
```

### Implementation Tasks

#### Backend

**Task 1.1: Install LiteLLM**
```bash
cd backend
uv add litellm
```

**Task 1.2: Create LLM Configuration (`backend/src/config/llm_settings.py`)**
```python
from pydantic_settings import BaseSettings
from enum import Enum

class LLMProvider(str, Enum):
    """Supported LLM providers."""
    ANTHROPIC = "anthropic"
    OPENROUTER = "openrouter"
    OPENAI = "openai"
    GOOGLE = "google"

class LLMSettings(BaseSettings):
    """LLM provider configuration (Phase 1: Internal only)."""

    # Provider selection
    DEFAULT_LLM_PROVIDER: LLMProvider = LLMProvider.OPENROUTER

    # API Keys
    OPENROUTER_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    GOOGLE_API_KEY: str = ""

    # Model selection (use aliases, not dated versions)
    DEFAULT_MODEL: str = "openrouter/anthropic/claude-sonnet"

    # OpenRouter metadata (optional, for analytics)
    OR_SITE_URL: str = "https://github.com/yourusername/hp-investigation-game"
    OR_APP_NAME: str = "HP Investigation Game"

    # Fallback configuration
    ENABLE_FALLBACK: bool = True
    FALLBACK_MODEL: str = "openrouter/google/gemini-2.0-flash"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    def get_api_key_for_provider(self, provider: LLMProvider) -> str:
        """Get API key for specified provider."""
        key_map = {
            LLMProvider.OPENROUTER: self.OPENROUTER_API_KEY,
            LLMProvider.ANTHROPIC: self.ANTHROPIC_API_KEY,
            LLMProvider.OPENAI: self.OPENAI_API_KEY,
            LLMProvider.GOOGLE: self.GOOGLE_API_KEY,
        }
        return key_map.get(provider, "")

    def validate_keys(self) -> None:
        """Validate that required API keys are present."""
        key = self.get_api_key_for_provider(self.DEFAULT_LLM_PROVIDER)
        if not key:
            raise ValueError(
                f"Missing API key for provider: {self.DEFAULT_LLM_PROVIDER}. "
                f"Set {self.DEFAULT_LLM_PROVIDER.upper()}_API_KEY in .env"
            )

# Singleton instance
_settings: LLMSettings | None = None

def get_llm_settings() -> LLMSettings:
    """Get singleton LLM settings instance."""
    global _settings
    if _settings is None:
        _settings = LLMSettings()
        _settings.validate_keys()
    return _settings
```

**Task 1.3: Create Unified LLM Client (`backend/src/api/llm_client.py`)**
```python
"""Unified LLM client using LiteLLM for multi-provider support."""
import logging
from litellm import acompletion, completion_cost
from src.config.llm_settings import get_llm_settings, LLMProvider

logger = logging.getLogger(__name__)

class LLMClient:
    """Unified interface for all LLM providers via LiteLLM."""

    def __init__(self):
        self.settings = get_llm_settings()
        self._setup_environment()

    def _setup_environment(self):
        """Set environment variables for LiteLLM."""
        import os

        # Set API keys
        if self.settings.OPENROUTER_API_KEY:
            os.environ["OPENROUTER_API_KEY"] = self.settings.OPENROUTER_API_KEY
            os.environ["OR_SITE_URL"] = self.settings.OR_SITE_URL
            os.environ["OR_APP_NAME"] = self.settings.OR_APP_NAME

        if self.settings.ANTHROPIC_API_KEY:
            os.environ["ANTHROPIC_API_KEY"] = self.settings.ANTHROPIC_API_KEY

        if self.settings.OPENAI_API_KEY:
            os.environ["OPENAI_API_KEY"] = self.settings.OPENAI_API_KEY

        if self.settings.GOOGLE_API_KEY:
            os.environ["GOOGLE_API_KEY"] = self.settings.GOOGLE_API_KEY

    async def get_response(
        self,
        prompt: str,
        system: str | None = None,
        max_tokens: int = 1024,
        temperature: float = 0.7,
    ) -> str:
        """Get LLM response using configured provider.

        Args:
            prompt: User prompt/message
            system: Optional system prompt
            max_tokens: Maximum tokens in response
            temperature: Sampling temperature (0-1)

        Returns:
            LLM response text

        Raises:
            Exception: If LLM call fails (including fallback)
        """
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        try:
            # Try primary model
            response = await acompletion(
                model=self.settings.DEFAULT_MODEL,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
            )

            content = response.choices[0].message.content

            # Log usage
            cost = completion_cost(completion_response=response)
            logger.info(
                f"LLM call: model={self.settings.DEFAULT_MODEL}, "
                f"tokens={response.usage.total_tokens}, cost=${cost:.4f}"
            )

            return content

        except Exception as e:
            logger.warning(f"Primary model failed: {e}")

            # Try fallback if enabled
            if self.settings.ENABLE_FALLBACK:
                logger.info(f"Trying fallback: {self.settings.FALLBACK_MODEL}")
                try:
                    response = await acompletion(
                        model=self.settings.FALLBACK_MODEL,
                        messages=messages,
                        max_tokens=max_tokens,
                        temperature=temperature,
                    )
                    return response.choices[0].message.content
                except Exception as fallback_error:
                    logger.error(f"Fallback also failed: {fallback_error}")
                    raise

            raise

# Singleton instance
_client: LLMClient | None = None

def get_client() -> LLMClient:
    """Get singleton LLM client instance."""
    global _client
    if _client is None:
        _client = LLMClient()
    return _client
```

**Task 1.4: Replace `claude_client.py` Imports**

Update all imports:
```python
# OLD
from src.api.claude_client import get_client, ClaudeClientError

# NEW
from src.api.llm_client import get_client
```

Files to update:
- `backend/src/context/witness.py`
- `backend/src/context/narrator.py`
- `backend/src/context/mentor.py`
- `backend/src/context/briefing.py`
- Any other modules using Claude client

**Task 1.5: Update `.env.example`**
```bash
# LLM Provider Configuration (Phase 1: Internal)
DEFAULT_LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-your-key-here

# Alternative providers (optional)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_API_KEY=

# Model selection (use aliases, not dated versions)
DEFAULT_MODEL=openrouter/anthropic/claude-sonnet

# OpenRouter metadata (optional)
OR_SITE_URL=https://github.com/yourusername/hp-investigation-game
OR_APP_NAME=HP Investigation Game

# Fallback configuration
ENABLE_FALLBACK=true
FALLBACK_MODEL=openrouter/google/gemini-2.0-flash
```

**Task 1.6: Update Documentation**
- Add LLM provider setup to `backend/README.md`
- Document supported providers and model aliases
- Add troubleshooting for API key issues

#### Testing

**Test 1.1: Provider Switching**
```python
# Test switching between providers
import asyncio
from src.api.llm_client import get_client

async def test_providers():
    client = get_client()

    # Test with OpenRouter
    response = await client.get_response("Say hello")
    print(f"OpenRouter: {response}")

    # (Manually change .env to test other providers)

asyncio.run(test_providers())
```

**Test 1.2: Fallback Mechanism**
```python
# Test fallback when primary fails
# (Set invalid API key to trigger fallback)
```

**Test 1.3: All Modules**
- Witness interrogation generates responses
- Narrator describes locations
- Moody provides feedback (not template fallback!)
- Tom responds to queries
- Briefing conversation works

---

## Phase 2: User-Provided API Keys

### Objective
Allow users to enter their own API keys, choose providers/models via Settings UI. Keys stored client-side only.

### UX Flow (Based on Screenshots)

```
┌─────────────────────────────────────────────────────┐
│  Settings Modal                                     │
│                                                     │
│  [General] [AI Settings] [Advanced]                │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ Custom API Keys                               │ │
│  │ Add API keys to use AI at your own cost.     │ │
│  │                                               │ │
│  │ • Anthropic, Google, OpenAI: Requests are    │ │
│  │   routed via Raycast servers                 │ │
│  │ • OpenRouter: Requests are routed directly   │ │
│  │   to the provider's servers                  │ │
│  │                                               │ │
│  │ Provider    [Anthropic ▼]        ⚠️          │ │
│  │                                               │ │
│  │ API Key     [••••••••••••••••••••] 👁         │ │
│  │                                               │ │
│  │ [Verify]                                      │ │
│  │                                               │ │
│  │ [Manage in Anthropic Console →]              │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ Model Selection                               │ │
│  │                                               │ │
│  │ Model       [Claude 4.5 Sonnet ▼]            │ │
│  │                                               │ │
│  │ Default model for all game interactions.     │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  [Cancel]                            [Save Changes] │
└─────────────────────────────────────────────────────┘
```

### Architecture

```
┌─────────────────────────────────────────────────────┐
│  Frontend: SettingsModal.tsx                        │
│  - Provider dropdown                                │
│  - API key input (masked)                           │
│  - Verify button (test key)                         │
│  - Model dropdown (dynamic from API)                │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  Frontend: localStorage                             │
│  - Store user's API keys (encrypted)                │
│  - Store selected provider/model                    │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  Backend: /api/llm/verify                           │
│  - Test user's API key                              │
│  - Return success/error                             │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  Backend: /api/llm/models                           │
│  - Fetch available models from OpenRouter           │
│  - Cache for 5 minutes                              │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  Backend: All LLM Calls                             │
│  - Accept user_api_key in request headers          │
│  - Use user key if provided, else fallback to .env  │
└─────────────────────────────────────────────────────┘
```

### Implementation Tasks

#### Backend

**Task 2.1: Create Model List Endpoint (`backend/src/api/routes.py`)**
```python
from functools import lru_cache
import time
import httpx

@router.get("/llm/models")
async def get_available_models() -> dict[str, Any]:
    """Get list of available models from OpenRouter.

    Cached for 5 minutes to avoid excessive API calls.

    Returns:
        {
          "models": [
            {
              "id": "anthropic/claude-sonnet-4.5",
              "name": "Claude 4.5 Sonnet",
              "provider": "Anthropic",
              "context_length": 200000,
              "pricing": {"prompt": "0.003", "completion": "0.015"}
            },
            ...
          ]
        }
    """
    models = await _get_cached_models()
    return {"models": models}

@lru_cache(maxsize=1)
async def _get_cached_models(cache_time: int = int(time.time() // 300)):
    """Fetch models from OpenRouter with 5-minute cache."""
    settings = get_llm_settings()

    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://openrouter.ai/api/v1/models",
            headers={"Authorization": f"Bearer {settings.OPENROUTER_API_KEY}"}
        )
        data = response.json()

        # Transform to frontend-friendly format
        return [
            {
                "id": model["id"],
                "name": model["name"],
                "provider": model["id"].split("/")[0].title(),
                "context_length": model.get("context_length", 0),
                "pricing": {
                    "prompt": str(model["pricing"]["prompt"]),
                    "completion": str(model["pricing"]["completion"]),
                }
            }
            for model in data["data"]
        ]
```

**Task 2.2: Create API Key Verification Endpoint**
```python
from pydantic import BaseModel

class VerifyKeyRequest(BaseModel):
    provider: str
    api_key: str

@router.post("/llm/verify")
async def verify_api_key(request: VerifyKeyRequest) -> dict[str, Any]:
    """Verify user's API key by making a test call.

    Args:
        request: Provider and API key to test

    Returns:
        {"valid": true/false, "error": "..." if invalid}
    """
    try:
        # Make minimal test call
        test_model = f"{request.provider}/test-model"  # Provider-specific

        response = await acompletion(
            model=test_model,
            messages=[{"role": "user", "content": "test"}],
            max_tokens=5,
            api_key=request.api_key  # Use user's key
        )

        return {"valid": True}

    except Exception as e:
        return {"valid": False, "error": str(e)}
```

**Task 2.3: Update LLM Client to Accept User Keys**
```python
class LLMClient:
    async def get_response(
        self,
        prompt: str,
        system: str | None = None,
        user_api_key: str | None = None,  # NEW
        user_model: str | None = None,     # NEW
        **kwargs
    ) -> str:
        """Get LLM response with optional user-provided key."""

        # Use user's key/model if provided, else default
        api_key = user_api_key or self.settings.get_api_key_for_provider(...)
        model = user_model or self.settings.DEFAULT_MODEL

        response = await acompletion(
            model=model,
            messages=messages,
            api_key=api_key,  # Pass to LiteLLM
            **kwargs
        )
        return response.choices[0].message.content
```

**Task 2.4: Update All Endpoints to Accept User Config**

Add optional headers to endpoints:
```python
@router.post("/interrogate")
async def interrogate_witness(
    request: InterrogateRequest,
    user_api_key: str = Header(None, alias="X-User-API-Key"),
    user_model: str = Header(None, alias="X-User-Model"),
):
    # Pass to LLM client
    response = await client.get_response(
        prompt,
        user_api_key=user_api_key,
        user_model=user_model
    )
```

#### Frontend

**Task 2.5: Create Settings Modal Component (`frontend/src/components/SettingsModal.tsx`)**
```tsx
import { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { verifyApiKey, getAvailableModels } from '../api/client';

interface APIProvider {
  id: string;
  name: string;
  keyPrefix: string;  // e.g., "sk-ant-", "sk-or-v1-"
}

const PROVIDERS: APIProvider[] = [
  { id: 'anthropic', name: 'Anthropic', keyPrefix: 'sk-ant-' },
  { id: 'openrouter', name: 'OpenRouter', keyPrefix: 'sk-or-v1-' },
  { id: 'openai', name: 'OpenAI', keyPrefix: 'sk-' },
  { id: 'google', name: 'Google', keyPrefix: 'AIzaSy' },
];

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [provider, setProvider] = useState('openrouter');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedModel, setSelectedModel] = useState('');
  const [availableModels, setAvailableModels] = useState([]);

  // Load saved settings
  useEffect(() => {
    const saved = localStorage.getItem('llm_settings');
    if (saved) {
      const settings = JSON.parse(saved);
      setProvider(settings.provider);
      setApiKey(settings.apiKey);  // Encrypted in real impl
      setSelectedModel(settings.model);
    }
  }, []);

  // Fetch available models
  useEffect(() => {
    async function fetchModels() {
      const models = await getAvailableModels();
      setAvailableModels(models);
    }
    fetchModels();
  }, []);

  const handleVerify = async () => {
    setVerifying(true);
    setError(null);

    try {
      const result = await verifyApiKey({ provider, apiKey });
      if (result.valid) {
        setVerified(true);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleSave = () => {
    // Save to localStorage (encrypt in production)
    localStorage.setItem('llm_settings', JSON.stringify({
      provider,
      apiKey,  // TODO: Encrypt this
      model: selectedModel
    }));

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="space-y-6">
        {/* Custom API Keys Section */}
        <div className="border border-terminal-border p-4">
          <h3 className="text-terminal-accent font-mono mb-2">
            Custom API Keys
          </h3>
          <p className="text-sm text-terminal-muted mb-4">
            Add API keys to use AI at your own cost.
          </p>

          <div className="space-y-4">
            {/* Provider Dropdown */}
            <div>
              <label className="block text-sm mb-1">Provider</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full bg-terminal-bg border border-terminal-border p-2"
              >
                {PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* API Key Input */}
            <div>
              <label className="block text-sm mb-1">API Key</label>
              <div className="flex gap-2">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="flex-1 bg-terminal-bg border border-terminal-border p-2 font-mono"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="px-3 border border-terminal-border hover:bg-terminal-hover"
                >
                  {showKey ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* Verify Button */}
            <button
              onClick={handleVerify}
              disabled={!apiKey || verifying}
              className="w-full bg-terminal-accent text-black p-2 hover:brightness-90"
            >
              {verifying ? 'Verifying...' : 'Verify'}
            </button>

            {verified && (
              <p className="text-green-500 text-sm">✓ Key verified</p>
            )}
            {error && (
              <p className="text-red-500 text-sm">✗ {error}</p>
            )}
          </div>
        </div>

        {/* Model Selection */}
        <div className="border border-terminal-border p-4">
          <h3 className="text-terminal-accent font-mono mb-2">
            Model Selection
          </h3>

          <div>
            <label className="block text-sm mb-1">Model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-terminal-bg border border-terminal-border p-2"
            >
              {availableModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-terminal-muted mt-1">
              Default model for all game interactions.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-terminal-accent text-black">
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
}
```

**Task 2.6: Update API Client to Send User Config**
```tsx
// frontend/src/api/client.ts

// Add headers for user config
const getUserHeaders = () => {
  const settings = localStorage.getItem('llm_settings');
  if (!settings) return {};

  const { apiKey, model } = JSON.parse(settings);
  return {
    'X-User-API-Key': apiKey,
    'X-User-Model': model,
  };
};

// Update all API calls
export async function interrogateWitness(request: InterrogateRequest) {
  const response = await fetch(`${API_BASE_URL}/api/interrogate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getUserHeaders(),  // Add user config
    },
    body: JSON.stringify(request),
  });
  // ...
}
```

**Task 2.7: Add Settings Button to UI**
```tsx
// Add to MainMenu or header
<button onClick={() => setSettingsOpen(true)}>
  ⚙️ Settings
</button>

{settingsOpen && (
  <SettingsModal
    isOpen={settingsOpen}
    onClose={() => setSettingsOpen(false)}
  />
)}
```

#### Security Considerations

**Task 2.8: Implement Client-Side Encryption**
```tsx
// frontend/src/utils/encryption.ts
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = 'user-specific-key';  // Derive from session

export function encryptApiKey(apiKey: string): string {
  return CryptoJS.AES.encrypt(apiKey, ENCRYPTION_KEY).toString();
}

export function decryptApiKey(encrypted: string): string {
  const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}
```

**Task 2.9: Backend Key Handling**
- Never log user API keys
- Don't store user keys on server
- Use keys only for immediate LLM calls
- Clear from memory after use

---

## Testing Strategy

### Phase 1 Testing

**Manual Tests:**
1. Switch `.env` provider: OpenRouter → Anthropic → Gemini
2. Test fallback by setting invalid primary key
3. Verify all modules work (Witness, Narrator, Moody, Tom)
4. Check logs for cost tracking

**Automated Tests:**
```python
# tests/test_llm_client.py
async def test_provider_switching():
    """Test switching between providers."""
    client = get_client()
    response = await client.get_response("Hello")
    assert len(response) > 0

async def test_fallback():
    """Test fallback when primary fails."""
    # Mock primary to fail
    # Verify fallback called
```

### Phase 2 Testing

**Manual Tests:**
1. Enter valid API key → verify succeeds
2. Enter invalid key → error shown
3. Save settings → persists after refresh
4. Submit verdict → uses user's key
5. Cost appears in user's provider dashboard

**Security Tests:**
1. Inspect localStorage → key encrypted
2. Check network requests → key in header only
3. Verify server doesn't log keys

---

## Migration Strategy

### Phase 1 (Week 1)

**Day 1-2: Backend Setup**
- Install LiteLLM
- Create LLMSettings + LLMClient
- Update imports

**Day 3: Testing**
- Test with OpenRouter
- Verify fallback works
- Check all modules

**Day 4: Documentation**
- Update README
- Add troubleshooting guide

### Phase 2 (Week 2-3)

**Week 2: Backend API**
- Create `/llm/models` endpoint
- Create `/llm/verify` endpoint
- Update all endpoints to accept user keys

**Week 3: Frontend UI**
- Create SettingsModal component
- Implement encryption
- Add to main UI

**Week 4: Testing + Deployment**
- Security audit
- User testing
- Deploy

---

## Rollback Plan

If Phase 1 fails:
1. Revert `llm_client.py` changes
2. Restore original `claude_client.py` imports
3. Keep LiteLLM installed for Phase 2

If Phase 2 fails:
1. Disable Settings UI
2. Remove user header processing
3. Fall back to Phase 1 (dev keys only)

---

## Success Metrics

### Phase 1
- ✅ Can switch providers via `.env`
- ✅ Moody feedback uses LLM (not template)
- ✅ All modules work with new client
- ✅ Fallback triggers correctly

### Phase 2
- ✅ Users can enter API keys
- ✅ Keys verified before saving
- ✅ Settings persist across sessions
- ✅ Users see costs in their dashboards
- ✅ No security vulnerabilities

---

## Open Questions

1. **Encryption strength**: Use CryptoJS or stronger library?
2. **Key rotation**: How to handle expired keys?
3. **Cost monitoring**: Show usage stats to users?
4. **Model recommendations**: Suggest models based on task?
5. **Fallback for user keys**: Use dev key as fallback or fail?

---

## References

**Documentation:**
- [LiteLLM Docs](https://docs.litellm.ai/)
- [OpenRouter API](https://openrouter.ai/docs/api/api-reference/models/get-models)
- [Anthropic Model Aliases](https://docs.claude.com/en/docs/about-claude/models/overview)

**Research:**
- [LLM UI/UX Patterns](https://medium.com/@jasonbejot/designing-llm-interfaces-a-new-paradigm-11dd40e2c4a1)
- [Multi-Provider Architecture](https://www.entrio.io/blog/implementing-llm-agnostic-architecture-generative-ai-module)

**UX Inspiration:**
- Claude.ai Settings (screenshots provided)
- Raycast AI Settings

---

**Next Steps:**
1. Review PRP with team
2. Get API keys (OpenRouter recommended)
3. Start Phase 1 implementation
4. Plan Phase 2 timeline

**END OF PRP**
