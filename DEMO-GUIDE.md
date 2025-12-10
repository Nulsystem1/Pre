# NUL Compliance Control Center - Demo Guide

This guide walks you through a complete end-to-end demo of the NUL Compliance Control Center platform, showcasing the Vendor Onboarding automation use case.

## Prerequisites

1. **Environment Setup**: Ensure all services are running
   ```bash
   # Start infrastructure
   docker-compose up -d
   
   # Install dependencies
   pnpm install
   
   # Start Next.js app
   pnpm dev
   ```

2. **Database Initialization**:
   ```bash
   # Connect to Postgres and run schema
   docker exec -i nul-compliance-control-center-postgres-1 psql -U postgres < scripts/001-create-tables.sql
   
   # Seed execution targets
   docker exec -i nul-compliance-control-center-postgres-1 psql -U postgres < scripts/002-seed-execution-targets.sql
   ```

3. **Environment Variables**: Ensure `.env.local` has:
   - `POSTGRES_URL`
   - `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`
   - `OPENAI_API_KEY`

## Demo Story: Vendor Onboarding Automation

**Scenario**: A company wants to automate vendor onboarding decisions using AI-powered policy controls. NUL ingests the policy document, extracts rules, maps them to execution targets, and routes decisions based on confidence scores.

---

## Phase 1: Document Ingestion (5 minutes)

### Step 1: Navigate to Dashboard
1. Open browser to `http://localhost:3000/dashboard`
2. Observe clean dashboard with 0 documents, 0 rules

### Step 2: Ingest Policy Document
1. Click "Ingest New Document" button (or use Quick Actions)
2. Fill in document details:
   - **Name**: Vendor Onboarding Policy
   - **Version**: 1.0
   - **Domain**: Finance & Procurement
   - **Description**: Automates vendor risk assessment and approval workflows
3. Click "Next"

### Step 3: Paste Policy Text
1. Copy the sample policy from `docs/sample-vendor-policy.md`
2. Paste into the text area
3. Click "Ingest Document"
4. Watch AI extraction process:
   - Chunking policy text
   - Building knowledge graph
   - Generating controls

### Step 4: Review Results
Expected output:
- **Policy Chunks**: ~15-20 chunks
- **Graph Nodes**: ~25-35 nodes (thresholds, conditions, actions)
- **Controls Generated**: ~8-12 controls

Click "Done" to close the wizard.

---

## Phase 2: Review Extracted Rules (3 minutes)

### Step 5: Navigate to Documents
1. Go to "Documents" from sidebar
2. See the newly ingested "Vendor Onboarding Policy"
3. Click on the document card

### Step 6: Review Decision Rules
1. Click "Decision Rules" tab
2. Review AI-generated controls, e.g.:
   - **Low-Risk Auto-Approval**: `expected_spend < 10000 AND risk_level == "Low"` → APPROVE
   - **Medium-Risk Review**: `expected_spend >= 10000 AND expected_spend < 100000` → REVIEW
   - **High-Risk Block**: `expected_spend > 100000 OR on_sanctions_list == true` → BLOCK

Each control shows:
- Human-readable condition
- Action (APPROVE/REVIEW/BLOCK)
- AI reasoning linked to policy text

---

## Phase 3: Configure Execution Mappings (3 minutes)

### Step 7: Map Controls to Execution Targets
1. Click "Execution Mappings" tab
2. For each control, select an execution target:
   - **Low-Risk Auto-Approval** → "Send to ERP Webhook"
   - **Medium-Risk Review** → "Create Jira Ticket"
   - **High-Risk Block** → "Send Slack Alert"

3. Set confidence thresholds (default is 0.8 = 80%)
   - Keep at 0.8 for auto-execution
   - Lower to 0.6 for more aggressive automation

4. Click "Preview" on a control to see mock webhook payload

**Expected Payload Preview**:
```json
{
  "execution_target": "Send to ERP Webhook",
  "execution_type": "Webhook",
  "control_id": "VENDOR-001",
  "control_name": "Low-Risk Auto-Approval",
  "confidence": 0.95,
  "event_data": {
    "vendor_name": "Acme Supplies Inc.",
    "expected_spend": 8500,
    ...
  },
  "timestamp": "2025-01-10T12:00:00Z"
}
```

---

## Phase 4: Simulate Events (5 minutes)

### Step 8: Simulate Low-Confidence Event (Human Review)
1. Go to "Event Simulator" from sidebar
2. Select policy pack: "Vendor Onboarding Policy v1.0"
3. Enter vendor details:
   - **Vendor Name**: Borderline Supplies
   - **Expected Spend**: $9,800 (close to $10k threshold)
   - **Risk Level**: Medium
   - **Years in Business**: 1
   - **Country**: USA

4. Click "Evaluate Event"

**Expected Result**:
- **Decision**: REVIEW
- **Confidence**: ~70% (borderline)
- **Routing**: Human Review
- **Status**: Yellow banner "Routed to Human Review"

