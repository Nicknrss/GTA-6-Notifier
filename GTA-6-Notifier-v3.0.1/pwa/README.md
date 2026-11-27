# GTA 6 Notifier — painel mobile completo

A PWA usa os mesmos dados centrais do painel da extensão, publicados em `data/` no repositório GitHub:

- `history.json` — histórico central de eventos;
- `github-releases.json` — releases e os oito repositórios monitorados;
- `portwatch-progress.json` — progresso e checkpoints;
- `portwatch-leaderboard.json` — ranking atual e histórico do ranking.

O painel mobile inclui visão geral, histórico pesquisável, oito repositórios, ranking, gráfico de progresso, preferências locais, Discord individual e diagnóstico. Ele sincroniza ao abrir e a cada 60 segundos enquanto estiver aberto.

## Web Push com a PWA fechada

A entrega em segundo plano usa um Cloudflare Worker separado. O Service Worker da PWA já recebe eventos `push` e mostra a notificação; para ativar a entrega real, é necessário publicar `cloudflare/push-worker`, configurar as chaves VAPID e apontar `PUSH_API_BASE` em `app.js` para a URL publicada do Worker.

### Configurar Cloudflare

1. Instale Node.js LTS e npm no computador.
2. No terminal, entre em `cloudflare/push-worker` e execute `npm install`.
3. Gere um par VAPID uma única vez: `node scripts/generate-vapid.mjs`. Guarde a chave pública e a privada em local seguro. Não publique a chave privada.
4. Crie um KV namespace chamado `gta6-notifier-subscriptions` no Cloudflare e copie o ID para `wrangler.toml` no lugar de `COLE_AQUI_O_ID_DO_KV_NAMESPACE`.
5. Ajuste `APP_ORIGIN` para a origem HTTPS exata do GitHub Pages (somente origem, sem `/pwa`). Ajuste `VAPID_SUBJECT` para um e-mail de contato válido e `PWA_URL` para a URL completa da PWA publicada (incluindo `/pwa/`).
6. Configure os secrets do Worker:
   - `npx wrangler secret put VAPID_PUBLIC_KEY`
   - `npx wrangler secret put VAPID_PRIVATE_KEY`
   - `npx wrangler secret put DISPATCH_SECRET` (use uma senha aleatória longa).
7. Publique: `npx wrangler deploy`.
8. Copie a URL `https://...workers.dev` gerada e coloque-a em `PUSH_API_BASE` no início de `pwa/app.js`.
9. No GitHub, em Settings → Secrets and variables → Actions, crie:
   - Variable `PUSH_WORKER_URL`: URL do Worker sem barra final;
   - Secret `PUSH_DISPATCH_SECRET`: exatamente o mesmo valor configurado no Worker.
10. Publique os arquivos atualizados do projeto. No celular, abra a PWA, vá a Configurações e toque em **Ativar notificações neste celular**.

A primeira chamada `/dispatch` cria uma linha de base silenciosa para não disparar notificações antigas. As próximas execuções enviam apenas eventos novos, sem repetir IDs já processados. O workflow chama o Worker somente quando a variável e o secret do GitHub estiverem configurados.

## Teste

Depois de configurar tudo, o endpoint `/health` do Worker deve retornar `ok: true`. Ative Push na PWA e use **Enviar notificação de teste**. Faça o teste com o app em primeiro plano, depois fechado e por fim com a tela bloqueada. O aparelho precisa estar conectado à internet, ter permissão de notificações e não pode restringir excessivamente a atividade em segundo plano.

## Observações

- O GitHub continua sendo a fonte dos dados; a Cloudflare é somente o serviço de entrega Push.
- O Push funciona com a PWA fechada porque o navegador/sistema operacional acorda o Service Worker para processar o evento. A entrega pode sofrer atrasos por economia de bateria, conectividade ou políticas do sistema.
- No iPhone, Web Push para sites é suportado para web apps adicionados à Tela de Início em iOS/iPadOS 16.4 ou posterior.
- Não coloque a chave VAPID privada, o segredo de despacho ou URLs privadas de webhook nos arquivos públicos do repositório.
