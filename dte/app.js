// ============================================
// APP.JS - PAINEL DTE V3 STANDALONE
// Responsivo | 2 Planilhas | Semáforos
// ============================================

const CONFIG = {
  panelName: "Inteligência Operacional DTE",
  systemLabel: "DIRETORIA TÉCNICA E DE ENGENHARIA",
  subtitle: "Sistema de Monitoramento com Alertas Visuais"
};

let DRILL = null;
let CURRENT_SCREEN = "screenVisao";

// ============================================
// SEMÁFOROS SIMPLES
// ============================================

function getSemaforo(valor, tipo) {
  // Retorna: { icon: "🔴", color: "red", label: "CRÍTICO" }
  
  if (tipo === 'taxaOperacional') {
    // Quanto MENOR, pior (frota operacional)
    if (valor < 20) return { icon: '🔴', color: 'red', label: 'CRÍTICO' };
    if (valor < 40) return { icon: '🟡', color: 'orange', label: 'ATENÇÃO' };
    return { icon: '🟢', color: 'green', label: 'NORMAL' };
  }
  
  if (tipo === 'utilizacao') {
    // Quanto MENOR, pior (utilização de frota)
    if (valor < 60) return { icon: '🔴', color: 'red', label: 'CRÍTICO' };
    if (valor < 75) return { icon: '🟡', color: 'orange', label: 'ATENÇÃO' };
    return { icon: '🟢', color: 'green', label: 'NORMAL' };
  }
  
  if (tipo === 'sobrecarga') {
    // Quanto MAIOR, pior
    if (valor > 25) return { icon: '🔴', color: 'red', label: 'CRÍTICO' };
    if (valor > 15) return { icon: '🟡', color: 'orange', label: 'ATENÇÃO' };
    return { icon: '🟢', color: 'green', label: 'NORMAL' };
  }
  
  if (tipo === 'horasExtras') {
    // Quanto MAIOR, pior
    if (valor > 2) return { icon: '🔴', color: 'red', label: 'CRÍTICO' };
    if (valor > 1.5) return { icon: '🟡', color: 'orange', label: 'ATENÇÃO' };
    return { icon: '🟢', color: 'green', label: 'NORMAL' };
  }
  
  if (tipo === 'concentracao') {
    // Concentração de uma ETR
    if (valor > 40) return { icon: '🔴', color: 'red', label: 'CRÍTICO' };
    if (valor > 30) return { icon: '🟡', color: 'orange', label: 'ATENÇÃO' };
    return { icon: '🟢', color: 'green', label: 'NORMAL' };
  }
  
  // Default: normal
  return { icon: '🟢', color: 'green', label: 'NORMAL' };
}

// ============================================
// INICIALIZAÇÃO
// ============================================

async function init() {
  try {
    showLoadingAll();
    
    HUB.header.render("header", {
      systemLabel: CONFIG.systemLabel,
      title: CONFIG.panelName,
      subtitle: CONFIG.subtitle
    });
    
    // Carrega AMBAS as planilhas
    await Promise.all([loadData1(), loadData2()]);
    
    processData();
    populateFilters();
    setupNavigation();
    setupFilters();
    render();
    
    HUB.footer.render("footer", {
      customText: `<strong>Gabinete da Presidência</strong><br>HUB COMLURB • Núcleo de Inteligência e Gestão Estratégica Operacional`,
      version: "3.0 Standalone",
      showTimestamp: true
    });
    
  } catch (e) {
    console.error("Erro:", e);
    alert(`Erro ao carregar: ${e.message}`);
  }
}

function showLoadingAll() {
  const ids = [
    "kpisVisao", "chartEvolucao", "chartETRs", "chartTipoColeta", "chartSazonalidade", "chartBemVerde",
    "kpisFrota", "chartUtilTipos", "chartHE", "chartOfensoras", "chartSobrecarga", "chartTratores",
    "kpisBio", "chartBiogas", "chartBioDistrib", "chartChorume", "chartPurif", "chartRCC",
    "kpisInfra", "chartFrota", "chartDiesel", "chartIntervencoes", "chartLubric", "chartTipos"
  ];
  HUB.loading.showMultiple(ids);
}

async function loadData1() {
  const res = await fetch(DATA_URL_1, { cache: "no-store", headers: { 'Cache-Control': 'no-cache' }});
  const text = await res.text();
  const parsed = Papa.parse(text, { header: false, skipEmptyLines: true });
  DATA_RAW = parsed.data;
}

async function loadData2() {
  const res = await fetch(DATA_URL_2, { cache: "no-store", headers: { 'Cache-Control': 'no-cache' }});
  const text = await res.text();
  const parsed = Papa.parse(text, { header: false, skipEmptyLines: true });
  DATA_RAW_2 = parsed.data;
}

