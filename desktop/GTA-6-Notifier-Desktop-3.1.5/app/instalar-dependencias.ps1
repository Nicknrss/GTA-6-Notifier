$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$log = Join-Path (Get-Location) 'instalacao-electron.log'
Start-Transcript -Path $log -Append | Out-Null
try {
  Write-Host 'GTA 6 Notifier Desktop 3.1.2 - instalacao de dependencias' -ForegroundColor Cyan
  Write-Host "Node: $(node --version) | npm: $(npm --version)"
  if (-not (Test-Path 'package.json')) { throw 'Execute este script dentro da pasta GTA6-Desktop\app.' }
  npm install --include=dev
  if ($LASTEXITCODE -ne 0) { throw "npm install falhou com codigo $LASTEXITCODE. Consulte instalacao-electron.log." }
  Write-Host 'Baixando e verificando o binario oficial do Electron...' -ForegroundColor Yellow
  node ./bootstrap-electron.js --verify-only
  if ($LASTEXITCODE -ne 0) { throw "Verificacao do Electron falhou com codigo $LASTEXITCODE." }
  Write-Host 'SUCESSO: dependencias instaladas e Electron verificado.' -ForegroundColor Green
  Write-Host 'Agora execute: npm start'
}
catch {
  Write-Host "FALHA: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host "Log completo: $log" -ForegroundColor Yellow
  exit 1
}
finally { Stop-Transcript | Out-Null }
