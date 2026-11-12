# 1746 | Regras de classificação e nomenclatura

Decisões aprovadas em 12/11/2026 para os módulos do HUB COMLURB.

## Base de referência

Usar as bases históricas de Chamados e Ouvidorias do 1746 extraídas em **11/11/2026** para recalcular outubro e os meses anteriores cobertos pela extração. Identificar essa data nos módulos. Novembro parcial fica fora do fechamento de outubro.

> Fonte: bases históricas de Chamados e Ouvidorias do 1746, extraídas em 11/11/2026. Os meses anteriores foram recalculados com essa extração.

## Elegibilidade e classificação

1. **Chamados:** excluir registros com a marcação independente `OUV` no Tipo ou no SubTipo. Aplicar antes de calcular totais, taxas, rankings e detalhamentos. Reconhecer variantes de maiúsculas, espaços e traços. A regra se aplica a todos os meses cobertos.
2. **Ouvidorias:** manter os registros e retirar o prefixo `OUV -` dos rótulos de Tipo e SubTipo. Aceitar variantes com outros traços ou espaçamento. Preservar os campos originais para conferência.
3. **Tipo:** consolidar `LIMPEZA` e `LIMPEZA (DLU)` em **Limpeza**, com soma dos volumes. Para os demais Tipos, respeitar a classificação da fonte. SubTipo e gerência executora não determinam o Tipo.
4. Corrigir grafia, acentuação e capitalização de exibição. Somar cada registro elegível uma única vez no Tipo correspondente, mesmo quando o mesmo SubTipo aparece em Tipos diferentes.

## Subtipos aprovados

Aplicar os rótulos abaixo depois da regra de elegibilidade de cada canal. Em Ouvidorias, considerar os nomes após a remoção do prefixo.

| Rótulo da fonte | Rótulo no HUB |
|---|---|
| CAPINA EM LOGRADOURO | Capina em logradouro |
| LIMPEZA DE PRAÇAS | Limpeza de praças |
| LIMPEZA DE PARQUES | Limpeza de parques |
| LIMPEZA DE PRAÇAS E PARQUE / LIMPEZA DE PRAÇAS E PARQUES | Limpeza de praças e parques |
| INSTALAÇÃO DE PAPELEIRA / RETIRADA DE PAPELEIRA / INSTALAÇÃO E/OU RETIRADA DE PAPELEIRA | Instalação ou retirada de papeleira |
| LIMPEZA DE PAPELEIRA, CONTÊINER E CAÇAMBA COMLURB | Limpeza de papeleira, contêiner e caçamba |
| INSTALAÇÃO DE CAÇAMBA DA COMLURB PARA ATENDIMENTO EM COMUNIDADE | Instalação de caçamba comunitária |
| RETIRADA DE CAÇAMBA DA COMLURB INSTALADA PARA ATENDIMENTO EM COMUNIDADE | Retirada de caçamba comunitária |
| INFORMAÇÃO SOBRE INSTALAÇÃO E RETIRADA DE CAÇAMBA DA COMLURB PARA ATENDIMENTO EM COMUNIDADE | Informação sobre caçamba comunitária |
| IMPLANTAÇÃO DE VARRIÇÃO | Implantação de varrição |
| VARRIÇÃO DE LOGRADOURO | Varrição de logradouro |

A instalação ou retirada de papeleira é atribuição da LDE. A instalação de caçamba comunitária é atribuição da LRS. As gerências territoriais executam a retirada de caçamba comunitária e a limpeza de papeleira, contêiner e caçamba. Essas atribuições ajudam a interpretar os serviços. O Tipo continua vindo da fonte.

## Conferência ao aplicar no HUB

- Recalcular Chamados desde a base após a exclusão de registros marcados com `OUV`. Os totais anteriores à exclusão, inclusive os 24.120 de outubro/2026, servem como referência de conciliação.
- Conferir que a retirada do prefixo nas Ouvidorias mantém o total do canal e que os agrupamentos preservam a soma dos registros elegíveis.
- Usar os mesmos rótulos em filtros, gráficos e detalhamentos de Chamados, Ouvidorias, Histórico, Linha do Tempo, Comparativo Territorial e Boletim Executivo, conforme o nível de detalhe de cada módulo.
