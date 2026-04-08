"""Rate limiting configuration."""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

# Limits
LLM_RATE = "10/minute"
VERIFY_KEY_RATE = "5/minute"
STANDARD_RATE = "100/minute"
