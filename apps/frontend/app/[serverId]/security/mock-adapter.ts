import {
  SecurityLint,
  SecurityCheck,
  CheckId,
  ServerId,
  RunId,
  ProvidersMeta,
  Evidence
} from '../../types'

// Type for the existing mock data structure
interface MockSecurityData {
  servers: Array<{
    id: string;
    name: string;
    version: string;
    securityLint: {
      score: number;
      totalChecks: number;
      passedChecks: number;
      criticalFailures?: string[];
      providers: {
        mcpValidator: { version: string; runId?: string };
        mcpScan: { version: string; mode?: string[]; runId?: string };
      };
      scoring?: {
        weights: { critical: number; high: number; medium: number; low: number };
        capOnCriticalFailure: number;
      };
      checks: Record<string, {
        name: string;
        source: string;
        category: string;
        severity: string;
        weight: number;
        satisfied: boolean;
        scoreContribution: number;
        evidence: {
          type: string;
          [key: string]: unknown;
        };
      }>;
      vizDataset?: Array<{
        id: string;
        label: string;
        category: string;
        severity: string;
        weight: number;
        satisfied: boolean;
        scoreContribution: number;
        provider: string;
      }>;
      vizByCategory?: Array<{ category: string; earned: number; max: number; percent: number }>;
    };
  }>;
  metadata: {
    version?: string;
    generatedAt: string;
    totalServers?: number;
  };
}

/**
 * Hydrate mock security data to use comprehensive types
 * This function transforms mock data structure to match SecurityLint interface
 */
export function hydrateSecurityData(mockData: MockSecurityData): SecurityLint {
  const mockLint = mockData.servers[0].securityLint

  // Transform providers metadata
  const providers: ProvidersMeta = {
    mcpValidator: {
      version: mockLint.providers.mcpValidator.version,
      runId: (mockLint.providers.mcpValidator.runId || 'mock-validator-run') as RunId
    },
    mcpScan: {
      version: mockLint.providers.mcpScan.version,
      mode: (mockLint.providers.mcpScan.mode || ['scan', 'proxy']) as Array<"scan" | "proxy">,
      runId: (mockLint.providers.mcpScan.runId || 'mock-scan-run') as RunId
    }
  }

  // Transform checks - inject id field from map key and ensure proper typing
  const checks: Record<CheckId, SecurityCheck> = Object.fromEntries(
    Object.entries(mockLint.checks).map(([key, check]) => {
      const hydrated: SecurityCheck = {
        id: key as CheckId,
        name: check.name,
        source: check.source as "mcp-validator" | "mcp-scan",
        category: check.category as "transport" | "authz" | "protocol" | "tools" | "supply_chain" | "runtime" | "flow",
        severity: check.severity as "critical" | "high" | "medium" | "low",
        weight: check.weight,
        satisfied: check.satisfied,
        scoreContribution: check.scoreContribution,
        evidence: check.evidence as Evidence, // Evidence union will handle the type discrimination
        raw: undefined // No raw data in mock
      }
      return [key as CheckId, hydrated]
    })
  )

  // Create SecurityLint with comprehensive types
  const securityLint: SecurityLint = {
    score: mockLint.score,
    totalChecks: mockLint.totalChecks,
    passedChecks: mockLint.passedChecks,
    criticalFailures: mockLint.criticalFailures || [],
    providers,
    scoring: mockLint.scoring || {
      weights: { critical: 10, high: 6, medium: 3, low: 1 },
      capOnCriticalFailure: 79.9
    },
    checks,
    vizDataset: mockLint.vizDataset?.map(item => ({
      ...item,
      id: item.id as CheckId,
      severity: item.severity as "critical" | "high" | "medium" | "low",
      provider: item.provider as "mcp-validator" | "mcp-scan"
    })),
    vizByCategory: mockLint.vizByCategory
  }

  return securityLint
}

/**
 * Transform mock server data to ServerMeta format
 */
export function hydrateServerMeta(mockData: MockSecurityData) {
  const mockServer = mockData.servers[0]
  return {
    id: mockServer.id as ServerId,
    name: mockServer.name,
    slug: mockServer.id.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    version: mockServer.version,
    description: `${mockServer.name} security assessment`,
    // Add other ServerMeta fields as needed
  }
}

/**
 * Transform mock data to EvaluationRun format
 */
export function hydrateEvaluationRun(mockData: MockSecurityData) {
  return {
    id: 'mock-evaluation-run' as RunId,
    startedAt: mockData.metadata.generatedAt,
    finishedAt: mockData.metadata.generatedAt,
    specVersion: '1.0.0',
    providers: {
      mcpValidator: {
        version: mockData.servers[0].securityLint.providers.mcpValidator.version,
        runId: 'mock-validator-run' as RunId
      },
      mcpScan: {
        version: mockData.servers[0].securityLint.providers.mcpScan.version,
        mode: ['scan', 'proxy'] as Array<"scan" | "proxy">,
        runId: 'mock-scan-run' as RunId
      }
    }
  }
}