$ErrorActionPreference = 'Continue'
Set-Location 'C:\Users\mrdnd\Documents\ne'
# Make sure no dev server is holding the .next dir / port.
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

Write-Output '===== BUILD ====='
npm run build 2>&1 | ForEach-Object { $_ }
$buildExit = $LASTEXITCODE
Write-Output ("BUILD EXIT: {0}" -f $buildExit)

Write-Output '===== LINT ====='
npm run lint 2>&1 | ForEach-Object { $_ }
$lintExit = $LASTEXITCODE
Write-Output ("LINT EXIT: {0}" -f $lintExit)
