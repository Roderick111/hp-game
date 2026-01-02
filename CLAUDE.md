# CLAUDE.md

This file provides comprehensive guidance to Claude Code when working with Python code in this repository.

## Core Development Philosophy

### KISS (Keep It Simple, Stupid)

Simplicity should be a key goal in design. Choose straightforward solutions over complex ones whenever possible. Simple solutions are easier to understand, maintain, and debug.

### YAGNI (You Aren't Gonna Need It)

Avoid building functionality on speculation. Implement features only when they are needed, not when you anticipate they might be useful in the future.

### Design Principles

- **Dependency Inversion**: High-level modules should not depend on low-level modules. Both should depend on abstractions.
- **Open/Closed Principle**: Software entities should be open for extension but closed for modification.
- **Single Responsibility**: Each function, class, and module should have one clear purpose.
- **Fail Fast**: Check for potential errors early and raise exceptions immediately when issues occur.

## 🧱 Code Structure & Modularity

### File and Function Limits

- **Never create a file longer than 500 lines of code**. If approaching this limit, refactor by splitting into modules.
- **Functions should be under 50 lines** with a single, clear responsibility.
- **Classes should be under 100 lines** and represent a single concept or entity.
- **Organize code into clearly separated modules**, grouped by feature or responsibility.
- **Line lenght should be max 100 characters** ruff rule in pyproject.toml
- **Use venv_linux** (the virtual environment) whenever executing Python commands, including for unit tests.

### Project Architecture

Follow strict vertical slice architecture with tests living next to the code they test:

```
src/project/
    __init__.py
    main.py
    tests/
        test_main.py
    conftest.py

    # Core modules
    database/
        __init__.py
        connection.py
        models.py
        tests/
            test_connection.py
            test_models.py

    auth/
        __init__.py
        authentication.py
        authorization.py
        tests/
            test_authentication.py
            test_authorization.py

    # Feature slices
    features/
        user_management/
            __init__.py
            handlers.py
            validators.py
            tests/
                test_handlers.py
                test_validators.py

        payment_processing/
            __init__.py
            processor.py
            gateway.py
            tests/
                test_processor.py
                test_gateway.py
```

## 🛠️ Development Environment

### UV Package Management

This project uses UV for blazing-fast Python package and environment management.

```bash
# Install UV (if not already installed)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Create virtual environment
uv venv

# Sync dependencies
uv sync

# Add a package ***NEVER UPDATE A DEPENDENCY DIRECTLY IN PYPROJECT.toml***
# ALWAYS USE UV ADD
uv add requests

# Add development dependency
uv add --dev pytest ruff mypy

# Remove a package
uv remove requests

# Run commands in the environment
uv run python script.py
uv run pytest
uv run ruff check .

# Install specific Python version
uv python install 3.12
```

### Development Commands

```bash
# Run all tests
uv run pytest

# Run specific tests with verbose output
uv run pytest tests/test_module.py -v

# Run tests with coverage
uv run pytest --cov=src --cov-report=html

# Format code
uv run ruff format .

# Check linting
uv run ruff check .

# Fix linting issues automatically
uv run ruff check --fix .

# Type checking
uv run mypy src/

# Run pre-commit hooks
uv run pre-commit run --all-files
```

## 📋 Style & Conventions

### Python Style Guide

- **Follow PEP8** with these specific choices:
  - Line length: 100 characters (set by Ruff in pyproject.toml)
  - Use double quotes for strings
  - Use trailing commas in multi-line structures
- **Always use type hints** for function signatures and class attributes
- **Format with `ruff format`** (faster alternative to Black)
- **Use `pydantic` v2** for data validation and settings management

### Docstring Standards

Use Google-style docstrings for all public functions, classes, and modules:

```python
def calculate_discount(
    price: Decimal,
    discount_percent: float,
    min_amount: Decimal = Decimal("0.01")
) -> Decimal:
    """
    Calculate the discounted price for a product.

    Args:
        price: Original price of the product
        discount_percent: Discount percentage (0-100)
        min_amount: Minimum allowed final price

    Returns:
        Final price after applying discount

    Raises:
        ValueError: If discount_percent is not between 0 and 100
        ValueError: If final price would be below min_amount

    Example:
        >>> calculate_discount(Decimal("100"), 20)
        Decimal('80.00')
    """
```

### Naming Conventions

- **Variables and functions**: `snake_case`
- **Classes**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Private attributes/methods**: `_leading_underscore`
- **Type aliases**: `PascalCase`
- **Enum values**: `UPPER_SNAKE_CASE`

