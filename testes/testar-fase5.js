/* ============================================================
   HUB COMLURB · testes/testar-fase5.js
   Suíte de teste reproduzível da Fase 5 (Piloto B — Engenharia/DTE).

   Uso (a partir da raiz do repositório, com esta entrega já mesclada
   sobre um checkout de main):

     node testes/testar-fase5.js <raiz>

   Exemplo:

     node testes/testar-fase5.js .

   Não depende de nenhum framework externo além de papaparse. Roda em
   Node puro, sem servidor, sem rede — todos os casos usam fixtures
   locais (opts.fixtureTexto), nunca a URL real do Google Sheets (ver
   limitação de ambiente em IMPLEMENTATION_STATUS.md).

   Esta suíte é ESPECÍFICA da Fase 5. Os 42 casos da Fase 4
   (testes/testar-fase4.js) e os casos de Fases 2/3 (testes/
   hub-selftest.js) não são re-executados aqui — rode-os separadamente
   para confirmar ausência de regressão (ver IMPLEMENTATION_STATUS.md,
   que registra os dois números separados desta entrega).
   ============================================================ */

"use strict";

global.window = global;
global.document = { getElementById: function () { return null; }, addEventListener: function () {}, createElement: function () { return {}; } };

var fs = require("fs");
var path = require("path");

try {
  global.Papa = require("papaparse");
} catch (e) {
  console.error("Dependência ausente: papaparse. Instale com 'npm install papaparse' antes de rodar esta suíte.");
  process.exit(1);
}

var raiz = process.argv[2];
if (!raiz) {
  console.error("Uso: node testes/testar-fase5.js <raiz-do-repositorio>");
  process.exit(1);
}
raiz = path.resolve(raiz);

var COMP = path.join(raiz, "assets/components/");

var arquivosCarregados = [];
function carregar(caminho, obrigatorio) {
  if (!fs.existsSync(caminho)) {
    if (obrigatorio) {
      console.error("ARQUIVO OBRIGATÓRIO AUSENTE: " + caminho);
    } else {
      console.error("ARQUIVO NOVO AUSENTE (deveria estar no ZIP desta entrega): " + caminho);
    }
    process.exit(1);
  }
  (0, eval)(fs.readFileSync(caminho, "utf8"));
  arquivosCarregados.push(caminho);
}

carregar(path.join(COMP, "hub-core.js"), true);
carregar(path.join(COMP, "hub-sources.js"), false); // alterado nesta entrega (fonte DTE_RELATORIO_GERAL adicionada)
carregar(path.join(COMP, "hub-ingest-model.js"), true);
carregar(path.join(COMP, "hub-ingest-reader.js"), true);
carregar(path.join(COMP, "hub-ingest-adapter-dte.js"), false); // novo nesta entrega
carregar(path.join(raiz, "engenharia-operacional/piloto/harness.js"), false); // corrigido nesta entrega (correção pós-auditoria)

var HUB = global.HUB;

var grupos = [], atual = null, totais = { pass: 0, fail: 0 };
function grupo(nome) { atual = { nome: nome, casos: [] }; grupos.push(atual); }
function caso(nome, obtido, esperado) {
  var ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  totais[ok ? "pass" : "fail"]++;
  atual.casos.push({ nome: nome, ok: ok, obtido: obtido, esperado: esperado });
}

/* ---------- fixture real (aba geral, dados enviados nesta fase, convertida para o mesmo formato de CSV publicado pelo Google Sheets) ---------- */
var FIXTURE_PATH = path.join(__dirname, "fixtures", "dte-geral-real.csv");
var FIXTURE_REAL = fs.existsSync(FIXTURE_PATH) ? fs.readFileSync(FIXTURE_PATH, "utf8") : null;

