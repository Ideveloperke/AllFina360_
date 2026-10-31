<#
.SYNOPSIS
  Start or stop AllFina's local services on Windows without Docker.

.DESCRIPTION
  Postgres  - the installed Windows service (postgresql-x64-*), started if stopped
  Redis     - redis-server.exe on 127.0.0.1:6379
  SeaweedFS - weed.exe with its S3 API on 127.0.0.1:9000 (the recordings bucket is created if missing)

  Services that are already listening are left alone. Logs and PIDs go to $env:ALLFINA_DEV_HOME\logs and \pids
  (default: ~\.allfina-dev).

.EXAMPLE
  pnpm services:up            # start services
  pnpm services:up -- -Apps   # start services, then run web + api + ai-service (pnpm dev)
  pnpm services:down          # stop Redis and SeaweedFS started by this script
#>
param(
  [switch]$Apps,
  [switch]$Stop
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent $PSScriptRoot
$DevHome = if ($env:ALLFINA_DEV_HOME) { $env:ALLFINA_DEV_HOME } else { Join-Path $HOME '.allfina-dev' }
$WeedDir = if ($env:ALLFINA_SEAWEEDFS_DIR) { $env:ALLFINA_SEAWEEDFS_DIR } else { Join-Path $DevHome 'seaweedfs' }
$RedisExe = if ($env:ALLFINA_REDIS_EXE) { $env:ALLFINA_REDIS_EXE } else { 'C:\ProgramData\chocolatey\lib\redis\tools\redis-server.exe' }
$PidDir = Join-Path $DevHome 'pids'
$LogDir = Join-Path $DevHome 'logs'
New-Item -ItemType Directory -Force -Path $PidDir, $LogDir | Out-Null

function Test-Port([int]$Port) {
  $client = [System.Net.Sockets.TcpClient]::new()
  try { return $client.ConnectAsync('127.0.0.1', $Port).Wait(300) -and $client.Connected }
  catch { return $false }
  finally { $client.Dispose() }
}

function Wait-Port([int]$Port, [string]$Name, [int]$TimeoutSec = 60) {
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while (-not (Test-Port $Port)) {
    if ((Get-Date) -gt $deadline) { throw "$Name did not start on port $Port within ${TimeoutSec}s. Check the logs in $LogDir." }
    Start-Sleep -Milliseconds 500
  }
}

# Launch through WMI so the service inherits none of this shell's handles. With Start-Process,
# anything capturing this script's output (pipes, CI) would wait until the services exit.
# Each service writes its own log file instead.
function Start-Background([string]$Name, [string]$Exe, [string[]]$ArgList, [string]$WorkDir) {
  $quoted = $ArgList | ForEach-Object { if ($_ -match '\s') { '"{0}"' -f $_ } else { $_ } }
  $cmdLine = ('"{0}" {1}' -f $Exe, ($quoted -join ' '))
  $result = Invoke-CimMethod -ClassName Win32_Process -MethodName Create `
    -Arguments @{ CommandLine = $cmdLine; CurrentDirectory = $WorkDir }
  if ($result.ReturnValue -ne 0) { throw "Could not start $Name (Win32_Process.Create returned $($result.ReturnValue))" }
  Set-Content -Path (Join-Path $PidDir "$Name.pid") -Value $result.ProcessId
  return $result.ProcessId
}

function Stop-Background([string]$Name, [string]$ProcessName) {
  $pidFile = Join-Path $PidDir "$Name.pid"
  if (-not (Test-Path $pidFile)) { Write-Host "  $Name : not started by this script"; return }
  $procId = [int](Get-Content $pidFile)
  # Only stop the PID if it's still the process we started (PIDs get reused).
  $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
  if ($proc -and $proc.ProcessName -eq $ProcessName) {
    Stop-Process -Id $procId -Force
    Write-Host "  $Name : stopped (pid $procId)"
  } else {
    Write-Host "  $Name : was not running"
  }
  Remove-Item $pidFile -Force
}

if ($Stop) {
  Write-Host 'Stopping AllFina dev services...'
  Stop-Background 'redis' 'redis-server'
  Stop-Background 'seaweedfs' 'weed'
  Write-Host '  postgres : left running (Windows service)'
  exit 0
}

Write-Host 'Starting AllFina dev services...'

# --- Postgres (Windows service) ---
$pg = Get-Service -Name 'postgresql*' -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $pg) {
  Write-Warning 'No PostgreSQL Windows service found. Set DATABASE_URL in .env to a reachable Postgres with pgvector.'
} elseif ($pg.Status -ne 'Running') {
  Write-Host "  postgres : starting service $($pg.Name) (needs an admin shell)"
  Start-Service $pg.Name
} else {
  Write-Host "  postgres : running ($($pg.Name))"
}

# --- Redis ---
if (Test-Port 6379) {
  Write-Host '  redis    : already listening on 6379'
} else {
  if (-not (Test-Path $RedisExe)) { throw "redis-server.exe not found at $RedisExe. Install it with 'choco install redis' or set ALLFINA_REDIS_EXE." }
  $redisPid = Start-Background 'redis' $RedisExe @(
    '--port', '6379', '--bind', '127.0.0.1', '--save', '""', '--appendonly', 'no',
    '--logfile', (Join-Path $LogDir 'redis.log')
  ) $DevHome
  Wait-Port 6379 'Redis'
  Write-Host "  redis    : started (pid $redisPid)"
}

# --- SeaweedFS (S3 on 9000) ---
if (Test-Port 9000) {
  Write-Host '  s3       : already listening on 9000'
} else {
  $weed = Join-Path $WeedDir 'weed.exe'
  $s3Config = Join-Path $WeedDir 's3.json'
  if (-not (Test-Path $weed)) { throw "weed.exe not found in $WeedDir. Download SeaweedFS (windows_amd64.zip) or set ALLFINA_SEAWEEDFS_DIR." }
  if (-not (Test-Path $s3Config)) { throw "S3 credentials file missing: $s3Config" }
  New-Item -ItemType Directory -Force -Path (Join-Path $WeedDir 'data') | Out-Null
  $weedPid = Start-Background 'seaweedfs' $weed @(
    "-logdir=$LogDir", 'server', '-ip=127.0.0.1', '-ip.bind=127.0.0.1', '-dir=data',
    '-master.port=9333', '-volume.port=8081', '-volume.max=5',
    '-filer', '-filer.port=8888', '-s3', '-s3.port=9000', "-s3.config=$s3Config"
  ) $WeedDir
  Wait-Port 9000 'SeaweedFS S3' 90
  Write-Host "  s3       : started (pid $weedPid)"
}

# Create the recordings bucket and its CORS rule if they're missing (safe to re-run).
Push-Location $RepoRoot
try { node scripts/ensure-bucket.cjs } finally { Pop-Location }

Write-Host ''
Write-Host 'Services ready. Postgres :5432  Redis :6379  S3 :9000'

if ($Apps) {
  Write-Host 'Starting apps (web :3000, api :4000, ai-service :8000). Press Ctrl+C to stop.'
  Push-Location $RepoRoot
  try {
    # Use the global pnpm if present (corepack enable), otherwise the version pinned in package.json.
    if (Get-Command pnpm -ErrorAction SilentlyContinue) { pnpm dev } else { npx -y pnpm@10.15.0 dev }
  } finally { Pop-Location }
} else {
  Write-Host 'Next: pnpm dev   (then open http://localhost:3000)'
}
