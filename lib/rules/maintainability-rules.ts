import { BaseRule, type RuleContext } from "./base-rules"
import type { ParsedYAML } from "../types"

export class DocumentationRule extends BaseRule {
  id = "documentation-standards"
  name = "Documentation Standards"
  description = "Ensures proper documentation and naming conventions"
  category = "maintainability"
  severity = "info" as const
  level = "junior" as const
  platforms = ["all"]

  check(parsed: ParsedYAML, context: RuleContext): void {
    this.checkWorkflowDocumentation(parsed, context)
    this.checkJobDocumentation(parsed, context)
    this.checkStepDocumentation(parsed, context)
    this.checkCommentCoverage(context)
  }

  private checkWorkflowDocumentation(parsed: ParsedYAML, context: RuleContext): void {
    if (context.platform === "github-actions") {
      if (!parsed.name) {
        context.addIssue({
          title: "Missing workflow name",
          description: "Workflows should have descriptive names",
          severity: "warning",
          category: "maintainability",
          ruleId: "missing-workflow-name",
          suggestion: "Add a descriptive name to your workflow",
          exampleCode: 'name: "CI/CD Pipeline"'
        })
      }

      if (!parsed.on) {
        context.addIssue({
          title: "Missing workflow triggers",
          description: "Workflow must specify when it should run",
          severity: "error",
          category: "maintainability",
          ruleId: "missing-workflow-triggers",
          suggestion: "Add trigger events to your workflow"
        })
      }
    }
  }

  private checkJobDocumentation(parsed: ParsedYAML, context: RuleContext): void {
    if (parsed.jobs) {
      Object.entries(parsed.jobs).forEach(([jobName, job]: [string, any]) => {
     if (!job.name || job.name.length < 5) {
  context.addIssue({
    title: `Missing or too short name for job "${jobName}"`,
    description: "Job names should be at least 5 characters long for clarity",
    severity: "info",
    category: "maintainability",
    ruleId: "short-job-name",
    suggestion: `Use a more descriptive 'name' field for job "${jobName}"`,
    fixable: true
  });
}


        // Check for job description or comments
        if (!job.description && !this.hasNearbyComment(jobName, context)) {
          context.addOptimization({
            title: `Add description to job "${jobName}"`,
            description: "Complex jobs should have descriptions explaining their purpose",
            impact: "low",
            effort: "low",
            category: "maintainability",
            suggestion: "Add a description field or comment explaining the job's purpose"
          })
        }
      })
    }
  }

  private checkStepDocumentation(parsed: ParsedYAML, context: RuleContext): void {
    if (parsed.jobs) {
      Object.entries(parsed.jobs).forEach(([jobName, job]: [string, any]) => {
        if (job.steps && Array.isArray(job.steps)) {
          job.steps.forEach((step: any, index: number) => {
            if (!step.name && !step.uses) {
              context.addIssue({
                title: `Missing name for step ${index + 1} in job "${jobName}"`,
                description: "Steps should have descriptive names",
                severity: "info",
                category: "maintainability",
                ruleId: "missing-step-name",
                suggestion: `Add a 'name' field to step ${index + 1}`,
                fixable: true
              })
            }

            // Check for complex run commands without names
            if (step.run && step.run.length > 100 && !step.name) {
              context.addIssue({
                title: `Complex step without name in job "${jobName}"`,
                description: "Complex run commands should have descriptive names",
                severity: "warning",
                category: "maintainability",
                ruleId: "complex-step-no-name",
                suggestion: "Add a descriptive name to complex run commands"
              })
            }
          })
        }
      })
    }
  }

private checkCommentCoverage(context: RuleContext): void {
  const lines = context.contentLines;
  let complexityScore = 0;
  let hasAnyComment = lines.some(line => line.trim().startsWith("#"));

  for (const line of lines) {
    const trimmed = line.trim();

    if (/if:|when:|condition:/.test(trimmed)) complexityScore++;
    if (/^\s*- run:|script:/.test(trimmed)) complexityScore++;
    if (/^\s{4,}/.test(trimmed)) complexityScore++; // deeply nested

    // long inline commands
    if (trimmed.length > 100 && /\$|\|\|/.test(trimmed)) complexityScore++;
  }

  // Only recommend comments if complexity is present and no comments exist
  if (complexityScore >= 3 && !hasAnyComment) {
    context.addOptimization({
      title: "Consider clarifying complex sections",
      description: "The configuration includes logic or structures that may benefit from inline clarification.",
      impact: "medium",
      effort: "low",
      category: "maintainability",
      suggestion: "Add brief comments to explain tricky conditions, scripts, or workflows. This helps future reviewers understand intent faster."
    });
  }
}



