import { ToolTask } from '../../mcp-types';
import { TaskList } from './task-list';

// Mock data - replace with actual API call
async function getToolTasks(serverId: string): Promise<ToolTask[]> {
  // This would be: const res = await fetch(`${API_BASE_URL}/api/servers/${serverId}/tool-tasks`);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _serverId = serverId; // Will be used when implementing real API
  return [
    {
      id: 'read-file',
      name: 'Read File',
      description: 'Test reading a file from the filesystem',
      score: 10,
      maxScore: 10,
      status: 'passed',
      executionTime: 45,
      traces: [
        {
          timestamp: '2024-01-15T10:30:00Z',
          type: 'request',
          content: { tool: 'read_file', path: '/tmp/test.txt' }
        },
        {
          timestamp: '2024-01-15T10:30:01Z',
          type: 'response',
          content: { content: 'Hello, World!', status: 'success' }
        }
      ]
    },
    {
      id: 'write-file',
      name: 'Write File',
      description: 'Test writing content to a file',
      score: 8,
      maxScore: 10,
      status: 'failed',
      executionTime: 120,
      traces: [
        {
          timestamp: '2024-01-15T10:30:02Z',
          type: 'request',
          content: { tool: 'write_file', path: '/protected/test.txt', content: 'data' }
        },
        {
          timestamp: '2024-01-15T10:30:03Z',
          type: 'error',
          content: { error: 'Permission denied', code: 'EACCES' }
        }
      ]
    },
    {
      id: 'list-directory',
      name: 'List Directory',
      description: 'Test listing directory contents',
      score: 10,
      maxScore: 10,
      status: 'passed',
      executionTime: 30
    }
  ];
}

interface ToolPageProps {
  params: Promise<{ serverId: string }>;
}

export default async function ToolEvaluationPage({ params }: ToolPageProps) {
  const { serverId } = await params;
  const tasks = await getToolTasks(serverId);

  const totalScore = tasks.reduce((sum, task) => sum + task.score, 0);
  const maxScore = tasks.reduce((sum, task) => sum + task.maxScore, 0);
  const passedCount = tasks.filter(t => t.status === 'passed').length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-semibold mb-4">Tool Evaluation Results</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="border rounded-lg p-3">
            <p className="text-sm text-gray-500">Total Score</p>
            <p className="text-2xl font-bold">
              {totalScore}/{maxScore}
            </p>
          </div>
          <div className="border rounded-lg p-3">
            <p className="text-sm text-gray-500">Success Rate</p>
            <p className="text-2xl font-bold">
              {Math.round((passedCount / tasks.length) * 100)}%
            </p>
          </div>
          <div className="border rounded-lg p-3">
            <p className="text-sm text-gray-500">Tasks Passed</p>
            <p className="text-2xl font-bold text-green-600">
              {passedCount}
            </p>
          </div>
          <div className="border rounded-lg p-3">
            <p className="text-sm text-gray-500">Tasks Failed</p>
            <p className="text-2xl font-bold text-red-600">
              {tasks.length - passedCount}
            </p>
          </div>
        </div>

        <TaskList tasks={tasks} />
      </div>
    </div>
  );
}