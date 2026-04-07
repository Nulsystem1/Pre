"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  BookOpen,
  FileCode2,
  CheckSquare,
  Search,
  ArrowRight,
  Zap,
  BarChart3,
  LayoutDashboard,
  PlayCircle,
} from "lucide-react"

export default function DocumentationPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BookOpen className="h-8 w-8" />
          User Guide
        </h1>
        <p className="text-muted-foreground mt-1">
          Step-by-step guidance for using the NUL Compliance Control Center: from policy ingestion to validation, review, and audit.
        </p>
      </div>

      {/* Walkthrough video — before numbered steps */}
      <Card className="overflow-hidden border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <PlayCircle className="h-5 w-5 text-primary shrink-0" />
            Walkthrough video
          </CardTitle>
          <CardDescription>
            Play the overview below, then follow the steps starting with Policy Studio.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative w-full overflow-hidden rounded-lg border bg-muted aspect-video">
            <iframe
              src="https://www.loom.com/embed/a4c5f5e805694bd8a5e2cd7a9fb4efbd?hide_owner=true&hide_share=true&hide_title=true&hideEmbedTopBar=true"
              className="absolute inset-0 h-full w-full"
              title="NUL Compliance Control Center User Guide walkthrough"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            <a
              href="https://www.loom.com/share/a4c5f5e805694bd8a5e2cd7a9fb4efbd"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-4 hover:underline font-medium"
            >
              Open on Loom in a new tab
            </a>{" "}
            if the player does not load.
          </p>
        </CardContent>
      </Card>

      {/* Step 1: Policy Studio - Create pack and upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">1</span>
            Policy Studio: Create a pack and upload your policy
          </CardTitle>
          <CardDescription>Start here to bring your compliance policy into the system.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 list-none">
            <li className="flex gap-2">
              <ArrowRight className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <span>Go to <strong>Policy Studio</strong> from the sidebar.</span>
            </li>
            <li className="flex gap-2">
              <ArrowRight className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <span>Create a <strong>new pack</strong> and give it a <strong>unique name</strong> you can remember (e.g. &quot;DoD Training Policy 2025&quot;).</span>
            </li>
            <li className="flex gap-2">
              <ArrowRight className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <span><strong>Upload your policy</strong> (paste text or upload a document) into the pack.</span>
            </li>
          </ul>
          <Button className="hover:text-white/80" variant="outline" size="sm" asChild>
            <Link href="/policy-studio">
              <FileCode2 className="h-4 w-4 mr-2" />
              Open Policy Studio
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Step 2: Ingest & Build - Graph RAG */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">2</span>
            Ingest &amp; Build: Build the Graph RAG
          </CardTitle>
          <CardDescription>Turn your policy text into a queryable knowledge graph.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 list-none">
            <li className="flex gap-2">
              <ArrowRight className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <span>After uploading the policy, click the <strong>Ingest &amp; Build</strong> button to build the <strong>Graph RAG</strong>.</span>
            </li>
            <li className="flex gap-2">
              <ArrowRight className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <span>At the <strong>end of the text area</strong>, check the <strong>chunks</strong>, <strong>nodes</strong>, and <strong>edges</strong> that were created.</span>
            </li>
            <li className="flex gap-2">
              <ArrowRight className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <span>Review the <strong>knowledge graph</strong> to see <strong>relationships and reasoning</strong> — use this to ask whether an execution is valid against compliance policies and related rules.</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Step 3: Command Center - Select policy and validate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">3</span>
            Command Center: Select policy, add input, and validate
          </CardTitle>
          <CardDescription>Run validations against your policy using text or uploaded files.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 list-none">
            <li className="flex gap-2">
              <ArrowRight className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <span>Go to <strong>Command Center</strong>.</span>
            </li>
            <li className="flex gap-2">
              <ArrowRight className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <span>Under the text area, use <strong>Select policy</strong> to choose the policy pack you built (e.g. the one you named in Step 1).</span>
            </li>
            <li className="flex gap-2">
              <ArrowRight className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <span><strong>Enter your text</strong> in the text area, or <strong>upload a PDF, TXT, or CSV</strong> file.</span>
            </li>
            <li className="flex gap-2">
              <ArrowRight className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <span>After uploading, the extracted text appears in the <strong>text area</strong>. You can edit it if needed.</span>
            </li>
            <li className="flex gap-2">
              <ArrowRight className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <span>Click <strong>Validate</strong> to run the compliance check.</span>
            </li>
            <li className="flex gap-2">
              <ArrowRight className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <span>To clear the text and start over, use <strong>Clear</strong>.</span>
            </li>
            <li className="flex gap-2">
              <ArrowRight className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <span>After validating, you’ll see the <strong>results</strong>. You can <strong>create a case</strong> from a result to send it to the Review Queue.</span>
            </li>
          </ul>
          <Button className="hover:text-white/80" variant="outline" size="sm" asChild>
            <Link href="/command-center">
              <Zap className="h-4 w-4 mr-2" />
              Open Command Center
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Step 4: Review Queue - Human review and outcome */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">4</span>
            Review Queue: Handle cases and set outcomes
          </CardTitle>
          <CardDescription>All cases created from validation results are handled here.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 list-none">
            <li className="flex gap-2">
              <ArrowRight className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <span>Go to <strong>Review Queue</strong> to see all cases that need human review.</span>
            </li>
            <li className="flex gap-2">
              <ArrowRight className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <span>Open a case to add <strong>additional data</strong> (notes, PDF/TXT/CSV). This can help <strong>increase the confidence score</strong> when you re-run validation.</span>
            </li>
            <li className="flex gap-2">
              <ArrowRight className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <span>Because this is <strong>human review</strong>, you can: <strong>give an outcome</strong> (e.g. Approve or Block), <strong>leave it as-is</strong>, or <strong>escalate</strong> the case.</span>
            </li>
            <li className="flex gap-2">
              <ArrowRight className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <span>Use <strong>Export JSON</strong> on a case to download the decision record including additional notes and file extracts for downstream systems and audit.</span>
            </li>
          </ul>
          <Button className="hover:text-white/80" variant="outline" size="sm" asChild>
            <Link href="/review-queue">
              <CheckSquare className="h-4 w-4 mr-2" />
              Open Review Queue
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Step 5: Audit Explorer - History and traces */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">5</span>
            Audit Explorer: History and traces
          </CardTitle>
          <CardDescription>View all decisions, outcomes, and audit trail.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 list-none">
            <li className="flex gap-2">
              <ArrowRight className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <span>Go to <strong>Audit Explorer</strong> to see <strong>all history and traces</strong> of cases and questions asked.</span>
            </li>
            <li className="flex gap-2">
              <ArrowRight className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <span>View <strong>Status</strong> (decision from the validation engine) and <strong>Outcome</strong> (result from the review queue, e.g. Approved, Blocked, Pending review).</span>
            </li>
            <li className="flex gap-2">
              <ArrowRight className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <span>Open any row to see full details: reasoning, matched policies, confidence scores, and <strong>results after review queue</strong> when the case was reviewed.</span>
            </li>
          </ul>
          <Button className="hover:text-white/80" variant="outline" size="sm" asChild>
            <Link href="/audit-explorer">
              <Search className="h-4 w-4 mr-2" />
              Open Audit Explorer
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Sample: DoD training request */}
      <Card className="border-primary/20 bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">Sample: DoD training approval request</CardTitle>
          <CardDescription>
            Use this example to test Command Center validation and Review Queue: paste the first block in Command Center, then add the second block as an additional file on the case to improve the score.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-foreground mb-1">Command Center — initial input (paste into the text area)</p>
            <blockquote className="text-sm text-muted-foreground border-l-2 border-primary/50 pl-4 py-2 bg-background/50 rounded-r whitespace-pre-wrap">
              I am a GS-12 DoD civilian requesting approval for a 40-hour cybersecurity certificate course directly related to my current official duties. The course is elective technical development (not mandatory training under law, regulation, Executive Order, or Component policy) and is documented in my approved IDP.
            </blockquote>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-1">Review Queue — additional documents for human review (upload as a file or paste into additional data to increase the score)</p>
            <blockquote className="text-sm text-muted-foreground border-l-2 border-primary/50 pl-4 py-2 bg-background/50 rounded-r whitespace-pre-wrap">
              An SF-182 has been fully completed, approved, and recorded in the official TE&amp;PD electronic system, including supervisory and budget authority signatures, cost data, and planned evaluation fields. All required trainee, course, expenditure, approval, and evaluation records are currently entered and maintained in the Component&apos;s TE&amp;PD infrastructure in accordance with Enclosure 4, Sections 2a and 3c. The training provider has been verified against authorized institution listings and is not on any barred or restricted list. This 40-hour course does not trigger a Continued Service Agreement under Component policy, and no CSA is required.
            </blockquote>
          </div>
        </CardContent>
      </Card>

      {/* Quick reference */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-lg">Quick reference</CardTitle>
          <CardDescription>Where to find key actions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
              <span><strong>Dashboard</strong> — Metrics, audit decision history, decision velocity, live feed, outcome chart.</span>
            </div>
            <div className="flex items-center gap-2">
              <FileCode2 className="h-4 w-4 text-muted-foreground" />
              <span><strong>Policy Studio</strong> — New pack, upload policy, Ingest &amp; Build, view chunks/nodes/edges and knowledge graph. Note: Don't close it before it completes building and ingesting or else It will start building from scratch again.</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span><strong>Command Center</strong> — Select policy, paste or upload (PDF/TXT/CSV), Validate, Clear, create case.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
              <span><strong>Review Queue</strong> — Additional data, re-run validation, Approve / Block / Escalate, Export JSON.</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span><strong>Audit Explorer</strong> — Decision history, Status vs Outcome, confidence, results after review.</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
