'use client'

import React, { useState, Fragment } from 'react'
import {
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react'
import { DropdownFilter } from './dropdown-filter'

interface CheckData {
  id: string
  label: string
  category: string
  severity: string
  weight: number
  satisfied: boolean
  scoreContribution: number
  provider: string
}

interface CheckEvidence {
  type: string
  [key: string]: unknown
}

interface CheckDetail {
  name: string
  source: string
  category: string
  severity: string
  weight: number
  satisfied: boolean
  scoreContribution: number
  evidence: CheckEvidence
}

interface ChecksTableProps {
  checks: CheckData[]
  checkDetails: Record<string, CheckDetail>
}

export const ChecksTable: React.FC<ChecksTableProps> = ({
  checks,
  checkDetails,
}) => {
  const [expandedCheck, setExpandedCheck] = useState<string | null>(null)
  const [filterSeverity, setFilterSeverity] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterProvider, setFilterProvider] = useState<string>('')

  const toggleExpand = (id: string) => {
    setExpandedCheck(expandedCheck === id ? null : id)
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 neo-danger" />
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case 'low':
        return <AlertTriangle className="h-5 w-5 text-blue-500" />
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />
    }
  }

  const getSeverityClass = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-black text-white'
      case 'high':
        return 'bg-black text-orange-500'
      case 'medium':
        return 'bg-black text-amber-500'
      case 'low':
        return 'bg-black text-blue-500'
      default:
        return 'bg-black text-gray-500'
    }
  }

  const filteredChecks = checks.filter((check) => {
    if (
      filterSeverity &&
      check.severity.toLowerCase() !== filterSeverity.toLowerCase()
    )
      return false
    if (filterStatus === 'passed' && !check.satisfied) return false
    if (filterStatus === 'failed' && check.satisfied) return false
    if (filterProvider && check.provider !== filterProvider) return false
    return true
  })

  const renderEvidence = (evidence: CheckEvidence) => {
    return (
      <div className="bg-gray-100 border-2 border-black p-2 mt-2 overflow-x-auto">
        <pre className="text-xs whitespace-pre-wrap font-mono">
          {JSON.stringify(evidence, null, 2)}
        </pre>
      </div>
    )
  }

  return (
    <div className="neo-component p-4 mt-4">
      <h2 className="text-xl font-bold mb-3">SECURITY CHECKS</h2>

      <div className="flex flex-wrap gap-3 mb-3">
        <DropdownFilter
          label="Severity"
          value={filterSeverity}
          onChange={setFilterSeverity}
          options={[
            {
              value: '',
              label: 'ALL SEVERITIES',
            },
            {
              value: 'critical',
              label: 'CRITICAL',
            },
            {
              value: 'high',
              label: 'HIGH',
            },
            {
              value: 'medium',
              label: 'MEDIUM',
            },
            {
              value: 'low',
              label: 'LOW',
            },
          ]}
        />
        <DropdownFilter
          label="Status"
          value={filterStatus}
          onChange={setFilterStatus}
          options={[
            {
              value: '',
              label: 'ALL STATUS',
            },
            {
              value: 'passed',
              label: 'PASSED',
            },
            {
              value: 'failed',
              label: 'FAILED',
            },
          ]}
        />
        <DropdownFilter
          label="Provider"
          value={filterProvider}
          onChange={setFilterProvider}
          options={[
            {
              value: '',
              label: 'ALL PROVIDERS',
            },
            {
              value: 'mcp-validator',
              label: 'MCP VALIDATOR',
            },
            {
              value: 'mcp-scan',
              label: 'MCP SCAN',
            },
          ]}
        />
      </div>

      <div className="overflow-x-auto border-3 border-black">
        <table className="neo-table">
          <thead>
            <tr>
              <th>CHECK</th>
              <th>CATEGORY</th>
              <th>SEVERITY</th>
              <th>STATUS</th>
              <th>PROVIDER</th>
              <th>POINTS</th>
              <th>DETAILS</th>
            </tr>
          </thead>
          <tbody>
            {filteredChecks.map((check) => (
              <Fragment key={check.id}>
                <tr
                  onClick={() => toggleExpand(check.id)}
                  className={`cursor-pointer hover:bg-gray-50 ${expandedCheck === check.id ? 'bg-gray-50' : ''}`}
                >
                  <td>
                    <div className="flex items-center">
                      {check.satisfied ? (
                        <CheckCircle className="h-5 w-5 neo-success mr-1" />
                      ) : (
                        <XCircle className="h-5 w-5 neo-danger mr-1" />
                      )}
                      <span className="font-medium text-xs uppercase">
                        {check.label}
                      </span>
                    </div>
                  </td>
                  <td className="text-xs uppercase">{check.category}</td>
                  <td>
                    <span
                      className={`px-1 inline-flex text-xs leading-5 font-bold ${getSeverityClass(check.severity)}`}
                    >
                      {check.severity.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`px-1 inline-flex text-xs leading-5 font-bold ${check.satisfied ? 'bg-black neo-success' : 'bg-black neo-danger'}`}
                    >
                      {check.satisfied ? 'PASS' : 'FAIL'}
                    </span>
                  </td>
                  <td className="text-xs uppercase">{check.provider}</td>
                  <td>
                    <span className="font-bold text-xs">
                      {check.scoreContribution}
                    </span>
                    <span className="text-xs">/{check.weight}</span>
                  </td>
                  <td className="text-center">
                    {expandedCheck === check.id ? (
                      <ChevronUp className="h-4 w-4 inline-block" />
                    ) : (
                      <ChevronDown className="h-4 w-4 inline-block" />
                    )}
                  </td>
                </tr>
                {expandedCheck === check.id && (
                  <tr>
                    <td colSpan={7} className="bg-gray-100">
                      <div className="p-2">
                        <h4 className="text-md font-bold uppercase mb-2">
                          {checkDetails[check.id].name}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                          <div>
                            <span className="text-xs uppercase block">
                              Source
                            </span>
                            <span className="text-xs">
                              {checkDetails[check.id].source}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs uppercase block">
                              Category
                            </span>
                            <span className="text-xs">
                              {checkDetails[check.id].category}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs uppercase block">
                              Severity
                            </span>
                            <div className="flex items-center">
                              {getSeverityIcon(checkDetails[check.id].severity)}
                              <span className="ml-1 text-xs">
                                {checkDetails[check.id].severity}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <h5 className="text-sm font-bold uppercase mb-1">
                            Evidence
                          </h5>
                          {renderEvidence(checkDetails[check.id].evidence)}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}