# Ouvidoria | HUB COMLURB

Painel executivo interativo das ouvidorias operacionais da COMLURB.

## Escopo

- Comparação jan a ago/2026 x jan a ago/2025
- Recorte agosto/2026 x agosto/2025
- Análise restrita às ouvidorias operacionais
- Exclusão dos registros tratados internamente pela PCO
- Visão executiva, territorial e analítica
- Drill-down por tipo e subtipo
- Mapa por bairro, com AP e gerência no detalhamento

## Corte e atualização

- Competência mais recente: agosto/2026
- Data de corte deste pacote: 04/09/2026
- Regra histórica: janeiro a julho permanece conforme o fechamento anterior; agosto foi incorporado como nova competência.
- Retificações retroativas devem ser registradas e autorizadas separadamente, sem reprocessamento silencioso do histórico fechado.

## Publicação

O arquivo `index.html` é autônomo e deve ser publicado nesta pasta no GitHub Pages.

URL esperada:

`https://urbanflowrio.github.io/COMLURB/ouvidoria/`

Para atualizar o módulo, publique em conjunto `index.html`, `ouvidoria_data.js`, `ouvidoria_cube.js` e `data-cutoff.json`.

## Arquitetura dos dados

- `ouvidoria_cube.js`: fonte analítica canônica dos totais, séries, tipos, subtipos, gerências, áreas de planejamento e bairros.
- `ouvidoria_data.js`: contém exclusivamente o GeoJSON utilizado pelo mapa.
- `data-cutoff.json`: registra competência, corte, congelamento histórico e ressalvas de qualidade.

## Qualidade conhecida

Os totais, séries mensais, tipos, subtipos, gerências e bairros foram conciliados internamente sem divergência. A distribuição por área de planejamento não cobre a totalidade dos registros de agosto:

- agosto/2025: 1.931 classificados de 2.005, com 74 sem área de planejamento;
- agosto/2026: 3.138 classificados de 3.254, com 116 sem área de planejamento.

Por esse motivo, o painel não exibe o ranking mensal de áreas de planejamento em agosto. A ausência é sinalizada na interface e não altera o total geral.

A exclusão dos registros tratados internamente pela PCO está declarada no escopo, mas não pode ser reexecutada ou auditada somente com os arquivos agregados deste pacote. A comprovação exige a base bruta e a regra de exclusão aplicada.
