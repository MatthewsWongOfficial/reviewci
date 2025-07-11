"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GitBranch, AlertCircle } from "lucide-react"
import { useEffect, useRef } from "react"

interface JobDependencyGraphProps {
  dependencyGraph?: string
  platform: string
}

export function JobDependencyGraph({ dependencyGraph, platform }: JobDependencyGraphProps) {
  const mermaidRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (dependencyGraph && mermaidRef.current) {
      // In a real implementation, you would use the mermaid library here
      // For now, we'll display the raw mermaid syntax
      const renderMermaid = async () => {
        try {
          // This would be: const mermaid = await import('mermaid')
          // mermaid.default.render('graph', dependencyGraph, (svgCode) => {
          //   if (mermaidRef.current) {
          //     mermaidRef.current.innerHTML = svgCode
          //   }
          // })

          // For demo purposes, we'll show the mermaid syntax
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = `<pre class="text-sm bg-slate-100 p-4 rounded-lg overflow-x-auto"><code>${dependencyGraph}</code></pre>`
          }
        } catch (error) {
          console.error("Failed to render mermaid diagram:", error)
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = `<div class="text-center text-slate-500 py-8">Failed to render dependency graph</div>`
          }
        }
      }

      renderMermaid()
    }
  }, [dependencyGraph])

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "github-actions":
        return "bg-gray-100 text-gray-800"
      case "gitlab-ci":
        return "bg-orange-100 text-orange-800"
      case "bitbucket-pipelines":
        return "bg-blue-100 text-blue-800"
      case "jenkins":
        return "bg-purple-100 text-purple-800"
      case "azure-devops":
        return "bg-blue-100 text-blue-800"
      case "circleci":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-4">
      <Card className="bg-white/70 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Job Dependencies
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            Visual representation of job dependencies and execution flow
            <Badge className={`text-xs ${getPlatformColor(platform)}`}>
              {platform.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dependencyGraph ? (
            <div className="space-y-4">
              <div className="text-sm text-slate-600 mb-4">
                This diagram shows how your jobs are connected and their execution order:
              </div>

              <div
                ref={mermaidRef}
                className="border border-slate-200 rounded-lg bg-white p-4 min-h-[200px] flex items-center justify-center"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">Parallel</div>
                  <div className="text-sm text-green-700">Jobs without dependencies</div>
                </div>

                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">Sequential</div>
                  <div className="text-sm text-blue-700">Jobs with dependencies</div>
                </div>

                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">Optimized</div>
                  <div className="text-sm text-purple-700">Efficient execution flow</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-600">No Dependency Graph Available</h3>
                <p className="text-slate-500 mt-2">
                  {platform === "unknown"
                    ? "Unable to generate dependency graph for unknown platform"
                    : "This configuration doesn't have complex job dependencies to visualize"}
                </p>

                {platform !== "unknown" && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      💡 <strong>Tip:</strong> Add job dependencies using the{" "}
                      <code className="bg-blue-100 px-1 rounded">needs</code> keyword to create more complex workflows
                      and see dependency visualization.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dependency Analysis */}
      {dependencyGraph && (
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <CardHeader>
            <CardTitle>Dependency Analysis</CardTitle>
            <CardDescription>Insights about your job execution flow</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium text-slate-900">Execution Characteristics</h4>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Jobs without dependencies run in parallel
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Sequential jobs wait for dependencies
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Critical path determines total runtime
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-slate-900">Optimization Tips</h4>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    Minimize sequential dependencies
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    Balance job complexity
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    Avoid circular dependencies
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
