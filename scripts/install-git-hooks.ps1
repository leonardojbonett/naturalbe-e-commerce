$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$hooksPath = Join-Path $repoRoot '.githooks'
$prePush = Join-Path $hooksPath 'pre-push'

if (-not (Test-Path $hooksPath)) {
  New-Item -ItemType Directory -Path $hooksPath | Out-Null
}

if (-not (Test-Path $prePush)) {
  throw "No se encontro el hook pre-push en $prePush"
}

git -C $repoRoot config core.hooksPath .githooks

Write-Host "core.hooksPath configurado en .githooks" -ForegroundColor Green
Write-Host "Hook activo: .githooks/pre-push" -ForegroundColor Green
Write-Host "Bypass temporal: `$env:SKIP_SEO_HOOKS='1'" -ForegroundColor Yellow
