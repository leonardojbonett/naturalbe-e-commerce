param(
  [string[]]$Urls = @(
    'https://naturalbe.com.co/',
    'https://naturalbe.com.co/categoria/suplementos',
    'https://naturalbe.com.co/producto/omega-3-6-9'
  ),
  [int]$Runs = 3,
  [string]$OutputDir = 'reports',
  [string]$Label = 'current',
  [string]$Preset = 'perf',
  [int]$TimeoutSec = 180
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false

if ($Runs -lt 1) {
  throw "Runs debe ser >= 1"
}

function Get-Median {
  param([double[]]$Values)
  if (-not $Values -or $Values.Count -eq 0) { return $null }
  $sorted = $Values | Sort-Object
  $n = $sorted.Count
  if (($n % 2) -eq 1) {
    return [double]$sorted[[int][Math]::Floor($n / 2)]
  }
  $a = [double]$sorted[($n / 2) - 1]
  $b = [double]$sorted[($n / 2)]
  return [double](($a + $b) / 2.0)
}

function Get-UrlSlug {
  param([string]$Url)
  $u = [Uri]$Url
  $path = $u.AbsolutePath.Trim('/')
  if ([string]::IsNullOrWhiteSpace($path)) {
    $path = 'home'
  }
  $slug = ($path -replace '[^a-zA-Z0-9\-]+', '-').ToLowerInvariant()
  if ([string]::IsNullOrWhiteSpace($slug)) { $slug = 'page' }
  return $slug
}

function Read-LhMetrics {
  param([string]$Path)
  if (-not (Test-Path $Path)) { return $null }
  try {
    $raw = Get-Content $Path -Raw -Encoding UTF8
    $json = $raw | ConvertFrom-Json -Depth 100
  } catch {
    return $null
  }

  if ($null -ne $json.runtimeError) {
    return $null
  }
  if ($null -eq $json.categories -or $null -eq $json.categories.performance) {
    return $null
  }

  $audits = $json.audits
  return [PSCustomObject]@{
    score = [double]($json.categories.performance.score * 100.0)
    lcp = if ($audits.'largest-contentful-paint'.numericValue) { [double]$audits.'largest-contentful-paint'.numericValue } else { $null }
    cls = if ($audits.'cumulative-layout-shift'.numericValue -or $audits.'cumulative-layout-shift'.numericValue -eq 0) { [double]$audits.'cumulative-layout-shift'.numericValue } else { $null }
    tbt = if ($audits.'total-blocking-time'.numericValue -or $audits.'total-blocking-time'.numericValue -eq 0) { [double]$audits.'total-blocking-time'.numericValue } else { $null }
    speed_index = if ($audits.'speed-index'.numericValue) { [double]$audits.'speed-index'.numericValue } else { $null }
    inp = if ($audits.'interaction-to-next-paint'.numericValue) { [double]$audits.'interaction-to-next-paint'.numericValue } else { $null }
  }
}

function Run-Lighthouse {
  param(
    [string]$Url,
    [string]$OutFile,
    [string]$Preset,
    [int]$TimeoutSec
  )

  New-Item -ItemType Directory -Force -Path '.tmp' | Out-Null
  $tmpDir = Join-Path (Resolve-Path '.tmp').Path ("lh-" + [Guid]::NewGuid().ToString())
  New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null

  $env:TEMP = $tmpDir
  $env:TMP = $tmpDir

  $chromeFlags = "--headless=new --no-sandbox --disable-dev-shm-usage --user-data-dir=$tmpDir\chrome"
  $stdoutFile = Join-Path $tmpDir 'stdout.log'
  $stderrFile = Join-Path $tmpDir 'stderr.log'

  try {
    & npx lighthouse $Url `
      --only-categories=performance `
      --preset=$Preset `
      --quiet `
      --chrome-flags="$chromeFlags" `
      --output=json `
      --output-path="$OutFile" `
      --max-wait-for-load=$([Math]::Max(45000, $TimeoutSec * 1000)) `
      1> $stdoutFile 2> $stderrFile
  } catch {
    # Ignore native command cleanup exceptions (common EPERM on temp cleanup in Windows).
  }

  $exitCode = $LASTEXITCODE
  $stdout = if (Test-Path $stdoutFile) { Get-Content $stdoutFile -Raw -Encoding UTF8 } else { "" }
  $stderr = if (Test-Path $stderrFile) { Get-Content $stderrFile -Raw -Encoding UTF8 } else { "" }

  # Lighthouse on Windows may fail cleanup (EPERM) after writing valid JSON.
  if ($exitCode -ne 0 -and (Test-Path $OutFile)) {
    $metrics = Read-LhMetrics -Path $OutFile
    if ($null -ne $metrics) {
      $exitCode = 0
    }
  }

  return [PSCustomObject]@{
    exit_code = $exitCode
    stdout = $stdout
    stderr = $stderr
  }
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$allPages = @()

foreach ($url in $Urls) {
  $slug = Get-UrlSlug -Url $url
  Write-Host "Auditing $url ($slug) with $Runs runs..." -ForegroundColor Cyan

  $runsData = @()
  for ($i = 1; $i -le $Runs; $i++) {
    $outFile = Join-Path $OutputDir ("lh-{0}-{1}-r{2}.json" -f $slug, $Label, $i)
    $attempts = 0
    $success = $false
    while (-not $success -and $attempts -lt 2) {
      $attempts++
      $res = Run-Lighthouse -Url $url -OutFile $outFile -Preset $Preset -TimeoutSec $TimeoutSec
      $metrics = Read-LhMetrics -Path $outFile
      if ($res.exit_code -eq 0 -and $null -ne $metrics) {
        $runsData += [PSCustomObject]@{
          run = $i
          file = $outFile
          score = $metrics.score
          lcp = $metrics.lcp
          cls = $metrics.cls
          tbt = $metrics.tbt
          speed_index = $metrics.speed_index
          inp = $metrics.inp
        }
        $success = $true
        Write-Host ("  run {0}: OK score={1:n0} LCP={2:n0}ms TBT={3:n0}ms CLS={4}" -f $i, $metrics.score, $metrics.lcp, $metrics.tbt, ([Math]::Round($metrics.cls, 4))) -ForegroundColor Green
      } else {
        if ($attempts -lt 2) {
          Start-Sleep -Seconds 2
        } else {
          Write-Warning ("  run {0}: FAIL (no valid JSON metrics)." -f $i)
        }
      }
    }
  }

  $scoreVals = @($runsData | ForEach-Object { $_.score } | Where-Object { $null -ne $_ })
  $lcpVals = @($runsData | ForEach-Object { $_.lcp } | Where-Object { $null -ne $_ })
  $clsVals = @($runsData | ForEach-Object { $_.cls } | Where-Object { $null -ne $_ })
  $tbtVals = @($runsData | ForEach-Object { $_.tbt } | Where-Object { $null -ne $_ })
  $speedVals = @($runsData | ForEach-Object { $_.speed_index } | Where-Object { $null -ne $_ })
  $inpVals = @($runsData | ForEach-Object { $_.inp } | Where-Object { $null -ne $_ })

  $pageSummary = [PSCustomObject]@{
    url = $url
    slug = $slug
    runs_requested = $Runs
    runs_ok = $runsData.Count
    median = [PSCustomObject]@{
      score = Get-Median -Values $scoreVals
      lcp = Get-Median -Values $lcpVals
      cls = Get-Median -Values $clsVals
      tbt = Get-Median -Values $tbtVals
      speed_index = Get-Median -Values $speedVals
      inp = Get-Median -Values $inpVals
    }
    runs = $runsData
  }
  $allPages += $pageSummary
}

$summary = [PSCustomObject]@{
  generated_at = (Get-Date).ToString('yyyy-MM-ddTHH:mm:ssK')
  preset = $Preset
  runs = $Runs
  pages = $allPages
}

$jsonPath = Join-Path $OutputDir ("lh-summary-{0}.json" -f $Label)
$mdPath = Join-Path $OutputDir ("lh-summary-{0}.md" -f $Label)
$summary | ConvertTo-Json -Depth 100 | Set-Content -Path $jsonPath -Encoding UTF8

$md = @()
$md += "# Lighthouse Median Summary ($Label)"
$md += ""
$md += "- Generated: $($summary.generated_at)"
$md += "- Preset: $Preset"
$md += "- Runs per URL requested: $Runs"
$md += ""
$md += "| Page | Runs OK | Perf Score (median) | LCP ms | CLS | TBT ms | Speed Index ms | INP ms |"
$md += "|---|---:|---:|---:|---:|---:|---:|---:|"
foreach ($p in $allPages) {
  $m = $p.median
  $score = if ($null -ne $m.score) { [Math]::Round($m.score, 0) } else { "n/a" }
  $lcp = if ($null -ne $m.lcp) { [Math]::Round($m.lcp, 0) } else { "n/a" }
  $cls = if ($null -ne $m.cls) { [Math]::Round($m.cls, 4) } else { "n/a" }
  $tbt = if ($null -ne $m.tbt) { [Math]::Round($m.tbt, 0) } else { "n/a" }
  $speed = if ($null -ne $m.speed_index) { [Math]::Round($m.speed_index, 0) } else { "n/a" }
  $inp = if ($null -ne $m.inp) { [Math]::Round($m.inp, 0) } else { "n/a" }
  $md += "| $($p.slug) | $($p.runs_ok)/$($p.runs_requested) | $score | $lcp | $cls | $tbt | $speed | $inp |"
}
$md += ""
$md += "Raw JSON: $jsonPath"
$md += "Markdown report: $mdPath"

$md -join "`n" | Set-Content -Path $mdPath -Encoding UTF8

Write-Host ""
Write-Host "Lighthouse summary generated:" -ForegroundColor Green
Write-Host " - $jsonPath"
Write-Host " - $mdPath"