### Step 9: Simulate High-Confidence Event (Auto-Execute)
1. Click "Reset"
2. Enter new vendor:
   - **Vendor Name**: Acme Supplies Inc.
   - **Expected Spend**: $7,500 (well below threshold)
   - **Risk Level**: Low
   - **Years in Business**: 5
   - **Country**: USA

3. Click "Evaluate Event"

**Expected Result**:
- **Decision**: APPROVED
- **Confidence**: ~95% (clear match)
- **Routing**: Auto-Execute
- **Webhook Payload Displayed**: Green box with JSON payload

---

## Phase 5: Review Queue (3 minutes)

### Step 10: Review Pending Item
1. Go to "Review Queue" from sidebar
2. See the borderline event (from Step 8) in pending status
3. Click "Review" button

### Step 11: Approve or Override
1. Review details:
   - Entity: Borderline Supplies
   - Confidence: 70%
   - Recommended Action: REVIEW
   - AI Reasoning: "Spend amount is close to threshold..."

2. Add reviewer notes: "Verified vendor credentials, approved"
3. Click "Approve"

**Result**: Item moves to "approved" status and disappears from queue

---

## Phase 6: Audit Trail (2 minutes)

### Step 12: View Complete Audit Log
1. Go to "Audit Log" from sidebar
2. See timeline of events:
   - Document Ingested: Vendor Onboarding Policy
   - Event Simulated: Borderline Supplies (70% confidence)
   - Event Simulated: Acme Supplies (95% confidence)
   - Review Completed: Approved Borderline Supplies

3. Expand event details to see metadata
4. Filter by event type (e.g., "Event Simulated")

---

## Phase 7: Dashboard Overview (1 minute)

### Step 13: Return to Dashboard
1. Go to "Dashboard" from sidebar
2. Observe updated metrics:
   - **Policy Documents**: 1
   - **Active Rules**: 8-12 (generated controls)
   - **Auto-Execute Rate**: ~50% (1 of 2 events)
   - **Pending Reviews**: 0 (after approval)

3. Use Quick Actions:
   - "Ingest Document" → Opens wizard
   - "Simulate Event" → Navigate to simulator
   - "Review Queue" → Check pending items
   - "Audit Log" → View timeline

---

## Demo Talking Points

### Key Features Demonstrated

1. **AI-Powered Policy Extraction**
   - Converts unstructured policy text into structured rules
   - Builds knowledge graph of entities and relationships
   - Generates executable JSON Logic controls

2. **Dual RAG Architecture**
   - **Linear RAG**: Policy chunks with embeddings for semantic search
   - **Graph RAG**: Knowledge graph for reasoning over policy relationships

3. **Confidence-Based Routing**
   - High confidence (≥80%) → Auto-execute to webhook/task
   - Low confidence (<80%) → Route to human review queue

4. **Execution Layer**
   - Map controls to real execution targets (Jira, Webhooks, Agents)
   - Mock webhook payloads for demo
   - Production-ready integration framework

5. **Human-in-the-Loop**
   - Review queue for low-confidence decisions
   - Approve/Override/Escalate workflows
   - Feedback loop for model improvement

6. **Complete Audit Trail**
   - Immutable decisions table
   - Timeline view of all events
   - Compliance-ready logging

---

## Advanced Demo Scenarios

### Scenario A: High-Risk Vendor (Block)
- **Expected Spend**: $150,000
- **Risk Level**: High
- **Expected Result**: BLOCKED (auto), no webhook execution

### Scenario B: International Vendor (Review)
- **Country**: China
- **Expected Spend**: $25,000
- **Expected Result**: REVIEW (manual approval needed)

### Scenario C: Sanctioned Entity (Block)
- Add "on_sanctions_list": true to payload
- **Expected Result**: BLOCKED with high confidence

---

## Troubleshooting

### Issue: No controls generated
**Solution**: Check OpenAI API key, ensure policy text is substantial

### Issue: Events not evaluating
**Solution**: Verify controls are enabled, check policy pack selection

### Issue: Webhooks not showing
**Solution**: Ensure execution target is mapped, confidence ≥ threshold

---

## Next Steps

1. **Customize Policy**: Upload your own compliance policy
2. **Add Integrations**: Connect real Jira, Salesforce, Slack
3. **Tune Confidence**: Adjust thresholds based on review feedback
4. **Scale Testing**: Simulate 100s of events, measure auto-rate
5. **Multi-Policy**: Ingest HR, Security, IT policies

---

## Demo Duration: 20-25 minutes

- **Phase 1**: Document Ingestion (5 min)
- **Phase 2**: Review Rules (3 min)
- **Phase 3**: Execution Mappings (3 min)
- **Phase 4**: Simulate Events (5 min)
- **Phase 5**: Review Queue (3 min)
- **Phase 6**: Audit Trail (2 min)
- **Phase 7**: Dashboard (1 min)

**Total**: 22 minutes + Q&A

---

## Success Criteria

✅ Policy document ingested and processed  
✅ 8+ controls generated from policy text  
✅ Controls mapped to execution targets  
✅ High-confidence event auto-executes  
✅ Low-confidence event routes to review  
✅ Review item approved successfully  
✅ Complete audit trail visible  
✅ Dashboard metrics update correctly  

---

**End of Demo Guide**

