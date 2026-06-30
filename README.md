# HUB COMLURB

Central de inteligência operacional do Gabinete da Presidência.  
Desenvolvido por Greicy Moreira — Núcleo de Inteligência e Gestão Estratégica Operacional.

---

## Estrutura do repositório

```
COMLURB/
├── assets/
│   ├── css/
│   │   └── hub-premium.css       ← CSS único de todos os painéis
│   ├── components/
│   │   ├── hub-utils.js          ← formatação, loadCSV, array helpers
│   │   ├── hub-cards.js          ← KPI cards
│   │   ├── hub-charts.js         ← Chart.js pré-configurado
│   │   ├── hub-filters.js        ← filtros com localStorage
│   │   ├── hub-layout.js         ← header, footer, drill banner, loading
│   │   ├── hub-all.js            ← bundle de todos (alternativa)
│   │   ├── _TEMPLATE.html        ← scaffold de novo painel (HTML)
│   │   ├── _TEMPLATE_app.js      ← scaffold de novo painel (lógica)
│   │   └── _TEMPLATE_data.js     ← scaffold de novo painel (dados)
│   ├── logos/                    ← logos institucionais
│   └── geojson/                  ← GeoJSONs (não versionados — ver abaixo)
│
├── dte/          Diretoria Técnica e de Engenharia
├── pessoas/      Gestão de Pessoas
├── sms/          Saúde e Segurança do Trabalho
├── ipl/          Índice de Padrão de Limpeza
├── contratos/    Gestão Contratual [em refatoração]
├── sme/          Limpeza Escolar [em refatoração]
├── territorial/  Mapa Operacional
├── radar-pre/    Radar da Presidência [em desenvolvimento]
├── materiais/    Balanço de Materiais [em desenvolvimento]
│
├── index.html    ← Portal de entrada
├── .nojekyll
└── _config.yml
```

---

## Regras obrigatórias para novos painéis

1. **Pasta própria** com nome em minúsculas, sem espaços ou acentos
2. **Quatro arquivos**: `index.html`, `app.js`, `data.js`, `README.md`
3. **Zero CSS inline** — apenas `<link rel="stylesheet" href="../assets/css/hub-premium.css">`
4. **Zero emojis** — semáforos usam classes CSS `.status-ok`, `.status-atencao`, `.status-critico`
5. **Dados sempre externos** — Google Sheets CSV via `HUB.data.loadCSV()`. Nunca JSON embutido no HTML
6. **CONFIG object** no topo do `app.js` com `systemLabel`, `title`, `subtitle`, `author`, `version`

---

## GeoJSONs

Os arquivos GeoJSON (bairros RJ, gerências DSU) não estão versionados por serem > 9MB.  
Ficam em `assets/geojson/` localmente e devem ser fornecidos separadamente.

Arquivos necessários:
- `assets/geojson/DLU_Novos_Bairros_estrutura2025.geojson` (9,3 MB)
- `assets/geojson/GERENCIAS_DSU.geojson` (1,9 MB)

---

## Como criar um novo painel

```bash
# 1. Criar pasta
mkdir nome-do-painel

# 2. Copiar templates
cp assets/components/_TEMPLATE.html    nome-do-painel/index.html
cp assets/components/_TEMPLATE_app.js  nome-do-painel/app.js
cp assets/components/_TEMPLATE_data.js nome-do-painel/data.js

# 3. Criar README
echo "# [Nome] — HUB COMLURB" > nome-do-painel/README.md

# 4. Editar data.js com a URL do Google Sheets
# 5. Editar app.js com CONFIG e lógica específica
# 6. Adicionar card no index.html principal
```

---

## GitHub Pages

Publicado em: `https://urbanflowrio.github.io/COMLURB/`

Requisitos de rede:
- IT deve liberar `185.199.108.153` a `185.199.111.153` na porta 443

---

## Parte do UrbanFlow Hub Framework

Este repositório é a instância COMLURB do framework UrbanFlow.  
O framework público (sem dados de cliente) está em: `https://github.com/urbanflowrio/urbanflow-hub`
