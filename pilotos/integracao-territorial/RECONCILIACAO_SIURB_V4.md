# Reconciliação territorial V4 — 14/10/2026

Status: **auditoria de correspondência tabular concluída; geometria e vigência pendentes**. Ambiente: branch piloto, sem mudança na main.

Fontes: resposta GeoJSON do serviço SIURB `Bairros_limites_gerenciais_COMLURB/FeatureServer/0` enviada pela usuária; `assets/geojson/DLU_Novos_Bairros_estrutura2025.geojson` e `assets/geojson/GERENCIAS_DSU.geojson` da base do HUB; `Gerencias_UCS.geojson` enviado pela usuária.

## Resultado por código de bairro

| Verificação | Resultado |
|---|---:|
| Feições do consolidado SIURB | 182 |
| Bairros distintos SIURB | 165 |
| Bairros distintos DLU HUB | 165 |
| Bairros presentes nas duas fontes | 165/165 |
| AP com o mesmo vínculo em ambas | 165/165 |
| Bairros com diferença de código de gerência DLU | **54** |
| Bairros com diferença de superintendência DLU | **51** |
| Correspondência UCS entre consolidado SIURB e GeoJSON UCS | **165/165** |

Diferenças de chaves: SIURB usa `NG10R`, `NG12I`, `NG13M`, `NG13P`, `NG20G`, `SG08T`, `SG09V`, enquanto o HUB traz `CG10R`, `CG12I`, `CG13M`, `CG13P`, `CG20G`, `CG08T`, `CG09V`. O consolidado SIURB não contém `LRC` em `first_superdlu`, diferentemente da base HUB. **Não inferir equivalência ou reorganização sem confirmação administrativa e data de vigência.**

A camada SIURB consolida vínculos de UCV (`gerencia`), UGU (`gerencia_1`), UCS (`gerencia_12`), além de DLU (`gerdlu`). Não contém campo explícito UGT. O GeoJSON UCV do HUB representa seis polígonos e não contém atributos diretos de bairro.

## Decisões de controle

- **Não substituir** a base DLU utilizada pelos cubos oficiais.
- **Não publicar** a geometria consolidada SIURB em `main` nem na branch antes de confirmar permissões de reutilização.
- Preservar códigos de origem e registrar eventuais tabelas de transição apenas após homologação funcional.
- Não somar polígonos como bairros, nem inferir atendimento a partir de área mapeada.
- Estão pendentes: comparação geométrica detalhada, análise individual das 54 divergências e validação dos vetores UGT.
- O relatório tabular completo por bairro foi produzido como artefato local desta auditoria; a presente nota registra os resultados principais sem incluir dados geográficos de acesso restrito.

**Sem alteração no HUB publicado.**

## Regra funcional confirmada pela gestão — códigos CG e LRC (14/10/2026)

A usuária confirmou expressamente que **todas as gerências com código iniciado por `C` pertencem à Superintendência `LRC`**, e solicitou a utilização dos seguintes identificadores nas análises do HUB e do piloto:

| Código da gerência | Superintendência confirmada |
|---|---|
| `CG08T` | `LRC` |
| `CG09V` | `LRC` |
| `CG10R` | `LRC` |
| `CG12I` | `LRC` |
| `CG13M` | `LRC` |
| `CG13P` | `LRC` |
| `CG20G` | `LRC` |

**Decisão do piloto:** utilizar `CG*` e `LRC` como referência operacional para essas sete gerências. Guardar os códigos divergentes da camada SIURB como atributos de origem e não reclassificar/somar automaticamente `NG*` ou `SG*` nos indicadores. A confirmação esclarece a associação das siglas; a tabela de equivalência entre versões e a vigência temporal da mudança ainda exigem documentação formal antes de converter registros históricos. Nenhum cubo ou GeoJSON da produção será modificado nesta fase.
