import { Shield, FileCheck, Clock, TrendingUp } from "lucide-react"

const features = [
  {
    icon: Shield,
    title: "Reduce regulatory risk",
    description: "Ensure consistent application of policies across all customer interactions and transactions.",
  },
  {
    icon: FileCheck,
    title: "Audit-ready documentation",
    description:
      "Every decision includes a complete audit trail linking back to the specific policy version and control.",
  },
  {
    icon: Clock,
    title: "Faster policy updates",
    description: "Update policies in minutes instead of months. Changes propagate instantly to all controls.",
  },
  {
    icon: TrendingUp,
    title: "Real-time dashboards",
    description: "Monitor approval rates, review queues, and risk distribution across your entire customer base.",
  },
]

export function ForCompliance() {
  return (
    <section id="for-compliance" className="border-b border-border py-24">
      <div className="container mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <span className="text-sm font-medium text-primary">For heads of compliance</span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Transform policy management from liability to advantage
            </h2>
            <p className="mt-4 text-muted-foreground">
              Stop relying on manual processes and spreadsheet-based controls. NUL gives you a single source of truth
              for all compliance policies, with real-time visibility into how they are being applied.
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

          <div className="relative">
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="border-b border-border bg-secondary/50 px-4 py-3">
                <span className="text-sm font-medium text-foreground">Policy Studio</span>
              </div>
              <div className="p-4">
                <div className="mb-4 rounded-lg border border-border bg-secondary/30 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">KYC Pack v1.3</p>
                      <p className="text-xs text-muted-foreground">12 controls • Last updated 2 hours ago</p>
                    </div>
                    <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary">Active</span>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-secondary/30 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">AML Pack v1.3</p>
                      <p className="text-xs text-muted-foreground">8 controls • Last updated 1 day ago</p>
                    </div>
                    <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
