/* ============================================================
   HUB COMLURB · engenharia-operacional/piloto-snapshot/piloto-snapshot-dte.js
   Fase 7C (07/2026) · v1.0.0

   PILOTO TÉCNICO ISOLADO — comparação Live × Snapshot (Engenharia/
   DTE), estritamente pré-regras.

   Chama, uma única vez por execução:
     - HUB.ingest.adapterDTE.carregarDTE({})   (fonte "live")
     - HUB.snapshotReader.lerAsync("engenharia-dte", …) (fonte
       "snapshot")

   NÃO aplica hub-rules-engenharia.js nem hub-state-engenharia.js
   (não existem ainda e não são carregados por index.html; este
   arquivo também não os referencia). Não calcula status, atingimento,
   tendência ou bonificação. Compara apenas o dado canônico bruto
   produzido pelo Adapter DTE — três coleções do contrato oficial:

     envelope.payload.periodos           (array de strings "AAAA-MM")
     envelope.payload.indicadores        (array de registros)
     envelope.payload.gerenciasOfensoras (array de registros)

   DIFERENÇA ESTRUTURAL EM RELAÇÃO AO PILOTO AR (Fase 7B): o AR tem
   payload = {linhas: [...]} — uma única coleção. O DTE tem três
   coleções no mesmo payload. Por isso este arquivo NÃO reaproveita
   HUB.dataSource.comparar() (comparador padrão, pensado para um único
   valor) — em vez disso injeta um compareProvider próprio em
   HUB.dataSource.resolver(..., "compare", {compareProvider: ...}),
   que já é o ponto de extensão previsto e testado na Fase 7A/7B, sem
   qualquer alteração em hub-data-source.js.

   CHAVES CANÔNICAS (derivadas de lineage, já presente no contrato do
   Adapter DTE — nenhum campo novo foi inventado):
     indicadores:        lineage.linhaOrigem + "|" + lineage.colunaOrigem
     gerenciasOfensoras:  lineage.linhaOrigemCategorica + "|" +
                          lineage.linhaOrigemValor + "|" + lineage.colunaOrigem
   Registro sem `lineage` -> CHAVE_AUSENTE. `lineage` presente mas com
   algum componente ausente/null -> CHAVE_INCOMPLETA. Chave repetida
   dentro da mesma coleção/lado -> CHAVE_DUPLICADA. Em todos os três
   casos: (a) a ocorrência vira uma diferença estrutural própria; (b)
   os registros envolvidos NUNCA entram na comparação campo-a-campo
   (alinhamento seria ambíguo); (c) EQUIVALENTE fica bloqueado; (d) o
   restante da coleção continua comparado normalmente.

   ORDEM DE ARRAY NUNCA É DIFERENÇA SEMÂNTICA para indicadores/
   gerenciasOfensoras: a comparação é inteiramente por chave (Map),
   não por índice posicional — reordenar o array de origem não produz
   nenhuma diferença enquanto as chaves e os campos forem iguais.
   Para `periodos`: o contrato do Adapter já entrega
   Object.keys(...).sort() (ver hub-ingest-adapter-dte.js,
   `carregarDTE`) — ou seja, a ordem É determinística e derivada
   (ascendente lexicográfica sobre "AAAA-MM", que corresponde a
   ordem cronológica), não uma escolha humana a preservar. Por
   segurança este piloto reordena (sort) os dois lados antes de
   comparar por conjunto — normalização determinística, não uma
   tentativa de esconder divergência: qualquer item exclusivo de um
   lado ainda aparece como APENAS_LIVE/APENAS_SNAPSHOT.

   Indexação por Map: comparação de indicadores/gerenciasOfensoras é
   O(n) (uma passada para indexar cada lado, uma passada sobre a união
   de chaves) — nunca laço aninhado sobre as coleções completas, nunca
   `find`/`filter` repetido por registro.

   PADRÃO DE MÓDULO: mesmo desvio deliberado e restrito de
   hub-snapshot-reader.js/hub-data-source.js/piloto-snapshot.js (dual
   export, sem eval) — testável em Node via require() direto; em
   navegador, também dispara sozinho ao DOMContentLoaded.
   ============================================================ */

