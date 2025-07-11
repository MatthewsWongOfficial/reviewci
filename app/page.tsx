"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Link, FileText, Settings, Zap, Shield, BarChart3, Linkedin } from "lucide-react"
import { FileUpload } from "@/components/file-upload"
import { UrlInput } from "@/components/url-input"
import { DirectInput } from "@/components/direct-input"
import { AnalysisResults } from "@/components/analysis-results"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Toast } from "@/components/toast"
import { ErrorBoundary } from "@/components/error-boundary"
import { analyzeCICD } from "@/lib/analyzer"
import type { AnalysisResult, AnalysisConfig } from "@/lib/types"
import { useMobile } from "@/hooks/use-mobile" // Import useMobile hook

export default function CICDAnalyzer() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [config, setConfig] = useState<AnalysisConfig>({
    platform: "auto",
    strictMode: false,
    enablePerformanceAnalysis: true,
    enableSecurityAnalysis: true,
    enableCostAnalysis: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    timeout: 30000, // 30 seconds
  })
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [hasShownMobileWarning, setHasShownMobileWarning] = useState(false) // State to track if warning has been shown

  // Ref for scrolling to results
  const resultsRef = useRef<HTMLDivElement>(null)

  const isMobile = useMobile()

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 10000)
  }, [])

  // Effect for mobile/unoptimized screen warning
  useEffect(() => {
    if (isMobile && !hasShownMobileWarning) {
      showToast("For the best experience, please use a larger screen or desktop.", "info") // Changed type to 'info' for a softer warning
      setHasShownMobileWarning(true)
    }
  }, [isMobile, hasShownMobileWarning, showToast])

  const handleAnalyze = async (content: string, filename?: string) => {
    setIsAnalyzing(true)
    try {
      const result = await analyzeCICD(content, filename, config)
      setAnalysisResult(result)
      showToast("Analysis completed successfully!", "success")
    } catch (error) {
      console.error("Analysis failed:", error)
      showToast(error instanceof Error ? error.message : "Analysis failed", "error")
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Auto-scroll to results when analysis is complete
  useEffect(() => {
    if (analysisResult && !isAnalyzing && resultsRef.current) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest",
        })
      }, 100)
    }
  }, [analysisResult, isAnalyzing])

  const handleClearAll = () => {
    setAnalysisResult(null)
    showToast("Results cleared", "success")
  }

  const exportReport = (format: "markdown" | "json" | "csv") => {
    if (!analysisResult) return

    try {
      let content: string
      let filename: string
      let mimeType: string

      switch (format) {
        case "markdown":
          content = generateMarkdownReport(analysisResult)
          filename = `cicd-analysis-${Date.now()}.md`
          mimeType = "text/markdown"
          break
        case "json":
          content = JSON.stringify(analysisResult, null, 2)
          filename = `cicd-analysis-${Date.now()}.json`
          mimeType = "application/json"
          break
        case "csv":
          content = generateCSVReport(analysisResult)
          filename = `cicd-analysis-${Date.Now()}.csv`
          mimeType = "text/csv"
          break
      }

      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      showToast(`Report exported as ${format.toUpperCase()}`, "success")
    } catch (error) {
      showToast("Failed to export report", "error")
    }
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header - Static, no sticky behavior */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50">
          <div className="max-w-7xl mx-auto px-4 py-6 relative">
            {" "}
            {/* Added relative for absolute positioning */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  CI/CD Optimizer
                </h1>
              </div>
              <p className="text-lg text-slate-600 max-w-3xl mx-auto">
                Enterprise-grade CI/CD pipeline analyzer with advanced security scanning, cost optimization, and
                performance insights for DevOps teams.
              </p>
              <div className="flex justify-center gap-2 flex-wrap">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  GitHub Actions
                </Badge>
                <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                  GitLab CI
                </Badge>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  Bitbucket
                </Badge>
              </div>
            </div>
            {/* LinkedIn Profile Icon - Moved to top-right corner */}
            <a
              href="https://linkedin.com/in/your-profile"
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-4 right-4 flex items-center gap-1 text-slate-600 hover:text-blue-600 transition-colors text-sm"
              title="Connect on LinkedIn"
            >
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </a>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4 space-y-6">
          {/* Configuration Panel */}
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Analysis Configuration
              </CardTitle>
              <CardDescription>Configure analysis parameters and platform-specific settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="platform">Target Platform</Label>
                  <Select
                    value={config.platform}
                    onValueChange={(value) => setConfig({ ...config, platform: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Auto-detect" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto-detect</SelectItem>
                      <SelectItem value="github-actions">GitHub Actions</SelectItem>
                      <SelectItem value="gitlab-ci">GitLab CI</SelectItem>
                      <SelectItem value="bitbucket-pipelines">Bitbucket Pipelines</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="strict-mode"
                    checked={config.strictMode}
                    onCheckedChange={(checked) => setConfig({ ...config, strictMode: checked })}
                  />
                  <Label htmlFor="strict-mode">Strict Mode</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="performance"
                    checked={config.enablePerformanceAnalysis}
                    onCheckedChange={(checked) => setConfig({ ...config, enablePerformanceAnalysis: checked })}
                  />
                  <Label htmlFor="performance" className="flex items-center gap-1">
                    <BarChart3 className="h-4 w-4" />
                    Performance
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="security"
                    checked={config.enableSecurityAnalysis}
                    onCheckedChange={(checked) => setConfig({ ...config, enableSecurityAnalysis: checked })}
                  />
                  <Label htmlFor="security" className="flex items-center gap-1">
                    <Shield className="h-4 w-4" />
                    Security
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Input Section */}
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Input Your CI/CD Configuration
              </CardTitle>
              <CardDescription>
                Upload YAML files, provide URLs, or paste configurations directly. Supports all major CI/CD platforms.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="upload" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload File
                  </TabsTrigger>
                  <TabsTrigger value="url" className="flex items-center gap-2">
                    <Link className="h-4 w-4" />
                    From URL
                  </TabsTrigger>
                  <TabsTrigger value="direct" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Direct Input
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="mt-4">
                  <FileUpload onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} config={config} />
                </TabsContent>

                <TabsContent value="url" className="mt-4">
                  <UrlInput onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} config={config} />
                </TabsContent>

                <TabsContent value="direct" className="mt-4">
                  <DirectInput onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} config={config} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Loading State */}
          {isAnalyzing && (
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50 shadow-lg">
              <CardContent className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
                <div className="ml-4 text-center">
                  <h3 className="text-lg font-semibold">Analyzing CI/CD Configuration</h3>
                  <p className="text-slate-600">Running comprehensive analysis...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Section - with ref for auto-scroll */}
          {analysisResult && !isAnalyzing && (
            <div ref={resultsRef} className="space-y-6">
              {/* Score Overview */}
              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <div
                        className={`p-2 rounded-lg ${
                          analysisResult.score >= 80
                            ? "bg-green-100 text-green-600"
                            : analysisResult.score >= 60
                              ? "bg-yellow-100 text-yellow-600"
                              : "bg-red-100 text-red-600"
                        }`}
                      >
                        <BarChart3 className="h-5 w-5" />
                      </div>
                      Analysis Results
                    </CardTitle>
                    <CardDescription>
                      Platform: {analysisResult.platform} • Score: {analysisResult.score}/100 •{" "}
                      {analysisResult.issues.length} issues found
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={handleClearAll} variant="outline" size="sm">
                      Clear All
                    </Button>
                    <Select onValueChange={(format) => exportReport(format as any)}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Export" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="markdown">Markdown</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-500">
                        {analysisResult.issues.filter((i) => i.severity === "error").length}
                      </div>
                      <div className="text-sm text-slate-600">Errors</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-500">
                        {analysisResult.issues.filter((i) => i.severity === "warning").length}
                      </div>
                      <div className="text-sm text-slate-600">Warnings</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-500">
                        {analysisResult.issues.filter((i) => i.severity === "info").length}
                      </div>
                      <div className="text-sm text-slate-600">Info</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-500">{analysisResult.optimizations.length}</div>
                      <div className="text-sm text-slate-600">Optimizations</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-500">
                        {analysisResult.securityReport?.vulnerabilities.length || 0}
                      </div>
                      <div className="text-sm text-slate-600">Security</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <AnalysisResults result={analysisResult} />
            </div>
          )}
        </div>

        {/* Toast Notifications */}
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </ErrorBoundary>
  )
}

