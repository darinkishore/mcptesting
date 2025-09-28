import Link from 'next/link';
import { MCPServer } from '../mcp-types';
import { ServerHeader } from './server-header';
import { TabNav } from './tab-nav';
import { dataLoader } from '../../lib/data-loader';
import { notFound } from 'next/navigation';

// Dynamic data loading from JSON files
async function getServer(serverId: string): Promise<MCPServer> {
  try {
    const data = await dataLoader.getServerData(serverId);

    if (!data) {
      notFound();
    }

    return data.server;
  } catch (error) {
    console.error(`Error loading server ${serverId}:`, error);
    notFound();
  }
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