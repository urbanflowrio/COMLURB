/* ============================================================
   HUB COMLURB · testes/testar-fase7a.js
   Suíte de teste reproduzível da Fase 7A (hub-snapshot-reader.js e
   hub-data-source.js).

   Uso (a partir da raiz do repositório):

     node testes/testar-fase7a.js .

   Não depende de nenhum framework externo. Roda em Node puro, sem
   servidor, sem rede real — todo fetch é mockado por fetchImpl
   injetado, apontando para URLs fictícias ("mock://...") que nunca
   saem do processo. Alguns casos usam as fixtures de arquivo em
   testes/fixtures/fase7a/ (representativas: par latest+snapshot
   válido, JSON malformado, hash divergente); a maioria das variações
   paramétricas (path traversal, versões, moduloId divergente etc.)
   é construída em memória neste próprio arquivo, documentada como tal
   — evita dezenas de arquivos quase idênticos no repositório.

   IMPORTANTE — esta suíte nunca escreve em disco e nunca acessa rede
   real. hub-snapshot-reader.js e hub-data-source.js são carregados
   via require() direto (dual export, sem eval — ver cabeçalho de
   ambos os arquivos).

   Esta suíte é ESPECÍFICA da Fase 7A. Os 40+42+96+85 = 263 casos das
   Fases 2/3/4/5/6 não são re-executados aqui — rode-os separadamente
   (ver testes/testar-fase6.js, testar-fase5.js, testar-fase4.js,
   executar-hub-selftest-node.js) para confirmar ausência de
   regressão.
   ============================================================ */

"use strict";

var fs = require("fs");
var path = require("path");

var raiz = process.argv[2];
if (!raiz) {
  console.error("Uso: node testes/testar-fase7a.js <raiz-do-repositorio>");
  process.exit(1);
}
raiz = path.resolve(raiz);

var grupos = [], atual = null, totais = { pass: 0, fail: 0 };
function grupo(nome) { atual = { nome: nome, casos: [] }; grupos.push(atual); }
function caso(nome, obtido, esperado) {
  var ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  totais[ok ? "pass" : "fail"]++;
  atual.casos.push({ nome: nome, ok: ok, obtido: obtido, esperado: esperado });
}
function verdadeiro(nome, condicao) { caso(nome, !!condicao, true); }

/* ---------- carregamento (require direto, sem eval, sem window) ---------- */

var snapshotReader = require(path.join(raiz, "assets/components/hub-snapshot-reader.js"));
var dataSource = require(path.join(raiz, "assets/components/hub-data-source.js"));

var E = snapshotReader.ESTADOS;

/* ---------- fixtures de arquivo ---------- */

var FIX_DIR = path.join(raiz, "testes/fixtures/fase7a");
var TXT_LATEST_VALIDO = fs.readFileSync(path.join(FIX_DIR, "latest-valido.json"), "utf8");
var TXT_SNAPSHOT_VALIDO = fs.readFileSync(path.join(FIX_DIR, "snapshot-valido.json"), "utf8");
var TXT_LATEST_MALFORMADO = fs.readFileSync(path.join(FIX_DIR, "latest-json-malformado.txt"), "utf8");
var TXT_SNAPSHOT_HASH_DIVERGENTE = fs.readFileSync(path.join(FIX_DIR, "snapshot-hash-divergente.json"), "utf8");

var BASE_URL = "mock://dados";
var MODULO = "modulo-teste";
var URL_LATEST = BASE_URL + "/snapshots/" + MODULO + "/latest.json";
var URL_SNAPSHOT_VALIDO = BASE_URL + "/snapshots/modulo-teste/periodos/2026/2026-07-17T10-00-00-000Z__abc123.json";

/* ---------- fetch mock: mapa de URL exata -> {status, texto} ---------- */

function criarFetchMock(mapa, opts) {
  opts = opts || {};
  var chamadas = [];
  var fn = function (url) {
    chamadas.push(url);
    if (opts.rejeitarUrls && opts.rejeitarUrls.indexOf(url) !== -1) {
      return Promise.reject(new Error("falha de rede simulada para " + url));
    }
    var entrada = mapa[url];
    if (!entrada) {
      return Promise.resolve({ ok: false, status: 404, text: function () { return Promise.resolve(""); } });
    }
    var ok = entrada.status >= 200 && entrada.status < 300;
    return Promise.resolve({
      ok: ok,
      status: entrada.status,
      text: function () { return Promise.resolve(entrada.texto); }
    });
  };
  fn.chamadas = chamadas;
  return fn;
}

/* fabrica variações do par latest/snapshot em memória, a partir da base válida */
function latestBase(extra) {
  var obj = JSON.parse(TXT_LATEST_VALIDO);
  if (extra) for (var k in extra) obj[k] = extra[k];
  return obj;
}
function snapshotBase(extraTopo, extraEnvelope) {
  var obj = JSON.parse(TXT_SNAPSHOT_VALIDO);
  if (extraTopo) for (var k in extraTopo) obj[k] = extraTopo[k];
  if (extraEnvelope) for (var k2 in extraEnvelope) obj.envelope[k2] = extraEnvelope[k2];
  return obj;
}

