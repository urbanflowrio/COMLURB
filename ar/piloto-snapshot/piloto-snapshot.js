/* ============================================================
   HUB COMLURB · ar/piloto-snapshot/piloto-snapshot.js
   Fase 7B (07/2026) · v1.0.0

   PILOTO TÉCNICO ISOLADO — comparação Live × Snapshot (AR),
   estritamente pré-regras.

   Chama, uma única vez por execução:
     - HUB.ingest.adapterAR.carregarAR({})   (fonte "live")
     - HUB.snapshotReader.lerAsync("ar", …)  (fonte "snapshot")

   NÃO aplica hub-rules-ar.js nem hub-state-ar.js (não são
   carregados por index.html; este arquivo também não os referencia).
   Não calcula status, atingimento, tendência ou bonificação. Compara
   apenas o dado canônico bruto: resultado.itens (live) contra
   envelope.payload.linhas (snapshot).

   PADRÃO DE MÓDULO (mesmo desvio deliberado e restrito de
   hub-snapshot-reader.js/hub-data-source.js — ver cabeçalho de
   ambos): dual export, sem eval, para ser testável em Node via
   require() direto. Em navegador, além de anexar-se a window, dispara
   sozinho a execução ao DOMContentLoaded.

   ESTRATÉGIA DE CHAMADA ÚNICA (documentada também no README):
   1. executar() chama resolverLive() e resolverSnapshot() uma vez
      cada, em paralelo, e guarda os resultados RICOS (com status,
      metadados, erro) em ESTADO.
   2. Os providers passados a HUB.dataSource.resolver são "finos":
      não chamam Adapter/Reader de novo — só reexpõem o array já
      resolvido em ESTADO (providerFinoLive/providerFinoSnapshot).
      Falha nunca vira array vazio: o provider fino rejeita a
      Promise, para HUB.dataSource.resolver registrar erro de fonte
      em vez de uma divergência falsa "array vazio × array cheio".
   3. renderizar()/os filtros da interface leem só ESTADO — nunca
      chamam executar(), resolverLive(), resolverSnapshot() ou
      HUB.dataSource.resolver de novo.
   ============================================================ */

