import { BaseRule, type RuleContext } from "./base-rules"
import type { ParsedYAML } from "../types"

export class CachingRule extends BaseRule {
  id = "caching-optimization"
  name = "Caching Optimization"
  description = "Analyzes and suggests caching improvements"
  category = "performance"
  severity = "info" as const
  level = "intermediate" as const
  platforms = ["all"]

  private dependencyCommands = [
    { cmd: "npm install", cache: "npm", path: "~/.npm", lockFile: "package-lock.json" },
    { cmd: "npm ci", cache: "npm", path: "~/.npm", lockFile: "package-lock.json" },
    { cmd: "yarn install", cache: "yarn", path: "~/.cache/yarn", lockFile: "yarn.lock" },
    { cmd: "pnpm install", cache: "pnpm", path: "~/.pnpm-store", lockFile: "pnpm-lock.yaml" },
    { cmd: "pip install", cache: "pip", path: "~/.cache/pip", lockFile: "requirements.txt" },
    { cmd: "poetry install", cache: "poetry", path: "~/.cache/pypoetry", lockFile: "poetry.lock" },
    { cmd: "composer install", cache: "composer", path: "~/.composer/cache", lockFile: "composer.lock" },
    { cmd: "bundle install", cache: "bundler", path: "vendor/bundle", lockFile: "Gemfile.lock" },
    { cmd: "go mod download", cache: "go", path: "~/go/pkg/mod", lockFile: "go.sum" },
    { cmd: "cargo build", cache: "cargo", path: "~/.cargo", lockFile: "Cargo.lock" },
    { cmd: "mvn", cache: "maven", path: "~/.m2", lockFile: "pom.xml" },
    { cmd: "gradle", cache: "gradle", path: "~/.gradle", lockFile: "gradle.lock" },
    { cmd: "dotnet restore", cache: "nuget", path: "~/.nuget/packages", lockFile: "packages.lock.json" },
  ]

  check(parsed: ParsedYAML, context: RuleContext): void {
    const hasCaching = context.rawContent.toLowerCase().includes("cache")
    const detectedCommands = this.dependencyCommands.filter(({ cmd }) =>
      context.rawContent.toLowerCase().includes(cmd.toLowerCase()),
    )

    if (detectedCommands.length > 0 && !hasCaching) {
      detectedCommands.forEach(({ cmd, cache, path, lockFile }) => {
        context.addOptimization({
          title: `Add ${cache} caching`,
          description: `Detected ${cmd} without caching - this can significantly slow down builds`,
          impact: "high",
          effort: "low",
          category: "performance",
          suggestion: `Add caching for ${cache} dependencies to improve build performance`,
          exampleCode: this.getCacheExample(context.platform, cache, path, lockFile),
        })
      })
    }

    // Check for cache key best practices
    if (hasCaching) {
      this.checkCacheKeyBestPractices(context)
    }

    // Check for cache restoration patterns
    this.checkCacheRestorationPatterns(parsed, context)
  }

  private getCacheExample(platform: string, cache: string, path: string, lockFile: string): string {
    switch (platform) {
      case "github-actions":
        return `- uses: actions/cache@v4
  with:
    path: ${path}
    key: \${{ runner.os }}-${cache}-\${{ hashFiles('**/${lockFile}') }}
    restore-keys: |
      \${{ runner.os }}-${cache}-`

      case "gitlab-ci":
        return `cache:
  key: \$CI_COMMIT_REF_SLUG
  paths:
    - ${path}`

      case "bitbucket-pipelines":
        return `caches:
  - ${cache}`

      default:
        return `# Add ${cache} caching configuration for ${platform}`
    }
  }

  private checkCacheKeyBestPractices(context: RuleContext): void {
    const cacheKeyPattern = /key:\s*([^\n]+)/g
    let match

    while ((match = cacheKeyPattern.exec(context.rawContent)) !== null) {
      const key = match[1].trim()

      if (!key.includes("hashFiles") && !key.includes("${{") && !key.includes("$CI_")) {
        context.addIssue({
          title: "Static cache key detected",
          description: "Cache key should include file hashes to ensure proper cache invalidation",
          severity: "warning",
          category: "performance",
          ruleId: "static-cache-key",
          suggestion: "Use hashFiles() function or commit SHA in cache keys",
          exampleCode: `key: \${{ runner.os }}-deps-\${{ hashFiles('**/package-lock.json') }}`,
        })
      }
    }
  }

