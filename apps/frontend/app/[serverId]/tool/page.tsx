import { MCPServer } from '../../mcp-types';
import { ToolScore, taskEvaluations } from './tool-score';
import { ToolScoreDisplay } from './tool-score-display';

// Mock data - replace with actual API calls
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

interface ToolPageProps {
  params: Promise<{ serverId: string }>;
}

export default async function ToolEvaluationPage({ params }: ToolPageProps) {
  const { serverId } = await params;
  const server = await getServer(serverId);

  return (
    <div className="space-y-0">
      <ToolScoreDisplay
        taskEvaluations={taskEvaluations}
      />
      <ToolScore serverName={server.name} />
    </div>
  );
}