'use client'

import React from 'react'

interface JsonBlockProps {
  data: unknown
  filename?: string
}

export function JsonBlock({ data, filename = 'evidence.json' }: JsonBlockProps) {
  const json = JSON.stringify(data, null, 2)

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(json)
    } catch {
      // Silently fail - clipboard API may not be available
    }
  }

  const onDownload = () => {
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="relative bg-gray-100 border-2 border-black">
      <pre className="m-0 p-3 overflow-x-auto text-xs font-mono">
        {json}
      </pre>
      <div className="absolute top-2 right-2 flex gap-2">
        <button
          onClick={onCopy}
          className="px-2 py-1 text-xs bg-white border-2 border-black hover:bg-gray-50 font-mono uppercase"
        >
          Copy
        </button>
        <button
          onClick={onDownload}
          className="px-2 py-1 text-xs bg-white border-2 border-black hover:bg-gray-50 font-mono uppercase"
        >
          Download
        </button>
      </div>
    </div>
  )
}