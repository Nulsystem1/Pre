#!/bin/bash

# Setup script for NUL Compliance Control Center
# Reads .env.local to decide: use local Docker (Postgres + Neo4j) or remote (Supabase + AuraDB)

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Run from project root (so .env.local and package.json are found)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}NUL Compliance Control Center - Setup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Ensure Node.js and pnpm are available (when script runs in WSL, Windows Node is not in PATH by default)
if ! command -v node > /dev/null 2>&1; then
    for base in "/mnt/c" "/c"; do
        nodedir="$base/Program Files/nodejs"
        if [ -x "$nodedir/node.exe" ] || [ -x "$nodedir/node" ]; then
            export PATH="$nodedir:$PATH"
            break
        fi
    done
    for base in "/mnt/c" "/c"; do
        [ -d "$base/Users" ] || continue
        for npm_bin in "$base/Users"/*/AppData/Roaming/npm; do
            [ -d "$npm_bin" ] && export PATH="$npm_bin:$PATH" && break 2
        done
    done
fi
if ! command -v node > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Node.js not found in this environment.${NC}"
    echo "  Options: run from PowerShell (.\scripts\setup.ps1) or install Node in WSL."
    exit 1
fi
if ! command -v pnpm > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠ pnpm not found. Install with: npm install -g pnpm${NC}"
    exit 1
fi

# Require .env.local
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠ .env.local not found.${NC}"
    #echo "  Copy from template: cp .env.local.example .env.local"
    echo "  Then set OPENAI_API_KEY and POSTGRES_URL / NEO4J_* as needed."
    exit 1
fi

# Read POSTGRES_URL and NEO4J_URI from .env.local (strip \r for Windows line endings)
get_env() {
    grep -E "^${1}=" .env.local 2>/dev/null | sed "s/^${1}=//" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//;s/\r$//' | head -1
}
POSTGRES_URL=$(get_env "POSTGRES_URL")
NEO4J_URI=$(get_env "NEO4J_URI")

# Detect remote vs local from .env.local
USE_SUPABASE=0
USE_AURADB=0
echo "$POSTGRES_URL" | grep -q "supabase.com" && USE_SUPABASE=1
echo "$NEO4J_URI"    | grep -q "databases.neo4j.io" && USE_AURADB=1

if [ "$USE_SUPABASE" -eq 1 ]; then
    echo -e "${BLUE}Using Supabase for Postgres (from .env.local POSTGRES_URL)${NC}"
fi
if [ "$USE_AURADB" -eq 1 ]; then
    echo -e "${BLUE}Using Neo4j AuraDB for graph (from .env.local NEO4J_URI)${NC}"
fi
echo ""

echo -e "${BLUE}Step 1: Installing dependencies${NC}"
pnpm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 2: Start Docker only when using local Postgres or local Neo4j
NEED_DOCKER=0
[ "$USE_SUPABASE" -eq 0 ] && NEED_DOCKER=1
[ "$USE_AURADB" -eq 0 ]  && NEED_DOCKER=1

if [ "$NEED_DOCKER" -eq 1 ]; then
    if ! docker info > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠ Docker is not running. Start Docker for local Postgres/Neo4j.${NC}"
        exit 1
    fi
    echo -e "${BLUE}Step 2: Starting local infrastructure (Docker)${NC}"
    if [ "$USE_SUPABASE" -eq 1 ] && [ "$USE_AURADB" -eq 0 ]; then
        docker compose up -d neo4j
    elif [ "$USE_SUPABASE" -eq 0 ] && [ "$USE_AURADB" -eq 1 ]; then
        docker compose up -d postgres postgrest
    else
        docker compose up -d
    fi
    echo -e "${GREEN}✓ Docker containers starting${NC}"
    echo ""
fi

# Step 3: Wait for local Postgres (only if not Supabase)
if [ "$USE_SUPABASE" -eq 0 ]; then
    echo -e "${BLUE}Step 3: Waiting for Postgres${NC}"
    until docker compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
        sleep 1
    done
    echo -e "${GREEN}✓ Postgres ready${NC}"
    echo ""
fi

# Step 4: Wait for local Neo4j (only if not AuraDB)
if [ "$USE_AURADB" -eq 0 ]; then
    echo -e "${BLUE}Step 4: Waiting for Neo4j${NC}"
    sleep 10
    until curl -s http://localhost:7474 > /dev/null 2>&1; do
        sleep 2
    done
    echo -e "${GREEN}✓ Neo4j ready${NC}"
    echo ""

    echo -e "${BLUE}Step 5: Initializing Neo4j constraints${NC}"
    docker compose exec -T neo4j cypher-shell -u neo4j -p neo4jpassword -f /var/lib/neo4j/import/init.cypher 2>/dev/null || echo "Constraints already exist"
    echo -e "${GREEN}✓ Neo4j initialized${NC}"
    echo ""
fi

# Step 6: Run Postgres migrations
echo -e "${BLUE}Step 6: Postgres migrations (command_center_results, review_queue_cases)${NC}"
if [ "$USE_SUPABASE" -eq 1 ]; then
    node scripts/db-migrate.js
else
    if [ -f scripts/004-command-center-results.sql ]; then
        docker compose exec -T postgres psql -U postgres -d postgres < scripts/004-command-center-results.sql || true
    fi
    if [ -f scripts/005-review-queue-cases.sql ]; then
        docker compose exec -T postgres psql -U postgres -d postgres < scripts/005-review-queue-cases.sql || true
    fi
    if [ -f scripts/006-review-queue-cases-name.sql ]; then
        docker compose exec -T postgres psql -U postgres -d postgres < scripts/006-review-queue-cases-name.sql || true
    fi
fi
echo -e "${GREEN}✓ Migrations applied${NC}"
echo ""

# Step 7: Verify (only local services)
echo -e "${BLUE}Step 7: Verifying setup${NC}"
if [ "$USE_SUPABASE" -eq 0 ]; then
    TABLE_COUNT=$(docker compose exec -T postgres psql -U postgres -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ' || echo "?")
    echo "  Postgres tables: $TABLE_COUNT"
fi
if [ "$USE_AURADB" -eq 0 ]; then
    CONSTRAINT_COUNT=$(docker compose exec -T neo4j cypher-shell -u neo4j -p neo4jpassword "SHOW CONSTRAINTS" --format plain 2>/dev/null | grep -c "node_" || echo "0")
    echo "  Neo4j constraints: $CONSTRAINT_COUNT"
fi
echo -e "${GREEN}✓ Setup complete${NC}"
echo ""

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Setup complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
if [ "$USE_SUPABASE" -eq 1 ]; then
    echo "Postgres: Supabase (see .env.local POSTGRES_URL)"
else
    echo "Postgres: postgresql://postgres:postgres@localhost:5434/postgres (Docker)"
fi
if [ "$USE_AURADB" -eq 1 ]; then
    echo "Neo4j: AuraDB (see .env.local NEO4J_URI)"
else
    echo "Neo4j: http://localhost:7474 (neo4j / neo4jpassword), Bolt: bolt://localhost:7687"
fi
echo ""
echo "Next steps:"
echo "  1. Start the app: pnpm dev"
echo "  2. Open the app: http://localhost:3001"
echo ""
