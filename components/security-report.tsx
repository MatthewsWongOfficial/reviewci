"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Shield, AlertTriangle, XCircle, CheckCircle, Key, Lock, Eye } from "lucide-react"
import type { SecurityReport as SecurityReportType } from "@/lib/types"

interface SecurityReportProps {
  report: SecurityReportType
}

export function SecurityReport({ report }: SecurityReportProps) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "high":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "medium":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "low":
        return <AlertTriangle className="h-4 w-4 text-blue-500" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "border-red-200 bg-red-50"
      case "high":
        return "border-red-200 bg-red-50"
      case "medium":
        return "border-yellow-200 bg-yellow-50"
      case "low":
        return "border-blue-200 bg-blue-50"
      default:
        return "border-gray-200 bg-gray-50"
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <Card className="bg-white/70 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Overview
          </CardTitle>
          <CardDescription>Overall security posture of your CI/CD pipeline</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(report.overallScore)}`}>
                {report.overallScore}/100
              </div>
              <div className="text-sm text-slate-600 mt-1">Overall Score</div>
              <Progress value={report.overallScore} className="mt-2 h-2" />
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{report.vulnerabilities.length}</div>
              <div className="text-sm text-slate-600 mt-1">Vulnerabilities</div>
              <div className="flex items-center justify-center gap-1 mt-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-xs text-slate-500">Security issues found</span>
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{report.exposedSecrets}</div>
              <div className="text-sm text-slate-600 mt-1">Exposed Secrets</div>
              <div className="flex items-center justify-center gap-1 mt-2">
                <Key className="h-4 w-4 text-orange-500" />
                <span className="text-xs text-slate-500">Potential secret leaks</span>
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">{report.unsafePermissions}</div>
              <div className="text-sm text-slate-600 mt-1">Permission Issues</div>
              <div className="flex items-center justify-center gap-1 mt-2">
                <Lock className="h-4 w-4 text-purple-500" />
                <span className="text-xs text-slate-500">Unsafe permissions</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vulnerabilities */}
      {report.vulnerabilities.length > 0 && (
        <Card className="bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Security Vulnerabilities ({report.vulnerabilities.length})
            </CardTitle>
            <CardDescription>Security issues that require immediate attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.vulnerabilities.map((vuln, index) => (
              <Alert key={index} className={getSeverityColor(vuln.severity)}>
                <div className="flex items-start gap-3">
                  {getSeverityIcon(vuln.severity)}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold">{vuln.title}</h4>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            vuln.severity === "critical"
                              ? "border-red-300 text-red-700"
                              : vuln.severity === "high"
                                ? "border-red-300 text-red-600"
                                : vuln.severity === "medium"
                                  ? "border-yellow-300 text-yellow-700"
                                  : "border-blue-300 text-blue-700"
                          }`}
                        >
                          {vuln.severity}
                        </Badge>
                        {vuln.line && (
                          <Badge variant="secondary" className="text-xs">
                            Line {vuln.line}
                          </Badge>
                        )}
                        {vuln.cwe && (
                          <Badge variant="outline" className="text-xs">
                            {vuln.cwe}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <AlertDescription className="text-sm">{vuln.description}</AlertDescription>

                    <div className="p-3 bg-white rounded-lg border-l-4 border-blue-400">
                      <p className="text-sm font-medium text-blue-900 mb-1">🔧 Recommendation:</p>
                      <p className="text-sm text-blue-800">{vuln.recommendation}</p>
                    </div>
                  </div>
                </div>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Security Recommendations */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Security Recommendations
          </CardTitle>
          <CardDescription>Best practices to improve your pipeline security</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {report.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-white/70 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-bold text-green-700">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-green-800">{recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Score Breakdown */}
      <Card className="bg-white/70 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Security Score Breakdown
          </CardTitle>
          <CardDescription>Detailed analysis of security factors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Secret Management</span>
              <div className="flex items-center gap-2">
                <Progress
                  value={report.exposedSecrets === 0 ? 100 : Math.max(0, 100 - report.exposedSecrets * 20)}
                  className="w-24 h-2"
                />
                <span className="text-sm font-bold w-12">
                  {report.exposedSecrets === 0 ? 100 : Math.max(0, 100 - report.exposedSecrets * 20)}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Permission Security</span>
              <div className="flex items-center gap-2">
                <Progress
                  value={report.unsafePermissions === 0 ? 100 : Math.max(0, 100 - report.unsafePermissions * 25)}
                  className="w-24 h-2"
                />
                <span className="text-sm font-bold w-12">
                  {report.unsafePermissions === 0 ? 100 : Math.max(0, 100 - report.unsafePermissions * 25)}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Vulnerability Management</span>
              <div className="flex items-center gap-2">
                <Progress
                  value={
                    report.vulnerabilities.length === 0 ? 100 : Math.max(0, 100 - report.vulnerabilities.length * 15)
                  }
                  className="w-24 h-2"
                />
                <span className="text-sm font-bold w-12">
                  {report.vulnerabilities.length === 0 ? 100 : Math.max(0, 100 - report.vulnerabilities.length * 15)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* No Issues Found */}
      {report.vulnerabilities.length === 0 && report.exposedSecrets === 0 && report.unsafePermissions === 0 && (
        <Card className="bg-green-50/50 border-green-200">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-800">Excellent Security Posture!</h3>
              <p className="text-green-700">No security vulnerabilities detected in your CI/CD configuration.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
