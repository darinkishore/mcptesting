import { SecurityDashboard } from './security-dashboard'
import { securityData } from './mock-security-data'
import {
  hydrateSecurityData,
  hydrateServerMeta,
  hydrateEvaluationRun
} from './mock-adapter'

interface SecurityPageProps {
  params: Promise<{ serverId: string }>;
}

export default async function SecurityAnalysisPage({ params }: SecurityPageProps) {
  const { serverId } = await params;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _serverId = serverId; // Will be used when implementing real API

  // Transform mock data to use comprehensive types
  const server = hydrateServerMeta(securityData)
  const run = hydrateEvaluationRun(securityData)
  const securityLint = hydrateSecurityData(securityData)

  return (
    <div className="min-h-screen">
      <SecurityDashboard
        server={server}
        run={run}
        securityLint={securityLint}
      />
    </div>
  );
}