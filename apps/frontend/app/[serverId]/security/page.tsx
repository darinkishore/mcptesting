import { notFound } from 'next/navigation'
import { SecurityScanClient } from './security-scan-client'
import { getSecurityServerConfig } from './server-registry'

interface SecurityPageProps {
  params: Promise<{ serverId: string }>;
}

export default async function SecurityAnalysisPage({ params }: SecurityPageProps) {
  const { serverId } = await params;
  const config = getSecurityServerConfig(serverId);

  if (!config) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <SecurityScanClient serverId={serverId} config={config} />
    </div>
  );
}
