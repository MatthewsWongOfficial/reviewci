import type {
  AnalysisResult,
  AnalysisConfig,
  Issue,
  Optimization,
  SecurityReport,
  SecurityVulnerability,
  CostEstimation,
  Metrics,
  PerformanceMetrics,
  ComplexityMetrics,
  CoverageMetrics,
  Recommendation,
  ParsedYAML,
  PlatformAnalyzer,
} from "./types"
import { EnhancedRulesEngine } from "./rules/rule-engine"

export class AdvancedYamlRulesEngine {
  private config: AnalysisConfig
  private rawContent = ""
  private contentLines: string[] = []
  private issues: Issue[] = []
  private optimizations: Optimization[] = []
  private securityVulnerabilities: SecurityVulnerability[] = []
  private parsedYAML: ParsedYAML = {}
  private platformAnalyzers: Map<string, PlatformAnalyzer> = new Map()
  private enhancedRulesEngine: EnhancedRulesEngine

  constructor(config: AnalysisConfig = {}) {
    this.config = {
      enableSecurityAnalysis: true,
      enablePerformanceAnalysis: true,
      enableCostAnalysis: true,
      maxFileSize: 1024 * 1024, // 1MB
      strictMode: false,
      customRules: [],
      ...config,
    }

    this.initializePlatformAnalyzers()
    this.enhancedRulesEngine = new EnhancedRulesEngine()
  }

  private initializePlatformAnalyzers(): void {
    this.platformAnalyzers.set("github-actions", new GitHubActionsAnalyzer(this))
    this.platformAnalyzers.set("gitlab-ci", new GitLabCIAnalyzer(this))
    this.platformAnalyzers.set("bitbucket-pipelines", new BitbucketPipelinesAnalyzer(this))
  }

  async analyze(parsedYAML: ParsedYAML, platform: string, rawContent: string): Promise<AnalysisResult> {
    try {
      this.reset()
      this.rawContent = rawContent
      this.contentLines = rawContent.split("\n")
      this.parsedYAML = parsedYAML

      // Validate input
      this.validateInput(parsedYAML, platform, rawContent)

      // Run platform-specific analysis
      await this.runPlatformAnalysis(parsedYAML, platform, rawContent)

      // Run cross-platform analysis
      await this.runCommonAnalysis(parsedYAML, rawContent)

      // Run enhanced rules engine
      await this.runEnhancedRules(parsedYAML, rawContent, platform)

      // Run security analysis
      if (this.config.enableSecurityAnalysis) {
        await this.runSecurityAnalysis(parsedYAML, rawContent)
      }

      // Run performance analysis
      if (this.config.enablePerformanceAnalysis) {
        await this.runPerformanceAnalysis(parsedYAML, rawContent)
      }

      // Run cost analysis
      if (this.config.enableCostAnalysis) {
        await this.runCostAnalysis(parsedYAML, rawContent)
      }

      // Execute custom rules
      this.executeCustomRules(parsedYAML, rawContent, platform)

      // Generate final results
      return this.generateAnalysisResult(platform)
    } catch (error) {
      this.handleAnalysisError(error, platform)
      return this.generateAnalysisResult(platform)
    }
  }

  private reset(): void {
    this.rawContent = ""
    this.contentLines = []
    this.issues = []
    this.optimizations = []
    this.securityVulnerabilities = []
    this.parsedYAML = {}
  }

  private validateInput(parsedYAML: ParsedYAML, platform: string, rawContent: string): void {
    if (!parsedYAML || typeof parsedYAML !== "object") {
      throw new Error("Invalid parsed YAML: must be an object")
    }

    if (!platform || typeof platform !== "string") {
      throw new Error("Invalid platform: must be a non-empty string")
    }

    if (!rawContent || typeof rawContent !== "string") {
      throw new Error("Invalid raw content: must be a non-empty string")
    }

    if (this.config.maxFileSize && rawContent.length > this.config.maxFileSize) {
      this.addIssue({
        title: "File size exceeds limit",
        description: `File size (${rawContent.length} bytes) exceeds maximum allowed size (${this.config.maxFileSize} bytes)`,
        severity: "error",
        category: "linting",
        ruleId: "file-size-limit",
        fixable: false,
      })
    }

    if (Object.keys(parsedYAML).length === 0) {
      this.addIssue({
        title: "Empty configuration",
        description: "The YAML configuration appears to be empty",
        severity: "error",
        category: "syntax",
        ruleId: "empty-config",
        fixable: true,
        suggestion: "Add valid CI/CD configuration content",
      })
    }
  }

  private async runPlatformAnalysis(parsedYAML: ParsedYAML, platform: string, rawContent: string): Promise<void> {
    const analyzer = this.platformAnalyzers.get(platform)
    if (analyzer) {
      try {
        await analyzer.analyze(parsedYAML, rawContent)
      } catch (error) {
        this.addIssue({
          title: `Platform analysis error for ${platform}`,
          description: `Error during ${platform} analysis: ${error instanceof Error ? error.message : "Unknown error"}`,
          severity: "error",
          category: "linting",
          ruleId: `${platform}-analysis-error`,
          fixable: false,
        })
      }
    } else {
      this.addIssue({
        title: "Unsupported platform",
        description: `Analysis for platform '${platform}' is not supported`,
        severity: "warning",
        category: "linting",
        ruleId: "unsupported-platform",
        fixable: false,
        suggestion: "Use a supported platform: github-actions, gitlab-ci, or bitbucket-pipelines",
      })
    }
  }

  private async runCommonAnalysis(parsedYAML: ParsedYAML, rawContent: string): Promise<void> {
    try {
      // Check for common anti-patterns
      this.checkCommonAntiPatterns(parsedYAML, rawContent)

      // Check for missing documentation
      this.checkDocumentation(parsedYAML, rawContent)

      // Check for environment variable usage
      this.checkEnvironmentVariables(parsedYAML, rawContent)

      // Check for caching opportunities
      this.checkCachingOpportunities(parsedYAML, rawContent)
    } catch (error) {
      this.addIssue({
        title: "Common analysis error",
        description: `Error during common analysis: ${error instanceof Error ? error.message : "Unknown error"}`,
        severity: "error",
        category: "linting",
        ruleId: "common-analysis-error",
        fixable: false,
      })
    }
  }

  private async runEnhancedRules(parsedYAML: ParsedYAML, rawContent: string, platform: string): Promise<void> {
    try {
      const level = this.config.strictMode ? "expert" : "senior"
      const results = this.enhancedRulesEngine.executeRules(parsedYAML, rawContent, platform, level)

      // Merge results
      this.issues.push(...results.issues)
      this.optimizations.push(...results.optimizations)
      this.securityVulnerabilities.push(...results.securityVulnerabilities)
    } catch (error) {
      this.addIssue({
        title: "Enhanced rules execution error",
        description: `Error during enhanced rules execution: ${error instanceof Error ? error.message : "Unknown error"}`,
        severity: "error",
        category: "linting",
        ruleId: "enhanced-rules-error",
        fixable: false,
      })
    }
  }

