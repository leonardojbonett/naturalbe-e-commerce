$ErrorActionPreference = 'Stop'

function Test-HttpsTokens {
  param (
    [Parameter(Mandatory = $true)]
    [string]$Path
  )

  $lines = @(Get-Content -LiteralPath $Path)
  $inTemplate = $false
  for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    for ($pos = 0; $pos -lt $line.Length; $pos++) {
      $ch = $line[$pos]
      if ($ch -eq '`') {
        $escaped = $pos -gt 0 -and $line[$pos - 1] -eq '\'
        if (-not $escaped) {
          $inTemplate = -not $inTemplate
        }
      }

      if ($pos -le $line.Length - 8 -and $line.Substring($pos, 8) -eq 'https://') {
        $prev = if ($pos -gt 0) { $line[$pos - 1] } else { '' }
        if (-not $inTemplate -and $prev -ne '"' -and $prev -ne "'" -and $prev -ne '`') {
          Write-Host "Found unquoted https:// in ${Path}:$($i + 1)"
          Write-Host "  $line"
          return $false
        }
      }
    }
  }

  return $true
}

$targets = @()
$targets += Get-ChildItem -Path static\\js -Recurse -Filter *.js
if (Test-Path -LiteralPath product.html) {
  $targets += Get-Item -LiteralPath product.html
}

if (-not $targets.Count) {
  Write-Host "No targets found."
  exit 0
}

$ok = $true
foreach ($item in $targets) {
  if (-not (Test-HttpsTokens -Path $item.FullName)) {
    $ok = $false
  }
}

if (-not $ok) {
  Write-Host "Smoke test failed."
  exit 1
}

Write-Host "Smoke test passed."