function generateMarkdownReport(result: AnalysisResult): string {
  const date = new Date().toLocaleDateString()

  return `# CI/CD Analysis Report

**Generated:** ${date}  
**Platform:** ${result.platform}  
**Score:** ${result.score}/100

## Executive Summary

- **Total Issues:** ${result.issues.length}
- **Errors:** ${result.issues.filter((i) => i.severity === "error").length}
- **Warnings:** ${result.issues.filter((i) => i.severity === "warning").length}
- **Optimizations:** ${result.optimizations.length}
- **Security Vulnerabilities:** ${result.securityReport?.vulnerabilities.length || 0}

## Issues

${result.issues
  .map(
    (issue) => `
### ${issue.severity.toUpperCase()}: ${issue.title}

**Category:** ${issue.category}  
**Rule ID:** ${issue.ruleId || "N/A"}  
**Line:** ${issue.line || "N/A"}  
**Impact:** ${issue.impact || "Unknown"}

${issue.description}

${issue.suggestion ? `**Suggestion:** ${issue.suggestion}` : ""}
${issue.exampleCode ? `\n**Example:**\n\`\`\`yaml\n${issue.exampleCode}\n\`\`\`` : ""}
`,
  )
  .join("\n")}

## Optimization Opportunities

${result.optimizations
  .map(
    (opt) => `
### ${opt.title}

**Impact:** ${opt.impact}  
**Effort:** ${opt.effort}

${opt.description}

${opt.suggestion ? `**How to fix:** ${opt.suggestion}` : ""}
`,
  )
  .join("\n")}

${
  result.securityReport
    ? `
## Security Report

**Overall Score:** ${result.securityReport.overallScore}/100

### Vulnerabilities
${result.securityReport.vulnerabilities
  .map(
    (vuln) => `
- **${vuln.severity.toUpperCase()}:** ${vuln.title}
  - ${vuln.description}
`,
  )
  .join("\n")}
`
    : ""
}

${
  result.costEstimation
    ? `
## Cost Estimation

**Current Monthly Cost:** $${result.costEstimation.currentMonthlyCost}  
**Potential Savings:** $${result.costEstimation.potentialSavings}  
**Optimized Cost:** $${result.costEstimation.optimizedMonthlyCost}

### Recommendations
${result.costEstimation.recommendations.map((rec) => `- ${rec}`).join("\n")}
`
    : ""
}

---
*Generated by CI/CD Optimizer*
`
}

function generateCSVReport(result: AnalysisResult): string {
  const headers = [
    "Type",
    "Severity",
    "Category",
    "Title",
    "Description",
    "Line",
    "Rule ID",
    "Impact",
    "Fixable",
    "Estimated Fix Time",
  ]

  const rows = result.issues.map((issue) => [
    "Issue",
    issue.severity,
    issue.category,
    issue.title,
    issue.description.replace(/"/g, '""'),
    issue.line || "",
    issue.ruleId || "",
    issue.impact || "",
    issue.fixable ? "Yes" : "No",
    issue.estimatedFixTime || "",
  ])

  result.optimizations.forEach((opt) => {
    rows.push([
      "Optimization",
      opt.impact,
      "optimization",
      opt.title,
      opt.description.replace(/"/g, '""'),
      "",
      "",
      opt.impact,
      "Yes",
      opt.effort,
    ])
  })

  return [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")
}
