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

## Regra funcional confirmada — prefixo C nas gerências DLU (14/10/2026)

**Regra geral:** toda gerência da DLU cujo código começa com a letra `C` pertence à Superintendência **LRC**, independentemente das demais letras ou números. Não se limita às sete gerências `CG` citadas como exemplos.

Exemplos: `CG08T`, `CG09V`, `CG10R`, `CG12I`, `CG13M`, `CG13P`, `CG20G`. A relação é ilustrativa, não exaustiva.

**Regra do piloto:** classificar como `LRC` todos os códigos de gerências DLU que, após normalização de espaços e caixa, iniciem por `C`. Não estender a regra às coordenadorias e gerências DSU. Preservar os códigos originais das fontes para rastreabilidade; diferenças do SIURB e equivalências históricas exigem confirmação de vigência antes de recodificação. Nenhum cubo ou mapa oficial de produção deve ser modificado nesta etapa.
