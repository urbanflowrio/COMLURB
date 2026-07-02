/* ============================================================
   HUB COMLURB · BIBLIOTECA OFICIAL · hub-rules.js
   Camada 2 (Regras) · v2.0.0
   Dependências: hub-core.
   PROIBIDO nesta camada: DOM, Chart.js, fetch, qualquer coisa visual.

   Fonte única das regras transversais do HUB:
   - Status canônico (Dentro da Meta / Atenção / Crítico / Sem dado)
   - Atingimento (regra oficial para ambos os sentidos)
   - Acumulação (média vs soma)
   - Tendências (por ciclos e trimestral)
   - Exclusão do mês corrente (ciclo de pagamento)
   - Precedência SARC

   DECISÕES DE NEGÓCIO CODIFICADAS (definitivas, 07/2026):
   1. Limiares de status são CONSTANTES, nunca parâmetros.
      Atenção começa em 0.9 (não 0.85; regressão conhecida e testada).
   2. Regra menor-melhor canônica é a do Acordo de Resultados:
      atingimento = meta / atual. A regra por desvio do antigo
      indicadores-registro (aceitava até 1,10·meta) está APOSENTADA.

   Qualquer alteração neste arquivo exige rodar /testes/ antes
   do commit e obter 100% verde.
   ============================================================ */

