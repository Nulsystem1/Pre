"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FileCode2,
  Search,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  Zap,
  BookOpen,
  CheckSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

// Single user: Sarah Chen, NUL Systems Production
const USER = {
  name: "Sarah Chen",
  title: "Compliance Officer",
  initials: "SC",
  color: "bg-purple-500 text-white",
  description: "Day-to-day operations, reviews, policy management",
  navigation: [
    { name: "User Guide", href: "/documentation", icon: BookOpen },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Command Center", href: "/command-center", icon: Zap },
    { name: "Policy Studio", href: "/policy-studio", icon: FileCode2 },
    { name: "Review Queue", href: "/review-queue", icon: CheckSquare },
    { name: "Audit Explorer", href: "/audit-explorer", icon: Search },
    { name: "Settings", href: "/settings", icon: Settings },
  ],
}

export function AppSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
          <Shield className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && <span className="text-lg font-semibold text-sidebar-foreground">NUL</span>}
      </div>

      {/* User / role badge */}
      {!collapsed && (
        <div className="mx-3 mt-3 mb-1">
          <div className="rounded-lg px-3 py-2 text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{USER.title}</span>
            </div>
            <p className="mt-0.5 opacity-75">{USER.description}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {USER.navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", item.name === "Command Center" && "text-emerald-500")} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {/* User section - Sarah Chen */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex w-full items-center gap-3 rounded-lg p-2">
          <div className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
            USER.color
          )}>
            {USER.initials}
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-sidebar-foreground">{USER.name}</p>
              <p className="truncate text-xs text-sidebar-foreground/60">{USER.title}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

