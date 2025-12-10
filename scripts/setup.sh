#!/bin/bash

# Setup script for NUL Compliance Control Center
# This script sets up the infrastructure and initializes the databases

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}NUL Compliance Control Center - Setup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠ .env.local not found. Creating from template...${NC}"
    cp .env.local.example .env.local
    echo -e "${YELLOW}⚠ Please edit .env.local and add your OPENAI_API_KEY${NC}"
    echo ""
    read -p "Press enter to continue after updating .env.local..."
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

echo -e "${BLUE}Step 1: Installing dependencies${NC}"
pnpm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

echo -e "${BLUE}Step 2: Starting infrastructure${NC}"
docker compose up -d
echo -e "${GREEN}✓ Docker containers starting${NC}"
echo ""

echo -e "${BLUE}Step 3: Waiting for services to be ready${NC}"
echo "  Waiting for Postgres..."
until docker compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
    sleep 1
done
echo -e "${GREEN}✓ Postgres ready${NC}"

echo "  Waiting for Neo4j..."
sleep 10
until curl -s http://localhost:7474 > /dev/null 2>&1; do
    sleep 2
done
echo -e "${GREEN}✓ Neo4j ready${NC}"
echo ""

echo -e "${BLUE}Step 4: Initializing Neo4j constraints${NC}"
# The constraints are auto-created on startup, but let's verify
docker compose exec -T neo4j cypher-shell -u neo4j -p neo4jpassword -f /var/lib/neo4j/import/init.cypher 2>/dev/null || echo "Constraints already exist"
echo -e "${GREEN}✓ Neo4j initialized${NC}"
echo ""

echo -e "${BLUE}Step 5: Verifying database setup${NC}"
# Check Postgres tables
TABLE_COUNT=$(docker compose exec -T postgres psql -U postgres -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
echo "  Postgres tables: $TABLE_COUNT"

# Check Neo4j constraints
CONSTRAINT_COUNT=$(docker compose exec -T neo4j cypher-shell -u neo4j -p neo4jpassword "SHOW CONSTRAINTS" --format plain 2>/dev/null | grep -c "node_" || echo "0")
echo "  Neo4j constraints: $CONSTRAINT_COUNT"
echo -e "${GREEN}✓ Databases verified${NC}"
echo ""

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Setup complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Infrastructure is running:"
echo "  - Postgres: postgresql://postgres:postgres@localhost:5432/postgres"
echo "  - PostgREST: http://localhost:3000"
echo "  - Neo4j Browser: http://localhost:7474 (neo4j / neo4jpassword)"
echo "  - Neo4j Bolt: bolt://localhost:7687"
echo ""
echo "Next steps:"
echo "  1. Start the app: pnpm dev"
echo "  2. Run the test flow: ./scripts/test-flow.sh"
echo "  3. Open the app: http://localhost:3001"
echo ""