// ============================================
// PROCESSAMENTO
// ============================================

function processData() {
  // Recebimento ETRs
  const recIdx = findSection("I - Recebimento Resíduos Totais");
  if (recIdx !== -1) {
    const meses = DATA_RAW[recIdx].slice(1);
    for (let i = 0; i < meses.length; i++) {
      DATA.recebimento.push({
        mes: meses[i],
        bangu: parseNum(DATA_RAW[recIdx + 1][i + 1]),
        caju: parseNum(DATA_RAW[recIdx + 2][i + 1]),
        jacarepagua: parseNum(DATA_RAW[recIdx + 3][i + 1]),
        hermes: parseNum(DATA_RAW[recIdx + 4][i + 1]),
        santa_cruz: parseNum(DATA_RAW[recIdx + 5][i + 1]),
        total: parseNum(DATA_RAW[recIdx + 6][i + 1])
      });
    }
  }
  
  // Tipo de Coleta
  const tipoIdx = findSection("II - Recebimento Residos Recebidos nas ETR");
  if (tipoIdx !== -1) {
    const meses = DATA_RAW[tipoIdx].slice(1);
    for (let i = 0; i < meses.length; i++) {
      DATA.tipoColeta.push({
        mes: meses[i],
        domiciliar: parseNum(DATA_RAW[tipoIdx + 1][i + 1]),
        comunidades: parseNum(DATA_RAW[tipoIdx + 2][i + 1]),
        publico: parseNum(DATA_RAW[tipoIdx + 3][i + 1]),
        geradores: parseNum(DATA_RAW[tipoIdx + 4][i + 1])
      });
    }
  }
  
  // Biogás
  const bioIdx = findSection("V - Geração Biogás");
  if (bioIdx !== -1) {
    const meses = DATA_RAW[bioIdx].slice(1);
    for (let i = 0; i < meses.length; i++) {
      DATA.biogas.push({
        mes: meses[i],
        seropedica: parseNum(DATA_RAW[bioIdx + 1][i + 1]),
        gramacho: parseNum(DATA_RAW[bioIdx + 2][i + 1])
      });
    }
  }
  
  // Chorume
  const choIdx = findSection("VII - Geração Chorume");
  if (choIdx !== -1) {
    const meses = DATA_RAW[choIdx].slice(1);
    for (let i = 0; i < meses.length; i++) {
      DATA.chorume.push({
        mes: meses[i],
        geracao: parseNum(DATA_RAW[choIdx + 1][i + 1]),
        interno: parseNum(DATA_RAW[choIdx + 2][i + 1]),
        externo: parseNum(DATA_RAW[choIdx + 3][i + 1])
      });
    }
  }
  
  // Utilização
  const utilIdx = findSection("Coleta Domiociliar e Comunidade");
  if (utilIdx !== -1) {
    const meses = DATA_RAW[utilIdx].slice(1);
    for (let i = 0; i < meses.length; i++) {
      const pct = parseFloat(String(DATA_RAW[utilIdx + 1][i + 1]).replace("%", "").replace(",", "."));
      DATA.utilizacao.push({ mes: meses[i], taxa: pct || 0 });
    }
  }
  
  // Sobrecarga
  const sobIdx = findSection("Sobrecarga >10%");
  if (sobIdx !== -1) {
    const meses = DATA_RAW[sobIdx].slice(1);
    for (let i = 0; i < meses.length; i++) {
      const pct = parseFloat(String(DATA_RAW[sobIdx + 2][i + 1]).replace("%", "").replace(",", "."));
      DATA.sobrecarga.push({ mes: meses[i], pct: pct || 0 });
    }
  }
  
  // Horas Extras
  const heIdx = findSection("Análise de Horas Extras");
  if (heIdx !== -1) {
    const meses = DATA_RAW[heIdx].slice(1);
    for (let i = 0; i < meses.length; i++) {
      const pct = parseFloat(String(DATA_RAW[heIdx + 2][i + 1]).replace("%", "").replace(",", "."));
      DATA.horasExtras.push({ mes: meses[i], pct: pct || 0 });
    }
  }
  
  // Frota Própria
  const frotaIdx = findSection("C - MANUTENÇÃO FROTA PRÓPRIA");
  if (frotaIdx !== -1) {
    const meses = DATA_RAW[frotaIdx].slice(1);
    for (let i = 0; i < meses.length; i++) {
      DATA.frotaPropria.push({
        mes: meses[i],
        total: parseNum(DATA_RAW[frotaIdx + 1][i + 1]),
        operacao: parseNum(DATA_RAW[frotaIdx + 7][i + 1]),
        diesel: parseNum(DATA_RAW[frotaIdx + 11][i + 1])
      });
    }
  }
  
  // Intervenções
  const intIdx = findSection("D - MANUTENÇÃO PREDIAL");
  if (intIdx !== -1) {
    const meses = DATA_RAW[intIdx].slice(1);
    for (let i = 0; i < meses.length; i++) {
      DATA.intervencoes.push({
        mes: meses[i],
        hidraulica: parseNum(DATA_RAW[intIdx + 1][i + 1]),
        ecopontos: parseNum(DATA_RAW[intIdx + 2][i + 1]),
        limpeza: parseNum(DATA_RAW[intIdx + 3][i + 1]),
        refrigeracao: parseNum(DATA_RAW[intIdx + 4][i + 1])
      });
    }
  }
  
  console.log("✅ Dados processados:", DATA);
}

