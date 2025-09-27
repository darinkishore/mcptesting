/* ===========================
   Server Detail – Overview Tab
   =========================== */

import { ServerMeta, EvaluationRun, Severity } from './core';
import { ToolScoreSummary } from './tool-evaluation';
import { SecurityLint } from './security';

/** Lightweight summaries for the Overview tab */
export interface OverviewKpis {
  overallScore?: number;             // if you compute one
  toolScore: number;
  securityScore: number;
  tasksPassedPct?: number;           // e.g., passedTasks/totalTasks
  checksPassedPct?: number;          // e.g., passedChecks/totalChecks
  avgLatencyMs?: number;
}

export interface OverviewHighlights {
  topFailures?: Array<{ kind: "task" | "security"; id: string; title: string; severity?: Severity }>;
  recentChanges?: Array<{ when: string; what: string; ref?: string }>;
}

/** Data returned for the Overview tab */
export interface ServerOverview {
  server: ServerMeta;
  run: EvaluationRun;
  kpis: OverviewKpis;
  highlights?: OverviewHighlights;
  categories?: Array<{ name: string; earned: number; max: number; percent: number }>; // from both tool & security if you combine
}

/* ===========================
   Server Detail – Full Object
   (used by the three tabs)
   =========================== */

export interface ServerDetail {
  server: ServerMeta;
  run: EvaluationRun;
  toolScore: ToolScoreSummary;
  securityLint: SecurityLint;
  /** Optional precomputed "viz" for the Overview tab */
  overview?: ServerOverview;
}