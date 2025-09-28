import React from 'react'
import { Shield, ShieldCheck, ShieldAlert } from 'lucide-react'
import { ScorePieChart } from './security-pie-chart'
import { SecurityDescription } from './security-description'

interface ScoreDisplayProps {
  score: number
  passedChecks: number
  totalChecks: number
  securityChecks?: Array<{ name: string; status: string; severity: string; category?: string }>
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  score,
  passedChecks,
  totalChecks,
  securityChecks,
}) => {

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
      <ScorePieChart
        score={score}
        scoreColor={getScoreColor(score)}
      />
      <div className="flex-1 ml-4">
        <div className="flex items-center mb-2">
          {getScoreIcon(score)}
          <h2 className="text-xl font-bold ml-2">SECURITY SCORE</h2>
        </div>
        <SecurityDescription
          score={score}
          passedChecks={passedChecks}
          totalChecks={totalChecks}
          securityChecks={securityChecks}
        />
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