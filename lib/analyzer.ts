import { AdvancedYamlRulesEngine } from "./advanced-yaml-rules"
import { SimpleYamlParser } from "./yaml-parser"
import type { AnalysisResult, AnalysisConfig, ParsedYAML, PlatformDetectionResult } from "./types"

export async function analyzeCICD(
  content: string,
  filename?: string,
  config?: AnalysisConfig,
): Promise<AnalysisResult> {
  const startTime = Date.now()
  
  const defaultConfig: AnalysisConfig = {
    strictMode: false,
    enablePerformanceAnalysis: true,
    enableSecurityAnalysis: true,
    enableCostAnalysis: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    customRules: [],
  }
  
  const analysisConfig = { ...defaultConfig, ...config }

  try {
    // Validate input
    if (!content || typeof content !== 'string') {
      throw new Error('Invalid input: content must be a non-empty string')
    }

    if (content.length > analysisConfig.maxFileSize!) {
      throw new Error(`File size exceeds limit: ${content.length} bytes > ${analysisConfig.maxFileSize} bytes`)
    }

    // Parse YAML using our simple parser
    let parsed: ParsedYAML
    try {
      parsed = SimpleYamlParser.parse(content) as ParsedYAML
    } catch (yamlError: any) {
      const errorMessage = yamlError.message || "Unknown YAML parsing error"
      throw new Error(`YAML parsing failed: ${errorMessage}`)
    }

    if (!parsed || typeof parsed !== "object") {
      throw new Error("Invalid YAML structure: Expected object at root level")
    }

    // Detect platform
    const platformDetection = detectPlatform(parsed, filename)
    
    if (platformDetection.confidence < 0.5) {
      console.warn("Low confidence platform detection:", platformDetection)
    }

    // Initialize rules engine
    const rulesEngine = new AdvancedYamlRulesEngine(analysisConfig)

    // Run comprehensive analysis
    const analysisResult = await rulesEngine.analyze(
      parsed, 
      platformDetection.platform, 
      content
    )

    const endTime = Date.now()

    return {
      ...analysisResult,
      platform: platformDetection.platform,
      analysisTime: endTime - startTime,
      configUsed: analysisConfig,
      platformDetection,
    }
  } catch (error) {
    const endTime = Date.now()
    
    // Return error result instead of throwing
    return {
      platform: "unknown",
      score: 0,
      issues: [
        {
          title: "Analysis Failed",
          description: error instanceof Error ? error.message : "Unknown analysis error",
          severity: "error",
          category: "linting",
          ruleId: "analysis-error",
          fixable: false,
        },
      ],
      optimizations: [],
      recommendations: [],
      dependencyGraph: "",
      metrics: {
        jobsCount: 0,
        stepsCount: 0,
        triggersCount: 0,
        parallelizableJobs: 0,
        cacheUsage: 0,
        securityScore: 0,
        performance: {
          estimatedBuildTime: 0,
          parallelizationScore: 0,
          cacheEfficiency: 0,
          resourceUtilization: 0,
        },
        complexity: {
          cyclomaticComplexity: 0,
          cognitiveComplexity: 0,
          maintainabilityIndex: 0,
          linesOfCode: 0,
        },
        coverage: {
          documentationCoverage: 0,
          errorHandlingCoverage: 0,
          testCoverage: 0,
        },
      },
      analysisTime: endTime - startTime,
      configUsed: analysisConfig,
      platformDetection: {
        platform: "unknown",
        confidence: 0,
        indicators: ["analysis-failed"],
      },
    }
  }
}

