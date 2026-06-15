# Operacional · HUB COMLURB

Pasta da camada operacional do HUB COMLURB, estruturada para consumir uma planilha única publicada no Google Sheets com três abas em CSV:

- Coleta Domiciliar
- Coleta Seletiva
- Lixo Público

## Estrutura

```text
operacional/
├── index.html
├── coleta-domiciliar/index.html
├── coleta-seletiva/index.html
├── lixo-publico/index.html
├── frota/index.html
└── compartilhado/
    ├── dados.js
    ├── operacional.js
    └── operacional.css
```

## Onde alterar os links das abas

Os links estão centralizados em:

```text
operacional/compartilhado/dados.js
```

## Observação

O JavaScript identifica automaticamente colunas com nomes próximos de: Gerência, Mês/Competência e Utilização da Capacidade.
