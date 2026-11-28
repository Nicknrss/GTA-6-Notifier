# GTA 6 Notifier — Histórico central compartilhado (base v2.0)

## Objetivo
Desktop e extensão leem o mesmo histórico publicado em `data/`. A importação inicial ocorre uma vez no servidor. Registros importados são marcados `historical: true` e `notify: false`; portanto, aparecem no painel, mas não disparam notificações retroativas.

## Importação inicial
1. Publique este pacote no repositório `Nicknrss/GTA-6-Notifier` (branch `main`).
2. Abra **Actions → GTA 6 Notifier — One-time Release History Import → Run workflow**.
3. Aguarde a execução terminar. O job pagina todos os Releases públicos dos repositórios identificados no tracker PortWatch e nos dados centrais, usando a API REST somente no servidor e somente nesta carga. O token `GITHUB_TOKEN` é fornecido pelo GitHub Actions.
4. Confira `data/github-releases.json` (`historicalImport.complete`, `releaseCount`, `errors`) e `data/history.json` (`historicalImportComplete`). Se houver erro, o workflow falha e informa quais repositórios não foram importados.

## Monitoramento contínuo
O workflow `central-monitor.yml` continua usando feeds Atom públicos (`https://github.com/OWNER/REPO/releases.atom`). Não foi alterado para usar a API REST. A carga histórica define `baselineComplete: true`; assim, o monitor contínuo adiciona apenas entradas novas ao conjunto central.

## Clientes
Os painéis desktop e extensão leem `history.json`, `github-releases.json` e `portwatch-leaderboard.json` de `raw.githubusercontent.com`. A lista central completa é combinada com eventos locais, sem enviar notificações ao importar o histórico. O desktop não limita mais a lista central aos 300 eventos.

## Limitações e validação
- A importação recupera todos os Releases públicos retornados pelo GitHub para repositórios descobertos. Repositórios privados, removidos ou inacessíveis serão listados como erro.
- A descoberta depende dos campos GitHub presentes no tracker PortWatch e da lista de repositórios já conhecida. Projetos sem vínculo GitHub verificável não podem ser consultados automaticamente.
- O workflow precisa ser publicado e executado no GitHub para gerar o histórico real. Este pacote não contém resultados de uma execução ao vivo.
