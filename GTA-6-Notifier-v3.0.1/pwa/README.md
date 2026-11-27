# GTA 6 Notifier — PWA

O PWA é o painel móvel do GTA 6 Notifier. Ele consulta diretamente os quatro arquivos JSON públicos publicados no repositório GitHub:

- `data/history.json`
- `data/github-releases.json`
- `data/portwatch-progress.json`
- `data/portwatch-leaderboard.json`

O painel apresenta visão geral, histórico central, os oito repositórios monitorados, releases registrados e ranking individual do PortWatch VI. A sincronização ocorre ao abrir o aplicativo e a cada 60 segundos enquanto ele permanece aberto.

## Conexão e notificações

Não existe configuração de Cloud Connection, API Endpoint ou chave VAPID neste PWA. A leitura dos dados é feita diretamente pelos arquivos JSON públicos do GitHub.

As notificações locais do navegador podem funcionar enquanto o PWA está aberto. Notificações push com o PWA fechado não fazem parte desta implementação; isso exigiria um serviço Web Push separado e chaves VAPID.

## Publicação

Com o GitHub Pages publicando a branch `main` a partir de `/(root)`, abra `/GTA-6-Notifier/pwa/` no navegador do celular. O projeto não deve conter tokens, webhooks ou outros segredos nos arquivos públicos.
