"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Play, Copy, Trash2 } from "lucide-react"
import { LoadingSpinner } from "@/components/loading-spinner"
import { sanitizeInput } from "@/lib/validation"
import type { AnalysisConfig } from "@/lib/types"
import { EditableCodeInput } from "./editable-code-input" // Import the new component

interface DirectInputProps {
  onAnalyze: (content: string, filename?: string) => void
  isAnalyzing: boolean
  config: AnalysisConfig
}

export function DirectInput({ onAnalyze, isAnalyzing, config }: DirectInputProps) {
  const [content, setContent] = useState("")

  const handleAnalyze = () => {
    if (!content.trim()) return
    const sanitized = sanitizeInput(content)
    onAnalyze(sanitized, "direct-input.yml")
  }

  const copyContent = async () => {
    if (content) {
      try {
        await navigator.clipboard.writeText(content)
      } catch (err) {
        console.error("Failed to copy content")
      }
    }
  }

  const clearContent = () => {
    setContent("")
  }

  const exampleConfigs = {
    "github-actions": `name: CI/CD Pipeline
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [16, 18, 20]
    steps:
    - uses: actions/checkout@v4
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'
    - run: npm ci
    - run: npm test
    - run: npm run build

  security:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Run security audit
      run: npm audit
    - name: Run CodeQL
      uses: github/codeql-action/analyze@v2`,

    "gitlab-ci": `stages:
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "18"

cache:
  paths:
    - node_modules/

test:
  stage: test
  image: node:\${NODE_VERSION}
  script:
    - npm ci
    - npm test
  coverage: '/Coverage: \\d+\\.\\d+%/'

build:
  stage: build
  image: node:\${NODE_VERSION}
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 hour

deploy:
  stage: deploy
  script:
    - echo "Deploying application..."
  only:
    - main`,

    "bitbucket-pipelines": `image: node:18

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
          - dist/**

  branches:
    main:
      - step:
          name: Test
          caches:
            - node
          script:
            - npm ci
            - npm test
      - step:
          name: Build and Deploy
          script:
            - npm run build
            - echo "Deploying to production..."`,
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="relative">
              <EditableCodeInput // Use the new component here
                value={content}
                onChange={setContent}
                placeholder="Paste your YAML configuration here..."
                disabled={isAnalyzing}
                minHeight="400px"
              />
              <div className="absolute bottom-2 right-2 text-xs text-slate-400">{content.length} characters</div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <select
                  className="text-xs border rounded px-2 py-1"
                  onChange={(e) => {
                    if (e.target.value) {
                      setContent(exampleConfigs[e.target.value as keyof typeof exampleConfigs])
                    }
                  }}
                  disabled={isAnalyzing}
                >
                  <option value="">Load Example...</option>
                  <option value="github-actions">GitHub Actions</option>
                  <option value="gitlab-ci">GitLab CI</option>
                  <option value="bitbucket-pipelines">Bitbucket Pipelines</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={copyContent}
                  variant="outline"
                  size="sm"
                  disabled={!content.trim() || isAnalyzing}
                  className="flex items-center gap-1 bg-transparent"
                >
                  <Copy className="h-3 w-3" />
                  Copy
                </Button>
                <Button
                  onClick={clearContent}
                  variant="outline"
                  size="sm"
                  disabled={!content.trim() || isAnalyzing}
                  className="flex items-center gap-1 bg-transparent"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear
                </Button>
                <Button
                  onClick={handleAnalyze}
                  disabled={!content.trim() || isAnalyzing}
                  className="flex items-center gap-2 min-w-[140px]"
                >
                  {isAnalyzing ? <LoadingSpinner size="sm" /> : <Play className="h-4 w-4" />}
                  {isAnalyzing ? "Analyzing..." : "Analyze Configuration"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-xs text-slate-500 space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="font-medium mb-1">Supported Features:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Multi-platform detection</li>
              <li>Complex nested structures</li>
              <li>Matrix builds and strategies</li>
              <li>Environment variables</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-1">Analysis Includes:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Security vulnerability scanning</li>
              <li>Performance optimization</li>
              <li>Cost estimation</li>
              <li>Best practices validation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
