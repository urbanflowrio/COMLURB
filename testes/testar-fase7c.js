/* ============================================================
   HUB COMLURB · testes/testar-fase7c.js
   Suíte de teste reproduzível da Fase 7C
   (engenharia-operacional/piloto-snapshot/).

   Uso (a partir da raiz do repositório):

     node testes/testar-fase7c.js .

   NÃO depende de papaparse nem de nenhuma dependência nova — ao
   contrário de testar-fase4/5/6/7b.js, este arquivo nunca carrega
   hub-ingest-adapter-dte.js de verdade (que só é exercitado via CSV +
   Papa.parse). Em vez disso, injeta funções fake no lugar de
   HUB.ingest.adapterDTE.carregarDTE, retornando diretamente objetos
   no formato {envelope, indicadores, gerenciasOfensoras, notas,
   bloqueios, diagnosticoFonte} — o mesmo contrato de saída pública do
   Adapter, mas sem tocar CSV/Papa. Isso testa toda a lógica do piloto
   (resolverLive, compararColecoesDTE, classificar, etc.) sem exigir
   instalação de nada no ambiente local.

   Roda em Node puro, sem servidor, sem rede real — nenhum
   global.fetch é definido neste arquivo; todo acesso a "rede" passa
   por fetchImpl injetado.

   Esta suíte é ESPECÍFICA da Fase 7C. As suítes das fases anteriores
   (hub-selftest.js, testar-fase4/5/6/7a/7b.js) não são re-executadas
   aqui — rode-as separadamente para confirmar ausência de regressão.
   ============================================================ */

"use strict";

var fs = require("fs");
var path = require("path");
var crypto = require("crypto");

