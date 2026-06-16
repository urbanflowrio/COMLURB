// ============================================
// SCREENS.JS - RENDERIZAÇÃO DAS TELAS SMS
// ============================================

// TELA 1: VISÃO EXECUTIVA
function renderVisaoExecutiva() {
  return `
    <div class="screen-header">
      <h2>📊 Visão Executiva - SMS</h2>
      <p>Limpeza e Coleta em Unidades de Saúde</p>
    </div>

    <!-- KPIs -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon">🏥</div>
        <div class="kpi-value">${totais.unidadesAtivas}</div>
        <div class="kpi-label">Unidades Ativas</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">💰</div>
        <div class="kpi-value">R$ ${(totais.faturamentoAcumulado / 1000000).toFixed(1)}M</div>
        <div class="kpi-label">Fat. Acumulado 2024-25</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">👷</div>
        <div class="kpi-value">${totais.efetivo}</div>
        <div class="kpi-label">Efetivo Operacional</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">🗑️</div>
        <div class="kpi-value">${totais.containersTotais}</div>
        <div class="kpi-label">Containers Total</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">☢️</div>
        <div class="kpi-value">${totais.containersRSS}</div>
        <div class="kpi-label">Containers RSS</div>
      </div>
    </div>

    <!-- Gráfico de Faturamento -->
    <div class="chart-container">
      <h3>💵 Faturamento Mensal por Hospital</h3>
      <canvas id="chartFaturamento"></canvas>
    </div>

    <!-- Resumo Contratual -->
    <div class="info-card">
      <h3>📋 Resumo Contratual</h3>
      <div class="info-grid">
        <div><strong>Vigência:</strong> Até 01/01/2028</div>
        <div><strong>Reajuste:</strong> Bienal</div>
        <div><strong>Receita Mensal:</strong> R$ ${totais.receitaMensal.toLocaleString('pt-BR')}</div>
        <div><strong>Observação:</strong> ${observacoes.gazolla}</div>
      </div>
      <div class="hospitals-summary">
        ${hospitalData.ativo.map(h => `
          <div class="hospital-mini">
            <strong>${h.sigla}</strong>: ${h.efetivo} garis | R$ ${(h.receitaMensal / 1000).toFixed(0)}k/mês
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Mapa -->
    <div class="map-container">
      <div id="mapExecutivo" class="map"></div>
    </div>
  `;
}

// TELA 2: ESTRUTURA CONTRATUAL
function renderEstruturaContratual() {
  return `
    <div class="screen-header">
      <h2>📑 Estrutura Contratual</h2>
      <p>Detalhamento dos Contratos SMS</p>
    </div>

    <div class="contracts-grid">
      ${hospitalData.ativo.map(hospital => `
        <div class="contract-card">
          <div class="contract-header">
            <h3>🏥 ${hospital.nome}</h3>
            <span class="badge-active">ATIVO</span>
          </div>
          <div class="contract-body">
            <div class="contract-info">
              <div class="info-row">
                <span class="label">Sigla:</span>
                <span class="value">${hospital.sigla}</span>
              </div>
              <div class="info-row">
                <span class="label">Efetivo Operacional:</span>
                <span class="value">${hospital.efetivo} garis</span>
              </div>
              <div class="info-row">
                <span class="label">Receita Mensal:</span>
                <span class="value">R$ ${hospital.receitaMensal.toLocaleString('pt-BR')}</span>
              </div>
              <div class="info-row">
                <span class="label">Containers Total:</span>
                <span class="value">${hospital.containers.total} unidades</span>
              </div>
              <div class="info-row">
                <span class="label">Containers RSS:</span>
                <span class="value">${hospital.containers.rss} unidades</span>
              </div>
              <div class="info-row">
                <span class="label">Início do Contrato:</span>
                <span class="value">${new Date(hospital.inicio).toLocaleDateString('pt-BR')}</span>
              </div>
              <div class="info-row">
                <span class="label">Vencimento:</span>
                <span class="value">${new Date(hospital.vencimento).toLocaleDateString('pt-BR')}</span>
              </div>
              <div class="info-row">
                <span class="label">Reajuste:</span>
                <span class="value">${hospital.reajuste}</span>
              </div>
              <div class="info-row">
                <span class="label">Coordenadas:</span>
                <span class="value">${hospital.coordenadas.lat}, ${hospital.coordenadas.lng}</span>
              </div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Hospital Inativo -->
    <div class="inactive-section">
      <h3>❌ Unidade Inativa</h3>
      ${hospitalData.inativo.map(h => `
        <div class="inactive-card">
          <strong>${h.nome}</strong> (${h.sigla})
          <br><small>${h.status} - ${h.motivo}</small>
        </div>
      `).join('')}
    </div>
  `;
}

// TELA 3: TERRITORIAL
function renderTerritorial() {
  const ranking = hospitalData.ativo
    .sort((a, b) => b.efetivo - a.efetivo)
    .map((h, i) => ({ ...h, posicao: i + 1 }));

  return `
    <div class="screen-header">
      <h2>🗺️ Visão Territorial</h2>
      <p>Distribuição Geográfica das Unidades SMS</p>
    </div>

    <!-- Resumo Territorial -->
    <div class="territorial-summary">
      <div class="summary-card">
        <div class="summary-icon">🏥</div>
        <div class="summary-value">${totais.unidadesAtivas}</div>
        <div class="summary-label">Unidades Mapeadas</div>
      </div>
      <div class="summary-card">
        <div class="summary-icon">👷</div>
        <div class="summary-value">${totais.efetivo}</div>
        <div class="summary-label">Efetivo Total</div>
      </div>
      <div class="summary-card">
        <div class="summary-icon">🗑️</div>
        <div class="summary-value">${totais.containersTotais}</div>
        <div class="summary-label">Containers</div>
      </div>
    </div>

    <!-- Mapa Interativo -->
    <div class="map-container">
      <div id="mapTerritorial" class="map"></div>
    </div>

    <!-- Ranking por Efetivo -->
    <div class="ranking-container">
      <h3>🏆 Ranking por Efetivo Operacional</h3>
      <table class="ranking-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Unidade</th>
            <th>Efetivo</th>
            <th>Receita Mensal</th>
            <th>Containers</th>
          </tr>
        </thead>
        <tbody>
          ${ranking.map(h => `
            <tr>
              <td class="rank-position">${h.posicao}º</td>
              <td><strong>${h.sigla}</strong><br><small>${h.nome}</small></td>
              <td>${h.efetivo} garis</td>
              <td>R$ ${(h.receitaMensal / 1000).toFixed(0)}k</td>
              <td>${h.containers.total} (${h.containers.rss} RSS)</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}
