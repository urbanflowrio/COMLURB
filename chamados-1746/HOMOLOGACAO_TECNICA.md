# Chamados 1746 | Homologação técnica

Identificação: `CHA-2026-09-15-TEC-01`.

## Escopo

- competência mais recente: agosto/2026;
- data de corte: 04/09/2026;
- histórico congelado até julho/2026;
- fonte analítica: `chamados_cube.js`;
- fonte geográfica: `chamados_data.js`.

## Resultado

Homologação técnica aprovada com ressalva de cobertura da dimensão Área de Planejamento em agosto. A validação visual no endereço publicado, em desktop e celular, permanece pendente.

## Totais protegidos

| Período | 2025 | 2026 | Diferença | Variação |
|---|---:|---:|---:|---:|
| Janeiro a agosto | 202.728 | 230.077 | 27.349 | 13,49% |
| Agosto | 21.764 | 29.605 | 7.841 | 36,03% |

## Verificações executadas

- 114 conciliações internas aprovadas, sem reprovação;
- totais gerais conciliados com séries mensais;
- tipos conciliados com o total geral;
- subtipos conciliados com os respectivos tipos;
- gerências e bairros conciliados com os totais;
- sintaxe dos arquivos JavaScript e dos scripts internos aprovada;
- botão Home presente e apontando para `../index.html`;
- 12 botões com tipo explícito;
- quatro gráficos com identificação acessível;
- nenhum travessão na interface do módulo;
- redução de movimento respeitada;
- regressão geral do HUB: 604 aprovações e nenhuma reprovação.

## Ressalva de qualidade

A dimensão Área de Planejamento não cobre todos os registros de agosto:

| Competência | Total | Classificados em AP | Sem AP | Cobertura |
|---|---:|---:|---:|---:|
| Agosto/2025 | 21.764 | 21.286 | 478 | 97,80% |
| Agosto/2026 | 29.605 | 28.904 | 701 | 97,63% |

O ranking mensal de AP permanece oculto em agosto para impedir uma leitura incompleta. Essa limitação não altera os totais gerais.

## Mudanças técnicas desta versão

- removidos os agregados antigos e não utilizados de `chamados_data.js`;
- preservados os 215 elementos geográficos usados no mapa;
- mantido `chamados_cube.js` como única origem dos números analíticos;
- substituídos efeitos decorativos por cores sólidas;
- preservados apenas os gradientes funcionais do gráfico de composição e da escala do mapa;
- adicionadas melhorias estáticas de acessibilidade e movimento reduzido;
- números, filtros, competências e regras de negócio não foram alterados.

## Integridade dos arquivos principais

| Arquivo | SHA-256 |
|---|---|
| `index.html` | `32d542d97ab5ccae8054194b82b7933b71beb815e9c0f1765f9e818522fa9649` |
| `chamados_data.js` | `b6a8889e39de9faf590a61d957fa47cb5461cefd8bd5f0cf2afb957a2d68d34b` |
| `chamados_cube.js` | `49a05292371cf5a1a86a410908ce486eb2fa8d46c8762931c00a4fd355f333f4` |
| `data-cutoff.json` | `9068327471277ef97926a024ca4a235d7444fbdcca95e7c1f4852a5aa7870ce4` |

## Critério para homologação final

Após a publicação, testar em desktop e celular: carregamento, Home, alternância entre acumulado e agosto, filtros, drill-down de tipo e subtipo, mapa, tabelas e mensagens de ausência de AP. Registrar aprovador funcional e resultado em `BASELINE_HOMOLOGACAO.md`.
