/* ============================================================
   HUB COMLURB · ar/piloto/legado-referencia.js
   v1.1.0 — NÃO É O LEGADO EM PRODUÇÃO.

   Cópia fiel, extraída linha a linha, das funções PURAS (sem DOM) do
   script inline de ar/index.html EM PRODUÇÃO (main), conferida por
   diff direto contra o repositório em 15/07/2026 — não contra nenhum
   ZIP local. Existe unicamente para o harness de comparação
   (harness.js) rodar "o que o legado calcularia" sem precisar simular
   DOM/document (que ar/index.html usa só nas funções de render).

   CORREÇÃO v1.1.0: a versão anterior deste arquivo delegava num() para
   window.HUB.format.toNumberBR — função que NÃO existe no
   assets/components/hub-utils.js realmente publicado em main (é uma
   versão anterior à "Fase 2", sem essa API). Essa versão anterior
   nunca chegou a ser publicada; este arquivo corrige o problema antes
   da primeira publicação real, usando a MESMA implementação de num()
   que o ar/index.html de produção usa (autocontida, sem depender de
   hub-utils.js).

   ar/index.html continua sendo o painel real em produção e NÃO foi
   alterado por esta entrega. Este arquivo é só leitura de referência.

   Namespace: window.AR_LEGADO
   ============================================================ */

