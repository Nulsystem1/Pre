#!/bin/bash

# Test Flow Script for NUL Compliance Control Center
# This script tests the full flow: Create Pack -> Ingest Policy -> Generate Controls -> Evaluate Event

set -e

BASE_URL="${BASE_URL:-http://localhost:3001}"
echo "Testing against: $BASE_URL"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Creating Policy Pack${NC}"
PACK_RESPONSE=$(curl -s -X POST "$BASE_URL/api/policy/packs" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test KYC Policy",
    "description": "Automated test policy pack"
  }')

PACK_ID=$(echo "$PACK_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo -e "${GREEN}✓ Created policy pack: $PACK_ID${NC}"
echo ""

sleep 2

echo -e "${BLUE}Step 2: Ingesting Policy Document${NC}"
INGEST_RESPONSE=$(curl -s -X POST "$BASE_URL/api/policy/ingest" \
  -H "Content-Type: application/json" \
  -d "{
    \"policyPackId\": \"$PACK_ID\",
    \"policyText\": \"Customer Due Diligence Requirements:\\n\\n1. Identity Verification\\nAll customers must provide government-issued photo ID before account opening. If ID cannot be verified automatically, block the onboarding process.\\n\\n2. Age Verification\\nNo accounts may be opened for individuals under 18 years of age. This is a hard block with no exceptions.\\n\\n3. High-Risk Jurisdictions\\nCustomers from sanctioned countries (North Korea, Iran, Syria) require enhanced due diligence. Block all transactions.\"
  }")

CHUNKS_CREATED=$(echo "$INGEST_RESPONSE" | grep -o '"chunks_created":[0-9]*' | cut -d':' -f2)
NODES_CREATED=$(echo "$INGEST_RESPONSE" | grep -o '"graph_nodes_created":[0-9]*' | cut -d':' -f2)
EDGES_CREATED=$(echo "$INGEST_RESPONSE" | grep -o '"graph_edges_created":[0-9]*' | cut -d':' -f2)

echo -e "${GREEN}✓ Policy ingested:${NC}"
echo "  - Chunks created: $CHUNKS_CREATED"
echo "  - Graph nodes: $NODES_CREATED"
echo "  - Graph edges: $EDGES_CREATED"
echo ""

sleep 2

echo -e "${BLUE}Step 3: Generating Controls from Graph${NC}"
GENERATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/controls/generate" \
  -H "Content-Type: application/json" \
  -d "{
    \"policyPackId\": \"$PACK_ID\"
  }")

CONTROLS_COUNT=$(echo "$GENERATE_RESPONSE" | grep -o '"controls_generated":[0-9]*' | cut -d':' -f2)
echo -e "${GREEN}✓ Generated $CONTROLS_COUNT controls${NC}"
echo ""

sleep 2

echo -e "${BLUE}Step 4: Evaluating Test Events${NC}"
echo ""

# Test 1: Customer with unverified ID (should BLOCK)
echo "Test 1: Customer with unverified ID"
EVAL1=$(curl -s -X POST "$BASE_URL/api/controls/evaluate" \
  -H "Content-Type: application/json" \
  -d "{
    \"eventData\": {
      \"customer\": {
        \"customer_id\": \"cus-001\",
        \"name\": \"Test Customer\",
        \"country\": \"US\",
        \"id_verified\": false,
        \"address_verified\": true,
        \"age\": 25,
        \"risk_score\": 30,
        \"is_pep\": false,
        \"account_type\": \"personal\"
      }
    },
    \"policyPackId\": \"$PACK_ID\"
  }")

DECISION1=$(echo "$EVAL1" | grep -o '"final_decision":"[^"]*' | cut -d'"' -f4)
RISK1=$(echo "$EVAL1" | grep -o '"risk_score":[0-9]*' | cut -d':' -f2)
echo -e "  Decision: ${GREEN}$DECISION1${NC} (Risk: $RISK1)"
echo ""

# Test 2: Underage customer (should BLOCK)
echo "Test 2: Underage customer"
EVAL2=$(curl -s -X POST "$BASE_URL/api/controls/evaluate" \
  -H "Content-Type: application/json" \
  -d "{
    \"eventData\": {
      \"customer\": {
        \"customer_id\": \"cus-002\",
        \"name\": \"Minor Customer\",
        \"country\": \"US\",
        \"id_verified\": true,
        \"address_verified\": true,
        \"age\": 16,
        \"risk_score\": 10,
        \"is_pep\": false,
        \"account_type\": \"personal\"
      }
    },
    \"policyPackId\": \"$PACK_ID\"
  }")

DECISION2=$(echo "$EVAL2" | grep -o '"final_decision":"[^"]*' | cut -d'"' -f4)
RISK2=$(echo "$EVAL2" | grep -o '"risk_score":[0-9]*' | cut -d':' -f2)
echo -e "  Decision: ${GREEN}$DECISION2${NC} (Risk: $RISK2)"
echo ""

# Test 3: Customer from sanctioned country (should BLOCK)
echo "Test 3: Customer from sanctioned country"
EVAL3=$(curl -s -X POST "$BASE_URL/api/controls/evaluate" \
  -H "Content-Type: application/json" \
  -d "{
    \"eventData\": {
      \"customer\": {
        \"customer_id\": \"cus-003\",
        \"name\": \"Sanctioned Customer\",
        \"country\": \"IR\",
        \"id_verified\": true,
        \"address_verified\": true,
        \"age\": 30,
        \"risk_score\": 20,
        \"is_pep\": false,
        \"account_type\": \"personal\"
      }
    },
    \"policyPackId\": \"$PACK_ID\"
  }")

DECISION3=$(echo "$EVAL3" | grep -o '"final_decision":"[^"]*' | cut -d'"' -f4)
RISK3=$(echo "$EVAL3" | grep -o '"risk_score":[0-9]*' | cut -d':' -f2)
echo -e "  Decision: ${GREEN}$DECISION3${NC} (Risk: $RISK3)"
echo ""

# Test 4: Clean customer (should APPROVE)
echo "Test 4: Clean customer (all checks pass)"
EVAL4=$(curl -s -X POST "$BASE_URL/api/controls/evaluate" \
  -H "Content-Type: application/json" \
  -d "{
    \"eventData\": {
      \"customer\": {
        \"customer_id\": \"cus-004\",
        \"name\": \"Good Customer\",
        \"country\": \"US\",
        \"id_verified\": true,
        \"address_verified\": true,
        \"age\": 30,
        \"risk_score\": 20,
        \"is_pep\": false,
        \"account_type\": \"personal\"
      }
    },
    \"policyPackId\": \"$PACK_ID\"
  }")

DECISION4=$(echo "$EVAL4" | grep -o '"final_decision":"[^"]*' | cut -d'"' -f4)
RISK4=$(echo "$EVAL4" | grep -o '"risk_score":[0-9]*' | cut -d':' -f2)
echo -e "  Decision: ${GREEN}$DECISION4${NC} (Risk: $RISK4)"
echo ""

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Full flow test completed successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Policy Pack ID: $PACK_ID"
echo ""
echo "Next steps:"
echo "  - View graph in Neo4j: http://localhost:7474"
echo "  - Query: MATCH (n:GraphNode {policy_pack_id: \"$PACK_ID\"})-[r]->(m) RETURN n, r, m"
echo ""
echo "  - View data in Postgres:"
echo "    docker compose exec postgres psql -U postgres -c \"SELECT * FROM controls WHERE policy_pack_id = '$PACK_ID';\""

