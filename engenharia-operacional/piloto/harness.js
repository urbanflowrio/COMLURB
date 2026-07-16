/* ============================================================
   HUB COMLURB · engenharia-operacional/piloto/harness.js
   Harness de comparação — Fase 5 (Piloto B).
   v1.1.0 — correção pós-auditoria.

   Compara o modelo canônico produzido pelo Adapter DTE contra a base
   vertical (aba EXPORT_HUB_ENGENHARIA, gerada pelo Apps Script
   enviado nesta fase). A base vertical NÃO é fonte oficial — é só
   amostra de comparação e controle.

   CORREÇÃO PÓS-AUDITORIA — ROTULAGEM: a versão anterior expunha
   `row.indicador` da base vertical (que estruturalmente é o
   SUBGRUPO/critério, não o indicador) como se fosse "indicador" nos
   relatórios de divergência/sem-correspondência. Corrigido: todo
   registro de saída agora expõe bloco, subgrupo e indicador em campos
   separados e corretos (indicador = Unidade_Operacional da base
   vertical; subgrupo = Indicador da base vertical).

   CORREÇÃO PÓS-AUDITORIA — CATEGORIAS: a existência de múltiplos
   candidatos canônicos para uma chave que a base vertical NÃO
   consegue desambiguar (porque não registra subgrupoOcorrência nem
   critério) nunca mais é tratada como "divergência real" — vai para
   NAO_COMPARAVEL_POR_PERDA_DE_CONTEXTO, mesmo que, por coincidência,
   um dos candidatos bata com o valor da base vertical (uma
   coincidência numérica não é prova de correspondência real). O
   resultado final é separado em seis categorias:
   - comparadosComSeguranca: candidato único (ou vários com o mesmo
     valor) e valor bate.
   - divergenciasNumericasReais: candidato único (ou vários com o
     mesmo valor) e valor NÃO bate, e não é explicado por null×zero.
   - naoComparaveisPorPerdaDeContexto: múltiplos candidatos canônicos
     com valores DIFERENTES para a mesma chave — a base vertical não
     tem subgrupoOcorrência/critério para desambiguar.
   - semCorrespondencia: nenhum candidato canônico para a chave.
   - divergenciasEsperadasNullZero: canônico null, base vertical 0
     (ausência convertida em zero pelo Apps Script/legado).
   - possivelDefasagemTemporal: metadado do relatório (não uma
     categoria por linha) — base vertical é um instantâneo estático,
     canônico pode ser capturado ao vivo em outro momento. NUNCA
     reclassifica nem esconde uma divergência por causa disso.
   ============================================================ */

