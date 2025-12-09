import { FileText, Cpu, Activity } from "lucide-react"

const steps = [
  {
    step: "01",
    icon: FileText,
    title: "Ingest policy",
    description:
      "Upload your existing KYC/AML policy documents. NUL parses regulatory requirements, risk thresholds, and decision logic from plain-language policies.",
  },
  {
    step: "02",
    icon: Cpu,
    title: "Generate controls",
    description:
      "Our engine converts policies into executable control rules. Each control specifies conditions, actions, and risk scoring—ready for deployment.",
  },
  {
    step: "03",
    icon: Activity,
    title: "Execute and audit",
    description:
      "Controls run in real time against onboarding and transaction events. Every decision is logged with full explainability for regulators.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-b border-border py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">How it works</h2>
          <p className="mt-4 text-muted-foreground">From policy document to live enforcement in three steps</p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-3">
          {steps.map((item) => (
            <div
              key={item.step}
              className="group relative rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <span className="text-4xl font-bold text-muted-foreground/20">{item.step}</span>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
