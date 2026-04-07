"use client"

import { useMemo, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = useMemo(() => searchParams.get("token") || "", [searchParams])
  const [newPassword, setNewPassword] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setMessage("")
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password")
      }
      setMessage(data.message || "Password reset successful")
      setTimeout(() => router.push("/sign-in"), 1200)
    } catch (err: any) {
      setError(err.message || "Failed to reset password")
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Invalid reset link</h1>
          <p className="text-sm text-muted-foreground">This password reset link is missing a token.</p>
          <Link className="text-sm text-primary hover:underline" href="/forgot-password">
            Request a new link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
      <div className="w-full space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Reset password</h1>
          <p className="text-sm text-muted-foreground">Choose a new password for your account.</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="password"
              minLength={8}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <Button className="w-full" disabled={isLoading} type="submit">
            {isLoading ? "Updating..." : "Update password"}
          </Button>
        </form>
        {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </div>
  )
}
