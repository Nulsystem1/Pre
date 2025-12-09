"use client"

import { Bell, ChevronDown, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useState } from "react"

const banks = [
  { id: "mercury", name: "Mercury Digital Bank", env: "Production" },
  { id: "nova", name: "Nova Financial", env: "Sandbox" },
  { id: "apex", name: "Apex Credit Union", env: "Production" },
]

export function AppTopbar() {
  const [selectedBank, setSelectedBank] = useState(banks[0])

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 bg-transparent">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/20 text-xs font-bold text-primary">
                {selectedBank.name.charAt(0)}
              </div>
              <span className="font-medium">{selectedBank.name}</span>
              <span className="rounded bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">
                {selectedBank.env}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {banks.map((bank) => (
              <DropdownMenuItem key={bank.id} onClick={() => setSelectedBank(bank)} className="cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/20 text-xs font-bold text-primary">
                    {bank.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{bank.name}</p>
                    <p className="text-xs text-muted-foreground">{bank.env}</p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search customers, cases, controls..." className="w-80 bg-transparent pl-9" />
        </div>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
        </Button>

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
            <DropdownMenuItem className="text-destructive">Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
