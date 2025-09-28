import { NextRequest, NextResponse } from 'next/server'

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

export async function POST(request: NextRequest) {
  let requestData: any

  try {
    requestData = await request.json()
    const { score, passedChecks, totalChecks, securityChecks } = requestData

    const apiKey = process.env.SWARMS_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Swarms API key not configured' },
        { status: 500 }
      )
    }

    // Organize security checks by category and status
    const checksByCategory: Record<string, { passed: any[], failed: any[] }> = {}
    const criticalIssues: any[] = []
    const warnings: any[] = []

    if (securityChecks) {
      securityChecks.forEach((check: any) => {
        const category = check.category || 'general'
        if (!checksByCategory[category]) {
          checksByCategory[category] = { passed: [], failed: [] }
        }

        if (check.status === 'passed') {
          checksByCategory[category].passed.push(check)
        } else {
          checksByCategory[category].failed.push(check)

          if (check.severity === 'critical') {
            criticalIssues.push(check)
          } else if (check.severity === 'high' || check.severity === 'medium') {
            warnings.push(check)
          }
        }
      })
    }

    // Create detailed analysis data for the AI
    const categoryAnalysis = Object.entries(checksByCategory).map(([category, checks]) => {
      const total = checks.passed.length + checks.failed.length
      const passRate = total > 0 ? (checks.passed.length / total * 100).toFixed(0) : '0'
      const failedChecks = checks.failed.map(c => `${c.name} (${c.severity})`).join(', ')

      return `${category.toUpperCase()}: ${checks.passed.length}/${total} passed (${passRate}%)${failedChecks ? ` - Failed: ${failedChecks}` : ''}`
    }).join('\n')

    const criticalSummary = criticalIssues.length > 0
      ? `Critical Issues (${criticalIssues.length}): ${criticalIssues.map(c => c.name).join(', ')}`
      : 'No critical security issues detected'

    const warningSummary = warnings.length > 0
      ? `Warnings (${warnings.length}): ${warnings.map(c => `${c.name} (${c.severity})`).join(', ')}`
      : 'No high/medium severity warnings'

    const task = `Analyze the following security assessment results for an MCP server and generate a professional 2-3 sentence summary:

OVERALL SCORE: ${score}% (${passedChecks}/${totalChecks} checks passed)

CATEGORY BREAKDOWN:
${categoryAnalysis}

SECURITY ISSUES:
${criticalSummary}
${warningSummary}

Generate a professional security analysis summary that:
1. Highlights the overall security posture
2. Mentions key areas of strength or concern based on the actual check results
3. Provides actionable insights without repeating exact numbers
4. Uses technical but accessible language`

    const swarmsRequest: SwarmsCompletionRequest = {
      name: "Security Analysis Description Generator",
      description: "Generates professional security analysis descriptions for MCP servers",
      swarm_type: "SequentialWorkflow",
      task,
      agents: [
        {
          agent_name: "Security Analyst",
          description: "Analyzes security metrics and generates professional descriptions",
          system_prompt: "You are a cybersecurity expert who analyzes detailed security assessment results. Your role is to synthesize complex security check data into actionable insights. Focus on identifying patterns in security failures, highlighting areas of strength, and providing context about the overall risk posture. Avoid repeating exact numbers or scores - instead, interpret what the results mean for security posture. Use technical terminology appropriately while remaining accessible to both technical and non-technical stakeholders.",
          model_name: "gpt-4o-mini",
          max_loops: 1,
          temperature: 0.3
        }
      ],
      max_loops: 1
    }

    const response = await fetch('https://api.swarms.world/v1/swarm/completions', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(swarmsRequest)
    })

    if (!response.ok) {
      throw new Error(`Swarms API error: ${response.statusText}`)
    }

    const data: SwarmsCompletionResponse = await response.json()

    if (data.error) {
      throw new Error(data.error)
    }

    const description = data.result || getFallbackDescription(score, securityChecks)

    return NextResponse.json({ description })

  } catch (error) {
    console.error('Swarms API error:', error)

    // Return fallback description on error using already parsed data
    if (requestData) {
      const { score, securityChecks } = requestData
      const fallbackDescription = getFallbackDescription(score, securityChecks)
      return NextResponse.json({ description: fallbackDescription })
    } else {
      // If we couldn't parse the request at all, return a generic fallback
      return NextResponse.json({
        description: "Unable to analyze security data. Please check the request format and try again."
      })
    }
  }
}

function getFallbackDescription(score: number, securityChecks?: any[]): string {
  // Analyze security checks for more contextual fallback
  if (securityChecks && securityChecks.length > 0) {
    const criticalFailures = securityChecks.filter(c => c.status === 'failed' && c.severity === 'critical')
    const categories = [...new Set(securityChecks.map(c => c.category))]

    if (criticalFailures.length > 0) {
      return `Critical security vulnerabilities identified in ${categories.join(', ')} requiring immediate remediation to ensure MCP server integrity.`
    }

    if (score >= 90) {
      return `Strong security implementation across ${categories.join(', ')} domains with comprehensive protection measures in place.`
    } else if (score >= 70) {
      return `Solid security foundation with room for enhancement in specific areas to achieve optimal protection levels.`
    }
  }

  // Default fallbacks if no check data available
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