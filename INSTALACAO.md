# GTA 6 Notifier 3.0 — pacote de integração central

Este pacote adiciona monitoramento central pelo GitHub Actions, histórico público consolidado e leitura do histórico pela PWA. O envio ao Discord é individual, configurado em cada instalação da extensão.

## Arquivos deste pacote

- `scripts/monitor.py` → monitor central (8 feeds Atom + PortWatch).
- `.github/workflows/monitor-central.yml` → execução agendada a cada 5 minutos.
- `pwa/app.js` → PWA lê os quatro JSONs públicos e atualiza a cada 60 segundos enquanto aberta.
- `pwa/README.md` → limitações e publicação.

## Instalação no repositório

Copie os arquivos preservando exatamente estes caminhos:

1. `scripts/monitor.py`
2. `.github/workflows/monitor-central.yml`
3. Substitua `pwa/app.js`
4. Substitua `pwa/README.md`

Os quatro arquivos JSON já existentes em `data/` serão atualizados automaticamente pelo monitor. Não os apague.

## Configuração individual do Discord (cada usuário)

O backend central **não envia mensagens ao Discord** e não usa segredo `DISCORD_WEBHOOK_URL` no GitHub.

Cada pessoa deve criar/configurar o webhook no canal de destino:

1. Abra o servidor Discord e entre no canal desejado.
2. Clique em **Editar canal** (engrenagem) → **Integrações** → **Webhooks**.
3. Crie um webhook, confirme o canal de destino e copie a URL.
4. Na extensão GTA 6 Notifier, abra as configurações de Discord, cole a URL,
   ative os alertas e salve.
5. Clique em **Testar Discord** para confirmar o envio.

A URL fica somente no armazenamento local da extensão naquele navegador/perfil.
Nunca envie essa URL ao repositório, ao GitHub Actions ou a outras pessoas.

## Ativar o monitor

- Abra Settings → Actions → General.
- Em Workflow permissions, permita `Read and write permissions`.
- Salve.
- Abra Actions → `GTA 6 Notifier - Central Monitor` → Run workflow para executar a primeira leitura.
- A primeira execução cria a linha de base silenciosa; ela não dispara notificações retroativas.
- Depois disso, o agendamento roda a cada 5 minutos (o GitHub pode atrasar execuções agendadas).

## Comportamento

- GitHub: apenas novos Releases dos oito repositórios cadastrados em `data/github-releases.json`.
- PortWatch: apenas `efforts[]` com `tier: "tracked"` e sem `nuked`.
- Ranking: detecta alteração de pontuação, entrada/saída, posição e liderança.
- Progresso geral: pontuação do líder atual, mantendo a regra já usada no código da extensão.
- Histórico: IDs estáveis evitam duplicação em novas tentativas; `history.json` não é truncado em 300 eventos.
- Discord: a extensão de cada usuário envia eventos ao webhook configurado localmente por ele. O monitor central não envia mensagens ao Discord.
- PWA: sincroniza o histórico central e faz polling enquanto estiver aberta.

## O que continua exigindo serviço externo

Push real com a PWA fechada não é possível apenas com GitHub Pages/Actions. Para isso será necessário um endpoint HTTPS de Web Push e chaves VAPID. Esta entrega não finge que esse serviço já existe.

## Segurança e observações

- Nunca publique webhook, PAT, chave VAPID privada ou credenciais.
- O histórico central é público porque está no repositório público.
- GitHub Actions é agendado, não um servidor contínuo; `*/5` é a frequência solicitada, não uma garantia de execução exata.
- A extensão 2.2.0 continua monitorando localmente em 1 minuto enquanto o navegador está aberto. Este monitor central é independente e não substitui nem remove essa função.
