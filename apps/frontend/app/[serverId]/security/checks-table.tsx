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
import { SecurityLint } from '../../types'
import { DropdownFilter } from './dropdown-filter'
import { EvidenceRenderer } from './evidence-renderer'
import { JsonBlock } from './json-block'

interface ChecksTableProps {
  securityLint: SecurityLint
}

export const ChecksTable: React.FC<ChecksTableProps> = ({
  securityLint,
}) => {
  const [expandedCheck, setExpandedCheck] = useState<string | null>(null)
  const [showRawEvidence, setShowRawEvidence] = useState<Record<string, boolean>>({})
  const [filterSeverity, setFilterSeverity] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterProvider, setFilterProvider] = useState<string>('')

  const toggleExpand = (id: string) => {
    setExpandedCheck(expandedCheck === id ? null : id)
  }

  const toggleRawEvidence = (id: string) => {
    setShowRawEvidence(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
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

  // Use vizDataset if available, otherwise generate from checks
  const checksToDisplay = securityLint.vizDataset || Object.values(securityLint.checks).map(check => ({
    id: check.id,
    label: check.name,
    category: check.category,
    severity: check.severity,
    weight: check.weight,
    satisfied: check.satisfied,
    scoreContribution: check.scoreContribution,
    provider: check.source
  }))

  const filteredChecks = checksToDisplay.filter((check) => {
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
            {filteredChecks.map((check) => {
              const checkDetail = securityLint.checks[check.id]
              return (
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
                  {expandedCheck === check.id && checkDetail && (
                    <tr>
                      <td colSpan={7} className="bg-gray-50 p-4">
                        <div>
                          <h4 className="text-md font-bold uppercase mb-3 border-b-2 border-black pb-2">
                            {checkDetail.name}
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-xs">
                            <div>
                              <span className="text-xs uppercase font-bold block mb-1">
                                Source
                              </span>
                              <span className="font-mono bg-gray-100 px-1">
                                {checkDetail.source}
                              </span>
                            </div>
                            <div>
                              <span className="text-xs uppercase font-bold block mb-1">
                                Category
                              </span>
                              <span className="font-mono bg-gray-100 px-1">
                                {checkDetail.category}
                              </span>
                            </div>
                            <div>
                              <span className="text-xs uppercase font-bold block mb-1">
                                Severity
                              </span>
                              <div className="flex items-center">
                                {getSeverityIcon(checkDetail.severity)}
                                <span className="ml-1 font-mono bg-gray-100 px-1">
                                  {checkDetail.severity}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4">
                            <h5 className="text-sm font-bold uppercase mb-2 border-b-2 border-black pb-1">
                              Evidence
                            </h5>
                            <EvidenceRenderer evidence={checkDetail.evidence} />
                          </div>

                          <div className="mt-4 pt-3 border-t-2 border-gray-300">
                            <button
                              onClick={() => toggleRawEvidence(check.id)}
                              className="px-3 py-1 text-xs bg-white border-2 border-black hover:bg-gray-100 font-mono uppercase"
                            >
                              {showRawEvidence[check.id] ? 'Hide raw evidence' : 'Show raw evidence'}
                            </button>
                            {showRawEvidence[check.id] && (
                              <div className="mt-3">
                                <JsonBlock
                                  data={checkDetail.evidence}
                                  filename={`${check.id}-evidence.json`}
                                />
                                {checkDetail.raw ? (
                                  <details className="mt-3">
                                    <summary className="text-xs font-bold uppercase cursor-pointer">
                                      Original tool blob
                                    </summary>
                                    <div className="mt-2">
                                      <JsonBlock
                                        data={checkDetail.raw}
                                        filename={`${check.id}-raw.json`}
                                      />
                                    </div>
                                  </details>
                                ) : null}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}