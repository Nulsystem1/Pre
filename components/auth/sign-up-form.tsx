"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff, Mail } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  getRegistrationFieldErrors,
  getConfirmPasswordError,
} from "@/lib/register-validation"

type SignUpFieldKey =
  | "firstName"
  | "lastName"
  | "email"
  | "password"
  | "confirmPassword"

type FieldErrorsState = Partial<Record<SignUpFieldKey, string>>

export function SignUpForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    organizationName: "",
  })
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fieldErrors, setFieldErrors] = useState<FieldErrorsState>({})
  const [error, setError] = useState("")
  const [verifyModalOpen, setVerifyModalOpen] = useState(false)
  const [verifyModalMessage, setVerifyModalMessage] = useState("")
  const [verifyModalDevUrl, setVerifyModalDevUrl] = useState<string | null>(null)

  function goToSignInAfterVerify() {
    setVerifyModalOpen(false)
    setVerifyModalDevUrl(null)
    router.push("/sign-in")
  }

  function clearFieldError(field: SignUpFieldKey) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  function handleFormDataChange(field: keyof typeof formData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (field === "firstName" || field === "lastName" || field === "email" || field === "password") {
      clearFieldError(field)
    }
  }

  function handleConfirmChange(value: string) {
    setConfirmPassword(value)
    clearFieldError("confirmPassword")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setFieldErrors({})

    const clientErrors: FieldErrorsState = {
      ...getRegistrationFieldErrors({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      }),
    }
    const confirmErr = getConfirmPasswordError(formData.password, confirmPassword)
    if (confirmErr) clientErrors.confirmPassword = confirmErr

    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors)
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.errors && typeof data.errors === "object") {
          setFieldErrors(data.errors as FieldErrorsState)
          setIsLoading(false)
          return
        }
        {
          const base =
            typeof data.error === "string" && data.error.length > 0
              ? data.error
              : "Registration failed"
          const detail =
            typeof data.detail === "string" && data.detail.length > 0 ? data.detail : ""
          const code = typeof data.code === "string" && data.code.length > 0 ? data.code : ""
          const parts = [base]
          if (code) parts.push(`[${code}]`)
          if (detail) parts.push(detail)
          throw new Error(parts.join(" "))
        }
      }

      if (data.token) {
        localStorage.setItem("authToken", data.token)
        router.push("/pricing")
        return
      }

      if (data.verificationRequired) {
        setVerifyModalMessage(
          typeof data.message === "string" && data.message.length > 0
            ? data.message
            : "Registration successful. Please verify your email before signing in."
        )
        setVerifyModalDevUrl(
          typeof data.verificationUrl === "string" && data.verificationUrl.length > 0
            ? data.verificationUrl
            : null
        )
        setVerifyModalOpen(true)
        return
      }

      router.push("/sign-in")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Dialog
        open={verifyModalOpen}
        onOpenChange={(open) => {
          if (!open) goToSignInAfterVerify()
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Mail className="h-5 w-5 text-primary" aria-hidden />
              </span>
              Check your email
            </DialogTitle>
            <DialogDescription>
              {verifyModalMessage ||
                "Please verify your email before signing in. Use the link we sent to activate your account."}
            </DialogDescription>
            <div className="space-y-3 text-left text-sm text-muted-foreground">
              <p>
                Sent to{" "}
                <span className="font-medium text-foreground">{formData.email}</span>
              </p>
              {verifyModalDevUrl ? (
                <div className="rounded-md border border-border bg-muted/50 p-3 text-xs">
                  <p className="mb-1 font-medium text-foreground">Dev verification URL</p>
                  <p className="break-all font-mono text-muted-foreground">{verifyModalDevUrl}</p>
                </div>
              ) : null}
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" className="w-full sm:w-auto" onClick={goToSignInAfterVerify}>
              Continue to sign in
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First name</Label>
          <Input
            id="firstName"
            type="text"
            placeholder="John"
            value={formData.firstName}
            onChange={(e) => handleFormDataChange("firstName", e.target.value)}
            autoComplete="given-name"
            aria-invalid={!!fieldErrors.firstName}
            className={cn("h-11", fieldErrors.firstName && "border-destructive")}
          />
          {fieldErrors.firstName ? (
            <p className="text-sm text-destructive" role="alert">
              {fieldErrors.firstName}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last name</Label>
          <Input
            id="lastName"
            type="text"
            placeholder="Doe"
            value={formData.lastName}
            onChange={(e) => handleFormDataChange("lastName", e.target.value)}
            autoComplete="family-name"
            aria-invalid={!!fieldErrors.lastName}
            className={cn("h-11", fieldErrors.lastName && "border-destructive")}
          />
          {fieldErrors.lastName ? (
            <p className="text-sm text-destructive" role="alert">
              {fieldErrors.lastName}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          placeholder="compliance@yourbank.com"
          value={formData.email}
          onChange={(e) => handleFormDataChange("email", e.target.value)}
          autoComplete="email"
          aria-invalid={!!fieldErrors.email}
          className={cn("h-11", fieldErrors.email && "border-destructive")}
        />
        {fieldErrors.email ? (
          <p className="text-sm text-destructive" role="alert">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="organizationName">Organization name (optional)</Label>
        <Input
          id="organizationName"
          type="text"
          placeholder="Acme Corp"
          value={formData.organizationName}
          onChange={(e) => handleFormDataChange("organizationName", e.target.value)}
          className="h-11"
        />
        <p className="text-xs text-muted-foreground">Leave blank for individual use</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••••••"
            value={formData.password}
            onChange={(e) => handleFormDataChange("password", e.target.value)}
            autoComplete="new-password"
            aria-invalid={!!fieldErrors.password}
            className={cn("h-11 pr-10", fieldErrors.password && "border-destructive")}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {fieldErrors.password ? (
          <p className="text-sm text-destructive" role="alert">
            {fieldErrors.password}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            At least 8 characters with uppercase, lowercase, number, and special character.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="••••••••••••"
            value={confirmPassword}
            onChange={(e) => handleConfirmChange(e.target.value)}
            autoComplete="new-password"
            aria-invalid={!!fieldErrors.confirmPassword}
            className={cn("h-11 pr-10", fieldErrors.confirmPassword && "border-destructive")}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {fieldErrors.confirmPassword ? (
          <p className="text-sm text-destructive" role="alert">
            {fieldErrors.confirmPassword}
          </p>
        ) : null}
      </div>

      <Button type="submit" className="h-11 w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create account"
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        By creating an account, you agree to our{" "}
        <a href="#" className="underline hover:text-foreground">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#" className="underline hover:text-foreground">
          Privacy Policy
        </a>
      </p>
    </form>
    </>
  )
}
