$ErrorActionPreference = 'Stop'
$dir = 'C:\Users\mrdnd\Documents\ne\docs'
$jobs = @(
  @{ src = "$dir\database-erd.mmd";  out = "$dir\database-erd.png" },
  @{ src = "$dir\database-flow.mmd"; out = "$dir\database-flow.png" }
)
foreach ($j in $jobs) {
  $code = Get-Content -Raw $j.src
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($code)
  $b64 = [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+','-').Replace('/','_')
  $url = "https://mermaid.ink/img/$b64`?type=png&bgColor=ffffff"
  try {
    Invoke-WebRequest -Uri $url -OutFile $j.out -UseBasicParsing -TimeoutSec 60
    $size = (Get-Item $j.out).Length
    Write-Output ("OK  {0}  ({1} bytes)" -f (Split-Path $j.out -Leaf), $size)
  } catch {
    Write-Output ("FAIL {0}: {1}" -f (Split-Path $j.out -Leaf), $_.Exception.Message)
  }
}
