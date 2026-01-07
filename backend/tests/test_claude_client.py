"""Tests for Claude client module."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.api.claude_client import (
    ClaudeClient,
    ClaudeClientError,
    RateLimitExceededError,
    get_client,
    get_response,
)


@pytest.fixture
def mock_anthropic() -> MagicMock:
    """Create mock Anthropic client."""
    mock = MagicMock()
    mock.messages = MagicMock()
    return mock


@pytest.fixture
def mock_response() -> MagicMock:
    """Create mock API response."""
    mock = MagicMock()
    mock.content = [MagicMock(text="Test response from Claude")]
    return mock


class TestClaudeClient:
    """Tests for ClaudeClient class."""

    def test_init_with_api_key(self) -> None:
        """Initialize with explicit API key."""
        client = ClaudeClient(api_key="test-key")

        assert client.api_key == "test-key"
        assert client.model == "claude-haiku-4-5"
        assert client.max_tokens == 1024

    def test_init_without_api_key_raises(self) -> None:
        """Raises error without API key."""
        with patch.dict("os.environ", {}, clear=True):
            with pytest.raises(ClaudeClientError, match="ANTHROPIC_API_KEY not set"):
                ClaudeClient(api_key=None)

    def test_init_from_env_var(self) -> None:
        """Initialize from environment variable."""
        with patch.dict("os.environ", {"ANTHROPIC_API_KEY": "env-key"}):
            client = ClaudeClient()
            assert client.api_key == "env-key"

    def test_custom_model_and_tokens(self) -> None:
        """Initialize with custom model and max_tokens."""
        client = ClaudeClient(
            api_key="test-key",
            model="claude-sonnet-4-20250514",
            max_tokens=2048,
        )

        assert client.model == "claude-sonnet-4-20250514"
        assert client.max_tokens == 2048


class TestGetResponse:
    """Tests for get_response method."""

    @pytest.mark.asyncio
    async def test_get_response_success(
        self, mock_anthropic: MagicMock, mock_response: MagicMock
    ) -> None:
        """Successful response from API."""
        mock_anthropic.messages.create = AsyncMock(return_value=mock_response)

        with patch("src.api.claude_client.AsyncAnthropic", return_value=mock_anthropic):
            client = ClaudeClient(api_key="test-key")
            response = await client.get_response("Hello, Claude!")

        assert response == "Test response from Claude"

    @pytest.mark.asyncio
    async def test_get_response_with_system_prompt(
        self, mock_anthropic: MagicMock, mock_response: MagicMock
    ) -> None:
        """Response with system prompt."""
        mock_anthropic.messages.create = AsyncMock(return_value=mock_response)

        with patch("src.api.claude_client.AsyncAnthropic", return_value=mock_anthropic):
            client = ClaudeClient(api_key="test-key")
            await client.get_response("Hello!", system="You are a narrator")

        # Verify system prompt was passed
        call_kwargs = mock_anthropic.messages.create.call_args.kwargs
        assert call_kwargs["system"] == "You are a narrator"

    @pytest.mark.asyncio
    async def test_get_response_rate_limit_error(self, mock_anthropic: MagicMock) -> None:
        """Rate limit error handled."""
        from anthropic import RateLimitError

        mock_anthropic.messages.create = AsyncMock(
            side_effect=RateLimitError(
                message="Rate limit exceeded",
                response=MagicMock(status_code=429),
                body={"error": {"message": "Rate limit"}},
            )
        )

        with patch("src.api.claude_client.AsyncAnthropic", return_value=mock_anthropic):
            client = ClaudeClient(api_key="test-key")

            with pytest.raises(RateLimitExceededError):
                await client.get_response("Test")

    @pytest.mark.asyncio
    async def test_get_response_api_error(self, mock_anthropic: MagicMock) -> None:
        """API error handled."""
        from anthropic import APIError

        mock_anthropic.messages.create = AsyncMock(
            side_effect=APIError(
                message="API error",
                request=MagicMock(),
                body={"error": {"message": "Error"}},
            )
        )

        with patch("src.api.claude_client.AsyncAnthropic", return_value=mock_anthropic):
            client = ClaudeClient(api_key="test-key")

            with pytest.raises(ClaudeClientError):
                await client.get_response("Test")

    @pytest.mark.asyncio
    async def test_get_response_empty_content(self, mock_anthropic: MagicMock) -> None:
        """Empty content returns empty string."""
        mock_response = MagicMock()
        mock_response.content = []
        mock_anthropic.messages.create = AsyncMock(return_value=mock_response)

        with patch("src.api.claude_client.AsyncAnthropic", return_value=mock_anthropic):
            client = ClaudeClient(api_key="test-key")
            response = await client.get_response("Test")

        assert response == ""


class TestModuleFunctions:
    """Tests for module-level convenience functions."""

    def test_get_client_returns_instance(self) -> None:
        """get_client returns ClaudeClient instance."""
        with patch.dict("os.environ", {"ANTHROPIC_API_KEY": "test-key"}):
            # Reset the global client
            import src.api.claude_client as mod

            mod._default_client = None

            client = get_client()

            assert isinstance(client, ClaudeClient)

    def test_get_client_returns_same_instance(self) -> None:
        """get_client returns singleton."""
        with patch.dict("os.environ", {"ANTHROPIC_API_KEY": "test-key"}):
            import src.api.claude_client as mod

            mod._default_client = None

            client1 = get_client()
            client2 = get_client()

            assert client1 is client2

    @pytest.mark.asyncio
    async def test_get_response_convenience(
        self, mock_anthropic: MagicMock, mock_response: MagicMock
    ) -> None:
        """Convenience get_response function works."""
        mock_anthropic.messages.create = AsyncMock(return_value=mock_response)

        with patch("src.api.claude_client.AsyncAnthropic", return_value=mock_anthropic):
            with patch.dict("os.environ", {"ANTHROPIC_API_KEY": "test-key"}):
                import src.api.claude_client as mod

                mod._default_client = None

                response = await get_response("Hello!")

        assert response == "Test response from Claude"
