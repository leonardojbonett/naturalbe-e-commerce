$ErrorActionPreference = 'Stop'

$errors = @()

function Add-Match($file, $line, $match) {
  $errors += [PSCustomObject]@{
    File = $file
    Line = $line
    Match = $match
  }
}

# HTML checks
$htmlFiles = Get-ChildItem -Recurse -Filter *.html -File
$htmlPatterns = @(
  'href="(?!https?://|/|#|mailto:|tel:|javascript:)[^"]+"',
  'src="(?!https?://|/|#|data:|mailto:|tel:|javascript:)[^"]+"',
  'srcset="(?!https?://|/|#|data:)[^"]+"',
  '/\.\./'
)

foreach ($file in $htmlFiles) {
  $content = Get-Content -Raw $file.FullName
  foreach ($pattern in $htmlPatterns) {
    $matches = [regex]::Matches($content, $pattern)
    foreach ($m in $matches) {
      $line = ($content.Substring(0, $m.Index) -split "`n").Length
      Add-Match $file.FullName $line $m.Value
    }
  }
}

# JS checks (skip products-data.* because it intentionally supports file://)
$jsFiles = Get-ChildItem -Recurse -Filter *.js -File | Where-Object { $_.Name -notin @('products-data.js','products-data.min.js') }
$jsPatterns = @(
  '\./static/',
  '/\.\./'
)

foreach ($file in $jsFiles) {
  $content = Get-Content -Raw $file.FullName
  foreach ($pattern in $jsPatterns) {
    $matches = [regex]::Matches($content, $pattern)
    foreach ($m in $matches) {
      $line = ($content.Substring(0, $m.Index) -split "`n").Length
      Add-Match $file.FullName $line $m.Value
    }
  }
}

if ($errors.Count -gt 0) {
  Write-Host "Found invalid relative paths:" -ForegroundColor Red
  $errors | Sort-Object File, Line | Format-Table -AutoSize
  exit 1
}

Write-Host "OK: No invalid relative asset paths found." -ForegroundColor Green