  private checkCacheRestorationPatterns(parsed: ParsedYAML, context: RuleContext): void {
    if (context.platform === "github-actions" && parsed.jobs) {
      Object.entries(parsed.jobs).forEach(([jobName, job]: [string, any]) => {
        if (job.steps) {
          const cacheSteps = job.steps.filter((step: any) => step.uses && step.uses.includes("cache"))

          if (cacheSteps.length > 0) {
            cacheSteps.forEach((cacheStep: any) => {
              if (!cacheStep.with?.["restore-keys"]) {
                context.addOptimization({
                  title: `Add restore-keys to cache in job "${jobName}"`,
                  description: "Cache step missing restore-keys for fallback cache restoration",
                  impact: "medium",
                  effort: "low",
                  category: "performance",
                  suggestion: "Add restore-keys to improve cache hit rates",
                  exampleCode: `restore-keys: |
    \${{ runner.os }}-deps-`,
                })
              }
            })
          }
        }
      })
    }
  }
}

export class ParallelizationRule extends BaseRule {
  id = "parallelization-analysis"
  name = "Parallelization Analysis"
  description = "Analyzes job dependencies and suggests parallelization improvements"
  category = "performance"
  severity = "info" as const
  level = "senior" as const
  platforms = ["github-actions", "gitlab-ci"]

  check(parsed: ParsedYAML, context: RuleContext): void {
    if (context.platform === "github-actions") {
      this.analyzeGitHubParallelization(parsed, context)
    } else if (context.platform === "gitlab-ci") {
      this.analyzeGitLabParallelization(parsed, context)
    }
  }

  private analyzeGitHubParallelization(parsed: ParsedYAML, context: RuleContext): void {
    if (!parsed.jobs) return

    const jobs = Object.keys(parsed.jobs)
    const jobDependencies = new Map<string, string[]>()

    // Build dependency graph
    Object.entries(parsed.jobs).forEach(([jobName, job]: [string, any]) => {
      if (job.needs) {
        const dependencies = Array.isArray(job.needs) ? job.needs : [job.needs]
        jobDependencies.set(jobName, dependencies)
      } else {
        jobDependencies.set(jobName, [])
      }
    })

    // Analyze parallelization opportunities
    const independentJobs = Array.from(jobDependencies.entries())
      .filter(([_, deps]) => deps.length === 0)
      .map(([name, _]) => name)

    if (independentJobs.length > 1) {
      context.addOptimization({
        title: "Good parallelization detected",
        description: `${independentJobs.length} jobs can run in parallel: ${independentJobs.join(", ")}`,
        impact: "low",
        effort: "low",
        category: "performance",
        suggestion: "Current parallelization looks optimal",
      })
    }

    // Check for unnecessary dependencies
    this.checkUnnecessaryDependencies(jobDependencies, context)

    // Suggest matrix strategies for similar jobs
    this.suggestMatrixStrategies(parsed, context)
  }

  private analyzeGitLabParallelization(parsed: ParsedYAML, context: RuleContext): void {
    if (parsed.stages) {
      const stages = Array.isArray(parsed.stages) ? parsed.stages : []

      if (stages.length > 5) {
        context.addOptimization({
          title: "Consider reducing pipeline stages",
          description: `Pipeline has ${stages.length} stages which may increase execution time`,
          impact: "medium",
          effort: "medium",
          category: "performance",
          suggestion: "Consider combining related stages or using parallel jobs within stages",
        })
      }
    }

    // Check for parallel job opportunities within stages
    const jobsByStage = new Map<string, string[]>()

    Object.entries(parsed).forEach(([key, value]: [string, any]) => {
      if (typeof value === "object" && value?.stage) {
        const stage = value.stage
        if (!jobsByStage.has(stage)) {
          jobsByStage.set(stage, [])
        }
        jobsByStage.get(stage)!.push(key)
      }
    })

    jobsByStage.forEach((jobs, stage) => {
      if (jobs.length > 1) {
        context.addOptimization({
          title: `Parallel jobs in stage "${stage}"`,
          description: `Stage "${stage}" has ${jobs.length} jobs that can run in parallel`,
          impact: "low",
          effort: "low",
          category: "performance",
          suggestion: "Jobs in the same stage run in parallel automatically",
        })
      }
    })
  }

