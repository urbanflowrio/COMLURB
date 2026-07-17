/* ============================================================
   HUB COMLURB / UrbanFlow Core · assets/components/hub-snapshot-reader.js
   Fase 7A (07/2026) · v1.0.0
   Dependências: nenhuma.

   RESPONSABILIDADE ÚNICA: ler, validar e resolver com segurança um
   ponteiro latest.json e o snapshot por ele apontado. Não decide
   estratégia de fonte (isso é hub-data-source.js), não conhece AR,
   DTE, CSV, Google Sheets, GitHub ou GitHub Pages, não escreve em
   disco, nunca faz fallback, nunca executa conteúdo do snapshot.

   PADRÃO DE MÓDULO (desvio deliberado, restrito a este arquivo):
   Todo o restante da biblioteca HUB usa IIFE de navegador
   (window.HUB, ver hub-core.js). Este arquivo e hub-data-source.js
   usam, em vez disso, um padrão dual — anexam-se a window.HUB quando
   window existe, e exportam via module.exports quando module existe
   — para serem carregáveis em Node por require() direto nos testes,
   sem eval e sem depender do harness de bootstrap da Fase 6
   (snapshot/lib/bootstrap-hub.js, que usa eval e não foi alterado
   nem reutilizado aqui). Nenhum componente antigo foi alterado para
   uniformizar este padrão; a divergência é intencional e restrita a
   estes dois arquivos novos.

   LIMITAÇÃO DOCUMENTADA SOBRE HASH:
   A verificação `latest.hash === snapshot.hash` confirma apenas a
   coerência DECLARADA entre o ponteiro e o arquivo por ele apontado
   — ou seja, que quem gravou o snapshot também gravou um latest.json
   consistente com ele. NÃO é uma validação criptográfica do conteúdo:
   se alguém editar manualmente payload/envelope do snapshot e
   preservar (ou recopiar) o campo `hash`, esta checagem não detecta
   a alteração. Este arquivo não recomputa o hash canônico (isso
   pertence a snapshot/lib/canonical.js e snapshot/lib/snapshot-core.js
   da Fase 6, propositalmente não duplicados nem alterados aqui).
   Recomputação de hash no navegador é evolução arquitetural futura,
   condicionada a decisão explícita sobre reuso de canonicalização
   entre Node e browser.
   ============================================================ */

