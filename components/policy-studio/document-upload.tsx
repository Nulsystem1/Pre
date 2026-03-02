"use client"

import { useCallback, useState } from "react"
import { Upload, Loader2, FileText, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const ACCEPT = ".txt,.pdf"
const MAX_SIZE_MB = 10
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

interface DocumentUploadProps {
  onTextExtracted: (text: string) => void
  disabled?: boolean
  className?: string
}

export function DocumentUpload({
  onTextExtracted,
  disabled,
  className,
}: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const processFile = useCallback(
    async (file: File) => {
      setError(null)
      const name = file.name.toLowerCase()
      if (!name.endsWith(".txt") && !name.endsWith(".pdf")) {
        setError("Only .txt and .pdf files are supported.")
        return
      }
      if (file.size > MAX_SIZE_BYTES) {
        setError(`File must be under ${MAX_SIZE_MB} MB.`)
        return
      }

      setIsLoading(true)
      try {
        if (name.endsWith(".txt")) {
          const text = await file.text()
          if (!text.trim()) {
            setError("File is empty.")
            return
          }
          onTextExtracted(text)
        } else {
          const formData = new FormData()
          formData.set("file", file)
          const res = await fetch("/api/policy/upload", {
            method: "POST",
            body: formData,
          })
          const data = await res.json()
          if (!data.success) {
            setError(data.error || "Failed to extract text from PDF.")
            return
          }
          if (!data.text?.trim()) {
            setError("No text could be extracted from the file.")
            return
          }
          onTextExtracted(data.text)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed.")
      } finally {
        setIsLoading(false)
      }
    },
    [onTextExtracted]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (disabled || isLoading) return
      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [disabled, isLoading, processFile]
  )

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
      e.target.value = ""
    },
    [processFile]
  )

  return (
    <div className={cn("space-y-2", className)}>
      <label
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 transition-colors cursor-pointer",
          isDragging && "border-primary bg-primary/5",
          (disabled || isLoading) && "pointer-events-none opacity-60",
          !disabled && !isLoading && "hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <input
          type="file"
          accept={ACCEPT}
          onChange={onInputChange}
          className="sr-only"
          disabled={disabled || isLoading}
        />
        {isLoading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Extracting text...</span>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              Upload document (.txt or .pdf)
            </span>
            <span className="text-xs text-muted-foreground">
              or drag and drop • max {MAX_SIZE_MB} MB
            </span>
          </>
        )}
      </label>
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}
