#!/usr/bin/env python3
"""Run MCP scan (and optional validator) with detailed logging.

Usage:
  uv run python scripts/test_security_scan.py --server-url https://...
"""

from __future__ import annotations

import argparse
import asyncio
import importlib
import json
import logging
import os
import shlex
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from typing import Any, Dict, List, Tuple, TYPE_CHECKING

import httpx

DEFAULT_SCAN_ROOT = Path(__file__).resolve().parents[1] / "../mcp-scan"
DEFAULT_VALIDATOR_ROOT = Path(__file__).resolve().parents[1] / "../mcp-validator"
DEFAULT_STORAGE_ROOT = Path(os.environ.get("MCP_SCAN_STORAGE_ROOT", "/var/tmp/mcp-scan"))

try:
    from fastmcp.client.auth.oauth import OAuth as FastMCPOAuth

    FASTMCP_AVAILABLE = True
except Exception:  # pragma: no cover - optional dependency
    FASTMCP_AVAILABLE = False


if TYPE_CHECKING:  # pragma: no cover - typing only
    pass  # type: ignore[import]


def setup_logging(verbose: bool) -> None:
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s | %(levelname)-7s | %(message)s",
        datefmt="%H:%M:%S",
    )


def parse_header(header: str) -> Tuple[str, str]:
    if ":" not in header:
        raise ValueError(f"Header must be key:value format, got '{header}'")
    key, value = header.split(":", 1)
    return key.strip(), value.strip()


def write_temp_config(tmp_dir: Path, server_url: str, headers: Dict[str, str], protocol_version: str | None) -> Path:
    config = {
        "mcp": {
            "servers": {
                "target": {
                    "type": "http",
                    "url": server_url,
                    "headers": headers or {},
                }
            }
        }
    }
    if protocol_version:
        config["mcp"]["servers"]["target"]["headers"]["MCP-Protocol-Version"] = protocol_version

    config_path = tmp_dir / "config.json"
    config_path.write_text(json.dumps(config, indent=2), encoding="utf-8")
    logging.debug("Wrote config to %s:\n%s", config_path, config_path.read_text())
    return config_path


def run_command(cmd: List[str], cwd: Path | None = None, timeout: int | None = None) -> subprocess.CompletedProcess[bytes]:
    display_cmd = " ".join(shlex.quote(part) for part in cmd)
    logging.info("Executing: %s", display_cmd)
    start = time.perf_counter()
    proc = subprocess.run(cmd, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=timeout)
    duration = time.perf_counter() - start
    logging.info("Command finished in %.2fs with return code %s", duration, proc.returncode)
    if proc.stdout:
        logging.debug("stdout (%s bytes):\n%s", len(proc.stdout), proc.stdout.decode(errors='replace'))
    if proc.stderr:
        logging.debug("stderr (%s bytes):\n%s", len(proc.stderr), proc.stderr.decode(errors='replace'))
    return proc


def run_mcp_scan(
    scan_root: Path,
    config_path: Path,
    storage_dir: Path,
    timeout: int,
) -> Dict[str, Any]:
    cmd = [
        "uv",
        "run",
        "-m",
        "src.mcp_scan.run",
        "scan",
        str(config_path),
        "--json",
        "--server-timeout",
        str(timeout),
        "--storage-file",
        str(storage_dir),
    ]
    proc = run_command(cmd, cwd=scan_root)
    if proc.returncode != 0:
        raise RuntimeError(f"mcp-scan failed: rc={proc.returncode}\n{proc.stderr.decode(errors='replace')}")
    output = json.loads(proc.stdout.decode("utf-8"))
    logging.debug("Parsed MCP scan JSON: %s", json.dumps(output, indent=2)[:800])
    return output


def summarise_scan(output: Dict[str, Any]) -> None:
    path, payload = next(iter(output.items()))
    issues = payload.get("issues", [])
    logging.info("MCP scan completed for %s", path)
    logging.info("Issues (%s): %s", len(issues), ", ".join(issue.get("code", "?") for issue in issues) or "none")


def run_validator(server_url: str, headers: Dict[str, str], protocol_version: str | None, validator_root: Path) -> List[Tuple[str, bool, str]]:
    sys.path.insert(0, str(validator_root))
    try:
        tester_module = importlib.import_module("mcp_testing.http.tester")
        MCPHttpTester = getattr(tester_module, "MCPHttpTester")
    except (ImportError, AttributeError) as exc:  # pragma: no cover - guard
        logging.warning("mcp-validator package not available: %s", exc)
        logging.warning("Skipping validator checks. Install mcp-validator or pass --no-validator to silence this warning.")
        return []

    logging.info("Running MCP Validator checks")
    tester = MCPHttpTester(server_url, debug=False)
    if protocol_version:
        tester.protocol_version = protocol_version
    if headers:
        tester.request_session.headers.update(headers)

    checks: List[Tuple[str, bool, str]] = []

    def record(name: str, result: bool, note: str) -> None:
        logging.info("Validator: %s -> %s (%s)", name, "PASS" if result else "FAIL", note)
        checks.append((name, result, note))

    cases = [
        ("OAuth flow", "VAL-HTTP-OAUTH", tester.test_oauth_flow),
        ("WWW-Authenticate", "VAL-HTTP-WWW", tester.test_www_authenticate_flexibility),
        ("OPTIONS", "VAL-HTTP-OPTIONS", tester.options_request),
    ]
    for label, code, fn in cases:
        try:
            result = fn()
            note = "OK" if result else "Unexpected response"
        except Exception as exc:  # noqa: BLE001
            result = False
            note = f"Exception: {exc}"
        record(code, result, note)

    return checks


