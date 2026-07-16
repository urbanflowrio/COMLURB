/* ============================================================
   HUB COMLURB · engenharia-operacional/piloto/harness.js
   Harness de comparação — Fase 5 (Piloto B).

   Compara o modelo canônico produzido pelo Adapter DTE contra a base
   vertical (aba EXPORT_HUB_ENGENHARIA, gerada pelo Apps Script
   enviado nesta fase). A base vertical NÃO é fonte oficial — é só
   amostra de comparação e controle (decisão já registrada em
   IMPLEMENTATION_STATUS.md). Este harness categoriza toda divergência
   encontrada em duas classes:

   - ESPERADA: já é uma limitação conhecida e documentada da base
     vertical (perda de contexto de subgrupo/critério nas linhas de
     Gerência Ofensora, unidade de medida inferida heuristicamente de
     forma inconsistente, ausência convertida em zero). Não é
     corrigida "de volta" no Adapter DTE para reproduzir esses erros —
     ver decisão de governança em IMPLEMENTATION_STATUS.md.
   - REAL: qualquer divergência que não se explique por uma das
     limitações acima. O objetivo desta fase é que a contagem de
     divergências REAIS seja zero contra os indicadores não-ambíguos
     da base vertical (rows cujo Indicador não é "Gerência Ofensora
     N" — essas são estruturalmente ambíguas na base vertical, ver
     achado registrado em IMPLEMENTATION_STATUS.md, e por isso NUNCA
     entram na comparação valor-a-valor, só na contagem agregada).
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
   *   (usa .indicadores e .gerenciasOfensoras)
   * @param {Array} baseVerticalRows linhas de EXPORT_HUB_ENGENHARIA
   *   ({ano, mes, periodo, grupo, indicador, unidadeOperacional, unidadeMedida, valor})
   */
  function comparar(canonico, baseVerticalRows) {
    // CORREÇÃO PÓS-AUDITORIA (achado real, confirmado empiricamente):
    // o mesmo rótulo de indicador se repete em mais de um subgrupo
    // dentro do MESMO bloco — não só no Bloco A ("CTR Seriopédica" em
    // V/VI/VII), mas também no Bloco B (ex.: "Peso Coletado /
    // Capacidade Estimada (t)" aparece em 7 subgrupos diferentes;
    // "P16A - Trator de Praia - h/mês" aparece em 2 ocorrências
    // distintas de "Horas Utilizadas / Horas Estimadas (h)"). A versão
    // anterior deste harness só incluía o subgrupo na chave para o
    // Bloco A, generalizando por engano a exceção do Bloco C (onde o
    // subgrupo registrado pela base vertical É comprovadamente não
    // confiável — "Horas Utilizadas..." usado como subgrupo de
    // indicadores que não têm subgrupo real) para B e D também, que NÃO
    // têm esse problema. Isso causava colisão real de chave sempre que
    // o mesmo rótulo se repetia em subgrupos diferentes dentro de B/D —
    // mascarada contra fixtures congeladas (canônico e base vertical do
    // mesmo instante) porque, por coincidência numérica, algum dos
    // candidatos colididos batia com o valor comparado; visível contra
    // a fonte ao vivo, cujos valores já não coincidem por acaso.
    //
    // Regra corrigida: subgrupo entra na chave para A, B e D. Bloco C
    // continua como ÚNICA exceção deliberada e documentada.
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
      comparadas: 0,
      semCorrespondenciaCanonica: 0,
      divergenciasEsperadas: 0,
      divergenciasReais: 0,
      defasagemDiasEntreCanonicoEBaseVertical: null,
      possivelDefasagemTemporal: false
    };
    // DECISÃO DE GOVERNANÇA (correção pós-auditoria): a base vertical é
    // um instantâneo estático (gerado pelo Apps Script em um momento
    // fixo, registrado por linha em "Atualização"); o canônico pode ser
    // capturado AO VIVO, em outro momento — a fonte real
    // (DTE_RELATORIO_GERAL) é atualizada mês a mês. Diferença de datas
    // aqui é uma LIMITAÇÃO DE COMPARAÇÃO (dois retratos de momentos
    // diferentes da mesma fonte), não um erro do Adapter nem do
    // harness. Este relatório NUNCA reclassifica ou esconde uma
    // divergência por causa disso — só adiciona contexto explícito para
    // quem for interpretar `divergenciasReais`.
    var dataCanonico = canonico && canonico.envelope && canonico.envelope.capturedAt ? new Date(canonico.envelope.capturedAt) : null;
    var dataBaseVertical = null;
    for (var iBV = 0; iBV < baseVerticalRows.length; iBV++) {
      if (baseVerticalRows[iBV] && baseVerticalRows[iBV].atualizacao) { dataBaseVertical = new Date(baseVerticalRows[iBV].atualizacao); break; }
    }
    if (dataCanonico && dataBaseVertical && !isNaN(dataCanonico) && !isNaN(dataBaseVertical)) {
      resumo.defasagemDiasEntreCanonicoEBaseVertical = Math.round(Math.abs(dataCanonico - dataBaseVertical) / 86400000);
      resumo.possivelDefasagemTemporal = resumo.defasagemDiasEntreCanonicoEBaseVertical > 0;
    }
    var divergenciasEsperadas = [];
    var divergenciasReais = [];
    var semCorrespondencia = [];

    baseVerticalRows.forEach(function (row) {
      if (OFENSORA_RE.test(String(row.indicador || ""))) {
        resumo.linhasOfensoraNaBaseVertical++;
        // Classe conhecida: a base vertical perde o vínculo com o
        // subgrupo/critério para estas linhas (ver achado registrado
        // em IMPLEMENTATION_STATUS.md). Não comparável valor-a-valor
        // de forma confiável — registrada como divergência esperada
        // agregada, não linha a linha.
        return;
      }
      resumo.linhasIndicadorNaBaseVertical++;

      // ACHADO REAL (ver comentário de cabeçalho): a coluna "Indicador"
      // da base vertical, produzida pelo Apps Script, na verdade contém
      // o SUBGRUPO/critério (ex.: "I - Recebimento Resíduos Totais",
      // "Horas Utilizadas / Horas Estimadas (h)"), não o indicador real.
      // O indicador real está em "Unidade_Operacional" (ex.: "ETR
      // Bangu", "Caminhões em operação"). Casamos por isso, não pelo
      // nome da coluna "Indicador" — outra evidência de que a base
      // vertical não é confiável como referência estrutural, só como
      // amostra de valores.
      var letraGrupo = normEstrutural(String(row.grupo || "").trim().charAt(0));
      var periodo = periodoParaAnoMes(row.ano, row.mes);
      var incluiSubgrupoLinha = letraGrupo !== "c";
      var chave = letraGrupo + "|" + (incluiSubgrupoLinha ? removerSufixoUnidade(row.indicador) + "|" : "") + removerSufixoUnidade(row.unidadeOperacional) + "|" + periodo;
      var candidatos = indiceCanonico[chave];

      if (!candidatos || !candidatos.length) {
        resumo.semCorrespondenciaCanonica++;
        semCorrespondencia.push({ periodo: periodo, grupo: row.grupo, indicador: row.indicador, valorBaseVertical: row.valor });
        return;
      }

      resumo.comparadas++;
      // Se algum candidato bate exatamente, ok. Se nenhum bate mas
      // existe candidato com valor null onde a base vertical tem 0,
      // é a divergência esperada de ausência->zero. Caso contrário,
      // divergência real.
      var bateuExato = candidatos.some(function (c) { return c.valor === row.valor; });
      if (bateuExato) return;

      var explicaVazioZero = candidatos.some(function (c) { return c.valor === null && row.valor === 0; });
      if (explicaVazioZero) {
        resumo.divergenciasEsperadas++;
        divergenciasEsperadas.push({
          periodo: periodo, indicador: row.indicador, tipo: "ausencia_convertida_em_zero",
          canonico: null, baseVertical: row.valor
        });
        return;
      }

      resumo.divergenciasReais++;
      divergenciasReais.push({
        periodo: periodo, indicador: row.indicador,
        canonico: candidatos.map(function (c) { return c.valor; }),
        baseVertical: row.valor
      });
    });

    return {
      resumo: resumo,
      divergenciasEsperadas: divergenciasEsperadas,
      divergenciasReais: divergenciasReais,
      semCorrespondencia: semCorrespondencia,
      limitacoesConhecidasDaBaseVertical: [
        "Perda de vínculo com subgrupo/critério nas linhas 'Gerência Ofensora N' — a coluna Grupo só registra o " +
          "bloco (A-D). O modelo canônico preserva bloco+subgrupo+ocorrência para cada registro de gerência " +
          "ofensora; a base vertical não permite reconstruir isso de forma confiável.",
        "Unidade de medida (Unidade_Medida) inferida heuristicamente por palavra-chave e comprovadamente " +
          "inconsistente para o mesmo tipo de dado (ex.: 'un' vs '%' para valores que parecem a mesma métrica). " +
          "O modelo canônico não infere unidade para as linhas de gerência ofensora (unidadeMedida: null) em vez " +
          "de arriscar uma inferência não confiável.",
        "Ausência de dado na fonte é convertida em 0 pela transformação Apps Script (mesmo comportamento do " +
          "legado engenharia-operacional/index.html). O modelo canônico preserva null."
      ]
    };
  }

  root.HARNESS_DTE = { comparar: comparar, _normEstrutural: normEstrutural, _removerSufixoUnidade: removerSufixoUnidade };

  if (typeof module !== "undefined" && module.exports) module.exports = root.HARNESS_DTE;

})(typeof window !== "undefined" ? window : global);
