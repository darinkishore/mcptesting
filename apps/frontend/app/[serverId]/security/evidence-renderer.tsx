'use client'

import React from 'react'
import { Evidence } from '../../types'
import { JsonBlock } from './json-block'

interface EvidenceRendererProps {
  evidence: Evidence
}

export function EvidenceRenderer({ evidence }: EvidenceRendererProps) {
  switch (evidence.type) {
    case 'httpTrace': {
      const { request, response, asserts } = evidence
      return (
        <div className="space-y-4">
          <section>
            <h4 className="text-sm font-bold uppercase mb-2 border-b-2 border-black pb-1">
              HTTP Request
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="font-bold uppercase">Method:</span>
                <span className="ml-2 font-mono">{request.method}</span>
              </div>
              <div>
                <span className="font-bold uppercase">Path:</span>
                <span className="ml-2 font-mono bg-gray-100 px-1">{request.path}</span>
              </div>
            </div>
            {request.headers ? (
              <details className="mt-2">
                <summary className="text-xs font-bold uppercase cursor-pointer">Headers</summary>
                <div className="mt-2">
                  <JsonBlock data={request.headers} filename="request-headers.json" />
                </div>
              </details>
            ) : null}
            {request.body ? (
              <details className="mt-2">
                <summary className="text-xs font-bold uppercase cursor-pointer">Body</summary>
                <div className="mt-2">
                  <JsonBlock data={request.body} filename="request-body.json" />
                </div>
              </details>
            ) : null}
          </section>

          <section>
            <h4 className="text-sm font-bold uppercase mb-2 border-b-2 border-black pb-1">
              HTTP Response
            </h4>
            <div className="text-xs">
              <span className="font-bold uppercase">Status:</span>
              <span className={`ml-2 px-2 py-1 font-mono border-2 border-black ${
                response.status >= 200 && response.status < 300 ? 'neo-success-bg' :
                response.status >= 400 ? 'neo-danger-bg' : 'bg-yellow-200'
              }`}>
                {response.status}
              </span>
            </div>
            {response.headers ? (
              <details className="mt-2">
                <summary className="text-xs font-bold uppercase cursor-pointer">Headers</summary>
                <div className="mt-2">
                  <JsonBlock data={response.headers} filename="response-headers.json" />
                </div>
              </details>
            ) : null}
            {response.body ? (
              <details className="mt-2">
                <summary className="text-xs font-bold uppercase cursor-pointer">Body</summary>
                <div className="mt-2">
                  <JsonBlock data={response.body} filename="response-body.json" />
                </div>
              </details>
            ) : null}
          </section>

          {asserts && asserts.length > 0 ? (
            <section>
              <h4 className="text-sm font-bold uppercase mb-2 border-b-2 border-black pb-1">
                Assertions
              </h4>
              <ul className="list-none space-y-1">
                {asserts.map((assertion, i) => (
                  <li key={i} className="text-xs flex items-start">
                    <span className="mr-2 neo-success">✓</span>
                    {assertion}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )
    }

    case 'validatorAssertion': {
      const { testId, logRef, details } = evidence
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <span className="font-bold uppercase">Test ID:</span>
              <span className="ml-2 font-mono bg-gray-100 px-1">{testId}</span>
            </div>
            {logRef && (
              <div>
                <span className="font-bold uppercase">Report:</span>
                <span className="ml-2 font-mono bg-gray-100 px-1">{logRef}</span>
              </div>
            )}
          </div>
          {details ? (
            <details open>
              <summary className="text-xs font-bold uppercase cursor-pointer mb-2">Details</summary>
              <JsonBlock data={details} filename={`${testId}-details.json`} />
            </details>
          ) : null}
        </div>
      )
    }

    case 'scanReport': {
      const { issue, summary, reportPath } = evidence
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <span className="font-bold uppercase">Issue Code:</span>
              <span className="ml-2 font-mono bg-gray-100 px-1">{issue}</span>
            </div>
            {reportPath && (
              <div>
                <span className="font-bold uppercase">Report:</span>
                <span className="ml-2 font-mono bg-gray-100 px-1">{reportPath}</span>
              </div>
            )}
          </div>
          {summary ? (
            <div>
              <h4 className="text-sm font-bold uppercase mb-2 border-b-2 border-black pb-1">
                Summary
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(summary).map(([key, value]) => (
                  <div key={key}>
                    <span className="font-bold uppercase">{key}:</span>
                    <span className="ml-2">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )
    }

    case 'scanIssue': {
      const { code, entity, snippet, matches } = evidence
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <span className="font-bold uppercase">Issue Code:</span>
              <span className="ml-2 font-mono bg-gray-100 px-1">{code}</span>
            </div>
            <div>
              <span className="font-bold uppercase">Entity:</span>
              <span className="ml-2">{entity.kind} • </span>
              <span className="font-mono bg-gray-100 px-1">{entity.name}</span>
            </div>
          </div>
          {snippet ? (
            <section>
              <h4 className="text-sm font-bold uppercase mb-2 border-b-2 border-black pb-1">
                Code Snippet
              </h4>
              <pre className="text-xs bg-gray-100 border-2 border-black p-3 overflow-x-auto font-mono">
                {snippet}
              </pre>
            </section>
          ) : null}
          {matches && matches.length > 0 ? (
            <section>
              <h4 className="text-sm font-bold uppercase mb-2 border-b-2 border-black pb-1">
                Matched Phrases
              </h4>
              <ul className="list-none space-y-1">
                {matches.map((match, i) => (
                  <li key={i} className="text-xs">
                    <span className="font-mono bg-gray-100 px-1">{match}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )
    }

    case 'integrity': {
      const { entity, hashAlg, prevHash, currHash, firstSeen } = evidence
      const changed = prevHash && currHash && prevHash !== currHash
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <span className="font-bold uppercase">Entity:</span>
              <span className="ml-2">{entity.kind} • </span>
              <span className="font-mono bg-gray-100 px-1">{entity.name}</span>
            </div>
            <div>
              <span className="font-bold uppercase">Algorithm:</span>
              <span className="ml-2 font-mono bg-gray-100 px-1">{hashAlg}</span>
            </div>
            {firstSeen ? (
              <div className="col-span-2">
                <span className="font-bold uppercase">First Seen:</span>
                <span className="ml-2">{new Date(firstSeen).toLocaleString()}</span>
              </div>
            ) : null}
          </div>
          <section>
            <h4 className="text-sm font-bold uppercase mb-2 border-b-2 border-black pb-1">
              Hash Comparison
            </h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="font-bold uppercase mb-1">Previous</div>
                <div className="font-mono bg-gray-100 p-2 border-2 border-black break-all">
                  {prevHash || '—'}
                </div>
              </div>
              <div>
                <div className="font-bold uppercase mb-1">Current</div>
                <div className={`font-mono p-2 border-2 border-black break-all ${
                  changed ? 'neo-danger-bg' : 'neo-success-bg'
                }`}>
                  {currHash}
                </div>
              </div>
            </div>
            <div className={`mt-2 px-2 py-1 text-xs font-bold uppercase border-2 border-black inline-block ${
              changed ? 'neo-danger-bg' : 'neo-success-bg'
            }`}>
              {changed ? 'Changed since last scan' : 'Pinned / unchanged'}
            </div>
          </section>
        </div>
      )
    }

    case 'proxyGuardrail': {
      const { rule, action, count, sample, spans } = evidence
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div>
              <span className="font-bold uppercase">Rule:</span>
              <span className="ml-2 font-mono bg-gray-100 px-1">{rule}</span>
            </div>
            <div>
              <span className="font-bold uppercase">Action:</span>
              <span className={`ml-2 px-1 font-mono ${
                action === 'block' ? 'neo-danger-bg' : 'bg-yellow-200'
              }`}>
                {action}
              </span>
            </div>
            <div>
              <span className="font-bold uppercase">Matches:</span>
              <span className="ml-2 font-bold">{count}</span>
            </div>
          </div>
          {sample ? (
            <section>
              <h4 className="text-sm font-bold uppercase mb-2 border-b-2 border-black pb-1">
                Sample
              </h4>
              <pre className="text-xs bg-gray-100 border-2 border-black p-3 overflow-x-auto font-mono">
                {highlightSpans(sample, spans ?? [])}
              </pre>
            </section>
          ) : null}
        </div>
      )
    }

    case 'toxicFlow': {
      const { kind, nodes, edges, detected, topExample } = evidence
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <span className="font-bold uppercase">Kind:</span>
              <span className="ml-2 font-mono bg-gray-100 px-1">{kind}</span>
            </div>
            <div>
              <span className="font-bold uppercase">Detected:</span>
              <span className={`ml-2 px-1 font-bold ${
                detected ? 'neo-danger-bg' : 'neo-success-bg'
              }`}>
                {detected ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
          {nodes.length > 0 ? (
            <section>
              <h4 className="text-sm font-bold uppercase mb-2 border-b-2 border-black pb-1">
                Flow Topology
              </h4>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {nodes.map((node, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-100 border-2 border-black text-xs font-mono">
                      {node}
                    </span>
                  ))}
                </div>
                {edges.length > 0 ? (
                  <ul className="list-none space-y-1 text-xs">
                    {edges.map(([from, to], i) => (
                      <li key={i} className="flex items-center">
                        <span className="font-mono bg-gray-100 px-1">{from}</span>
                        <span className="mx-2">→</span>
                        <span className="font-mono bg-gray-100 px-1">{to}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </section>
          ) : null}
          {topExample ? (
            <section>
              <h4 className="text-sm font-bold uppercase mb-2 border-b-2 border-black pb-1">
                Example
              </h4>
              <pre className="text-xs bg-gray-100 border-2 border-black p-3 overflow-x-auto font-mono">
                {topExample}
              </pre>
            </section>
          ) : null}
        </div>
      )
    }

    default:
      return <JsonBlock data={evidence} filename="unknown-evidence.json" />
  }
}

/** Highlight spans in text for proxy guardrail evidence */
function highlightSpans(sample: string, spans: Array<{ start: number; end: number }>) {
  if (!spans.length) return sample

  const parts: React.ReactNode[] = []
  let idx = 0
  const sorted = [...spans].sort((a, b) => a.start - b.start)

  sorted.forEach((span, i) => {
    if (idx < span.start) {
      parts.push(
        <span key={`text-${i}-${idx}`}>
          {sample.slice(idx, span.start)}
        </span>
      )
    }
    parts.push(
      <mark key={`highlight-${i}-${span.start}`} className="neo-danger-bg">
        {sample.slice(span.start, span.end)}
      </mark>
    )
    idx = span.end
  })

  if (idx < sample.length) {
    parts.push(
      <span key={`tail-${idx}`}>
        {sample.slice(idx)}
      </span>
    )
  }

  return parts
}