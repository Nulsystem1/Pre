# Tests

Folder-based layout aligned with **what** you’re testing:

| Folder | Purpose |
|--------|--------|
| **unit/** | Business rules (JSON Logic, decision priority, risk), utils. No I/O. |
| **integration/api/** | One test per major API route (health, audit, review-queue, policy, command-center, decisions). |
| **auth/** | Sign-in form and (later) protected routes / permissions. |
| **smoke/** | Core UI paths: dashboard, command-center, audit-explorer, review-queue, policy-studio, sign-in. |

See **[TESTING.md](../TESTING.md)** at project root for:

- What to test in each category
- How to run tests (`pnpm test`, `pnpm test:run`)
- How to run integration/smoke (set `TEST_BASE_URL` or run app on `http://localhost:3000`)
