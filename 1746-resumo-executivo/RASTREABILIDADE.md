# Rastreabilidade do Boletim Executivo 1746, outubro de 2026

Cada afirmação do boletim (`1746-resumo-executivo/index.html`) tem origem identificável nos cubos auditados do repositório. A verificação é automática:

```
node tests/1746-outubro/boletim-rastreabilidade.cjs
```

O script recalcula cada valor a partir dos cubos e confirma que o número exibido no HTML é o calculado. Resultado em 05/11/2026: 36 verificações aprovadas, nenhuma falha.

## Tipos de validação

| Tipo | O que cobre | Como é feita | Situação |
|---|---|---|---|
| Numérica | Cada número do boletim é igual ao valor calculado nos cubos; somas fecham os totais; a base da Linha do Tempo concilia com os cubos | Automática: `boletim-rastreabilidade.cjs` | 36 de 36 aprovadas |
| Estrutural e visual | Cabeçalho, rodapé e logo do HUB, três momentos, ausência de tabelas e travessões, largura no celular | Automática: `executivo.spec.cjs` em navegador real | Aprovada localmente; execução em CI registrada no workflow da branch |
| Metodológica | Critérios de seleção (grande serviço, bairros destacados), tratamento das gerências, leitura do efeito de base | Revisão humana dos critérios desta página | Critérios documentados; aceite pendente |
| Editorial | Clareza, hierarquia, ausência de conclusões causais ou sem evidência | Revisão humana | Pendente de homologação |

A validação numérica confirma que os números estão corretos e presentes. Ela não valida a interpretação: escolher um critério, chamar uma base de "excepcional" ou destacar dois bairros são decisões metodológicas e editoriais, que dependem de aceite humano.

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
| A5 | Remoção Gratuita: 799 ouvidorias em out/2025, mais que o triplo de set/2025 (246); 469 em set/2026 e 474 em out/2026 | OC `periods.acumulado.byTipo['REMOÇÃO GRATUITA'].mensal` | valores mensais `v2025` e `v2026` |
| A6 | Sem Remoção Gratuita, a redução seria de 8,4% | OC `periods.outubro.all` e `children` | (2.213 − 474) ÷ (2.697 − 799) − 1 = 1.739 ÷ 1.898 − 1 |
| A7 | Remoção de resíduos, capina e varrição respondem por 2.060 chamados adicionais | CC `periods.outubro.byTipo.LIMPEZA.children` | soma de `dif` dos três subtipos de logradouro |
| A8 | Entre os cinco serviços que somam 97,6% dos chamados, Limpeza foi o único que cresceu nos dois canais | CC e OC `periods.outubro.all.children` | grande serviço: pelo menos 5% dos chamados de out/2025; crescimento: `dif` positivo em chamados e em ouvidorias |
| A9 | AP5 e AP3 reúnem 2.310 dos 2.464 chamados adicionais; na AP5, dois bairros somam 68% do aumento; na AP3, 56 dos 80 bairros cresceram e nenhum passa de 11% | CC `periods.outubro.all.ap` e TC `full['Outubro/2026']` | bairros agregados por AP na TC, conciliados com o `dif` por AP do cubo |
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

## Limitações

- As variações descrevem volume de registros e não medem, isoladamente, a qualidade dos serviços.
- A redução das ouvidorias em outubro é influenciada por uma base de comparação atípica; a afirmação é aritmética e não atribui causa ao pico de outubro de 2025.
- Em outubro de 2025, 166 chamados foram classificados no serviço Papeleira, classificação ausente em 2026. Eles estão em "Demais serviços" e afetam a comparação desse grupo.
- O cruzamento bairro por gerência depende da base da Linha do Tempo, conciliada com os cubos, mas não publicada nos módulos de Chamados e Ouvidoria.
- Não há homologação independente do sistema 1746, e a data de corte da extração não foi informada.
