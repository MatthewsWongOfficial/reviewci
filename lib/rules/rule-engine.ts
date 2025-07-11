import type { BaseRule, RuleContext } from "./base-rules"
import type { ParsedYAML, Issue, Optimization, SecurityVulnerability } from "../types"

// Import all rule categories
import { HardcodedSecretsRule, DangerousCommandsRule, PermissionsRule } from "./security-rules"
import { CachingRule, ParallelizationRule, ResourceOptimizationRule } from "./performance-rules"
import { ComplianceRule, SecurityScanningRule } from "./compliance-rules"
import { CostOptimizationRule, ConcurrencyRule } from "./cost-optimization-rules"
import { DocumentationRule, NamingConventionsRule, ComplexityRule } from "./maintainability-rules"

export class EnhancedRulesEngine {
  private rules: BaseRule[] = []
  private issues: Issue[] = []
  private optimizations: Optimization[] = []
  private securityVulnerabilities: SecurityVulnerability[] = []

  constructor() {
    this.initializeRules()
  }

  private initializeRules(): void {
    // Security Rules
    this.rules.push(new HardcodedSecretsRule())
    this.rules.push(new DangerousCommandsRule())
    this.rules.push(new PermissionsRule())
    this.rules.push(new ComplianceRule())
    this.rules.push(new SecurityScanningRule())

    // Performance Rules
    this.rules.push(new CachingRule())
    this.rules.push(new ParallelizationRule())
    this.rules.push(new ResourceOptimizationRule())

    // Cost Optimization Rules
    this.rules.push(new CostOptimizationRule())
    this.rules.push(new ConcurrencyRule())

    // Maintainability Rules
    this.rules.push(new DocumentationRule())
    this.rules.push(new NamingConventionsRule())
    this.rules.push(new ComplexityRule())
  }

  executeRules(
    parsed: ParsedYAML,
    rawContent: string,
    platform: string,
    level: "junior" | "intermediate" | "senior" | "expert" | "all" = "all",
  ): {
    issues: Issue[]
    optimizations: Optimization[]
    securityVulnerabilities: SecurityVulnerability[]
  } {
    // Reset collections
    this.issues = []
    this.optimizations = []
    this.securityVulnerabilities = []

    // Create context
    const context: RuleContext = {
      rawContent,
      contentLines: rawContent.split("\n"),
      platform,
      addIssue: (issue) => this.issues.push(issue),
      addOptimization: (optimization) => this.optimizations.push(optimization),
      addSecurityVulnerability: (vulnerability) => this.securityVulnerabilities.push(vulnerability),
      findPatternLines: (pattern) => this.findPatternLines(pattern, rawContent),
    }

    // Execute applicable rules
    this.rules.forEach((rule) => {
      try {
        // Check if rule applies to platform and level
        if (rule.matchesPlatform(platform) && this.matchesLevel(rule.level, level)) {
          rule.check(parsed, context)
        }
      } catch (error) {
        console.error(`Error executing rule ${rule.id}:`, error)
        this.issues.push({
          title: `Rule execution error: ${rule.name}`,
          description: `Error executing rule: ${error instanceof Error ? error.message : "Unknown error"}`,
          severity: "error",
          category: "linting",
          ruleId: `rule-error-${rule.id}`,
          fixable: false,
        })
      }
    })

    return {
      issues: this.issues,
      optimizations: this.optimizations,
      securityVulnerabilities: this.securityVulnerabilities,
    }
  }

  private matchesLevel(ruleLevel: string, targetLevel: string): boolean {
    if (targetLevel === "all") return true

    const levels = ["junior", "intermediate", "senior", "expert"]
    const ruleLevelIndex = levels.indexOf(ruleLevel)
    const targetLevelIndex = levels.indexOf(targetLevel)

    return ruleLevelIndex <= targetLevelIndex
  }

  private findPatternLines(pattern: string, content: string): number[] {
    const lines: number[] = []
    const regex = new RegExp(pattern, "gi")
    const contentLines = content.split("\n")

    contentLines.forEach((line, index) => {
      if (regex.test(line)) {
        lines.push(index + 1)
      }
    })

    return lines
  }

  getRulesByCategory(): Record<string, BaseRule[]> {
    const categories: Record<string, BaseRule[]> = {}

    this.rules.forEach((rule) => {
      if (!categories[rule.category]) {
        categories[rule.category] = []
      }
      categories[rule.category].push(rule)
    })

    return categories
  }

  getRulesByLevel(): Record<string, BaseRule[]> {
    const levels: Record<string, BaseRule[]> = {}

    this.rules.forEach((rule) => {
      if (!levels[rule.level]) {
        levels[rule.level] = []
      }
      levels[rule.level].push(rule)
    })

    return levels
  }

  getRulesByPlatform(platform: string): BaseRule[] {
    return this.rules.filter((rule) => rule.matchesPlatform(platform))
  }
}