def obtain_token_with_fastmcp(
    server_url: str,
    scopes: str | None,
    cache_dir: Path,
    protocol_version: str | None,
    base_headers: Dict[str, str],
) -> Dict[str, str] | None:
    if not FASTMCP_AVAILABLE:
        logging.debug("fastmcp not available; cannot attempt OAuth flow")
        return None

    logging.info("Attempting OAuth flow via fastmcp")

    auth_provider = FastMCPOAuth(
        mcp_url=server_url,
        scopes=scopes,
        token_storage_cache_dir=cache_dir,
        client_name="mcptesting-scan",
    )

    async def fetch_token() -> Dict[str, str] | None:
        await auth_provider._initialize()
        tokens = getattr(auth_provider.context, "current_tokens", None)
        if tokens and tokens.access_token:
            logging.info("Using cached OAuth token for %s", server_url)
            return {"Authorization": f"Bearer {tokens.access_token}"}

        headers = dict(base_headers)
        if protocol_version:
            headers.setdefault("MCP-Protocol-Version", protocol_version)

        async with httpx.AsyncClient(auth=auth_provider, timeout=60.0) as client:
            try:
                await client.get(server_url, headers=headers)
            except Exception as exc:  # noqa: BLE001
                logging.warning("OAuth discovery request failed: %s", exc)
                return None

        tokens = getattr(auth_provider.context, "current_tokens", None)
        if tokens and tokens.access_token:
            logging.info("Obtained OAuth token for %s", server_url)
            return {"Authorization": f"Bearer {tokens.access_token}"}

        logging.warning("fastmcp OAuth flow did not yield an access token")
        return None

    return asyncio.run(fetch_token())


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run MCP scan + validator with logging")
    parser.add_argument("--server-url", required=True, help="HTTP MCP server URL")
    parser.add_argument(
        "--header",
        action="append",
        default=[],
        help="Additional header in key:value format (can repeat)",
    )
    parser.add_argument("--protocol-version", default=None)
    parser.add_argument("--scan-root", default=str(DEFAULT_SCAN_ROOT))
    parser.add_argument("--validator-root", default=str(DEFAULT_VALIDATOR_ROOT))
    parser.add_argument("--storage-root", default=str(DEFAULT_STORAGE_ROOT))
    parser.add_argument("--timeout", type=int, default=45, help="Server timeout in seconds")
    parser.add_argument("--no-validator", action="store_true", help="Skip validator tests")
    parser.add_argument("--oauth-scopes", default=None, help="Space-separated OAuth scopes to request")
    parser.add_argument("--verbose", action="store_true")
    return parser


def main() -> int:
    parser = build_arg_parser()
    args = parser.parse_args()
    setup_logging(args.verbose)

    scan_root = Path(args.scan_root).resolve()
    validator_root = Path(args.validator_root).resolve()
    storage_root = Path(args.storage_root).resolve()
    storage_root.mkdir(parents=True, exist_ok=True)

    logging.info("Using scan root: %s", scan_root)
    logging.info("Using storage root: %s", storage_root)

    headers = {}
    for header in args.header:
        key, value = parse_header(header)
        headers[key] = value
    if headers:
        logging.info("Custom headers: %s", headers)

    cache_root = storage_root / "oauth-cache"
    cache_root.mkdir(parents=True, exist_ok=True)

    if headers.get("Authorization") is None and FASTMCP_AVAILABLE:
        try:
            oauth_headers = obtain_token_with_fastmcp(
                server_url=args.server_url,
                scopes=args.oauth_scopes,
                cache_dir=cache_root,
                protocol_version=args.protocol_version,
                base_headers=headers,
            )
            if oauth_headers:
                headers.update(oauth_headers)
        except Exception as exc:  # noqa: BLE001
            logging.warning("fastmcp OAuth flow failed: %s", exc)

    with tempfile.TemporaryDirectory(prefix="scan-config-") as tmp:
        tmp_dir = Path(tmp)
        config_path = write_temp_config(tmp_dir, args.server_url, headers, args.protocol_version)

        try:
            scan_output = run_mcp_scan(scan_root, config_path, storage_root, args.timeout)
        except Exception as exc:  # noqa: BLE001
            logging.error("MCP scan failed: %s", exc)
            return 1

        summarise_scan(scan_output)

        if not args.no_validator:
            try:
                checks = run_validator(args.server_url, headers, args.protocol_version, validator_root)
                passed = sum(1 for _, ok, _ in checks if ok)
                logging.info("Validator summary: %s/%s checks passed", passed, len(checks))
            except Exception as exc:  # noqa: BLE001
                logging.error("Validator failed: %s", exc)
                return 1

        logging.info("Scan complete. Stored artifacts in %s", storage_root)

    return 0


if __name__ == "__main__":
    sys.exit(main())
