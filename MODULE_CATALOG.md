# HUB COMLURB | Catálogo oficial de módulos

Atualizado em 15 de setembro de 2026.

Este documento é a referência vigente para decidir quais módulos integram a Home. O histórico de alterações não substitui este catálogo.

## Módulos oficiais no portal

| Módulo | Caminho | Status | Arquitetura vigente |
|---|---|---|---|
| Governança Corporativa | `indicadores-gerais/` | Oficial | Componentes compartilhados |
| Acordo de Resultados | `ar/` | Oficial | Componentes compartilhados + fontes centralizadas |
| Desempenho da Operação Urbana | `engenharia-operacional/` | Oficial | Componentes compartilhados + fonte DTE centralizada |
| IPL | `ipl/` | Oficial | Legado controlado |
| Território Operacional | `territorial/` | Oficial | Aplicação modular própria |
| Gestão Estratégica de Pessoas | `pessoas/` | Suspenso por LGPD | Página institucional sem dados |
| Performance dos Contratos de Receita | `balanco-receita/` | Oficial | Legado controlado |
| Chamados 1746 | `chamados-1746/` | Oficial | HTML + cubo analítico local + GeoJSON local |
| Ouvidoria Operacional | `ouvidoria/` | Oficial | HTML leve + dados externos locais |

## Módulos fora da Home

| Módulo | Caminho | Classificação | Regra vigente |
|---|---|---|---|
| Contratos de Prestação de Serviços | `contratos/` | Acesso direto, fora do portal executivo | Não exibir na Home. Manter apenas enquanto o conteúdo estiver em avaliação interna. |

## Pilotos técnicos isolados

Os caminhos abaixo não integram o menu executivo e não devem ser tratados como fonte oficial de fechamento:

- `ar/piloto/`
- `ar/piloto-snapshot/`
- `engenharia-operacional/piloto/`
- `engenharia-operacional/piloto-snapshot/`
- `testes/`

## Regras de publicação

1. Apenas módulos classificados como oficiais e liberados para navegação devem aparecer na página inicial.
2. Pilotos permanecem acessíveis apenas por URL direta e com aviso explícito.
3. Informações individuais de pessoas não devem ser exibidas ou exportadas pelo portal público.
4. Novas fontes compartilhadas devem ser registradas em `assets/components/hub-sources.js`.
5. Alterações no Core só podem ser liberadas com `npm test` integralmente aprovado.
6. Contratos de Prestação de Serviços não deve aparecer na Home.
7. A situação de homologação, a competência e o responsável de cada módulo devem ser consultados em `MATRIZ_OFICIAL_MODULOS.md`.
8. Nenhuma interface deve ser chamada de homologada sem evidência registrada em `BASELINE_HOMOLOGACAO.md`.
