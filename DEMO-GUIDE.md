# 🎯 Demo Guide - Guaranteed Outcomes

This guide shows you how to demonstrate the NUL Compliance Control Center with examples that will produce specific, predictable outcomes.

## Quick Start

```bash
# Add demo examples
make demo

# Or manually
bash scripts/add-demo-examples.sh
```

Then:
1. Open **Command Center**: http://localhost:3001/command-center
2. Click **"Process All"** button
3. Watch the AI agent make decisions in real-time
4. View results across the platform

---

## 📊 What Gets Created

### ✅ APPROVED: "ABC Office Supplies LLC"
- **Annual Spend:** $8,500 (under $10k threshold)
- **Risk Level:** Low
- **Years in Business:** 5 years
- **Country:** United States
- **Documentation:** Complete (W-9, Insurance, Business Registration)
- **Verification:** All checks passed

**Expected Result:**
- ✅ **Outcome:** APPROVED
- 📊 **Confidence:** >90%
- 📍 **Location:** Audit Explorer only (not in Review Queue)
- 💡 **Reasoning:** Meets all auto-approval criteria

---

### ⚠️ REVIEW: "TechStart Solutions Inc"
- **Annual Spend:** $45,000 (medium threshold)
- **Risk Level:** Medium
- **Years in Business:** 1.5 years (new business)
- **Country:** Canada (international)
- **Documentation:** Missing insurance certificates
- **Payment Terms:** Net 15 (shorter than standard)

**Expected Result:**
- ⚠️ **Outcome:** REVIEW
- 📊 **Confidence:** 60-80%
- 📍 **Location:** Review Queue AND Audit Explorer
- 💡 **Reasoning:** International vendor, missing documentation, short payment terms
- 👤 **Action Required:** Human review needed

---

### 🚫 BLOCKED: "Global Trading Partners"
- **Annual Spend:** $250,000 (high threshold)
- **Risk Level:** High
- **Years in Business:** 0.5 years
- **Adverse Media:** Yes (fraud investigations)
- **Documentation:** None provided
- **Verification:** Multiple failures (gmail email, disconnected phone, PO Box)

**Expected Result:**
- 🚫 **Outcome:** BLOCKED
- 📊 **Confidence:** >90%
- 📍 **Location:** Audit Explorer only (not in Review Queue)
- 💡 **Reasoning:** High spend, verification failures, adverse media, suspicious indicators

---

## 📈 Dashboard Updates

After processing, the **Dashboard** will show **REAL DATA** (no more mocked charts):

### Key Metrics (Top Cards)
- **Total Decisions:** Real count from database
- **Approved:** Actual approved count
- **Blocked:** Actual blocked count  
- **Avg Confidence:** Calculated from all decisions

### Decision Trends (7 Days)
- Shows actual decisions grouped by day
- Color-coded: Green (approved), Yellow (review), Red (blocked)
- Real data for the last 7 days

### Outcome Distribution (Pie Chart)
- Real percentages of approved/blocked/review
- Only shows categories with >0 decisions

### Confidence Distribution (Bar Chart)
- Real distribution across confidence ranges:
  - 90-100% (high confidence)
  - 80-90% (good confidence)
  - 70-80% (medium confidence)
  - <70% (low confidence - goes to review)

### Risk Score Over Time (Line Chart)
- Average risk scores in 4-hour blocks over last 24 hours
- Calculated from actual decision risk scores

---

## 🎬 Demo Flow

### Step 1: Clean Slate (Optional)
```bash
make reset   # Full reset (requires "yes" confirmation)
# or
make db-reset   # Just reset database
```

### Step 2: Add Demo Examples
```bash
make demo
```

Expected output:
```
🎯 Adding Demo Examples for Guaranteed Outcomes
1️⃣ Adding APPROVED example...
2️⃣ Adding REVIEW example...
3️⃣ Adding BLOCKED example...
✅ All examples added to queue!
```

### Step 3: Process Decisions
1. Open Command Center: http://localhost:3001/command-center
2. You'll see 3 pending decisions
3. Click **"Process All"** button
4. Watch as each decision is processed by the AI agent
   - Status changes from "pending" → "processing" → "completed"
   - Processing count updates in real-time
   - Loader icon spins only while processing

### Step 4: View Results

