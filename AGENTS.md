# NUL Compliance Control Center - Agent Architecture

## Overview

The NUL Compliance Control Center is an AI-powered compliance automation platform that converts written policy documents into executable controls. The system uses multiple AI agents to extract, structure, and operationalize compliance policies for real-time decision-making.

## System Architecture

### Core Components

1. **Policy Ingestion Agent** (`/api/policy/ingest`)
   - Extracts structured chunks from policy documents (Linear RAG preparation)
   - Builds knowledge graphs from policy text (Graph RAG)
   - Stores policy metadata and relationships

2. **Control Generation Agent** (`/api/controls/generate`)
   - Traverses knowledge graphs to identify control paths
   - Generates executable JSON Logic controls using AI
   - Links controls back to source policy sections

3. **Control Evaluation Engine** (`/api/controls/evaluate`)
   - Evaluates incoming events against all active controls
   - Uses JSON Logic for condition matching
   - Produces decisions (APPROVE/REVIEW/BLOCK) with risk scores

4. **Decision Engine**
   - Aggregates control evaluation results
   - Applies priority rules (BLOCK > REVIEW > APPROVE)
   - Calculates composite risk scores
   - Creates audit records and cases

## Data Flow

```
Policy Document (Text)
    ↓
[Policy Ingestion Agent]
    ├─→ Policy Chunks (Linear RAG)
    └─→ Knowledge Graph (Graph RAG)
            ├─→ Nodes (thresholds, conditions, actions, entities)
            └─→ Edges (TRIGGERS, REQUIRES, CASCADES_TO, etc.)
    ↓
[Control Generation Agent]
    ├─→ Traverses graph paths
    ├─→ Generates JSON Logic conditions
    └─→ Creates executable Controls
    ↓
[Control Evaluation Engine]
    ├─→ Receives Events (ONBOARDING, TRANSACTION, etc.)
    ├─→ Evaluates against all enabled controls
    └─→ Produces Decisions
    ↓
[Decision Engine]
    ├─→ Aggregates results
    ├─→ Determines final outcome
    └─→ Creates Cases (if REVIEW/BLOCK)
    ↓
Audit Trail + Case Management
```

## Agent Implementations

### 1. Policy Ingestion Agent

**Location**: `app/api/policy/ingest/route.ts`

**Responsibilities**:
- Parse policy documents into structured chunks
- Extract entities and relationships for knowledge graph
- Store embeddings (prepared for vector search)

**AI Model**: `anthropic/claude-sonnet-4-20250514`

**Outputs**:
- `PolicyChunk[]`: Text chunks with section references and metadata
- `GraphNode[]`: Entities (thresholds, conditions, actions, jurisdictions)
- `GraphEdge[]`: Relationships between entities

**Example Node Types**:
- `threshold`: Numeric thresholds (e.g., "risk_score > 50")
- `condition`: Boolean conditions (e.g., "ID not verified")
- `action`: Actions to take (e.g., "BLOCK", "REVIEW")
- `entity_type`: Entity types (e.g., "PEP", "sanctioned entity")
- `jurisdiction`: Geographic/regulatory jurisdictions
- `risk_factor`: Risk indicators
- `document_type`: Required documents

**Example Relationships**:
- `TRIGGERS`: Condition → Action
- `REQUIRES`: Entity → Document
- `CASCADES_TO`: Condition → Condition
- `OVERRIDES`: Rule → Rule
- `APPLIES_TO`: Rule → Entity Type
- `EXEMPTS`: Condition → Rule

### 2. Control Generation Agent

**Location**: `app/api/controls/generate/route.ts`

**Responsibilities**:
- Analyze knowledge graph to identify control paths
- Generate JSON Logic conditions from graph traversal
- Create human-readable condition descriptions
- Assign risk weights and actions

**AI Model**: `anthropic/claude-sonnet-4-20250514`

**Inputs**:
- Policy pack ID
- Knowledge graph (nodes + edges)
- Policy chunks (for context)

**Process**:
1. Build graph context string showing all nodes and relationships
2. Prompt AI to generate controls following paths from conditions → actions
3. Map generated controls to `Control` type with JSON Logic conditions
4. Replace old controls for the policy pack

**Output**: `Control[]` with:
- `control_id`: Unique identifier (e.g., "KYC-001")
- `condition`: JSON Logic condition object
- `condition_readable`: Human-readable version
- `action`: APPROVE | REVIEW | BLOCK
- `risk_weight`: 0.0 to 1.0
- `ai_reasoning`: Explanation tied to policy text
- `source_node_ids`: Graph nodes this control was derived from

**JSON Logic Examples**:
```json
// Simple equality
{"==": [{"var": "customer.id_verified"}, false]}

// Greater than
{">": [{"var": "customer.risk_score"}, 50]}

// AND condition
{"and": [
  {">": [{"var": "transaction.amount"}, 10000]},
  {"==": [{"var": "transaction.type"}, "wire_transfer"]}
]}

// OR condition
{"or": [
  {"==": [{"var": "customer.country"}, "IR"]},
  {"==": [{"var": "customer.country"}, "KP"]}
]}

// IN array
{"in": [{"var": "customer.country"}, ["IR", "KP", "SY", "CU"]]}
```

### 3. Control Evaluation Engine

**Location**: `app/api/controls/evaluate/route.ts`

**Responsibilities**:
- Evaluate all enabled controls against event data
- Match JSON Logic conditions
- Aggregate results and determine final decision
- Calculate risk scores

**Process**:
1. Filter enabled controls (optionally by policy pack)
2. For each control, evaluate condition against event data
3. Collect matched controls and their actions
4. Apply priority: BLOCK > REVIEW > APPROVE
5. Calculate composite risk score from triggered controls

