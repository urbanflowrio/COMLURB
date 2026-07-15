/* ============================================================
   HUB COMLURB · BIBLIOTECA OFICIAL · hub-ingest-decoder.js
   Camada 2 (Ingestão) · v1.0.0
   Dependências: hub-core.
   PROIBIDO nesta camada: alias, mapeamento de campo para domínio,
   regra institucional, conversão numérica pt-BR de negócio (isso é
   Adapter). O Decoder sabe que existe uma linha de cabeçalho; não
   sabe o que cada coluna significa.

   FASE 3 (07/2026) — ESCOPO MÍNIMO AUTORIZADO:
   Mecanismo extraído e generalizado do padrão já comprovado em
   balanco-receita/index.html (detectHeader + matrixToObjects), sem
   copiar as palavras-chave específicas daquele painel (isso seria
   vocabulário de domínio vazando para o Decoder). A detecção de
   cabeçalho aqui é estrutural (célula preenchida vs. vazia, texto vs.
   número), não semântica.
   ============================================================ */

(function () {
  "use strict";

  var HUB = window.HUB;
  HUB.require("core");

  /**
   * Detecta a linha de cabeçalho de uma matriz de forma estrutural:
   * a melhor candidata é a primeira linha, dentre as 20 primeiras, com
   * maior proporção de células preenchidas e não-numéricas (texto),
   * comparada a linhas puramente vazias ou majoritariamente numéricas
   * (que tendem a ser dado, não cabeçalho). Não usa nenhuma palavra-chave
   * de domínio — isso pertence ao Adapter, se algum dia for necessário.
   */
  function detectarCabecalho(matriz) {
    var melhorIndice = 0;
    var melhorPontuacao = -1;
    var limite = Math.min(matriz.length, 20);

    for (var i = 0; i < limite; i++) {
      var linha = matriz[i] || [];
      if (!linha.length) continue;

      var preenchidas = 0;
      var textuais = 0;
      for (var j = 0; j < linha.length; j++) {
        var v = String(linha[j] == null ? "" : linha[j]).trim();
        if (v !== "") {
          preenchidas++;
          if (!/^-?[\d.,]+$/.test(v)) textuais++;
        }
      }
      if (preenchidas === 0) continue;

      var pontuacao = (preenchidas / linha.length) + (textuais / linha.length);
      if (pontuacao > melhorPontuacao) {
        melhorPontuacao = pontuacao;
        melhorIndice = i;
      }
    }
    return melhorIndice;
  }

  /**
   * Converte uma matriz (array de arrays) em uma lista de objetos
   * genéricos, usando a linha de cabeçalho detectada (ou informada) como
   * nome das colunas. Colunas sem nome recebem um rótulo posicional
   * (COL_1, COL_2, ...) em vez de serem descartadas silenciosamente.
   */
  function matrizParaObjetos(matriz, indiceCabecalho) {
    var hi = (indiceCabecalho === undefined || indiceCabecalho === null)
      ? detectarCabecalho(matriz)
      : indiceCabecalho;

    var cabecalhos = (matriz[hi] || []).map(function (h, i) {
      var nome = String(h == null ? "" : h).trim();
      return nome !== "" ? nome : ("COL_" + (i + 1));
    });

    return matriz.slice(hi + 1)
      .filter(function (linha) {
        return (linha || []).some(function (v) { return String(v == null ? "" : v).trim() !== ""; });
      })
      .map(function (linha) {
        var obj = {};
        cabecalhos.forEach(function (h, i) {
          obj[h] = linha[i] === undefined ? "" : linha[i];
        });
        return obj;
      });
  }

  /**
   * Decodifica conteúdo bruto (proveniente do Reader) em linhas genéricas.
   *
   * @param {*} raw conteúdo bruto retornado pelo Reader
   * @param {"matriz"|"texto"|"objetos"} tipo forma do conteúdo bruto
   * @param {Object} [opts]
   * @param {number} [opts.indiceCabecalho] força a linha de cabeçalho,
   *   em vez de detectá-la estruturalmente (uso avançado / depuração)
   * @returns {{ok: boolean, linhas: Array<Object>, motivo: string|null}}
   */
  function decodificar(raw, tipo, opts) {
    opts = opts || {};

    if (raw === undefined || raw === null) {
      return { ok: false, linhas: [], motivo: "Decoder recebeu conteúdo bruto vazio (null/undefined)." };
    }

    if (tipo === "objetos") {
      if (!Array.isArray(raw)) {
        return { ok: false, linhas: [], motivo: "tipo 'objetos' exige um array de objetos." };
      }
      // Já é uma lista de registros no vocabulário da fonte (não do
      // domínio) — o Decoder não precisa interpretar estrutura adicional.
      return { ok: true, linhas: raw, motivo: null };
    }

    var matriz;

    if (tipo === "matriz") {
      if (!Array.isArray(raw)) {
        return { ok: false, linhas: [], motivo: "tipo 'matriz' exige um array de arrays." };
      }
      matriz = raw;
    } else if (tipo === "texto") {
      if (typeof raw !== "string") {
        return { ok: false, linhas: [], motivo: "tipo 'texto' exige uma string CSV bruta." };
      }
      if (typeof Papa === "undefined") {
        return { ok: false, linhas: [], motivo: "PapaParse indisponível para decodificar tipo 'texto'." };
      }
      var parsed = Papa.parse(raw, { skipEmptyLines: true });
      matriz = parsed.data || [];
    } else {
      return { ok: false, linhas: [], motivo: "tipo de conteúdo bruto não suportado pelo Decoder: " + tipo };
    }

    if (!matriz.length) {
      return { ok: false, linhas: [], motivo: "Conteúdo bruto decodificado está vazio." };
    }

    var linhas = matrizParaObjetos(matriz, opts.indiceCabecalho);
    return { ok: true, linhas: linhas, motivo: null };
  }

  /* ---------- exporta ---------- */

  HUB.ingest = HUB.ingest || {};
  HUB.ingest.decoder = {
    decodificar: decodificar,
    // expostas para teste/depuração isolada, não para uso por painel
    _detectarCabecalho: detectarCabecalho,
    _matrizParaObjetos: matrizParaObjetos
  };

  HUB.registerComponent("ingest-decoder");

})();
