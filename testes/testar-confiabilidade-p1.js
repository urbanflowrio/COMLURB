/* ============================================================
   HUB COMLURB · testes/testar-confiabilidade-p1.js
   Pacote de confiabilidade 1 (outubro/2026).

   Uso (a partir da raiz do repositório):

     node testes/testar-confiabilidade-p1.js .

   Protege os módulos oficiais que a regressão anterior não cobria
   e as quatro correções do pacote:

   1. rótulos que a Engenharia lê do Relatório Mensal DTE existem na
      fixture real (o erro "ECOPOINTOS" teria sido detectado aqui);
   2. data-cutoff.json de Chamados 1746 e Ouvidoria é válido e coerente
      com o cubo publicado na mesma pasta;
   3. as duas páginas exibem competência e corte a partir desse arquivo;
   4. avaliação de defasagem do motor de snapshot;
   5. scripts embutidos de todos os módulos oficiais compilam.

   Somente leitura: não escreve em disco e não acessa rede.
   ============================================================ */
"use strict";

var fs = require("fs");
var path = require("path");
var vm = require("vm");

var raiz = process.argv[2];
if (!raiz) {
  console.error("Uso: node testes/testar-confiabilidade-p1.js <raiz-do-repositorio>");
  process.exit(1);
}
raiz = path.resolve(raiz);

