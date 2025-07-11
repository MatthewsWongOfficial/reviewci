"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Link, AlertCircle, ExternalLink } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingSpinner } from "@/components/loading-spinner"
import { validateUrl, sanitizeInput } from "@/lib/validation"
import type { AnalysisConfig } from "@/lib/types"

interface UrlInputProps {
  onAnalyze: (content: string, filename?: string) => void
  isAnalyzing: boolean
  config: AnalysisConfig
}

export function UrlInput({ onAnalyze, isAnalyzing, config }: UrlInputProps) {
  const [url, setUrl] = useState("")
  const [error, setError] = useState("")
  const [isFetching, setIsFetching] = useState(false)

  const handleFetch = async () => {
    if (!url.trim()) return

    setError("")
    setIsFetching(true)

    try {
      const validation = validateUrl(url)
      if (!validation.isValid) {
        setError(validation.error || "Invalid URL")
        return
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), config.timeout)

      const response = await fetch(`/api/fetch-yaml?url=${encodeURIComponent(url)}`, {
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch YAML file`)
      }

      const content = await response.text()
      const sanitized = sanitizeInput(content)
      const filename = url.split("/").pop() || "remote-file.yml"
      onAnalyze(sanitized, filename)
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          setError("Request timed out. Please try again or check the URL.")
        } else {
          setError(err.message)
        }
      } else {
        setError("Failed to fetch the YAML file. Please check the URL and try again.")
      }
    } finally {
      setIsFetching(false)
    }
  }

  const exampleUrls = [
    {
      name: "GitHub Actions Example",
      url: "https://raw.githubusercontent.com/actions/starter-workflows/main/ci/node.js.yml",
    },
    {
      name: "Bitbucket Pipeline Example",
      url: "https://bitbucket.org/atlassian/pipelines-examples-go/raw/e3b9902ddf1111ff469c00c68f6eb47ad9b09f73/bitbucket-pipelines.yml",
    },
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="url"
                  placeholder="https://raw.githubusercontent.com/user/repo/main/.github/workflows/ci.yml"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full"
                  disabled={isFetching || isAnalyzing}
                />
              </div>
              <Button
                onClick={handleFetch}
                disabled={!url.trim() || isFetching || isAnalyzing}
                className="flex items-center gap-2 min-w-[120px]"
              >
                {isFetching ? <LoadingSpinner size="sm" /> : <Link className="h-4 w-4" />}
                {isFetching ? "Fetching..." : "Fetch & Analyze"}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {exampleUrls.map((example) => (
                <Button
                  key={example.name}
                  variant="outline"
                  size="sm"
                  onClick={() => setUrl(example.url)}
                  className="text-xs"
                  disabled={isFetching || isAnalyzing}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  {example.name}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="text-xs text-slate-500 space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="font-medium mb-1">Supported URL Patterns:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>GitHub: raw.githubusercontent.com</li>
              <li>GitLab: gitlab.com/-/raw/</li>
              <li>Bitbucket: bitbucket.org/raw/</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-1">Security Notes:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Only public repositories supported</li>
              <li>URLs are validated for security</li>
              <li>Requests timeout after {config.timeout / 1000}s</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
