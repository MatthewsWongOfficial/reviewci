"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"

interface CodeHighlighterProps {
  code: string
  language?: string
  highlightLines?: number[]
  severity?: "error" | "warning" | "info"
}

export function CodeHighlighter({
  code,
  language = "yaml",
  highlightLines = [],
  severity = "info",
}: CodeHighlighterProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy code:", err)
    }
  }

  const getHighlightColor = (lineNumber: number) => {
    if (!highlightLines.includes(lineNumber)) return ""

    switch (severity) {
      case "error":
        return "bg-red-100 border-l-4 border-red-500"
      case "warning":
        return "bg-yellow-100 border-l-4 border-yellow-500"
      case "info":
        return "bg-blue-100 border-l-4 border-blue-500"
      default:
        return "bg-gray-100 border-l-4 border-gray-500"
    }
  }

  const lines = code.split("\n")

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500 font-medium uppercase">{language}</span>
        <Button onClick={copyToClipboard} variant="outline" size="sm" className="h-6 px-2 text-xs bg-transparent">
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      <div className="bg-slate-900 rounded-lg overflow-hidden">
        <div className="flex">
          {/* Line numbers */}
          <div className="bg-slate-800 px-3 py-2 text-slate-400 text-sm font-mono select-none">
            {lines.map((_, index) => (
              <div key={index} className="leading-6">
                {index + 1}
              </div>
            ))}
          </div>

          {/* Code content */}
          <div className="flex-1 overflow-x-auto">
            <pre className="p-2 text-sm">
              {lines.map((line, index) => (
                <div key={index} className={`leading-6 px-2 ${getHighlightColor(index + 1)}`}>
                  <code className="text-slate-100">{line || " "}</code>
                </div>
              ))}
            </pre>
          </div>
        </div>
      </div>

      {highlightLines.length > 0 && (
        <div className="mt-2 text-xs text-slate-600">
          <span className="font-medium">Highlighted lines:</span> {highlightLines.join(", ")}
          <span
            className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
              severity === "error"
                ? "bg-red-100 text-red-700"
                : severity === "warning"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-blue-100 text-blue-700"
            }`}
          >
            {severity === "error"
              ? "Critical Fix Required"
              : severity === "warning"
                ? "Needs Attention"
                : "Suggested Improvement"}
          </span>
        </div>
      )}
    </div>
  )
}
