// URLs das planilhas
const DATA_URL_1 = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTRbfRYtnjYlxLIPTfIpC_Q7ftJ6uUf1BK9gcZs_CSEiEnIE7qCAk_U_3_bibXftsCAf5K1uQdAPsOx/pub?output=csv";
const DATA_URL_2 = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTGM0j-OA3ERumBvilwumifE-V60PLI_iDOUwc1KGOYl47cEr74-O7tkKuAjf6yykn8cd7V7mAorDNL/pub?gid=925345857&single=true&output=csv";

let DATA_RAW = [];
let DATA_RAW_2 = [];

let DATA = {
  recebimento: [],
  tipoColeta: [],
  biogas: [],
  chorume: [],
  utilizacao: [],
  sobrecarga: [],
  horasExtras: [],
  frotaPropria: [],
  intervencoes: []
};

function findSection(title) {
  for (let i = 0; i < DATA_RAW.length; i++) {
    if (DATA_RAW[i][0] && DATA_RAW[i][0].includes(title)) return i;
  }
  return -1;
}

function parseNum(val) {
  if (!val) return 0;
  let str = String(val).replace(/\./g, "").replace(",", ".");
  return parseFloat(str) || 0;
}
