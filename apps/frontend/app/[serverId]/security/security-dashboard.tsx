'use client'

import React from 'react'
import { ScoreDisplay } from './score-display'
import { CategoryBreakdown } from './category-breakdown'
import { ChecksTable } from './checks-table'

// Type for the mock data structure (will be replaced with proper types from @/types)
interface MockSecurityData {
  servers: Array<{
    id: string;
    name: string;
    version: string;
    securityLint: {
      score: number;
      totalChecks: number;
      passedChecks: number;
      providers: {
        mcpValidator: { version: string };
        mcpScan: { version: string };
      };
      vizByCategory: Array<{ category: string; earned: number; max: number; percent: number }>;
      vizDataset: Array<{
        id: string;
        label: string;
        category: string;
        severity: string;
        weight: number;
        satisfied: boolean;
        scoreContribution: number;
        provider: string;
      }>;
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
    };
  }>;
  metadata: {
    generatedAt: string;
  };
}

interface SecurityDashboardProps {
  data: MockSecurityData
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({
  data,
}) => {
  const server = data.servers[0]
  const securityLint = server.securityLint

  return (
    <div className="container mx-auto px-4 py-4 max-w-7xl neo-grid">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3">
        <div>
          <h1 className="text-2xl font-bold">
            {server.name} SECURITY ASSESSMENT
          </h1>
          <p className="uppercase text-xs">
            VERSION {server.version} • LAST SCAN:{' '}
            {new Date(data.metadata.generatedAt).toISOString().replace('T', ' ').slice(0, 19)}
          </p>
        </div>
        <div className="mt-2 md:mt-0 flex space-x-2">
          <div className="text-xs bg-black text-white px-2 py-1">
            MCP VALIDATOR {securityLint.providers.mcpValidator.version}
          </div>
          <div className="text-xs bg-black text-white px-2 py-1">
            MCP SCAN {securityLint.providers.mcpScan.version}
          </div>
        </div>
      </div>

      <ScoreDisplay
        score={securityLint.score}
        passedChecks={securityLint.passedChecks}
        totalChecks={securityLint.totalChecks}
      />

      <CategoryBreakdown categories={securityLint.vizByCategory} />

      <ChecksTable
        checks={securityLint.vizDataset}
        checkDetails={securityLint.checks}
      />
    </div>
  )
}