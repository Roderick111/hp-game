"""LLM configuration endpoints: API key verification, model listing."""

from fastapi import APIRouter, Request

from src.api.rate_limit import VERIFY_KEY_RATE, limiter
from src.api.schemas import ModelInfo, VerifyKeyRequest, VerifyKeyResponse

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


@router.get("/llm/models")
async def get_available_models() -> list[ModelInfo]:
    """Return curated list of recommended models."""
    return [
        ModelInfo(
            id="openrouter/xiaomi/mimo-v2-flash:free",
            name="MiMo-V2-Flash (Free)",
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
        ModelInfo(id="anthropic/claude-haiku-4-5", name="Claude Haiku 4.5", provider="anthropic"),
        ModelInfo(id="anthropic/claude-sonnet-4", name="Claude Sonnet 4", provider="anthropic"),
        ModelInfo(id="openai/gpt-4o-mini", name="GPT-4o Mini", provider="openai"),
        ModelInfo(id="openai/gpt-4o", name="GPT-4o", provider="openai"),
        ModelInfo(id="gemini/gemini-2.0-flash", name="Gemini 2.0 Flash", provider="google"),
    ]
