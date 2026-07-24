param(
  [string]$TaskName = "Dragon Tracker Discord Bot"
)

$ErrorActionPreference = "Stop"
$node = Get-Command node -ErrorAction Stop
$botPath = Join-Path $PSScriptRoot "src\index.js"

if (-not (Test-Path -LiteralPath $botPath)) {
  throw "Could not find $botPath"
}

$action = New-ScheduledTaskAction -Execute $node.Source -Argument ('"{0}"' -f $botPath) -WorkingDirectory $PSScriptRoot
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

Write-Host "Dragon Tracker Discord bot service installed and started."
