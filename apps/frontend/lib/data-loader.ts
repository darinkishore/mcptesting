import fs from 'fs'
import path from 'path'
import { MCPServer } from '../app/mcp-types'

interface TaskEvaluation {
  id: string
  name: string
  description: string
  score: 'CRIT' | 'HIGH' | 'MED' | 'LOW'
  explanation: string
  icon: string
}

interface SecurityCheck {
  id: string
  name: string
  source: "mcp-validator" | "mcp-scan"
  category: string
  severity: string
  weight: number
  satisfied: boolean
  scoreContribution: number
  evidence: unknown
}

interface SecurityAnalysis {
  score: number
  passedChecks: number
  totalChecks: number
  checks: Record<string, SecurityCheck>
  vizByCategory: Array<{ category: string; earned: number; max: number; percent: number }>
  providers: {
    mcpValidator?: { version: string }
    mcpScan?: { version: string }
  }
}

interface EvaluationRun {
  startedAt: string
  finishedAt: string
  metadata: {
    generatedAt: string
    toolVersion: string
    datasetVersion: string
  }
}

interface ServerData {
  server: MCPServer
  toolEvaluation: {
    taskEvaluations: TaskEvaluation[]
  }
  securityAnalysis: SecurityAnalysis
  evaluationRun: EvaluationRun
}

export class DataLoader {
  private dataPath: string

  constructor() {
    this.dataPath = path.join(process.cwd(), 'data')
  }

  async getServerData(serverId: string): Promise<ServerData | null> {
    try {
      const filePath = path.join(this.dataPath, `${serverId}.json`)

      if (!fs.existsSync(filePath)) {
        console.warn(`Data file not found for server: ${serverId}`)
        return null
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8')
      const data = JSON.parse(fileContent) as ServerData

      // Calculate tool score from task evaluations
      const calculatedToolScore = this.calculateToolScore(data.toolEvaluation.taskEvaluations)

      // Ensure scores are consistent
      const calculatedTotalScore = Math.round((data.securityAnalysis.score + calculatedToolScore) / 2)

      data.server = {
        ...data.server,
        toolScore: calculatedToolScore,
        totalScore: calculatedTotalScore,
        securityScore: data.securityAnalysis.score
      }

      return data
    } catch (error) {
      console.error(`Error loading data for server ${serverId}:`, error)
      return null
    }
  }

  async getAllServers(): Promise<MCPServer[]> {
    try {
      const files = fs.readdirSync(this.dataPath)
      const jsonFiles = files.filter(file => file.endsWith('.json'))

      const servers: MCPServer[] = []

      for (const file of jsonFiles) {
        const serverId = path.basename(file, '.json')
        const data = await this.getServerData(serverId)

        if (data) {
          // Calculate tool score from task evaluations
          const calculatedToolScore = this.calculateToolScore(data.toolEvaluation.taskEvaluations)

          // Calculate total score as average of security and tool scores
          const calculatedTotalScore = Math.round((data.securityAnalysis.score + calculatedToolScore) / 2)

          const server = {
            ...data.server,
            toolScore: calculatedToolScore,
            totalScore: calculatedTotalScore,
            securityScore: data.securityAnalysis.score
          }

          servers.push(server)
        }
      }

      return servers
    } catch (error) {
      console.error('Error loading all servers:', error)
      return []
    }
  }

  // Calculate tool score based on task evaluation scores
  private calculateToolScore(taskEvaluations: TaskEvaluation[]): number {
    if (taskEvaluations.length === 0) return 0

    // Map score levels to numeric values
    const scoreMap = {
      'CRIT': 100,
      'HIGH': 80,
      'MED': 60,
      'LOW': 30
    }

    const totalScore = taskEvaluations.reduce((sum, task) => {
      return sum + (scoreMap[task.score] || 0)
    }, 0)

    return Math.round(totalScore / taskEvaluations.length)
  }

  async getTaskEvaluations(serverId: string): Promise<TaskEvaluation[]> {
    const data = await this.getServerData(serverId)
    return data?.toolEvaluation.taskEvaluations || []
  }

  async getSecurityAnalysis(serverId: string): Promise<SecurityAnalysis | null> {
    const data = await this.getServerData(serverId)
    return data?.securityAnalysis || null
  }

  async getEvaluationRun(serverId: string): Promise<EvaluationRun | null> {
    const data = await this.getServerData(serverId)
    return data?.evaluationRun || null
  }

  // Helper method to get available server IDs
  getAvailableServerIds(): string[] {
    try {
      const files = fs.readdirSync(this.dataPath)
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => path.basename(file, '.json'))
    } catch (error) {
      console.error('Error getting available server IDs:', error)
      return []
    }
  }
}

export const dataLoader = new DataLoader()
