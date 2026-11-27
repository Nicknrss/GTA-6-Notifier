# GTA 6 Notifier 3.0 — pacote de integração central

Este pacote adiciona monitoramento central pelo GitHub Actions, histórico público consolidado, envio de eventos ao Discord e leitura do histórico pela PWA.

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

## Configuração obrigatória do Discord

No GitHub:
Settings → Secrets and variables → Actions → New repository secret

Nome: `DISCORD_WEBHOOK_URL`
Valor: URL completa do webhook do canal Discord.

O webhook não deve ser colocado em arquivos do repositório.

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
- Discord: envia cada evento novo das categorias Releases, ranking e progresso geral.
- PWA: sincroniza o histórico central e faz polling enquanto estiver aberta.

## O que continua exigindo serviço externo

Push real com a PWA fechada não é possível apenas com GitHub Pages/Actions. Para isso será necessário um endpoint HTTPS de Web Push e chaves VAPID. Esta entrega não finge que esse serviço já existe.

## Segurança e observações

- Nunca publique webhook, PAT, chave VAPID privada ou credenciais.
- O histórico central é público porque está no repositório público.
- GitHub Actions é agendado, não um servidor contínuo; `*/5` é a frequência solicitada, não uma garantia de execução exata.
- A extensão 2.2.0 continua monitorando localmente em 1 minuto enquanto o navegador está aberto. Este monitor central é independente e não substitui nem remove essa função.
