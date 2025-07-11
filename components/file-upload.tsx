"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, File, Copy, Trash2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingSpinner } from "@/components/loading-spinner"
import { validateFile, sanitizeInput } from "@/lib/validation"
import type { AnalysisConfig } from "@/lib/types"

interface FileUploadProps {
  onAnalyze: (content: string, filename?: string) => void
  isAnalyzing: boolean
  config: AnalysisConfig
}

export function FileUpload({ onAnalyze, isAnalyzing, config }: FileUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [fileContent, setFileContent] = useState<string>("")
  const [error, setError] = useState<string>("")

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError("")

      if (rejectedFiles.length > 0) {
        setError("Invalid file type. Please upload YAML files (.yml, .yaml)")
        return
      }

      const file = acceptedFiles[0]
      if (!file) return

      try {
        const validation = validateFile(file, config)
        if (!validation.isValid) {
          setError(validation.error || "File validation failed")
          return
        }

        setUploadedFile(file)
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string
            const sanitized = sanitizeInput(content)
            setFileContent(sanitized)
            onAnalyze(sanitized, file.name)
          } catch (err) {
            setError("Failed to read file content")
          }
        }
        reader.onerror = () => setError("Failed to read file")
        reader.readAsText(file)
      } catch (err) {
        setError(err instanceof Error ? err.message : "File processing failed")
      }
    },
    [onAnalyze, config],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/yaml": [".yml", ".yaml"],
      "text/plain": [".yml", ".yaml"],
      "application/x-yaml": [".yml", ".yaml"],
    },
    multiple: false,
    maxSize: config.maxFileSize,
  })

  const copyContent = async () => {
    if (fileContent) {
      try {
        await navigator.clipboard.writeText(fileContent)
      } catch (err) {
        console.error("Failed to copy content")
      }
    }
  }

  const clearFile = () => {
    setUploadedFile(null)
    setFileContent("")
    setError("")
  }

  return (
    <div className="space-y-4">
      <Card
        {...getRootProps()}
        className={`border-2 border-dashed cursor-pointer transition-all duration-200 ${
          isDragActive
            ? "border-blue-400 bg-blue-50/50 scale-[1.02]"
            : "border-slate-300 hover:border-slate-400 hover:bg-slate-50/50"
        } ${isAnalyzing ? "pointer-events-none opacity-50" : ""}`}
      >
        <CardContent className="flex flex-col items-center justify-center py-12">
          <input {...getInputProps()} />
          <div className="p-4 bg-blue-100 rounded-full mb-4">
            <Upload className="h-8 w-8 text-blue-600" />
          </div>
          <div className="text-center">
            <p className="text-lg font-medium text-slate-700">
              {isDragActive ? "Drop your YAML file here" : "Drag & drop your YAML file here"}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              or click to browse (.yml, .yaml files up to {Math.round(config.maxFileSize / 1024 / 1024)}MB)
            </p>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {uploadedFile && (
        <Card className="bg-slate-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <File className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="font-medium text-sm">{uploadedFile.name}</p>
                  <p className="text-xs text-slate-500">
                    {(uploadedFile.size / 1024).toFixed(1)} KB • {uploadedFile.type || "YAML"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isAnalyzing ? (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <LoadingSpinner size="sm" />
                    Analyzing...
                  </div>
                ) : (
                  <>
                    <Button
                      onClick={copyContent}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 bg-transparent"
                    >
                      <Copy className="h-3 w-3" />
                      Copy
                    </Button>
                    <Button
                      onClick={clearFile}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 bg-transparent"
                    >
                      <Trash2 className="h-3 w-3" />
                      Clear
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-xs text-slate-500 space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="font-medium mb-1">Supported Platforms:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>GitHub Actions (.github/workflows/*.yml)</li>
              <li>GitLab CI (.gitlab-ci.yml)</li>
              <li>Bitbucket Pipelines (bitbucket-pipelines.yml)</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-1">Our Framework:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Identify critical issues in your pipeline configurations</li>
              <li>Uncover security risks before they reach production</li>
              <li>Optimize build performance and efficiency with ease</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