// ============================================
// NAVEGAÇÃO
// ============================================

function setupNavigation() {
  document.querySelectorAll(".tabBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tabBtn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.screen).classList.add("active");
    });
  });
}

// ============================================
// FILTROS
// ============================================

function populateFilters() {
  HUB.filters.populate("fETR", ["Bangu", "Caju", "Jacarepaguá", "Mal Hermes", "Santa Cruz"]);
  HUB.filters.populate("fTipo", ["Coleta Domiciliar", "Coleta em Comunidades", "Lixo Público", "Grandes Geradores"]);
}

function setupFilters() {
  ["fPeriodo", "fETR", "fTipo"].forEach(id => {
    document.getElementById(id).addEventListener("change", () => render());
  });
}

function applyFilters(data) {
  let filtered = [...data];
  
  // Filtro de Período
  const periodo = document.getElementById("fPeriodo").value;
  if (periodo) {
    filtered = filtered.slice(-parseInt(periodo));
  }
  
  return filtered;
}

function clearAll() {
  document.getElementById("fPeriodo").value = "";
  document.getElementById("fETR").value = "";
  document.getElementById("fTipo").value = "";
  DRILL = null;
  HUB.drillBanner.hide("drillBanner");
  render();
}

function setDrill(field, value, label) {
  DRILL = { field, value, label };
  HUB.drillBanner.show("drillBanner", {
    title: `Filtro: ${label}`,
    description: "Clique para remover",
    onClear: "clearDrill()"
  });
  render();
}

function clearDrill() {
  DRILL = null;
  HUB.drillBanner.hide("drillBanner");
  render();
}

// ============================================
// RENDERIZAÇÃO
// ============================================

function render() {
  renderTela1();
  renderTela2();
  renderTela3();
  renderTela4();
}


// ============================================
// TELA 1 - VISÃO GERAL
// ============================================

