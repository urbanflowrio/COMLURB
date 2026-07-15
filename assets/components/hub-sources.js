/* ============================================================
   HUB COMLURB · BIBLIOTECA OFICIAL · hub-sources.js
   Camada 2 (Locator) · v1.0.0-ar
   Dependências: hub-core apenas (deliberado — ver nota abaixo).

   ESCOPO DESTA ENTREGA (Fase 4 · Piloto A/AR): este arquivo NÃO existe
   ainda em main. Esta é a primeira publicação do Locator, e registra
   as quatro fontes reais do AR (AR_GERAL, AR_2026, AR_MAPEAMENTO,
   AR_GOVERNANCA) por completude do contrato já usado em ar-config.js.

   IMPORTANTE — registrar não é o mesmo que consumir: o Adapter AR
   (hub-ingest-adapter-ar.js) e o piloto (ar/piloto/index.html) usam
   apenas TRÊS dessas fontes (AR_GERAL, AR_2026, AR_MAPEAMENTO).
   AR_GOVERNANCA fica registrada, disponível para quando algum painel
   realmente precisar dela, mas não é buscada nem lida nesta fase —
   nenhuma linha de código força seu uso só para fechar a contagem em
   quatro (ver IMPLEMENTATION_STATUS.md · Fase 4, item de auditoria 1).

   Nenhuma fonte de outro módulo (Pessoas, IPL, etc.) foi incluída,
   para não antecipar decisão de arquitetura fora do escopo desta
   entrega ("concluir somente a Fase 4"). Novas fontes devem ser
   adicionadas aqui quando o módulo correspondente também migrar, não
   antes.

   Depende só de hub-core (não de hub-utils) porque hub-utils.js
   publicado em main ainda é uma versão anterior à "Fase 2" (sem
   HUB.require/registerComponent) — ver IMPLEMENTATION_STATUS.md.
   ============================================================ */

(function () {
  "use strict";

  var HUB = window.HUB;
  HUB.require("core");

  var ACESSO = { PUBLICO: "publico", RESTRITO: "restrito" };
  var SENSIBILIDADE = { NENHUMA: "nenhuma", AGREGADA: "agregada", INDIVIDUAL: "individual" };

  var REGISTRO = {
    AR_GERAL: {
      id: "AR_GERAL",
      descricao: "Acordo de Resultados — aba Geral (série mensal por indicador, todas as diretorias)",
      url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQphrIIjiY4aWBONgByLezMnFk8YbyYpF-vtgxOLoV8-85_WUVAXH_f_Ahy8ymxmgnGXmQ_KiFSOkIK/pub?gid=1044100274&single=true&output=csv",
      readerType: "remote-csv",
      acesso: ACESSO.PUBLICO,
      sensibilidade: SENSIBILIDADE.NENHUMA,
      schemaVersion: "indicadores.v1",
      periodicidade: "mensal"
    },
    AR_2026: {
      id: "AR_2026",
      descricao: "Acordo de Resultados 2026 — indicadores pactuados (Estratégicas/Condicionadas/Performance)",
      url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQphrIIjiY4aWBONgByLezMnFk8YbyYpF-vtgxOLoV8-85_WUVAXH_f_Ahy8ymxmgnGXmQ_KiFSOkIK/pub?gid=2044729258&single=true&output=csv",
      readerType: "remote-csv",
      acesso: ACESSO.PUBLICO,
      sensibilidade: SENSIBILIDADE.NENHUMA,
      schemaVersion: "indicadores.v1",
      periodicidade: "mensal"
    },
    AR_MAPEAMENTO: {
      id: "AR_MAPEAMENTO",
      descricao: "Acordo de Resultados — mapeamento código AR → indicador/filtros da aba Geral",
      url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQphrIIjiY4aWBONgByLezMnFk8YbyYpF-vtgxOLoV8-85_WUVAXH_f_Ahy8ymxmgnGXmQ_KiFSOkIK/pub?gid=1233253722&single=true&output=csv",
      readerType: "remote-csv",
      acesso: ACESSO.PUBLICO,
      sensibilidade: SENSIBILIDADE.NENHUMA,
      schemaVersion: "indicadores.v1",
      periodicidade: "mensal"
    },
    AR_GOVERNANCA: {
      id: "AR_GOVERNANCA",
      descricao: "Acordo de Resultados — aba de governança/CVL. Registrada por completude do contrato de " +
        "ar-config.js. NÃO é consumida pelo render legado atual (ar/index.html só lê geral/ar2026/mapeamento) " +
        "nem pelo Adapter AR/piloto desta fase (hub-ingest-adapter-ar.js busca só AR_GERAL/AR_2026/AR_MAPEAMENTO). " +
        "Três fontes operacionais, uma registrada sem consumo — não forçar uso só para fechar a contagem em quatro.",
      url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQphrIIjiY4aWBONgByLezMnFk8YbyYpF-vtgxOLoV8-85_WUVAXH_f_Ahy8ymxmgnGXmQ_KiFSOkIK/pub?gid=2035928171&single=true&output=csv",
      readerType: "remote-csv",
      acesso: ACESSO.PUBLICO,
      sensibilidade: SENSIBILIDADE.NENHUMA,
      schemaVersion: "indicadores.v1",
      periodicidade: "mensal"
    }
  };

  function fonte(id) {
    return REGISTRO.hasOwnProperty(id) ? REGISTRO[id] : null;
  }

  function ehRestrita(id) {
    var f = fonte(id);
    return !f || f.acesso === ACESSO.RESTRITO;
  }

  function validar(id) {
    var f = fonte(id);
    if (!f) return { ok: false, motivo: "Fonte não registrada em hub-sources: " + id };
    if (f.acesso === ACESSO.RESTRITO) return { ok: false, motivo: f.motivo || "Fonte classificada como restrita." };
    if (!f.url && f.readerType !== "local-fixture") return { ok: false, motivo: "Fonte pública sem URL configurada." };
    return { ok: true };
  }

  HUB.sources = {
    ACESSO: ACESSO,
    SENSIBILIDADE: SENSIBILIDADE,
    fonte: fonte,
    ehRestrita: ehRestrita,
    validar: validar
  };

  HUB.registerComponent("sources");

})();
