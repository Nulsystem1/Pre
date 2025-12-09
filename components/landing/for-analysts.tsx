import { Search, AlertTriangle, MessageSquare, CheckCircle2 } from "lucide-react"

const features = [
  {
    icon: Search,
    title: "Smart case prioritization",
    description: "AI-powered risk scoring surfaces the most urgent cases first, with clear reasoning for each alert.",
  },
  {
    icon: AlertTriangle,
    title: "Context-rich alerts",
    description:
      "See the full customer history, related transactions, and exactly which controls triggered the review.",
  },
  {
    icon: MessageSquare,
    title: "Collaboration tools",
    description: "Add notes, request information, and escalate cases—all within a single workflow.",
  },
  {
    icon: CheckCircle2,
    title: "One-click decisions",
    description: "Approve, block, or request more information with pre-filled justifications that satisfy auditors.",
  },
]

export function ForAnalysts() {
  return (
    <section className="border-b border-border py-24">
      <div className="container mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="order-2 lg:order-1">
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="border-b border-border bg-secondary/50 px-4 py-3">
                <span className="text-sm font-medium text-foreground">Case Review — #CS-4821</span>
              </div>
              <div className="p-4">
                <div className="mb-4 flex items-start justify-between rounded-lg border border-border bg-secondary/30 p-3">
                  <div>
                    <p className="font-medium text-foreground">Marcus Thompson</p>
                    <p className="text-xs text-muted-foreground">UK • High-net-worth • Risk Score: 72</p>
                  </div>
                  <span className="rounded-full bg-warning/20 px-2 py-0.5 text-xs text-warning">Review needed</span>
                </div>
                <div className="mb-4">
                  <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Controls triggered</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded bg-secondary px-2 py-1 text-xs text-foreground">PEP-Screen-001</span>
                    <span className="rounded bg-secondary px-2 py-1 text-xs text-foreground">TXN-Velocity-003</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
                    Approve
                  </button>
                  <button className="flex-1 rounded-lg border border-border bg-secondary px-3 py-2 text-sm font-medium text-foreground">
                    Request info
                  </button>
                  <button className="flex-1 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                    Block
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <span className="text-sm font-medium text-primary">For analysts</span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Clear cases faster with better context
            </h2>
            <p className="mt-4 text-muted-foreground">
              NUL provides analysts with everything they need to make confident decisions quickly. No more digging
              through multiple systems or guessing why a customer was flagged.
            </p>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {features.map((feature) => (
                <div key={feature.title} className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{feature.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
