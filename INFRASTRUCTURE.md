# Infrastructure Setup Guide

This guide covers how to set up and test the NUL Compliance Control Center with real databases (Supabase + Neo4j).

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ and pnpm installed
- OpenAI API key for embeddings

## Step 1: Environment Configuration

1. Copy the environment template:
```bash
cp .env.local.example .env.local
```

2. Edit `.env.local` and add your OpenAI API key:
```bash
OPENAI_API_KEY=sk-your-actual-api-key-here
```

## Step 2: Install Dependencies

```bash
pnpm install
```

## Step 3: Start Infrastructure

Start Postgres (with pgvector) and Neo4j using Docker Compose:

```bash
docker compose up -d
```

This will start:
- PostgreSQL with pgvector extension on port 5432
- PostgREST API on port 3000
- Neo4j on ports 7474 (HTTP) and 7687 (Bolt)

Wait for services to be healthy:
```bash
docker compose ps
```

## Step 4: Verify Database Connections

### Verify Postgres

```bash
docker compose exec postgres psql -U postgres -c "\dt"
```

You should see the tables created from `scripts/001-create-tables.sql`.

### Verify Neo4j

Open Neo4j Browser at http://localhost:7474

Login credentials:
- Username: `neo4j`
- Password: `neo4jpassword`

Run a test query:
```cypher
SHOW CONSTRAINTS
```

You should see the constraints created by the initialization script.

## Step 5: Initialize Neo4j Constraints

The constraints are created automatically on first startup, but you can manually run them:

```bash
docker compose exec neo4j cypher-shell -u neo4j -p neo4jpassword -f /var/lib/neo4j/import/init.cypher
```

## Step 6: Start the Application

```bash
pnpm dev
```

The app will run on http://localhost:3001 (or the port specified in your Next.js config).

## Step 7: Test the Full Flow

### 7.1 Create a Policy Pack

**API Request:**
```bash
curl -X POST http://localhost:3001/api/policy/packs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test KYC Policy",
    "description": "Testing the full flow"
  }'
```

**Response:** Note the `id` field - you'll need it for the next steps.

### 7.2 Ingest a Policy Document

Replace `POLICY_PACK_ID` with the ID from step 7.1:

```bash
curl -X POST http://localhost:3001/api/policy/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "policyPackId": "POLICY_PACK_ID",
    "policyText": "Customer Due Diligence Requirements:\n\n1. Identity Verification\nAll customers must provide government-issued photo ID before account opening. If ID cannot be verified automatically, block the onboarding process.\n\n2. High-Risk Jurisdictions\nCustomers from high-risk jurisdictions require enhanced due diligence. Block transactions from North Korea, Iran, Syria."
  }'
```

**What happens:**
- AI extracts policy chunks with embeddings (OpenAI)
- AI builds knowledge graph (nodes + edges)
- Chunks stored in Supabase (Postgres)
- Graph stored in Neo4j

**Verify in Neo4j:**
```cypher
MATCH (n:GraphNode)
RETURN n
LIMIT 25
```

**Verify in Postgres:**
```bash
docker compose exec postgres psql -U postgres -c "SELECT id, section_ref FROM policy_chunks;"
```

### 7.3 Generate Controls

```bash
curl -X POST http://localhost:3001/api/controls/generate \
  -H "Content-Type: application/json" \
  -d '{
    "policyPackId": "POLICY_PACK_ID"
  }'
```

**What happens:**
- Fetches knowledge graph from Neo4j
- AI generates JSON Logic controls
- Controls stored in Supabase

**Verify:**
```bash
curl http://localhost:3001/api/controls?policyPackId=POLICY_PACK_ID
```

### 7.4 Evaluate an Event

Test with a sample customer onboarding event:

```bash
curl -X POST http://localhost:3001/api/controls/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "eventData": {
      "customer": {
        "customer_id": "cus-test-001",
        "name": "Test Customer",
        "country": "IR",
        "id_verified": false,
        "address_verified": true,
        "age": 25,
        "risk_score": 45,
        "is_pep": false,
        "account_type": "personal"
      }
    },
    "policyPackId": "POLICY_PACK_ID"
  }'
```

**Expected response:**
- `final_decision`: "BLOCKED" (because country is Iran and ID not verified)
- `risk_score`: High risk score
- `triggered_control`: Details of which control was triggered

## Step 8: View Data in Databases

### View in Postgres (via psql)

```bash
# View policy packs
docker compose exec postgres psql -U postgres -c "SELECT id, name, version, status FROM policy_packs;"

# View controls
docker compose exec postgres psql -U postgres -c "SELECT control_id, name, action FROM controls LIMIT 5;"

# View policy chunks with embedding info
docker compose exec postgres psql -U postgres -c "SELECT id, section_ref, LENGTH(content) as content_len, array_length(embedding, 1) as embedding_dim FROM policy_chunks;"
```

### View in Neo4j Browser

1. Open http://localhost:7474
2. Login with neo4j / neo4jpassword
3. Run queries:

```cypher
// View all nodes and relationships
MATCH (n)-[r]->(m)
RETURN n, r, m
LIMIT 50

// View nodes by type
MATCH (n:Condition)
RETURN n.label, n.properties

// Find paths from conditions to actions
MATCH path = (c:Condition)-[*1..3]->(a:Action)
RETURN path
LIMIT 10
```

## Troubleshooting

### Docker Containers Won't Start

```bash
# Check logs
docker compose logs postgres
docker compose logs neo4j

# Restart services
docker compose down
docker compose up -d
```

### Postgres Connection Issues

```bash
# Test connection
docker compose exec postgres pg_isready -U postgres

# Check if tables exist
docker compose exec postgres psql -U postgres -c "\dt"
```

### Neo4j Connection Issues

```bash
# Check Neo4j logs
docker compose logs neo4j

# Restart Neo4j
docker compose restart neo4j
```

### OpenAI API Errors

- Verify your API key in `.env.local`
- Check your OpenAI account has credits
- Review rate limits

### "Model not found" Errors

The AI model used is `anthropic/claude-sonnet-4-20250514`. Make sure you have access to Anthropic's API through your provider (e.g., OpenRouter, direct Anthropic API).

Update the model in the API routes if needed:
- `app/api/policy/ingest/route.ts`
- `app/api/controls/generate/route.ts`

## Cleanup

To stop and remove all containers and volumes:

```bash
docker compose down -v
```

This will delete all data in the databases.

## Production Deployment

For production:

1. Use managed Supabase (https://supabase.com)
2. Use managed Neo4j Aura (https://neo4j.com/cloud/aura/)
3. Set up proper environment variables
4. Enable SSL/TLS for database connections
5. Set up database backups
6. Configure proper authentication and authorization

## Next Steps

- Explore the Policy Studio UI to visually create and edit policies
- View the Knowledge Graph visualization
- Test the Live Controls with real-time events
- Review the Audit Explorer for compliance trails