(function () {
  "use strict";

  var HUB = window.HUB;
  HUB.require("core");

  /* ---------- taxonomia canônica ---------- */

  var STATUS = {
    DENTRO: "Dentro da Meta",
    ATENCAO: "Atenção",
    CRITICO: "Crítico",
    SEM_DADO: "Sem dado"
  };

  /* ---------- limiares oficiais (constantes, não parâmetros) ---------- */

  var LIMIAR_DENTRO = 1.0;   // atingimento >= 100%
  var LIMIAR_ATENCAO = 0.9;  // atingimento >= 90% e < 100%
                             // abaixo de 90%: Crítico

  /* ---------- helpers internos ---------- */

  function ehNumero(v) {
    return typeof v === "number" && isFinite(v);
  }

  // aceita "maior_melhor"/"menor_melhor" e os aliases legados "↑"/"↓"
  function normalizarSentido(sentido) {
    if (sentido === "maior_melhor" || sentido === "↑") return "maior";
    if (sentido === "menor_melhor" || sentido === "↓") return "menor";
    return null;
  }

  /* ---------- atingimento ----------
     Regra oficial:
       maior_melhor: atual / meta
       menor_melhor: meta / atual   (regra do AR, canônica)
     Casos de borda:
       valores ausentes -> null (vira Sem dado)
       meta = 0 (maior_melhor) -> indefinido -> null
       atual = 0 (menor_melhor) -> resultado perfeito -> Infinity
       atual = 0 e meta = 0 (menor_melhor) -> exatamente na meta -> 1 */

  function atingimento(atual, meta, sentido) {
    var s = normalizarSentido(sentido);
    if (s === null || !ehNumero(atual) || !ehNumero(meta)) return null;

    if (s === "maior") {
      if (meta === 0) return null;
      return atual / meta;
    }

    // menor_melhor
    if (atual === 0) return meta === 0 ? 1 : Number.POSITIVE_INFINITY;
    return meta / atual;
  }

  /* ---------- status canônico ---------- */

  function status(atual, meta, sentido) {
    var a = atingimento(atual, meta, sentido);
    if (a === null) return STATUS.SEM_DADO;
    if (a >= LIMIAR_DENTRO) return STATUS.DENTRO;
    if (a >= LIMIAR_ATENCAO) return STATUS.ATENCAO;
    return STATUS.CRITICO;
  }

  // atalho para quando o atingimento já foi calculado
  function statusPorAtingimento(a) {
    if (!ehNumero(a) && a !== Number.POSITIVE_INFINITY) return STATUS.SEM_DADO;
    if (a >= LIMIAR_DENTRO) return STATUS.DENTRO;
    if (a >= LIMIAR_ATENCAO) return STATUS.ATENCAO;
    return STATUS.CRITICO;
  }

  /* ---------- acumulação ----------
     metodo: "media" (indicadores de desempenho: IPL, atendimento,
     satisfação, percentuais) ou "soma" (cumulativos: toneladas,
     podas, revitalizações). Ignora nulls; array vazio -> null. */

  function acumular(valores, metodo) {
    if (!Array.isArray(valores)) return null;
    var v = valores.filter(ehNumero);
    if (!v.length) return null;
    var soma = v.reduce(function (a, b) { return a + b; }, 0);
    if (metodo === "soma") return soma;
    if (metodo === "media") return soma / v.length;
    return null; // método desconhecido: nunca chutar
  }

  /* ---------- tendência por ciclos ----------
     Leitura executiva: "melhorando/piorando há N ciclos".
     Conta quantas transições consecutivas, a partir do mês mais
     recente, mantêm a mesma direção. Origem: indicadores-registro
     (absorvido). Retorna {texto, ciclos, direcao} ou null. */

  function tendenciaCiclos(serie, sentido) {
    var s = normalizarSentido(sentido);
    if (s === null || !Array.isArray(serie)) return null;
    var v = serie.filter(ehNumero);
    if (v.length < 2) return null;

    var direcoes = [];
    for (var i = 1; i < v.length; i++) {
      var d = v[i] - v[i - 1];
      direcoes.push(Math.abs(d) < 1e-9 ? 0 : (d > 0 ? 1 : -1));
    }

    var ultima = direcoes[direcoes.length - 1];
    if (ultima === 0) return { texto: "estável", ciclos: 0, direcao: "estavel" };

    var ciclos = 0;
    for (var j = direcoes.length - 1; j >= 0; j--) {
      if (direcoes[j] === ultima) ciclos++;
      else break;
    }

    var melhorando = (s === "maior" && ultima === 1) || (s === "menor" && ultima === -1);
    return {
      texto: melhorando ? "melhorando" : "piorando",
      ciclos: ciclos,
      direcao: melhorando ? "melhorando" : "piorando"
    };
  }

  /* ---------- tendência trimestral ----------
     Leitura financeira/volumétrica: média dos últimos 3 meses vs
     média dos 3 anteriores. Estável se variação absoluta < 2%.
     Origem: balanço de receita (absorvido). Retorna
     {direcao: "alta"|"queda"|"estavel", delta} ou null (< 6 meses). */

  var LIMIAR_ESTAVEL = 0.02;

  function tendenciaTrimestral(serie) {
    if (!Array.isArray(serie)) return null;
    var v = serie.filter(ehNumero);
    if (v.length < 6) return null;

    var ult = v.slice(-3), ant = v.slice(-6, -3);
    var mUlt = (ult[0] + ult[1] + ult[2]) / 3;
    var mAnt = (ant[0] + ant[1] + ant[2]) / 3;
    if (mAnt === 0) return null;

    var delta = (mUlt - mAnt) / Math.abs(mAnt);
    if (Math.abs(delta) < LIMIAR_ESTAVEL) return { direcao: "estavel", delta: delta };
    return { direcao: delta > 0 ? "alta" : "queda", delta: delta };
  }

  /* ---------- exclusão do mês corrente ----------
     Regra do ciclo de pagamento: o mês mais recente é excluído da
     análise quando ainda não houve pagamento (pago = 0) mas já há
     débito lançado (deb > 0). Recebe array de objetos e as chaves. */

  function excluirMesCorrente(meses, chavePago, chaveDeb) {
    if (!Array.isArray(meses) || !meses.length) return meses || [];
    var u = meses[meses.length - 1];
    var pago = u ? Number(u[chavePago]) : NaN;
    var deb = u ? Number(u[chaveDeb]) : NaN;
    if (pago === 0 && deb > 0) return meses.slice(0, -1);
    return meses.slice();
  }

  /* ---------- precedência SARC ----------
     Valor publicado no SARC sempre prevalece sobre o calculado
     localmente. Retorna o valor e a origem, para exibição do
     estado do dado. */

  function consolidar(valorLocal, valorSarc) {
    if (ehNumero(valorSarc)) return { valor: valorSarc, origem: "SARC" };
    if (ehNumero(valorLocal)) return { valor: valorLocal, origem: "local" };
    return { valor: null, origem: null };
  }

  /* ---------- exporta ---------- */

  HUB.rules = {
    STATUS: STATUS,
    LIMIAR_DENTRO: LIMIAR_DENTRO,
    LIMIAR_ATENCAO: LIMIAR_ATENCAO,
    atingimento: atingimento,
    status: status,
    statusPorAtingimento: statusPorAtingimento,
    acumular: acumular,
    tendenciaCiclos: tendenciaCiclos,
    tendenciaTrimestral: tendenciaTrimestral,
    excluirMesCorrente: excluirMesCorrente,
    consolidar: consolidar
  };

  HUB.registerComponent("rules");

})();
