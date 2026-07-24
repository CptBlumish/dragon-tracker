$ErrorActionPreference = "Continue"

$botDirectory = Split-Path -Parent $PSCommandPath
$logDirectory = Join-Path $env:LOCALAPPDATA "Dragon Tracker"
$logPath = Join-Path $logDirectory "discord-bot.log"

New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null

function Write-RunnerLog([string]$Message) {
  Add-Content -LiteralPath $logPath -Value "[$(Get-Date -Format s)] $Message"
}

Set-Location -LiteralPath $botDirectory
$nodePath = (Get-Command node.exe -ErrorAction Stop).Source

while ($true) {
  Write-RunnerLog "Starting Dragon Tracker Discord bot."
  & $nodePath "src/index.js" *>&1 | ForEach-Object { Write-RunnerLog $_.ToString() }
  Write-RunnerLog "Bot stopped with exit code $LASTEXITCODE. Retrying in 15 seconds."
  Start-Sleep -Seconds 15
}
