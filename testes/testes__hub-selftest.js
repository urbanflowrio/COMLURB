/* ============================================================
   HUB COMLURB · testes/hub-selftest.js · v2.0.0
   Suíte executável no navegador. Cobre a camada de regras.
   Grupos novos serão adicionados a cada arquivo da Fase 0
   (rules-ar, rules-ipl, insights, data, sources, status).
   ============================================================ */

(function () {
  "use strict";

  var R = window.HUB && window.HUB.rules;
  var grupos = [];
  var atual = null;

  function grupo(nome) { atual = { nome: nome, casos: [] }; grupos.push(atual); }
  function caso(nome, obtido, esperado) {
    var ok = JSON.stringify(obtido) === JSON.stringify(esperado);
    atual.casos.push({ nome: nome, ok: ok, obtido: obtido, esperado: esperado });
  }
  function quase(nome, obtido, esperado, tol) {
    var ok = typeof obtido === "number" && Math.abs(obtido - esperado) <= (tol || 1e-9);
    atual.casos.push({ nome: nome, ok: ok, obtido: obtido, esperado: esperado });
  }

  /* ================= STATUS: fronteiras oficiais ================= */
  grupo("Status canônico · fronteiras (maior_melhor)");
  caso("100% da meta é Dentro da Meta", R.status(100, 100, "maior_melhor"), "Dentro da Meta");
  caso("99,9% é Atenção", R.status(99.9, 100, "maior_melhor"), "Atenção");
  caso("Exatamente 90% é Atenção", R.status(90, 100, "maior_melhor"), "Atenção");
  caso("89,9% é Crítico", R.status(89.9, 100, "maior_melhor"), "Crítico");
  caso("REGRESSÃO 0.85: 85% NUNCA é Atenção", R.status(85, 100, "maior_melhor"), "Crítico");
  caso("120% é Dentro da Meta (superado)", R.status(120, 100, "maior_melhor"), "Dentro da Meta");

  /* ============ STATUS: menor_melhor (regra do AR, canônica) ============ */
  grupo("Status canônico · menor_melhor (regra do AR)");
  caso("Na meta exata é Dentro da Meta", R.status(5.9, 5.9, "menor_melhor"), "Dentro da Meta");
  caso("Abaixo da meta é Dentro da Meta", R.status(5.0, 5.9, "menor_melhor"), "Dentro da Meta");
  caso("1,10·meta é Atenção (fronteira da regra aposentada)", R.status(110, 100, "menor_melhor"), "Atenção");
  caso("1,105·meta é Atenção (caso da divergência resolvida)", R.status(110.5, 100, "menor_melhor"), "Atenção");
  quase("Atingimento em 1,111·meta ~ 0.9", R.atingimento(111.1, 100, "menor_melhor"), 0.90009, 0.0001);
  caso("1,12·meta é Crítico", R.status(112, 100, "menor_melhor"), "Crítico");
  caso("Alias legado ↓ aceito", R.status(112, 100, "↓"), "Crítico");
  caso("Alias legado ↑ aceito", R.status(95, 100, "↑"), "Atenção");

  /* ================= STATUS: casos de borda ================= */
  grupo("Status canônico · bordas e Sem dado");
  caso("Valor null é Sem dado", R.status(null, 100, "maior_melhor"), "Sem dado");
  caso("Meta null é Sem dado", R.status(50, null, "maior_melhor"), "Sem dado");
  caso("Sentido desconhecido é Sem dado", R.status(50, 100, "qualquer"), "Sem dado");
  caso("Meta zero (maior_melhor) é Sem dado", R.status(50, 0, "maior_melhor"), "Sem dado");
  caso("Zero ocorrências com meta menor_melhor é Dentro da Meta", R.status(0, 10, "menor_melhor"), "Dentro da Meta");
  caso("NaN é Sem dado", R.status(NaN, 100, "maior_melhor"), "Sem dado");
  caso("String não é aceita silenciosamente", R.status("95", 100, "maior_melhor"), "Sem dado");

  /* ================= ACUMULAÇÃO ================= */
  grupo("Acumulação · média vs soma");
  caso("Soma de cumulativos", R.acumular([10, 20, 30], "soma"), 60);
  quase("Média de desempenho", R.acumular([80, 90, 100], "media"), 90);
  quase("Nulls ignorados na média", R.acumular([80, null, 100], "media"), 90);
  caso("Série vazia é null", R.acumular([], "media"), null);
  caso("Método desconhecido é null (nunca chutar)", R.acumular([1, 2], "acumulado"), null);

  /* ================= TENDÊNCIAS ================= */
  grupo("Tendência por ciclos (leitura executiva)");
  caso("Alta consecutiva em maior_melhor é melhorando há 3",
    R.tendenciaCiclos([70, 75, 80, 85], "maior_melhor"),
    { texto: "melhorando", ciclos: 3, direcao: "melhorando" });
  caso("Alta consecutiva em menor_melhor é piorando",
    R.tendenciaCiclos([5, 6, 7], "menor_melhor"),
    { texto: "piorando", ciclos: 2, direcao: "piorando" });
  caso("Último mês igual é estável",
    R.tendenciaCiclos([5, 7, 7], "maior_melhor"),
    { texto: "estável", ciclos: 0, direcao: "estavel" });
  caso("Série curta é null", R.tendenciaCiclos([5], "maior_melhor"), null);

  grupo("Tendência trimestral (leitura financeira)");
  caso("Crescimento claro é alta",
    R.tendenciaTrimestral([100, 100, 100, 150, 150, 150]).direcao, "alta");
  caso("Queda clara é queda",
    R.tendenciaTrimestral([150, 150, 150, 100, 100, 100]).direcao, "queda");
  caso("Variação < 2% é estável",
    R.tendenciaTrimestral([100, 100, 100, 101, 101, 101]).direcao, "estavel");
  caso("Menos de 6 meses é null", R.tendenciaTrimestral([1, 2, 3, 4, 5]), null);

  /* ================= CICLO DE PAGAMENTO ================= */
  grupo("Exclusão do mês corrente (ciclo de pagamento)");
  caso("Último mês com pago=0 e deb>0 é excluído",
    R.excluirMesCorrente([{ p: 10, d: 2 }, { p: 0, d: 5 }], "p", "d").length, 1);
  caso("Último mês com pagamento permanece",
    R.excluirMesCorrente([{ p: 10, d: 2 }, { p: 8, d: 1 }], "p", "d").length, 2);
  caso("Último mês zerado dos dois lados permanece (sem apuração ≠ ciclo)",
    R.excluirMesCorrente([{ p: 10, d: 2 }, { p: 0, d: 0 }], "p", "d").length, 2);

  /* ================= PRECEDÊNCIA SARC ================= */
  grupo("Precedência SARC");
  caso("SARC publicado prevalece sobre local",
    R.consolidar(78.2, 79.5), { valor: 79.5, origem: "SARC" });
  caso("Sem SARC usa o local com origem declarada",
    R.consolidar(78.2, null), { valor: 78.2, origem: "local" });
  caso("Sem nenhum valor é null",
    R.consolidar(null, null), { valor: null, origem: null });

  /* ================= RENDER ================= */
  var totais = { pass: 0, fail: 0 };
  var elGrupos = document.getElementById("grupos");
  grupos.forEach(function (g) {
    var div = document.createElement("div");
    div.className = "grupo";
    var h = "<h2>" + g.nome + "</h2>";
    g.casos.forEach(function (c) {
      totais[c.ok ? "pass" : "fail"]++;
      h += '<div class="caso ' + (c.ok ? "pass" : "fail") + '">' +
        '<span class="mark">' + (c.ok ? "PASSOU" : "FALHOU") + "</span>" +
        "<span>" + c.nome + "</span>" +
        (c.ok ? "" : '<span class="det">esperado ' + JSON.stringify(c.esperado) +
          ", obtido " + JSON.stringify(c.obtido) + "</span>") +
        "</div>";
    });
    div.innerHTML = h;
    elGrupos.appendChild(div);
  });

  var resumo = document.getElementById("resumo");
  var total = totais.pass + totais.fail;
  if (totais.fail === 0) {
    resumo.className = "resumo ok";
    resumo.textContent = total + " casos executados · todos passaram · biblioteca liberada para commit";
  } else {
    resumo.className = "resumo falha";
    resumo.textContent = totais.fail + " de " + total + " casos FALHARAM · NÃO publicar alterações na biblioteca";
  }

})();