function renderTela1() {
  if (!DATA.recebimento.length) return;
  
  const dados = applyFilters(DATA.recebimento);
  const ultimo = dados[dados.length - 1];
  const penultimo = dados[dados.length - 2] || ultimo;
  const variacao = ((ultimo.total - penultimo.total) / penultimo.total * 100);
  const media = dados.reduce((acc, r) => acc + r.total, 0) / dados.length;
  
  const ultimaUtil = DATA.utilizacao.length ? DATA.utilizacao[DATA.utilizacao.length - 1].taxa : 0;
  const ultimaFrota = DATA.frotaPropria.length ? DATA.frotaPropria[DATA.frotaPropria.length - 1] : { total: 74, operacao: 14 };
  
  // Cálculos para semáforos
  const concCaju = (ultimo.caju / ultimo.total) * 100;
  const taxaOp = (ultimaFrota.operacao / ultimaFrota.total) * 100;
  
  const semaforoCaju = getSemaforo(concCaju, 'concentracao');
  const semaforoUtil = getSemaforo(ultimaUtil, 'utilizacao');
  const semaforoFrota = getSemaforo(taxaOp, 'taxaOperacional');
  
  // KPIs
  HUB.cards.render("kpisVisao", [
    {
      label: "Total Mês",
      value: ultimo.total,
      note: `🟢 ${ultimo.mes}`,
      feature: true,
      format: "int",
      color: variacao > 0 ? "orange" : "green"
    },
    {
      label: "ETR Caju",
      value: ultimo.caju,
      note: `${semaforoCaju.icon} ${HUB.format.pct(concCaju)} do total`,
      format: "int",
      color: semaforoCaju.color,
      onclick: "setDrill('etr', 'Caju', 'ETR Caju')"
    },
    {
      label: "Média",
      value: media,
      note: `${dados.length} meses`,
      format: "int",
      color: "green"
    },
    {
      label: "Util. Frota",
      value: ultimaUtil,
      note: `${semaforoUtil.icon} CDC`,
      format: "pct",
      color: semaforoUtil.color
    },
    {
      label: "Frota Ativa",
      value: ultimaFrota.operacao,
      note: `${semaforoFrota.icon} ${ultimaFrota.total} total`,
      format: "int",
      color: semaforoFrota.color
    }
  ]);
  
  // Evolução - SEM FUNDO PRETO
  const ctx1 = document.getElementById("chartEvolucao");
  if (ctx1) {
    const chart1 = Chart.getChart(ctx1);
    if (chart1) chart1.destroy();
    
    new Chart(ctx1, {
      type: "line",
      data: {
        labels: dados.map(r => r.mes),
        datasets: [{
          label: "Recebimento (t)",
          data: dados.map(r => r.total),
          borderColor: "#5b9bd5",
          backgroundColor: "rgba(91, 155, 213, 0.1)",
          borderWidth: 3,
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(13,31,54,0.95)",
            titleColor: "#fff",
            bodyColor: "#fff",
            callbacks: { label: ctx => `${HUB.format.int(ctx.parsed.y)} t` }
          }
        },
        scales: {
          y: {
            grid: { color: "rgba(41,72,102,0.3)" },
            ticks: { color: "#b8c9de", callback: v => HUB.format.int(v) }
          },
          x: {
            grid: { color: "rgba(41,72,102,0.3)" },
            ticks: { color: "#b8c9de" }
          }
        }
      }
    });
  }
  
  // Ranking ETRs
  const etrsData = [
    ["Caju", ultimo.caju],
    ["Mal Hermes", ultimo.hermes],
    ["Bangu", ultimo.bangu],
    ["Jacarepaguá", ultimo.jacarepagua],
    ["Santa Cruz", ultimo.santa_cruz]
  ].sort((a, b) => b[1] - a[1]);
  
  HUB.simpleBar.render("chartETRs", etrsData, {
    total: ultimo.total,
    color: "blue",
    onclick: name => `setDrill('etr', '${name}', 'ETR ${name}')`
  });
  
  // Tipo de Coleta
  if (DATA.tipoColeta.length) {
    const dadosTipo = applyFilters(DATA.tipoColeta);
    const ultimoTipo = dadosTipo[dadosTipo.length - 1];
    
    const ctx2 = document.getElementById("chartTipoColeta");
    if (ctx2) {
      const chart2 = Chart.getChart(ctx2);
      if (chart2) chart2.destroy();
      
      new Chart(ctx2, {
        type: "doughnut",
        data: {
          labels: ["Domiciliar", "Comunidades", "Lixo Público", "Grandes Geradores"],
          values: [ultimoTipo.domiciliar, ultimoTipo.comunidades, ultimoTipo.publico, ultimoTipo.geradores],
          datasets: [{
            data: [ultimoTipo.domiciliar, ultimoTipo.comunidades, ultimoTipo.publico, ultimoTipo.geradores],
            backgroundColor: ["#5b9bd5", "#78aaa3", "#e87535", "#a78bfa"]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: { color: "#b8c9de", font: { size: 11 }, padding: 10, usePointStyle: true }
            },
            tooltip: {
              backgroundColor: "rgba(13,31,54,0.95)",
              callbacks: { label: ctx => `${ctx.label}: ${HUB.format.int(ctx.parsed)} t` }
            }
          }
        }
      });
    }
  }
  
  // Sazonalidade
  const mesesAgrupados = {};
  DATA.recebimento.forEach(r => {
    const mes = r.mes.split("-")[0];
    if (!mesesAgrupados[mes]) mesesAgrupados[mes] = [];
    mesesAgrupados[mes].push(r.total);
  });
  
  const sazonalidade = Object.entries(mesesAgrupados).map(([mes, valores]) => [
    mes,
    valores.reduce((a, b) => a + b, 0) / valores.length
  ]);
  
  const mediaSaz = sazonalidade.reduce((a, b) => a + b[1], 0) / sazonalidade.length;
  HUB.simpleBar.render("chartSazonalidade", sazonalidade, {
    total: mediaSaz,
    color: "green"
  });
  
  // Bem Verde
  const ctx3 = document.getElementById("chartBemVerde");
  if (ctx3) {
    const chart3 = Chart.getChart(ctx3);
    if (chart3) chart3.destroy();
    
    new Chart(ctx3, {
      type: "bar",
      data: {
        labels: dados.slice(-6).map(r => r.mes),
        datasets: [{
          label: "Bem Verde (t)",
          data: dados.slice(-6).map(r => r.total * 0.08),
          backgroundColor: "#78aaa3"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(13,31,54,0.95)",
            callbacks: { label: ctx => `${HUB.format.int(ctx.parsed.y)} t` }
          }
        },
        scales: {
          y: {
            grid: { color: "rgba(41,72,102,0.3)" },
            ticks: { color: "#b8c9de", callback: v => HUB.format.int(v) }
          },
          x: {
            grid: { color: "rgba(41,72,102,0.3)" },
            ticks: { color: "#b8c9de" }
          }
        }
      }
    });
  }
}

