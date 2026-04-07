# NUL Compliance Control Center — Website Documentation

This document describes what the web application is, how pages fit together, and where behavior is implemented. For agent/API architecture details, see **`AGENTS.md`** at the repository root.

---

## 1. What this product is

The **NUL Compliance Control Center** is a demo/MVP web app that helps compliance teams:

1. **Ingest** policy text into structured **chunks** (for semantic / Linear RAG) and a **knowledge graph** (Graph RAG).
2. **Validate** real-world scenarios (events, documents, narratives) against those policies using an **AI agent** that returns **APPROVED**, **REVIEW**, or **BLOCKED**, plus confidence and reasoning.
3. **Review** borderline cases in a **Review Queue** (notes, file uploads, re-validation).
4. **Audit** decisions over time in **Audit Explorer** and high-level metrics on the **Dashboard**.

The default experience is a **single operator** (Sarah Chen, Compliance Officer) and organization (**NUL Systems Production**); there is no multi-tenant sign-in in the MVP.

---

## 2. Technology stack (high level)

| Layer | Technology |
|--------|------------|
| Framework | **Next.js** (App Router), React, TypeScript |
| UI | Radix-based components, Tailwind CSS |
| Policy & chunks | **PostgreSQL** (e.g. Supabase) — policy packs, chunks, embeddings, command-center results |
| Knowledge graph | **Neo4j** (e.g. AuraDB) — nodes and edges per policy pack |
| AI | **OpenAI** API (chat completions, structured JSON output; embeddings for Linear RAG) |
| Charts | Recharts (Dashboard) |

---

## 3. Entry points and routing

| URL | Behavior |
|-----|----------|
| `/` | Redirects to **`/dashboard`**. |
| `/dashboard` | Operational overview: metrics, **audit decision history**, decision velocity chart, live feed, outcome distribution. |
| `/documentation` | **User Guide** — step-by-step workflows + quick reference (in-app). |
| `/command-center` | Select policy pack, paste text or upload file, **Validate**; results list; create **Review Queue** cases. |
| `/policy-studio` | Create/edit policy packs, upload policy text, **Ingest & Build** (chunks + graph). |
| `/review-queue` | List of cases needing human follow-up. |
| `/review-queue/cases/[id]` | Case detail: automated result, attachments, **Re-run validation**, approve/block/escalate, export JSON. |
| `/audit-explorer` | Searchable **audit trail** of decisions (status vs outcome, confidence, detail modal). |
| `/settings` | Demo settings (e.g. agent thresholds, org label). |
| `/audit-log`, `/documents`, `/documents/[id]`, `/agent-builder`, `/executive` | Additional or legacy/demo areas; not all are in the primary sidebar. |

**Sidebar navigation** (primary user journey) is defined in `components/app/app-sidebar.tsx`: User Guide, Dashboard, Command Center, Policy Studio, Review Queue, Audit Explorer, Settings.

---

## 4. End-to-end workflow (recommended order)

```
Policy Studio (create pack + upload text)
        ↓
Ingest & Build (chunks + embeddings in Postgres, graph in Neo4j)
        ↓
Command Center (select pack, enter event / upload file, Validate)
        ↓
    ┌─── APPROVED / BLOCKED / REVIEW (engine outcome)
    │
    └─── Create case → Review Queue
              ↓
         Notes + files + Re-run validation (optional)
              ↓
         Human outcome (Approve / Block / Escalate / etc.)
              ↓
Audit Explorer + Dashboard (history and trends)
```

---

## 5. Page-by-page summary

### Dashboard (`/dashboard`)

- Pulls **`GET /api/audit`** for decision list and **`GET /api/review-queue/cases`** for recent cases.
- **Metrics:** total volume, approved / blocked / human review counts (using **outcome** from review queue when present, else engine **status**).
- **Audit decision history:** recent rows with status, review outcome, timestamps; links to Audit Explorer.
- **Decision velocity:** 7-day area chart.
- **Live feed:** recent review cases or fallback to recent audit decisions.
- **Outcomes pie chart:** distribution of effective outcomes.

### User Guide (`/documentation`)

- Numbered steps: Policy Studio → Ingest → Command Center → Review Queue → Audit Explorer.
- Sample **DoD training** text (Command Center vs Review Queue supplementary document).
- Quick reference table.

### Command Center (`/command-center`)

