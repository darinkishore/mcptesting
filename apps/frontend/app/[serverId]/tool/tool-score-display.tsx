import React from 'react'
import { Brain, BrainCircuit, Cpu } from 'lucide-react'
import { PerformancePieChart } from './performance-pie-chart'

interface TaskEvaluation {
  id: string
  name: string
  score: 'CRIT' | 'HIGH' | 'MED' | 'LOW'
}

interface ToolScoreDisplayProps {
  taskEvaluations: TaskEvaluation[]
}

export const ToolScoreDisplay: React.FC<ToolScoreDisplayProps> = ({
  taskEvaluations,
}) => {
  const getOverallScore = () => {
    if (taskEvaluations.length === 0) return { average: '0.0', percentage: '0.0', numericPercentage: 0 }

    // Use the same scoring system as the data loader and overview cards
    const scoreValues = { CRIT: 100, HIGH: 80, MED: 60, LOW: 30 }
    const total = taskEvaluations.reduce((sum, task) => sum + (scoreValues[task.score] || 0), 0)
    const percentage = Math.round(total / taskEvaluations.length)

    // Convert to 4.0 scale for display consistency
    const fourPointScale = (percentage / 100) * 4

    return {
      average: fourPointScale.toFixed(1),
      percentage: percentage.toFixed(1),
      numericPercentage: percentage
    }
  }

  const overall = getOverallScore()

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'neo-success'
    if (score >= 70) return 'text-amber-500'
    return 'neo-danger'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <BrainCircuit className="h-6 w-6 neo-success" />
    if (score >= 70) return <Brain className="h-6 w-6 text-amber-500" />
    return <Cpu className="h-6 w-6 neo-danger" />
  }

  const scoreCounts = {
    CRIT: taskEvaluations.filter(task => task.score === 'CRIT').length,
    HIGH: taskEvaluations.filter(task => task.score === 'HIGH').length,
    MED: taskEvaluations.filter(task => task.score === 'MED').length,
    LOW: taskEvaluations.filter(task => task.score === 'LOW').length,
  }

  return (
    <div className="neo-component flex p-4">
      <PerformancePieChart
        percentage={overall.numericPercentage}
        scoreColor={getScoreColor(overall.numericPercentage)}
      />
      <div className="flex-1 ml-4">
        <div className="flex items-center mb-2">
          {getScoreIcon(overall.numericPercentage)}
          <h2 className="text-xl font-bold ml-2">TOOL PERFORMANCE SCORE</h2>
        </div>
        <p className="uppercase text-xs mb-3">
          Average performance rating of {overall.average}/4.0 across {taskEvaluations.length} AI-generated tasks.
        </p>
        <div className="grid grid-cols-4 gap-2">
          <div className="border-2 border-black p-1">
            <div className="text-xs uppercase">Critical</div>
            <div className="text-lg font-semibold neo-success">
              {scoreCounts.CRIT}
            </div>
          </div>
          <div className="border-2 border-black p-1">
            <div className="text-xs uppercase">High</div>
            <div className="text-lg font-semibold text-amber-500">
              {scoreCounts.HIGH}
            </div>
          </div>
          <div className="border-2 border-black p-1">
            <div className="text-xs uppercase">Medium</div>
            <div className="text-lg font-semibold text-blue-500">
              {scoreCounts.MED}
            </div>
          </div>
          <div className="border-2 border-black p-1">
            <div className="text-xs uppercase">Low</div>
            <div className="text-lg font-semibold neo-danger">
              {scoreCounts.LOW}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}