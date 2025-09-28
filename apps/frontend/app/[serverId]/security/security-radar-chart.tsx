"use client"

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

interface SecurityRadarChartProps {
  categories: CategoryData[]
}

export const SecurityRadarChart: React.FC<SecurityRadarChartProps> = ({
  categories,
}) => {
  // Transform data for radar chart
  const radarData = categories.map((cat) => ({
    subject: cat.category.toUpperCase(),
    A: cat.percent,
    fullMark: 100,
  }))

  return (
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
  )
}