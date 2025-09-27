import { MCPServer } from './mcp-types';
import { MCPLeaderboard } from './mcp-leaderboard';

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
    <div className="min-h-screen bg-white">
      <MCPLeaderboard servers={servers} />
    </div>
  );
}