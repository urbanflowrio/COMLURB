# Auditoria independente — HUB 1746 | COMLURB
**Referência de auditoria:** 11 de novembro de 2026  
**Status:** REVISÃO NECESSÁRIA antes de homologar números e insights com a nova extração  
**Ambiente examinado:** branch publicada \`main\` do repositório \`urbanflowrio/COMLURB\`  
**Proteção:** nenhuma alteração realizada no HUB publicado ou nos arquivos do Drive.

## 1. Parecer executivo

A auditoria foi **reiniciada sobre as duas fontes brutas da pasta do Drive**, sem reutilizar cubos, cópias tratadas ou conclusões anteriores como origem dos valores. As fontes foram agregadas novamente por linha e comparadas com os cubos publicados dos módulos Chamados e Ouvidorias, com os dados do Histórico e da Linha do Tempo, o Comparativo Territorial e todas as afirmações do Boletim Executivo de outubro.

**Conclusão:** os fechamentos de 2025 e os totais municipais de janeiro a junho de 2026 conciliam. Julho–setembro apresentam revisões retroativas conhecidas; outubro de Ouvidorias mudou de maneira material **após a atualização da fonte em 11/11/2026**. A série publicada permanece identificável como snapshot anterior, porém **não representa integralmente a fonte atual**. A maior discrepância metodológica é a mistura de \`PAPELEIRA\` com \`LIMPEZA\` nos acumulados de Chamados e a reclassificação de Ouvidorias. O uso executivo dos números exige indicação clara da versão/fotografia, mesmo se os valores publicados forem mantidos.

**Não se recomenda publicar nem efetuar merge automático dos novos dados antes da decisão explícita sobre substituir os snapshots fechados ou versionar as revisões.**

## 2. Inventário e rastreabilidade das fontes

| Fonte | Google Sheets | Linhas efetivas | Campo Tipo | Campo Gerência | SubTipo vazio | AP \`Nulo\` |
|---|---|---:|---|---|---:|---:|
| Chamados | [Fonte histórica](https://docs.google.com/spreadsheets/d/1JHyp28FigzUrvD9H_EAynap5PgQSrmYQDCOgMtiRkw8/edit) | 63.738 | B | D | 0 | 2.079 |
| Ouvidorias (revista em 11/11) | [Fonte histórica](https://docs.google.com/spreadsheets/d/1-JdPs02T9grCOQgdUz5522bZvqOAUbD32QIaerjXy0U/edit) | 41.829 | C | B | 0 | 0 |

A nova Ouvidoria tem 41.829 linhas, contra 15.322 na base anteriormente examinada, e contém SubTipo em todas as linhas. **A posição de Tipo e Gerência não é igual nas duas planilhas.** Uma leitura posicional comum aos dois arquivos produziria um resultado falso.

Controle de fechamento: soma de 2020–2026 por linha versus coluna Total Geral: **0 divergências** em cada base. Campo Tipo, SubTipo, Bairro ou AP de referência inválido: nenhum, exceto os 2.079 registros de Chamados com AP original \`Nulo\`. No tratamento territorial **derivado**, todos possuem correspondência AP3 no cadastro de bairros; a fonte não foi sobrescrita. Foram encontrados 3 agrupamentos repetidos de chave na Ouvidoria, sem identificador de protocolo para qualificar duplicidade individual; não remover automaticamente.

**Limite fundamental:** são exportações agregadas, não eventos individuais com protocolo. A auditoria não atesta duplicidades de atendimentos ou legitimidade da extração original.

### Totais por ano, fonte integral

| Ano | Chamados | Ouvidorias institucionais (com PCO) |
|---|---:|---:|
| 2020 | 221.989 | 28.341 |
| 2021 | 215.596 | 26.349 |
| 2022 | 182.794 | 16.188 |
| 2023 | 240.430 | 19.598 |
| 2024 | 285.153 | 24.870 |
| 2025 | 294.552 | 37.021 |
| 2026 (com novembro parcial) | 282.380 | 35.131 |

Para **janeiro–outubro/2026**, os totais são **278.810 Chamados**, **32.587 Ouvidorias operacionais** e **34.328 Ouvidorias institucionais**, das quais **1.741 PCO**. Novembro/2026, ainda parcial, contém 3.570 Chamados, 707 Ouvidorias operacionais e 96 PCO (803 institucionais), **excluídos do recorte fechado até outubro**.

## 3. Todas as competências publicadas de 2026 versus fonte atual

Diferença = fonte de 11/11 menos número publicado no HUB; a base comparativa de **2025 concilia em todos os meses**.

| Mês/2026 | Chamados HUB | Fonte | Δ Chamados | Ouvidorias operacionais HUB | Fonte | Δ Ouvidorias |
|---|---:|---:|---:|---:|---:|---:|
| Janeiro | 30.475 | 30.475 | 0 | 3.668 | 3.668 | 0 |
| Fevereiro | 31.103 | 31.103 | 0 | 3.667 | 3.667 | 0 |
| Março | 35.562 | 35.562 | 0 | 4.458 | 4.458 | 0 |
| Abril | 29.537 | 29.537 | 0 | 3.677 | 3.677 | 0 |
| Maio | 24.700 | 24.700 | 0 | 3.149 | 3.149 | 0 |
| Junho | 21.542 | 21.542 | 0 | 2.764 | 2.764 | 0 |
| Julho | 27.553 | 27.510 | −43 | 3.236 | 3.222 | −14 |
| Agosto | 29.605 | 29.589 | −16 | 3.254 | 3.252 | −2 |
| Setembro | 24.695 | 24.672 | −23 | 2.476 | 2.463 | −13 |
| **Outubro** | **24.116** | **24.120** | **+4** | **2.213** | **2.267** | **+54** |
| **Jan–out** | **278.888** | **278.810** | **−78** | **32.562** | **32.587** | **+25** |

**Variação acumulada 2026 versus 2025, usando a fonte atual:** Chamados **+13,5%** (245.656 → 278.810); Ouvidorias operacionais **+15,6%** (28.192 → 32.587). Não substituir números do snapshot publicado sem versionamento e reprocessamento dos respectivos detalhes.

## 4. Confronto de outubro/2026 — por Tipo

| Tipo | Chamados publicados 2026 | Fonte 2026 | Diferença | Ouvidorias publicadas 2026 | Fonte 2026 | Diferença |
|---|---:|---:|---:|---:|---:|---:|
| Limpeza | 8.326 | 8.332 | +6 | 1.169 | 1.189 | +20 |
| Remoção Gratuita | 9.549 | 9.539 | −10 | 474 | 483 | +9 |
| Manejo Arbóreo | 1.978 | 1.977 | −1 | 308 | 310 | +2 |
| Coleta Domiciliar | 1.707 | 1.706 | −1 | 150 | 154 | +4 |
| Papeleira | 0 | 0 | 0 | 28 | 50 | +22 |
| Vetores | 2.054 | 2.061 | +7 | 36 | 38 | +2 |

As diferenças restantes pertencem a outros Tipos e fecham os totais municipais. Em outubro/2025 as duas fontes conciliam (Chamados 21.652; Ouvidorias operacionais 2.697).

**Fonte atual, outubro/2026 versus outubro/2025:**
- Chamados: 21.652 → 24.120, **+2.468 (+11,4%)**.
- Ouvidorias operacionais: 2.697 → 2.267, **−430 (−15,9%)**.
- Taxa de Ouvidorias por mil Chamados: **124,6 → 94,0**, em vez de 91,8 na fotografia anterior. É uma relação entre volumes; não prova melhora da qualidade do serviço.
- Limpeza: **+2.587 Chamados e +178 Ouvidorias**.
- Remoção Gratuita: **−494 Chamados e −316 Ouvidorias**.
- Dos +2.587 Chamados de Limpeza, **+2.067** são explicados aritmeticamente por Remoção de Resíduos no Logradouro (+1.016), Capina (+645) e Varrição (+406); equivalem a **79,9%** do crescimento desse Tipo.

Os cinco maiores serviços pelo peso em Chamados de outubro/2025 continuam somando cerca de 97,6% do total. A nova fonte ainda sustenta Limpeza como o único desses cinco que cresce nos dois canais, e outubro como menor volume de Ouvidorias operacionais entre janeiro e outubro/2026.

## 5. Principal divergência de classificação — Tipo deve prevalecer

**Regra aprovada pela operação:** o indicador por Tipo utiliza exatamente o **Tipo da fonte**. \`LIMPEZA\` continua LIMPEZA mesmo quando o SubTipo descreve instalação/retirada de papeleira ou caçamba. \`PAPELEIRA\` continua PAPELEIRA; gerência executora não troca o Tipo. A eventual retirada do prefixo \`OUV -\` é apenas **apresentação**.

### Chamados acumulados jan–out

| Tipo | Fonte 2025 | HUB 2025 | Fonte 2026 | HUB 2026 |
|---|---:|---:|---:|---:|
| PAPELEIRA | **1.701** | **166** | **460** | **0** |
| LIMPEZA | **79.082** | **80.617** | **99.455** | **99.911** |

Em 2025, **1.535** registros de Tipo PAPELEIRA foram incorporados à LIMPEZA nos meses anteriores a outubro. Em 2026, os **460** registros de PAPELEIRA não aparecem como Tipo separado no cubo acumulado, e a LIMPEZA publicada está 456 acima da fonte; os 4 restantes decorrem de outras revisões do agregado. **Essa distorção não é eliminada pela pequena diferença do total municipal.**

### Ouvidorias acumuladas jan–out

| Tipo | Fonte 2026 | HUB 2026 | Diferença |
|---|---:|---:|---:|
| PAPELEIRA | **664** | **515** | +149 |
| LIMPEZA | **16.712** | **16.820** | −108 |

Em outubro, o SubTipo de instalação/retirada de papeleira é encontrado **45 vezes em Tipo LIMPEZA** e **50 vezes em Tipo PAPELEIRA**. O cubo publicado tem, respectivamente, 72 e 28. Trata-se da fotografia e do enquadramento originais de cada extração: **não remapear um Tipo para outro por conveniência**. A nota do Boletim que calcula “+86 em Limpeza sem implantação/retirada” deve ser excluída ou reescrita para não apresentar um ajuste por SubTipo como correção do Tipo.

## 6. APs, bairros e gerências — outubro

### Chamados

| AP | HUB 2026 | Fonte atual 2026 | Diferença |
|---|---:|---:|---:|
| AP1 | 957 | 956 | −1 |
| AP2 | 3.872 | 3.876 | +4 |
| AP3 | 9.144 | 9.159 | +15 |
| AP4 | 4.006 | 3.999 | −7 |
| AP5 | 6.137 | 6.130 | −7 |

### Ouvidorias operacionais

| AP | HUB 2026 | Fonte atual 2026 | Diferença |
|---|---:|---:|---:|
| AP1 | 86 | 88 | +2 |
| AP2 | 256 | 266 | +10 |
| AP3 | 894 | 913 | +19 |
| AP4 | 385 | 393 | +8 |
| AP5 | 592 | 607 | +15 |

A AP3 e AP5 somam **+2.318** dos **+2.468** Chamados adicionais na fonte (93,9%). A análise de agosto é especialmente sensível à antiga categoria SEM AP. Os 2.079 registros agregados de Chamados com AP original \`Nulo\` devem ter sua AP derivada por bairro no Cadastro Territorial Mestre, mantendo a coluna original e explicitando que não são novos Chamados.

### Bairros e gerências contidos nos totais

| Indicador | Campo Grande (fonte atual) | Bangu (fonte atual) |
|---|---:|---:|
| Chamados out/2025 → out/2026 | **1.415 → 1.791 (+376)** | **577 → 986 (+409)** |
| Ouvidorias operacionais | **152 → 214 (+62)** | **46 → 85 (+39)** |
| Aumento de Chamados de Limpeza | +268 | +405 |
| Aumento de Ouvidorias de Limpeza | +53 | +22 |
| Gerência territorial em destaque | OG18G: **597 Chamados, 102 Ouvidorias** | OG17B: **637 Chamados, 54 Ouvidorias** |

Os dois bairros continuam liderando os maiores aumentos absolutos de Chamados e Ouvidorias, mas agora somam **+101 Ouvidorias** em uma cidade com **−430**. Somar OG18G a Campo Grande ou OG17B a Bangu produziria dupla contagem.

## 7. Matriz de auditoria dos seis módulos publicados

| Módulo | Controle realizado | Parecer |
|---|---|---|
| **Chamados** | Cubo \`chamados_cube.js\`, mensais, acumulados, Tipo, AP, bairro, gerência, SubTipo; nova fonte | **AJUSTAR:** total out/26 +4, revisões jul–set, PAPELEIRA separada de LIMPEZA e recortes territoriais |
| **Ouvidorias** | Cubo \`ouvidoria_cube.js\`, PCO e mesma decomposição; fonte atualizada em 11/11 | **AJUSTE PRIORITÁRIO:** outubro operacional +54, institucional +66; alterações por Tipo e território |
| **Histórico** | \`1746-historico/data.js\`, indicadores, texto estático, série exploratória RG | **AJUSTAR:** dados e taxonomia. O cabeçalho ainda descreve jan–set/2026, V4.2 e corte 05/10/2026, enquanto o arquivo e os KPIs já são jan–out/2026, V4.3. Os valores exploratórios de RG em 2021 e 2024 não reproduzem integralmente o Tipo RG da nova fonte e exigem nota de origem. O gráfico RG de outubro/2026 contém um recorte parcial (**1.670 Chamados e 130 Ouvidorias**), explicitamente rotulado no gráfico, e não deve ser confundido com o fechamento integral de outubro. |
| **Linha do Tempo** | \`data.js\`, \`cascade_data.js\`, evolução, contratos de detalhamento e taxas | **AJUSTAR:** todos os totais revisados e as duas classificações. Nos **cinco períodos territoriais completos** do arquivo de cascata, serviços, SubTipos e linhas de bairro/gerência fecham internamente; **zero quebras de soma**. Em janeiro–setembro, a navegação mensal limita deliberadamente a granularidade ao SubTipo quando não há cruzamento territorial, comportamento explicado na interface: não é uma falha aritmética. |
| **Comparativo Territorial** | Usa o cubo Chamados e \`populacao_ibge_2022.js\` | **AJUSTAR numeradores e rankings**, sem alterar a fórmula oficial **Chamados ÷ residentes do Censo 2022 × 10.000**. Os 162 registros de correspondência populacional cobrem os bairros examinados; São Cristóvão e Imperial de São Cristóvão compartilham o mesmo código/denominador IBGE e não são aditivos. Não substituir a taxa por Ouvidorias/1.000 Chamados. |
| **Boletim Executivo** | Todos os números/afirmações da versão pública \`1746-resumo-executivo/index.html\` | **REESCREVER NÚMEROS E NOTAS**, preservando layout oficial: 24.120; 2.267; −15,9%; RG −316; Limpeza +178 Ouvidorias; Campo Grande 214 Ouvidorias; Bangu 85; +101 nos dois bairros; nota de papeleira pelo Tipo original |

### Evidências de metadados e corte

- \`chamados-1746/data-cutoff.json\` e \`ouvidoria/data-cutoff.json\` permanecem com \`data_corte: null\`. Não inventar data original de extração.
- Em Chamados, agosto/2026 consta como 29.590 em um registro de revisão, enquanto a fonte atual contém **29.589**. A correção não deve apagar o valor do snapshot anterior.
- A indicação estática do Histórico (jan–set e V4.2) não acompanha a visualização jan–out. A expressão de corte 05/10/2026 é anterior ao encerramento de outubro; deve ser claramente vinculada ao histórico, e não confundida com extração final de outubro.
- A nova Ouvidoria possui **SubTipos preenchidos**. A pendência antiga de 12.777 linhas vazias não é aplicável à fonte atual. Portanto, já é possível auditar o detalhamento por SubTipo, com as ressalvas de diferenças entre extrações.
- A afirmação de que a queda de Ouvidorias, sozinha, significa melhoria de qualidade **não é sustentada**. Diferenças entre propensões de uso do 1746, base comparativa e eventuais mudanças de classificação devem ser reconhecidas.

## 8. Priorização e plano de correção

| Prioridade | Item | Critério de aceite |
|---|---|---|
| **P0 — Bloqueante** | Fixar fotografia/versão das duas fontes, registrar data conhecida de atualização e identificar o responsável pelo corte original | Mesma versão explicitamente indicada em todos os módulos; julho–setembro versionados, outubro não apresentado como valor idêntico entre snapshots |
| **P0 — Bloqueante** | Reconciliar outubro atualizado nos dois cubos e nos agregados de cascata | Exatamente **24.120 Chamados e 2.267 Ouvidorias operacionais**, ou manter os valores históricos com selo/identificador de snapshot anterior; nenhum número misto |
| **P0 — Bloqueante** | Recuperar os Tipos originais LIMPEZA e PAPELEIRA de jan–out | Por mês e Tipo a soma corresponde à fonte e ao total municipal; sem remapeamento por SubTipo |
| **P1** | Recalcular APs e bairros com cadastro territorial + atributos de gerência | AP3 recuperada sem dupla contagem; comparativos por AP/bairro/gerência reconciliados até cada recorte |
| **P1** | Reconstruir SubTipos de Ouvidorias com a fonte de 11/11 e padronizar apenas os rótulos exibidos (sem \`OUV -\`) | Cada SubTipo mantém Tipo de origem; nenhum preenchimento artificial |
| **P1** | Atualizar Histórico, Linha do Tempo, Comparativo e Boletim com a mesma fonte e período | Indicadores, taxas, textos, rankings e datas concordam; destaque de RG exploratória marcado como parcial |
| **P1** | Validar os contratos dos cinco módulos oficiais em navegador | Testes reais de desktop/celular, navegação, links, cascata Serviço→SubTipo→AP→Gerência→Bairro, ranking de população e taxas |
| **P2** | Homologar redações executivas e notas metodológicas | Sem causas não demonstradas, sem inferir qualidade de serviço a partir do volume |
| **P2** | Publicar só após aceite explícito | \`main\` atualizada apenas após auditoria de regressão completa e aprovação |

## 9. O que foi efetivamente verificado e os limites

**Verificado nesta auditoria:** leitura integral das duas planilhas do Drive por 2020–2026; somatório linha a linha; 2025/2026 mensal por canal/PCO; 2026 outubro por Tipo, AP, bairro, gerência e SubTipo; comparação computacional com \`chamados_cube.js\`, \`ouvidoria_cube.js\`, \`1746-historico/data.js\`, \`1746-timeline/data.js\` e \`cascade_data.js\`; conteúdo integral do Boletim Executivo; contrato e correspondência populacional do Comparativo.

**Limitações:** as fontes são agregações sem protocolo individual, e não foi documentada a data exata da extração original por competência. O que se chama “erro” em relação à nova base pode representar uma revisão posterior legítima de uma fotografia antiga; **não invalidar retroativamente a decisão de congelamento sem governança**. Esta auditoria não fez captura visual browser end-to-end nem recalculou cada combinação específica \`Tipo × SubTipo × AP × Gerência × Bairro\` diretamente contra os arquivos brutos geográficos de 9 MB dos módulos; essa é a prova final exigida para uma nova publicação.

## Evidências produzidas nesta branch (sem merge)

- [01 — Fonte Chamados, matrizes independentes](01_fonte_chamados.json)
- [02 — Fonte Ouvidorias, matrizes independentes](02_fonte_ouvidorias.json)
- [03 — Comparação direta com os cubos publicados](03_confronto_cubos_publicados.json)

**Status de encerramento:** auditoria da fonte, fechamento, principais recortes e conteúdo publicado **concluída com divergências documentadas**. A homologação de **nova publicação** permanece **bloqueada**, até revisão dos snapshots e execução da regressão funcional/geográfica.
