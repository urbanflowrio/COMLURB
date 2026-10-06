# Chamados 1746 | HUB COMLURB

Painel executivo dos Chamados 1746 no padrão HUB COMLURB.

## Corte e atualização

- Competência mais recente: setembro/2026
- Data de corte deste pacote: 05/10/2026
- Comparação acumulada: janeiro a setembro de 2026 x janeiro a setembro de 2025
- Regra histórica: janeiro a agosto permanece congelado conforme os fechamentos anteriores; setembro foi incorporado como nova competência.
- Retificações retroativas devem ser registradas e autorizadas separadamente, sem reprocessamento silencioso do histórico fechado.

## Publicação
O arquivo público do módulo é `index.html`.

URL esperada no GitHub Pages:
`/COMLURB/chamados-1746/`

Para atualizações futuras, publique em conjunto `index.html`, `chamados_data.js`, `chamados_cube.js` e `data-cutoff.json`.

Não substitua somente o HTML, pois os dados e os cubos são arquivos separados.

## Arquitetura dos dados

- `chamados_cube.js`: fonte analítica canônica dos totais, séries, tipos, subtipos, gerências, áreas de planejamento e bairros.
- `chamados_data.js`: contém exclusivamente o GeoJSON usado no mapa. Os agregados antigos foram retirados para eliminar duplicação de números.
- `data-cutoff.json`: registra competência, corte, congelamento histórico e ressalvas de qualidade.

## Qualidade conhecida

Os totais e a série oficial de setembro foram preservados. Setembro/2026 possui cobertura de AP de 100%. No acumulado, os registros de agosto sem AP permanecem congelados e são representados como `SEM AP (AGO)`. A comparação acumulada dos subtipos de PAPELEIRA não é homogênea entre Jan–Jul e Ago–Set. Revisões retroativas permanecem fora da série oficial.
