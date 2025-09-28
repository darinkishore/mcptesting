'use client'

import React, { useEffect, useMemo, useState } from 'react'
import type { Repository } from '@/types/api'
import {
  createRepository,
  fetchRepositories,
  fetchRepository,
} from '@/lib/api'
import { SecurityDashboard } from '../[serverId]/security/security-dashboard'
import type { SecurityLint } from '@/app/types/security'
import type {
  ProvidersMeta,
  ServerMeta,
  EvaluationRun,
  ServerId,
  RunId,
} from '@/app/types'

const POLL_INTERVAL = 5000

interface FormState {
  name: string
  serverUrl: string
  scopes: string
}

const initialForm: FormState = {
  name: '',
  serverUrl: '',
  scopes: 'offline_access',
}

function toServerMeta(repo: Repository): ServerMeta {
  return {
    id: repo.id as ServerId,
    name: repo.name,
    slug: repo.id,
    description: repo.serverUrl,
    repository: repo.serverUrl,
    transports: ['http'],
    lastEvaluated: repo.updatedAt,
  }
}

function toEvaluationRun(repo: Repository): EvaluationRun {
  return {
    id: (repo.lastScanJobId ?? repo.id) as RunId,
    startedAt: repo.createdAt,
    finishedAt: repo.updatedAt,
    providers: repo.providers as ProvidersMeta | undefined,
  }
}

export default function RepositoriesPage() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [repos, setRepos] = useState<Repository[]>([])
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [focusedRepoId, setFocusedRepoId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await fetchRepositories()
        if (!cancelled) {
          setRepos(data)
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err)
        }
      }
    }

    load()
    const id = setInterval(load, POLL_INTERVAL)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  useEffect(() => {
    if (!focusedRepoId) {
      return
    }

    const repoId = focusedRepoId
    let active = true

    async function pollRepo(id: string) {
      try {
        const data = await fetchRepository(id)
        if (active) {
          setRepos(prev => {
            const map = new Map(prev.map(r => [r.id, r]))
            map.set(data.id, data)
            return Array.from(map.values())
          })

          if (data.status === 'ready' || data.status === 'error') {
            return
          }
        }
      } catch (err) {
        if (active) {
          console.error(err)
        }
      }
      if (active) {
        setTimeout(() => pollRepo(id), POLL_INTERVAL)
      }
    }

    pollRepo(repoId)
    return () => {
      active = false
    }
  }, [focusedRepoId])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setCreating(true)
    setError(null)
    try {
      const payload = {
        name: form.name.trim() || form.serverUrl.trim(),
        serverUrl: form.serverUrl.trim(),
        scopes: form.scopes.trim() || undefined,
      }
      const repo = await createRepository(payload)
      setRepos(prev => [...prev.filter(r => r.id !== repo.id), repo])
      setFocusedRepoId(repo.id)
      if (repo.authorizeUrl) {
        window.open(repo.authorizeUrl, '_blank', 'noopener,noreferrer')
      }
      setForm(initialForm)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create repository'
      console.error(err)
      setError(message)
    } finally {
      setCreating(false)
    }
  }

  const orderedRepos = useMemo(() => {
    return [...repos].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [repos])

  return (
    <div className="min-h-screen space-y-6">
      <section className="neo-component p-4">
        <h1 className="text-xl font-bold uppercase mb-3">Add Repository</h1>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex flex-col">
            <label className="text-xs font-bold uppercase mb-1">Name</label>
            <input
              className="neo-input"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Friendly label"
            />
          </div>
          <div className="flex flex-col md:col-span-2">
            <label className="text-xs font-bold uppercase mb-1">MCP Server URL</label>
            <input
              required
              className="neo-input"
              value={form.serverUrl}
              onChange={e => setForm(prev => ({ ...prev, serverUrl: e.target.value }))}
              placeholder="https://example.com/mcp"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-bold uppercase mb-1">OAuth Scopes</label>
            <input
              className="neo-input"
              value={form.scopes}
              onChange={e => setForm(prev => ({ ...prev, scopes: e.target.value }))}
              placeholder="offline_access"
            />
          </div>
          <div className="md:col-span-2 flex items-end space-x-3">
            <button
              type="submit"
              className="neo-button"
              disabled={creating}
            >
              {creating ? 'Preparing…' : 'Create & Connect'}
            </button>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
        </form>
      </section>

      <section className="space-y-4">
        {orderedRepos.length === 0 ? (
          <div className="neo-component p-4">
            <p className="text-sm">No repositories yet. Add one above to kick off a security scan.</p>
          </div>
        ) : (
          orderedRepos.map(repo => {
            const lint = repo.securityLint as SecurityLint | undefined
            return (
              <div key={repo.id} className="neo-component p-4 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-bold uppercase">{repo.name}</h2>
                    <p className="text-xs text-gray-600 break-all">{repo.serverUrl}</p>
                  </div>
                  <div className="mt-2 md:mt-0 text-xs uppercase font-bold">
                    Status: <span>{repo.status}</span>
                    {repo.status === 'error' && repo.lastError ? (
                      <span className="text-red-600 ml-2">{repo.lastError}</span>
                    ) : null}
                  </div>
                </div>

                {repo.authorizeUrl && repo.status === 'awaiting_user' ? (
                  <div className="text-sm">
                    <button
                      className="neo-button"
                      type="button"
                      onClick={() => window.open(repo.authorizeUrl ?? '', '_blank', 'noopener,noreferrer')}
                    >
                      Open Authorization Link
                    </button>
                  </div>
                ) : null}

                {repo.status === 'ready' && lint ? (
                  <SecurityDashboard
                    server={toServerMeta(repo)}
                    run={toEvaluationRun(repo)}
                    securityLint={lint}
                  />
                ) : null}
              </div>
            )
          })
        )}
      </section>
    </div>
  )
}
