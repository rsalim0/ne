$ErrorActionPreference = 'Continue'
foreach ($path in @('/login', '/register')) {
  try {
    $r = Invoke-WebRequest -Uri "http://localhost:3000$path" -UseBasicParsing -TimeoutSec 90
    $ok = if ($r.Content -match 'Welcome back|Create your account|Sign in|Create account') { 'UI OK' } else { 'UI ?' }
    Write-Output ("{0}  HTTP {1}  len={2}  {3}" -f $path, $r.StatusCode, $r.Content.Length, $ok)
  } catch {
    $resp = $_.Exception.Response
    if ($resp) {
      Write-Output ("{0}  HTTP {1}  {2}" -f $path, [int]$resp.StatusCode, $_.Exception.Message)
    } else {
      Write-Output ("{0}  ERR  {1}" -f $path, $_.Exception.Message)
    }
  }
}
