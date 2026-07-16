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

  /* ---------- Execução completa contra os dados reais enviados nesta fase ---------- */
  if (FIXTURE_REAL) {
    grupo("Fase 5 · Execução completa — dados reais da aba geral (xlsx enviado nesta fase)");
    var resReal = await HUB.ingest.adapterDTE.carregarDTE({ fixtureTexto: FIXTURE_REAL });
    caso("Zero bloqueios contra os dados reais completos", resReal.bloqueios.length, 0);
    caso("Zero erros de validação", resReal.envelope.quality.erros.length, 0);
    caso("1118 registros de indicador extraídos", resReal.indicadores.length, 1118);
    caso("546 registros de gerência ofensora extraídos (união de par)", resReal.gerenciasOfensoras.length, 546);
    caso("35 linhas de anotação identificadas e ignoradas (não viram indicador nem subgrupo)", resReal.notas.length, 35);
    caso("13 períodos detectados (mai/25 a mai/26)", resReal.envelope.payload.periodos.length, 13);
    caso("Payload preserva bloco/subgrupo em cada indicador (nunca perde contexto, ao contrário da base vertical)",
      resReal.indicadores.every(function (r) { return typeof r.bloco === "string" && r.bloco !== ""; }), true);
    caso("Payload preserva bloco/subgrupo em cada gerência ofensora",
      resReal.gerenciasOfensoras.every(function (r) { return typeof r.bloco === "string" && r.bloco !== ""; }), true);
    var recebimentoMaiJun = resReal.indicadores.filter(function (r) { return r.indicadorBruto === "Recebimento - t" && (r.periodo === "2025-05" || r.periodo === "2025-06"); });
    caso("RCC Gericinó (Recebimento - t) sem operação em mai/jun-25: registro EXISTE (período preservado)", recebimentoMaiJun.length, 2);
    caso("RCC Gericinó (Recebimento - t) sem operação em mai/jun-25: valor é null, NUNCA 0 (célula vazia na fonte)",
      recebimentoMaiJun.every(function (r) { return r.valor === null; }), true);

    fs.writeFileSync(path.join(__dirname, "..", "engenharia-operacional", "piloto", "saida-canonica-exemplo.json"),
      JSON.stringify(resReal.envelope, null, 2));
  } else {
    grupo("Fase 5 · Execução completa — dados reais");
    caso("Fixture real presente em testes/fixtures/dte-geral-real.csv", false, true);
  }

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
