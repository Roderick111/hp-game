"""Unified LLM client using LiteLLM for multi-provider support.

Provides async interface for multiple LLM providers (Anthropic, OpenRouter,
OpenAI, Google) with automatic fallback, cost logging, BYOK support,
and streaming.
"""

import logging
import os
from collections.abc import AsyncGenerator

from litellm import acompletion, completion_cost
from litellm.exceptions import (
    APIConnectionError,
    APIError,
    AuthenticationError,
    RateLimitError,
)

from src.config.llm_settings import get_llm_settings

logger = logging.getLogger(__name__)


class LLMClientError(Exception):
    """Base exception for LLM client errors."""

    pass


class RateLimitExceededError(LLMClientError):
    """Raised when API rate limit is exceeded."""

    pass


class AuthenticationFailedError(LLMClientError):
    """Raised when API authentication fails."""

    pass


# Backward compatibility alias
ClaudeClientError = LLMClientError


class LLMClient:
    """Unified interface for all LLM providers via LiteLLM.

    Supports BYOK (Bring Your Own Key) — pass api_key/model to override
    server defaults with user-provided credentials.
    """

    def __init__(self) -> None:
        self.settings = get_llm_settings()
        self._setup_environment()

    def _setup_environment(self) -> None:
        """Set environment variables for LiteLLM."""
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
        api_key: str | None = None,
        model: str | None = None,
    ) -> str:
        """Get LLM response, optionally using user-provided key/model.

        Args:
            prompt: User prompt/message
            system: Optional system prompt
            max_tokens: Maximum tokens in response
            temperature: Sampling temperature 0-1
            api_key: User-provided API key (BYOK), overrides server default
            model: User-provided model ID, overrides server default
        """
        messages = self._build_messages(prompt, system)
        target_model = model or self.settings.DEFAULT_MODEL

        try:
            return await self._call_llm(
                model=target_model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
                api_key=api_key,
            )
        except Exception as e:
            # Skip fallback if user provided their own key — their problem
            if api_key:
                raise self._wrap_exception(e) from e

            logger.warning(f"Primary model failed: {e}")

            if self.settings.ENABLE_FALLBACK:
                logger.info(f"Trying fallback: {self.settings.FALLBACK_MODEL}")
                try:
                    return await self._call_llm(
                        model=self.settings.FALLBACK_MODEL,
                        messages=messages,
                        max_tokens=max_tokens,
                        temperature=temperature,
                    )
                except Exception as fallback_error:
                    logger.error(f"Fallback also failed: {fallback_error}")
                    raise LLMClientError(
                        f"Both primary and fallback failed: {fallback_error}"
                    ) from fallback_error

            raise self._wrap_exception(e) from e

    async def get_response_stream(
        self,
        prompt: str,
        system: str | None = None,
        max_tokens: int = 1024,
        temperature: float = 0.7,
        api_key: str | None = None,
        model: str | None = None,
    ) -> AsyncGenerator[str, None]:
        """Stream LLM response chunks.

        Args:
            prompt: User prompt/message
            system: Optional system prompt
            max_tokens: Maximum tokens in response
            temperature: Sampling temperature 0-1
            api_key: User-provided API key (BYOK)
            model: User-provided model ID
        """
        messages = self._build_messages(prompt, system)
        target_model = model or self.settings.DEFAULT_MODEL

        kwargs: dict = {
            "model": target_model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "stream": True,
        }
        if api_key:
            kwargs["api_key"] = api_key

        try:
            response = await acompletion(**kwargs)
            async for chunk in response:
                content = chunk.choices[0].delta.content
                if content:
                    yield content
        except RateLimitError as e:
            raise RateLimitExceededError(f"Rate limit exceeded: {e}") from e
        except AuthenticationError as e:
            raise AuthenticationFailedError(f"Authentication failed: {e}") from e
        except (APIConnectionError, APIError) as e:
            raise LLMClientError(f"API error: {e}") from e

    def _build_messages(self, prompt: str, system: str | None = None) -> list[dict[str, str]]:
        messages: list[dict[str, str]] = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        return messages

    async def _call_llm(
        self,
        model: str,
        messages: list[dict[str, str]],
        max_tokens: int,
        temperature: float,
        api_key: str | None = None,
    ) -> str:
        """Make LLM API call via LiteLLM."""
        kwargs: dict = {
            "model": model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        if api_key:
            kwargs["api_key"] = api_key

        try:
            response = await acompletion(**kwargs)
            content = response.choices[0].message.content or ""

            try:
                cost = completion_cost(completion_response=response)
                total_tokens = getattr(response.usage, "total_tokens", "N/A")
                logger.info(f"LLM call: model={model}, tokens={total_tokens}, cost=${cost:.6f}")
            except Exception:
                logger.debug(f"LLM call: model={model} (cost unavailable)")

            return content

        except RateLimitError as e:
            raise RateLimitExceededError(f"Rate limit exceeded: {e}") from e
        except AuthenticationError as e:
            raise AuthenticationFailedError(f"Authentication failed: {e}") from e
        except APIConnectionError as e:
            raise LLMClientError(f"Connection error: {e}") from e
        except APIError as e:
            raise LLMClientError(f"API error: {e}") from e

    def _wrap_exception(self, e: Exception) -> LLMClientError:
        if isinstance(e, LLMClientError):
            return e
        return LLMClientError(str(e))

    async def close(self) -> None:
        pass


# Module-level client instance (lazy initialization)
_client: LLMClient | None = None


def get_client() -> LLMClient:
    """Get singleton LLM client instance."""
    global _client
    if _client is None:
        try:
            _client = LLMClient()
        except ValueError as e:
            raise LLMClientError(str(e)) from e
    return _client


async def get_response(prompt: str, system: str | None = None) -> str:
    """Convenience function for quick responses."""
    client = get_client()
    return await client.get_response(prompt, system=system)


def reset_client() -> None:
    """Reset the singleton client instance."""
    global _client
    _client = None
