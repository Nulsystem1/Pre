import { SignUpForm } from "@/components/auth/sign-up-form"
import { Shield } from "lucide-react"
import Link from "next/link"

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Form */}
      <div className="flex w-full flex-col justify-center px-4 py-12 lg:w-1/2 lg:px-12">
        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="mb-8 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">NUL</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Create your account</h1>
            <p className="mt-2 text-muted-foreground">
              Get started with compliance automation for your organization.
            </p>
          </div>

          <SignUpForm />

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/sign-in" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Branding */}
      <div className="hidden border-l border-border bg-card lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:p-12">
        <div />

        <div >
          <blockquote className="text-lg text-foreground">
            "NUL has transformed how we manage compliance. What used to take our team weeks now happens in real time,
            with complete audit trails for every decision."
          </blockquote>
          <div className="mt-6">
            <p className="font-medium text-foreground">Sarah Chen</p>
            <p className="text-sm text-muted-foreground">Chief Compliance Officer, Mercury Digital Bank</p>
          </div>
        </div>
      </div>
    </div>
  )
}