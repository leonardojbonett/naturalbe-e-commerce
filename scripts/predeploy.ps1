$ErrorActionPreference = 'Stop'

Write-Host "Running predeploy checks..." -ForegroundColor Cyan

# Check for broken static paths
powershell -ExecutionPolicy Bypass -File scripts\check-static-paths.ps1

# Optional: include other smoke tests if present
if (Test-Path 'scripts\smoke-product.ps1') {
  powershell -ExecutionPolicy Bypass -File scripts\smoke-product.ps1
}

Write-Host "Predeploy checks completed." -ForegroundColor Green
