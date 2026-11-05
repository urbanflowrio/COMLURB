# Correspondência das classificações de papeleira, 2025 e 2026

**Data:** 05/11/2026. Complementa `AUDITORIA_BOLETIM_1746_OUT2026.md` e **corrige a divergência D2** daquele relatório. Nenhuma alteração foi feita no boletim nesta etapa.

## Conclusão

Limpeza de papeleira e implantação ou retirada de papeleira são atividades distintas e estão em subtipos distintos nas fontes. A comparação alternativa de +2.415 chamados, sugerida na auditoria, juntava as duas atividades e **não é válida**.

O que existe é um erro de padronização no histórico congelado. A base auditável de janeiro a julho remapeou `PAPELEIRA / INSTALAÇÃO E/OU RETIRADA DE PAPELEIRA` e `PAPELEIRA / INSTALAÇÃO DE PAPELEIRA` para `LIMPEZA / LIMPEZA DE PAPELEIRA, CONTÊINER E CAÇAMBA COMLURB`. Com isso, implantação e retirada passaram a contar como limpeza nos meses fechados. Outubro não aplicou esse remapeamento.

**Para outubro, o indicador de chamados de Limpeza é comparável:** +2.581. O tipo LIMPEZA não tem nenhum registro de implantação ou retirada em outubro de 2025 nem em outubro de 2026.

**O indicador de ouvidorias de Limpeza não é comparável sem ajuste:** +158. A fonte classificou 72 ouvidorias de implantação ou retirada sob LIMPEZA em outubro de 2026. Em outubro de 2025, o mesmo subtipo estava sob PAPELEIRA. Só na atividade de limpeza, a variação é de +86.

## Matriz de correspondência

Fonte: `FONTE_CHAMADOS_OUT2026_FINAL_ORIGINAL` e `FONTE_OUVIDORIAS_OUT2026_FINAL_ORIGINAL`. Ouvidorias operacionais, sem PCO.

| Atividade | Canal | Tipo na fonte | Subtipo na fonte | Out/25 | Out/26 | Jan a out/25 | Jan a out/26 | Tratamento no histórico congelado | Tratamento em outubro |
|---|---|---|---|---:|---:|---:|---:|---|---|
| Limpeza de papeleira, contêiner e caçamba | Chamados | LIMPEZA | LIMPEZA DE PAPELEIRA, CONTÊINER E CAÇAMBA COMLURB | 120 | 243 | 1.660 | 2.874 | Limpeza | Limpeza |
| Implantação ou retirada | Chamados | PAPELEIRA | INSTALAÇÃO E/OU RETIRADA DE PAPELEIRA | 164 | 0 | 1.683 | 460 | **Remapeado para limpeza de papeleira** | Papeleira |
| Implantação | Chamados | PAPELEIRA | INSTALAÇÃO DE PAPELEIRA | 2 | 0 | 18 | 0 | **Remapeado para limpeza de papeleira** | Papeleira |
| Implantação ou retirada | Chamados | LIMPEZA | INSTALAÇÃO E/OU RETIRADA DE PAPELEIRA | 0 | 0 | 68 | 4 | Limpeza | Limpeza |
| Limpeza de papeleira, contêiner e caçamba | Ouvidorias | LIMPEZA | OUV - LIMPEZA DE PAPELEIRA, CONTÊINER E CAÇAMBA COMLURB e variante sem prefixo | 13 | 35 | 157 | 454 | Limpeza | Limpeza |
| Implantação ou retirada | Ouvidorias | PAPELEIRA | OUV - INSTALAÇÃO E/OU RETIRADA DE PAPELEIRA e variante sem prefixo | 47 | 28 | 391 | 641 | Não verificado | Papeleira |
| Implantação ou retirada | Ouvidorias | LIMPEZA | OUV - INSTALAÇÃO E/OU RETIRADA DE PAPELEIRA e variante sem prefixo | 0 | 72 | 4 | 163 | Não verificado | **Limpeza** |
| Implantação | Ouvidorias | PAPELEIRA | OUV - INSTALAÇÃO DE PAPELEIRA e variante sem prefixo | 6 | 0 | 69 | 1 | Não verificado | Papeleira |
| Retirada | Ouvidorias | PAPELEIRA | OUV - RETIRADA DE PAPELEIRA | 0 | 0 | 2 | 0 | Não verificado | Papeleira |

Evidência do remapeamento: `BASE_AUDITAVEL_CHAMADOS_1746_JULHO_2026_COMPLETA_REPARADA.xlsx`, aba `Dados`, colunas `Tipo_Padronizado` e `SubTipo_Padronizado`. São nove remapeamentos na base; sete retiram prefixos ou unificam variantes do mesmo serviço, e os dois de papeleira mudam a atividade.

## O que se pode afirmar

1. **Chamados de implantação ou retirada desapareceram da base a partir de maio de 2026.** Foram 189, 124, 132 e 12 de janeiro a abril, e quase zero depois. Eles não migraram para outro subtipo das fontes examinadas. Não há evidência de mudança de canal, sistema ou cadastro; é uma ausência de registros, não uma reclassificação demonstrada.
2. **Ouvidorias de implantação ou retirada continuam existindo**, divididas entre os tipos PAPELEIRA e LIMPEZA. Somando os dois tipos, foram 53 em outubro de 2025 e 100 em outubro de 2026.
3. **Limpeza de papeleira é uma atividade estável**, sempre classificada em LIMPEZA nos dois anos e nos dois canais.

## Efeito sobre o boletim (proposta, não aplicada)

| Trecho | Situação | Proposta |
|---|---|---|
| Nota: "com esse critério, a alta de Limpeza em outubro seria de 2.415 chamados" | **Incorreta**: o critério mistura atividades | Retirar |
| "Limpeza respondeu por praticamente todo o aumento, com 2.581 chamados a mais" | Número correto e comparável; "praticamente todo" subestima, pois 2.581 supera o aumento total de 2.464 | Voltar a "Limpeza teve 2.581 chamados a mais, acima do aumento total da cidade", com a nota de que os demais serviços tiveram 117 a menos |
| Ouvidorias de Limpeza +158 | Não comparável: inclui 72 registros de implantação ou retirada | Exibir +86 para a atividade de limpeza, com nota sobre os 72 |
| "Limpeza foi o único que cresceu nos dois canais" | Mantém-se com +86 | Manter |
| Campo Grande, participação de Limpeza em ouvidorias | Inclui 1 registro de implantação ou retirada | Ajustar para 47 das 55, ou manter 48 com nota |
| Bangu, participação de Limpeza em ouvidorias | Nenhum registro de implantação ou retirada em Limpeza | Manter 20 das 37 |
| Nota de Papeleira | Correta: sem registros desde maio de 2026 nas fontes examinadas | Manter, sem citar 2.415 |

## Efeito fora do boletim

As séries de Limpeza de janeiro a setembro no Histórico, na Linha do Tempo e nos cubos incluem implantação e retirada de papeleira como limpeza: 1.535 chamados em 2025 e 460 em 2026. Como esses registros quase desapareceram em 2026, o remapeamento **reduz artificialmente a alta de Limpeza** nos meses fechados. Corrigir isso significa alterar o histórico congelado, o que exige decisão formal sobre a regra de data de corte.

## Limitações

- O remapeamento foi confirmado na base auditável de chamados de janeiro a julho. A base de ouvidorias e os fechamentos de agosto e setembro não foram examinados nesta etapa.
- As fontes são agregadas por subtipo. Não é possível confirmar, registro a registro, se algum chamado de implantação ou retirada foi aberto com o subtipo de limpeza.
