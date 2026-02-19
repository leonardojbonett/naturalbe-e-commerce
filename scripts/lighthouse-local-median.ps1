param(
  [int]$Port = 4173,
  [int]$Runs = 3,
  [string]$Label = 'local',
  [string]$OutputDir = 'reports'
)

$ErrorActionPreference = 'Stop'

$urls = @(
  "http://127.0.0.1:$Port/index.html",
  "http://127.0.0.1:$Port/category.html?category=suplementos",
  "http://127.0.0.1:$Port/product.html?slug=omega-3-6-9"
)

$job = Start-Job -ScriptBlock {
  param($wd, $p)
  Set-Location $wd
  python -m http.server $p
} -ArgumentList (Get-Location).Path, $Port

try {
  Start-Sleep -Seconds 3
  & "$PSScriptRoot/lighthouse-median.ps1" -Urls $urls -Runs $Runs -Label $Label -OutputDir $OutputDir
} finally {
  try { Stop-Job $job } catch {}
  try { Remove-Job $job } catch {}
}
