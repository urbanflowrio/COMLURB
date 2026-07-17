/* ============================================================
   HUB COMLURB · snapshot/lib/snapshot-dte.js
   Fase 6 (07/2026) · v1.0.0
   Dependências: HUB.ingest.adapterDTE (via bootstrap-hub.js),
   snapshot/lib/snapshot-core.js.

   Ponte fina do módulo "engenharia-dte". Só existe uma fonte
   operacional (DTE_RELATORIO_GERAL, ver hub-sources.js) — o próprio
   Adapter DTE já bloqueia o envelope (payload=null, quality.erros
   preenchido) quando essa fonte falha ou quando há bloqueio
   estrutural (ver hub-ingest-adapter-dte.js). Não há, portanto,
   nenhuma regra adicional de "fontes obrigatórias" a aplicar aqui —
   snapshot-core.avaliarEnvelope() já cobre o caso.
   ============================================================ */

"use strict";

var MODULO_ID = "engenharia-dte";

/**
 * Executa a cadeia DTE já aprovada (Locator → Reader → Adapter DTE →
 * Validator → envelope) e traduz o resultado para o contrato
 * genérico de snapshot-core.js.
 *
 * @param {Object} HUB namespace já carregado via bootstrap-hub.js
 * @param {Object} [opts] repassado integralmente para
 *   HUB.ingest.adapterDTE.carregarDTE (fetchImpl, fixtureTexto) —
 *   mesmo contrato já aprovado na Fase 5, sem alteração.
 * @returns {Promise<Object>} objeto pronto para
 *   snapshot-core.processarCicloModulo({...})
 */
function processarDTE(HUB, opts) {
  return HUB.ingest.adapterDTE.carregarDTE(opts || {}).then(function (resultado) {
    var resumoRegistros = (resultado.indicadores ? resultado.indicadores.length : 0) + " indicador(es), " +
      (resultado.gerenciasOfensoras ? resultado.gerenciasOfensoras.length : 0) + " registro(s) de gerência ofensora" +
      (resultado.bloqueios && resultado.bloqueios.length ? (", " + resultado.bloqueios.length + " bloqueio(s)") : "");

    return {
      moduloId: MODULO_ID,
      rejeitarAntesDoEnvelope: false,
      envelope: resultado.envelope,
      resumoRegistros: resumoRegistros
    };
  });
}

module.exports = {
  MODULO_ID: MODULO_ID,
  processarDTE: processarDTE
};