  private hasNearbyComment(jobName: string, context: RuleContext): boolean {
    const jobLineIndex = context.contentLines.findIndex(line => 
      line.includes(`${jobName}:`)
    )
    
    if (jobLineIndex === -1) return false

    // Check 3 lines before and after for comments
    for (let i = Math.max(0, jobLineIndex - 3); i <= Math.min(context.contentLines.length - 1, jobLineIndex + 3); i++) {
      if (context.contentLines[i].trim().startsWith("#")) {
        return true
      }
    }
    
    return false
  }
}

export class NamingConventionsRule extends BaseRule {
  id = "naming-conventions"
  name = "Naming Conventions"
  description = "Enforces consistent naming conventions across the pipeline"
  category = "maintainability"
  severity = "info" as const
  level = "intermediate" as const
  platforms = ["all"]

  check(parsed: ParsedYAML, context: RuleContext): void {
    this.checkJobNaming(parsed, context)
    this.checkStepNaming(parsed, context)
    this.checkVariableNaming(parsed, context)
    this.checkEnvironmentNaming(parsed, context)
  }

  private checkJobNaming(parsed: ParsedYAML, context: RuleContext): void {
    if (!parsed.jobs) return

    Object.keys(parsed.jobs).forEach(jobName => {
      // Check for kebab-case convention
      if (!this.isKebabCase(jobName) && !this.isSnakeCase(jobName)) {
        context.addIssue({
          title: `Inconsistent job naming: "${jobName}"`,
          description: "Job names should use kebab-case or snake_case for consistency",
          severity: "info",
          category: "maintainability",
          ruleId: "job-naming-convention",
          suggestion: "Use kebab-case (my-job) or snake_case (my_job) for job names"
        })
      }

      // Check for descriptive names
      if (jobName.length < 3 || /^(job|step|task)\d*$/i.test(jobName)) {
        context.addIssue({
          title: `Non-descriptive job name: "${jobName}"`,
          description: "Job names should be descriptive of their purpose",
          severity: "info",
          category: "maintainability",
          ruleId: "non-descriptive-job-name",
          suggestion: "Use descriptive names like 'build-and-test' or 'deploy-to-staging'"
        })
      }
    })
  }

  private checkStepNaming(parsed: ParsedYAML, context: RuleContext): void {
    if (!parsed.jobs) return

    Object.entries(parsed.jobs).forEach(([jobName, job]: [string, any]) => {
      if (job.steps && Array.isArray(job.steps)) {
        job.steps.forEach((step: any, index: number) => {
          if (step.name) {
            // Check for proper capitalization
            if (!this.isTitleCase(step.name) && !this.isSentenceCase(step.name)) {
              context.addIssue({
                title: `Inconsistent step naming in job "${jobName}"`,
                description: `Step "${step.name}" should use Title Case or Sentence case`,
                severity: "info",
                category: "maintainability",
                ruleId: "step-naming-convention",
                suggestion: "Use 'Title Case' or 'Sentence case' for step names"
              })
            }

            // Check for action verbs
            if (!this.startsWithActionVerb(step.name)) {
              context.addOptimization({
                title: `Use action verbs in step names`,
                description: `Step "${step.name}" could be more descriptive with an action verb`,
                impact: "low",
                effort: "low",
                category: "maintainability",
                suggestion: "Start step names with action verbs like 'Build', 'Test', 'Deploy'"
              })
            }
          }
        })
      }
    })
  }

