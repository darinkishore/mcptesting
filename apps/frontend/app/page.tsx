import { MCPServer } from './mcp-types';
import { LeaderboardTable } from './leaderboard-table';

// Mock data - replace with actual API call
async function getServers(): Promise<MCPServer[]> {
  // This would be: const res = await fetch(`${API_BASE_URL}/api/servers`);
  return [
    {
      id: 'filesystem',
      name: 'MCP Filesystem',
      description: 'File system operations server',
      repository: 'https://github.com/modelcontextprotocol/servers',
      totalScore: 95,
      toolScore: 98,
      securityScore: 92,
      lastTested: '2024-01-15T10:30:00Z',
      status: 'passing'
    },
    {
      id: 'github',
      name: 'MCP GitHub',
      description: 'GitHub API integration server',
      repository: 'https://github.com/modelcontextprotocol/servers',
      totalScore: 88,
      toolScore: 85,
      securityScore: 91,
      lastTested: '2024-01-15T09:15:00Z',
      status: 'passing'
    },
    {
      id: 'sqlite',
      name: 'MCP SQLite',
      description: 'SQLite database server',
      repository: 'https://github.com/modelcontextprotocol/servers',
      totalScore: 78,
      toolScore: 82,
      securityScore: 74,
      lastTested: '2024-01-15T08:00:00Z',
      status: 'failing'
    }
  ];
}

export default async function HomePage() {
  const servers = await getServers();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            MCP Testing Leaderboard
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Comprehensive testing results for Model Context Protocol servers
          </p>
        </div>

        <LeaderboardTable servers={servers} />
      </div>
    </div>
  );
}