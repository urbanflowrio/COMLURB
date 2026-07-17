/* ============================================================
   HUB COMLURB / UrbanFlow Core · assets/components/hub-data-source.js
   Fase 7A (07/2026) · v1.0.0
   Dependências: nenhuma (não depende de hub-snapshot-reader.js nem
   de hub-core.js — recebe tudo por injeção de providers).

   RESPONSABILIDADE ÚNICA: decidir, entre "live", "snapshot" e
   "compare", qual(is) provider(s) chamar, e — no modo compare —
   produzir um relatório de diferenças estrutural e determinístico.
   Não conhece AR, DTE, CSV, PapaParse, Google Sheets, GitHub ou
   HUB.data.loadCSV. Não decide qual fonte é "melhor". Nesta Fase 7A,
   o modo padrão é sempre "live", e nenhum painel injeta ainda um
   snapshotProvider real — este arquivo só é exercitado por
   testes/harness isolado.

   PADRÃO DE MÓDULO: ver cabeçalho de hub-snapshot-reader.js — mesmo
   desvio deliberado e restrito (dual export, sem eval).
   ============================================================ */

(function (root, factory) {
  "use strict";
  var modulo = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = modulo;
  }
  if (typeof window !== "undefined") {
    window.HUB = window.HUB || {};
    window.HUB.dataSource = modulo;
    if (typeof window.HUB.registerComponent === "function") {
      window.HUB.registerComponent("dataSource");
    }
  }
})(typeof window !== "undefined" ? window : this, function () {
  "use strict";

  var MODOS = Object.freeze({
    LIVE: "live",
    SNAPSHOT: "snapshot",
    COMPARE: "compare"
  });

  /* ---------- comparação estrutural pura ---------- */

  function tipoDe(v) {
    if (v === null) return "null";
    if (Array.isArray(v)) return "array";
    return typeof v;
  }

  function ehPrimitivo(v) {
    var t = tipoDe(v);
    return t === "string" || t === "number" || t === "boolean" || t === "null" || t === "undefined";
  }

  function chavePrimitivaOrdenavel(v) {
    return String(v);
  }

  function compararPrimitivosParaOrdenar(a, b) {
    var sa = chavePrimitivaOrdenavel(a), sb = chavePrimitivaOrdenavel(b);
    if (sa < sb) return -1;
    if (sa > sb) return 1;
    return 0;
  }

  /**
   * Diferença estrutural recursiva, determinística. Objetos:
   * comparados por propriedade, independente da ordem de declaração
   * das chaves. Arrays: ordem original preservada e comparada —
   * nunca reordenados silenciosamente. Não usa JSON.stringify como
   * estratégia geral (só um auxílio local e explícito, dentro de
   * diffArrays, para detectar reordenação pura de arrays de
   * primitivos). Não modifica `a` nem `b`.
   */
  function diffRecursivo(a, b, caminho, saida) {
    var tipoA = tipoDe(a), tipoB = tipoDe(b);

    if (tipoA !== tipoB) {
      saida.push({ path: caminho, tipo: "tipo_divergente", valorLive: a, valorSnapshot: b });
      return;
    }

    if (tipoA === "array") {
      diffArrays(a, b, caminho, saida);
      return;
    }

    if (tipoA === "object") {
      var chavesA = Object.keys(a);
      var chavesB = Object.keys(b);
      var vistas = {};
      var i, k;
      for (i = 0; i < chavesA.length; i++) {
        k = chavesA[i];
        vistas[k] = true;
        if (!Object.prototype.hasOwnProperty.call(b, k)) {
          saida.push({ path: caminho + "." + k, tipo: "campo_ausente_snapshot", valorLive: a[k], valorSnapshot: undefined });
        } else {
          diffRecursivo(a[k], b[k], caminho + "." + k, saida);
        }
      }
      for (i = 0; i < chavesB.length; i++) {
        k = chavesB[i];
        if (!vistas[k]) {
          saida.push({ path: caminho + "." + k, tipo: "campo_ausente_live", valorLive: undefined, valorSnapshot: b[k] });
        }
      }
      return;
    }

    if (a !== b) {
      saida.push({ path: caminho, tipo: "valor_divergente", valorLive: a, valorSnapshot: b });
    }
  }

  function diffArrays(a, b, caminho, saida) {
    var ambosPrimitivos = a.every(ehPrimitivo) && b.every(ehPrimitivo);
    if (ambosPrimitivos && a.length === b.length && a.length > 0) {
      var ordA = a.slice().sort(compararPrimitivosParaOrdenar);
      var ordB = b.slice().sort(compararPrimitivosParaOrdenar);
      var mesmoConjunto = JSON.stringify(ordA) === JSON.stringify(ordB);
      var mesmaOrdem = JSON.stringify(a) === JSON.stringify(b);
      if (mesmoConjunto && !mesmaOrdem) {
        saida.push({ path: caminho, tipo: "ordem_array_divergente", valorLive: a, valorSnapshot: b });
        return;
      }
    }
    var max = Math.max(a.length, b.length);
    for (var i = 0; i < max; i++) {
      if (i >= a.length) {
        saida.push({ path: caminho + "[" + i + "]", tipo: "campo_ausente_live", valorLive: undefined, valorSnapshot: b[i] });
      } else if (i >= b.length) {
        saida.push({ path: caminho + "[" + i + "]", tipo: "campo_ausente_snapshot", valorLive: a[i], valorSnapshot: undefined });
      } else {
        diffRecursivo(a[i], b[i], caminho + "[" + i + "]", saida);
      }
    }
  }

  /**
   * Comparador padrão (usado quando opts.compareProvider não é
   * informado no resolver). Função pura — não acessa rede, não
   * conhece AR/DTE/CSV/Google Sheets.
   *
   * @param {*} liveValor
   * @param {*} snapshotValor
   * @param {Object} [erros] {erroLive, erroSnapshot} — string ou null
   */
  function comparar(liveValor, snapshotValor, erros) {
    erros = erros || {};
    var erroLive = erros.erroLive || null;
    var erroSnapshot = erros.erroSnapshot || null;

    if (erroLive && erroSnapshot) {
      return { classificacao: "erro_ambos", diferencas: [], erroLive: erroLive, erroSnapshot: erroSnapshot };
    }
    if (erroLive) {
      return { classificacao: "erro_live", diferencas: [], erroLive: erroLive, erroSnapshot: null };
    }
    if (erroSnapshot) {
      return { classificacao: "erro_snapshot", diferencas: [], erroLive: null, erroSnapshot: erroSnapshot };
    }

    var diferencas = [];
    diffRecursivo(liveValor, snapshotValor, "$", diferencas);

    return {
      classificacao: diferencas.length === 0 ? "igualdade" : "divergente",
      diferencas: diferencas,
      erroLive: null,
      erroSnapshot: null
    };
  }

  /* ---------- resolver ---------- */

  function chamarProvider(provider, moduloId) {
    if (typeof provider !== "function") {
      return Promise.resolve({ chamado: false, resultado: null, erro: "provider não informado ou não é função." });
    }
    return Promise.resolve()
      .then(function () { return provider(moduloId); })
      .then(function (r) { return { chamado: true, resultado: r, erro: null }; })
      .catch(function (e) { return { chamado: true, resultado: null, erro: (e && e.message) ? e.message : String(e) }; });
  }

  function moldura(modo, moduloId, detalhe) {
    return {
      modo: modo,
      moduloId: moduloId || null,
      detalhe: detalhe || "",
      live: { chamado: false, resultado: null, erro: null },
      snapshot: { chamado: false, resultado: null, erro: null },
      comparacao: null,
      valorPrincipal: null
    };
  }

  /**
   * @param {string} moduloId repassado como argumento aos providers — este arquivo não valida seu significado, só a presença
   * @param {"live"|"snapshot"|"compare"} [modo] padrão "live"
   * @param {Object} opts
   * @param {Function} [opts.liveProvider] (moduloId) => Promise<*>
   * @param {Function} [opts.snapshotProvider] (moduloId) => Promise<*>
   * @param {Function} [opts.compareProvider] (liveValor, snapshotValor, erros) => relatorio — padrão: comparar() acima
   * @returns {Promise<Object>}
   */
  function resolver(moduloId, modo, opts) {
    opts = opts || {};
    var modoResolvido = (modo === undefined || modo === null || modo === "") ? MODOS.LIVE : modo;

    if (modoResolvido !== MODOS.LIVE && modoResolvido !== MODOS.SNAPSHOT && modoResolvido !== MODOS.COMPARE) {
      return Promise.resolve(moldura("modo_desconhecido", moduloId, "Modo '" + String(modo) + "' não reconhecido. Use 'live', 'snapshot' ou 'compare'."));
    }

    if (typeof moduloId !== "string" || moduloId.length === 0) {
      var m = moldura(modoResolvido, moduloId, "moduloId obrigatório e deve ser string não vazia.");
      m.live.erro = "parametro_invalido";
      m.snapshot.erro = "parametro_invalido";
      return Promise.resolve(m);
    }

    if (modoResolvido === MODOS.LIVE) {
      return chamarProvider(opts.liveProvider, moduloId).then(function (liveInfo) {
        var r = moldura(MODOS.LIVE, moduloId, "");
        r.live = liveInfo;
        r.valorPrincipal = liveInfo.resultado;
        return r;
      });
    }

    if (modoResolvido === MODOS.SNAPSHOT) {
      return chamarProvider(opts.snapshotProvider, moduloId).then(function (snapInfo) {
        var r = moldura(MODOS.SNAPSHOT, moduloId, "");
        r.snapshot = snapInfo;
        r.valorPrincipal = snapInfo.resultado;
        return r;
      });
    }

    // compare: as duas fontes chamadas de forma independente —
    // falha de uma não impede a captura da outra (Promise.all sobre
    // chamarProvider, que já converte rejeição em {erro:...}).
    return Promise.all([
      chamarProvider(opts.liveProvider, moduloId),
      chamarProvider(opts.snapshotProvider, moduloId)
    ]).then(function (arr) {
      var liveInfo = arr[0], snapInfo = arr[1];
      var comparador = (typeof opts.compareProvider === "function") ? opts.compareProvider : comparar;
      var relatorio;
      try {
        relatorio = comparador(liveInfo.resultado, snapInfo.resultado, { erroLive: liveInfo.erro, erroSnapshot: snapInfo.erro });
      } catch (e) {
        relatorio = {
          classificacao: "erro_comparacao",
          diferencas: [],
          erroLive: liveInfo.erro,
          erroSnapshot: snapInfo.erro,
          mensagem: (e && e.message) ? e.message : String(e)
        };
      }
      var r = moldura(MODOS.COMPARE, moduloId, "");
      r.live = liveInfo;
      r.snapshot = snapInfo;
      r.comparacao = relatorio;
      r.valorPrincipal = liveInfo.resultado;
      return r;
    });
  }

  return {
    MODOS: MODOS,
    resolver: resolver,
    comparar: comparar
  };
});
