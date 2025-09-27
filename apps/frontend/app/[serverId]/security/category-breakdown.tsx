'use client'

import React from 'react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

interface CategoryData {
  category: string
  earned: number
  max: number
  percent: number
}

interface CategoryBreakdownProps {
  categories: CategoryData[]
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  categories,
}) => {
  // Transform data for radar chart
  const radarData = categories.map((cat) => ({
    subject: cat.category.toUpperCase(),
    A: cat.percent,
    fullMark: 100,
  }))

  return (
    <div className="neo-component p-4 mt-4">
      <h2 className="text-xl font-bold mb-2">SECURITY COVERAGE BY CATEGORY</h2>
      <div className="flex flex-col md:flex-row">
        <div className="md:w-1/2 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="#000" strokeWidth={1} />
              <PolarAngleAxis
                dataKey="subject"
                tick={{
                  fill: '#000',
                  fontSize: 9,
                }}
                stroke="#000"
                strokeWidth={2}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                stroke="#000"
                strokeWidth={2}
                tick={{
                  fill: '#000',
                }}
              />
              <Radar
                name="Security Coverage"
                dataKey="A"
                stroke="#000"
                strokeWidth={2}
                fill="#00f0ff"
                fillOpacity={0.6}
              />
              <Tooltip formatter={(value) => [`${value}%`, 'COVERAGE']} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="md:w-1/2 md:pl-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 h-full">
            {categories.map((cat) => (
              <div key={cat.category} className="border-2 border-black p-1">
                <div className="flex justify-between items-center">
                  <span className="font-medium uppercase text-xs">
                    {cat.category}
                  </span>
                  <span
                    className={`text-xs font-semibold ${cat.percent === 100 ? 'neo-success' : cat.percent >= 70 ? 'text-amber-500' : 'neo-danger'}`}
                  >
                    {cat.percent}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 h-2 border border-black mt-1">
                  <div
                    className={`h-1 ${cat.percent === 100 ? 'neo-success-bg' : cat.percent >= 70 ? 'bg-amber-500' : 'neo-danger-bg'}`}
                    style={{
                      width: `${cat.percent}%`,
                    }}
                  ></div>
                </div>
                <div className="text-xs uppercase">
                  {cat.earned}/{cat.max} PTS
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}