import { NextResponse } from "next/server"
import { AdvancedYamlRulesEngine } from "@/lib/advanced-yaml-rules"
import { parseYAML } from "@/lib/utils" // Assuming parseYAML is now in utils
// import { validateYamlSyntax } from "@/lib/validation" // Removed this import
import type { AnalysisResult, AnalysisConfig } from "@/lib/types"

export async function POST(req: Request) {
  try {
    const { content, filename, config } = (await req.json()) as {
      content: string
      filename?: string
      config: AnalysisConfig
    }

    if (!content) {
      return NextResponse.json({ error: "No content provided" }, { status: 400 })
    }

    // Validate content length
    if (content.length > 10 * 1024 * 1024) {
      // 10MB limit
      return NextResponse.json(
        {
          error: "Content too large",
          details: "YAML content must be less than 10MB",
        },
        { status: 413 },
      )
    }

    let parsedYaml: any
    try {
      parsedYaml = parseYAML(content) // Use the robust parseYAML
    } catch (parseError: any) {
      // Catch specific YAML parsing errors from parseYAML utility
      return NextResponse.json(
        {
          error: "YAML Parsing Error",
          message: `Failed to parse YAML: ${parseError.message || "Invalid YAML format"}`,
          details: parseError.mark ? `Line ${parseError.mark.line + 1}, Column ${parseError.mark.column + 1}` : null,
        },
        { status: 400 },
      )
    }

    // Determine platform based on filename or content, or use config
    let platform: AnalysisResult["platform"] = config.platform || "auto"
    if (platform === "auto") {
      if (filename?.includes("github") || content.includes("on:") || content.includes("jobs:")) {
        platform = "github-actions"
      } else if (filename?.includes("gitlab") || content.includes("stages:") || content.includes("script:")) {
        platform = "gitlab-ci"
      } else if (filename?.includes("bitbucket") || content.includes("pipelines:")) {
        platform = "bitbucket-pipelines"
      } else if (filename?.includes("jenkins") || content.includes("pipeline {")) {
        platform = "jenkins"
      } else if (filename?.includes("azure-pipelines") || content.includes("trigger:") || content.includes("pool:")) {
        platform = "azure-devops"
      } else if (filename?.includes("circleci") || content.includes("version:") || content.includes("workflows:")) {
        platform = "circleci"
      } else {
        platform = "unknown"
      }
    }

    const analyzer = new AdvancedYamlRulesEngine(config)
    const analysisResult = await analyzer.analyze(parsedYaml, platform, content)

    return NextResponse.json(
      {
        ...analysisResult,
        platform,
        analysisTime: Date.now(), // Placeholder for actual analysis time
        configUsed: config,
      } as AnalysisResult,
      { status: 200 },
    )
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "An unknown error occurred.",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "CI/CD Analyzer API",
    version: "1.0.0",
    endpoints: {
      analyze: "POST /api/analyze",
      fetchYaml: "GET /api/fetch-yaml",
    },
  })
}
