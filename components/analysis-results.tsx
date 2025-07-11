"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertTriangle,
  XCircle,
  Info,
  Zap,
  Shield,
  Clock,
  Trash2,
  GitBranch,
  TrendingUp,
  DollarSign,
  BarChart3,
  Target,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { AdvancedMetrics } from "@/components/advanced-metrics"
import { SecurityReport } from "@/components/security-report"
import { CostEstimator } from "@/components/cost-estimator"
import { JobDependencyGraph } from "@/components/job-dependency-graph"
import { CodeHighlighter } from "@/components/code-highlighter"
import type { AnalysisResult, Issue, Optimization } from "@/lib/types"

interface AnalysisResultsProps {
  result: AnalysisResult
}

export function AnalysisResults({ result }: AnalysisResultsProps) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "security":
        return <Shield className="h-4 w-4" />
      case "performance":
        return <Clock className="h-4 w-4" />
      case "optimization":
        return <Zap className="h-4 w-4" />
      case "cleanup":
        return <Trash2 className="h-4 w-4" />
      case "maintainability":
        return <Target className="h-4 w-4" />
      case "compliance":
        return <CheckCircle2 className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getImpactColor = (impact?: string) => {
    switch (impact) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200"
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "low":
        return "text-green-600 bg-green-50 border-green-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getSeverityBorderColor = (severity: string) => {
    switch (severity) {
      case "error":
        return "border-l-red-500"
      case "warning":
        return "border-l-yellow-500"
      case "info":
        return "border-l-blue-500"
      default:
        return "border-l-gray-500"
    }
  }

  const groupedIssues = result.issues.reduce(
    (acc, issue) => {
      if (!acc[issue.category]) acc[issue.category] = []
      acc[issue.category].push(issue)
      return acc
    },
    {} as Record<string, Issue[]>,
  )

  const groupedOptimizations = result.optimizations.reduce(
    (acc, opt) => {
      if (!acc[opt.impact]) acc[opt.impact] = []
      acc[opt.impact].push(opt)
      return acc
    },
    {} as Record<string, Optimization[]>,
  )

  return (
    <div className="space-y-6">
      <Tabs defaultValue="issues" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="issues" className="flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            Issues ({result.issues.length})
          </TabsTrigger>
          <TabsTrigger value="optimizations" className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            Optimizations ({result.optimizations.length})
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-1">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="cost" className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            Cost
          </TabsTrigger>
          <TabsTrigger value="dependencies" className="flex items-center gap-1">
            <GitBranch className="h-4 w-4" />
            Dependencies
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" />
            Metrics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="issues" className="space-y-4">
          {Object.entries(groupedIssues).map(([category, issues]) => (
            <Card key={category} className="bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 capitalize">
                  {getCategoryIcon(category)}
                  {category} Issues ({issues.length})
                </CardTitle>
                <CardDescription>
                  Issues that may affect your CI/CD pipeline's reliability, security, or performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {issues.map((issue, index) => (
                  <Alert
                    key={index}
                    className={`${
                      issue.severity === "error"
                        ? "border-red-200 bg-red-50/50"
                        : issue.severity === "warning"
                          ? "border-yellow-200 bg-yellow-50/50"
                          : "border-blue-200 bg-blue-50/50"
                    } transition-all hover:shadow-md border-l-4 ${getSeverityBorderColor(issue.severity)}`}
                  >
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(issue.severity)}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <h4 className="font-semibold text-slate-900">{issue.title}</h4>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant="outline" className="text-xs">
                              {issue.severity}
                            </Badge>
                            {issue.impact && (
                              <Badge className={`text-xs ${getImpactColor(issue.impact)}`}>{issue.impact} impact</Badge>
                            )}
                            {issue.line && (
                              <Badge variant="secondary" className="text-xs">
                                Line {issue.line}
                              </Badge>
                            )}
                            {issue.fixable && (
                              <Badge className="text-xs bg-green-100 text-green-700">Auto-fixable</Badge>
                            )}
                          </div>
                        </div>

                        <AlertDescription className="text-sm text-slate-700">{issue.description}</AlertDescription>

                        {issue.suggestion && (
                          <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                            <p className="text-sm font-medium text-blue-900 mb-1">💡 Suggestion:</p>
                            <p className="text-sm text-blue-800">{issue.suggestion}</p>
                          </div>
                        )}

                        {issue.exampleCode && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-slate-700">Example fix:</p>
                            <CodeHighlighter
                              code={issue.exampleCode}
                              language="yaml"
                              highlightLines={issue.lineNumbers}
                              severity={issue.severity}
                            />
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <div className="flex items-center gap-4">
                            {issue.ruleId && <span>Rule: {issue.ruleId}</span>}
                            {issue.estimatedFixTime && <span>Fix time: {issue.estimatedFixTime}</span>}
                          </div>
                          {issue.documentationUrl && (
                            <a
                              href={issue.documentationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              Learn more →
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          ))}

          {Object.keys(groupedIssues).length === 0 && (
            <Card className="bg-green-50/50 border-green-200">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-green-800">No Issues Found!</h3>
                  <p className="text-green-700">Your CI/CD configuration looks great.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="optimizations" className="space-y-4">
          {Object.entries(groupedOptimizations).map(([impact, optimizations]) => (
            <Card key={impact} className="bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 capitalize">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  {impact} Impact Optimizations ({optimizations.length})
                </CardTitle>
                <CardDescription>
                  Opportunities to improve your pipeline's performance, cost-efficiency, and maintainability
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {optimizations.map((opt, index) => (
                  <Alert
                    key={index}
                    className="border-green-200 bg-green-50/50 hover:shadow-md transition-all border-l-4 border-l-green-500"
                  >
                    <div className="flex items-start gap-3">
                      <Zap className="h-4 w-4 text-green-600 mt-0.5" />
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <h4 className="font-semibold text-green-900">{opt.title}</h4>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge className="text-xs bg-green-100 text-green-800">{opt.effort} effort</Badge>
                            <Badge className={`text-xs ${getImpactColor(opt.impact)}`}>{opt.impact} impact</Badge>
                            {opt.category && (
                              <Badge variant="outline" className="text-xs">
                                {opt.category}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <AlertDescription className="text-sm text-green-800">{opt.description}</AlertDescription>

                        {opt.suggestion && (
                          <div className="p-3 bg-white rounded-lg border-l-4 border-green-400">
                            <p className="text-sm font-medium text-green-900 mb-1">🚀 Implementation:</p>
                            <p className="text-sm text-green-800">{opt.suggestion}</p>
                          </div>
                        )}

                        {opt.exampleCode && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-slate-700">Example implementation:</p>
                            <CodeHighlighter
                              code={opt.exampleCode}
                              language="yaml"
                              highlightLines={opt.lineNumbers}
                              severity="info"
                            />
                          </div>
                        )}

                        {opt.estimatedSavings && (
                          <div className="flex items-center gap-2 text-sm text-green-700">
                            <DollarSign className="h-4 w-4" />
                            <span>Estimated savings: {opt.estimatedSavings}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          ))}

          {Object.keys(groupedOptimizations).length === 0 && (
            <Card className="bg-blue-50/50 border-blue-200">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-blue-800">Fully Optimized!</h3>
                  <p className="text-blue-700">No additional optimizations found.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          {result.securityReport ? (
            <SecurityReport report={result.securityReport} />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Shield className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-600">Security Analysis Disabled</h3>
                  <p className="text-slate-500">Enable security analysis in configuration to see security insights.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="cost" className="space-y-4">
          {result.costEstimation ? (
            <CostEstimator estimation={result.costEstimation} />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <DollarSign className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-600">Cost Analysis Disabled</h3>
                  <p className="text-slate-500">Enable cost analysis in configuration to see cost insights.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="dependencies" className="space-y-4">
          <JobDependencyGraph dependencyGraph={result.dependencyGraph} platform={result.platform} />
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          {result.metrics ? (
            <AdvancedMetrics metrics={result.metrics} />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-600">No Metrics Available</h3>
                  <p className="text-slate-500">Metrics could not be calculated for this configuration.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Recommendations Summary */}
      {result.recommendations && result.recommendations.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Top Recommendations
            </CardTitle>
            <CardDescription>Priority actions to improve your CI/CD pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {result.recommendations.slice(0, 3).map((rec, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-white/70 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-700">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900">{rec.title}</h4>
                    <p className="text-sm text-slate-600 mt-1">{rec.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={`text-xs ${getImpactColor(rec.priority)}`}>{rec.priority} priority</Badge>
                      <Badge variant="outline" className="text-xs">
                        {rec.effort} effort
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {rec.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
