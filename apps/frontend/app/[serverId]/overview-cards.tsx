import React from 'react'
import { Shield, Wrench, Target } from 'lucide-react'

interface TaskEvaluation {
  id: string
  name: string
  description: string
  score: 'CRIT' | 'HIGH' | 'MED' | 'LOW'
  explanation: string
  icon: string
}

interface OverviewCardsProps {
  securityScore: number
  passedChecks: number
  totalChecks: number
  taskEvaluations: TaskEvaluation[]
}

export const OverviewCards: React.FC<OverviewCardsProps> = ({
  securityScore,
  passedChecks,
  totalChecks,
  taskEvaluations,
}) => {
  const getToolFunctionalityScore = () => {
    if (taskEvaluations.length === 0) return 0

    // Use the same scoring system as the data loader
    const scoreValues = { CRIT: 100, HIGH: 80, MED: 60, LOW: 30 }
    const total = taskEvaluations.reduce((sum, task) => sum + (scoreValues[task.score] || 0), 0)
    return Math.round(total / taskEvaluations.length)
  }

  const getTotalScore = () => {
    // Average of security and tool functionality scores
    const toolScore = getToolFunctionalityScore()
    return (securityScore + toolScore) / 2
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'neo-success'
    if (score >= 70) return 'text-amber-500'
    return 'neo-danger'
  }

  const toolFunctionalityScore = getToolFunctionalityScore()
  const totalScore = getTotalScore()

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="neo-component p-4">
        <div className="flex items-center mb-3">
          <Target className="h-6 w-6 mr-2 text-primary" />
          <h3 className="text-lg font-bold">TOTAL SCORE</h3>
        </div>
        <div className="text-center">
          <div className={`text-4xl font-bold ${getScoreColor(totalScore)}`}>
            {totalScore.toFixed(1)}%
          </div>
          <p className="text-xs uppercase mt-1">
            Overall System Performance
          </p>
        </div>
      </div>

      <div className="neo-component p-4">
        <div className="flex items-center mb-3">
          <Wrench className="h-6 w-6 mr-2 text-primary" />
          <h3 className="text-lg font-bold">TOOL FUNCTIONALITY</h3>
        </div>
        <div className="text-center">
          <div className={`text-4xl font-bold ${getScoreColor(toolFunctionalityScore)}`}>
            {toolFunctionalityScore.toFixed(1)}%
          </div>
          <p className="text-xs uppercase mt-1">
            AI Task Performance Rating
          </p>
        </div>
      </div>

      <div className="neo-component p-4">
        <div className="flex items-center mb-3">
          <Shield className="h-6 w-6 mr-2 text-primary" />
          <h3 className="text-lg font-bold">SECURITY SCORE</h3>
        </div>
        <div className="text-center">
          <div className={`text-4xl font-bold ${getScoreColor(securityScore)}`}>
            {securityScore.toFixed(1)}%
          </div>
          <p className="text-xs uppercase mt-1">
            {passedChecks}/{totalChecks} Security Checks Passed
          </p>
        </div>
      </div>
    </div>
  )
}