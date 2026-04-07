# Apply Postgres schema in the correct order (local Docker).
# Run from DemoMVP:  .\scripts\apply-postgres-schema.ps1
# For Supabase: run the same SQL files in order in SQL Editor, or use psql with your connection string.

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "docker not found." -ForegroundColor Yellow
    exit 1
}

$migrations = @(
    "000-auth-core.sql",
    "001-create-tables.sql",
    "002-seed-execution-targets.sql",
    "003-command-center.sql",
    "004-command-center-results.sql",
    "005-review-queue-cases.sql",
    "006-review-queue-cases-name.sql",
    "007-review-queue-cases-policy-pack-id.sql",
    "010-mvp-schema.sql"
)

Write-Host "Applying migrations to Docker Postgres (compose service: postgres)..." -ForegroundColor Blue
foreach ($name in $migrations) {
    $path = Join-Path (Join-Path $root "scripts") $name
    if (-not (Test-Path $path)) {
        continue
    }
    Write-Host "  -> $name" -ForegroundColor Cyan
    Get-Content $path -Raw | docker compose exec -T postgres psql -U postgres -d postgres
}

Write-Host "Verifying public.users exists..." -ForegroundColor Blue
docker compose exec -T postgres psql -U postgres -d postgres -c "\dt public.users"

Write-Host "Done." -ForegroundColor Green