  private checkUnnecessaryDependencies(jobDependencies: Map<string, string[]>, context: RuleContext): void {
    // Simple heuristic: if a job only depends on one other job and doesn't use its artifacts,
    // it might be an unnecessary dependency
    jobDependencies.forEach((deps, jobName) => {
      if (deps.length === 1) {
        context.addOptimization({
          title: `Review dependency for job "${jobName}"`,
          description: `Job "${jobName}" depends only on "${deps[0]}" - verify if this dependency is necessary`,
          impact: "low",
          effort: "low",
          category: "performance",
          suggestion: "Remove unnecessary job dependencies to improve parallelization",
        })
      }
    })
  }

  private suggestMatrixStrategies(parsed: ParsedYAML, context: RuleContext): void {
    if (!parsed.jobs) return

    const similarJobs = this.findSimilarJobs(parsed.jobs)

    similarJobs.forEach((jobGroup) => {
      if (jobGroup.length > 1) {
        context.addOptimization({
          title: "Consider matrix strategy",
          description: `Jobs ${jobGroup.join(", ")} appear similar and could use a matrix strategy`,
          impact: "medium",
          effort: "medium",
          category: "performance",
          suggestion: "Use matrix strategy to reduce duplication and improve maintainability",
          exampleCode: `strategy:
  matrix:
    version: [16, 18, 20]
    os: [ubuntu-latest, windows-latest]`,
        })
      }
    })
  }

  private findSimilarJobs(jobs: Record<string, any>): string[][] {
    const jobGroups: string[][] = []
    const processed = new Set<string>()

    Object.entries(jobs).forEach(([jobName, job]) => {
      if (processed.has(jobName)) return

      const similarJobs = [jobName]
      const jobSteps = this.getJobStepSignature(job)

      Object.entries(jobs).forEach(([otherJobName, otherJob]) => {
        if (otherJobName !== jobName && !processed.has(otherJobName)) {
          const otherSteps = this.getJobStepSignature(otherJob)
          if (this.areStepsSimilar(jobSteps, otherSteps)) {
            similarJobs.push(otherJobName)
            processed.add(otherJobName)
          }
        }
      })

      if (similarJobs.length > 1) {
        jobGroups.push(similarJobs)
        similarJobs.forEach((name) => processed.add(name))
      }
    })

    return jobGroups
  }

  private getJobStepSignature(job: any): string[] {
    if (!job.steps || !Array.isArray(job.steps)) return []

    return job.steps.map((step: any) => {
      if (step.uses) return `uses:${step.uses.split("@")[0]}`
      if (step.run) return `run:${step.run.split(" ")[0]}`
      return "unknown"
    })
  }

  private areStepsSimilar(steps1: string[], steps2: string[]): boolean {
    if (steps1.length !== steps2.length) return false

    const similarity = steps1.filter((step, index) => step === steps2[index]).length
    return similarity / steps1.length > 0.7 // 70% similarity threshold
  }
}

export class ResourceOptimizationRule extends BaseRule {
  id = "resource-optimization"
  name = "Resource Optimization"
  description = "Analyzes resource usage and suggests optimizations"
  category = "performance"
  severity = "info" as const
  level = "senior" as const
  platforms = ["all"]

  check(parsed: ParsedYAML, context: RuleContext): void {
    this.checkTimeouts(parsed, context)
    this.checkRunnerSelection(parsed, context)
    this.checkResourceIntensiveOperations(context)
    this.checkArtifactOptimization(parsed, context)
  }

