$ErrorActionPreference = 'Stop'

Write-Host "Running predeploy checks..." -ForegroundColor Cyan

# Check for broken static paths
powershell -ExecutionPolicy Bypass -File scripts\check-static-paths.ps1

# Optional: include other smoke tests if present
if (Test-Path 'scripts\smoke-product.ps1') {
  powershell -ExecutionPolicy Bypass -File scripts\smoke-product.ps1
}

if (Test-Path 'scripts\validate-product-seo-copy.js') {
  node scripts\validate-product-seo-copy.js
}

if (Test-Path 'scripts\generate-sitemap.js') {
  node scripts\generate-sitemap.js
}

if (Test-Path 'scripts\generate-image-sitemap.js') {
  node scripts\generate-image-sitemap.js
}

if (Test-Path 'scripts\audit-search-basics.js') {
  node scripts\audit-search-basics.js
}

if (Test-Path 'scripts\export-search-inventory.js') {
  node scripts\export-search-inventory.js --main-site
}

Write-Host "Predeploy checks completed." -ForegroundColor Green
