"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"

interface EditableCodeInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  minHeight?: string
}

export function EditableCodeInput({
  value,
  onChange,
  placeholder,
  disabled,
  className,
  minHeight = "400px",
}: EditableCodeInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [lines, setLines] = useState(value.split("\n"))

  useEffect(() => {
    setLines(value.split("\n"))
  }, [value])

  const handleScroll = useCallback(() => {
    if (textareaRef.current) {
      // Sync scroll position of line numbers with textarea
      const lineNumberDiv = textareaRef.current.previousElementSibling as HTMLElement
      if (lineNumberDiv) {
        lineNumberDiv.scrollTop = textareaRef.current.scrollTop
      }
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  return (
    <div
      className={cn("relative flex rounded-lg border border-slate-200 bg-slate-900 font-mono text-sm", className)}
      style={{ minHeight }}
    >
      {/* Line Numbers */}
      <div
        className="sticky left-0 top-0 z-10 w-10 flex-shrink-0 overflow-hidden bg-slate-800 py-2 text-right text-slate-400 select-none"
        style={{ lineHeight: "1.5rem" }} // Match textarea line-height
      >
        {lines.map((_, index) => (
          <div key={index} className="pr-2">
            {index + 1}
          </div>
        ))}
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onScroll={handleScroll}
        placeholder={placeholder}
        disabled={disabled}
        spellCheck="false"
        className="flex-1 resize-none border-none bg-transparent p-2 text-slate-100 outline-none focus:ring-0"
        style={{ lineHeight: "1.5rem" }} // Ensure consistent line height
      />
    </div>
  )
}
