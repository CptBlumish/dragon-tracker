param(
  [string]$TaskName = "Dragon Tracker Discord Bot"
)

$ErrorActionPreference = "Stop"
$node = Get-Command node.exe -ErrorAction Stop
$botPath = Join-Path $PSScriptRoot "src\index.js"
$hiddenRunnerPath = Join-Path $PSScriptRoot "run-discord-bot-hidden.vbs"
$scriptHost = Join-Path $env:WINDIR "System32\wscript.exe"

if (-not (Test-Path -LiteralPath $botPath)) {
  throw "Could not find $botPath"
}

if (-not (Test-Path -LiteralPath $hiddenRunnerPath)) {
  throw "Could not find $hiddenRunnerPath"
}

if (-not (Test-Path -LiteralPath $scriptHost)) {
  throw "Could not find Windows Script Host at $scriptHost"
}

$action = New-ScheduledTaskAction -Execute $scriptHost -Argument ('"{0}" "{1}"' -f $hiddenRunnerPath, $node.Source) -WorkingDirectory $PSScriptRoot
$trigger = New-ScheduledTaskTrigger -AtLogOn -User "$env:USERDOMAIN\$env:USERNAME"
$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Days 3650) `
  -Hidden `
  -MultipleInstances IgnoreNew `
  -RestartCount 999 `
  -RestartInterval (New-TimeSpan -Minutes 1) `
  -StartWhenAvailable

Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Description "Keeps the Dragon Tracker Discord bot running while this user is signed in." `
  -Force | Out-Null
Start-ScheduledTask -TaskName $TaskName

Write-Host "Dragon Tracker Discord bot service installed and started without a console window."
