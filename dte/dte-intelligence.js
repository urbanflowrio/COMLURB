// ============================================
// UTILS - Cálculo de Risco e Status
// ============================================

// ============================================
// THRESHOLDS DE CRITICIDADE
// ============================================

const THRESHOLDS = {
  // Frota
  frotaPropria: { critical: 20, warning: 40 },  // % operacional
  utilizacaoFrota: { critical: 60, warning: 75 }, // %
  sobrecarga: { critical: 25, warning: 15 },     // %
  horasExtras: { critical: 2, warning: 1.5 },    // %
  
  // ETRs
  concentracaoETR: { critical: 40, warning: 30 }, // % de uma ETR no total
  
  // Ambiental
  taxaPurificacao: { critical: 60, warning: 70 }, // %
  
  // Infraestrutura
  taxaOperacional: { critical: 20, warning: 30 }  // %
};

// ============================================
// CALCULA STATUS (🔴🟡🟢)
// ============================================

function getStatus(value, metric, inverted = false) {
  const t = THRESHOLDS[metric];
  if (!t) return 'normal';
  
  if (inverted) {
    // Quanto MENOR, pior (ex: utilização, taxa operacional)
    if (value <= t.critical) return 'critical';
    if (value <= t.warning) return 'warning';
    return 'normal';
  } else {
    // Quanto MAIOR, pior (ex: sobrecarga, horas extras)
    if (value >= t.critical) return 'critical';
    if (value >= t.warning) return 'warning';
    return 'normal';
  }
}

function getStatusIcon(status) {
  const icons = {
    critical: '🔴',
    warning: '🟡',
    normal: '🟢'
  };
  return icons[status] || '';
}

function getStatusColor(status) {
  const colors = {
    critical: 'red',
    warning: 'orange',
    normal: 'green'
  };
  return colors[status] || 'blue';
}

function getStatusLabel(status) {
  const labels = {
    critical: 'CRÍTICO',
    warning: 'ATENÇÃO',
    normal: 'NORMAL'
  };
  return labels[status] || '';
}

// ============================================
// CALCULA SCORE DE RISCO (0-100)
// ============================================

function calcularRiscoOperacional(dados) {
  let score = 100; // Começa perfeito
  
  // FROTA PRÓPRIA (peso 25)
  const taxaOp = dados.frotaPropria?.taxaOperacional || 0;
  if (taxaOp < 20) score -= 25;
  else if (taxaOp < 40) score -= 15;
  else if (taxaOp < 60) score -= 5;
  
  // SOBRECARGA (peso 20)
  const sobrecarga = dados.frota?.sobrecarga || 0;
  if (sobrecarga > 25) score -= 20;
  else if (sobrecarga > 15) score -= 10;
  
  // HORAS EXTRAS (peso 15)
  const he = dados.frota?.horasExtras || 0;
  if (he > 2) score -= 15;
  else if (he > 1.5) score -= 8;
  
  // CONCENTRAÇÃO ETR (peso 15)
  const concETR = dados.recebimento?.concentracaoCaju || 0;
  if (concETR > 40) score -= 15;
  else if (concETR > 30) score -= 8;
  
  // UTILIZAÇÃO FROTA (peso 10)
  const util = dados.frota?.utilizacao || 0;
  if (util < 60) score -= 10;
  else if (util < 75) score -= 5;
  
  // CHORUME ACUMULADO (peso 10)
  const chorume = dados.bio?.chorumeAcumulado || 0;
  if (chorume > 150000) score -= 10;
  else if (chorume > 100000) score -= 5;
  
  // CRESCIMENTO LIXO PÚBLICO (peso 5)
  const lixoPublico = dados.recebimento?.crescimentoLixoPublico || 0;
  if (lixoPublico > 10) score -= 5;
  
  return Math.max(0, Math.min(100, score));
}

function getRiscoStatus(score) {
  if (score >= 80) return { status: 'normal', label: 'BAIXO', icon: '🟢' };
  if (score >= 60) return { status: 'warning', label: 'MÉDIO', icon: '🟡' };
  return { status: 'critical', label: 'ALTO', icon: '🔴' };
}

