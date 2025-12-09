import { LandingHeader } from "@/components/landing/landing-header"
import { LandingHero } from "@/components/landing/landing-hero"
import { HowItWorks } from "@/components/landing/how-it-works"
import { ForCompliance } from "@/components/landing/for-compliance"
import { ForAnalysts } from "@/components/landing/for-analysts"
import { Pricing } from "@/components/landing/pricing"
import { LandingFooter } from "@/components/landing/landing-footer"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <main>
        <LandingHero />
        <HowItWorks />
        <ForCompliance />
        <ForAnalysts />
        <Pricing />
      </main>
      <LandingFooter />
    </div>
  )
}
