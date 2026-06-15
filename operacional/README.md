# Operacional | HUB COMLURB

Pasta da camada operacional de utilização da capacidade da frota.

## Arquivos principais

- `index.html` — visão geral operacional
- `coleta-domiciliar/index.html`
- `coleta-seletiva/index.html`
- `lixo-publico/index.html`
- `frota/index.html`
- `compartilhado/dados.js` — URLs da planilha publicada e base local de segurança
- `compartilhado/operacional.js` — carregamento, filtros, KPIs e tabelas
- `compartilhado/operacional.css` — ajustes visuais no padrão HUB

## Dados

A página tenta carregar primeiro os CSVs publicados no Google Drive. Se o fetch falhar ou a aba publicada não vier em formato de base tabular, utiliza automaticamente a base local de segurança embutida no arquivo `dados.js`.
