# GTA 6 Notifier 3.0.1 — atualização e publicação

## Corrigido nesta versão
- O gráfico da extensão usa pontuações individuais do ranking PortWatch (sem média).
- Ordenação visual do gráfico: menor pontuação à esquerda/primeiro, maior à direita/último.
- A lista de ranking e o gráfico usam o mesmo snapshot de participantes.
- O ranking central do GitHub é preferido quando possui entradas; se estiver vazio ou indisponível, a extensão usa o ranking local do PortWatch.
- Arquivos JSON centrais são incluídos no repositório para impedir HTTP 404 após a publicação correta.
- Um arquivo central ausente/vazio não apaga os dados locais nem gera erro fatal no painel.

## Publicar no GitHub
1. Abra o repositório `Nicknrss/GTA-6-Notifier`, na branch `main`.
2. Envie o CONTEÚDO desta pasta para a raiz do repositório, mantendo as pastas `.github`, `data`, `extension`, `pwa` e `scripts` na raiz.
3. Confirme especialmente que `data/portwatch-leaderboard.json` foi enviado e que a URL pública `https://raw.githubusercontent.com/Nicknrss/GTA-6-Notifier/main/data/portwatch-leaderboard.json` abre um JSON (não 404).
4. Em Actions, execute `GTA 6 Notifier — Central Monitor` uma vez com `workflow_dispatch`; depois ele roda a cada 5 minutos.
5. Recarregue a extensão no gerenciador de extensões e abra o painel novamente.

## Importante
- Não envie a pasta externa `GTA-6-Notifier-main` como uma subpasta dentro do repositório: envie o conteúdo dela para a raiz.
- O workflow central precisa de permissão de escrita em Contents para gravar os JSONs.
- A extensão continua consultando PortWatch localmente a cada minuto; o backend central atualiza a cada cinco minutos.
- O gráfico só terá pontos quando o ranking tiver participantes disponíveis no backend ou na coleta local.
