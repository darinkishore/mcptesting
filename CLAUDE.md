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

## Frontend Architecture Principles

### Design System: Neo-Brutalist
**CRITICAL**: This codebase uses neo-brutalist design principles throughout the frontend.

#### Design Specifications
- **Neo-brutalist design**: Stark black borders, raw concrete textures
- **Grid systems**: Exposed grid systems with visible boundaries
- **Layouts**: Asymmetric layouts with aggressive positioning
- **Typography**: Bold monospace typography (JetBrains Mono)
- **Color scheme**: High contrast monochrome with single accent colors
  - Electric blue (#00f0ff) for success states
  - Danger red (#ff2d20) for error states
- **Visual style**:
  - Thick outlines (3px borders)
  - No rounded corners (all sharp edges)
  - Anti-aliased elements
  - Raw HTML aesthetic
  - Visible component boundaries
  - Aggressive shadows (8px solid black)

#### CSS Classes
The following neo-brutalist classes are available globally:
- `.neo-component` - Standard brutalist component container
- `.neo-grid` - Grid with visible guidelines
- `.neo-table` - Brutalist table styling
- `.neo-success` / `.neo-success-bg` - Electric blue accent
- `.neo-danger` / `.neo-danger-bg` - Danger red accent

### Locality of Reasoning
**CRITICAL**: This codebase prioritizes locality of reasoning and straightforwardness. Components live where they're used, not in global folders.

#### Co-location Rules
1. **Keep components next to where they're used**
   - NO global `/components` folder
   - Components used by one page live in that page's directory
   - Components truly shared across routes go at lowest common parent

2. **File Organization Example**
```
app/
├── page.tsx                          # Main page
├── leaderboard-table.tsx             # Only used by page.tsx - lives here
├── score-cell.tsx                    # Shared by leaderboard - at app level
├── mcp-types.ts                      # Types used across routes - at app level
├── [serverId]/
│   ├── page.tsx                      # Server overview page
│   ├── server-header.tsx             # Shared across all server tabs
│   ├── tab-nav.tsx                   # Tab navigation for server pages
│   ├── tool/
│   │   ├── page.tsx                  # Tool evaluation page
│   │   ├── task-list.tsx             # ONLY for tool tab - lives here
│   │   ├── task-trace-viewer.tsx     # ONLY for tool tab - lives here
│   │   └── trace-message.tsx         # ONLY for tool tab - lives here
│   └── security/
│       ├── page.tsx                  # Security analysis page
│       ├── security-checks.tsx       # ONLY for security tab - lives here
│       └── check-evidence.tsx        # ONLY for security tab - lives here
```

3. **When to Share Components**
   - **Small components (< 30 lines)**: Just duplicate them
   - **Larger shared components**: Put at lowest common parent directory
   - **Never hunt for components**: Everything for a feature stays together

#### Benefits of This Approach
- When debugging tool evaluation, everything is in `[serverId]/tool/`
- No jumping between `/components`, `/lib`, `/utils` directories
- Each route is self-contained with its specific logic
- New developers can understand a feature by looking in one place

### Server Components by Default
- All page.tsx files are Server Components
- Fetch data directly in components, no separate data layer
- Only add 'use client' when you need interactivity (onClick, useState, etc.)
- This keeps most rendering on the server, improving performance

### Routes as Feature Boundaries
- Each route represents a complete feature
- Tab navigation uses routes (`/server-123`, `/server-123/tool`, `/server-123/security`)
- This gives you free browser history and shareable URLs
- Each route folder contains ALL code for that feature

### Type Safety
- Types that are truly shared go in `app/mcp-types.ts`
- Route-specific types stay in that route's folder
- Always define interfaces for component props

## Type System Architecture

### Comprehensive Domain Types
**CRITICAL**: The MCP Testing Leaderboard uses a comprehensive type system located in `app/types/`. This is the single source of truth for all domain models.

#### Organization
```
app/types/
├── index.ts           # Re-exports everything for convenience
├── core.ts            # Branded IDs, enums, ServerMeta, EvaluationRun
├── leaderboard.ts     # LeaderboardRow, queries, sorting
├── tool-evaluation.ts # Tasks, traces, ChatCompletion types
├── security.ts        # SecurityCheck, Evidence union, SecurityLint
├── server-detail.ts   # ServerDetail, Overview, tabs data
└── api.ts             # API response shapes
```

#### Key Features

**1. Branded Types for Type Safety**
```typescript
// Prevents mixing up different ID types
type ServerId = string & { readonly __brand: "ServerId" };
type TaskId = string & { readonly __brand: "TaskId" };
```

**2. Discriminated Unions for Evidence**
```typescript
type Evidence =
  | { type: "httpTrace"; request: ...; response: ... }
  | { type: "validatorAssertion"; testId: ...; ... }
  | { type: "scanIssue"; code: ...; entity: ... }
  // ... more types
```

**3. Comprehensive Chat Trace Model**
- Full OpenAI-style chat completion traces
- Token usage tracking
- Tool call metadata
- Success/failure with expected values

**4. Reproducibility with EvaluationRun**
- Tracks exact tool versions
- Captures environment details
- Links to specific commits and datasets

#### Import Usage
```typescript
// Import everything you need from the index
import { ServerId, LeaderboardRow, SecurityCheck } from '@/types';

// Or import from specific domain files
import { Evidence } from '@/types/security';
import { ChatCompletionTrace } from '@/types/tool-evaluation';
```

#### Type Guidelines
1. **Always use branded types** for IDs to prevent mix-ups
2. **Use discriminated unions** for evidence and other variants
3. **Keep raw data** in optional `raw` fields for debugging
4. **Track provenance** with RunId and version info
5. **Prefer interfaces over types** for object shapes (better error messages)

## Frontend-Backend Integration

- Backend CORS is configured for `http://localhost:3000`
- Frontend API base URL defaults to `http://localhost:8000`
- Test integration at `http://localhost:3000/api-test` page