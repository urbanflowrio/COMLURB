# Auditoria de impacto dos insights do 1746 — outubro/2026

**Status: análise da extração nova; NÃO HOMOLOGADA para substituir o HUB publicado.** Data: 06/11/2026.

## Base e regras
- Boletim vigente: `1746-resumo-executivo/index.html` na `main`.
- Série do histórico: `1746-historico/data.js` na `main`.
- Chamados tratados: https://docs.google.com/spreadsheets/d/1qOTScQ-fldjBv9vios4aMTCiBGqa4KoQT23Yiex81UQ/edit
- Ouvidorias tratadas: https://docs.google.com/spreadsheets/d/1QYo05-kXN-F_HbShX_QIliY8Kwn6_rIgrThsfk1u_A0/edit
- Cadastro territorial: https://docs.google.com/spreadsheets/d/1u9vJsfd7TbG_5rTcXzpEVotte6QrLfMza3eT0Z_JmKI/edit
- `Tipo` governa classificação: `LIMPEZA` permanece Limpeza, `PAPELEIRA` permanece Papeleira, não reclassificar pelo `SubTipo`.
- Ouvidorias operacionais: excluir gerência `PCO`. Contar por AP padronizada e bairro padronizado, sem somar linhas de gerências aos totais dos bairros.
- Esta conferência compara **outubro de 2026 com outubro de 2025**, exceto onde indicado jan–out.

## Matriz — manter / ajustar / substituir

| Insight publicado | Resultado na extração tratada | Decisão |
|---|---|---|
| Aumento de Chamados concentrado em Limpeza | Limpeza +2.587 (publicado +2.581); cidade +2.468 (publicado +2.464), demais Tipos juntos −119 | **MANTER tese; AJUSTAR números** |
| Outubro é o menor mês de Ouvidorias operacionais jan–out/2026 | 2.213, preservado | **MANTER** |
| Remoção Gratuita lidera redução de Ouvidorias | 799 → 474, −325, preservado; setembro 468 e outubro 474 são os dois menores meses desse Tipo no ano até outubro | **MANTER** |
| Cinco grandes Tipos e Limpeza única com crescimento nos dois canais | Limpeza cresce nos dois; Coleta Domiciliar, Vetores, Manejo Arbóreo e Remoção Gratuita não crescem nos dois simultaneamente | **MANTER** |
| Chamados outubro/26 = 24.116 (+2.464) | Nova extração 24.120 (+2.468); diferença +4 **mantida em contexto**, sem substituição do oficial | **AJUSTAR só em eventual série reprocessada** |
| Chamados: Limpeza +2.581 | +2.587 | **AJUSTAR** |
| Chamados: Coleta Domiciliar +608 | +607 | **AJUSTAR** |
| Chamados: Remoção Gratuita −484 | −494 | **AJUSTAR** |
| Chamados: Manejo Arbóreo −418 | −419 | **AJUSTAR** |
| Ouvidorias: Limpeza +158 | +154 sob Tipo original, fonte nova | **AJUSTAR** |
| Ouvidorias: Remoção Gratuita −325 e Manejo Arbóreo −172 | Inalterados | **MANTER** |
| AP3 e AP5 concentram +2.310 dos +2.464 Chamados | AP3 +1.165, AP5 +1.153, **+2.318 dos +2.468**, ≈93,9% | **MANTER tese; AJUSTAR números** |
| AP3: ausência territorial | No histórico havia 469 Chamados out/25 e 540 out/26 com AP original `Nulo`; foram atribuídos a AP3 em coluna derivada. AP3 tratada: 7.994 → 9.159 (+1.165). AP3 sem essa redistribuição: 7.525 → 8.619 (+1.094). | **SUBSTITUIR eventuais recortes que descartem Nulo** |
| Campo Grande, Chamados | **1.415 → 1.791, +376 (+26,6%)**, vs publicado 1.415 → 1.796, +381 | **AJUSTAR** |
| Campo Grande, Ouvidorias | 152 → 207, +55 (+36,2%), preservado | **MANTER** |
| Campo Grande, Limpeza | Chamados **+268** (364 → 632), vs +271 publicado; Ouvidorias **+48** (58 →106), preservado | **AJUSTAR** |
| Gerência OG18G em Campo Grande | 597 Chamados, vs 599 publicado; 99 Ouvidorias, preservado | **AJUSTAR Chamados** |
| Bangu, Chamados | 577 → 986, +409 (+70,9%), preservado | **MANTER** |
| Bangu, Ouvidorias | 46 → 83, +37 (+80,4%), preservado | **MANTER** |
| Bangu, Limpeza | +405 Chamados, +20 Ouvidorias, preservados | **MANTER** |
| Gerência OG17B em Bangu | 637 Chamados e 52 Ouvidorias, preservados | **MANTER** |
| Bangu + Campo Grande respondem por 68% do crescimento da AP5 | +785 de +1.153 = **68,1%**; participação no volume da AP5 no mês-base out/25 = (577+1.415)/4.977 = **40,0%** | **MANTER**, explicitar que 40% é base out/25 |
| Campo Grande e Bangu são os dois bairros com maior aumento absoluto de Chamados e de Ouvidorias | Chamados Bangu +409, Campo Grande +376; Ouvidorias Campo Grande +55, Bangu +37; ambas lideranças preservadas | **MANTER** |
| Os dois bairros somaram +92 Ouvidorias contra −484 na cidade | Inalterado | **MANTER** |
| Nota: excluir instalação/retirada de papeleira do Tipo Limpeza para chegar a +86 no município e +47 em Campo Grande | A fonte nova informa `LIMPEZA` para esses registros; excluí-los é incompatível com a regra aprovada. Variação de **Tipo LIMPEZA**: +154 no município e +48 em Campo Grande. | **SUBSTITUIR a interpretação metodológica** |
| Remoção de resíduos, capina e varrição explicam 2.060 Chamados de Limpeza adicionais | Essa decomposição requer reconciliação por `SubTipo` da nova extração; **não homologada nesta passagem** | **REVALIDAR** antes de reeditar |
| Histórico de Remoção Gratuita indica mudanças de regime em 2021 e 2025 com causa não identificada | A nova extração não é prova de causalidade; leitura macro mantida, séries retroativas devem continuar versionadas | **MANTER com ressalva** |

