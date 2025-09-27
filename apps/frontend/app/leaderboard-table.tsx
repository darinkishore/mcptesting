'use client';

import Link from 'next/link';
import { MCPServer } from './mcp-types';
import { ScoreCell } from './score-cell';

interface LeaderboardTableProps {
  servers: MCPServer[];
}

export function LeaderboardTable({ servers }: LeaderboardTableProps) {
  // Sort by total score descending
  const sortedServers = [...servers].sort((a, b) => b.totalScore - a.totalScore);

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rank
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Server
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Score
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tool Score
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Security Score
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Last Tested
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedServers.map((server, index) => (
            <tr key={server.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                #{index + 1}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Link
                  href={`/${server.id}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <div className="text-sm font-medium">{server.name}</div>
                  <div className="text-sm text-gray-500">{server.description}</div>
                </Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <ScoreCell score={server.totalScore} maxScore={100} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <ScoreCell score={server.toolScore} maxScore={100} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <ScoreCell score={server.securityScore} maxScore={100} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex px-2 text-xs font-semibold rounded-full ${
                    server.status === 'passing'
                      ? 'bg-green-100 text-green-800'
                      : server.status === 'failing'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {server.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(server.lastTested).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}