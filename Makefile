.PHONY: help install dev build start stop clean reset restart logs test db-reset db-migrate db-seed

help: ## Show this help message
	@echo "NUL Compliance Control Center - Available Commands"
	@echo "=================================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install all dependencies
	@echo "📦 Installing dependencies..."
	pnpm install

dev: ## Start development server
	@echo "🚀 Starting dev server..."
	pnpm dev

build: ## Build for production
	@echo "🏗️  Building application..."
	pnpm build

start: ## Start Docker services (Postgres, Neo4j)
	@echo "🐳 Starting Docker services..."
	docker compose up -d
	@echo "⏳ Waiting for services to be ready..."
	@sleep 5
	@echo "✅ Services started!"

stop: ## Stop Docker services
	@echo "🛑 Stopping Docker services..."
	docker compose down

restart: ## Restart Docker services
	@echo "🔄 Restarting services..."
	docker compose restart

logs: ## View Docker logs
	docker compose logs -f

clean: ## Remove node_modules and build artifacts
	@echo "🧹 Cleaning up..."
	rm -rf node_modules .next out dist
	@echo "✅ Cleaned!"

reset: ## DANGER: Full reset - deletes ALL data and restarts fresh
	@echo "⚠️  WARNING: This will delete ALL your data!"
	@read -p "Are you sure? (yes/no): " confirm && [ "$$confirm" = "yes" ] || exit 1
	@echo "🗑️  Stopping services..."
	docker compose down -v
	@echo "🧹 Cleaning Docker volumes..."
	docker volume rm nul-compliance-control-center_postgres_data 2>/dev/null || true
	docker volume rm nul-compliance-control-center_neo4j_data 2>/dev/null || true
	@echo "🐳 Starting fresh services..."
	docker compose up -d
	@echo "⏳ Waiting for services..."
	@sleep 8
	@echo "📊 Initializing database schema..."
	@docker exec nul-postgres sh -c "for f in \$$(ls /docker-entrypoint-initdb.d/*.sql | sort); do echo \"Running \$$(basename \$$f)...\"; psql -U postgres -d postgres -f \$$f; done"
	docker exec nul-postgres psql -U postgres -d postgres -c "ALTER TABLE events DROP CONSTRAINT IF EXISTS events_event_type_check;"
	@echo "🔗 Initializing Neo4j constraints..."
	docker cp scripts/neo4j-init.cypher nul-neo4j:/tmp/init.cypher
	docker exec nul-neo4j cypher-shell -u neo4j -p neo4jpassword -f /tmp/init.cypher || true
	@echo "✅ Full reset complete! Ready for fresh start."

db-reset: ## Reset database only (keep Docker running)
	@echo "🗑️  Resetting database..."
	docker exec nul-postgres psql -U postgres -d postgres -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
	@echo "📊 Running all migrations..."
	@docker exec nul-postgres sh -c "for f in \$$(ls /docker-entrypoint-initdb.d/*.sql | sort); do echo \"Running \$$(basename \$$f)...\"; psql -U postgres -d postgres -f \$$f; done"
	docker exec nul-postgres psql -U postgres -d postgres -c "ALTER TABLE events DROP CONSTRAINT IF EXISTS events_event_type_check;"
	docker exec nul-neo4j cypher-shell -u neo4j -p neo4jpassword "MATCH (n) DETACH DELETE n" || true
	docker cp scripts/neo4j-init.cypher nul-neo4j:/tmp/init.cypher
	docker exec nul-neo4j cypher-shell -u neo4j -p neo4jpassword -f /tmp/init.cypher || true
	@echo "✅ Database reset complete!"

db-migrate: ## Run database migrations
	@echo "📊 Running all migrations..."
	@docker exec nul-postgres sh -c "for f in \$$(ls /docker-entrypoint-initdb.d/*.sql | sort); do echo \"Running \$$(basename \$$f)...\"; psql -U postgres -d postgres -f \$$f; done"
	docker exec nul-postgres psql -U postgres -d postgres -c "ALTER TABLE events DROP CONSTRAINT IF EXISTS events_event_type_check;"
	@echo "✅ Migrations complete!"

db-status: ## Check database status
	@echo "📊 Database Status:"
	@echo "=================="
	docker exec nul-postgres psql -U postgres -d postgres -c "\
		SELECT 'Policy Packs' as table_name, COUNT(*)::text as count FROM policy_packs \
		UNION ALL SELECT 'Decisions', COUNT(*)::text FROM decisions \
		UNION ALL SELECT 'Review Items', COUNT(*)::text FROM review_items \
		UNION ALL SELECT 'Events', COUNT(*)::text FROM events \
		UNION ALL SELECT 'Pending Decisions', COUNT(*)::text FROM pending_decisions;"

test: ## Run end-to-end test
	@echo "🧪 Running E2E test..."
	bash scripts/test-all-features.sh

setup: install start db-migrate ## Complete setup (install + start + migrate)
	@echo ""
	@echo "✅ Setup complete!"
	@echo "==================" 
	@echo "🌐 Next.js: http://localhost:3001"
	@echo "🗄️  Postgres: localhost:5432"
	@echo "🕸️  Neo4j: http://localhost:7474"
	@echo ""
	@echo "Run 'make dev' to start the development server"

