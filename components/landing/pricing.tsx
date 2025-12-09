import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import Link from "next/link"

const plans = [
  {
    name: "Starter",
    price: "$2,500",
    period: "/month",
    description: "For early-stage fintechs getting started with compliance automation",
    features: [
      "Up to 10,000 customers",
      "5 policy packs",
      "Basic KYC controls",
      "Email support",
      "7-day audit retention",
    ],
    cta: "Start free trial",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "$7,500",
    period: "/month",
    description: "For scaling companies with complex compliance requirements",
    features: [
      "Up to 100,000 customers",
      "Unlimited policy packs",
      "Advanced AML controls",
      "Priority support",
      "90-day audit retention",
      "Custom control builder",
      "API access",
    ],
    cta: "Start free trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For banks and large institutions with regulatory complexity",
    features: [
      "Unlimited customers",
      "Dedicated policy support",
      "On-premise deployment option",
      "24/7 support with SLA",
      "Unlimited audit retention",
      "Custom integrations",
      "Regulatory reporting",
    ],
    cta: "Contact sales",
    highlighted: false,
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="border-b border-border py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">Simple, transparent pricing</h2>
          <p className="mt-4 text-muted-foreground">Start with a 14-day free trial. No credit card required.</p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-xl border bg-card p-6 ${
                plan.highlighted ? "border-primary shadow-lg shadow-primary/10" : "border-border"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  Most popular
                </span>
              )}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                <div className="mt-2 flex items-baseline">
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  <span className="ml-1 text-muted-foreground">{plan.period}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <ul className="mb-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="h-4 w-4 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button className="w-full" variant={plan.highlighted ? "default" : "outline"} asChild>
                <Link href="/sign-in">{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