var raiz = process.argv[2];
if (!raiz) {
  console.error("Uso: node testes/testar-fase7c.js <raiz-do-repositorio>");
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

/* ================================================================
   ESPIÕES — mesma garantia em runtime usada em testar-fase7b.js:
   nenhuma escrita em disco, nenhuma chamada de fetch real. Também
   registramos o hash dos arquivos compartilhados ANTES de qualquer
   carregamento, para confirmar ao final que este teste não os alterou
   (cenário 20 — preservação integral, verificada por hash real, não
   por suposição).
   ================================================================ */

var ESPIAO_FS = { chamadasWriteFileSync: 0 };
var writeFileSyncOriginal = fs.writeFileSync;
fs.writeFileSync = function () {
  ESPIAO_FS.chamadasWriteFileSync++;
  return writeFileSyncOriginal.apply(fs, arguments);
};

var ESPIAO_FETCH = { chamadasReais: 0 };
if (typeof global.fetch === "function") {
  var fetchOriginal = global.fetch;
  global.fetch = function () {
    ESPIAO_FETCH.chamadasReais++;
    return fetchOriginal.apply(this, arguments);
  };
}

var COMP = path.join(raiz, "assets/components/");
var PS_AR = path.join(raiz, "ar/piloto-snapshot/");
var PS_DTE = path.join(raiz, "engenharia-operacional/piloto-snapshot/");

function sha256DoArquivo(caminho) {
  if (!fs.existsSync(caminho)) return null;
  return crypto.createHash("sha256").update(fs.readFileSync(caminho)).digest("hex");
}

var ARQUIVOS_COMPARTILHADOS_PROTEGIDOS = [
  path.join(COMP, "hub-data-source.js"),
  path.join(COMP, "hub-snapshot-reader.js"),
  path.join(COMP, "hub-ingest-adapter-dte.js"),
  path.join(COMP, "hub-core.js"),
  path.join(COMP, "hub-sources.js"),
  path.join(COMP, "hub-ingest-model.js"),
  path.join(COMP, "hub-ingest-reader.js"),
  path.join(PS_AR, "piloto-snapshot.js"),
  path.join(PS_AR, "index.html"),
  path.join(raiz, "engenharia-operacional/index.html")
];
var HASHES_ANTES = {};
ARQUIVOS_COMPARTILHADOS_PROTEGIDOS.forEach(function (f) { HASHES_ANTES[f] = sha256DoArquivo(f); });

global.window = global;
global.document = {
  getElementById: function () { return null; },
  addEventListener: function () {},
  createElement: function () { return {}; }
};

var snapshotReader = require(path.join(COMP, "hub-snapshot-reader.js"));
var dataSource = require(path.join(COMP, "hub-data-source.js"));
var PILOTO = require(path.join(PS_DTE, "piloto-snapshot-dte.js"));

var E = snapshotReader.ESTADOS;

function rodar() {

/* ================================================================
   FIXTURES — construídas em memória, sem novos arquivos de fixture
   além dos já existentes de testes/fixtures/fase7a/ (reaproveitados
   só para os estados GENÉRICOS do snapshotReader, que não dependem do
   formato do payload).
   ================================================================ */

var FIX_DIR_7A = path.join(raiz, "testes/fixtures/fase7a");
var TXT_LATEST_VALIDO_GENERICO = fs.readFileSync(path.join(FIX_DIR_7A, "latest-valido.json"), "utf8");
var TXT_SNAPSHOT_VALIDO_GENERICO = fs.readFileSync(path.join(FIX_DIR_7A, "snapshot-valido.json"), "utf8");

var BASE_URL_MOCK = "mock://dados";
var MODULO_GENERICO = "modulo-teste"; // moduloId embutido nas fixtures da fase7a
var URL_LATEST_GENERICO = BASE_URL_MOCK + "/snapshots/" + MODULO_GENERICO + "/latest.json";
var URL_SNAPSHOT_GENERICO = BASE_URL_MOCK + "/snapshots/modulo-teste/periodos/2026/2026-07-17T10-00-00-000Z__abc123.json";

/* fixture própria do DTE — payload com as três coleções do contrato real */
var MODULO_DTE = "modulo-teste-dte";
var PATH_SNAPSHOT_DTE = "snapshots/modulo-teste-dte/periodos/2026/2026-07-20T10-00-00-000Z__def456.json";
var URL_LATEST_DTE = BASE_URL_MOCK + "/snapshots/" + MODULO_DTE + "/latest.json";
var URL_SNAPSHOT_DTE = BASE_URL_MOCK + "/" + PATH_SNAPSHOT_DTE;

function indicador(linhaOrigem, colunaOrigem, periodo, valor) {
  return {
    bloco: "A", blocoNormalizado: "a", subgrupo: "S1", subgrupoNormalizado: "s1", subgrupoOcorrencia: 1,
    criterio: null, criterioNormalizado: null, indicadorBruto: "Ind1", indicadorNormalizado: "ind1",
    periodo: periodo, valor: valor, lineage: { linhaOrigem: linhaOrigem, colunaOrigem: colunaOrigem }
  };
}
function gerenciaOfensora(linhaCat, linhaVal, coluna, periodo, valor) {
  return {
    bloco: "C", blocoNormalizado: "c", subgrupo: "", subgrupoNormalizado: "", subgrupoOcorrencia: 1,
    criterio: null, criterioNormalizado: null, periodo: periodo, posicaoOfensora: 1, codigoGerencia: "GX1",
    valor: valor, indicadorAssociado: "Indicador Y", indicadorAssociadoNormalizado: "indicador y",
    unidadeMedida: null, rotulosBrutos: { linhaCategorica: "Gerência Ofensora 1", linhaValor: "Indicador Y" },
    lineage: { linhaOrigemCategorica: linhaCat, linhaOrigemValor: linhaVal, colunaOrigem: coluna }
  };
}

var PERIODOS_BASE = ["2026-06", "2026-07"];
var INDICADORES_BASE = [indicador(5, 1, "2026-06", 10), indicador(5, 2, "2026-07", 20)];
var GERENCIAS_BASE = [gerenciaOfensora(10, 11, 2, "2026-07", 3)];

function envelopeValido(periodos, indicadores, gerencias) {
  return { periodos: periodos, indicadores: indicadores, gerenciasOfensoras: gerencias };
}

function carregarDTEFixture(payload, diagnosticoOk) {
  return function () {
    return Promise.resolve({
      envelope: { payload: payload, quality: { erros: [], avisos: [] } },
      indicadores: (payload && payload.indicadores) || [],
      gerenciasOfensoras: (payload && payload.gerenciasOfensoras) || [],
      notas: [], bloqueios: [],
      diagnosticoFonte: { ok: diagnosticoOk !== false, motivo: diagnosticoOk === false ? "falha simulada de leitura" : null }
    });
  };
}

var SNAPSHOT_DTE_PAYLOAD_BASE = envelopeValido(PERIODOS_BASE, INDICADORES_BASE, GERENCIAS_BASE);

function snapshotDTEJson(payload, hash) {
  return JSON.stringify({
    snapshotVersion: "1.0.0",
    moduloId: MODULO_DTE,
    hash: hash,
    hashInputVersion: "1.0.0",
    geradoEm: "2026-07-20T10:00:00.050Z",
    envelope: {
      schemaVersion: "series_operacionais.dte.v1",
      sourceId: "DTE_RELATORIO_GERAL",
      capturedAt: "2026-07-20T10:00:00.000Z",
      referencePeriod: "2026-06..2026-07",
      domain: "series_operacionais",
      payload: payload,
      quality: { erros: [], avisos: [] },
      lineage: { timestamp: "2026-07-20T10:00:00.000Z" }
    }
  });
}
function latestDTEJson(hash, moduloId, pathSnapshot) {
  return JSON.stringify({
    snapshotVersion: "1.0.0",
    moduloId: moduloId || MODULO_DTE,
    path: pathSnapshot || PATH_SNAPSHOT_DTE,
    hash: hash,
    referencePeriod: "2026-06..2026-07",
    capturedAt: "2026-07-20T10:00:00.000Z",
    updatedAt: "2026-07-20T10:00:00.100Z",
    schemaVersion: "series_operacionais.dte.v1",
    domain: "series_operacionais"
  });
}
function snapshotDTEJsonComModulo(payload, hash, moduloId) {
  return JSON.stringify({
    snapshotVersion: "1.0.0",
    moduloId: moduloId || MODULO_DTE,
    hash: hash,
    hashInputVersion: "1.0.0",
    geradoEm: "2026-07-20T10:00:00.050Z",
    envelope: {
      schemaVersion: "series_operacionais.dte.v1",
      sourceId: "DTE_RELATORIO_GERAL",
      capturedAt: "2026-07-20T10:00:00.000Z",
      referencePeriod: "2026-06..2026-07",
      domain: "series_operacionais",
      payload: payload,
      quality: { erros: [], avisos: [] },
      lineage: { timestamp: "2026-07-20T10:00:00.000Z" }
    }
  });
}

var HASH_DTE_OK = "sha256:fixture-hash-dte-def456";
var TXT_LATEST_DTE_VALIDO = latestDTEJson(HASH_DTE_OK);
var TXT_SNAPSHOT_DTE_VALIDO = snapshotDTEJson(SNAPSHOT_DTE_PAYLOAD_BASE, HASH_DTE_OK);

function criarFetchMock(mapa) {
  var chamadas = [];
  var fn = function (url) {
    chamadas.push(url);
    var entrada = mapa[url];
    if (!entrada) {
      return Promise.resolve({ ok: false, status: 404, text: function () { return Promise.resolve(""); } });
    }
    var ok = entrada.status >= 200 && entrada.status < 300;
    return Promise.resolve({ ok: ok, status: entrada.status, text: function () { return Promise.resolve(entrada.texto); } });
  };
  fn._chamadas = chamadas;
  return fn;
}

var FETCH_DTE_VALIDO = criarFetchMock((function () {
  var m = {};
  m[URL_LATEST_DTE] = { status: 200, texto: TXT_LATEST_DTE_VALIDO };
  m[URL_SNAPSHOT_DTE] = { status: 200, texto: TXT_SNAPSHOT_DTE_VALIDO };
  return m;
})());

/* ================================================================
   1/28 — resolverLive: extração e chamada única do Adapter
   ================================================================ */
grupo("Fase 7C · resolverLive — extração e chamada única");

return PILOTO.resolverLive(carregarDTEFixture(SNAPSHOT_DTE_PAYLOAD_BASE)).then(function (rLive) {
  verdadeiro("live extrai as três coleções (ok:true)", rLive.ok === true &&
    Array.isArray(rLive.periodos) && Array.isArray(rLive.indicadores) && Array.isArray(rLive.gerenciasOfensoras));
  caso("periodos batem com o fixture", rLive.periodos, PERIODOS_BASE);
  caso("indicadores batem com o fixture", rLive.indicadores, INDICADORES_BASE);
  caso("gerenciasOfensoras batem com o fixture", rLive.gerenciasOfensoras, GERENCIAS_BASE);

  var contador = 0;
  function carregarComContador() {
    contador++;
    return carregarDTEFixture(SNAPSHOT_DTE_PAYLOAD_BASE)();
  }
  return PILOTO.resolverLive(carregarComContador).then(function () {
    caso("[cenário 28] Adapter DTE (via fixture) chamado exatamente uma vez por resolverLive", contador, 1);
  });
}).then(function () {

  /* payload nulo (falha estrutural do Adapter/reader) */
  return PILOTO.resolverLive(function () {
    return Promise.resolve({ envelope: { payload: null, quality: { erros: [{ tipo: "x" }], avisos: [] } }, diagnosticoFonte: { ok: false, motivo: "bloqueio estrutural" } });
  });
}).then(function (rPayloadNulo) {
  verdadeiro("[cenário 10] payload nulo -> ok:false (LIVE_INDISPONIVEL)", rPayloadNulo.ok === false && typeof rPayloadNulo.erro === "string");

  /* payload presente mas faltando uma das três coleções */
  return PILOTO.resolverLive(carregarDTEFixture({ periodos: PERIODOS_BASE, indicadores: INDICADORES_BASE /* gerenciasOfensoras ausente */ }));
}).then(function (rColecaoFaltando) {
  verdadeiro("payload sem as três coleções -> ok:false, nunca presume lista simples", rColecaoFaltando.ok === false);

  /* [cenário 11] erro/rejeição do Adapter */
  return PILOTO.resolverLive(function () { return Promise.reject(new Error("falha simulada do Adapter DTE")); });
}).then(function (rRejeicao) {
  verdadeiro("[cenário 11] rejeição do Adapter -> ok:false, nunca lança exceção para fora", rRejeicao.ok === false);
  caso("mensagem de erro da rejeição preservada", rRejeicao.erro, "falha simulada do Adapter DTE");
}).then(function () {

  /* ================================================================
     7/8/9/29 — resolverSnapshot: estados aceitos/rejeitados, chamada
     única, payload compatível/incompatível.
     ================================================================ */
  grupo("Fase 7C · resolverSnapshot — estados aceitos/rejeitados, chamada única, contrato de três coleções");

  return PILOTO.resolverSnapshot(snapshotReader.lerAsync, MODULO_DTE, BASE_URL_MOCK, null, E, FETCH_DTE_VALIDO);
}).then(function (rSnapValido) {
  verdadeiro("snapshot_valido com payload DTE compatível -> ok:true", rSnapValido.ok === true && rSnapValido.status === E.VALIDO);
  caso("periodos extraídos do snapshot batem com o fixture", rSnapValido.periodos, PERIODOS_BASE);
  caso("indicadores extraídos do snapshot batem com o fixture", rSnapValido.indicadores, INDICADORES_BASE);
  caso("gerenciasOfensoras extraídas do snapshot batem com o fixture", rSnapValido.gerenciasOfensoras, GERENCIAS_BASE);
  verdadeiro("não sinalizado como stale", rSnapValido.stale === false);

  var contadorSnap = 0;
  function lerAsyncComContador(moduloId, opts) {
    contadorSnap++;
    return snapshotReader.lerAsync(moduloId, opts);
  }
  return PILOTO.resolverSnapshot(lerAsyncComContador, MODULO_DTE, BASE_URL_MOCK, null, E, FETCH_DTE_VALIDO).then(function () {
    caso("[cenário 29] snapshotReader chamado exatamente uma vez por resolverSnapshot", contadorSnap, 1);
  });
}).then(function () {

  /* [cenário 7] snapshot inexistente */
  return PILOTO.resolverSnapshot(snapshotReader.lerAsync, "modulo-dte-inexistente", BASE_URL_MOCK, null, E, criarFetchMock({}));
}).then(function (rAusente) {
  verdadeiro("[cenário 7] snapshot ausente (404) -> ok:false, status snapshot_ausente", rAusente.ok === false && rAusente.status === E.AUSENTE);
  var cls = PILOTO.classificar({ comparacao: null }, { ok: true, periodos: [], indicadores: [], gerenciasOfensoras: [] }, rAusente);
  caso("[cenário 7] classificação geral -> SNAPSHOT_INDISPONIVEL", cls.estado, "SNAPSHOT_INDISPONIVEL");

  /* [cenário 8] snapshot inválido — latest.json malformado */
  var fetchLatestInvalido = criarFetchMock((function () {
    var m = {};
    m[BASE_URL_MOCK + "/snapshots/mod-dte-x/latest.json"] = { status: 200, texto: "{ isso não é json válido" };
    return m;
  })());
  return PILOTO.resolverSnapshot(snapshotReader.lerAsync, "mod-dte-x", BASE_URL_MOCK, null, E, fetchLatestInvalido);
}).then(function (rLatestInvalido) {
  verdadeiro("[cenário 8] latest.json malformado -> ok:false, status latest_invalido", rLatestInvalido.ok === false && rLatestInvalido.status === E.LATEST_INVALIDO);
  var cls = PILOTO.classificar({ comparacao: null }, { ok: true, periodos: [], indicadores: [], gerenciasOfensoras: [] }, rLatestInvalido);
  caso("[cenário 8] classificação geral -> SNAPSHOT_INVALIDO", cls.estado, "SNAPSHOT_INVALIDO");

  /* [cenário 9] hash divergente — latest.hash aponta um valor que não
     bate com o hash real gravado dentro do snapshot apontado (mesmo
     moduloId/path nos dois documentos; só o hash do ponteiro diverge). */
  var pathHashDivergente = "snapshots/mod-dte-hash/periodos/2026/2026-07-20T10-00-00-000Z__def456.json";
  var latestHashDivergente = latestDTEJson("sha256:hash-diferente-do-snapshot", "mod-dte-hash", pathHashDivergente);
  var snapshotParaHashDivergente = snapshotDTEJsonComModulo(SNAPSHOT_DTE_PAYLOAD_BASE, HASH_DTE_OK, "mod-dte-hash");
  var fetchHashDivergente = criarFetchMock((function () {
    var m = {};
    m[BASE_URL_MOCK + "/snapshots/mod-dte-hash/latest.json"] = { status: 200, texto: latestHashDivergente };
    m[BASE_URL_MOCK + "/" + pathHashDivergente] = { status: 200, texto: snapshotParaHashDivergente };
    return m;
  })());
  return PILOTO.resolverSnapshot(snapshotReader.lerAsync, "mod-dte-hash", BASE_URL_MOCK, null, E, fetchHashDivergente);
}).then(function (rHashDivergente) {
  verdadeiro("[cenário 9] hash divergente -> ok:false, status hash_divergente", rHashDivergente.ok === false && rHashDivergente.status === E.HASH_DIVERGENTE);
  var cls = PILOTO.classificar({ comparacao: null }, { ok: true, periodos: [], indicadores: [], gerenciasOfensoras: [] }, rHashDivergente);
  caso("[cenário 9] classificação geral -> SNAPSHOT_INVALIDO", cls.estado, "SNAPSHOT_INVALIDO");

  /* snapshot válido pelo contrato genérico, mas payload não é do DTE (reaproveita fixture fase7a: payload = {linhas:[...]}) */
  return PILOTO.resolverSnapshot(snapshotReader.lerAsync, MODULO_GENERICO, BASE_URL_MOCK, null, E, criarFetchMock((function () {
    var m = {};
    m[URL_LATEST_GENERICO] = { status: 200, texto: TXT_LATEST_VALIDO_GENERICO };
    m[URL_SNAPSHOT_GENERICO] = { status: 200, texto: TXT_SNAPSHOT_VALIDO_GENERICO };
    return m;
  })()));
}).then(function (rPayloadIncompativel) {
  verdadeiro("snapshot genérico válido, mas payload sem as três coleções DTE -> ok:false", rPayloadIncompativel.ok === false && rPayloadIncompativel.status === "payload_incompativel_piloto");
  var cls = PILOTO.classificar({ comparacao: null }, { ok: true, periodos: [], indicadores: [], gerenciasOfensoras: [] }, rPayloadIncompativel);
  caso("payload incompatível -> classificação SNAPSHOT_INVALIDO (encontrado, porém rejeitado)", cls.estado, "SNAPSHOT_INVALIDO");
}).then(function () {

  /* ================================================================
     providers finos
     ================================================================ */
  grupo("Fase 7C · providers finos — nunca chamam Adapter/Reader de novo, falha nunca vira estrutura vazia");

  var liveFalho = { ok: false, erro: "x" };
  var provLive = PILOTO.providerFinoLive(liveFalho);
  return provLive().then(
    function () { caso("providerFinoLive deveria rejeitar quando live falhou", "resolveu (ERRADO)", "deveria rejeitar"); },
    function (e) { verdadeiro("providerFinoLive rejeita quando live falhou", !!e); }
  ).then(function () {
    var snapFalho = { ok: false, status: "snapshot_ausente" };
    var provSnap = PILOTO.providerFinoSnapshot(snapFalho);
    return provSnap().then(
      function () { caso("providerFinoSnapshot deveria rejeitar quando snapshot falhou", "resolveu (ERRADO)", "deveria rejeitar"); },
      function (e) { verdadeiro("providerFinoSnapshot rejeita quando snapshot falhou", !!e); }
    );
  }).then(function () {
    var liveOk = { ok: true, periodos: PERIODOS_BASE, indicadores: INDICADORES_BASE, gerenciasOfensoras: GERENCIAS_BASE };
    return PILOTO.providerFinoLive(liveOk)().then(function (v) {
      caso("providerFinoLive reexpõe as três coleções sem transformação", v, { periodos: PERIODOS_BASE, indicadores: INDICADORES_BASE, gerenciasOfensoras: GERENCIAS_BASE });
    });
  });
}).then(function () {

  /* ================================================================
     construirChave — CHAVE_AUSENTE / CHAVE_INCOMPLETA
     ================================================================ */
  grupo("Fase 7C · construirChave — chave ausente e incompleta (cenário 23)");

  caso("registro sem lineage -> CHAVE_AUSENTE", PILOTO.construirChave({ valor: 1 }, ["lineage.linhaOrigem", "lineage.colunaOrigem"]), { chave: null, problema: "CHAVE_AUSENTE" });
  caso("lineage com componente faltando -> CHAVE_INCOMPLETA", PILOTO.construirChave({ lineage: { linhaOrigem: 5 } }, ["lineage.linhaOrigem", "lineage.colunaOrigem"]), { chave: null, problema: "CHAVE_INCOMPLETA" });
  caso("lineage com componente null -> CHAVE_INCOMPLETA", PILOTO.construirChave({ lineage: { linhaOrigem: 5, colunaOrigem: null } }, ["lineage.linhaOrigem", "lineage.colunaOrigem"]), { chave: null, problema: "CHAVE_INCOMPLETA" });
  caso("chave válida com linhaOrigem=0 (não deve ser tratado como ausente)", PILOTO.construirChave({ lineage: { linhaOrigem: 0, colunaOrigem: 1 } }, ["lineage.linhaOrigem", "lineage.colunaOrigem"]), { chave: "0|1", problema: null });

  /* ================================================================
     compararColecaoPorChave — bateria completa (2,3,4,5,21,22,24,25,26)
     ================================================================ */
  grupo("Fase 7C · compararColecaoPorChave — equivalência, ausência, adição, valor, tipo, ordem, duplicidade, null×ausente");

  var CHAVE_IND = ["lineage.linhaOrigem", "lineage.colunaOrigem"];

  /* base equivalente */
  var diffsEq = [];
  var volEq = PILOTO.compararColecaoPorChave(INDICADORES_BASE, INDICADORES_BASE.map(function (r) { return JSON.parse(JSON.stringify(r)); }), CHAVE_IND, "indicadores", diffsEq);
  caso("[cenário 1] coleções idênticas -> zero diferenças", diffsEq.length, 0);
  caso("volumetria reporta contagens corretas", volEq, { live: 2, snapshot: 2, chavesComparadas: 2 });

  /* [cenário 24] ordem diferente, mas equivalente por chave */
  var diffsOrdem = [];
  var liveOrdem = [indicador(5, 2, "2026-07", 20), indicador(5, 1, "2026-06", 10)];
  var snapOrdem = [indicador(5, 1, "2026-06", 10), indicador(5, 2, "2026-07", 20)];
  PILOTO.compararColecaoPorChave(liveOrdem, snapOrdem, CHAVE_IND, "indicadores", diffsOrdem);
  caso("[cenário 6/24] ordem diferente mas equivalente por chave -> zero diferenças", diffsOrdem.length, 0);

  /* [cenário 2] ausente no snapshot */
  var diffsAusenteSnap = [];
  PILOTO.compararColecaoPorChave(INDICADORES_BASE, [INDICADORES_BASE[0]], CHAVE_IND, "indicadores", diffsAusenteSnap);
  verdadeiro("[cenário 2] registro ausente no snapshot -> APENAS_LIVE", diffsAusenteSnap.some(function (d) { return d.natureza === "APENAS_LIVE"; }));
  caso("[cenário 2] exatamente 1 diferença", diffsAusenteSnap.length, 1);

  /* [cenário 3] adicional no snapshot */
  var diffsExtraSnap = [];
  PILOTO.compararColecaoPorChave([INDICADORES_BASE[0]], INDICADORES_BASE, CHAVE_IND, "indicadores", diffsExtraSnap);
  verdadeiro("[cenário 3] registro adicional no snapshot -> APENAS_SNAPSHOT", diffsExtraSnap.some(function (d) { return d.natureza === "APENAS_SNAPSHOT"; }));
  caso("[cenário 3] exatamente 1 diferença", diffsExtraSnap.length, 1);

  /* [cenário 4] valor diferente */
  var diffsValor = [];
  var liveValorDiff = [indicador(5, 1, "2026-06", 10)];
  var snapValorDiff = [indicador(5, 1, "2026-06", 999)];
  PILOTO.compararColecaoPorChave(liveValorDiff, snapValorDiff, CHAVE_IND, "indicadores", diffsValor);
  verdadeiro("[cenário 4] valor diferente -> VALOR_DIFERENTE", diffsValor.some(function (d) { return d.natureza === "VALOR_DIFERENTE" && d.path.indexOf(".valor") !== -1; }));

  /* [cenário 5/26] tipo diferente — número × string numérica */
  var diffsTipo = [];
  var liveTipoNum = [indicador(5, 1, "2026-06", 10)];
  var snapTipoStr = [indicador(5, 1, "2026-06", "10")];
  PILOTO.compararColecaoPorChave(liveTipoNum, snapTipoStr, CHAVE_IND, "indicadores", diffsTipo);
  verdadeiro("[cenário 5/26] número × string numérica -> TIPO_DIFERENTE (nunca coagido)", diffsTipo.some(function (d) { return d.natureza === "TIPO_DIFERENTE" && d.tipoLive === "number" && d.tipoSnapshot === "string"; }));

  /* [cenário 25] null × campo ausente */
  var diffsNullAusente = [];
  var liveComNull = [{ lineage: { linhaOrigem: 1, colunaOrigem: 1 }, criterio: null }];
  var snapSemCampo = [{ lineage: { linhaOrigem: 1, colunaOrigem: 1 } }];
  PILOTO.compararColecaoPorChave(liveComNull, snapSemCampo, CHAVE_IND, "indicadores", diffsNullAusente);
  verdadeiro("[cenário 25] null (live) × campo ausente (snapshot) -> CAMPO_AUSENTE_SNAPSHOT, nunca equivalência", diffsNullAusente.some(function (d) { return d.natureza === "CAMPO_AUSENTE_SNAPSHOT" && d.path.indexOf(".criterio") !== -1; }));

  var diffsAusenteNull = [];
  var liveSemCampo = [{ lineage: { linhaOrigem: 2, colunaOrigem: 1 } }];
  var snapComNull = [{ lineage: { linhaOrigem: 2, colunaOrigem: 1 }, criterio: null }];
  PILOTO.compararColecaoPorChave(liveSemCampo, snapComNull, CHAVE_IND, "indicadores", diffsAusenteNull);
  verdadeiro("campo ausente (live) × null (snapshot) -> CAMPO_AUSENTE_LIVE", diffsAusenteNull.some(function (d) { return d.natureza === "CAMPO_AUSENTE_LIVE" && d.path.indexOf(".criterio") !== -1; }));

  /* string vazia × ausente também nunca equivalentes (reforço da mesma regra) */
  var diffsVazioAusente = [];
  PILOTO.compararColecaoPorChave(
    [{ lineage: { linhaOrigem: 3, colunaOrigem: 1 }, criterio: "" }],
    [{ lineage: { linhaOrigem: 3, colunaOrigem: 1 } }],
    CHAVE_IND, "indicadores", diffsVazioAusente
  );
  verdadeiro("string vazia (live) × campo ausente (snapshot) -> não tratados como equivalentes", diffsVazioAusente.some(function (d) { return d.natureza === "CAMPO_AUSENTE_SNAPSHOT"; }));

  /* [cenário 21] chave duplicada no live */
  var diffsDupLive = [];
  var liveComDuplicata = [indicador(5, 1, "2026-06", 10), indicador(5, 1, "2026-06", 999)]; // mesma chave 5|1
  var volDupLive = PILOTO.compararColecaoPorChave(liveComDuplicata, [indicador(5, 1, "2026-06", 10)], CHAVE_IND, "indicadores", diffsDupLive);
  verdadeiro("[cenário 21] chave duplicada no live -> CHAVE_DUPLICADA, lado live", diffsDupLive.some(function (d) { return d.natureza === "CHAVE_DUPLICADA" && d.lado === "live"; }));
  verdadeiro("[cenário 21] registros da chave duplicada não entram em comparação campo-a-campo (nenhum VALOR_DIFERENTE/TIPO_DIFERENTE para essa chave)", !diffsDupLive.some(function (d) { return d.chave === "5|1" && (d.natureza === "VALOR_DIFERENTE" || d.natureza === "TIPO_DIFERENTE"); }));

  /* [cenário 22] chave duplicada no snapshot */
  var diffsDupSnap = [];
  var snapComDuplicata = [indicador(5, 1, "2026-06", 10), indicador(5, 1, "2026-06", 20)];
  PILOTO.compararColecaoPorChave([indicador(5, 1, "2026-06", 10)], snapComDuplicata, CHAVE_IND, "indicadores", diffsDupSnap);
  verdadeiro("[cenário 22] chave duplicada no snapshot -> CHAVE_DUPLICADA, lado snapshot", diffsDupSnap.some(function (d) { return d.natureza === "CHAVE_DUPLICADA" && d.lado === "snapshot"; }));

  /* ESTRUTURA_INVALIDA quando a coleção não é array */
  var diffsEstruturaInvalida = [];
  PILOTO.compararColecaoPorChave(undefined, INDICADORES_BASE, CHAVE_IND, "indicadores", diffsEstruturaInvalida);
  verdadeiro("coleção live ausente/():não-array -> ESTRUTURA_INVALIDA, lado live, sem lançar exceção", diffsEstruturaInvalida.some(function (d) { return d.natureza === "ESTRUTURA_INVALIDA" && d.lado === "live"; }));

  /* ================================================================
     compararPeriodos — [cenário 14]
     ================================================================ */
  grupo("Fase 7C · compararPeriodos — reconhecimento correto, ordem não semântica");

  var diffsPerIguais = [];
  var volPer = PILOTO.compararPeriodos(["2026-07", "2026-06"], ["2026-06", "2026-07"], diffsPerIguais);
  caso("[cenário 14] mesmos períodos em ordem diferente -> zero diferenças (normalizado por sort)", diffsPerIguais.length, 0);
  caso("[cenário 14] volumetria de períodos correta", volPer, { live: 2, snapshot: 2 });

  var diffsPerDivergentes = [];
  PILOTO.compararPeriodos(["2026-06", "2026-07"], ["2026-06"], diffsPerDivergentes);
  verdadeiro("período exclusivo do live -> APENAS_LIVE", diffsPerDivergentes.some(function (d) { return d.natureza === "APENAS_LIVE" && d.chave === "2026-07"; }));

}).then(function () {

  /* ================================================================
     compararColecoesDTE — [cenário 12] múltiplas coleções, [13] contagem,
     [18] determinismo, [30] coleção não comparada bloqueia EQUIVALENTE
     ================================================================ */
  grupo("Fase 7C · compararColecoesDTE — múltiplas coleções, contagem, determinismo, coleção ausente");

  var liveMulti = envelopeValido(PERIODOS_BASE, INDICADORES_BASE, GERENCIAS_BASE);
  var snapMulti = envelopeValido(PERIODOS_BASE, INDICADORES_BASE, GERENCIAS_BASE);
  var rMulti1 = PILOTO.compararColecoesDTE(liveMulti, snapMulti, {});
  caso("[cenário 12] volumetria contém as três coleções", Object.keys(rMulti1.volumetria).sort(), ["gerenciasOfensoras", "indicadores", "periodos"]);
  caso("[cenário 1] três coleções equivalentes -> classificacao igualdade", rMulti1.classificacao, "igualdade");

  var liveMultiDivergente = envelopeValido(PERIODOS_BASE, [indicador(5, 1, "2026-06", 10), indicador(5, 2, "2026-07", 999)], GERENCIAS_BASE);
  var rMulti2 = PILOTO.compararColecoesDTE(liveMultiDivergente, snapMulti, {});
  caso("[cenário 13] contagem total de diferenças bate com a soma por natureza", rMulti2.diferencas.length, Object.keys(PILOTO.agruparPorNatureza(rMulti2.diferencas)).reduce(function (acc, k) { return acc + PILOTO.agruparPorNatureza(rMulti2.diferencas)[k]; }, 0));
  verdadeiro("[cenário 13] contagem por coleção também bate", PILOTO.agruparPorColecao(rMulti2.diferencas).indicadores >= 1);

  /* [cenário 18] determinismo — rodar duas vezes sobre o mesmo par de entradas produz o mesmo relatório */
  var rMulti2b = PILOTO.compararColecoesDTE(liveMultiDivergente, snapMulti, {});
  caso("[cenário 18] comparação determinística (mesma entrada -> mesma saída)", rMulti2.diferencas, rMulti2b.diferencas);

  /* [cenário 30] uma das três coleções não é array (não comparável) -> nunca EQUIVALENTE */
  var liveSemIndicadores = { periodos: PERIODOS_BASE, indicadores: undefined, gerenciasOfensoras: GERENCIAS_BASE };
  var rSemColecao = PILOTO.compararColecoesDTE(liveSemIndicadores, snapMulti, {});
  caso("[cenário 30] coleção indicadores ausente -> classificacao divergente (nunca igualdade)", rSemColecao.classificacao, "divergente");
  verdadeiro("[cenário 30] diferença ESTRUTURA_INVALIDA registrada para a coleção não comparada", rSemColecao.diferencas.some(function (d) { return d.natureza === "ESTRUTURA_INVALIDA" && d.colecao === "indicadores"; }));

  /* erro de origem já resolvido é respeitado sem rodar comparação */
  var rErroLive = PILOTO.compararColecoesDTE(null, snapMulti, { erroLive: "falha de origem live" });
  caso("erros de origem live -> classificacao erro_live, sem diferenças calculadas", rErroLive, { classificacao: "erro_live", diferencas: [], erroLive: "falha de origem live", erroSnapshot: null, volumetria: null });

}).then(function () {

  /* ================================================================
     classificar — seis estados
     ================================================================ */
  grupo("Fase 7C · classificar — seis estados exigidos");

  var liveOk = { ok: true, periodos: [], indicadores: [], gerenciasOfensoras: [] };
  var snapOk = { ok: true, status: E.VALIDO, stale: false, periodos: [], indicadores: [], gerenciasOfensoras: [] };

  caso("[cenário 10] live indisponível", PILOTO.classificar(null, { ok: false, erro: "x" }, snapOk).estado, "LIVE_INDISPONIVEL");
  caso("snapshot ausente -> SNAPSHOT_INDISPONIVEL", PILOTO.classificar(null, liveOk, { ok: false, status: E.AUSENTE }).estado, "SNAPSHOT_INDISPONIVEL");
  caso("snapshot hash divergente -> SNAPSHOT_INVALIDO", PILOTO.classificar(null, liveOk, { ok: false, status: E.HASH_DIVERGENTE }).estado, "SNAPSHOT_INVALIDO");
  caso("comparação igualdade -> EQUIVALENTE", PILOTO.classificar({ comparacao: { classificacao: "igualdade" } }, liveOk, snapOk).estado, "EQUIVALENTE");
  caso("comparação divergente -> DIVERGENTE", PILOTO.classificar({ comparacao: { classificacao: "divergente" } }, liveOk, snapOk).estado, "DIVERGENTE");
  caso("erro_comparacao -> ERRO_DE_COMPARACAO", PILOTO.classificar({ comparacao: { classificacao: "erro_comparacao", mensagem: "boom" } }, liveOk, snapOk).estado, "ERRO_DE_COMPARACAO");
  caso("erro_ambos (ambas as fontes falharam durante a comparação) -> ERRO_DE_COMPARACAO", PILOTO.classificar({ comparacao: { classificacao: "erro_ambos", erroLive: "a", erroSnapshot: "b" } }, liveOk, snapOk).estado, "ERRO_DE_COMPARACAO");

}).then(function () {

  /* ================================================================
     limitarParaExibicao — [cenários 17/27]
     ================================================================ */
  grupo("Fase 7C · limitarParaExibicao — amostra limitada, contagem total nunca truncada");

  var diferencasGrandes = [];
  for (var i = 0; i < 500; i++) diferencasGrandes.push({ colecao: "indicadores", chave: String(i), natureza: "VALOR_DIFERENTE" });

  var limitado = PILOTO.limitarParaExibicao(diferencasGrandes, 300);
  caso("[cenário 17/27] totalReal preserva a contagem real completa", limitado.totalReal, 500);
  caso("[cenário 17/27] totalExibido respeita o limite configurado", limitado.totalExibido, 300);
  verdadeiro("[cenário 17/27] truncado sinalizado corretamente", limitado.truncado === true);

  var limitadoPequeno = PILOTO.limitarParaExibicao([{ natureza: "VALOR_DIFERENTE" }], 300);
  verdadeiro("lista menor que o limite -> não truncado", limitadoPequeno.truncado === false);
  caso("CONFIG.limiteDiferencasRenderizadas é uma constante local numérica > 0", typeof PILOTO.CONFIG.limiteDiferencasRenderizadas === "number" && PILOTO.CONFIG.limiteDiferencasRenderizadas > 0, true);

}).then(function () {

  /* ================================================================
     integração fim a fim via HUB.dataSource.resolver — reaproveita o
     compareProvider real dentro do fluxo genérico já testado na Fase
     7A/7B, sem nenhuma alteração em hub-data-source.js.
     ================================================================ */
  grupo("Fase 7C · integração — HUB.dataSource.resolver(\"engenharia-dte\",\"compare\",{compareProvider})");

  var liveResult = { ok: true, periodos: PERIODOS_BASE, indicadores: INDICADORES_BASE, gerenciasOfensoras: GERENCIAS_BASE };
  var snapResult = { ok: true, status: E.VALIDO, stale: false, periodos: PERIODOS_BASE, indicadores: INDICADORES_BASE, gerenciasOfensoras: GERENCIAS_BASE };

  return dataSource.resolver(PILOTO.MODULO_ID, "compare", {
    liveProvider: PILOTO.providerFinoLive(liveResult),
    snapshotProvider: PILOTO.providerFinoSnapshot(snapResult),
    compareProvider: PILOTO.compararColecoesDTE
  }).then(function (relatorio) {
    var cls = PILOTO.classificar(relatorio, liveResult, snapResult);
    caso("integração fim a fim com dados equivalentes -> EQUIVALENTE", cls.estado, "EQUIVALENTE");
    verdadeiro("moduloId propagado corretamente pelo resolver genérico", relatorio.moduloId === PILOTO.MODULO_ID);
  });

}).then(function () {

  /* ================================================================
     [cenário 19] não aplicação de regras de negócio — verificação
     estática: o módulo não referencia hub-rules/hub-state nem calcula
     status/atingimento/tendência/bonificação.
     ================================================================ */
  grupo("Fase 7C · não aplicação de regras de negócio (cenário 19)");

  var textoModuloBruto = fs.readFileSync(path.join(PS_DTE, "piloto-snapshot-dte.js"), "utf8");
  // Remove comentários de bloco antes de checar — o cabeçalho do
  // arquivo DESCREVE em prosa o que não é feito (ex.: "NÃO aplica
  // hub-rules-engenharia.js"), o que é documentação esperada, não
  // código executável. O teste verifica ausência de USO real (require/
  // chamada/identificador), não a mera menção textual em comentário.
  var textoModulo = textoModuloBruto.replace(/\/\*[\s\S]*?\*\//g, "");
  verdadeiro("[cenário 19] módulo não carrega/usa hub-rules (fora de comentários)", textoModulo.indexOf("hub-rules") === -1);
  verdadeiro("[cenário 19] módulo não carrega/usa hub-state (fora de comentários)", textoModulo.indexOf("hub-state") === -1);
  verdadeiro("[cenário 19] módulo não calcula atingimento/status/bonificação (fora de comentários)", textoModulo.toLowerCase().indexOf("atingimento") === -1 && textoModulo.toLowerCase().indexOf("bonific") === -1);
  verdadeiro("index.html do piloto não carrega hub-rules-engenharia.js nem hub-state-engenharia.js (fora de comentários HTML)", (function () {
    var htmlBruto = fs.readFileSync(path.join(PS_DTE, "index.html"), "utf8");
    var html = htmlBruto.replace(/<!--[\s\S]*?-->/g, "");
    return html.indexOf("hub-rules-engenharia") === -1 && html.indexOf("hub-state-engenharia") === -1 && html.indexOf("engenharia-operacional/index.html") === -1;
  })());

  /* ================================================================
     [cenário 15] ausência de conexão com navegação/painel executivo
     ================================================================ */
  grupo("Fase 7C · isolamento — sem link na Home, sem link no painel executivo (cenário 15)");

  var htmlPiloto = fs.readFileSync(path.join(PS_DTE, "index.html"), "utf8");
  verdadeiro("página do piloto tem robots noindex,nofollow", /noindex,\s*nofollow/.test(htmlPiloto));

  var caminhoIndexRaiz = path.join(raiz, "index.html");
  if (fs.existsSync(caminhoIndexRaiz)) {
    var htmlHome = fs.readFileSync(caminhoIndexRaiz, "utf8");
    verdadeiro("Home não referencia o piloto Fase 7C", htmlHome.indexOf("piloto-snapshot-dte") === -1 && htmlHome.indexOf("engenharia-operacional/piloto-snapshot") === -1);
  }
  var caminhoPainelEngenharia = path.join(raiz, "engenharia-operacional/index.html");
  if (fs.existsSync(caminhoPainelEngenharia)) {
    var htmlPainel = fs.readFileSync(caminhoPainelEngenharia, "utf8");
    verdadeiro("painel executivo de Engenharia/DTE não referencia o piloto Fase 7C", htmlPainel.indexOf("piloto-snapshot-dte") === -1 && htmlPainel.indexOf("piloto-snapshot") === -1);
  }

  /* ================================================================
     [cenário 16] avisos obrigatórios visíveis na página
     ================================================================ */
  grupo("Fase 7C · avisos obrigatórios (cenário 16)");

  verdadeiro("aviso de cópia técnica presente no HTML", htmlPiloto.indexOf(PILOTO.AVISO_COPIA_TECNICA) !== -1);
  verdadeiro("aviso de não fechamento mensal presente no HTML", htmlPiloto.indexOf(PILOTO.AVISO_NAO_FECHAMENTO) !== -1);
  verdadeiro("aviso de piloto isolado presente no HTML", htmlPiloto.indexOf(PILOTO.AVISO_PILOTO_ISOLADO) !== -1);

}).then(function () {

  /* ================================================================
     [cenário 20] preservação integral — nenhum arquivo compartilhado
     foi alterado por este teste (hash antes × depois).
     ================================================================ */
  grupo("Fase 7C · preservação integral dos arquivos compartilhados (cenário 20)");

  ARQUIVOS_COMPARTILHADOS_PROTEGIDOS.forEach(function (f) {
    var depois = sha256DoArquivo(f);
    verdadeiro("arquivo preservado: " + path.relative(raiz, f), depois === HASHES_ANTES[f]);
  });
  caso("nenhuma chamada real a fs.writeFileSync durante a suíte", ESPIAO_FS.chamadasWriteFileSync, 0);
  caso("nenhuma chamada real a fetch durante a suíte", ESPIAO_FETCH.chamadasReais, 0);

}).then(function () {

  /* ================================================================
     RELATÓRIO FINAL
     ================================================================ */
  console.log("\n============================================================");
  console.log("HUB COMLURB · Fase 7C · relatório de testes");
  console.log("============================================================\n");

  grupos.forEach(function (g) {
    var passG = g.casos.filter(function (c) { return c.ok; }).length;
    var failG = g.casos.length - passG;
    console.log((failG === 0 ? "[OK]  " : "[FAIL]") + " " + g.nome + " — " + passG + "/" + g.casos.length);
    g.casos.forEach(function (c) {
      if (!c.ok) {
        console.log("        FALHOU: " + c.nome);
        console.log("          obtido:   " + JSON.stringify(c.obtido));
        console.log("          esperado: " + JSON.stringify(c.esperado));
      }
    });
  });

  console.log("\n------------------------------------------------------------");
  console.log("TOTAL Fase 7C: " + totais.pass + " aprovados, " + totais.fail + " reprovados, " + (totais.pass + totais.fail) + " no total.");
  console.log("------------------------------------------------------------\n");

  if (totais.fail > 0) process.exitCode = 1;
});

}

rodar().catch(function (e) {
  console.error("ERRO FATAL NA SUÍTE DE TESTES:", e && e.stack ? e.stack : e);
  process.exit(1);
});
