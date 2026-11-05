# Diagnóstico de classificação nas séries históricas do 1746

**Data:** 05/11/2026. **Situação:** diagnóstico. Nenhum histórico congelado, cubo ou módulo foi alterado. Qualquer reclassificação depende de autorização expressa.

Complementa `CORRESPONDENCIA_PAPELEIRA.md`. Escopo: mapas de padronização e dados das bases auditáveis de julho, agosto e setembro de 2026 (chamados e ouvidorias), fontes primárias de outubro de 2026 e cubos publicados no HUB.

## Arquivos examinados

| Arquivo | Uso |
|---|---|
| `BASE_AUDITAVEL_CHAMADOS_1746_JULHO_2026_COMPLETA_REPARADA.xlsx`, aba `Dados` | Fechamento de janeiro a julho, chamados |
| `ouvidoria_base_auditavel_jul2026_COMPLETA.xlsx`, abas `Dados` e `Mapa_SubTipo` | Fechamento de janeiro a julho, ouvidorias |
| `BASE AUDITÁVEL CHAMADOS 1746 · FECHAMENTO AGO 2026` e `· FECHAMENTO SET 2026 · POS AUDITORIA V2`, abas `Dados_Mes` e `Mapa_Padronizacao` | Fechamentos de agosto e setembro, chamados |
| `BASE AUDITÁVEL OUVIDORIAS 1746 · FECHAMENTO AGO 2026` e `· FECHAMENTO SET 2026 · POS AUDITORIA V2`, mesmas abas | Fechamentos de agosto e setembro, ouvidorias |
| `FONTE_CHAMADOS_OUT2026_FINAL_ORIGINAL`, `FONTE_OUVIDORIAS_OUT2026_FINAL_ORIGINAL` | Classificação atual da fonte, janeiro a outubro dos dois anos |
| `chamados-1746/chamados_cube.js`, `ouvidoria/ouvidoria_cube.js`, `1746-historico/data.js` | Séries publicadas |

Ouvidorias sempre operacionais (sem PCO). Script: `diagnostico_classificacao.py`.

## Conclusões

1. **Chamados: o erro de padronização está em todos os fechamentos de janeiro a setembro.** O `Mapa_Padronizacao` de agosto e de setembro mantém ativa a regra `Tipo PAPELEIRA → LIMPEZA`, de vigência "Histórica". Julho foi além e trocou também o subtipo para limpeza de papeleira. Outubro não aplicou a regra. A série publicada de Limpeza mistura, portanto, dois critérios dentro do mesmo acumulado.
2. **O efeito em chamados é subestimar a alta de Limpeza.** Foram 1.535 chamados de implantação ou retirada somados a Limpeza em 2025 e 460 em 2026. No acumulado de janeiro a outubro, a variação publicada é +23,9%; só na atividade de limpeza, +25,8%.
3. **Ouvidorias: não há remapeamento, mas a fonte classifica de forma instável.** Os mapas de ouvidorias não têm regra de papeleira. A própria fonte registrou parte das ouvidorias de implantação ou retirada sob LIMPEZA: 329 em 2026 e 4 em 2025, no que foi congelado. Além disso, a fonte reclassificou retroativamente julho a setembro de 2026: nos fechamentos, 49, 63 e 58 estavam em LIMPEZA; na extração de outubro, 0, 1 e 3.
4. **O efeito em ouvidorias é o inverso: superestimar a alta de Limpeza.** No acumulado, +29,3% publicado contra +26,8% só na atividade de limpeza.
5. **Há um agrupamento maior a decidir em ouvidorias de Limpeza: caçamba comunitária.** O segundo maior subtipo de Limpeza em ouvidorias é informação sobre instalação e retirada de caçamba da COMLURB para atendimento em comunidade (2.117 em 2025 e 3.506 em 2026, de janeiro a outubro). É a mesma situação de papeleira: instalação e retirada, não limpeza. Responde por cerca de 38% da alta acumulada de ouvidorias de Limpeza na fonte. Não afeta outubro (266 para 271).
6. **Duas regras legítimas de nomenclatura não foram aplicadas em outubro.** A unificação de poda com e sem "(180 DIAS)" e a retirada do prefixo "OUV -" valem de janeiro a setembro, mas não no recorte de outubro dos cubos. O total por tipo não muda; o acumulado por subtipo aparece duplicado.
7. **O Histórico declara a regra correta e publica o dado errado.** `1746-historico/data.js` registra como princípio que implantação ou retirada e limpeza de papeleira "permanecem séries distintas", mas os chamados de Papeleira de julho a setembro estão nulos e somados a Limpeza.
8. **Boletim de outubro:** só os itens 3 e 4 o afetam, já tratados na nota de Classificação. Os demais itens não alteram nenhum número exibido.