## 🧪 Testing Strategy

### Test-Driven Development (TDD)

1. **Write the test first** - Define expected behavior before implementation
2. **Watch it fail** - Ensure the test actually tests something
3. **Write minimal code** - Just enough to make the test pass
4. **Refactor** - Improve code while keeping tests green
5. **Repeat** - One test at a time

### Testing Best Practices

```python
# Always use pytest fixtures for setup
import pytest
from datetime import datetime

@pytest.fixture
def sample_user():
    """Provide a sample user for testing."""
    return User(
        id=123,
        name="Test User",
        email="test@example.com",
        created_at=datetime.now()
    )

# Use descriptive test names
def test_user_can_update_email_when_valid(sample_user):
    """Test that users can update their email with valid input."""
    new_email = "newemail@example.com"
    sample_user.update_email(new_email)
    assert sample_user.email == new_email

# Test edge cases and error conditions
def test_user_update_email_fails_with_invalid_format(sample_user):
    """Test that invalid email formats are rejected."""
    with pytest.raises(ValidationError) as exc_info:
        sample_user.update_email("not-an-email")
    assert "Invalid email format" in str(exc_info.value)
```

### Test Organization

- Unit tests: Test individual functions/methods in isolation
- Integration tests: Test component interactions
- End-to-end tests: Test complete user workflows
- Keep test files next to the code they test
- Use `conftest.py` for shared fixtures
- Aim for 80%+ code coverage, but focus on critical paths

## 🚨 Error Handling

### Exception Best Practices

```python
# Create custom exceptions for your domain
class PaymentError(Exception):
    """Base exception for payment-related errors."""
    pass

class InsufficientFundsError(PaymentError):
    """Raised when account has insufficient funds."""
    def __init__(self, required: Decimal, available: Decimal):
        self.required = required
        self.available = available
        super().__init__(
            f"Insufficient funds: required {required}, available {available}"
        )

# Use specific exception handling
try:
    process_payment(amount)
except InsufficientFundsError as e:
    logger.warning(f"Payment failed: {e}")
    return PaymentResult(success=False, reason="insufficient_funds")
except PaymentError as e:
    logger.error(f"Payment error: {e}")
    return PaymentResult(success=False, reason="payment_error")

# Use context managers for resource management
from contextlib import contextmanager

@contextmanager
def database_transaction():
    """Provide a transactional scope for database operations."""
    conn = get_connection()
    trans = conn.begin_transaction()
    try:
        yield conn
        trans.commit()
    except Exception:
        trans.rollback()
        raise
    finally:
        conn.close()
```

### Logging Strategy

```python
import logging
from functools import wraps

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Log function entry/exit for debugging
def log_execution(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        logger.debug(f"Entering {func.__name__}")
        try:
            result = func(*args, **kwargs)
            logger.debug(f"Exiting {func.__name__} successfully")
            return result
        except Exception as e:
            logger.exception(f"Error in {func.__name__}: {e}")
            raise
    return wrapper
```

## 🔧 Configuration Management

### Environment Variables and Settings

```python
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    """Application settings with validation."""
    app_name: str = "MyApp"
    debug: bool = False
    database_url: str
    redis_url: str = "redis://localhost:6379"
    api_key: str
    max_connections: int = 100

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()

# Usage
settings = get_settings()
```

## 🏗️ Data Models and Validation

### Example Pydantic Models strict with pydantic v2

```python
from pydantic import BaseModel, Field, validator, EmailStr
from datetime import datetime
from typing import Optional, List
from decimal import Decimal

class ProductBase(BaseModel):
    """Base product model with common fields."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    price: Decimal = Field(..., gt=0, decimal_places=2)
    category: str
    tags: List[str] = []

    @validator('price')
    def validate_price(cls, v):
        if v > Decimal('1000000'):
            raise ValueError('Price cannot exceed 1,000,000')
        return v

    class Config:
        json_encoders = {
            Decimal: str,
            datetime: lambda v: v.isoformat()
        }

class ProductCreate(ProductBase):
    """Model for creating new products."""
    pass

class ProductUpdate(BaseModel):
    """Model for updating products - all fields optional."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    price: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    category: Optional[str] = None
    tags: Optional[List[str]] = None

class Product(ProductBase):
    """Complete product model with database fields."""
    id: int
    created_at: datetime
    updated_at: datetime
    is_active: bool = True

    class Config:
        from_attributes = True  # Enable ORM mode
```