(function () {
  "use strict";

  function norm(v) { return String(v ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim(); }
  function key(v) { return norm(v).replace(/[^a-z0-9]/g, ""); }
  function get(row, names, fallback = "") {
    if (!row) return fallback;
    for (const n of names) { if (row[n] !== undefined && String(row[n]).trim() !== "") return row[n]; }
    const dict = {}; Object.keys(row).forEach(k => dict[key(k)] = k);
    for (const n of names) { const k2 = dict[key(n)]; if (k2 && row[k2] !== undefined && String(row[k2]).trim() !== "") return row[k2]; }
    return fallback;
  }

  // Réplica EXATA de num() em ar/index.html (produção, main, conferida
  // por diff em 15/07/2026) — autocontida, não depende de hub-utils.js.
  function num(v) {
    if (v === null || v === undefined) return null;
    if (typeof v === "number" && Number.isFinite(v)) return v;
    let s = String(v).trim();
    if (!s || s === "-" || s === "\u2014") return null;
    s = s.replace(/\s/g, "").replace("%", "");
    if (s.includes(",") && s.includes(".")) s = s.replace(/\./g, "").replace(",", ".");
    else if (s.includes(",") && !s.includes(".")) s = s.replace(",", ".");
    else if (s.includes(".") && !s.includes(",")) {
      const pts = s.split(".");
      if (pts.length === 2 && pts[1].length === 3 && /^\d+$/.test(pts[0]) && /^\d+$/.test(pts[1])) s = pts[0] + pts[1];
    }
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  function isPercent(unidade) { const u = norm(unidade); return u.includes("percent") || u === "%"; }
  function calcValue(v, unidade) { let n = num(v); if (n === null) return null; if (isPercent(unidade) && n > 1.5) n = n / 100; return n; }
  function maiorMelhor(sentido) { const s = norm(sentido); return s.includes("maior") || s.includes("\u2191") || s === ""; }

  function statusCanonico(atual, meta, sentido) {
    if (atual === null || meta === null || atual === 0 || meta === 0) return "Sem dado";
    const ating = maiorMelhor(sentido) ? atual / meta : meta / atual;
    if (ating >= 1) return "Dentro da Meta";
    if (ating >= .90) return "Atenção";
    return "Crítico";
  }
  function tagClass(status) {
    const s = norm(status);
    if (s.includes("dentro") || s.includes("superado")) return "ok";
    if (s.includes("aten")) return "att";
    if (s.includes("critic")) return "crit";
    return "nd";
  }
  function grupoOrdem(grupo) {
    const g = norm(grupo);
    if (g.includes("estrateg")) return 1;
    if (g.includes("condicion")) return 2;
    if (g.includes("performance")) return 3;
    return 9;
  }

  const CASADOS = [
    { id: "par-02", label: "Meta dupla: Recuperação de Resíduos + Ranking Nacional", membros: ["E02", "E03"],
      bonusNote: "Os dois precisam ser atingidos para que este par conte como uma meta na bonificação. O ranking nacional é apurado pela SINISA com dados do ano anterior — o resultado de 2026 só será publicado em 2027." },
    { id: "par-03", label: "Meta dupla: Atendimento 1746 Poda + Satisfação Poda", membros: ["E04", "E05"],
      bonusNote: "São dois requisitos da mesma meta: atendimento igual ou superior a 95% no prazo e nota de satisfação igual ou superior a 4,5. Os dois precisam ser atingidos juntos." },
    { id: "par-04", label: "Meta dupla: Atendimento 1746 Remoção + Satisfação Remoção", membros: ["E06", "E07"],
      bonusNote: "São dois requisitos da mesma meta: atendimento igual ou superior a 85% no prazo em cada subprefeitura e nota de satisfação igual ou superior a 4,4 para a cidade. Os dois precisam ser atingidos juntos." },
    { id: "par-c06", label: "Meta dupla (Condicionada): Conformidade IPL + Desvio Padrão IPL", membros: ["C01", "C02"],
      bonusNote: "São dois requisitos da mesma meta: conformidade acumulada igual ou superior a 80% e desvio padrão entre gerências igual ou inferior a 5,9. Os dois precisam ser atingidos juntos." }
  ];
  const BONUS_ESTRATEGICO = [
    { metas: 5, nota: 8.7, pct: 74 }, { metas: 4, nota: 8.4, pct: 68 }, { metas: 3, nota: 8, pct: 60 },
    { metas: 2, nota: 7, pct: 20 }, { metas: 1, nota: 6, pct: 0 }, { metas: 0, nota: 0, pct: 0 }
  ];
  const BONUS_CONDICIONADO = [
    { metas: 3, ponto: 0.3, pct: 6 }, { metas: 2, ponto: 0.2, pct: 4 }, { metas: 1, ponto: 0, pct: 0 }, { metas: 0, ponto: 0, pct: 0 }
  ];
  const BONUS_PERFORMANCE = { ponto: 1, pct: 20 };
  const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

  function montarMapeamento(RAW_map) {
    const map = new Map();
    RAW_map.forEach(r => {
      const codigo = String(get(r, ["Código_AR","Codigo_AR","Código","Codigo","Código AR","Codigo AR"])).trim();
      if (!codigo) return;
      map.set(codigo, {
        indicadorGeral: String(get(r, ["Indicador_Geral","Indicador Geral","Indicador Real","Nome na geral","Indicador"])).trim(),
        diretoria: String(get(r, ["Filtro_Diretoria","Diretoria"])).trim(),
        superint: String(get(r, ["Filtro_Superint","Filtro_Superintendência","Superint.","Superintendência"])).trim(),
        gerencia: String(get(r, ["Filtro_Gerência","Filtro_Gerencia","Gerência","Gerencia"])).trim()
      });
    });
    return map;
  }
  function encontrarGeral(indicador, mapItem, RAW_geral) {
    const nomeMap = norm(mapItem?.indicadorGeral || ""), nomeInd = norm(indicador.indicador);
    const rows = RAW_geral.filter(r => {
      const ano = String(get(r, ["Ano"])).trim();
      if (ano && ano !== "2026") return false;
      const nomeGeral = norm(get(r, ["Indicador"]));
      if (nomeMap) { if (nomeGeral !== nomeMap && !nomeGeral.includes(nomeMap) && !nomeMap.includes(nomeGeral)) return false; }
      else { if (nomeGeral !== nomeInd && !nomeGeral.includes(nomeInd) && !nomeInd.includes(nomeGeral)) return false; }
      const fDir = norm(mapItem?.diretoria || ""), fSup = norm(mapItem?.superint || ""), fGer = norm(mapItem?.gerencia || "");
      if (fDir && fDir !== "-" && norm(get(r, ["Diretoria"])) !== fDir) return false;
      if (fSup && fSup !== "-" && norm(get(r, ["Superint.","Superintendência","Superint"])) !== fSup) return false;
      if (fGer && fGer !== "-" && norm(get(r, ["Gerência","Gerencia"])) !== fGer) return false;
      return true;
    });
    return rows[0] || null;
  }
  function valoresMensais(row, unidade) { if (!row) return []; return MESES.map(m => calcValue(get(row, [m]), unidade)).filter(v => v !== null); }
  function tendenciaTexto(row, unidade, sentido) {
    const vals = valoresMensais(row, unidade);
    if (vals.length < 6) return "Série curta";
    const ult3 = vals.slice(-3), ant3 = vals.slice(-6, -3);
    const mediaUlt = ult3.reduce((s, v) => s + v, 0) / ult3.length, mediaAnt = ant3.reduce((s, v) => s + v, 0) / ant3.length;
    const dif = mediaUlt - mediaAnt;
    if (Math.abs(dif) < 0.00001) return "Estável";
    const favoravel = maiorMelhor(sentido) ? dif > 0 : dif < 0;
    return favoravel ? "Favorável" : "Desfavorável";
  }
  function tendenciaClass(t) {
    const x = norm(t);
    if (x.includes("favor")) return "ok";
    if (x.includes("desfavor")) return "crit";
    if (x.includes("estavel")) return "att";
    return "nd";
  }

  function processar(RAW) {
    const map = montarMapeamento(RAW.map);
    return RAW.ar.map((r, idx) => {
      const codigo = String(get(r, ["Código", "Codigo"])).trim() || `AR${idx + 1}`;
      const d = {
        codigo,
        grupo: String(get(r, ["Grupo"], "Sem grupo")).trim() || "Sem grupo",
        ordem: num(get(r, ["Ordem"])) ?? idx + 1,
        indicador: String(get(r, ["Indicador Executivo", "Indicador_Executivo", "Indicador"], codigo)).trim(),
        descricao: String(get(r, ["Descrição Resumida", "Descricao Resumida", "Descrição", "Descricao"])).trim(),
        unidade: String(get(r, ["Unidade"])).trim(),
        sentido: String(get(r, ["Sentido"], "maior_melhor")).trim(),
        metaRaw: get(r, ["Meta_2026", "Meta 2026", "Meta"]),
        atualRaw: get(r, ["Atual", "Resultado Atual", "Acumulado"]),
        fonte: String(get(r, ["Fonte_Dados", "Fonte Dados", "Fonte"])).trim(),
        pendencia: String(get(r, ["Pendência_Oficial", "Pendencia Oficial", "Pendência", "Pendencia"])).trim(),
        tipoAcumulado: String(get(r, ["Tipo_Acumulado", "Tipo Acumulado"], "SOMA")).trim().toUpperCase(),
        periodicidade: String(get(r, ["Periodicidade"], "Mensal")).trim()
      };
      const linha = encontrarGeral(d, map.get(codigo), RAW.geral);
      if (linha) {
        d.unidade = d.unidade || String(get(linha, ["Unidade"])).trim();
        d.sentido = d.sentido || String(get(linha, ["Sentido"], "maior_melhor")).trim();
        d.atualRaw = d.atualRaw || get(linha, ["Acumulado"]);
        d.metaRaw = d.metaRaw || get(linha, ["Meta"]);
      }
      d.atual = calcValue(d.atualRaw, d.unidade);
      d.meta = calcValue(d.metaRaw, d.unidade);
      if (d.atual !== null && d.meta !== null && d.meta !== 0) {
        const isSomaAnual = d.tipoAcumulado === "SOMA" && norm(d.periodicidade).includes("mensal");
        if (isSomaAnual) {
          const mesAtual = new Date().getMonth() + 1;
          d.metaProporcional = d.meta * (mesAtual / 12);
          d.atingimento = d.metaProporcional > 0 ? (maiorMelhor(d.sentido) ? d.atual / d.metaProporcional : d.metaProporcional / d.atual) : null;
          d.atingimentoProporcional = true;
        } else {
          d.metaProporcional = null;
          d.atingimento = maiorMelhor(d.sentido) ? d.atual / d.meta : d.meta / d.atual;
          d.atingimentoProporcional = false;
        }
      } else { d.atingimento = null; d.metaProporcional = null; d.atingimentoProporcional = false; }

      const rawStatus = String(get(r, ["Status"])).trim();
      if (rawStatus && rawStatus !== "Indisponível") {
        d.status = (rawStatus === "Superado" || rawStatus === "Dentro da Meta") ? "Dentro da Meta" :
          rawStatus === "Atenção" ? "Atenção" : rawStatus === "Crítico" ? "Crítico" : "Sem dado";
        d.statusDisplay = d.status;
      } else {
        const metaRef = d.metaProporcional ?? d.meta;
        d.status = statusCanonico(d.atual, metaRef, d.sentido);
        d.statusDisplay = d.status;
      }
      d.statusClass = tagClass(d.statusDisplay);
      d.tendencia = tendenciaTexto(linha, d.unidade, d.sentido);
      d.tendenciaClass = tendenciaClass(d.tendencia);
      const par = CASADOS.find(c => c.membros.includes(codigo));
      d.casadoId = par ? par.id : null;
      d.casadoLabel = par ? par.label : null;
      return d;
    }).filter(d => d.codigo || d.indicador).sort((a, b) => grupoOrdem(a.grupo) - grupoOrdem(b.grupo) || a.ordem - b.ordem);
  }

  function calcularBonificacao(lista) {
    const byId = Object.fromEntries(lista.map(d => [d.codigo, d]));
    const estratIndividuais = ["E01", "E08"];
    const estratCasados = CASADOS.filter(c => lista.some(d => d.grupo.toLowerCase().includes("estrateg") && c.membros.includes(d.codigo)));
    let metasEstrategicasAtingidas = 0; const detalhesEstrategicos = [];
    estratIndividuais.forEach(cod => {
      const d = byId[cod]; if (!d) return;
      const atingiu = d.status === "Dentro da Meta"; if (atingiu) metasEstrategicasAtingidas++;
      detalhesEstrategicos.push({ cod, label: d.indicador, atingiu, casado: false });
    });
    estratCasados.forEach(par => {
      const todos = par.membros.every(m => { const d = byId[m]; return d && d.status === "Dentro da Meta"; });
      if (todos) metasEstrategicasAtingidas++;
      detalhesEstrategicos.push({ cod: par.membros.join("+"), label: par.label, atingiu: todos, casado: true,
        membros: par.membros.map(m => ({ cod: m, indicador: byId[m]?.indicador || m, status: byId[m]?.statusDisplay || "Sem dado", statusClass: byId[m]?.statusClass || "nd" })),
        bonusNote: par.bonusNote });
    });
    const totalEstrategicas = estratIndividuais.filter(c => byId[c]).length + estratCasados.length;
    const condicionalAtiva = metasEstrategicasAtingidas >= 3;
    const regE = BONUS_ESTRATEGICO.find(r => metasEstrategicasAtingidas >= r.metas) || BONUS_ESTRATEGICO[BONUS_ESTRATEGICO.length - 1];
    const condIndividuais = ["C03", "C04"];
    const condCasados = CASADOS.filter(c => lista.some(d => d.grupo.toLowerCase().includes("condicion") && c.membros.includes(d.codigo)));
    let metasCondicionadasAtingidas = 0; const detalhesCondicionados = [];
    condIndividuais.forEach(cod => {
      const d = byId[cod]; if (!d) return;
      const atingiu = condicionalAtiva && d.status === "Dentro da Meta"; if (atingiu) metasCondicionadasAtingidas++;
      detalhesCondicionados.push({ cod, label: d.indicador, atingiu, casado: false, bloqueado: !condicionalAtiva });
    });
    condCasados.forEach(par => {
      const todos = condicionalAtiva && par.membros.every(m => { const d = byId[m]; return d && d.status === "Dentro da Meta"; });
      if (todos) metasCondicionadasAtingidas++;
      detalhesCondicionados.push({ cod: par.membros.join("+"), label: par.label, atingiu: todos, casado: true, bloqueado: !condicionalAtiva,
        membros: par.membros.map(m => ({ cod: m, indicador: byId[m]?.indicador || m, status: byId[m]?.statusDisplay || "Sem dado", statusClass: byId[m]?.statusClass || "nd" })),
        bonusNote: par.bonusNote });
    });
    const regC = BONUS_CONDICIONADO.find(r => metasCondicionadasAtingidas >= r.metas) || BONUS_CONDICIONADO[BONUS_CONDICIONADO.length - 1];
    const p01 = byId["P01"];
    const performanceAtingida = condicionalAtiva && p01 && p01.status === "Dentro da Meta";
    const bonusPerformance = performanceAtingida ? BONUS_PERFORMANCE.pct : 0;
    const bonusTotal = regE.pct + (condicionalAtiva ? regC.pct : 0) + (condicionalAtiva ? bonusPerformance : 0);
    return { metasEstrategicasAtingidas, totalEstrategicas, regE, condicionalAtiva, metasCondicionadasAtingidas, regC,
      performanceAtingida, bonusPerformance, bonusTotal, detalhesEstrategicos, detalhesCondicionados };
  }

  window.AR_LEGADO = {
    processar: processar,
    calcularBonificacao: calcularBonificacao,
    _norm: norm, _get: get, _num: num
  };

})();
