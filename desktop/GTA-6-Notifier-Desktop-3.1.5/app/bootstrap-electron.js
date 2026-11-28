'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const root = __dirname;
const electronDir = path.join(root, 'node_modules', 'electron');
const installScript = path.join(electronDir, 'install.js');
const electronExe = path.join(electronDir, 'dist', 'electron.exe');
function fail(message, code = 1) {
  console.error(`\n[GTA6 Desktop] ${message}`);
  console.error('[GTA6 Desktop] Confira sua conexão, proxy/antivírus e acesso a GitHub Releases.');
  process.exit(code);
}
if (!fs.existsSync(path.join(electronDir, 'package.json'))) fail('Pacote Electron ausente. Execute npm install primeiro.');
if (!fs.existsSync(electronExe)) {
  if (!fs.existsSync(installScript)) fail('Script oficial de instalação do Electron não encontrado. Reinstale as dependências.');
  console.log('[GTA6 Desktop] Baixando o binário oficial do Electron agora...');
  const env = { ...process.env };
  delete env.ELECTRON_SKIP_BINARY_DOWNLOAD;
  const result = spawnSync(process.execPath, [installScript], { cwd: root, env, stdio: 'inherit' });
  if (result.error) fail(`Não foi possível executar o instalador do Electron: ${result.error.message}`);
  if (result.status !== 0) fail(`O download do Electron terminou com código ${result.status}.`);
}
if (!fs.existsSync(electronExe)) fail(`O executável não foi criado: ${electronExe}`);
if (process.argv.includes('--verify-only')) {
  const v = spawnSync(electronExe, ['--version'], { cwd: root, encoding: 'utf8', windowsHide: true });
  if (v.status !== 0) fail('electron.exe existe, mas não conseguiu iniciar.');
  console.log(`[GTA6 Desktop] Electron pronto: ${(v.stdout || '').trim()}`);
} else {
  console.log('[GTA6 Desktop] Binário Electron instalado e verificado.');
}
