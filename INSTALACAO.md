# Installation and central integration | Instalação e integração central

**GTA Notifier 1.0.0**

## Central monitor | Monitor central

The repository includes `scripts/monitor.py` and `.github/workflows/central-monitor.yml`. The workflow collects public GitHub Release feeds and PortWatch VI data, then updates the JSON datasets under `data/`.

O repositório inclui `scripts/monitor.py` e `.github/workflows/central-monitor.yml`. O workflow coleta feeds públicos de Releases do GitHub e dados do PortWatch VI, depois atualiza os conjuntos JSON em `data/`.

## Enable Actions write permission | Ativar permissão de escrita do Actions

1. Open repository **Settings → Actions → General**.
2. Under **Workflow permissions**, allow read and write access to repository contents.
3. Save the setting.
4. Open **Actions → GTA 6 Notifier — Central Monitor** and run the workflow manually once.

1. Abra **Settings → Actions → General** no repositório.
2. Em **Workflow permissions**, permita leitura e escrita do conteúdo do repositório.
3. Salve a configuração.
4. Abra **Actions → GTA 6 Notifier — Central Monitor** e execute o workflow manualmente uma vez.

The first run establishes a silent baseline. Scheduled runs are best-effort and may be delayed by GitHub.

A primeira execução estabelece uma linha de base silenciosa. As execuções agendadas são best-effort e podem sofrer atrasos do GitHub.

## Discord | Discord

Configure Discord only through the settings described by the actual workflow or extension. Keep webhook URLs in local settings or GitHub/Cloudflare secrets, never in committed source files.

Configure o Discord somente pelas opções descritas no workflow ou na extensão. Mantenha URLs de webhook nas configurações locais ou em secrets do GitHub/Cloudflare, nunca em arquivos enviados ao repositório.

## Data behavior | Comportamento dos dados

- GitHub monitoring detects new Releases from the configured repositories. / O monitoramento do GitHub detecta novos Releases dos repositórios configurados.
- PortWatch tracking follows the filtering and scoring rules implemented in `scripts/monitor.py`. / O acompanhamento do PortWatch segue os filtros e regras de pontuação implementados em `scripts/monitor.py`.
- Stable event IDs are used to avoid duplicate history entries. / IDs estáveis são usados para evitar entradas duplicadas no histórico.
- The PWA reads the public datasets; background Web Push requires the optional Cloudflare Worker. / A PWA lê os dados públicos; Web Push em segundo plano exige o Cloudflare Worker opcional.

## Security | Segurança

Never commit personal access tokens, Discord webhook URLs, private VAPID keys, or dispatch secrets.

Nunca envie ao repositório tokens de acesso pessoal, URLs de webhook do Discord, chaves VAPID privadas ou segredos de despacho.

**Author / Autor: Nicknrss**