var grupos = [], atual = null, totais = { pass: 0, fail: 0 };
function grupo(nome) { atual = { nome: nome, casos: [] }; grupos.push(atual); }
function caso(nome, obtido, esperado) {
  var ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  atual.casos.push({ nome: nome, ok: ok, obtido: obtido, esperado: esperado });
  totais[ok ? "pass" : "fail"]++;
}
function verdadeiro(nome, cond, detalhe) {
  atual.casos.push({ nome: nome, ok: !!cond, obtido: detalhe === undefined ? !!cond : detalhe, esperado: true });
  totais[cond ? "pass" : "fail"]++;
}
function ler(rel) { return fs.readFileSync(path.join(raiz, rel), "utf8"); }
function existe(rel) { return fs.existsSync(path.join(raiz, rel)); }
function norm(s) { return String(s == null ? "" : s).normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().trim(); }
function parseCSV(text) {
  var rows = [], row = [], cell = "", q = false;
  for (var i = 0; i < text.length; i++) {
    var c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else if (c !== "\r") cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
function carregarGlobal(rel, nome) {
  var ctx = { window: {} };
  vm.runInNewContext(ler(rel), ctx, { filename: rel });
  return ctx.window[nome];
}

/* ---------- 1 · Engenharia × fixture real do relatório DTE ---------- */
grupo("Engenharia · rótulos lidos do Relatório Mensal DTE existem na fixture real");
(function () {
  var html = ler("engenharia-operacional/index.html");
  var linhas = parseCSV(ler("testes/fixtures/dte-geral-real.csv"));
  var re = /(?:relatorioSerie|execRelatorioMap)\(\s*[^,]+,\s*"([^"]+)"/g, m, rotulos = {};
  while ((m = re.exec(html))) rotulos[m[1]] = true;
  var lista = Object.keys(rotulos);
  verdadeiro("O painel declara rótulos lidos do relatório DTE", lista.length > 0, lista.length);
  lista.forEach(function (rotulo) {
    var alvo = norm(rotulo);
    var achou = linhas.some(function (l) { return l.slice(0, 3).some(function (c) { return norm(c) && norm(c).indexOf(alvo) >= 0; }); });
    verdadeiro("Rótulo encontrado na fixture: " + rotulo, achou);
  });
})();

/* ---------- 2 · data-cutoff.json × cubo ---------- */
var MESES_PT = ["JANEIRO", "FEVEREIRO", "MARCO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];
[
  { pasta: "chamados-1746", cubo: "chamados_cube.js", global: "CHAMADOS_CUBE" },
  { pasta: "ouvidoria", cubo: "ouvidoria_cube.js", global: "OUVIDORIA_CUBE" }
].forEach(function (mod) {
  grupo(mod.pasta + " · data-cutoff.json válido e coerente com o cubo");
  var corte;
  try { corte = JSON.parse(ler(mod.pasta + "/data-cutoff.json")); } catch (e) { verdadeiro("data-cutoff.json é JSON válido", false, String(e.message)); return; }
  verdadeiro("data-cutoff.json é JSON válido", true);
  caso("Campo modulo corresponde à pasta", corte.modulo, mod.pasta);
  caso("Fonte analítica declarada é o cubo da pasta", corte.fonte_analitica, mod.cubo);
  var mc = /^(\d{4})-(\d{2})$/.exec(corte.competencia_mais_recente || "");
  verdadeiro("competencia_mais_recente no formato AAAA-MM", !!mc, corte.competencia_mais_recente);
  var md = /^(\d{4})-(\d{2})-(\d{2})$/.exec(corte.data_corte || "");
  verdadeiro("data_corte no formato AAAA-MM-DD", !!md, corte.data_corte);
  var mh = /^(\d{4})-(\d{2})$/.exec(corte.historico_congelado_ate || "");
  verdadeiro("historico_congelado_ate no formato AAAA-MM", !!mh, corte.historico_congelado_ate);
  if (!mc || !md) return;
  var fimCompetencia = new Date(Date.UTC(+mc[1], +mc[2], 0));
  var dataCorte = new Date(Date.UTC(+md[1], +md[2] - 1, +md[3]));
  verdadeiro("Data de corte é posterior ao fim da competência", dataCorte > fimCompetencia, corte.data_corte);
  if (mh) verdadeiro("Histórico congelado termina antes da competência mais recente", (+mh[1] * 12 + +mh[2]) < (+mc[1] * 12 + +mc[2]), corte.historico_congelado_ate);

  var cubo = carregarGlobal(mod.pasta + "/" + mod.cubo, mod.global);
  verdadeiro("Cubo carregado", !!(cubo && cubo.periods && cubo.periods.acumulado));
  if (!cubo || !cubo.periods || !cubo.periods.acumulado) return;
  var mensal = cubo.periods.acumulado.all.mensal || [];
  var ultimoMes = mensal.length ? norm(mensal[mensal.length - 1].mes) : "";
  caso("Último mês do cubo corresponde à competência do corte", ultimoMes, MESES_PT[+mc[2] - 1]);
  var periodoMensal = Object.keys(cubo.periods).filter(function (k) { return k !== "acumulado"; });
  caso("Recorte mensal do cubo corresponde à competência do corte", periodoMensal.map(norm), [MESES_PT[+mc[2] - 1]]);
  var soma = mensal.reduce(function (s, x) { return s + x.v2026; }, 0);
  caso("Total acumulado 2026 igual à soma da série mensal", cubo.periods.acumulado.all.total2026, soma);
});

/* ---------- 3 · exibição do corte nas páginas ---------- */
["chamados-1746/index.html", "ouvidoria/index.html"].forEach(function (rel) {
  grupo(rel + " · competência e corte exibidos a partir de data-cutoff.json");
  var h = ler(rel);
  verdadeiro("Elemento dataCutoff presente e oculto por padrão", /<div class="sub" id="dataCutoff" hidden><\/div>/.test(h));
  verdadeiro("Página lê data-cutoff.json", /fetch\('data-cutoff\.json'/.test(h));
  verdadeiro("carregarCorte é chamada na inicialização", /HUB\.footer\.render\('footer'\);\s*carregarCorte\(\);/.test(h));
  verdadeiro("Nenhuma data de corte fixa no HTML", !/corte em \d{2}\/\d{2}\/\d{4}/i.test(h));
});

/* ---------- 4 · defasagem no motor de snapshot ---------- */
grupo("Snapshot · avaliação de defasagem da fonte");
(function () {
  var core = require(path.join(raiz, "snapshot/lib/snapshot-core.js"));
  verdadeiro("avaliarDefasagem exportada", typeof core.avaliarDefasagem === "function");
  if (typeof core.avaliarDefasagem !== "function") return;
  var hoje = "2026-10-13T12:00:00Z";
  var a = core.avaliarDefasagem("2025-05..2026-05", hoje);
  caso("Janela terminando em mai/2026, executada em out/2026: 4 competências fechadas sem dado", a.competenciasFechadasSemDado, 4);
  caso("… e é defasada", a.defasada, true);
  caso("Competência do mês anterior está em dia", core.avaliarDefasagem("2026-09", hoje).competenciasFechadasSemDado, 0);
  caso("Uma competência de atraso fica dentro do limite", core.avaliarDefasagem("2026-08", hoje).defasada, false);
  caso("Duas competências de atraso atingem o limite", core.avaliarDefasagem("2026-07", hoje).defasada, true);
  caso("Virada de ano: nov/2026 executada em jan/2027", core.avaliarDefasagem("2026-11", "2027-01-05T00:00:00Z").competenciasFechadasSemDado, 1);
  caso("Período anual não é avaliado como mensal", core.avaliarDefasagem("2026", hoje).avaliavel, false);
  caso("Período vazio não é avaliado", core.avaliarDefasagem("", hoje).avaliavel, false);
  caso("Limite configurado", core.LIMITE_COMPETENCIAS_DEFASAGEM, 2);
  var rel = core.montarRelatorio({ moduloId: "x", status: "sem_mudanca", horario: hoje, diferencaSnapshotAnterior: "-", proximoPassoRecomendado: "-", defasagem: a });
  verdadeiro("Relatório traz a linha de defasagem", /Defasagem da fonte:\*\* 4 competência\(s\) fechada\(s\) sem dado após 05\/2026 — FONTE DEFASADA/.test(rel));
  var relSem = core.montarRelatorio({ moduloId: "x", status: "sem_mudanca", horario: hoje, diferencaSnapshotAnterior: "-", proximoPassoRecomendado: "-" });
  verdadeiro("Relatório sem avaliação não inventa linha de defasagem", !/Defasagem da fonte/.test(relSem));
})();

/* ---------- 5 · scripts embutidos dos módulos oficiais ---------- */
grupo("Módulos oficiais · scripts embutidos compilam");
(function () {
  var cat = ler("MODULE_CATALOG.md"), re = /^\|\s*([^|]+?)\s*\|\s*`([^`]+)`\s*\|\s*Oficial\s*\|/gm, m, n = 0;
  while ((m = re.exec(cat))) {
    var rel = m[2] + "index.html";
    if (!existe(rel)) { verdadeiro("index.html presente: " + rel, false); continue; }
    var h = ler(rel), r2 = /<script(?![^>]*\bsrc=)(?![^>]*type="(?:module|application\/(?:ld\+)?json)")[^>]*>([\s\S]*?)<\/script>/g, s, k = 0, erro = null;
    while ((s = r2.exec(h))) { k++; try { new vm.Script(s[1], { filename: rel + "#script" + k }); } catch (e) { erro = e.message; } }
    verdadeiro(m[1] + ": " + k + " script(s) embutido(s) sem erro de sintaxe", !erro, erro || true);
    n++;
  }
  verdadeiro("Catálogo lista módulos oficiais", n > 0, n);
})();

/* ---------- resumo ---------- */
console.log("\n=== Confiabilidade P1 — resultado da suíte ===\n");
grupos.forEach(function (g) {
  console.log("== " + g.nome + " ==");
  g.casos.forEach(function (c) {
    console.log("  [" + (c.ok ? "PASSOU" : "FALHOU") + "] " + c.nome +
      (c.ok ? "" : " — esperado " + JSON.stringify(c.esperado) + ", obtido " + JSON.stringify(c.obtido)));
  });
});
console.log("\nGRUPOS TESTADOS: " + grupos.length);
console.log("TOTAL: " + (totais.pass + totais.fail) + " casos | APROVADOS: " + totais.pass + " | REPROVADOS: " + totais.fail);
if (totais.fail > 0) process.exit(1);
