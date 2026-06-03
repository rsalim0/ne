$ErrorActionPreference = 'Stop'
Set-Location 'C:\Users\mrdnd\Documents\ne'
git add -A
$msg = @'
feat: COSS UI redesign of auth, dashboard, and CRUD forms

- Adopt COSS UI (Base UI + Tailwind v4) alongside the existing system; map
  tokens so the fire-red brand and untouched pages keep working
- Auth: standalone /login and /register pages (no card chrome, no switcher),
  inline zod validation, password show/hide + strength meter; restyle
  forgot/reset password
- Dashboard: COSS cards, KPI stats, hand-rolled SVG donut + bar charts
- Extinguishers / Inspections / Maintenance / Users: dialog-based create &
  edit, COSS Select dropdowns, COSS DatePicker with past/future constraints,
  stronger client + server validation
- Add docs/DATABASE.md with Mermaid ER + data-flow diagrams and rendered PNGs

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
'@
git commit -m $msg
Write-Output '----- PUSH -----'
git push
Write-Output ('HEAD: ' + (git rev-parse --short HEAD))