async function rodar() {
  /* ---------- Locator ---------- */
  grupo("Fase 5 · Locator — DTE_RELATORIO_GERAL registrada");
  var fonte = HUB.sources.fonte("DTE_RELATORIO_GERAL");
  caso("Fonte registrada com readerType remote-csv", !!fonte && fonte.readerType, "remote-csv");
  caso("schemaVersion = series_operacionais.dte.v1", fonte.schemaVersion, "series_operacionais.dte.v1");
  caso("URL configurada (mesma do painel de produção)", typeof fonte.url === "string" && fonte.url.indexOf("docs.google.com") !== -1, true);

  /* ---------- Mecanismo: conversão numérica (nunca ausência -> 0) ---------- */
  grupo("Fase 5 · numDTE — vazio/\"-\"/\"—\" -> null; zero literal -> 0");
  var numDTE = HUB.ingest.adapterDTE._numDTE;
  caso("Célula vazia -> null", numDTE(""), null);
  caso("\"-\" -> null", numDTE("-"), null);
  caso("\"—\" (travessão) -> null", numDTE("—"), null);
  caso("undefined -> null", numDTE(undefined), null);
  caso("null -> null", numDTE(null), null);
  caso("Zero literal -> 0 (nunca null)", numDTE("0"), 0);
  caso("Zero numérico -> 0", numDTE(0), 0);
  caso("\"1.234\" (milhar pt-BR) -> 1234", numDTE("1.234"), 1234);
  caso("\"16.257.432\" (milhões, mais de um separador de milhar — achado real de biogás) -> 16257432", numDTE("16.257.432"), 16257432);
  caso("\"0,479\" (decimal pt-BR) -> 0.479", numDTE("0,479"), 0.479);
  caso("\"R$ 442.403\" -> 442403", numDTE("R$ 442.403"), 442403);
  caso("\"abc\" (não numérico) -> null (nunca 0)", numDTE("abc"), null);

  /* ---------- Mecanismo: detecção de célula de período ---------- */
  grupo("Fase 5 · Detecção de período (mmm.-aa)");
  var celulaEhPeriodo = HUB.ingest.adapterDTE._celulaEhPeriodo;
  caso("\"mai.-25\" reconhecida", celulaEhPeriodo("mai.-25"), { ano: 2025, mes: 5 });
  caso("\"jan.-26\" reconhecida", celulaEhPeriodo("jan.-26"), { ano: 2026, mes: 1 });
  caso("\"MAI.-25\" (maiúsculo) reconhecida", celulaEhPeriodo("MAI.-25"), { ano: 2025, mes: 5 });
  caso("Texto qualquer não é período", celulaEhPeriodo("ETR Bangu - t"), null);
  caso("Número não é período", celulaEhPeriodo("48998"), null);

  /* ---------- Estrutura: bloco não catalogado falha explicitamente ---------- */
  grupo("Fase 5 · Bloco/subgrupo não reconhecido — falha explícita, nunca vira indicador");
  var FIX_BLOCO_DESCONHECIDO =
    "E - BLOCO NOVO NUNCA VISTO,,,,,,,,,,,,,,,,\r\n" +
    "Indicador Fantasma,mai.-25,jun.-25,jul.-25,ago.-25,set.-25,out.-25,nov.-25,dez.-25,jan.-26,fev.-26,mar.-26,abr.-26,mai.-26\r\n" +
    "Valor,10,10,10,10,10,10,10,10,10,10,10,10,10\r\n";
  var resBlocoDesc = await HUB.ingest.adapterDTE.carregarDTE({ fixtureTexto: FIX_BLOCO_DESCONHECIDO });
  caso("Bloco letra E (fora da whitelist A-D) não produz nenhum indicador", resBlocoDesc.indicadores.length, 0);
  caso("Gera bloqueio tipo bloco_nao_reconhecido", resBlocoDesc.bloqueios.some(function (b) { return b.tipo === "bloco_nao_reconhecido"; }), true);
  caso("Envelope falha (nenhum registro produzido = erro, não payload parcial)", resBlocoDesc.envelope.payload, null);
  caso("quality.erros não vazio", resBlocoDesc.envelope.quality.erros.length > 0, true);

  var FIX_SUBGRUPO_DESCONHECIDO =
    "B - MONITORAMENTO FROTA CONTRATADA,,,,,,,,,,,,,,,,\r\n" +
    "Subgrupo Nunca Catalogado,mai.-25,jun.-25,jul.-25,ago.-25,set.-25,out.-25,nov.-25,dez.-25,jan.-26,fev.-26,mar.-26,abr.-26,mai.-26\r\n" +
    "Indicador Fantasma,10,10,10,10,10,10,10,10,10,10,10,10,10\r\n";
  var resSubDesc = await HUB.ingest.adapterDTE.carregarDTE({ fixtureTexto: FIX_SUBGRUPO_DESCONHECIDO });
  caso("Subgrupo não catalogado no Bloco B: nenhum indicador sob ele", resSubDesc.indicadores.length, 0);
  caso("Gera bloqueio tipo subgrupo_nao_reconhecido", resSubDesc.bloqueios.some(function (b) { return b.tipo === "subgrupo_nao_reconhecido"; }), true);

  var FIX_ROMANO_FORA_A =
    "B - MONITORAMENTO FROTA CONTRATADA,,,,,,,,,,,,,,,,\r\n" +
    "III - Romano Não Deveria Aparecer Aqui,,,,,,,,,,,,,,,,\r\n";
  var resRomanoFora = await HUB.ingest.adapterDTE.carregarDTE({ fixtureTexto: FIX_ROMANO_FORA_A });
  caso("Romano fora do Bloco A gera bloqueio romano_fora_de_contexto", resRomanoFora.bloqueios.some(function (b) { return b.tipo === "romano_fora_de_contexto"; }), true);

  /* ---------- Gerência Ofensora: aceita N arbitrário, une par, falha se malformado ---------- */
  grupo("Fase 5 · Gerência Ofensora — N arbitrário, união de par, falha sem inventar valor");
  var FIX_OFENSORA_OK =
    "B - MONITORAMENTO FROTA CONTRATADA,,,,,,,,,,,,,,,,\r\n" +
    "Coleta Domiciliar e Comunidade,mai.-25,jun.-25,jul.-25,ago.-25,set.-25,out.-25,nov.-25,dez.-25,jan.-26,fev.-26,mar.-26,abr.-26,mai.-26\r\n" +
    "Peso Coletado / Capacidade Estimada (t),\"0,7\",\"0,7\",\"0,7\",\"0,7\",\"0,7\",\"0,7\",\"0,7\",\"0,7\",\"0,7\",\"0,7\",\"0,7\",\"0,7\",\"0,7\"\r\n" +
    "Gerência Ofensora 7,SG05C,CG13M,CG13M,CG13M,CG13M,CG13M,SG27R,SG27R,SG27R,SG27R,SG27R,SG27R,SG27R\r\n" +
    ",\"0,479\",\"0,587\",\"0,579\",\"0,569\",\"0,583\",\"0,596\",\"0,595\",\"0,585\",\"0,561\",\"0,572\",\"0,555\",\"0,499\",\"0,476\"\r\n";
  var resOfensoraOK = await HUB.ingest.adapterDTE.carregarDTE({ fixtureTexto: FIX_OFENSORA_OK });
  caso("Aceita posição N=7 (não limita a 3)", resOfensoraOK.gerenciasOfensoras.every(function (r) { return r.posicaoOfensora === 7; }), true);
  caso("13 registros unidos (um por período)", resOfensoraOK.gerenciasOfensoras.length, 13);
  caso("Primeiro registro: código e valor corretos", { codigo: resOfensoraOK.gerenciasOfensoras[0].codigoGerencia, valor: resOfensoraOK.gerenciasOfensoras[0].valor }, { codigo: "SG05C", valor: 0.479 });
  caso("Nenhum bloqueio (par bem formado)", resOfensoraOK.bloqueios.length, 0);

  var FIX_OFENSORA_ROTULADA =
    "B - MONITORAMENTO FROTA CONTRATADA,,,,,,,,,,,,,,,,\r\n" +
    "% Sobrecarga,mai.-25,jun.-25,jul.-25,ago.-25,set.-25,out.-25,nov.-25,dez.-25,jan.-26,fev.-26,mar.-26,abr.-26,mai.-26\r\n" +
    "Qtde Pesagens > 10% PBT,10,10,10,10,10,10,10,10,10,10,10,10,10\r\n" +
    "Gerência Ofensora 1,OG19C,OG18G,OG18G,OG18G,OG18G,OG18G,OG18G,OG18G,OG18G,OG19C,OG19C,OG19C,OG19C\r\n" +
    "Qtde Pesagens > 10% PBT,739,742,789,777,867,888,891,1085,953,697,588,494,554\r\n";
  var resOfensoraRot = await HUB.ingest.adapterDTE.carregarDTE({ fixtureTexto: FIX_OFENSORA_ROTULADA });
  caso("Linha de valor COM rótulo próprio ainda é aceita (achado real, ver comentário no Adapter)", resOfensoraRot.gerenciasOfensoras.length, 13);
  caso("Rótulo da linha de valor é preservado em rotulosBrutos.linhaValor", resOfensoraRot.gerenciasOfensoras[0].rotulosBrutos.linhaValor, "Qtde Pesagens > 10% PBT");

  var FIX_OFENSORA_MALFORMADA =
    "B - MONITORAMENTO FROTA CONTRATADA,,,,,,,,,,,,,,,,\r\n" +
    "Coleta Domiciliar e Comunidade,mai.-25,jun.-25,jul.-25,ago.-25,set.-25,out.-25,nov.-25,dez.-25,jan.-26,fev.-26,mar.-26,abr.-26,mai.-26\r\n" +
    "Peso Coletado / Capacidade Estimada (t),\"0,7\",\"0,7\",\"0,7\",\"0,7\",\"0,7\",\"0,7\",\"0,7\",\"0,7\",\"0,7\",\"0,7\",\"0,7\",\"0,7\",\"0,7\"\r\n" +
    "Gerência Ofensora 1,SG05C,CG13M,CG13M,CG13M,CG13M,CG13M,SG27R,SG27R,SG27R,SG27R,SG27R,SG27R,SG27R\r\n" +
    "C - MANUTENÇÃO FROTA PRÓPRIA,,,,,,,,,,,,,,,,\r\n";
  var resOfensoraMal = await HUB.ingest.adapterDTE.carregarDTE({ fixtureTexto: FIX_OFENSORA_MALFORMADA });
  caso("Linha seguinte é início de novo bloco: nenhum valor inventado", resOfensoraMal.gerenciasOfensoras.length, 0);
  caso("Gera bloqueio ofensora_par_malformado", resOfensoraMal.bloqueios.some(function (b) { return b.tipo === "ofensora_par_malformado"; }), true);

  /* ---------- Correção pós-auditoria — Mecanismo A: consumo de MÚLTIPLAS linhas de valor associadas ---------- */
  grupo("Fase 5 · Correção pós-auditoria (Mecanismo A) — linha de valor de Gerência Ofensora consumida uma única vez, sem indicador duplicado");
  var FIX_OFENSORA_DUAS_LINHAS =
    "B - MONITORAMENTO FROTA CONTRATADA,,,,,,,,,,,,,,,,\r\n" +
    "% Sobrecarga,mai.-25,jun.-25,jul.-25,ago.-25,set.-25,out.-25,nov.-25,dez.-25,jan.-26,fev.-26,mar.-26,abr.-26,mai.-26\r\n" +
    "Qtde Pesagens > 10% PBT,8047,7749,8282,7843,9208,9843,10797,12664,12348,11281,10502,8779,8516\r\n" +
    "Qtde Pesagens > 10% PBT / Qtde Pesagens Total,\"0,203\",\"0,214\",\"0,215\",\"0,21\",\"0,227\",\"0,243\",\"0,273\",\"0,294\",\"0,288\",\"0,297\",\"0,276\",\"0,211\",\"0,206\"\r\n" +
    "Gerência Ofensora 1,OG19C,OG18G,OG18G,OG18G,OG18G,OG18G,OG18G,OG18G,OG18G,OG19C,OG19C,OG19C,OG19C\r\n" +
    "Qtde Pesagens > 10% PBT,739,742,789,777,867,888,891,1085,953,697,588,494,554\r\n" +
    "Qtde Pesagens > 10% PBT / Qtde Pesagens Total,\"0,337\",\"0,454\",\"0,434\",\"0,461\",\"0,542\",\"0,541\",\"0,527\",\"0,581\",\"0,537\",\"0,389\",\"0,359\",\"0,281\",\"0,315\"\r\n" +
    "Análise de Horas Extras x Faturamento,,,,,,,,,,,,,,,,\r\n";
  var resDuasLinhas = await HUB.ingest.adapterDTE.carregarDTE({ fixtureTexto: FIX_OFENSORA_DUAS_LINHAS });
  caso("Nenhum bloqueio (as duas linhas associadas são consumidas corretamente)", resDuasLinhas.bloqueios.length, 0);
  caso("26 registros de gerência ofensora (1 posição × 13 períodos × 2 linhas associadas: valor absoluto + razão)", resDuasLinhas.gerenciasOfensoras.length, 26);
  caso("Cada registro preserva qual rótulo o valor representa (indicadorAssociado)",
    resDuasLinhas.gerenciasOfensoras.map(function (g) { return g.indicadorAssociado; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(),
    ["Qtde Pesagens > 10% PBT", "Qtde Pesagens > 10% PBT / Qtde Pesagens Total"]);
  caso("Apenas 2 indicadores comuns extraídos (os dois agregados) — NENHUM duplicado pelas linhas associadas à ofensora",
    resDuasLinhas.indicadores.length, 26);
  var chavesIndicador = resDuasLinhas.indicadores.map(function (r) { return r.indicadorNormalizado + "|" + r.periodo; });
  caso("Nenhuma chave (indicador+período) repetida entre os indicadores comuns", new Set(chavesIndicador).size, chavesIndicador.length);
  caso("Lineage preservado nas duas linhas de origem (categórica e de valor) de cada registro de ofensora",
    resDuasLinhas.gerenciasOfensoras.every(function (g) { return typeof g.lineage.linhaOrigemCategorica === "number" && typeof g.lineage.linhaOrigemValor === "number"; }), true);

  /* ---------- Correção pós-auditoria — Mecanismo B: critério ---------- */
  grupo("Fase 5 · Correção pós-auditoria (Mecanismo B) — critério catalogado, preservado no modelo canônico");
  var FIX_CRITERIO =
    "A - ATIVIDADES OPERACIONAIS - COORDENADORIA DE DESTINAÇÃO DE RESÍDUOS - TCD,,,,,,,,,,,,,,,,\r\n" +
    "VII - Geração Chorume (m³),mai.-25,jun.-25,jul.-25,ago.-25,set.-25,out.-25,nov.-25,dez.-25,jan.-26,fev.-26,mar.-26,abr.-26,mai.-26\r\n" +
    "CTR Seriopédica,45851,38411,36736,38038,36415,41704,37941,42221,62140,104819,90414,55907,53466\r\n" +
    "Tratamento Interno,22448,31445,43499,26823,33410,37858,26146,28384,34936,35135,42498,25467,25149\r\n" +
    "Aterro Gramacho (ETC + MANEJO),36282,33680,35025,34186,35160,36103,35145,36840,33882,33015,35569,34360,35915\r\n" +
    "Tratamento Interno,33042,30785,32085,31336,31815,32233,31590,32940,30372,29250,32219,31860,32400\r\n";
  var resCriterio = await HUB.ingest.adapterDTE.carregarDTE({ fixtureTexto: FIX_CRITERIO });
  caso("Nenhum bloqueio (mesmo indicador repetido, mas sob critérios diferentes catalogados)", resCriterio.bloqueios.length, 0);
  var tratamentoInterno = resCriterio.indicadores.filter(function (r) { return r.indicadorNormalizado === "tratamento interno" && r.periodo === "2025-05"; });
  caso("\"Tratamento Interno\" aparece 2 vezes (uma por critério), não colide", tratamentoInterno.length, 2);
  caso("Critério preservado corretamente nos dois registros", tratamentoInterno.map(function (r) { return r.criterio; }).sort(),
    ["Aterro Gramacho (ETC + MANEJO)", "CTR Seriopédica"]);
  caso("criterioNormalizado também preservado", tratamentoInterno.every(function (r) { return typeof r.criterioNormalizado === "string" && r.criterioNormalizado !== ""; }), true);
  caso("linhaOrigemCriterio preservado (rastreável)", tratamentoInterno.every(function (r) { return typeof r.linhaOrigemCriterio === "number"; }), true);
  var linhaCriterioProprio = resCriterio.indicadores.filter(function (r) { return r.indicadorNormalizado === "ctr seriopedica" && r.periodo === "2025-05"; })[0];
  caso("A própria linha de critério (\"CTR Seriopédica\") tem criterio=null (define contexto, não pertence a nenhum)", linhaCriterioProprio.criterio, null);

  var FIX_CRITERIO_DESCONHECIDO =
    "A - ATIVIDADES OPERACIONAIS - COORDENADORIA DE DESTINAÇÃO DE RESÍDUOS - TCD,,,,,,,,,,,,,,,,\r\n" +
    "VII - Geração Chorume (m³),mai.-25,jun.-25,jul.-25,ago.-25,set.-25,out.-25,nov.-25,dez.-25,jan.-26,fev.-26,mar.-26,abr.-26,mai.-26\r\n" +
    "Critério Nunca Catalogado,10,10,10,10,10,10,10,10,10,10,10,10,10\r\n" +
    "Tratamento Interno,20,20,20,20,20,20,20,20,20,20,20,20,20\r\n" +
    "Tratamento Interno,30,30,30,30,30,30,30,30,30,30,30,30,30\r\n";
  var resCriterioDesc = await HUB.ingest.adapterDTE.carregarDTE({ fixtureTexto: FIX_CRITERIO_DESCONHECIDO });
  caso("Critério desconhecido: \"Tratamento Interno\" repete sob contexto não distinguível — gera bloqueio", resCriterioDesc.bloqueios.some(function (b) { return b.tipo === "indicador_duplicado_sem_criterio"; }), true);
  caso("Envelope inválido (bloqueio estrutural, nunca payload parcial)", resCriterioDesc.envelope.payload, null);

  grupo("Fase 5 · Correção pós-auditoria — bloqueio estrutural invalida o envelope inteiro (nunca carga parcial)");
  var FIX_CARGA_PARCIAL =
    "C - MANUTENÇÃO FROTA PRÓPRIA,,,,,,,,,,,,,,,,\r\n" +
    ",mai.-25,jun.-25,jul.-25,ago.-25,set.-25,out.-25,nov.-25,dez.-25,jan.-26,fev.-26,mar.-26,abr.-26,mai.-26\r\n" +
    "Frota Total,107,93,93,93,93,93,93,93,93,93,93,93,93\r\n" +
    "Subgrupo Novo Nunca Visto,mai.-25,jun.-25,jul.-25,ago.-25,set.-25,out.-25,nov.-25,dez.-25,jan.-26,fev.-26,mar.-26,abr.-26,mai.-26\r\n" +
    "Indicador Sob Subgrupo Novo,5,5,5,5,5,5,5,5,5,5,5,5,5\r\n";
  var resCargaParcial = await HUB.ingest.adapterDTE.carregarDTE({ fixtureTexto: FIX_CARGA_PARCIAL });
  caso("Registros diagnósticos existem fora do envelope (Frota Total foi extraído)", resCargaParcial.indicadores.length > 0, true);
  caso("Bloqueio estrutural presente (subgrupo_nao_reconhecido)", resCargaParcial.bloqueios.some(function (b) { return b.tipo === "subgrupo_nao_reconhecido"; }), true);
  caso("quality.erros não vazio (bloqueio virou erro, não aviso)", resCargaParcial.envelope.quality.erros.length > 0, true);
  caso("envelope.payload === null (carga parcial NUNCA publicada)", resCargaParcial.envelope.payload, null);
  caso("quality.status = erro", resCargaParcial.envelope.quality.status, "erro");


  grupo("Fase 5 · Bloco C — sem subgrupo confirmado, indicador direto sob o bloco");
  var FIX_BLOCO_C =
    "C - MANUTENÇÃO FROTA PRÓPRIA,,,,,,,,,,,,,,,,\r\n" +
    ",mai.-25,jun.-25,jul.-25,ago.-25,set.-25,out.-25,nov.-25,dez.-25,jan.-26,fev.-26,mar.-26,abr.-26,mai.-26\r\n" +
    "Frota Total,107,93,93,93,93,93,93,93,93,93,93,93,93\r\n";
  var resBlocoC = await HUB.ingest.adapterDTE.carregarDTE({ fixtureTexto: FIX_BLOCO_C });
  caso("13 registros de indicador (um por período)", resBlocoC.indicadores.length, 13);
  caso("subgrupo vazio (implícito), preservado como string vazia, não inventado", resBlocoC.indicadores[0].subgrupo, "");
  caso("Nenhum bloqueio", resBlocoC.bloqueios.length, 0);

  /* ---------- Fonte inexistente / vazia: falha segura ---------- */
  grupo("Fase 5 · Falha segura — fonte vazia ou ausente");
  var resVazio = await HUB.ingest.adapterDTE.carregarDTE({ fixtureTexto: "" });
  caso("Texto vazio: envelope sem payload", resVazio.envelope.payload, null);
  caso("Texto vazio: erro registrado, não silencioso", resVazio.envelope.quality.erros.length > 0, true);

  /* ---------- Harness (engenharia-operacional/piloto/harness.js) — correção pós-auditoria ---------- */
  if (typeof HARNESS_DTE !== "undefined") {
    grupo("Fase 5 · Harness — chave inclui subgrupo em A/B/D (exceção só em C)");

    function canonicoFake(registros, capturedAt) {
      return { indicadores: registros, envelope: { capturedAt: capturedAt || new Date().toISOString() } };
    }
    function linhaBaseVertical(grupoLabel, subgrupoLabel, indicadorLabel, valor, atualizacao) {
      return { ano: 2025, mes: 5, periodo: "2025-05", grupo: grupoLabel, indicador: subgrupoLabel, unidadeOperacional: indicadorLabel, unidadeMedida: "un", valor: valor, atualizacao: atualizacao || "2026-07-13T00:00:00" };
    }

    // Mesmo indicador em dois subgrupos diferentes do Bloco B não pode colidir.
    var canonicoB = canonicoFake([
      { bloco: "B - MONITORAMENTO FROTA CONTRATADA", subgrupo: "Subgrupo Um", subgrupoOcorrencia: 1, criterio: null, indicadorBruto: "Indicador Repetido", periodo: "2025-05", valor: 10 },
      { bloco: "B - MONITORAMENTO FROTA CONTRATADA", subgrupo: "Subgrupo Dois", subgrupoOcorrencia: 1, criterio: null, indicadorBruto: "Indicador Repetido", periodo: "2025-05", valor: 20 }
    ]);
    var relB3 = HARNESS_DTE.comparar(canonicoB, [
      linhaBaseVertical("B - MONITORAMENTO FROTA CONTRATADA", "Subgrupo Um", "Indicador Repetido", 10),
      linhaBaseVertical("B - MONITORAMENTO FROTA CONTRATADA", "Subgrupo Dois", "Indicador Repetido", 20)
    ]);
    caso("Bloco B: mesmo indicador em 2 subgrupos, valores distintos — as duas linhas casam corretamente pelo subgrupo, zero divergência real", relB3.resumo.divergenciasNumericasReais, 0);
    caso("Bloco B: as duas linhas comparadas com segurança, nenhuma sem correspondência, nenhuma não comparável",
      { comparadosComSeguranca: relB3.resumo.comparadosComSeguranca, semCorrespondencia: relB3.resumo.semCorrespondencia, naoComparaveis: relB3.resumo.naoComparaveisPorPerdaDeContexto },
      { comparadosComSeguranca: 2, semCorrespondencia: 0, naoComparaveis: 0 });

    // Mesmo indicador em dois subgrupos diferentes do Bloco D não pode colidir.
    var canonicoD = canonicoFake([
      { bloco: "D - MANUTENÇÃO PREDIAL - GERÊNCIA DE OBRAS - TGO", subgrupo: "Quantidades", subgrupoOcorrencia: 1, criterio: null, indicadorBruto: "Item Repetido", periodo: "2025-05", valor: 7 },
      { bloco: "D - MANUTENÇÃO PREDIAL - GERÊNCIA DE OBRAS - TGO", subgrupo: "Outro Subgrupo Hipotético", subgrupoOcorrencia: 1, criterio: null, indicadorBruto: "Item Repetido", periodo: "2025-05", valor: 99 }
    ]);
    var relD = HARNESS_DTE.comparar(canonicoD, [
      linhaBaseVertical("D - MANUTENÇÃO PREDIAL - GERÊNCIA DE OBRAS - TGO", "Quantidades", "Item Repetido", 7),
      linhaBaseVertical("D - MANUTENÇÃO PREDIAL - GERÊNCIA DE OBRAS - TGO", "Outro Subgrupo Hipotético", "Item Repetido", 99)
    ]);
    caso("Bloco D: mesmo indicador em 2 subgrupos hipotéticos — as duas linhas casam corretamente, zero divergência real", relD.resumo.divergenciasNumericasReais, 0);
    caso("Bloco D: as duas comparadas com segurança", relD.resumo.comparadosComSeguranca, 2);

    // Bloco C continua usando a chave SEM subgrupo (exceção deliberada e documentada).
    var canonicoC = canonicoFake([
      { bloco: "C - MANUTENÇÃO FROTA PRÓPRIA", subgrupo: "", subgrupoOcorrencia: 1, criterio: null, indicadorBruto: "Item Único C", periodo: "2025-05", valor: 15 }
    ]);
    var relC = HARNESS_DTE.comparar(canonicoC, [linhaBaseVertical("C - MANUTENÇÃO FROTA PRÓPRIA", "Qualquer Rótulo De Subgrupo Que A Base Vertical Tenha Registrado (não confiável)", "Item Único C", 15)]);
    caso("Bloco C: casa mesmo com rótulo de subgrupo divergente na base vertical (exceção deliberada)", relC.resumo.divergenciasNumericasReais, 0);
    caso("Bloco C: comparado com segurança apesar do subgrupo divergente", relC.resumo.comparadosComSeguranca, 1);

    grupo("Fase 5 · Harness — não comparável por perda de contexto (subgrupoOcorrência/critério que a base vertical não distingue)");
    // Mesmo indicador em DUAS OCORRÊNCIAS do mesmo subgrupo (base vertical não tem campo de ocorrência) — não pode virar divergência real.
    var canonicoOcorrencias = canonicoFake([
      { bloco: "B - MONITORAMENTO FROTA CONTRATADA", subgrupo: "Horas Utilizadas / Horas Estimadas (h)", subgrupoOcorrencia: 2, criterio: null, indicadorBruto: "P16A - Trator de Praia - h/mês", periodo: "2025-05", valor: 0.563 },
      { bloco: "B - MONITORAMENTO FROTA CONTRATADA", subgrupo: "Horas Utilizadas / Horas Estimadas (h)", subgrupoOcorrencia: 3, criterio: null, indicadorBruto: "P16A - Trator de Praia - h/mês", periodo: "2025-05", valor: 0.467 }
    ]);
    var relOcorrencias = HARNESS_DTE.comparar(canonicoOcorrencias, [linhaBaseVertical("B - MONITORAMENTO FROTA CONTRATADA", "Horas Utilizadas / Horas Estimadas (h)", "P16A - Trator de Praia - h/mês", 0.563)]);
    caso("Duas ocorrências do mesmo subgrupo, mesmo indicador, valores diferentes: classificado como NÃO COMPARÁVEL (nunca divergência real)", relOcorrencias.resumo.naoComparaveisPorPerdaDeContexto, 1);
    caso("Zero divergências reais mesmo quando um dos candidatos bate por coincidência com o valor da base vertical", relOcorrencias.resumo.divergenciasNumericasReais, 0);
    caso("Motivo registrado explica a limitação estrutural da base vertical", relOcorrencias.naoComparaveisPorPerdaDeContexto[0].motivo.indexOf("subgrupoOcorrência") !== -1, true);
    caso("Candidatos canônicos preservados no relatório para rastreabilidade", relOcorrencias.naoComparaveisPorPerdaDeContexto[0].candidatosCanonicos.length, 2);

    grupo("Fase 5 · Harness — rotulagem correta (indicador ≠ subgrupo) e demais categorias");
    var relRotulagem = HARNESS_DTE.comparar(canonicoB, [linhaBaseVertical("B - MONITORAMENTO FROTA CONTRATADA", "Subgrupo Um", "Indicador Repetido", 999)]);
    caso("Relatório expõe bloco, subgrupo e indicador em campos SEPARADOS (nunca subgrupo como se fosse indicador)",
      { bloco: relRotulagem.divergenciasNumericasReais[0].bloco, subgrupo: relRotulagem.divergenciasNumericasReais[0].subgrupo, indicador: relRotulagem.divergenciasNumericasReais[0].indicador },
      { bloco: "B - MONITORAMENTO FROTA CONTRATADA", subgrupo: "Subgrupo Um", indicador: "Indicador Repetido" });
    caso("Divergência numérica real ainda é detectada quando o casamento é único e o valor realmente diverge", relRotulagem.resumo.divergenciasNumericasReais, 1);

    // Null (canônico) vs zero (base vertical) continua classificado como esperada, nunca como divergência real.
    var canonicoNullZero = canonicoFake([
      { bloco: "C - MANUTENÇÃO FROTA PRÓPRIA", subgrupo: "", subgrupoOcorrencia: 1, criterio: null, indicadorBruto: "Item Ausente", periodo: "2025-05", valor: null }
    ]);
    var relNullZero = HARNESS_DTE.comparar(canonicoNullZero, [linhaBaseVertical("C - MANUTENÇÃO FROTA PRÓPRIA", "", "Item Ausente", 0)]);
    caso("null (canônico) × 0 (base vertical): divergência ESPERADA, nunca divergência real", { esperada: relNullZero.resumo.divergenciasEsperadasNullZero, real: relNullZero.resumo.divergenciasNumericasReais }, { esperada: 1, real: 0 });

    // Defasagem temporal não apaga divergência real.
    var canonicoDefasado = canonicoFake(
      [{ bloco: "C - MANUTENÇÃO FROTA PRÓPRIA", subgrupo: "", subgrupoOcorrencia: 1, criterio: null, indicadorBruto: "Item Defasado", periodo: "2025-05", valor: 42 }],
      "2026-08-01T00:00:00.000Z"
    );
    var relDefasado = HARNESS_DTE.comparar(canonicoDefasado, [linhaBaseVertical("C - MANUTENÇÃO FROTA PRÓPRIA", "", "Item Defasado", 50, "2026-07-13T00:00:00")]);
    caso("Defasagem temporal detectada e reportada (não escondida)", relDefasado.resumo.possivelDefasagemTemporal, true);
    caso("Defasagem temporal: dias de diferença calculados corretamente (2026-08-01 - 2026-07-13 = 19 dias)", relDefasado.resumo.defasagemDiasEntreCanonicoEBaseVertical, 19);
    caso("Defasagem temporal NÃO esconde a divergência real (valor 42 vs 50 continua contado)", relDefasado.resumo.divergenciasNumericasReais, 1);
  } else {
    grupo("Fase 5 · Harness — ausente");
    caso("engenharia-operacional/piloto/harness.js carregado", false, true);
  }


  if (FIXTURE_REAL) {
    grupo("Fase 5 · Execução completa — dados reais da aba geral (xlsx enviado nesta fase)");
    var resReal = await HUB.ingest.adapterDTE.carregarDTE({ fixtureTexto: FIXTURE_REAL });
    caso("Zero bloqueios contra os dados reais completos", resReal.bloqueios.length, 0);
    caso("Zero erros de validação", resReal.envelope.quality.erros.length, 0);
    caso("962 registros de indicador extraídos (queda de 1118→962 esperada: linhas associadas a Gerência Ofensora não são mais duplicadas como indicador comum)", resReal.indicadores.length, 962);
    caso("624 registros de gerência ofensora extraídos (alta de 546→624: consumo correto de todas as linhas associadas, não só a primeira)", resReal.gerenciasOfensoras.length, 624);
    caso("35 linhas de anotação identificadas e ignoradas", resReal.notas.length, 35);
    caso("13 períodos detectados (mai/25 a mai/26)", resReal.envelope.payload.periodos.length, 13);
    caso("Payload preserva bloco/subgrupo em cada indicador (nunca perde contexto, ao contrário da base vertical)",
      resReal.indicadores.every(function (r) { return typeof r.bloco === "string" && r.bloco !== ""; }), true);
    caso("Payload preserva bloco/subgrupo em cada gerência ofensora",
      resReal.gerenciasOfensoras.every(function (r) { return typeof r.bloco === "string" && r.bloco !== ""; }), true);
    var recebimentoMaiJun = resReal.indicadores.filter(function (r) { return r.indicadorBruto === "Recebimento - t" && (r.periodo === "2025-05" || r.periodo === "2025-06"); });
    caso("RCC Gericinó (Recebimento - t) sem operação em mai/jun-25: registro EXISTE (período preservado)", recebimentoMaiJun.length, 2);
    caso("RCC Gericinó (Recebimento - t) sem operação em mai/jun-25: valor é null, NUNCA 0 (célula vazia na fonte)",
      recebimentoMaiJun.every(function (r) { return r.valor === null; }), true);

    var chavesCompletas = {};
    resReal.indicadores.forEach(function (r) {
      var chave = r.bloco + "||" + r.subgrupo + "||" + r.subgrupoOcorrencia + "||" + r.criterioNormalizado + "||" + r.indicadorNormalizado + "||" + r.periodo;
      chavesCompletas[chave] = (chavesCompletas[chave] || 0) + 1;
    });
    var chavesDuplicadas = Object.keys(chavesCompletas).filter(function (k) { return chavesCompletas[k] > 1; });
    caso("Nenhuma chave completa (bloco+subgrupo+ocorrência+critério+indicador+período) duplicada contra os dados reais", chavesDuplicadas.length, 0);

    fs.writeFileSync(path.join(__dirname, "..", "engenharia-operacional", "piloto", "saida-canonica-exemplo.json"),
      JSON.stringify(resReal.envelope, null, 2));
  } else {
    grupo("Fase 5 · Execução completa — dados reais");
    caso("Fixture real presente em testes/fixtures/dte-geral-real.csv", false, true);
  }

  grupo("Fase 5 · Integração piloto — contrato index × harness");
  var indexPilotoPath = path.join(raiz, "engenharia-operacional/piloto/index.html");
  var indexPilotoTexto = fs.readFileSync(indexPilotoPath, "utf8");
  caso("index.html não referencia mais o campo removido relatorio.divergenciasReais",
    indexPilotoTexto.indexOf("relatorio.divergenciasReais") === -1, true);
  caso("index.html usa divergenciasNumericasReais do contrato vigente",
    indexPilotoTexto.indexOf("relatorio.divergenciasNumericasReais") !== -1, true);
  caso("index.html exibe não comparáveis por perda de contexto",
    indexPilotoTexto.indexOf("relatorio.naoComparaveisPorPerdaDeContexto") !== -1, true);
  caso("index.html exibe sem correspondência",
    indexPilotoTexto.indexOf("relatorio.semCorrespondencia") !== -1, true);
  caso("index.html exibe divergências esperadas null × zero",
    indexPilotoTexto.indexOf("relatorio.divergenciasEsperadasNullZero") !== -1, true);
  caso("index.html usa critério de aprovação baseado em divergências numéricas reais",
    indexPilotoTexto.indexOf("relatorio.resumo.divergenciasNumericasReais === 0") !== -1, true);

  /* ---------- RELATÓRIO ---------- */
  console.log("Raiz usada: " + raiz);
  console.log("Arquivos carregados nesta execução:");
  arquivosCarregados.forEach(function (p) { console.log("  " + p); });
  console.log("");
  grupos.forEach(function (g) {
    console.log("== " + g.nome + " ==");
    g.casos.forEach(function (c) {
      console.log("  [" + (c.ok ? "PASSOU" : "FALHOU") + "] " + c.nome +
        (c.ok ? "" : " | esperado=" + JSON.stringify(c.esperado) + " obtido=" + JSON.stringify(c.obtido)));
    });
  });
  console.log("\nGRUPOS TESTADOS: " + grupos.length);
  console.log("TOTAL: " + (totais.pass + totais.fail) + " casos | APROVADOS: " + totais.pass + " | REPROVADOS: " + totais.fail);
  console.log("Todos os casos acima são específicos da Fase 5. Para confirmar ausência de regressão na Fase 4, " +
    "rode separadamente: node testes/testar-fase4.js .");
  if (totais.fail > 0) process.exit(1);
}

rodar().catch(function (e) { console.error("FALHA NA SUÍTE:", e); process.exit(1); });
