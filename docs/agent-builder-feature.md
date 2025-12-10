# Agent Action Builder

## Overview
The **Agent Action Builder** is a visual workflow designer that allows you to create and configure autonomous agent action flows using drag-and-drop nodes and connections.

## Location
- **URL**: http://localhost:3001/agent-builder
- **Navigation**: Sidebar → Agent Builder (workflow icon)

## Features

### Visual Workflow Designer
- **Dark-themed canvas** matching the application design
- **Drag and drop** nodes onto the canvas
- **Connect nodes** by dragging from one node's handle to another
- **Pan and zoom** for navigation
- **Mini-map** for overview of large workflows

### Node Types

#### 1. Decision Node (Purple)
- Represents a decision point made by the agent
- Example: "Vendor Decision Made"
- Icon: GitBranch

#### 2. Condition Node (Yellow)
- Represents a conditional check (if/else)
- Example: "If APPROVED", "If BLOCKED"
- Icon: Zap
- Shows condition logic

#### 3. Webhook Node (Blue)
- HTTP webhook calls to external systems
- Example: "Send to ERP"
- Icon: Webhook
- Shows endpoint URL

#### 4. Email Node (Green)
- Email notifications
- Example: "Notify Procurement"
- Icon: Mail
- Shows recipient

#### 5. API Call Node (Cyan)
- REST API calls
- Example: "Create Jira Ticket"
- Icon: Send
- Shows endpoint

#### 6. Database Node (Orange)
- Database operations
- Example: "Add to Blocklist"
- Icon: Database
- Shows table name

### Pre-configured Example Workflow

The builder comes with a working example that demonstrates a vendor onboarding workflow:

```
Decision: Vendor Decision Made
    ├─→ If APPROVED (Condition)
    │       ├─→ Send to ERP (Webhook)
    │       │       └─→ Create Jira Ticket (API)
    │       └─→ Notify Procurement (Email)
    │               └─→ Create Jira Ticket (API)
    └─→ If BLOCKED (Condition)
            ├─→ Alert Compliance (Email)
            └─→ Add to Blocklist (Database)
```

### Interactive Features

#### Drag and Drop
- Click and drag any node to reposition it
- Nodes can be freely moved around the canvas

#### Create Connections
- Drag from a node's output handle (right side)
- Drop on another node's input handle (left side)
- Animated connections show flow direction

#### Delete Elements
- Select a node or edge
- Press Delete/Backspace to remove it

#### Canvas Controls
- **Zoom In/Out**: Use controls in bottom-left
- **Fit View**: Auto-fit entire workflow
- **Mini-map**: Navigate large workflows (bottom-right)

#### Save Workflow
- Click "Save Workflow" button
- Button changes to "Saved!" with checkmark
- Resets after 3 seconds

### Visual Design

#### Color Scheme
- **Purple**: Decision points
- **Yellow**: Conditions (if/then logic)
- **Blue**: Webhooks and integrations
- **Green**: Email and notifications
- **Cyan**: API calls
- **Orange**: Database operations

#### Animations
- Connections are animated with flowing dots
- Hover effects on nodes
- Smooth transitions

#### Dark Theme
- Dark background with dot pattern
- Translucent node backgrounds
- Colored borders matching node types

## Demo Talking Points

### 1. "Visual Workflow Design"
*"Instead of writing code, you can visually design how the agent should respond to decisions. Drag nodes, connect them, and define the automation flow."*

### 2. "No-Code Agent Configuration"
*"Non-technical compliance officers can build these workflows. No coding required - just drag, drop, and connect."*

### 3. "Complex Logic Made Simple"
*"See how we branch based on the decision outcome? If approved, do these actions. If blocked, do those actions. Visual logic anyone can understand."*

### 4. "Integration Ecosystem"
*"Each node represents an integration point - webhooks, emails, APIs, databases. Connect your entire compliance stack."*

### 5. "Real-time Preview"
*"What you see is what you get. The visual representation matches exactly how the agent will execute."*

### 6. "Future Vision"
*"This is where we're headed - fully visual agent configuration. Today it's policy text to controls, tomorrow it's visual workflow builders."*

## Technical Details

### Implementation
- **Library**: React Flow v11
- **Type**: Pure frontend (no backend persistence)
- **State Management**: React Flow's built-in state
- **Styling**: Tailwind CSS with dark theme
- **Icons**: Lucide React

### Components
- Custom node components for each type
- Styled with translucent backgrounds
- Color-coded borders and icons
- Hover effects and animations

### File Structure
```
app/(app)/agent-builder/
  └─ page.tsx          # Main Agent Builder page
components/app/
  └─ app-sidebar.tsx   # Navigation (updated)
```

## Future Enhancements (Not Implemented)

### Phase 2: Backend Integration
1. Save workflows to database
2. Load saved workflows
3. Version control for workflows
4. Export/Import workflow JSON

### Phase 3: Execution Engine
1. Actually execute workflows
2. Real-time execution visualization
3. Error handling and retry logic
4. Execution history and logs

### Phase 4: Advanced Features
1. Custom node types
2. Node configuration panels
3. Validation rules
4. Testing/simulation mode
5. Template library

## Notes

- **Demo Only**: Currently frontend-only, no backend persistence
- **Interactive**: Fully functional drag-and-drop
- **Pre-loaded**: Comes with example workflow
- **Save**: Mock save function (doesn't persist)
- **Visual Impact**: High - very impressive in demos
- **Time to Implement**: ~45 minutes

## Demo Tips

1. **Start with the example**: "Here's a workflow we've already built..."
2. **Show interactivity**: Drag nodes around, create new connections
3. **Explain the logic**: Walk through the conditional branching
4. **Add a node**: Show how easy it is to extend
5. **Click Save**: Show the visual feedback
6. **Pan and zoom**: Demonstrate canvas navigation

---

**Files Created:**
- `app/(app)/agent-builder/page.tsx`

**Files Modified:**
- `components/app/app-sidebar.tsx` (added navigation link)

**Dependencies Added:**
- `reactflow` (v11.11.4)

**Demo Impact:** Very High - Most visually impressive feature

