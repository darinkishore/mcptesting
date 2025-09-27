'use client'

import React from 'react'
import { SecurityLint, ServerMeta, EvaluationRun } from '../../types'
import { ScoreDisplay } from './score-display'
import { CategoryBreakdown } from './category-breakdown'
import { ChecksTable } from './checks-table'

interface SecurityDashboardProps {
  server: ServerMeta
  run: EvaluationRun
  securityLint: SecurityLint
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({
  server,
  run,
  securityLint,
}) => {
  return (
    <div className="container mx-auto px-4 py-4 max-w-7xl neo-grid">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3">
        <div>
          <h1 className="text-2xl font-bold">
            {server.name} SECURITY ASSESSMENT
          </h1>
          <p className="uppercase text-xs">
            VERSION {server.version} • LAST SCAN:{" "}
            {new Date(run.finishedAt || run.startedAt)
              .toISOString()
              .replace("T", " ")
              .slice(0, 19)}
          </p>
        </div>
        <div className="mt-2 md:mt-0 flex space-x-2">
          {securityLint.providers.mcpValidator && (
            <div className="text-xs bg-black text-white px-2 py-1">
              MCP VALIDATOR {securityLint.providers.mcpValidator.version}
            </div>
          )}
          {securityLint.providers.mcpScan && (
            <div className="text-xs bg-black text-white px-2 py-1">
              MCP SCAN {securityLint.providers.mcpScan.version}
            </div>
          )}
        </div>
      </div>

      <ScoreDisplay
        score={securityLint.score}
        passedChecks={securityLint.passedChecks}
        totalChecks={securityLint.totalChecks}
      />

      {securityLint.vizByCategory && (
        <CategoryBreakdown categories={securityLint.vizByCategory} />
      )}

      <ChecksTable securityLint={securityLint} />
    </div>
  );
}