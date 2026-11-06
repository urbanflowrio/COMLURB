# Auditoria numérica independente e aprofundada — COMLURB 1746

**Data:** 06/11/2026. **Escopo:** bases originais e cópias tratadas, janeiro–outubro de 2025/2026, histórico anual de 2020–2026, cubos oficiais de Chamados e Ouvidorias, Histórico, Linha do Tempo e metadados de publicação. **Parecer: APROVAÇÃO PARCIAL DOS TOTAIS; REPROVAÇÃO DA HOMOLOGAÇÃO INTEGRAL DO DETALHAMENTO.** Nenhuma base nem painel da `main` foi alterado por esta auditoria.

## 1. Procedimentos executados e evidências

1. **Teste integral de preservação da fonte:** todas as **63.738 linhas** da origem de Chamados e as **15.322 linhas** da origem de Ouvidorias foram confrontadas, célula a célula, nas **15 colunas originais A:O**, contra as cópias tratadas. **0 diferenças em 79.060 linhas**. A única padronização ocorreu nas colunas adicionais P (AP_PADRONIZADA) e Q (BAIRRO_PADRONIZADO).
2. **Fechamento aritmético por linha e por ano:** 63.738 linhas de Chamados e 15.322 de Ouvidorias foram verificadas contra a soma das sete colunas anuais 2020 a 2026. **0 divergências**, nenhuma contagem negativa ou não inteira. Em **183 linhas** de Chamados, o Total Geral foi apresentado com ponto como separador de milhar (ex.: `1.138`); a interpretação pt-BR é obrigatória para evitar falsas inconsistências.
3. **Controle territorial integral:** P/Q sem AP inválida, sem bairro vazio, sem conflitos em que um mesmo bairro padronizado pertencesse a duas APs. Todos os bairros representados na camada agregada de 2025–2026 foram confrontados com o **Cadastro Territorial Mestre**, sem divergência de AP e sem nomes órfãos. Os **2.079** `Nulo` de Chamados e **487** de Ouvidorias foram mapeados à AP3, somente em P.
4. **Somas dos cubos oficiais:** Chamados e Ouvidorias na `main` fecham internamente por AP, Tipo, bairro, gerência e total em `acumulado`, `setembro` e `outubro`. Isso comprova consistência interna **do snapshot**, mas não sua correspondência à extração atual.
5. **Comparação independente de dimensões:** confrontados os agregados por AP, bairro (com aliases equivalentes), gerência e Tipo da nova camada com os cubos públicos de setembro, outubro e acumulado. Resultado: diversas diferenças detalhadas, mesmo quando o total municipal coincide.
6. **Checagem de indicadores derivados:** 120 testes de taxas, percentuais e índices de Remoção Gratuita nas séries mensal do Histórico e da Linha do Tempo; **0 erros matemáticos**. As somas de jan–out nos dois módulos coincidem com a fotografia publicada.
7. **PCO e SubTipo:** conferência de separação institucional/operacional, quantitativos de PCO e cobertura de SubTipo em **todas as 15.322 linhas** de Ouvidorias.

