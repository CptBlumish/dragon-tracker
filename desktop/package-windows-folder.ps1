$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$dist = Join-Path $projectRoot "dist"
$unpacked = Join-Path $dist "win-unpacked"
$packageRoot = Join-Path $dist "Dragon Tracker"
$zipPath = Join-Path $dist "Dragon Tracker.zip"

if (!(Test-Path -LiteralPath (Join-Path $unpacked "Dragon Tracker.exe"))) {
  throw "Build the Windows unpacked app before creating the folder package."
}

if (Test-Path -LiteralPath $packageRoot) {
  Remove-Item -LiteralPath $packageRoot -Recurse -Force
}

New-Item -ItemType Directory -Path $packageRoot | Out-Null
Copy-Item -LiteralPath $unpacked -Destination (Join-Path $packageRoot "Dragon Tracker") -Recurse
Copy-Item -LiteralPath (Join-Path $PSScriptRoot "install-windows.ps1") -Destination (Join-Path $packageRoot "install-windows.ps1")
Copy-Item -LiteralPath (Join-Path $PSScriptRoot "Install Dragon Tracker.bat") -Destination (Join-Path $packageRoot "Install Dragon Tracker.bat")
Copy-Item -LiteralPath (Join-Path $PSScriptRoot "Run Dragon Tracker.bat") -Destination (Join-Path $packageRoot "Run Dragon Tracker.bat")
Copy-Item -LiteralPath (Join-Path $PSScriptRoot "README Windows Folder App.txt") -Destination (Join-Path $packageRoot "README Windows Folder App.txt")

if (Test-Path -LiteralPath $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

Compress-Archive -Path (Join-Path $packageRoot "*") -DestinationPath $zipPath -Force
Write-Host "Created $zipPath"
