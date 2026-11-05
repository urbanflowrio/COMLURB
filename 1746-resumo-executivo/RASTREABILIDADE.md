# Rastreabilidade do Boletim Executivo 1746, outubro de 2026

Cada afirmação do boletim (`1746-resumo-executivo/index.html`) tem origem identificável nos cubos auditados do repositório. A verificação é automática:

```
node tests/1746-outubro/boletim-rastreabilidade.cjs
```

O script recalcula cada valor a partir dos cubos, confirma que o número exibido no HTML é o calculado e reprova o texto se uma afirmação rejeitada pela auditoria voltar à página. Resultado em 05/11/2026, após as correções: 48 verificações aprovadas, nenhuma falha. Após a correção de Papeleira em 05/11/2026: 55 verificações aprovadas, nenhuma falha.

A auditoria independente das fontes primárias está em `auditoria/1746-out2026/AUDITORIA_BOLETIM_1746_OUT2026.md`, com script reproduzível em Python.

## Tipos de validação

| Tipo | O que cobre | Como é feita | Situação |
|---|---|---|---|
| Numérica (cubos) | Cada número do boletim é igual ao valor calculado nos cubos; somas fecham os totais; a base da Linha do Tempo concilia com os cubos | Automática: `boletim-rastreabilidade.cjs` | Aprovada |
| Numérica (fontes primárias) | Cubos, staging e Linha do Tempo conferidos contra as exportações agregadas da COMLURB | Automática: `auditoria/1746-out2026/auditoria_independente.py` | Aprovada; divergência zero em outubro |
| Estrutural e visual | Cabeçalho, rodapé e logo do HUB, três momentos, ausência de tabelas e travessões, largura no celular | Automática: `executivo.spec.cjs` em navegador real | Aprovada localmente; execução em CI registrada no workflow da branch |
| Metodológica | Critérios de seleção, tratamento das gerências, robustez das leituras em outras janelas e taxonomias | Auditoria de 05/11/2026 e revisão humana | Três leituras corrigidas; aceite pendente |
| Editorial | Clareza, hierarquia, ausência de conclusões causais ou sem evidência | Revisão humana | Pendente de homologação |

A validação numérica confirma que os números estão corretos e presentes. Ela não valida a interpretação: a versão anterior passou nas verificações numéricas e ainda assim continha uma leitura incorreta da base de comparação. Por isso as afirmações rejeitadas passaram a ter testes próprios.

## Situação dos dados

| Etapa | Situação | Referência |
|---|---|---|
| Preparação dos dados de outubro | Incorporados fora da `main` em 04/11/2026 | commit `8182241`, branch `preparacao-1746-outubro-2026` |
| Auditoria interna | Concluída em 04/11/2026 | `staging/1746-outubro-2026/AUDITORIA_HUB_COMPLETO_2026-11-04.md` |
| Publicação dos dados de outubro | Merge na `main` em 04/11/2026, 15:23 | commit `36892a8` |
| Refinamento visual posterior | Na `main` em 04/11/2026, 16:41, sem alteração de dados | commit `be5a809` |
| Homologação independente | Não realizada | `data-cutoff.json` dos módulos Chamados 1746 e Ouvidoria |
| Data de corte da extração | Não informada; mantida nula até haver documentação da extração | campo `data_corte` nos dois `data-cutoff.json` |

Auditoria interna, publicação e homologação independente são etapas distintas e não devem ser tratadas como equivalentes.

## Fontes

| Código | Arquivo | Objeto |
|---|---|---|
| CC | `chamados-1746/chamados_cube.js` | `window.CHAMADOS_CUBE` |
| OC | `ouvidoria/ouvidoria_cube.js` | `window.OUVIDORIA_CUBE` |
| TC | `1746-timeline/cascade_data.js` | `window.TIMELINE1746_CASCADE` |

