"use client"

import React, { useState, useEffect } from 'react'

import type { SecurityCheckSummary } from '@/app/types/security'

interface SecurityDescriptionProps {
  score: number
  passedChecks: number
  totalChecks: number
  securityChecks?: SecurityCheckSummary[]
}

interface SecurityDescriptionResponse {
  description?: string
}

export const SecurityDescription: React.FC<SecurityDescriptionProps> = ({
  score,
  passedChecks,
  totalChecks,
  securityChecks
}) => {
  const [description, setDescription] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDescription = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/security-description', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            score,
            passedChecks,
            totalChecks,
            securityChecks
          })
        })

        const data: SecurityDescriptionResponse = await response.json()
        setDescription(data.description ?? '')
      } catch (error) {
        console.error('Failed to fetch security description:', error)
        // Fallback description
        setDescription(getFallbackDescription(score, securityChecks))
      } finally {
        setLoading(false)
      }
    }

    fetchDescription()
  }, [score, passedChecks, totalChecks, securityChecks])

  const getFallbackDescription = (score: number, securityChecks?: SecurityCheckSummary[]): string => {
    // Analyze security checks for more contextual fallback
    if (securityChecks && securityChecks.length > 0) {
      const criticalFailures = securityChecks.filter(c => c.status === 'failed' && c.severity === 'critical')
      const categories = [...new Set(
        securityChecks
          .map(c => c.category)
          .filter((category): category is string => Boolean(category))
      )]

      if (criticalFailures.length > 0 && categories.length > 0) {
        return `Critical security vulnerabilities identified in ${categories.join(', ')} requiring immediate remediation to ensure MCP server integrity.`
      }

      if (score >= 90 && categories.length > 0) {
        return `Strong security implementation across ${categories.join(', ')} domains with comprehensive protection measures in place.`
      }

      if (score >= 70 && categories.length > 0) {
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

  if (loading) {
    return (
      <p className="uppercase text-xs mb-3 animate-pulse">
        Generating security analysis...
      </p>
    )
  }

  return (
    <p className="uppercase text-xs mb-3">
      {description}
    </p>
  )
}
