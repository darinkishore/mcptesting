import { MCPServer } from './mcp-types';
import { MCPLeaderboard } from './mcp-leaderboard';
import { dataLoader } from '../lib/data-loader';

// Dynamic data loading from JSON files
async function getServers(): Promise<MCPServer[]> {
  try {
    const servers = await dataLoader.getAllServers();
    console.log(servers,"servers")
    return servers;
  } catch (error) {
    console.error('Error loading servers:', error);
    return [];
  }
}

export default async function HomePage() {
  const servers = await getServers();

  return (
    <div className="min-h-screen bg-white">
      <MCPLeaderboard servers={servers} />
    </div>
  );
}