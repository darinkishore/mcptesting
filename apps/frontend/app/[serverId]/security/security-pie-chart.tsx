"use client"

import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

interface ScorePieChartProps {
  score: number
  scoreColor: string
}

export const ScorePieChart: React.FC<ScorePieChartProps> = ({
  score,
  scoreColor
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

  return (
    <div className="w-32 h-36 flex-shrink-0 relative flex flex-col items-center">
      <div className="w-32 h-32 relative">
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
          <span className={`text-lg font-bold ${scoreColor}`}>
            {score.toFixed(1)}
          </span>
        </div>
      </div>
      <span className="text-xs uppercase mt-1">Security Score</span>
    </div>
  )
}