## Matriz geral de inconsistências

Categorias: **E** erro efetivo de padronização (transformação nossa que muda a atividade); **F** classificação inconsistente na fonte (não é transformação nossa, mas afeta a comparação); **N** mudança legítima de nomenclatura; **S** serviço operacionalmente diferente agrupado sob o mesmo tipo pela fonte (pede decisão, não correção).

Volumes de janeiro a outubro, 2025 e 2026.

| # | Cat. | Canal | Item | Onde | Volume | Efeito | Boletim out/26 |
|---|---|---|---|---|---|---|---|
| 1 | E | Chamados | Tipo PAPELEIRA (implantação ou retirada) somado a LIMPEZA | Mapas de ago e set, regra ativa "Histórica"; base de jul | 1.535 e 460 (jan a set) | Limpeza: alta subestimada em todos os meses de jan a set; Papeleira some da série | Não afeta |
| 2 | E | Chamados | Subtipo implantação ou retirada trocado para limpeza de papeleira, contêiner e caçamba | Base de jul (jan a jul). A base de set registra a regra como inativa e pendente, mas o dado de jan a jul permanece | 1.144 e 459 (jan a jul) | Subtipo limpeza de papeleira no acumulado: +19% publicado contra +73% na fonte | Não afeta |
| 3 | F | Ouvidorias | Implantação ou retirada de papeleira registrada sob LIMPEZA pela fonte | Fonte; preservado nos fechamentos | 4 e 329 (congelado) | Limpeza: alta superestimada; Papeleira subestimada | **Tratado na nota (+158 e +86)** |
| 4 | F | Ouvidorias | Reclassificação retroativa da fonte entre extrações | Jul a set/2026: fechamento contra extração de out | 170 em LIMPEZA nos fechamentos, 4 na extração atual | Série congelada e fonte atual divergem por subtipo; totais por tipo também | Não afeta |
| 5 | F | Chamados | Implantação ou retirada de papeleira sob o tipo LIMPEZA na própria fonte | Fonte: jan e fev/2025, mar/2026 | 68 e 4 | Pequeno; soma-se ao item 1 | Não afeta |
| 6 | S | Ouvidorias | Informação sobre instalação e retirada de caçamba comunitária dentro de LIMPEZA | Fonte | 2.117 e 3.506 | Cerca de 38% da alta acumulada de ouvidorias de Limpeza | Não afeta (+5 em out) |
| 7 | N, a confirmar | Ouvidorias | Retirada de caçamba comunitária (221 e 9, zero desde fev/2026) e o subtipo do item 6 | Fonte | 221 e 9 | Possível migração de nome; sem prova. Mesmo somados, crescem 50% | Não afeta |
| 8 | S | Ouvidorias | Implantação de varrição dentro de LIMPEZA | Fonte | 39 e 4 | Pequeno | Não afeta |
| 9 | S | Ambos | Limpeza de papeleira, contêiner e caçamba é um único subtipo para três equipamentos | Fonte | Chamados 1.660 e 2.874 | A fonte não permite separar caçamba e contêiner de papeleira | Não afeta |
| 10 | F | Ambos | Fiscalização de caçamba particular em dois lugares: tipo próprio nas ouvidorias e subtipo de Fiscalização de Grande Gerador nos dois canais | Fonte | Chamados 1 e 86, sendo 70 em out/26 | Fora de Limpeza; salto novo em out/26 a acompanhar | Não afeta (Demais serviços) |
| 11 | N | Chamados | Poda com e sem "(180 DIAS)" | Unificada jan a set; não unificada em out nos cubos | Out: 1.576 e 1.227 em subtipos separados | Acumulado por subtipo duplicado; tipo correto | Já citado na nota |
| 12 | N | Ouvidorias | Prefixo "OUV -" | Retirado jan a set; mantido em out nos cubos | Todos os subtipos de out | Acumulado por subtipo duplicado; tipo correto | Não afeta |
| 13 | N | Ouvidorias | Limpeza de praças e parques para "parque" | Mapas de ago e set | Pequeno | Correto | Não afeta |
| 14 | N, a confirmar | Ouvidorias | Limpeza de praças, subtipo à parte de limpeza de praças e parque | Fonte, sem regra | 36 e 28 | Possível variante de nome | Não afeta |
| 15 | N, a confirmar | Ouvidorias | Controle de roedores e controle de caramujos para controle de roedores e caramujos africanos | Fonte, sem regra | 42 e 3 | Possível unificação de nome em Vetores | Não afeta |
| 16 | Sem inconsistência | Ouvidorias | Comportamento de equipe e danos a terceiros em vários tipos | Fonte | | Subtipos transversais, corretamente atribuídos ao serviço | Não afeta |