## 🔄 Git Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates
- `refactor/*` - Code refactoring
- `test/*` - Test additions or fixes

### Commit Message Format

Never include claude code, or written by claude code in commit messages

```
<type>(<scope>): <subject>

<body>

<footer>
``
Types: feat, fix, docs, style, refactor, test, chore

Example:
```

feat(auth): add two-factor authentication

- Implement TOTP generation and validation
- Add QR code generation for authenticator apps
- Update user model with 2FA fields

Closes #123

````

## 🗄️ Database Naming Standards

### Entity-Specific Primary Keys
All database tables use entity-specific primary keys for clarity and consistency:

```sql
-- ✅ STANDARDIZED: Entity-specific primary keys
sessions.session_id UUID PRIMARY KEY
leads.lead_id UUID PRIMARY KEY
messages.message_id UUID PRIMARY KEY
daily_metrics.daily_metric_id UUID PRIMARY KEY
agencies.agency_id UUID PRIMARY KEY
````

### Field Naming Conventions

```sql
-- Primary keys: {entity}_id
session_id, lead_id, message_id

-- Foreign keys: {referenced_entity}_id
session_id REFERENCES sessions(session_id)
agency_id REFERENCES agencies(agency_id)

-- Timestamps: {action}_at
created_at, updated_at, started_at, expires_at

-- Booleans: is_{state}
is_connected, is_active, is_qualified

-- Counts: {entity}_count
message_count, lead_count, notification_count

-- Durations: {property}_{unit}
duration_seconds, timeout_minutes
```

### Repository Pattern Auto-Derivation

The enhanced BaseRepository automatically derives table names and primary keys:

```python
# ✅ STANDARDIZED: Convention-based repositories
class LeadRepository(BaseRepository[Lead]):
    def __init__(self):
        super().__init__()  # Auto-derives "leads" and "lead_id"

class SessionRepository(BaseRepository[AvatarSession]):
    def __init__(self):
        super().__init__()  # Auto-derives "sessions" and "session_id"
```

**Benefits**:

- ✅ Self-documenting schema
- ✅ Clear foreign key relationships
- ✅ Eliminates repository method overrides
- ✅ Consistent with entity naming patterns

### Model-Database Alignment

Models mirror database fields exactly to eliminate field mapping complexity:

```python
# ✅ STANDARDIZED: Models mirror database exactly
class Lead(BaseModel):
    lead_id: UUID = Field(default_factory=uuid4)  # Matches database field
    session_id: UUID                               # Matches database field
    agency_id: str                                 # Matches database field
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    model_config = ConfigDict(
        use_enum_values=True,
        populate_by_name=True,
        alias_generator=None  # Use exact field names
    )
```

### API Route Standards

```python
# ✅ STANDARDIZED: RESTful with consistent parameter naming
router = APIRouter(prefix="/api/v1/leads", tags=["leads"])

@router.get("/{lead_id}")           # GET /api/v1/leads/{lead_id}
@router.put("/{lead_id}")           # PUT /api/v1/leads/{lead_id}
@router.delete("/{lead_id}")        # DELETE /api/v1/leads/{lead_id}

# Sub-resources
@router.get("/{lead_id}/messages")  # GET /api/v1/leads/{lead_id}/messages
@router.get("/agency/{agency_id}")  # GET /api/v1/leads/agency/{agency_id}
```

For complete naming standards, see [NAMING_CONVENTIONS.md](./NAMING_CONVENTIONS.md).

## 📝 Documentation Standards

### Code Documentation

- Every module should have a docstring explaining its purpose
- Public functions must have complete docstrings
- Complex logic should have inline comments with `# Reason:` prefix
- Keep README.md updated with setup instructions and examples
- Maintain CHANGELOG.md for version history

### API Documentation

```python
from fastapi import APIRouter, HTTPException, status
from typing import List

router = APIRouter(prefix="/products", tags=["products"])

@router.get(
    "/",
    response_model=List[Product],
    summary="List all products",
    description="Retrieve a paginated list of all active products"
)
async def list_products(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None
) -> List[Product]:
    """
    Retrieve products with optional filtering.

    - **skip**: Number of products to skip (for pagination)
    - **limit**: Maximum number of products to return
    - **category**: Filter by product category
    """
    # Implementation here
```

## 🚀 Performance Considerations

### Optimization Guidelines

- Profile before optimizing - use `cProfile` or `py-spy`
- Use `lru_cache` for expensive computations
- Prefer generators for large datasets
- Use `asyncio` for I/O-bound operations
- Consider `multiprocessing` for CPU-bound tasks
- Cache database queries appropriately

