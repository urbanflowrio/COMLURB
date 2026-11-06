# Auditoria complementar independente — 1746 (06/11/2026)

**Parecer:** REPROVADO para homologação integral dos cinco módulos com base tratada; **aprovados apenas** os somatórios de staging e a preservação dos HTMLs originais. Esta revisão complementa, mas não substitui, `AUDITORIA_NUMERICA_PROFUNDA_2026-11-06.md`.

## Evidências efetivamente rechecadas nesta rodada

- Comparação de `main` com branch: 30 arquivos **adicionados**, 0 arquivos originais substituídos, PR #8 ainda **draft**. Não ocorreu integração dos cubos reais. As cinco cópias do layout continuam referenciando os mesmos scripts oficiais (`chamados_cube.js`, `ouvidoria_cube.js`, `1746-historico/data.js`, `1746-timeline/data.js`, `1746-timeline/cascade_data.js` e `1746-comparativo/populacao_ibge_2022.js`, conforme módulo).
- Lidas as duas camadas JSON de staging e recalculadas independentemente as somas de `2025` e `2026`, para todos os dez meses, com exclusão de `PCO` somente das Ouvidorias operacionais. **Zero diferenças** entre linhas, metadados mensais e `preflight.json` nas 40 combinações canal×mês×ano.
- Chaves de staging: Chamados **15.862**; Ouvidorias **11.902**. **Zero** chaves repetidas e **zero** APs fora de AP1–AP5; nenhum grupo sem Tipo, bairro ou gerência. Em outubro/2026, somam respectivamente **24.120** e **2.213 Ouvidorias operacionais**.
- Chaves com 0 ocorrências **nos dois anos comparados**: Chamados **4.051**; Ouvidorias **3.734**. Total **7.785** grupos descartáveis após testes de equivalência. Não são erros de contagem, mas aumentam tamanho/complexidade de renderização.
- Os workflows recentes da branch falharam em tentativas anteriores e passaram nas execuções **42221795429** e **42221866740** após correção de asserções desatualizadas. O sucesso testa dados e identidade de HTML, **não** navegação e gráficos reais em browser.

## Matriz independente de bloqueios