## Impacto na série de Limpeza

### Chamados

Publicado: cubo de chamados e Histórico. Remapeado: tipo PAPELEIRA original incluído em LIMPEZA nos fechamentos.

| Mês | Publicado 2025 | Publicado 2026 | Var. publicada | Remapeado 2025 | Remapeado 2026 | Só limpeza 2025 | Só limpeza 2026 | Var. só limpeza |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Janeiro | 13.730 | 11.375 | −17,2% | 175 | 189 | 13.555 | 11.186 | −17,5% |
| Fevereiro | 10.183 | 12.946 | +27,1% | 170 | 124 | 10.013 | 12.822 | +28,1% |
| Março | 8.333 | 14.972 | +79,7% | 185 | 132 | 8.148 | 14.840 | +82,1% |
| Abril | 8.649 | 11.253 | +30,1% | 189 | 12 | 8.460 | 11.241 | +32,9% |
| Maio | 9.060 | 8.258 | −8,9% | 104 | 0 | 8.956 | 8.258 | −7,8% |
| Junho | 6.026 | 6.263 | +3,9% | 145 | 0 | 5.881 | 6.263 | +6,5% |
| Julho | 5.781 | 8.447 | +46,1% | 176 | 2 | 5.605 | 8.445 | +50,7% |
| Agosto | 6.512 | 10.533 | +61,7% | 167 | 0 | 6.345 | 10.533 | +66,0% |
| Setembro | 6.598 | 7.538 | +14,2% | 224 | 1 | 6.374 | 7.537 | +18,2% |
| Outubro | 5.745 | 8.326 | +44,9% | 0 | 0 | 5.745 | 8.326 | +44,9% |
| **Jan a out** | **80.617** | **99.911** | **+23,9%** | **1.535** | **460** | **79.082** | **99.451** | **+25,8%** |

O total da cidade não muda: os registros só trocam de tipo.

### Ouvidorias

Publicado: cubo de ouvidorias. Implantação ou retirada em Limpeza: classificação da fonte preservada nos fechamentos; em outubro, os 72 do boletim.

