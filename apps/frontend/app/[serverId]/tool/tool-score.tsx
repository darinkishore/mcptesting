import React from 'react'
import { Brain, Zap, Search, FileText, Globe } from 'lucide-react'

interface TaskEvaluation {
  id: string
  name: string
  description: string
  score: 'CRIT' | 'HIGH' | 'MED' | 'LOW'
  explanation: string
  icon: string
}

interface ToolScoreProps {
  serverName: string
  taskEvaluations: TaskEvaluation[]
}

// Icon mapping for dynamic task evaluations
const getIcon = (iconName: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    'FileText': <FileText className="h-6 w-6" />,
    'Shield': <Search className="h-6 w-6" />,
    'FolderOpen': <FileText className="h-6 w-6" />,
    'Lock': <Brain className="h-6 w-6" />,
    'AlertTriangle': <Zap className="h-6 w-6" />,
    'Key': <Brain className="h-6 w-6" />,
    'GitBranch': <Globe className="h-6 w-6" />,
    'GitPullRequest': <FileText className="h-6 w-6" />,
    'Webhook': <Search className="h-6 w-6" />,
    'Clock': <Zap className="h-6 w-6" />,
    'Database': <FileText className="h-6 w-6" />,
    'Link': <Brain className="h-6 w-6" />,
    'Table': <Globe className="h-6 w-6" />,
    'Archive': <FileText className="h-6 w-6" />,
    'Search': <Search className="h-6 w-6" />,
    'Brain': <Brain className="h-6 w-6" />,
    'Zap': <Zap className="h-6 w-6" />,
    'Globe': <Globe className="h-6 w-6" />
  };

  return iconMap[iconName] || <FileText className="h-6 w-6" />;
}

export const ToolScore: React.FC<ToolScoreProps> = ({ serverName, taskEvaluations }) => {
  const getScoreColor = (score: string) => {
    switch (score) {
      case 'CRIT':
        return 'neo-success'
      case 'HIGH':
        return 'text-amber-500'
      case 'MED':
        return 'text-blue-500'
      case 'LOW':
        return 'neo-danger'
      default:
        return 'text-gray-500'
    }
  }

  const getScoreBackground = (score: string) => {
    switch (score) {
      case 'CRIT':
        return 'neo-success-bg'
      case 'HIGH':
        return 'bg-amber-500'
      case 'MED':
        return 'bg-blue-500'
      case 'LOW':
        return 'neo-danger-bg'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="neo-component p-4 mt-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-1">TOOL PERFORMANCE EVALUATION</h2>
        <p className="uppercase text-xs">
          AI-Generated Task Assessment for {serverName}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {taskEvaluations.map((task) => (
          <div key={task.id} className="border-2 border-black p-3 bg-white">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center">
                <div className={`${getScoreColor(task.score)} mr-2`}>
                  {getIcon(task.icon)}
                </div>
                <div>
                  <h3 className="font-bold text-sm uppercase leading-tight">
                    {task.name}
                  </h3>
                </div>
              </div>
              <span
                className={`px-2 py-1 text-xs font-bold text-white ${getScoreBackground(task.score)}`}
              >
                {task.score}
              </span>
            </div>

            <p className="text-xs uppercase mb-2 text-gray-600">
              {task.description}
            </p>

            <div className="border-t-2 border-black pt-2">
              <p className="text-xs">
                {task.explanation}
              </p>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}