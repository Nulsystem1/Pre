-- Seed Execution Targets for Demo
-- These are sample integrations that controls can be mapped to

INSERT INTO execution_targets (id, name, type, description, integration_label, config, enabled)
VALUES
  (
    gen_random_uuid(),
    'Create Jira Ticket',
    'Task',
    'Automatically create a Jira ticket in the Compliance board',
    'Jira',
    '{"project": "COMPLIANCE", "issue_type": "Task", "priority": "High"}',
    true
  ),
  (
    gen_random_uuid(),
    'Send to ERP Webhook',
    'Webhook',
    'POST vendor data to ERP system for onboarding',
    'Custom API',
    '{"url": "https://api.example.com/vendors/onboard", "method": "POST", "headers": {"Content-Type": "application/json"}}',
    true
  ),
  (
    gen_random_uuid(),
    'Notify Vendor Portal',
    'AgentStub',
    'Send notification to vendor portal about application status',
    'Vendor Portal',
    '{"portal_url": "https://vendors.example.com", "notification_type": "email"}',
    true
  ),
  (
    gen_random_uuid(),
    'Update CRM',
    'Webhook',
    'Update vendor record in Salesforce CRM',
    'Salesforce',
    '{"instance": "https://example.salesforce.com", "object": "Vendor__c"}',
    true
  ),
  (
    gen_random_uuid(),
    'Send Slack Alert',
    'AgentStub',
    'Post message to #compliance-alerts channel',
    'Slack',
    '{"channel": "#compliance-alerts", "mention": "@compliance-team"}',
    true
  )
ON CONFLICT (name) DO NOTHING;