O cruzamento entre bairro e gerência existe apenas na base da Linha do Tempo (TC). Ele é usado somente depois de conciliado com os totais de bairro e de AP dos cubos CC e OC.

## Afirmações

| ID | Afirmação no boletim | Origem | Fórmula ou critério |
|---|---|---|---|
| A1 | Chamados: 21.652 em out/2025 e 24.116 em out/2026, +11,4%, 2.464 a mais | CC `periods.outubro.all` | `total2025`, `total2026`, `var`, `dif` |
| A2 | Ouvidorias operacionais: 2.697 e 2.213, −17,9%, 484 a menos | OC `periods.outubro.all` | idem; PCO excluída na origem do cubo |
| A3 | No ano: chamados +13,5%, ouvidorias operacionais +15,5% | CC e OC `periods.acumulado.all` | `var` do acumulado janeiro a outubro, 2026 contra 2025 |
| A4 | Decomposição por serviço (chamados e ouvidorias) | CC e OC `periods.outubro.all.children` | `dif` de cada serviço; "Demais serviços" = total menos os serviços nomeados; soma dos serviços igual ao total |
| A5 | Remoção Gratuita: 474 ouvidorias contra 799 em out/2025; setembro e outubro foram os dois menores meses do serviço em 2026 | OC `periods.acumulado.byTipo['REMOÇÃO GRATUITA'].mensal` | valores de outubro; menores valores de `v2026` na série de janeiro a outubro |
| A6 | Outubro registrou o menor volume mensal de ouvidorias operacionais de janeiro a outubro de 2026, com a maior redução em Remoção Gratuita | OC `periods.acumulado.all.mensal` e `periods.outubro.all.children` | menor `v2026` da série; serviço com o `dif` mais negativo |
| A4b | Limpeza teve 2.581 chamados a mais, acima do aumento total da cidade; os demais serviços somaram 117 a menos | CC `periods.outubro.all.children` | `dif` de LIMPEZA maior que o `dif` total; o tipo LIMPEZA não tem implantação ou retirada de papeleira em out/2025 nem em out/2026, logo a comparação é direta. Papeleira não é somada a Limpeza (serviços distintos; ver `auditoria/1746-out2026/CORRESPONDENCIA_PAPELEIRA.md`) |
| A4c | Ouvidorias de Limpeza: +158 na classificação da fonte; +86 só na atividade de limpeza; Campo Grande 48 e 47 | OC `periods.outubro.byTipo.LIMPEZA.children` e TC `full['Outubro/2026']` | +158 é o `dif` oficial do tipo; +86 retira os 72 registros de `OUV - INSTALAÇÃO E/OU RETIRADA DE PAPELEIRA` classificados em LIMPEZA em out/2026 (0 em out/2025). No boletim, o painel e os bairros usam o valor oficial; o ajustado aparece só na nota de Classificação |
| A7 | Remoção de resíduos, capina e varrição respondem por 2.060 chamados adicionais | CC `periods.outubro.byTipo.LIMPEZA.children` | soma de `dif` dos três subtipos de logradouro |
| A8 | Entre os cinco serviços que somam 97,6% dos chamados, Limpeza foi o único que cresceu nos dois canais | CC e OC `periods.outubro.all.children` | grande serviço: pelo menos 5% dos chamados de out/2025; crescimento: `dif` positivo em chamados e em ouvidorias |
| A9 | AP5 e AP3 reúnem 2.310 dos 2.464 chamados adicionais; na AP5, Campo Grande e Bangu somam 68% do aumento, contra 40% do volume da área | CC `periods.outubro.all.ap` e TC `full['Outubro/2026']` | bairros agregados por AP na TC, conciliados com o `dif` por AP do cubo; participação no aumento e no volume de out/2025 |
| A10 | Campo Grande e Bangu: valores dos dois períodos, participação de Limpeza, gerências OG18G e OG17B, 92 ouvidorias a mais | CC e OC `periods.outubro.all.bairros`, `byTipo.LIMPEZA.bairros`; TC para as gerências | critério de seleção abaixo; registros da gerência somados dentro do bairro na TC |

