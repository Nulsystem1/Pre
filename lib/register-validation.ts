export type RegistrationFieldKey = "firstName" | "lastName" | "email" | "password"

export type RegistrationFieldErrors = Partial<Record<RegistrationFieldKey, string>>

/** Practical email format (local@domain.tld); trims surrounding whitespace. */
export const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

/** Letters only (A–Z, a–z). Empty string is allowed (optional names). */
export const LETTERS_ONLY_NAME_REGEX = /^[a-zA-Z]*$/

const PASSWORD_SPECIAL_RE = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/

export function getFirstNameError(raw: unknown): string | null {
  if (raw == null) return null
  const s = String(raw).trim()
  if (s.length === 0) return null
  if (!LETTERS_ONLY_NAME_REGEX.test(s)) {
    return "First name must contain letters only."
  }
  return null
}

export function getLastNameError(raw: unknown): string | null {
  if (raw == null) return null
  const s = String(raw).trim()
  if (s.length === 0) return null
  if (!LETTERS_ONLY_NAME_REGEX.test(s)) {
    return "Last name must contain letters only."
  }
  return null
}

export function getEmailError(raw: unknown): string | null {
  if (raw == null || String(raw).trim() === "") {
    return "Email is required."
  }
  const email = String(raw).trim()
  if (!EMAIL_REGEX.test(email)) {
    return "Enter a valid email address."
  }
  return null
}

export function getPasswordError(raw: unknown): string | null {
  if (raw == null || String(raw) === "") {
    return "Password is required."
  }
  const password = String(raw)
  if (password.length < 8) {
    return "Password must be at least 8 characters."
  }
  if (!/[a-z]/.test(password)) {
    return "Password must include a lowercase letter."
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must include an uppercase letter."
  }
  if (!/[0-9]/.test(password)) {
    return "Password must include a number."
  }
  if (!PASSWORD_SPECIAL_RE.test(password)) {
    return "Password must include a special character (!@#$%^&* etc.)."
  }
  return null
}

/** Server-side: validate registration body fields (no confirm password). */
export function getRegistrationFieldErrors(input: {
  email: unknown
  password: unknown
  firstName?: unknown
  lastName?: unknown
}): RegistrationFieldErrors {
  const errors: RegistrationFieldErrors = {}

  const firstErr = getFirstNameError(input.firstName)
  if (firstErr) errors.firstName = firstErr

  const lastErr = getLastNameError(input.lastName)
  if (lastErr) errors.lastName = lastErr

  const emailErr = getEmailError(input.email)
  if (emailErr) errors.email = emailErr

  const passErr = getPasswordError(input.password)
  if (passErr) errors.password = passErr

  return errors
}

export function getConfirmPasswordError(password: string, confirm: unknown): string | null {
  const c = confirm == null ? "" : String(confirm)
  if (c === "") {
    return "Please confirm your password."
  }
  if (password !== c) {
    return "Passwords do not match."
  }
  return null
}
