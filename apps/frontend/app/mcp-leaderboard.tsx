import React from 'react'
import { MCPServerCard } from './mcp-server-card'
import { Trophy, Users, TrendingUp } from 'lucide-react'
import { MCPServer } from './mcp-types'

interface MCPLeaderboardProps {
  servers: MCPServer[]
}

export const MCPLeaderboard: React.FC<MCPLeaderboardProps> = ({ servers }) => {
  // Sort servers by total score descending
  const sortedServers = [...servers].sort((a, b) => b.totalScore - a.totalScore)

  const totalServers = servers.length
  const avgScore = servers.reduce((sum, server) => sum + server.totalScore, 0) / totalServers
  const topScore = sortedServers[0]?.totalScore || 0

  return (
    <div className="container mx-auto px-4 py-4 max-w-7xl neo-grid">
      {/* Header Section */}
      <div className="neo-component mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <Trophy className="h-8 w-8 text-yellow-500 mr-3" />
              MCP SERVER LEADERBOARD
            </h1>
            <p className="uppercase text-sm text-gray-600">
              Performance rankings for Model Context Protocol servers
            </p>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t-2 border-black">
          <div className="flex items-center space-x-3">
            <Users className="h-6 w-6 text-blue-500" />
            <div>
              <p className="text-xs uppercase font-bold text-gray-500">Total Servers</p>
              <p className="text-2xl font-bold">{totalServers}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <TrendingUp className="h-6 w-6 text-green-500" />
            <div>
              <p className="text-xs uppercase font-bold text-gray-500">Average Score</p>
              <p className="text-2xl font-bold">{avgScore.toFixed(1)}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <div>
              <p className="text-xs uppercase font-bold text-gray-500">Top Score</p>
              <p className="text-2xl font-bold neo-success">{topScore.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedServers.map((server, index) => (
          <MCPServerCard
            key={server.id}
            id={server.id}
            name={server.name}
            description={server.description}
            totalScore={server.totalScore}
            securityScore={server.securityScore}
            toolScore={server.toolScore}
            status={server.status}
            lastTested={server.lastTested}
            rank={index + 1}
          />
        ))}
      </div>
    </div>
  )
}