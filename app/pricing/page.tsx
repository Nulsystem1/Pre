import { PricingPlans } from "@/components/payments/pricing-plans"

export default function PricingPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-xl text-muted-foreground">
          Start your compliance automation journey today
        </p>
      </div>

      <PricingPlans />
    </div>
  )
}