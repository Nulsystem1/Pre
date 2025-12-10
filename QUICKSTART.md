# 🚀 Quick Start Guide

## Starting from Zero

### Option 1: Using Make Commands (Recommended)

```bash
# Complete setup from scratch
make setup        # Install dependencies + start Docker + setup database

# Start development
make dev          # Start Next.js development server
```

Visit: http://localhost:3001

### Option 2: Manual Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Start Docker services
docker compose up -d

# 3. Wait for services (5-10 seconds)
sleep 8

# 4. Initialize database
docker exec nul-postgres psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/001-create-tables.sql

# 5. Remove event type constraint
docker exec nul-postgres psql -U postgres -d postgres -c "ALTER TABLE events DROP CONSTRAINT IF EXISTS events_event_type_check;"

# 6. Initialize Neo4j
docker cp scripts/neo4j-init.cypher nul-neo4j:/tmp/init.cypher
docker exec nul-neo4j cypher-shell -u neo4j -p compliance123 -f /tmp/init.cypher

# 7. Start development server
pnpm dev
```

---

## 🔄 Full Reset (Clean Start)

```bash
make reset        # DANGER: Deletes ALL data and starts fresh
```

Or manually:

```bash
# Stop and remove all data
docker compose down -v

# Remove Docker volumes
docker volume rm nul-compliance-control-center_postgres_data
docker volume rm nul-compliance-control-center_neo4j_data

# Start fresh
make setup
```

---

## 📋 Common Commands

| Command | Description |
|---------|-------------|
| `make help` | Show all available commands |
| `make start` | Start Docker services |
| `make stop` | Stop Docker services |
| `make restart` | Restart services |
| `make dev` | Start development server |
| `make build` | Build for production |
| `make db-reset` | Reset database only |
| `make db-status` | Check database status |
| `make test` | Run E2E tests |
| `make logs` | View Docker logs |
| `make clean` | Remove node_modules and build artifacts |

---

## 🌐 Access Points

- **Application**: http://localhost:3001
- **PostgreSQL**: localhost:5432 (user: `postgres`, pass: `postgres`)
- **Neo4j Browser**: http://localhost:7474 (user: `neo4j`, pass: `compliance123`)

---

## 📊 Test the System

```bash
# Run automated test
make test
```

Or manually test:

1. Go to **Command Center** → Click "Manual Entry"
2. Click "AI Autofill (Demo)"
3. Submit the vendor
4. Click "Process" to see agentic decision
5. View results in **Audit Explorer** or **Review Queue** (if low confidence)

---

## 🎯 Demo Flow

1. **Policy Studio** → Ingest `docs/sample-vendor-policy.md`
2. **Command Center** → Add manual vendor entry
3. **Agent Processing** → Watch AI make decision
4. **Review Queue** → Review low-confidence decisions
5. **Audit Explorer** → See all decisions with reasoning
6. **Settings** → Adjust confidence threshold

---

## 🛠️ Troubleshooting

### Port Already in Use

```bash
# Kill existing processes
pkill -f "pnpm dev"
pkill -f "next"
```

### Database Connection Issues

```bash
# Restart Docker services
make restart

# Check status
make db-status
```

### Full Clean Reinstall

```bash
make clean
rm -rf .next
make reset
make setup
```

---

## 📝 Environment Variables

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Add your OpenAI API key:

```
OPENAI_API_KEY=sk-...
```

---

## 🎨 What's Included

- ✅ **Command Center**: Queue-based agentic decision processing
- ✅ **Policy Studio**: Visual graph-based policy editor
- ✅ **Review Queue**: Human-in-the-loop for low confidence
- ✅ **Audit Explorer**: Full decision history with reasoning
- ✅ **Settings**: Profile + agent configuration
- ✅ **Dashboard**: Real-time metrics and visualizations

---

Need help? Check the logs:

```bash
make logs
```