(function (root, factory) {
  "use strict";
  var modulo = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = modulo;
  }
  if (typeof window !== "undefined") {
    window.HUB = window.HUB || {};
    window.PILOTO_SNAPSHOT_DTE = modulo;
  }
  if (typeof window !== "undefined" && typeof document !== "undefined" && document.addEventListener) {
    modulo.iniciarNaPagina();
  }
})(typeof window !== "undefined" ? window : this, function () {
  "use strict";

  /* ================================================================
     CONFIGURAÇÃO LOCAL — explícita, restrita a este arquivo. Não
     escreve em nenhuma configuração global (HUB.config permanece
     intocado).
     ================================================================ */

  var CONFIG = {
    maxAgeHoras: null,
    /* Limite de diferenças efetivamente renderizadas na tabela — a
       contagem total (ESTADO.relatorio.comparacao.diferencas.length)
       nunca é truncada, só a exibição. */
    limiteDiferencasRenderizadas: 300
  };

  var MODULO_ID = "engenharia-dte";

  var COLECOES = ["periodos", "indicadores", "gerenciasOfensoras"];

  var NATUREZAS = [
    "APENAS_LIVE",
    "APENAS_SNAPSHOT",
    "CAMPO_AUSENTE_LIVE",
    "CAMPO_AUSENTE_SNAPSHOT",
    "VALOR_DIFERENTE",
    "TIPO_DIFERENTE",
    "CHAVE_AUSENTE",
    "CHAVE_INCOMPLETA",
    "CHAVE_DUPLICADA",
    "ESTRUTURA_INVALIDA"
  ];

  /* status de HUB.snapshotReader.ESTADOS (valores string fixos do
     contrato de hub-snapshot-reader.js — não alterado, só consultado)
     agrupados nos dois estados exigidos pela Fase 7C. Ver também
     "payload_incompativel_piloto", status próprio deste arquivo,
     emitido quando o snapshot é lido e passa na validação genérica do
     reader mas o payload não contém as três coleções do contrato DTE
     — tratado como SNAPSHOT_INVALIDO (encontrado, porém rejeitado). */
  var STATUS_SNAPSHOT_INDISPONIVEL = [
    "snapshot_ausente",
    "erro_leitura",
    "erro_inesperado_piloto",
    "parametro_invalido"
  ];

  var AVISO_COPIA_TECNICA =
    "Este snapshot é uma cópia técnica para continuidade operacional e auditoria.";
  var AVISO_NAO_FECHAMENTO =
    "O snapshot não representa fechamento mensal oficial.";
  var AVISO_PILOTO_ISOLADO =
    "Esta página é um piloto técnico isolado e não integra o painel executivo.";
  var AVISO_DEFASAGEM =
    "Diferenças podem decorrer de atualização da fonte live após a captura do snapshot.";

  /* ================================================================
     HELPERS PUROS — escaping, truncamento, resolução de baseUrl,
     acesso a caminho pontilhado, tipagem.
     ================================================================ */

  function esc(v) {
    if (v === undefined || v === null) return "";
    return String(v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

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
   * Resolução portátil de baseUrl a partir da URL atual do documento
   * — mesma estratégia de ar/piloto-snapshot/piloto-snapshot.js.
   * engenharia-operacional/piloto-snapshot/ está na mesma profundidade
   * relativa de ar/piloto-snapshot/ (dois níveis até a raiz), então
   * "../../data/" resolve corretamente para os dois módulos.
   */
  function resolverBaseUrl(baseAtual) {
    return new URL("../../data/", baseAtual).href;
  }

  function tipoDe(v) {
    if (v === null) return "null";
    if (Array.isArray(v)) return "array";
    return typeof v;
  }

  function getPath(obj, caminhoPontilhado) {
    var partes = caminhoPontilhado.split(".");
    var atual = obj;
    for (var i = 0; i < partes.length; i++) {
      if (atual === undefined || atual === null) return undefined;
      atual = atual[partes[i]];
    }
    return atual;
  }

  /* ================================================================
     LIVE — chamada única ao Adapter DTE, sem aplicar regras.
     ================================================================ */

  /**
   * @param {Function} carregarDTEFn () => Promise<{envelope, indicadores, gerenciasOfensoras, notas, bloqueios, diagnosticoFonte}>
   *   — em produção, HUB.ingest.adapterDTE.carregarDTE vinculado com {}.
   *   Injetado (não lido de window.HUB aqui dentro) para permitir
   *   contar chamadas em teste e para não acoplar esta função a onde
   *   o HUB está pendurado.
   * @returns {Promise<Object>} nunca rejeita — falha vira {ok:false, erro}
   */
  function resolverLive(carregarDTEFn) {
    return Promise.resolve()
      .then(function () { return carregarDTEFn(); })
      .then(function (resultado) {
        var diagnosticoFonte = (resultado && resultado.diagnosticoFonte) || null;

        var semPayload = !resultado || !resultado.envelope ||
          resultado.envelope.payload === null || resultado.envelope.payload === undefined;
        if (semPayload) {
          return {
            ok: false,
            erro: "Adapter DTE não produziu payload válido (carga inválida — ver quality.erros do envelope).",
            quality: (resultado && resultado.envelope) ? resultado.envelope.quality : null,
            diagnosticoFonte: diagnosticoFonte
          };
        }

        var payload = resultado.envelope.payload;
        // payload presente não é suficiente: as três coleções do
        // contrato oficial precisam, de fato, ser arrays — nunca
        // presume-se lista simples (ver documento da Fase 7C, item 5).
        if (!Array.isArray(payload.periodos) || !Array.isArray(payload.indicadores) || !Array.isArray(payload.gerenciasOfensoras)) {
          return {
            ok: false,
            erro: "Adapter DTE não produziu as três coleções esperadas (periodos/indicadores/gerenciasOfensoras) como arrays.",
            quality: resultado.envelope.quality,
            diagnosticoFonte: diagnosticoFonte
          };
        }

        return {
          ok: true,
          periodos: payload.periodos,
          indicadores: payload.indicadores,
          gerenciasOfensoras: payload.gerenciasOfensoras,
          quality: resultado.envelope.quality,
          diagnosticoFonte: diagnosticoFonte
        };
      })
      .catch(function (e) {
        return { ok: false, erro: (e && e.message) ? e.message : String(e), diagnosticoFonte: null };
      });
  }

  /* ================================================================
     SNAPSHOT — chamada única ao snapshotReader, sem aplicar regras.
     stale é aceito (com aviso), nunca descartado nem convertido em
     erro; nunca aciona fallback para live.
     ================================================================ */

  /**
   * @param {Function} lerAsyncFn (moduloId, opts) => Promise<resultado> — HUB.snapshotReader.lerAsync
   * @param {string} moduloId — "engenharia-dte" em produção; parametrizado para teste
   * @param {string} baseUrl
   * @param {number|null} maxAgeHoras
   * @param {Object} ESTADOS — HUB.snapshotReader.ESTADOS, injetado
   * @param {Function} [fetchImpl] — opcional; omitido em navegador usa o padrão do próprio reader
   */
  function resolverSnapshot(lerAsyncFn, moduloId, baseUrl, maxAgeHoras, ESTADOS, fetchImpl) {
    var opts = { baseUrl: baseUrl, maxAgeHoras: maxAgeHoras };
    if (typeof fetchImpl === "function") opts.fetchImpl = fetchImpl;

    return Promise.resolve()
      .then(function () { return lerAsyncFn(moduloId, opts); })
      .then(function (resultado) {
        if (resultado.status === ESTADOS.VALIDO || resultado.status === ESTADOS.STALE) {
          var payload = resultado.snapshot.envelope.payload;
          var payloadOk = payload && Array.isArray(payload.periodos) &&
            Array.isArray(payload.indicadores) && Array.isArray(payload.gerenciasOfensoras);
          if (!payloadOk) {
            return {
              ok: false,
              status: "payload_incompativel_piloto",
              detalhe: "Snapshot lido e íntegro pelo contrato genérico, porém envelope.payload não contém as três coleções esperadas do contrato DTE (periodos/indicadores/gerenciasOfensoras)."
            };
          }
          return {
            ok: true,
            status: resultado.status,
            stale: resultado.status === ESTADOS.STALE,
            periodos: payload.periodos,
            indicadores: payload.indicadores,
            gerenciasOfensoras: payload.gerenciasOfensoras,
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
     chamam Adapter/Reader de novo: só reexpõem o objeto {periodos,
     indicadores, gerenciasOfensoras} já resolvido. Falha nunca vira
     estrutura vazia — sempre rejeita, para HUB.dataSource.resolver
     classificar como erro de fonte, não como divergência de conteúdo.
     ================================================================ */

  function providerFinoLive(resultadoLive) {
    return function () {
      if (!resultadoLive || !resultadoLive.ok) {
        return Promise.reject(new Error((resultadoLive && resultadoLive.erro) || "live indisponível"));
      }
      return Promise.resolve({
        periodos: resultadoLive.periodos,
        indicadores: resultadoLive.indicadores,
        gerenciasOfensoras: resultadoLive.gerenciasOfensoras
      });
    };
  }

  function providerFinoSnapshot(resultadoSnapshot) {
    return function () {
      if (!resultadoSnapshot || !resultadoSnapshot.ok) {
        var motivo = (resultadoSnapshot && (resultadoSnapshot.detalhe || resultadoSnapshot.status)) || "snapshot indisponível";
        return Promise.reject(new Error(String(motivo)));
      }
      return Promise.resolve({
        periodos: resultadoSnapshot.periodos,
        indicadores: resultadoSnapshot.indicadores,
        gerenciasOfensoras: resultadoSnapshot.gerenciasOfensoras
      });
    };
  }

  /* ================================================================
     COMPARAÇÃO POR CHAVE — indicadores e gerenciasOfensoras.
     ================================================================ */

  var CHAVE_INDICADOR = ["lineage.linhaOrigem", "lineage.colunaOrigem"];
  var CHAVE_GERENCIA_OFENSORA = ["lineage.linhaOrigemCategorica", "lineage.linhaOrigemValor", "lineage.colunaOrigem"];

  /**
   * @returns {{chave: string|null, problema: string|null}}
   *   problema: "CHAVE_AUSENTE" (sem `lineage`) | "CHAVE_INCOMPLETA"
   *   (lineage presente, componente(s) ausente/null) | null (chave ok)
   */
  function construirChave(reg, campos) {
    if (!reg || reg.lineage === undefined || reg.lineage === null) {
      return { chave: null, problema: "CHAVE_AUSENTE" };
    }
    var partes = [];
    for (var i = 0; i < campos.length; i++) {
      var v = getPath(reg, campos[i]);
      if (v === undefined || v === null) {
        return { chave: null, problema: "CHAVE_INCOMPLETA" };
      }
      partes.push(String(v));
    }
    return { chave: partes.join("|"), problema: null };
  }

  /**
   * Indexa uma coleção por chave canônica. Nunca sobrescreve
   * silenciosamente: registros com a mesma chave se acumulam em
   * `ocorrencias`; a duplicidade é reportada como diferença estrutural
   * (uma única vez por chave) e o grupo inteiro fica fora da
   * comparação campo-a-campo (alinhamento ambíguo).
   */
  function indexarColecao(registros, camposChave, colecao, lado, saidaDiferencas) {
    var mapa = new Map();
    registros.forEach(function (reg, idx) {
      var r = construirChave(reg, camposChave);
      if (r.chave === null) {
        saidaDiferencas.push({
          colecao: colecao,
          chave: null,
          path: "$." + colecao + "[idx=" + idx + "]",
          natureza: r.problema,
          lado: lado,
          valorLive: lado === "live" ? reg : undefined,
          valorSnapshot: lado === "snapshot" ? reg : undefined,
          tipoLive: lado === "live" ? tipoDe(reg) : "ausente",
          tipoSnapshot: lado === "snapshot" ? tipoDe(reg) : "ausente"
        });
        return;
      }
      if (mapa.has(r.chave)) {
        mapa.get(r.chave).ocorrencias.push(reg);
      } else {
        mapa.set(r.chave, { ocorrencias: [reg] });
      }
    });
    mapa.forEach(function (info, chave) {
      if (info.ocorrencias.length > 1) {
        saidaDiferencas.push({
          colecao: colecao,
          chave: chave,
          path: "$." + colecao + "[chave=" + chave + "]",
          natureza: "CHAVE_DUPLICADA",
          lado: lado,
          valorLive: lado === "live" ? info.ocorrencias.length : undefined,
          valorSnapshot: lado === "snapshot" ? info.ocorrencias.length : undefined,
          tipoLive: lado === "live" ? "quantidade_ocorrencias" : "ausente",
          tipoSnapshot: lado === "snapshot" ? "quantidade_ocorrencias" : "ausente"
        });
      }
    });
    return mapa;
  }

  /**
   * Diferença campo-a-campo entre dois registros já pareados pela
   * mesma chave. Recursiva em objetos aninhados (lineage,
   * rotulosBrutos); trata arrays defensivamente por índice (nenhum
   * campo do contrato DTE hoje é array, mas a função não presume
   * isso). NUNCA converte tipos (número × string numérica sempre
   * diverge; null × ausente sempre diverge — ausente é detectado
   * primeiro via hasOwnProperty, antes de qualquer comparação de
   * valor).
   */
  function diffCampos(a, b, caminho, colecao, chave, saida) {
    var tA = tipoDe(a), tB = tipoDe(b);

    if (tA !== tB) {
      saida.push({ colecao: colecao, chave: chave, path: caminho, natureza: "TIPO_DIFERENTE", valorLive: a, valorSnapshot: b, tipoLive: tA, tipoSnapshot: tB });
      return;
    }

    if (tA === "object") {
      var chavesA = Object.keys(a);
      var chavesB = Object.keys(b);
      var vistas = {};
      var i, k;
      for (i = 0; i < chavesA.length; i++) {
        k = chavesA[i];
        vistas[k] = true;
        if (!Object.prototype.hasOwnProperty.call(b, k)) {
          saida.push({ colecao: colecao, chave: chave, path: caminho + "." + k, natureza: "CAMPO_AUSENTE_SNAPSHOT", valorLive: a[k], valorSnapshot: undefined, tipoLive: tipoDe(a[k]), tipoSnapshot: "ausente" });
        } else {
          diffCampos(a[k], b[k], caminho + "." + k, colecao, chave, saida);
        }
      }
      for (i = 0; i < chavesB.length; i++) {
        k = chavesB[i];
        if (!vistas[k]) {
          saida.push({ colecao: colecao, chave: chave, path: caminho + "." + k, natureza: "CAMPO_AUSENTE_LIVE", valorLive: undefined, valorSnapshot: b[k], tipoLive: "ausente", tipoSnapshot: tipoDe(b[k]) });
        }
      }
      return;
    }

    if (tA === "array") {
      var max = Math.max(a.length, b.length);
      for (var idx = 0; idx < max; idx++) {
        if (idx >= a.length) {
          saida.push({ colecao: colecao, chave: chave, path: caminho + "[" + idx + "]", natureza: "CAMPO_AUSENTE_LIVE", valorLive: undefined, valorSnapshot: b[idx], tipoLive: "ausente", tipoSnapshot: tipoDe(b[idx]) });
        } else if (idx >= b.length) {
          saida.push({ colecao: colecao, chave: chave, path: caminho + "[" + idx + "]", natureza: "CAMPO_AUSENTE_SNAPSHOT", valorLive: a[idx], valorSnapshot: undefined, tipoLive: tipoDe(a[idx]), tipoSnapshot: "ausente" });
        } else {
          diffCampos(a[idx], b[idx], caminho + "[" + idx + "]", colecao, chave, saida);
        }
      }
      return;
    }

    if (a !== b) {
      saida.push({ colecao: colecao, chave: chave, path: caminho, natureza: "VALOR_DIFERENTE", valorLive: a, valorSnapshot: b, tipoLive: tA, tipoSnapshot: tB });
    }
  }

  /**
   * Compara uma coleção de registros (indicadores OU
   * gerenciasOfensoras) entre live e snapshot, inteiramente por chave
   * canônica — nunca por posição. O(n): uma indexação por lado + uma
   * passada sobre a união de chaves (Map.get, não find/filter).
   * @returns {{live: number, snapshot: number, chavesComparadas: number}}
   */
  function compararColecaoPorChave(liveArr, snapArr, camposChave, colecao, saidaDiferencas) {
    var liveOk = Array.isArray(liveArr);
    var snapOk = Array.isArray(snapArr);

    if (!liveOk) {
      saidaDiferencas.push({ colecao: colecao, chave: null, path: "$." + colecao, natureza: "ESTRUTURA_INVALIDA", lado: "live", valorLive: liveArr, valorSnapshot: undefined, tipoLive: tipoDe(liveArr), tipoSnapshot: "ausente" });
    }
    if (!snapOk) {
      saidaDiferencas.push({ colecao: colecao, chave: null, path: "$." + colecao, natureza: "ESTRUTURA_INVALIDA", lado: "snapshot", valorLive: undefined, valorSnapshot: snapArr, tipoLive: "ausente", tipoSnapshot: tipoDe(snapArr) });
    }

    var mapaLive = indexarColecao(liveOk ? liveArr : [], camposChave, colecao, "live", saidaDiferencas);
    var mapaSnap = indexarColecao(snapOk ? snapArr : [], camposChave, colecao, "snapshot", saidaDiferencas);

    var todasChaves = new Set();
    mapaLive.forEach(function (_info, k) { todasChaves.add(k); });
    mapaSnap.forEach(function (_info, k) { todasChaves.add(k); });

    todasChaves.forEach(function (chave) {
      var infoLive = mapaLive.get(chave);
      var infoSnap = mapaSnap.get(chave);
      var liveDup = !!(infoLive && infoLive.ocorrencias.length > 1);
      var snapDup = !!(infoSnap && infoSnap.ocorrencias.length > 1);
      if (liveDup || snapDup) return; // já registrado como CHAVE_DUPLICADA; alinhamento ambíguo, não comparado campo a campo.

      if (infoLive && !infoSnap) {
        saidaDiferencas.push({ colecao: colecao, chave: chave, path: "$." + colecao + "[" + chave + "]", natureza: "APENAS_LIVE", valorLive: infoLive.ocorrencias[0], valorSnapshot: undefined, tipoLive: tipoDe(infoLive.ocorrencias[0]), tipoSnapshot: "ausente" });
        return;
      }
      if (!infoLive && infoSnap) {
        saidaDiferencas.push({ colecao: colecao, chave: chave, path: "$." + colecao + "[" + chave + "]", natureza: "APENAS_SNAPSHOT", valorLive: undefined, valorSnapshot: infoSnap.ocorrencias[0], tipoLive: "ausente", tipoSnapshot: tipoDe(infoSnap.ocorrencias[0]) });
        return;
      }
      diffCampos(infoLive.ocorrencias[0], infoSnap.ocorrencias[0], "$." + colecao + "[" + chave + "]", colecao, chave, saidaDiferencas);
    });

    return { live: liveOk ? liveArr.length : 0, snapshot: snapOk ? snapArr.length : 0, chavesComparadas: todasChaves.size };
  }

  /**
   * Compara a coleção `periodos` (array de strings "AAAA-MM", sem
   * registro/chave). DECISÃO DOCUMENTADA (ver cabeçalho do arquivo):
   * a ordem produzida pelo Adapter já é determinística
   * (Object.keys().sort()) — não uma sequência escolhida por humano.
   * Por isso este piloto normaliza (sort) os dois lados antes de
   * comparar por conjunto, em vez de comparar posição a posição; um
   * item exclusivo de um lado continua sendo reportado.
   */
  function compararPeriodos(liveArr, snapArr, saidaDiferencas) {
    var liveOk = Array.isArray(liveArr);
    var snapOk = Array.isArray(snapArr);

    if (!liveOk) {
      saidaDiferencas.push({ colecao: "periodos", chave: null, path: "$.periodos", natureza: "ESTRUTURA_INVALIDA", lado: "live", valorLive: liveArr, valorSnapshot: undefined, tipoLive: tipoDe(liveArr), tipoSnapshot: "ausente" });
    }
    if (!snapOk) {
      saidaDiferencas.push({ colecao: "periodos", chave: null, path: "$.periodos", natureza: "ESTRUTURA_INVALIDA", lado: "snapshot", valorLive: undefined, valorSnapshot: snapArr, tipoLive: "ausente", tipoSnapshot: tipoDe(snapArr) });
    }

    var liveN = (liveOk ? liveArr.slice() : []).sort();
    var snapN = (snapOk ? snapArr.slice() : []).sort();

    var setSnap = {};
    snapN.forEach(function (p) { setSnap[p] = true; });
    var setLive = {};
    liveN.forEach(function (p) { setLive[p] = true; });

    liveN.forEach(function (p) {
      if (!setSnap[p]) {
        saidaDiferencas.push({ colecao: "periodos", chave: p, path: "$.periodos[" + p + "]", natureza: "APENAS_LIVE", valorLive: p, valorSnapshot: undefined, tipoLive: "string", tipoSnapshot: "ausente" });
      }
    });
    snapN.forEach(function (p) {
      if (!setLive[p]) {
        saidaDiferencas.push({ colecao: "periodos", chave: p, path: "$.periodos[" + p + "]", natureza: "APENAS_SNAPSHOT", valorLive: undefined, valorSnapshot: p, tipoLive: "ausente", tipoSnapshot: "string" });
      }
    });

    return { live: liveN.length, snapshot: snapN.length };
  }

  /**
   * compareProvider injetado em HUB.dataSource.resolver(..., "compare",
   * {compareProvider: compararColecoesDTE}). Assinatura exigida por
   * hub-data-source.js: (liveValor, snapValor, erros) => relatorio.
   * Executa as três comparações (sempre as três — nenhuma etapa é
   * pulada, mesmo que uma coleção esteja ausente/inválida em um dos
   * lados: o problema vira ESTRUTURA_INVALIDA em vez de a coleção
   * simplesmente não ser considerada).
   */
  function compararColecoesDTE(liveValor, snapValor, erros) {
    erros = erros || {};
    if (erros.erroLive && erros.erroSnapshot) {
      return { classificacao: "erro_ambos", diferencas: [], erroLive: erros.erroLive, erroSnapshot: erros.erroSnapshot, volumetria: null };
    }
    if (erros.erroLive) {
      return { classificacao: "erro_live", diferencas: [], erroLive: erros.erroLive, erroSnapshot: null, volumetria: null };
    }
    if (erros.erroSnapshot) {
      return { classificacao: "erro_snapshot", diferencas: [], erroLive: null, erroSnapshot: erros.erroSnapshot, volumetria: null };
    }

    var diferencas = [];
    var volumetria = {};

    volumetria.periodos = compararPeriodos(liveValor && liveValor.periodos, snapValor && snapValor.periodos, diferencas);
    volumetria.indicadores = compararColecaoPorChave(liveValor && liveValor.indicadores, snapValor && snapValor.indicadores, CHAVE_INDICADOR, "indicadores", diferencas);
    volumetria.gerenciasOfensoras = compararColecaoPorChave(liveValor && liveValor.gerenciasOfensoras, snapValor && snapValor.gerenciasOfensoras, CHAVE_GERENCIA_OFENSORA, "gerenciasOfensoras", diferencas);

    return {
      classificacao: diferencas.length === 0 ? "igualdade" : "divergente",
      diferencas: diferencas,
      erroLive: null,
      erroSnapshot: null,
      volumetria: volumetria
    };
  }

  /* ================================================================
     CLASSIFICAÇÃO GERAL — exatamente os seis estados exigidos pela
     Fase 7C. EQUIVALENTE só é possível quando live carregou, Adapter
     executou, snapshot existe e é válido, hash é válido, e as três
     coleções foram comparadas sem nenhuma diferença (inclusive
     nenhuma chave ausente/incompleta/duplicada).
     ================================================================ */

  function classificar(relatorio, resultadoLive, resultadoSnapshot) {
    var liveFalhou = !resultadoLive || !resultadoLive.ok;
    if (liveFalhou) {
      return { estado: "LIVE_INDISPONIVEL", detalhe: (resultadoLive && resultadoLive.erro) || "Fonte live indisponível." };
    }

    var snapshotFalhou = !resultadoSnapshot || !resultadoSnapshot.ok;
    if (snapshotFalhou) {
      var status = resultadoSnapshot && resultadoSnapshot.status;
      if (STATUS_SNAPSHOT_INDISPONIVEL.indexOf(status) !== -1) {
        return { estado: "SNAPSHOT_INDISPONIVEL", detalhe: (resultadoSnapshot && resultadoSnapshot.detalhe) || status || "Snapshot indisponível." };
      }
      return { estado: "SNAPSHOT_INVALIDO", detalhe: (resultadoSnapshot && resultadoSnapshot.detalhe) || status || "Snapshot inválido." };
    }

    var cls = (relatorio && relatorio.comparacao) ? relatorio.comparacao.classificacao : null;

    if (cls === "erro_ambos") {
      return { estado: "ERRO_DE_COMPARACAO", detalhe: (relatorio.comparacao.erroLive || "") + " / " + (relatorio.comparacao.erroSnapshot || "") };
    }
    if (cls === "erro_live") {
      return { estado: "LIVE_INDISPONIVEL", detalhe: relatorio.comparacao.erroLive || "Erro de origem live reportado pelo comparador." };
    }
    if (cls === "erro_snapshot") {
      return { estado: "SNAPSHOT_INVALIDO", detalhe: relatorio.comparacao.erroSnapshot || "Erro de origem snapshot reportado pelo comparador." };
    }
    if (cls === "erro_comparacao") {
      return { estado: "ERRO_DE_COMPARACAO", detalhe: relatorio.comparacao.mensagem || "Erro inesperado durante a comparação." };
    }
    if (cls === "igualdade") {
      return { estado: "EQUIVALENTE", detalhe: "Nenhuma diferença material entre live e snapshot nas três coleções (periodos, indicadores, gerenciasOfensoras)." };
    }
    return { estado: "DIVERGENTE", detalhe: "Diferenças encontradas — ver tabela de diferenças por coleção." };
  }

  /* ================================================================
     AGRUPAMENTO, LIMITE DE EXIBIÇÃO E FILTROS — funções puras sobre o
     relatório já carregado; nunca disparam nova chamada de rede/
     provider/Adapter.
     ================================================================ */

  function agruparPorNatureza(diferencas) {
    var contagem = {};
    NATUREZAS.forEach(function (n) { contagem[n] = 0; });
    (diferencas || []).forEach(function (d) {
      contagem[d.natureza] = (contagem[d.natureza] || 0) + 1;
    });
    return contagem;
  }

  function agruparPorColecao(diferencas) {
    var contagem = {};
    COLECOES.forEach(function (c) { contagem[c] = 0; });
    (diferencas || []).forEach(function (d) {
      contagem[d.colecao] = (contagem[d.colecao] || 0) + 1;
    });
    return contagem;
  }

  function aplicarFiltros(diferencas, filtros) {
    filtros = filtros || {};
    return (diferencas || []).filter(function (d) {
      if (filtros.colecao && filtros.colecao !== "todas" && d.colecao !== filtros.colecao) return false;
      if (filtros.natureza && filtros.natureza !== "todas" && d.natureza !== filtros.natureza) return false;
      if (filtros.textoChave) {
        var alvo = String((d.chave !== null && d.chave !== undefined) ? d.chave : d.path || "").toLowerCase();
        if (alvo.indexOf(String(filtros.textoChave).toLowerCase()) === -1) return false;
      }
      return true;
    });
  }

  /**
   * Limita a AMOSTRA renderizada de diferenças sem jamais truncar a
   * contagem total. Chamado só na hora de montar a tabela — nunca
   * altera `diferencas` nem recalcula nada sobre o array completo além
   * de um slice().
   */
  function limitarParaExibicao(diferencas, limite) {
    diferencas = diferencas || [];
    limite = (typeof limite === "number" && limite > 0) ? limite : CONFIG.limiteDiferencasRenderizadas;
    var totalReal = diferencas.length;
    var amostra = diferencas.slice(0, limite);
    return {
      amostra: amostra,
      totalReal: totalReal,
      totalExibido: amostra.length,
      truncado: totalReal > amostra.length
    };
  }

  /* ================================================================
     INTEGRAÇÃO COM A PÁGINA REAL — só executa em navegador, só
     dispara ao DOMContentLoaded. ESTADO é preenchido uma única vez
     por carregamento de página. O Adapter DTE e o snapshotReader são
     cada um chamado exatamente uma vez (garantido por resolverLive/
     resolverSnapshot acima, chamados uma única vez aqui dentro).
     ================================================================ */

  var ESTADO = { live: null, snapshot: null, relatorio: null, classificacao: null, baseUrl: null };

  function executar() {
    var HUB = window.HUB;
    var baseUrl = resolverBaseUrl(document.baseURI);
    ESTADO.baseUrl = baseUrl;

    var pLive = resolverLive(function () { return HUB.ingest.adapterDTE.carregarDTE({}); });
    var pSnapshot = resolverSnapshot(
      HUB.snapshotReader.lerAsync,
      MODULO_ID,
      baseUrl,
      CONFIG.maxAgeHoras,
      HUB.snapshotReader.ESTADOS
    );

    return Promise.all([pLive, pSnapshot]).then(function (arr) {
      ESTADO.live = arr[0];
      ESTADO.snapshot = arr[1];

      return HUB.dataSource.resolver(MODULO_ID, "compare", {
        liveProvider: providerFinoLive(ESTADO.live),
        snapshotProvider: providerFinoSnapshot(ESTADO.snapshot),
        compareProvider: compararColecoesDTE
      });
    }).then(function (relatorio) {
      ESTADO.relatorio = relatorio;
      ESTADO.classificacao = classificar(relatorio, ESTADO.live, ESTADO.snapshot);
      renderizar({ colecao: "todas", natureza: "todas", textoChave: "" });
      ligarFiltros();
    });
  }

  function ligarFiltros() {
    var elColecao = document.getElementById("filtroColecao");
    var elNatureza = document.getElementById("filtroNatureza");
    var elChave = document.getElementById("filtroChave");

    function atualizar() {
      // Só lê ESTADO já carregado — nunca refaz executar()/resolver*()/Adapter.
      renderizar({
        colecao: elColecao ? elColecao.value : "todas",
        natureza: elNatureza ? elNatureza.value : "todas",
        textoChave: elChave ? elChave.value : ""
      });
    }

    if (elColecao) elColecao.addEventListener("change", atualizar);
    if (elNatureza) elNatureza.addEventListener("change", atualizar);
    if (elChave) elChave.addEventListener("input", atualizar);
  }

  function badge(estado) {
    var classe = {
      EQUIVALENTE: "ok",
      DIVERGENTE: "att",
      LIVE_INDISPONIVEL: "crit",
      SNAPSHOT_INDISPONIVEL: "crit",
      SNAPSHOT_INVALIDO: "crit",
      ERRO_DE_COMPARACAO: "crit"
    }[estado] || "nd";
    return '<span class="badge ' + classe + '">' + esc(estado) + "</span>";
  }

  function linhaVolumetriaColecao(nome, vol) {
    if (!vol) return "<tr><td>" + esc(nome) + "</td><td>—</td><td>—</td></tr>";
    return "<tr><td>" + esc(nome) + "</td><td>" + esc(vol.live) + "</td><td>" + esc(vol.snapshot) + "</td></tr>";
  }

  function renderizar(filtros) {
    var container = document.getElementById("relatorio");
    if (!container) return;

    var live = ESTADO.live, snap = ESTADO.snapshot, cls = ESTADO.classificacao;
    var diferencas = (ESTADO.relatorio && ESTADO.relatorio.comparacao) ? ESTADO.relatorio.comparacao.diferencas : [];
    var volumetria = (ESTADO.relatorio && ESTADO.relatorio.comparacao) ? ESTADO.relatorio.comparacao.volumetria : null;
    var resumoNatureza = agruparPorNatureza(diferencas);
    var resumoColecao = agruparPorColecao(diferencas);
    var filtradas = aplicarFiltros(diferencas, filtros);
    var limitado = limitarParaExibicao(filtradas, CONFIG.limiteDiferencasRenderizadas);

    var html = "";

    html += '<div class="linhaStatus">' + badge(cls.estado);
    if (snap && snap.ok && snap.stale) html += '<span class="badge stale">STALE</span>';
    html += '<span class="detalheClassificacao">' + esc(cls.detalhe) + "</span>";
    html += "</div>";

    if (cls.estado === "DIVERGENTE") {
      html += '<p class="avisoDefasagem">' + esc(AVISO_DEFASAGEM) + "</p>";
    }

    html += '<table class="metaTable"><tbody>';
    html += "<tr><th>Leitura da fonte live</th><td>" + ((live && live.diagnosticoFonte) ? (live.diagnosticoFonte.ok ? "OK" : "FALHA — " + esc(live.diagnosticoFonte.motivo)) : "—") + "</td></tr>";
    html += "<tr><th>Execução do Adapter DTE</th><td>" + (live && live.ok ? "OK" : "FALHA — " + esc(live && live.erro)) + "</td></tr>";
    html += "<tr><th>Estado snapshot</th><td>" + (snap && snap.ok ? esc(snap.status) : "FALHA — " + esc(snap && (snap.detalhe || snap.status))) + "</td></tr>";
    html += "<tr><th>capturedAt</th><td>" + esc(snap && snap.ok ? snap.meta.capturedAt : "—") + "</td></tr>";
    html += "<tr><th>referencePeriod</th><td>" + esc(snap && snap.ok ? snap.meta.referencePeriod : "—") + "</td></tr>";
    html += "<tr><th>Idade (horas)</th><td>" + esc(snap && snap.ok ? snap.meta.idadeHoras.toFixed(2) : "—") + "</td></tr>";
    html += "<tr><th>Hash declarado</th><td>" + esc(snap && snap.ok ? snap.meta.hash : "—") + "</td></tr>";
    html += "<tr><th>Total de diferenças</th><td>" + esc(diferencas.length) + "</td></tr>";
    html += "</table>";

    html += "<h3>Volumetria por coleção</h3><table class=\"volTable\"><thead><tr><th>Coleção</th><th>Live</th><th>Snapshot</th></tr></thead><tbody>";
    html += linhaVolumetriaColecao("periodos", volumetria && volumetria.periodos);
    html += linhaVolumetriaColecao("indicadores", volumetria && volumetria.indicadores);
    html += linhaVolumetriaColecao("gerenciasOfensoras", volumetria && volumetria.gerenciasOfensoras);
    html += "</table>";

    html += '<h3>Resumo por coleção</h3><table class="resumoTable"><tbody>';
    COLECOES.forEach(function (c) {
      html += "<tr><td>" + esc(c) + "</td><td>" + esc(resumoColecao[c]) + "</td></tr>";
    });
    html += "</table>";

    html += '<h3>Resumo por natureza</h3><table class="resumoTable"><tbody>';
    NATUREZAS.forEach(function (n) {
      if (resumoNatureza[n] === 0) return;
      html += "<tr><td>" + esc(n) + "</td><td>" + esc(resumoNatureza[n]) + "</td></tr>";
    });
    html += "</table>";

    html += "<h3>Diferenças (" + esc(limitado.totalExibido) + " de " + esc(limitado.totalReal) + " filtradas)</h3>";
    if (limitado.truncado) {
      html += '<p class="avisoLimite">Exibição limitada a ' + esc(CONFIG.limiteDiferencasRenderizadas) +
        " diferenças por desempenho — a contagem total acima (" + esc(limitado.totalReal) +
        ") já reflete o total real, sem truncamento.</p>";
    }
    html += '<table class="diffTable"><thead><tr><th>coleção</th><th>chave</th><th>path</th><th>natureza</th><th>valor live</th><th>valor snapshot</th></tr></thead><tbody>';
    limitado.amostra.forEach(function (d) {
      html += "<tr><td>" + esc(d.colecao) + "</td><td>" + esc(d.chave) + "</td><td>" + esc(d.path) + "</td><td>" + esc(d.natureza) + "</td><td>" +
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
    MODULO_ID: MODULO_ID,
    COLECOES: COLECOES,
    NATUREZAS: NATUREZAS,
    AVISO_COPIA_TECNICA: AVISO_COPIA_TECNICA,
    AVISO_NAO_FECHAMENTO: AVISO_NAO_FECHAMENTO,
    AVISO_PILOTO_ISOLADO: AVISO_PILOTO_ISOLADO,
    AVISO_DEFASAGEM: AVISO_DEFASAGEM,
    esc: esc,
    representarValor: representarValor,
    resolverBaseUrl: resolverBaseUrl,
    resolverLive: resolverLive,
    resolverSnapshot: resolverSnapshot,
    providerFinoLive: providerFinoLive,
    providerFinoSnapshot: providerFinoSnapshot,
    construirChave: construirChave,
    compararColecaoPorChave: compararColecaoPorChave,
    compararPeriodos: compararPeriodos,
    compararColecoesDTE: compararColecoesDTE,
    classificar: classificar,
    agruparPorNatureza: agruparPorNatureza,
    agruparPorColecao: agruparPorColecao,
    aplicarFiltros: aplicarFiltros,
    limitarParaExibicao: limitarParaExibicao,
    iniciarNaPagina: iniciarNaPagina,
    /* expostos só para inspeção em teste — não usar para lógica externa */
    _internos: { renderizar: renderizar, executar: executar, ESTADO: ESTADO }
  };
});
