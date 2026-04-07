# NUL Compliance Control Center

**Demo / MVP** — AI-assisted compliance workspace: ingest policy documents, run **dual RAG** (semantic chunks + knowledge graph), validate scenarios in **Command Center**, route work through **Review Queue**, and trace decisions in **Audit Explorer** and the **Dashboard**.

Root `/` redirects to **`/dashboard`**. The primary UI is a single-operator flow (Compliance Officer); there is no production auth in this MVP.

---

## Quick start

```bash
make setup    # DB migrations, env hints — see QUICKSTART.md
make dev      # Next.js dev server (default: http://localhost:3001)
```

**Detailed setup:** [QUICKSTART.md](QUICKSTART.md) · **Infra / DB:** [INFRASTRUCTURE.md](INFRASTRUCTURE.md)

### Environment (runtime)

| Variable | Purpose |
|----------|---------|
| `POSTGRES_URL` or `DATABASE_URL` | PostgreSQL (policy packs, chunks, results, review cases) |
| `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD` | Neo4j knowledge graph |
| `OPENAI_API_KEY` | Chat + embeddings (required when using AI; lazy init avoids build failures without it) |

---

## What’s in the app

| Area | What it does |
|------|----------------|
| **Policy Studio** | Create policy packs, paste/upload text, **Ingest & Build** → chunks + embeddings (Postgres) and graph nodes/edges (Neo4j). |
| **Command Center** | Pick a pack, paste text or upload PDF/TXT/CSV, **Validate** → `POST /api/decisions/evaluate-agentic` (Linear RAG + Graph RAG, structured JSON decision). |
| **Review Queue** | Cases from validation; notes & file uploads; **Re-run validation** sends prior missing fields / recommendations + new context back to the agent. |
| **Audit Explorer** | Full audit list; **Status** (engine) vs **Outcome** (human review when present); detail modal. |
| **Dashboard** | Volume, approved/blocked/review counts, **audit decision history**, 7-day velocity, live feed, outcome chart. |
| **User Guide** | In-app workflows at `/documentation` + link to repo docs. |
| **Settings** | Demo options (e.g. confidence threshold UI). |

Optional / secondary routes (not all in the main sidebar): `/audit-log`, `/documents`, `/agent-builder`, `/executive`.

---

## Architecture

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind, Radix/shadcn-style UI, Recharts on Dashboard.
- **Data:** PostgreSQL for relational + vector-ready chunk storage; **Neo4j** for policy graph (Graph RAG).
- **AI:** OpenAI API — structured outputs for decisions; `text-embedding-3-small` for Linear RAG similarity.
- **Decision path:** Optional pre-LLM case normalization + generic policy schema metadata (`lib/case-normalization.ts`, `lib/policy-schema-registry.ts`); then hybrid RAG prompt; confidence guardrails (`lib/decision-guardrails.ts`).

### Modularity (not a plugin system)

There is **no** formal plugin or tool registry. Integrations and shared behavior are **split into focused modules** under `lib/` so core flows are not entangled with vendor SDKs in one place, for example:

| Module | Role |
|--------|------|
| `lib/openai-client.ts` | OpenAI client (lazy init), structured chat calls |
| `lib/embeddings.ts` | Embedding calls |
| `lib/neo4j.ts` | Graph driver and graph CRUD |
| `lib/supabase.ts` | Postgres / policy data access |
| `lib/decision-guardrails.ts` | Pure confidence / outcome guardrails (testable) |
| `lib/case-normalization.ts` | Pre-LLM case shaping |
| `lib/policy-schema-registry.ts` | Policy schema + validation helpers |
| `lib/review-queue-payload.ts` | Review-queue payload builders |
| `lib/stripe.ts`, `lib/auth.ts` | Optional product features when enabled |

**Tests:** Pure logic such as `decision-guardrails` has unit tests under `tests/` (see `tests/unit/business-rules/`).

**Orchestration** (prompt assembly, RAG loop, HTTP response shape) still lives mainly in **`app/api/.../route.ts`** files (e.g. `evaluate-agentic`). That is intentional for a monolith MVP: swap or extend by adding modules in `lib/` and thin route handlers, not by loading dynamic plugins.

### API / layer boundaries (not microservices)

- **`app/api/**`** — HTTP boundary: parse input, call `lib/` + data stores, return JSON. No separate agent microservice; the “agent” is route + `lib` + OpenAI.
- **`lib/**`** — Reusable logic and **external service adapters** (DB, graph, LLM, embeddings). Keeps routes shorter and tests able to target pure functions where used (e.g. guardrails).

This is **clean separation for a single deployable app**, not a distributed system.

### Observability (basic, not a full analytics stack)

- **Today:** `console.error` / `console.warn` / `console.log` in API routes and some libraries (failures and debug context). User-facing API errors are often mapped to safe messages (e.g. DB connection vs embedding errors in evaluate-agentic).
- **Not included:** Centralized log aggregation, APM (e.g. Datadog), error tracking (e.g. Sentry), or OpenTelemetry tracing out of the box.

Enough to **debug in development and scan server logs** in small deployments; for production hardening, wire your provider of choice into route `catch` blocks or a small logging wrapper.

---

## Make commands

```bash
make help         # All targets
make reset        # Full reset (destructive)
make db-status    # Database connectivity
make test         # Tests (Vitest)
```

You can also use **`pnpm dev`**, **`pnpm build`**, **`pnpm test`** per `package.json`.

---

## Documentation

| Doc | Contents |
|-----|----------|
| **[docs/WEBSITE.md](docs/WEBSITE.md)** | Site map, workflows, main APIs, concepts — **start here** for the full picture |
| [QUICKSTART.md](QUICKSTART.md) | Local setup step-by-step |
| [AGENTS.md](AGENTS.md) | Agent endpoints, JSON Logic / controls model, data shapes |
| [INFRASTRUCTURE.md](INFRASTRUCTURE.md) | Deployment / services |
| [DEMO-GUIDE.md](DEMO-GUIDE.md) | Demo narrative and examples |
| [docs/sample-vendor-policy.md](docs/sample-vendor-policy.md) | Sample policy text for ingest |

---

## Tech stack (short)

Next.js · TypeScript · Tailwind · Radix UI · SWR · PostgreSQL · Neo4j · OpenAI · Docker Compose (optional)

---

**Clean slate:** `make reset && make setup && make dev`