  private checkTimeouts(parsed: ParsedYAML, context: RuleContext): void {
    if (context.platform === "github-actions" && parsed.jobs) {
      Object.entries(parsed.jobs).forEach(([jobName, job]: [string, any]) => {
        if (!job["timeout-minutes"]) {
          context.addOptimization({
            title: `Add timeout to job "${jobName}"`,
            description: "Jobs without timeouts can run indefinitely, wasting resources",
            impact: "medium",
            effort: "low",
            category: "cost",
            suggestion: "Add timeout-minutes to prevent runaway jobs",
            exampleCode: "timeout-minutes: 30",
          })
        } else if (job["timeout-minutes"] > 360) {
          context.addIssue({
            title: `Very long timeout in job "${jobName}"`,
            description: `Job timeout of ${job["timeout-minutes"]} minutes is unusually long`,
            severity: "warning",
            category: "performance",
            ruleId: "long-timeout",
            suggestion: "Consider optimizing the job or breaking it into smaller jobs",
          })
        }
      })
    }
  }

  private checkRunnerSelection(parsed: ParsedYAML, context: RuleContext): void {
    if (context.platform === "github-actions" && parsed.jobs) {
      Object.entries(parsed.jobs).forEach(([jobName, job]: [string, any]) => {
        const runner = job["runs-on"]

        if (typeof runner === "string") {
          if (runner.includes("macos") || runner.includes("windows")) {
            context.addOptimization({
              title: `Consider cost-effective runner for job "${jobName}"`,
              description: `Job uses ${runner} which is more expensive than Linux runners`,
              impact: "high",
              effort: "low",
              category: "cost",
              suggestion: "Use ubuntu-latest for platform-independent tasks",
            })
          }

          if (runner.includes("large") || runner.includes("xlarge")) {
            context.addOptimization({
              title: `Large runner usage in job "${jobName}"`,
              description: "Job uses large runners - verify if the extra resources are needed",
              impact: "medium",
              effort: "low",
              category: "cost",
              suggestion: "Use standard runners unless high compute is required",
            })
          }
        }
      })
    }
  }

  private checkResourceIntensiveOperations(context: RuleContext): void {
    const heavyOperations = [
      { pattern: /docker build/gi, operation: "Docker build" },
      { pattern: /webpack/gi, operation: "Webpack bundling" },
      { pattern: /rollup/gi, operation: "Rollup bundling" },
      { pattern: /parcel build/gi, operation: "Parcel bundling" },
      { pattern: /ng build --prod/gi, operation: "Angular production build" },
      { pattern: /npm run build/gi, operation: "NPM build script" },
      { pattern: /yarn build/gi, operation: "Yarn build script" },
      { pattern: /mvn compile/gi, operation: "Maven compilation" },
      { pattern: /gradle build/gi, operation: "Gradle build" },
    ]

    const detectedOperations = heavyOperations.filter(({ pattern }) => pattern.test(context.rawContent))

    if (detectedOperations.length > 0 && !context.rawContent.includes("timeout")) {
      context.addOptimization({
        title: "Add timeouts for resource-intensive operations",
        description: `Detected heavy operations: ${detectedOperations.map((op) => op.operation).join(", ")}`,
        impact: "medium",
        effort: "low",
        category: "performance",
        suggestion: "Add timeout configurations to prevent runaway builds",
      })
    }

    // Check for parallel build opportunities
    if (detectedOperations.length > 1) {
      context.addOptimization({
        title: "Consider parallelizing build operations",
        description: "Multiple build operations detected that might benefit from parallelization",
        impact: "high",
        effort: "medium",
        category: "performance",
        suggestion: "Split build operations into parallel jobs if they're independent",
      })
    }
  }

  private checkArtifactOptimization(parsed: ParsedYAML, context: RuleContext): void {
    const broadArtifactPatterns = [/artifacts:[\s\S]*?- \*\*/, /artifacts:[\s\S]*?- \.\/\*\*/, /path:.*\*\*/]

    const hasLargeArtifacts = broadArtifactPatterns.some((pattern) => pattern.test(context.rawContent))

    if (hasLargeArtifacts) {
      context.addOptimization({
        title: "Optimize artifact storage",
        description: "Detected potentially large artifact patterns",
        impact: "medium",
        effort: "low",
        category: "cost",
        suggestion: "Be specific about which files to store as artifacts to reduce storage costs",
        exampleCode: `artifacts:
  paths:
    - dist/
    - build/
  exclude:
    - "**/*.log"
    - "**/node_modules/"`,
      })
    }
  }
}
