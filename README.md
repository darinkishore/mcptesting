# Python & Next.js Monorepo

A modern monorepo that combines a FastAPI backend with a Next.js 15 frontend. Python dependencies are managed with [UV](https://docs.astral.sh/uv/), and the frontend uses npm.

## Project Structure

```
.
├─ apps/
│  ├─ backend/     # FastAPI service
│  └─ frontend/    # Next.js app router UI
├─ packages/
│  └─ shared/      # Shared Python utilities
├─ scripts/        # Helper scripts (security scans, etc.)
└─ pyproject.toml  # UV workspace config
```

## Quick Start

### Prerequisites
- Python 3.13+
- Node.js 18+
- [UV](https://docs.astral.sh/uv/) installed (`pipx install uv` recommended)
- npm (or pnpm if you prefer)

### Install Dependencies
1. **Python**
   ```bash
   uv sync
   ```
2. **Frontend**
   ```bash
   cd apps/frontend
   npm install
   ```

### Run Dev Servers
- **Backend**
  ```bash
  uv run --directory apps/backend uvicorn backend.main:app --reload --port 8000
  ```
- **Frontend**
  ```bash
  cd apps/frontend
  npm run dev
  ```

## Security Scan Integration (MCP Scan + Validator)

The backend can launch full MCP security scans and HTTP compliance checks via `/api/security/scans`. To make that work on any machine you must install the supporting projects and expose a few environment variables.

1. **Clone required projects alongside this repo**
   ```text
   ~/projects/
     ├─ mcptesting          (this repo)
     ├─ mcp-scan            https://github.com/invariantlabs-ai/mcp-scan.git
     └─ mcp-validator       https://github.com/invariantlabs-ai/mcp-validator.git
   ```

2. **Install FastMCP in this environment**
   ```bash
   uv pip install fastmcp
   ```

3. **Set environment variables (adjust paths as needed)**
   ```bash
   export MCP_SCAN_PROJECT_ROOT=$HOME/projects/mcp-scan
   export MCP_VALIDATOR_PROJECT_ROOT=$HOME/projects/mcp-validator
   # choose a writable directory for scan artifacts
   export MCP_SCAN_STORAGE_ROOT=/private/var/tmp/mcp-scan   # e.g. on macOS
   ```
   The production default is `/var/lib/mcp-scan`; on macOS you’ll hit `PermissionError` unless you override it with a writable path.

4. **OAuth flow**
   - The first time you scan a protected MCP server the backend (and `scripts/test_security_scan.py`) will open your default browser using FastMCP’s OAuth helper.
   - Complete the consent flow and wait for the “You can close this tab” message. Tokens are cached under `$MCP_SCAN_STORAGE_ROOT/<hash>/oauth/` so subsequent scans reuse them.

5. **Artifacts & troubleshooting**
   - Raw outputs land in `$MCP_SCAN_STORAGE_ROOT/<hash>/`:
     - `scan_<job>.json` – MCP scan signature + issues
     - `scan_<job>.log` – scan CLI stderr/stdout
     - `validator_<job>.log` – MCP validator output
   - To clear cached OAuth clients/tokens:
     ```bash
     rm -rf "$MCP_SCAN_STORAGE_ROOT"/*/oauth
     uv run python - <<'PY'
     from fastmcp.client.auth.oauth import FileTokenStorage
     FileTokenStorage.clear_all()
     PY
     ```
   - You can request custom scopes by supplying `oauthScopes` when creating a scan job (defaults to `offline_access`).

6. **Bootstrap helper script (macOS friendly)**

   From the repo root, run:
   ```bash
   ./scripts/setup_mcp_env.sh
   ```
   This script clones both `mcp-scan` and `mcp-validator` next to the repo, creates a writable cache directory (`~/Library/Application Support/mcptesting/mcp-scan`), and writes a `.env` file with the correct environment variables. When it finishes, load them into your shell with `source .env`.

## Helpful Scripts

- `scripts/test_security_scan.py` – run MCP Scan + Validator end-to-end against a given MCP HTTP endpoint with verbose logging.
- `scripts/run_backend_scan.py` – exercise the backend job pipeline locally (uses the same code path as `/api/security/scans`).

## Common Development Commands

### Backend (UV)
```bash
uv run pytest            # run tests
uv run ruff check .      # lint
uv run python -m compileall apps/backend/src/backend/main.py  # sanity check syntax
```

### Frontend (npm)
```bash
npm run dev
npm run lint
npm run build
```

## Notes
- The backend pulls in shared utilities from `packages/shared` (installed as an editable UV workspace member).
- The frontend is a Next.js 15 App Router app written in TypeScript.
- When security scanning OAuth-protected MCP servers, make sure you’re logged into the correct account in the browser that opens.

Happy hacking!
