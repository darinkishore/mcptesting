
import { notFound } from 'next/navigation'
import { dataLoader } from '../../../lib/data-loader'
import { SecurityDashboard } from './security-dashboard'
import { getSecurityServerConfig } from './server-registry'
import type { SecurityLint, ServerMeta, EvaluationRun, ProvidersMeta } from '../../types'
import type { RunId, ServerId } from '../../types/core'


interface SecurityPageProps {
  params: Promise<{ serverId: string }>;
}

function buildServerMeta(server: { id: string; name: string; description?: string; repository?: string; version?: string | null; lastTested: string }): ServerMeta {
  return {
    id: server.id as ServerId,
    name: server.name,
    slug: server.id,
    description: server.description,
    repository: server.repository,
    version: server.version ?? undefined,
    transports: ['http'],
    lastEvaluated: server.lastTested,
  };
}

function buildEvaluationRun(
  serverId: string,
  evaluationRun: { startedAt: string; finishedAt?: string | null; metadata?: { datasetVersion?: string | null } | null },
  providers: ProvidersMeta
): EvaluationRun {
  const datasetId = evaluationRun.metadata?.datasetVersion ?? 'synthetic-mcp-security-v1';

  return {
    id: `dataset-${serverId}` as RunId,
    startedAt: evaluationRun.startedAt,
    finishedAt: evaluationRun.finishedAt ?? undefined,
    datasetId,
    providers,
  };
}

export default async function SecurityAnalysisPage({ params }: SecurityPageProps) {
  const { serverId } = await params;

  const data = await dataLoader.getServerData(serverId);
  if (!data) {
    notFound();
  }

  const securityLint = data.securityAnalysis as SecurityLint;
  const providers = (securityLint.providers ?? {}) as ProvidersMeta;
  const serverMeta = buildServerMeta(data.server);
  const evaluationRun = buildEvaluationRun(serverId, data.evaluationRun, providers);

  const config = getSecurityServerConfig(serverId);

  return (
    <div className="min-h-screen space-y-4">
      <SecurityDashboard
        server={serverMeta}
        run={evaluationRun}
        securityLint={securityLint}
      />

      {config && (
        <div className="neo-component p-4">
          <h2 className="text-sm font-bold uppercase mb-2">Live Scan Available</h2>
          <p className="text-sm text-gray-700">
            Use the backend endpoint <code>/api/security/scans</code> with server URL{' '}
            <code>{config.url}</code>
            {config.oauthScopes
              ? ` (OAuth scopes: ${config.oauthScopes})`
              : ''}
            {' '}to trigger a fresh MCP scan when you want to refresh these results.
          </p>
        </div>
      )}
    </div>
  );
}