  private checkVariableNaming(parsed: ParsedYAML, context: RuleContext): void {
    // Check environment variables
    const envVarPattern = /\$\{?([A-Z_][A-Z0-9_]*)\}?/g
    let match

    while ((match = envVarPattern.exec(context.rawContent)) !== null) {
      const varName = match[1]
      
      if (!this.isScreamingSnakeCase(varName)) {
        context.addIssue({
          title: `Inconsistent environment variable naming: "${varName}"`,
          description: "Environment variables should use SCREAMING_SNAKE_CASE",
          severity: "info",
          category: "maintainability",
          ruleId: "env-var-naming",
          suggestion: "Use SCREAMING_SNAKE_CASE for environment variables"
        })
      }
    }

    // Check workflow variables
    if (parsed.env) {
      Object.keys(parsed.env).forEach(varName => {
        if (!this.isScreamingSnakeCase(varName)) {
          context.addIssue({
            title: `Inconsistent workflow variable naming: "${varName}"`,
            description: "Workflow variables should use SCREAMING_SNAKE_CASE",
            severity: "info",
            category: "maintainability",
            ruleId: "workflow-var-naming",
            suggestion: "Use SCREAMING_SNAKE_CASE for workflow variables"
          })
        }
      })
    }
  }

  private checkEnvironmentNaming(parsed: ParsedYAML, context: RuleContext): void {
    if (!parsed.jobs) return

    Object.entries(parsed.jobs).forEach(([jobName, job]: [string, any]) => {
      if (job.environment) {
        const envName = typeof job.environment === "string" ? 
          job.environment : job.environment.name

        if (envName && !this.isKebabCase(envName) && !this.isSnakeCase(envName)) {
          context.addIssue({
            title: `Inconsistent environment naming: "${envName}"`,
            description: "Environment names should use kebab-case or snake_case",
            severity: "info",
            category: "maintainability",
            ruleId: "environment-naming",
            suggestion: "Use kebab-case or snake_case for environment names"
          })
        }
      }
    })
  }

  private isKebabCase(str: string): boolean {
    return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(str)
  }

  private isSnakeCase(str: string): boolean {
    return /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/.test(str)
  }

  private isScreamingSnakeCase(str: string): boolean {
    return /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$/.test(str)
  }

  private isTitleCase(str: string): boolean {
    return /^[A-Z][a-z]*(\s[A-Z][a-z]*)*$/.test(str)
  }

  private isSentenceCase(str: string): boolean {
    return /^[A-Z][a-z\s]*$/.test(str)
  }

  private startsWithActionVerb(str: string): boolean {
    const actionVerbs = [
      'build', 'test', 'deploy', 'install', 'setup', 'configure', 'run',
      'execute', 'create', 'generate', 'validate', 'check', 'verify',
      'upload', 'download', 'publish', 'release', 'clean', 'prepare'
    ]
    
    const firstWord = str.toLowerCase().split(' ')[0]
    return actionVerbs.includes(firstWord)
  }
}

export class ComplexityRule extends BaseRule {
  id = "complexity-analysis"
  name = "Complexity Analysis"
  description = "Analyzes pipeline complexity and suggests simplifications"
  category = "maintainability"
  severity = "info" as const
  level = "senior" as const
  platforms = ["all"]

  check(parsed: ParsedYAML, context: RuleContext): void {
    this.checkJobComplexity(parsed, context)
    this.checkNestingDepth(parsed, context)
    this.checkConditionalComplexity(parsed, context)
    this.checkDuplication(parsed, context)
  }

  private checkJobComplexity(parsed: ParsedYAML, context: RuleContext): void {
    if (!parsed.jobs) return

    Object.entries(parsed.jobs).forEach(([jobName, job]: [string, any]) => {
      let complexityScore = 0

      // Count steps
      if (job.steps && Array.isArray(job.steps)) {
        complexityScore += job.steps.length

        // Add complexity for conditional steps
        job.steps.forEach((step: any) => {
          if (step.if) complexityScore += 2
          if (step.run && step.run.length > 200) complexityScore += 1
        })
      }

      // Add complexity for matrix strategies
      if (job.strategy?.matrix) {
        const matrixSize = this.calculateMatrixSize(job.strategy.matrix)
        complexityScore += Math.log2(matrixSize)
      }

      // Add complexity for services
      if (job.services) {
        complexityScore += Object.keys(job.services).length
      }

      if (complexityScore > 20) {
        context.addIssue({
          title: `High complexity in job "${jobName}"`,
          description: `Job has complexity score of ${Math.round(complexityScore)} - consider breaking it down`,
          severity: "warning",
          category: "maintainability",
          ruleId: "high-job-complexity",
          suggestion: "Break complex jobs into smaller, focused jobs"
        })
      }
    })
  }

