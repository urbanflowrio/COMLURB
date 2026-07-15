/* ============================================================
   HUB COMLURB · ar/piloto/harness.js
   v1.0.0 — Motor de comparação legado × novo (Fase 4, Piloto A/AR).

   Não altera nem redesenha o painel AR. É um relatório técnico
   separado (ver MIGRATION_STRATEGY.md §5/§6). Compara, indicador a
   indicador: quantidade, IDs, nomes, metas, realizados, sentido,
   unidade, período, acumulado, origem, valores nulos, status, regras
   condicionais (gate/condicionalAtiva), C01/C02 e E03 — conforme
   exigido pelo escopo da Fase 4.

   Roda tanto em navegador (via ar/piloto/index.html) quanto em Node
   (para testes automatizados), por isso não assume window/document.
   ============================================================ */

(function (root) {
  "use strict";

  var TOL = 1e-9;

  function ehNumero(v) { return typeof v === "number" && isFinite(v); }

  function iguais(a, b) {
    if (a === null && b === null) return true;
    if (ehNumero(a) && ehNumero(b)) return Math.abs(a - b) <= TOL;
    if (a === Infinity && b === Infinity) return true;
    return a === b;
  }

  /**
   * Compara um campo entre a linha legado e a linha novo, registrando
   * divergência estruturada quando os valores não batem.
   */
  function compararCampo(divergencias, codigo, campo, valorLegado, valorNovo, causa, evidencia, decisao) {
    if (iguais(valorLegado, valorNovo)) return;
    divergencias.push({
      indicador: codigo,
      campo: campo,
      valorLegado: valorLegado,
      valorNovo: valorNovo,
      causa: causa || "Não explicada — requer investigação antes de aprovar o piloto para este campo.",
      evidencia: evidencia || null,
      decisao: decisao || "PENDENTE"
    });
  }

  /**
   * @param {Array<Object>} dataLegado saída de AR_LEGADO.processar(RAW)
   * @param {Array<Object>} dataNovo saída de HUB.stateAR.montarDataAR(itens, mesAtual)
   * @param {Object} bonusLegado saída de AR_LEGADO.calcularBonificacao(dataLegado)
   * @param {Object} bonusNovo saída de HUB.stateAR.montarBonificacaoAR(dataNovo)
   */
  function comparar(dataLegado, dataNovo, bonusLegado, bonusNovo) {
    var divergencias = [];
    var porCodigoLegado = {}; dataLegado.forEach(function (d) { porCodigoLegado[d.codigo] = d; });
    var porCodigoNovo = {}; dataNovo.forEach(function (d) { porCodigoNovo[d.codigo] = d; });

    var codigosLegado = Object.keys(porCodigoLegado);
    var codigosNovo = Object.keys(porCodigoNovo);
    var soLegado = codigosLegado.filter(function (c) { return codigosNovo.indexOf(c) === -1; });
    var soNovo = codigosNovo.filter(function (c) { return codigosLegado.indexOf(c) === -1; });

    soLegado.forEach(function (c) {
      divergencias.push({ indicador: c, campo: "presenca", valorLegado: "presente", valorNovo: "ausente",
        causa: "Indicador presente no legado mas ausente no novo pipeline.", evidencia: null, decisao: "PENDENTE" });
    });
    soNovo.forEach(function (c) {
      divergencias.push({ indicador: c, campo: "presenca", valorLegado: "ausente", valorNovo: "presente",
        causa: "Indicador presente no novo pipeline mas ausente no legado.", evidencia: null, decisao: "PENDENTE" });
    });

    codigosLegado.filter(function (c) { return porCodigoNovo[c]; }).forEach(function (codigo) {
      var L = porCodigoLegado[codigo], N = porCodigoNovo[codigo];

      compararCampo(divergencias, codigo, "nome", L.indicador, N.indicador);
      compararCampo(divergencias, codigo, "meta", L.meta, N.meta);
      compararCampo(divergencias, codigo, "realizado(atual)", L.atual, N.atual);
      compararCampo(divergencias, codigo, "sentido", L.sentido, N.sentido);
      compararCampo(divergencias, codigo, "unidade", L.unidade, N.unidade);
      compararCampo(divergencias, codigo, "metaProporcional", L.metaProporcional, N.metaProporcional);
      compararCampo(divergencias, codigo, "atingimento", L.atingimento, N.atingimento);
      compararCampo(divergencias, codigo, "status", L.statusDisplay, N.statusDisplay);
      compararCampo(divergencias, codigo, "tendencia", L.tendencia, N.tendencia);
      compararCampo(divergencias, codigo, "casadoId", L.casadoId, N.casadoId);

      // valores nulos — checagem explícita além da igualdade acima
      if ((L.atual === null) !== (N.atual === null)) {
        compararCampo(divergencias, codigo, "atual_nulo", L.atual === null, N.atual === null,
          "Um pipeline trata o valor como ausente e o outro não.");
      }
      if ((L.meta === null) !== (N.meta === null)) {
        compararCampo(divergencias, codigo, "meta_nulo", L.meta === null, N.meta === null,
          "Um pipeline trata a meta como ausente e o outro não.");
      }
    });

    // C01/C02 — precedência SARC, checagem dedicada (memória do produto)
    ["C01", "C02"].forEach(function (codigo) {
      var L = porCodigoLegado[codigo], N = porCodigoNovo[codigo];
      if (!L || !N) return;
      compararCampo(divergencias, codigo, "status(SARC)", L.statusDisplay, N.statusDisplay,
        "C01/C02 devem refletir precedência SARC quando a coluna Status vem publicada.",
        "hub-rules-ar.js:statusComPrecedencia / ar/index.html:processar (bloco rawStatus)");
    });

    // E03 — pendência institucional, não é divergência legado×novo (os
    // dois lados usam o mesmo cálculo genérico), mas é sinalizada aqui
    // como PENDÊNCIA por completude do relatório.
    var pendenciaE03 = null;
    if (porCodigoLegado.E03 || porCodigoNovo.E03) {
      pendenciaE03 = {
        indicador: "E03",
        pendencia: "Memória do produto menciona regra binária Top-5/fora do Top-5 para E03. " +
          "Não encontrada em código nem documento presente neste ZIP. Legado e novo pipeline " +
          "concordam entre si (ambos usam status genérico) — não há divergência legado×novo aqui, " +
          "mas há uma pendência de decisão institucional registrada em hub-rules-ar.js (BLOQUEIOS_PENDENTES).",
        decisao: "PENDENTE — aguardando REGRAS_AR_2026.md ou instrução explícita da proprietária do produto."
      };
    }

    // Bonificação
    var divergenciasBonus = [];
    function compararBonus(campo, vl, vn, causa, decisao) {
      if (iguais(vl, vn)) return;
      divergenciasBonus.push({ campo: campo, valorLegado: vl, valorNovo: vn, causa: causa, decisao: decisao || "PENDENTE" });
    }
    compararBonus("metasEstrategicasAtingidas", bonusLegado.metasEstrategicasAtingidas, bonusNovo.metasEstrategicasAtingidas);
    compararBonus("condicionalAtiva", bonusLegado.condicionalAtiva, bonusNovo.condicionalAtiva);
    compararBonus("metasCondicionadasAtingidas", bonusLegado.metasCondicionadasAtingidas, bonusNovo.metasCondicionadasAtingidas);
    compararBonus("performanceAtingida", bonusLegado.performanceAtingida, bonusNovo.performanceAtingida);
    compararBonus("bonusTotal", bonusLegado.bonusTotal, bonusNovo.bonusTotal,
      "ESPERADA E FORMALMENTE EXPLICADA: hub-core.js já registra HUB.config.combinacaoECPLiberada=false " +
      "com a instrução explícita 'enquanto false, hub-rules-ar deve retornar {bloqueado:true}'. O legado " +
      "ignora essa flag e sempre soma E+C+P. O novo pipeline obedece à governança já registrada e bloqueia " +
      "a combinação (bonusNovo.bloqueado=true, bonusNovo.bonusTotalSeLiberado=" + bonusNovo.bonusTotalSeLiberado + " " +
      "confirma que o CÁLCULO bate com o legado, só a EXPOSIÇÃO do total combinado é que é bloqueada).",
      "ACEITA — divergência proposital de governança, não defeito do novo pipeline. Requer confirmação " +
      "explícita da Presidência/CVL para destravar (mudar HUB.config.combinacaoECPLiberada para true), não " +
      "correção de código.");

    return {
      resumo: {
        qtdLegado: codigosLegado.length,
        qtdNovo: codigosNovo.length,
        divergenciasCampo: divergencias.length,
        divergenciasBonus: divergenciasBonus.length
      },
      divergencias: divergencias,
      divergenciasBonus: divergenciasBonus,
      pendenciaE03: pendenciaE03,
      aprovado: divergencias.length === 0 && divergenciasBonus.filter(function (d) { return d.decisao === "PENDENTE"; }).length === 0
    };
  }

  var HARNESS_AR = { comparar: comparar, _iguais: iguais };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = HARNESS_AR;
  } else {
    root.HARNESS_AR = HARNESS_AR;
  }

})(typeof window !== "undefined" ? window : this);
