import { NextRequest, NextResponse } from "next/server"
import { createCheckoutSession } from "@/lib/stripe"

export async function POST(request: NextRequest) {
  try {
    const { organizationId, plan, billingCycle } = await request.json()

    if (!organizationId || !plan || !billingCycle) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const session = await createCheckoutSession(organizationId, plan, billingCycle)

    return NextResponse.json({
      sessionId: session.id,
      url: session.url
    })
  } catch (error) {
    console.error("Payment session creation error:", error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}