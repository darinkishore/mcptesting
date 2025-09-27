import React from 'react'
import { Shield, Zap } from 'lucide-react'
import Link from 'next/link'

interface MCPServerCardProps {
  id: string
  name: string
  description: string
  totalScore: number
  securityScore: number
  toolScore: number
  rank: number
  status: 'passing' | 'failing' | 'pending'
  lastTested: string
}

export const MCPServerCard: React.FC<MCPServerCardProps> = ({
  id,
  name,
  description,
  securityScore,
  toolScore,
  totalScore,
  rank,
  status,
  lastTested
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'neo-success'
    if (score >= 75) return 'text-amber-500'
    if (score >= 60) return 'text-blue-500'
    return 'neo-danger'
  }

  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return 'neo-success-bg'
    if (score >= 75) return 'bg-amber-500'
    if (score >= 60) return 'bg-blue-500'
    return 'neo-danger-bg'
  }

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500'
    if (rank === 2) return 'bg-gray-400'
    if (rank === 3) return 'bg-amber-600'
    return 'bg-gray-600'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passing':
        return 'neo-success-bg'
      case 'failing':
        return 'neo-danger-bg'
      case 'pending':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <Link href={`/${id}`}>
      <div className="neo-component relative hover:transform hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-200 cursor-pointer">
        <div className={`absolute -top-2 -left-2 w-8 h-8 ${getRankBadgeColor(rank)} text-white flex items-center justify-center font-bold text-sm border-2 border-black`}>
          {rank}
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-bold uppercase leading-tight mb-1">
                {name}
              </h3>
              <div className="flex items-center space-x-2 mb-2">
                <span className={`px-2 py-1 text-xs font-bold text-white ${getStatusBadge(status)} border border-black`}>
                  {status.toUpperCase()}
                </span>
                <span className="text-xs uppercase text-gray-500">
                  {new Date(lastTested).toISOString().split('T')[0]}
                </span>
              </div>
            </div>
            <div className={`px-3 py-1 text-sm font-bold text-white ${getScoreBadgeColor(totalScore)} border-2 border-black`}>
              {totalScore.toFixed(1)}
            </div>
          </div>

          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            {description}
          </p>

          <div className="border-t-2 border-black pt-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Shield className={`h-5 w-5 ${getScoreColor(securityScore)}`} />
                <div>
                  <p className="text-xs uppercase font-bold text-gray-500">Security</p>
                  <p className={`text-lg font-bold ${getScoreColor(securityScore)}`}>
                    {securityScore.toFixed(1)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Zap className={`h-5 w-5 ${getScoreColor(toolScore)}`} />
                <div>
                  <p className="text-xs uppercase font-bold text-gray-500">Tools</p>
                  <p className={`text-lg font-bold ${getScoreColor(toolScore)}`}>
                    {toolScore.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}