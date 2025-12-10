# Demo Examples - Guaranteed Outcomes

These examples are designed to trigger specific outcomes based on the Vendor Onboarding Policy.

## ✅ APPROVED Example (Low-Risk Auto-Approval)

**Scenario:** Small domestic vendor, low spend, established business

```json
{
  "event_type": "VENDOR_ONBOARDING",
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
```

**Expected Outcome:** `APPROVED` with high confidence (>90%)

---

## ⚠️ REVIEW Example (Medium-Risk)

**Scenario:** Medium spend, new business, missing some documentation

```json
{
  "event_type": "VENDOR_ONBOARDING",
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
```

**Expected Outcome:** `REVIEW` with medium confidence (60-80%)  
**Reason:** International vendor, short payment terms, missing insurance, new business

---

## 🚫 BLOCKED Example (High-Risk Auto-Block)

**Scenario:** High spend, verification failures, suspicious indicators

```json
{
  "event_type": "VENDOR_ONBOARDING",
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
```

**Expected Outcome:** `BLOCKED` with high confidence (>90%)  
**Reason:** High spend, verification failures, personal email domain, PO Box, adverse media

---

## Additional Examples

### APPROVED - Professional Services (with extra requirements)

```json
{
  "event_type": "VENDOR_ONBOARDING",
  "vendor_name": "Elite Legal Advisors LLP",
  "vendor_category": "Professional Services",
  "service_type": "Legal",
  "annual_spend": 35000,
  "payment_terms": "Net 30",
  "upfront_payment_required": false,
  "risk_level": "Low",
  "years_in_business": 8,
  "country": "United States",
  "business_structure": "LLP",
  "adverse_media": false,
  "documents": {
    "business_registration": true,
    "w9_completed": true,
    "insurance_coi": true,
    "general_liability": 1000000,
    "professional_liability_eo": 2000000,
    "nda_signed": true,
    "msa_signed": true
  },
  "verification": {
    "email_domain_matches": true,
    "phone_verified": true,
    "physical_address": "789 Legal Plaza, Boston, MA 02108",
    "address_verified": true,
    "references_checked": true,
    "references_count": 2,
    "background_checks": "Completed"
  }
}
```

### BLOCKED - OFAC Sanctions

```json
{
  "event_type": "VENDOR_ONBOARDING",
  "vendor_name": "Sanctioned Entity Corp",
  "annual_spend": 15000,
  "payment_terms": "Net 30",
  "risk_level": "High",
  "country": "Iran",
  "ofac_match": true,
  "ofac_list": "SDN List",
  "sanctions_screening": "MATCH FOUND",
  "documents": {
    "business_registration": true
  }
}
```

**Expected Outcome:** `BLOCKED` immediately due to OFAC match

---

## How to Use in Demo

### Via Command Center UI:
1. Go to Command Center page
2. Click "Add Manual Entry"
3. Select event type
4. Paste the JSON example
5. Click Submit
6. Click "Process All" to see the agent make decisions

### Via API:
```bash
# APPROVED Example
curl -X POST http://localhost:3001/api/command-center/submit \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "VENDOR_ONBOARDING",
    "event_data": { /* paste example here */ }
  }'

# Then process
curl -X POST http://localhost:3001/api/command-center/process-all
```

### Expected Flow:
1. **APPROVED** → Appears in Audit Explorer with green badge
2. **REVIEW** → Appears in Review Queue AND Audit Explorer with yellow badge
3. **BLOCKED** → Appears in Audit Explorer with red badge (no Review Queue)

---

## Testing Checklist

- [ ] APPROVED example processes with >90% confidence
- [ ] REVIEW example routes to Review Queue with 60-80% confidence  
- [ ] BLOCKED example immediately blocks with >90% confidence
- [ ] All decisions visible in Audit Explorer
- [ ] Only REVIEW decisions appear in Review Queue
- [ ] Dashboard graphs update with real data
- [ ] Command Center stats reflect processed items

