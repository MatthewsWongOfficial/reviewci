import { BaseRule, type RuleContext } from "./base-rules"
import type { ParsedYAML } from "../types"

export class CostOptimizationRule extends BaseRule {
  id = "cost-optimization"
  name = "Cost Optimization"
  description = "Analyzes and suggests cost optimization opportunities"
  category = "cost"
  severity = "info" as const
  level = "senior" as const
  platforms = ["all"]

  check(parsed: ParsedYAML, context: RuleContext): void {
    this.checkTriggerOptimization(parsed, context)
    this.checkRunnerCosts(parsed, context)
    this.checkBuildFrequency(parsed, context)
    this.checkResourceWaste(parsed, context)
    this.checkStorageCosts(parsed, context)
  }

  private checkTriggerOptimization(parsed: ParsedYAML, context: RuleContext): void {
    if (context.platform === "github-actions" && parsed.on) {
      // Check for overly broad triggers
      if (parsed.on.push && !parsed.on.push.branches && !parsed.on.push.paths) {
        context.addOptimization({
          title: "Optimize build triggers",
          description: "Builds trigger on all pushes without branch or path filters",
          impact: "high",
          effort: "low",
          category: "cost",
          suggestion: "Add branch and path filters to reduce unnecessary builds",
          exampleCode: `on:
  push:
    branches: [main, develop]
    paths: 
      - 'src/**'
      - 'package.json'
      - '.github/workflows/**'`
        })
      }

      // Check for schedule optimization
      if (parsed.on.schedule) {
        const schedules = Array.isArray(parsed.on.schedule) ? parsed.on.schedule : [parsed.on.schedule]
        schedules.forEach((schedule: any) => {
          if (schedule.cron) {
            const cronParts = schedule.cron.split(' ')
            if (cronParts[1] === '*') { // Every hour
              context.addOptimization({
                title: "Optimize scheduled builds",
                description: "Hourly scheduled builds may be excessive",
                impact: "medium",
                effort: "low",
                category: "cost",
                suggestion: "Consider reducing frequency of scheduled builds"
              })
            }
          }
        })
      }

      // Check for pull request optimization
      if (parsed.on.pull_request && !parsed.on.pull_request.paths) {
        context.addOptimization({
          title: "Optimize pull request triggers",
          description: "PR builds run on all file changes",
          impact: "medium",
          effort: "low",
          category: "cost",
          suggestion: "Add path filters to PR triggers to avoid unnecessary builds"
        })
      }
    }
  }

  private checkRunnerCosts(parsed: ParsedYAML, context: RuleContext): void {
    if (context.platform === "github-actions" && parsed.jobs) {
      const expensiveRunners = ["macos", "windows", "large", "xlarge", "2xlarge", "4xlarge"]
      
      Object.entries(parsed.jobs).forEach(([jobName, job]: [string, any]) => {
        const runner = job["runs-on"]
        
        if (typeof runner === "string") {
          const isExpensive = expensiveRunners.some(expensive => 
            runner.toLowerCase().includes(expensive)
          )
          
          if (isExpensive) {
            context.addOptimization({
              title: `Expensive runner in job "${jobName}"`,
              description: `Job uses ${runner} - consider if cheaper alternatives are suitable`,
              impact: "high",
              effort: "low",
              category: "cost",
              suggestion: "Use ubuntu-latest for platform-independent tasks",
              exampleCode: `runs-on: ubuntu-latest  # Instead of ${runner}`
            })
          }
        }
      })
    }
  }

  private checkBuildFrequency(parsed: ParsedYAML, context: RuleContext): void {
    // Check for matrix strategies that might be excessive
    if (context.platform === "github-actions" && parsed.jobs) {
      Object.entries(parsed.jobs).forEach(([jobName, job]: [string, any]) => {
        if (job.strategy?.matrix) {
          const matrixSize = this.calculateMatrixSize(job.strategy.matrix)
          
          if (matrixSize > 20) {
            context.addIssue({
              title: `Large matrix strategy in job "${jobName}"`,
              description: `Matrix will create ${matrixSize} jobs, which may be excessive`,
              severity: "warning",
              category: "cost",
              ruleId: "large-matrix-strategy",
              suggestion: "Consider reducing matrix dimensions or using include/exclude",
              exampleCode: `strategy:
  matrix:
    node-version: [16, 18, 20]
    exclude:
      - node-version: 16
        os: windows-latest`
            })
          }
        }
      })
    }
  }

