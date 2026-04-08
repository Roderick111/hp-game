"""FastAPI dependencies for request-scoped configuration."""

from dataclasses import dataclass

from fastapi import Header


@dataclass
class UserLLMConfig:
    """User-provided LLM configuration from request headers (BYOK)."""

    api_key: str | None = None
    model: str | None = None


def get_user_llm_config(
    x_user_api_key: str | None = Header(None),
    x_user_model: str | None = Header(None),
) -> UserLLMConfig:
    """Extract user LLM config from request headers."""
    return UserLLMConfig(api_key=x_user_api_key, model=x_user_model)
