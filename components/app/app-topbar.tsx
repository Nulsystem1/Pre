"use client"

import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"

export function AppTopbar() {
  const router = useRouter()

  async function handleSignOut() {
    const token = localStorage.getItem("authToken")
    if (token) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch {
        // Ignore logout API failures; clear local auth state regardless.
      }
    }

    localStorage.removeItem("authToken")
    localStorage.removeItem("refreshToken")
    window.sessionStorage.removeItem("nul_visited_dashboard")
    router.push("/sign-in")
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-md border border-border bg-transparent px-3 py-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/20 text-xs font-bold text-primary">
            N
          </div>
          <span className="font-medium">NUL Systems</span>
          <span className="rounded bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">
            Production
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search customers, cases, controls..." className="w-80 bg-transparent pl-9" />
        </div>

        

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-medium text-accent-foreground">
                SC
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
