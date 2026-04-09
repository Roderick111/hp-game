"""LLM configuration endpoints: API key verification, model listing."""

from fastapi import APIRouter, Request

from src.api.rate_limit import VERIFY_KEY_RATE, limiter
from src.api.schemas import ModelInfo, VerifyKeyRequest, VerifyKeyResponse
from src.config.llm_settings import get_llm_settings

router = APIRouter()

_VERIFY_MODELS: dict[str, str] = {
    "openrouter": "openrouter/google/gemini-2.0-flash-001",
    "anthropic": "anthropic/claude-haiku-4-5",
    "openai": "openai/gpt-4o-mini",
    "google": "gemini/gemini-2.0-flash",
}


@router.post("/llm/verify", response_model=VerifyKeyResponse)
@limiter.limit(VERIFY_KEY_RATE)
async def verify_api_key(request: Request, body: VerifyKeyRequest) -> VerifyKeyResponse:
    """Verify a user's API key with a minimal test call."""
    test_model = body.model or _VERIFY_MODELS.get(body.provider)
    if not test_model:
        return VerifyKeyResponse(valid=False, error=f"Unknown provider: {body.provider}")

    try:
        from litellm import acompletion

        await acompletion(
            model=test_model,
            messages=[{"role": "user", "content": "hi"}],
            max_tokens=5,
            api_key=body.api_key,
        )
        return VerifyKeyResponse(valid=True)
    except Exception as e:
        return VerifyKeyResponse(valid=False, error=str(e))


@router.get("/llm/active")
async def get_active_model() -> dict[str, str]:
    """Return the currently active free-tier model name."""
    settings = get_llm_settings()
    model_id = settings.DEFAULT_MODEL
    # Extract human-readable name from model ID (last segment, cleaned up)
    name = model_id.rsplit("/", 1)[-1].replace(":free", "").replace("-", " ").title()
    return {"model_id": model_id, "model_name": name}


@router.get("/llm/models")
async def get_available_models() -> list[ModelInfo]:
    """Return curated list of recommended models per provider.

    Models are grouped by provider so the frontend can filter by selected provider.
    OpenRouter models use the openrouter/ prefix for LiteLLM routing.
    """
    return [
        # OpenRouter (multi-provider gateway)
        ModelInfo(
            id="openrouter/xiaomi/mimo-v2-flash:free",
            name="MiMo-V2-Flash",
            provider="openrouter",
            free=True,
        ),
        ModelInfo(
            id="openrouter/google/gemma-4-26b-a4b-it",
            name="Gemma 4 26B",
            provider="openrouter",
            free=True,
        ),
        ModelInfo(
            id="openrouter/google/gemini-2.0-flash-001",
            name="Gemini 2.0 Flash",
            provider="openrouter",
        ),
        ModelInfo(
            id="openrouter/anthropic/claude-sonnet-4",
            name="Claude Sonnet 4",
            provider="openrouter",
        ),
        ModelInfo(
            id="openrouter/x-ai/grok-4.1-fast",
            name="Grok 4.1 Fast",
            provider="openrouter",
        ),
        # Anthropic (direct)
        ModelInfo(
            id="anthropic/claude-haiku-4-5",
            name="Claude Haiku 4.5",
            provider="anthropic",
        ),
        ModelInfo(
            id="anthropic/claude-sonnet-4",
            name="Claude Sonnet 4",
            provider="anthropic",
        ),
        ModelInfo(
            id="anthropic/claude-opus-4",
            name="Claude Opus 4",
            provider="anthropic",
        ),
        # OpenAI (direct)
        ModelInfo(id="openai/gpt-4.1-mini", name="GPT-4.1 Mini", provider="openai"),
        ModelInfo(id="openai/gpt-4.1", name="GPT-4.1", provider="openai"),
        ModelInfo(id="openai/o3-mini", name="o3-mini", provider="openai"),
        # Google (direct via LiteLLM gemini/ prefix)
        ModelInfo(
            id="gemini/gemini-2.0-flash",
            name="Gemini 2.0 Flash",
            provider="google",
        ),
        ModelInfo(
            id="gemini/gemini-2.5-pro",
            name="Gemini 2.5 Pro",
            provider="google",
        ),
    ]
