$ErrorActionPreference = 'Stop'

# Toggle only the Cue instance launched from this checkout.
$repo = Split-Path -Parent $PSScriptRoot
$electronPath = Join-Path $repo 'node_modules\electron\dist\MicrosoftEdgeUpdate.exe'

if (-not (Test-Path -LiteralPath $electronPath)) {
  [System.Windows.Forms.MessageBox]::Show(
    "Cue dependencies are missing. Run npm ci in:`n$repo",
    'Cue Toggle'
  ) | Out-Null
  exit 1
}

$cueProcesses = Get-CimInstance Win32_Process -Filter "Name = 'MicrosoftEdgeUpdate.exe'" |
  Where-Object {
    ($_.ExecutablePath -and ($_.ExecutablePath -ieq $electronPath)) -or
    ($_.CommandLine -and ($_.CommandLine -like "*$repo*"))
  }

if ($cueProcesses) {
  foreach ($process in $cueProcesses) {
    Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
  }
  exit 0
}

Start-Process -FilePath $electronPath -ArgumentList @('.') -WorkingDirectory $repo