// ============================================
// GERA RANKINGS
// ============================================

function gerarRankingCriticos(dados) {
  const items = [];
  
  // Frota Própria
  if (dados.frotaPropria?.taxaOperacional < 30) {
    items.push({
      label: 'Frota Própria',
      value: dados.frotaPropria.taxaOperacional,
      unit: '%',
      status: getStatus(dados.frotaPropria.taxaOperacional, 'taxaOperacional', true),
      score: 100 - dados.frotaPropria.taxaOperacional
    });
  }
  
  // Sobrecarga
  if (dados.frota?.sobrecarga > 15) {
    items.push({
      label: 'Sobrecarga >10% PBT',
      value: dados.frota.sobrecarga,
      unit: '%',
      status: getStatus(dados.frota.sobrecarga, 'sobrecarga'),
      score: dados.frota.sobrecarga
    });
  }
  
  // Horas Extras
  if (dados.frota?.horasExtras > 1.5) {
    items.push({
      label: 'Horas Extras',
      value: dados.frota.horasExtras,
      unit: '%',
      status: getStatus(dados.frota.horasExtras, 'horasExtras'),
      score: dados.frota.horasExtras * 10
    });
  }
  
  // Concentração Caju
  if (dados.recebimento?.concentracaoCaju > 35) {
    items.push({
      label: 'Concentração ETR Caju',
      value: dados.recebimento.concentracaoCaju,
      unit: '%',
      status: getStatus(dados.recebimento.concentracaoCaju, 'concentracaoETR'),
      score: dados.recebimento.concentracaoCaju
    });
  }
  
  // Utilização CDC baixa
  if (dados.frota?.utilizacao < 75) {
    items.push({
      label: 'Utilização CDC',
      value: dados.frota.utilizacao,
      unit: '%',
      status: getStatus(dados.frota.utilizacao, 'utilizacaoFrota', true),
      score: 100 - dados.frota.utilizacao
    });
  }
  
  // Ordena por criticidade (score desc)
  items.sort((a, b) => b.score - a.score);
  
  return items.slice(0, 3);
}

function gerarRankingEficientes(dados) {
  const items = [];
  
  // Taxa Purificação Biogás
  if (dados.bio?.taxaPurificacao > 70) {
    items.push({
      label: 'Purificação Biogás',
      value: dados.bio.taxaPurificacao,
      unit: '%',
      status: 'normal',
      score: dados.bio.taxaPurificacao
    });
  }
  
  // Utilização acima meta
  if (dados.frota?.utilizacao > 75) {
    items.push({
      label: 'Utilização CDC',
      value: dados.frota.utilizacao,
      unit: '%',
      status: 'normal',
      score: dados.frota.utilizacao
    });
  }
  
  // Taxa operacional boa
  if (dados.frotaPropria?.taxaOperacional > 30) {
    items.push({
      label: 'Frota Própria Ativa',
      value: dados.frotaPropria.taxaOperacional,
      unit: '%',
      status: 'normal',
      score: dados.frotaPropria.taxaOperacional
    });
  }
  
  // ETRs distribuídas (sem concentração excessiva)
  if (dados.recebimento?.concentracaoCaju < 35) {
    items.push({
      label: 'Distribuição ETRs',
      value: 100 - dados.recebimento.concentracaoCaju,
      unit: '% balanceado',
      status: 'normal',
      score: 100 - dados.recebimento.concentracaoCaju
    });
  }
  
  // HE controlado
  if (dados.frota?.horasExtras < 1.5) {
    items.push({
      label: 'Controle HE',
      value: dados.frota.horasExtras,
      unit: '%',
      status: 'normal',
      score: 100 - (dados.frota.horasExtras * 20)
    });
  }
  
  // Ordena por eficiência (score desc)
  items.sort((a, b) => b.score - a.score);
  
  return items.slice(0, 3);
}

// ============================================
// EXPORTA
// ============================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getStatus,
    getStatusIcon,
    getStatusColor,
    getStatusLabel,
    calcularRiscoOperacional,
    getRiscoStatus,
    gerarRankingCriticos,
    gerarRankingEficientes,
    THRESHOLDS
  };
}