## Comparação acumulada janeiro–outubro
- Chamados: fonte 2025 **245.656**, 2026 **278.810**, diferença **+13,50%**; publicado 2026 **278.888**, arredondado **+13,5%**. Diferença retroativa −78 no acumulado da fonte.
- Ouvidorias operacionais: fonte 2025 **28.192**, 2026 **32.533**, diferença **+15,40%**; publicado 2026 **32.562**, arredondado **+15,5%**. Diferença retroativa −29.
- Julho a setembro/2026: Chamados −43, −16, −23; Ouvidorias operacionais −14, −2, −13. Outubro: Chamados +4; Ouvidorias 0. Não incorporar retroativamente.
- Junho e meses anteriores coincidem nos totais mensais de 2025/2026 da extração e do publicado.

## Mudanças por AP no recorte outubro (2025 → 2026)
| AP | Chamados out/25 | Chamados out/26 | Δ Chamados | Ouvidorias operacionais out/25 | Ouvidorias operacionais out/26 | Δ Ouvidorias |
|---|---:|---:|---:|---:|---:|---:|
| AP1 | 946 | 956 | +10 | 92 | 86 | −6 |
| AP2 | 3.917 | 3.876 | −41 | 477 | 256 | −221 |
| AP3 | 7.994 | 9.159 | **+1.165** | 1.011 | 894 | −117 |
| AP4 | 3.818 | 3.999 | +181 | 563 | 386 | −177 |
| AP5 | 4.977 | 6.130 | **+1.153** | 554 | 591 | +37 |
| **Total** | **21.652** | **24.120** | **+2.468** | **2.697** | **2.213** | **−484** |

AP3 recuperou por padronização de AP originalmente `Nulo` em outubro: Chamados 469/540 (2025/2026) e Ouvidorias operacionais 57/53. **Não se trata de atendimentos novos; é redistribuição territorial dos mesmos registros.**

## Leitura para a diretoria
A tendência central permanece: outubro teve maior volume de Chamados puxado por Limpeza e menor volume de Ouvidorias operacionais, liderada pela redução em Remoção Gratuita. Territorialmente, o crescimento dos Chamados concentrou-se em AP3 e AP5; Bangu e Campo Grande lideram os aumentos de Chamados e Ouvidorias. A revisão é predominantemente de precisão numérica e governança, mas é **obrigatória** na nota de classificação por Tipo, que não deve continuar apresentando uma exclusão de SubTipo como valor corrigido de Limpeza.

## Homologação e limites
1. Documento analítico não substitui `main`, o Boletim ou os cubos oficiais.
2. Antes de editar o texto sobre subtipo (remoção/capina/varrição), executar reconciliação de `SubTipo` em Chamados. Ouvidorias: detalhamento ausente, **postergado**.
3. O pequeno delta de +4 Chamados outubro e as revisões de julho-setembro continuam como evidência histórica, sem ajuste manual.
4. Taxas e rankings por AP em Histórico, Comparativo e Linha do Tempo que tenham tratado `Nulo` como área separada devem ser reprocessados em prévia, com teste de denominadores e sem duplicação de bairros.
5. A conferência de tipos, AP, bairros e gerências deste relatório foi calculada com a extração das cópias tratadas do Drive. Limitações de fonte e falta de homologação independente permanecem.