function detectPlatform(
  parsed: ParsedYAML, 
  filename?: string
): PlatformDetectionResult {
  const indicators: string[] = []
  let confidence = 0
  let detectedPlatform = "unknown"

  // Filename-based detection
  if (filename) {
    const lowerFilename = filename.toLowerCase()
    
    if (lowerFilename.includes(".github/workflows/") || lowerFilename.includes("workflow")) {
      indicators.push("github-workflow-path")
      confidence += 0.8
      detectedPlatform = "github-actions"
    } else if (lowerFilename === ".gitlab-ci.yml" || lowerFilename.includes("gitlab")) {
      indicators.push("gitlab-filename")
      confidence += 0.8
      detectedPlatform = "gitlab-ci"
    } else if (lowerFilename === "bitbucket-pipelines.yml") {
      indicators.push("bitbucket-filename")
      confidence += 0.8
      detectedPlatform = "bitbucket-pipelines"
    } else if (lowerFilename === "azure-pipelines.yml" || lowerFilename.includes("azure")) {
      indicators.push("azure-filename")
      confidence += 0.8
      detectedPlatform = "azure-pipelines"
    } else if (lowerFilename.includes(".circleci/config.yml")) {
      indicators.push("circleci-path")
      confidence += 0.8
      detectedPlatform = "circleci"
    } else if (lowerFilename === "jenkinsfile" || lowerFilename.includes("jenkins")) {
      indicators.push("jenkins-filename")
      confidence += 0.8
      detectedPlatform = "jenkins"
    }
  }

  // Structure-based detection (higher priority)
  if (parsed.on && parsed.jobs) {
    indicators.push("github-actions-structure")
    confidence = Math.max(confidence, 0.9)
    detectedPlatform = "github-actions"
  } else if (parsed.pipelines) {
    indicators.push("bitbucket-pipelines-structure")
    confidence = Math.max(confidence, 0.9)
    detectedPlatform = "bitbucket-pipelines"
  } else if (parsed.stages || parsed.before_script || parsed.after_script || parsed.script) {
    indicators.push("gitlab-ci-structure")
    confidence = Math.max(confidence, 0.7)
    detectedPlatform = "gitlab-ci"
  } else if (parsed.trigger || parsed.pool || (parsed.variables && parsed.jobs)) {
    indicators.push("azure-devops-structure")
    confidence = Math.max(confidence, 0.6)
    detectedPlatform = "azure-pipelines"
  } else if (parsed.version && parsed.jobs && typeof parsed.version === "number") {
    indicators.push("circleci-structure")
    confidence = Math.max(confidence, 0.7)
    detectedPlatform = "circleci"
  } else if (parsed.pipeline || parsed.agent) {
    indicators.push("jenkins-structure")
    confidence = Math.max(confidence, 0.5)
    detectedPlatform = "jenkins"
  }

  return {
    platform: detectedPlatform as any,
    confidence: Math.min(1.0, confidence),
    indicators,
  }
}

// Utility function to validate YAML content before analysis
export function validateYamlContent(content: string): { isValid: boolean; error?: string } {
  try {
    if (!content || typeof content !== 'string') {
      return { isValid: false, error: 'Content must be a non-empty string' }
    }

    if (content.trim().length === 0) {
      return { isValid: false, error: 'Content cannot be empty' }
    }

    // Try to parse
    SimpleYamlParser.parse(content)
    return { isValid: true }
  } catch (error) {
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : 'Unknown validation error' 
    }
  }
}

// Utility function to get supported platforms
export function getSupportedPlatforms(): string[] {
  return [
    'github-actions',
    'gitlab-ci',
    'bitbucket-pipelines',
    'azure-pipelines',
    'circleci',
    'jenkins'
  ]
}

// Utility function to get platform-specific examples
export function getPlatformExample(platform: string): string {
  const examples: Record<string, string> = {
    'github-actions': `name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test`,

    'gitlab-ci': `stages:
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "18"

test:
  stage: test
  image: node:18
  script:
    - npm ci
    - npm test

build:
  stage: build
  image: node:18
  script:
    - npm run build
  artifacts:
    paths:
      - dist/`,

    'bitbucket-pipelines': `image: node:18

pipelines:
  default:
    - step:
        name: Test and Build
        caches:
          - node
        script:
          - npm ci
          - npm test
          - npm run build
        artifacts:
          - dist/**`,
  }

  return examples[platform] || 'No example available for this platform'
}
