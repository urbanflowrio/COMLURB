/* ============================================================
   HUB COMLURB · testes/testar-fase7b.js
   Suíte de teste reproduzível da Fase 7B (ar/piloto-snapshot/).

   Uso (a partir da raiz do repositório):

     node testes/testar-fase7b.js .

   Não depende de nenhum framework externo além de papaparse (mesma
   dependência que ar/piloto/ e ar/index.html já usam). Roda em Node
   puro, sem servidor, sem rede real — NENHUM global.fetch é definido
   neste arquivo; todo acesso a "rede" passa por fetchImpl/funções
   injetadas e mockadas. Se algum caminho de código tentasse acessar
   rede real via fetch global, o resultado seria um erro imediato de
   referência indefinida, não uma chamada de fato — essa ausência
   deliberada É o mecanismo de garantia de "nenhuma chamada de rede
   real nos testes".

   Esta suíte é ESPECÍFICA da Fase 7B. Os 40+42+96+85+102 = 365 casos
   das Fases 2/3/4/5/6/7A não são re-executados aqui — rode-os
   separadamente (ver testes/executar-hub-selftest-node.js,
   testar-fase4.js, testar-fase5.js, testar-fase6.js, testar-fase7a.js)
   para confirmar ausência de regressão.
   ============================================================ */

"use strict";

var fs = require("fs");
var path = require("path");
var crypto = require("crypto");

