'use client'

import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Shield, ShieldCheck, ShieldAlert } from 'lucide-react'

interface ScoreDisplayProps {
  score: number
  passedChecks: number
  totalChecks: number
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  score,
  passedChecks,
  totalChecks,
}) => {
  const data = [
    {
      name: 'Score',
      value: score,
    },
    {
      name: 'Remaining',
      value: 100 - score,
    },
  ]

  const COLORS = ['#00f0ff', '#e5e5e5']

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'neo-success'
    if (score >= 70) return 'text-amber-500'
    return 'neo-danger'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <ShieldCheck className="h-6 w-6 neo-success" />
    if (score >= 70) return <Shield className="h-6 w-6 text-amber-500" />
    return <ShieldAlert className="h-6 w-6 neo-danger" />
  }

  return (
    <div className="neo-component flex p-4">
      <div className="w-32 h-32 flex-shrink-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={28}
              outerRadius={36}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              strokeWidth={2}
              stroke="#000"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
              {score.toFixed(1)}
            </span>
            <span className="text-xs uppercase">Score</span>
          </div>
        </div>
      </div>
      <div className="flex-1 ml-4">
        <div className="flex items-center mb-2">
          {getScoreIcon(score)}
          <h2 className="text-xl font-bold ml-2">SECURITY SCORE</h2>
        </div>
        <p className="uppercase text-xs mb-3">
          This MCP server has passed {passedChecks} out of {totalChecks}{' '}
          security checks.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="border-2 border-black p-1">
            <div className="text-xs uppercase">Passed</div>
            <div className="text-lg font-semibold neo-success">
              {passedChecks}
            </div>
          </div>
          <div className="border-2 border-black p-1">
            <div className="text-xs uppercase">Failed</div>
            <div className="text-lg font-semibold neo-danger">
              {totalChecks - passedChecks}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}