## Critérios

**Serviços citados.** São os cinco com pelo menos 5% dos chamados de outubro de 2025: Remoção Gratuita, Limpeza, Manejo Arbóreo, Vetores e Coleta Domiciliar. O critério por ouvidorias (pelo menos 5% delas) leva à mesma conclusão sobre Limpeza.

**Bairros destacados.** São os dois com maior aumento absoluto de chamados em outubro (Bangu +409, Campo Grande +381). Os mesmos dois são os de maior aumento de ouvidorias (Campo Grande +55, Bangu +37).

**Gerências.** OG18G e OG17B aparecem como atributo do bairro, nunca como alerta independente. Os registros da gerência dentro do bairro já estão contidos no total do bairro e não são somados.

| Bairro | Gerência | Chamados out/25 e out/26 | Ouvidorias out/25 e out/26 |
|---|---|---|---|
| Campo Grande | OG18G | 317 e 599 | 48 e 99 |
| Bangu | OG17B | 221 e 637 | 28 e 52 |

Em Bangu, a OG17B cresceu mais que o bairro porque as demais gerências do bairro tiveram saldo de 7 chamados a menos.

## Afirmações rejeitadas pela auditoria de 05/11/2026

O teste reprova a página se qualquer uma delas voltar ao texto.

| Afirmação retirada | Motivo |
|---|---|
| Volume excepcional de Remoção Gratuita em outubro de 2025 | Out/2025 (799) está no nível típico de 2025, 6º de 12 meses; o atípico foi o vale de julho a setembro de 2025 |
| Sem Remoção Gratuita, a redução seria de 8,4% | Sustentava a leitura acima |
| Limpeza respondeu por praticamente todo o aumento | Subestimava: 2.581 supera o aumento total de 2.464 |
| Com Papeleira somada a Limpeza, a alta seria de 2.415 chamados | Somava implantação ou retirada de papeleira à limpeza de papeleira, serviços distintos |
| AP5 concentrada e AP3 distribuída | Efeito do número de bairros: as duas APs precisam de cerca de 10% dos bairros para somar metade da alta |
| Papeleira ausente em 2026 ou em desuso | O tipo teve 457 chamados de janeiro a abril de 2026; a ausência de registros não comprova descontinuação formal |
| Menor volume do ano | Novembro e dezembro de 2026 não estão fechados; usar "de janeiro a outubro de 2026" |

## Limitações

- As variações descrevem volume de registros e não medem, isoladamente, a qualidade dos serviços.
- As fontes primárias são exportações agregadas de tabela dinâmica, não registros individuais do sistema 1746. Os totais estão conciliados com essas exportações; não houve auditoria de protocolos.
- Papeleira (implantação ou retirada): 166 chamados em out/2025, em "Demais serviços"; 3 de maio a outubro de 2026. Na base auditável de janeiro a julho, esses chamados foram remapeados para limpeza de papeleira; o histórico congelado não foi alterado (ver diagnóstico em `auditoria/1746-out2026/DIAGNOSTICO_CLASSIFICACAO_HISTORICO.md`).
- Ouvidorias: 72 registros de implantação ou retirada classificados como Limpeza em out/2026 pela fonte; o boletim mantém o valor oficial e informa o ajustado na nota.
- Manejo Arbóreo: o subtipo de avaliação de poda mudou de nome em 2026 (1.576 em out/2025 no nome antigo; 1.227 em out/2026 na versão "180 dias"), o que afeta a comparação do serviço.
- Não há série de 2024 nas fontes; sazonalidade e tendência não podem ser separadas.
- O cruzamento bairro por gerência depende da base da Linha do Tempo, conciliada com os cubos, mas não publicada nos módulos de Chamados e Ouvidoria.
- Não há homologação independente do sistema 1746, e a data de corte da extração não foi informada.
