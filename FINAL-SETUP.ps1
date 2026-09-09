# ToolNest FINAL setup
# Run this file from the ToolNest project root in PowerShell.

npm install

# Clean old Next.js cache so stale Webpack modules cannot remain.
if (Test-Path .\.next) {
  Remove-Item -Recurse -Force .\.next
}

npx tsc --noEmit

if ($LASTEXITCODE -eq 0) {
  Write-Host "`nTypeScript check passed. Starting ToolNest..." -ForegroundColor Green
  npm run dev
} else {
  Write-Host "`nTypeScript check failed. Fix the error shown above before starting Next.js." -ForegroundColor Red
}
