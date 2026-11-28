## Version 1.0.8
- GitHub Releases monitored through public per-repository Atom feeds; no GitHub REST API polling.
- Compares only the newest Atom feed entry and keeps staggered repository polling.
- GitHub source health displays checked repositories against the dynamic monitored total (for example, 25/71).

# GTA 6 Notifier — Version 1.0.2

**Made by [Nicknrss](https://github.com/Nicknrss)** · [GitHub repository](https://github.com/Nicknrss/GTA-6-Notifier)

## English

GTA 6 Notifier monitors new GitHub Releases from the configured repositories and tracks PortWatch VI progress and rankings. It includes browser notifications, a dashboard, and optional Discord alerts.

### Install on Chromium browsers
1. Open `chrome://extensions` (or the equivalent extensions page in your browser).
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose this folder, the one containing `manifest.json`.

### Install on Firefox
Use the Firefox-specific manifest (`manifest.firefox.json`) only when packaging/loading the Firefox build. For temporary testing, open `about:debugging`, choose **This Firefox**, then **Load Temporary Add-on** and select `manifest.firefox.json`.

### Notes
- Scheduled checks require the browser to remain open.
- Discord alerts are optional and require your own webhook URL. Keep it private.
- The PWA files are included in `pwa/`.

## Português

O GTA 6 Notifier monitora novos Releases do GitHub nos repositórios configurados e acompanha o progresso e o ranking do PortWatch VI. Inclui notificações do navegador, painel de acompanhamento e alertas opcionais pelo Discord.

### Instalação em navegadores Chromium
1. Abra `chrome://extensions` (ou a página equivalente de extensões do seu navegador).
2. Ative o **Modo do desenvolvedor**.
3. Clique em **Carregar sem compactação**.
4. Selecione esta pasta, que contém o arquivo `manifest.json`.

### Instalação no Firefox
Use o manifesto específico do Firefox (`manifest.firefox.json`) somente para carregar/empacotar a versão Firefox. Para teste temporário, abra `about:debugging`, escolha **Este Firefox**, clique em **Carregar extensão temporária** e selecione `manifest.firefox.json`.

### Observações
- As verificações agendadas exigem que o navegador permaneça aberto.
- Os alertas do Discord são opcionais e exigem sua própria URL de webhook. Mantenha-a privada.
- Os arquivos da PWA estão incluídos em `pwa/`.

---

**Author / Autor:** [Nicknrss](https://github.com/Nicknrss)  
**Project / Projeto:** [GTA-6-Notifier](https://github.com/Nicknrss/GTA-6-Notifier)  
**Version / Versão:** 1.0.2


## Version 1.0.2 / Versão 1.0.2
- The dashboard Refresh button now requests a fresh background check before reloading the dashboard.
- Manual checks are queued if a scheduled check is already running, instead of being silently ignored.
- O botão Atualizar do painel agora solicita uma nova verificação em segundo plano antes de recarregar o painel.
- Verificações manuais ficam na fila quando uma verificação agendada já está em andamento, em vez de serem ignoradas.


## Version 1.0.2
- Synchronizes Recent Events with the central GitHub Releases feed, including releases not duplicated in history.json.
- Uses the shared PortWatch leaderboard as the chart fallback, matching the desktop app behavior.
- Keeps local event/progress history and merges it with central data instead of hiding it when the central event list is empty.
- Displays central data fetch errors in the dashboard.


## 1.0.3
- Added PortWatch project discovery for efforts/candidates; projects without a GitHub repository remain in a pending catalog.
- Added a manual GitHub release update check in the dashboard.
- Expanded background polling reliability and dynamic repository monitoring.


## 1.0.7
- Fixed the missing `discoverProjects()` function that caused GitHub monitoring to fail before checking repositories.
- Added PortWatch tracker discovery for efforts and candidates.
- Projects without a verified GitHub repository are retained as pending instead of aborting the monitoring cycle.
- Discovery errors are recorded separately; known repositories continue to be checked if PortWatch discovery is unavailable.


### 1.0.7
- Replaced unofficial GitHub REST API release feeds with the documented GitHub REST Releases endpoint.
- Treats an empty Releases array as a valid repository with no published Releases; 404 is shown as unavailable/private rather than a feed failure.
- Repository dashboard now lists all discovered and pending projects, not only the original eight.
- GitHub API checks are rotated one repository per polling cycle to avoid exhausting the unauthenticated hourly API quota.


## Version 1.0.7 — updater

- Checks the latest GitHub Release automatically when the dashboard opens.
- The Update button checks the release API and downloads a ZIP asset directly; it does not open the GitHub release page.
- Browser extensions cannot replace their own installed files. After downloading, install the update using the browser's extension manager (or the store when published there).
- If the Release has no ZIP asset, the updater downloads GitHub's source ZIP archive; that archive may need to be extracted and loaded manually.


## 1.0.7
- Checks only the newest published GitHub Release per repository.
- Sends at most one notification for a newly detected latest Release per repository.
- Counts detected Releases from the actual event history, not the total Release count in central metadata.
- Displays the dynamic monitored/checked repository totals instead of a hard-coded 8.
