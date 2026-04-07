"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface Organization {
  id: string
  name: string
  slug: string
  subscriptionStatus: string
  subscriptionPlan: string
}

interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role?: string
}

interface OrganizationContextType {
  organization: Organization | null
  user: User | null
  loading: boolean
  refetch: () => Promise<void>
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadUserData() {
    try {
      const token = localStorage.getItem("authToken")
      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setOrganization(data.organization)
      } else {
        // Token is invalid, clear it
        localStorage.removeItem("authToken")
      }
    } catch (error) {
      console.error("Failed to load user data:", error)
      localStorage.removeItem("authToken")
    } finally {
      setLoading(false)
    }
  }

  async function refetch() {
    await loadUserData()
  }

  useEffect(() => {
    loadUserData()
  }, [])

  return (
    <OrganizationContext.Provider value={{
      organization,
      user,
      loading,
      refetch
    }}>
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error("useOrganization must be used within an OrganizationProvider")
  }
  return context
}