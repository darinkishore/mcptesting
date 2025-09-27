/* ===========================
   Security Scores (Checks & Evidence)
   =========================== */

import { CheckId, Severity, ProvidersMeta } from './core';

/** Evidence union tailored to mcp-validator + mcp-scan (normalized) */
export type Evidence =
  | {
      type: "httpTrace";
      request: { method: string; path: string; headers?: Record<string, string>; body?: unknown };
      response: { status: number; headers?: Record<string, string>; body?: unknown };
      asserts?: string[];
      raw?: unknown;
    }
  | {
      type: "validatorAssertion";
      testId: string;                // e.g., "http_auth_bearer"
      logRef?: string;               // file path to report
      details?: Record<string, unknown>;
      raw?: unknown;
    }
  | {
      type: "scanIssue";
      code: string;                  // E001/E002/E003/W001/W003/...
      entity: { kind: string; name: string };
      snippet?: string;
      matches?: string[];
      raw?: unknown;
    }
  | {
      type: "integrity";
      entity: { kind: string; name: string };
      hashAlg: "sha256" | string;
      prevHash?: string;
      currHash: string;
      firstSeen?: string;            // ISO
      raw?: unknown;
    }
  | {
      type: "proxyGuardrail";
      rule: "pii" | "secrets" | "moderated" | "links" | string;
      action: "log" | "block";
      count: number;
      spans?: Array<{ start: number; end: number }>;
      sample?: string;               // example snippet with matches
      callId: string;
      server: string;
      tool: string;
      raw?: unknown;
    }
  | {
      type: "toxicFlow";
      flowId: string;
      kind: "TF001" | "TF002" | string;
      nodes: string[];
      edges: Array<[string, string]>;
      detected?: boolean;
      topExample?: string;
      raw?: unknown;
    };

/** One security check (maps to a card in your Security tab) */
export interface SecurityCheck {
  id: CheckId;                       // e.g., "VAL-HTTP-ORIGIN" as a branded id
  name: string;                      // human label
  source: "mcp-validator" | "mcp-scan";
  category: "transport" | "authz" | "protocol" | "tools" | "supply_chain" | "runtime" | "flow";
  severity: Severity;
  weight: number;                    // scoring weight
  satisfied: boolean;
  scoreContribution: number;
  evidence: Evidence;                // normalized evidence
  raw?: unknown;                     // optional original blob
}

/** Aggregated security lint for a server (tab + overview) */
export interface SecurityLint {
  score: number;                     // 0..100 normalized
  totalChecks: number;
  passedChecks: number;
  criticalFailures: string[];        // check ids that failed critically
  providers: ProvidersMeta;          // tool versions/runIds
  scoring: {
    weights: { critical: number; high: number; medium: number; low: number };
    capOnCriticalFailure: number;
  };
  checks: Record<CheckId, SecurityCheck>;

  /** Ready-to-chart convenience datasets (optional) */
  vizDataset?: Array<{
    id: CheckId;
    label: string;
    category: string;
    severity: Severity;
    weight: number;
    satisfied: boolean;
    scoreContribution: number;
    provider: "mcp-validator" | "mcp-scan";
  }>;
  vizByCategory?: Array<{ category: string; earned: number; max: number; percent: number }>;
}