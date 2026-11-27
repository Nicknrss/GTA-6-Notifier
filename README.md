# GTA Notifier 1.0.0

**English | Português**

A community project for tracking new GitHub Releases and PortWatch VI progress and leaderboard changes related to the GTA VI PC community. The repository contains browser extensions, an installable PWA, a central GitHub Actions monitor, public JSON datasets, and an optional Cloudflare Worker for Web Push delivery.

Um projeto comunitário para acompanhar novos Releases do GitHub e mudanças de progresso e ranking do PortWatch VI relacionadas à comunidade de GTA VI no PC. O repositório contém extensões de navegador, uma PWA instalável, um monitor central via GitHub Actions, conjuntos de dados JSON públicos e um Cloudflare Worker opcional para entrega de notificações Web Push.

**Version / Versão: 1.0.0**  
**Author / Autor: Nicknrss**

---

## Features | Funcionalidades

### GitHub Releases
- Monitors the eight repositories listed in `data/github-releases.json` through their public Atom release feeds.
- Detects new feed entries only; it does not monitor commits or edits to older releases.
- The first run establishes a silent baseline, avoiding notifications for old items.
- The browser extension polls locally while the browser is open. The central workflow runs on GitHub Actions on its configured schedule.

### PortWatch VI
- Reads the public PortWatch VI tracker.
- Tracks entries with `tier: "tracked"` that are not marked `nuked`.
- Records score changes, ranking position, entries/exits, and leaderboard leadership.
- The central monitor stores progress, leaderboard, and event history in `data/`.

### Dashboard and notifications
- Browser dashboard with overview, source health, searchable history, repository details, progress chart, settings, and diagnostics.
- Separate controls for system notifications and Discord alerts, by event category.
- Optional Discord webhook configured by the user.
- The browser must remain open for extension alarms and local browser notifications.

### PWA
- Installable mobile companion that reads the public JSON datasets from `data/`.
- Refreshes while open and includes overview, history, repositories, ranking, progress, preferences, and diagnostics.
- Background Web Push requires the optional Cloudflare Worker and VAPID configuration described in `pwa/README.md`.

### Browser support
- Chromium Manifest V3: Chrome, Brave, and compatible browsers.
- Separate Firefox extension manifest.
- Application interface translations: Portuguese, English, German, French, Spanish, and Italian; unsupported browser languages fall back to English.

## Repository layout | Estrutura do repositório

- `extension/chromium/` — Chrome/Brave and Chromium extension.
- `extension/firefox/` — Firefox extension.
- `pwa/` — installable Progressive Web App.
- `scripts/monitor.py` — central GitHub Releases and PortWatch collector.
- `.github/workflows/central-monitor.yml` — scheduled central monitor workflow.
- `data/` — public JSON datasets for releases, events, progress, and leaderboard.
- `cloudflare/push-worker/` — optional Web Push delivery Worker.
- `assets/` — project artwork and logo.

## Install the browser extension | Instalar a extensão

### Chrome / Brave
1. Download and extract this repository to a permanent folder.
2. Open `chrome://extensions` or `brave://extensions`.
3. Enable **Developer mode**.
4. Select **Load unpacked** and choose `extension/chromium/`.
5. Grant the requested site access for GitHub and PortWatch VI.

### Firefox
1. Open `about:debugging`.
2. Select **This Firefox** and **Load Temporary Add-on**.
3. Choose `extension/firefox/manifest.json`.
4. Temporary add-ons may need to be loaded again after Firefox restarts. Permanent distribution requires packaging/signing according to Mozilla's rules.

## Central monitor setup | Configuração do monitor central

The central monitor runs `scripts/monitor.py` through GitHub Actions and updates the JSON files under `data/`. Review `.github/workflows/central-monitor.yml` before changing its schedule or permissions.

O monitor central executa `scripts/monitor.py` pelo GitHub Actions e atualiza os arquivos JSON em `data/`. Revise `.github/workflows/central-monitor.yml` antes de alterar o agendamento ou as permissões.

1. In the repository, open **Settings → Actions → General**.
2. Under **Workflow permissions**, allow the workflow to read and write repository contents, then save.
3. Open **Actions → GTA 6 Notifier — Central Monitor** and run the workflow once manually.
4. The first execution creates a silent baseline. Later runs record new events and update the central datasets.
5. Scheduled workflow execution is best-effort; GitHub may delay scheduled runs.

1. No repositório, abra **Settings → Actions → General**.
2. Em **Workflow permissions**, permita que o workflow leia e grave o conteúdo do repositório e salve.
3. Abra **Actions → GTA 6 Notifier — Central Monitor** e execute o workflow manualmente uma vez.
4. A primeira execução cria uma linha de base silenciosa. As seguintes registram novos eventos e atualizam os dados centrais.
5. A execução agendada é best-effort; o GitHub pode atrasar workflows programados.

## Discord notifications | Notificações do Discord

The central workflow and browser extension have distinct notification paths. The extension's Discord webhook is configured locally in its dashboard. If the central workflow configuration in your copy uses a repository secret named `DISCORD_WEBHOOK_URL`, add that secret only when the workflow actually references it. Never commit webhook URLs or tokens.

O workflow central e a extensão possuem caminhos de notificação distintos. O webhook do Discord da extensão é configurado localmente no painel. Se a configuração do workflow central desta cópia usar o secret `DISCORD_WEBHOOK_URL`, adicione esse secret somente quando o workflow realmente fizer referência a ele. Nunca envie URLs de webhook ou tokens ao repositório.

## PWA and Web Push | PWA e Web Push

The PWA can read the public repository datasets without a separate backend. Actual push delivery while the PWA is closed is optional and requires deployment/configuration of `cloudflare/push-worker`, a Cloudflare KV namespace, VAPID keys, and the GitHub Actions variables/secrets described in `pwa/README.md`.

A PWA pode ler os conjuntos de dados públicos do repositório sem backend separado. A entrega real de notificações push com a PWA fechada é opcional e exige publicar/configurar `cloudflare/push-worker`, um namespace KV da Cloudflare, chaves VAPID e as variáveis/secrets do GitHub Actions descritos em `pwa/README.md`.

## Privacy and security | Privacidade e segurança

- Local browser history and preferences are stored in the browser profile.
- Public datasets committed to `data/` are visible to anyone with repository access.
- Never commit Discord webhook URLs, GitHub personal access tokens, private VAPID keys, or dispatch secrets.
- Browser alarms and local extension notifications depend on the browser being open and on operating-system notification settings.

- O histórico e as preferências locais ficam armazenados no perfil do navegador.
- Os dados públicos enviados para `data/` ficam visíveis a qualquer pessoa com acesso ao repositório.
- Nunca envie URLs de webhook do Discord, tokens de acesso pessoal do GitHub, chaves VAPID privadas ou secrets de despacho.
- Os alarmes e as notificações locais da extensão dependem do navegador aberto e das configurações de notificação do sistema operacional.

## Credits | Créditos

Created and maintained by **Nicknrss**.  
Criado e mantido por **Nicknrss**.

Repository: https://github.com/Nicknrss/GTA-6-Notifier

**GTA Notifier 1.0.0**
