const fs = require('fs');
const path = require('path');
const exe = path.join(__dirname, 'node_modules', 'electron', 'dist', 'electron.exe');
if (process.argv.includes('--postinstall')) {
  if (!fs.existsSync(exe)) {
    console.error('[GTA6] electron.exe ainda nao existe. O script postinstall do Electron precisa ser autorizado pelo npm.');
    process.exitCode = 1;
  } else { console.log('[GTA6] Electron instalado:', exe); }
} else if (!fs.existsSync(exe)) {
  console.error('Electron nao instalado. Rode: npm install');
  process.exit(1);
} else {
  console.log('OK: electron.exe encontrado.');
}
