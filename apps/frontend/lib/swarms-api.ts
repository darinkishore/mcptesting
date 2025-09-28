interface SwarmsCompletionRequest {
  name: string
  description: string
  swarm_type: string
  task: string
  agents: Array<{
    agent_name: string
    description: string
    system_prompt: string
    model_name: string
    max_loops: number
    temperature: number
  }>
  max_loops: number
}

interface SwarmsCompletionResponse {
  id: string
  status: string
  result?: string
  error?: string
}

export class SwarmsAPI {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.SWARMS_API_KEY || ''
    this.baseUrl = 'https://api.swarms.world/v1'
  }

  async generateSecurityDescription(
    score: number,
    passedChecks: number,
    totalChecks: number,
    securityChecks?: Array<{ name: string; status: string; severity: string }>
  ): Promise<string> {
    const failedChecks = totalChecks - passedChecks
    const scoreCategory = score >= 90 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'fair' : 'poor'

    const checksContext = securityChecks
      ? securityChecks.map(check => `${check.name}: ${check.status} (${check.severity})`).join(', ')
      : 'Standard MCP security validation checks'

    const task = `Generate a concise, professional security analysis description for an MCP server with:
- Security score: ${score}%
- Status: ${passedChecks}/${totalChecks} checks passed (${failedChecks} failed)
- Performance level: ${scoreCategory}
- Security checks: ${checksContext}

The description should be 1-2 sentences, professional tone, and focus on the security posture without repeating the exact numbers.`

    const request: SwarmsCompletionRequest = {
      name: "Security Analysis Description Generator",
      description: "Generates professional security analysis descriptions for MCP servers",
      swarm_type: "SequentialWorkflow",
      task,
      agents: [
        {
          agent_name: "Security Analyst",
          description: "Analyzes security metrics and generates professional descriptions",
          system_prompt: "You are a cybersecurity expert who writes concise, professional security analysis descriptions. Focus on security posture, risk assessment, and overall compliance without repeating exact numbers that are already displayed elsewhere. Keep descriptions to 1-2 sentences maximum. Use technical but accessible language.",
          model_name: "gpt-4o",
          max_loops: 1,
          temperature: 0.3
        }
      ],
      max_loops: 1
    }

    try {
      const response = await fetch(`${this.baseUrl}/swarm/completions`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error(`Swarms API error: ${response.statusText}`)
      }

      const data: SwarmsCompletionResponse = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      return data.result || this.getFallbackDescription(score, passedChecks, totalChecks)
    } catch (error) {
      console.error('Swarms API error:', error)
      return this.getFallbackDescription(score, passedChecks, totalChecks)
    }
  }

  private getFallbackDescription(score: number, passedChecks: number, totalChecks: number): string {
    const failedChecks = totalChecks - passedChecks

    if (score >= 90) {
      return "Excellent security posture with robust compliance across all critical security domains."
    } else if (score >= 70) {
      return "Good security implementation with minor areas for improvement in security controls."
    } else if (score >= 50) {
      return "Moderate security compliance with several areas requiring immediate attention and remediation."
    } else {
      return "Critical security vulnerabilities detected requiring urgent remediation across multiple security domains."
    }
  }
}

export const swarmsAPI = new SwarmsAPI()