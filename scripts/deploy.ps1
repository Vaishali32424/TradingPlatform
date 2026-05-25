# TradeVault — one-command deploy (requires Docker Desktop)
param(
    [switch]$Atlas,
    [int]$Port = 80
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "Docker is not installed. Install Docker Desktop: https://www.docker.com/products/docker-desktop/"
}

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env from .env.example — edit JWT_SECRET and passwords before production."
}

$env:APP_PORT = $Port

if ($Atlas) {
    Write-Host "Deploying API + Web with external MongoDB (Atlas)..."
    docker compose -f docker-compose.atlas.yml up -d --build
} else {
    Write-Host "Deploying API + Web + MongoDB..."
    docker compose up -d --build
}

Write-Host ""
Write-Host "App: http://localhost:$Port"
Write-Host "API health: http://localhost:$Port/api/health"
Write-Host "Super admin: login superadmin (password from .env SUPERADMIN_PASSWORD)"
Write-Host "Logs: docker compose logs -f"
