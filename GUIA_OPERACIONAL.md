# HUB COMLURB — Guia Operacional

> **Para salvar no Notion:** Cole este conteúdo em uma página nova.
> Use `/` para inserir divisores entre seções. Cada `##` vira um H2, cada `###` vira H3.

---

## O que é o HUB COMLURB

Central de inteligência operacional do Gabinete da Presidência da COMLURB.
Desenvolvido e mantido por Greicy Moreira — Núcleo de Inteligência e Gestão Estratégica Operacional.

**Repositório:** `https://github.com/urbanflowrio/COMLURB`
**Portal publicado:** `https://urbanflowrio.github.io/COMLURB/`
**Framework base:** `https://github.com/urbanflowrio/urbanflow-hub` *(repo futuro)*

---

## Estrutura do repositório

```
COMLURB/
├── assets/
│   ├── css/hub-premium.css       ← CSS único de TODOS os painéis
│   ├── components/               ← Biblioteca HUB.*
│   ├── logos/                    ← Logos institucionais
│   └── geojson/                  ← GeoJSONs (não versionados)
├── dte/
├── pessoas/
├── sms/
├── ipl/
├── contratos/
├── sme/
├── territorial/
├── radar-pre/
├── materiais/
├── index.html                    ← Portal de entrada
├── .nojekyll
├── .gitignore
└── README.md
```

---

## Status dos painéis

| Painel | Pasta | Status | Responsável |
|--------|-------|--------|-------------|
| DTE | `dte/` | Ativo — pendências de refatoração | Greicy |
| Pessoas | `pessoas/` | Ativo — padrão completo | Greicy |
| SMS / Saúde | `sms/` | Ativo | Greicy |
| IPL Territorial | `ipl/` | Ativo | Greicy |
| Contratos | `contratos/` | Em refatoração | Greicy |
| SME | `sme/` | Em refatoração | Greicy |
| Territorial / Mapa | `territorial/` | Ativo | Greicy |
| Radar PRE | `radar-pre/` | Em desenvolvimento | Greicy |
| 1746 / Ouvidoria | *(previsto)* | Previsto | Greicy |
| Materiais | `materiais/` | Reconstrução necessária | Greicy |

---

## Regras absolutas do projeto

Estas regras nunca podem ser quebradas em nenhum módulo:

1. **Zero CSS inline** — apenas `<link rel="stylesheet" href="../assets/css/hub-premium.css">`
2. **Zero emojis** — semáforos usam classes CSS, não 🔴🟡🟢
3. **Zero dados embutidos no HTML** — sempre Google Sheets CSV externo via `HUB.data.loadCSV()`
4. **Pastas em minúsculas** — sem espaços, sem acentos, sem maiúsculas
5. **Quatro arquivos por módulo** — `index.html`, `app.js`, `data.js`, `README.md`
6. **CONFIG object no topo** do `app.js` com `systemLabel`, `title`, `subtitle`, `author`, `version`
7. **GeoJSONs nunca versionados** — ficam fora do git (`.gitignore`), fornecidos separadamente

---

## Como criar um novo painel — passo a passo

### Passo 1 — Criar a pasta

No GitHub (interface web):
- Abrir repositório `COMLURB`
- Clicar em `Add file → Create new file`
- Digitar `nome-do-painel/README.md` (a barra cria a pasta automaticamente)

### Passo 2 — Copiar os templates

Copiar o conteúdo de:
- `assets/components/_TEMPLATE.html` → colar em `nome-do-painel/index.html`
- `assets/components/_TEMPLATE_app.js` → colar em `nome-do-painel/app.js`
- `assets/components/_TEMPLATE_data.js` → colar em `nome-do-painel/data.js`

### Passo 3 — Configurar data.js

```javascript
const DATA_CONFIG = {
  name: "Nome da base",
  url:  "URL_COPIADA_DO_GOOGLE_SHEETS"
};
```

> **Como obter a URL:** Abrir a planilha → Arquivo → Publicar na Web → Formato CSV → Publicar → Copiar link.
> "Compartilhar" **não** funciona. Precisa ser "Publicar na Web".

### Passo 4 — Configurar app.js

```javascript
const CONFIG = {
  systemLabel: "SIGLA DA DIRETORIA",
  title:       "Título do Painel",
  subtitle:    "Descrição executiva",
  author:      "Greicy Moreira",
  version:     "1.0"
};
```

