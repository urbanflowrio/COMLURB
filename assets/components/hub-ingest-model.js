/* ============================================================
   HUB COMLURB · BIBLIOTECA OFICIAL · hub-ingest-model.js
   Camada 2 (Ingestão) · v1.0.0
   Dependências: hub-core.
   PROIBIDO nesta camada: DOM, fetch, Papa.parse, aliases, regra
   institucional (AR, IPL, SARC), conhecimento de layout de fonte.

   FASE 3 (07/2026) — ESCOPO MÍNIMO AUTORIZADO:
   Define o envelope comum do modelo canônico (Locator -> Reader ->
   Decoder -> Adapter -> Validator -> Modelo canônico) e os dois
   domínios iniciais autorizados: indicadores/metas e séries
   operacionais. Não modela Pessoas, Contratos, Financeiro nem
   Geografia nesta fase.

   Este arquivo não decide COMO um dado chega (isso é Reader/Decoder/
   Adapter) nem SE ele é válido (isso é Validator) — apenas a FORMA
   final que qualquer dado ingerido deve assumir.
   ============================================================ */

(function () {
  "use strict";

  var HUB = window.HUB;
  HUB.require("core");

  /* ---------- domínios autorizados nesta fase ---------- */

  var DOMINIO = {
    INDICADORES_METAS: "indicadores_metas",
    SERIES_OPERACIONAIS: "series_operacionais"
  };

  function ehDominioValido(d) {
    for (var k in DOMINIO) {
      if (DOMINIO.hasOwnProperty(k) && DOMINIO[k] === d) return true;
    }
    return false;
  }

  /* ---------- versão do mecanismo de ingestão ----------
     Não é a versão de nenhuma regra institucional (isso é hub-rules).
     É a versão do próprio pipeline Reader/Decoder/Adapter/Validator,
     registrada em lineage para reprodutibilidade futura (ver ADR-004,
     que trata do que "recriável" significa — snapshot não faz parte
     desta fase, mas a lineage já é escrita pensando nele). */

  var PIPELINE_VERSION = "1.0.0";

  /* ---------- quality ----------
     Nunca corrige silenciosamente. Erros bloqueiam o dado da linha
     (falha segura); avisos não bloqueiam, mas ficam registrados. */

  function criarQuality(erros, avisos) {
    erros = erros || [];
    avisos = avisos || [];
    return {
      erros: erros.slice(),
      avisos: avisos.slice(),
      status: erros.length ? "erro" : (avisos.length ? "atencao" : "ok")
    };
  }

  /* ---------- lineage ----------
     origem: sourceId (Locator). etapa: última etapa que produziu este
     envelope. versaoPipeline: versão do Reader/Decoder/Adapter/Validator
     que processou a entrada. versaoSchema: schemaVersion do modelo
     canônico produzido. timestamp: instante da produção do envelope. */

  function criarLineage(origem, etapa) {
    return {
      origem: origem,
      etapa: etapa,
      versaoPipeline: PIPELINE_VERSION,
      timestamp: new Date().toISOString()
    };
  }

  /* ---------- envelope comum ----------
     Falha segura: se domain, schemaVersion ou sourceId estiverem
     ausentes ou o domain for desconhecido, o envelope não é
     construído — lança erro explícito em vez de produzir um
     envelope incompleto que um painel poderia interpretar como
     dado oficial. */

  function criarEnvelope(params) {
    params = params || {};

    if (!params.schemaVersion) {
      throw new Error("[HUB.ingest.model] schemaVersion é obrigatório no envelope.");
    }
    if (!params.sourceId) {
      throw new Error("[HUB.ingest.model] sourceId é obrigatório no envelope.");
    }
    if (!ehDominioValido(params.domain)) {
      throw new Error("[HUB.ingest.model] domain desconhecido ou não modelado nesta fase: " + params.domain);
    }
    if (!params.quality) {
      throw new Error("[HUB.ingest.model] quality é obrigatório no envelope (ver ADR-005, falha segura).");
    }
    if (!params.lineage) {
      throw new Error("[HUB.ingest.model] lineage é obrigatório no envelope.");
    }

    return {
      schemaVersion: params.schemaVersion,
      sourceId: params.sourceId,
      capturedAt: new Date().toISOString(),
      referencePeriod: params.referencePeriod || null,
      domain: params.domain,
      payload: params.payload === undefined ? null : params.payload,
      quality: params.quality,
      lineage: params.lineage
    };
  }

  /* ---------- exporta ---------- */

  HUB.ingest = HUB.ingest || {};
  HUB.ingest.PIPELINE_VERSION = PIPELINE_VERSION;
  HUB.ingest.DOMINIO = DOMINIO;
  HUB.ingest.model = {
    criarEnvelope: criarEnvelope,
    criarQuality: criarQuality,
    criarLineage: criarLineage,
    ehDominioValido: ehDominioValido
  };

  HUB.registerComponent("ingest-model");

})();
