/// <reference types="vitest/globals" />

/** Shim so test files type-check when vitest is not yet installed (e.g. before pnpm install). */
declare module "vitest" {
  export function describe(name: string, fn: () => void): void
  export function it(name: string, fn: () => void | Promise<void>): void
  export const expect: {
    (value: unknown): {
      toBe(expected: unknown): void
      toContain(expected: unknown): void
      toMatch(pattern: RegExp | string): void
      not: { toContain(expected: unknown): void }
      [key: string]: unknown
    }
  }
  export const vi: {
    useFakeTimers: () => void
    useRealTimers: () => void
    setSystemTime: (date: Date) => void
    [key: string]: unknown
  }
}
