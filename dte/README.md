# DTE — Diretoria Técnica e de Engenharia

**Status:** Ativo  
**Responsável técnico:** Greicy Moreira  
**Versão:** 3.0  
**Última atualização:** Jun/2026

---

## Fontes de dados

| Base | Tipo | Planilha |
|---|---|---|
| Frota operacional | Google Sheets CSV | Publicar na Web → atualizar URL em `data.js` |
| ETR / alocação | Google Sheets CSV | Publicar na Web → atualizar URL em `data.js` |

---

## Pendências conhecidas

- [ ] Filtros de período/ETR/tipo não atualizam gráficos dinamicamente
- [ ] CSS inline deve ser migrado para `hub-premium.css`
- [ ] Emojis de semáforo devem virar classes CSS

---

## Arquivos

| Arquivo | Função |
|---|---|
| `index.html` | Estrutura HTML + imports |
| `app.js` | Lógica principal, filtros, render |
| `data.js` | URLs das planilhas |
| `dte-intelligence.js` | Módulo de semáforos e alertas |