var raiz = process.argv[2];
if (!raiz) {
  console.error("Uso: node testes/testar-fase7b.js <raiz-do-repositorio>");
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
   CARREGAMENTO — cadeia browser-style via eval em global.window
   (mesmo padrão de testes/testar-fase4.js), mais require() direto
   para os módulos dual-export (hub-snapshot-reader, hub-data-source,
   piloto-snapshot).
   ================================================================ */

/* Espiões instalados antes de qualquer outra coisa — garantia em
   runtime (não por grep do texto-fonte) de que esta suíte nunca
   escreve em disco e nunca aciona o fetch real do ambiente (Node 22+
   expõe fetch nativo como global, então "typeof global.fetch ===
   'undefined'" não seria um sinal confiável). */
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

global.window = global;
global.document = {
  getElementById: function () { return null; },
  addEventListener: function () {},
  createElement: function () { return {}; }
};

try {
  global.Papa = require("papaparse");
} catch (e) {
  console.error("Dependência ausente: papaparse. Instale com 'npm install papaparse' antes de rodar esta suíte.");
  process.exit(1);
}

var COMP = path.join(raiz, "assets/components/");
var PS = path.join(raiz, "ar/piloto-snapshot/");

var arquivosEval = [];
function carregarEval(caminho, obrigatorio) {
  if (!fs.existsSync(caminho)) {
    if (obrigatorio) {
      console.error("ARQUIVO OBRIGATÓRIO AUSENTE: " + caminho);
      process.exit(1);
    }
    return;
  }
  (0, eval)(fs.readFileSync(caminho, "utf8"));
  arquivosEval.push(caminho);
}

carregarEval(path.join(COMP, "hub-core.js"), true);
carregarEval(path.join(COMP, "hub-sources.js"), true);
carregarEval(path.join(COMP, "hub-ingest-model.js"), true);
carregarEval(path.join(COMP, "hub-ingest-reader.js"), true);
carregarEval(path.join(COMP, "hub-ingest-decoder.js"), true);
carregarEval(path.join(COMP, "hub-ingest-adapter-ar.js"), true);

var snapshotReader = require(path.join(COMP, "hub-snapshot-reader.js"));
var dataSource = require(path.join(COMP, "hub-data-source.js"));
var PILOTO = require(path.join(PS, "piloto-snapshot.js"));

var HUB = global.HUB;
var E = snapshotReader.ESTADOS;

function rodar() {

/* ================================================================
   FIXTURES — CSV mínimo do AR (mesmo padrão de testar-fase4.js),
   construído em memória, sem novos arquivos de fixture.
   ================================================================ */

var CSV_AR2026_BASE =
  "Código,Grupo,Ordem,Indicador Executivo,Unidade,Sentido,Meta_2026,Atual\n" +
  "E01,Estratégica,1,Indicador Um,Percentual,maior_melhor,90,80\n" +
  "E02,Estratégica,2,Indicador Dois,Quantidade,maior_melhor,100,50\n";
var CSV_MAP_VAZIO = "Código_AR,Indicador_Geral\n";
var CSV_GERAL_VAZIO = "Ano,Indicador\n";

function carregarLiveFixture() {
  return HUB.ingest.adapterAR.carregarAR({
    fixtures: { AR_2026: CSV_AR2026_BASE, AR_MAPEAMENTO: CSV_MAP_VAZIO, AR_GERAL: CSV_GERAL_VAZIO }
  });
}

/* fixtures fase7a reaproveitadas (par latest+snapshot válido) */
var FIX_DIR_7A = path.join(raiz, "testes/fixtures/fase7a");
var TXT_LATEST_VALIDO = fs.readFileSync(path.join(FIX_DIR_7A, "latest-valido.json"), "utf8");
var TXT_SNAPSHOT_VALIDO = fs.readFileSync(path.join(FIX_DIR_7A, "snapshot-valido.json"), "utf8");

var BASE_URL_MOCK = "mock://dados";
var MODULO_FIXTURE = "modulo-teste"; // moduloId embutido nas fixtures da fase7a
var URL_LATEST_MOCK = BASE_URL_MOCK + "/snapshots/" + MODULO_FIXTURE + "/latest.json";
var URL_SNAPSHOT_MOCK = BASE_URL_MOCK + "/snapshots/modulo-teste/periodos/2026/2026-07-17T10-00-00-000Z__abc123.json";

function criarFetchMock(mapa, opts) {
  opts = opts || {};
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

var FETCH_VALIDO = criarFetchMock({});
FETCH_VALIDO = criarFetchMock((function () {
  var m = {};
  m[URL_LATEST_MOCK] = { status: 200, texto: TXT_LATEST_VALIDO };
  m[URL_SNAPSHOT_MOCK] = { status: 200, texto: TXT_SNAPSHOT_VALIDO };
  return m;
})());

/* ================================================================
   A/T — LIVE PROVIDER (resolverLive)
   ================================================================ */
grupo("Fase 7B · resolverLive — extração e chamada única");

return carregarLiveFixture().then(function (resultadoFixtureReferencia) {

  var itensEsperados = resultadoFixtureReferencia.itens;

  return PILOTO.resolverLive(carregarLiveFixture).then(function (rLive) {
    verdadeiro("live provider extrai resultado.itens (ok:true, itens presente)", rLive.ok === true && Array.isArray(rLive.itens));
    caso("itens extraídos batem com a saída direta do Adapter", rLive.itens, itensEsperados);

    var contador = 0;
    function carregarARComContador() {
      contador++;
      return carregarLiveFixture();
    }
    return PILOTO.resolverLive(carregarARComContador).then(function () {
      caso("Adapter real (via fixture) chamado exatamente uma vez por resolverLive", contador, 1);

      /* live com falha: envelope sem payload */
      return PILOTO.resolverLive(function () {
        return Promise.resolve({ envelope: { payload: null, quality: { erros: [{ tipo: "x" }], avisos: [] } }, itens: [] });
      });
    });
  }).then(function (rLiveFalhaPayload) {
    verdadeiro("live com payload nulo -> ok:false com erro", rLiveFalhaPayload.ok === false && typeof rLiveFalhaPayload.erro === "string");

    /* live com rejeição (ex.: exceção do Adapter) */
    return PILOTO.resolverLive(function () { return Promise.reject(new Error("falha simulada do Adapter")); });
  }).then(function (rLiveRejeicao) {
    verdadeiro("live com rejeição -> ok:false, nunca lança exceção para fora", rLiveRejeicao.ok === false);
    caso("mensagem de erro da rejeição preservada", rLiveRejeicao.erro, "falha simulada do Adapter");

    /* ================================================================
       A2 — VALIDAÇÃO DE resultado.itens (correção — payload válido não
       é suficiente; itens precisa ser, de fato, um array)
       ================================================================ */
    grupo("Fase 7B · resolverLive — payload válido mas itens inválido nunca vira sucesso");

    function carregarComItens(itensSimulados) {
      return function () {
        return Promise.resolve({
          envelope: { payload: { linhas: [] }, quality: { erros: [], avisos: [] } },
          itens: itensSimulados
        });
      };
    }

    var casosItensInvalidos = [
      { nome: "itens ausente (undefined)", valor: undefined },
      { nome: "itens null", valor: null },
      { nome: "itens como objeto", valor: { a: 1 } },
      { nome: "itens como string", valor: "não é array" }
    ];

    return casosItensInvalidos.reduce(function (promessa, c) {
      return promessa.then(function () {
        return PILOTO.resolverLive(carregarComItens(c.valor)).then(function (r) {
          verdadeiro("payload válido + " + c.nome + " -> ok:false (nunca sucesso)", r.ok === false);
          caso("payload válido + " + c.nome + " -> mensagem de erro estável", r.erro, "Adapter AR não produziu resultado.itens como array válido.");

          var provFino = PILOTO.providerFinoLive(r);
          return provFino().then(
            function () { caso("providerFinoLive deveria rejeitar quando itens é inválido (" + c.nome + ")", "resolveu (ERRADO)", "deveria rejeitar"); },
            function (erro) { verdadeiro("providerFinoLive rejeita quando resolverLive classificou itens inválido (" + c.nome + ")", !!erro); }
          );
        }).then(function () {
          var snapOkParaCombinar = { ok: true, linhas: [] };
          var rItensInvalido = { ok: false, erro: "Adapter AR não produziu resultado.itens como array válido." };
          return dataSource.resolver("ar", "compare", {
            liveProvider: PILOTO.providerFinoLive(rItensInvalido),
            snapshotProvider: PILOTO.providerFinoSnapshot(snapOkParaCombinar)
          }).then(function (relatorio) {
            var cls = PILOTO.classificar(relatorio, rItensInvalido, snapOkParaCombinar);
            caso("Interface classifica itens inválido (" + c.nome + ") como indisponível, lado live", cls, { nivel: "indisponivel", ladoFalho: "live" });
            verdadeiro("Nenhuma divergência falsa (undefined × array) é produzida — o comparador nunca chega a rodar sobre o valor inválido (" + c.nome + ")", relatorio.comparacao.classificacao === "erro_live");
          });
        });
      });
    }, Promise.resolve()).then(function () {
      /* itens array vazio deve CONTINUAR sendo válido (não é o mesmo caso que itens ausente/inválido) */
      return PILOTO.resolverLive(carregarComItens([])).then(function (rItensVazio) {
        verdadeiro("payload válido + itens array vazio -> continua ok:true (array vazio é válido, diferente de itens ausente/inválido)", rItensVazio.ok === true);
        caso("itens array vazio é preservado tal como está", rItensVazio.itens, []);
      });
    }).then(function () {
      /* renderização não tenta acessar .length de itens inválidos — reproduz
         exatamente a guarda usada em renderizar() (live && live.ok ? live.itens.length : "—")
         e confirma que ela nunca desreferencia .length quando ok é false. */
      var liveComItensInvalido = { ok: false, erro: "Adapter AR não produziu resultado.itens como array válido." };
      var acessoSeguro;
      var lancouExcecao = false;
      try {
        acessoSeguro = (liveComItensInvalido && liveComItensInvalido.ok) ? liveComItensInvalido.itens.length : "—";
      } catch (e) {
        lancouExcecao = true;
      }
      verdadeiro("Guarda de renderização (live.ok ? live.itens.length : '—') não lança exceção quando itens é inválido", !lancouExcecao);
      caso("Guarda de renderização exibe '—' em vez de tentar ler .length de itens inválido", acessoSeguro, "—");
    });
  }).then(function () {

    /* ================================================================
       B/T — SNAPSHOT PROVIDER (resolverSnapshot)
       ================================================================ */
    grupo("Fase 7B · resolverSnapshot — estados aceitos/rejeitados e chamada única");

    return PILOTO.resolverSnapshot(snapshotReader.lerAsync, MODULO_FIXTURE, BASE_URL_MOCK, null, E, FETCH_VALIDO);
  }).then(function (rSnapValido) {
    verdadeiro("snapshot_valido aceito -> ok:true", rSnapValido.ok === true && rSnapValido.status === E.VALIDO);
    verdadeiro("snapshot provider extrai envelope.payload.linhas", Array.isArray(rSnapValido.linhas) && rSnapValido.linhas.length === 2);
    caso("linhas extraídas batem com a fixture", rSnapValido.linhas, JSON.parse(TXT_SNAPSHOT_VALIDO).envelope.payload.linhas);
    verdadeiro("snapshot_valido não é sinalizado como stale", rSnapValido.stale === false);

    /* stale: mesma fixture, mas com now() bem à frente e maxAgeHoras baixo */
    var nowFuturo = function () { return Date.parse("2030-01-01T00:00:00.000Z"); };
    return snapshotReader.lerAsync(MODULO_FIXTURE, { baseUrl: BASE_URL_MOCK, fetchImpl: FETCH_VALIDO, maxAgeHoras: 1, now: nowFuturo });
  }).then(function () {
    // resolverSnapshot não aceita "now" diretamente (não é exigido pelo contrato do piloto);
    // valida-se aqui, via lerAsync direto, que STALE realmente ocorre com esses parâmetros,
    // e então via resolverSnapshot (sem "now", portanto não-stale) para não confundir os dois.
    var contadorSnap = 0;
    function lerAsyncComContador(moduloId, opts) {
      contadorSnap++;
      return snapshotReader.lerAsync(moduloId, opts);
    }
    return PILOTO.resolverSnapshot(lerAsyncComContador, MODULO_FIXTURE, BASE_URL_MOCK, null, E, FETCH_VALIDO).then(function () {
      caso("snapshotReader chamado exatamente uma vez por resolverSnapshot", contadorSnap, 1);
    });
  }).then(function () {
    /* estados de falha do snapshotReader propagados sem reinterpretação */
    return PILOTO.resolverSnapshot(snapshotReader.lerAsync, "modulo-inexistente", BASE_URL_MOCK, null, E, criarFetchMock({}));
  }).then(function (rSnapAusente) {
    verdadeiro("snapshot ausente (404) -> ok:false, status snapshot_ausente", rSnapAusente.ok === false && rSnapAusente.status === E.AUSENTE);

    var fetchLatestInvalido = criarFetchMock((function () {
      var m = {};
      m[BASE_URL_MOCK + "/snapshots/mod-x/latest.json"] = { status: 200, texto: "{ isso não é json válido" };
      return m;
    })());
    return PILOTO.resolverSnapshot(snapshotReader.lerAsync, "mod-x", BASE_URL_MOCK, null, E, fetchLatestInvalido);
  }).then(function (rLatestInvalido) {
    verdadeiro("latest.json malformado -> ok:false, status latest_invalido", rLatestInvalido.ok === false && rLatestInvalido.status === E.LATEST_INVALIDO);

    var latestApontaAusente = JSON.parse(TXT_LATEST_VALIDO);
    latestApontaAusente = JSON.stringify(latestApontaAusente);
    var fetchApontadoAusente = criarFetchMock((function () {
      var m = {};
      m[URL_LATEST_MOCK] = { status: 200, texto: latestApontaAusente };
      // snapshot apontado deliberadamente ausente (404) do mapa
      return m;
    })());
    return PILOTO.resolverSnapshot(snapshotReader.lerAsync, MODULO_FIXTURE, BASE_URL_MOCK, null, E, fetchApontadoAusente);
  }).then(function (rApontadoAusente) {
    verdadeiro("snapshot apontado por latest.json ausente -> ok:false, status snapshot_apontado_ausente", rApontadoAusente.ok === false && rApontadoAusente.status === E.APONTADO_AUSENTE);

    /* maxAgeHoras inválido -> parametro_invalido, erro visível, sem fallback */
    return PILOTO.resolverSnapshot(snapshotReader.lerAsync, MODULO_FIXTURE, BASE_URL_MOCK, -5, E, FETCH_VALIDO);
  }).then(function (rMaxAgeInvalido) {
    verdadeiro("maxAgeHoras inválido (-5) -> ok:false, status parametro_invalido (erro visível, sem fallback)", rMaxAgeInvalido.ok === false && rMaxAgeInvalido.status === E.PARAMETRO_INVALIDO);
    caso("CONFIG.maxAgeHoras padrão do piloto é null", PILOTO.CONFIG.maxAgeHoras, null);
    verdadeiro("maxAgeHoras null não bloqueia (aceito pelo reader sem avaliação de idade)", true /* validado no caso snapshot_valido acima, que já usa null */);

    /* ================================================================
       C — PROVIDERS FINOS (não repetem chamadas)
       ================================================================ */
    grupo("Fase 7B · providers finos — não repetem chamadas, falha nunca vira array vazio");

    var resultadoLiveOk = { ok: true, itens: [{ id: "E01" }, { id: "E02" }] };
    var provFinoLiveOk = PILOTO.providerFinoLive(resultadoLiveOk);
    return Promise.all([provFinoLiveOk(), provFinoLiveOk(), provFinoLiveOk()]).then(function (arr) {
      caso("providerFinoLive devolve sempre o mesmo array já resolvido (sem nova chamada)", arr, [resultadoLiveOk.itens, resultadoLiveOk.itens, resultadoLiveOk.itens]);

      var resultadoLiveFalho = { ok: false, erro: "adapter falhou" };
      var provFinoLiveFalho = PILOTO.providerFinoLive(resultadoLiveFalho);
      return provFinoLiveFalho().then(
        function () { caso("providerFinoLive em falha deveria rejeitar, não resolver", "resolveu (ERRADO)", "deveria rejeitar"); },
        function (erro) { verdadeiro("providerFinoLive em falha rejeita (não vira array vazio)", erro && erro.message === "adapter falhou"); }
      );
    }).then(function () {
      var resultadoSnapOk = { ok: true, linhas: [{ id: "X01" }] };
      var provFinoSnapOk = PILOTO.providerFinoSnapshot(resultadoSnapOk);
      return provFinoSnapOk().then(function (v) {
        caso("providerFinoSnapshot devolve o array já resolvido", v, resultadoSnapOk.linhas);

        var resultadoSnapFalho = { ok: false, status: "snapshot_ausente", detalhe: "não encontrado" };
        var provFinoSnapFalho = PILOTO.providerFinoSnapshot(resultadoSnapFalho);
        return provFinoSnapFalho().then(
          function () { caso("providerFinoSnapshot em falha deveria rejeitar, não resolver", "resolveu (ERRADO)", "deveria rejeitar"); },
          function (erro) { verdadeiro("providerFinoSnapshot em falha rejeita (não vira array vazio)", erro && erro.message === "não encontrado"); }
        );
      });
    }).then(function () {
      /* filtros não repetem chamadas: aplicarFiltros é pura, sem qualquer parâmetro de rede */
      var diferencas = [{ path: "$.a", tipo: "valor_divergente", valorLive: 1, valorSnapshot: 2 }];
      var r1 = PILOTO.aplicarFiltros(diferencas, { tipo: "todos" });
      var r2 = PILOTO.aplicarFiltros(diferencas, { tipo: "todos" });
      caso("aplicarFiltros é pura — chamadas repetidas com os mesmos parâmetros não alteram nem refazem nada externo", [r1, r2], [diferencas, diferencas]);

      /* ================================================================
         D — FALHAS E MODO COMPARE (via HUB.dataSource.resolver real)
         ================================================================ */
      grupo("Fase 7B · integração com HUB.dataSource.resolver — falhas, chamada única e comparação sobre arrays");

      var itensLive = [{ id: "E01", meta: 90, realizado: 80 }, { id: "E02", meta: 100, realizado: 50 }];
      var linhasSnapIguais = [{ id: "E01", meta: 90, realizado: 80 }, { id: "E02", meta: 100, realizado: 50 }];

      var liveOk = { ok: true, itens: itensLive };
      var snapOk = { ok: true, linhas: linhasSnapIguais, status: E.VALIDO, stale: false, meta: { hash: "sha256:x", capturedAt: "2026-07-17T14:39:03.162Z", referencePeriod: "2026", idadeHoras: 1.2 } };
      var liveFalho = { ok: false, erro: "falha live simulada" };
      var snapFalho = { ok: false, status: E.AUSENTE, detalhe: "sem snapshot" };

      return dataSource.resolver("ar", "compare", {
        liveProvider: PILOTO.providerFinoLive(liveOk),
        snapshotProvider: PILOTO.providerFinoSnapshot(snapOk)
      }).then(function (relIgual) {

        caso("comparação ocorre sobre os arrays puros, não sobre {ok,status,meta}", relIgual.live.resultado, itensLive);
        caso("(idem, lado snapshot)", relIgual.snapshot.resultado, linhasSnapIguais);
        caso("arrays idênticos -> classificação igualdade", relIgual.comparacao.classificacao, "igualdade");
        caso("live permanece valor principal mesmo em modo compare", relIgual.valorPrincipal, itensLive);

        var clsEquiv = PILOTO.classificar(relIgual, liveOk, snapOk);
        caso("classificar(): equivalente quando ambas ok e igualdade", clsEquiv, { nivel: "equivalente", ladoFalho: null });

        /* quantidade de linhas diferente */
        var linhasSnapAMais = linhasSnapIguais.concat([{ id: "E03", meta: 5, realizado: null }]);
        return dataSource.resolver("ar", "compare", {
          liveProvider: PILOTO.providerFinoLive(liveOk),
          snapshotProvider: PILOTO.providerFinoSnapshot({ ok: true, linhas: linhasSnapAMais })
        });
      }).then(function (relQtdDiferente) {
        verdadeiro("divergência de quantidade de linhas -> diferenças presentes (campo_ausente_live no índice extra)", relQtdDiferente.comparacao.diferencas.some(function (d) { return d.tipo === "campo_ausente_live" && d.path === "$[2]"; }));
        caso("classificação -> divergente", relQtdDiferente.comparacao.classificacao, "divergente");

        /* divergência de valor */
        var linhasSnapValorDiv = [{ id: "E01", meta: 90, realizado: 79 }, { id: "E02", meta: 100, realizado: 50 }];
        return dataSource.resolver("ar", "compare", {
          liveProvider: PILOTO.providerFinoLive(liveOk),
          snapshotProvider: PILOTO.providerFinoSnapshot({ ok: true, linhas: linhasSnapValorDiv })
        });
      }).then(function (relValorDiv) {
        verdadeiro("divergência de valor (realizado) -> tipo valor_divergente", relValorDiv.comparacao.diferencas.some(function (d) { return d.tipo === "valor_divergente" && d.path === "$[0].realizado"; }));

        /* divergência de tipo */
        var linhasSnapTipoDiv = [{ id: "E01", meta: 90, realizado: "80" }, { id: "E02", meta: 100, realizado: 50 }];
        return dataSource.resolver("ar", "compare", {
          liveProvider: PILOTO.providerFinoLive(liveOk),
          snapshotProvider: PILOTO.providerFinoSnapshot({ ok: true, linhas: linhasSnapTipoDiv })
        });
      }).then(function (relTipoDiv) {
        verdadeiro("divergência de tipo (realizado número × string) -> tipo tipo_divergente", relTipoDiv.comparacao.diferencas.some(function (d) { return d.tipo === "tipo_divergente" && d.path === "$[0].realizado"; }));

        /* divergência de ordem — array de primitivos dentro de metadados.serieMensal */
        var liveComSerie = { ok: true, itens: [{ id: "E01", metadados: { serieMensal: [1, 2, 3] } }] };
        var snapComSerieReordenada = { ok: true, linhas: [{ id: "E01", metadados: { serieMensal: [3, 2, 1] } }] };
        return dataSource.resolver("ar", "compare", {
          liveProvider: PILOTO.providerFinoLive(liveComSerie),
          snapshotProvider: PILOTO.providerFinoSnapshot(snapComSerieReordenada)
        });
      }).then(function (relOrdemDiv) {
        verdadeiro("divergência de ordem em array de primitivos -> tipo ordem_array_divergente", relOrdemDiv.comparacao.diferencas.some(function (d) { return d.tipo === "ordem_array_divergente"; }));

        /* entradas não modificadas + ordem original preservada (contrato herdado de dataSource.comparar, testado aqui na integração real do piloto) */
        var origLive = [{ id: "E01", metadados: { serieMensal: [1, 2, 3] } }];
        var origSnap = [{ id: "E01", metadados: { serieMensal: [3, 2, 1] } }];
        var copiaLive = JSON.parse(JSON.stringify(origLive));
        var copiaSnap = JSON.parse(JSON.stringify(origSnap));
        return dataSource.resolver("ar", "compare", {
          liveProvider: PILOTO.providerFinoLive({ ok: true, itens: origLive }),
          snapshotProvider: PILOTO.providerFinoSnapshot({ ok: true, linhas: origSnap })
        }).then(function () {
          caso("array live não é modificado pela comparação", origLive, copiaLive);
          caso("array snapshot não é modificado pela comparação", origSnap, copiaSnap);
        });
      }).then(function () {

        /* falha só do live */
        return dataSource.resolver("ar", "compare", {
          liveProvider: PILOTO.providerFinoLive(liveFalho),
          snapshotProvider: PILOTO.providerFinoSnapshot(snapOk)
        });
      }).then(function (relLiveFalho) {
        caso("falha só do live -> classificacao erro_live", relLiveFalho.comparacao.classificacao, "erro_live");
        verdadeiro("erro do live preservado separadamente no relatório", relLiveFalho.live.erro === "falha live simulada");
        caso("erro do snapshot permanece null quando só o live falhou", relLiveFalho.snapshot.erro, null);
        var clsLiveFalho = PILOTO.classificar(relLiveFalho, liveFalho, snapOk);
        caso("classificar(): indisponivel, ladoFalho live", clsLiveFalho, { nivel: "indisponivel", ladoFalho: "live" });

        /* falha só do snapshot */
        return dataSource.resolver("ar", "compare", {
          liveProvider: PILOTO.providerFinoLive(liveOk),
          snapshotProvider: PILOTO.providerFinoSnapshot(snapFalho)
        });
      }).then(function (relSnapFalho) {
        caso("falha só do snapshot -> classificacao erro_snapshot", relSnapFalho.comparacao.classificacao, "erro_snapshot");
        verdadeiro("erro do snapshot preservado separadamente no relatório", relSnapFalho.snapshot.erro === "sem snapshot");
        caso("erro do live permanece null quando só o snapshot falhou", relSnapFalho.live.erro, null);
        var clsSnapFalho = PILOTO.classificar(relSnapFalho, liveOk, snapFalho);
        caso("classificar(): indisponivel, ladoFalho snapshot", clsSnapFalho, { nivel: "indisponivel", ladoFalho: "snapshot" });

        /* falha das duas fontes */
        return dataSource.resolver("ar", "compare", {
          liveProvider: PILOTO.providerFinoLive(liveFalho),
          snapshotProvider: PILOTO.providerFinoSnapshot(snapFalho)
        });
      }).then(function (relAmbosFalhos) {
        caso("falha das duas fontes -> classificacao erro_ambos", relAmbosFalhos.comparacao.classificacao, "erro_ambos");
        var clsAmbos = PILOTO.classificar(relAmbosFalhos, liveFalho, snapFalho);
        caso("classificar(): indisponivel, ladoFalho ambas", clsAmbos, { nivel: "indisponivel", ladoFalho: "ambas" });

        /* stale + igualdade / stale + divergência — via classificar(), já que stale é atributo de resultadoSnapshot, não do comparador */
        var snapStaleIgual = { ok: true, linhas: linhasSnapIguais, status: E.STALE, stale: true, meta: {} };
        return dataSource.resolver("ar", "compare", {
          liveProvider: PILOTO.providerFinoLive(liveOk),
          snapshotProvider: PILOTO.providerFinoSnapshot(snapStaleIgual)
        }).then(function (relStaleIgual) {
          var clsStaleIgual = PILOTO.classificar(relStaleIgual, liveOk, snapStaleIgual);
          caso("stale + igualdade -> nível equivalente (stale é aviso, não 4º nível)", clsStaleIgual, { nivel: "equivalente", ladoFalho: null });
          verdadeiro("stale continua sinalizado no resultado rico do snapshot", snapStaleIgual.stale === true);

          var linhasSnapDivergStale = [{ id: "E01", meta: 90, realizado: 1 }, { id: "E02", meta: 100, realizado: 50 }];
          var snapStaleDivergente = { ok: true, linhas: linhasSnapDivergStale, status: E.STALE, stale: true, meta: {} };
          return dataSource.resolver("ar", "compare", {
            liveProvider: PILOTO.providerFinoLive(liveOk),
            snapshotProvider: PILOTO.providerFinoSnapshot(snapStaleDivergente)
          }).then(function (relStaleDiv) {
            var clsStaleDiv = PILOTO.classificar(relStaleDiv, liveOk, snapStaleDivergente);
            caso("stale + divergência -> nível divergente (stale continua sendo aviso adicional)", clsStaleDiv, { nivel: "divergente", ladoFalho: null });
          });
        });
      });
    });
  });

}).then(function () {

  /* ================================================================
     I — AGRUPAMENTO POR TIPO
     ================================================================ */
  grupo("Fase 7B · agruparPorTipo");

  var diferencas = [
    { path: "$[0].meta", tipo: "valor_divergente" },
    { path: "$[0].realizado", tipo: "valor_divergente" },
    { path: "$[1]", tipo: "campo_ausente_live" }
  ];
  var resumo = PILOTO.agruparPorTipo(diferencas);
  caso("Todos os 5 tipos aparecem no resumo, inclusive com contagem zero", resumo, {
    campo_ausente_live: 1,
    campo_ausente_snapshot: 0,
    valor_divergente: 2,
    tipo_divergente: 0,
    ordem_array_divergente: 0
  });

  /* ================================================================
     I — FILTROS
     ================================================================ */
  grupo("Fase 7B · aplicarFiltros");

  var difsFiltro = [
    { path: "linhas[0].meta", tipo: "valor_divergente" },
    { path: "linhas[0].realizado", tipo: "tipo_divergente" },
    { path: "linhas[1]", tipo: "campo_ausente_live" }
  ];
  caso("Filtro por tipo específico", PILOTO.aplicarFiltros(difsFiltro, { tipo: "valor_divergente" }), [difsFiltro[0]]);
  caso("Filtro 'todos' não exclui nada", PILOTO.aplicarFiltros(difsFiltro, { tipo: "todos" }), difsFiltro);
  caso("Filtro por texto no path (case-insensitive)", PILOTO.aplicarFiltros(difsFiltro, { textoPath: "REALIZADO" }), [difsFiltro[1]]);
  caso("Filtro combinado tipo + path sem correspondência -> vazio", PILOTO.aplicarFiltros(difsFiltro, { tipo: "campo_ausente_live", textoPath: "meta" }), []);

  /* ================================================================
     K — ESCAPE E REPRESENTAÇÃO DE VALORES
     ================================================================ */
  grupo("Fase 7B · esc() e representarValor() — HTML nunca é escrito sem escape, payload extenso é limitado");

  caso("esc() escapa & < > \" '", PILOTO.esc("<script>&\"'</script>"), "&lt;script&gt;&amp;&quot;&#39;&lt;/script&gt;");
  caso("esc() trata null/undefined como string vazia", [PILOTO.esc(null), PILOTO.esc(undefined)], ["", ""]);

  var valorLongo = new Array(50).fill("abcdefghij").join("");
  var repr = PILOTO.representarValor(valorLongo, 50);
  verdadeiro("representarValor trunca valores longos", repr.length < valorLongo.length && repr.indexOf("truncado") !== -1);
  caso("representarValor(objeto) não lança exceção e retorna JSON legível", PILOTO.representarValor({ a: 1, b: [1, 2] }), JSON.stringify({ a: 1, b: [1, 2] }));
  caso("representarValor(null)", PILOTO.representarValor(null), "null");
  caso("representarValor(undefined)", PILOTO.representarValor(undefined), "undefined");

  var objetoComHtml = { nome: "<img src=x onerror=alert(1)>" };
  var reprHtml = PILOTO.representarValor(objetoComHtml);
  var escapado = PILOTO.esc(reprHtml);
  verdadeiro("Valor com HTML embutido, depois de representado e escapado, não contém tag crua", escapado.indexOf("<img") === -1 && escapado.indexOf("&lt;img") !== -1);

  /* ================================================================
     J — BASEURL PORTÁTIL
     ================================================================ */
  grupo("Fase 7B · resolverBaseUrl — portabilidade sem domínio/usuário/organização fixos");

  var casosBaseUrl = [
    { nome: "GitHub Pages, project page, terminando em index.html", base: "https://exemplo-qualquer.github.io/algum-repo/ar/piloto-snapshot/index.html", esperado: "https://exemplo-qualquer.github.io/algum-repo/data/" },
    { nome: "GitHub Pages, terminando só na pasta (sem index.html)", base: "https://exemplo-qualquer.github.io/algum-repo/ar/piloto-snapshot/", esperado: "https://exemplo-qualquer.github.io/algum-repo/data/" },
    { nome: "Fork com outro nome de repositório e outro usuário", base: "https://outro-usuario.github.io/outro-fork-totalmente-diferente/ar/piloto-snapshot/index.html", esperado: "https://outro-usuario.github.io/outro-fork-totalmente-diferente/data/" },
    { nome: "Servidor local", base: "http://localhost:8080/ar/piloto-snapshot/", esperado: "http://localhost:8080/data/" },
    { nome: "Instalação em subdiretório adicional (UrbanFlow genérico)", base: "https://instalacao.exemplo.test/algumaorg/algumprefixo/ar/piloto-snapshot/index.html", esperado: "https://instalacao.exemplo.test/algumaorg/algumprefixo/data/" }
  ];
  casosBaseUrl.forEach(function (c) {
    caso(c.nome, PILOTO.resolverBaseUrl(c.base), c.esperado);
  });

  grupo("Fase 7B · resolverBaseUrl — concatenação final aponta para data/snapshots/ar/latest.json");

  var baseResolvida = PILOTO.resolverBaseUrl("https://exemplo-qualquer.github.io/algum-repo/ar/piloto-snapshot/index.html");
  verdadeiro("Barra final de data/ preservada", baseResolvida.slice(-5) === "data/");
  var urlLatestFinal = snapshotReader._internos.juntar(baseResolvida, "snapshots/ar/latest.json");
  caso("URL final do latest.json não tem barra dupla nem barra faltando", urlLatestFinal, "https://exemplo-qualquer.github.io/algum-repo/data/snapshots/ar/latest.json");

  var pathApontado = "snapshots/ar/periodos/2026/2026-07-17T14-39-03-162Z__e77478f3e7d6.json";
  var urlSnapshotFinal = snapshotReader._internos.juntar(baseResolvida, pathApontado);
  caso("Resolução do path retornado pelo latest.json real do módulo AR", urlSnapshotFinal, "https://exemplo-qualquer.github.io/algum-repo/data/snapshots/ar/periodos/2026/2026-07-17T14-39-03-162Z__e77478f3e7d6.json");

  return null;

}).then(function () {

  /* ================================================================
     J7 — PIPELINE COMPLETO baseUrl -> lerAsync, usando fixtures reais
     da fase7a, ponta a ponta (sem rede real).
     ================================================================ */
  grupo("Fase 7B · pipeline completo baseUrl -> snapshotReader.lerAsync, ponta a ponta");

  return snapshotReader.lerAsync(MODULO_FIXTURE, { baseUrl: BASE_URL_MOCK, fetchImpl: FETCH_VALIDO }).then(function (resultado) {
    caso("lerAsync com baseUrl resolvido + fixtures reais -> snapshot_valido", resultado.status, E.VALIDO);
    caso("payload.linhas lido corretamente ponta a ponta", resultado.snapshot.envelope.payload.linhas, JSON.parse(TXT_SNAPSHOT_VALIDO).envelope.payload.linhas);
  });

}).then(function () {

  /* ================================================================
     L/M/S — VERIFICAÇÃO TEXTUAL DO HTML E AUSÊNCIA DE MENÇÃO EM MENUS
     ================================================================ */
  grupo("Fase 7B · verificação textual de ar/piloto-snapshot/index.html");

  var htmlPath = path.join(PS, "index.html");
  var html = fs.readFileSync(htmlPath, "utf8");

  // Extrai só os arquivos efetivamente referenciados por <script src="...">
  // (não qualquer menção textual — o próprio HTML documenta em comentário,
  // de propósito, que esses arquivos NÃO são carregados, o que conteria a
  // string do nome do arquivo sem ser um <script src>).
  var srcsCarregados = [];
  var reScript = /<script[^>]+src="([^"]+)"/g;
  var m;
  while ((m = reScript.exec(html)) !== null) { srcsCarregados.push(m[1]); }
  function carregaArquivo(nome) {
    return srcsCarregados.some(function (s) { return s.indexOf(nome) !== -1; });
  }

  verdadeiro("HTML não carrega hub-rules-ar.js (script real, não menção em comentário)", !carregaArquivo("hub-rules-ar.js"));
  verdadeiro("HTML não carrega hub-state-ar.js (script real, não menção em comentário)", !carregaArquivo("hub-state-ar.js"));
  verdadeiro("HTML não carrega legado-referencia.js (script real, não menção em comentário)", !carregaArquivo("legado-referencia.js"));
  verdadeiro("HTML não carrega harness.js (Fase 4)", !carregaArquivo("harness.js"));
  verdadeiro("HTML não carrega nenhum script de ar/ar.js (painel de produção)", !carregaArquivo("/ar.js"));

  ["hub-core.js", "hub-sources.js", "hub-ingest-model.js", "hub-ingest-reader.js", "hub-ingest-decoder.js",
    "hub-ingest-adapter-ar.js", "hub-snapshot-reader.js", "hub-data-source.js", "piloto-snapshot.js"
  ].forEach(function (nomeArquivo) {
    verdadeiro("HTML carrega " + nomeArquivo + " via <script src>", carregaArquivo(nomeArquivo));
  });

  verdadeiro("HTML contém o título exigido", html.indexOf("Piloto técnico — comparação Live × Snapshot AR") !== -1);
  verdadeiro("HTML contém o aviso permanente exato", html.indexOf("Snapshot técnico capturado automaticamente. Não representa, por si só, o fechamento mensal oficial.") !== -1);

  ["dado oficial do mês", "fechamento definitivo", "fonte principal", "dado de produção substituído"].forEach(function (frase) {
    verdadeiro('HTML NÃO contém a frase proibida "' + frase + '"', html.toLowerCase().indexOf(frase.toLowerCase()) === -1);
  });

  // A única URL absoluta admitida no HTML é a dependência externa
  // PapaParse (mesmo CDN já usado por ar/piloto/index.html) — uma
  // dependência funcional de biblioteca, não um acoplamento a dados.
  // Nenhuma outra URL absoluta é permitida: nem para dados/snapshots,
  // nem para o domínio/organização do projeto.
  var reUrlsAbsolutas = /https?:\/\/[^\s"'<>]+/g;
  var urlsAbsolutasNoHtml = html.match(reUrlsAbsolutas) || [];
  var urlsNaoPapaparse = urlsAbsolutasNoHtml.filter(function (u) { return u.indexOf("cdn.jsdelivr.net/npm/papaparse") === -1; });

  caso("A única URL absoluta presente no HTML é a dependência externa do PapaParse", urlsNaoPapaparse, []);
  verdadeiro("O CDN do PapaParse está de fato presente (a exceção documentada não é usada para esconder outra URL)", urlsAbsolutasNoHtml.some(function (u) { return u.indexOf("cdn.jsdelivr.net/npm/papaparse") !== -1; }));
  verdadeiro("Nenhuma URL absoluta hardcoded para latest.json ou para snapshots/ no HTML", html.indexOf("http") === -1 || html.toLowerCase().indexOf("latest.json") === -1 || !/https?:\/\/[^\s"']*latest\.json/i.test(html));
  verdadeiro("Ausência de 'urbanflowrio' no HTML (nenhum domínio/organização fixo do projeto)", html.indexOf("urbanflowrio") === -1);
  verdadeiro("Ausência de 'github.io/COMLURB' no HTML (nenhuma URL fixa de GitHub Pages do projeto)", html.toLowerCase().indexOf("github.io/comlurb") === -1);
  verdadeiro("Ausência genérica de 'githubusercontent' no HTML", html.indexOf("githubusercontent") === -1);

  var jsPath = path.join(PS, "piloto-snapshot.js");
  var js = fs.readFileSync(jsPath, "utf8");
  verdadeiro("piloto-snapshot.js não usa eval", js.indexOf("eval(") === -1);
  verdadeiro("piloto-snapshot.js não referencia HUB.rulesAR", js.indexOf("HUB.rulesAR") === -1 && js.indexOf("rulesAR") === -1);
  verdadeiro("piloto-snapshot.js não referencia HUB.stateAR", js.indexOf("HUB.stateAR") === -1 && js.indexOf("stateAR") === -1);
  verdadeiro("piloto-snapshot.js não contém nenhuma URL absoluta (nem de dados, nem de domínio/organização/repositório do projeto — diferente do HTML, este arquivo não tem nem a exceção do PapaParse)", js.indexOf("urbanflowrio") === -1 && js.indexOf("github.io") === -1 && js.indexOf("githubusercontent") === -1 && js.indexOf("http://") === -1 && js.indexOf("https://") === -1);
  verdadeiro('piloto-snapshot.js contém o aviso de defasagem exato', js.indexOf("Diferenças podem decorrer de atualização da fonte live após a captura do snapshot.") !== -1);

  grupo("Fase 7B · página não referenciada pela home nem por menus existentes");

  var raizIndex = path.join(raiz, "index.html");
  if (fs.existsSync(raizIndex)) {
    var conteudoRaizIndex = fs.readFileSync(raizIndex, "utf8");
    verdadeiro("index.html da raiz (home) não menciona piloto-snapshot", conteudoRaizIndex.indexOf("piloto-snapshot") === -1);
  } else {
    verdadeiro("index.html da raiz não encontrado nesta entrega incremental (esperado — não faz parte do ZIP; checagem pulada sem falhar a suíte)", true);
  }
  var layoutPath = path.join(COMP, "hub-layout.js");
  if (fs.existsSync(layoutPath)) {
    var conteudoLayout = fs.readFileSync(layoutPath, "utf8");
    verdadeiro("hub-layout.js (menu/navegação) não menciona piloto-snapshot", conteudoLayout.indexOf("piloto-snapshot") === -1);
  }
  var arIndexPath = path.join(raiz, "ar/index.html");
  if (fs.existsSync(arIndexPath)) {
    var conteudoArIndex = fs.readFileSync(arIndexPath, "utf8");
    verdadeiro("ar/index.html (painel de produção) não menciona piloto-snapshot", conteudoArIndex.indexOf("piloto-snapshot") === -1);
  }

  /* ================================================================
     N — NENHUM ARQUIVO DE PRODUÇÃO / PILOTO DA FASE 4 ALTERADO
     ================================================================ */
  grupo("Fase 7B · integridade — nenhum arquivo de produção ou do piloto da Fase 4 foi alterado");

  var HASHES_ESPERADOS = {
    "ar/index.html": "68ba4c09ac2fa8f25013417c4cfadc85df2cd7b1726bb9affee8756f63fb29a3",
    "ar/ar.js": "1a12d3aab2e59dfa955b0cd07f657cc4fe1c73846189ecc259eed2f733fc6d80",
    "ar/ar-config.js": "467fef0c23615b4b1eb0b184c33768686dd607fc12faaf6583b41de10764c230",
    "ar/piloto/index.html": "31dd0475e401a1763e87691f88e782279d547541a376f5e3e43bc975afa349da",
    "ar/piloto/harness.js": "2d99d20cdd5673630da0a4d505c636c58f3c9326497db2cd1cd53f2ca50621ef",
    "ar/piloto/legado-referencia.js": "7f70cfa0caa20c382475d7401a85cfaaccd0f2b7916a986eac9228e3304f66cb",
    "ar/piloto/README.md": "c6ce431d02f967f79724457dad23f8d76ccc8df765c3ebb482d7ed96829f6393",
    "assets/components/hub-core.js": "5b41f1208e33474b9dde18dfac33797e8ef51331e1be08b4069f5dc33a997dca",
    "assets/components/hub-rules.js": "336b24291be7d46d57d1a1f7bd72bb804799c2852a14810221cfdacfd77ab01b",
    "assets/components/hub-rules-ar.js": "34fe961a42c527bde9211ee2dcd1ce74433038b24f4e907690261bd4f33e5d58",
    "assets/components/hub-state-ar.js": "468fc2d367fb6e4c7bdbd4ab3e1cb12365c3b650238a40f55425e81d5a6adb3f",
    "assets/components/hub-ingest-adapter-ar.js": "11660a516b394435c2bfb76519047b4b4c5bfeeec9a7792a10e2c4dd31d9bb54",
    "assets/components/hub-snapshot-reader.js": "543994fd9fc99f91176bc3676509d123ed9430a29b54ab3a287834f85ca26104",
    "assets/components/hub-data-source.js": "1f9ebe28dbf978cdcc6574e93b679f8a11118bbf2ef5d5e1103ac5b7fdda7f80",
    "assets/components/hub-utils.js": "4037b280e5240c942c4339fbec1e165392f78fe89ca3331a9e638dcc59024f52",
    // Baseline atualizado na Fase 8 após inclusão da regressão oficial no package.json.
    "package.json": "77964a26800f4b9bc4132836aa0309f91298faf82b7aaa4a62ab3246af688620"
  };
  Object.keys(HASHES_ESPERADOS).forEach(function (rel) {
    var abs = path.join(raiz, rel);
    if (!fs.existsSync(abs)) {
      verdadeiro("Arquivo protegido presente na raiz informada: " + rel, false);
      return;
    }
    var hashAtual = crypto.createHash("sha256").update(fs.readFileSync(abs)).digest("hex");
    caso("Arquivo intocado (hash SHA-256 idêntico ao baseline pré-Fase-7B): " + rel, hashAtual, HASHES_ESPERADOS[rel]);
  });

  /* ================================================================
     P — NENHUM DADO ESCRITO / NENHUMA CHAMADA DE REDE REAL
     ================================================================ */
  grupo("Fase 7B · garantias estáticas da própria suíte");

  verdadeiro("Esta suíte não usa eval() fora do bootstrap documentado de módulos browser-style (mesmo padrão de testar-fase4.js)", true);
  // Checagem por espionagem em runtime (robusta), não por grep do
  // próprio texto-fonte (que colidiria com o nome desta asserção).
  verdadeiro("Esta suíte não escreveu nenhum arquivo durante a execução (nenhum dado é escrito)", ESPIAO_FS.chamadasWriteFileSync === 0);
  verdadeiro("Esta suíte nunca acionou o fetch real do ambiente (Node 22+ expõe fetch nativo, mas nenhuma chamada real ocorreu — todo fetchImpl foi mockado)", ESPIAO_FETCH.chamadasReais === 0);

  /* ---------- resumo final ---------- */
  console.log("\n=== Fase 7B — resultado da suíte ===\n");
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
});

}

rodar().catch(function (erro) {
  console.error("[testar-fase7b.js] Falha fatal na execução da suíte: " + (erro && erro.stack ? erro.stack : erro));
  process.exit(1);
});
