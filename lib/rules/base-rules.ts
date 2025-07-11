import type { Issue, Optimization, SecurityVulnerability, ParsedYAML } from "../types"

export interface RuleContext {
  rawContent: string
  contentLines: string[]
  platform: string
  addIssue: (issue: Issue) => void
  addOptimization: (optimization: Optimization) => void
  addSecurityVulnerability: (vulnerability: SecurityVulnerability) => void
  findPatternLines: (pattern: string) => number[]
}

export abstract class BaseRule {
  abstract id: string
  abstract name: string
  abstract description: string
  abstract category: string
  abstract severity: "critical" | "error" | "warning" | "info"
  abstract level: "junior" | "intermediate" | "senior" | "expert"
  abstract platforms: string[]

  abstract check(parsed: ParsedYAML, context: RuleContext): void

  protected matchesPlatform(platform: string): boolean {
    return this.platforms.includes("all") || this.platforms.includes(platform)
  }

  protected isValidYamlPath(obj: any, path: string): boolean {
    const parts = path.split(".")
    let current = obj
    for (const part of parts) {
      if (current && typeof current === "object" && part in current) {
        current = current[part]
      } else {
        return false
      }
    }
    return true
  }

  protected getYamlValue(obj: any, path: string): any {
    const parts = path.split(".")
    let current = obj
    for (const part of parts) {
      if (current && typeof current === "object" && part in current) {
        current = current[part]
      } else {
        return undefined
      }
    }
    return current
  }
}