- Chooses **policy pack** (must have ingested chunks).
- Input: free text and/or **PDF / TXT / CSV** (parsed via API).
- **Validate** calls **`POST /api/decisions/evaluate-agentic`** (hybrid Linear + Graph RAG, structured decision).
- Results persisted via command-center results API; user can **create a case** for Review Queue.

### Policy Studio (`/policy-studio`)

- CRUD-style flows for packs; policy text upload/paste.
- **Ingest & Build** → **`POST /api/policy/ingest`**: AI extracts chunks + graph nodes/edges; stores chunks (with embeddings) and graph in Neo4j.

### Review Queue (`/review-queue`, `/review-queue/cases/[id]`)

- Cases tied to validation results and policy pack.
- **Re-run validation** sends prior outcome, missing fields, and recommended actions plus **additionalContext** (notes + file extracts) to **`evaluate-agentic`** for a focused second pass.
- **Export JSON** includes `additional_data` (notes, file extracts) when present.

### Audit Explorer (`/audit-explorer`)

- **`GET /api/audit`** — decisions with optional join to review queue outcomes.
- Columns distinguish **Status** (engine) vs **Outcome** (human review when available).
- Detail view: reasoning, confidence, matched policies, “results after review queue” when applicable.

### Settings (`/settings`)

- Configuration UI for demo parameters (e.g. confidence threshold messaging); persisted as appropriate for the environment.

---

## 6. Core API routes (non-exhaustive)

| Method | Path | Role |
|--------|------|------|
| POST | `/api/decisions/evaluate-agentic` | Main agentic evaluation (RAG + optional `previousDecision` + `additionalContext` on re-run). |
| POST | `/api/policy/ingest` | Ingest policy text → chunks + graph. |
| GET | `/api/policy/packs`, `/api/policy/packs/[id]` | Policy packs. |
| POST | `/api/policy/search` | Policy Q&A-style search (RAG). |
| GET | `/api/audit` | Audit decisions for Explorer & Dashboard. |
| GET/POST | `/api/command-center/results` | List/save validation results. |
| POST | `/api/command-center/parse-data-file` | Parse uploaded CSV/PDF/TXT for events. |
| GET/PATCH | `/api/review-queue/cases/[id]` | Case read/update, re-run result patch. |
| POST | `/api/review-queue/cases/[id]/attachments` | Upload attachment + text extraction. |
| GET | `/api/graph`, `/api/graph/nodes`, `/api/graph/edges` | Graph data for visualization/API consumers. |

Runtime: OpenAI-backed routes should use **`export const runtime = "nodejs"`** where applicable (see route files).

---

## 7. Key concepts

| Term | Meaning |
|------|--------|
| **Linear RAG** | Top policy **chunks** ranked by **embedding similarity** to the event/query; fed into the LLM as “relevant policy text.” |
| **Graph RAG** | Policy **nodes** and **relationships** (e.g. TRIGGERS, REQUIRES) serialized to text and fed into the same LLM call. |
| **Normalized case** | Pre-LLM structured view (actor, action, object, source, timing, conditions, …) from `lib/case-normalization.ts`. |
| **Policy schema** | Generic validation metadata in `lib/policy-schema-registry.ts` (required/optional fields, decision order, evidence rules). |
| **Status vs Outcome** | **Status** = engine decision (APPROVED/REVIEW/BLOCKED). **Outcome** = human review result when a case exists (e.g. Approved, Blocked, Pending). |

---

## 8. Environment variables (typical)

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Chat + embeddings (required at **runtime** for AI features; lazy init avoids build failures). |
| `POSTGRES_URL` or `DATABASE_URL` | Postgres / Supabase connection. |
| `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD` | Neo4j graph. |

See `.env.example` or deployment notes in the repo for the full list.

---

## 9. Related documentation

| File | Content |
|------|---------|
| `AGENTS.md` | Agent architecture, JSON Logic, data models, endpoint list (conceptual). |
| `IMPLEMENTATION-SUMMARY.md` | Implementation notes and history. |
| `docs/demo-examples.md` | Example scenarios and expected outcomes. |
| `app/(app)/documentation/page.tsx` | In-app **User Guide** for operators. |

---

## 10. Maintenance note

When you add a **new primary page** or **API**, update:

1. This file (`docs/WEBSITE.md`) — site map and API table.
2. The in-app **User Guide** if end users need new steps.
3. `components/app/app-sidebar.tsx` if the page should appear in the main nav.

---

*Document version: aligned with DemoMVP codebase structure. Adjust dates and deployment specifics in your fork as needed.*