(function (root) {
  "use strict";

  var OFENSORA_RE = /^Gerência Ofensora \d+$/i;

  function normEstrutural(v) {
    return String(v == null ? "" : v)
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/\s+/g, " ").trim();
  }

  // Réplica estrutural de removerUnidadeDoRotulo() do Apps Script, só
  // para permitir o casamento de chave com a base vertical (que já
  // removeu o sufixo de unidade do rótulo) — não é regra de negócio.
  function removerSufixoUnidade(v) {
    return normEstrutural(v).replace(/\s*-\s*(t|h\/mes|h|l|nm3|m3|r\$|%)\s*$/i, "").trim();
  }

  function periodoParaAnoMes(ano, mes) {
    return ano + "-" + String(mes).padStart(2, "0");
  }

  /**
   * @param {Object} canonico saída de HUB.ingest.adapterDTE.carregarDTE(...)
   *   (usa .indicadores e .envelope.capturedAt)
   * @param {Array} baseVerticalRows linhas de EXPORT_HUB_ENGENHARIA
   *   ({ano, mes, periodo, grupo, indicador, unidadeOperacional, unidadeMedida, valor, atualizacao})
   */
  function comparar(canonico, baseVerticalRows) {
    // Chave: bloco + subgrupo (exceto Bloco C, exceção deliberada e
    // documentada — subgrupo da base vertical não é confiável ali) +
    // indicador + período. NUNCA inclui subgrupoOcorrência nem
    // critério — a base vertical não tem como fornecer nenhum dos
    // dois, então incluí-los na chave só produziria "sem
    // correspondência" universal em vez do diagnóstico correto
    // (NAO_COMPARAVEL quando há ambiguidade real).
    var indiceCanonico = {};
    canonico.indicadores.forEach(function (r) {
      var letra = normEstrutural(String(r.bloco || "").trim().charAt(0));
      var incluiSubgrupo = letra !== "c";
      var chave = letra + "|" + (incluiSubgrupo ? removerSufixoUnidade(r.subgrupo) + "|" : "") + removerSufixoUnidade(r.indicadorBruto) + "|" + r.periodo;
      (indiceCanonico[chave] = indiceCanonico[chave] || []).push(r);
    });

    var resumo = {
      totalLinhasBaseVertical: baseVerticalRows.length,
      linhasOfensoraNaBaseVertical: 0,
      linhasIndicadorNaBaseVertical: 0,
      comparadosComSeguranca: 0,
      divergenciasNumericasReais: 0,
      naoComparaveisPorPerdaDeContexto: 0,
      semCorrespondencia: 0,
      divergenciasEsperadasNullZero: 0,
      defasagemDiasEntreCanonicoEBaseVertical: null,
      possivelDefasagemTemporal: false
    };

    // DECISÃO DE GOVERNANÇA: base vertical é instantâneo estático;
    // canônico pode ser capturado ao vivo, em outro momento, da mesma
    // fonte (atualizada mês a mês). Diferença de datas é LIMITAÇÃO DE
    // COMPARAÇÃO, não erro de código. Nunca reclassifica nem esconde
    // divergência por causa disso — só adiciona contexto explícito.
    var dataCanonico = canonico && canonico.envelope && canonico.envelope.capturedAt ? new Date(canonico.envelope.capturedAt) : null;
    var dataBaseVertical = null;
    for (var iBV = 0; iBV < baseVerticalRows.length; iBV++) {
      if (baseVerticalRows[iBV] && baseVerticalRows[iBV].atualizacao) { dataBaseVertical = new Date(baseVerticalRows[iBV].atualizacao); break; }
    }
    if (dataCanonico && dataBaseVertical && !isNaN(dataCanonico) && !isNaN(dataBaseVertical)) {
      resumo.defasagemDiasEntreCanonicoEBaseVertical = Math.round(Math.abs(dataCanonico - dataBaseVertical) / 86400000);
      resumo.possivelDefasagemTemporal = resumo.defasagemDiasEntreCanonicoEBaseVertical > 0;
    }

    var divergenciasEsperadasNullZero = [];
    var divergenciasNumericasReais = [];
    var naoComparaveisPorPerdaDeContexto = [];
    var semCorrespondencia = [];

    baseVerticalRows.forEach(function (row) {
      // ACHADO (achado real, ver histórico): a coluna "Indicador" da
      // base vertical é estruturalmente o SUBGRUPO/critério, não o
      // indicador. O indicador real está em "Unidade_Operacional".
      // Todo registro de saída abaixo expõe os dois campos, com o
      // nome correto — nunca mais rotula o subgrupo como "indicador".
      var subgrupoBaseVertical = row.indicador;
      var indicadorReal = row.unidadeOperacional;

      if (OFENSORA_RE.test(String(row.indicador || ""))) {
        resumo.linhasOfensoraNaBaseVertical++;
        // Classe conhecida: a base vertical perde o vínculo com o
        // subgrupo/critério real para estas linhas. Não comparável
        // valor-a-valor de forma confiável — contada agregadamente,
        // não linha a linha.
        return;
      }
      resumo.linhasIndicadorNaBaseVertical++;

      var letraGrupo = normEstrutural(String(row.grupo || "").trim().charAt(0));
      var periodo = periodoParaAnoMes(row.ano, row.mes);
      var incluiSubgrupoLinha = letraGrupo !== "c";
      var chave = letraGrupo + "|" + (incluiSubgrupoLinha ? removerSufixoUnidade(subgrupoBaseVertical) + "|" : "") + removerSufixoUnidade(indicadorReal) + "|" + periodo;
      var candidatos = indiceCanonico[chave];

      var base = { bloco: row.grupo, subgrupo: subgrupoBaseVertical, indicador: indicadorReal, periodo: periodo };

      if (!candidatos || !candidatos.length) {
        resumo.semCorrespondencia++;
        semCorrespondencia.push(Object.assign({}, base, { valorBaseVertical: row.valor }));
        return;
      }

      var valoresDistintos = candidatos.reduce(function (acc, c) {
        if (acc.indexOf(c.valor) === -1) acc.push(c.valor);
        return acc;
      }, []);

      if (valoresDistintos.length > 1) {
        // Múltiplos candidatos canônicos com valores DIFERENTES para a
        // mesma chave: a base vertical não distingue subgrupoOcorrência
        // nem critério, então não há como saber qual candidato
        // corresponde a esta linha. NUNCA classificado como
        // "divergência real", mesmo que um dos candidatos bata por
        // coincidência numérica com o valor da base vertical.
        resumo.naoComparaveisPorPerdaDeContexto++;
        naoComparaveisPorPerdaDeContexto.push(Object.assign({}, base, {
          valorBaseVertical: row.valor,
          candidatosCanonicos: candidatos.map(function (c) {
            return { valor: c.valor, subgrupoOcorrencia: c.subgrupoOcorrencia, criterio: c.criterio, linhaOrigem: c.lineage ? c.lineage.linhaOrigem : null };
          }),
          motivo: "Múltiplos registros canônicos para bloco+subgrupo+indicador+período com valores diferentes " +
            "(distintos por subgrupoOcorrência e/ou critério) — a base vertical não registra nenhuma dessas " +
            "dimensões, então não é possível desambiguar com segurança."
        }));
        return;
      }

      var valorCanonico = valoresDistintos[0];

      if (valorCanonico === row.valor) {
        resumo.comparadosComSeguranca++;
        return;
      }

      if (valorCanonico === null && row.valor === 0) {
        resumo.divergenciasEsperadasNullZero++;
        divergenciasEsperadasNullZero.push(Object.assign({}, base, {
          tipo: "ausencia_convertida_em_zero", canonico: null, baseVertical: row.valor
        }));
        return;
      }

      resumo.divergenciasNumericasReais++;
      divergenciasNumericasReais.push(Object.assign({}, base, { canonico: valorCanonico, baseVertical: row.valor }));
    });

    return {
      resumo: resumo,
      divergenciasNumericasReais: divergenciasNumericasReais,
      naoComparaveisPorPerdaDeContexto: naoComparaveisPorPerdaDeContexto,
      semCorrespondencia: semCorrespondencia,
      divergenciasEsperadasNullZero: divergenciasEsperadasNullZero,
      limitacoesConhecidasDaBaseVertical: [
        "Perda de vínculo com subgrupo/critério nas linhas 'Gerência Ofensora N' — a coluna Grupo só registra o " +
          "bloco (A-D). O modelo canônico preserva bloco+subgrupo+ocorrência+critério para cada registro; a base " +
          "vertical não permite reconstruir isso de forma confiável.",
        "A base vertical não registra subgrupoOcorrência nem critério — quando o modelo canônico distingue " +
          "corretamente duas séries diferentes que a base vertical não consegue distinguir, o resultado vai para " +
          "'naoComparaveisPorPerdaDeContexto', nunca para 'divergência real'.",
        "Unidade de medida (Unidade_Medida) inferida heuristicamente por palavra-chave e comprovadamente " +
          "inconsistente para o mesmo tipo de dado. O modelo canônico não infere unidade para as linhas de " +
          "gerência ofensora (unidadeMedida: null) em vez de arriscar uma inferência não confiável.",
        "Ausência de dado na fonte é convertida em 0 pela transformação Apps Script (mesmo comportamento do " +
          "legado engenharia-operacional/index.html). O modelo canônico preserva null."
      ]
    };
  }

  root.HARNESS_DTE = { comparar: comparar, _normEstrutural: normEstrutural, _removerSufixoUnidade: removerSufixoUnidade };

  if (typeof module !== "undefined" && module.exports) module.exports = root.HARNESS_DTE;

})(typeof window !== "undefined" ? window : global);