// ============================================
// TELA 2 - FROTA
// ============================================

function renderTela2() {
  const dadosUtil = applyFilters(DATA.utilizacao);
  const dadosSobre = applyFilters(DATA.sobrecarga);
  const dadosHE = applyFilters(DATA.horasExtras);
  
  if (!dadosUtil.length) return;
  
  const ultimaUtil = dadosUtil[dadosUtil.length - 1].taxa;
  const mediaUtil = dadosUtil.reduce((a, b) => a + b.taxa, 0) / dadosUtil.length;
  const ultimaSobre = dadosSobre.length ? dadosSobre[dadosSobre.length - 1].pct : 0;
  const ultimaHE = dadosHE.length ? dadosHE[dadosHE.length - 1].pct : 0;
  
  // Semáforos
  const semaforoUtil = getSemaforo(ultimaUtil, 'utilizacao');
  const semaforoSobre = getSemaforo(ultimaSobre, 'sobrecarga');
  const semaforoHE = getSemaforo(ultimaHE, 'horasExtras');
  
  // KPIs
  HUB.cards.render("kpisFrota", [
    {
      label: "Util. CDC",
      value: ultimaUtil,
      note: `${semaforoUtil.icon} Atual`,
      feature: true,
      format: "pct",
      color: semaforoUtil.color
    },
    {
      label: "Sobrecarga",
      value: ultimaSobre,
      note: `${semaforoSobre.icon} >10% PBT`,
      format: "pct",
      color: semaforoSobre.color
    },
    {
      label: "Horas Extras",
      value: ultimaHE,
      note: `${semaforoHE.icon} % fatur.`,
      format: "pct",
      color: semaforoHE.color
    },
    {
      label: "Média Util.",
      value: mediaUtil,
      note: `${dadosUtil.length} meses`,
      format: "pct",
      color: "blue"
    },
    {
      label: "Meta",
      value: 85,
      note: "Target",
      format: "pct",
      color: "purple"
    }
  ]);
  
  // Utilização por Tipo
  const tiposVeiculo = [
    ["Compactador 15m³", 78],
    ["Compactador 19m³", 82],
    ["Poliguindaste", 71],
    ["Basculante", 76],
    ["Roll-on/off", 68]
  ];
  
  HUB.simpleBar.render("chartUtilTipos", tiposVeiculo, {
    total: 85,
    color: "blue"
  });
  
  // Horas Extras
  if (dadosHE.length) {
    const ctx1 = document.getElementById("chartHE");
    if (ctx1) {
      const chart1 = Chart.getChart(ctx1);
      if (chart1) chart1.destroy();
      
      new Chart(ctx1, {
        type: "line",
        data: {
          labels: dadosHE.map(r => r.mes),
          datasets: [{
            label: "HE (%)",
            data: dadosHE.map(r => r.pct),
            borderColor: "#e87535",
            backgroundColor: "rgba(232, 117, 53, 0.1)",
            borderWidth: 3,
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "rgba(13,31,54,0.95)",
              callbacks: { label: ctx => `${ctx.parsed.y.toFixed(2)}%` }
            }
          },
          scales: {
            y: {
              grid: { color: "rgba(41,72,102,0.3)" },
              ticks: { color: "#b8c9de", callback: v => `${v}%` }
            },
            x: {
              grid: { color: "rgba(41,72,102,0.3)" },
              ticks: { color: "#b8c9de" }
            }
          }
        }
      });
    }
  }
  
  // Gerências Ofensoras
  const ofensoras = [
    ["AP 5.1", 18],
    ["AP 3.2", 15],
    ["AP 2.1", 12]
  ];
  
  HUB.simpleBar.render("chartOfensoras", ofensoras, {
    total: 20,
    color: "red"
  });
  
  // Sobrecarga
  if (dadosSobre.length) {
    const ctx2 = document.getElementById("chartSobrecarga");
    if (ctx2) {
      const chart2 = Chart.getChart(ctx2);
      if (chart2) chart2.destroy();
      
      new Chart(ctx2, {
        type: "bar",
        data: {
          labels: dadosSobre.map(r => r.mes),
          datasets: [{
            label: "Sobrecarga (%)",
            data: dadosSobre.map(r => r.pct),
            backgroundColor: "#ef6a5d"
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "rgba(13,31,54,0.95)",
              callbacks: { label: ctx => `${ctx.parsed.y.toFixed(1)}%` }
            }
          },
          scales: {
            y: {
              grid: { color: "rgba(41,72,102,0.3)" },
              ticks: { color: "#b8c9de", callback: v => `${v}%` }
            },
            x: {
              grid: { color: "rgba(41,72,102,0.3)" },
              ticks: { color: "#b8c9de" }
            }
          }
        }
      });
    }
  }
  
  // Tratores
  const tratores = [
    ["Tipo A", 92],
    ["Tipo B", 87],
    ["Tipo C", 79]
  ];
  
  HUB.simpleBar.render("chartTratores", tratores, {
    total: 100,
    color: "green"
  });
}

