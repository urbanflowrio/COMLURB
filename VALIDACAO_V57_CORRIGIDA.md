# HUB COMLURB — validação do pacote v57 corrigido

Data da manutenção: 14/09/2026.

## Correções aplicadas

- `ar/ar.js` convertido em arquivo JavaScript de compatibilidade, eliminando a cópia indevida de `ar/index.html`.
- Baseline de integridade da Fase 7B atualizada de forma explícita para os arquivos vigentes do AR.
- Cubos de Chamados e Ouvidorias sincronizados entre as pastas dos módulos e `assets/data`.
- Documentação do 1746 atualizada para agosto de 2026.
- Data de corte e regra de congelamento histórico registradas nos dois módulos do 1746.
- Caminho da logo corrigido em `contratos/index.html`.

## Escopo preservado

- Home e navegação dos cinco eixos.
- Dados e cálculos dos painéis.
- Estrutura do Balanço de Receita e sua subpasta de validação.

## Critério de liberação

O pacote somente deve ser publicado após a execução completa de `npm test`, a verificação dos links locais e a conferência do conteúdo do ZIP depois da compactação.
