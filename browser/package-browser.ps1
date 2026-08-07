param(
  [string]$OutputDirectory = ""
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$package = Get-Content -LiteralPath (Join-Path $repoRoot "package.json") -Raw | ConvertFrom-Json
$version = $package.version
$bundleName = "Dragon-Tracker-Browser-$version"
$stagingRoot = Join-Path ([System.IO.Path]::GetTempPath()) "dragon-tracker-browser-release"
$bundleRoot = Join-Path $stagingRoot $bundleName

if (-not $OutputDirectory) {
  $OutputDirectory = Join-Path $repoRoot "dist"
}

if (Test-Path -LiteralPath $stagingRoot) {
  Remove-Item -LiteralPath $stagingRoot -Recurse -Force
}

New-Item -ItemType Directory -Path $bundleRoot -Force | Out-Null
New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null

$appFiles = @(
  "index.html",
  "app.js",
  "sync-client.js",
  "styles.css"
)

foreach ($file in $appFiles) {
  Copy-Item -LiteralPath (Join-Path $repoRoot $file) -Destination $bundleRoot
}

Copy-Item -LiteralPath (Join-Path $repoRoot "assets") -Destination $bundleRoot -Recurse
Copy-Item -LiteralPath (Join-Path $repoRoot "Start Dragon Tracker Local.ps1") -Destination (Join-Path $bundleRoot "Start Dragon Tracker.ps1")
Copy-Item -LiteralPath (Join-Path $PSScriptRoot "Start Dragon Tracker.bat") -Destination $bundleRoot
Copy-Item -LiteralPath (Join-Path $PSScriptRoot "start-dragon-tracker.sh") -Destination $bundleRoot
Copy-Item -LiteralPath (Join-Path $PSScriptRoot "README-BROWSER.txt") -Destination $bundleRoot

$archivePath = Join-Path $OutputDirectory "$bundleName.zip"
if (Test-Path -LiteralPath $archivePath) {
  Remove-Item -LiteralPath $archivePath -Force
}

$tar = Get-Command tar.exe -ErrorAction SilentlyContinue
if ($tar) {
  & $tar.Source -a -c -f $archivePath -C $stagingRoot $bundleName
  if ($LASTEXITCODE -ne 0) {
    throw "tar.exe could not create the browser archive."
  }
} else {
  Compress-Archive -LiteralPath $bundleRoot -DestinationPath $archivePath -CompressionLevel Optimal
}
Remove-Item -LiteralPath $stagingRoot -Recurse -Force

Write-Host "Created $archivePath"
