"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  FileCode2,
  Search,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Zap,
  Workflow,
  Presentation,
  ClipboardList,
  ArrowLeftRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

// ============================================
// ROLE CONFIGURATION
// Define each demo persona with their own navigation and home page
// ============================================

const ROLES = {
  executive: {
    id: "executive",
    name: "David Ross",
    title: "Chief Executive Officer",
    initials: "DR",
    color: "bg-blue-500 text-white",
    homePage: "/executive",
    description: "Strategic overview, ROI metrics, risk posture",
    navigation: [
      { name: "Executive Overview", href: "/executive", icon: Presentation },
      { name: "Audit Trail", href: "/audit-explorer", icon: Search },
    ],
  },
  operator: {
    id: "operator",
    name: "Sarah Chen",
    title: "Compliance Officer",
    initials: "SC",
    color: "bg-purple-500 text-white",
    homePage: "/dashboard",
    description: "Day-to-day operations, reviews, policy management",
    navigation: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Command Center", href: "/command-center", icon: Zap },
      { name: "Policy Studio", href: "/policy-studio", icon: FileCode2 },
      { name: "Review Queue", href: "/review-queue", icon: CheckSquare },
      { name: "Agent Builder", href: "/agent-builder", icon: Workflow },
      { name: "Audit Explorer", href: "/audit-explorer", icon: Search },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
  auditor: {
    id: "auditor",
    name: "Michael Torres",
    title: "External Auditor",
    initials: "MT",
    color: "bg-amber-500 text-white",
    homePage: "/audit-explorer",
    description: "Read-only audit access, decision history, compliance reports",
    navigation: [
      { name: "Audit Explorer", href: "/audit-explorer", icon: Search },
      { name: "Decision Log", href: "/review-queue", icon: ClipboardList },
    ],
  },
} as const

type RoleId = keyof typeof ROLES

const ROLE_ORDER: RoleId[] = ["operator", "executive", "auditor"]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [roleId, setRoleId] = useState<RoleId>("operator")
  const [showRolePicker, setShowRolePicker] = useState(false)

  const currentRole = ROLES[roleId]

  // Switch to next role and navigate to their home page
  const switchRole = (newRoleId: RoleId) => {
    setRoleId(newRoleId)
    setShowRolePicker(false)
    // Auto-navigate to the new role's home page
    router.push(ROLES[newRoleId].homePage)
  }

  // Cycle through roles on click (quick toggle)
  const cycleRole = () => {
    const currentIndex = ROLE_ORDER.indexOf(roleId)
    const nextIndex = (currentIndex + 1) % ROLE_ORDER.length
    switchRole(ROLE_ORDER[nextIndex])
  }

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

      {/* Role Badge - Shows current persona */}
      {!collapsed && (
        <div className="mx-3 mt-3 mb-1">
          <div className={cn(
            "rounded-lg px-3 py-2 text-xs font-medium",
            roleId === "executive" && "bg-blue-500/10 text-blue-400 border border-blue-500/20",
            roleId === "operator" && "bg-purple-500/10 text-purple-400 border border-purple-500/20",
            roleId === "auditor" && "bg-amber-500/10 text-amber-400 border border-amber-500/20",
          )}>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{currentRole.title}</span>
            </div>
            <p className="mt-0.5 opacity-75">{currentRole.description}</p>
          </div>
        </div>
      )}

      {/* Navigation - Role-specific */}
      <nav className="flex-1 space-y-1 p-2">
        {currentRole.navigation.map((item) => {
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
              <item.icon className="h-5 w-5 shrink-0" />
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

      {/* Role Picker Panel */}
      {showRolePicker && !collapsed && (
        <div className="absolute bottom-20 left-2 right-2 bg-background border border-border rounded-lg shadow-lg p-2 z-50">
          <div className="text-xs font-semibold text-muted-foreground px-2 py-1 mb-1">
            Switch Demo Persona
          </div>
          {ROLE_ORDER.map((id) => {
            const role = ROLES[id]
            const isActive = id === roleId
            return (
              <button
                key={id}
                onClick={() => switchRole(id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors",
                  isActive ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/50"
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  role.color
                )}>
                  {role.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{role.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{role.title}</p>
                </div>
                {isActive && <CheckSquare className="h-4 w-4 text-green-500" />}
              </button>
            )
          })}
        </div>
      )}

      {/* User section - Click to toggle role picker */}
      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={() => collapsed ? cycleRole() : setShowRolePicker(!showRolePicker)}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg p-2 transition-colors text-left",
            showRolePicker ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/50"
          )}
          title="Click to switch demo persona"
        >
          <div className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors",
            currentRole.color
          )}>
            {currentRole.initials}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-sidebar-foreground">{currentRole.name}</p>
                <p className="truncate text-xs text-sidebar-foreground/60">{currentRole.title}</p>
              </div>
              <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
            </>
          )}
        </button>
      </div>
    </aside>
  )
}

