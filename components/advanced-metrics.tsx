"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Clock, Zap, Target, FileText, Shield, TestTube } from "lucide-react"
import type { Metrics } from "@/lib/types"

interface AdvancedMetricsProps {
  metrics: Metrics
}

export function AdvancedMetrics({ metrics }: AdvancedMetricsProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-100"
    if (score >= 60) return "bg-yellow-100"
    return "bg-red-100"
  }

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 60) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/70 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Jobs Count
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.jobsCount}</div>
            <p className="text-xs text-slate-500">Total jobs defined</p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Steps Count
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.stepsCount}</div>
            <p className="text-xs text-slate-500">Total steps across all jobs</p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Triggers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.triggersCount}</div>
            <p className="text-xs text-slate-500">Event triggers configured</p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(metrics.securityScore)}`}>
              {metrics.securityScore}/100
            </div>
            <p className="text-xs text-slate-500">Security best practices</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card className="bg-white/70 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
          <CardDescription>Pipeline performance and efficiency indicators</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Parallelization Score</span>
                <span className={`text-sm font-bold ${getScoreColor(metrics.performance.parallelizationScore)}`}>
                  {metrics.performance.parallelizationScore}%
                </span>
              </div>
              <Progress value={metrics.performance.parallelizationScore} className="h-2" />
              <p className="text-xs text-slate-500">How well jobs can run in parallel</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Cache Efficiency</span>
                <span className={`text-sm font-bold ${getScoreColor(metrics.performance.cacheEfficiency)}`}>
                  {metrics.performance.cacheEfficiency}%
                </span>
              </div>
              <Progress value={metrics.performance.cacheEfficiency} className="h-2" />
              <p className="text-xs text-slate-500">Effectiveness of caching strategies</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Resource Utilization</span>
                <span className={`text-sm font-bold ${getScoreColor(metrics.performance.resourceUtilization)}`}>
                  {metrics.performance.resourceUtilization}%
                </span>
              </div>
              <Progress value={metrics.performance.resourceUtilization} className="h-2" />
              <p className="text-xs text-slate-500">How efficiently resources are used</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Estimated Build Time</span>
                <span className="text-sm font-bold">{metrics.performance.estimatedBuildTime} min</span>
              </div>
              <div className="text-xs text-slate-500">Approximate pipeline duration</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Complexity Metrics */}
      <Card className="bg-white/70 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Complexity Analysis
          </CardTitle>
          <CardDescription>Code complexity and maintainability metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-700">{metrics.complexity.cyclomaticComplexity}</div>
              <div className="text-sm text-slate-600">Cyclomatic Complexity</div>
              <Badge variant="outline" className="mt-2 text-xs">
                {metrics.complexity.cyclomaticComplexity <= 10 ? "Good" : "Complex"}
              </Badge>
            </div>

            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-700">{metrics.complexity.cognitiveComplexity}</div>
              <div className="text-sm text-slate-600">Cognitive Complexity</div>
              <Badge variant="outline" className="mt-2 text-xs">
                {metrics.complexity.cognitiveComplexity <= 15 ? "Good" : "Complex"}
              </Badge>
            </div>

            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-700">{metrics.complexity.maintainabilityIndex}</div>
              <div className="text-sm text-slate-600">Maintainability Index</div>
              <Badge variant="outline" className="mt-2 text-xs">
                {metrics.complexity.maintainabilityIndex >= 70 ? "Good" : "Needs Work"}
              </Badge>
            </div>

            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-700">{metrics.complexity.linesOfCode}</div>
              <div className="text-sm text-slate-600">Lines of Code</div>
              <Badge variant="outline" className="mt-2 text-xs">
                Configuration Size
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coverage Metrics */}
      <Card className="bg-white/70 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Coverage Analysis
          </CardTitle>
          <CardDescription>Documentation, error handling, and testing coverage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documentation
                </span>
                <span className={`text-sm font-bold ${getScoreColor(metrics.coverage.documentationCoverage)}`}>
                  {metrics.coverage.documentationCoverage}%
                </span>
              </div>
              <Progress value={metrics.coverage.documentationCoverage} className="h-2" />
              <p className="text-xs text-slate-500">Jobs and steps with descriptions</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Error Handling
                </span>
                <span className={`text-sm font-bold ${getScoreColor(metrics.coverage.errorHandlingCoverage)}`}>
                  {metrics.coverage.errorHandlingCoverage}%
                </span>
              </div>
              <Progress value={metrics.coverage.errorHandlingCoverage} className="h-2" />
              <p className="text-xs text-slate-500">Steps with error handling</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  <TestTube className="h-4 w-4" />
                  Testing
                </span>
                <span className={`text-sm font-bold ${getScoreColor(metrics.coverage.testCoverage)}`}>
                  {metrics.coverage.testCoverage}%
                </span>
              </div>
              <Progress value={metrics.coverage.testCoverage} className="h-2" />
              <p className="text-xs text-slate-500">Pipeline includes testing steps</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Insights */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle>Pipeline Insights</CardTitle>
          <CardDescription>Key observations about your CI/CD configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-slate-900">Parallelizable Jobs</h4>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-green-600">{metrics.parallelizableJobs}</div>
                <div className="text-sm text-slate-600">out of {metrics.jobsCount} total jobs</div>
              </div>
              <p className="text-xs text-slate-500">Jobs that can run simultaneously</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-slate-900">Cache Usage</h4>
              <div className="flex items-center gap-2">
                <div className={`text-2xl font-bold ${getScoreColor(metrics.cacheUsage)}`}>{metrics.cacheUsage}%</div>
                <div className="text-sm text-slate-600">of jobs use caching</div>
              </div>
              <p className="text-xs text-slate-500">Percentage of jobs utilizing caching</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
