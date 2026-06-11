/**
 * APP IPL - COMLURB
 * Sistema de Monitoramento do Índice Padrão de Limpeza
 */

// ============================================
// CONFIGURAÇÃO
// ============================================

const CONFIG = {
  // URLs dos CSVs publicados no Google Sheets
  avaliacoes: 'COLE_AQUI_URL_AVALIACAO_TRECHOS_CSV',
  notas: 'COLE_AQUI_URL_NOTAS_IPL_CSV',
  pesos: 'COLE_AQUI_URL_PESOS_ITENS_CSV',
  
  // Meta IPL oficial
  metaIPL: 77.0,
  
  // Configuração do painel
  panelName: "IPL · Índice Padrão de Limpeza",
  systemLabel: "Monitoramento Operacional",
  subtitle: "Avaliação territorial, conformidade operacional e reincidências"
};

// ============================================
// ESTADO GLOBAL
// ============================================

const App = {
  data: {
    avaliacoes: [],
    notas: [],
    pesos: []
  },
  filtered: [],
  filters: {},
  charts: {},
  currentScreen: 'operacional'
};

// ============================================
// INICIALIZAÇÃO
// ============================================

async function init() {
  try {
    // Mostra loading
    HUB.loading.showMultiple(["kpis", "chartEvolucao", "rankingSuperintendencias"]);
    
    // Renderiza header
    HUB.header.render("header", {
      systemLabel: CONFIG.systemLabel,
      title: CONFIG.panelName,
      subtitle: CONFIG.subtitle
    });
    
    // Renderiza navegação
    HUB.header.render("navTabs", {
      navigation: [
        { id: "screenOperacional", label: "Inteligência Operacional", onActivate: () => renderOperacional() },
        { id: "screenExecutivo", label: "Executivo", onActivate: () => renderExecutivo() },
        { id: "screenTerritorial", label: "Territorial", onActivate: () => renderTerritorial() },
        { id: "screenReincidencia", label: "Reincidência", onActivate: () => renderReincidencia() },
        { id: "screenAnalitico", label: "Analítico", onActivate: () => renderAnalitico() }
      ]
    });
    
    // Carrega dados
    await carregarDados();
    
    // Processa dados
    processarDados();
    
    // Inicializa filtros
    initFilters();
    
    // Renderiza tela inicial
    renderOperacional();
    
    // Footer institucional
    HUB.footer.render("footer", {
      customText: `
        <strong>Gabinete da Presidência</strong><br>
        HUB COMLURB • Núcleo de Inteligência e Gestão Estratégica Operacional
      `,
      version: "1.0",
      showTimestamp: false
    });
    
  } catch (error) {
    console.error("Erro na inicialização:", error);
    alert(`Erro ao carregar dados: ${error.message}`);
  }
}

// ============================================
// CARREGAMENTO DE DADOS
// ============================================

async function carregarDados() {
  const status = document.getElementById('status');
  if (status) {
    status.style.display = 'block';
    status.textContent = 'Carregando bases de dados do Google Sheets...';
  }
  
  try {
    // Carrega avaliações
    App.data.avaliacoes = await HUB.data.loadCSV(CONFIG.avaliacoes, {
      name: 'Avaliações IPL',
      required: true
    });
    
    console.log(`✓ Avaliações: ${App.data.avaliacoes.length} registros`);
    
    // Carrega notas (opcional)
    if (CONFIG.notas && !CONFIG.notas.includes('COLE_AQUI')) {
      App.data.notas = await HUB.data.loadCSV(CONFIG.notas, {
        name: 'Notas IPL',
        required: false
      });
    }
    
    // Carrega pesos (opcional)
    if (CONFIG.pesos && !CONFIG.pesos.includes('COLE_AQUI')) {
      App.data.pesos = await HUB.data.loadCSV(CONFIG.pesos, {
        name: 'Pesos IPL',
        required: false
      });
    }
    
    if (status) status.style.display = 'none';
    
  } catch (error) {
    if (status) {
      status.textContent = `Erro ao carregar dados: ${error.message}`;
      status.classList.add('error');
    }
    throw error;
  }
}

// ============================================
// PROCESSAMENTO DE DADOS
// ============================================