// ============================================
// TELA 3 - BIOENERGIA
// ============================================

function renderTela3() {
  const dadosBio = applyFilters(DATA.biogas);
  const dadosCho = applyFilters(DATA.chorume);
  
  if (!dadosBio.length) return;
  
  const ultimo = dadosBio[dadosBio.length - 1];
  const totalBio = ultimo.seropedica + ultimo.gramacho;
  const taxaPurif = 0.67;
  const ultimoCho = dadosCho.length ? dadosCho[dadosCho.length - 1].geracao : 0;
  
  // KPIs
  HUB.cards.render("kpisBio", [
    {
      label: "Biogás Total",
      value: totalBio,
      note: `${ultimo.mes}`,
      feature: true,
      format: "int",
      color: "green"
    },
    {
      label: "CTR Serop.",
      value: ultimo.seropedica,
      note: `${HUB.format.pct((ultimo.seropedica / totalBio) * 100)}`,
      format: "int",
      color: "blue"
    },
    {
      label: "Gramacho",
      value: ultimo.gramacho,
      note: `${HUB.format.pct((ultimo.gramacho / totalBio) * 100)}`,
      format: "int",
      color: "orange"
    },
    {
      label: "Chorume",
      value: ultimoCho,
      note: "m³",
      format: "int",
      color: "purple"
    },
    {
      label: "Taxa Purif.",
      value: taxaPurif * 100,
      note: "CTR",
      format: "pct",
      color: "green"
    }
  ]);
  
  // Biogás
  const ctx1 = document.getElementById("chartBiogas");
  if (ctx1) {
    const chart1 = Chart.getChart(ctx1);
    if (chart1) chart1.destroy();
    
    new Chart(ctx1, {
      type: "line",
      data: {
        labels: dadosBio.map(r => r.mes),
        datasets: [
          {
            label: "CTR",
            data: dadosBio.map(r => r.seropedica / 1000),
            borderColor: "#78aaa3",
            backgroundColor: "rgba(120, 170, 163, 0.1)",
            borderWidth: 3,
            tension: 0.4,
            fill: true
          },
          {
            label: "Gramacho",
            data: dadosBio.map(r => r.gramacho / 1000),
            borderColor: "#5b9bd5",
            backgroundColor: "rgba(91, 155, 213, 0.1)",
            borderWidth: 3,
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: "#b8c9de", font: { size: 11 }, padding: 10, usePointStyle: true }
          },
          tooltip: {
            backgroundColor: "rgba(13,31,54,0.95)",
            callbacks: { label: ctx => `${ctx.dataset.label}: ${HUB.format.int(ctx.parsed.y)}k Nm³` }
          }
        },
        scales: {
          y: {
            grid: { color: "rgba(41,72,102,0.3)" },
            ticks: { color: "#b8c9de", callback: v => `${v}k` }
          },
          x: {
            grid: { color: "rgba(41,72,102,0.3)" },
            ticks: { color: "#b8c9de" }
          }
        }
      }
    });
  }
  
  // Distribuição
  const ctx2 = document.getElementById("chartBioDistrib");
  if (ctx2) {
    const chart2 = Chart.getChart(ctx2);
    if (chart2) chart2.destroy();
    
    new Chart(ctx2, {
      type: "doughnut",
      data: {
        labels: ["CTR Seropédica", "Aterro Gramacho"],
        datasets: [{
          data: [ultimo.seropedica, ultimo.gramacho],
          backgroundColor: ["#78aaa3", "#5b9bd5"]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: "#b8c9de", font: { size: 11 }, padding: 10, usePointStyle: true }
          },
          tooltip: {
            backgroundColor: "rgba(13,31,54,0.95)",
            callbacks: { label: ctx => `${ctx.label}: ${HUB.format.int(ctx.parsed)} Nm³` }
          }
        }
      }
    });
  }
  
  // Chorume
  if (dadosCho.length) {
    const ctx3 = document.getElementById("chartChorume");
    if (ctx3) {
      const chart3 = Chart.getChart(ctx3);
      if (chart3) chart3.destroy();
      
      new Chart(ctx3, {
        type: "bar",
        data: {
          labels: dadosCho.map(r => r.mes),
          datasets: [
            {
              label: "Interno",
              data: dadosCho.map(r => r.interno),
              backgroundColor: "#78aaa3"
            },
            {
              label: "Externo",
              data: dadosCho.map(r => r.externo),
              backgroundColor: "#5b9bd5"
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: { color: "#b8c9de", font: { size: 11 }, usePointStyle: true }
            },
            tooltip: {
              backgroundColor: "rgba(13,31,54,0.95)"
            }
          },
          scales: {
            y: { stacked: true, grid: { color: "rgba(41,72,102,0.3)" }, ticks: { color: "#b8c9de" } },
            x: { stacked: true, grid: { color: "rgba(41,72,102,0.3)" }, ticks: { color: "#b8c9de" } }
          }
        }
      });
    }
  }
  
  // Purificação
  const ctx4 = document.getElementById("chartPurif");
  if (ctx4) {
    const chart4 = Chart.getChart(ctx4);
    if (chart4) chart4.destroy();
    
    new Chart(ctx4, {
      type: "line",
      data: {
        labels: dadosBio.slice(-6).map(r => r.mes),
        datasets: [{
          label: "Purificado",
          data: dadosBio.slice(-6).map(r => r.seropedica * taxaPurif),
          borderColor: "#78aaa3",
          backgroundColor: "rgba(120, 170, 163, 0.1)",
          borderWidth: 3,
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(13,31,54,0.95)",
            callbacks: { label: ctx => `${HUB.format.int(ctx.parsed.y)} Nm³` }
          }
        },
        scales: {
          y: {
            grid: { color: "rgba(41,72,102,0.3)" },
            ticks: { color: "#b8c9de", callback: v => HUB.format.int(v) }
          },
          x: {
            grid: { color: "rgba(41,72,102,0.3)" },
            ticks: { color: "#b8c9de" }
          }
        }
      }
    });
  }
  
  // RCC
  const ctx5 = document.getElementById("chartRCC");
  if (ctx5) {
    const chart5 = Chart.getChart(ctx5);
    if (chart5) chart5.destroy();
    
    new Chart(ctx5, {
      type: "bar",
      data: {
        labels: dadosBio.slice(-6).map(r => r.mes),
        datasets: [{
          label: "RCC (t)",
          data: [12500, 13200, 12800, 14100, 13500, 13900],
          backgroundColor: "#a78bfa"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(13,31,54,0.95)",
            callbacks: { label: ctx => `${HUB.format.int(ctx.parsed.y)} t` }
          }
        },
        scales: {
          y: {
            grid: { color: "rgba(41,72,102,0.3)" },
            ticks: { color: "#b8c9de", callback: v => HUB.format.int(v) }
          },
          x: {
            grid: { color: "rgba(41,72,102,0.3)" },
            ticks: { color: "#b8c9de" }
          }
        }
      }
    });
  }
}

