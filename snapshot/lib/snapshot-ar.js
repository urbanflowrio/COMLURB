/* ============================================================
   HUB COMLURB · snapshot/lib/snapshot-ar.js
   Fase 6 (07/2026) · v1.0.0
   Dependências: HUB.ingest.adapterAR (via bootstrap-hub.js),
   snapshot/lib/snapshot-core.js.

   Ponte fina — o único lugar da Fase 6 que sabe que o módulo "ar"
   existe e quais são suas fontes obrigatórias. Não reimplementa
   nenhuma regra do Adapter AR (hub-ingest-adapter-ar.js) nem de
   hub-rules-ar.js — só chama o Adapter já aprovado e traduz o
   resultado para o contrato genérico que snapshot-core.js entende.

   REGRA DE GOVERNANÇA DESTA FASE (decisão da proprietária do produto):
   o Adapter AR, por desenho já aprovado na Fase 4, DEGRADA
   graciosamente se AR_MAPEAMENTO ou AR_GERAL falharem (o envelope
   ainda é produzido, com avisos por linha) — só bloqueia o envelope
   se AR_2026 falhar. Isso está correto para o Adapter e não é
   alterado aqui. Mas, para fins de SNAPSHOT OFICIAL, a Fase 6 aplica
   uma política adicional, mais estrita, por cima do resultado do
   Adapter: as três fontes operacionais (AR_GERAL, AR_2026,
   AR_MAPEAMENTO) são obrigatórias — se qualquer uma falhar, o
   snapshot do ciclo inteiro é bloqueado, mesmo que o Adapter tivesse
   produzido um envelope "degradado, mas não nulo". AR_GOVERNANCA
   permanece fora desta lista porque o Adapter aprovado não a busca
   nem a lê (não aparece em diagnosticoFontes) — não é promovida a
   obrigatória por este arquivo.
   ============================================================ */

"use strict";

var MODULO_ID = "ar";
var FONTES_OBRIGATORIAS = ["AR_2026", "AR_MAPEAMENTO", "AR_GERAL"];

/**
 * Executa a cadeia AR já aprovada (Locator → Reader → Decoder →
 * Adapter → Validator → envelope) e traduz o resultado para o
 * contrato genérico de snapshot-core.js.
 *
 * @param {Object} HUB namespace já carregado via bootstrap-hub.js
 * @param {Object} [opts] repassado integralmente para
 *   HUB.ingest.adapterAR.carregarAR (fetchImpl, fixtures) — mesmo
 *   contrato já aprovado na Fase 4, sem alteração.
 * @returns {Promise<Object>} objeto pronto para
 *   snapshot-core.processarCicloModulo({...})
 */
function processarAR(HUB, opts) {
  return HUB.ingest.adapterAR.carregarAR(opts || {}).then(function (resultado) {
    var diagnostico = resultado.diagnosticoFontes || {};
    var fontesFalhas = FONTES_OBRIGATORIAS.filter(function (id) {
      return !(diagnostico[id] && diagnostico[id].ok);
    });

    var resumoRegistros = (resultado.itens ? resultado.itens.length : 0) + " indicador(es) válido(s)" +
      (resultado.linhasComErro && resultado.linhasComErro.length
        ? (", " + resultado.linhasComErro.length + " linha(s) com erro")
        : "");

    if (fontesFalhas.length > 0) {
      var motivos = fontesFalhas.map(function (id) {
        var d = diagnostico[id];
        return id + ": " + (d && d.motivo ? d.motivo : "falha não detalhada (etapa: " + (d && d.etapa) + ")");
      });
      return {
        moduloId: MODULO_ID,
        rejeitarAntesDoEnvelope: true,
        registroRejeicao: {
          fonte: fontesFalhas.join(", "),
          horario: new Date().toISOString(),
          etapa: "fontes_obrigatorias_ar",
          motivo: "Fonte(s) obrigatória(s) do AR indisponível(is): " + motivos.join(" | "),
          diagnostico: diagnostico,
          resumoEntrada: "AR_GOVERNANCA não é obrigatória e não participa desta checagem."
        }
      };
    }

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
  FONTES_OBRIGATORIAS: FONTES_OBRIGATORIAS.slice(),
  processarAR: processarAR
};