  private checkCommonAntiPatterns(parsedYAML: ParsedYAML, rawContent: string): void {
    // Enhanced anti-pattern detection
    const antiPatterns = [
      {
        pattern: /localhost:\d+/g,
        title: "Hardcoded localhost URLs",
        severity: "warning" as const,
        category: "best-practice" as const,
        suggestion: "Use environment variables for URLs",
      },
      {
        pattern: /127\.0\.0\.1:\d+/g,
        title: "Hardcoded localhost IP addresses",
        severity: "warning" as const,
        category: "best-practice" as const,
        suggestion: "Use environment variables for IP addresses",
      },
      {
        pattern: /http:\/\/[^/\s]+/g,
        title: "Insecure HTTP URLs",
        severity: "warning" as const,
        category: "security" as const,
        suggestion: "Use HTTPS instead of HTTP",
      },
      {
        pattern: /:latest(?!\w)/g,
        title: "Using 'latest' tag for Docker images",
        severity: "warning" as const,
        category: "best-practice" as const,
        suggestion: "Pin Docker images to specific versions",
      },
      {
        pattern: /sleep\s+\d+/g,
        title: "Hard-coded sleep delays",
        severity: "info" as const,
        category: "maintainability" as const,
        suggestion: "Use proper health checks instead of sleep",
      },
      {
        pattern: /TODO|FIXME|HACK|XXX/gi,
        title: "Unresolved TODO/FIXME comments",
        severity: "info" as const,
        category: "maintainability" as const,
        suggestion: "Resolve or track these items in your issue tracker",
      },
    ]

    const lines = rawContent.split("\n")

    antiPatterns.forEach(({ pattern, title, severity, category, suggestion }) => {
      const matches = rawContent.match(pattern)
      if (matches) {
        const lineNumbers: number[] = []
        lines.forEach((line, index) => {
          if (pattern.test(line)) {
            lineNumbers.push(index + 1)
          }
        })

        this.addIssue({
          title,
          description: `Found ${matches.length} instance(s) of ${title.toLowerCase()}`,
          severity,
          category,
          ruleId: title.toLowerCase().replace(/[^a-z0-9]/g, "-"),
          suggestion,
          lineNumbers,
        })
      }
    })
  }

  private checkDocumentation(parsedYAML: ParsedYAML, rawContent: string): void {
    // Check for missing comments
    const totalLines = this.contentLines.length
    const commentLines = this.contentLines.filter((line) => line.trim().startsWith("#")).length
    const commentRatio = commentLines / totalLines

    if (commentRatio < 0.1 && totalLines > 20) {
      this.addOptimization({
        title: "Add documentation comments",
        description: "Configuration lacks sufficient documentation comments",
        impact: "medium",
        effort: "low",
        category: "maintainability",
        suggestion: "Add comments explaining complex configurations and workflows",
      })
    }

    // Check for missing job/step names
    this.checkMissingNames(parsedYAML)
  }

  private checkMissingNames(parsedYAML: ParsedYAML): void {
    if (parsedYAML.jobs) {
      Object.entries(parsedYAML.jobs).forEach(([jobName, job]: [string, any]) => {
        if (!job.name && jobName !== job.name) {
          this.addIssue({
            title: `Missing name for job "${jobName}"`,
            description: "Jobs should have descriptive names for better readability",
            severity: "info",
            category: "maintainability",
            ruleId: "missing-job-name",
            suggestion: `Add a 'name' field to job "${jobName}"`,
            fixable: true,
          })
        }

        if (job.steps && Array.isArray(job.steps)) {
          job.steps.forEach((step: any, index: number) => {
            if (job.name && job.name.length < 5) {
              this.addIssue({
                title: `Unclear name for job "${jobName}"`,
                description: "Job names should be descriptive enough to clarify their purpose",
                severity: "info",
                category: "maintainability",
                ruleId: "weak-job-name",
                suggestion: `Use a more descriptive name for job "${jobName}" (e.g., 'Build frontend')`,
                fixable: true,
                
              })
            }
          })
        }
      })
    }
  }

  // Enhanced environment variable checking
  private checkEnvironmentVariables(parsedYAML: ParsedYAML, rawContent: string): void {
    // Check for environment variable best practices
    const envVarPattern = /\$\{?([A-Z_][A-Z0-9_]*)\}?/g
    const envVars = new Set<string>()
    let match

    while ((match = envVarPattern.exec(rawContent)) !== null) {
      envVars.add(match[1])
    }

    // Check for common insecure environment variables
    const insecureVars = ["PASSWORD", "SECRET", "TOKEN", "KEY", "API_KEY", "PRIVATE_KEY"]
    insecureVars.forEach((varName) => {
      if (envVars.has(varName)) {
        this.addIssue({
          title: `Potentially insecure environment variable: ${varName}`,
          description: `Environment variable "${varName}" might contain sensitive information and could be logged`,
          severity: "warning",
          category: "security",
          ruleId: "insecure-env-var",
          suggestion: "Use more specific variable names and ensure proper secret management",
          exampleCode: `# Instead of ${varName}, use:
DATABASE_PASSWORD: \${{ secrets.DB_PASSWORD }}`,
        })
      }
    })

    // Check for missing environment variable definitions
    const commonEnvVars = ["NODE_ENV", "ENVIRONMENT", "STAGE", "BUILD_ENV"]
    const hasEnvConfig = commonEnvVars.some((envVar) => rawContent.includes(envVar))

    if ((!hasEnvConfig && rawContent.includes("npm")) || rawContent.includes("node")) {
      this.addOptimization({
        title: "Consider adding environment configuration",
        description: "No environment variables detected for Node.js project",
        impact: "low",
        effort: "low",
        category: "maintainability",
        suggestion: "Add NODE_ENV or similar environment configuration",
        exampleCode: `env:
  NODE_ENV: production`,
      })
    }
  }

  // Enhanced caching analysis
  private checkCachingOpportunities(parsedYAML: ParsedYAML, rawContent: string): void {
    const installCommands = [
      { cmd: "npm install", cache: "npm", path: "~/.npm" },
      { cmd: "npm ci", cache: "npm", path: "~/.npm" },
      { cmd: "yarn install", cache: "yarn", path: "~/.cache/yarn" },
      { cmd: "pip install", cache: "pip", path: "~/.cache/pip" },
      { cmd: "composer install", cache: "composer", path: "~/.composer/cache" },
      { cmd: "bundle install", cache: "bundler", path: "vendor/bundle" },
      { cmd: "go mod download", cache: "go", path: "~/go/pkg/mod" },
      { cmd: "cargo build", cache: "cargo", path: "~/.cargo" },
      { cmd: "mvn", cache: "maven", path: "~/.m2" },
      { cmd: "gradle", cache: "gradle", path: "~/.gradle" },
    ]

    const hasCaching = rawContent.toLowerCase().includes("cache")
    const detectedCommands = installCommands.filter(({ cmd }) => rawContent.toLowerCase().includes(cmd.toLowerCase()))

    if (detectedCommands.length > 0 && !hasCaching) {
      detectedCommands.forEach(({ cmd, cache, path }) => {
        this.addOptimization({
          title: `Add ${cache} caching`,
          description: `Detected ${cmd} without caching - this can significantly slow down builds`,
          impact: "high",
          effort: "low",
          category: "performance",
          suggestion: `Add caching for ${cache} dependencies to improve build performance`,
          exampleCode: `# For GitHub Actions:
- uses: actions/cache@v4
  with:
    path: ${path}
    key: \${{ runner.os }}-${cache}-\${{ hashFiles('**/package-lock.json') }}`,
        })
      })
    }

    // Check for cache key best practices
    if (hasCaching) {
      const cacheKeyPattern = /key:\s*([^\n]+)/g
      let cacheMatch
      while ((cacheMatch = cacheKeyPattern.exec(rawContent)) !== null) {
        const key = cacheMatch[1].trim()
        if (!key.includes("hashFiles") && !key.includes("${{")) {
          this.addIssue({
            title: "Static cache key detected",
            description: "Cache key should include file hashes to ensure cache invalidation",
            severity: "warning",
            category: "performance",
            ruleId: "static-cache-key",
            suggestion: "Use hashFiles() function in cache keys",
            exampleCode: `key: \${{ runner.os }}-deps-\${{ hashFiles('**/package-lock.json') }}`,
          })
        }
      }
    }
  }

  private async runSecurityAnalysis(parsedYAML: ParsedYAML, rawContent: string): Promise<void> {
    try {
      // Scan for exposed secrets
      this.scanForExposedSecrets(rawContent)

      // Check for insecure practices
      this.checkInsecurePractices(parsedYAML, rawContent)

      // Check for permission issues
      this.checkPermissions(parsedYAML, rawContent)

      // Check for vulnerable dependencies
      this.checkVulnerableDependencies(rawContent)
    } catch (error) {
      this.addIssue({
        title: "Security analysis error",
        description: `Error during security analysis: ${error instanceof Error ? error.message : "Unknown error"}`,
        severity: "error",
        category: "security",
        ruleId: "security-analysis-error",
        fixable: false,
      })
    }
  }