### Passo 5 — Adicionar card no portal

Abrir `index.html` na raiz e adicionar dentro de `<div class="grid">`:

```html
<a class="card" href="nome-do-painel/">
  <div class="cardLabel">Painel · SIGLA</div>
  <div class="cardTitle">Título</div>
  <div class="cardDesc">Descrição.</div>
  <span class="cardBadge ok">Ativo</span>
</a>
```

### Passo 6 — Testar

- Acessar `https://urbanflowrio.github.io/COMLURB/nome-do-painel/`
- GitHub Pages leva 1–3 minutos para publicar após o commit

---

## Camada territorial — arquitetura

Esta é a parte de maior crescimento do HUB. Todos os painéis têm ou terão uma dimensão territorial.

### Hierarquia territorial da COMLURB

```
COMLURB (corporativo)
└── 5 Superintendências Regionais
    ├── LRC — Região Centro (AP 1)
    ├── LRS — Região Sul (AP 2)
    ├── LRN — Região Norte (AP 3)
    ├── LRB — Região Barra (AP 4)
    └── LRO — Região Oeste (AP 5)
        └── Gerências operacionais
            └── Bairros / Setores / Trechos
```

### Tipos de visualização territorial

| Tipo | Quando usar | Biblioteca |
|------|-------------|-----------|
| Mapa de polígonos | Mostrar malha de gerências ou bairros com cor por desempenho | Leaflet + GeoJSON |
| Heatmap | Concentração de ocorrências / chamados 1746 | Leaflet.heat |
| Marcadores | Localização de ativos, colaboradores, pontos de serviço | Leaflet |
| Choropleth | IPL por bairro — cor gradiente por nota | Leaflet + GeoJSON |

### GeoJSONs disponíveis

| Arquivo | Tamanho | Conteúdo | Propriedade de nome |
|---------|---------|----------|---------------------|
| `DLU_Novos_Bairros_estrutura2025.geojson` | 9,3 MB | Bairros RJ com setores DLU | `nome` (minúsculo) |
| `GERENCIAS_DSU.geojson` | 1,9 MB | Malha de gerências DSU | `gerencia` |

> Ambos ficam em `assets/geojson/` e **não são versionados** no git.
> Para adicionar no GitHub: usar GitHub LFS ou servir via CDN externo.

### Padrão de mapa territorial

```javascript
// Tiles escuros — sempre dois layers para evitar fundo cinza
L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png", {
  subdomains: "abcd", maxZoom: 20
}).addTo(map);

L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png", {
  subdomains: "abcd", maxZoom: 20
}).addTo(map);

// CSS obrigatório para fundo preto
// .leaflet-container, .leaflet-tile-pane { background: #000; }
```

### Painéis territoriais planejados

| Painel | Pasta | Descrição |
|--------|-------|-----------|
| Mapa operacional | `territorial/` | Gerências DSU e setores DLU — já existe |
| IPL choropleth | `ipl/` (expansão) | Notas IPL por bairro com cor gradiente |
| Dispersão de pessoas | *(previsto)* | Residência de colaboradores vs área de atuação |
| Calor de chamados | *(previsto)* | Heatmap de chamados 1746 por bairro |
| Monitoramento DSU | *(previsto)* | Leitura de sistema externo (OS, GPS, QR Code) |

---

## Fontes de dados por painel

| Painel | Bases | Tipo de acesso |
|--------|-------|---------------|
| Pessoas | R54, Laudos, Organograma | Google Sheets CSV (publicado) |
| DTE | Frota, ETR | Google Sheets CSV (publicado) |
| IPL | AVALIAÇÃO DOS TRECHOS, NOTAS IPL | Google Sheets CSV (publicado) |
| SMS | Base operacional saúde | Google Sheets CSV (publicado) |
| 1746 | Base 1746, pesquisa satisfação | Google Sheets CSV (publicado) |

> **Regra de ouro para Google Sheets:** `Arquivo → Publicar na Web → CSV`.
> Nunca usar a URL de compartilhamento — retorna 403.

---

## Biblioteca HUB — referência rápida

### Carregar dados
```javascript
const dados = await HUB.data.loadCSV(URL, { name: "Base", required: true });
```

