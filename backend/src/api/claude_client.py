"""Claude Haiku async client wrapper.

Provides async interface for Claude API with error handling.
"""
import os
from typing import Any

from anthropic import APIError, AsyncAnthropic, RateLimitError
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Default model for investigation responses
DEFAULT_MODEL = "claude-haiku-4-5"
DEFAULT_MAX_TOKENS = 1024


class ClaudeClientError(Exception):
    """Base exception for Claude client errors."""

    pass


class RateLimitExceededError(ClaudeClientError):
    """Raised when API rate limit is exceeded."""

    pass


class ClaudeClient:
    """Async Claude API client wrapper."""

    def __init__(
        self,
        api_key: str | None = None,
        model: str = DEFAULT_MODEL,
        max_tokens: int = DEFAULT_MAX_TOKENS,
    ) -> None:
        """Initialize Claude client.

        Args:
            api_key: Anthropic API key (defaults to ANTHROPIC_API_KEY env var)
            model: Model to use (default: claude-haiku-4-5)
            max_tokens: Maximum response tokens (default: 1024)
        """
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ClaudeClientError("ANTHROPIC_API_KEY not set")

        self.model = model
        self.max_tokens = max_tokens
        self._client: AsyncAnthropic | None = None

    @property
    def client(self) -> AsyncAnthropic:
        """Lazy initialization of async client."""
        if self._client is None:
            self._client = AsyncAnthropic(api_key=self.api_key)
        return self._client

    async def get_response(
        self,
        prompt: str,
        system: str | None = None,
        max_tokens: int | None = None,
    ) -> str:
        """Get response from Claude.

        Args:
            prompt: User message/prompt
            system: Optional system prompt
            max_tokens: Override default max_tokens

        Returns:
            Text response from Claude

        Raises:
            RateLimitExceededError: If rate limit exceeded
            ClaudeClientError: For other API errors
        """
        try:
            kwargs: dict[str, Any] = {
                "model": self.model,
                "max_tokens": max_tokens or self.max_tokens,
                "messages": [{"role": "user", "content": prompt}],
            }

            if system:
                kwargs["system"] = system

            message = await self.client.messages.create(**kwargs)

            # Extract text from response
            if message.content and len(message.content) > 0:
                text: str = message.content[0].text
                return text

            return ""

        except RateLimitError as e:
            raise RateLimitExceededError(f"Rate limit exceeded: {e}") from e

        except APIError as e:
            raise ClaudeClientError(f"API error: {e}") from e

    async def close(self) -> None:
        """Close the client connection."""
        if self._client is not None:
            await self._client.close()
            self._client = None


# Module-level client instance (lazy initialization)
_default_client: ClaudeClient | None = None


def get_client() -> ClaudeClient:
    """Get default Claude client instance."""
    global _default_client
    if _default_client is None:
        _default_client = ClaudeClient()
    return _default_client


async def get_response(prompt: str, system: str | None = None) -> str:
    """Convenience function for quick responses.

    Args:
        prompt: User message/prompt
        system: Optional system prompt

    Returns:
        Text response from Claude
    """
    client = get_client()
    return await client.get_response(prompt, system=system)