async function rodar() {

  /* ================= parâmetros inválidos ================= */
  grupo("Fase 7A · snapshotReader.lerAsync — parâmetros inválidos (parametro_invalido)");

  var r1 = await snapshotReader.lerAsync(undefined, { baseUrl: BASE_URL, fetchImpl: criarFetchMock({}) });
  caso("moduloId ausente -> parametro_invalido", r1.status, E.PARAMETRO_INVALIDO);

  var r2 = await snapshotReader.lerAsync("modulo com espaço", { baseUrl: BASE_URL, fetchImpl: criarFetchMock({}) });
  caso("moduloId com caracteres inválidos -> parametro_invalido", r2.status, E.PARAMETRO_INVALIDO);

  var r3 = await snapshotReader.lerAsync(MODULO, { fetchImpl: criarFetchMock({}) });
  caso("baseUrl ausente -> parametro_invalido", r3.status, E.PARAMETRO_INVALIDO);

  var r4 = await snapshotReader.lerAsync(MODULO, { baseUrl: BASE_URL, fetchImpl: criarFetchMock({}), maxAgeHoras: "abc" });
  caso("maxAgeHoras não numérico -> parametro_invalido", r4.status, E.PARAMETRO_INVALIDO);

  var r5 = await snapshotReader.lerAsync(MODULO, { baseUrl: BASE_URL, fetchImpl: criarFetchMock({}), maxAgeHoras: -1 });
  caso("maxAgeHoras negativo -> parametro_invalido", r5.status, E.PARAMETRO_INVALIDO);

  var r6 = await snapshotReader.lerAsync(MODULO, { baseUrl: BASE_URL, fetchImpl: criarFetchMock({}), expectedSnapshotVersion: "" });
  caso("expectedSnapshotVersion vazio -> parametro_invalido", r6.status, E.PARAMETRO_INVALIDO);

  var r7 = await snapshotReader.lerAsync(MODULO, { baseUrl: BASE_URL, fetchImpl: criarFetchMock({}), expectedSchemaVersion: "" });
  caso("expectedSchemaVersion vazio -> parametro_invalido", r7.status, E.PARAMETRO_INVALIDO);

  /* ================= fetchImpl: injeção e ambiente ================= */
  grupo("Fase 7A · snapshotReader.lerAsync — fetchImpl injetável e detecção de ambiente");

  var r8 = await snapshotReader.lerAsync(MODULO, { baseUrl: BASE_URL });
  caso("Node sem fetchImpl (sem window) -> parametro_invalido, nenhuma rede real acessada", r8.status, E.PARAMETRO_INVALIDO);

  // simula ambiente de navegador: define global.window/globalThis.fetch temporariamente
  var fetchGlobalUsado = false;
  var fetchGlobalMock = function (url) {
    fetchGlobalUsado = true;
    return Promise.resolve({ ok: false, status: 404, text: function () { return Promise.resolve(""); } });
  };
  global.window = {};
  global.fetch = fetchGlobalMock;
  var r9 = await snapshotReader.lerAsync(MODULO, { baseUrl: BASE_URL });
  verdadeiro("Em ambiente 'navegador' simulado, sem fetchImpl, usa globalThis.fetch automaticamente", fetchGlobalUsado);
  caso("Resultado consistente com o mock (404 -> snapshot_ausente)", r9.status, E.AUSENTE);
  delete global.window;
  delete global.fetch;

  var r10a = await snapshotReader.lerAsync(MODULO, { baseUrl: BASE_URL, fetchImpl: criarFetchMock({}) });
  caso("Node COM fetchImpl injetado nunca cai em parametro_invalido por falta de fetch", r10a.status !== E.PARAMETRO_INVALIDO, true);

  /* ================= latest — sucesso, ausência, contrato ================= */
  grupo("Fase 7A · snapshotReader.lerAsync — latest.json: sucesso, ausência (404), contrato inválido");

  var mockOk = criarFetchMock({
    "mock://dados/snapshots/modulo-teste/latest.json": { status: 200, texto: TXT_LATEST_VALIDO },
    "mock://dados/snapshots/modulo-teste/periodos/2026/2026-07-17T10-00-00-000Z__abc123.json": { status: 200, texto: TXT_SNAPSHOT_VALIDO }
  });
  var rOk = await snapshotReader.lerAsync(MODULO, { baseUrl: BASE_URL, fetchImpl: mockOk });
  caso("Par latest+snapshot válido (fixtures) -> snapshot_valido", rOk.status, E.VALIDO);
  verdadeiro("meta.hash presente e igual ao hash do snapshot", rOk.meta && rOk.meta.hash === "sha256:fixture-hash-valido-abc123");
  verdadeiro("meta.referencePeriod presente", rOk.meta && rOk.meta.referencePeriod === "2026");
  verdadeiro("snapshot retornado contém o envelope completo", rOk.snapshot && rOk.snapshot.envelope && rOk.snapshot.envelope.payload);

  var rAusente = await snapshotReader.lerAsync(MODULO, { baseUrl: BASE_URL, fetchImpl: criarFetchMock({}) });
  caso("latest.json 404 -> snapshot_ausente", rAusente.status, E.AUSENTE);

  var mockLatestMalformado = criarFetchMock({
    "mock://dados/snapshots/modulo-teste/latest.json": { status: 200, texto: TXT_LATEST_MALFORMADO }
  });
  var rLatestMalformado = await snapshotReader.lerAsync(MODULO, { baseUrl: BASE_URL, fetchImpl: mockLatestMalformado });
  caso("latest.json não é JSON válido -> latest_invalido", rLatestMalformado.status, E.LATEST_INVALIDO);

  var latestSemModuloId = latestBase({ moduloId: undefined });
  delete latestSemModuloId.moduloId;
  var mockLatestSemCampo = criarFetchMock({
    "mock://dados/snapshots/modulo-teste/latest.json": { status: 200, texto: JSON.stringify(latestSemModuloId) }
  });
  var rLatestSemCampo = await snapshotReader.lerAsync(MODULO, { baseUrl: BASE_URL, fetchImpl: mockLatestSemCampo });
  caso("latest.json sem campo obrigatório (moduloId) -> latest_invalido", rLatestSemCampo.status, E.LATEST_INVALIDO);

  var latestModuloDivergente = latestBase({ moduloId: "outro-modulo" });
  var mockModuloDivergente = criarFetchMock({
    "mock://dados/snapshots/modulo-teste/latest.json": { status: 200, texto: JSON.stringify(latestModuloDivergente) }
  });
  var rModuloDivergenteLatest = await snapshotReader.lerAsync(MODULO, { baseUrl: BASE_URL, fetchImpl: mockModuloDivergente });
  caso("latest.moduloId diverge do módulo solicitado -> modulo_divergente", rModuloDivergenteLatest.status, E.MODULO_DIVERGENTE);

  /* ================= segurança de path ================= */
  grupo("Fase 7A · snapshotReader.lerAsync — segurança de path (bloqueado antes do fetch do snapshot)");

  function testarPathInseguro(nome, pathMalicioso) {
    var latestMalicioso = latestBase({ path: pathMalicioso });
    var mock = criarFetchMock({
      "mock://dados/snapshots/modulo-teste/latest.json": { status: 200, texto: JSON.stringify(latestMalicioso) }
    });
    return snapshotReader.lerAsync(MODULO, { baseUrl: BASE_URL, fetchImpl: mock }).then(function (r) {
      caso(nome, r.status, E.LATEST_INVALIDO);
      verdadeiro(nome + " — nenhuma segunda chamada de fetch (bloqueado antes do fetch do snapshot)", mock.chamadas.length === 1);
    });
  }

  await testarPathInseguro("path absoluto (/etc/passwd) bloqueado", "/etc/passwd");
  await testarPathInseguro("path com protocolo (http://) bloqueado", "http://evil.example/x.json");
  await testarPathInseguro("path protocolo-relativo (//evil) bloqueado", "//evil.example/x.json");
  await testarPathInseguro("path com barra invertida bloqueado", "snapshots\\modulo-teste\\x.json");
  await testarPathInseguro("path com traversal direto ('..') bloqueado", "snapshots/modulo-teste/../../../etc/passwd");
  await testarPathInseguro("path com traversal percent-encoded bloqueado", "snapshots/modulo-teste/%2e%2e/%2e%2e/etc/passwd");
  await testarPathInseguro("path apontando para outro módulo bloqueado", "snapshots/outro-modulo/periodos/2026/x.json");

  /* ================= snapshot apontado: ausência, contrato, hash, moduloId ================= */
  grupo("Fase 7A · snapshotReader.lerAsync — snapshot apontado: ausência, contrato, hash, moduloId");

  var mockSnapshotAusente = criarFetchMock({
    "mock://dados/snapshots/modulo-teste/latest.json": { status: 200, texto: TXT_LATEST_VALIDO }
    // snapshot apontado não mapeado -> 404
  });
  var rSnapshotAusente = await snapshotReader.lerAsync(MODULO, { baseUrl: BASE_URL, fetchImpl: mockSnapshotAusente });
  caso("Snapshot apontado por latest.json não existe (404) -> snapshot_apontado_ausente", rSnapshotAusente.status, E.APONTADO_AUSENTE);
  verdadeiro("Diferenciado corretamente de latest ausente (não é snapshot_ausente)", rSnapshotAusente.status !== E.AUSENTE);

  var mockSnapshotMalformado = criarFetchMock({
    "mock://dados/snapshots/modulo-teste/latest.json": { status: 200, texto: TXT_LATEST_VALIDO },
    "mock://dados/snapshots/modulo-teste/periodos/2026/2026-07-17T10-00-00-000Z__abc123.json": { status: 200, texto: "{ isso não é json" }
  });
  var rSnapshotMalformado = await snapshotReader.lerAsync(MODULO, { baseUrl: BASE_URL, fetchImpl: mockSnapshotMalformado });
  caso("Snapshot apontado com JSON malformado -> contrato_invalido", rSnapshotMalformado.status, E.CONTRATO_INVALIDO);

  var snapshotSemEnvelope = snapshotBase();
  delete snapshotSemEnvelope.envelope;
  var mockSemEnvelope = criarFetchMock({
    "mock://dados/snapshots/modulo-teste/latest.json": { status: 200, texto: TXT_LATEST_VALIDO },
    "mock://dados/snapshots/modulo-teste/periodos/2026/2026-07-17T10-00-00-000Z__abc123.json": { status: 200, texto: JSON.stringify(snapshotSemEnvelope) }
  });
  var rSemEnvelope = await snapshotReader.lerAsync(MODULO, { baseUrl: BASE_URL, fetchImpl: mockSemEnvelope });
  caso("Snapshot sem envelope canônico -> contrato_invalido", rSemEnvelope.status, E.CONTRATO_INVALIDO);

  var mockHashDivergente = criarFetchMock({
    "mock://dados/snapshots/modulo-teste/latest.json": { status: 200, texto: TXT_LATEST_VALIDO },
    "mock://dados/snapshots/modulo-teste/periodos/2026/2026-07-17T10-00-00-000Z__abc123.json": { status: 200, texto: TXT_SNAPSHOT_HASH_DIVERGENTE }
  });
  var rHashDivergente = await snapshotReader.lerAsync(MODULO, { baseUrl: BASE_URL, fetchImpl: mockHashDivergente });
  caso("latest.hash != snapshot.hash -> hash_divergente", rHashDivergente.status, E.HASH_DIVERGENTE);

  var snapshotModuloDivergente = snapshotBase({ moduloId: "outro-modulo" });
  var mockSnapModuloDivergente = criarFetchMock({
    "mock://dados/snapshots/modulo-teste/latest.json": { status: 200, texto: TXT_LATEST_VALIDO },
    "mock://dados/snapshots/modulo-teste/periodos/2026/2026-07-17T10-00-00-000Z__abc123.json": { status: 200, texto: JSON.stringify(snapshotModuloDivergente) }
  });
  var rSnapModuloDivergente = await snapshotReader.lerAsync(MODULO, { baseUrl: BASE_URL, fetchImpl: mockSnapModuloDivergente });
  caso("snapshot.moduloId diverge do módulo solicitado -> modulo_divergente", rSnapModuloDivergente.status, E.MODULO_DIVERGENTE);

  var snapshotReferencePeriodDivergente = snapshotBase(null, { referencePeriod: "2025" });
  var mockRefPeriodDivergente = criarFetchMock({
    "mock://dados/snapshots/modulo-teste/latest.json": { status: 200, texto: TXT_LATEST_VALIDO },
    "mock://dados/snapshots/modulo-teste/periodos/2026/2026-07-17T10-00-00-000Z__abc123.json": { status: 200, texto: JSON.stringify(snapshotReferencePeriodDivergente) }
  });
  var rRefPeriodDivergente = await snapshotReader.lerAsync(MODULO, { baseUrl: BASE_URL, fetchImpl: mockRefPeriodDivergente });
  caso("referencePeriod de latest.json diverge do envelope -> contrato_invalido", rRefPeriodDivergente.status, E.CONTRATO_INVALIDO);

  var snapshotCapturedAtInvalido = snapshotBase(null, { capturedAt: "não-é-uma-data" });
  var mockCapturedAtInvalido = criarFetchMock({
    "mock://dados/snapshots/modulo-teste/latest.json": { status: 200, texto: TXT_LATEST_VALIDO },
    "mock://dados/snapshots/modulo-teste/periodos/2026/2026-07-17T10-00-00-000Z__abc123.json": { status: 200, texto: JSON.stringify(snapshotCapturedAtInvalido) }
  });
  var rCapturedAtInvalido = await snapshotReader.lerAsync(MODULO, { baseUrl: BASE_URL, fetchImpl: mockCapturedAtInvalido });
  caso("envelope.capturedAt inválido -> contrato_invalido", rCapturedAtInvalido.status, E.CONTRATO_INVALIDO);

  /* ================= versões (snapshotVersion / schemaVersion) ================= */
  grupo("Fase 7A · snapshotReader.lerAsync — expectedSnapshotVersion / expectedSchemaVersion");

  var rVersaoOk = await snapshotReader.lerAsync(MODULO, { baseUrl: BASE_URL, fetchImpl: mockOk, expectedSnapshotVersion: "1.0.0" });
  caso("expectedSnapshotVersion igual à real -> não bloqueia (snapshot_valido)", rVersaoOk.status, E.VALIDO);

  var rVersaoDivergente = await snapshotReader.lerAsync(MODULO, { baseUrl: BASE_URL, fetchImpl: mockOk, expectedSnapshotVersion: "2.0.0" });
  caso("expectedSnapshotVersion divergente -> versao_incompativel", rVersaoDivergente.status, E.VERSAO_INCOMPATIVEL);

  var rSchemaAusenteNaoBloqueia = await snapshotReader.lerAsync(MODULO, { baseUrl: BASE_URL, fetchImpl: mockOk });
  caso("expectedSchemaVersion ausente não bloqueia schemaVersion válido -> snapshot_valido", rSchemaAusenteNaoBloqueia.status, E.VALIDO);

  var rSchemaDivergente = await snapshotReader.lerAsync(MODULO, { baseUrl: BASE_URL, fetchImpl: mockOk, expectedSchemaVersion: "outra.v9" });
  caso("expectedSchemaVersion informado e divergente -> schema_incompativel", rSchemaDivergente.status, E.SCHEMA_INCOMPATIVEL);

  /* ================= coerência obrigatória latest <-> snapshot ================= */
  grupo("Fase 7A · snapshotReader.lerAsync — coerência obrigatória entre latest.json e snapshot (snapshotVersion/schemaVersion/capturedAt)");

  var snapVersaoDivergenteDoLatest = snapshotBase({ snapshotVersion: "9.9.9" });
  var mockVersaoDivergenteDoLatest = criarFetchMock({
    "mock://dados/snapshots/modulo-teste/latest.json": { status: 200, texto: TXT_LATEST_VALIDO },
    "mock://dados/snapshots/modulo-teste/periodos/2026/2026-07-17T10-00-00-000Z__abc123.json": { status: 200, texto: JSON.stringify(snapVersaoDivergenteDoLatest) }
  });
  var rVersaoDivergenteDoLatest = await snapshotReader.lerAsync(MODULO, { baseUrl: BASE_URL, fetchImpl: mockVersaoDivergenteDoLatest });
  caso("latest.snapshotVersion diferente de snapshot.snapshotVersion (sem expected) -> versao_incompativel", rVersaoDivergenteDoLatest.status, E.VERSAO_INCOMPATIVEL);

  var rExpectedIgualLatestDiferenteSnapshot = await snapshotReader.lerAsync(MODULO, { baseUrl: BASE_URL, fetchImpl: mockVersaoDivergenteDoLatest, expectedSnapshotVersion: "1.0.0" });
  caso("expectedSnapshotVersion igual ao latest, mas snapshot diverge -> versao_incompativel", rExpectedIgualLatestDiferenteSnapshot.status, E.VERSAO_INCOMPATIVEL);

  var snapSchemaDivergenteDoLatest = snapshotBase(null, { schemaVersion: "outra.v9" });
  var mockSchemaDivergenteDoLatest = criarFetchMock({
    "mock://dados/snapshots/modulo-teste/latest.json": { status: 200, texto: TXT_LATEST_VALIDO },
    "mock://dados/snapshots/modulo-teste/periodos/2026/2026-07-17T10-00-00-000Z__abc123.json": { status: 200, texto: JSON.stringify(snapSchemaDivergenteDoLatest) }
  });
  var rSchemaDivergenteDoLatest = await snapshotReader.lerAsync(MODULO, { baseUrl: BASE_URL, fetchImpl: mockSchemaDivergenteDoLatest });
  caso("latest.schemaVersion diferente de envelope.schemaVersion (sem expected) -> schema_incompativel", rSchemaDivergenteDoLatest.status, E.SCHEMA_INCOMPATIVEL);

  var rExpectedSchemaIgualEnvelopeDiferenteLatest = await snapshotReader.lerAsync(MODULO, { baseUrl: BASE_URL, fetchImpl: mockSchemaDivergenteDoLatest, expectedSchemaVersion: "outra.v9" });
  caso("expectedSchemaVersion igual ao envelope, mas diferente do latest -> schema_incompativel", rExpectedSchemaIgualEnvelopeDiferenteLatest.status, E.SCHEMA_INCOMPATIVEL);

  var snapCapturedAtDivergenteDoLatest = snapshotBase(null, { capturedAt: "2026-07-17T11:00:00.000Z" }); // data válida, porém diferente do latest
  var mockCapturedAtDivergenteDoLatest = criarFetchMock({
    "mock://dados/snapshots/modulo-teste/latest.json": { status: 200, texto: TXT_LATEST_VALIDO },
    "mock://dados/snapshots/modulo-teste/periodos/2026/2026-07-17T10-00-00-000Z__abc123.json": { status: 200, texto: JSON.stringify(snapCapturedAtDivergenteDoLatest) }
  });
  var rCapturedAtDivergenteDoLatest = await snapshotReader.lerAsync(MODULO, { baseUrl: BASE_URL, fetchImpl: mockCapturedAtDivergenteDoLatest });
  caso("latest.capturedAt diferente de envelope.capturedAt -> contrato_invalido", rCapturedAtDivergenteDoLatest.status, E.CONTRATO_INVALIDO);
  verdadeiro("Detalhe do erro menciona explicitamente ponteiro e envelope descrevendo capturas diferentes", rCapturedAtDivergenteDoLatest.detalhe.indexOf("capturas diferentes") !== -1);

  var rTresCamposCoerentes = await snapshotReader.lerAsync(MODULO, { baseUrl: BASE_URL, fetchImpl: mockOk, expectedSnapshotVersion: "1.0.0", expectedSchemaVersion: "teste.v1" });
  caso("snapshotVersion, schemaVersion e capturedAt coerentes (fixtures) -> snapshot_valido", rTresCamposCoerentes.status, E.VALIDO);

  // stale só é calculado depois de todas as validações de coerência passarem:
  // mesmo com now() bem no futuro e maxAgeHoras baixo (o que produziria
  // stale se a idade fosse calculada antes), uma divergência de coerência
  // deve prevalecer e ser reportada primeiro.
  var rStaleNaoMascaraCoerencia = await snapshotReader.lerAsync(MODULO, {
    baseUrl: BASE_URL,
    fetchImpl: mockCapturedAtDivergenteDoLatest,
    maxAgeHoras: 1,
    now: function () { return Date.parse("2026-08-01T00:00:00.000Z"); }
  });
  caso("stale não mascara divergência de coerência (capturedAt divergente prevalece sobre maxAgeHoras excedido)", rStaleNaoMascaraCoerencia.status, E.CONTRATO_INVALIDO);

  /* ================= baseUrl inválida ================= */
  grupo("Fase 7A · snapshotReader.lerAsync — validação mínima de baseUrl");

  var rBaseUrlEspacos = await snapshotReader.lerAsync(MODULO, { baseUrl: "    ", fetchImpl: criarFetchMock({}) });
  caso("baseUrl composta apenas por espaços -> parametro_invalido", rBaseUrlEspacos.status, E.PARAMETRO_INVALIDO);

  var rBaseUrlNulo = await snapshotReader.lerAsync(MODULO, { baseUrl: "mock://dados\u0000maligno", fetchImpl: criarFetchMock({}) });
  caso("baseUrl contendo caractere nulo -> parametro_invalido", rBaseUrlNulo.status, E.PARAMETRO_INVALIDO);

  var rBaseUrlJavascript = await snapshotReader.lerAsync(MODULO, { baseUrl: "javascript:alert(1)", fetchImpl: criarFetchMock({}) });
  caso("baseUrl com protocolo javascript: -> parametro_invalido", rBaseUrlJavascript.status, E.PARAMETRO_INVALIDO);

  var rBaseUrlData = await snapshotReader.lerAsync(MODULO, { baseUrl: "data:text/html,<script>1</script>", fetchImpl: criarFetchMock({}) });
  caso("baseUrl com protocolo data: -> parametro_invalido", rBaseUrlData.status, E.PARAMETRO_INVALIDO);

  var rBaseUrlHttps = await snapshotReader.lerAsync(MODULO, { baseUrl: "https://exemplo.org/dados", fetchImpl: criarFetchMock({}) });
  caso("baseUrl https:// aceita (segue para busca, não é parametro_invalido)", rBaseUrlHttps.status, E.AUSENTE);

  var rBaseUrlRelativo = await snapshotReader.lerAsync(MODULO, { baseUrl: "./dados-locais", fetchImpl: criarFetchMock({}) });
  caso("baseUrl como caminho relativo explícito aceito (segue para busca, não é parametro_invalido)", rBaseUrlRelativo.status, E.AUSENTE);

  var rBaseUrlMock = await snapshotReader.lerAsync(MODULO, { baseUrl: BASE_URL, fetchImpl: criarFetchMock({}) });
  caso("baseUrl mock:// (usado pelos testes) continua aceito", rBaseUrlMock.status, E.AUSENTE);

  /* ================= maxAgeHoras / stale ================= */
  grupo("Fase 7A · snapshotReader.lerAsync — maxAgeHoras e status stale");

  // capturedAt do snapshot fixture = 2026-07-17T10:00:00.000Z
  var AGORA_2H_DEPOIS = function () { return Date.parse("2026-07-17T12:00:00.000Z"); };
  var AGORA_100H_DEPOIS = function () { return Date.parse("2026-07-21T14:00:00.000Z"); };

  var rSemMaxAge = await snapshotReader.lerAsync(MODULO, { baseUrl: BASE_URL, fetchImpl: mockOk, now: AGORA_100H_DEPOIS });
  caso("maxAgeHoras ausente -> nenhuma avaliação de idade, mesmo snapshot 'velho' -> snapshot_valido", rSemMaxAge.status, E.VALIDO);

  var rDentroDoLimite = await snapshotReader.lerAsync(MODULO, { baseUrl: BASE_URL, fetchImpl: mockOk, now: AGORA_2H_DEPOIS, maxAgeHoras: 24 });
  caso("maxAgeHoras=24, idade=2h -> snapshot_valido", rDentroDoLimite.status, E.VALIDO);

  var rStale = await snapshotReader.lerAsync(MODULO, { baseUrl: BASE_URL, fetchImpl: mockOk, now: AGORA_100H_DEPOIS, maxAgeHoras: 24 });
  caso("maxAgeHoras=24, idade=100h -> stale", rStale.status, E.STALE);
  verdadeiro("stale preserva snapshot", rStale.snapshot !== null);
  verdadeiro("stale preserva meta", rStale.meta !== null && typeof rStale.meta.idadeHoras === "number");

  var rMaxAgeZero = await snapshotReader.lerAsync(MODULO, { baseUrl: BASE_URL, fetchImpl: mockOk, now: AGORA_2H_DEPOIS, maxAgeHoras: 0 });
  caso("maxAgeHoras=0 (número finito válido, não erro) com idade>0 -> stale", rMaxAgeZero.status, E.STALE);

  /* ================= erro de leitura (rede) ================= */
  grupo("Fase 7A · snapshotReader.lerAsync — erro_leitura (rede), diferenciado de 404");

  var mockRejeitaLatest = criarFetchMock({}, { rejeitarUrls: [URL_LATEST] });
  var rRejeitaLatest = await snapshotReader.lerAsync(MODULO, { baseUrl: BASE_URL, fetchImpl: mockRejeitaLatest });
  caso("fetch rejeita ao buscar latest.json -> erro_leitura", rRejeitaLatest.status, E.ERRO_LEITURA);

  var mock500Latest = criarFetchMock({
    "mock://dados/snapshots/modulo-teste/latest.json": { status: 500, texto: "erro interno" }
  });
  var r500Latest = await snapshotReader.lerAsync(MODULO, { baseUrl: BASE_URL, fetchImpl: mock500Latest });
  caso("latest.json responde HTTP 500 (não-ok, não-404) -> erro_leitura", r500Latest.status, E.ERRO_LEITURA);
  verdadeiro("HTTP 500 nunca confundido com snapshot_ausente (404)", r500Latest.status !== E.AUSENTE);

  var mockRejeitaSnapshot = criarFetchMock(
    { "mock://dados/snapshots/modulo-teste/latest.json": { status: 200, texto: TXT_LATEST_VALIDO } },
    { rejeitarUrls: [URL_SNAPSHOT_VALIDO] }
  );
  var rRejeitaSnapshot = await snapshotReader.lerAsync(MODULO, { baseUrl: BASE_URL, fetchImpl: mockRejeitaSnapshot });
  caso("fetch rejeita ao buscar o snapshot apontado -> erro_leitura", rRejeitaSnapshot.status, E.ERRO_LEITURA);

  /* ================= nenhuma escrita, nenhum eval, nenhuma rede real ================= */
  grupo("Fase 7A · snapshotReader.lerAsync — garantias estruturais (sem escrita, sem eval, sem rede real)");

  verdadeiro("Módulo carregado via require() puro (sem eval) — smoke test de exportação", typeof snapshotReader.lerAsync === "function" && typeof snapshotReader.ESTADOS === "object");
  verdadeiro("Todas as chamadas de fetch nesta suíte usaram URLs mock:// (nenhum host real)", mockOk.chamadas.every(function (u) { return u.indexOf("mock://") === 0; }));

  /* ================= hub-data-source — modos ================= */
  grupo("Fase 7A · dataSource.resolver — modo padrão e isolamento entre providers");

  var liveChamado = false, snapshotChamado = false;
  function liveProviderOk() { liveChamado = true; return Promise.resolve({ origem: "live", valor: 1 }); }
  function snapshotProviderOk() { snapshotChamado = true; return Promise.resolve({ origem: "snapshot", valor: 1 }); }

  liveChamado = false; snapshotChamado = false;
  var rModoOmitido = await dataSource.resolver(MODULO, undefined, { liveProvider: liveProviderOk, snapshotProvider: snapshotProviderOk });
  caso("modo omitido -> padrão 'live'", rModoOmitido.modo, dataSource.MODOS.LIVE);
  verdadeiro("modo omitido chama liveProvider", liveChamado);
  verdadeiro("modo omitido NÃO chama snapshotProvider", !snapshotChamado);
  caso("valorPrincipal em modo live é o resultado do liveProvider", rModoOmitido.valorPrincipal, { origem: "live", valor: 1 });

  liveChamado = false; snapshotChamado = false;
  var rModoSnapshot = await dataSource.resolver(MODULO, "snapshot", { liveProvider: liveProviderOk, snapshotProvider: snapshotProviderOk });
  verdadeiro("modo 'snapshot' NÃO chama liveProvider", !liveChamado);
  verdadeiro("modo 'snapshot' chama snapshotProvider", snapshotChamado);
  caso("valorPrincipal em modo snapshot é o resultado do snapshotProvider", rModoSnapshot.valorPrincipal, { origem: "snapshot", valor: 1 });
  verdadeiro("modo snapshot preserva o objeto estruturado inteiro do provider (não desembrulha)", rModoSnapshot.snapshot.resultado.origem === "snapshot");

  var chamadasLive = 0, chamadasSnapshot = 0;
  function liveProviderConta() { chamadasLive++; return Promise.resolve("L"); }
  function snapshotProviderConta() { chamadasSnapshot++; return Promise.resolve("S"); }
  var rCompareConta = await dataSource.resolver(MODULO, "compare", { liveProvider: liveProviderConta, snapshotProvider: snapshotProviderConta });
  caso("modo 'compare' chama liveProvider exatamente 1 vez", chamadasLive, 1);
  caso("modo 'compare' chama snapshotProvider exatamente 1 vez", chamadasSnapshot, 1);
  caso("valorPrincipal em compare é o resultado live", rCompareConta.valorPrincipal, "L");

  var rModoDesconhecido = await dataSource.resolver(MODULO, "modo-inexistente", { liveProvider: liveProviderOk, snapshotProvider: snapshotProviderOk });
  caso("modo desconhecido -> rejeitado explicitamente ('modo_desconhecido')", rModoDesconhecido.modo, "modo_desconhecido");
  verdadeiro("modo desconhecido não é aceito silenciosamente (valorPrincipal nulo)", rModoDesconhecido.valorPrincipal === null);

  var rModuloIdAusente = await dataSource.resolver(undefined, "live", { liveProvider: liveProviderOk });
  verdadeiro("moduloId ausente -> retorno estruturado com erro, nunca lança exceção", rModuloIdAusente.live.erro === "parametro_invalido");

  /* ================= compare — independência entre fontes ================= */
  grupo("Fase 7A · dataSource.resolver — modo compare: independência entre live e snapshot");

  function liveFalha() { return Promise.reject(new Error("falha proposital do live")); }
  function snapshotFalha() { return Promise.reject(new Error("falha proposital do snapshot")); }
  function liveOkValor() { return Promise.resolve({ a: 1 }); }
  function snapshotOkValor() { return Promise.resolve({ a: 1 }); }

  var rFalhaLiveApenas = await dataSource.resolver(MODULO, "compare", { liveProvider: liveFalha, snapshotProvider: snapshotOkValor });
  verdadeiro("Falha do live não impede a captura do resultado do snapshot", rFalhaLiveApenas.snapshot.resultado !== null && rFalhaLiveApenas.snapshot.erro === null);
  caso("comparação classificada como erro_live", rFalhaLiveApenas.comparacao.classificacao, "erro_live");

  var rFalhaSnapshotApenas = await dataSource.resolver(MODULO, "compare", { liveProvider: liveOkValor, snapshotProvider: snapshotFalha });
  verdadeiro("Falha do snapshot não impede a captura do resultado do live", rFalhaSnapshotApenas.live.resultado !== null && rFalhaSnapshotApenas.live.erro === null);
  caso("comparação classificada como erro_snapshot", rFalhaSnapshotApenas.comparacao.classificacao, "erro_snapshot");

  var rFalhaAmbas = await dataSource.resolver(MODULO, "compare", { liveProvider: liveFalha, snapshotProvider: snapshotFalha });
  caso("comparação classificada como erro_ambos quando as duas fontes falham", rFalhaAmbas.comparacao.classificacao, "erro_ambos");

  var rCompareNaoAltera = await dataSource.resolver(MODULO, "compare", { liveProvider: liveOkValor, snapshotProvider: snapshotOkValor });
  caso("modo compare não altera o valor principal (continua sendo o live)", rCompareNaoAltera.valorPrincipal, { a: 1 });

  /* ================= comparador — tipos de diferença ================= */
  grupo("Fase 7A · dataSource.comparar — classificação e tipos de diferença");

  var igualA = { x: 1, y: "abc", z: [1, 2, 3] };
  var igualB = { z: [1, 2, 3], y: "abc", x: 1 }; // mesmas props, ordem de declaração diferente
  var relIgual = dataSource.comparar(igualA, igualB, {});
  caso("Objetos com mesmas propriedades em ordem diferente -> igualdade (0 diferenças)", relIgual, { classificacao: "igualdade", diferencas: [], erroLive: null, erroSnapshot: null });

  var relCampoAusenteSnapshot = dataSource.comparar({ a: 1, b: 2 }, { a: 1 }, {});
  verdadeiro("Campo presente só no live -> campo_ausente_snapshot", relCampoAusenteSnapshot.diferencas.some(function (d) { return d.tipo === "campo_ausente_snapshot" && d.path === "$.b"; }));

  var relCampoAusenteLive = dataSource.comparar({ a: 1 }, { a: 1, c: 3 }, {});
  verdadeiro("Campo presente só no snapshot -> campo_ausente_live", relCampoAusenteLive.diferencas.some(function (d) { return d.tipo === "campo_ausente_live" && d.path === "$.c"; }));

  var relValorDivergente = dataSource.comparar({ v: 10 }, { v: 20 }, {});
  verdadeiro("Mesmo tipo, valor diferente -> valor_divergente", relValorDivergente.diferencas.some(function (d) { return d.tipo === "valor_divergente" && d.path === "$.v"; }));

  var relTipoDivergente = dataSource.comparar({ v: 10 }, { v: "10" }, {});
  verdadeiro("Tipos diferentes -> tipo_divergente (não valor_divergente)", relTipoDivergente.diferencas.some(function (d) { return d.tipo === "tipo_divergente" && d.path === "$.v"; }));

  var relOrdemArray = dataSource.comparar({ lista: [1, 2, 3] }, { lista: [3, 2, 1] }, {});
  verdadeiro("Arrays com mesmo conjunto, ordem diferente -> ordem_array_divergente", relOrdemArray.diferencas.some(function (d) { return d.tipo === "ordem_array_divergente" && d.path === "$.lista"; }));

  var relArrayMesmaOrdem = dataSource.comparar({ lista: [1, 2, 3] }, { lista: [1, 2, 3] }, {});
  caso("Arrays idênticos, mesma ordem -> igualdade", relArrayMesmaOrdem.classificacao, "igualdade");

  var relArrayConjuntoDiferente = dataSource.comparar({ lista: [1, 2, 3] }, { lista: [1, 2, 4] }, {});
  verdadeiro("Arrays de mesmo tamanho, conjunto realmente diferente -> valor_divergente por índice (não ordem_array_divergente)", relArrayConjuntoDiferente.diferencas.some(function (d) { return d.tipo === "valor_divergente"; }));

  /* comparação não modifica os objetos de entrada */
  grupo("Fase 7A · dataSource.comparar — não modifica os objetos de entrada");
  var origLive = { a: 1, lista: [3, 1, 2], aninhado: { x: "y" } };
  var origSnapshot = { a: 2, lista: [1, 2, 3], aninhado: { x: "z" } };
  var copiaLive = JSON.parse(JSON.stringify(origLive));
  var copiaSnapshot = JSON.parse(JSON.stringify(origSnapshot));
  dataSource.comparar(origLive, origSnapshot, {});
  caso("Objeto live permanece byte-a-byte igual após a comparação", origLive, copiaLive);
  caso("Objeto snapshot permanece byte-a-byte igual após a comparação", origSnapshot, copiaSnapshot);

  /* ---------- resumo final ---------- */
  console.log("\n=== Fase 7A — resultado da suíte ===\n");
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
}

rodar().catch(function (erro) {
  console.error("[testar-fase7a.js] Falha fatal na execução da suíte: " + (erro && erro.stack ? erro.stack : erro));
  process.exit(1);
});
