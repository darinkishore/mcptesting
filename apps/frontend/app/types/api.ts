/* ===========================
   API Payloads (optional)
   =========================== */

import { ServerMeta, EvaluationRun } from './core';
import { LeaderboardRow } from './leaderboard';
import { TaskResult } from './tool-evaluation';
import { SecurityCheck } from './security';
import { ServerDetail } from './server-detail';

/** "List servers" response for the main table */
export interface ListServersResponse {
  items: LeaderboardRow[];
  page: number;
  pageSize: number;
  total: number;
}

/** "Get server detail" response (drives tabs) */
export type GetServerDetailResponse = ServerDetail;

/** "Get task detail" response (drilldown on Tool Scores tab) */
export interface GetTaskDetailResponse {
  server: Pick<ServerMeta, "id" | "name" | "slug">;
  run: EvaluationRun;
  task: TaskResult;
}

/** "Get security check detail" response (drilldown on Security tab) */
export interface GetSecurityCheckDetailResponse {
  server: Pick<ServerMeta, "id" | "name" | "slug">;
  run: EvaluationRun;
  check: SecurityCheck;
}