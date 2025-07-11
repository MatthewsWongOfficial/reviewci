"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DollarSign, TrendingDown, TrendingUp, PieChart, Lightbulb } from "lucide-react"
import type { CostEstimation } from "@/lib/types"

interface CostEstimatorProps {
  estimation: CostEstimation
}

export function CostEstimator({ estimation }: CostEstimatorProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const getSavingsColor = (percentage: number) => {
    if (percentage >= 30) return "text-green-600"
    if (percentage >= 15) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="space-y-6">
      {/* Cost Overview */}
      <Card className="bg-white/70 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Cost Analysis Overview
          </CardTitle>
          <CardDescription>Monthly cost estimation and optimization opportunities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-700">{formatCurrency(estimation.currentMonthlyCost)}</div>
              <div className="text-sm text-slate-600 mt-1">Current Monthly Cost</div>
              <div className="flex items-center justify-center gap-1 mt-2">
                <TrendingUp className="h-4 w-4 text-slate-500" />
                <span className="text-xs text-slate-500">Baseline cost</span>
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(estimation.optimizedMonthlyCost)}</div>
              <div className="text-sm text-slate-600 mt-1">Optimized Cost</div>
              <div className="flex items-center justify-center gap-1 mt-2">
                <TrendingDown className="h-4 w-4 text-green-500" />
                <span className="text-xs text-slate-500">After optimization</span>
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(estimation.potentialSavings)}</div>
              <div className="text-sm text-slate-600 mt-1">Potential Savings</div>
              <div className="flex items-center justify-center gap-1 mt-2">
                <DollarSign className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-slate-500">Monthly savings</span>
              </div>
            </div>

            <div className="text-center">
              <div className={`text-2xl font-bold ${getSavingsColor(estimation.savingsPercentage)}`}>
                {estimation.savingsPercentage}%
              </div>
              <div className="text-sm text-slate-600 mt-1">Savings Percentage</div>
              <Progress value={estimation.savingsPercentage} className="mt-2 h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
      <Card className="bg-white/70 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Cost Breakdown
          </CardTitle>
          <CardDescription>Detailed breakdown of your CI/CD costs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-slate-900">Current Costs</h4>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Compute</span>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={(estimation.breakdown.compute / estimation.currentMonthlyCost) * 100}
                      className="w-24 h-2"
                    />
                    <span className="text-sm font-bold w-16">{formatCurrency(estimation.breakdown.compute)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Storage</span>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={(estimation.breakdown.storage / estimation.currentMonthlyCost) * 100}
                      className="w-24 h-2"
                    />
                    <span className="text-sm font-bold w-16">{formatCurrency(estimation.breakdown.storage)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Network</span>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={(estimation.breakdown.network / estimation.currentMonthlyCost) * 100}
                      className="w-24 h-2"
                    />
                    <span className="text-sm font-bold w-16">{formatCurrency(estimation.breakdown.network)}</span>
                  </div>
                </div>

                {estimation.breakdown.other > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Other</span>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={(estimation.breakdown.other / estimation.currentMonthlyCost) * 100}
                        className="w-24 h-2"
                      />
                      <span className="text-sm font-bold w-16">{formatCurrency(estimation.breakdown.other)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-slate-900">Optimization Impact</h4>

              <div className="space-y-3">
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-800">Annual Savings</span>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(estimation.potentialSavings * 12)}
                    </span>
                  </div>
                  <p className="text-xs text-green-700">Projected yearly cost reduction</p>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-800">ROI Timeline</span>
                    <span className="text-lg font-bold text-blue-600">
                      {estimation.savingsPercentage >= 20 ? "< 3 months" : "3-6 months"}
                    </span>
                  </div>
                  <p className="text-xs text-blue-700">Time to see optimization benefits</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Optimization Recommendations */}
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            Cost Optimization Recommendations
          </CardTitle>
          <CardDescription>Actionable steps to reduce your CI/CD costs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {estimation.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-white/70 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center text-xs font-bold text-yellow-700">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-yellow-800">{recommendation}</p>
                </div>
                <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-700">
                  Cost Saver
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cost Trends */}
      <Card className="bg-white/70 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Cost Optimization Insights</CardTitle>
          <CardDescription>Key insights about your pipeline costs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-lg font-bold text-slate-700">
                {estimation.savingsPercentage >= 30 ? "High" : estimation.savingsPercentage >= 15 ? "Medium" : "Low"}
              </div>
              <div className="text-sm text-slate-600">Optimization Potential</div>
              <Badge variant="outline" className="mt-2 text-xs">
                {estimation.savingsPercentage}% possible savings
              </Badge>
            </div>

            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-lg font-bold text-slate-700">
                {estimation.breakdown.compute > estimation.breakdown.storage + estimation.breakdown.network
                  ? "Compute"
                  : "Storage"}
              </div>
              <div className="text-sm text-slate-600">Highest Cost Category</div>
              <Badge variant="outline" className="mt-2 text-xs">
                Primary cost driver
              </Badge>
            </div>

            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-lg font-bold text-slate-700">
                {estimation.potentialSavings > 50
                  ? "Excellent"
                  : estimation.potentialSavings > 20
                    ? "Good"
                    : "Moderate"}
              </div>
              <div className="text-sm text-slate-600">Savings Opportunity</div>
              <Badge variant="outline" className="mt-2 text-xs">
                {formatCurrency(estimation.potentialSavings)}/month
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
