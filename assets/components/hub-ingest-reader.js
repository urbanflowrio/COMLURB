/* ============================================================
   HUB COMLURB · BIBLIOTECA OFICIAL · hub-ingest-reader.js
   Camada 2 (Ingestão) · v1.1.0
   Dependências: hub-core, hub-sources.
   PROIBIDO nesta camada: interpretar formato (isso é Decoder),
   aplicar alias ou regra institucional (isso é Adapter), decidir
   validade de conteúdo (isso é Validator).

   FASE 3 (07/2026) — ESCOPO MÍNIMO AUTORIZADO:
   Único readerType suportado nesta fase: "local-fixture" — uma fonte
   de teste controlada e local ao repositório, cujo conteúdo bruto é
   fornecido pelo próprio chamador (nunca uma requisição de rede a
   produção). Isto é deliberado: a Fase 3 demonstra o mecanismo, não
   conecta uma fonte real.

   FASE 4 (07/2026) — ADIÇÃO: readerType "remote-csv".
   Fonte pública publicada como CSV (Google Sheets → Publicar na Web
   → CSV, ou qualquer URL que sirva CSV bruto). Este Reader:
   - não conhece AR, IPL, Pessoas ou qualquer outro vocabulário
     institucional — apenas busca texto bruto de uma URL já validada
     pelo Locator;
   - não interpreta linhas/colunas (isso é Decoder, tipo "texto");
   - falha explicitamente em HTTP inválido, corpo vazio, ou resposta
     que começa como HTML (sinal comum de erro de publicação do
     Google Sheets — planilha despublicada ou GID incorreto retornam
     uma página de login/erro, não um 404 limpo);
   - é assíncrono (fetch): exposto como lerAsync, não como ler()
     síncrono (mantido apenas para local-fixture, sem quebrar chamadores
     existentes da Fase 3).

   O Reader consulta o Locator (hub-sources.js) apenas para confirmar
   que a fonte existe e não é restrita — ele não decide layout nem
   significado do conteúdo.
   ============================================================ */