**Decision Logic**:
- If any control triggers BLOCK → final decision = BLOCKED
- Else if any control triggers REVIEW → final decision = REVIEW
- Else → final decision = APPROVED

**Risk Score Calculation**:
```
risk_score = average(triggered_controls.risk_weight) * 100
```

### 4. JSON Logic Evaluator

**Location**: `lib/json-logic.ts`

**Responsibilities**:
- Evaluate JSON Logic conditions against data
- Extract variable comparisons for audit trails
- Support nested AND/OR conditions

**Supported Operators**:
- `==`, `!=`: Equality comparisons
- `>`, `>=`, `<`, `<=`: Numeric comparisons
- `in`: Array membership
- `and`, `or`: Logical operators
- `var`: Variable access (dot notation supported)

## Data Models

### Policy Pack
- Container for related compliance policies
- Status: `draft` | `review` | `active` | `archived`
- Contains raw policy text and metadata

### Policy Chunk
- Segmented policy text for Linear RAG
- Includes section references and embeddings (prepared)
- Metadata: priority, action_type

### Graph Node
- Represents an entity in the knowledge graph
- Types: threshold, condition, action, entity_type, jurisdiction, risk_factor, document_type
- Properties: field, operator, value, action_type, severity
- Position: x, y coordinates for visualization

### Graph Edge
- Represents relationships between nodes
- Types: TRIGGERS, REQUIRES, CASCADES_TO, OVERRIDES, APPLIES_TO, EXEMPTS

### Control
- Executable rule derived from knowledge graph
- JSON Logic condition for evaluation
- Action: APPROVE | REVIEW | BLOCK
- Risk weight: 0.0 to 1.0
- Links to source graph nodes

### Event
- Incoming data to evaluate
- Types: ONBOARDING, TRANSACTION, ACCOUNT_UPDATE, KYC_REFRESH
- Payload: CustomerData or TransactionData

### Decision
- Result of control evaluation
- Outcome: APPROVED | REVIEW | BLOCKED
- Includes risk score, matched conditions, AI explanation
- Immutable audit record

### Case
- Created when decision is REVIEW or BLOCKED
- Status: open | in_review | resolved
- Resolution: approved | blocked | escalated
- Supports manual review workflow

## API Endpoints

### Policy Management
- `POST /api/policy/ingest` - Ingest policy document and extract graph
- `GET /api/policy/packs` - List all policy packs
- `GET /api/policy/packs/[id]` - Get specific policy pack
- `POST /api/policy/search` - Search policy chunks (Linear RAG)

### Control Management
- `POST /api/controls/generate` - Generate controls from knowledge graph
- `GET /api/controls` - List all controls
- `POST /api/controls/evaluate` - Evaluate event against controls
- `POST /api/controls/test` - Test control with sample data

### Graph Management
- `GET /api/graph/nodes` - Get graph nodes for policy pack
- `GET /api/graph/edges` - Get graph edges for policy pack
- `GET /api/graph` - Get full graph (nodes + edges)

## Current Implementation Status

### In-Memory Store (Demo)
- All data stored in TypeScript arrays (`lib/store.ts`)
- Suitable for development and demos
- Not persistent across restarts

### Production Architecture (Designed)
- **Supabase**: Policy packs, chunks, controls, events, decisions, cases
- **Neo4j**: Knowledge graph (nodes and edges) for Graph RAG
- **pgvector**: Embeddings for policy chunks (Linear RAG)
- **Immutable Decisions**: Append-only audit log with triggers

See `scripts/001-create-tables.sql` for database schema.

## AI Integration Points

### 1. Policy Ingestion
- **Model**: Claude Sonnet 4
- **Task**: Extract structured data from unstructured policy text
- **Output**: Structured chunks + knowledge graph

### 2. Control Generation
- **Model**: Claude Sonnet 4
- **Task**: Generate executable controls from knowledge graph
- **Output**: JSON Logic controls with human-readable descriptions

### 3. Future: Decision Explanation
- Could use AI to generate explanations for decisions
- Currently uses pre-generated `ai_reasoning` from control generation

### 4. Future: Policy Question Answering
- Linear RAG: Semantic search over policy chunks
- Graph RAG: Traverse knowledge graph to answer complex queries

## Key Design Decisions

1. **Dual RAG Approach**: Linear RAG (chunks) + Graph RAG (knowledge graph)
   - Linear RAG: Fast semantic search for policy text
   - Graph RAG: Structured reasoning over policy relationships

2. **JSON Logic for Controls**: Standardized, portable condition format
   - Easy to validate and test
   - Supports complex nested conditions
   - Human-readable format available

3. **Immutable Decisions**: Append-only audit log
   - Compliance requirement for audit trails
   - Prevents tampering with historical decisions

4. **Control Snapshotting**: Store control state at decision time
   - Enables audit of what control was active when decision was made
   - Supports policy versioning

5. **Priority-Based Decision Aggregation**: BLOCK > REVIEW > APPROVE
   - Ensures most restrictive action wins
   - Prevents bypassing critical controls

## Future Enhancements

1. **Real-time Event Streaming**: WebSocket support for live events
2. **Control Versioning**: Track control changes over time
3. **A/B Testing**: Test new controls against historical events
4. **Policy Diff**: Compare policy versions and their impact
5. **Automated Control Testing**: Generate test cases from policy text
6. **Multi-tenant Support**: Isolate policies and controls by organization
7. **Control Dependencies**: Model control interactions and dependencies
8. **Performance Monitoring**: Track control evaluation latency and throughput

## Development Notes

- Uses Vercel AI SDK for structured output generation
- Type-safe with TypeScript throughout
- Component-based React architecture
- Radix UI for accessible components
- D3.js for graph visualization
- Recharts for analytics charts

