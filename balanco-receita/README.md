# Performance dos Contratos de Receita

Módulo financeiro do HUB COMLURB para leitura das pendências anteriores a 2026.

## Arquivos

- `index.html`: estrutura da página;
- `balanco-receita.css`: estilos específicos do módulo;
- `balanco-receita.js`: leitura da planilha, filtros, cálculos e renderização.

## Fonte

Google Sheets, aba `Base_Padronizada`, intervalo `A2:T5000`.

## Atualização

Os indicadores são recalculados no navegador sempre que a página é aberta. O seletor de período permite alternar entre 2026, exercícios anteriores e a visão consolidada. Os filtros seguem a hierarquia período → secretaria → serviço → mês. Para atualizar o painel, basta manter a aba `Base_Padronizada` preenchida e acessível para leitura.

Quando a base não contém valores na coluna `Valor Líquido Pago`, o KPI exibe `Não informado`, evitando interpretar ausência de registro como pagamento igual a zero.

## Integração com o HUB

O módulo reutiliza o cabeçalho, o rodapé, a identidade visual e os componentes localizados em `../assets`.
