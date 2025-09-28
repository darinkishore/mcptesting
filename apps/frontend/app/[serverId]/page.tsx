import { MCPServer } from '../mcp-types';
import { OverviewCards } from './overview-cards';
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

interface ServerPageProps {
  params: Promise<{ serverId: string }>;
}

export default async function ServerOverviewPage({ params }: ServerPageProps) {
  const { serverId } = await params;
  const server = await getServer(serverId);
  const data = await dataLoader.getServerData(serverId);

  if (!data) {
    notFound();
  }

  const { securityAnalysis, toolEvaluation } = data;

  return (
    <div className="space-y-0">
      <OverviewCards
        securityScore={securityAnalysis.score}
        passedChecks={securityAnalysis.passedChecks}
        totalChecks={securityAnalysis.totalChecks}
        taskEvaluations={toolEvaluation.taskEvaluations}
      />

      <div className="neo-component p-4 mt-4">
        <h3 className="text-lg font-bold mb-3 uppercase">SERVER INFORMATION</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-bold uppercase text-gray-500">Description</dt>
            <dd className="mt-1 text-sm text-gray-900">{server.description}</dd>
          </div>
          <div>
            <dt className="text-sm font-bold uppercase text-gray-500">Repository</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {server.repository ? (
                <a
                  href={server.repository}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="neo-success hover:underline"
                >
                  {server.repository.replace('https://github.com/', '')}
                </a>
              ) : (
                'Not available'
              )}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-bold uppercase text-gray-500">Last Tested</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(server.lastTested).toISOString().replace('T', ' ').slice(0, 19)}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-bold uppercase text-gray-500">Status</dt>
            <dd className="mt-1">
              <span
                className={`px-2 py-1 text-xs font-bold border-2 border-black ${
                  server.status === 'passing'
                    ? 'neo-success-bg text-white'
                    : server.status === 'failing'
                    ? 'neo-danger-bg text-white'
                    : 'bg-yellow-500 text-white'
                }`}
              >
                {server.status.toUpperCase()}
              </span>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}