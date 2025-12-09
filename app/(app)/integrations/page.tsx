import { IntegrationCard } from "@/components/integrations/integration-card"
import { Database, Users, ArrowUpDown, Shield } from "lucide-react"

const integrations = [
  {
    id: "core-banking",
    name: "Core Banking",
    description: "Primary banking system for account data, customer profiles, and transaction history",
    icon: Database,
    status: "connected" as const,
    lastSync: "2 min ago",
    syncStatus: "healthy" as const,
  },
  {
    id: "onboarding-portal",
    name: "Onboarding Portal",
    description: "Customer onboarding application for KYC document collection and verification",
    icon: Users,
    status: "connected" as const,
    lastSync: "5 min ago",
    syncStatus: "healthy" as const,
  },
  {
    id: "transaction-processor",
    name: "Transaction Processor",
    description: "Real-time payment processing system for wire transfers and card transactions",
    icon: ArrowUpDown,
    status: "connected" as const,
    lastSync: "1 min ago",
    syncStatus: "healthy" as const,
  },
  {
    id: "sanctions-provider",
    name: "Sanctions List Provider",
    description: "Third-party provider for OFAC, EU, and UN sanctions screening data",
    icon: Shield,
    status: "connected" as const,
    lastSync: "1 hour ago",
    syncStatus: "warning" as const,
  },
]

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
        <p className="text-muted-foreground">Manage connections to your banking systems and data providers</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {integrations.map((integration) => (
          <IntegrationCard key={integration.id} integration={integration} />
        ))}
      </div>
    </div>
  )
}
