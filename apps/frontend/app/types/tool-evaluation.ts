/* ===========================
   Tool Scores (Tasks & Traces)
   =========================== */

import { TaskId, TraceId } from './core';

/** Lightweight description of a task in your catalog */
export interface TaskDefinition {
  id: TaskId;
  name: string;
  category?: string;               // e.g., "search", "retrieval"
  description?: string;
  weight?: number;                 // optional weight in overall tool score
  required?: boolean;
}

/** Top-level issue raised by the task evaluator (not security) */
export type ToolIssueSeverity = "high" | "medium" | "low";

export interface ToolIssue {
  id: string;
  code: string;                    // machine-readable code
  title: string;
  severity: ToolIssueSeverity;
  description?: string;
  location?: string;               // file path, tool name, etc.
  metadata?: Record<string, unknown>;
}

/** Minimal token usage summary */
export interface TokenUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

/** Chat message shape for traces (OpenAI-style but generic) */
export type ChatRole = "system" | "user" | "assistant" | "tool";

export interface ChatMessage {
  role: ChatRole;
  /** Text content only here; attach rich parts via `aux` if needed */
  content: string;
  /** Optional tool/function call metadata on assistant messages */
  toolCalls?: Array<{
    id: string;
    type: "function";
    name: string;
    arguments: string;             // JSON string as sent to the tool
  }>;
  /** Tool result payload when role === "tool" */
  toolResultJson?: unknown;
  /** Additional raw fields from the provider if you want to keep them */
  aux?: Record<string, unknown>;
}

/** One full chat completion trace used to evaluate a task */
export interface ChatCompletionTrace {
  id: TraceId;
  model: string;                   // e.g., "gpt-4o-mini" (or any)
  prompt: ChatMessage[];           // request messages
  response: ChatMessage;           // primary assistant message
  toolLatencyMs?: number;          // time spent in invoked tool(s)
  totalLatencyMs?: number;         // wall time for the call
  usage?: TokenUsage;              // token usage
  success: boolean;                // did this trace satisfy the task?
  expected?: {
    /** Optional expected value for exact/regex/JSON match */
    matcher: "exact" | "substring" | "regex" | "json" | "semantic";
    value: string;                 // canonicalized expected result or pattern
    score?: number;                // for fuzzy/semantic
  };
  diff?: string;                   // optional diff for failures
  attachments?: Array<{ name: string; href: string }>; // links to raw logs/artifacts
  raw?: Record<string, unknown>;   // raw provider response if you store it
}

/** Result for one task (can aggregate multiple traces) */
export interface TaskResult {
  task: TaskDefinition;
  satisfied: boolean;              // overall pass/fail across traces
  successRate: number;             // 0..1
  avgLatencyMs?: number;
  traces: ChatCompletionTrace[];   // you can keep last N for drilldown
  issues?: ToolIssue[];            // evaluator-raised issues
  notes?: string;
}

/** Tool score summary for a server */
export interface ToolScoreSummary {
  score: number;                      // 0..100 normalized
  totalTasks: number;
  passedTasks: number;
  tasks: Record<TaskId, TaskResult>;  // detailed results for task tab
}