  private checkNestingDepth(parsed: ParsedYAML, context: RuleContext): void {
    const maxDepth = this.calculateMaxNestingDepth(parsed)
    
    if (maxDepth > 6) {
      context.addIssue({
        title: "Deep nesting detected",
        description: `Configuration has nesting depth of ${maxDepth} levels`,
        severity: "warning",
        category: "maintainability",
        ruleId: "deep-nesting",
        suggestion: "Consider flattening the configuration structure"
      })
    }
  }

  private checkConditionalComplexity(parsed: ParsedYAML, context: RuleContext): void {
    const conditionalCount = this.countConditionals(parsed)
    
    if (conditionalCount > 10) {
      context.addIssue({
        title: "High conditional complexity",
        description: `Configuration has ${conditionalCount} conditional statements`,
        severity: "warning",
        category: "maintainability",
        ruleId: "high-conditional-complexity",
        suggestion: "Consider simplifying conditional logic or using reusable workflows"
      })
    }
  }

  private checkDuplication(parsed: ParsedYAML, context: RuleContext): void {
    if (!parsed.jobs) return

    const jobSteps = new Map<string, string[]>()
    
    // Collect step signatures for each job
    Object.entries(parsed.jobs).forEach(([jobName, job]: [string, any]) => {
      if (job.steps && Array.isArray(job.steps)) {
        const stepSignatures = job.steps.map((step: any) => {
          if (step.uses) return `uses:${step.uses.split('@')[0]}`
          if (step.run) return `run:${step.run.substring(0, 50)}`
          return 'unknown'
        })
        jobSteps.set(jobName, stepSignatures)
      }
    })

    // Find duplicated step patterns
    const duplicatedPatterns = this.findDuplicatedPatterns(jobSteps)
    
    duplicatedPatterns.forEach(({ pattern, jobs }) => {
      if (jobs.length > 2) {
        context.addOptimization({
          title: "Duplicated step patterns detected",
          description: `Pattern "${pattern}" is repeated in jobs: ${jobs.join(', ')}`,
          impact: "medium",
          effort: "medium",
          category: "maintainability",
          suggestion: "Consider extracting common steps into reusable workflows or composite actions"
        })
      }
    })
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

  private calculateMaxNestingDepth(obj: any, currentDepth = 0): number {
    if (typeof obj !== 'object' || obj === null) {
      return currentDepth
    }

    let maxDepth = currentDepth
    
    for (const value of Object.values(obj)) {
      const depth = this.calculateMaxNestingDepth(value, currentDepth + 1)
      maxDepth = Math.max(maxDepth, depth)
    }
    
    return maxDepth
  }

  private countConditionals(obj: any): number {
    if (typeof obj !== 'object' || obj === null) {
      return 0
    }

    let count = 0
    
    for (const [key, value] of Object.entries(obj)) {
      if (key === 'if' || key === 'when' || key === 'condition') {
        count++
      }
      count += this.countConditionals(value)
    }
    
    return count
  }

  private findDuplicatedPatterns(jobSteps: Map<string, string[]>): Array<{pattern: string, jobs: string[]}> {
    const patterns = new Map<string, string[]>()
    
    jobSteps.forEach((steps, jobName) => {
      // Create patterns from consecutive steps
      for (let i = 0; i < steps.length - 1; i++) {
        const pattern = steps.slice(i, i + 3).join(' -> ')
        if (!patterns.has(pattern)) {
          patterns.set(pattern, [])
        }
        patterns.get(pattern)!.push(jobName)
      }
    })

    return Array.from(patterns.entries())
      .filter(([_, jobs]) => jobs.length > 1)
      .map(([pattern, jobs]) => ({ pattern, jobs: [...new Set(jobs)] }))
  }
}
