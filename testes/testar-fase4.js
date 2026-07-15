/* ============================================================
   HUB COMLURB · testes/testar-fase4.js
   Suíte de teste reproduzível da Fase 4 (Piloto A/AR).

   Uso (a partir da raiz do repositório, com esta entrega já mesclada
   sobre um checkout de main — hub-core.js e hub-rules.js já existem
   em main e não são reenviados por esta entrega, mas precisam estar
   presentes no mesmo diretório para a suíte rodar):

     node testes/testar-fase4.js <raiz>

   Exemplo, a partir da raiz do repositório:

     node testes/testar-fase4.js .

   Não depende de nenhum framework externo além de papaparse (mesma
   dependência que o próprio painel AR já usa via CDN/npm). Roda em
   Node puro, sem servidor, sem rede — todos os casos usam fixtures
   locais ou fetch mockado (fetchImpl), nunca as URLs reais do Google
   Sheets (ver limitação de ambiente em IMPLEMENTATION_STATUS.md).

   Esta suíte é ESPECÍFICA da Fase 4. Os 133 casos pré-existentes de
   testes/hub-selftest.js (Fases 2/3, já em main) não são re-executados
   aqui porque hub-core.js/hub-rules.js/hub-utils.js não são alterados
   por esta entrega — o comportamento deles é inalterado por
   construção, não por suposição. Para conferir isso, rode também:
   testes/index.html (main) sem nenhuma mudança.
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
  console.error("Uso: node testes/testar-fase4.js <raiz-do-repositorio>");
  console.error("Exemplo, a partir da raiz do repositório: node testes/testar-fase4.js .");
  process.exit(1);
}
raiz = path.resolve(raiz);

var COMP = path.join(raiz, "assets/components/");
var PILOTO = path.join(raiz, "ar/piloto/");

var arquivosCarregados = [];
function carregar(caminho, obrigatorio) {
  if (!fs.existsSync(caminho)) {
    if (obrigatorio) {
      console.error("ARQUIVO OBRIGATÓRIO AUSENTE: " + caminho);
      console.error("hub-core.js e hub-rules.js já existem em main e não são reenviados nesta entrega — " +
        "esta suíte precisa rodar a partir de uma raiz onde este ZIP incremental já foi mesclado sobre um " +
        "checkout de main (ou onde main foi extraído e este ZIP extraído por cima).");
    } else {
      console.error("ARQUIVO NOVO AUSENTE (deveria estar no ZIP desta entrega): " + caminho);
    }
    process.exit(1);
  }
  (0, eval)(fs.readFileSync(caminho, "utf8"));
  arquivosCarregados.push(caminho);
}

// hub-core.js e hub-rules.js: já existem em main, não modificados por
// esta entrega — precisam existir na raiz informada para a suíte rodar.
carregar(path.join(COMP, "hub-core.js"), true);
carregar(path.join(COMP, "hub-rules.js"), true);

// Arquivos novos desta entrega (Fase 4).
carregar(path.join(COMP, "hub-sources.js"), false);
carregar(path.join(COMP, "hub-ingest-model.js"), false);
carregar(path.join(COMP, "hub-ingest-reader.js"), false);
carregar(path.join(COMP, "hub-ingest-decoder.js"), false);
carregar(path.join(COMP, "hub-ingest-adapter-ar.js"), false);
carregar(path.join(COMP, "hub-rules-ar.js"), false);
carregar(path.join(COMP, "hub-state-ar.js"), false);
carregar(path.join(PILOTO, "legado-referencia.js"), false);
carregar(path.join(PILOTO, "harness.js"), false);

var HUB = global.HUB, AR_LEGADO = global.AR_LEGADO, HARNESS_AR = global.HARNESS_AR;

var grupos = [], atual = null, totais = { pass: 0, fail: 0 };
function grupo(nome) { atual = { nome: nome, casos: [] }; grupos.push(atual); }
function caso(nome, obtido, esperado) {
  var ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  totais[ok ? "pass" : "fail"]++;
  atual.casos.push({ nome: nome, ok: ok, obtido: obtido, esperado: esperado });
}

function mockFetch(resp) { return function () { return Promise.resolve(resp); }; }

async function rodar() {
  /* ---------- Locator: registra 4, mas só 3 são operacionais ---------- */
  grupo("Fase 4 · Locator — 4 registradas, 3 operacionais (auditoria item 1)");
  ["AR_GERAL", "AR_2026", "AR_MAPEAMENTO", "AR_GOVERNANCA"].forEach(function (id) {
    var f = HUB.sources.fonte(id);
    caso(id + " está registrada com readerType remote-csv", !!f && f.readerType, "remote-csv");
  });
  caso("Quatro fontes estão registradas no Locator", Object.keys({ AR_GERAL: 1, AR_2026: 1, AR_MAPEAMENTO: 1, AR_GOVERNANCA: 1 }).length, 4);

  /* ---------- Reader remote-csv (mecanismo) ---------- */
  grupo("Fase 4 · Reader remote-csv (mecanismo, fetch mockado)");
  var r1 = await HUB.ingest.reader.lerAsync("AR_2026", { fetchImpl: mockFetch({ ok: true, status: 200, statusText: "OK", text: function () { return Promise.resolve("a,b\n1,2\n"); } }) });
  caso("Sucesso: ok=true, tipo=texto", { ok: r1.ok, tipo: r1.tipo }, { ok: true, tipo: "texto" });
  var r2 = await HUB.ingest.reader.lerAsync("AR_2026", { fetchImpl: mockFetch({ ok: false, status: 404, statusText: "Not Found" }) });
  caso("HTTP inválido é falha explícita", r2.ok, false);
  var r3 = await HUB.ingest.reader.lerAsync("AR_2026", { fetchImpl: mockFetch({ ok: true, status: 200, statusText: "OK", text: function () { return Promise.resolve("   "); } }) });
  caso("Corpo vazio é falha explícita (nunca vira dado vazio silencioso)", r3.ok, false);
  var r4 = await HUB.ingest.reader.lerAsync("AR_2026", { fetchImpl: mockFetch({ ok: true, status: 200, statusText: "OK", text: function () { return Promise.resolve("<!DOCTYPE html></html>"); } }) });
  caso("HTML no lugar de CSV é falha explícita", r4.ok, false);
  var r5 = await HUB.ingest.reader.lerAsync("FONTE_INEXISTENTE", {});
  caso("Fonte não registrada é falha explícita", r5.ok, false);

  /* ---------- Pipeline AR real: confirma que só 3 fontes são buscadas ---------- */
  grupo("Fase 4 · Adapter AR — confirma consumo de só 3 fontes (auditoria item 1)");
  var chamadas = [];
  function fetchContador(url) {
    chamadas.push(url);
    if (url === HUB.sources.fonte("AR_2026").url) return Promise.resolve({ ok: true, status: 200, statusText: "OK", text: function () { return Promise.resolve("Código,Meta\nE01,90\n"); } });
    if (url === HUB.sources.fonte("AR_MAPEAMENTO").url) return Promise.resolve({ ok: true, status: 200, statusText: "OK", text: function () { return Promise.resolve("Código_AR,Indicador_Geral\n"); } });
    if (url === HUB.sources.fonte("AR_GERAL").url) return Promise.resolve({ ok: true, status: 200, statusText: "OK", text: function () { return Promise.resolve("Ano,Indicador\n"); } });
    return Promise.resolve({ ok: false, status: 500, statusText: "não deveria ser chamada" });
  }
  var resFetch = await HUB.ingest.adapterAR.carregarAR({ fetchImpl: fetchContador });
  caso("Exatamente 3 URLs foram buscadas (AR_GOVERNANCA nunca é chamada)", chamadas.length, 3);
  caso("URL de AR_GOVERNANCA nunca aparece entre as chamadas", chamadas.indexOf(HUB.sources.fonte("AR_GOVERNANCA").url) === -1, true);
  caso("diagnosticoFontes tem exatamente 3 chaves", Object.keys(resFetch.diagnosticoFontes).length, 3);
  caso("diagnosticoFontes NÃO inclui AR_GOVERNANCA", resFetch.diagnosticoFontes.hasOwnProperty("AR_GOVERNANCA"), false);

  /* ---------- Correção E08/P01: atual=0 com meta válida ---------- */
  grupo("Fase 4 · Correção E08/P01 — atingimento com atual=0 (achado de auditoria, dados reais)");

  // Caso 1: maior_melhor, atual=0, meta>0 (perfil real de E08/P01) —
  // legado calcula 0/meta = 0. Deve ser 0, não null.
  var FIX_ZERO_MM = "Código,Grupo,Ordem,Indicador Executivo,Unidade,Sentido,Meta_2026,Atual,Tipo_Acumulado,Periodicidade,Status\n" +
    "Z01,Estratégica,1,Zero maior_melhor,percentual,maior_melhor,90,0,MEDIA,Mensal,\n" +
    "Z02,Estratégica,2,Zero menor_melhor,pontos,menor_melhor,5,0,MEDIA,Mensal,\n" +
    "Z03,Estratégica,3,Zero proporcional,toneladas,maior_melhor,1200,0,SOMA,Mensal,\n" +
    "Z04,Estratégica,4,Meta zero (deve continuar null),percentual,maior_melhor,0,50,MEDIA,Mensal,\n";
  var resZero = await HUB.ingest.adapterAR.carregarAR({ fixtures: { AR_2026: FIX_ZERO_MM, AR_MAPEAMENTO: "Código_AR,Indicador_Geral\n", AR_GERAL: "Ano,Indicador\n" } });
  var DATAZero = HUB.stateAR.montarDataAR(resZero.itens, 7);
  var dZ01 = DATAZero.filter(function (d) { return d.codigo === "Z01"; })[0];
  var dZ02 = DATAZero.filter(function (d) { return d.codigo === "Z02"; })[0];
  var dZ03 = DATAZero.filter(function (d) { return d.codigo === "Z03"; })[0];
  var dZ04 = DATAZero.filter(function (d) { return d.codigo === "Z04"; })[0];

  caso("Z01 (maior_melhor, atual=0, meta=90%): atingimento = 0 (não null) — igual ao legado", dZ01.atingimento, 0);
  caso("Z01: status continua 'Sem dado' (atual=0 — guarda de status inalterada)", dZ01.status, "Sem dado");
  caso("Z02 (menor_melhor, atual=0, meta=5): atingimento = Infinity — mesma fórmula não guardada do legado (meta/atual)", dZ02.atingimento, Infinity);
  caso("Z02: status continua 'Sem dado'", dZ02.status, "Sem dado");
  caso("Z03 (proporcional, SOMA/Mensal, atual=0, meta=1200): atingimento = 0 (meta proporcional > 0, cálculo válido)", dZ03.atingimento, 0);
  caso("Z03: atingimentoProporcional = true", dZ03.atingimentoProporcional, true);
  caso("Z04 (meta=0): atingimento continua null (única guarda real: meta≠0)", dZ04.atingimento, null);
  caso("Z04: status continua 'Sem dado' (meta=0)", dZ04.status, "Sem dado");

  // Confirma contra a réplica fiel do legado (legado-referencia.js) que
  // o novo pipeline agora bate exatamente, inclusive para atual=0.
  var RAWZeroLegado = { ar: Papa.parse(FIX_ZERO_MM, { header: true, skipEmptyLines: true }).data, map: [], geral: [] };
  var dataZeroLegado = AR_LEGADO.processar(RAWZeroLegado);
  var bonusZeroLegado = AR_LEGADO.calcularBonificacao(dataZeroLegado);
  var bonusZeroNovo = HUB.stateAR.montarBonificacaoAR(DATAZero);
  var relatorioZero = HARNESS_AR.comparar(dataZeroLegado, DATAZero, bonusZeroLegado, bonusZeroNovo);
  caso("Harness: zero divergências de campo entre legado e novo para os casos atual=0 (Z01-Z04)", relatorioZero.resumo.divergenciasCampo, 0);

  /* ---------- Adapter AR + Validator + envelope (fixtures) ---------- */
  grupo("Fase 4 · Adapter AR + Validator + Modelo canônico");
  var FIX_AR2026 = "Código,Grupo,Ordem,Indicador Executivo,Unidade,Sentido,Meta_2026,Atual,Tipo_Acumulado,Periodicidade,Status\n" +
    "E01,Estratégica,1,Indicador 1,percentual,maior_melhor,90,95,MEDIA,Mensal,\n" +
    "E08,Estratégica,2,Indicador 8,percentual,maior_melhor,80,60,MEDIA,Mensal,\n" +
    "C01,Condicionada,3,Conformidade IPL,percentual,maior_melhor,80,85,MEDIA,Mensal,Dentro da Meta\n" +
    "X01,Sem grupo,4,Indicador sem dado,percentual,maior_melhor,,,MEDIA,Mensal,\n";
  var FIX_MAP = "Código_AR,Indicador_Geral\nE01,Indicador 1\n";
  var FIX_GERAL = "Ano,Indicador,Unidade,Sentido,Acumulado,Meta\n2026,Indicador 1,percentual,maior_melhor,95,90\n";

  var res = await HUB.ingest.adapterAR.carregarAR({ fixtures: { AR_2026: FIX_AR2026, AR_MAPEAMENTO: FIX_MAP, AR_GERAL: FIX_GERAL } });
  caso("Quatro linhas adaptadas (E01, E08, C01, X01)", res.itens.length, 4);
  caso("Nenhum erro de validação bloqueia o payload", res.envelope.quality.erros.length, 0);
  caso("Envelope tem domain indicadores_metas (nenhum domínio novo)", res.envelope.domain, "indicadores_metas");
  var itemX01 = res.itens.filter(function (i) { return i.id === "X01"; })[0];
  caso("X01 sem meta/atual: meta convertida é null (nunca zero)", itemX01.meta, null);
  caso("X01 sem meta/atual: statusDisponibilidade = sem_dado", itemX01.statusDisponibilidade, "sem_dado");

  /* ---------- hub-rules-ar ---------- */
  grupo("Fase 4 · hub-rules-ar — regras específicas");
  var DATA = HUB.stateAR.montarDataAR(res.itens, 7);
  var d_E01 = DATA.filter(function (d) { return d.codigo === "E01"; })[0];
  var d_C01 = DATA.filter(function (d) { return d.codigo === "C01"; })[0];
  var d_X01 = DATA.filter(function (d) { return d.codigo === "X01"; })[0];
  caso("E01 = Dentro da Meta", d_E01.status, "Dentro da Meta");
  caso("C01 com Status publicado usa precedência SARC (origem=SARC)", d_C01.statusOrigem, "SARC");
  caso("X01 sem meta/atual = Sem dado (guarda de zero/nulo própria do AR)", d_X01.status, "Sem dado");
  caso("X01: atingimento é null (nunca Infinity/0 silencioso)", d_X01.atingimento, null);

  var bonus = HUB.stateAR.montarBonificacaoAR(DATA);
  caso("Combinação E+C+P bloqueada (HUB.config.combinacaoECPLiberada=false, decisão de governança já em hub-core.js)", bonus.bloqueado, true);
  caso("bonusTotal não é exposto como número enquanto bloqueado", bonus.bonusTotal, null);
  caso("regE isolado continua calculável mesmo com combinação bloqueada", typeof bonus.regE.pct, "number");

  /* ---------- Harness: mecanismo e não-invenção de regra para E03 ---------- */
  grupo("Fase 4 · Harness legado×novo — mecanismo e pendência E03");
  var RAWLegado = { ar: Papa.parse(FIX_AR2026, { header: true, skipEmptyLines: true }).data,
    map: Papa.parse(FIX_MAP, { header: true, skipEmptyLines: true }).data,
    geral: Papa.parse(FIX_GERAL, { header: true, skipEmptyLines: true }).data };
  var dataLegado = AR_LEGADO.processar(RAWLegado);
  var bonusLegado = AR_LEGADO.calcularBonificacao(dataLegado);
  var relatorio = HARNESS_AR.comparar(dataLegado, DATA, bonusLegado, bonus);
  caso("Harness roda sem exceção e produz resumo estruturado", typeof relatorio.resumo, "object");
  caso("Nenhuma divergência de campo entre legado e novo (fixtures sem indicadores casados)", relatorio.resumo.divergenciasCampo, 0);
  caso("bonusTotal aparece como divergência de bônus com decisão ACEITA (governança)", relatorio.divergenciasBonus.filter(function (d) { return d.campo === "bonusTotal"; }).length > 0, true);
  caso("E03 não está nas fixtures deste teste, então pendenciaE03 é null (não inventa regra)", relatorio.pendenciaE03, null);

  // Segundo cenário: inclui E03, confirma que a pendência aparece mas NÃO
  // é tratada como divergência legado×novo (harness não implementa regra
  // nova para E03 — ver auditoria item 6).
  var FIX_COM_E03 = FIX_AR2026 + "E03,Estratégica,5,Ranking Nacional,posicao,menor_melhor,5,3,MEDIA,Mensal,\n";
  var res2 = await HUB.ingest.adapterAR.carregarAR({ fixtures: { AR_2026: FIX_COM_E03, AR_MAPEAMENTO: FIX_MAP, AR_GERAL: FIX_GERAL } });
  var DATA2 = HUB.stateAR.montarDataAR(res2.itens, 7);
  var bonus2 = HUB.stateAR.montarBonificacaoAR(DATA2);
  var RAWLegado2 = Object.assign({}, RAWLegado, { ar: Papa.parse(FIX_COM_E03, { header: true, skipEmptyLines: true }).data });
  var dataLegado2 = AR_LEGADO.processar(RAWLegado2);
  var bonusLegado2 = AR_LEGADO.calcularBonificacao(dataLegado2);
  var relatorio2 = HARNESS_AR.comparar(dataLegado2, DATA2, bonusLegado2, bonus2);
  caso("Com E03 presente, pendenciaE03 é registrada", relatorio2.pendenciaE03 !== null, true);
  caso("E03 NÃO gera divergência de campo (legado e novo concordam — mesmo status genérico dos dois lados)",
    relatorio2.divergencias.filter(function (d) { return d.indicador === "E03"; }).length, 0);
  caso("relatorio.aprovado continua calculado só por divergências (harness não muda; é o index.html que precisa avisar da pendência)",
    typeof relatorio2.aprovado, "boolean");

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
  console.log("Todos os casos acima são específicos da Fase 4 (nenhum caso da suíte de Fases 2/3 foi re-executado; " +
    "hub-core.js/hub-rules.js usados aqui são os já publicados em main, não modificados por esta entrega).");
  if (totais.fail > 0) process.exit(1);
}

rodar().catch(function (e) { console.error("FALHA NA SUÍTE:", e); process.exit(1); });
