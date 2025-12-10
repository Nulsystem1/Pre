#!/bin/bash

# Demo Examples Script - Add guaranteed outcomes for demo

API_BASE="http://localhost:3001"

echo "🎯 Adding Demo Examples for Guaranteed Outcomes"
echo "================================================"
echo ""

# Example 1: APPROVED (Low-Risk)
echo "1️⃣ Adding APPROVED example (Low-Risk Vendor)..."
curl -s -X POST "$API_BASE/api/command-center/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "VENDOR_ONBOARDING",
    "priority": "medium",
    "event_data": {
      "vendor_name": "ABC Office Supplies LLC",
      "annual_spend": 8500,
      "payment_terms": "Net 30",
      "upfront_payment_required": false,
      "risk_level": "Low",
      "years_in_business": 5,
      "country": "United States",
      "business_structure": "LLC",
      "adverse_media": false,
      "documents": {
        "business_registration": true,
        "w9_completed": true,
        "insurance_coi": true,
        "general_liability": 1000000,
        "workers_comp": true
      },
      "verification": {
        "email_domain_matches": true,
        "phone_verified": true,
        "physical_address": "123 Main St, Suite 100, New York, NY 10001",
        "address_verified": true
      }
    }
  }' | jq -r '.success // "Failed"'

echo ""
sleep 1

# Example 2: REVIEW (Medium-Risk)
echo "2️⃣ Adding REVIEW example (Medium-Risk Vendor)..."
curl -s -X POST "$API_BASE/api/command-center/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "VENDOR_ONBOARDING",
    "priority": "high",
    "event_data": {
      "vendor_name": "TechStart Solutions Inc",
      "annual_spend": 45000,
      "payment_terms": "Net 15",
      "upfront_payment_required": false,
      "risk_level": "Medium",
      "years_in_business": 1.5,
      "country": "Canada",
      "business_structure": "Corporation",
      "adverse_media": false,
      "documents": {
        "business_registration": true,
        "w9_completed": false,
        "w8_completed": true,
        "insurance_coi": false,
        "general_liability": null,
        "workers_comp": false
      },
      "verification": {
        "email_domain_matches": true,
        "phone_verified": true,
        "physical_address": "456 Tech Ave, Toronto, ON M5H 2N2",
        "address_verified": true,
        "discrepancy_notes": "Unable to verify insurance in standard databases"
      }
    }
  }' | jq -r '.success // "Failed"'

echo ""
sleep 1

# Example 3: BLOCKED (High-Risk)
echo "3️⃣ Adding BLOCKED example (High-Risk Vendor)..."
curl -s -X POST "$API_BASE/api/command-center/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "VENDOR_ONBOARDING",
    "priority": "high",
    "event_data": {
      "vendor_name": "Global Trading Partners",
      "annual_spend": 250000,
      "payment_terms": "Net 7",
      "upfront_payment_required": true,
      "upfront_amount": 50000,
      "risk_level": "High",
      "years_in_business": 0.5,
      "country": "Unknown",
      "business_structure": "Unknown",
      "adverse_media": true,
      "adverse_media_details": "Mentions in financial fraud investigations",
      "documents": {
        "business_registration": false,
        "w9_completed": false,
        "insurance_coi": false
      },
      "verification": {
        "email_domain_matches": false,
        "email_domain": "gmail.com",
        "phone_verified": false,
        "phone_status": "Disconnected",
        "physical_address": "PO Box 123",
        "address_verified": false,
        "business_existence_verified": false
      }
    }
  }' | jq -r '.success // "Failed"'

echo ""
echo "✅ All examples added to queue!"
echo ""
echo "Next steps:"
echo "1. Go to Command Center: http://localhost:3001/command-center"
echo "2. Click 'Process All' button"
echo "3. View results in:"
echo "   - Dashboard: http://localhost:3001/dashboard"
echo "   - Audit Explorer: http://localhost:3001/audit-explorer"
echo "   - Review Queue: http://localhost:3001/review-queue"
echo ""
echo "Expected outcomes:"
echo "✅ ABC Office Supplies → APPROVED (high confidence)"
echo "⚠️  TechStart Solutions → REVIEW (medium confidence, goes to Review Queue)"
echo "🚫 Global Trading Partners → BLOCKED (high confidence)"

