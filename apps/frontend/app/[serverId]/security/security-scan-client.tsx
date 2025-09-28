'use client'

import React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { SecurityDashboard } from './security-dashboard'
import type {
  EvaluationRun,
  RunId,
  SecurityLint,
  ServerId,
  ServerMeta
} from '../../types'
import {
  createSecurityScanJob,
  fetchSecurityScanJob
} from '@/lib/api'
import type {
  ScanJobStatusValue,
  SecurityScanJobStatus,
  SecurityScanRequest
} from '@/types/api'
import type { SecurityServerConfig } from './server-registry'

const POLL_INTERVAL_MS = 2_000
const MAX_WAIT_MS = 2 * 60 * 1_000 // 2 minutes

interface SecurityScanClientProps {
  serverId: string
  config: SecurityServerConfig
}

type UiStatus = ScanJobStatusValue | 'creating'

export function SecurityScanClient({ serverId, config }: SecurityScanClientProps) {
  const [jobStatus, setJobStatus] = useState<SecurityScanJobStatus | null>(null)
  const [status, setStatus] = useState<UiStatus>('creating')
  const [securityLint, setSecurityLint] = useState<SecurityLint | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null

    async function runScan() {
      try {
        setStatus('creating')
        setError(null)
        setSecurityLint(null)
        setJobStatus(null)

        const payload: SecurityScanRequest = {
          serverUrl: config.url,
          headers: Object.keys(config.headers ?? {}).length ? config.headers : undefined,
          protocolVersion: config.protocolVersion,
          include: {
            mcpScan: true,
            mcpValidator: true,
          },
        }

        const created = await createSecurityScanJob(payload)
        if (cancelled) {
          return
        }

        const { jobId } = created
        const startedAt = Date.now()

        async function poll() {
          try {
            const statusResponse = await fetchSecurityScanJob(jobId)
            if (cancelled) {
              return
            }
            setJobStatus(statusResponse)
            setStatus(statusResponse.status as UiStatus)

            if (statusResponse.status === 'succeeded' && statusResponse.result) {
              setSecurityLint(statusResponse.result.securityLint)
              return
            }

            if (statusResponse.status === 'error') {
              setError(statusResponse.error ?? 'Security scan failed')
              return
            }

            if (Date.now() - startedAt > MAX_WAIT_MS) {
              setError('Security scan timed out. Please try again.')
              setStatus('error')
              return
            }

            timeoutHandle = setTimeout(poll, POLL_INTERVAL_MS)
          } catch (pollError) {
            if (cancelled) {
              return
            }
            setError(pollError instanceof Error ? pollError.message : 'Unknown error during polling')
            setStatus('error')
          }
        }

        setStatus('running')
        poll()
      } catch (err) {
        if (cancelled) {
          return
        }
        setError(err instanceof Error ? err.message : 'Failed to start security scan')
        setStatus('error')
      }
    }

    runScan()

    return () => {
      cancelled = true
      if (timeoutHandle) {
        clearTimeout(timeoutHandle)
      }
    }
  }, [serverId, config])

  const providers = securityLint?.providers

  const evaluationRun: EvaluationRun | null = useMemo(() => {
    if (!jobStatus || !providers) {
      return null
    }
    const runId =
      (providers.mcpScan?.runId ??
        providers.mcpValidator?.runId ??
        (`scan-${jobStatus.jobId}` as RunId))

    return {
      id: runId,
      startedAt: jobStatus.startedAt ?? jobStatus.createdAt,
      finishedAt: jobStatus.finishedAt ?? undefined,
      providers,
    }
  }, [jobStatus, providers])

  const serverMeta: ServerMeta | null = useMemo(() => {
    if (!jobStatus) {
      return null
    }

    return {
      id: serverId as ServerId,
      name: config.name,
      slug: serverId,
      description: config.description,
      repository: config.repository,
      transports: ['http'],
      lastEvaluated: jobStatus.finishedAt ?? jobStatus.startedAt ?? jobStatus.createdAt,
    }
  }, [config, jobStatus, serverId])

  if (error) {
    return (
      <div className="neo-component p-4">
        <h2 className="font-bold uppercase text-lg mb-2">Security Scan</h2>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    )
  }

  if (!securityLint || !serverMeta || !evaluationRun) {
    return (
      <div className="neo-component p-4">
        <h2 className="font-bold uppercase text-lg mb-2">Security Scan</h2>
        <p className="text-sm">
          {status === 'creating' && 'Preparing security analysis…'}
          {status === 'running' && 'Running MCP scan & validator checks…'}
          {status === 'pending' && 'Waiting for scan to start…'}
        </p>
      </div>
    )
  }

  return (
    <SecurityDashboard
      server={serverMeta}
      run={evaluationRun}
      securityLint={securityLint}
    />
  )
}
