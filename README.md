# GTA 6 Notifier 2.2.0

Central de monitoramento multiplataforma para novos Releases do GitHub e progresso/ranking do PortWatch VI. Mantém a identidade visual neon rosa/roxo e os PNGs originais.

## Novidades da versão 2.2.0
- Dashboard completo em uma página própria: visão geral, saúde das fontes, histórico, detalhes dos repositórios, gráfico de evolução, configurações e diagnóstico.
- Histórico local com até 300 eventos recentes.
- Gráfico local com até 240 medições do progresso do líder PortWatch.
- Preferências de alertas independentes para notificações do sistema e Discord, por categoria.
- Diagnóstico de GitHub, PortWatch, Discord e API de notificações do navegador.
- Não redefine suas configurações quando a extensão é atualizada.
- PWA companion instalável incluída como base para sincronização móvel.

## Compatibilidade
- Chromium Manifest V3: Brave, Chrome e navegadores compatíveis em Windows e Linux.
- Manifesto Firefox separado (`manifest.firefox.json`) para Firefox em Windows e Linux.
- Notificações locais usam a API do navegador e são encaminhadas ao sistema operacional. No Linux, dependem de sessão gráfica e serviço de notificações ativo (GNOME/KDE etc.).
- O navegador precisa permanecer aberto para os alarmes da extensão.

## GitHub — somente novos Releases
- Monitora oito repositórios por feeds Atom públicos.
- Não utiliza a API REST do GitHub e, portanto, não consome sua cota REST.
- A primeira leitura estabelece uma linha de base silenciosa.
- Detecta apenas entradas novas no feed; não monitora commits nem edições de Releases antigos.
- Frequência padrão de 1 minuto; a execução real depende do agendador do navegador e da publicação do feed.

## PortWatch VI — progresso e ranking
- Lê o tracker público e considera apenas `efforts[]` com `tier: "tracked"` e não marcados como `nuked`.
- Acompanha pontuação individual, aumentos/quedas, entrada/saída, posição e liderança.
- Progresso geral é representado pela pontuação do líder atual, conforme a regra já usada no projeto.
- Ignora notícias, imagens, watchlist, DMCA, contagem regressiva e metadados.
- A primeira leitura estabelece uma linha de base silenciosa. A frequência de atualização depende do próprio PortWatch (dados de origem podem atualizar em ciclos de aproximadamente 3 horas).

## Dashboard e dados locais
Abra o popup e clique em **Abrir painel completo**, ou abra as opções da extensão. Histórico, medições, saúde das fontes e configurações ficam no armazenamento local do navegador e não são enviados a terceiros (exceto as mensagens de alerta para o webhook Discord que você configurar).

## Instalação — Brave/Chrome (Windows ou Linux)
1. Extraia o ZIP em uma pasta permanente.
2. Abra `brave://extensions` ou `chrome://extensions`.
3. Ative o Modo do desenvolvedor.
4. Clique em **Carregar sem compactação** e selecione a pasta que contém `manifest.json`.
5. Nas permissões de acesso a sites, permita o acesso ao GitHub e ao PortWatch para que os feeds possam ser consultados.

## Instalação — Firefox (Windows ou Linux)
O `manifest.firefox.json` é a variante do Firefox. Para carregamento temporário, copie-o/renomeie-o como `manifest.json` em uma pasta separada e use `about:debugging` → Este Firefox → Carregar extensão temporária. Para instalação permanente, a extensão precisa ser empacotada/assinada conforme as regras do Firefox.

## Notificações
- Notificações do sistema e Discord podem ser ativadas/desativadas separadamente.
- Cada canal possui controles próprios para Releases GitHub, ranking PortWatch e progresso geral.
- A API do navegador aceitar a solicitação não garante que o sistema operacional exibiu o aviso. No Windows, habilite notificações do navegador; no Linux, habilite o serviço de notificações do ambiente gráfico.

## Idiomas
Português, inglês, alemão, francês, espanhol e italiano são selecionados automaticamente pelo idioma preferido do navegador. Outros idiomas usam inglês.

## PWA companion — atenção
A pasta `pwa/` contém uma PWA instalável e com shell offline. Ela está preparada para conectar a um serviço HTTPS externo, sincronizar o estado e receber Web Push. **O backend remoto ainda não está incluído nem implantado**: sincronização entre dispositivos e push quando o app estiver fechado não funcionarão até configurar uma API e chaves VAPID. O contrato da API e os passos estão em `pwa/README.md`. A extensão e seu dashboard funcionam independentemente desse backend.

## Repositórios monitorados
`xcl-dev/xcl`, `Marvisak/VIctory`, `uiliannn/VItoriaBr`, `fxceless/victory-fork`, `stellarr-studio/kelvaroq`, `DexNom/VIctory`, `avatarmanz/VIctory-7900XTX`, `Belobug/VIctory-Belobug-AMD`.
