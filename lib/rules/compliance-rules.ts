import { BaseRule, type RuleContext } from "./base-rules"
import type { ParsedYAML } from "../types"

export class ComplianceRule extends BaseRule {
  id = "compliance-standards"
  name = "Compliance Standards"
  description = "Checks compliance with industry standards (SOC2, GDPR, HIPAA, etc.)"
  category = "security"
  severity = "warning" as const
  level = "expert" as const
  platforms = ["all"]

  check(parsed: ParsedYAML, context: RuleContext): void {
    this.checkAuditLogging(parsed, context)
    this.checkDataHandling(context)
    this.checkAccessControls(parsed, context)
    this.checkEncryption(context)
    this.checkRetentionPolicies(parsed, context)
  }

  private checkAuditLogging(parsed: ParsedYAML, context: RuleContext): void {
    const hasLogging = context.rawContent.toLowerCase().includes("log") ||
                      context.rawContent.toLowerCase().includes("audit")

    if (!hasLogging) {
      context.addIssue({
        title: "Missing audit logging",
        description: "No audit logging detected - required for compliance standards",
        severity: "warning",
        category: "security",
        ruleId: "missing-audit-logging",
        suggestion: "Implement comprehensive audit logging for compliance",
        exampleCode: `# Add logging steps
- name: Audit log
  run: echo "Job started at $(date)" >> audit.log`
      })
    }
  }

  private checkDataHandling(context: RuleContext): void {
    const dataPatterns = [
      /personal.*data/gi,
      /pii/gi,
      /gdpr/gi,
      /customer.*data/gi,
      /sensitive.*data/gi
    ]

    const hasDataHandling = dataPatterns.some(pattern => 
      pattern.test(context.rawContent)
    )

    if (hasDataHandling) {
      context.addIssue({
        title: "Data handling detected",
        description: "Pipeline handles sensitive data - ensure compliance measures are in place",
        severity: "warning",
        category: "security",
        ruleId: "data-handling-compliance",
        suggestion: "Implement data protection measures (encryption, access controls, retention policies)"
      })
    }
  }

  private checkAccessControls(parsed: ParsedYAML, context: RuleContext): void {
    if (context.platform === "github-actions") {
      // Check for environment protection rules
      if (parsed.jobs) {
        Object.entries(parsed.jobs).forEach(([jobName, job]: [string, any]) => {
          if (job.environment && typeof job.environment === "string") {
            // Production environments should have protection rules
            if (job.environment.toLowerCase().includes("prod")) {
              context.addOptimization({
                title: `Add protection rules for production environment in job "${jobName}"`,
                description: "Production deployments should have approval requirements",
                impact: "high",
                effort: "low",
                category: "security",
                suggestion: "Configure environment protection rules in GitHub repository settings"
              })
            }
          }
        })
      }
    }
  }

  private checkEncryption(context: RuleContext): void {
    const encryptionKeywords = [
      "encrypt", "decrypt", "tls", "ssl", "https", "certificate"
    ]

    const hasEncryption = encryptionKeywords.some(keyword => 
      context.rawContent.toLowerCase().includes(keyword)
    )

    if (!hasEncryption && context.rawContent.includes("deploy")) {
      context.addIssue({
        title: "Missing encryption configuration",
        description: "Deployment pipeline should use encryption for data in transit",
        severity: "warning",
        category: "security",
        ruleId: "missing-encryption",
        suggestion: "Ensure all communications use TLS/SSL encryption"
      })
    }
  }

  private checkRetentionPolicies(parsed: ParsedYAML, context: RuleContext): void {
    if (context.platform === "github-actions") {
      // Check for artifact retention settings
      if (parsed.jobs) {
        Object.entries(parsed.jobs).forEach(([jobName, job]: [string, any]) => {
          if (job.steps) {
            const artifactSteps = job.steps.filter((step: any) => 
              step.uses && step.uses.includes("upload-artifact")
            )

            artifactSteps.forEach((step: any) => {
              if (!step.with?.["retention-days"]) {
                context.addOptimization({
                  title: `Add retention policy for artifacts in job "${jobName}"`,
                  description: "Artifacts should have explicit retention policies for compliance",
                  impact: "low",
                  effort: "low",
                  category: "security",
                  suggestion: "Set appropriate retention-days for artifacts",
                  exampleCode: `with:
  retention-days: 30`
                })
              }
            })
          }
        })
      }
    }
  }
}

