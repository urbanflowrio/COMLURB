/* ============================================================
   HUB COMLURB · BIBLIOTECA OFICIAL · hub-state-ar.js
   Camada de Estado (específica AR) · v1.1.0
   Dependências: hub-core, hub-rules, hub-rules-ar.
   PROIBIDO nesta camada: DOM, fetch, leitura de fonte, regra nova
   (toda regra já foi aplicada por hub-rules-ar antes de chegar aqui).

   v1.1.0: estadoOperacionalAR() usava HUB.state.ESTADO (Camada de
   Estado genérica, hub-state.js). Esse arquivo não existe em main
   (conferido em 15/07/2026) — por isso a taxonomia foi trazida para
   cá, local e mínima, só com os três rótulos que esta função usa.
   Quando hub-state.js genérico for publicado, esta função deve voltar
   a delegar para HUB.state.ESTADO em vez de manter cópia própria.

   FASE 4 (07/2026) — Piloto A (AR).

   Responsabilidade única: traduzir o modelo canônico já validado
   (payload.linhas do envelope produzido por hub-ingest-adapter-ar) e a
   saída de hub-rules-ar para EXATAMENTE o mesmo formato que
   ar/index.html já consome internamente (array DATA e objeto de
   bonificação), para que o render existente possa, no futuro, consumir
   o novo pipeline sem nenhuma mudança de HTML/CSS/layout (ver Seção 7
   do escopo da Fase 4). Não decide status, não decide bônus, não
   ordena por regra própria além de reproduzir a ordenação já usada
   pelo render (grupoOrdem, depois ordem) — que é uma decisão de
   APRESENTAÇÃO herdada do legado, não uma regra institucional nova.
   ============================================================ */

(function () {
  "use strict";

  var HUB = window.HUB;
  HUB.require("core", "rules", "rules-ar");

  // Cópia local mínima da taxonomia de hub-state.js (ver nota v1.1.0).
  var ESTADO_LOCAL = {
    DISPONIVEL: "disponivel",
    SEM_DADO: "sem_dado",
    ERRO: "erro"
  };

  /**
   * Converte os itens canônicos (payload.linhas do envelope AR) no
   * array DATA usado por popularFiltros/aplicarFiltros/renderIndicadores/
   * renderRow em ar/index.html.
   *
   * @param {Array<Object>} itensCanonicos payload.linhas do envelope
   *   produzido por HUB.ingest.adapterAR.carregarAR
   * @param {number} [mesAtual] mês corrente (1-12) para meta proporcional;
   *   default: mês corrente real (igual ao legado, new Date().getMonth()+1)
   * @returns {Array<Object>} equivalente a DATA no legado, já ordenado
   */
  function montarDataAR(itensCanonicos, mesAtual) {
    var data = (itensCanonicos || [])
      .map(function (item) { return HUB.rulesAR.aplicarRegrasIndicador(item, mesAtual); })
      .filter(function (d) { return d.codigo || d.indicador; });

    data.sort(function (a, b) {
      return HUB.rulesAR.grupoOrdemAR(a.grupo) - HUB.rulesAR.grupoOrdemAR(b.grupo) || a.ordem - b.ordem;
    });

    return data;
  }

  /**
   * Atalho: bonificação a partir do array já montado por montarDataAR.
   * Réplica o mesmo ponto de chamada que o legado faz em renderResumo()/
   * renderBonus() — calcularBonificacao(DATA).
   */
  function montarBonificacaoAR(dataAR) {
    return HUB.rulesAR.calcularBonificacao(dataAR);
  }

  /**
   * Estado operacional do módulo AR como um todo, na taxonomia canônica
   * de hub-state.js (Camada de Estado genérica) — usado para o texto
   * institucional padrão quando o envelope não tem payload (falha de
   * leitura/validação), em vez de o painel inventar uma mensagem local.
   */
  function estadoOperacionalAR(envelope) {
    if (!envelope) return ESTADO_LOCAL.ERRO;
    if (envelope.payload && envelope.payload.linhas && envelope.payload.linhas.length) return ESTADO_LOCAL.DISPONIVEL;
    if (envelope.quality && envelope.quality.status === "erro") return ESTADO_LOCAL.SEM_DADO;
    return ESTADO_LOCAL.ERRO;
  }

  /* ---------- exporta ---------- */

  HUB.stateAR = {
    ESTADO: ESTADO_LOCAL,
    montarDataAR: montarDataAR,
    montarBonificacaoAR: montarBonificacaoAR,
    estadoOperacionalAR: estadoOperacionalAR
  };

  HUB.registerComponent("state-ar");

})();
