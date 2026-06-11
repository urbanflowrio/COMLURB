/**
 * [NOME DO PAINEL] — app.js
 * HUB COMLURB · Gabinete da Presidência
 * Autor: Greicy Moreira
 * Versão: 1.0 · [DATA]
 */

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const CONFIG = {
  systemLabel: "[SIGLA DA DIRETORIA]",
  title:       "[Título do Painel]",
  subtitle:    "[Descrição executiva do painel]",
  author:      "Greicy Moreira",
  version:     "1.0"
};

// ─── ESTADO GLOBAL ────────────────────────────────────────────────────────────
let DATA     = [];
let FILTERED = [];
let DRILL    = null;

// ─── INIT ─────────────────────────────────────────────────────────────────────
async function init() {
  try {
    HUB.loading.showMultiple(["kpis", "chart1", "chart2", "chart3"]);

    HUB.header.render("header", {
      systemLabel: CONFIG.systemLabel,
      title:       CONFIG.title,
      subtitle:    CONFIG.subtitle
    });

    DATA = await HUB.data.loadCSV(DATA_CONFIG.url, {
      name:     DATA_CONFIG.name,
      required: true
    });

    populateFilters();
    HUB.filters.onChange(() => render());
    render();

    HUB.footer.render("footer", {
      author:  CONFIG.author,
      version: CONFIG.version,
      showTimestamp: true
    });

  } catch (e) {
    console.error("Erro ao inicializar:", e);
  }
}

// ─── FILTROS ──────────────────────────────────────────────────────────────────
function populateFilters() {
  HUB.filters.populateAll(DATA, [
    { id: "f1", field: "campo1" },
    { id: "f2", field: "campo2" }
  ]);
}

// ─── RENDER ───────────────────────────────────────────────────────────────────
function render() {
  FILTERED = HUB.filters.apply(DATA, [
    { id: "f1", field: "campo1" },
    { id: "f2", field: "campo2" }
  ]);

  renderKPIs();
  renderCharts();
  HUB.header.updateStatus("REGISTROS", HUB.format.int(FILTERED.length));
}

function renderKPIs() {
  HUB.cards.render("kpis", [
    { label: "Total", value: HUB.format.int(FILTERED.length), feature: true },
    { label: "KPI 2", value: "—", color: "green" },
    { label: "KPI 3", value: "—", color: "orange" },
    { label: "KPI 4", value: "—", color: "red" }
  ]);
}

function renderCharts() {
  const grouped = HUB.array.groupCount(FILTERED, "campo1").slice(0, 10);
  HUB.simpleBar.render("chart1", grouped, {
    total: FILTERED.length,
    color: "blue",
    onclick: (name) => setDrill(name)
  });
}

// ─── DRILL DOWN ───────────────────────────────────────────────────────────────
function setDrill(value) {
  DRILL = value;
  HUB.drillBanner.show("drillBanner", {
    title:       `Recorte: ${value}`,
    description: `${FILTERED.filter(r => r.campo1 === value).length} registros`,
    onClear:     "clearDrill()"
  });
  render();
}

function clearDrill() {
  DRILL = null;
  HUB.drillBanner.hide("drillBanner");
  render();
}

function clearAll() {
  document.querySelectorAll("select").forEach(s => s.value = "");
  clearDrill();
}

// ─── START ────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", init);
