"""API module."""

from .llm_client import (
    LLMClient,
    LLMClientError,
    RateLimitExceededError,
    get_response,
)
from .llm_client import (
    LLMClientError as ClaudeClientError,
)
from .routes import router

# Re-export schemas for backward compatibility with tests
from .schemas import (
    InterrogateRequest,
    InterrogateResponse,
    InvestigateRequest,
    InvestigateResponse,
    SubmitVerdictRequest,
    SubmitVerdictResponse,
)

__all__ = [
    "router",
    "LLMClient",
    "LLMClientError",
    "ClaudeClientError",
    "RateLimitExceededError",
    "get_response",
    "InvestigateRequest",
    "InvestigateResponse",
    "InterrogateRequest",
    "InterrogateResponse",
    "SubmitVerdictRequest",
    "SubmitVerdictResponse",
]
