import { MCPServer } from '../mcp-types';

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

interface ServerPageProps {
  params: Promise<{ serverId: string }>;
}

export default async function ServerOverviewPage({ params }: ServerPageProps) {
  const { serverId } = await params;
  const server = await getServer(serverId);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-semibold mb-4">Overview</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total Score</h3>
            <p className="text-3xl font-bold text-gray-900">{server.totalScore}%</p>
            <p className="text-sm text-gray-500 mt-1">
              {server.status === 'passing' ? '✓ Passing' : '✗ Failing'}
            </p>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Tool Functionality</h3>
            <p className="text-3xl font-bold text-gray-900">{server.toolScore}%</p>
            <p className="text-sm text-gray-500 mt-1">Core capabilities</p>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Security</h3>
            <p className="text-3xl font-bold text-gray-900">{server.securityScore}%</p>
            <p className="text-sm text-gray-500 mt-1">Security compliance</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-3">Server Information</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Description</dt>
            <dd className="mt-1 text-sm text-gray-900">{server.description}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Repository</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {server.repository ? (
                <a
                  href={server.repository}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  {server.repository.replace('https://github.com/', '')}
                </a>
              ) : (
                'Not available'
              )}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Last Tested</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(server.lastTested).toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Status</dt>
            <dd className="mt-1">
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  server.status === 'passing'
                    ? 'bg-green-100 text-green-800'
                    : server.status === 'failing'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {server.status}
              </span>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}