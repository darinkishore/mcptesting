import { SecurityDashboard } from './security-dashboard'
import { dataLoader } from '../../../lib/data-loader'
import { notFound } from 'next/navigation'

interface SecurityPageProps {
  params: Promise<{ serverId: string }>;
}

export default async function SecurityAnalysisPage({ params }: SecurityPageProps) {
  const { serverId } = await params

  try {
    const data = await dataLoader.getServerData(serverId)

    if (!data) {
      notFound()
    }

    const { server, securityAnalysis, evaluationRun } = data

    // Transform security analysis to match SecurityLint interface
    const securityLint = {
      score: securityAnalysis.score,
      totalChecks: securityAnalysis.totalChecks,
      passedChecks: securityAnalysis.passedChecks,
      criticalFailures: Object.values(securityAnalysis.checks)
        .filter(check => !check.satisfied && check.severity === 'critical')
        .map(check => check.id),
      providers: securityAnalysis.providers,
      scoring: {
        weights: { critical: 10, high: 8, medium: 6, low: 4 },
        capOnCriticalFailure: 50
      },
      checks: securityAnalysis.checks,
      vizByCategory: securityAnalysis.vizByCategory
    }

    // Transform server data to ServerMeta
    const serverMeta = {
      name: server.name,
      version: server.version || '1.0.0'
    }

    return (
      <div className="min-h-screen">
        <SecurityDashboard
          server={serverMeta}
          run={evaluationRun}
          securityLint={securityLint}
        />
      </div>
    )
  } catch (error) {
    console.error(`Error loading security data for ${serverId}:`, error)
    notFound()
  }
}