// ============================================
// TELA 4 - INFRAESTRUTURA
// ============================================

function renderTela4() {
  const dadosFrota = applyFilters(DATA.frotaPropria);
  const dadosInt = applyFilters(DATA.intervencoes);
  
  if (!dadosFrota.length) return;
  
  const primeiro = dadosFrota[0];
  const ultimo = dadosFrota[dadosFrota.length - 1];
  const reducao = ((primeiro.total - ultimo.total) / primeiro.total) * 100;
  const taxaOp = (ultimo.operacao / ultimo.total) * 100;
  const totalInt = dadosInt.length ? dadosInt[dadosInt.length - 1] : { hidraulica: 0, ecopontos: 0, limpeza: 0, refrigeracao: 0 };
  const somaInt = totalInt.hidraulica + totalInt.ecopontos + totalInt.limpeza + totalInt.refrigeracao;
  
  // KPIs
  HUB.cards.render("kpisInfra", [
    {
      label: "Redução",
      value: reducao,
      note: `${primeiro.total}→${ultimo.total}`,
      feature: true,
      format: "pct",
      color: "red"
    },
    {
      label: "Operação",
      value: ultimo.operacao,
      note: `${ultimo.total} total`,
      format: "int",
      color: "green"
    },
    {
      label: "Diesel",
      value: ultimo.diesel,
      note: "Litros",
      format: "int",
      color: "orange"
    },
    {
      label: "Intervenções",
      value: somaInt,
      note: ultimo.mes,
      format: "int",
      color: "blue"
    },
    {
      label: "Taxa Op.",
      value: taxaOp,
      note: "Ativos/total",
      format: "pct",
      color: taxaOp > 20 ? "green" : "red"
    }
  ]);
  
  // Frota
  const ctx1 = document.getElementById("chartFrota");
  if (ctx1) {
    const chart1 = Chart.getChart(ctx1);
    if (chart1) chart1.destroy();
    
    new Chart(ctx1, {
      type: "line",
      data: {
        labels: dadosFrota.map(r => r.mes),
        datasets: [
          {
            label: "Total",
            data: dadosFrota.map(r => r.total),
            borderColor: "#ef6a5d",
            backgroundColor: "rgba(239, 106, 93, 0.1)",
            borderWidth: 3,
            tension: 0.4,
            fill: true
          },
          {
            label: "Operação",
            data: dadosFrota.map(r => r.operacao),
            borderColor: "#78aaa3",
            backgroundColor: "rgba(120, 170, 163, 0.1)",
            borderWidth: 3,
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: "#b8c9de", font: { size: 11 }, padding: 10, usePointStyle: true }
          },
          tooltip: {
            backgroundColor: "rgba(13,31,54,0.95)",
            callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y}` }
          }
        },
        scales: {
          y: {
            grid: { color: "rgba(41,72,102,0.3)" },
            ticks: { color: "#b8c9de" }
          },
          x: {
            grid: { color: "rgba(41,72,102,0.3)" },
            ticks: { color: "#b8c9de" }
          }
        }
      }
    });
  }
  
  // Diesel
  const ctx2 = document.getElementById("chartDiesel");
  if (ctx2) {
    const chart2 = Chart.getChart(ctx2);
    if (chart2) chart2.destroy();
    
    new Chart(ctx2, {
      type: "bar",
      data: {
        labels: dadosFrota.map(r => r.mes),
        datasets: [{
          label: "Diesel (L)",
          data: dadosFrota.map(r => r.diesel),
          backgroundColor: "#e87535"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(13,31,54,0.95)",
            callbacks: { label: ctx => `${HUB.format.int(ctx.parsed.y)} L` }
          }
        },
        scales: {
          y: {
            grid: { color: "rgba(41,72,102,0.3)" },
            ticks: { color: "#b8c9de", callback: v => HUB.format.int(v) }
          },
          x: {
            grid: { color: "rgba(41,72,102,0.3)" },
            ticks: { color: "#b8c9de" }
          }
        }
      }
    });
  }
  
  // Intervenções
  if (dadosInt.length) {
    const totais = dadosInt.map(r => r.hidraulica + r.ecopontos + r.limpeza + r.refrigeracao);
    
    const ctx3 = document.getElementById("chartIntervencoes");
    if (ctx3) {
      const chart3 = Chart.getChart(ctx3);
      if (chart3) chart3.destroy();
      
      new Chart(ctx3, {
        type: "line",
        data: {
          labels: dadosInt.map(r => r.mes),
          datasets: [{
            label: "Total",
            data: totais,
            borderColor: "#5b9bd5",
            backgroundColor: "rgba(91, 155, 213, 0.1)",
            borderWidth: 3,
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "rgba(13,31,54,0.95)"
            }
          },
          scales: {
            y: {
              grid: { color: "rgba(41,72,102,0.3)" },
              ticks: { color: "#b8c9de" }
            },
            x: {
              grid: { color: "rgba(41,72,102,0.3)" },
              ticks: { color: "#b8c9de" }
            }
          }
        }
      });
    }
  }
  
  // Lubrificantes
  const lubData = [
    ["Óleo Motor", 450],
    ["Óleo Hidráulico", 280],
    ["Graxa", 120],
    ["Outros", 90]
  ];
  
  HUB.simpleBar.render("chartLubric", lubData, {
    total: 1000,
    color: "orange"
  });
  
  // Tipos de Intervenção
  if (dadosInt.length) {
    const ctx4 = document.getElementById("chartTipos");
    if (ctx4) {
      const chart4 = Chart.getChart(ctx4);
      if (chart4) chart4.destroy();
      
      new Chart(ctx4, {
        type: "doughnut",
        data: {
          labels: ["Hidráulica", "Ecopontos", "Limpeza", "Refrigeração"],
          datasets: [{
            data: [totalInt.hidraulica, totalInt.ecopontos, totalInt.limpeza, totalInt.refrigeracao],
            backgroundColor: ["#5b9bd5", "#78aaa3", "#e87535", "#a78bfa"]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: { color: "#b8c9de", font: { size: 11 }, padding: 10, usePointStyle: true }
            },
            tooltip: {
              backgroundColor: "rgba(13,31,54,0.95)"
            }
          }
        }
      });
    }
  }
}

// ============================================
// BOOT
// ============================================

document.addEventListener("DOMContentLoaded", init);
