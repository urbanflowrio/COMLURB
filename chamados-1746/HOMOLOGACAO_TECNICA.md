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


---

# Registro de homologação técnica — SET/2026

Identificação: `CHA-2026-10-05-TEC-01`.

## Escopo

- competência mais recente: setembro/2026;
- data de corte: 05/10/2026;
- histórico congelado até agosto/2026;
- total oficial Set/2026: 24.695;
- acumulado oficial Jan–Set/2026: 254.772;
- fonte analítica: `chamados_cube.js`;
- fonte geográfica: `chamados_data.js`.

## Ressalvas vigentes

- Agosto/2025 (478) e agosto/2026 (701) permanecem sem classificação de AP no histórico congelado e são representados como `SEM AP (AGO)`, sem reclassificação retroativa.
- Os subtipos de PAPELEIRA mudaram de regra de classificação a partir de agosto; a comparação acumulada desses subtipos não é homogênea.
- Por decisão de governança no fechamento SET/2026, `IMPERIAL DE SAO CRISTOVAO` é tratado exclusivamente no join cartográfico como equivalente ao polígono `SAO CRISTOVAO`. O join agrega os volumes de todos os nomes do cubo que apontam para a mesma chave geográfica antes do desenho do mapa; o nome oficial do cubo não é alterado. Cobertura cartográfica: 100%.
- Datas de corte individuais de Jan–Jul/2026 não foram localizadas na documentação disponível e permanecem `NÃO RASTREADO` na base auditável.

## Integridade dos arquivos principais após correção pós-auditoria

| Arquivo | SHA-256 |
|---|---|
| `index.html` | `fc6d56bfa85b488bdf81b014108a54aa70d3c7190084ccf38a622224c7963713` |
| `chamados_data.js` | `b6a8889e39de9faf590a61d957fa47cb5461cefd8bd5f0cf2afb957a2d68d34b` |
| `chamados_cube.js` | `3e1f33732b76384b00c44a208b0808f6196df34257d5f7531285cee55b08a201` |
| `data-cutoff.json` | `173ba46bba3cd6702e8f8a1a9ae9fe2c4c66c9db69d497ba68b17801fbc4940c` |
| Base auditável pós-auditoria | `108745d02b2b60ea7b1d7d3f88b1943a214e527e5989ad36dd5f6bad67a4be0c` |

Status deste registro: correções executadas; aceite técnico independente aprovado — T1 a T10.
