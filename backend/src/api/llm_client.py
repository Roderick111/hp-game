"""Unified LLM client using LiteLLM for multi-provider support.

Provides async interface for multiple LLM providers (Anthropic, OpenRouter,
OpenAI, Google) with automatic fallback and cost logging.

This module replaces claude_client.py with a provider-agnostic implementation.
The interface is backward-compatible with ClaudeClient.get_response().
"""

import logging
import os

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
    """Base exception for LLM client errors.

    Backward-compatible with ClaudeClientError.
    """

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

    Supports Anthropic, OpenRouter, OpenAI, and Google providers.
    Includes automatic fallback when primary model fails.

    Example:
        client = get_client()
        response = await client.get_response(
            prompt="Hello!",
            system="You are a helpful assistant.",
            max_tokens=256
        )
    """

    def __init__(self) -> None:
        """Initialize LLM client with settings from environment."""
        self.settings = get_llm_settings()
        self._setup_environment()

    def _setup_environment(self) -> None:
        """Set environment variables for LiteLLM.

        LiteLLM reads API keys from environment variables.
        We set them here based on our settings configuration.
        """
        # Set API keys for all configured providers
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

        Interface is backward-compatible with ClaudeClient.get_response().

        Args:
            prompt: User prompt/message
            system: Optional system prompt
            max_tokens: Maximum tokens in response (default: 1024)
            temperature: Sampling temperature 0-1 (default: 0.7)

        Returns:
            LLM response text

        Raises:
            RateLimitExceededError: If rate limit exceeded
            AuthenticationFailedError: If API key is invalid
            LLMClientError: For other API errors
        """
        # Build messages list
        messages: list[dict[str, str]] = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        try:
            # Try primary model
            response = await self._call_llm(
                model=self.settings.DEFAULT_MODEL,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
            )
            return response

        except Exception as e:
            logger.warning(f"Primary model failed: {e}")

            # Try fallback if enabled
            if self.settings.ENABLE_FALLBACK:
                logger.info(f"Trying fallback: {self.settings.FALLBACK_MODEL}")
                try:
                    response = await self._call_llm(
                        model=self.settings.FALLBACK_MODEL,
                        messages=messages,
                        max_tokens=max_tokens,
                        temperature=temperature,
                    )
                    return response
                except Exception as fallback_error:
                    logger.error(f"Fallback also failed: {fallback_error}")
                    raise LLMClientError(
                        f"Both primary and fallback failed: {fallback_error}"
                    ) from fallback_error

            # Re-raise as our custom exception type
            raise self._wrap_exception(e) from e

    async def _call_llm(
        self,
        model: str,
        messages: list[dict[str, str]],
        max_tokens: int,
        temperature: float,
    ) -> str:
        """Make actual LLM API call via LiteLLM.

        Args:
            model: Model identifier (e.g., "openrouter/anthropic/claude-sonnet")
            messages: Messages list in OpenAI format
            max_tokens: Max response tokens
            temperature: Sampling temperature

        Returns:
            Response text content

        Raises:
            Various LiteLLM exceptions on failure
        """
        try:
            response = await acompletion(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
            )

            # Extract content from response
            content = response.choices[0].message.content or ""

            # Log usage and cost
            try:
                cost = completion_cost(completion_response=response)
                total_tokens = getattr(response.usage, "total_tokens", "N/A")
                logger.info(
                    f"LLM call: model={model}, tokens={total_tokens}, cost=${cost:.6f}"
                )
            except Exception:
                # Cost calculation may fail for some providers
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
        """Wrap external exceptions in our custom types.

        Args:
            e: Original exception

        Returns:
            Appropriate LLMClientError subclass
        """
        if isinstance(e, RateLimitExceededError):
            return e
        if isinstance(e, AuthenticationFailedError):
            return e
        if isinstance(e, LLMClientError):
            return e
        return LLMClientError(str(e))

    async def close(self) -> None:
        """Close any open connections.

        Included for backward compatibility with ClaudeClient.
        LiteLLM handles connection pooling internally.
        """
        # LiteLLM manages connections internally
        pass


# Module-level client instance (lazy initialization)
_client: LLMClient | None = None


def get_client() -> LLMClient:
    """Get singleton LLM client instance.

    Returns:
        Configured LLMClient instance

    Raises:
        LLMClientError: If initialization fails (e.g., missing API key)
    """
    global _client
    if _client is None:
        try:
            _client = LLMClient()
        except ValueError as e:
            raise LLMClientError(str(e)) from e
    return _client


async def get_response(prompt: str, system: str | None = None) -> str:
    """Convenience function for quick responses.

    Backward-compatible with claude_client.get_response().

    Args:
        prompt: User message/prompt
        system: Optional system prompt

    Returns:
        Text response from LLM
    """
    client = get_client()
    return await client.get_response(prompt, system=system)


def reset_client() -> None:
    """Reset the singleton client instance.

    Useful for testing or when settings change.
    """
    global _client
    _client = None
