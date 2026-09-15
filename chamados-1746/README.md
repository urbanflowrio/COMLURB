# Chamados 1746 | HUB COMLURB

Painel executivo dos Chamados 1746 no padrão HUB COMLURB.

## Corte e atualização

- Competência mais recente: agosto/2026
- Data de corte deste pacote: 04/09/2026
- Comparação acumulada: janeiro a agosto de 2026 x janeiro a agosto de 2025
- Regra histórica: janeiro a julho permanece conforme o fechamento anterior; agosto foi incorporado como nova competência.
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

Os totais, séries mensais, tipos, subtipos, gerências e bairros foram conciliados sem divergência. A distribuição por área de planejamento não cobre a totalidade dos chamados de agosto:

- agosto/2025: 21.286 classificados de 21.764, com 478 sem área de planejamento;
- agosto/2026: 28.904 classificados de 29.605, com 701 sem área de planejamento.

Por esse motivo, o painel não exibe ranking mensal de áreas de planejamento para agosto. A ausência é sinalizada na própria interface e não altera o total geral.
