from __future__ import annotations

import asyncio
from asyncio import subprocess as aio_subprocess
import io
import json
import logging
import os
import sys
import uuid
from collections import defaultdict
from contextlib import redirect_stdout
from dataclasses import dataclass, field
from datetime import datetime, timezone
from hashlib import sha256
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Any, Dict, Iterable, List, Literal, Optional, Tuple

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel, Field, ConfigDict
from shared.utils import get_version
from fastmcp.client.auth.oauth import OAuth as FastMCPOAuth


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------


def _default_mcp_scan_root() -> Path:
    """Resolve a sensible default for the mcp-scan project directory."""

    backend_root = Path(__file__).resolve()
    repo_root = backend_root.parents[5]
    sibling = repo_root.parent / "mcp-scan"
    return Path(os.environ.get("MCP_SCAN_PROJECT_ROOT", sibling)).resolve()


logger = logging.getLogger(__name__)


MCP_SCAN_ROOT = _default_mcp_scan_root()




def _default_mcp_validator_root() -> Path:
    """Resolve default location for the mcp-validator project."""

    backend_root = Path(__file__).resolve()
    repo_root = backend_root.parents[5]
    sibling = repo_root.parent / "mcp-validator"
    return Path(os.environ.get("MCP_VALIDATOR_PROJECT_ROOT", sibling)).resolve()


MCP_VALIDATOR_ROOT = _default_mcp_validator_root()
if MCP_VALIDATOR_ROOT.exists() and str(MCP_VALIDATOR_ROOT) not in sys.path:
    sys.path.insert(0, str(MCP_VALIDATOR_ROOT))

MCP_SCAN_STORAGE_ROOT = Path(
    os.environ.get("MCP_SCAN_STORAGE_ROOT", "/var/lib/mcp-scan")
).resolve()
MCP_SCAN_STORAGE_ROOT.mkdir(parents=True, exist_ok=True)

SCAN_TIMEOUT_SECONDS = int(os.environ.get("MCP_SCAN_TIMEOUT_SECONDS", "45"))

OAUTH_CALLBACK_BASE_URL = os.environ.get("MCP_OAUTH_CALLBACK_BASE_URL", "http://localhost:8000").rstrip("/")


# ---------------------------------------------------------------------------
# FastAPI setup
# ---------------------------------------------------------------------------


app = FastAPI(title="Backend API", version=get_version())

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Job registry
# ---------------------------------------------------------------------------


class ScanInclude(BaseModel):
    mcpScan: bool = True
    mcpValidator: bool = False


class ScanRequest(BaseModel):
    server_url: str = Field(alias="serverUrl")
    headers: Dict[str, str] | None = None
    protocol_version: str | None = Field(default=None, alias="protocolVersion")
    include: ScanInclude | None = None
    timeout_seconds: int | None = Field(default=None, ge=5, le=600)
    oauth_scopes: str | None = Field(default=None, alias="oauthScopes")


