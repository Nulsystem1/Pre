// lib/stripe.ts - Stripe payment integration for MVP
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

const PRICES = {
  individual: {
    monthly: process.env.STRIPE_PRICE_INDIVIDUAL_MONTHLY!,
    yearly: process.env.STRIPE_PRICE_INDIVIDUAL_YEARLY!,
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY!,
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY!,
  },
}

export async function createCheckoutSession(
  organizationId: string,
  plan: "individual" | "pro",
  billingCycle: "monthly" | "yearly"
) {
  const priceId = PRICES[plan][billingCycle]

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    metadata: { organizationId, plan, billingCycle },
  })

  return session
}

export async function handleWebhook(rawBody: Buffer, signature: string) {
  const event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!)

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    const { organizationId, plan } = session.metadata!

    // Update organization subscription
    await query(
      `UPDATE organizations
       SET subscription_status = 'active',
           subscription_plan = $1,
           stripe_customer_id = $2
       WHERE id = $3`,
      [plan, session.customer, organizationId]
    )
  }

  return { received: true }
}

// Import query function
import { query } from "./supabase"