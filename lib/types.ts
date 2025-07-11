export interface AnalysisConfig {
  enableSecurityAnalysis?: boolean
  enablePerformanceAnalysis?: boolean
  enableCostAnalysis?: boolean
  maxFileSize?: number
  strictMode?: boolean
  customRules?: CustomRule[]
}

export interface CustomRule {
  id: string
  name: string
  description: string
  severity: IssueSeverity
  category: IssueCategory
  check: (parsed: ParsedYAML, rawContent: string, platform: string) => Issue[]
}

export type IssueSeverity = "critical" | "error" | "warning" | "info"
export type IssueCategory =
  | "security"
  | "performance"
  | "maintainability"
  | "cost"
  | "linting"
  | "best-practice"
  | "syntax"
  | "structure"
export type OptimizationImpact = "high" | "medium" | "low"
export type OptimizationEffort = "high" | "medium" | "low"
export type RecommendationPriority = "high" | "medium" | "low"

export interface Issue {
  title: string
  description: string
  severity: IssueSeverity
  category: IssueCategory
  ruleId?: string
  suggestion?: string
  exampleCode?: string
  fixable?: boolean
  estimatedFixTime?: string
  impact?: string
  line?: number
  lineNumbers?: number[]
  documentationUrl?: string
}

export interface Optimization {
  title: string
  description: string
  impact: OptimizationImpact
  effort: OptimizationEffort
  category: IssueCategory
  suggestion: string
  exampleCode?: string
  lineNumbers?: number[]
}

export interface SecurityVulnerability {
  title: string
  description: string
  severity: "critical" | "high" | "medium" | "low"
  recommendation: string
  line?: number
  cve?: string
  cvssScore?: number
}

export interface SecurityReport {
  overallScore: number
  vulnerabilities: SecurityVulnerability[]
  exposedSecrets?: number
  unsafePermissions?: number
  recommendations?: string[]
}

export interface CostEstimation {
  currentMonthlyCost: number
  optimizedMonthlyCost: number
  potentialSavings: number
  savingsPercentage: number
  recommendations: string[]
  breakdown: {
    compute: number
    storage: number
    network: number
    other: number
  }
}

export interface PerformanceMetrics {
  estimatedBuildTime: number
  parallelizationScore: number
  cacheEfficiency: number
  resourceUtilization: number
}

export interface ComplexityMetrics {
  cyclomaticComplexity: number
  cognitiveComplexity: number
  maintainabilityIndex: number
  linesOfCode: number
}

export interface CoverageMetrics {
  documentationCoverage: number
  errorHandlingCoverage: number
  testCoverage: number
}

export interface Metrics {
  jobsCount: number
  stepsCount: number
  triggersCount: number
  parallelizableJobs: number
  cacheUsage: number
  securityScore: number
  performance: PerformanceMetrics
  complexity: ComplexityMetrics
  coverage: CoverageMetrics
}

export interface Recommendation {
  title: string
  description: string
  priority: RecommendationPriority
  effort: OptimizationEffort
  impact: OptimizationImpact
  category: IssueCategory
}

export interface PlatformDetectionResult {
  platform: string
  confidence: number
  indicators: string[]
}

export interface AnalysisResult {
  platform: string
  score: number
  issues: Issue[]
  optimizations: Optimization[]
  securityReport?: SecurityReport
  costEstimation?: CostEstimation
  recommendations: Recommendation[]
  dependencyGraph: string
  metrics: Metrics
  analysisTime?: number
  configUsed?: AnalysisConfig
  platformDetection?: PlatformDetectionResult
}

export type ParsedYAML = Record<string, any>

export interface PlatformAnalyzer {
  analyze(parsed: ParsedYAML, rawContent: string): Promise<void>
  validateStructure(parsed: ParsedYAML): Issue[]
  analyzeJobs(jobs: Record<string, any>): Promise<void>
  analyzeSteps(steps: any[], context: string): Promise<void>
}

export interface RuleEngine {
  addRule(rule: CustomRule): void
  removeRule(ruleId: string): void
  executeRules(parsed: ParsedYAML, rawContent: string, platform: string): Issue[]
}
