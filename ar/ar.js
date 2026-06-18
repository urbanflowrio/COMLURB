/*
 * HUB COMLURB · Acordo de Resultados
 * Motor do painel executivo.
 */

(function(){
  const CFG = window.AR_CONFIG || {};
  const MESES = CFG.meses || [];
  const STATUS_CFG = CFG.status || { superado: 1.000001, dentroMeta: 1, atencao: 0.9 };

  const state = {
    raw: {
      geral: [],
      ar: [],
      mapeamento: [],
      governanca: []
    },
    indicadores: [],
    filtrados: [],
    filters: {
      ano: "",
      grupo: "",
      status: "",
      diretoria: "",
      busca: ""
    }
  };

  const $ = (id) => document.getElementById(id);

  function esc(value){
    return String(value ?? "").replace(/[&<>"']/g, c => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
    }[c]));
  }

  function first(row, names, fallback = ""){
    if(!row) return fallback;
    for(const name of names){
      if(Object.prototype.hasOwnProperty.call(row, name) && row[name] !== undefined && row[name] !== null && String(row[name]).trim() !== ""){
        return row[name];
      }
    }
    const normalized = {};
    Object.keys(row).forEach(k => normalized[normKey(k)] = k);
    for(const name of names){
      const k = normalized[normKey(name)];
      if(k && row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== ""){
        return row[k];
      }
    }
    return fallback;
  }

  function normKey(s){
    return String(s ?? "")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  }

  function normText(s){
    return String(s ?? "")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function toNumber(value){
    if(value === null || value === undefined) return null;
    if(typeof value === "number" && Number.isFinite(value)) return value;

    let s = String(value).trim();
    if(!s || s === "-" || s === "—") return null;

    s = s.replace(/\s/g, "").replace(/%/g, "");

    if(s.includes(",") && s.includes(".")){
      s = s.replace(/\./g, "").replace(",", ".");
    } else if(s.includes(",")){
      s = s.replace(",", ".");
    }

    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  function fmtNumber(value, unit){
    const n = toNumber(value);
    if(n === null) return "—";

    const u = String(unit || "").toLowerCase();

    if(u.includes("percent") || u === "%" || (Math.abs(n) <= 1.5 && u.includes("%"))){
      const pct = Math.abs(n) <= 1.5 ? n * 100 : n;
      return pct.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "%";
    }

    if(u.includes("posição")){
      return n.toLocaleString("pt-BR", { maximumFractionDigits: 0 }) + "º";
    }

    return n.toLocaleString("pt-BR", { maximumFractionDigits: n >= 100 ? 0 : 2 });
  }

  function fmtAting(value){
    const n = toNumber(value);
    if(n === null) return "—";
    return (n * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "%";
  }

  function isMaiorMelhor(sentido){
    const s = normText(sentido);
    return s.includes("maior") || s.includes("↑") || s.includes("subir") || s === "";
  }

  function classeStatus(status){
    const s = normText(status);
    if(s.includes("super") || s.includes("dentro") || s.includes("meta atingida")) return "green";
    if(s.includes("aten")) return "orange";
    if(s.includes("critic") || s.includes("abaixo")) return "red";
    return "purple";
  }

  function calcularAtingimento(atual, meta, sentido){
    const a = toNumber(atual);
    const m = toNumber(meta);
    if(a === null || m === null || a === 0 || m === 0) return null;
    return isMaiorMelhor(sentido) ? a / m : m / a;
  }

  function calcularStatus(atingimento){
    const a = toNumber(atingimento);
    if(a === null) return "Indisponível";
    if(a > STATUS_CFG.superado) return "Superado";
    if(a >= STATUS_CFG.dentroMeta) return "Dentro da Meta";
    if(a >= STATUS_CFG.atencao) return "Atenção";
    return "Crítico";
  }

  function calcularTendencia(atual, referencia, sentido){
    const a = toNumber(atual);
    const r = toNumber(referencia);
    if(a === null || r === null || r === 0) return "Indisponível";

    const diff = a - r;
    if(Math.abs(diff) < 0.00001) return "Estável";

    const positivo = isMaiorMelhor(sentido) ? diff > 0 : diff < 0;
    return positivo ? "Positiva" : "Negativa";
  }

  function inferirAno(){
    const anos = new Set();

    state.raw.geral.forEach(r => {
      const ano = first(r, ["Ano"]);
      if(ano) anos.add(String(ano).trim());
    });

    if(!anos.size && CFG.anoDefault) anos.add(String(CFG.anoDefault));

    return Array.from(anos).sort().reverse();
  }

  async function loadCSV(url, nome, required){
    if(!url) {
      if(required) throw new Error("URL não informada para " + nome);
      return [];
    }

    return new Promise((resolve, reject) => {
      Papa.parse(url, {
        download: true,
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        complete: (res) => {
          if(res.errors && res.errors.length){
            console.warn("Avisos ao carregar", nome, res.errors);
          }
          resolve((res.data || []).filter(row => Object.values(row).some(v => String(v ?? "").trim() !== "")));
        },
        error: (err) => {
          if(required) reject(new Error("Falha ao carregar " + nome + ": " + err.message));
          else {
            console.warn("Falha opcional ao carregar", nome, err);
            resolve([]);
          }
        }
      });
    });
  }

  async function carregarDados(){
    const urls = CFG.urls || {};
    const [geral, ar, mapeamento, governanca] = await Promise.all([
      loadCSV(urls.geral, "geral", true),
      loadCSV(urls.ar2026, "AR_2026", true),
      loadCSV(urls.mapeamento, "mapeamento", false),
      loadCSV(urls.governanca, "governança", false)
    ]);

    state.raw.geral = geral;
    state.raw.ar = ar;
    state.raw.mapeamento = mapeamento;
    state.raw.governanca = governanca;
  }

  function montarIndiceMapeamento(){
    const map = new Map();

    state.raw.mapeamento.forEach(r => {
      const codigo = String(first(r, ["Código_AR", "Codigo_AR", "Código", "Codigo", "Codigo AR", "Código AR"])).trim();
      if(!codigo) return;

      map.set(codigo, {
        indicadorGeral: String(first(r, ["Indicador_Geral", "Indicador Geral", "Indicador Real", "Nome na geral", "Indicador"])).trim(),
        diretoria: String(first(r, ["Filtro_Diretoria", "Diretoria", "Diretoria_Geral"])).trim(),
        superint: String(first(r, ["Filtro_Superint", "Superint.", "Superint", "Superintendência"])).trim(),
        gerencia: String(first(r, ["Filtro_Gerência", "Filtro_Gerencia", "Gerência", "Gerencia"])).trim(),
        usar: String(first(r, ["Usar_no_Painel", "Usar no Painel", "Usar"], "SIM")).trim()
      });
    });

    return map;
  }

  function encontrarLinhaGeral(indicadorAR, mapItem, ano){
    const nomeMap = normText(mapItem && mapItem.indicadorGeral);
    const nomeAR = normText(indicadorAR.indicadorExecutivo);

    let candidatos = state.raw.geral.filter(r => {
      const anoRow = String(first(r, ["Ano"])).trim();
      if(ano && anoRow && anoRow !== String(ano)) return false;

      const indicador = normText(first(r, ["Indicador"]));
      const matchNome = nomeMap ? indicador === nomeMap : indicador === nomeAR || indicador.includes(nomeAR) || nomeAR.includes(indicador);
      if(!matchNome) return false;

      const dirFiltro = normText(mapItem && mapItem.diretoria);
      const supFiltro = normText(mapItem && mapItem.superint);
      const gerFiltro = normText(mapItem && mapItem.gerencia);

      if(dirFiltro && dirFiltro !== "-" && normText(first(r, ["Diretoria"])) !== dirFiltro) return false;
      if(supFiltro && supFiltro !== "-" && normText(first(r, ["Superint.", "Superint", "Superintendência"])) !== supFiltro) return false;
      if(gerFiltro && gerFiltro !== "-" && normText(first(r, ["Gerência", "Gerencia"])) !== gerFiltro) return false;

      return true;
    });

    if(!candidatos.length && nomeMap){
      candidatos = state.raw.geral.filter(r => {
        const anoRow = String(first(r, ["Ano"])).trim();
        if(ano && anoRow && anoRow !== String(ano)) return false;
        const indicador = normText(first(r, ["Indicador"]));
        return indicador.includes(nomeMap) || nomeMap.includes(indicador);
      });
    }

    return candidatos[0] || null;
  }

  function ultimoMesComDado(row){
    if(!row) return null;
    for(let i = MESES.length - 1; i >= 0; i--){
      const m = MESES[i];
      const val = toNumber(first(row, [m.key, m.label]));
      if(val !== null) return { mes: m.key, valor: val };
    }
    return null;
  }

  function processarIndicadores(){
    const mapa = montarIndiceMapeamento();
    const anoDefault = String(CFG.anoDefault || "");
    const anoSelecionado = state.filters.ano || anoDefault;

    state.indicadores = state.raw.ar.map((r, idx) => {
      const codigo = String(first(r, ["Código", "Codigo"])).trim() || `AR${idx+1}`;
      const mapItem = mapa.get(codigo) || null;

      const indicador = {
        codigo,
        grupo: String(first(r, ["Grupo"], "Sem grupo")).trim() || "Sem grupo",
        ordem: toNumber(first(r, ["Ordem"])) ?? idx + 1,
        indicadorExecutivo: String(first(r, ["Indicador Executivo", "Indicador_Executivo", "Indicador"], codigo)).trim(),
        descricao: String(first(r, ["Descrição Resumida", "Descricao Resumida", "Descrição", "Descricao"])).trim(),
        diretoria: String(first(r, ["Diretoria Responsável", "Diretoria Responsavel", "Diretoria"], "A definir")).trim() || "A definir",
        unidade: String(first(r, ["Unidade"])).trim(),
        sentido: String(first(r, ["Sentido"], "maior_melhor")).trim(),
        tipoAcumulado: String(first(r, ["Tipo_Acumulado", "Tipo Acumulado"])).trim(),
        periodicidade: String(first(r, ["Periodicidade"])).trim(),
        referencia: first(r, ["Referência", "Referencia"]),
        meta: first(r, ["Meta_2026", "Meta 2026", "Meta"]),
        atualOriginal: first(r, ["Atual", "Resultado Atual", "Acumulado"]),
        atingimentoOriginal: first(r, ["Atingimento_%", "Atingimento %", "Atingimento"]),
        statusOriginal: String(first(r, ["Status"])).trim(),
        tendenciaOriginal: String(first(r, ["Tendência", "Tendencia"])).trim(),
        fonte: String(first(r, ["Fonte_Dados", "Fonte Dados", "Fonte"])).trim(),
        pendencia: String(first(r, ["Pendência_Oficial", "Pendencia Oficial", "Pendência", "Pendencia"])).trim(),
        observacao: String(first(r, ["Observação", "Observacao"])).trim(),
        indicadorGeral: mapItem ? mapItem.indicadorGeral : ""
      };

      const linhaGeral = encontrarLinhaGeral(indicador, mapItem, anoSelecionado);
      const ultimoMes = ultimoMesComDado(linhaGeral);

      const acumuladoGeral = linhaGeral ? first(linhaGeral, ["Acumulado"]) : "";
      const metaGeral = linhaGeral ? first(linhaGeral, ["Meta"]) : "";
      const unidadeGeral = linhaGeral ? first(linhaGeral, ["Unidade"]) : "";
      const sentidoGeral = linhaGeral ? first(linhaGeral, ["Sentido"]) : "";

      indicador.atual = first({v: indicador.atualOriginal}, ["v"]) || acumuladoGeral || (ultimoMes ? ultimoMes.valor : "");
      indicador.meta = indicador.meta || metaGeral;
      indicador.unidade = indicador.unidade || unidadeGeral;
      indicador.sentido = indicador.sentido || sentidoGeral || "maior_melhor";
      indicador.ultimoMes = ultimoMes ? ultimoMes.mes : "";
      indicador.linhaGeralEncontrada = !!linhaGeral;

      let ating = toNumber(indicador.atingimentoOriginal);
      if(ating !== null && ating > 1.5) ating = ating / 100;
      if(ating === null) ating = calcularAtingimento(indicador.atual, indicador.meta, indicador.sentido);

      indicador.atingimento = ating;
      indicador.status = indicador.statusOriginal || calcularStatus(ating);
      indicador.tendencia = indicador.tendenciaOriginal || calcularTendencia(indicador.atual, indicador.referencia, indicador.sentido);
      indicador.statusClass = classeStatus(indicador.status);

      return indicador;
    }).filter(i => i.codigo || i.indicadorExecutivo);
  }

  function aplicarFiltros(){
    const f = state.filters;
    state.filtrados = state.indicadores.filter(i => {
      if(f.grupo && i.grupo !== f.grupo) return false;
      if(f.status && i.status !== f.status) return false;
      if(f.diretoria && i.diretoria !== f.diretoria) return false;

      if(f.busca){
        const alvo = normText([i.codigo, i.grupo, i.indicadorExecutivo, i.descricao, i.fonte, i.indicadorGeral].join(" "));
        if(!alvo.includes(normText(f.busca))) return false;
      }

      return true;
    }).sort((a,b) => {
      const g = String(a.grupo).localeCompare(String(b.grupo), "pt-BR");
      if(g !== 0) return g;
      return (a.ordem || 0) - (b.ordem || 0);
    });
  }

  function setOptions(id, values, labelTodos){
    const el = $(id);
    if(!el) return;
    const atual = el.value;
    el.innerHTML = `<option value="">${esc(labelTodos)}</option>` + values.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join("");
    if(values.includes(atual)) el.value = atual;
  }

  function initFiltros(){
    const anos = inferirAno();
    setOptions("fAno", anos, "Todos");
    if(anos.includes(String(CFG.anoDefault))) $("fAno").value = String(CFG.anoDefault);
    else if(anos.length) $("fAno").value = anos[0];

    state.filters.ano = $("fAno").value;

    ["fAno","fGrupo","fStatus","fDiretoria"].forEach(id => {
      $(id).addEventListener("change", () => {
        state.filters.ano = $("fAno").value;
        state.filters.grupo = $("fGrupo").value;
        state.filters.status = $("fStatus").value;
        state.filters.diretoria = $("fDiretoria").value;
        processarIndicadores();
        atualizarFiltrosDerivados();
        renderAll();
      });
    });

    $("fBusca").addEventListener("input", () => {
      state.filters.busca = $("fBusca").value;
      renderAll();
    });

    $("btnLimpar").addEventListener("click", () => {
      $("fGrupo").value = "";
      $("fStatus").value = "";
      $("fDiretoria").value = "";
      $("fBusca").value = "";
      state.filters.grupo = "";
      state.filters.status = "";
      state.filters.diretoria = "";
      state.filters.busca = "";
      renderAll();
    });

    document.querySelectorAll(".tabBtn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tabBtn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
        btn.classList.add("active");
        const target = btn.dataset.screen;
        const screen = $(target);
        if(screen) screen.classList.add("active");
      });
    });

    $("btnExportar").addEventListener("click", exportarCSV);
  }

  function atualizarFiltrosDerivados(){
    const base = state.indicadores;
    setOptions("fGrupo", unique(base.map(i => i.grupo)), "Todos");
    setOptions("fStatus", unique(base.map(i => i.status)), "Todos");
    setOptions("fDiretoria", unique(base.map(i => i.diretoria)), "Todas");

    $("fGrupo").value = state.filters.grupo;
    $("fStatus").value = state.filters.status;
    $("fDiretoria").value = state.filters.diretoria;
  }

  function unique(arr){
    return Array.from(new Set(arr.filter(v => String(v ?? "").trim() !== ""))).sort((a,b) => String(a).localeCompare(String(b), "pt-BR"));
  }

  function renderResumo(){
    const rows = state.filtrados;
    const total = rows.length;
    const atingidas = rows.filter(i => ["Superado","Dentro da Meta"].includes(i.status)).length;
    const atencao = rows.filter(i => i.status === "Atenção").length;
    const critico = rows.filter(i => i.status === "Crítico").length;
    const semDado = rows.filter(i => i.status === "Indisponível").length;
    const pct = total ? atingidas / total : null;

    $("kpisResumo").innerHTML = [
      kpi("Indicadores monitorados", total, "metas pactuadas no recorte", "feature"),
      kpi("Metas atingidas", pct === null ? "—" : fmtAting(pct), `${atingidas} de ${total} indicadores`, "green"),
      kpi("Em atenção", atencao, "entre 90% e 99,9% da meta", "orange"),
      kpi("Críticos", critico, "abaixo de 90% da meta", "red"),
      kpi("Sem dado", semDado, "pendente ou não publicado", "purple")
    ].join("");
  }

  function kpi(label, value, note, color){
    return `
      <div class="kpi ${color || ""}">
        <div class="label">${esc(label)}</div>
        <div class="value">${esc(value)}</div>
        <div class="note">${esc(note || "")}</div>
      </div>
    `;
  }

  function renderLeitura(){
    const rows = state.filtrados;
    const total = rows.length;
    const criticos = rows.filter(i => i.status === "Crítico");
    const atencao = rows.filter(i => i.status === "Atenção");
    const atingidas = rows.filter(i => ["Superado","Dentro da Meta"].includes(i.status));
    const pct = total ? Math.round((atingidas.length / total) * 1000) / 10 : 0;

    const pior = [...criticos, ...atencao].sort((a,b) => (toNumber(a.atingimento) ?? 999) - (toNumber(b.atingimento) ?? 999))[0];
    const melhor = [...atingidas].sort((a,b) => (toNumber(b.atingimento) ?? 0) - (toNumber(a.atingimento) ?? 0))[0];

    $("leituraExecutiva").innerHTML = `
      <p class="arReadTitle">${total ? `${pct.toLocaleString("pt-BR")}% das metas do recorte estão atingidas ou superadas.` : "Sem indicadores no recorte selecionado."}</p>
      <p class="arReadText">
        O painel consolida os grupos Estratégica, Condicionada e Performance, com leitura automática de status a partir do resultado atual e da meta pactuada.
        ${criticos.length ? `Há ${criticos.length} indicador(es) em condição crítica, exigindo acompanhamento direto.` : "Não há indicador crítico no recorte atual."}
      </p>
      <div class="arList">
        ${melhor ? miniItem("Melhor posição no recorte", melhor) : ""}
        ${pior ? miniItem("Principal ponto de atenção", pior) : ""}
      </div>
    `;

    $("prioridadeExecutiva").innerHTML = pior ? `
      <p class="arReadTitle">${esc(pior.indicadorExecutivo)}</p>
      <p class="arReadText">
        Status atual: <strong>${esc(pior.status)}</strong>. Resultado: <strong>${esc(fmtNumber(pior.atual, pior.unidade))}</strong>.
        Meta: <strong>${esc(fmtNumber(pior.meta, pior.unidade))}</strong>.
        ${pior.pendencia ? `<br>Registro de governança: ${esc(pior.pendencia)}` : ""}
      </p>
      <div class="arProgress">
        ${progressBar(pior)}
      </div>
    ` : `
      <p class="arReadTitle">Sem prioridade crítica no recorte.</p>
      <p class="arReadText">Os indicadores filtrados não apresentam risco relevante pela regra de semáforo atual.</p>
    `;
  }

  function miniItem(label, i){
    return `
      <div class="arListItem">
        <div>
          <div class="arListTitle">${esc(label)} · ${esc(i.codigo)} ${esc(i.indicadorExecutivo)}</div>
          <div class="arListMeta">${esc(i.grupo)} · ${esc(i.status)} · atingimento ${esc(fmtAting(i.atingimento))}</div>
        </div>
        <span class="arTag ${esc(i.statusClass)}">${esc(i.status)}</span>
      </div>
    `;
  }

  function progressBar(i){
    const a = toNumber(i.atingimento);
    const width = a === null ? 0 : Math.max(0, Math.min(120, a * 100));
    return `
      <div class="arProgressTrack"><div class="arProgressBar" style="width:${width}%"></div></div>
      <div class="arProgressText">
        <span>Atingimento ${esc(fmtAting(i.atingimento))}</span>
        <span>Meta ${esc(fmtNumber(i.meta, i.unidade))}</span>
      </div>
    `;
  }

  function renderGrupos(){
    const grupos = unique(state.filtrados.map(i => i.grupo));
    $("gruposAR").innerHTML = grupos.map(grupo => {
      const rows = state.filtrados.filter(i => i.grupo === grupo);
      const ok = rows.filter(i => ["Superado","Dentro da Meta"].includes(i.status)).length;
      const pct = rows.length ? ok / rows.length : null;

      return `
        <section class="arGroup">
          <div class="arGroupHead">
            <div>
              <h2 class="arGroupTitle">${esc(grupo)}</h2>
              <div class="arGroupHint">${rows.length} indicador(es) · ${esc(fmtAting(pct))} atingidos ou superados</div>
            </div>
          </div>
          <div class="arIndicatorGrid">
            ${rows.map(cardIndicador).join("")}
          </div>
        </section>
      `;
    }).join("");
  }

  function cardIndicador(i){
    return `
      <article class="arCard ${esc(i.statusClass)}">
        <div>
          <div class="arCardTop">
            <span class="arCode">${esc(i.codigo)}</span>
            <span class="arTag ${esc(i.statusClass)}">${esc(i.status)}</span>
          </div>

          <div class="arCardTitle">${esc(i.indicadorExecutivo)}</div>
          <div class="arCardDesc">${esc(i.descricao || i.fonte || "Indicador pactuado no Acordo de Resultados.")}</div>
        </div>

        <div>
          <div class="arMetricRow">
            <div class="arMetric">
              <span>Atual</span>
              <b title="${esc(fmtNumber(i.atual, i.unidade))}">${esc(fmtNumber(i.atual, i.unidade))}</b>
            </div>
            <div class="arMetric">
              <span>Meta</span>
              <b title="${esc(fmtNumber(i.meta, i.unidade))}">${esc(fmtNumber(i.meta, i.unidade))}</b>
            </div>
            <div class="arMetric">
              <span>Ating.</span>
              <b>${esc(fmtAting(i.atingimento))}</b>
            </div>
          </div>

          <div class="arProgress">${progressBar(i)}</div>

          <div class="arListMeta" style="margin-top:10px;">
            ${esc(i.diretoria || "A definir")} · ${esc(i.periodicidade || "Periodicidade não informada")} · ${esc(i.tendencia || "Tendência indisponível")}
          </div>
        </div>
      </article>
    `;
  }

  function renderTopRiscos(){
    const riscos = state.filtrados
      .filter(i => ["Crítico","Atenção","Indisponível"].includes(i.status))
      .sort((a,b) => (toNumber(a.atingimento) ?? -1) - (toNumber(b.atingimento) ?? -1))
      .slice(0, 8);

    $("topRiscos").innerHTML = riscos.length ? `<div class="arList">${riscos.map(i => miniItem(i.status, i)).join("")}</div>` : `<div class="empty">Sem indicadores em atenção no recorte.</div>`;
  }

  function renderDiretoria(){
    const grupos = {};
    state.filtrados.forEach(i => {
      const d = i.diretoria || "A definir";
      grupos[d] = grupos[d] || { total: 0, ok: 0, crit: 0 };
      grupos[d].total += 1;
      if(["Superado","Dentro da Meta"].includes(i.status)) grupos[d].ok += 1;
      if(i.status === "Crítico") grupos[d].crit += 1;
    });

    const rows = Object.entries(grupos).sort((a,b) => b[1].total - a[1].total);

    $("porDiretoria").innerHTML = rows.length ? `
      <div class="arList">
        ${rows.map(([dir,v]) => `
          <div class="arListItem">
            <div>
              <div class="arListTitle">${esc(dir)}</div>
              <div class="arListMeta">${v.total} indicador(es) · ${v.ok} atingido(s) · ${v.crit} crítico(s)</div>
            </div>
            <span class="arTag ${v.crit ? "red" : "green"}">${esc(fmtAting(v.total ? v.ok / v.total : null))}</span>
          </div>
        `).join("")}
      </div>
    ` : `<div class="empty">Sem dados para distribuição.</div>`;
  }

  function renderTabelaAnalitica(){
    const rows = state.filtrados;
    $("contagemTabela").textContent = `${rows.length} registro(s)`;

    const cols = [
      ["codigo","Código"],
      ["grupo","Grupo"],
      ["indicadorExecutivo","Indicador Executivo"],
      ["diretoria","Diretoria"],
      ["atual","Atual"],
      ["meta","Meta"],
      ["atingimento","Atingimento"],
      ["status","Status"],
      ["tendencia","Tendência"],
      ["fonte","Fonte"],
      ["pendencia","Pendência"]
    ];

    const table = $("tabelaAnalitica");
    table.querySelector("thead").innerHTML = `<tr>${cols.map(c => `<th>${esc(c[1])}</th>`).join("")}</tr>`;
    table.querySelector("tbody").innerHTML = rows.map(i => `
      <tr>
        ${cols.map(([key]) => {
          let val = i[key];
          if(key === "atual" || key === "meta") val = fmtNumber(val, i.unidade);
          if(key === "atingimento") val = fmtAting(val);
          const wrap = ["indicadorExecutivo","fonte","pendencia"].includes(key) ? " arWrapCell" : "";
          return `<td class="${wrap}">${esc(val || "—")}</td>`;
        }).join("")}
      </tr>
    `).join("");
  }

  function renderGovernanca(){
    $("regrasPainel").innerHTML = `
      <div class="arList">
        <div class="arListItem"><div><div class="arListTitle">Status</div><div class="arListMeta">Superado acima de 100%, Dentro da Meta em 100%, Atenção de 90% a 99,9%, Crítico abaixo de 90%.</div></div></div>
        <div class="arListItem"><div><div class="arListTitle">Sentido do indicador</div><div class="arListMeta">maior_melhor usa Atual ÷ Meta. menor_melhor usa Meta ÷ Atual.</div></div></div>
        <div class="arListItem"><div><div class="arListTitle">Atualização</div><div class="arListMeta">O painel lê os CSVs publicados. Ao atualizar a planilha oficial, o GitHub Pages carrega os dados mais recentes.</div></div></div>
      </div>
    `;

    const pend = state.indicadores.filter(i => i.pendencia || !i.linhaGeralEncontrada || i.status === "Indisponível").slice(0, 12);

    $("fontesPendencias").innerHTML = pend.length ? `
      <div class="arList">
        ${pend.map(i => `
          <div class="arListItem">
            <div>
              <div class="arListTitle">${esc(i.codigo)} · ${esc(i.indicadorExecutivo)}</div>
              <div class="arListMeta">${esc(i.pendencia || (i.linhaGeralEncontrada ? "Sem resultado atual disponível." : "Sem cruzamento encontrado na aba geral."))}</div>
            </div>
            <span class="arTag ${esc(i.statusClass)}">${esc(i.status)}</span>
          </div>
        `).join("")}
      </div>
    ` : `<div class="empty">Sem pendências registradas.</div>`;

    renderTabelaGenerica("tabelaGovernanca", state.raw.governanca);
  }

  function renderTabelaGenerica(id, rows){
    const table = $(id);
    if(!table) return;
    if(!rows || !rows.length){
      table.querySelector("thead").innerHTML = "";
      table.querySelector("tbody").innerHTML = `<tr><td>Sem registros publicados.</td></tr>`;
      return;
    }

    const cols = Object.keys(rows[0]).filter(k => String(k).trim() !== "").slice(0, 8);
    table.querySelector("thead").innerHTML = `<tr>${cols.map(c => `<th>${esc(c)}</th>`).join("")}</tr>`;
    table.querySelector("tbody").innerHTML = rows.map(r => `
      <tr>${cols.map(c => `<td class="arWrapCell">${esc(r[c] || "—")}</td>`).join("")}</tr>
    `).join("");
  }

  function exportarCSV(){
    const rows = state.filtrados.map(i => ({
      Código: i.codigo,
      Grupo: i.grupo,
      Indicador: i.indicadorExecutivo,
      Diretoria: i.diretoria,
      Atual: fmtNumber(i.atual, i.unidade),
      Meta: fmtNumber(i.meta, i.unidade),
      Atingimento: fmtAting(i.atingimento),
      Status: i.status,
      Tendência: i.tendencia,
      Fonte: i.fonte,
      Pendência: i.pendencia
    }));

    const csv = Papa.unparse(rows, { delimiter: ";" });
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ar_comlurb_filtrado.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function renderAll(){
    aplicarFiltros();
    renderResumo();
    renderLeitura();
    renderGrupos();
    renderTopRiscos();
    renderDiretoria();
    renderTabelaAnalitica();
    renderGovernanca();

    const now = new Date();
  }

  async function init(){
    try{
      $("loading").style.display = "block";
      $("conteudo").style.display = "none";
      $("errorState").style.display = "none";

      await carregarDados();
      processarIndicadores();
      initFiltros();
      atualizarFiltrosDerivados();
      renderAll();

      $("loading").style.display = "none";
      $("conteudo").style.display = "block";
    }catch(err){
      console.error(err);
      $("loading").style.display = "none";
      $("errorState").style.display = "block";
      $("errorState").innerHTML = `
        <strong>Erro ao carregar o painel.</strong><br>
        ${esc(err.message || err)}<br><br>
        Verifique se os CSVs estão publicados como "Qualquer pessoa com o link pode visualizar" e se as abas continuam com o mesmo gid.
      `;
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