function processarDados() {
  const { avaliacoes } = App.data;
  
  // Enriquecer dados com cálculos
  App.data.avaliacoes = avaliacoes.map(aval => {
    // Calcular totais OK/NOK
    let totalOK = 0;
    let totalNOK = 0;
    let itensNOK = [];
    
    // Itens para avaliar (ajuste conforme suas colunas)
    const itensAvaliar = [
      'Coleta domiciliar', 'Lixo Crítico', 'Ralo', 'Entulho',
      'Bens inservíveis', 'Material de Obra', 'Pneus', 'Propaganda',
      'Galhada', 'Animal morto', 'Resíduo morador de rua', 'Lama/Areia',
      'Resíduo pós servico', 'Ponto crítico', 'Capina'
    ];
    
    itensAvaliar.forEach(item => {
      const valor = aval[item];
      if (valor) {
        if (valor === 'Sim' || valor === 'OK') {
          totalOK++;
        } else if (valor === 'Não' || valor === 'NOK') {
          totalNOK++;
          itensNOK.push(item);
        }
      }
    });
    
    // Calcular lixo branco total (ajuste conforme suas colunas)
    let lixoBrancoTotal = 0;
    for (let tc = 1; tc <= 4; tc++) {
      for (let tamanho of ['P', 'G']) {
        const col = `Lixo Branco TC${tc} - ${tamanho}`;
        if (aval[col]) {
          lixoBrancoTotal += parseInt(aval[col]) || 0;
        }
      }
    }
    
    return {
      ...aval,
      totalOK,
      totalNOK,
      itensNOK,
      lixoBrancoTotal,
      taxaConformidade: totalOK + totalNOK > 0 ? (totalOK / (totalOK + totalNOK) * 100) : 0
    };
  });
  
  console.log('✓ Dados processados e enriquecidos');
}

// ============================================
// FILTROS
// ============================================

function initFilters() {
  const { avaliacoes } = App.data;
  
  // Popular filtros
  HUB.filters.populateAll(avaliacoes, [
    { id: "filtroMes", field: "Mês" },
    { id: "filtroSuperintendencia", field: "Superintendência" },
    { id: "filtroGerencia", field: "Gerência" },
    { id: "filtroBairro", field: "Bairro" }
  ]);
  
  // Callback de mudança
  HUB.filters.onChange(() => {
    applyFilters();
    renderExecutivo();
  });
  
  // Botão limpar
  const btnLimpar = document.getElementById('btnLimpar');
  if (btnLimpar) {
    btnLimpar.addEventListener('click', () => {
      HUB.filters.clear();
      renderExecutivo();
    });
  }
}

function applyFilters() {
  App.filtered = HUB.filters.apply(App.data.avaliacoes, [
    { id: "filtroMes", field: "Mês" },
    { id: "filtroSuperintendencia", field: "Superintendência" },
    { id: "filtroGerencia", field: "Gerência" },
    { id: "filtroBairro", field: "Bairro" }
  ]);
}

// ============================================
// RENDERIZAÇÃO: INTELIGÊNCIA OPERACIONAL
// ============================================

function renderOperacional() {
  const avaliacoes = App.data.avaliacoes;
  if (!avaliacoes || avaliacoes.length === 0) return;
  
  // Gerar alertas automáticos
  renderAlertasOperacionais(avaliacoes);
  
  // KPIs
  renderKPIsOperacionais(avaliacoes);
  
  // Gráficos
  renderEvolucaoIPL(avaliacoes);
  renderRankingSuperintendencias(avaliacoes);
  renderNOKPorItem(avaliacoes);
}