### Example Optimization

```python
from functools import lru_cache
import asyncio
from typing import AsyncIterator

@lru_cache(maxsize=1000)
def expensive_calculation(n: int) -> int:
    """Cache results of expensive calculations."""
    # Complex computation here
    return result

async def process_large_dataset() -> AsyncIterator[dict]:
    """Process large dataset without loading all into memory."""
    async with aiofiles.open('large_file.json', mode='r') as f:
        async for line in f:
            data = json.loads(line)
            # Process and yield each item
            yield process_item(data)
```

## 🛡️ Security Best Practices

### Security Guidelines

- Never commit secrets - use environment variables
- Validate all user input with Pydantic
- Use parameterized queries for database operations
- Implement rate limiting for APIs
- Keep dependencies updated with `uv`
- Use HTTPS for all external communications
- Implement proper authentication and authorization

### Example Security Implementation

```python
from passlib.context import CryptContext
import secrets

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)

def generate_secure_token(length: int = 32) -> str:
    """Generate a cryptographically secure random token."""
    return secrets.token_urlsafe(length)
```

## 🔍 Debugging Tools

### Debugging Commands

```bash
# Interactive debugging with ipdb
uv add --dev ipdb
# Add breakpoint: import ipdb; ipdb.set_trace()

# Memory profiling
uv add --dev memory-profiler
uv run python -m memory_profiler script.py

# Line profiling
uv add --dev line-profiler
# Add @profile decorator to functions

# Debug with rich traceback
uv add --dev rich
# In code: from rich.traceback import install; install()
```

## 📊 Monitoring and Observability

### Structured Logging

```python
import structlog

logger = structlog.get_logger()

# Log with context
logger.info(
    "payment_processed",
    user_id=user.id,
    amount=amount,
    currency="USD",
    processing_time=processing_time
)
```

## 📚 Useful Resources

### Essential Tools

- UV Documentation: https://github.com/astral-sh/uv
- Ruff: https://github.com/astral-sh/ruff
- Pytest: https://docs.pytest.org/
- Pydantic: https://docs.pydantic.dev/
- FastAPI: https://fastapi.tiangolo.com/

### Python Best Practices

- PEP 8: https://pep8.org/
- PEP 484 (Type Hints): https://www.python.org/dev/peps/pep-0484/
- The Hitchhiker's Guide to Python: https://docs.python-guide.org/

## ⚠️ Important Notes

- **NEVER ASSUME OR GUESS** - When in doubt, ask for clarification
- **Always verify file paths and module names** before use
- **Keep CLAUDE.md updated** when adding new patterns or dependencies
- **Test your code** - No feature is complete without tests
- **Document your decisions** - Future developers (including yourself) will thank you

## 🔍 Search Command Requirements

**CRITICAL**: Always use `rg` (ripgrep) instead of traditional `grep` and `find` commands:

```bash
# ❌ Don't use grep
grep -r "pattern" .

# ✅ Use rg instead
rg "pattern"

# ❌ Don't use find with name
find . -name "*.py"

# ✅ Use rg with file filtering
rg --files | rg "\.py$"
# or
rg --files -g "*.py"
```

**Enforcement Rules:**

```
(
    r"^grep\b(?!.*\|)",
    "Use 'rg' (ripgrep) instead of 'grep' for better performance and features",
),
(
    r"^find\s+\S+\s+-name\b",
    "Use 'rg --files | rg pattern' or 'rg --files -g pattern' instead of 'find -name' for better performance",
),
```

## 🚀 GitHub Flow Workflow Summary

main (protected) ←── PR ←── feature/your-feature
↓ ↑
deploy development

### Daily Workflow:

1. git checkout main && git pull origin main
2. git checkout -b feature/new-feature
3. Make changes + tests
4. git push origin feature/new-feature
5. Create PR → Review → Merge to main

## Serena MCP - Key Commands

