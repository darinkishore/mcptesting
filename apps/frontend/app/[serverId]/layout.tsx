import Link from 'next/link';
import { MCPServer } from '../mcp-types';
import { ServerHeader } from './server-header';
import { TabNav } from './tab-nav';

// Mock data - replace with actual API call
async function getServer(serverId: string): Promise<MCPServer> {
  // This would be: const res = await fetch(`${API_BASE_URL}/api/servers/${serverId}`);
  return {
    id: serverId,
    name: 'MCP Filesystem',
    description: 'File system operations server',
    repository: 'https://github.com/modelcontextprotocol/servers',
    totalScore: 95,
    toolScore: 98,
    securityScore: 92,
    lastTested: '2024-01-15T10:30:00Z',
    status: 'passing'
  };
}

interface ServerLayoutProps {
  children: React.ReactNode;
  params: Promise<{ serverId: string }>;
}

export default async function ServerLayout({ children, params }: ServerLayoutProps) {
  const { serverId } = await params;
  const server = await getServer(serverId);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
          >
            ← Back to leaderboard
          </Link>

          <ServerHeader server={server} />
          <TabNav serverId={serverId} />
        </div>

        {children}
      </div>
    </div>
  );
}