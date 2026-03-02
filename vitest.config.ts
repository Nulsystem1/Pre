// Vitest config – runs at test time. Use shim types (vitest.config.d.ts) when vitest/vite are not installed.
import { defineConfig } from "vitest/config"
// @ts-expect-error – optional dep; vitest.config.d.ts shims types when not installed
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    testTimeout: 30_000,
    include: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    globals: true,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
} as Parameters<typeof defineConfig>[0])
