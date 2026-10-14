# Correspondência territorial DLU — verificação de 14/10/2026

**Resultado:** os 32 códigos de gerências DLU aparecem nos três módulos Chamados 1746, Ouvidoria e IPL. Validação de chaves aprovada; delimitações espaciais ainda não homologadas.

## Correção do diagnóstico inicial

O atributo correto das gerências é `gerdlu`, **não** `first_superdlu`. O GeoJSON `assets/geojson/DLU_Novos_Bairros_estrutura2025.geojson` contém **215 feições**, **32 códigos distintos no atributo `gerdlu`** e **5 feições sem `gerdlu`**. A afirmação anterior de 178 feições sem gerência estava incorreta: 178 é a quantidade de feições sem `first_superdlu`, campo de outro nível territorial.

## Reconciliação

| Fonte | Códigos em comum com os 32 de `gerdlu` | Total de categorias no cubo | Outros códigos fora das 32 gerências |
|---|---:|---:|---:|
| Chamados 1746, `periods.acumulado.all.gerencias` | 32/32 | 53 | 21 |
| Ouvidoria, `periods.acumulado.all.gerencias` | 32/32 | 54 | 22 |
| IPL, `NOTA_HISTORICO_AGO_2026` com prefixo `GER:` | 32/32 | 32 gerências | — |

Códigos: `BG16F`, `BG16J`, `BG24B`, `BG24R`, `CG08T`, `CG09V`, `CG10R`, `CG12I`, `CG13M`, `CG13P`, `CG20G`, `NG11P`, `NG14I`, `NG15H`, `NG15M`, `NG22A`, `NG25F`, `NG31V`, `OG17B`, `OG18G`, `OG18V`, `OG19C`, `OG26P`, `OG33R`, `SG01P`, `SG02C`, `SG03R`, `SG04B`, `SG05C`, `SG06L`, `SG07S`, `SG27R`.

**Totais jan–set/2026:** os 32 códigos DLU representam **110.741 de 254.772 chamados** e **17.525 de 30.349 ouvidorias**. Os totais maiores incluem outras unidades e não devem ser confundidos com a soma das gerências DLU.

O IPL está referenciado a **agosto/2026**, na métrica **Nota Histórico IPL**; não representa o total do período jan–set/2026 e não deve ser combinado matematicamente com os demais indicadores.

## Pendências de homologação

1. Inspecionar espacialmente as cinco feições `gerdlu` vazias.
2. Validar versão, vigência e geometrias das 32 gerências com a camada institucional SIURB.
3. Conferir vínculos gerência–bairro antes de qualquer drill-down ou rateio por população.
4. Validar dicionário e metodologia do Censo antes de calcular taxa per capita.
5. Testar responsividade e regressão do módulo já publicado.

**Controle:** nenhuma alteração na `main`, no Território Operacional ou nos valores oficiais.