### Fonte verificável
- [Chamados original](https://docs.google.com/spreadsheets/d/1JHyp28FigzUrvD9H_EAynap5PgQSrmYQDCOgMtiRkw8/edit); [Chamados tratado](https://docs.google.com/spreadsheets/d/1qOTScQ-fldjBv9vios4aMTCiBGqa4KoQT23Yiex81UQ/edit).
- [Ouvidorias original](https://docs.google.com/spreadsheets/d/1-JdPs02T9grCOQgdUz5522bZvqOAUbD32QIaerjXy0U/edit); [Ouvidorias tratada](https://docs.google.com/spreadsheets/d/1QYo05-kXN-F_HbShX_QIliY8Kwn6_rIgrThsfk1u_A0/edit).
- [Cadastro Territorial Mestre](https://docs.google.com/spreadsheets/d/1u9vJsfd7TbG_5rTcXzpEVotte6QrLfMza3eT0Z_JmKI/edit).
- Repositório `urbanflowrio/COMLURB` na `main`: `chamados-1746/chamados_cube.js`, `ouvidoria/ouvidoria_cube.js`, `1746-historico/data.js`, `1746-timeline/data.js`, `chamados-1746/data-cutoff.json`, `ouvidoria/data-cutoff.json`.
- Branch de auditoria: `staging/1746-territorial-nov2026/chamados-tratados-2025-2026.json` e `ouvidorias-tratadas-2025-2026.json`.

## 2. Matriz de achados priorizados

| ID | Gravidade | Achado | Evidência quantitativa | Impacto/ação |
|---|---|---|---|---|
| **A01** | **CRÍTICO** | SubTipos de Ouvidorias operacionais **inteiramente ausentes** | 10.989/10.989 linhas operacionais sem SubTipo; 32.533/32.533 registros operacionais de 2026 sem SubTipo. Do total institucional: 12.777/15.322 linhas vazias (83,39%). | **Bloquear homologação por SubTipo**; obter extração com esse nível. Cubos antigos de SubTipo não são confirmados pela nova fonte. |
| **A02** | **ALTO** | Inconsistência histórica de **Tipo LIMPEZA/PAPELEIRA — Chamados** | Nova base jan–out/2025: Papeleira **1.701**, cubo publicado **166**; 1.535 de jan–set foram absorvidos por Limpeza. Nova base jan–out/2026: Papeleira **460**, cubo **0**; Limpeza do cubo 99.911 e fonte 99.455. | **Reprocessar Tipo em prévia**; preservar snapshot oficial e não redefinir Tipo a partir do SubTipo nem executor. |
| **A03** | **ALTO** | Inconsistência **Tipo e gerência em Ouvidorias** | Acumulado operacional de 2026: Papeleira **647** na fonte vs **515** publicado (**+132**); Limpeza **16.688** vs **16.820** (**−132**); gerência LDE **647** vs **515** (**+132**). | Revalidar Tipo×Gerência em todos os meses com a fonte contemporânea antes de qualquer insight por serviço. |
| **A04** | **ALTO** | **Redistribuição da categoria SEM AP de agosto** | Chamados de ago/26: **701** em SEM AP no snapshot, AP3 **10.332**; extração tratada AP3 **11.033**. Ouvidorias de ago/26: SEM AP **116**, AP3 **1.061** no snapshot; AP3 tratada **1.172** (+111). | Recalcular APs, participações e taxas sob o MESMO corte. Não mudar fotografia histórica sem trilha de versão. |
| **A05** | **ALTO** | Metadados de período e corte ambíguos | `data-cutoff.json` dos dois módulos indica data de corte `null`; `qualidade.area_planejamento_acumulado` refere-se a jan–set (Chamados 2026: **254.772**; Ouvidorias operacionais: **30.349**), enquanto o cubo `acumulado` inclui outubro (278.888; 32.562). | Explicitar rótulos **jan–set** e **jan–out**, a fonte e a data real; não apresentar metadados do período antigo como se cobrissem outubro. |
| **A06** | **ALTO** | **Snapshots publicados não equivalem à base atual** | Jul/26 Chamados −43, Ouvidorias −14; ago −16/−2; set −23/−13; out **+4/0**. Soma jan–out: **−78 Chamados, −29 Ouvidorias** vs cubos. | **Não sobrescrever os fechamentos**; disponibilizar revisão em camada derivada com identificação do snapshot. |
| **A07** | **MÉDIO-ALTO** | Diferença de PCO e institucional no mês de setembro | Fonte set/26: **189 PCO**, 2.652 institucionais, 2.463 operacionais; metadado do módulo: **174 PCO** e cubo 2.476 operacionais. Fotografia antiga implicaria 2.650 institucionais. | Registrar evolução do mix PCO e verificar se a mudança decorre de classificação posterior; não atribuir causa sem registros individuais. |
| **A08** | **MÉDIO** | Outubro tem diferenças internas que se compensam | Chamados out/26: total 24.120 na fonte contra 24.116; por Tipo: Remoção Gratuita −10, Vetores +7, Limpeza +6, entre outros. Ouvidorias: total 2.213 em ambos, mas Papeleira +5 e Limpeza −4. | Revisar detalhamentos, mesmo quando o total do município não muda. |
| **A09** | **MÉDIO** | Chaves repetidas nas tabelas agregadas | **Três chaves repetidas em cada fonte**, associadas a Sampaio/CG13M e AP original Nulo vs AP3. | Somar agrupamentos, **não deduplicar** por chave derivada; sem protocolo individual não se pode provar duplicidade de atendimento. |
| **A10** | **MÉDIO** | Novembro de 2026 é parcial | Total Chamados de 2026 em toda a fonte: **282.380**, mas jan–out fecha em **278.810**. A diferença **3.570** pertence a novembro parcial. | Excluir novembro de todas as séries oficialmente fechadas em outubro. |
| **A11** | **MÉDIO** | Impossibilidade de homologação em nível de protocolo | Fontes são agregados de tabelas dinâmicas sem IDs/protocolos individuais ou data documentada de extração. | Testes de contagem não detectam eventual protocolo duplicado ou erro de origem. Solicitar extração granular em futura etapa. |
| **A12** | **ALTO (PROCESSO)** | Prévia com layout original continua carregando cubos oficiais | As cinco cópias visuais restauraram o HTML original e seus scripts, sem injeção dos novos cubos. As cinco páginas alternativas da staging usam uma agregação sem SubTipo. | Não apresentar prévias visuais como integração homologada. Adaptar cubos originais com testes de contrato e drill antes de substituir produção. |
| **A13** | **MÉDIO** | Revisão institucional adicional em outubro de Ouvidorias | Nova extração institucional out/26 **2.370** = 2.213 operacionais + **157 PCO**; auditoria da extração anterior registrava **156 PCO** e, portanto, **2.369 institucionais**. | Preservar versão de origem e documentar +1 institucional não operacional; não atribuir a mudança ao serviço sem nível de protocolo. |

## 3. Saldos mensais comparados

A diferença é sempre **nova extração menos fotografia publicada**. Ouvidorias em visão **operacional (sem PCO)**.

| Mês de 2026 | Chamados novos | Δ Chamados vs HUB | Ouvidorias novas | Δ Ouvidorias vs HUB |
|---|---:|---:|---:|---:|
| Janeiro | 30.475 | 0 | 3.668 | 0 |
| Fevereiro | 31.103 | 0 | 3.667 | 0 |
| Março | 35.562 | 0 | 4.458 | 0 |
| Abril | 29.537 | 0 | 3.677 | 0 |
| Maio | 24.700 | 0 | 3.149 | 0 |
| Junho | 21.542 | 0 | 2.764 | 0 |
| Julho | 27.510 | −43 | 3.222 | −14 |
| Agosto | 29.589 | −16 | 3.252 | −2 |
| Setembro | 24.672 | −23 | 2.463 | −13 |
| Outubro | 24.120 | +4 | 2.213 | 0 |
| **Jan–Out** | **278.810** | **−78** | **32.533** | **−29** |

**Comparativo 2025 jan–out:** Chamados **245.656**, Ouvidorias operacionais **28.192**, ambos coincidem com o HUB no total municipal. Na nova base 2026, as variações do acumulado são **+13,496% Chamados** e **+15,398% Ouvidorias**, contra os arredondamentos oficiais de +13,5% e +15,5%. A taxa municipal de outubro é **91,750 Ouvidorias por 1.000 Chamados** pela fonte e **91,765** no HUB; a diferença é pequena, mas não autoriza misturar cortes dentro de uma taxa territorial.

## 4. Tipos: diferenças que mudam a leitura

| Indicador jan–out | HUB 2025 | HUB 2026 | Fonte tratada 2025 | Fonte tratada 2026 |
|---|---:|---:|---:|---:|
| Chamados, Tipo Limpeza | 80.617 | 99.911 | 79.082 | 99.455 |
| Chamados, Tipo Papeleira | 166 | 0 | 1.701 | 460 |
| Ouvidorias operacionais, Tipo Limpeza | 13.013 | 16.820 | 13.013 | 16.688 |
| Ouvidorias operacionais, Tipo Papeleira | 462 | 515 | 462 | 647 |

No novo critério, a variação de Chamados de Limpeza é **+20.373** no acumulado, contra **+19.294** exibidos anteriormente pelo HUB. A diferença é **taxonômica**, não crescimento adicional da demanda municipal. A nova fonte precisa de **governança da classificação**, não de ajuste artificial dos totais.

Em outubro isolado: Chamados de Limpeza +2.587 (HUB +2.581); Ouvidorias de Limpeza +154 (HUB +158). Os quatro Chamados a mais no mês não explicam todas as diferenças internas: há compensações entre outros Tipos e territórios.

## 5. Território: a AP3 precisa de reinterpretação, não de aumento artificial

- No acumulado de Chamados 2025, a AP3 tratada é **96.031**, contra 95.553 no cubo; o **+478** corresponde à antiga categoria SEM AP de agosto. Em 2026, AP3 tratada **108.735** vs 108.023 no cubo (**+712**), enquanto SEM AP desaparece (**−701**); há também revisões retroativas.
- Em Ouvidorias operacionais acumuladas, AP3 tratada **12.594** vs 12.507 (**+87**) e SEM AP em 2026 deixa de aparecer (**−116**), com demais revisões de snapshot. **Não atribuir os 116 integralmente à AP3**, pois a comparação por AP mostra diferença líquida menor.
- Agosto é o mês mais sensível para a distribuição territorial. É indispensável preservar os denominadores de Chamados e Ouvidorias **do mesmo snapshot** para calcular taxas.
- Todos os nomes das bases tratadas usados na camada jan–out correspondem ao cadastro territorial; **0 conflitos bairro/AP**. Variantes `BRAZ DE PINA`/`BRÁS DE PINA` e `OSWALDO CRUZ`/`OSVALDO CRUZ` devem ser comparadas por chave canônica, sem gerar bairros artificiais.

## 6. Totais anuais de origem (verificados por soma das linhas)

**Chamados, institucional agregado:** 2020 221.989; 2021 215.596; 2022 182.794; 2023 240.430; 2024 285.153; 2025 294.552; 2026 **282.380, com novembro parcial**.

**Ouvidorias, institucional agregado:** 2020 28.341; 2021 26.349; 2022 16.188; 2023 19.598; 2024 24.870; 2025 37.021; 2026 **34.262 até outubro**. Em 2026, retirando PCO (1.729), restam **32.533 Ouvidorias operacionais**. Não comparar o ano completo de 2025 com o ano parcial de 2026 como se fossem períodos idênticos.

## 7. Parecer de homologação por dimensão

| Dimensão | Situação | Condição para aprovação |
|---|---|---|
| Integridade das cópias tratadas (A:O) | **APROVADA** | Preservar originais e versionamento |
| Fechamento aritmético de 2020–2026 | **APROVADO** | Parser numérico pt-BR para totais com milhar |
| AP e Bairro (camada derivada) | **APROVADO TECNICAMENTE** | Manter referência mestre e regra AP3 documentada |
| Total mensal do snapshot oficial | **APROVADO INTERNAMENTE** | Não substituí-lo sem homologação da revisão |
| Novo total mensal por fonte atual | **APROVADO COMO REVISÃO** | Identificar corte temporal e origem |
| Tipo e gerência históricos | **NÃO HOMOLOGADOS** | Resolver classificação Limpeza/Papeleira e diferenças de LDE |
| Taxas e rankings territoriais | **NÃO HOMOLOGADOS** | Recalcular ambos canais na mesma versão de dados |
| SubTipos de Chamados | **PENDENTE DE INTEGRAÇÃO** | Integrar sem perder o detalhamento original |
| SubTipos de Ouvidorias | **REPROVADOS POR AUSÊNCIA NA NOVA FONTE** | Obter fonte completa antes de usá-los como evidência nova |
| Cinco módulos de produção com base tratada | **NÃO HOMOLOGADOS** | Atualizar contratos dos cubos oficiais e testar filtros/drill, sem redesign |
| Auditoria de protocolos individuais | **NÃO EXECUTÁVEL COM ESTAS FONTES** | Necessária base granular com identificadores e data de corte |

## 8. Ordem corretiva recomendada

1. **Bloqueio de publicação:** manter `main` intacta e PR em rascunho; explicitar que as prévias originais ainda usam cubos oficiais.
2. **Resolver Type×Gerência:** construir matriz aprovada de equivalências e exclusões sem reclassificar pelo nome do SubTipo.
3. **Resolver AP3 e SEM AP:** em uma versão derivada única, com visibilidade do antes/depois e sem reabrir snapshots anteriores.
4. **Reconciliar números por Tipo, AP, bairro, gerência e período** contra a nova fonte; não limitar o teste à soma municipal.
5. **Restaurar drill completo dos módulos oficiais**, preservando estética original, com subtipos de Ouvidorias marcados como não comparáveis.
6. **Atualizar metadados de corte e competência** e manter diferença entre institucional e operacional explícita.
7. **Testar em navegador e homologar por aceite operacional** antes de publicação.

**Limite da auditoria:** exames quantitativos e estruturais das fontes agregadas e dos artefatos existentes. Não é uma auditoria dos protocolos da plataforma 1746, das decisões de classificação de cada solicitação ou da operação em campo. A evidência não permite determinar a causa de revisões de julho a outubro.
