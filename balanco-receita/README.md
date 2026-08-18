# Performance dos Contratos de Receita

Módulo financeiro do HUB COMLURB.

## Escopo executivo
- Faturamento Bruto
- Valor Líquido Pago
- Débito Líquido
- Pendências anteriores a 2026 como contexto secundário
- Fluxo financeiro mensal
- Receita por Secretaria
- Ranking de contratos por débito líquido
- Carteira completa recolhida por padrão

## Filtros
- Ano (2026 como padrão)
- Secretaria
- Serviço

## Fonte
Mantidas as três URLs CSV oficiais já utilizadas no painel anterior:
- Relatório de Débitos – DAF
- Abas anuais de valores faturados

## Regra de arquitetura
Este módulo está restrito à pasta `/balanco-receita/`.
O `index.html` da raiz permanece sendo a Home do HUB.