function renderAlertasOperacionais(avaliacoes) {
  const container = document.getElementById('alertasContainer');
  if (!container) return;
  
  const alertas = [];
  
  // Detectar superintendências abaixo da meta
  const porSuperintendencia = {};
  avaliacoes.forEach(a => {
    const sup = a['Superintendência'];
    if (!sup) return;
    
    if (!porSuperintendencia[sup]) {
      porSuperintendencia[sup] = { ok: 0, nok: 0 };
    }
    
    porSuperintendencia[sup].ok += a.totalOK || 0;
    porSuperintendencia[sup].nok += a.totalNOK || 0;
  });
  
  Object.entries(porSuperintendencia).forEach(([sup, data]) => {
    const total = data.ok + data.nok;
    const conformidade = total > 0 ? (data.ok / total * 100) : 0;
    
    if (conformidade < CONFIG.metaIPL) {
      alertas.push(`
        <div class="panel" style="border-left:4px solid var(--orange);background:rgba(232,117,53,0.05)">
          <div class="panelHead" style="background:transparent">
            <h3>Atenção Operacional</h3>
          </div>
          <div class="body">
            <p>A Superintendência <strong>${sup}</strong> apresenta taxa de conformidade de <strong>${conformidade.toFixed(1)}%</strong>, abaixo da meta de <strong>${CONFIG.metaIPL}%</strong>.</p>
          </div>
        </div>
      `);
    }
  });
  
  // Detectar itens com alta taxa de NOK
  const nokPorItem = {};
  avaliacoes.forEach(a => {
    a.itensNOK.forEach(item => {
      nokPorItem[item] = (nokPorItem[item] || 0) + 1;
    });
  });
  
  const topNOK = Object.entries(nokPorItem)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  if (topNOK.length > 0) {
    alertas.push(`
      <div class="panel" style="border-left:4px solid var(--blue);background:rgba(109,165,216,0.05)">
        <div class="panelHead" style="background:transparent">
          <h3>Itens Críticos Identificados</h3>
        </div>
        <div class="body">
          <p>Os itens com maior concentração de não conformidades são:</p>
          <ul>
            ${topNOK.map(([item, count]) => `<li><strong>${item}</strong>: ${count} ocorrências</li>`).join('')}
          </ul>
        </div>
      </div>
    `);
  }
  
  // Renderizar
  if (alertas.length === 0) {
    container.innerHTML = `
      <div class="panel" style="border-left:4px solid var(--green);background:rgba(120,170,163,0.05)">
        <div class="panelHead" style="background:transparent">
          <h3>Sistema Operacional</h3>
        </div>
        <div class="body">
          <p>Nenhum alerta crítico identificado no momento.</p>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = alertas.join('');
  }
}

function renderKPIsOperacionais(avaliacoes) {
  const totalAvaliacoes = avaliacoes.length;
  const totalOK = avaliacoes.reduce((sum, a) => sum + (a.totalOK || 0), 0);
  const totalNOK = avaliacoes.reduce((sum, a) => sum + (a.totalNOK || 0), 0);
  const totalItens = totalOK + totalNOK;
  const taxaConformidade = totalItens > 0 ? (totalOK / totalItens * 100) : 0;
  const totalLixoBranco = avaliacoes.reduce((sum, a) => sum + (a.lixoBrancoTotal || 0), 0);
  const trechosUnicos = new Set(avaliacoes.map(a => (a['Código logradouro'] || '') + (a['Trecho'] || ''))).size;
  
  HUB.cards.render("kpis", [
    {
      label: "Taxa de Conformidade Geral",
      value: taxaConformidade.toFixed(1) + '%',
      note: "itens OK / total avaliado",
      feature: true,
      color: taxaConformidade >= CONFIG.metaIPL ? "green" : "orange"
    },
    {
      label: "Meta IPL",
      value: CONFIG.metaIPL.toFixed(1) + '%',
      note: "objetivo institucional",
      color: "blue"
    },
    {
      label: "Total de Avaliações",
      value: HUB.format.num(totalAvaliacoes),
      note: "vistorias realizadas"
    },
    {
      label: "Trechos Avaliados",
      value: HUB.format.num(trechosUnicos),
      note: "logradouros fiscalizados"
    },
    {
      label: "Itens Conformes",
      value: HUB.format.num(totalOK),
      note: "itens OK",
      color: "green"
    },
    {
      label: "Não Conformidades",
      value: HUB.format.num(totalNOK),
      note: "itens NOK",
      color: "red"
    },
    {
      label: "Lixo Branco Total",
      value: HUB.format.num(totalLixoBranco),
      note: "unidades registradas"
    },
    {
      label: "Média Lixo Branco/Trecho",
      value: (totalLixoBranco / totalAvaliacoes).toFixed(1),
      note: "unidades por avaliação"
    }
  ]);
}

function renderEvolucaoIPL(avaliacoes) {
  // TODO: Implementar gráfico Chart.js
  console.log('renderEvolucaoIPL: implementar');
}

function renderRankingSuperintendencias(avaliacoes) {
  const container = document.getElementById('rankingSuperintendencias');
  if (!container) return;
  
  // Agrupar por superintendência
  const porSup = {};
  avaliacoes.forEach(a => {
    const sup = a['Superintendência'];
    if (!sup) return;
    
    if (!porSup[sup]) {
      porSup[sup] = { ok: 0, nok: 0 };
    }
    
    porSup[sup].ok += a.totalOK || 0;
    porSup[sup].nok += a.totalNOK || 0;
  });
  
  // Calcular conformidade e ordenar
  const ranking = Object.entries(porSup)
    .map(([sup, data]) => {
      const total = data.ok + data.nok;
      const conformidade = total > 0 ? (data.ok / total * 100) : 0;
      return { superintendencia: sup, conformidade };
    })
    .sort((a, b) => b.conformidade - a.conformidade);
  
  // Renderizar
  const rows = ranking.map((item, idx) => {
    const cor = item.conformidade >= CONFIG.metaIPL ? 'var(--green)' : 'var(--orange)';
    return `
      <div class="rank">
        <div>
          <b>${idx + 1}º · ${item.superintendencia}</b>
        </div>
        <div style="color:${cor};font-weight:950;font-size:16px">
          ${item.conformidade.toFixed(1)}%
        </div>
      </div>
    `;
  }).join('');
  
  container.innerHTML = rows;
}

function renderNOKPorItem(avaliacoes) {
  // TODO: Implementar gráfico Chart.js
  console.log('renderNOKPorItem: implementar');
}

// ============================================
// RENDERIZAÇÃO: OUTRAS TELAS
// ============================================

function renderExecutivo() {
  console.log('renderExecutivo');
  applyFilters();
  // TODO: Implementar
}

function renderTerritorial() {
  console.log('renderTerritorial');
  // TODO: Implementar mapa Leaflet
}

function renderReincidencia() {
  console.log('renderReincidencia');
  // TODO: Implementar análise de reincidência
}

function renderAnalitico() {
  console.log('renderAnalitico');
  // TODO: Implementar tabela analítica
}

// ============================================
// BOOT
// ============================================

document.addEventListener("DOMContentLoaded", init);