| Mês | Publicado 2025 | Publicado 2026 | Var. publicada | Impl. ou retirada 2025 | Impl. ou retirada 2026 | Só limpeza 2025 | Só limpeza 2026 | Var. só limpeza |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Janeiro | 1.988 | 1.728 | −13,1% | 1 | 4 | 1.987 | 1.724 | −13,2% |
| Fevereiro | 1.607 | 1.929 | +20,0% | 0 | 33 | 1.607 | 1.896 | +18,0% |
| Março | 1.317 | 2.626 | +99,4% | 0 | 43 | 1.317 | 2.583 | +96,1% |
| Abril | 1.316 | 2.160 | +64,1% | 0 | 1 | 1.316 | 2.159 | +64,1% |
| Maio | 1.542 | 1.516 | −1,7% | 1 | 1 | 1.541 | 1.515 | −1,7% |
| Junho | 1.071 | 1.180 | +10,2% | 0 | 5 | 1.071 | 1.175 | +9,7% |
| Julho | 976 | 1.497 | +53,4% | 0 | 49 | 976 | 1.448 | +48,4% |
| Agosto | 1.075 | 1.740 | +61,9% | 1 | 63 | 1.074 | 1.677 | +56,1% |
| Setembro | 1.110 | 1.275 | +14,9% | 1 | 58 | 1.109 | 1.217 | +9,7% |
| Outubro | 1.011 | 1.169 | +15,6% | 0 | 72 | 1.011 | 1.097 | +8,5% |
| **Jan a out** | **13.013** | **16.820** | **+29,3%** | **4** | **329** | **13.009** | **16.491** | **+26,8%** |

A coluna "só limpeza" não retira caçamba comunitária (item 6), que depende de decisão.

## Módulos afetados

| Módulo | Arquivo | O que está afetado |
|---|---|---|
| Chamados 1746 | `chamados-1746/chamados_cube.js` e cópia em `assets/data/` | Limpeza e Papeleira em acumulado e setembro (item 1); subtipo limpeza de papeleira no acumulado (item 2); poda duplicada no acumulado (item 11) |
| Ouvidorias | `ouvidoria/ouvidoria_cube.js` e cópia em `assets/data/` | Limpeza e Papeleira em todos os períodos (item 3); subtipos duplicados no acumulado (item 12) |
| Histórico | `1746-historico/data.js` | Limpeza de chamados de jul a set e acumulado (item 1); taxa de ouvidorias por mil chamados de Limpeza combina os dois efeitos em sentidos opostos; Papeleira de chamados nula de jul a set |
| Linha do Tempo | `1746-timeline/data.js`, `cascade_data.js` | Mesmos efeitos de Histórico, também no cruzamento bairro e gerência |
| Boletim Executivo | `1746-resumo-executivo/` | Corrigido nesta etapa; usa só outubro |
| Camada SARC | Indicadores Gerais e AR | Fora do escopo; independente por regra |

## Decisão pendente

Três caminhos, nenhum aplicado:

1. **Manter o congelado e registrar a ressalva** nos módulos. Não altera números; a série de Limpeza segue com critério misto.
2. **Publicar uma série reclassificada paralela**, documentada e conciliada, preservando a versão originalmente publicada. Exige: regra formal para papeleira nos dois canais; decisão sobre caçamba comunitária (item 6); aplicação das regras de nomenclatura também em outubro (itens 11 e 12); conciliação de totais por mês contra os fechamentos.
3. **Reabrir os fechamentos.** Contraria a regra de data de corte.

Para ouvidorias, o caminho 2 tem um limite: a fonte reclassificou meses já fechados (item 4). Uma série "só limpeza" baseada na extração atual não reproduz o congelado; baseada no congelado, não reproduz a fonte atual. É preciso escolher a referência.

## Limitações

- As fontes são agregadas por tipo, subtipo, mês, gerência e bairro. Não é possível conferir protocolos individuais.
- Itens marcados "a confirmar" são hipóteses de nomenclatura, não comprovadas.
- As bases de agosto e setembro registram só o mês da competência; janeiro a julho vêm da base de julho.
