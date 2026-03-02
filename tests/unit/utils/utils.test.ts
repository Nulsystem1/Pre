/// <reference path="../../../vitest-env.d.ts" />
import { describe, it, expect } from "vitest"
import { cn } from "@/lib/utils"

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b")
  })

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible")
  })

  it("merges tailwind classes and deduplicates conflicting utilities", () => {
    const result = cn("px-2 py-1", "px-4")
    expect(result).toContain("py-1")
    expect(result).toContain("px-4")
    expect(result).not.toContain("px-2")
  })

  it("handles undefined and null", () => {
    expect(cn("a", undefined, null, "b")).toBe("a b")
  })
})
