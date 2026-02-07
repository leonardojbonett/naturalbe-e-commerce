param(
  [string]$RootPath = ".",
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path -LiteralPath $RootPath

$targets = @(
  "static/js/inline/product.bundle.min.js",
  "static/js/product.bundle.min.js",
  "static/js/bundle.min.js"
)

Write-Host "Root: $root"
Write-Host "Targets:"
$targets | ForEach-Object { Write-Host "  - $($_)" }

$removed = @()
$missing = @()

foreach ($rel in $targets) {
  $full = Join-Path $root $rel
  if (Test-Path -LiteralPath $full) {
    if ($DryRun) {
      Write-Host "DRY RUN: would remove $full"
    } else {
      Remove-Item -LiteralPath $full -Force
      $removed += $full
    }
  } else {
    $missing += $full
  }
}

if ($DryRun) {
  Write-Host "Dry run complete."
  exit 0
}

if ($removed.Count) {
  Write-Host "Removed:"
  $removed | ForEach-Object { Write-Host "  - $($_)" }
} else {
  Write-Host "No files removed."
}

if ($missing.Count) {
  Write-Host "Missing (already clean):"
  $missing | ForEach-Object { Write-Host "  - $($_)" }
}
