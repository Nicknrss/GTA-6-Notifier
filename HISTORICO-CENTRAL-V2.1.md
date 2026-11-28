# GTA 6 Notifier — Central History v2.1

## Atualização desta versão

- Registra os 39 repositórios conhecidos no arquivo central `data/github-releases.json`.
- O monitor contínuo usa a lista central completa e continua consultando feeds Atom (`releases.atom`).
- A importação histórica continua sendo a única etapa que usa a API REST do GitHub.
- Se alguns repositórios falharem, os Releases obtidos com sucesso são gravados e o workflow não é interrompido com exit code 2. Os erros ficam registrados em `historicalImport.errors` para consulta posterior.
- A execução pode ser repetida: os Releases já importados são preservados e não são duplicados.

## Publicação

Envie o conteúdo desta pasta para a raiz de `Nicknrss/GTA-6-Notifier`, substituindo os arquivos correspondentes. Confirme que `scripts/import_release_history.py` e `scripts/monitor.py` estão na raiz dentro de `scripts/`, e que o workflow está em `.github/workflows/`. Depois execute o workflow de importação histórica.

A lista central passa a conter os 39 repositórios mesmo que alguns não tenham Releases ou estejam temporariamente inacessíveis.
