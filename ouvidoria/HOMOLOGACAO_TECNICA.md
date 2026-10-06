# Ouvidoria | Homologação técnica

Identificação: `OUV-2026-09-15-TEC-01`.

## Escopo

- competência mais recente: agosto/2026;
- data de corte: 04/09/2026;
- histórico congelado até julho/2026;
- fonte analítica: `ouvidoria_cube.js`;
- fonte geográfica: `ouvidoria_data.js`.

## Resultado

Homologação técnica aprovada com duas ressalvas: cobertura parcial da dimensão Área de Planejamento em agosto e impossibilidade de reexecutar a exclusão da PCO sem a base bruta. A validação visual no endereço publicado, em desktop e celular, permanece pendente.

## Totais protegidos

| Período | 2025 | 2026 | Diferença | Variação |
|---|---:|---:|---:|---:|
| Janeiro a agosto | 23.489 | 27.873 | 4.384 | 18,66% |
| Agosto | 2.005 | 3.254 | 1.249 | 62,29% |

## Verificações executadas

- 1.126 conciliações internas aprovadas, sem reprovação;
- totais gerais conciliados com séries mensais;
- tipos conciliados com o total geral;
- subtipos conciliados com os respectivos tipos;
- gerências e bairros conciliados com os totais;
- diferenças e variações recalculadas;
- sintaxe dos arquivos JavaScript e dos scripts internos aprovada;
- botão Home presente e apontando para `../index.html`;
- 12 botões com tipo explícito;
- quatro gráficos com identificação acessível;
- nenhum travessão na interface do módulo;
- redução de movimento respeitada.

## Ressalva de Área de Planejamento

| Competência | Total | Classificados em AP | Sem AP | Cobertura |
|---|---:|---:|---:|---:|
| Agosto/2025 | 2.005 | 1.931 | 74 | 96,31% |
| Agosto/2026 | 3.254 | 3.138 | 116 | 96,44% |

O ranking mensal de AP permanece oculto em agosto para impedir uma leitura incompleta. Essa limitação não altera os totais gerais.

## Ressalva da PCO

O painel informa que exclui registros tratados internamente pela PCO. O pacote recebido contém o resultado agregado, mas não contém a base bruta nem um registro das linhas excluídas. Portanto, a exclusão não foi reexecutada nesta homologação. Para completar a auditabilidade, é necessário preservar a base bruta, a regra aplicada e a quantidade de registros removidos por competência.

## Mudanças técnicas desta versão

- substituídos efeitos decorativos por cores sólidas;
- removido o código não utilizado de gráfico de rosca;
- preservado somente o gradiente funcional da escala do mapa;
- alterado “Recorte de análise” para “Período da análise”;
- adicionadas melhorias estáticas de acessibilidade e movimento reduzido;
- mantidos os arquivos legados por decisão de segurança;
- números, filtros, competências e regras de negócio não foram alterados.

## Integridade dos arquivos principais

| Arquivo | SHA-256 |
|---|---|
| `index.html` | `bb46ec34b59d2520b4449da91721c0e49050d680a9f00519bdeb426349622bbb` |
| `ouvidoria_data.js` | `58145a46f2f495f6e331dbbb1f76b1acc803e5fe42bfe7d26d1e1309be68fc8c` |
| `ouvidoria_cube.js` | `85ea1b2c5119f8fc1c86dd7b17ee4ef1ed1b369e9a9e0688db8fb1460ec9146d` |
| `data-cutoff.json` | `3eb9e52722312a1de55ce72137c8bb3cc1ab3182a64c96412c91deeca4d623aa` |

## Critério para homologação final

Após a publicação, testar em desktop e celular: carregamento, Home, alternância entre acumulado e agosto, filtros, drill-down de tipo e subtipo, mapa, tabelas e mensagens de ausência de AP. Registrar aprovador funcional e resultado em `BASELINE_HOMOLOGACAO.md`.


---

# Registro de homologação técnica — SET/2026

Identificação: `OUV-2026-10-05-TEC-01`.

## Escopo

- competência mais recente: setembro/2026;
- data de corte: 05/10/2026;
- histórico congelado até agosto/2026;
- total institucional Set/2026: 2.650;
- PCO Set/2026: 174;
- total operacional Set/2026: 2.476;
- acumulado operacional oficial Jan–Set/2026: 30.349;
- fonte analítica: `ouvidoria_cube.js`;
- fonte geográfica: `ouvidoria_data.js`.

## Ressalvas vigentes

- Agosto/2025 (74) e agosto/2026 (116) permanecem sem classificação de AP no histórico congelado e são representados como `SEM AP (AGO)`, sem reclassificação retroativa.
- Por decisão de governança no fechamento SET/2026, `IMPERIAL DE SAO CRISTOVAO` é tratado exclusivamente no join cartográfico como equivalente ao polígono `SAO CRISTOVAO`. O join agrega os volumes de todos os nomes do cubo que apontam para a mesma chave geográfica antes do desenho do mapa; o nome oficial do cubo não é alterado. Cobertura cartográfica: 100%.
- PCO permanece na camada institucional e fora da camada operacional.
- Datas de corte individuais de Jan–Jul/2026 não foram localizadas na documentação disponível e permanecem `NÃO RASTREADO` na base auditável.

## Integridade dos arquivos principais após correção pós-auditoria

| Arquivo | SHA-256 |
|---|---|
| `index.html` | `5f8221e9c499c0105dcd1b609720fb19d5fdc2a4324571ae0938393772484ab3` |
| `ouvidoria_data.js` | `58145a46f2f495f6e331dbbb1f76b1acc803e5fe42bfe7d26d1e1309be68fc8c` |
| `ouvidoria_cube.js` | `e69ce009b63f31ee7b95e9705593c8f9c1b5be63b6d26ae18d80f4fc98d267ab` |
| `data-cutoff.json` | `5d3f9cb3897796b5efd403d15f17d44da5da93a8464dbee63824c82e1a845e0b` |
| Base auditável pós-auditoria | `59047b094e86fe70a4d39121090550a21573a5f74168433ceeba3bd240561fe3` |

Status deste registro: correções executadas; sujeito à auditoria independente de aceite T1–T10.