### Renderizar KPIs
```javascript
HUB.cards.render("kpis", [
  { label: "Total", value: HUB.format.int(1234), feature: true },
  { label: "Crítico", value: "12", color: "red" },
  { label: "Atenção", value: "34", color: "orange" },
  { label: "Normal", value: "88", color: "green" }
]);
```

### Filtros
```javascript
HUB.filters.populateAll(DATA, [
  { id: "fDir", field: "diretoria" },
  { id: "fGer", field: "gerencia" }
]);
HUB.filters.onChange(() => render());
const FILTERED = HUB.filters.apply(DATA, [...]);
```

### Gráficos
```javascript
// Barras simples (mais leve, usar por padrão)
HUB.simpleBar.render("chart1", HUB.array.groupCount(FILTERED, "campo").slice(0, 10), {
  total: FILTERED.length, color: "blue"
});

// Chart.js (para séries temporais e comparativos)
HUB.charts.bar("canvas1", { labels, values }, { label: "Série" });
HUB.charts.line("canvas2", { labels, values });
```

### Formatação
```javascript
HUB.format.int(1234)      // "1.234"
HUB.format.pct(45.7)      // "45,7%"
HUB.format.date("2026-06-10") // "10/06/2026"
```

---

## Design system — tokens

```css
--bg:      #06111f   /* fundo da página */
--panel:   #0d1f36   /* painéis */
--panel2:  #0a1b31   /* header, cards escuros */
--line:    #294866   /* bordas */
--text:    #f7f9ff   /* texto principal */
--muted:   #b8c9de   /* texto secundário */
--blue:    #5b9bd5
--orange:  #e87535
--green:   #78aaa3
--red:     #ef6a5d
--purple:  #a78bfa
```

**Regra de cores por significado:**
- Azul → informação, neutro
- Verde → positivo, atingido
- Laranja → atenção, intermediário
- Vermelho → crítico, abaixo do esperado
- Roxo → destaque especial, IPL

---

## GitHub — operação diária

### Editar um arquivo existente
1. Abrir o arquivo no repositório
2. Clicar no ícone de lápis (Edit)
3. Fazer as alterações
4. Commit changes → "Update [arquivo]"

### Criar arquivo novo
1. Navegar até a pasta desejada
2. `Add file → Create new file`
3. Digitar o nome do arquivo
4. Colar o conteúdo
5. Commit changes

### Verificar publicação
- Ir em `Settings → Pages`
- Ver status do último deploy
- Aguardar 1–3 minutos após commit

### Se a página não atualizar
- Verificar se o arquivo `.nojekyll` existe na raiz
- Verificar se `_config.yml` está correto
- Verificar se os caminhos de assets usam `/COMLURB/` (com hífen)

---

## Rede corporativa — liberação de acesso

Para que o GitHub Pages funcione na rede COMLURB, o TI precisa liberar:

| IPs | Porta | Protocolo |
|-----|-------|-----------|
| 185.199.108.153 | 443 | HTTPS |
| 185.199.109.153 | 443 | HTTPS |
| 185.199.110.153 | 443 | HTTPS |
| 185.199.111.153 | 443 | HTTPS |

Esses IPs cobrem todos os painéis do HUB — atuais e futuros.

---

## Roadmap

### Fase 1 — Limpeza e padronização (atual)
- [x] Novo repositório com estrutura limpa
- [x] Portal index.html reconstruído
- [x] Templates de módulo criados
- [ ] DTE: remover CSS inline, substituir emojis por classes
- [ ] SME e Contratos: refatorar para padrão completo
- [ ] GeoJSONs: mover para assets/geojson e documentar acesso

### Fase 2 — Expansão territorial
- [ ] IPL: adicionar visualização choropleth por bairro
- [ ] Territorial: heatmap de chamados 1746
- [ ] Pessoas: mapa de dispersão residencial
- [ ] DSU: integração com sistema externo de campo

### Fase 3 — Presidência e framework
- [ ] Radar de Indicadores PRE (6 eixos)
- [ ] 1746 / Ouvidoria painel completo
- [ ] Extrair urbanflow-hub como repositório público
- [ ] Documentação pública do framework

---

## Contato e governança

**Responsável:** Greicy Moreira
**Unidade:** Gabinete da Presidência / Núcleo de Inteligência e Gestão Estratégica Operacional
**Organização GitHub:** urbanflowrio

*Documento atualizado em Jun/2026*
