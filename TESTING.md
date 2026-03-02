# NUL Compliance Control Center – Testing Guide

This document describes **what to test**, **how**, and **where** tests live. The structure is folder-based and aligned with components and features.

---

## Folder structure

```
tests/
├── unit/                          # Pure logic, no I/O
│   ├── business-rules/            # Critical rules: pricing, permissions, calculations
│   │   ├── json-logic.test.ts     # JSON Logic evaluation (control conditions)
│   │   └── decision-priority.test.ts  # BLOCK > REVIEW > APPROVE, risk score
│   └── utils/                     # Shared utilities
│       └── utils.test.ts          # cn(), etc.
├── integration/                   # API routes (one test per major route)
│   └── api/
│       ├── health.test.ts
│       ├── audit.test.ts
│       ├── review-queue-cases.test.ts
│       ├── policy-packs.test.ts
│       ├── command-center.test.ts
│       └── decisions-evaluate.test.ts
├── auth/                          # Authentication & authorization flows
│   └── sign-in.test.tsx           # Sign-in form, redirect, validation
└── smoke/                         # Core UI paths (few smoke tests)
    └── core-pages.test.ts         # Dashboard, Command Center, Audit Explorer, etc.
```

---

## 1. Critical business rules (unit)

**What to test**

| Area | What | Where |
|------|------|--------|
| **Calculations** | JSON Logic: `==`, `!=`, `>`, `<`, `and`, `or`, `in`, `var` resolution | `lib/json-logic.ts` → `tests/unit/business-rules/json-logic.test.ts` |
| **Decision priority** | Final outcome is BLOCK if any control blocks; else REVIEW; else APPROVE | Decision aggregation logic → `tests/unit/business-rules/decision-priority.test.ts` |
| **Risk score** | Composite risk from triggered controls (e.g. average of risk_weight × 100) | Same or control evaluation → `decision-priority.test.ts` or dedicated risk test |

**How**

- Unit tests with Vitest.
- No mocks for pure functions; use real `evaluateCondition` / `matchConditions` from `lib/json-logic.ts`.
- For decision priority, test a small function that takes “triggered controls” and returns outcome + risk (extract that logic into a testable function in `lib/` if needed).

---

## 2. Authentication & authorization flows

**What to test**

| Flow | What | Where |
|------|------|--------|
| Sign-in | Form validation, submit, error display | `components/auth/sign-in-form.tsx` → `tests/auth/sign-in.test.tsx` |
| Protected routes | Unauthenticated user redirected to sign-in (if you add middleware) | `tests/auth/protected-routes.test.ts` (when implemented) |
| Permissions | Role-based access to Command Center / Review Queue (if you add roles) | `tests/auth/permissions.test.ts` (when implemented) |

**How**

- React Testing Library for sign-in form (render, fill, submit, assert on state or redirect).
- E2E (e.g. Playwright) for full redirect flows when you add auth middleware.

---

## 3. One integration test per major API route

**What to test**

| Route | Method | Assertions | Test file |
|-------|--------|------------|-----------|
| `/api/health` | GET | 200, body shape | `tests/integration/api/health.test.ts` |
| `/api/audit` | GET | 200, `data.decisions` array | `tests/integration/api/audit.test.ts` |
| `/api/review-queue/cases` | GET | 200, `data` array | `tests/integration/api/review-queue-cases.test.ts` |
| `/api/policy/packs` | GET | 200, `data` array | `tests/integration/api/policy-packs.test.ts` |
| `/api/command-center/submit` or `/api/command-center/results` | POST/GET | 200, result shape | `tests/integration/api/command-center.test.ts` |
| `/api/decisions/evaluate-agentic` | POST | 200, `outcome` in [APPROVED, REVIEW, BLOCKED] (or 400/500/503) | `tests/integration/api/decisions-evaluate.test.ts` |

**How**

- Use `fetch(BASE_URL + path)` in Vitest. Set `BASE_URL` (e.g. `http://localhost:3000`) or skip when not set.
- Assert status and JSON shape; avoid asserting on volatile data (e.g. exact counts).
- Run with dev server up: `pnpm dev` in one terminal, `pnpm test:run` in another, or use a script that starts the server then runs tests.

---

## 4. Smoke tests for core UI paths

**What to test**

| Path | Goal | Where |
|------|------|--------|
| `/dashboard` | Page loads (200 or successful render) | `tests/smoke/core-pages.test.ts` |
| `/command-center` | Page loads | Same |
| `/audit-explorer` | Page loads | Same |
| `/review-queue` | Page loads | Same |
| `/policy-studio` | Page loads | Same |
| `/sign-in` | Page loads | Same |

**How**

- **Option A (Vitest):** `fetch(BASE_URL + path)` and assert status 200 and that HTML contains a known element (e.g. heading or data-testid).
- **Option B (Playwright):** Real browser, `page.goto()`, assert visible text or role. Add `playwright.config.ts` and `tests/e2e/` when you add Playwright.

---

## Running tests

- **Unit + integration + smoke (Vitest):**  
  `pnpm test` (watch) or `pnpm test:run` (single run).
- **Integration/smoke:** Ensure app is running on `BASE_URL` (e.g. `http://localhost:3000`) or set `TEST_BASE_URL`.
- **E2E (future):** `pnpm exec playwright test` after adding Playwright.

---

## Adding new tests

- **New business rule:** Add or extend a test in `tests/unit/business-rules/` and keep the logic under `lib/` where possible.
- **New API route:** Add `tests/integration/api/<route-name>.test.ts` and follow the “one integration test per major API route” pattern.
- **New core page:** Add a smoke case in `tests/smoke/core-pages.test.ts` or a new file under `tests/smoke/`.
- **New auth flow:** Add or extend tests in `tests/auth/`.

Keep tests next to the structure above so the team can work in one place per category (unit vs integration vs auth vs smoke).
