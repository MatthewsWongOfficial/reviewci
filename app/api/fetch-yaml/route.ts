import { type NextRequest, NextResponse } from "next/server"
import { validateUrl } from "@/lib/validation"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get("url")

  if (!url) {
    return NextResponse.json(
      {
        error: "URL parameter is required",
        details: "Provide a 'url' query parameter with the YAML file URL",
      },
      { status: 400 },
    )
  }

  try {
    // Validate URL
    const validation = validateUrl(url)
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: "Invalid URL",
          details: validation.error,
        },
        { status: 400 },
      )
    }

    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "CI-CD-Analyzer/1.0",
          Accept: "text/yaml, text/plain, application/x-yaml, */*",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // Check content type
      const contentType = response.headers.get("content-type") || ""
      if (!contentType.includes("text") && !contentType.includes("yaml") && !contentType.includes("application")) {
        console.warn(`Unexpected content type: ${contentType}`)
      }

      // Check content length
      const contentLength = response.headers.get("content-length")
      if (contentLength && Number.parseInt(contentLength) > 10 * 1024 * 1024) {
        throw new Error("File too large (max 10MB)")
      }

      const content = await response.text()

      // Basic content validation
      if (!content.trim()) {
        throw new Error("Empty file content")
      }

      return new NextResponse(content, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=300", // Cache for 5 minutes
        },
      })
    } catch (fetchError) {
      clearTimeout(timeoutId)

      if (fetchError instanceof Error) {
        if (fetchError.name === "AbortError") {
          throw new Error("Request timeout - file took too long to download")
        }
        throw fetchError
      }
      throw new Error("Failed to fetch file")
    }
  } catch (error) {
    console.error("Fetch YAML error:", error)

    return NextResponse.json(
      {
        error: "Failed to fetch YAML file",
        details: error instanceof Error ? error.message : "Unknown error occurred",
        url: url,
      },
      { status: 500 },
    )
  }
}