| ID | Severidade | Evidência / avaliação | Correção exigida |
|---|---|---|---|
| B01 | **CRÍTICA** | As cópias fiéis carregam os **cubos antigos**. O layout original foi salvo, mas o tratamento de AP/Tipo não chega a esses módulos. | Criar adaptadores para os cubos oficiais, com testes de contrato e reconciliação antes de renomear qualquer prévia como integrada. |
| B02 | **CRÍTICA** | A **prévia alternativa do Comparativo Territorial** usa **Ouvidorias / 1.000 Chamados**. O Comparativo **oficial** usa **Chamados / 10 mil residentes (Censo 2022)**, com população IBGE por bairro e ranking populacional. Não são indicadores intercambiáveis. | Descartar a alternativa como substituto; preservar denominador IBGE 2022, comportamento de bairros sem população, ranking e comparação A/B. |
| B03 | **ALTA** | As camadas novas `chamados-tratados-2025-2026.json` e `ouvidorias-tratadas-2025-2026.json` têm apenas a chave mês/AP/Tipo/bairro/gerência e quantidades de 2025/26. Perderam **SubTipo**, e não oferecem série histórica de 2020–2024. | Não usá-las para substituir cubos com drill por SubTipo ou análise histórica longa; enriquecer Chamados com SubTipo e recuperar SubTipos de Ouvidorias na próxima etapa acordada. |
| B04 | **ALTA** | Limpeza/Papeleira têm diferenças históricas de classificação relevantes, mesmo com totais municipais estáveis. A regra aprovada é **Tipo original**, independentemente do SubTipo ou executora. | Construir matriz de transformação explícita e testes de regressão por Tipo×gerência e mês. Não reclassificar registros de LIMPEZA para PAPELEIRA por texto ou gestor. |
| B05 | **ALTA** | Redistribuição de agosto: 701 Chamados SEM AP, AP3 antiga 10.332, AP3 tratada 11.033. Em Ouvidorias o SEM AP de 116 não pode ser integralmente atribuído a AP3 na visão operacional sem a exclusão PCO. | Confrontar o mesmo snapshot por canal, mês e território antes de atualizar taxas, participações ou rankings. |
| B06 | **ALTA** | `data-cutoff.json` mantém `data_corte: null`, além de indicadores de AP acumulada **jan–set** (254.772 Chamados, 30.349 Ouvidorias operacionais) em módulo com cubo `acumulado` **jan–out** (278.888 / 32.562). | Explicitar períodos e registrar corte real, quando documentalmente disponível, sem estimativa. |
| B07 | **MÉDIA-ALTA** | Metadados legados registram revisões que não refletem as últimas fontes: Chamados ago/26 informava fonte 29.590, nova base 29.589; Ouvidorias jun/26 meta 2.765, nova fonte e fechamento mensal 2.764. | Separar histórico da revisão por extração, com data/identificador de cada estado, não substituir a referência antiga sem motivo. |
| B08 | **ALTA** | Não há evidência de teste browser end-to-end dos filtros, renderização, mapas, comportamento de links e drills de cada módulo original usando **novos** cubos. | Executar suíte funcional real e testes visuais em desktop e celular após integrar, não apenas `node --check` e somatórios. |
| B09 | **MÉDIA** | 7.785 combinações de staging têm 0 em ambos os anos de análise. | Reduzir a camada por período após comprovar que os filtros e agrupamentos retornam os mesmos totais. |
| B10 | **ALTA** | `reconciliar.cjs` tem autoteste e checagens de CSV, mas não há evidência de execução integral sobre os dois CSVs exportados nesta branch. | Realizar execução completa em ambiente reprodutível e comparar saída por tipo/AP/bairro/gerência, não só total municipal. |
| B11 | **BLOQUEIO DE ESCOPO** | Ausência de SubTipos de Ouvidorias em grande parte da base nova, já identificada pela auditoria numérica original. | Manter fora da homologação, como acordado; não exibir vazios como se fossem ausência de manifestações. |

## Observações de interpretação executiva

- Diferenças municipais **fonte menos publicado** em jul/ago/set/out 2026: Chamados −43/−16/−23/+4; Ouvidorias operacionais −14/−2/−13/0. Não explicam as diferenças internas por Tipo, bairro e AP.
- O Boletim Executivo revisado é **outra prévia** e não constitui prova de atualização dos cinco cubos. Checar saldos por Tipo, participação dos bairros, APs e cada frase; a regra de classificação não admite retirar de Limpeza apenas pelo nome do SubTipo.
- Não contar uma gerência territorial somada ao bairro como registros adicionais; gerência é desagregação dos totais.
- Um teste com resultado verde não valida causas de variações, qualidade de serviço, duplicidade em nível de protocolo ou interpretação de tendências.

## Decisão de qualidade

**Não aprovar merge do PR #8 para implantação em produção.** Manter `main` intacta, fechar a matriz Tipo×Gerência/AP e montar uma **prova de integração em uma única página oficial**, preservando CSS, links, dados e todas as funções. Só depois replicar, em sequência controlada, aos outros quatro módulos. Adotar como exigência de saída: soma exata por canal/competência/Tipo/AP/bairro/gerência; versão da fonte indicada; taxa calculada sobre o denominador correto; cinco verificações funcionais e visuais em navegador; nenhum SubTipo inventado.

**Limitações deste parecer complementar:** verificação dos artefatos GitHub e dos agregados de staging por recontagem independente; leitura dos relatórios de auditoria existentes. Esta etapa não reexecutou a conferência célula a célula das 79.060 linhas originais do Drive nem testes browser end-to-end. Essas evidências permanecem na auditoria numérica anterior e precisam de reexecução após a efetiva integração.