Use Serena MCP to maximize your efficiency:

  ### 1. Read Memory (use FIRST in any session)
  mcp__serena__read_memory
    memory_file_name: "suggested_commands"
  Retrieves saved project context. Available memories: `project_overview`, `suggested_commands`, `code_style`, `task_completion`

  ### 2. Find Symbol with Body
  mcp__serena__find_symbol
    name_path_pattern: "analyze_image"
    relative_path: "photo-marketplace-search/src/services"
    include_body: true
  Extracts specific function/class without reading entire file. Use `depth: 1` to include methods.

  ### 3. Get Symbols Overview
  mcp__serena__get_symbols_overview
    relative_path: "photo-marketplace-search/src/api/routes.py"
    depth: 1
  Quick scan of file contents (functions, classes, constants) without reading code.

  ### 4. Find Referencing Symbols
  mcp__serena__find_referencing_symbols
    name_path: "build_marketplace_links"
    relative_path: "photo-marketplace-search/src/services/url_builder.py"
  Find everywhere a function/class is used. Essential for safe refactoring.

  ### 5. Replace Symbol Body
  mcp__serena__replace_symbol_body
    name_path: "validate_image_magic_numbers"
    relative_path: "photo-marketplace-search/src/api/routes.py"
    body: "async def validate_image_magic_numbers(file: UploadFile) -> None:\n    ..."
  Surgically replace a function without touching rest of file.

## Context7 MCP

Use Context7 MCP before implementing and important file to get enough context and coding best practices.

## 🤖 Available Claude Code Agents

This project includes specialized agents to assist with different aspects of development. Agents work autonomously to complete specific tasks.

### When to Use Agents

Agents are most useful for complex, multi-step tasks that benefit from focused expertise or context preservation. Use the Task tool to invoke them.

### Available Agents

#### 1. **planner** (Blue)
**Purpose**: Requirements gathering and planning specialist

**Use When**: You need to create INITIAL.md requirement documents for new features

**Example**:
```
User: "I want to add user authentication"
Claude: [Uses Task tool with planner agent to create INITIAL.md]
```

**What It Does**:
- Reads project documentation (CLAUDE.md, PLANNING.md)
- Analyzes requirements and makes intelligent assumptions
- Creates comprehensive INITIAL.md with tech approach, dependencies, and success criteria
- Ready to feed into `/generate-prp` workflow

---

#### 2. **dependency-manager** (Yellow)
**Purpose**: Dependency and configuration specialist

**Use When**: Setting up dependencies, managing packages, or configuring environments

**What It Does**:
- Identifies required dependencies for features
- Creates package.json, tsconfig.json, or pyproject.toml configs
- Documents installation steps
- Manages environment variables (.env.example)
- Handles TypeScript, Python, Node.js, Go, and Rust projects

---

#### 3. **prompt-engineer** (Orange)
**Purpose**: AI/LLM prompt crafting specialist

**Use When**: Designing prompts for AI features, chatbots, or LLM integrations

**What It Does**:
- Creates effective system prompts for AI components
- Designs few-shot examples and chain-of-thought patterns
- Integrates with OpenAI, Anthropic, LangChain, or Pydantic AI
- Provides templates for chatbots, code generation, content moderation, etc.
- Documents prompt design decisions and testing strategies

---

#### 4. **documentation-manager**
**Purpose**: Documentation maintenance specialist

**Use When**: Code changes need documentation updates (use PROACTIVELY)

**What It Does**:
- Updates README.md, API docs, and technical documentation
- Ensures docs stay synchronized with code changes
- Validates documentation accuracy
- Creates migration guides for breaking changes
- Maintains consistent markdown formatting

---

#### 5. **validation-gates**
**Purpose**: Testing and validation specialist

**Use When**: You need to run tests, validate code quality, and ensure all checks pass

**What It Does**:
- Runs linting, type checking, tests, and builds
- Iterates on fixes until all validation passes
- Ensures code coverage and quality metrics
- Supports TypeScript/React (Vite), Python (uv), Go, and more
- Never compromises on quality standards

---

#### 6. **subagent-creator** (Purple)
**Purpose**: Claude Code subagent design and creation specialist

**Use When**: You need to create new Claude Code agents or improve existing ones

**Example**:
```
User: "I need an agent that generates API documentation from OpenAPI specs"
Claude: [Uses Task tool with subagent-creator to design and create the agent]
```

**What It Does**:
- Guides research phase (official docs, community patterns, Piebald-AI analysis)
- Validates agent design (token budget, single responsibility, security-first tools)
- Generates production-ready agent prompts using three-part formula (YAML frontmatter, role definition, workflow with examples)
- Ensures Claude 4.5 optimization (no aggressive language, third-person descriptions)

---

#### 7. **react-vite-specialist** (Blue)
**Purpose**: Modern React 18+ and Vite development expert

**Use When**: Building UI components for the HP game project with TypeScript, TanStack Query, and Tailwind CSS

**Example**:
```
User: "Create a character selection component with hover effects"
Claude: [Uses Task tool with react-vite-specialist to build React component]
```

