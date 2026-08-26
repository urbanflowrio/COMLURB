# Validação do Balanço de Receita

Validador independente conectado ao Google Sheets oficial.

## Caminho publicado

`https://urbanflowrio.github.io/COMLURB/balanco-receita/validacao/`

## Regras

- não substitui o painel principal;
- lê Base_Padronizada e Valores Faturados 2026;
- compara a fonte oficial com a réplica da lógica do painel;
- não reutiliza números anteriores quando a fonte falha;
- trata `-` como ausência de Valor Líquido Pago, nunca como zero.
