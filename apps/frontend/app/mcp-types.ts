// Types for MCP Testing Leaderboard
// Co-located at app level since used across multiple routes

export interface MCPServer {
  id: string;
  name: string;
  description: string;
  repository?: string;
  totalScore: number;
  toolScore: number;
  securityScore: number;
  lastTested: string;
  status: 'passing' | 'failing' | 'pending';
}

export interface ToolTask {
  id: string;
  name: string;
  description: string;
  score: number;
  maxScore: number;
  status: 'passed' | 'failed' | 'skipped';
  executionTime?: number;
  traces?: TaskTrace[];
}

export interface TaskTrace {
  timestamp: string;
  type: 'request' | 'response' | 'error';
  content: unknown;
}

export interface SecurityCheck {
  id: string;
  category: 'auth' | 'validation' | 'isolation' | 'logging';
  name: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'passed' | 'failed' | 'warning';
  evidence?: string;
  recommendation?: string;
}