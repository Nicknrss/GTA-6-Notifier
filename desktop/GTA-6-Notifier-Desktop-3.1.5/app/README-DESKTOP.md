# GTA 6 Notifier Desktop 3.1.3

## Escopo desta versão

Esta versão é uma candidata à publicação do aplicativo Windows. Ela mantém o monitor em processo Electron separado da janela, corrige a origem e a ordenação do gráfico de ranking PortWatch, mantém o diagnóstico de conectividade e restringe redirecionamentos de rede aos destinos HTTPS permitidos.

## Requisitos

- Windows 10 ou Windows 11 (64 bits) para gerar/instalar o pacote final.
- Node.js 20 ou superior e npm.
- Conexão à internet para baixar dependências e o binário oficial do Electron.

## Instalação para desenvolvimento

Abra o PowerShell nesta pasta (`GTA6-Desktop\app`) e execute:

```powershell
npm install
npm run verify-electron
npm start
```

O arquivo `.npmrc` mantém os scripts de ciclo de vida desativados durante a instalação. O `prestart` chama `bootstrap-electron.js`, que baixa e verifica o binário oficial do Electron explicitamente.

## Gerar o instalador Windows

```powershell
npm install
npm run dist
```

O instalador NSIS x64 será gerado em `release/`. Para conferir vulnerabilidades conhecidas das dependências, execute `npm run audit` em um ambiente com acesso ao registry npm.

## Funcionalidades preservadas

- Monitoramento GitHub e PortWatch em janela de serviço oculta, independente do painel.
- Bandeja do Windows, minimizar para bandeja e ação de verificação manual.
- Persistência local de configurações e histórico.
- Notificações nativas do Windows e teste de notificação.
- Webhook Discord configurável pelo usuário, com validação e teste.
- Diagnóstico de conectividade e estado dos canais.

## Estado de validação desta entrega

Verificações executadas neste ambiente: sintaxe dos arquivos JavaScript, consistência de versão entre `package.json` e `package-lock.json`, e integridade do arquivo ZIP. Não foi possível executar o instalador NSIS, confirmar a exibição das notificações no Windows, enviar um webhook real ou consultar o `npm audit`, pois o acesso ao registry npm estava indisponível (erro DNS `EAI_AGAIN`). Esses itens precisam ser validados em Windows com internet antes da publicação pública.

O webhook Discord é dado sensível e fica armazenado localmente no perfil do usuário. Não o inclua em logs, capturas de tela ou arquivos públicos.


## 3.1.4
- Added PortWatch project discovery for efforts/candidates; projects without a GitHub repository remain in a pending catalog.
- Added a manual GitHub release update check in the dashboard.
- Expanded background polling reliability and dynamic repository monitoring.
