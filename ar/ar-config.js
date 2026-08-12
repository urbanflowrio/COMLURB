/*
 * HUB COMLURB · Acordo de Resultados
 * Configuração dos CSVs publicados no Google Sheets.
 */

window.AR_CONFIG = {
  anoDefault: 2026,

  urls: {
    geral: window.HUB.sources.fonte("AR_GERAL").url,
    ar2026: window.HUB.sources.fonte("AR_2026").url,
    mapeamento: window.HUB.sources.fonte("AR_MAPEAMENTO").url,
    governanca: window.HUB.sources.fonte("AR_GOVERNANCA").url
  },

  status: {
    superado: 1.000001,
    dentroMeta: 1,
    atencao: 0.9
  },

  meses: [
    { key: "Jan", label: "Jan" },
    { key: "Fev", label: "Fev" },
    { key: "Mar", label: "Mar" },
    { key: "Abr", label: "Abr" },
    { key: "Mai", label: "Mai" },
    { key: "Jun", label: "Jun" },
    { key: "Jul", label: "Jul" },
    { key: "Ago", label: "Ago" },
    { key: "Set", label: "Set" },
    { key: "Out", label: "Out" },
    { key: "Nov", label: "Nov" },
    { key: "Dez", label: "Dez" }
  ]
};
