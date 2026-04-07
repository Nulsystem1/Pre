/** True when pg/Node failed to reach Postgres (DNS, network, refused, timeout). */
export function isPostgresConnectivityError(error: unknown): boolean {
  if (error && typeof error === "object" && "code" in error) {
    const code = String((error as { code?: string }).code)
    if (["ENOTFOUND", "ECONNREFUSED", "ETIMEDOUT", "EAI_AGAIN"].includes(code)) {
      return true
    }
  }
  const msg = error instanceof Error ? error.message : String(error)
  return /getaddrinfo ENOTFOUND|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN/i.test(msg)
}
