import { NextResponse } from "next/server"
import { isPostgresConnectivityError } from "@/lib/postgres-connectivity"

function toErrorDetail(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === "string") return error
  return "Unknown error"
}

/** PostgreSQL 5-char SQLSTATE (e.g. 42P01), not Node errno codes like ENOTFOUND. */
export function getPostgresSqlState(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined
  const code = (error as { code?: unknown }).code
  if (typeof code !== "string") return undefined
  if (/^[0-9][0-9A-Z]{4}$/.test(code)) return code
  return undefined
}

/**
 * Maps DB errors from registration queries to HTTP responses.
 * Node errors use short codes like ENOTFOUND; Postgres uses 42P01, etc.
 */
export function registrationQueryErrorResponse(error: unknown): NextResponse | null {
  if (!error) return null

  if (isPostgresConnectivityError(error)) {
    return NextResponse.json(
      {
        code: "DATABASE_UNAVAILABLE",
        error:
          "The app cannot reach the database. Check POSTGRES_URL (Docker Compose: localhost:5434) or your Supabase connection string.",
        ...(process.env.NODE_ENV !== "production" ? { detail: toErrorDetail(error) } : {}),
      },
      { status: 503 }
    )
  }

  const sqlState = getPostgresSqlState(error)
  if (sqlState === "42P01") {
    return NextResponse.json(
      {
        code: "DATABASE_SCHEMA_MISSING",
        error:
          "The database is missing required tables. Run .\\scripts\\apply-postgres-schema.ps1 (local Docker) or apply the SQL migrations in Supabase.",
        ...(process.env.NODE_ENV !== "production" ? { detail: toErrorDetail(error) } : {}),
      },
      { status: 503 }
    )
  }

  if (sqlState === "42501" || sqlState === "28000" || sqlState === "28P01") {
    return NextResponse.json(
      {
        code: "DATABASE_AUTH_FAILED",
        error: "The app could not authenticate to the database. Check POSTGRES_URL username and password.",
        ...(process.env.NODE_ENV !== "production" ? { detail: toErrorDetail(error) } : {}),
      },
      { status: 503 }
    )
  }

  return NextResponse.json(
    {
      code: "DATABASE_ERROR",
      error: "Unable to complete registration. Please try again.",
      ...(process.env.NODE_ENV !== "production" ? { detail: toErrorDetail(error) } : {}),
    },
    { status: 500 }
  )
}
