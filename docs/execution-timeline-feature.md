# Execution Timeline Feature

## Overview
The **Execution Timeline** feature shows a simulated view of downstream actions that would be triggered based on each compliance decision. This makes the automation capabilities tangible and demonstrates integration potential.

## Location
- **Audit Explorer** detail modal (click any decision row, then click "Details")
- Appears at the bottom of the decision details, after "Agent Reasoning" and "Agent Search Queries"

## What It Shows

### For APPROVED Decisions ✅
```
0.1s → Decision logged to compliance database
0.3s → Email notification sent to procurement team
0.8s → Vendor data posted to ERP webhook
1.2s → Jira ticket created
1.5s → Vendor record updated in CRM
```

**Actions:**
1. **Database Log**: Immutable audit record created
2. **Email**: Procurement team notified of new approved vendor
3. **ERP Integration**: Vendor data sent to ERP system via webhook
4. **Jira**: Low-priority ticket for record-keeping
5. **CRM Update**: Salesforce record updated to Active status

### For REVIEW Decisions ⚠️
```
0.1s → Decision logged to compliance database
0.3s → Routed to human review queue
0.5s → Email sent to compliance manager
0.8s → Slack alert posted
1.1s → Jira ticket created (High Priority)
```

**Actions:**
1. **Database Log**: Immutable audit record created
2. **Review Queue**: Added to human review queue (confidence < threshold)
3. **Email**: Compliance manager notified
4. **Slack**: Alert posted to #compliance-alerts channel
5. **Jira**: High-priority ticket created for tracking

### For BLOCKED Decisions 🚫
```
0.1s → Decision logged to compliance database
0.2s → Vendor blocked from onboarding
0.4s → Urgent Slack alert posted
0.7s → Jira ticket created (Critical)
1.0s → Risk profile updated in fraud detection system
```

**Actions:**
1. **Database Log**: Immutable audit record created
2. **Blocklist**: Vendor immediately blocked, added to blocklist
3. **Slack**: Urgent alert with @channel mention
4. **Jira**: Critical-priority ticket for investigation
5. **Fraud System**: Risk profile updated for pattern analysis

## Features

### Visual Elements
- ⏱️ **Timing**: Shows simulated delay for each step (in seconds)
- 🎨 **Color-Coded Icons**: 
  - Green (Approved actions)
  - Yellow (Review actions)
  - Red (Blocked actions)
- 📋 **Status Badges**: "Completed", "Sent", "Success", "Queued", etc.
- 💬 **Details**: Technical details (URLs, IDs, recipients)

### Interactive
- **Hover Effect**: Steps highlight on hover
- **Status Indicators**: Shows completion status for each step
- **Simulated Note**: Disclaimer at bottom clarifies these are simulated steps

## Integration Types Shown

### Email Notifications
- Procurement team (approved)
- Compliance manager (review)
- No CFO email for blocked (as requested)

### Webhooks
- ERP system integration (POST to vendor onboarding endpoint)
- Shows HTTP status (200 OK)

### Task Management
- Jira ticket creation with priority levels:
  - Low priority (approved)
  - High priority (review)
  - Critical (blocked)
- Ticket IDs: COMPLIANCE-XXXX (randomized)

### Messaging
- Slack alerts to #compliance-alerts
- @mentions for review/blocked scenarios
- @channel for blocked (urgent)

### System Updates
- CRM updates (Salesforce)
- Fraud detection system
- Blocklist management

## Demo Talking Points

### 1. "Automation in Action"
*"When a decision is made, it doesn't just sit there. Look at all the downstream actions that happen automatically within seconds."*

### 2. "Integration Ecosystem"
*"We integrate with your existing tools: email, Slack, Jira, your ERP, your CRM. No need to rip and replace."*

### 3. "Smart Routing"
*"Notice how REVIEW decisions go to human review queue AND notify the team, while APPROVED decisions flow straight through to your systems."*

### 4. "Severity-Based Actions"
*"The system responds appropriately to risk: low-priority ticket for approved vendors, critical ticket for blocked ones."*

### 5. "Audit Trail"
*"Every step is logged first. Complete auditability before any action is taken."*

## Technical Details

### Implementation
- **Type**: Frontend simulation (no actual execution)
- **Data Source**: Decision outcome from database
- **Logic**: `getExecutionSteps()` function generates appropriate steps
- **Rendering**: Dynamic based on outcome type

### Timing
- Delays are realistic estimates (0.1s - 1.5s)
- Reflects typical API/system response times
- Sequential execution shown

### Extensibility
Can be extended to:
- Show real execution logs (if backend implemented)
- Add retry logic display
- Show error states
- Include webhook response bodies
- Link to actual tickets/records

## Future Enhancements

### Phase 2: Real Execution (if desired)
1. Add `executions` table to database
2. Create execution engine to actually call webhooks
3. Log real results (success/failure)
4. Show real vs simulated mode toggle
5. Add retry logic and error handling

### Phase 3: Execution Configurability
1. Allow users to configure execution targets
2. Map decisions → actions via UI
3. Test execution with dry-run mode
4. Schedule delayed executions

## Notes
- Currently purely visual (simulated)
- Uses existing `execution_targets` concept from database
- No backend changes required
- No actual webhooks/emails sent
- Perfect for demos without needing live integrations

---

**Files Modified:**
- `app/(app)/audit-explorer/page.tsx`

**Time to Implement:** ~30 minutes

**Demo Impact:** High - makes automation tangible and shows integration potential

