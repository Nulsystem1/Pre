"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"

const DASHBOARD_PATH = "/dashboard"
const STORAGE_KEY = "nul_visited_dashboard"

/**
 * Ensures users land on dashboard when entering the app.
 * Other paths are only accessible after having been on dashboard this session
 * (e.g. by using the sidebar). Direct URL to a protected path redirects to dashboard.
 */
export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (typeof window === "undefined") return

    const isDashboard = pathname === DASHBOARD_PATH

    if (isDashboard) {
      window.sessionStorage.setItem(STORAGE_KEY, "1")
      return
    }

    const hasVisitedDashboard = window.sessionStorage.getItem(STORAGE_KEY) === "1"
    if (!hasVisitedDashboard) {
      router.replace(DASHBOARD_PATH)
    }
  }, [pathname, router])

  return <>{children}</>
}
