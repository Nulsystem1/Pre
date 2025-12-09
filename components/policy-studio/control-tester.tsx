"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, XCircle, Play, Loader2, FlaskConical } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface TestResult {
  scenario: string
  event_type: string
  expected: string
  actual: string
  passed: boolean
  controls_triggered: Array<{ control_id: string; action: string }>
}

export function ControlTester() {
  const [isRunning, setIsRunning] = useState(false)
  const [customTestData, setCustomTestData] = useState(
    JSON.stringify(
      {
        customer: {
          id_verified: true,
          address_verified: true,
          age: 35,
          risk_score: 45,
          country: "US",
          is_pep: false,
          pep_match_confidence: 0,
          account_type: "personal",
        },
      },
      null,
      2,
    ),
  )
  const [customResult, setCustomResult] = useState<{
    decision: string
    controls_triggered: Array<{ control_id: string; control_name: string; action: string }>
  } | null>(null)
  const [isCustomRunning, setIsCustomRunning] = useState(false)

  const {
    data: testResults,
    mutate: runTests,
    isLoading,
  } = useSWR<{ success: boolean; data: { summary: any; results: TestResult[] } }>(
    isRunning ? "/api/controls/test" : null,
    fetcher,
    {
      onSuccess: () => setIsRunning(false),
    },
  )

  const handleRunTests = () => {
    setIsRunning(true)
    runTests()
  }

  const handleRunCustomTest = async () => {
    setIsCustomRunning(true)
    setCustomResult(null)

    try {
      const parsed = JSON.parse(customTestData)
      const response = await fetch("/api/controls/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: parsed }),
      })
      const result = await response.json()
      if (result.success) {
        setCustomResult(result.data)
      }
    } catch (err) {
      console.error("Failed to run custom test:", err)
    } finally {
      setIsCustomRunning(false)
    }
  }

  return (
    <Card className="bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <FlaskConical className="h-4 w-4" />
            Control Test Suite
          </CardTitle>
          <Button onClick={handleRunTests} disabled={isRunning || isLoading} size="sm" className="gap-2">
            {isRunning || isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Run All Tests
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="scenarios">
          <TabsList className="mb-4">
            <TabsTrigger value="scenarios">Scenario Tests</TabsTrigger>
            <TabsTrigger value="custom">Custom Test</TabsTrigger>
          </TabsList>

          <TabsContent value="scenarios">
            {testResults?.data ? (
              <div className="space-y-4">
                {/* Summary */}
                <div className="flex items-center gap-4 rounded-lg bg-secondary/30 p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary">{testResults.data.summary.passed}</span>
                    <span className="text-sm text-muted-foreground">passed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-destructive">{testResults.data.summary.failed}</span>
                    <span className="text-sm text-muted-foreground">failed</span>
                  </div>
                  <div className="ml-auto">
                    <Badge variant={testResults.data.summary.pass_rate === 100 ? "default" : "secondary"}>
                      {testResults.data.summary.pass_rate}% pass rate
                    </Badge>
                  </div>
                </div>

                {/* Results */}
                <div className="space-y-2">
                  {testResults.data.results.map((result, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between rounded-lg border p-3 ${
                        result.passed ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {result.passed ? (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        ) : (
                          <XCircle className="h-5 w-5 text-destructive" />
                        )}
                        <div>
                          <p className="font-medium text-foreground">{result.scenario}</p>
                          <p className="text-xs text-muted-foreground">
                            {result.event_type} • Expected: {result.expected}
                            {!result.passed && ` • Got: ${result.actual}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.controls_triggered.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {result.controls_triggered.map((c) => c.control_id).join(", ")}
                          </span>
                        )}
                        <Badge
                          variant="secondary"
                          className={
                            result.actual === "BLOCKED"
                              ? "bg-destructive/20 text-destructive"
                              : result.actual === "REVIEW"
                                ? "bg-warning/20 text-warning"
                                : "bg-primary/20 text-primary"
                          }
                        >
                          {result.actual}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p>Run tests to see results</p>
                <p className="text-xs mt-1">Tests will evaluate all enabled controls against predefined scenarios</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="custom">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Enter event data as JSON to test against current controls
                </p>
                <Textarea
                  value={customTestData}
                  onChange={(e) => setCustomTestData(e.target.value)}
                  className="font-mono text-sm min-h-48 bg-secondary/30"
                />
              </div>
              <Button onClick={handleRunCustomTest} disabled={isCustomRunning} className="gap-2">
                {isCustomRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Evaluate
              </Button>

              {customResult && (
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Decision:</span>
                    <Badge
                      variant="secondary"
                      className={
                        customResult.decision === "BLOCKED"
                          ? "bg-destructive/20 text-destructive"
                          : customResult.decision === "REVIEW"
                            ? "bg-warning/20 text-warning"
                            : "bg-primary/20 text-primary"
                      }
                    >
                      {customResult.decision}
                    </Badge>
                  </div>
                  {customResult.controls_triggered.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Controls Triggered:</p>
                      <div className="space-y-1">
                        {customResult.controls_triggered.map((ctrl, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <span className="font-mono text-xs text-muted-foreground">{ctrl.control_id}</span>
                            <span>{ctrl.control_name}</span>
                            <Badge variant="outline" className="text-xs">
                              {ctrl.action}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {customResult.controls_triggered.length === 0 && (
                    <p className="text-sm text-muted-foreground">No controls triggered - event passes all checks</p>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
