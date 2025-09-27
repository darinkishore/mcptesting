/* ===========================
   Leaderboard (Main Table)
   =========================== */

import { ServerMeta, Direction } from './core';

/** One row in the main leaderboard table */
export interface LeaderboardRow {
  server: Pick<ServerMeta, "id" | "name" | "slug" | "version" | "author">;
  overallScore: number;            // (optional aggregate you define)
  toolScore: number;               // from ToolScoreSummary.score
  securityScore: number;           // from SecurityLint.score
  lastEvaluated?: string;          // ISO
  rank?: number;
}

/** Sorting & filtering for the leaderboard screen */
export type LeaderboardSortKey = "overallScore" | "toolScore" | "securityScore" | "name" | "version";

export interface LeaderboardQuery {
  q?: string;                      // free text filter
  tags?: string[];
  minScore?: number;
  sortBy?: LeaderboardSortKey;
  direction?: Direction;
  page?: number;
  pageSize?: number;
}

/* ===========================
   View-Model Helpers (UI-only)
   =========================== */

/** Table-ready row that includes denormalized labels */
export interface LeaderboardVMRow extends LeaderboardRow {
  /** Derived styling hints */
  toolBadge?: "good" | "warn" | "bad";
  securityBadge?: "good" | "warn" | "bad";
}

/** Paged table abstraction your UI components can consume */
export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}