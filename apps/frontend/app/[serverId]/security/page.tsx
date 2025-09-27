import { SecurityDashboard } from './security-dashboard'
import { securityData } from './mock-security-data'

interface SecurityPageProps {
  params: Promise<{ serverId: string }>;
}

export default async function SecurityAnalysisPage({ params }: SecurityPageProps) {
  const { serverId } = await params;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _serverId = serverId; // Will be used when implementing real API

  // In real implementation, you would fetch data based on serverId
  // For now, we'll use the mock data directly

  return (
    <div className="min-h-screen">
      <SecurityDashboard data={securityData} />
    </div>
  );
}