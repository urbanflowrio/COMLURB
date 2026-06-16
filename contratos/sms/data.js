// ============================================
// DATA.JS - PAINEL SMS (LIMPEZA HOSPITALAR)
// ============================================

// DADOS DOS HOSPITAIS ATIVOS
const hospitalData = {
  ativo: [
    {
      nome: "Hospital Municipal Miguel Couto",
      sigla: "HMMC",
      efetivo: 111,
      receitaMensal: 1260796,
      containers: { total: 45, rss: 30 },
      coordenadas: { lat: -22.9945, lng: -43.2769 },
      inicio: "2023-01-01",
      vencimento: "2028-01-01",
      reajuste: "Bienal"
    },
    {
      nome: "Hospital Municipal Salgado Filho",
      sigla: "HMSF",
      efetivo: 106,
      receitaMensal: 1201051,
      containers: { total: 42, rss: 28 },
      coordenadas: { lat: -22.8964, lng: -43.3087 },
      inicio: "2023-01-01",
      vencimento: "2028-01-01",
      reajuste: "Bienal"
    },
    {
      nome: "Hospital Municipal Lourenço Jorge + Leila Diniz",
      sigla: "HMLJ/LD",
      efetivo: 145,
      receitaMensal: 1576412,
      containers: { total: 58, rss: 38 },
      coordenadas: { lat: -23.0125, lng: -43.3089 },
      inicio: "2023-01-01",
      vencimento: "2028-01-01",
      reajuste: "Bienal"
    }
  ],
  inativo: [
    {
      nome: "Hospital Municipal Pedro II (Gazolla)",
      sigla: "HMPII",
      status: "Inativo desde meados de 2024",
      motivo: "Contrato encerrado"
    }
  ]
};

// FATURAMENTO HISTÓRICO 2024-2026
const faturamentoHistorico = [
  { mes: "Jan/24", hmmc: 1260796, hmsf: 1201051, hmlj: 1576412 },
  { mes: "Fev/24", hmmc: 1260796, hmsf: 1201051, hmlj: 1576412 },
  { mes: "Mar/24", hmmc: 1260796, hmsf: 1201051, hmlj: 1576412 },
  { mes: "Abr/24", hmmc: 1260796, hmsf: 1201051, hmlj: 1576412 },
  { mes: "Mai/24", hmmc: 1260796, hmsf: 1201051, hmlj: 1576412 },
  { mes: "Jun/24", hmmc: 1260796, hmsf: 1201051, hmlj: 1576412 },
  { mes: "Jul/24", hmmc: 1260796, hmsf: 1201051, hmlj: 1576412 },
  { mes: "Ago/24", hmmc: 1260796, hmsf: 1201051, hmlj: 1576412 },
  { mes: "Set/24", hmmc: 1260796, hmsf: 1201051, hmlj: 1576412 },
  { mes: "Out/24", hmmc: 1260796, hmsf: 1201051, hmlj: 1576412 },
  { mes: "Nov/24", hmmc: 1260796, hmsf: 1201051, hmlj: 1576412 },
  { mes: "Dez/24", hmmc: 1260796, hmsf: 1201051, hmlj: 1576412 },
  { mes: "Jan/25", hmmc: 1260796, hmsf: 1201051, hmlj: 1576412 },
  { mes: "Fev/25", hmmc: 1260796, hmsf: 1201051, hmlj: 1576412 },
  { mes: "Mar/25", hmmc: 1260796, hmsf: 1201051, hmlj: 1576412 },
  { mes: "Abr/25", hmmc: 1260796, hmsf: 1201051, hmlj: 1576412 },
  { mes: "Mai/25", hmmc: 1260796, hmsf: 1201051, hmlj: 1576412 }
];

// CÁLCULOS AUTOMÁTICOS
const totais = {
  unidadesAtivas: hospitalData.ativo.length,
  efetivo: hospitalData.ativo.reduce((sum, h) => sum + h.efetivo, 0),
  receitaMensal: hospitalData.ativo.reduce((sum, h) => sum + h.receitaMensal, 0),
  containersTotais: hospitalData.ativo.reduce((sum, h) => sum + h.containers.total, 0),
  containersRSS: hospitalData.ativo.reduce((sum, h) => sum + h.containers.rss, 0),
  faturamentoAcumulado: faturamentoHistorico.reduce((sum, m) => 
    sum + m.hmmc + m.hmsf + m.hmlj, 0
  )
};

// OBSERVAÇÕES
const observacoes = {
  gazolla: "Hospital Municipal Pedro II (Gazolla) saiu do contrato em meados de 2024",
  vigencia: "Contratos vigentes até 01/01/2028",
  reajuste: "Reajuste bienal conforme contrato"
};
