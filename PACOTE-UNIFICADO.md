# GTA 6 Notifier — pacote unificado

Crédito: Nicknrss — https://github.com/Nicknrss
Repositório: https://github.com/Nicknrss/GTA-6-Notifier

## Componentes
- `scripts/monitor.py`: monitor central contínuo. GitHub somente por feeds Atom públicos (`releases.atom`).
- `scripts/import_release_history.py`: importação histórica única, executada manualmente no GitHub Actions; usa REST API apenas no servidor.
- `extension/chromium` e `extension/firefox`: extensão 1.0.9.
- `desktop/GTA-6-Notifier-Desktop-3.1.5/app`: fonte do Desktop 3.1.5.
- `pwa/`: PWA central.
- `data/`: histórico compartilhado e dados PortWatch.

## Publicação no GitHub
Envie o conteúdo desta pasta para a raiz do repositório `Nicknrss/GTA-6-Notifier`, preservando `.github/workflows/`. Não envie a pasta externa `GTA-6-Notifier-main` como subpasta.

Em Settings → Actions → General, confirme que workflows têm permissão de leitura e escrita de conteúdo. O workflow `central-monitor.yml` roda por agendamento e também pode ser iniciado manualmente. Execute uma vez `GTA 6 Notifier — One-time Release History Import` em Actions para importar Releases antigos. Depois confira `data/github-releases.json` e `data/history.json`.

A importação marca registros antigos como `historical: true` e `notify: false`. O monitor contínuo usa Atom e compara também a URL canônica para não disparar alertas de Releases já importados. Erros parciais ficam registrados em `historicalImport.errors` e podem ser revisados/reprocessados.

## Pacotes de cliente
Para instalar a extensão no Chrome/Brave, carregue sem compactação a pasta `extension/chromium`. Para Firefox, use `extension/firefox`. O Desktop é código-fonte Electron em `desktop/GTA-6-Notifier-Desktop-3.1.5/app`; este pacote não contém um instalador `.exe` compilado.

## Limites de validação
Os testes locais validam sintaxe, JSON, estrutura ZIP e regras de deduplicação. A execução real dos workflows e a importação GitHub só ficam comprovadas depois de publicar no repositório e executar as Actions.