**Dashboard** (http://localhost:3001/dashboard)
- All graphs now show real data
- Key metrics updated
- Quick action buttons with real counts

**Audit Explorer** (http://localhost:3001/audit-explorer)
- All 3 decisions visible
- Click any row to see detailed breakdown:
  - Event data
  - Agent reasoning
  - Matched policies
  - Search queries used
  - Confidence and risk scores

**Review Queue** (http://localhost:3001/review-queue)
- Only "TechStart Solutions" appears here (REVIEW outcome)
- Click "Review" button to see details and take action:
  - ✅ Approve
  - 🚫 Override (Block)
  - ⚠️ Escalate

---

## 🔍 What to Point Out During Demo

### 1. **Policy Ingestion** (Policy Studio)
- Show the sample vendor policy
- Click "Ingest Policy" to build knowledge graph
- Visualize the graph nodes and relationships

### 2. **Real-Time Decision Making** (Command Center)
- Manual entry or batch upload
- AI agent processes events autonomously
- Multiple search queries if needed (iterative refinement)
- Confidence-based routing

### 3. **Decision Transparency** (Audit Explorer)
- Every decision logged immutably
- Full reasoning and matched policies shown
- Agent search queries visible (explainability)

### 4. **Human-in-the-Loop** (Review Queue)
- Low confidence decisions routed to humans
- Reviewer can approve, override, or escalate
- Notes and audit trail captured

### 5. **Real-Time Analytics** (Dashboard)
- Live data, refreshes every 5 seconds
- Trend analysis over time
- Confidence and risk distribution

---

## 💡 Additional Demo Examples

### Professional Services (Will be APPROVED)
High compliance requirements but all met:

```json
{
  "vendor_name": "Elite Legal Advisors LLP",
  "vendor_category": "Professional Services",
  "annual_spend": 35000,
  "risk_level": "Low",
  "years_in_business": 8,
  "documents": {
    "professional_liability_eo": 2000000,
    "nda_signed": true,
    "msa_signed": true
  },
  "verification": {
    "references_checked": true,
    "background_checks": "Completed"
  }
}
```

### OFAC Sanctions (Will be BLOCKED)
Immediate block due to sanctions:

```json
{
  "vendor_name": "Sanctioned Entity Corp",
  "annual_spend": 15000,
  "country": "Iran",
  "ofac_match": true,
  "ofac_list": "SDN List",
  "sanctions_screening": "MATCH FOUND"
}
```

---

## 🎯 Demo Talking Points

1. **Policy as Code**
   - "We take written policies and turn them into executable controls"
   - "No more manual interpretation - AI reads and applies the rules"

2. **Dual RAG Architecture**
   - "Linear RAG for semantic search across policy text"
   - "Graph RAG for structured reasoning over policy relationships"

3. **Iterative Refinement**
   - "Agent tries multiple search queries if first attempt has low confidence"
   - "Up to 3 attempts before routing to human review"

4. **Confidence-Based Routing**
   - "High confidence (>80%) = autonomous decision"
   - "Low confidence (<80%) = human review required"

5. **Full Auditability**
   - "Every decision is immutable and append-only"
   - "See exactly what the AI was thinking and what policies it matched"

6. **Production-Ready Architecture**
   - PostgreSQL with pgvector for embeddings
   - Neo4j for knowledge graph
   - OpenAI GPT-4 for decision-making
   - Real-time processing with queue-based architecture

---

## 🐛 Troubleshooting

**Demo examples not appearing?**
```bash
# Check pending decisions
make db-status

# Check Command Center API
curl http://localhost:3001/api/command-center?status=pending
```

**Processing fails?**
- Check that `OPENAI_API_KEY` is set in `.env.local`
- Verify the dev server is running: `make dev`
- Check logs in the terminal running dev server

**Dashboard graphs empty?**
- Dashboard uses real data from `/api/audit`
- Need to process at least one decision first
- Run `make demo` then process in Command Center

---

## 📝 Next Steps

After the demo:
1. Ingest your own policies (Policy Studio)
2. Add real events from your systems
3. Configure execution targets (webhooks, tasks)
4. Set up continuous monitoring
5. Train your team on the Review Queue

---

**For more details, see:**
- `docs/demo-examples.md` - Full JSON examples
- `docs/sample-vendor-policy.md` - Sample policy
- `QUICKSTART.md` - Full setup guide
