$ErrorActionPreference = "Stop"

$sourceApp = Join-Path $PSScriptRoot "Dragon Tracker"
$targetApp = Join-Path $env:LOCALAPPDATA "Dragon Tracker"
$targetExe = Join-Path $targetApp "Dragon Tracker.exe"

if (!(Test-Path -LiteralPath (Join-Path $sourceApp "Dragon Tracker.exe"))) {
  throw "Could not find the Dragon Tracker app folder next to this installer script."
}

if (Test-Path -LiteralPath $targetApp) {
  Remove-Item -LiteralPath $targetApp -Recurse -Force
}

Copy-Item -LiteralPath $sourceApp -Destination $targetApp -Recurse

$desktop = [Environment]::GetFolderPath("DesktopDirectory")
$shortcutPath = Join-Path $desktop "Dragon Tracker.lnk"
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $targetExe
$shortcut.WorkingDirectory = $targetApp
$shortcut.IconLocation = "$targetExe,0"
$shortcut.Description = "Dragon Tracker"
$shortcut.Save()

Start-Process -FilePath $targetExe -WorkingDirectory $targetApp