(function (root, factory) {
  "use strict";
  var modulo = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = modulo;
  }
  if (typeof window !== "undefined") {
    window.HUB = window.HUB || {};
    window.HUB.snapshotReader = modulo;
    if (typeof window.HUB.registerComponent === "function") {
      window.HUB.registerComponent("snapshotReader");
    }
  }
})(typeof window !== "undefined" ? window : this, function () {
  "use strict";

  /* ---------- estados (enumeração fechada, contrato público) ---------- */

  var ESTADOS = Object.freeze({
    VALIDO: "snapshot_valido",
    AUSENTE: "snapshot_ausente",
    LATEST_INVALIDO: "latest_invalido",
    APONTADO_AUSENTE: "snapshot_apontado_ausente",
    HASH_DIVERGENTE: "hash_divergente",
    MODULO_DIVERGENTE: "modulo_divergente",
    VERSAO_INCOMPATIVEL: "versao_incompativel",
    SCHEMA_INCOMPATIVEL: "schema_incompativel",
    CONTRATO_INVALIDO: "contrato_invalido",
    ERRO_LEITURA: "erro_leitura",
    STALE: "stale",
    PARAMETRO_INVALIDO: "parametro_invalido"
  });

  var FORMATO_VERSAO = /^[A-Za-z0-9][A-Za-z0-9_.\-]*$/;
  var FORMATO_MODULO_ID = /^[A-Za-z0-9_-]+$/;

  /* ---------- helpers puros ---------- */

  function resultado(status, moduloId, detalhe, extra) {
    var base = {
      status: status,
      moduloId: moduloId || null,
      detalhe: detalhe || "",
      snapshot: null,
      meta: null
    };
    if (extra) {
      for (var k in extra) {
        if (Object.prototype.hasOwnProperty.call(extra, k)) base[k] = extra[k];
      }
    }
    return base;
  }

  function ehStringNaoVazia(v) {
    return typeof v === "string" && v.length > 0;
  }

  function formatoAceitavel(v) {
    return ehStringNaoVazia(v) && FORMATO_VERSAO.test(v);
  }

  function dataValidaISO(v) {
    if (!ehStringNaoVazia(v)) return false;
    var t = Date.parse(v);
    return !isNaN(t);
  }

  /**
   * Valida que `caminho` (o campo `path` de latest.json) é uma
   * referência relativa segura, restrita ao diretório de snapshots
   * do módulo solicitado. Validação estrutural por segmento — nunca
   * apenas `indexOf("..") !== -1`, e decodifica iterativamente (até
   * 3 vezes) para capturar path traversal codificado (inclusive
   * duplamente codificado).
   */
  function pathSeguro(caminho, moduloId) {
    if (!ehStringNaoVazia(caminho)) {
      return { ok: false, motivo: "path ausente ou não é string." };
    }
    if (caminho.charAt(0) === "/") {
      return { ok: false, motivo: "path absoluto não permitido." };
    }
    if (caminho.indexOf("\\") !== -1) {
      return { ok: false, motivo: "path contém barra invertida." };
    }
    if (caminho.indexOf("://") !== -1) {
      return { ok: false, motivo: "path contém protocolo/URL absoluta." };
    }
    if (caminho.indexOf("//") === 0) {
      return { ok: false, motivo: "path protocolo-relativo não permitido." };
    }

    var atual = caminho;
    for (var tentativa = 0; tentativa < 3; tentativa++) {
      if (segmentoProibido(atual)) {
        return { ok: false, motivo: "path contém segmento de travessia ('.' ou '..')." };
      }
      if (atual.indexOf("\\") !== -1 || atual.toLowerCase().indexOf("%5c") !== -1) {
        return { ok: false, motivo: "path contém barra invertida (direta ou codificada)." };
      }
      var decodificado;
      try {
        decodificado = decodeURIComponent(atual);
      } catch (e) {
        return { ok: false, motivo: "path malformado (falha ao decodificar percent-encoding)." };
      }
      if (decodificado === atual) break;
      atual = decodificado;
    }
    if (segmentoProibido(atual)) {
      return { ok: false, motivo: "path contém segmento de travessia codificado ('.' ou '..')." };
    }

    var prefixoEsperado = "snapshots/" + moduloId + "/";
    if (atual.indexOf(prefixoEsperado) !== 0) {
      return { ok: false, motivo: "path fora do diretório esperado do módulo (" + prefixoEsperado + ")." };
    }

    return { ok: true, motivo: null };
  }

  function segmentoProibido(str) {
    var partes = str.split("/");
    for (var i = 0; i < partes.length; i++) {
      if (partes[i] === "." || partes[i] === "..") return true;
    }
    return false;
  }

  /**
   * Validação mínima de baseUrl — rejeita apenas casos claramente
   * inválidos ou perigosos (vazio/só espaços, caractere nulo,
   * protocolos javascript:/data:). Continua aceitando URL http/https,
   * "mock://" (usado pelos testes) e caminho relativo explícito — não
   * é acoplada a GitHub Pages nem a nenhum host específico.
   */
  function baseUrlValido(b) {
    if (typeof b !== "string") return { ok: false, motivo: "baseUrl deve ser string." };
    if (b.indexOf("\u0000") !== -1) return { ok: false, motivo: "baseUrl contém caractere nulo." };
    var semEspacos = b.trim();
    if (semEspacos.length === 0) return { ok: false, motivo: "baseUrl vazio ou composto apenas por espaços." };
    var minuscula = semEspacos.toLowerCase();
    if (minuscula.indexOf("javascript:") === 0) return { ok: false, motivo: "baseUrl com protocolo javascript: não permitido." };
    if (minuscula.indexOf("data:") === 0) return { ok: false, motivo: "baseUrl com protocolo data: não permitido." };
    return { ok: true, motivo: null };
  }

  /**
   * Junção de URL/caminho deliberadamente simples (concatenação de
   * string, sem WHATWG URL) — baseUrl é tratado como prefixo opaco
   * (pode ser URL absoluta ou caminho relativo local, útil também
   * fora de navegador/GitHub Pages), e o restante já foi validado
   * estruturalmente por pathSeguro/regras de moduloId antes de chegar
   * aqui.
   */
  function juntar(base, resto) {
    var b = String(base).replace(/\/+$/, "");
    var r = String(resto).replace(/^\/+/, "");
    return b + "/" + r;
  }

  function validarContratoLatest(obj) {
    var motivos = [];
    if (!obj || typeof obj !== "object") return { valido: false, motivos: ["latest.json não é um objeto."] };
    if (!ehStringNaoVazia(obj.moduloId)) motivos.push("moduloId ausente.");
    if (!formatoAceitavel(obj.snapshotVersion)) motivos.push("snapshotVersion ausente ou em formato inaceitável.");
    if (!ehStringNaoVazia(obj.path)) motivos.push("path ausente.");
    if (!ehStringNaoVazia(obj.hash)) motivos.push("hash ausente.");
    if (!ehStringNaoVazia(obj.referencePeriod)) motivos.push("referencePeriod ausente.");
    if (!dataValidaISO(obj.capturedAt)) motivos.push("capturedAt ausente ou inválido.");
    if (!formatoAceitavel(obj.schemaVersion)) motivos.push("schemaVersion ausente ou em formato inaceitável.");
    return { valido: motivos.length === 0, motivos: motivos };
  }

  function validarContratoSnapshot(obj) {
    var motivos = [];
    if (!obj || typeof obj !== "object") return { valido: false, motivos: ["snapshot não é um objeto."] };
    if (!ehStringNaoVazia(obj.moduloId)) motivos.push("moduloId ausente no snapshot.");
    if (!formatoAceitavel(obj.snapshotVersion)) motivos.push("snapshotVersion ausente/inválida no snapshot.");
    if (!ehStringNaoVazia(obj.hash)) motivos.push("hash ausente no snapshot.");
    var env = obj.envelope;
    if (!env || typeof env !== "object") {
      motivos.push("envelope canônico ausente no snapshot.");
      return { valido: false, motivos: motivos };
    }
    if (!formatoAceitavel(env.schemaVersion)) motivos.push("envelope.schemaVersion ausente/inválido.");
    if (!ehStringNaoVazia(env.sourceId)) motivos.push("envelope.sourceId ausente.");
    if (!dataValidaISO(env.capturedAt)) motivos.push("envelope.capturedAt ausente ou inválido.");
    if (!ehStringNaoVazia(env.referencePeriod)) motivos.push("envelope.referencePeriod ausente.");
    if (env.payload === null || env.payload === undefined) motivos.push("envelope.payload ausente (null/undefined).");
    return { valido: motivos.length === 0, motivos: motivos };
  }

  /**
   * Coerência obrigatória entre latest.snapshotVersion e
   * snapshot.snapshotVersion — validada SEMPRE, mesmo sem
   * expectedSnapshotVersion. Quando expectedSnapshotVersion é
   * informado, os três valores (latest, snapshot, expected) devem
   * ser compatíveis entre si.
   */
  function snapshotVersionCoerente(latest, snap, expected) {
    if (latest.snapshotVersion !== snap.snapshotVersion) {
      return { ok: false, motivo: "latest.snapshotVersion ('" + latest.snapshotVersion + "') diverge de snapshot.snapshotVersion ('" + snap.snapshotVersion + "')." };
    }
    if (expected !== undefined && expected !== latest.snapshotVersion) {
      return { ok: false, motivo: "expectedSnapshotVersion ('" + expected + "') diverge de snapshotVersion ('" + latest.snapshotVersion + "')." };
    }
    return { ok: true, motivo: null };
  }

  /**
   * Coerência obrigatória entre latest.schemaVersion e
   * snapshot.envelope.schemaVersion — validada SEMPRE, mesmo sem
   * expectedSchemaVersion. Quando expectedSchemaVersion é informado,
   * os três valores (latest, envelope, expected) devem ser
   * compatíveis entre si.
   */
  function schemaVersionCoerente(latest, snap, expected) {
    if (latest.schemaVersion !== snap.envelope.schemaVersion) {
      return { ok: false, motivo: "latest.schemaVersion ('" + latest.schemaVersion + "') diverge de envelope.schemaVersion ('" + snap.envelope.schemaVersion + "')." };
    }
    if (expected !== undefined && expected !== latest.schemaVersion) {
      return { ok: false, motivo: "expectedSchemaVersion ('" + expected + "') diverge de schemaVersion ('" + latest.schemaVersion + "')." };
    }
    return { ok: true, motivo: null };
  }

  /**
   * Executa um fetch e classifica a resposta em sucesso, "ausente"
   * (404) ou erro de leitura — sem depender de texto de mensagem.
   */
  function buscar(fetchImpl, url) {
    var resposta;
    return Promise.resolve()
      .then(function () { return fetchImpl(url, { cache: "no-store" }); })
      .then(function (r) {
        resposta = r;
        if (!r || typeof r.ok !== "boolean") {
          return { falhaRede: true, status404: false, texto: null };
        }
        if (r.status === 404) {
          return { falhaRede: false, status404: true, texto: null };
        }
        if (!r.ok) {
          return { falhaRede: true, status404: false, texto: null };
        }
        return r.text().then(function (t) {
          return { falhaRede: false, status404: false, texto: t };
        });
      })
      .catch(function () {
        return { falhaRede: true, status404: false, texto: null };
      });
  }

  function tentarParseJSON(texto) {
    try {
      return { ok: true, valor: JSON.parse(texto) };
    } catch (e) {
      return { ok: false, valor: null };
    }
  }

  /* ---------- função principal ---------- */

  /**
   * @param {string} moduloId identificador curto e opaco do módulo (ex.: "ar", "engenharia-dte")
   * @param {Object} opts
   * @param {Function} [opts.fetchImpl] injeção obrigatória em Node; em navegador, se omitido, usa globalThis.fetch quando disponível
   * @param {string} opts.baseUrl raiz onde vive o diretório "snapshots/" (obrigatório, sem valor padrão — nunca acoplado a GitHub/COMLURB)
   * @param {number} [opts.maxAgeHoras] limite de idade em horas; ausente/null/undefined = sem avaliação de idade
   * @param {string} [opts.expectedSnapshotVersion] latest.snapshotVersion e snapshot.snapshotVersion são sempre comparados entre si (mesmo sem este parâmetro); se informado, os três valores (latest, snapshot, expected) devem ser compatíveis — qualquer divergência => versao_incompativel
   * @param {string} [opts.expectedSchemaVersion] latest.schemaVersion e envelope.schemaVersion são sempre comparados entre si (mesmo sem este parâmetro); se informado, os três valores (latest, envelope, expected) devem ser compatíveis — qualquer divergência => schema_incompativel
   * @param {Function} [opts.now] injeção de relógio para testes — função sem argumentos retornando epoch ms; padrão Date.now
   * @returns {Promise<Object>} resultado estruturado — nunca lança exceção para falhas operacionais esperadas
   */
  function lerAsync(moduloId, opts) {
    opts = opts || {};

    if (!ehStringNaoVazia(moduloId) || !FORMATO_MODULO_ID.test(moduloId)) {
      return Promise.resolve(resultado(ESTADOS.PARAMETRO_INVALIDO, moduloId, "moduloId obrigatório e deve conter apenas letras, números, '_' ou '-'."));
    }
    if (!ehStringNaoVazia(opts.baseUrl)) {
      return Promise.resolve(resultado(ESTADOS.PARAMETRO_INVALIDO, moduloId, "baseUrl obrigatório (nenhum valor padrão é assumido)."));
    }
    var validacaoBaseUrl = baseUrlValido(opts.baseUrl);
    if (!validacaoBaseUrl.ok) {
      return Promise.resolve(resultado(ESTADOS.PARAMETRO_INVALIDO, moduloId, "baseUrl inválido: " + validacaoBaseUrl.motivo));
    }
    var maxAgeHoras = null;
    if (opts.maxAgeHoras !== undefined && opts.maxAgeHoras !== null) {
      if (typeof opts.maxAgeHoras !== "number" || !isFinite(opts.maxAgeHoras) || opts.maxAgeHoras < 0) {
        return Promise.resolve(resultado(ESTADOS.PARAMETRO_INVALIDO, moduloId, "maxAgeHoras, quando informado, deve ser número finito >= 0."));
      }
      maxAgeHoras = opts.maxAgeHoras;
    }
    if (opts.expectedSnapshotVersion !== undefined && !ehStringNaoVazia(opts.expectedSnapshotVersion)) {
      return Promise.resolve(resultado(ESTADOS.PARAMETRO_INVALIDO, moduloId, "expectedSnapshotVersion, quando informado, deve ser string não vazia."));
    }
    if (opts.expectedSchemaVersion !== undefined && !ehStringNaoVazia(opts.expectedSchemaVersion)) {
      return Promise.resolve(resultado(ESTADOS.PARAMETRO_INVALIDO, moduloId, "expectedSchemaVersion, quando informado, deve ser string não vazia."));
    }

    var ambienteBrowser = (typeof window !== "undefined");
    var fetchImpl = opts.fetchImpl;
    if (typeof fetchImpl !== "function") {
      if (ambienteBrowser && typeof globalThis !== "undefined" && typeof globalThis.fetch === "function") {
        fetchImpl = globalThis.fetch;
      } else {
        return Promise.resolve(resultado(
          ESTADOS.PARAMETRO_INVALIDO,
          moduloId,
          "fetchImpl não informado. Em Node, fetchImpl deve ser sempre injetado explicitamente (nenhum acesso de rede automático); globalThis.fetch automático só se aplica em navegador."
        ));
      }
    }

    var agora = (typeof opts.now === "function") ? opts.now : Date.now;

    var latestUrl = juntar(opts.baseUrl, "snapshots/" + moduloId + "/latest.json");

    return buscar(fetchImpl, latestUrl).then(function (respLatest) {
      if (respLatest.falhaRede) {
        return resultado(ESTADOS.ERRO_LEITURA, moduloId, "Falha de rede/leitura ao buscar latest.json.");
      }
      if (respLatest.status404) {
        return resultado(ESTADOS.AUSENTE, moduloId, "latest.json não encontrado (404) — módulo nunca teve snapshot publicado.");
      }

      var parseLatest = tentarParseJSON(respLatest.texto);
      if (!parseLatest.ok) {
        return resultado(ESTADOS.LATEST_INVALIDO, moduloId, "latest.json não é JSON válido.");
      }
      var latest = parseLatest.valor;

      var validacaoLatest = validarContratoLatest(latest);
      if (!validacaoLatest.valido) {
        return resultado(ESTADOS.LATEST_INVALIDO, moduloId, "Contrato de latest.json inválido: " + validacaoLatest.motivos.join(" "));
      }

      if (latest.moduloId !== moduloId) {
        return resultado(ESTADOS.MODULO_DIVERGENTE, moduloId, "latest.moduloId ('" + latest.moduloId + "') diverge do módulo solicitado ('" + moduloId + "').");
      }

      var validacaoPath = pathSeguro(latest.path, moduloId);
      if (!validacaoPath.ok) {
        return resultado(ESTADOS.LATEST_INVALIDO, moduloId, "path inseguro em latest.json: " + validacaoPath.motivo);
      }

      var snapshotUrl = juntar(opts.baseUrl, latest.path);

      return buscar(fetchImpl, snapshotUrl).then(function (respSnapshot) {
        if (respSnapshot.falhaRede) {
          return resultado(ESTADOS.ERRO_LEITURA, moduloId, "Falha de rede/leitura ao buscar o snapshot apontado por latest.json.");
        }
        if (respSnapshot.status404) {
          return resultado(ESTADOS.APONTADO_AUSENTE, moduloId, "Snapshot apontado por latest.json não encontrado (404).");
        }

        var parseSnapshot = tentarParseJSON(respSnapshot.texto);
        if (!parseSnapshot.ok) {
          return resultado(ESTADOS.CONTRATO_INVALIDO, moduloId, "Snapshot apontado não é JSON válido.");
        }
        var snap = parseSnapshot.valor;

        var validacaoSnapshot = validarContratoSnapshot(snap);
        if (!validacaoSnapshot.valido) {
          return resultado(ESTADOS.CONTRATO_INVALIDO, moduloId, "Contrato do snapshot inválido: " + validacaoSnapshot.motivos.join(" "));
        }

        if (snap.moduloId !== moduloId) {
          return resultado(ESTADOS.MODULO_DIVERGENTE, moduloId, "snapshot.moduloId ('" + snap.moduloId + "') diverge do módulo solicitado ('" + moduloId + "').");
        }

        // Ver limitação documentada no cabeçalho do arquivo: isto é
        // coerência declarada entre ponteiro e arquivo, não validação
        // criptográfica do conteúdo.
        if (latest.hash !== snap.hash) {
          return resultado(ESTADOS.HASH_DIVERGENTE, moduloId, "latest.hash difere de snapshot.hash — coerência declarada entre ponteiro e arquivo falhou.");
        }

        if (latest.referencePeriod !== snap.envelope.referencePeriod) {
          return resultado(ESTADOS.CONTRATO_INVALIDO, moduloId, "referencePeriod de latest.json diverge do envelope do snapshot.");
        }

        // Coerência obrigatória entre ponteiro e envelope — validada
        // sempre, independentemente de expectedSnapshotVersion/
        // expectedSchemaVersion terem sido informados. O contrato da
        // Fase 6 grava os mesmos valores em latest.json e no
        // envelope; qualquer divergência indica ponteiro e snapshot
        // descrevendo capturas diferentes.
        var coerenciaVersao = snapshotVersionCoerente(latest, snap, opts.expectedSnapshotVersion);
        if (!coerenciaVersao.ok) {
          return resultado(ESTADOS.VERSAO_INCOMPATIVEL, moduloId, coerenciaVersao.motivo);
        }

        var coerenciaSchema = schemaVersionCoerente(latest, snap, opts.expectedSchemaVersion);
        if (!coerenciaSchema.ok) {
          return resultado(ESTADOS.SCHEMA_INCOMPATIVEL, moduloId, coerenciaSchema.motivo);
        }

        // Sem tolerância temporal silenciosa nesta fase: o contrato da
        // Fase 6 grava o mesmo capturedAt no ponteiro e no envelope.
        if (latest.capturedAt !== snap.envelope.capturedAt) {
          return resultado(ESTADOS.CONTRATO_INVALIDO, moduloId, "latest.capturedAt ('" + latest.capturedAt + "') difere de envelope.capturedAt ('" + snap.envelope.capturedAt + "') — ponteiro e envelope descrevem capturas diferentes.");
        }

        var capturedAtMs = Date.parse(snap.envelope.capturedAt);
        var idadeHoras = (agora() - capturedAtMs) / (1000 * 60 * 60);

        var meta = {
          hash: snap.hash,
          moduloId: snap.moduloId,
          referencePeriod: snap.envelope.referencePeriod,
          capturedAt: snap.envelope.capturedAt,
          schemaVersion: snap.envelope.schemaVersion,
          snapshotVersion: snap.snapshotVersion,
          path: latest.path,
          idadeHoras: idadeHoras
        };

        if (maxAgeHoras !== null && idadeHoras > maxAgeHoras) {
          return resultado(ESTADOS.STALE, moduloId, "Snapshot válido, porém além de maxAgeHoras (" + maxAgeHoras + "h) — idade atual: " + idadeHoras.toFixed(2) + "h.", { snapshot: snap, meta: meta });
        }

        return resultado(ESTADOS.VALIDO, moduloId, "", { snapshot: snap, meta: meta });
      });
    });
  }

  return {
    ESTADOS: ESTADOS,
    lerAsync: lerAsync,
    /* expostos para testes/inspeção — não usar para lógica de decisão externa */
    _internos: {
      pathSeguro: pathSeguro,
      validarContratoLatest: validarContratoLatest,
      validarContratoSnapshot: validarContratoSnapshot,
      juntar: juntar,
      formatoAceitavel: formatoAceitavel,
      dataValidaISO: dataValidaISO
    }
  };
});
