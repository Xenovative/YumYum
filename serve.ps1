# Build and serve OneNightDrink app
# Usage: .\serve.ps1 [port]

param(
    [int]$Port = 3000
)

Write-Host "Building production bundle..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "Starting server on http://localhost:$Port" -ForegroundColor Green
    npx serve dist -l $Port
} else {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}
