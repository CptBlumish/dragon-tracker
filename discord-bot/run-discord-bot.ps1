$ErrorActionPreference = "Continue"

$botDirectory = Split-Path -Parent $PSCommandPath
Set-Location -LiteralPath $botDirectory

while ($true) {
  Write-Host "[$(Get-Date -Format s)] Starting Dragon Tracker Discord bot."
  & npm.cmd run start
  Write-Host "[$(Get-Date -Format s)] Bot stopped. Retrying in 15 seconds."
  Start-Sleep -Seconds 15
}
