"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      setMessage(data.message || "If an account exists, a password reset email has been sent.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
      <div className="w-full space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Forgot password</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email and we will send a password reset link.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button className="w-full" disabled={isLoading} type="submit">
            {isLoading ? "Sending..." : "Send reset email"}
          </Button>
        </form>

        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        <Link className="text-sm text-primary hover:underline" href="/sign-in">
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