  private checkResourceWaste(parsed: ParsedYAML, context: RuleContext): void {
    // Check for long-running jobs without optimization
    if (context.platform === "github-actions" && parsed.jobs) {
      Object.entries(parsed.jobs).forEach(([jobName, job]: [string, any]) => {
        if (job["timeout-minutes"] && job["timeout-minutes"] > 60) {
          const hasOptimizations = job.steps?.some((step: any) => 
            step.uses?.includes("cache") || 
            step.run?.includes("parallel") ||
            step.run?.includes("--jobs")
          )

          if (!hasOptimizations) {
            context.addOptimization({
              title: `Optimize long-running job "${jobName}"`,
              description: `Job has ${job["timeout-minutes"]} minute timeout but no visible optimizations`,
              impact: "medium",
              effort: "medium",
              category: "cost",
              suggestion: "Add caching, parallelization, or other optimizations to reduce build time"
            })
          }
        }
      })
    }
  }

  private checkStorageCosts(parsed: ParsedYAML, context: RuleContext): void {
    // Check for artifact optimization
    const artifactPatterns = [
      /artifacts:[\s\S]*?- \*\*/,
      /artifacts:[\s\S]*?- \.\/\*\*/,
      /path:.*\*\*/
    ]

    const hasLargeArtifacts = artifactPatterns.some(pattern => 
      pattern.test(context.rawContent)
    )

    if (hasLargeArtifacts) {
      context.addOptimization({
        title: "Optimize artifact storage",
        description: "Detected potentially large artifact patterns that increase storage costs",
        impact: "medium",
        effort: "low",
        category: "cost",
        suggestion: "Be specific about which files to store as artifacts",
        exampleCode: `artifacts:
  paths:
    - dist/
    - build/
  exclude:
    - "**/*.log"
    - "**/node_modules/"
    - "**/.git/"`
      })
    }

    // Check for cache size optimization
    if (context.rawContent.includes("cache")) {
      const largeCachePatterns = [
        /node_modules/,
        /\.git/,
        /target\/debug/
      ]

      const hasLargeCachePaths = largeCachePatterns.some(pattern => 
        pattern.test(context.rawContent)
      )

      if (hasLargeCachePaths) {
        context.addOptimization({
          title: "Optimize cache paths",
          description: "Cache includes potentially large directories",
          impact: "low",
          effort: "low",
          category: "cost",
          suggestion: "Exclude unnecessary files from cache to reduce storage costs"
        })
      }
    }
  }

  private calculateMatrixSize(matrix: any): number {
    if (!matrix || typeof matrix !== "object") return 1
    
    let size = 1
    Object.values(matrix).forEach((value) => {
      if (Array.isArray(value)) {
        size *= value.length
      }
    })
    
    return size
  }
}

export class ConcurrencyRule extends BaseRule {
  id = "concurrency-optimization"
  name = "Concurrency Optimization"
  description = "Optimizes concurrency settings to reduce costs and improve efficiency"
  category = "cost"
  severity = "info" as const
  level = "intermediate" as const
  platforms = ["github-actions"]

  check(parsed: ParsedYAML, context: RuleContext): void {
    if (context.platform !== "github-actions") return

    this.checkGlobalConcurrency(parsed, context)
    this.checkJobConcurrency(parsed, context)
  }

  private checkGlobalConcurrency(parsed: ParsedYAML, context: RuleContext): void {
    if (!parsed.concurrency) {
      // Check if this is a workflow that could benefit from concurrency control
      const benefitsFromConcurrency = 
        parsed.on?.pull_request || 
        parsed.on?.push ||
        (parsed.on?.workflow_dispatch && parsed.jobs && Object.keys(parsed.jobs).length > 1)

      if (benefitsFromConcurrency) {
        context.addOptimization({
          title: "Add concurrency control",
          description: "Concurrency control can save resources by cancelling outdated runs",
          impact: "medium",
          effort: "low",
          category: "cost",
          suggestion: "Add concurrency group to cancel outdated runs",
          exampleCode: `concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: true`
        })
      }
    } else {
      // Check if concurrency is properly configured
      if (typeof parsed.concurrency === "object" && !parsed.concurrency["cancel-in-progress"]) {
        context.addOptimization({
          title: "Enable cancel-in-progress for concurrency",
          description: "Concurrency group should cancel outdated runs to save resources",
          impact: "low",
          effort: "low",
          category: "cost",
          suggestion: "Add cancel-in-progress: true to concurrency configuration"
        })
      }
    }
  }

  private checkJobConcurrency(parsed: ParsedYAML, context: RuleContext): void {
    if (!parsed.jobs) return

    Object.entries(parsed.jobs).forEach(([jobName, job]: [string, any]) => {
      if (job.concurrency && typeof job.concurrency === "object") {
        if (!job.concurrency["cancel-in-progress"]) {
          context.addOptimization({
            title: `Enable cancel-in-progress for job "${jobName}"`,
            description: "Job-level concurrency should cancel outdated runs",
            impact: "low",
            effort: "low",
            category: "cost",
            suggestion: "Add cancel-in-progress: true to job concurrency"
          })
        }
      }
    })
  }
}
