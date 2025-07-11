import type { AnalysisConfig } from "./types"

export interface ValidationResult {
  isValid: boolean
  error?: string
  warnings?: string[]
}

export function validateFile(file: File, config: AnalysisConfig): ValidationResult {
  const warnings: string[] = []

  // Check file size
  if (file.size > config.maxFileSize) {
    return {
      isValid: false,
      error: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum allowed size (${Math.round(config.maxFileSize / 1024 / 1024)}MB)`,
    }
  }

  // Check file type
  const allowedExtensions = [".yml", ".yaml"]
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."))

  if (!allowedExtensions.includes(fileExtension)) {
    return {
      isValid: false,
      error: `Invalid file type. Please upload YAML files (${allowedExtensions.join(", ")})`,
    }
  }

  // Check for common CI/CD file patterns
  const cicdPatterns = [
    /\.github\/workflows\//,
    /\.gitlab-ci\.yml$/,
    /bitbucket-pipelines\.yml$/,
    /azure-pipelines\.yml$/,
    /\.circleci\/config\.yml$/,
    /Jenkinsfile/,
    /pipeline\.yml$/,
  ]

  const matchesPattern = cicdPatterns.some((pattern) => pattern.test(file.name))
  if (!matchesPattern && file.size < 100) {
    warnings.push("File doesn't match common CI/CD naming patterns")
  }

  // Warn about very large files
  if (file.size > config.maxFileSize * 0.8) {
    warnings.push("Large file detected - analysis may take longer")
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  }
}

export function validateUrl(url: string): ValidationResult {
  try {
    const parsedUrl = new URL(url)

    // Check protocol
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return {
        isValid: false,
        error: "Only HTTP and HTTPS URLs are supported",
      }
    }

    // Check for allowed hosts
    const allowedHosts = [
      "raw.githubusercontent.com",
      "gitlab.com",
      "bitbucket.org",
      "dev.azure.com",
      "raw.githubusercontent.com",
    ]

    const isAllowedHost = allowedHosts.some(
      (host) => parsedUrl.hostname === host || parsedUrl.hostname.endsWith(`.${host}`),
    )

    if (!isAllowedHost) {
      return {
        isValid: false,
        error: `URL host not allowed. Supported hosts: ${allowedHosts.join(", ")}`,
      }
    }

    // Check for YAML file extension
    const pathname = parsedUrl.pathname.toLowerCase()
    if (!pathname.endsWith(".yml") && !pathname.endsWith(".yaml")) {
      return {
        isValid: false,
        error: "URL must point to a YAML file (.yml or .yaml)",
      }
    }

    return { isValid: true }
  } catch (error) {
    return {
      isValid: false,
      error: "Invalid URL format",
    }
  }
}

export function sanitizeInput(content: string): string {
  // Remove null bytes and other control characters
  let sanitized = content.replace(/\0/g, "")

  // Limit content length (10MB max)
  const maxLength = 10 * 1024 * 1024
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength)
  }

  // Normalize line endings
  sanitized = sanitized.replace(/\r\n/g, "\n").replace(/\r/g, "\n")

  // Check for common YAML issues and provide warnings
  const lines = sanitized.split("\n")
  const issues: string[] = []

  lines.forEach((line, index) => {
    // Check for tabs (YAML should use spaces)
    if (line.includes("\t")) {
      issues.push(`Line ${index + 1}: Contains tabs (YAML should use spaces)`)
    }

    // Check for very long lines
    if (line.length > 500) {
      issues.push(`Line ${index + 1}: Very long line (${line.length} characters)`)
    }
  })

  // Log issues for debugging
  if (issues.length > 0) {
    console.warn("YAML formatting issues detected:", issues)
  }

  return sanitized
}

// Removed validateYamlSyntax as it was causing false positives and js-yaml handles it better.
// export function validateYamlSyntax(content: string): ValidationResult {
//   try {
//     // Basic YAML syntax checks
//     const lines = content.split("\n")
//     const errors: string[] = []

//     lines.forEach((line, index) => {
//       const lineNum = index + 1

//       // Check for common syntax errors
//       if (line.trim().startsWith("-") && line.includes(":") && !line.includes(" ")) {
//         errors.push(`Line ${lineNum}: Missing space after colon in list item`)
//       }

//       // Check for unbalanced quotes
//       const singleQuotes = (line.match(/'/g) || []).length
//       const doubleQuotes = (line.match(/"/g) || []).length

//       if (singleQuotes % 2 !== 0) {
//         errors.push(`Line ${lineNum}: Unbalanced single quotes`)
//       }

//       if (doubleQuotes % 2 !== 0) {
//         errors.push(`Line ${lineNum}: Unbalanced double quotes`)
//       }
//     })

//     return {
//       isValid: errors.length === 0,
//       error: errors.length > 0 ? errors.join("; ") : undefined,
//     }
//   } catch (error) {
//     return {
//       isValid: false,
//       error: "YAML syntax validation failed",
//     }
//   }
// }