class ScanJobCreated(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    job_id: str = Field(alias="jobId")
    status: str


class ScanJobStatus(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    job_id: str = Field(alias="jobId")
    status: str
    created_at: datetime = Field(alias="createdAt")
    started_at: datetime | None = Field(default=None, alias="startedAt")
    finished_at: datetime | None = Field(default=None, alias="finishedAt")
    result: Dict[str, Any] | None = None
    error: str | None = None


class RepositoryCreateRequest(BaseModel):
    name: str
    serverUrl: str
    scopes: str | None = None


class RepositoryResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str
    name: str
    serverUrl: str
    scopes: str | None = None
    status: RepositoryStatus
    authorizeUrl: str | None = None
    lastError: str | None = None
    securityLint: Dict[str, Any] | None = None
    providers: Dict[str, Any] | None = None
    artifacts: Dict[str, str] | None = None
    createdAt: datetime
    updatedAt: datetime
    lastScanJobId: str | None = None


@dataclass
class ScanJob:
    job_id: str
    request: ScanRequest
    status: str = "pending"
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    started_at: datetime | None = None
    finished_at: datetime | None = None
    result: Dict[str, Any] | None = None
    error: str | None = None
    artifacts: Dict[str, str] = field(default_factory=dict)


jobs: Dict[str, ScanJob] = {}
jobs_lock = asyncio.Lock()
active_tasks: set[asyncio.Task[Any]] = set()


# ---------------------------------------------------------------------------
# Repository storage
# ---------------------------------------------------------------------------


RepositoryStatus = Literal[
    "creating",
    "awaiting_user",
    "authorizing",
    "scanning",
    "ready",
    "error",
]


@dataclass
class RepositoryAuthState:
    authorize_event: asyncio.Event = field(default_factory=asyncio.Event)
    code_future: asyncio.Future[tuple[str, str | None]] | None = None
    auth: FastMCPOAuth | None = None
    headers: Dict[str, str] = field(default_factory=dict)
    storage_dir: Path | None = None
    authorize_url: str | None = None


@dataclass
class RepositoryRecord:
    id: str
    name: str
    server_url: str
    scopes: str | None
    status: RepositoryStatus
    created_at: datetime
    updated_at: datetime
    authorize_url: str | None = None
    last_error: str | None = None
    security_lint: Dict[str, Any] | None = None
    providers: Dict[str, Any] | None = None
    artifacts: Dict[str, str] | None = None
    auth_state: RepositoryAuthState | None = None
    last_scan_job_id: str | None = None


repositories: Dict[str, RepositoryRecord] = {}
repositories_lock = asyncio.Lock()


# ---------------------------------------------------------------------------
# Utility helpers
# ---------------------------------------------------------------------------


def _normalize_headers(headers: Dict[str, str] | None) -> Dict[str, str]:
    if not headers:
        return {}
    return {k: v for k, v in headers.items() if v is not None}


def _has_authorization_header(headers: Dict[str, str]) -> bool:
    return any(key.lower() == "authorization" for key in headers)


async def _maybe_attach_oauth_headers(
    job: ScanJob,
    headers: Dict[str, str],
    storage_dir: Path,
) -> Dict[str, str]:
    if not job.request.server_url.startswith("http"):
        return headers

    if _has_authorization_header(headers):
        return headers

    oauth_headers = await _obtain_oauth_headers(
        server_url=job.request.server_url,
        protocol_version=job.request.protocol_version,
        scopes=job.request.oauth_scopes,
        base_headers=headers,
        cache_root=storage_dir,
    )
    if oauth_headers:
        headers.update(oauth_headers)
    return headers


async def _obtain_oauth_headers(
    server_url: str,
    protocol_version: str | None,
    scopes: str | None,
    base_headers: Dict[str, str],
    cache_root: Path,
) -> Dict[str, str] | None:
    oauth_cache = cache_root / "oauth"
    oauth_cache.mkdir(parents=True, exist_ok=True)

    auth = FastMCPOAuth(
        mcp_url=server_url,
        scopes=scopes,
        client_name="mcptesting-backend",
        token_storage_cache_dir=oauth_cache,
    )

    await auth._initialize()
    tokens = getattr(auth.context, "current_tokens", None)
    if tokens and tokens.access_token:
        logger.info("Using cached OAuth token for %s", server_url)
        return {"Authorization": f"Bearer {tokens.access_token}"}

    request_headers = dict(base_headers)
    if protocol_version:
        request_headers.setdefault("MCP-Protocol-Version", protocol_version)

    try:
        async with httpx.AsyncClient(auth=auth, timeout=60.0) as client:
            await client.get(server_url, headers=request_headers)
    except Exception as exc:  # noqa: BLE001
        logger.warning("OAuth flow failed for %s: %s", server_url, exc)
        return None

    tokens = getattr(auth.context, "current_tokens", None)
    if tokens and tokens.access_token:
        logger.info("Obtained OAuth token for %s", server_url)
        return {"Authorization": f"Bearer {tokens.access_token}"}

    logger.warning("OAuth flow completed without token for %s", server_url)
    return None


async def _update_repo(repo_id: str, **fields: Any) -> None:
    async with repositories_lock:
        repo = repositories.get(repo_id)
        if repo is None:
            return
        for key, value in fields.items():
            setattr(repo, key, value)
        repo.updated_at = datetime.now(timezone.utc)


def _repo_to_response(repo: RepositoryRecord) -> "RepositoryResponse":
    return RepositoryResponse(
        id=repo.id,
        name=repo.name,
        serverUrl=repo.server_url,
        scopes=repo.scopes,
        status=repo.status,
        authorizeUrl=repo.authorize_url,
        lastError=repo.last_error,
        securityLint=repo.security_lint,
        providers=repo.providers,
        artifacts=repo.artifacts,
        createdAt=repo.created_at,
        updatedAt=repo.updated_at,
        lastScanJobId=repo.last_scan_job_id,
    )


async def _perform_repository_oauth(
    repo: RepositoryRecord,
    auth_state: RepositoryAuthState,
) -> Dict[str, str] | None:
    if auth_state.storage_dir is None:
        auth_state.storage_dir = _job_storage_dir(repo.server_url)

    oauth_cache = auth_state.storage_dir / "oauth"
    oauth_cache.mkdir(parents=True, exist_ok=True)

    auth = FastMCPOAuth(
        mcp_url=repo.server_url,
        scopes=repo.scopes,
        client_name="mcptesting-backend",
        token_storage_cache_dir=oauth_cache,
        callback_port=None,
    )

    callback_url = f"{OAUTH_CALLBACK_BASE_URL}/api/oauth/callback/{repo.id}"
    auth.redirect_port = None
    auth.context.client_metadata.redirect_uris = [callback_url]  # type: ignore[assignment]

    async def redirect_handler(url: str) -> None:
        auth_state.authorize_url = url
        auth_state.authorize_event.set()
        await _update_repo(repo.id, status="awaiting_user", authorize_url=url)

    async def callback_handler() -> tuple[str, str | None]:
        loop = asyncio.get_running_loop()
        auth_state.code_future = loop.create_future()
        return await auth_state.code_future

    auth.redirect_handler = redirect_handler  # type: ignore[assignment]
    auth.callback_handler = callback_handler  # type: ignore[assignment]
    auth_state.auth = auth

    await auth._initialize()

    tokens = getattr(auth.context, "current_tokens", None)
    if tokens and tokens.access_token:
        auth_state.authorize_event.set()
        await _update_repo(repo.id, status="scanning", authorize_url=None)
        return {"Authorization": f"Bearer {tokens.access_token}"}

    headers: Dict[str, str] = {}
    try:
        async with httpx.AsyncClient(auth=auth, timeout=90.0) as client:
            await client.get(repo.server_url, headers=headers)
    except Exception as exc:  # noqa: BLE001
        auth_state.authorize_event.set()
        await _update_repo(repo.id, status="error", last_error=str(exc))
        return None

    tokens = getattr(auth.context, "current_tokens", None)
    if tokens and tokens.access_token:
        await _update_repo(repo.id, status="scanning", authorize_url=None)
        auth_state.authorize_event.set()
        return {"Authorization": f"Bearer {tokens.access_token}"}

    auth_state.authorize_event.set()
    await _update_repo(repo.id, status="error", last_error="OAuth flow did not return token")
    return None


async def _run_repository_flow(repo_id: str) -> None:
    async with repositories_lock:
        repo = repositories.get(repo_id)
    if repo is None:
        return

    storage_dir = _job_storage_dir(repo.server_url)
    auth_state = repo.auth_state or RepositoryAuthState()
    if auth_state.storage_dir is None:
        auth_state.storage_dir = storage_dir
    repo.auth_state = auth_state

    try:
        await _update_repo(repo_id, status="authorizing", last_error=None, authorize_url=None)
        headers = await _perform_repository_oauth(repo, auth_state)
        if not headers:
            return

        request = ScanRequest(
            server_url=repo.server_url,
            headers=headers,
            include=ScanInclude(mcpScan=True, mcpValidator=True),
            timeout_seconds=SCAN_TIMEOUT_SECONDS,
            oauth_scopes=repo.scopes,
        )

        job_id = uuid.uuid4().hex
        job = ScanJob(job_id=job_id, request=request)

        async with jobs_lock:
            jobs[job_id] = job

        try:
            await _run_scan_job(job_id)
        finally:
            async with jobs_lock:
                jobs.pop(job_id, None)

        if job.status == "succeeded" and job.result:
            artifacts_copy = dict(job.artifacts)
            await _update_repo(
                repo_id,
                status="ready",
                security_lint=job.result.get("securityLint"),
                providers=job.result.get("providers"),
                artifacts=artifacts_copy,
                last_error=None,
                last_scan_job_id=job_id,
            )
        else:
            await _update_repo(
                repo_id,
                status="error",
                last_error=job.error or "Scan failed",
            )
    except Exception as exc:  # noqa: BLE001
        logger.exception("Repository flow failed for %s", repo_id)
        await _update_repo(repo_id, status="error", last_error=str(exc))


def _job_storage_dir(server_url: str) -> Path:
    digest = sha256(server_url.encode("utf-8")).hexdigest()[:16]
    path = MCP_SCAN_STORAGE_ROOT / digest
    path.mkdir(parents=True, exist_ok=True)
    return path


def _write_temp_config(
    temp_dir: Path,
    server_url: str,
    headers: Dict[str, str],
    protocol_version: str | None,
) -> Path:
    config = {
        "mcp": {
            "servers": {
                "target": {
                    "type": "http",
                    "url": server_url,
                    "headers": headers,
                }
            }
        }
    }

    if protocol_version:
        config["mcp"]["servers"]["target"]["headers"][
            "MCP-Protocol-Version"
        ] = protocol_version

    config_path = temp_dir / "config.json"
    config_path.write_text(json.dumps(config, indent=2), encoding="utf-8")
    return config_path


def _flatten_signature(signature: Dict[str, Any]) -> List[Tuple[str, Dict[str, Any]]]:
    entities: List[Tuple[str, Dict[str, Any]]] = []
    kind_map = {
        "prompts": "prompt",
        "resources": "resource",
        "resource_templates": "resource_template",
        "tools": "tool",
    }
    for kind, singular in kind_map.items():
        for entity in signature.get(kind, []) or []:
            entities.append((singular, entity))
    return entities


def _entity_from_reference(
    servers: List[Dict[str, Any]], reference: Optional[Iterable[int]]
) -> Optional[Dict[str, Any]]:
    if reference is None:
        return None

    server_idx, entity_idx = reference
    try:
        signature = servers[server_idx]["signature"]
    except (IndexError, KeyError, TypeError):
        return None

    flattened = _flatten_signature(signature)
    if 0 <= entity_idx < len(flattened):
        kind, entity = flattened[entity_idx]
        return {"kind": kind, "data": entity}
    return None


CHECK_RUBRIC: Dict[str, Dict[str, Any]] = {
    "W001": {
        "name": "Prompt injection heuristics",
        "category": "supply_chain",
        "severity": "high",
        "weight": 6,
    },
    "W003": {
        "name": "Entity integrity drift",
        "category": "supply_chain",
        "severity": "medium",
        "weight": 3,
    },
    "TF001": {
        "name": "Toxic flow (untrusted ↔ critical)",
        "category": "flow",
        "severity": "high",
        "weight": 6,
    },
    "TF002": {
        "name": "Destructive toxic flow",
        "category": "flow",
        "severity": "critical",
        "weight": 10,
    },
    "X001": {
        "name": "Scanner analysis unavailable",
        "category": "protocol",
        "severity": "medium",
        "weight": 3,
    },
    "X002": {
        "name": "Whitelisted entity",
        "category": "tools",
        "severity": "low",
        "weight": 1,
    },
}


DEFAULT_WEIGHT_BY_SEVERITY = {
    "critical": 10,
    "high": 6,
    "medium": 3,
    "low": 1,
}


VALIDATOR_CHECK_SPECS: Dict[str, Dict[str, Any]] = {
    "VAL-HTTP-OAUTH": {
        "name": "OAuth flow handling",
        "category": "authz",
        "severity": "critical",
    },
    "VAL-HTTP-WWW": {
        "name": "WWW-Authenticate header compliance",
        "category": "transport",
        "severity": "medium",
    },
    "VAL-HTTP-OPTIONS": {
        "name": "OPTIONS / CORS behaviour",
        "category": "transport",
        "severity": "low",
    },
    "VAL-HTTP-INIT": {
        "name": "Initialization handshake",
        "category": "protocol",
        "severity": "critical",
    },
    "VAL-HTTP-TOOLS": {
        "name": "Tools listing",
        "category": "tools",
        "severity": "high",
    },
    "VAL-HTTP-ASYNC": {
        "name": "Async tools support",
        "category": "runtime",
        "severity": "medium",
    },
    "VAL-HTTP-AVAILABLE": {
        "name": "Tool invocation success",
        "category": "tools",
        "severity": "medium",
    },
    "VAL-HTTP-STRUCTURED": {
        "name": "Structured tool output",
        "category": "protocol",
        "severity": "medium",
    },
    "VAL-HTTP-BATCH": {
        "name": "Batch request rejection",
        "category": "protocol",
        "severity": "medium",
    },
    "VAL-HTTP-ELICIT": {
        "name": "Elicitation support",
        "category": "protocol",
        "severity": "low",
    },
    "VAL-HTTP-STATUS": {
        "name": "HTTP status handling",
        "category": "transport",
        "severity": "medium",
    },
    "VAL-HTTP-HEADERS": {
        "name": "Required headers",
        "category": "transport",
        "severity": "medium",
    },
    "VAL-HTTP-PROTOCOL": {
        "name": "Protocol negotiation",
        "category": "protocol",
        "severity": "medium",
    },
}


def _score_from_checks(checks: Dict[str, Dict[str, Any]]) -> Tuple[float, int, int, List[str]]:
    total_weight = 0
    earned_weight = 0
    passed = 0
    critical_failures: List[str] = []

    for check_id, check in checks.items():
        weight = check.get("weight", 0)
        total_weight += weight
        if check.get("satisfied", False):
            earned_weight += weight
            passed += 1
        else:
            if check.get("severity") == "critical":
                critical_failures.append(check_id)

    score = (earned_weight / total_weight * 100) if total_weight else 100.0
    return round(score, 1), len(checks), passed, critical_failures


def _build_scan_issue_evidence(
    code: str,
    issue: Dict[str, Any],
    servers: List[Dict[str, Any]],
) -> Dict[str, Any]:
    entity_info = _entity_from_reference(servers, issue.get("reference"))
    entity = None
    snippet = None
    if entity_info:
        entity = {
            "kind": entity_info["kind"],
            "name": entity_info["data"].get("name", "unknown"),
        }
        snippet = entity_info["data"].get("description")

    matches: List[str] = []
    extra = issue.get("extra_data") or {}
    for key in ("matches", "phrases", "keywords"):
        value = extra.get(key)
        if isinstance(value, list):
            matches.extend(str(item) for item in value)

    evidence: Dict[str, Any] = {
        "type": "scanIssue",
        "code": code,
        "entity": entity or {"kind": "unknown", "name": "unknown"},
        "raw": issue,
    }
    if snippet:
        evidence["snippet"] = snippet
    if matches:
        evidence["matches"] = matches
    return evidence


def _build_toxic_flow_evidence(
    code: str,
    issue: Dict[str, Any],
    servers: List[Dict[str, Any]],
) -> Dict[str, Any]:
    nodes: List[str] = []
    edges: List[Tuple[str, str]] = []
    extra = issue.get("extra_data") or {}

    def _names_from_refs(refs: List[Dict[str, Any]]) -> List[str]:
        names: List[str] = []
        for ref in refs:
            reference = ref.get("reference")
            entity_info = _entity_from_reference(servers, reference)
            if entity_info:
                names.append(entity_info["data"].get("name", "unknown"))
        return names

    untrusted_refs = extra.get("untrusted_content_tool") or []
    destructive_refs = extra.get("destructive_tool") or []
    nodes.extend(_names_from_refs(untrusted_refs))
    nodes.extend(_names_from_refs(destructive_refs))

    if nodes:
        for destructive in _names_from_refs(destructive_refs) or nodes:
            for untrusted in _names_from_refs(untrusted_refs) or nodes:
                edges.append((untrusted, destructive))

    return {
        "type": "toxicFlow",
        "flowId": f"{code}-{issue.get('reference')}",
        "kind": code,
        "nodes": list(dict.fromkeys(nodes)),
        "edges": edges,
        "detected": True,
        "topExample": issue.get("message"),
        "raw": issue,
    }


def _build_check_entry(
    code: str,
    occurrences: List[Dict[str, Any]],
    servers: List[Dict[str, Any]],
) -> Dict[str, Any]:
    meta = CHECK_RUBRIC.get(code, {
        "name": f"MCP Scan issue {code}",
        "category": "supply_chain",
        "severity": "medium",
        "weight": DEFAULT_WEIGHT_BY_SEVERITY["medium"],
    })

    satisfied = len(occurrences) == 0
    evidence: Dict[str, Any]

    if satisfied:
        evidence = {
            "type": "scanReport",
            "issue": code,
            "summary": {"occurrences": 0},
        }
    else:
        exemplar = occurrences[0]
        if code.startswith("TF"):
            evidence = _build_toxic_flow_evidence(code, exemplar, servers)
        else:
            evidence = _build_scan_issue_evidence(code, exemplar, servers)

    weight = meta.get("weight") or DEFAULT_WEIGHT_BY_SEVERITY.get(meta.get("severity", "medium"), 3)

    return {
        "id": f"SCAN-{code}",
        "name": meta["name"],
        "source": "mcp-scan",
        "category": meta["category"],
        "severity": meta["severity"],
        "weight": weight,
        "satisfied": satisfied,
        "scoreContribution": weight if satisfied else 0,
        "evidence": evidence,
        "raw": occurrences if occurrences else None,
    }


def _viz_dataset_from_checks(checks: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
    dataset = []
    for check in checks.values():
        dataset.append(
            {
                "id": check["id"],
                "label": check["name"],
                "category": check["category"],
                "severity": check["severity"],
                "weight": check["weight"],
                "satisfied": check["satisfied"],
                "scoreContribution": check["scoreContribution"],
                "provider": check.get("source", "mcp-scan"),
            }
        )
    return dataset


def _viz_by_category(checks: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
    buckets: Dict[str, Dict[str, float]] = defaultdict(lambda: {"earned": 0.0, "max": 0.0})
    for check in checks.values():
        buckets[check["category"]]["max"] += check["weight"]
        if check["satisfied"]:
            buckets[check["category"]]["earned"] += check["weight"]

    output = []
    for category, payload in buckets.items():
        max_weight = payload["max"] or 1
        percent = payload["earned"] / max_weight * 100
        output.append(
            {
                "category": category,
                "earned": round(payload["earned"], 1),
                "max": round(payload["max"], 1),
                "percent": round(percent, 1),
            }
        )
    return output


def _normalise_scan_output(
    raw: Dict[str, Any],
    job: ScanJob,
    stdout_path: Path,
) -> Dict[str, Any]:
    if not raw:
        raise ValueError("Empty scan output")

    path, payload = next(iter(raw.items()))
    issues: List[Dict[str, Any]] = payload.get("issues", [])
    servers: List[Dict[str, Any]] = payload.get("servers", [])

    issue_map: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for issue in issues:
        code = issue.get("code", "UNKNOWN")
        issue_map[code].append(issue)

    all_codes = set(issue_map.keys()) | set(CHECK_RUBRIC.keys())
    checks: Dict[str, Dict[str, Any]] = {}
    for code in sorted(all_codes):
        checks[f"SCAN-{code}"] = _build_check_entry(code, issue_map.get(code, []), servers)

    total_tools = sum(len(server.get("signature", {}).get("tools", []) or []) for server in servers)

    summary_check = {
        "id": "SCAN-SUMMARY",
        "name": "MCP Scan summary",
        "source": "mcp-scan",
        "category": "tools",
        "severity": "low",
        "weight": 0,
        "satisfied": True,
        "scoreContribution": 0,
        "evidence": {
            "type": "scanReport",
            "issue": "SUMMARY",
            "summary": {
                "configPath": path,
                "issuesFound": len(issues),
                "toolsAnalyzed": total_tools,
                "serverUrl": job.request.server_url,
            },
            "reportPath": str(stdout_path),
        },
    }

    checks[summary_check["id"]] = summary_check

    score, total_checks, passed_checks, critical_failures = _score_from_checks(checks)

    providers = {
        "mcpScan": {
            "version": os.environ.get("MCP_SCAN_VERSION", "external"),
            "mode": ["scan"],
            "runId": job.job_id,
        }
    }

    security_lint = {
        "score": score,
        "totalChecks": total_checks,
        "passedChecks": passed_checks,
        "criticalFailures": critical_failures,
        "providers": providers,
        "scoring": {
            "weights": DEFAULT_WEIGHT_BY_SEVERITY,
            "capOnCriticalFailure": 0,
        },
        "checks": checks,
        "vizDataset": _viz_dataset_from_checks(checks),
        "vizByCategory": _viz_by_category(checks),
    }

    return {
        "providers": providers,
        "securityLint": security_lint,
        "rawArtifacts": job.artifacts,
    }


def _validator_check_entry(
    check_id: str,
    passed: bool,
    message: str,
    log_path: Path,
) -> Dict[str, Any]:
    meta = VALIDATOR_CHECK_SPECS.get(
        check_id,
        {
            "name": check_id,
            "category": "protocol",
            "severity": "medium",
        },
    )

    severity = meta.get("severity", "medium")
    weight = meta.get("weight") or DEFAULT_WEIGHT_BY_SEVERITY.get(severity, 3)

    evidence = {
        "type": "validatorAssertion",
        "testId": check_id,
        "details": {
            "message": message,
        },
        "logRef": str(log_path),
    }

    return {
        "id": check_id,
        "name": meta.get("name", check_id),
        "source": "mcp-validator",
        "category": meta.get("category", "protocol"),
        "severity": severity,
        "weight": weight,
        "satisfied": passed,
        "scoreContribution": weight if passed else 0,
        "evidence": evidence,
        "raw": {
            "message": message,
        },
    }


def _run_mcp_validator_component(
    job: ScanJob,
    storage_dir: Path,
) -> Dict[str, Any]:
    if not MCP_VALIDATOR_ROOT.exists():
        raise RuntimeError("mcp-validator project directory not found")

    try:
        from mcp_testing.http.tester import MCPHttpTester  # type: ignore
    except ModuleNotFoundError as exc:  # pragma: no cover - guarded by existence check
        raise RuntimeError("mcp-validator package is unavailable") from exc

    log_buffer = io.StringIO()
    tester = MCPHttpTester(job.request.server_url, debug=False)

    if job.request.protocol_version:
        tester.protocol_version = job.request.protocol_version

    if job.request.headers:
        tester.request_session.headers.update(job.request.headers)

    check_results: List[Tuple[str, bool, str]] = []

    def _record(check_id: str, result: bool, note: str) -> None:
        check_results.append((check_id, result, note))

    with redirect_stdout(log_buffer):
        try:
            oauth = tester.test_oauth_flow()
        except Exception as exc:  # noqa: BLE001
            oauth = False
            note = f"Exception: {exc}"
        else:
            note = "OAuth flow validated" if oauth else "OAuth flow failed"
        _record("VAL-HTTP-OAUTH", oauth, note)

        try:
            www = tester.test_www_authenticate_flexibility()
        except Exception as exc:  # noqa: BLE001
            www = False
            note = f"Exception: {exc}"
        else:
            note = "WWW-Authenticate handling OK" if www else "WWW-Authenticate check failed"
        _record("VAL-HTTP-WWW", www, note)

        try:
            options_ok = tester.options_request()
        except Exception as exc:  # noqa: BLE001
            options_ok = False
            note = f"Exception: {exc}"
        else:
            note = "OPTIONS handled" if options_ok else "OPTIONS check failed"
        _record("VAL-HTTP-OPTIONS", options_ok, note)

        tester.reset_server()

        try:
            init_ok = tester.initialize()
        except Exception as exc:  # noqa: BLE001
            init_ok = False
            note = f"Exception: {exc}"
        else:
            note = "Initialization succeeded" if init_ok else "Initialization failed"
        _record("VAL-HTTP-INIT", init_ok, note)

        try:
            tools_ok = tester.list_tools() if init_ok else False
        except Exception as exc:  # noqa: BLE001
            tools_ok = False
            note = f"Exception: {exc}"
        else:
            note = "tools/list succeeded" if tools_ok else "tools/list failed"
        _record("VAL-HTTP-TOOLS", tools_ok, note)

        try:
            async_ok = tester.test_async_sleep_tool()
        except Exception as exc:  # noqa: BLE001
            async_ok = False
            note = f"Exception: {exc}"
        else:
            note = "Async tools supported" if async_ok else "Async tools check failed"
        _record("VAL-HTTP-ASYNC", async_ok, note)

        try:
            available_ok = tester.test_available_tools()
        except Exception as exc:  # noqa: BLE001
            available_ok = False
            note = f"Exception: {exc}"
        else:
            note = "Tool invocations succeeded" if available_ok else "Tool invocation failures"
        _record("VAL-HTTP-AVAILABLE", available_ok, note)

        try:
            structured_ok = tester.test_structured_tool_output()
        except Exception as exc:  # noqa: BLE001
            structured_ok = False
            note = f"Exception: {exc}"
        else:
            note = "Structured output compliant" if structured_ok else "Structured output missing"
        _record("VAL-HTTP-STRUCTURED", structured_ok, note)

        try:
            batch_ok = tester.test_batch_request_rejection()
        except Exception as exc:  # noqa: BLE001
            batch_ok = False
            note = f"Exception: {exc}"
        else:
            note = "Batch requests rejected" if batch_ok else "Batch rejection failed"
        _record("VAL-HTTP-BATCH", batch_ok, note)

        try:
            elicitation_ok = tester.test_elicitation_support()
        except Exception as exc:  # noqa: BLE001
            elicitation_ok = False
            note = f"Exception: {exc}"
        else:
            note = "Elicitation supported" if elicitation_ok else "Elicitation not supported"
        _record("VAL-HTTP-ELICIT", elicitation_ok, note)

        try:
            status_ok = tester.test_status_codes()
        except Exception as exc:  # noqa: BLE001
            status_ok = False
            note = f"Exception: {exc}"
        else:
            note = "HTTP status handling OK" if status_ok else "Status code checks failed"
        _record("VAL-HTTP-STATUS", status_ok, note)

        try:
            headers_ok = tester.test_headers()
        except Exception as exc:  # noqa: BLE001
            headers_ok = False
            note = f"Exception: {exc}"
        else:
            note = "Headers validated" if headers_ok else "Header checks failed"
        _record("VAL-HTTP-HEADERS", headers_ok, note)

        try:
            protocol_ok = tester.test_protocol_versions()
        except Exception as exc:  # noqa: BLE001
            protocol_ok = False
            note = f"Exception: {exc}"
        else:
            note = "Protocol negotiation succeeded" if protocol_ok else "Protocol negotiation failed"
        _record("VAL-HTTP-PROTOCOL", protocol_ok, note)

    log_text = log_buffer.getvalue()
    log_path = storage_dir / f"validator_{job.job_id}.log"
    log_path.write_text(log_text, encoding="utf-8")
    job.artifacts["validatorLog"] = str(log_path)

    checks: Dict[str, Dict[str, Any]] = {}
    for check_id, passed, note in check_results:
        checks[check_id] = _validator_check_entry(check_id, passed, note, log_path)

    score, total_checks, passed_checks, critical_failures = _score_from_checks(checks)

    providers = {
        "mcpValidator": {
            "version": os.environ.get("MCP_VALIDATOR_VERSION", "local"),
            "runId": job.job_id,
        }
    }

    security_lint = {
        "score": score,
        "totalChecks": total_checks,
        "passedChecks": passed_checks,
        "criticalFailures": critical_failures,
        "providers": providers,
        "scoring": {
            "weights": DEFAULT_WEIGHT_BY_SEVERITY,
            "capOnCriticalFailure": 0,
        },
        "checks": checks,
        "vizDataset": _viz_dataset_from_checks(checks),
        "vizByCategory": _viz_by_category(checks),
    }

    return {
        "providers": providers,
        "securityLint": security_lint,
        "rawArtifacts": job.artifacts,
    }


def _combine_security_results(components: List[Dict[str, Any]]) -> Dict[str, Any]:
    providers: Dict[str, Any] = {}
    checks: Dict[str, Dict[str, Any]] = {}
    raw_artifacts: Dict[str, str] = {}

    for component in components:
        providers.update(component.get("providers", {}))
        component_lint = component.get("securityLint", {})
        component_checks = component_lint.get("checks", {})
        checks.update(component_checks)
        raw_artifacts.update(component.get("rawArtifacts", {}))

    score, total_checks, passed_checks, critical_failures = _score_from_checks(checks)

    security_lint = {
        "score": score,
        "totalChecks": total_checks,
        "passedChecks": passed_checks,
        "criticalFailures": critical_failures,
        "providers": providers,
        "scoring": {
            "weights": DEFAULT_WEIGHT_BY_SEVERITY,
            "capOnCriticalFailure": 0,
        },
        "checks": checks,
        "vizDataset": _viz_dataset_from_checks(checks),
        "vizByCategory": _viz_by_category(checks),
    }

    return {
        "providers": providers,
        "securityLint": security_lint,
        "rawArtifacts": raw_artifacts,
    }


# ---------------------------------------------------------------------------
# Job execution
# ---------------------------------------------------------------------------


async def _execute_mcp_scan_component(
    job: ScanJob,
    storage_dir: Path,
    timeout: int,
) -> Dict[str, Any]:
    request = job.request
    headers = _normalize_headers(request.headers)
    headers = await _maybe_attach_oauth_headers(job, headers, storage_dir)
    job.request.headers = headers

    with TemporaryDirectory(dir=MCP_SCAN_STORAGE_ROOT, prefix="tmp-") as tmp:
        tmp_path = Path(tmp)
        config_path = _write_temp_config(
            tmp_path,
            request.server_url,
            headers,
            request.protocol_version,
        )

        stdout_path = storage_dir / f"scan_{job.job_id}.json"
        stderr_path = storage_dir / f"scan_{job.job_id}.log"

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

        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=aio_subprocess.PIPE,
            stderr=aio_subprocess.PIPE,
            cwd=str(MCP_SCAN_ROOT),
        )

        stdout_data, stderr_data = await process.communicate()

        stdout_path.write_bytes(stdout_data)
        stderr_path.write_bytes(stderr_data)
        job.artifacts["scanJson"] = str(stdout_path)
        job.artifacts["scanLog"] = str(stderr_path)

        if process.returncode != 0:
            raise RuntimeError(
                f"mcp-scan exited with {process.returncode}: {stderr_data.decode(errors='ignore')}"
            )

        raw_output = json.loads(stdout_data.decode("utf-8"))
        return _normalise_scan_output(raw_output, job, stdout_path)


async def _run_scan_job(job_id: str) -> None:
    async with jobs_lock:
        job = jobs[job_id]
        job.status = "running"
        job.started_at = datetime.now(timezone.utc)

    request = job.request
    include = request.include or ScanInclude()

    storage_dir = _job_storage_dir(request.server_url)
    timeout = request.timeout_seconds or SCAN_TIMEOUT_SECONDS

    component_results: List[Dict[str, Any]] = []

    try:
        if include.mcpScan:
            scan_result = await _execute_mcp_scan_component(job, storage_dir, timeout)
            component_results.append(scan_result)

        if include.mcpValidator:
            validator_result = await asyncio.to_thread(
                _run_mcp_validator_component,
                job,
                storage_dir,
            )
            component_results.append(validator_result)

        if not component_results:
            raise ValueError("At least one scan component must be selected")

        combined = _combine_security_results(component_results)

    except Exception as exc:  # noqa: BLE001
        async with jobs_lock:
            job.status = "error"
            job.finished_at = datetime.now(timezone.utc)
            job.error = str(exc)
        return

    async with jobs_lock:
        job.status = "succeeded"
        job.finished_at = datetime.now(timezone.utc)
        job.result = combined


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


class HealthResponse(BaseModel):
    status: str
    version: str
    service: str


@app.get("/", response_model=HealthResponse)
async def root() -> HealthResponse:
    return HealthResponse(status="healthy", version=get_version(), service="backend")


@app.get("/api/hello")
async def hello(name: str = "World") -> Dict[str, str]:
    return {"message": f"Hello, {name}!"}


@app.post("/api/security/scans", response_model=ScanJobCreated, status_code=202)
async def create_scan_job(payload: ScanRequest) -> ScanJobCreated:
    job_id = uuid.uuid4().hex
    job = ScanJob(job_id=job_id, request=payload)

    async with jobs_lock:
        jobs[job_id] = job

    task = asyncio.create_task(_run_scan_job(job_id))
    active_tasks.add(task)
    task.add_done_callback(active_tasks.discard)

    return ScanJobCreated(job_id=job_id, status=job.status)


@app.get("/api/security/scans/{job_id}", response_model=ScanJobStatus)
async def get_scan_job(job_id: str) -> ScanJobStatus:
    async with jobs_lock:
        job = jobs.get(job_id)
        if job is None:
            raise HTTPException(status_code=404, detail="Job not found")

        return ScanJobStatus(
            job_id=job.job_id,
            status=job.status,
            created_at=job.created_at,
            started_at=job.started_at,
            finished_at=job.finished_at,
            result=job.result,
            error=job.error,
        )


@app.delete("/api/security/scans/{job_id}", status_code=204)
async def delete_scan_job(job_id: str) -> JSONResponse:
    async with jobs_lock:
        job = jobs.pop(job_id, None)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    return JSONResponse(status_code=204, content=None)


@app.post("/api/repos", response_model=RepositoryResponse)
async def create_repository(payload: RepositoryCreateRequest) -> RepositoryResponse:
    repo_id = uuid.uuid4().hex
    now = datetime.now(timezone.utc)
    repo = RepositoryRecord(
        id=repo_id,
        name=payload.name,
        server_url=payload.serverUrl,
        scopes=payload.scopes,
        status="creating",
        created_at=now,
        updated_at=now,
        authorize_url=None,
        last_error=None,
        security_lint=None,
        providers=None,
        artifacts=None,
        auth_state=RepositoryAuthState(),
        last_scan_job_id=None,
    )

    async with repositories_lock:
        repositories[repo_id] = repo

    asyncio.create_task(_run_repository_flow(repo_id))

    auth_state = repo.auth_state
    if auth_state is not None:
        try:
            await asyncio.wait_for(auth_state.authorize_event.wait(), timeout=15.0)
        except asyncio.TimeoutError:
            pass

    async with repositories_lock:
        repo_snapshot = repositories.get(repo_id)

    if repo_snapshot is None:
        raise HTTPException(status_code=404, detail="Repository not found")

    return _repo_to_response(repo_snapshot)


@app.get("/api/repos", response_model=List[RepositoryResponse])
async def list_repositories() -> List[RepositoryResponse]:
    async with repositories_lock:
        return [_repo_to_response(repo) for repo in repositories.values()]


@app.get("/api/repos/{repo_id}", response_model=RepositoryResponse)
async def get_repository(repo_id: str) -> RepositoryResponse:
    async with repositories_lock:
        repo = repositories.get(repo_id)
    if repo is None:
        raise HTTPException(status_code=404, detail="Repository not found")
    return _repo_to_response(repo)


@app.get("/api/oauth/callback/{repo_id}")
async def oauth_callback(
    repo_id: str,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    error_description: str | None = None,
) -> HTMLResponse:
    async with repositories_lock:
        repo = repositories.get(repo_id)
    if repo is None or repo.auth_state is None:
        raise HTTPException(status_code=404, detail="Repository not awaiting authorization")

    auth_state = repo.auth_state

    if error:
        if auth_state.code_future and not auth_state.code_future.done():
            auth_state.code_future.set_exception(RuntimeError(f"{error}: {error_description or ''}"))
        await _update_repo(repo_id, status="error", last_error=f"OAuth error: {error}")
        return HTMLResponse("OAuth error. You can close this window.", status_code=400)

    if not code:
        return HTMLResponse("Missing authorization code.", status_code=400)

    loop = asyncio.get_running_loop()
    if auth_state.code_future is None or auth_state.code_future.done():
        auth_state.code_future = loop.create_future()

    if not auth_state.code_future.done():
        auth_state.code_future.set_result((code, state))

    await _update_repo(repo_id, status="authorizing", authorize_url=None)
    return HTMLResponse("Authentication complete. You can close this window.")