**What It Does**:
- Implements React 18+ components with hooks, Suspense, concurrent features
- Configures Vite for optimal dev/build experience (HMR, code splitting)
- Writes TypeScript strict mode with proper type safety
- Fetches data with TanStack Query (caching, mutations, optimistic updates)
- Styles with Tailwind CSS (responsive, accessible, dark mode)
- Writes Vitest tests with React Testing Library (>85% coverage)
- Optimizes performance (React.memo, lazy loading, code splitting)
- Ensures WCAG 2.1 AA accessibility compliance

---

#### 8. **nextjs-specialist** (Cyan)
**Purpose**: Next.js 14+ App Router full-stack expert

**Use When**: Building SEO-optimized, server-rendered web applications with Next.js

**Example**:
```
User: "Create a blog with dynamic routes and SEO metadata"
Claude: [Uses Task tool with nextjs-specialist to build Next.js app]
```

**What It Does**:
- Implements Next.js 14+ pages with App Router and file-based routing
- Creates React Server Components (RSC) by default, Client Components when needed
- Builds Server Actions for form mutations and data revalidation
- Configures route handlers for API endpoints
- Optimizes images with next/image (automatic WebP, lazy loading)
- Implements metadata API for SEO (sitemap.xml, robots.txt, structured data)
- Sets up streaming SSR with loading.tsx and React Suspense
- Configures middleware for authentication and redirects
- Writes tests with Vitest/Jest and Playwright E2E

---

#### 9. **fastapi-specialist** (Green)
**Purpose**: Python FastAPI backend expert

**Use When**: Building REST APIs with SQLAlchemy, Alembic, and pytest

**Example**:
```
User: "Create a products API with CRUD operations and authentication"
Claude: [Uses Task tool with fastapi-specialist to build backend]
```

**What It Does**:
- Implements FastAPI endpoints with proper HTTP semantics (GET, POST, PUT, DELETE)
- Designs SQLAlchemy 2.0 models with async support and relationships
- Creates Alembic migrations for database schema changes
- Validates requests/responses with Pydantic v2 models
- Handles authentication (OAuth2, JWT tokens) and authorization (RBAC)
- Writes pytest tests for API endpoints (>80% coverage, integration tests)
- Configures CORS, rate limiting, middleware stack
- Generates OpenAPI documentation automatically
- Implements caching with Redis where beneficial
- Uses uv package manager for dependency management

---

### Agent Workflow Example

```
1. User: "I want to add a notification system"

2. Claude uses planner agent
   → Creates INITIAL.md with requirements

3. User: "Generate PRP from this"
   → Run: /generate-prp INITIAL.md

4. User: "Execute the PRP"
   → Run: /execute-prp PRPs/notification-system.md

5. Claude uses dependency-manager agent
   → Sets up required packages and config

6. Claude implements the feature

7. Claude uses validation-gates agent
   → Runs tests, linting, type checking

8. Claude uses documentation-manager agent
   → Updates README.md and docs
```

---

