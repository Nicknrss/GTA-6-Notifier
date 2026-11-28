@echo off
setlocal
cd /d "%~dp0"
title GTA 6 Notifier Desktop 3.1.1 - Instalacao
 echo =============================================
echo GTA 6 NOTIFIER DESKTOP 3.1.1
echo =============================================
node --version || goto :erro
npm --version || goto :erro
if exist node_modules rmdir /s /q node_modules
echo [1/3] Instalando pacotes sem scripts automaticos do npm...
npm install --ignore-scripts --no-audit --no-fund --include=dev
if errorlevel 1 goto :erro
echo [2/3] Instalando explicitamente o binario oficial do Electron...
node bootstrap-electron.js
if errorlevel 1 goto :erro
echo [3/3] Verificando o executavel...
node bootstrap-electron.js --verify-only
if errorlevel 1 goto :erro
echo.
echo SUCESSO. Execute npm start para abrir o aplicativo.
pause
exit /b 0
:erro
echo.
echo FALHA NA INSTALACAO. Copie a mensagem acima para suporte.
pause
exit /b 1
