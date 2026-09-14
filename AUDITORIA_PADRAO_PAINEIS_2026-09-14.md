# Auditoria de padrão dos painéis do HUB COMLURB

Data da revisão: 14 de setembro de 2026.

## Escopo

Foram revisados os dez módulos oficiais listados em `MODULE_CATALOG.md`, os subpainéis SME e SMS de Contratos, a página de Unidades do Território e o Validador do Balanço de Receita. Pilotos técnicos e páginas de teste ficaram fora do escopo executivo.

## Correções aplicadas

1. Botão Home incluído no cabeçalho compartilhado e nas páginas legadas.
2. Link duplicado de Home removido dos painéis que já possuíam acesso próprio.
3. Travessões visíveis substituídos por pontuação editorial ou pelo marcador `N/D`.
4. Intervalos temporais passaram a usar a forma textual "de ... a ...".
5. Contratos de Prestação de Serviços foi incluído na Home, conforme a regra do catálogo que exige acesso a todo módulo oficial.
6. A página de Unidades do Território manteve o retorno ao painel e recebeu também acesso direto à Home.

## Resultado por arquitetura

| Grupo | Módulos | Situação |
|---|---|---|
| Padrão compartilhado | Governança, Acordo de Resultados, Engenharia Operacional, Território, Pessoas e Balanço de Receita | Home centralizada no componente comum |
| HTML autônomo recente | Chamados e Ouvidoria | Home incluída no cabeçalho incorporado |
| Legado controlado | IPL, Contratos, SME, SMS e Validador Financeiro | Home incluída diretamente em cada página |

## Divergências visuais ainda existentes

IPL, Contratos, SME, SMS e o Validador Financeiro ainda usam sistemas locais de espaçamento, tipografia e componentes. Eles mantêm a identidade escura do HUB, mas não têm paridade integral com o cabeçalho, os cards e os filtros dos módulos baseados em componentes compartilhados.

Essa diferença não impede navegação ou leitura. A migração visual completa deve ser tratada como uma etapa própria, pois altera estrutura e comportamento de painéis já operacionais.

## Critérios de validação

1. Ausência de travessão e meia risca em textos visíveis dos relatórios executivos.
2. Presença de acesso Home em todos os módulos oficiais e subpainéis revisados.
3. Preservação dos sinais encontrados nas fontes de dados, usados apenas pelos parsers para reconhecer células vazias.
4. Aprovação da regressão automatizada integral do repositório.
