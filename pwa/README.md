# GTA Notifier PWA 1.0.0

**English | Português**

The PWA reads the same central datasets published in the repository's `data/` directory:

A PWA lê os mesmos conjuntos de dados centrais publicados na pasta `data/` do repositório:

- `history.json` — central event history / histórico central de eventos.
- `github-releases.json` — releases and monitored repositories / releases e repositórios monitorados.
- `portwatch-progress.json` — progress measurements and checkpoints / medições de progresso e checkpoints.
- `portwatch-leaderboard.json` — current ranking and ranking history / ranking atual e histórico do ranking.

The mobile dashboard includes overview, searchable history, repository monitoring, ranking, progress chart, local preferences, individual Discord settings, and diagnostics. It refreshes on launch and every 60 seconds while open.

O painel mobile inclui visão geral, histórico pesquisável, monitoramento dos repositórios, ranking, gráfico de progresso, preferências locais, configurações individuais do Discord e diagnóstico. Atualiza ao abrir e a cada 60 segundos enquanto estiver aberto.

## Web Push while the PWA is closed | Web Push com a PWA fechada

Background delivery uses the separate Cloudflare Worker in `cloudflare/push-worker`. The PWA service worker handles incoming `push` events, but real delivery requires deploying the Worker and configuring VAPID.

A entrega em segundo plano usa o Cloudflare Worker separado em `cloudflare/push-worker`. O service worker da PWA processa eventos `push`, mas a entrega real exige publicar o Worker e configurar VAPID.

### Cloudflare setup | Configuração da Cloudflare

1. Install Node.js LTS and npm. / Instale Node.js LTS e npm.
2. In `cloudflare/push-worker`, run `npm install`. / Em `cloudflare/push-worker`, execute `npm install`.
3. Generate a VAPID pair using the generator provided by your deployment setup. Keep the private key secret. / Gere um par VAPID usando o gerador fornecido pela sua configuração de publicação. Mantenha a chave privada em segredo.
4. Create the KV namespace `gta6-notifier-subscriptions` and place its ID in `wrangler.toml`. / Crie o namespace KV `gta6-notifier-subscriptions` e coloque seu ID em `wrangler.toml`.
5. Set `APP_ORIGIN` to the exact HTTPS GitHub Pages origin, `VAPID_SUBJECT` to a valid contact address, and `PWA_URL` to the full published PWA URL. / Defina `APP_ORIGIN` com a origem HTTPS exata do GitHub Pages, `VAPID_SUBJECT` com um contato válido e `PWA_URL` com a URL completa da PWA publicada.
6. Configure the Worker secrets required by `cloudflare/push-worker/src/index.js`, including the VAPID private key and dispatch secret. Never put secret values in source files. / Configure os secrets exigidos por `cloudflare/push-worker/src/index.js`, incluindo a chave privada VAPID e o segredo de despacho. Nunca coloque valores secretos em arquivos-fonte.
7. Deploy with `npx wrangler deploy`. / Publique com `npx wrangler deploy`.
8. Set the PWA push API base URL in the configuration expected by `pwa/app.js`. / Defina a URL base da API Push da PWA conforme esperado em `pwa/app.js`.
9. Configure the GitHub Actions variables/secrets referenced by `.github/workflows/central-monitor.yml` and the Worker. / Configure as variáveis/secrets do GitHub Actions referenciados por `.github/workflows/central-monitor.yml` e pelo Worker.
10. Publish the updated files, open the PWA on the device, and enable notifications in its settings. / Publique os arquivos atualizados, abra a PWA no dispositivo e ative as notificações nas configurações.

The first dispatch should establish a silent baseline. Later runs should send only new events and avoid duplicate IDs, according to the Worker and workflow implementation.

O primeiro dispatch deve estabelecer uma linha de base silenciosa. As execuções seguintes devem enviar somente eventos novos e evitar IDs duplicados, conforme a implementação do Worker e do workflow.

## Test | Teste

Use the Worker health endpoint and the PWA's test notification control after deployment. Test with the PWA open, closed, and with the screen locked. Delivery depends on internet access, notification permission, browser support, and operating-system background policies.

Após a publicação, use o endpoint de saúde do Worker e o controle de notificação de teste da PWA. Teste com a PWA aberta, fechada e com a tela bloqueada. A entrega depende de internet, permissão de notificações, suporte do navegador e políticas de execução em segundo plano do sistema.

## Security | Segurança

Never commit private VAPID keys, dispatch secrets, GitHub tokens, or private webhook URLs.

Nunca envie ao repositório chaves VAPID privadas, segredos de despacho, tokens do GitHub ou URLs privadas de webhook.

**Version / Versão: 1.0.0**
