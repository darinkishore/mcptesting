# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical Commands

### Running Services
```bash
# Backend (FastAPI) - ALWAYS run from project root
uv run --directory apps/backend uvicorn backend.main:app --reload --port 8000

# Frontend (Next.js) - must cd into frontend directory
cd apps/frontend && npm run dev
```

### Dependency Management
```bash
# Python - ALWAYS use uv, NEVER use pip directly
uv sync                                          # Install all Python dependencies
uv add --directory apps/backend <package>       # Add package to backend
uv add --dev <package>                         # Add dev dependency to workspace

# JavaScript - use npm in frontend directory
cd apps/frontend && npm install                 # Install frontend dependencies
cd apps/frontend && npm install <package>       # Add frontend package
```

### Testing & Validation
```bash
# Python validation (from root)
uv run --directory apps/backend python -c "from backend.main import app"  # Quick import check
uv run pytest                                   # Run all Python tests
uv run pytest apps/backend/tests/test_file.py::test_name  # Run single test
uv run ruff check .                             # Lint Python code
uv run ruff format .                            # Format Python code (ruff formatter)
uv run mypy apps/backend                       # Type check Python with Pydantic plugin

# Frontend validation
cd apps/frontend && npm run build              # Build check (catches type errors)
cd apps/frontend && npm run lint               # ESLint check
```

## Architecture

### Monorepo Structure
This is a UV workspace monorepo with Python backend and Next.js frontend:

- **UV Workspace**: Root `pyproject.toml` defines workspace members and shared dev dependencies
- **Backend**: FastAPI app in `apps/backend/` that imports from `packages/shared/`
- **Frontend**: Next.js 15 app with TypeScript, Tailwind, ESLint, Turbopack
- **Shared Package**: Python utilities in `packages/shared/` available to all Python apps

### API Contract Synchronization
The backend (FastAPI) and frontend (TypeScript) must stay synchronized:

1. **Backend endpoints** → `apps/backend/src/backend/main.py`
2. **TypeScript types** → `apps/frontend/types/api.ts`
3. **API client** → `apps/frontend/lib/api.ts`

When adding/modifying endpoints:
- Update Pydantic models in backend
- Mirror changes in TypeScript interfaces
- Update API client functions

### Import Patterns

**Python imports:**
```python
from shared.utils import get_version  # Cross-package import
from backend.models import User       # Within-package import
```

**TypeScript imports:**
```typescript
import { ApiResponse } from '@/types/api'  # Always use @/ alias
import { api } from '@/lib/api'           # Never use relative ../
```

### Workspace Dependencies

The backend declares `shared` as a workspace dependency:
```toml
# apps/backend/pyproject.toml
[tool.uv.sources]
shared = { workspace = true }
```

This allows the backend to import from the shared package without publishing it.

## Key Development Workflows

### Adding a New API Endpoint
1. Add endpoint to `apps/backend/src/backend/main.py`
2. Add TypeScript types to `apps/frontend/types/api.ts`
3. Add client function to `apps/frontend/lib/api.ts`
4. Test with both services running

### Creating a New Python Package
```bash
uv init --lib packages/<name>
# Then add to backend dependencies if needed:
uv add --directory apps/backend <name>
# Add workspace source reference in apps/backend/pyproject.toml
```

### Debugging Import Errors
```bash
# Verify Python imports
uv run --directory apps/backend python -c "from <module> import <item>"

# Check workspace members
uv sync  # This will validate all workspace configurations
```

## Frontend-Backend Integration

- Backend CORS is configured for `http://localhost:3000`
- Frontend API base URL defaults to `http://localhost:8000`
- Test integration at `http://localhost:3000/api-test` page