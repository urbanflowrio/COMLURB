// ============================================
// APP.JS - ORQUESTRAÇÃO DO PAINEL SMS
// ============================================

let currentScreen = 'executiva';
let chartInstance = null;

// INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  renderScreen('executiva');
});

// NAVEGAÇÃO ENTRE TELAS
function setupNavigation() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const screen = e.target.dataset.screen;
      renderScreen(screen);
      
      // Atualiza estado ativo dos botões
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
    });
  });
}

// RENDERIZAÇÃO DE TELA
function renderScreen(screenName) {
  currentScreen = screenName;
  const container = document.getElementById('content');
  
  // Destrói gráfico anterior se existir
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
  
  // Renderiza conteúdo
  switch(screenName) {
    case 'executiva':
      container.innerHTML = renderVisaoExecutiva();
      setTimeout(() => {
        initChartFaturamento();
        initMapExecutivo();
      }, 100);
      break;
    case 'contratual':
      container.innerHTML = renderEstruturaContratual();
      break;
    case 'territorial':
      container.innerHTML = renderTerritorial();
      setTimeout(() => initMapTerritorial(), 100);
      break;
  }
}

// GRÁFICO DE FATURAMENTO
function initChartFaturamento() {
  const ctx = document.getElementById('chartFaturamento');
  if (!ctx) return;
  
  const labels = faturamentoHistorico.map(m => m.mes);
  const datasets = [
    {
      label: 'HMMC',
      data: faturamentoHistorico.map(m => m.hmmc),
      backgroundColor: 'rgba(54, 162, 235, 0.7)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 2
    },
    {
      label: 'HMSF',
      data: faturamentoHistorico.map(m => m.hmsf),
      backgroundColor: 'rgba(75, 192, 192, 0.7)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 2
    },
    {
      label: 'HMLJ/LD',
      data: faturamentoHistorico.map(m => m.hmlj),
      backgroundColor: 'rgba(255, 159, 64, 0.7)',
      borderColor: 'rgba(255, 159, 64, 1)',
      borderWidth: 2
    }
  ];
  
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        title: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => 'R$ ' + (value / 1000).toFixed(0) + 'k'
          }
        }
      }
    }
  });
}

// MAPA EXECUTIVO
function initMapExecutivo() {
  const mapEl = document.getElementById('mapExecutivo');
  if (!mapEl) return;
  
  const map = L.map('mapExecutivo').setView([-22.95, -43.25], 11);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);
  
  // Adiciona marcadores
  hospitalData.ativo.forEach(hospital => {
    const marker = L.marker([hospital.coordenadas.lat, hospital.coordenadas.lng])
      .addTo(map)
      .bindPopup(`
        <strong>${hospital.nome}</strong><br>
        Efetivo: ${hospital.efetivo} garis<br>
        Receita: R$ ${(hospital.receitaMensal / 1000).toFixed(0)}k/mês
      `);
  });
}

// MAPA TERRITORIAL
function initMapTerritorial() {
  const mapEl = document.getElementById('mapTerritorial');
  if (!mapEl) return;
  
  const map = L.map('mapTerritorial').setView([-22.95, -43.25], 11);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);
  
  // Adiciona marcadores com numeração
  hospitalData.ativo.forEach((hospital, index) => {
    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div class="marker-pin">${index + 1}</div>`,
      iconSize: [30, 42],
      iconAnchor: [15, 42]
    });
    
    L.marker([hospital.coordenadas.lat, hospital.coordenadas.lng], { icon: customIcon })
      .addTo(map)
      .bindPopup(`
        <strong>#${index + 1} - ${hospital.sigla}</strong><br>
        ${hospital.nome}<br>
        <strong>Efetivo:</strong> ${hospital.efetivo} garis<br>
        <strong>Containers:</strong> ${hospital.containers.total} (${hospital.containers.rss} RSS)<br>
        <strong>Receita:</strong> R$ ${hospital.receitaMensal.toLocaleString('pt-BR')}/mês
      `);
  });
}