export class SecurityScanningRule extends BaseRule {
  id = "security-scanning"
  name = "Security Scanning"
  description = "Ensures proper security scanning is implemented"
  category = "security"
  severity = "warning" as const
  level = "senior" as const
  platforms = ["all"]

  check(parsed: ParsedYAML, context: RuleContext): void {
    this.checkVulnerabilityScanning(context)
    this.checkCodeScanning(context)
    this.checkDependencyScanning(context)
    this.checkContainerScanning(context)
    this.checkSecretsScanning(context)
  }

  private checkVulnerabilityScanning(context: RuleContext): void {
    const vulnScanners = [
      "snyk", "trivy", "clair", "anchore", "twistlock", "aqua",
      "veracode", "checkmarx", "sonarqube", "whitesource"
    ]

    const hasVulnScanning = vulnScanners.some(scanner => 
      context.rawContent.toLowerCase().includes(scanner)
    )

    if (!hasVulnScanning) {
      context.addIssue({
        title: "Missing vulnerability scanning",
        description: "No vulnerability scanning tools detected",
        severity: "warning",
        category: "security",
        ruleId: "missing-vuln-scanning",
        suggestion: "Add vulnerability scanning to your pipeline",
        exampleCode: `- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    scan-type: 'fs'
    scan-ref: '.'`
      })
    }
  }

  private checkCodeScanning(context: RuleContext): void {
    const codeAnalysisTools = [
      "codeql", "sonarqube", "eslint", "bandit", "brakeman",
      "semgrep", "gosec", "safety", "flake8"
    ]

    const hasCodeScanning = codeAnalysisTools.some(tool => 
      context.rawContent.toLowerCase().includes(tool)
    )

    if (!hasCodeScanning) {
      context.addOptimization({
        title: "Add static code analysis",
        description: "Static code analysis helps identify security vulnerabilities early",
        impact: "high",
        effort: "medium",
        category: "security",
        suggestion: "Integrate static analysis tools into your pipeline"
      })
    }
  }

  private checkDependencyScanning(context: RuleContext): void {
    const depScanners = [
      "npm audit", "yarn audit", "pip-audit", "safety", "bundler-audit",
      "retire.js", "dependency-check", "snyk"
    ]

    const hasDependencyScanning = depScanners.some(scanner => 
      context.rawContent.toLowerCase().includes(scanner.toLowerCase())
    )

    if (!hasDependencyScanning && this.hasPackageManager(context)) {
      context.addIssue({
        title: "Missing dependency vulnerability scanning",
        description: "Dependencies should be scanned for known vulnerabilities",
        severity: "warning",
        category: "security",
        ruleId: "missing-dep-scanning",
        suggestion: "Add dependency vulnerability scanning",
        exampleCode: `- name: Audit dependencies
  run: npm audit --audit-level=high`
      })
    }
  }

  private checkContainerScanning(context: RuleContext): void {
    const hasDocker = context.rawContent.toLowerCase().includes("docker")
    const containerScanners = ["trivy", "clair", "anchore", "twistlock"]

    if (hasDocker) {
      const hasContainerScanning = containerScanners.some(scanner => 
        context.rawContent.toLowerCase().includes(scanner)
      )

      if (!hasContainerScanning) {
        context.addIssue({
          title: "Missing container security scanning",
          description: "Docker containers should be scanned for vulnerabilities",
          severity: "warning",
          category: "security",
          ruleId: "missing-container-scanning",
          suggestion: "Add container vulnerability scanning",
          exampleCode: `- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: 'myapp:latest'`
        })
      }
    }
  }

  private checkSecretsScanning(context: RuleContext): void {
    const secretScanners = ["truffleHog", "gitleaks", "detect-secrets", "git-secrets"]

    const hasSecretsScanning = secretScanners.some(scanner => 
      context.rawContent.toLowerCase().includes(scanner.toLowerCase())
    )

    if (!hasSecretsScanning) {
      context.addOptimization({
        title: "Add secrets scanning",
        description: "Scan for accidentally committed secrets",
        impact: "high",
        effort: "low",
        category: "security",
        suggestion: "Add secrets scanning to prevent credential leaks",
        exampleCode: `- name: Run gitleaks
  uses: zricethezav/gitleaks-action@master`
      })
    }
  }

  private hasPackageManager(context: RuleContext): boolean {
    const packageManagers = ["npm", "yarn", "pip", "composer", "bundle", "go mod"]
    return packageManagers.some(pm => 
      context.rawContent.toLowerCase().includes(pm)
    )
  }
}
