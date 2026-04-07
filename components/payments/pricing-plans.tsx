"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Star, Loader2 } from "lucide-react"
import { useOrganization } from "@/lib/organization-context"

const plans = [
  {
    id: "individual",
    name: "Individual",
    description: "Perfect for solo compliance professionals",
    price: { monthly: 29, yearly: 290 },
    features: [
      "Up to 100 decisions/month",
      "Basic policy templates",
      "Email support"
    ]
  },
  {
    id: "pro",
    name: "Professional",
    description: "For growing compliance teams",
    price: { monthly: 99, yearly: 990 },
    popular: true,
    features: [
      "Up to 10,000 decisions/month",
      "Advanced policy templates",
      "Priority support",
      "Team collaboration",
      "API access"
    ]
  }
]

export function PricingPlans() {
  const { organization } = useOrganization()
  const [loading, setLoading] = useState<string | null>(null)

  const handleSelectPlan = async (planId: string, billingCycle: "monthly" | "yearly") => {
    if (!organization) {
      alert("Please create an organization first")
      return
    }

    setLoading(`${planId}-${billingCycle}`)

    try {
      const response = await fetch("/api/payments/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: organization.id,
          plan: planId,
          billingCycle
        })
      })

      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert("Failed to create checkout session")
      }
    } catch (error) {
      console.error("Failed to create checkout session:", error)
      alert("Something went wrong. Please try again.")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
      {plans.map((plan) => (
        <Card key={plan.id} className={`relative ${plan.popular ? "border-primary" : ""}`}>
          {plan.popular && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary">
                <Star className="mr-1 h-3 w-3" />
                Most Popular
              </Badge>
            </div>
          )}

          <CardHeader>
            <CardTitle>{plan.name}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
            <div className="text-3xl font-bold">
              ${plan.price.monthly}
              <span className="text-base font-normal text-muted-foreground">/month</span>
            </div>
          </CardHeader>

          <CardContent>
            <ul className="space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>

          <CardFooter className="space-y-2">
            <Button
              className="w-full"
              onClick={() => handleSelectPlan(plan.id, "monthly")}
              disabled={!!loading}
            >
              {loading === `${plan.id}-monthly` ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Subscribe Monthly"
              )}
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => handleSelectPlan(plan.id, "yearly")}
              disabled={!!loading}
            >
              {loading === `${plan.id}-yearly` ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Subscribe Yearly - Save 20%"
              )}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}