(function (root, factory) {
  "use strict";
  var modulo = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = modulo;
  }
  if (typeof window !== "undefined") {
    window.HUB = window.HUB || {};
    window.PILOTO_SNAPSHOT_AR = modulo;
  }
  if (typeof window !== "undefined" && typeof document !== "undefined" && document.addEventListener) {
    modulo.iniciarNaPagina();
  }
})(typeof window !== "undefined" ? window : this, function () {
  "use strict";

  /* ================================================================
     CONFIGURAÇÃO LOCAL — explícita, restrita a este arquivo. Não
     escreve em nenhuma configuração global (HUB.config permanece
     intocado). Valor padrão: sem avaliação de idade (não bloqueia).
     ================================================================ */

  var CONFIG = {
    maxAgeHoras: null
  };

  var TIPOS_DIFERENCA = [
    "campo_ausente_live",
    "campo_ausente_snapshot",
    "valor_divergente",
    "tipo_divergente",
    "ordem_array_divergente"
  ];

  var AVISO_SNAPSHOT =
    "Snapshot técnico capturado automaticamente. Não representa, por si só, o fechamento mensal oficial.";

  var AVISO_DEFASAGEM =
    "Diferenças podem decorrer de atualização da fonte live após a captura do snapshot.";

  /* ================================================================
     HELPERS PUROS — escaping, truncamento, resolução de baseUrl.
     ================================================================ */

  function esc(v) {
    if (v === undefined || v === null) return "";
    return String(v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /**
   * Representação legível e limitada de um valor (string/número/
   * objeto/array/null/undefined) para exibição em tabela — nunca
   * lança exceção, sempre trunca acima de `limite` caracteres.
   */
  function representarValor(v, limite) {
    limite = (typeof limite === "number" && limite > 0) ? limite : 300;
    var texto;
    if (v === undefined) {
      texto = "undefined";
    } else if (v === null) {
      texto = "null";
    } else if (typeof v === "string") {
      texto = v;
    } else {
      try {
        texto = JSON.stringify(v);
      } catch (e) {
        texto = String(v);
      }
    }
    if (texto.length > limite) {
      texto = texto.slice(0, limite) + "… (" + texto.length + " caracteres, truncado para exibição)";
    }
    return texto;
  }

  /**
   * Resolução portátil de baseUrl a partir da URL atual do
   * documento — sem domínio, usuário, organização ou nome de
   * repositório fixos no código. Funciona tanto quando baseAtual
   * termina em ".../ar/piloto-snapshot/" quanto em
   * ".../ar/piloto-snapshot/index.html" (comportamento padrão de
   * resolução relativa do construtor URL). Barra final de "data/"
   * preservada deliberadamente (ver README).
   */
  function resolverBaseUrl(baseAtual) {
    return new URL("../../data/", baseAtual).href;
  }

  /* ================================================================
     LIVE — chamada única ao Adapter AR, sem aplicar regras.
     ================================================================ */

  /**
   * @param {Function} carregarARFn () => Promise<{envelope, itens, diagnosticoFontes}>
   *   — em produção, HUB.ingest.adapterAR.carregarAR vinculado com {}.
   *   Injetado (não lido de window.HUB aqui dentro) para permitir
   *   contar chamadas em teste e para não acoplar esta função a onde
   *   o HUB está pendurado.
   * @returns {Promise<Object>} nunca rejeita — falha vira {ok:false, erro}
   */
  function resolverLive(carregarARFn) {
    return Promise.resolve()
      .then(function () { return carregarARFn(); })
      .then(function (resultado) {
        var semPayload = !resultado || !resultado.envelope ||
          resultado.envelope.payload === null || resultado.envelope.payload === undefined;
        if (semPayload) {
          return {
            ok: false,
            erro: "Adapter AR não produziu payload válido (carga inválida — ver quality.erros do envelope).",
            quality: (resultado && resultado.envelope) ? resultado.envelope.quality : null
          };
        }
        // payload presente não é suficiente: resultado.itens precisa ser,
        // de fato, um array (ausente/null/undefined/objeto/string nunca
        // podem chegar ao provider fino como se fossem sucesso — isso
        // produziria comparação de algo-que-não-é-array contra array,
        // ou um erro tardio ao acessar .length na interface).
        if (!Array.isArray(resultado.itens)) {
          return {
            ok: false,
            erro: "Adapter AR não produziu resultado.itens como array válido.",
            quality: resultado.envelope.quality
          };
        }
        return {
          ok: true,
          itens: resultado.itens,
          quality: resultado.envelope.quality,
          diagnosticoFontes: resultado.diagnosticoFontes || null
        };
      })
      .catch(function (e) {
        return { ok: false, erro: (e && e.message) ? e.message : String(e) };
      });
  }

  /* ================================================================
     SNAPSHOT — chamada única ao snapshotReader, sem aplicar regras.
     stale é aceito (com aviso), nunca descartado nem convertido em
     erro; nunca aciona fallback para live.
     ================================================================ */

  /**
   * @param {Function} lerAsyncFn (moduloId, opts) => Promise<resultado> — HUB.snapshotReader.lerAsync
   * @param {string} moduloId — "ar" em produção; parametrizado para teste
   * @param {string} baseUrl
   * @param {number|null} maxAgeHoras — repassado tal como está; validação de valor inválido é
   *   responsabilidade do próprio hub-snapshot-reader.js (não duplicada aqui — ver README)
   * @param {Object} ESTADOS — HUB.snapshotReader.ESTADOS, injetado para não acoplar este módulo
   *   à posição exata do require/anexação
   * @param {Function} [fetchImpl] — opcional; omitido em navegador usa o padrão do próprio reader
   */
  function resolverSnapshot(lerAsyncFn, moduloId, baseUrl, maxAgeHoras, ESTADOS, fetchImpl) {
    var opts = { baseUrl: baseUrl, maxAgeHoras: maxAgeHoras };
    if (typeof fetchImpl === "function") opts.fetchImpl = fetchImpl;

    return Promise.resolve()
      .then(function () { return lerAsyncFn(moduloId, opts); })
      .then(function (resultado) {
        if (resultado.status === ESTADOS.VALIDO || resultado.status === ESTADOS.STALE) {
          return {
            ok: true,
            status: resultado.status,
            stale: resultado.status === ESTADOS.STALE,
            linhas: resultado.snapshot.envelope.payload.linhas,
            meta: resultado.meta,
            detalhe: resultado.detalhe
          };
        }
        return { ok: false, status: resultado.status, detalhe: resultado.detalhe };
      })
      .catch(function (e) {
        return { ok: false, status: "erro_inesperado_piloto", detalhe: (e && e.message) ? e.message : String(e) };
      });
  }

  /* ================================================================
     PROVIDERS FINOS — exigidos por HUB.dataSource.resolver. Não
     chamam Adapter/Reader de novo: só reexpõem o array já resolvido.
     Falha nunca vira array vazio — sempre rejeita, para
     HUB.dataSource.resolver classificar como erro de fonte, não como
     divergência de conteúdo.
     ================================================================ */

  function providerFinoLive(resultadoLive) {
    return function () {
      if (!resultadoLive || !resultadoLive.ok) {
        return Promise.reject(new Error((resultadoLive && resultadoLive.erro) || "live indisponível"));
      }
      return Promise.resolve(resultadoLive.itens);
    };
  }

  function providerFinoSnapshot(resultadoSnapshot) {
    return function () {
      if (!resultadoSnapshot || !resultadoSnapshot.ok) {
        var motivo = (resultadoSnapshot && (resultadoSnapshot.detalhe || resultadoSnapshot.status)) || "snapshot indisponível";
        return Promise.reject(new Error(String(motivo)));
      }
      return Promise.resolve(resultadoSnapshot.linhas);
    };
  }

  /* ================================================================
     CLASSIFICAÇÃO — exatamente três níveis (equivalente / divergente
     / indisponível). stale é um aviso adicional, nunca um quarto
     nível.
     ================================================================ */

  function classificar(relatorio, resultadoLive, resultadoSnapshot) {
    var cls = (relatorio && relatorio.comparacao) ? relatorio.comparacao.classificacao : null;

    var liveFalhou = !resultadoLive || !resultadoLive.ok;
    var snapshotFalhou = !resultadoSnapshot || !resultadoSnapshot.ok;

    if (cls === "erro_ambos" || (liveFalhou && snapshotFalhou)) {
      return { nivel: "indisponivel", ladoFalho: "ambas" };
    }
    if (cls === "erro_live" || liveFalhou) {
      return { nivel: "indisponivel", ladoFalho: "live" };
    }
    if (cls === "erro_snapshot" || snapshotFalhou) {
      return { nivel: "indisponivel", ladoFalho: "snapshot" };
    }
    if (cls === "igualdade") {
      return { nivel: "equivalente", ladoFalho: null };
    }
    return { nivel: "divergente", ladoFalho: null };
  }

  /* ================================================================
     AGRUPAMENTO E FILTROS — funções puras sobre o relatório já
     carregado; nunca disparam nova chamada de rede/provider.
     ================================================================ */

  function agruparPorTipo(diferencas) {
    var contagem = {};
    TIPOS_DIFERENCA.forEach(function (t) { contagem[t] = 0; });
    (diferencas || []).forEach(function (d) {
      contagem[d.tipo] = (contagem[d.tipo] || 0) + 1;
    });
    return contagem;
  }

  function aplicarFiltros(diferencas, filtros) {
    filtros = filtros || {};
    return (diferencas || []).filter(function (d) {
      if (filtros.tipo && filtros.tipo !== "todos" && d.tipo !== filtros.tipo) return false;
      if (filtros.textoPath) {
        var alvo = String(d.path || "").toLowerCase();
        if (alvo.indexOf(String(filtros.textoPath).toLowerCase()) === -1) return false;
      }
      return true;
    });
  }

  /* ================================================================
     INTEGRAÇÃO COM A PÁGINA REAL — só executa em navegador, só
     dispara ao DOMContentLoaded. ESTADO é preenchido uma única vez
     por carregamento de página.
     ================================================================ */

  var ESTADO = { live: null, snapshot: null, relatorio: null, classificacao: null, baseUrl: null };

  function executar() {
    var HUB = window.HUB;
    var baseUrl = resolverBaseUrl(document.baseURI);
    ESTADO.baseUrl = baseUrl;

    var pLive = resolverLive(function () { return HUB.ingest.adapterAR.carregarAR({}); });
    var pSnapshot = resolverSnapshot(
      HUB.snapshotReader.lerAsync,
      "ar",
      baseUrl,
      CONFIG.maxAgeHoras,
      HUB.snapshotReader.ESTADOS
    );

    return Promise.all([pLive, pSnapshot]).then(function (arr) {
      ESTADO.live = arr[0];
      ESTADO.snapshot = arr[1];

      return HUB.dataSource.resolver("ar", "compare", {
        liveProvider: providerFinoLive(ESTADO.live),
        snapshotProvider: providerFinoSnapshot(ESTADO.snapshot)
      });
    }).then(function (relatorio) {
      ESTADO.relatorio = relatorio;
      ESTADO.classificacao = classificar(relatorio, ESTADO.live, ESTADO.snapshot);
      renderizar({ tipo: "todos", textoPath: "", somenteDivergencias: true });
      ligarFiltros();
    });
  }

  function ligarFiltros() {
    var elTipo = document.getElementById("filtroTipo");
    var elPath = document.getElementById("filtroPath");
    var elSomente = document.getElementById("filtroSomenteDivergencias");

    function atualizar() {
      // Só lê ESTADO já carregado — nunca refaz executar()/resolver*().
      renderizar({
        tipo: elTipo ? elTipo.value : "todos",
        textoPath: elPath ? elPath.value : "",
        somenteDivergencias: elSomente ? elSomente.checked : true
      });
    }

    if (elTipo) elTipo.addEventListener("change", atualizar);
    if (elPath) elPath.addEventListener("input", atualizar);
    if (elSomente) elSomente.addEventListener("change", atualizar);
  }

  function badge(nivel) {
    var rotulo = { equivalente: "EQUIVALENTE", divergente: "DIVERGENTE", indisponivel: "INDISPONÍVEL" }[nivel] || nivel;
    var classe = { equivalente: "ok", divergente: "att", indisponivel: "crit" }[nivel] || "nd";
    return '<span class="badge ' + classe + '">' + esc(rotulo) + "</span>";
  }

  function renderizar(filtros) {
    var container = document.getElementById("relatorio");
    if (!container) return;

    var live = ESTADO.live, snap = ESTADO.snapshot, cls = ESTADO.classificacao;
    var diferencas = (ESTADO.relatorio && ESTADO.relatorio.comparacao) ? ESTADO.relatorio.comparacao.diferencas : [];
    var resumo = agruparPorTipo(diferencas);
    var filtradas = aplicarFiltros(diferencas, filtros);

    var html = "";

    html += '<div class="linhaStatus">' + badge(cls.nivel);
    if (snap && snap.ok && snap.stale) html += '<span class="badge stale">STALE</span>';
    if (cls.ladoFalho) html += '<span class="ladoFalho">Fonte indisponível: ' + esc(cls.ladoFalho) + "</span>";
    html += "</div>";

    if (cls.nivel === "divergente") {
      html += '<p class="avisoDefasagem">' + esc(AVISO_DEFASAGEM) + "</p>";
    }

    html += '<table class="metaTable"><tbody>';
    html += "<tr><th>Estado live</th><td>" + (live && live.ok ? "OK" : "FALHA — " + esc(live && live.erro)) + "</td></tr>";
    html += "<tr><th>Estado snapshot</th><td>" + (snap && snap.ok ? esc(snap.status) : "FALHA — " + esc(snap && (snap.detalhe || snap.status))) + "</td></tr>";
    html += "<tr><th>capturedAt</th><td>" + esc(snap && snap.ok ? snap.meta.capturedAt : "—") + "</td></tr>";
    html += "<tr><th>referencePeriod</th><td>" + esc(snap && snap.ok ? snap.meta.referencePeriod : "—") + "</td></tr>";
    html += "<tr><th>Idade (horas)</th><td>" + esc(snap && snap.ok ? snap.meta.idadeHoras.toFixed(2) : "—") + "</td></tr>";
    html += "<tr><th>Hash declarado</th><td>" + esc(snap && snap.ok ? snap.meta.hash : "—") + "</td></tr>";
    html += "<tr><th>Linhas live</th><td>" + esc(live && live.ok ? live.itens.length : "—") + "</td></tr>";
    html += "<tr><th>Linhas snapshot</th><td>" + esc(snap && snap.ok ? snap.linhas.length : "—") + "</td></tr>";
    html += "<tr><th>Total de diferenças</th><td>" + esc(diferencas.length) + "</td></tr>";
    html += "</table>";

    html += '<h3>Resumo por tipo</h3><table class="resumoTable"><tbody>';
    TIPOS_DIFERENCA.forEach(function (t) {
      if (filtros.somenteDivergencias && resumo[t] === 0) return;
      html += "<tr><td>" + esc(t) + "</td><td>" + esc(resumo[t]) + "</td></tr>";
    });
    html += "</table>";

    html += '<h3>Diferenças (' + esc(filtradas.length) + " de " + esc(diferencas.length) + ")</h3>";
    html += '<table class="diffTable"><thead><tr><th>path</th><th>tipo</th><th>valor live</th><th>valor snapshot</th></tr></thead><tbody>';
    filtradas.forEach(function (d) {
      html += "<tr><td>" + esc(d.path) + "</td><td>" + esc(d.tipo) + "</td><td>" +
        esc(representarValor(d.valorLive)) + "</td><td>" + esc(representarValor(d.valorSnapshot)) + "</td></tr>";
    });
    html += "</tbody></table>";

    container.innerHTML = html;
  }

  function renderizarErroFatal(e) {
    var container = document.getElementById("relatorio");
    if (!container) return;
    container.innerHTML = '<div class="badge crit">ERRO FATAL NO PILOTO</div><pre>' +
      esc((e && e.stack) ? e.stack : String(e)) + "</pre>";
  }

  function iniciarNaPagina() {
    if (typeof document === "undefined" || !document.addEventListener) return;
    document.addEventListener("DOMContentLoaded", function () {
      executar().catch(function (e) { renderizarErroFatal(e); });
    });
  }

  /* ---------- exporta ---------- */

  return {
    CONFIG: CONFIG,
    TIPOS_DIFERENCA: TIPOS_DIFERENCA,
    AVISO_SNAPSHOT: AVISO_SNAPSHOT,
    AVISO_DEFASAGEM: AVISO_DEFASAGEM,
    esc: esc,
    representarValor: representarValor,
    resolverBaseUrl: resolverBaseUrl,
    resolverLive: resolverLive,
    resolverSnapshot: resolverSnapshot,
    providerFinoLive: providerFinoLive,
    providerFinoSnapshot: providerFinoSnapshot,
    classificar: classificar,
    agruparPorTipo: agruparPorTipo,
    aplicarFiltros: aplicarFiltros,
    iniciarNaPagina: iniciarNaPagina,
    /* expostos só para inspeção em teste — não usar para lógica externa */
    _internos: { renderizar: renderizar, executar: executar, ESTADO: ESTADO }
  };
});
