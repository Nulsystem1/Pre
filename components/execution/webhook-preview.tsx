"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Copy } from "lucide-react"
import { useState } from "react"

interface WebhookPreviewProps {
  payload: Record<string, unknown>
  targetName?: string
  targetType?: string
}

export function WebhookPreview({ payload, targetName, targetType }: WebhookPreviewProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <CardTitle className="text-base">Auto-Executed</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-8"
          >
            {copied ? (
              <>
                <CheckCircle2 className="mr-2 h-3 w-3" />
                Copied
              </>
            ) : (
              <>
                <Copy className="mr-2 h-3 w-3" />
                Copy
              </>
            )}
          </Button>
        </div>
        {targetName && (
          <p className="text-sm text-muted-foreground">
            Target: <span className="font-medium">{targetName}</span>
            {targetType && ` (${targetType})`}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="bg-slate-900 rounded-md p-4 overflow-x-auto">
          <pre className="text-xs text-slate-100 font-mono">
            {JSON.stringify(payload, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  )
}

