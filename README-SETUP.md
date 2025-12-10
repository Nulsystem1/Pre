# Quick Start Guide

This guide will get you up and running with the NUL Compliance Control Center prototype in under 10 minutes.

## Prerequisites

- Docker Desktop installed and running
- Node.js 18+ and pnpm installed
- OpenAI API key ([get one here](https://platform.openai.com/api-keys))

## Quick Setup (3 commands)

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.local.example .env.local
# Edit .env.local and add your OPENAI_API_KEY

# 3. Run setup script
./scripts/setup.sh
```

The setup script will:
- Start Postgres with pgvector
- Start Neo4j
- Initialize database schemas
- Verify everything is working

## Start the Application

In one terminal:
```bash
pnpm dev
```

The app will be available at http://localhost:3001

## Test the Full Flow

In another terminal:
```bash
./scripts/test-flow.sh
```

This will automatically:
1. Create a policy pack
2. Ingest a policy document (with AI extraction)
3. Generate controls from the knowledge graph
4. Evaluate test events against the controls

## View the Results

### Neo4j Graph Visualization

1. Open http://localhost:7474
2. Login: `neo4j` / `neo4jpassword`
3. Run:
```cypher
MATCH (n:GraphNode)-[r]->(m)
RETURN n, r, m
LIMIT 50
```

### Postgres Data

```bash
# View policy packs
docker compose exec postgres psql -U postgres -c "SELECT name, version, status FROM policy_packs;"

# View generated controls
docker compose exec postgres psql -U postgres -c "SELECT control_id, name, action FROM controls;"

# View policy chunks with embeddings
docker compose exec postgres psql -U postgres -c "SELECT section_ref, array_length(embedding, 1) as embedding_dim FROM policy_chunks;"
```

### Application UI

Open http://localhost:3001 and explore:
- **Policy Studio**: Create and edit policies, view knowledge graph
- **Live Controls**: Monitor real-time event evaluation
- **Audit Explorer**: Review compliance decisions
- **Dashboard**: System metrics and analytics

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Next.js App                          │
│                   (Port 3001)                            │
└─────────────┬───────────────────────────────┬───────────┘
              │                               │
              ▼                               ▼
    ┌──────────────────┐          ┌──────────────────────┐
    │   Supabase       │          │       Neo4j          │
    │   (Postgres)     │          │   (Graph Database)   │
    │   Port 5432      │          │   Port 7687          │
    │                  │          │                      │
    │ • Policy Packs   │          │ • Knowledge Graph    │
    │ • Chunks         │          │ • Nodes & Edges      │
    │ • Controls       │          │ • Relationships      │
    │ • Decisions      │          │                      │
    │ • Embeddings     │          │                      │
    └──────────────────┘          └──────────────────────┘
              │                               │
              ▼                               ▼
         PostgREST                      Neo4j Browser
        (Port 3000)                    (Port 7474)
```

## Data Flow

```
1. Policy Text (written by compliance team)
         ↓
2. AI Ingestion Agent
   - Extracts chunks → Supabase (with OpenAI embeddings)
   - Builds graph → Neo4j (nodes + edges)
         ↓
3. AI Control Generation Agent
   - Reads graph from Neo4j
   - Generates JSON Logic controls → Supabase
         ↓
4. Event Evaluation Engine
   - Incoming event (customer onboarding, transaction, etc.)
   - Fetches controls from Supabase
   - Evaluates conditions
   - Stores decision → Supabase (immutable audit log)
         ↓
5. Case Management (if REVIEW or BLOCK)
   - Creates case for human review
```

## Example: Full Policy → Control → Decision Flow

### 1. Input Policy

```text
Identity Verification: All customers must provide government-issued
photo ID. If ID cannot be verified automatically, block onboarding.
```

### 2. AI Extracts Knowledge Graph

Nodes:
- `Condition`: "ID Not Verified" (field: id_verified, operator: ==, value: false)
- `Action`: "Block Onboarding" (action_type: BLOCK, severity: critical)

Edge:
- `Condition` --[TRIGGERS]--> `Action`

### 3. AI Generates Control

```json
{
  "control_id": "KYC-001",
  "condition": {
    "==": [{"var": "customer.id_verified"}, false]
  },
  "action": "BLOCK",
  "risk_weight": 1.0
}
```

### 4. Event Evaluation

Input event:
```json
{
  "customer": {
    "id_verified": false,
    "name": "John Doe",
    "age": 30
  }
}
```

Result:
```json
{
  "final_decision": "BLOCKED",
  "risk_score": 100,
  "triggered_control": "KYC-001"
}
```

## Troubleshooting

### Docker Issues

```bash
# View logs
docker compose logs postgres
docker compose logs neo4j

# Restart everything
docker compose down
docker compose up -d
```

### Database Connection Issues

```bash
# Test Postgres
docker compose exec postgres pg_isready

# Test Neo4j
curl http://localhost:7474
```

### API Issues

```bash
# Check if app is running
curl http://localhost:3001/api/policy/packs

# Check logs
pnpm dev  # View console output
```

## Next Steps

1. **Explore the UI**: Navigate through Policy Studio, Live Controls, and Audit Explorer
2. **Create your own policy**: Use the Policy Studio to write and ingest real policies
3. **Customize controls**: Edit generated controls or create new ones
4. **Test different scenarios**: Modify the test-flow.sh script with your own test cases
5. **Review the code**: See [AGENTS.md](AGENTS.md) for architecture details

## Resources

- [AGENTS.md](AGENTS.md) - Detailed architecture and agent implementations
- [INFRASTRUCTURE.md](INFRASTRUCTURE.md) - Comprehensive infrastructure guide
- [scripts/001-create-tables.sql](scripts/001-create-tables.sql) - Postgres schema
- [scripts/neo4j-init.cypher](scripts/neo4j-init.cypher) - Neo4j constraints

## Cleanup

When you're done testing:

```bash
# Stop containers (keeps data)
docker compose stop

# Remove containers and volumes (deletes data)
docker compose down -v
```

## Production Deployment

For production, use managed services:
- Supabase Cloud: https://supabase.com
- Neo4j Aura: https://neo4j.com/cloud/aura/
- Vercel: https://vercel.com (for Next.js app)

See [INFRASTRUCTURE.md](INFRASTRUCTURE.md) for production deployment guidance.

