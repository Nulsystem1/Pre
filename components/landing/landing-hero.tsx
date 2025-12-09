import { Button } from "@/components/ui/button"
import { ArrowRight, Zap, CheckCircle } from "lucide-react"
import Link from "next/link"

export function LandingHero() {
  return (
    <section className="relative overflow-hidden border-b border-border py-24 md:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-sm text-muted-foreground">
            <Zap className="h-4 w-4 text-primary" />
            <span>Real-time policy execution engine</span>
          </div>

          <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Execute your KYC and AML policies in real time
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
            NUL converts written compliance policies into executable controls that govern customer onboarding and
            transaction monitoring. Automate decisions, reduce manual reviews, and maintain full audit trails.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/sign-in">
                Start free trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="#how-it-works">See how it works</Link>
            </Button>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>SOC 2 Type II Certified</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>Bank-grade security</span>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-5xl">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
            <div className="flex items-center gap-2 border-b border-border bg-secondary/50 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-destructive/50" />
              <div className="h-3 w-3 rounded-full bg-warning/50" />
              <div className="h-3 w-3 rounded-full bg-primary/50" />
              <span className="ml-2 text-xs text-muted-foreground">NUL Control Center — Dashboard</span>
            </div>
            <div className="grid grid-cols-4 gap-4 p-6">
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <p className="text-xs text-muted-foreground">Customers monitored</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">124,847</p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <p className="text-xs text-muted-foreground">Transactions today</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">8,294</p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <p className="text-xs text-muted-foreground">Auto approvals</p>
                <p className="mt-1 text-2xl font-semibold text-primary">94.2%</p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <p className="text-xs text-muted-foreground">Reviews needed</p>
                <p className="mt-1 text-2xl font-semibold text-warning">23</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
