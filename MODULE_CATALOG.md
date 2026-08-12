# HUB COMLURB — Catálogo e status dos módulos

Atualizado em 12 de agosto de 2026.

## Módulos oficiais no portal

| Módulo | Caminho | Status | Arquitetura vigente |
|---|---|---|---|
| Governança Corporativa | `indicadores-gerais/` | Oficial | Componentes compartilhados |
| Acordo de Resultados | `ar/` | Oficial | Componentes compartilhados + fontes centralizadas |
| Desempenho da Operação Urbana | `engenharia-operacional/` | Oficial | Componentes compartilhados + fonte DTE centralizada |
| IPL | `ipl/` | Oficial | Legado controlado |
| Território Operacional | `territorial/` | Oficial | Aplicação modular própria |
| Gestão Estratégica de Pessoas | `pessoas/` | Oficial, acesso agregado | Componentes compartilhados |
| Performance dos Contratos de Receita | `balanco-receita/` | Oficial | Legado controlado |
| Contratos de Prestação de Serviços | `contratos/` | Oficial em consolidação | Legado controlado |
| Chamados 1746 | `chamados-1746/` | Oficial | HTML leve + dados externos locais |
| Ouvidoria Operacional | `ouvidoria/` | Oficial | HTML leve + dados externos locais |

## Pilotos técnicos isolados

Os caminhos abaixo não integram o menu executivo e não devem ser tratados como fonte oficial de fechamento:

- `ar/piloto/`
- `ar/piloto-snapshot/`
- `engenharia-operacional/piloto/`
- `engenharia-operacional/piloto-snapshot/`
- `testes/`

## Regras de publicação

1. Todo módulo oficial deve aparecer na página inicial.
2. Pilotos permanecem acessíveis apenas por URL direta e com aviso explícito.
3. Informações individuais de pessoas não devem ser exibidas ou exportadas pelo portal público.
4. Novas fontes compartilhadas devem ser registradas em `assets/components/hub-sources.js`.
5. Alterações no Core só podem ser liberadas com `npm test` integralmente aprovado.
