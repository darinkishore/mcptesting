/* ===========================
   MCP Leaderboard – Core Types
   =========================== */

/** Branded IDs for clarity in app code */
export type ServerId = string & { readonly __brand: "ServerId" };
export type TaskId   = string & { readonly __brand: "TaskId" };
export type CheckId  = string & { readonly __brand: "CheckId" };
export type TraceId  = string & { readonly __brand: "TraceId" };
export type RunId    = string & { readonly __brand: "RunId" };

/** Shared enums */
export type Severity = "critical" | "high" | "medium" | "low";
export type Direction = "asc" | "desc";

/** Basic server metadata shown across the app */
export interface ServerMeta {
  id: ServerId;
  name: string;
  slug: string;
  description?: string;
  repository?: string;         // repo URL
  version?: string;            // semver if available
  author?: string;
  tags?: string[];
  transports?: Array<"http" | "stdio">;
  lastEvaluated?: string;      // ISO
}

/** Library versions + run identifiers for reproducibility */
export interface ProvidersMeta {
  mcpValidator?: { version: string; runId: RunId };
  mcpScan?: { version: string; mode: Array<"scan" | "proxy">; runId: RunId };
  toolRunner?: { version?: string; runId?: RunId }; // your own harness if any
}

/** A single evaluation run context (commit, env, dataset) */
export interface EvaluationRun {
  id: RunId;
  startedAt: string;              // ISO
  finishedAt?: string;            // ISO
  specVersion?: string;           // MCP spec/protocol version negotiated
  commitSha?: string;             // server code commit
  datasetId?: string;             // which task dataset
  environment?: {
    node?: string;
    os?: string;
    region?: string;
  };
  providers?: ProvidersMeta;
}