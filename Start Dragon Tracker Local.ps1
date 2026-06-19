$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Windows.Forms

$appDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 8765
$url = "http://localhost:$port/index.html"

function Test-TrackerPage {
  try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -ge 200 -and $response.Content -match "Dragon Tracker"
  } catch {
    return $false
  }
}

if (-not (Test-TrackerPage)) {
  $python = Get-Command python -ErrorAction SilentlyContinue
  $pythonArgs = @("-m", "http.server", "$port", "--bind", "127.0.0.1")

  if (-not $python) {
    $python = Get-Command py -ErrorAction SilentlyContinue
    $pythonArgs = @("-3", "-m", "http.server", "$port", "--bind", "127.0.0.1")
  }

  if (-not $python) {
    [System.Windows.Forms.MessageBox]::Show("Python is needed to start the local Dragon Tracker server.", "Dragon Tracker")
    exit 1
  }

  Start-Process -FilePath $python.Source -ArgumentList $pythonArgs -WorkingDirectory $appDir -WindowStyle Minimized

  for ($attempt = 0; $attempt -lt 20; $attempt += 1) {
    Start-Sleep -Milliseconds 300
    if (Test-TrackerPage) { break }
  }
}

Start-Process $url