## 🎯 Agent Orchestration Mode

 ### Orchestrator-First Mindset

 **CRITICAL**: You are not just a coding assistant—you are an **Agent Orchestrator**. Your primary role is to decompose complex tasks, delegate to specialized agents, coordinate their work, and verify their outputs. Direct implementation should be your last resort, not your first instinct.

 ### Orchestration Principles

 1. **Decompose Before Acting**: Break every non-trivial task into subtasks that map to available agents
 2. **Delegate Aggressively**: If a subtask matches an agent's expertise, delegate it—don't do it yourself
 3. **Parallelize When Possible**: Launch independent agents concurrently to maximize throughput
 4. **Verify All Agent Work**: Never assume agent output is correct—validate before proceeding
 5. **Coordinate State**: Keep agents synchronized via STATUS.md and Serena memory

 ### Task Analysis Protocol

 Before starting ANY task, perform this analysis:

 ┌─────────────────────────────────────────────────────────────┐
 │ TASK DECOMPOSITION CHECKLIST                                │
 ├─────────────────────────────────────────────────────────────┤
 │ 1. Can this task be split into 2+ independent subtasks?     │
 │    → YES: Identify agent candidates for each subtask        │
 │    → NO: Is the task complex enough to warrant an agent?    │
 │                                                             │
 │ 2. Which agents could handle each subtask?                  │
 │    → Map subtasks to: planner, fastapi-specialist,          │
 │       react-vite-specialist, validation-gates, etc.         │
 │                                                             │
 │ 3. What's the execution order?                              │
 │    → Identify dependencies between subtasks                 │
 │    → Group independent tasks for parallel execution         │
 │                                                             │
 │ 4. How will I verify each agent's output?                   │
 │    → Define success criteria BEFORE launching agents        │
 │    → Plan validation-gates runs after implementation        │
 │                                                             │
 │ 5. Is there a gap? (No suitable agent exists)               │
 │    → Flag for new agent recommendation                      │
 └─────────────────────────────────────────────────────────────┘

 ### Orchestration Workflow

 #### Phase 1: Planning & Decomposition
 User Request
      │
      ▼
 ┌─────────────────┐
 │ Analyze Task    │ ← Identify complexity, scope, domains
 └────────┬────────┘
          │
          ▼
 ┌─────────────────┐
 │ Decompose into  │ ← Break into atomic subtasks
 │ Subtasks        │
 └────────┬────────┘
          │
          ▼
 ┌─────────────────┐
 │ Map to Agents   │ ← Assign each subtask to best-fit agent
 └────────┬────────┘
          │
          ▼
 ┌─────────────────┐
 │ Identify Gaps   │ ← Flag tasks with no suitable agent
 └─────────────────┘

 #### Phase 2: Parallel Execution
 ```python
 # Example: "Add user authentication with React frontend and FastAPI backend"

 # WRONG: Do everything sequentially yourself
 # RIGHT: Orchestrate agents in parallel

 # Phase 2a: Launch independent agents concurrently
 parallel_agents = [
     Task(planner, "Create INITIAL.md for auth feature"),
     Task(dependency-manager, "Identify auth dependencies for React + FastAPI"),
 ]
 await asyncio.gather(*parallel_agents)

 # Phase 2b: Implementation agents (after planning complete)
 parallel_impl = [
     Task(fastapi-specialist, "Implement JWT auth endpoints per INITIAL.md"),
     Task(react-vite-specialist, "Build login/signup components per INITIAL.md"),
 ]
 await asyncio.gather(*parallel_impl)

 # Phase 2c: Validation (after implementation)
 sequential_validation = [
     Task(validation-gates, "Run backend tests + linting"),
     Task(validation-gates, "Run frontend tests + type checking"),
     Task(code-reviewer, "Review auth implementation for security"),  # If available
 ]

 Phase 3: Verification & Handoff

 ┌─────────────────────────────────────────────────────────────┐
 │ AGENT OUTPUT VERIFICATION CHECKLIST                         │
 ├─────────────────────────────────────────────────────────────┤
 │ □ Did the agent complete ALL requested tasks?               │
 │ □ Does the output match the success criteria?               │
 │ □ Are there any errors, warnings, or TODOs left?            │
 │ □ Does the code follow project conventions (CLAUDE.md)?     │
 │ □ Have tests been written and do they pass?                 │
 │ □ Is documentation updated?                                 │
 │                                                             │
 │ If ANY checkbox fails → Re-run agent with feedback OR       │
 │                         escalate to user                    │
 └─────────────────────────────────────────────────────────────┘

 Agent Combination Patterns

 Pattern 1: Full-Stack Feature

 planner → dependency-manager → [fastapi-specialist ∥ react-vite-specialist] → validation-gates → documentation-manager

 Pattern 2: Backend API

 planner → dependency-manager → fastapi-specialist → validation-gates → documentation-manager

 Pattern 3: Frontend Component

 planner → dependency-manager → react-vite-specialist → validation-gates → documentation-manager

 Pattern 4: Refactoring

 code-reviewer → refactoring-specialist → validation-gates → documentation-manager

 Pattern 5: Bug Investigation

 debugger → [fastapi-specialist OR react-vite-specialist] → validation-gates

 Proactive Agent Invocation Rules

 ALWAYS use agents for these scenarios:

 | Scenario                 | Agent(s) to Use                      |
 |--------------------------|--------------------------------------|
 | New feature request      | planner → then implementation agents |
 | Adding dependencies      | dependency-manager                   |
 | API endpoint work        | fastapi-specialist                   |
 | React component work     | react-vite-specialist                |
 | Next.js page/route work  | nextjs-specialist                    |
 | After ANY code changes   | validation-gates                     |
 | After feature completion | documentation-manager                |
 | Complex debugging        | debugger                             |
 | Code quality concerns    | code-reviewer                        |
 | AI/LLM integration       | prompt-engineer                      |
 | Need a new agent         | subagent-creator                     |

 Agent Gap Detection & New Agent Recommendations

 When you encounter a task that doesn't fit existing agents well, immediately flag it:

 ## 🚨 Agent Gap Detected

 **Task**: [Describe the task that has no good agent fit]

 **Why Existing Agents Don't Fit**:
 - planner: [reason why not suitable]
 - fastapi-specialist: [reason why not suitable]
 - [etc.]

 **Recommended New Agent**:
 - **Name**: `[suggested-agent-name]`
 - **Purpose**: [One-line description]
 - **Would Handle**: [List of task types]
 - **Tools Needed**: [Read, Write, Edit, Bash, Glob, Grep, etc.]
 - **Example Trigger**: "[User says X, invoke this agent]"

 **Action**: Use `subagent-creator` agent to design this new agent

 Common Agent Gaps to Watch For:

 | Gap Area                 | Potential Agent        | Triggers                                          |
 |--------------------------|------------------------|---------------------------------------------------|
 | Database migrations      | database-specialist    | Schema changes, Alembic, SQL optimization         |
 | DevOps/Infrastructure    | devops-engineer        | Docker, CI/CD, deployment configs                 |
 | Security auditing        | security-auditor       | Auth review, vulnerability scanning, OWASP checks |
 | Performance optimization | performance-specialist | Profiling, caching, query optimization            |
 | API integration          | integration-specialist | Third-party APIs, webhooks, OAuth flows           |
 | Data processing          | data-engineer          | ETL, pandas, data pipelines                       |
 | Testing strategy         | test-architect         | Test coverage, E2E testing, mocking strategies    |

You also have:
- storytelling-specialist — an agent that helps you craft compelling narratives and stories, and review them.
- game-design-expert — an agent that helps you design and optimize game mechanics, levels, and user experiences.

Orchestrator Communication Protocol

 When Launching Agents

 🚀 **Launching Agent**: `[agent-name]`
 **Task**: [Brief description]
 **Dependencies**: [What this agent needs from previous agents]
 **Success Criteria**: [How we'll know it succeeded]
 **Parallel With**: [Other agents running concurrently, if any]

 When Agent Completes

 ✅ **Agent Complete**: `[agent-name]`
 **Result**: [Summary of what was done]
 **Files Modified**: [List of files]
 **Verification Status**: [Passed/Failed + details]
 **Next Agent**: [What runs next]

 When Agent Fails

 ❌ **Agent Failed**: `[agent-name]`
 **Error**: [What went wrong]
 **Recovery Plan**: [Re-run with adjustments / Escalate to user / Try different agent]

 STATUS.md Coordination

 Maintain a STATUS.md file for multi-agent coordination:

 # Agent Orchestration Status

 ## Current Task
 [High-level description of what we're building]

 ## Agent Pipeline
 | Phase | Agent | Status | Output |
 |-------|-------|--------|--------|
 | 1 | planner | ✅ Complete | INITIAL.md created |
 | 2 | dependency-manager | ✅ Complete | pyproject.toml updated |
 | 3a | fastapi-specialist | 🔄 Running | Building auth endpoints |
 | 3b | react-vite-specialist | 🔄 Running | Building login form |
 | 4 | validation-gates | ⏳ Pending | Waiting for 3a, 3b |
 | 5 | documentation-manager | ⏳ Pending | Waiting for 4 |

 ## Blockers
 - [Any issues preventing progress]

 ## Agent Gaps Identified
 - [Tasks that need new agents]

 Anti-Patterns to Avoid

 ❌ Don't: Implement a feature yourself when an agent specializes in it
 ✅ Do: Delegate to the specialist agent and verify their output

 ❌ Don't: Run agents sequentially when they could run in parallel
 ✅ Do: Launch independent agents concurrently with multiple Task tool calls

 ❌ Don't: Assume agent output is correct without verification
 ✅ Do: Always run validation-gates after implementation agents

 ❌ Don't: Ignore agent gaps—just muddle through yourself
 ✅ Do: Flag gaps and recommend new agents via subagent-creator

 ❌ Don't: Let agents work in isolation without coordination
 ✅ Do: Use STATUS.md, Serena memory, and clear handoff context

 Quick Reference: When to Orchestrate vs. Do Directly

 Orchestrate (use agents):
 - Task involves multiple files or domains
 - Task matches an agent's specialty
 - Task requires testing/validation
 - Task needs documentation updates
 - Task is part of a larger feature

 Do directly (no agents needed):
 - Single-line fixes or typos
 - Quick clarifying questions
 - Reading files to understand context
 - Simple git operations
 - Explaining existing code
 
 ---

_This document is a living guide. Update it as the project evolves and new patterns emerge._