(function () {
  "use strict";

  var HUB = window.HUB;
  HUB.require("core", "sources");

  /**
   * Obtém o conteúdo bruto de uma fonte registrada.
   *
   * @param {string} sourceId identificador da fonte no Locator (hub-sources)
   * @param {Object} opts
   * @param {*} opts.fixture conteúdo bruto controlado (obrigatório para
   *   readerType local-fixture) — matriz (array de arrays), texto CSV
   *   bruto, ou array de objetos já com cabeçalho.
   * @param {"matriz"|"texto"|"objetos"} opts.tipoFixture forma do conteúdo
   *   de opts.fixture.
   * @returns {{ok: boolean, raw: *, tipo: string, motivo: string|null}}
   *   Falha de acesso é sempre relatada explicitamente — nunca mascarada
   *   como dado vazio (ver ADR-005, falha segura).
   */
  function ler(sourceId, opts) {
    opts = opts || {};

    var fonte = HUB.sources.fonte(sourceId);
    if (!fonte) {
      return { ok: false, raw: null, tipo: null, motivo: "Fonte não registrada em hub-sources: " + sourceId };
    }

    var validacao = HUB.sources.validar(sourceId);
    if (!validacao.ok) {
      return { ok: false, raw: null, tipo: null, motivo: validacao.motivo };
    }

    if (fonte.readerType === "local-fixture") {
      if (opts.fixture === undefined || opts.fixture === null) {
        return {
          ok: false, raw: null, tipo: null,
          motivo: "readerType local-fixture exige opts.fixture com o conteúdo bruto de teste."
        };
      }
      if (!opts.tipoFixture || ["matriz", "texto", "objetos"].indexOf(opts.tipoFixture) === -1) {
        return {
          ok: false, raw: null, tipo: null,
          motivo: "opts.tipoFixture obrigatório e deve ser 'matriz', 'texto' ou 'objetos'."
        };
      }
      return { ok: true, raw: opts.fixture, tipo: opts.tipoFixture, motivo: null };
    }

    // Nenhum outro readerType síncrono é suportado. remote-csv exige rede
    // (fetch) e só está disponível via lerAsync — ver abaixo. Não há
    // tentativa de adivinhar comportamento nem de degradar para uma fonte
    // alternativa (ver ADR-001) — falha explícita.
    return {
      ok: false, raw: null, tipo: null,
      motivo: "readerType não suportado por ler() síncrono: " + fonte.readerType +
        ". 'local-fixture' usa ler(); 'remote-csv' exige lerAsync()."
    };
  }

  /**
   * Verifica, de forma estrutural (sem conhecer nenhum vocabulário de
   * domínio), se um corpo de resposta parece CSV bruto e não uma página
   * HTML de erro/login — sintoma comum de planilha despublicada, GID
   * incorreto, ou sessão expirada no Google Sheets.
   */
  function pareceHtml(texto) {
    var inicio = String(texto || "").trim().slice(0, 256).toLowerCase();
    return inicio.indexOf("<!doctype html") === 0 ||
      inicio.indexOf("<html") === 0 ||
      (inicio.indexOf("<") === 0 && inicio.indexOf("<?xml") !== 0);
  }

  /**
   * Versão assíncrona do Reader. Único caminho para readerType
   * "remote-csv"; local-fixture também é aceito aqui (delega para ler())
   * para que um chamador não precise saber, por fonte, qual variante usar.
   *
   * @param {string} sourceId
   * @param {Object} opts
   * @param {Function} [opts.fetchImpl] implementação de fetch a usar
   *   (padrão: fetch global). Ponto de injeção exclusivamente para teste
   *   determinístico (Node/CI) — nunca usado para simular produção real;
   *   em ambiente de navegador real, sempre o fetch nativo é usado.
   * @returns {Promise<{ok:boolean, raw:*, tipo:string, motivo:string|null}>}
   */
  function lerAsync(sourceId, opts) {
    opts = opts || {};

    var fonte = HUB.sources.fonte(sourceId);
    if (!fonte) {
      return Promise.resolve({ ok: false, raw: null, tipo: null, motivo: "Fonte não registrada em hub-sources: " + sourceId });
    }

    var validacao = HUB.sources.validar(sourceId);
    if (!validacao.ok) {
      return Promise.resolve({ ok: false, raw: null, tipo: null, motivo: validacao.motivo });
    }

    if (fonte.readerType === "local-fixture") {
      return Promise.resolve(ler(sourceId, opts));
    }

    if (fonte.readerType !== "remote-csv") {
      return Promise.resolve({
        ok: false, raw: null, tipo: null,
        motivo: "readerType não suportado na Fase 4: " + fonte.readerType +
          ". Suportados: 'local-fixture', 'remote-csv'."
      });
    }

    var fetchImpl = opts.fetchImpl || (typeof fetch !== "undefined" ? fetch : null);
    if (!fetchImpl) {
      return Promise.resolve({
        ok: false, raw: null, tipo: null,
        motivo: "Nenhuma implementação de fetch disponível neste ambiente para readerType remote-csv."
      });
    }

    if (!fonte.url) {
      return Promise.resolve({ ok: false, raw: null, tipo: null, motivo: "Fonte remote-csv sem URL configurada em hub-sources: " + sourceId });
    }

    return fetchImpl(fonte.url)
      .then(function (resposta) {
        if (!resposta || !resposta.ok) {
          var statusTxt = resposta ? (resposta.status + " " + resposta.statusText) : "sem resposta";
          throw new Error("HTTP inválido ao buscar fonte '" + sourceId + "': " + statusTxt);
        }
        return resposta.text();
      })
      .then(function (texto) {
        if (texto === undefined || texto === null || texto.trim() === "") {
          return { ok: false, raw: null, tipo: null, motivo: "Resposta vazia para a fonte '" + sourceId + "'." };
        }
        if (pareceHtml(texto)) {
          return {
            ok: false, raw: null, tipo: null,
            motivo: "Resposta parece HTML, não CSV, para a fonte '" + sourceId + "' — verifique publicação " +
              "(Arquivo → Compartilhar → Publicar na web → CSV) e o GID configurado em hub-sources."
          };
        }
        return { ok: true, raw: texto, tipo: "texto", motivo: null };
      })
      .catch(function (erro) {
        return { ok: false, raw: null, tipo: null, motivo: "Falha ao buscar fonte '" + sourceId + "': " + (erro && erro.message ? erro.message : String(erro)) };
      });
  }

  /* ---------- exporta ---------- */

  HUB.ingest = HUB.ingest || {};
  HUB.ingest.reader = { ler: ler, lerAsync: lerAsync, _pareceHtml: pareceHtml };

  HUB.registerComponent("ingest-reader");

})();
