# Performance dos Contratos de Receita — NOVO

Versão atualizada do módulo financeiro do HUB COMLURB.

## O que aparece na página executiva
1. Faturamento Bruto
2. Valor Líquido Pago
3. Débito Líquido
4. Uma única leitura executiva
5. Pendências anteriores a 2026 como contexto secundário
6. Fluxo financeiro mensal
7. Receita por Secretaria
8. Ranking "Onde está o débito"
9. Carteira completa recolhida por padrão

## Filtros
- Ano, com 2026 como padrão
- Secretaria
- Serviço

## Arquitetura
- Mantém `hub-premium.css`
- Usa `hub-layout.js` para header/footer, como os módulos consolidados do HUB
- Não altera a Home
- Não altera nenhum outro módulo
- Mantém as mesmas fontes CSV oficiais do painel anterior
