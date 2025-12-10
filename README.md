# NUL Compliance Control Center

AI-powered compliance automation platform that converts policy documents into executable controls.

## 🚀 Quick Start

```bash
make setup    # Complete setup
make dev      # Start development
```

Visit: http://localhost:3001

**See [QUICKSTART.md](QUICKSTART.md) for detailed instructions**

## 📋 Make Commands

```bash
make help         # Show all commands
make reset        # Full reset (deletes all data)
make db-status    # Check database
make test         # Run tests
```

## 🌐 Architecture

- **Frontend**: Next.js 16 + React 19 + TypeScript
- **Database**: PostgreSQL (pgvector) + Neo4j
- **AI**: OpenAI GPT-4 for agentic decisions
- **RAG**: Dual approach (Linear + Graph)

## 📊 Features

- ✅ Agentic real-time decision making
- ✅ Confidence-based routing to human review
- ✅ Visual policy graph
- ✅ Complete audit trail
- ✅ Manual entry with AI autofill

## 📖 Documentation

- [Quick Start Guide](QUICKSTART.md)
- [Infrastructure Setup](INFRASTRUCTURE.md)
- [Agent Architecture](AGENTS.md)
- [Demo Guide](DEMO-GUIDE.md)

## 🛠️ Tech Stack

- Next.js, TypeScript, Tailwind CSS, Shadcn UI
- PostgreSQL, Neo4j, OpenAI
- Docker Compose

---

**Starting from scratch?** → `make reset && make setup && make dev`
