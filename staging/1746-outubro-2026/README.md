# HUB COMLURB · 1746 · Prévia Outubro/2026

**Situação:** cinco módulos adaptados na branch de preparação, **sem publicação** em GitHub Pages.

## Origem e integridade

As bases de outubro foram entregues pela COMLURB. A origem institucional foi confirmada e a conciliação técnica foi aprovada. **Não houve auditoria independente**, por indisponibilidade de documento de conferência independente. A data exata de corte da extração de outubro não foi informada; a data de conferência técnica (04/11/2026) **não** deve ser apresentada como data de corte.

- Chamados: 2.724 linhas, outubro/2025 = 21.652; outubro/2026 = 24.116.
- Ouvidoria geral: 1.562 linhas, outubro/2025 = 2.881; outubro/2026 = 2.369.
- Ouvidoria operacional: outubro/2025 = 2.697; outubro/2026 = 2.213. PCO excluída **apenas** da camada operacional.
- Jan–out/2026: Chamados = 278.888; Ouvidorias operacionais = 32.562.
- Jan–set/2026: congelado, sem revisão dos números anteriormente publicados; divergências retroativas foram apenas documentadas.

## Módulos atualizados na branch

1. `chamados-1746/` — cubo, interface e manifesto de corte.
2. `ouvidoria/` — cubo operacional, interface e manifesto de corte.
3. `1746-comparativo/` — seleção de outubro e Jan–Out; usa o cubo de Chamados atualizado.
4. `1746-historico/` — série mensal, acumulado, recorte de outubro e interface. Leitura conservadora de taxas por serviço/subtipo.
5. `1746-timeline/` — série, acumulado, recorte mensal e drill em cascata com Outubro/2026 e Jan–Out/2026.

Dados de pré-integração originais também estão neste diretório. Nenhum arquivo da branch `main` foi alterado.

## Testes realizados

- **262 verificações programáticas de dados e regressão, sem falhas:** totais mensais, acumulados, cortes por dimensões, somas por serviço/subtipo em cubos, preservação exata do recorte de setembro, prefixos temporais e árvores da Timeline.
- **34 verificações estáticas, sem falhas:** estrutura de cinco páginas HTML, presença de outubro e ressalvas, IDs HTML únicos e resolução de referências a scripts locais.
- Ver relatório completo: `AUDITORIA_REGRESSAO_OUT2026.md`.

**Limitação de testes:** as verificações são estruturais e de dados. Não houve execução de navegador real com testes de clique, gráficos Chart.js, mapas Leaflet, responsividade ou captura visual. Logo, a versão é **candidata à conferência**, não está homologada para publicação.

## Liberação

Antes de mesclar ou publicar, realizar teste manual/automatizado em navegador real dos cinco módulos, revisar taxas e pareamentos delicados, verificar responsividade e obter autorização expressa da responsável pelo HUB. Não publicar ou mesclar na `main` sem essas etapas.
