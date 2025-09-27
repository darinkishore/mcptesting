import React from 'react'
import { Brain, Zap, Search, FileText, Globe } from 'lucide-react'

interface TaskEvaluation {
  id: string
  name: string
  description: string
  score: 'CRIT' | 'HIGH' | 'MED' | 'LOW'
  explanation: string
  icon: React.ReactNode
}

interface ToolScoreProps {
  serverName: string
}

export const taskEvaluations: TaskEvaluation[] = [
  {
    id: 'web-search-accuracy',
    name: 'Web Search Accuracy',
    description: 'Ability to find relevant, up-to-date information from web sources',
    score: 'HIGH',
    explanation: 'Consistently returns accurate results with proper source attribution and minimal hallucinations',
    icon: <Search className="h-6 w-6" />
  },
  {
    id: 'query-understanding',
    name: 'Natural Language Query Processing',
    description: 'Understanding complex, ambiguous, or contextual search queries',
    score: 'HIGH',
    explanation: 'Handles nuanced queries well, interprets context and intent effectively',
    icon: <Brain className="h-6 w-6" />
  },
  {
    id: 'response-speed',
    name: 'Response Time Performance',
    description: 'Speed of processing and returning search results to users',
    score: 'MED',
    explanation: 'Moderate latency due to external API dependencies, could benefit from caching optimizations',
    icon: <Zap className="h-6 w-6" />
  },
  {
    id: 'content-filtering',
    name: 'Content Safety & Filtering',
    description: 'Filtering inappropriate content and maintaining result quality',
    score: 'CRIT',
    explanation: 'Excellent content moderation with comprehensive safety filters and quality assurance',
    icon: <FileText className="h-6 w-6" />
  },
  {
    id: 'source-diversity',
    name: 'Source Diversity & Coverage',
    description: 'Accessing diverse, authoritative sources across different domains',
    score: 'HIGH',
    explanation: 'Wide coverage of reputable sources with good domain diversity and credibility checks',
    icon: <Globe className="h-6 w-6" />
  }
]

export const ToolScore: React.FC<ToolScoreProps> = ({ serverName }) => {
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
                  {task.icon}
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