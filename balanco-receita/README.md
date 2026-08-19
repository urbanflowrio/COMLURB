# Performance dos Contratos de Receita

Módulo financeiro do HUB COMLURB para leitura das pendências anteriores a 2026.

## Arquivos

- `index.html`: estrutura da página;
- `balanco-receita.css`: estilos específicos do módulo;
- `balanco-receita.js`: leitura da planilha, filtros, cálculos e renderização.

## Fonte

Google Sheets, aba `Principais_Devedores`, intervalo `A4:J500`.

## Atualização

Os indicadores são recalculados no navegador sempre que a página é aberta. Para atualizar o painel, basta manter a aba `Principais_Devedores` preenchida e acessível para leitura.

## Integração com o HUB

O módulo reutiliza o cabeçalho, o rodapé, a identidade visual e os componentes localizados em `../assets`.
