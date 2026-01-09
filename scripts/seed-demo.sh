#!/bin/bash
# Quick Demo Seed Script - Makes the app demo-ready in under 1 minute
# Usage: bash scripts/seed-demo.sh

set -e

API_URL="${API_URL:-http://localhost:3000}"

echo "🚀 NUL Compliance Control Center - Quick Demo Seed"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if API is running
echo "📡 Checking API availability..."
if ! curl -s "$API_URL/api/audit" > /dev/null 2>&1; then
    echo -e "${RED}❌ API not responding at $API_URL${NC}"
    echo "   Please start the dev server: npm run dev"
    exit 1
fi
echo -e "${GREEN}✓ API is running${NC}"
echo ""

# ===========================================
# STEP 1: Add Demo Decisions (Already Processed)
# ===========================================
echo "📊 Adding pre-processed demo decisions..."

# These go directly to /api/command-center/submit with pre-filled outcomes
# Simulating decisions that have already been processed by the AI

# Decision 1: APPROVED - Low Risk Vendor
curl -s -X POST "$API_URL/api/command-center/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "vendor_name": "Acme Office Supplies",
    "vendor_category": "Office Equipment",
    "annual_spend": 8500,
    "risk_level": "Low",
    "country": "United States",
    "years_in_business": 12,
    "documents": {
      "w9": true,
      "insurance_certificate": true,
      "business_registration": true
    },
    "verification": {
      "email_verified": true,
      "phone_verified": true,
      "address_verified": true
    }
  }' > /dev/null 2>&1
echo "  ✅ Added: Acme Office Supplies (Low Risk)"

# Decision 2: APPROVED - Professional Services
curl -s -X POST "$API_URL/api/command-center/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "vendor_name": "Elite Legal Partners LLP",
    "vendor_category": "Professional Services",
    "annual_spend": 35000,
    "risk_level": "Low",
    "country": "United States",
    "years_in_business": 25,
    "documents": {
      "w9": true,
      "professional_liability": true,
      "nda_signed": true,
      "msa_signed": true
    },
    "verification": {
      "bar_association_verified": true,
      "references_checked": true
    }
  }' > /dev/null 2>&1
echo "  ✅ Added: Elite Legal Partners (Professional Services)"

# Decision 3: REVIEW - International Vendor
curl -s -X POST "$API_URL/api/command-center/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "vendor_name": "TechStart Solutions Inc",
    "vendor_category": "Software",
    "annual_spend": 45000,
    "risk_level": "Medium",
    "country": "Canada",
    "years_in_business": 1.5,
    "documents": {
      "w8_ben": true,
      "insurance_certificate": false,
      "business_registration": true
    },
    "verification": {
      "email_verified": true,
      "phone_verified": true,
      "address_verified": false
    },
    "payment_terms": "Net 15"
  }' > /dev/null 2>&1
echo "  ⚠️  Added: TechStart Solutions (Medium Risk - International)"

# Decision 4: REVIEW - New Business
curl -s -X POST "$API_URL/api/command-center/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "vendor_name": "Innovate AI Labs",
    "vendor_category": "Technology",
    "annual_spend": 75000,
    "risk_level": "Medium",
    "country": "United States",
    "years_in_business": 0.8,
    "documents": {
      "w9": true,
      "insurance_certificate": true,
      "soc2_report": false
    },
    "verification": {
      "email_verified": true,
      "startup_registry": true
    },
    "notes": "Recently funded Series A startup"
  }' > /dev/null 2>&1
echo "  ⚠️  Added: Innovate AI Labs (New Business)"

# Decision 5: BLOCKED - High Risk
curl -s -X POST "$API_URL/api/command-center/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "vendor_name": "Global Trading Partners Ltd",
    "vendor_category": "Import/Export",
    "annual_spend": 250000,
    "risk_level": "High",
    "country": "British Virgin Islands",
    "years_in_business": 0.5,
    "documents": {
      "w8_ben": false,
      "insurance_certificate": false,
      "business_registration": false
    },
    "verification": {
      "email_verified": false,
      "phone_verified": false,
      "address_verified": false,
      "beneficial_ownership": "Unknown"
    },
    "adverse_media": true,
    "adverse_media_details": "Multiple fraud investigations reported"
  }' > /dev/null 2>&1
echo "  🚫 Added: Global Trading Partners (High Risk - Blocked)"

# Decision 6: BLOCKED - Sanctions Match
curl -s -X POST "$API_URL/api/command-center/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "vendor_name": "Restricted Entity Corp",
    "vendor_category": "Manufacturing",
    "annual_spend": 120000,
    "risk_level": "Critical",
    "country": "Iran",
    "years_in_business": 10,
    "sanctions_screening": "MATCH FOUND",
    "ofac_match": true,
    "ofac_list": "SDN List"
  }' > /dev/null 2>&1
echo "  🚫 Added: Restricted Entity Corp (Sanctions Match)"

# Decision 7: APPROVED - Existing Vendor Renewal
curl -s -X POST "$API_URL/api/command-center/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "vendor_name": "CloudFirst Infrastructure",
    "vendor_category": "Cloud Services",
    "annual_spend": 95000,
    "risk_level": "Low",
    "country": "United States",
    "years_in_business": 8,
    "existing_vendor": true,
    "previous_performance": "Excellent",
    "documents": {
      "w9": true,
      "soc2_report": true,
      "insurance_certificate": true,
      "msa_signed": true
    },
    "verification": {
      "all_checks_passed": true
    }
  }' > /dev/null 2>&1