  private scanForExposedSecrets(content: string): void {
  const entropyThreshold = 4.5;
  const minLength = 20;

  const lines = content.split("\n");

  lines.forEach((line, index) => {
    // Skip lines that are clearly using environment variables
    if (line.includes("$") && (line.includes("${") || line.includes("${"))) {
      return;
    }

    // Skip commented lines
    if (line.trim().startsWith("#")) {
      return;
    }

    // Split line into words/tokens based on common separators
    const parts = line.split(/[\s"'=:\[\]{},()<>]+/);

    parts.forEach((word) => {
      if (word.length >= minLength) {
        const entropy = this.calculateEntropy(word);
        if (entropy >= entropyThreshold) {
          this.securityVulnerabilities.push({
            title: `High Entropy String`,
            description: `Potential secret detected: "${this.maskSecret(word)}" (entropy: ${entropy.toFixed(2)})`,
            severity: "high",
            recommendation: "Avoid committing secrets or tokens directly in code. Use environment variables or secret managers.",
            line: index + 1,
          });
        }
      }
    });
  });
}

// Helper to calculate Shannon entropy
private calculateEntropy(str: string): number {
  const map: Record<string, number> = {};
  for (const char of str) {
    map[char] = (map[char] || 0) + 1;
  }
  let entropy = 0;
  const len = str.length;
  for (const char in map) {
    const p = map[char] / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}


  private isLikelySecret(value: string, secretType: string): boolean {
    // Skip obvious false positives
    const falsePositives = [
      "example",
      "test",
      "demo",
      "placeholder",
      "your_",
      "my_",
      "sample",
      "dummy",
      "fake",
      "mock",
      "template",
    ]

    const lowerValue = value.toLowerCase()
    if (falsePositives.some((fp) => lowerValue.includes(fp))) {
      return false
    }

    // For passwords/secrets, ensure they're not just repeated characters
    if (secretType.toLowerCase().includes("password") || secretType.toLowerCase().includes("secret")) {
      const uniqueChars = new Set(value.toLowerCase()).size
      if (uniqueChars < 4) return false // Too simple
    }

    return true
  }

  private maskSecret(secret: string): string {
    if (secret.length <= 8) {
      return "*".repeat(secret.length)
    }
    return secret.substring(0, 4) + "*".repeat(secret.length - 8) + secret.substring(secret.length - 4)
  }

  private checkInsecurePractices(parsedYAML: ParsedYAML, rawContent: string): void {
    const insecurePractices = [
      {
        pattern: /curl.*(-k|--insecure)/gi,
        title: "Insecure curl usage",
        description: "curl with -k or --insecure flag bypasses SSL verification",
        severity: "high" as const,
        suggestion: "Remove -k/--insecure flags and use proper SSL certificates",
      },
      {
        pattern: /wget.*--no-check-certificate/gi,
        title: "Insecure wget usage",
        description: "wget with --no-check-certificate bypasses SSL verification",
        severity: "high" as const,
        suggestion: "Remove --no-check-certificate and use proper SSL certificates",
      },
      {
        pattern: /chmod\s+(777|755|644)\s+\/[^/\s]/g,
        title: "Dangerous file permissions on system directories",
        description: "Setting permissions on system directories can be dangerous",
        severity: "high" as const,
        suggestion: "Be specific about which files need permission changes",
      },
      {
        pattern: /rm\s+-rf\s+(\/[^/\s]|\$HOME|~)/g,
        title: "Dangerous recursive delete",
        description: "Recursive delete of system directories or home directory",
        severity: "critical" as const,
        suggestion: "Use more specific paths and avoid deleting system directories",
      },
      {
        pattern: /sudo\s+(rm|chmod|chown|mv|cp)\s+/g,
        title: "Dangerous sudo usage",
        description: "Using sudo with file operations can be risky",
        severity: "medium" as const,
        suggestion: "Consider using specific user permissions instead of sudo",
      },
      {
        pattern: /eval\s+\$\(/g,
        title: "Dynamic code evaluation",
        description: "eval with command substitution can execute arbitrary code",
        severity: "high" as const,
        suggestion: "Avoid eval and use safer alternatives",
      },
      {
        pattern: /(curl|wget)\s+[^|]*\|\s*(sh|bash|zsh)/g,
        title: "Piping remote content to shell",
        description: "Downloading and executing remote scripts is dangerous",
        severity: "critical" as const,
        suggestion: "Download scripts first, verify their content, then execute",
      },
      {
        pattern: /docker\s+run.*--privileged/g,
        title: "Privileged Docker container",
        description: "Running Docker containers in privileged mode is dangerous",
        severity: "high" as const,
        suggestion: "Use specific capabilities instead of --privileged",
      },
      {
        pattern: /\$\{[^}]*\|\s*(sh|bash|eval)/g,
        title: "Command injection vulnerability",
        description: "Variable expansion piped to shell can lead to command injection",
        severity: "high" as const,
        suggestion: "Validate and sanitize variables before using them in commands",
      },
    ]

    const lines = rawContent.split("\n")

    insecurePractices.forEach(({ pattern, title, description, severity, suggestion }) => {
      lines.forEach((line, index) => {
        if (pattern.test(line)) {
          this.securityVulnerabilities.push({
            title,
            description: `${description}: "${line.trim()}"`,
            severity,
            recommendation: suggestion,
            line: index + 1,
          })
        }
      })
    })
  }

  private checkPermissions(parsedYAML: ParsedYAML, rawContent: string): void {
    // Check for overly broad permissions in GitHub Actions
    if (parsedYAML.permissions) {
      const permissions = parsedYAML.permissions
      if (
        permissions === "write-all" ||
        (typeof permissions === "object" && Object.values(permissions).includes("write"))
      ) {
        this.addIssue({
          title: "Overly broad permissions",
          description: "Workflow has broad write permissions which may be unnecessary",
          severity: "warning",
          category: "security",
          ruleId: "broad-permissions",
          suggestion: "Use minimal required permissions following the principle of least privilege",
        })
      }
    }

    // Check for sudo usage
    if (rawContent.includes("sudo")) {
      this.addIssue({
        title: "Sudo usage detected",
        description: "Using sudo in CI/CD can be a security risk",
        severity: "warning",
        category: "security",
        ruleId: "sudo-usage",
        suggestion: "Consider using rootless containers or specific user permissions",
        lineNumbers: this.findPatternLines("sudo"),
      })
    }
  }

  private checkVulnerableDependencies(rawContent: string): void {
    // Check for outdated or vulnerable action versions
    const actionPattern = /uses:\s*([^@\s]+)@([^\s]+)/g
    let match

    while ((match = actionPattern.exec(rawContent)) !== null) {
      const [, action, version] = match

      // Check for latest tag usage
      if (version === "latest" || version.startsWith("v") === false) {
        this.addIssue({
          title: `Unpinned action version: ${action}`,
          description: "Action is not pinned to a specific version",
          severity: "warning",
          category: "security",
          ruleId: "unpinned-action",
          suggestion: "Pin actions to specific versions or commit SHAs",
          lineNumbers: this.findPatternLines(action),
        })
      }
    }
  }

  private async runPerformanceAnalysis(parsedYAML: ParsedYAML, rawContent: string): Promise<void> {
    try {
      this.analyzeParallelization(parsedYAML)
      this.analyzeBuildOptimization(rawContent)
      this.analyzeResourceUsage(parsedYAML, rawContent)
    } catch (error) {
      this.addIssue({
        title: "Performance analysis error",
        description: `Error during performance analysis: ${error instanceof Error ? error.message : "Unknown error"}`,
        severity: "error",
        category: "performance",
        ruleId: "performance-analysis-error",
        fixable: false,
      })
    }
  }

  private analyzeParallelization(parsedYAML: ParsedYAML): void {
    if (parsedYAML.jobs) {
      const jobs = Object.keys(parsedYAML.jobs)
      const jobsWithDependencies = Object.values(parsedYAML.jobs).filter((job: any) => job.needs).length
      const parallelizableJobs = jobs.length - jobsWithDependencies

      if (parallelizableJobs > 1) {
        this.addOptimization({
          title: "Good parallelization",
          description: `${parallelizableJobs} jobs can run in parallel`,
          impact: "low",
          effort: "low",
          category: "performance",
          suggestion: "Current parallelization looks good",
        })
      } else if (jobs.length > 1 && jobsWithDependencies === jobs.length) {
        this.addOptimization({
          title: "Consider reducing job dependencies",
          description: "All jobs have dependencies, limiting parallelization",
          impact: "medium",
          effort: "medium",
          category: "performance",
          suggestion: "Review if all job dependencies are necessary",
        })
      }
    }
  }

  private analyzeBuildOptimization(rawContent: string): void {
    const optimizations = [
      {
        pattern: /npm install(?!\s+--production)/,
        title: "Use npm ci for faster installs",
        suggestion: "Replace 'npm install' with 'npm ci' in CI environments",
      },
      {
        pattern: /docker build(?!.*--cache-from)/,
        title: "Use Docker build cache",
        suggestion: "Add --cache-from flag to Docker build commands",
      },
      {
        pattern: /git clone(?!.*--depth)/,
        title: "Use shallow git clone",
        suggestion: "Add --depth=1 to git clone for faster checkouts",
      },
    ]

    optimizations.forEach(({ pattern, title, suggestion }) => {
      if (pattern.test(rawContent)) {
        this.addOptimization({
          title,
          description: "Detected opportunity for build optimization",
          impact: "medium",
          effort: "low",
          category: "performance",
          suggestion,
          lineNumbers: this.findPatternLines(pattern.source),
        })
      }
    })
  }

  private analyzeResourceUsage(parsedYAML: ParsedYAML, rawContent: string): void {
    // Check for resource-intensive operations
    const heavyOperations = [
      "docker build",
      "webpack",
      "rollup",
      "parcel build",
      "ng build --prod",
      "npm run build",
      "yarn build",
    ]

    const hasHeavyOperations = heavyOperations.some((op) => rawContent.toLowerCase().includes(op.toLowerCase()))

    if (hasHeavyOperations && !rawContent.includes("timeout")) {
      this.addOptimization({
        title: "Add timeouts for resource-intensive operations",
        description: "Heavy build operations should have timeouts to prevent hanging",
        impact: "medium",
        effort: "low",
        category: "performance",
        suggestion: "Add timeout configurations to prevent runaway builds",
      })
    }
  }

  private async runCostAnalysis(parsedYAML: ParsedYAML, rawContent: string): Promise<void> {
    try {
      this.analyzeRunnerCosts(parsedYAML, rawContent)
      this.analyzeBuildFrequency(parsedYAML, rawContent)
      this.analyzeStorageCosts(rawContent)
    } catch (error) {
      this.addIssue({
        title: "Cost analysis error",
        description: `Error during cost analysis: ${error instanceof Error ? error.message : "Unknown error"}`,
        severity: "error",
        category: "cost",
        ruleId: "cost-analysis-error",
        fixable: false,
      })
    }
  }

  private analyzeRunnerCosts(parsedYAML: ParsedYAML, rawContent: string): void {
    const expensiveRunners = ["macos", "windows", "gpu", "large"]
    const hasExpensiveRunners = expensiveRunners.some((runner) => rawContent.toLowerCase().includes(runner))

    if (hasExpensiveRunners) {
      this.addOptimization({
        title: "Consider cost-effective runners",
        description: "Detected usage of expensive runners (macOS, Windows, GPU, or large instances)",
        impact: "high",
        effort: "medium",
        category: "cost",
        suggestion: "Use Linux runners when possible and right-size your compute resources",
      })
    }
  }

  private analyzeBuildFrequency(parsedYAML: ParsedYAML, rawContent: string): void {
    // Check for overly broad triggers
    if (parsedYAML.on) {
      const triggers = parsedYAML.on
      if (triggers.push && !triggers.push.branches && !triggers.push.paths) {
        this.addOptimization({
          title: "Optimize build triggers",
          description: "Builds trigger on all pushes without branch or path filters",
          impact: "medium",
          effort: "low",
          category: "cost",
          suggestion: "Add branch and path filters to reduce unnecessary builds",
          exampleCode: `on:
  push:
    branches: [main, develop]
    paths: ['src/**', 'package.json']`,
        })
      }
    }
  }

  private analyzeStorageCosts(rawContent: string): void {
    // Check for large artifacts
    const artifactPatterns = [/artifacts:[\s\S]*?- \*\*/, /artifacts:[\s\S]*?- \.\/\*\*/, /path:.*\*\*/]

    const hasLargeArtifacts = artifactPatterns.some((pattern) => pattern.test(rawContent))

    if (hasLargeArtifacts) {
      this.addOptimization({
        title: "Optimize artifact storage",
        description: "Detected potentially large artifact patterns",
        impact: "medium",
        effort: "low",
        category: "cost",
        suggestion: "Be specific about which files to store as artifacts to reduce storage costs",
      })
    }
  }

  private executeCustomRules(parsedYAML: ParsedYAML, rawContent: string, platform: string): void {
    if (!this.config.customRules) return

    this.config.customRules.forEach((rule) => {
      try {
        const ruleIssues = rule.check(parsedYAML, rawContent, platform)
        this.issues.push(...ruleIssues)
      } catch (error) {
        this.addIssue({
          title: `Custom rule error: ${rule.name}`,
          description: `Error executing custom rule "${rule.name}": ${error instanceof Error ? error.message : "Unknown error"}`,
          severity: "error",
          category: "linting",
          ruleId: `custom-rule-error-${rule.id}`,
          fixable: false,
        })
      }
    })
  }

  private handleAnalysisError(error: unknown, platform: string): void {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    this.addIssue({
      title: "Analysis failed",
      description: `Critical error during analysis of ${platform}: ${errorMessage}`,
      severity: "critical",
      category: "linting",
      ruleId: "analysis-failure",
      fixable: false,
    })
  }

  private generateAnalysisResult(platform: string): AnalysisResult {
    const score = this.calculateScore()
    const securityReport = this.generateSecurityReport()
    const costEstimation = this.generateCostEstimation(this.parsedYAML, platform)
    const recommendations = this.generateRecommendations()
    const dependencyGraph = this.generateDependencyGraph(this.parsedYAML, platform)
    const metrics = this.calculateMetrics(this.parsedYAML, platform)

    return {
      platform,
      score,
      issues: this.issues,
      optimizations: this.optimizations,
      securityReport,
      costEstimation,
      recommendations,
      dependencyGraph,
      metrics,
    }
  }

  // Helper methods
  public addIssue(issue: Issue): void {
    this.issues.push(issue)
  }

  public addOptimization(optimization: Optimization): void {
    this.optimizations.push(optimization)
  }

  public addSecurityVulnerability(vulnerability: SecurityVulnerability): void {
    this.securityVulnerabilities.push(vulnerability)
  }

  private findPatternLines(pattern: string): number[] {
    const lines: number[] = []
    const regex = new RegExp(pattern, "gi")

    this.contentLines.forEach((line, index) => {
      if (regex.test(line)) {
        lines.push(index + 1)
      }
    })

    return lines
  }

  private calculateScore(): number {
    let score = 100

    // Deduct points for issues
    this.issues.forEach((issue) => {
      switch (issue.severity) {
        case "critical":
          score -= 25
          break
        case "error":
          score -= 15
          break
        case "warning":
          score -= 8
          break
        case "info":
          score -= 3
          break
      }
    })

    // Deduct points for security vulnerabilities
    this.securityVulnerabilities.forEach((vuln) => {
      switch (vuln.severity) {
        case "critical":
          score -= 30
          break
        case "high":
          score -= 20
          break
        case "medium":
          score -= 10
          break
        case "low":
          score -= 5
          break
      }
    })

    return Math.max(0, Math.min(100, score))
  }

  private generateSecurityReport(): SecurityReport {
    const exposedSecrets = this.securityVulnerabilities.filter(
      (v) =>
        v.title.toLowerCase().includes("secret") ||
        v.title.toLowerCase().includes("key") ||
        v.title.toLowerCase().includes("token"),
    ).length

    const unsafePermissions = this.issues.filter(
      (i) => i.category === "security" && i.description.toLowerCase().includes("permission"),
    ).length

    return {
      overallScore: Math.max(0, 100 - this.securityVulnerabilities.length * 10),
      vulnerabilities: this.securityVulnerabilities,
      exposedSecrets,
      unsafePermissions,
      recommendations: [
        "Use secret management systems instead of hardcoded values",
        "Pin action versions to specific commits for security",
        "Implement least privilege access principles",
        "Regular security audits of CI/CD configurations",
        "Enable branch protection rules",
        "Use signed commits where possible",
      ],
    }
  }

  private generateCostEstimation(parsed: ParsedYAML, platform: string): CostEstimation {
    const jobCount = this.countJobs(parsed, platform)
    const stepCount = this.countSteps(parsed, platform)

    // Simplified cost calculation
    const baseComputeCost = jobCount * 10 + stepCount * 2
    const storageCost = 5
    const networkCost = 2
    const currentMonthlyCost = baseComputeCost + storageCost + networkCost
    const optimizedMonthlyCost = currentMonthlyCost * 0.7
    const potentialSavings = currentMonthlyCost - optimizedMonthlyCost

    return {
      currentMonthlyCost,
      optimizedMonthlyCost,
      potentialSavings,
      savingsPercentage: Math.round((potentialSavings / currentMonthlyCost) * 100),
      recommendations: [
        "Use caching to reduce build times",
        "Optimize matrix builds to avoid redundancy",
        "Use appropriate runner sizes for workloads",
        "Implement conditional job execution",
        "Use path-based triggers to reduce unnecessary builds",
      ],
      breakdown: {
        compute: baseComputeCost,
        storage: storageCost,
        network: networkCost,
        other: 0,
      },
    }
  }

  private generateRecommendations(): Recommendation[] {
    const recommendations: Recommendation[] = []

    const criticalIssues = this.issues.filter((i) => i.severity === "critical")
    const errorIssues = this.issues.filter((i) => i.severity === "error")
    const securityIssues = this.issues.filter((i) => i.category === "security")
    const performanceOptimizations = this.optimizations.filter((o) => o.impact === "high")

    if (criticalIssues.length > 0) {
      recommendations.push({
        title: "Fix Critical Issues",
        description: `Address ${criticalIssues.length} critical issues that prevent proper pipeline execution`,
        priority: "high",
        effort: "high",
        impact: "high",
        category: "linting",
      })
    }

    if (errorIssues.length > 0) {
      recommendations.push({
        title: "Resolve Error Issues",
        description: `Fix ${errorIssues.length} error-level issues`,
        priority: "high",
        effort: "medium",
        impact: "high",
        category: "linting",
      })
    }

    if (securityIssues.length > 0) {
      recommendations.push({
        title: "Improve Security Posture",
        description: `Address ${securityIssues.length} security-related issues`,
        priority: "high",
        effort: "low",
        impact: "high",
        category: "security",
      })
    }

    if (performanceOptimizations.length > 0) {
      recommendations.push({
        title: "Optimize Performance",
        description: `Implement ${performanceOptimizations.length} high-impact performance optimizations`,
        priority: "medium",
        effort: "low",
        impact: "high",
        category: "performance",
      })
    }

    return recommendations
  }

  private generateDependencyGraph(parsed: ParsedYAML, platform: string): string {
    if (platform === "github-actions" && parsed.jobs) {
      const jobs = Object.keys(parsed.jobs)
      if (jobs.length <= 1) {
        return "graph TD\n    A[Single Job] --> B[Complete]"
      }

      let graph = "graph TD\n"
      jobs.forEach((jobName) => {
        const job = parsed.jobs[jobName]
        const cleanJobName = jobName.replace(/[^a-zA-Z0-9]/g, "_")

        if (job.needs) {
          const dependencies = Array.isArray(job.needs) ? job.needs : [job.needs]
          dependencies.forEach((dep: string) => {
            const cleanDepName = dep.replace(/[^a-zA-Z0-9]/g, "_")
            graph += `    ${cleanDepName}["${dep}"] --> ${cleanJobName}["${jobName}"]\n`
          })
        } else {
          graph += `    ${cleanJobName}["${jobName}"]\n`
        }
      })
      return graph
    }

    return "graph TD\n    A[Analysis] --> B[Complete]"
  }

  private calculateMetrics(parsed: ParsedYAML, platform: string): Metrics {
    const performance: PerformanceMetrics = {
      estimatedBuildTime: this.estimateBuildTime(parsed),
      parallelizationScore: this.calculateParallelizationScore(parsed),
      cacheEfficiency: this.calculateCacheEfficiency(parsed),
      resourceUtilization: this.calculateResourceUtilization(parsed),
    }

    const complexity: ComplexityMetrics = {
      cyclomaticComplexity: this.calculateCyclomaticComplexity(parsed),
      cognitiveComplexity: this.calculateCognitiveComplexity(parsed),
      maintainabilityIndex: this.calculateMaintainabilityIndex(parsed),
      linesOfCode: this.countLinesOfCode(parsed),
    }

    const coverage: CoverageMetrics = {
      documentationCoverage: this.calculateDocumentationCoverage(parsed),
      errorHandlingCoverage: this.calculateErrorHandlingCoverage(parsed),
      testCoverage: this.calculateTestCoverage(parsed),
    }

    return {
      jobsCount: this.countJobs(parsed, platform),
      stepsCount: this.countSteps(parsed, platform),
      triggersCount: this.countTriggers(parsed, platform),
      parallelizableJobs: this.countParallelizableJobs(parsed, platform),
      cacheUsage: this.calculateCacheUsage(parsed, platform),
      securityScore: Math.max(0, 100 - this.securityVulnerabilities.length * 10),
      performance,
      complexity,
      coverage,
    }
  }

  // Metric calculation methods
  private estimateBuildTime(parsed: ParsedYAML): number {
    const jobCount = Object.keys(parsed.jobs || {}).length
    const stepCount = this.countSteps(parsed, "unknown")
    return Math.max(5, jobCount * 2 + stepCount * 0.5)
  }

  private calculateParallelizationScore(parsed: ParsedYAML): number {
    const totalJobs = Object.keys(parsed.jobs || {}).length
    if (totalJobs <= 1) return 100

    const jobsWithDependencies = Object.values(parsed.jobs || {}).filter((job: any) => job.needs).length
    return Math.round(((totalJobs - jobsWithDependencies) / totalJobs) * 100)
  }

  private calculateCacheEfficiency(parsed: ParsedYAML): number {
    const configString = JSON.stringify(parsed).toLowerCase()
    const cacheIndicators = ["cache", "restore", "save"]
    const foundIndicators = cacheIndicators.filter((indicator) => configString.includes(indicator)).length
    return Math.min(100, (foundIndicators / cacheIndicators.length) * 100)
  }

  private calculateResourceUtilization(parsed: ParsedYAML): number {
    const configString = JSON.stringify(parsed).toLowerCase()
    let score = 50

    if (configString.includes("ubuntu")) score += 20
    if (configString.includes("timeout")) score += 15
    if (configString.includes("matrix")) score += 10
    if (configString.includes("cache")) score += 5

    return Math.min(100, score)
  }

  private calculateCyclomaticComplexity(parsed: ParsedYAML): number {
    const configString = JSON.stringify(parsed)
    const conditionalKeywords = ["if", "when", "condition", "only", "except"]
    let complexity = 1

    conditionalKeywords.forEach((keyword) => {
      const matches = (configString.match(new RegExp(keyword, "gi")) || []).length
      complexity += matches
    })

    return complexity
  }

  private calculateCognitiveComplexity(parsed: ParsedYAML): number {
    return Math.min(this.calculateCyclomaticComplexity(parsed) * 1.2, 50)
  }

  private calculateMaintainabilityIndex(parsed: ParsedYAML): number {
    const linesOfCode = this.countLinesOfCode(parsed)
    const cyclomaticComplexity = this.calculateCyclomaticComplexity(parsed)
    const maintainabilityIndex = Math.max(0, 171 - 5.2 * Math.log(linesOfCode) - 0.23 * cyclomaticComplexity)
    return Math.round(maintainabilityIndex)
  }

  private countLinesOfCode(parsed: ParsedYAML): number {
    return JSON.stringify(parsed, null, 2).split("\n").length
  }

  private calculateDocumentationCoverage(parsed: ParsedYAML): number {
    let totalElements = 0
    let documentedElements = 0

    if (parsed.jobs) {
      totalElements += Object.keys(parsed.jobs).length
      documentedElements += Object.values(parsed.jobs).filter((job: any) => job.name || job.description).length
    }

    if (totalElements === 0) return 100
    return Math.round((documentedElements / totalElements) * 100)
  }

  private calculateErrorHandlingCoverage(parsed: ParsedYAML): number {
    const configString = JSON.stringify(parsed).toLowerCase()
    const errorHandlingIndicators = ["continue-on-error", "allow_failure", "on_failure", "catch", "try"]
    const foundIndicators = errorHandlingIndicators.filter((indicator) => configString.includes(indicator)).length
    return Math.min(100, (foundIndicators / errorHandlingIndicators.length) * 100)
  }

  private calculateTestCoverage(parsed: ParsedYAML): number {
    const configString = JSON.stringify(parsed).toLowerCase()
    const testIndicators = ["test", "spec", "coverage", "junit"]
    const foundIndicators = testIndicators.filter((indicator) => configString.includes(indicator)).length
    return Math.min(100, (foundIndicators / testIndicators.length) * 100)
  }

  private countJobs(parsed: ParsedYAML, platform: string): number {
    switch (platform) {
      case "github-actions":
        return Object.keys(parsed.jobs || {}).length
      case "gitlab-ci":
        return Object.keys(parsed).filter((key) => typeof parsed[key] === "object" && parsed[key]?.script).length
      case "bitbucket-pipelines":
        return this.countBitbucketSteps(parsed.pipelines)
      default:
        return Object.keys(parsed.jobs || parsed.stages || {}).length
    }
  }

  private countSteps(parsed: ParsedYAML, platform: string): number {
    let stepCount = 0
    if (parsed.jobs) {
      Object.values(parsed.jobs).forEach((job: any) => {
        if (job.steps) {
          stepCount += job.steps.length
        }
      })
    }
    return stepCount
  }

  private countTriggers(parsed: ParsedYAML, platform: string): number {
    if (parsed.on) {
      return Array.isArray(parsed.on)
        ? parsed.on.length
        : typeof parsed.on === "string"
          ? 1
          : Object.keys(parsed.on).length
    }
    return 0
  }

  private countParallelizableJobs(parsed: ParsedYAML, platform: string): number {
    if (!parsed.jobs) return 0
    return Object.values(parsed.jobs).filter((job: any) => !job.needs || job.needs.length === 0).length
  }

  private calculateCacheUsage(parsed: ParsedYAML, platform: string): number {
    const configString = JSON.stringify(parsed).toLowerCase()
    const totalJobs = this.countJobs(parsed, platform)
    if (totalJobs === 0) return 0

    const cacheUsageCount = (configString.match(/cache/g) || []).length
    return Math.min(100, Math.round((cacheUsageCount / totalJobs) * 100))
  }

  private countBitbucketSteps(pipelines: any): number {
    if (!pipelines) return 0
    let count = 0

    if (pipelines.default && Array.isArray(pipelines.default)) {
      count += pipelines.default.length
    }

    if (pipelines.branches) {
      Object.values(pipelines.branches).forEach((branch: any) => {
        if (Array.isArray(branch)) {
          count += branch.length
        }
      })
    }

    return count
  }

  // Enhanced GitHub Actions specific checks
  private async analyzeGitHubActions(parsed: ParsedYAML, rawContent: string): Promise<void> {
    try {
      // Basic structure validation
      if (!parsed.name) {
        this.addIssue({
          title: "Missing workflow name",
          description: "GitHub Actions workflows should have a descriptive name for better organization",
          severity: "warning",
          category: "maintainability",
          ruleId: "gh-missing-name",
          suggestion: 'Add a "name" field at the root level',
          exampleCode: 'name: "CI/CD Pipeline"',
          fixable: true,
          estimatedFixTime: "1 minute",
        })
      }

      if (!parsed.on) {
        this.addIssue({
          title: "Missing trigger events",
          description: "Workflow must specify when it should run",
          severity: "error",
          category: "linting",
          ruleId: "gh-missing-triggers",
          suggestion: 'Add an "on" field with trigger events',
          exampleCode: `on:
  push:
    branches: [main]
  pull_request:
    branches: [main]`,
          fixable: true,
          estimatedFixTime: "2 minutes",
        })
      }

      // Security analysis
      if (parsed.on?.pull_request_target) {
        this.addIssue({
          title: "Potentially unsafe pull_request_target trigger",
          description: "pull_request_target runs with write permissions and can be dangerous with untrusted code",
          severity: "warning",
          category: "security",
          ruleId: "gh-unsafe-pr-target",
          suggestion: "Consider using pull_request trigger instead, or add explicit security measures",
          impact: "high",
          documentationUrl: "https://securitylab.github.com/research/github-actions-preventing-pwn-requests/",
        })
      }

      // Check for overly broad permissions
      if (parsed.permissions) {
        if (
          parsed.permissions === "write-all" ||
          (typeof parsed.permissions === "object" && Object.values(parsed.permissions).some((p) => p === "write"))
        ) {
          this.addIssue({
            title: "Overly broad workflow permissions",
            description: "Workflow has broad write permissions which may be unnecessary",
            severity: "warning",
            category: "security",
            ruleId: "gh-broad-permissions",
            suggestion: "Use minimal required permissions following the principle of least privilege",
            exampleCode: `permissions:
  contents: read
  pull-requests: write`,
          })
        }
      }

      // Jobs analysis
      if (parsed.jobs) {
        await this.analyzeGitHubJobs(parsed.jobs)
      }

      // Check for missing concurrency control
      if (!parsed.concurrency && parsed.on?.pull_request) {
        this.addOptimization({
          title: "Add concurrency control for pull requests",
          description: "Concurrency control can save resources by cancelling outdated runs",
          impact: "medium",
          effort: "low",
          category: "cost",
          suggestion: "Add concurrency group to cancel outdated runs",
          exampleCode: `concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: true`,
        })
      }
    } catch (error: any) {
      this.addIssue({
        title: "GitHub Actions Analysis Error",
        description: `An error occurred during GitHub Actions analysis: ${error.message}`,
        severity: "error",
        category: "linting",
        ruleId: "gh-analysis-error",
        fixable: false,
      })
    }
  }

  private async analyzeGitHubJobs(jobs: Record<string, any>): Promise<void> {
    for (const [jobName, job] of Object.entries(jobs)) {
      try {
        // Required fields
        if (!job["runs-on"]) {
          this.addIssue({
            title: `Job "${jobName}" missing runs-on`,
            description: "Every job must specify which runner to use",
            severity: "error",
            category: "linting",
            ruleId: "gh-missing-runs-on",
            suggestion: 'Add "runs-on" field with a runner',
            exampleCode: "runs-on: ubuntu-latest",
            fixable: true,
            estimatedFixTime: "30 seconds",
          })
        }

        // Check for expensive runners
        if (job["runs-on"]) {
          const runner = typeof job["runs-on"] === "string" ? job["runs-on"] : job["runs-on"][0]
          if (runner && (runner.includes("macos") || runner.includes("windows"))) {
            this.addOptimization({
              title: `Consider cost-effective runner for job "${jobName}"`,
              description: `Job uses ${runner} which is more expensive than Linux runners`,
              impact: "medium",
              effort: "low",
              category: "cost",
              suggestion: "Use ubuntu-latest for platform-independent tasks",
            })
          }
        }

        // Check for missing timeout
        if (!job["timeout-minutes"]) {
          this.addOptimization({
            title: `Add timeout to job "${jobName}"`,
            description: "Jobs without timeouts can run indefinitely, wasting resources",
            impact: "medium",
            effort: "low",
            category: "cost",
            suggestion: "Add timeout-minutes to prevent runaway jobs",
            exampleCode: "timeout-minutes: 30",
          })
        }

        // Check for overly long timeout
        if (job["timeout-minutes"] && job["timeout-minutes"] > 360) {
          this.addIssue({
            title: `Very long timeout in job "${jobName}"`,
            description: `Job timeout of ${job["timeout-minutes"]} minutes is unusually long`,
            severity: "warning",
            category: "performance",
            ruleId: "gh-long-timeout",
            suggestion: "Consider optimizing the job or breaking it into smaller jobs",
          })
        }

        // Security checks in steps
        if (job.steps) {
          await this.analyzeGitHubSteps(job.steps, jobName)
        }

        // Performance checks
        if (job.strategy?.matrix) {
          this.analyzeMatrixStrategy(job.strategy.matrix, jobName)
        }

        // Check for job permissions
        if (job.permissions) {
          if (
            job.permissions === "write-all" ||
            (typeof job.permissions === "object" && Object.values(job.permissions).some((p) => p === "write"))
          ) {
            this.addIssue({
              title: `Overly broad permissions in job "${jobName}"`,
              description: "Job has broad write permissions which may be unnecessary",
              severity: "warning",
              category: "security",
              ruleId: "gh-job-broad-permissions",
              suggestion: "Use minimal required permissions for this job",
            })
          }
        }
      } catch (error: any) {
        this.addIssue({
          title: `Job Analysis Error: ${jobName}`,
          description: `An error occurred while analyzing job "${jobName}": ${error.message}`,
          severity: "error",
          category: "linting",
          ruleId: "gh-job-analysis-error",
          fixable: false,
        })
      }
    }
  }

  private async analyzeGitHubSteps(steps: any[], jobName: string): Promise<void> {
    let hasCheckout = false
    let hasCache = false
    let hasDependencyInstall = false

    for (const [index, step] of steps.entries()) {
      try {
        // Track common actions
        if (step.uses?.startsWith("actions/checkout")) {
          hasCheckout = true

          // Check checkout version
          if (step.uses === "actions/checkout" || step.uses.includes("@v1") || step.uses.includes("@v2")) {
            this.addIssue({
              title: `Outdated checkout action in job "${jobName}"`,
              description: "Using outdated version of actions/checkout",
              severity: "warning",
              category: "maintainability",
              ruleId: "gh-outdated-checkout",
              suggestion: "Update to actions/checkout@v4",
              exampleCode: "uses: actions/checkout@v4",
            })
          }
        }

        if (step.uses?.includes("cache")) {
          hasCache = true
        }

        // Check for dependency installation
        if (
          step.run &&
          (step.run.includes("npm install") ||
            step.run.includes("yarn install") ||
            step.run.includes("pip install") ||
            step.run.includes("bundle install"))
        ) {
          hasDependencyInstall = true
        }

        // Check action versions
        if (step.uses && !step.uses.includes("@")) {
          this.addIssue({
            title: `Unpinned action in job "${jobName}", step ${index + 1}`,
            description: "Actions should be pinned to specific versions for security and reproducibility",
            severity: "warning",
            category: "security",
            ruleId: "gh-unpinned-action",
            suggestion: "Pin action to a specific version or commit SHA",
            exampleCode: `uses: ${step.uses}@v4`,
          })
        }

        // Check for hardcoded secrets in environment variables
        if (step.env) {
          this.checkForHardcodedSecrets(step.env, `job "${jobName}", step ${index + 1}`)
        }

        // Check for dangerous commands
        if (step.run) {
          this.analyzeDangerousCommands(step.run, `job "${jobName}", step ${index + 1}`)
        }

        // Check for missing step names
        if (!step.name && !step.uses) {
          this.addIssue({
            title: `Missing step name in job "${jobName}", step ${index + 1}`,
            description: "Steps should have descriptive names for better readability",
            severity: "info",
            category: "maintainability",
            ruleId: "gh-missing-step-name",
            suggestion: "Add a descriptive name to the step",
            fixable: true,
          })
        }
      } catch (error: any) {
        this.addIssue({
          title: `Step Analysis Error: ${jobName} - Step ${index + 1}`,
          description: `An error occurred while analyzing step ${index + 1} in job "${jobName}": ${error.message}`,
          severity: "error",
          category: "linting",
          ruleId: "gh-step-analysis-error",
          fixable: false,
        })
      }
    }

    // Optimization suggestions based on step analysis
    if (hasDependencyInstall && !hasCache) {
      this.addOptimization({
        title: `Add dependency caching to job "${jobName}"`,
        description: "Caching dependencies can significantly speed up builds",
        impact: "high",
        effort: "low",
        category: "performance",
        suggestion: "Add actions/cache step before dependency installation",
        exampleCode: `- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: \${{ runner.os }}-node-\${{ hashFiles('**/package-lock.json') }}`,
      })
    }

    if (!hasCheckout && steps.some((step) => step.run)) {
      this.addIssue({
        title: `Missing checkout step in job "${jobName}"`,
        description: "Job has run steps but no checkout action to access repository code",
        severity: "warning",
        category: "linting",
        ruleId: "gh-missing-checkout",
        suggestion: "Add actions/checkout step at the beginning of the job",
        exampleCode: "- uses: actions/checkout@v4",
      })
    }
  }

  private checkForHardcodedSecrets(variables: Record<string, any>, context: string): void {
    Object.entries(variables).forEach(([key, value]) => {
      if (typeof value === "string") {
        const lowerKey = key.toLowerCase()
        const lowerValue = value.toLowerCase()

        // Check for secret-like keys
        const secretKeywords = ["password", "token", "key", "secret", "auth", "credential", "pass"]
        const isSecretKey = secretKeywords.some((keyword) => lowerKey.includes(keyword))

        if (isSecretKey) {
          // Check if it's likely a hardcoded value (not an environment variable reference)
          if (
            !value.startsWith("$") &&
            !value.startsWith("{{") &&
            !value.includes("${") &&
            value.length > 8 &&
            !this.isLikelyPlaceholder(value)
          ) {
            this.addIssue({
              title: `Potential hardcoded secret in ${context}`,
              description: `Variable "${key}" may contain a hardcoded secret: "${this.maskSecret(value)}"`,
              severity: "error",
              category: "security",
              ruleId: "hardcoded-secret",
              suggestion: "Use environment variables or secret management instead of hardcoding secrets",
              impact: "high",
              exampleCode: `${key}: \${{ secrets.${key.toUpperCase()} }}`,
            })
          }
        }

        // Check for common secret patterns in any variable
        const secretPatterns = [
          /^[A-Za-z0-9+/]{40,}={0,2}$/, // Base64-like
          /^[a-f0-9]{32,}$/, // Hex strings
          /^[A-Z0-9]{20,}$/, // API keys
        ]

        secretPatterns.forEach((pattern) => {
          if (pattern.test(value) && !this.isLikelyPlaceholder(value)) {
            this.addIssue({
              title: `Suspicious value pattern in ${context}`,
              description: `Variable "${key}" contains a suspicious pattern that might be a secret`,
              severity: "warning",
              category: "security",
              ruleId: "suspicious-secret-pattern",
              suggestion: "Verify this is not a hardcoded secret",
            })
          }
        })
      }
    })
  }

  private isLikelyPlaceholder(value: string): boolean {
    const placeholders = [
      "example",
      "test",
      "demo",
      "placeholder",
      "your_",
      "my_",
      "sample",
      "dummy",
      "fake",
      "mock",
      "template",
      "replace_me",
      "change_me",
      "todo",
      "fixme",
      "xxx",
      "yyy",
      "zzz",
    ]

    const lowerValue = value.toLowerCase()
    return placeholders.some((placeholder) => lowerValue.includes(placeholder))
  }

  private analyzeDangerousCommands(command: string, context: string): void {
    const dangerousPatterns = [
      {
        pattern: /rm\s+-rf\s+(\/[^/\s]|\$HOME|~|\.\.)/g,
        description: "Dangerous recursive delete of important directories",
        severity: "critical" as const,
      },
      {
        pattern: /chmod\s+(777|666)\s+/g,
        description: "Setting overly permissive file permissions",
        severity: "high" as const,
      },
      {
        pattern: /eval\s+\$\(/g,
        description: "Dynamic code evaluation can be dangerous",
        severity: "high" as const,
      },
      {
        pattern: /(curl|wget).*\s*\|\s*(sh|bash|zsh)/g,
        description: "Piping remote content to shell is risky",
        severity: "critical" as const,
      },
      {
        pattern: /sudo\s+(rm|chmod|chown|mv|cp)\s+\/[^/\s]/g,
        description: "Using sudo with file operations on system directories",
        severity: "high" as const,
      },
      {
        pattern: /docker\s+run.*--privileged/g,
        description: "Running Docker containers in privileged mode",
        severity: "high" as const,
      },
      {
        pattern: /\$\{[^}]*\}\s*\|\s*(sh|bash)/g,
        description: "Variable expansion piped to shell can lead to injection",
        severity: "high" as const,
      },
      {
        pattern: /echo\s+\$[A-Z_]+/g,
        description: "Echoing environment variables can expose secrets in logs",
        severity: "medium" as const,
      },
      {
        pattern: /printenv/g,
        description: "Printing all environment variables can expose secrets",
        severity: "medium" as const,
      },
    ]

    dangerousPatterns.forEach(({ pattern, description, severity }) => {
      if (pattern.test(command)) {
        this.addIssue({
          title: `Dangerous command in ${context}`,
          description: `${description}: "${command.trim()}"`,
          severity: severity === "critical" ? "critical" : severity === "high" ? "error" : "warning",
          category: "security",
          ruleId: "dangerous-command",
          suggestion: "Review command for security implications and use safer alternatives",
          impact: "high",
        })
      }
    })
  }
}

// Platform-specific analyzers
class GitHubActionsAnalyzer implements PlatformAnalyzer {
  constructor(private engine: AdvancedYamlRulesEngine) {}

  async analyze(parsed: ParsedYAML, rawContent: string): Promise<void> {
    this.validateStructure(parsed)

    if (parsed.jobs) {
      await this.analyzeJobs(parsed.jobs)
    }
  }

  validateStructure(parsed: ParsedYAML): Issue[] {
    const issues: Issue[] = []

    if (!parsed.name) {
      this.engine.addIssue({
        title: "Missing workflow name",
        description: "GitHub Actions workflows should have a descriptive name",
        severity: "warning",
        category: "maintainability",
        ruleId: "gh-missing-name",
        suggestion: 'Add a "name" field at the root level',
        fixable: true,
      })
    }

    if (!parsed.on) {
      this.engine.addIssue({
        title: "Missing trigger events",
        description: "Workflow must specify when it should run",
        severity: "error",
        category: "linting",
        ruleId: "gh-missing-triggers",
        suggestion: 'Add an "on" field with trigger events',
        fixable: true,
      })
    }

    return issues
  }

  async analyzeJobs(jobs: Record<string, any>): Promise<void> {
    for (const [jobName, job] of Object.entries(jobs)) {
      if (!job["runs-on"]) {
        this.engine.addIssue({
          title: `Job "${jobName}" missing runs-on`,
          description: "Every job must specify which runner to use",
          severity: "error",
          category: "linting",
          ruleId: "gh-missing-runs-on",
          suggestion: 'Add "runs-on" field with a runner',
          fixable: true,
        })
      }

      if (job.steps) {
        await this.analyzeSteps(job.steps, jobName)
      }
    }
  }

  async analyzeSteps(steps: any[], context: string): Promise<void> {
    steps.forEach((step, index) => {
      if (step.uses && !step.uses.includes("@")) {
        this.engine.addIssue({
          title: `Unpinned action in ${context}, step ${index + 1}`,
          description: "Actions should be pinned to specific versions",
          severity: "warning",
          category: "security",
          ruleId: "gh-unpinned-action",
          suggestion: "Pin action to a specific version",
        })
      }
    })
  }
}

class GitLabCIAnalyzer implements PlatformAnalyzer {
  constructor(private engine: AdvancedYamlRulesEngine) {}

  async analyze(parsed: ParsedYAML, rawContent: string): Promise<void> {
    this.validateStructure(parsed)

    // Analyze GitLab-specific structure
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "object" && value?.script) {
        await this.analyzeJob(key, value)
      }
    }
  }

  validateStructure(parsed: ParsedYAML): Issue[] {
    const issues: Issue[] = []

    if (!parsed.stages && !this.hasJobsWithStages(parsed)) {
      this.engine.addIssue({
        title: "No stages or jobs defined",
        description: "GitLab CI should define either stages or jobs with scripts",
        severity: "error",
        category: "linting",
        ruleId: "gl-no-stages-jobs",
        suggestion: "Define stages or add jobs with script sections",
        fixable: true,
      })
    }

    return issues
  }

  private hasJobsWithStages(parsed: ParsedYAML): boolean {
    return Object.values(parsed).some((value) => typeof value === "object" && value?.script)
  }

  async analyzeJobs(jobs: Record<string, any>): Promise<void> {
    for (const [jobName, job] of Object.entries(jobs)) {
      await this.analyzeJob(jobName, job)
    }
  }

  private async analyzeJob(jobName: string, job: any): Promise<void> {
    if (!job.stage && !job.extends) {
      this.engine.addIssue({
        title: `Job "${jobName}" missing stage`,
        description: "Jobs should specify which stage they belong to",
        severity: "warning",
        category: "maintainability",
        ruleId: "gl-missing-stage",
        suggestion: "Add stage field to organize job execution",
        fixable: true,
      })
    }
  }

  async analyzeSteps(steps: any[], context: string): Promise<void> {
    // GitLab CI doesn't have steps in the same way as GitHub Actions
    // This method is here to satisfy the interface
  }
}

class BitbucketPipelinesAnalyzer implements PlatformAnalyzer {
  constructor(private engine: AdvancedYamlRulesEngine) {}

  async analyze(parsed: ParsedYAML, rawContent: string): Promise<void> {
    this.validateStructure(parsed)

    if (parsed.pipelines) {
      await this.analyzePipelines(parsed.pipelines)
    }
  }

  validateStructure(parsed: ParsedYAML): Issue[] {
    const issues: Issue[] = []

    if (!parsed.pipelines) {
      this.engine.addIssue({
        title: "Missing pipelines section",
        description: "Bitbucket Pipelines configuration must contain a pipelines section",
        severity: "error",
        category: "structure",
        ruleId: "bb-missing-pipelines",
        suggestion: "Add a pipelines section with your build configuration",
        fixable: true,
      })
    }

    return issues
  }

  async analyzeJobs(jobs: Record<string, any>): Promise<void> {
    // Bitbucket uses pipelines instead of jobs
    // This method is here to satisfy the interface
  }

  private async analyzePipelines(pipelines: any): Promise<void> {
    if (pipelines.default) {
      await this.analyzeSteps(pipelines.default, "default")
    }

    if (pipelines.branches) {
      for (const [branchName, steps] of Object.entries(pipelines.branches)) {
        await this.analyzeSteps(steps as any[], `branch ${branchName}`)
      }
    }
  }

  async analyzeSteps(steps: any[], context: string): Promise<void> {
    if (!Array.isArray(steps)) return

    steps.forEach((step, index) => {
      if (typeof step === "object" && step.step) {
        const stepConfig = step.step

        if (!stepConfig.name) {
          this.engine.addIssue({
            title: `Missing step name in ${context}`,
            description: "Steps should have descriptive names",
            severity: "warning",
            category: "maintainability",
            ruleId: "bb-missing-step-name",
            suggestion: "Add a descriptive name to the step",
            fixable: true,
          })
        }

        if (!stepConfig.script) {
          this.engine.addIssue({
            title: `Missing script in ${context}`,
            description: "Each step must contain a script section",
            severity: "error",
            category: "linting",
            ruleId: "bb-missing-script",
            suggestion: "Add a script section with commands to execute",
            fixable: true,
          })
        }
      }
    })
  }
}
