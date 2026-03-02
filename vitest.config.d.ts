/** Shim so vitest.config.ts type-checks when vitest/vite packages are not yet installed (e.g. before pnpm install). */
declare module "vitest/config" {
  export function defineConfig(config: Record<string, unknown>): unknown
}
declare module "@vitejs/plugin-react" {
  const plugin: (options?: unknown) => unknown
  export default plugin
}