echo "  ✅ Added: CloudFirst Infrastructure (Renewal)"

echo ""
echo -e "${GREEN}✅ 7 demo decisions added to Command Center${NC}"
echo ""

# ===========================================
# STEP 2: Process All Pending Decisions
# ===========================================
echo "🤖 Processing all decisions with AI agent..."
echo "   (This may take 10-30 seconds...)"

# Call process-all endpoint
PROCESS_RESULT=$(curl -s -X POST "$API_URL/api/command-center/process-all" \
  -H "Content-Type: application/json" 2>&1)

if echo "$PROCESS_RESULT" | grep -q "error"; then
    echo -e "${YELLOW}⚠️  Some decisions may require OpenAI API key${NC}"
    echo "   Check that OPENAI_API_KEY is set in .env.local"
else
    echo -e "${GREEN}✅ All decisions processed!${NC}"
fi

echo ""

# ===========================================
# STEP 3: Create Policy Packs with Different Statuses
# ===========================================
echo "📋 Creating policy packs for demo..."

# Policy 1: Active (already in use)
curl -s -X POST "$API_URL/api/policy/packs" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Vendor Onboarding Policy v2.1",
    "description": "Standard vendor due diligence and onboarding requirements"
  }' > /dev/null 2>&1

# Update to active status
PACK1_ID=$(curl -s "$API_URL/api/policy/packs" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$PACK1_ID" ]; then
  curl -s -X PATCH "$API_URL/api/policy/packs/$PACK1_ID" \
    -H "Content-Type: application/json" \
    -d '{"status": "active"}' > /dev/null 2>&1
fi
echo "  ✅ Created: Vendor Onboarding Policy (ACTIVE)"

# Policy 2: Pending Approval (for Executive to approve)
curl -s -X POST "$API_URL/api/policy/packs" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Enhanced AML Screening Policy",
    "description": "New anti-money laundering checks for high-value transactions over $100k"
  }' > /dev/null 2>&1

PACK2_ID=$(curl -s "$API_URL/api/policy/packs" | grep -o '"id":"[^"]*"' | tail -1 | cut -d'"' -f4)
if [ -n "$PACK2_ID" ]; then
  curl -s -X PATCH "$API_URL/api/policy/packs/$PACK2_ID" \
    -H "Content-Type: application/json" \
    -d '{"status": "review"}' > /dev/null 2>&1
fi
echo "  ⏳ Created: Enhanced AML Screening Policy (PENDING APPROVAL)"

# Policy 3: Another pending approval
curl -s -X POST "$API_URL/api/policy/packs" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "International Vendor Compliance v1.0",
    "description": "New controls for vendors operating outside the United States"
  }' > /dev/null 2>&1

PACK3_ID=$(curl -s "$API_URL/api/policy/packs" | grep -o '"id":"[^"]*"' | tail -1 | cut -d'"' -f4)
if [ -n "$PACK3_ID" ]; then
  curl -s -X PATCH "$API_URL/api/policy/packs/$PACK3_ID" \
    -H "Content-Type: application/json" \
    -d '{"status": "review"}' > /dev/null 2>&1
fi
echo "  ⏳ Created: International Vendor Compliance (PENDING APPROVAL)"

echo ""
echo -e "${GREEN}✅ 3 policy packs created (1 active, 2 pending approval)${NC}"
echo ""

# ===========================================
# STEP 4: Summary
# ===========================================
echo "🎉 Demo Setup Complete!"
echo "========================"
echo ""
echo "Your app is now demo-ready with:"
echo "  • 7 vendor onboarding decisions"
echo "  • Mix of APPROVED, REVIEW, and BLOCKED outcomes"
echo "  • 3 policy packs (1 active, 2 pending executive approval)"
echo "  • Populated dashboards and charts"
echo "  • Items in Review Queue"
echo "  • Full audit trail"
echo ""
echo "🔗 Quick Links:"
echo "  Dashboard:       $API_URL/dashboard"
echo "  Executive View:  $API_URL/executive"
echo "  Command Center:  $API_URL/command-center"
echo "  Review Queue:    $API_URL/review-queue"
echo "  Audit Explorer:  $API_URL/audit-explorer"
echo ""
echo "🎭 ROLE-BASED DEMO WORKFLOW:"
echo ""
echo "  🟣 Sarah Chen (Compliance Officer)"
echo "     → Creates policies, processes review items"
echo "     → Go to: Dashboard → Command Center → Review Queue"
echo ""
echo "  🔵 David Ross (CEO)"
echo "     → Approves/rejects policies before they go live"
echo "     → Go to: Executive View → See 'Pending Policy Approvals'"
echo "     → Click 'Approve' to activate a policy"
echo ""
echo "  🟠 Michael Torres (Auditor)"
echo "     → Reviews complete audit trail (read-only)"
echo "     → Go to: Audit Explorer"
echo ""
echo "💡 Click user profile (bottom-left) to switch roles instantly!"
echo ""

