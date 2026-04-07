# Setup script for NUL Compliance Control Center (Windows PowerShell)
# Same steps as scripts/setup.sh - use this when running on Windows in PowerShell

$ErrorActionPreference = "Stop"

Write-Host "NUL Compliance Control Center - Setup" -ForegroundColor Blue
Write-Host ""

# Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js not found. Install from https://nodejs.org and ensure it is in your PATH." -ForegroundColor Yellow
    exit 1
}
# Check pnpm
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "pnpm not found. Run: npm install -g pnpm" -ForegroundColor Yellow
    exit 1
}

# Check .env.local
if (-not (Test-Path .env.local)) {
    Write-Host ".env.local not found. Creating from template..." -ForegroundColor Yellow
    Copy-Item .env.local.example .env.local
    Write-Host "Please edit .env.local and add your OPENAI_API_KEY" -ForegroundColor Yellow
    Read-Host "Press Enter to continue after updating .env.local"
}

# Check Docker
try {
    docker info | Out-Null
} catch {
    Write-Host "Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Yellow
    exit 1
}

Write-Host "Step 1: Installing dependencies" -ForegroundColor Blue
pnpm install
Write-Host "Dependencies installed" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Starting infrastructure" -ForegroundColor Blue
docker compose up -d
Write-Host "Docker containers starting" -ForegroundColor Green
Write-Host ""

Write-Host "Step 3: Waiting for services..." -ForegroundColor Blue
Write-Host "  Waiting for Postgres..."
do {
    Start-Sleep -Seconds 1
} until ((docker compose exec -T postgres pg_isready -U postgres 2>$null) -eq $true)
Write-Host "  Postgres ready" -ForegroundColor Green

Write-Host "  Waiting for Neo4j..."
Start-Sleep -Seconds 10
do {
    Start-Sleep -Seconds 2
} until (try { Invoke-WebRequest -Uri http://localhost:7474 -UseBasicParsing -TimeoutSec 2 | Out-Null; $true } catch { $false })
Write-Host "  Neo4j ready" -ForegroundColor Green
Write-Host ""

Write-Host "Step 4: Initializing Neo4j constraints" -ForegroundColor Blue
docker compose exec -T neo4j cypher-shell -u neo4j -p neo4jpassword -f /var/lib/neo4j/import/init.cypher 2>$null
Write-Host "Neo4j initialized" -ForegroundColor Green
Write-Host ""

Write-Host "Step 5: Running Postgres migrations (ordered: auth core, app tables, MVP alters)" -ForegroundColor Blue
& "$PSScriptRoot/apply-postgres-schema.ps1"
Write-Host "Migrations applied" -ForegroundColor Green
Write-Host ""

Write-Host "Step 6: Verifying database setup" -ForegroundColor Blue
$tableCount = docker compose exec -T postgres psql -U postgres -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>$null
Write-Host "  Postgres tables: $($tableCount.Trim())"
Write-Host "Databases verified" -ForegroundColor Green
Write-Host ""

Write-Host "Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Infrastructure is running:"
Write-Host "  - Postgres: postgresql://postgres:postgres@localhost:5434/postgres"
Write-Host "  - PostgREST: http://localhost:3000"
Write-Host "  - Neo4j Browser: http://localhost:7474 (neo4j / neo4jpassword)"
Write-Host "  - Neo4j Bolt: bolt://localhost:7687"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Start the app: pnpm dev"
Write-Host "  2. Open the app: http://localhost:3001"
Write-Host ""
