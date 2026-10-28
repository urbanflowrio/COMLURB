/* Gestão Estratégica de Pessoas — HUB COMLURB (v10)
   Lê window.PESSOAS_DADOS (agregados protegidos). null = valor suprimido por proteção estatística. */
(() => {
  "use strict";
  const D = window.PESSOAS_DADOS;
  if (!D) return;
  const A = D.arvore, R = D.meta.rotulos, ROOT = A.COMLURB;
  const $ = (id) => document.getElementById(id);
  const dataRef = D.meta.referencia.split('-').reverse().join('/');
  $('dataReferencia').textContent = dataRef;
  if (D.meta.status !== "conferido") {
    const av = document.createElement("div");
    av.className = "pe-aviso"; av.style.margin = "0 0 18px"; av.setAttribute("role", "status");
    av.innerHTML = "<b>Dados em conferência.</b> Os totais desta competência ainda não foram conferidos de forma independente. Não divulgar.";
    $("pe").prepend(av);
  }
  if (!D.meta.origem_publicada) {
    const card = $("origTable").closest(".pe-card");
    if (card) card.innerHTML = '<h3>Lotação oficial e visão por origem</h3><p class="pe-nota">A visão por origem não foi publicada nesta competência porque exporia grupos pequenos da GGQ02.</p>';
  }
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const nf = (v) => (v === null || v === undefined ? "—" : Number(v).toLocaleString("pt-BR"));
  const pct = (a, b, d = 1) => (a === null || b === null || a === undefined || b === undefined || !b ? null : (100 * a) / b);
  const pf = (p, d = 1) => (p === null ? "—" : p.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d }) + "%");
  const SUPR = '<span class="supr" title="Suprimido para proteção estatística">—</span>';
  const garisDe = (u) => (u.fam[0] === null || u.fam[1] === null ? null : u.fam[0] + u.fam[1]);
  const cellN = (v) => (v === null ? SUPR : nf(v));
  const COR_SIT = ["var(--st-ativo)", "var(--st-ferias)", "var(--st-restricao)", "var(--st-afastado)"];
  const SEQ = ["var(--seq-1)", "var(--seq-2)", "var(--seq-3)", "var(--seq-4)", "var(--seq-5)", "var(--seq-6)", "#cfe2f5"];

  /* Tooltip compartilhado */
  const tip = $("peTip");
  function showTip(ev, html) {
    tip.innerHTML = html; tip.hidden = false;
    const r = tip.getBoundingClientRect();
    let x = ev.clientX + 14, y = ev.clientY + 14;
    if (x + r.width > innerWidth - 8) x = ev.clientX - r.width - 14;
    if (y + r.height > innerHeight - 8) y = ev.clientY - r.height - 14;
    tip.style.left = Math.max(8, x) + "px"; tip.style.top = Math.max(8, y) + "px";
  }
  const hideTip = () => { tip.hidden = true; };
  function bindTips(root) {
    root.querySelectorAll("[data-tip]").forEach((el) => {
      el.addEventListener("mousemove", (e) => showTip(e, el.dataset.tip));
      el.addEventListener("mouseleave", hideTip);
      el.addEventListener("focus", (e) => { const r = el.getBoundingClientRect(); showTip({ clientX: r.right, clientY: r.top }, el.dataset.tip); });
      el.addEventListener("blur", hideTip);
    });
  }

  /* Cabeçalho e rodapé institucionais */
  if (window.HUB && HUB.header) {
    HUB.header.render("hubHeader", { systemLabel: "HUB COMLURB · PESSOAS E CAPACIDADE ORGANIZACIONAL", title: "Gestão Estratégica de Pessoas", subtitle: `Fotografia cadastral de ${dataRef} · agregados protegidos` });
    HUB.footer.render("hubFooter");
  }

  /* ---------------- Recorte ---------------- */
  let sel = "COMLURB";
  const filhos = (id) => (A[id] ? A[id].filhos.map((k) => A[k]) : []);
  const caminho = (id) => { const p = []; let x = A[id]; while (x) { p.unshift(x); x = x.pai ? A[x.pai] : null; } return p; };
  function preencher(select, itens, valor, vazio) {
    select.innerHTML = `<option value="">${esc(vazio)}</option>` + itens.map((n) => `<option value="${esc(n.id)}"${n.id === valor ? " selected" : ""}>${esc(n.label)}${n.n !== null ? " · " + nf(n.n) : ""}</option>`).join("");
    select.disabled = itens.length === 0;
    const texto = select.selectedOptions[0]?.textContent || "";
    select.title = texto;
    let detalhe = document.getElementById(select.id + "Texto");
    if (!detalhe) {
      detalhe = document.createElement("span");
      detalhe.id = select.id + "Texto";
      detalhe.className = "pe-filtro-texto";
      select.insertAdjacentElement("afterend", detalhe);
      select.setAttribute("aria-describedby", detalhe.id);
    }
    detalhe.textContent = valor ? texto : "";
    detalhe.hidden = !valor;
  }
  function syncSelects() {
    const p = caminho(sel);
    const d = p[1]?.id || "", n1 = p[2]?.id || "", n2 = p[3]?.id || "";
    preencher($("selDir"), filhos("COMLURB"), d, "Todas as diretorias");
    preencher($("selN1"), d ? filhos(d) : [], n1, d ? "Todas da diretoria" : "Escolha a diretoria");
    preencher($("selN2"), n1 ? filhos(n1) : [], n2, n1 ? "Todas" : "—");
    const node = A[sel];
    const chips = [];
    if (node.especial) chips.push(`<span class="pe-chip esp">Lotação especial: ${esc(node.especial)}</span>`);
    (node.contem || []).forEach((c) => chips.push(`<span class="pe-chip esp">Contém lotação especial · ${esc(c)}</span>`));
    $("pePath").innerHTML = `<span>Recorte: <b style="color:var(--texto)">${p.map((x) => esc(x.label)).join(" › ")}</b>${node.tipo && node.nivel >= 2 ? ` <span class="muted">(${esc(node.tipo)})</span>` : ""}</span>` + chips.join("");
  }
  function escolher(id) { if (!A[id]) return; sel = id; syncSelects(); renderRecorte(); }
  $("selDir").addEventListener("change", (e) => escolher(e.target.value || "COMLURB"));
  $("selN1").addEventListener("change", (e) => escolher(e.target.value || caminho(sel)[1].id));
  $("selN2").addEventListener("change", (e) => escolher(e.target.value || caminho(sel)[2].id));
  $("btnLimpar").addEventListener("click", () => escolher("COMLURB"));

  /* ---------------- Componentes ---------------- */
  function hbars(el, linhas, opts = {}) {
    const max = opts.max ?? Math.max(1, ...linhas.map((l) => l.pct ?? 0));
    el.innerHTML = linhas.map((l) => {
      const w = l.pct === null || l.pct === undefined ? 0 : Math.max(0.6, (100 * l.pct) / max);
      const ref = opts.ref != null ? `<span class="ref" style="left:${(100 * opts.ref) / max}%" title="Referência"></span>` : "";
      const attrs = l.id ? ` role="button" tabindex="0" data-id="${esc(l.id)}" style="cursor:pointer"` : "";
      return `<div class="pe-hbar"${attrs}${l.tip ? ` data-tip="${esc(l.tip)}"` : ""}><span class="lab">${l.label}</span><span class="trk">${ref}<i style="width:${w}%;background:${l.cor || "var(--st-ativo)"}"></i></span><span class="val">${l.val}${l.sub ? `<small>${l.sub}</small>` : ""}</span></div>`;
    }).join("") || '<p class="pe-nota">Sem dados publicáveis neste recorte.</p>';
    el.querySelectorAll("[data-id]").forEach((b) => {
      b.addEventListener("click", () => escolher(b.dataset.id));
      b.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); escolher(b.dataset.id); } });
    });
    bindTips(el);
  }

  /* Unidades comparáveis de nível 3 sob o recorte */
  function unidadesComparaveis(id, prop) {
    const node = A[id];
    let base;
    if (node.nivel === 0) base = ["D:DLU", "D:DSU"].flatMap((d) => filhos(d).flatMap((n1) => (n1.filhos.length ? filhos(n1.id) : [n1])));
    else if (node.nivel === 1) base = filhos(id).flatMap((n1) => (n1.filhos.length ? filhos(n1.id) : [n1]));
    else if (node.nivel === 2) base = node.filhos.length ? filhos(id) : [node];
    else base = filhos(node.pai);
    return base.filter((u) => !u.agrupado && !u.especial && u.n !== null && u.n >= 30 && (!prop || prop(u)));
  }

  /* ---------------- KPIs ---------------- */
  function renderKpis(n) {
    const af = n.sit[3], rs = n.sit[2];
    const k = [
      ["Quadro", nf(n.n), "Empregados distintos no recorte", ""],
      ["Afastados", nf(af), af !== null ? `${pf(pct(af, n.n))} do quadro${n.nat ? ` · doença/acidente ${nf(n.nat[0])} · suspensos ${nf(n.nat[1])}` : ""}` : "Suprimido neste recorte", "var(--st-afastado)"],
      ["Com restrição", nf(rs), rs !== null ? `${pf(pct(rs, n.n))} do quadro · não equivale a indisponibilidade` : "Suprimido neste recorte", "var(--st-restricao)"],
      ["Garis temporários", nf(n.vinc[3]), n.vinc[3] !== null && garisDe(n) ? `${pf(pct(n.vinc[3], garisDe(n)))} dos garis do recorte` : "Regime por tempo determinado", "var(--ent-temporario)"],
    ];
    $("peKpis").innerHTML = k.map(([t, v, d, c]) => `<article class="pe-kpi"><div class="k">${c ? `<i style="background:${c}"></i>` : ""}${t}</div><div class="v">${v}</div><div class="d">${d}</div></article>`).join("");
  }

  /* ---------------- Bloco 1 ---------------- */
  function renderQuadro(n) {
    $("sitSub").textContent = `${nf(n.n)} empregados. O traço (—) indica um valor ocultado para proteger informações pessoais, inclusive quando necessário para impedir seu cálculo por diferença.`;
    const tot = n.n || 1;
    $("sitStack").innerHTML = n.sit.map((v, i) => (v ? `<span style="width:${(100 * v) / tot}%;background:${COR_SIT[i]}" data-tip="<b>${esc(R.sit[i])}</b>: ${nf(v)} (${pf(pct(v, n.n))})"></span>` : "")).join("");
    $("sitStack").setAttribute("aria-label", R.sit.map((s, i) => `${s}: ${nf(n.sit[i])}`).join("; "));
    const soma = n.sit.reduce((a, v) => a + (v || 0), 0);
    if (soma < n.n) $("sitStack").insertAdjacentHTML("beforeend", `<span style="width:${(100 * (n.n - soma)) / tot}%;background:var(--grade)" data-tip="Suprimido para proteção estatística"></span>`);
    $("sitLegend").innerHTML = R.sit.map((s, i) => `<div><i style="background:${COR_SIT[i]}"></i>${s} <b>${nf(n.sit[i])}</b><small>${pf(pct(n.sit[i], n.n))}</small></div>`).join("");
    bindTips($("sitStack"));

    const linhas = n.famsit ? R.fam.map((f, i) => ({ f, n: n.fam[i], s: n.famsit[i] })).filter((x) => x.n !== 0) : [];
    if (!n.famsit) {
      $("famTable").innerHTML = `<tbody><tr><td class="muted">A situação por grupo funcional está indisponível neste recorte para proteger grupos pequenos. O quadro por grupo deste recorte: ${R.fam.map((f, i) => `${esc(f)} ${n.fam[i] === null ? "—" : nf(n.fam[i])}`).join(" · ")}.</td></tr></tbody>`;
    }
    if (n.famsit) $("famTable").innerHTML = `<thead><tr><th>Grupo</th><th class="n">Pessoas</th><th>Situação</th>${R.sit.map((s) => `<th class="n">${s}</th>`).join("")}</tr></thead><tbody>` +
      linhas.map((x) => `<tr><td>${esc(x.f)}</td><td class="n">${cellN(x.n)}</td><td><div class="mini">${x.n ? x.s.map((v, j) => (v ? `<span style="width:${(100 * v) / x.n}%;background:${COR_SIT[j]}"></span>` : "")).join("") : ""}</div></td>${x.s.map((v) => `<td class="n">${v === null ? SUPR : nf(v)}</td>`).join("")}</tr>`).join("") + "</tbody>";

    hbars($("vincBars"), R.vinc.map((v, i) => ({ label: esc(v), pct: pct(n.vinc[i], n.n), val: nf(n.vinc[i]), sub: pf(pct(n.vinc[i], n.n)), cor: i === 3 ? "var(--ent-temporario)" : "var(--ent-base)" })), { max: 100 });

    let lista = filhos(sel), titulo = "";
    if (!lista.length && A[sel].pai) { lista = filhos(A[sel].pai); titulo = "irmãs"; }
    $("unitsChip").textContent = "Cadastro consolidado de setores";
    $("unitTable").innerHTML = `<thead><tr><th>Unidade</th><th>Tipo</th><th class="n">Quadro</th><th class="n">Afastados</th><th class="n">% afast.</th><th class="n">Com restrição</th><th class="n">% restr.</th><th class="n">Temporários</th></tr></thead><tbody>` +
      (lista.length ? lista.map((u) => {
        const pa = pct(u.sit[3], u.n), pr = pct(u.sit[2], u.n);
        const tag = u.especial ? ' <span class="pe-chip esp">lotação especial</span>' : (u.contem && u.contem.length ? ' <span class="pe-chip esp">contém lotação especial</span>' : "");
        const clic = u.filhos.length || u.id !== sel;
        return `<tr class="${clic && !u.agrupado ? "clic" : ""}${u.id === sel ? " sel" : ""}" ${clic && !u.agrupado ? `tabindex="0" data-id="${esc(u.id)}"` : ""}><td>${esc(u.agrupado ? u.label.replace("Demais unidades (agrupadas,", "Unidades reunidas para apresentação (") : u.label)}${tag}</td><td><span class="muted">${esc(u.tipo || "")}</span></td><td class="n">${cellN(u.n)}</td><td class="n">${cellN(u.sit[3])}</td><td class="n">${pf(pa)}</td><td class="n">${cellN(u.sit[2])}</td><td class="n">${pf(pr)}</td><td class="n">${cellN(u.vinc[3])}</td></tr>`;
      }).join("") : `<tr><td colspan="8" class="muted">Sem subdivisões publicáveis.</td></tr>`) + "</tbody>";
    $("unitTable").querySelectorAll("tr[data-id]").forEach((tr) => {
      tr.addEventListener("click", () => escolher(tr.dataset.id));
      tr.addEventListener("keydown", (e) => { if (e.key === "Enter") escolher(tr.dataset.id); });
    });
  }

  /* ---------------- Bloco 2 ---------------- */
  function renderAfast(n) {
    const af = n.sit[3];
    $("natSub").textContent = af !== null ? `${nf(af)} afastados no recorte (${pf(pct(af, n.n))} do quadro).` : "Total de afastados suprimido neste recorte.";
    if (!n.nat) {
      const msg = '<p class="pe-nota">Natureza e duração são publicadas até o nível de superintendência ou coordenadoria, para proteger grupos pequenos. Volte um nível no recorte.</p>';
      $("natBars").innerHTML = msg; $("durBars").innerHTML = msg;
      renderFunil(); renderOrigem(); return;
    }
    const maxN = Math.max(1, ...n.nat.map((v) => v || 0), ...n.dur.map((v) => v || 0));
    hbars($("natBars"), R.nat.map((s, i) => ({ label: esc(s), pct: n.nat[i], val: nf(n.nat[i]), sub: af && n.nat[i] !== null ? pf(pct(n.nat[i], af)) + " dos afast." : "", cor: i === 0 ? "var(--st-afastado)" : "var(--ent-base)" })), { max: maxN });
    hbars($("durBars"), R.dur.map((s, i) => ({ label: esc(s), pct: n.dur[i], val: nf(n.dur[i]), sub: af && n.dur[i] !== null ? pf(pct(n.dur[i], af)) + " dos afast." : "", cor: "var(--ent-base)" })), { max: maxN });
    renderFunil(); renderOrigem();
  }

  function renderOrigem() {
    if (!$("origTable")) return;
    const O = D.origem;
    const linhaO = (k) => [O.find((o) => o.visao === "oficial" && o.chave === k), O.find((o) => o.visao === "origem" && o.chave === k)];
    $("origTable").innerHTML = `<thead><tr><th>Diretoria</th><th class="n">Taxa oficial</th><th class="n">Taxa por origem</th><th class="n">Afastados (of. → orig.)</th></tr></thead><tbody>` +
      ["DLU", "DSU", "_DEM"].map((k) => {
        const [a, b] = linhaO(k);
        return `<tr><td>${esc((b || a).label)}</td><td class="n">${a ? pf(pct(a.af, a.n)) : "—"}</td><td class="n">${b ? pf(pct(b.af, b.n)) : "—"}</td><td class="n">${a ? nf(a.af) : "—"} → ${b ? nf(b.af) : "—"}</td></tr>`;
      }).join("") + "</tbody>";
  }

  function renderFunil() {
    const box = $("funil");
    const p0 = ROOT.sit[3] / ROOT.n;
    const todas = unidadesComparaveis(sel);
    const pts = todas.filter((u) => u.sit[3] !== null);
    const supr = todas.length - pts.length;
    $("funilSub").textContent = pts.length ? `${pts.length} unidades com 30+ pessoas; referência COMLURB ${pf(100 * p0)}. ${supr ? `${supr} com contagem suprimida ficam fora do gráfico.` : ""}` : "";
    if (pts.length < 2) { box.innerHTML = '<p class="pe-nota">Este recorte não tem unidades comparáveis suficientes. Escolha uma diretoria ou superintendência.</p>'; return; }
    const W = 640, H = 300, m = { l: 46, r: 16, t: 12, b: 38 };
    const xmax = Math.max(...pts.map((u) => u.n)) * 1.06, xmin = 0;
    const ymax = Math.max(0.2, ...pts.map((u) => (u.sit[3] / u.n) * 1.12));
    const X = (v) => m.l + ((v - xmin) / (xmax - xmin)) * (W - m.l - m.r);
    const Y = (v) => H - m.b - (v / ymax) * (H - m.t - m.b);
    const lim = (nn, s) => Math.max(0, Math.min(ymax, p0 + s * 1.96 * Math.sqrt((p0 * (1 - p0)) / nn)));
    const xs = []; for (let v = 30; v <= xmax; v += (xmax - 30) / 60) xs.push(v);
    const sup = xs.map((v) => `${X(v).toFixed(1)},${Y(lim(v, 1)).toFixed(1)}`), inf = xs.map((v) => `${X(v).toFixed(1)},${Y(lim(v, -1)).toFixed(1)}`);
    const passo = ymax > 0.25 ? 0.1 : 0.05;
    let g = "";
    for (let v = 0; v <= ymax + 1e-9; v += passo) g += `<line class="grade" x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${m.l - 8}" y="${Y(v) + 4}" text-anchor="end">${Math.round(v * 100)}%</text>`;
    const xstep = xmax > 1500 ? 500 : xmax > 600 ? 200 : 100;
    for (let v = 0; v <= xmax; v += xstep) g += `<text x="${X(v)}" y="${H - m.b + 16}" text-anchor="middle">${nf(v)}</text>`;
    g += `<text x="${(W + m.l) / 2}" y="${H - 4}" text-anchor="middle">Pessoas na unidade</text>`;
    const band = `<polygon class="lim" points="${sup.join(" ")} ${inf.reverse().join(" ")}"/><polyline class="limline" points="${sup.join(" ")}"/>`;
    const ref = `<line class="refline" x1="${X(30)}" x2="${W - m.r}" y1="${Y(p0)}" y2="${Y(p0)}"/>`;
    const fora = (u) => u.sit[3] / u.n > lim(u.n, 1) + 1e-12;
    const dots = pts.map((u) => {
      const t = u.sit[3] / u.n, cx = X(u.n), cy = Y(t);
      const tipo = fora(u) ? "Acima da faixa esperada" : t / 1 < lim(u.n, -1) ? "Abaixo da faixa esperada" : "Dentro da faixa esperada";
      const html = `<b>${esc(u.label)}</b><br>${nf(u.sit[3])} afastados em ${nf(u.n)} (${pf(100 * t)})${u.nat ? `<br>Benefício: ${nf(u.nat[0])} · Suspensos: ${nf(u.nat[1])}` : ""}<br>${tipo}`;
      return `<g><circle class="pt${fora(u) ? " fora" : ""}${u.id === sel ? " sel" : ""}" cx="${cx}" cy="${cy}" r="5"/><circle class="hit" cx="${cx}" cy="${cy}" r="11" data-id="${esc(u.id)}" data-tip="${esc(html)}" tabindex="0"/></g>`;
    }).join("");
    const lbl = pts.filter(fora).map((u) => {
      const cx = X(u.n), cy = Y(u.sit[3] / u.n), right = cx < W * 0.7;
      return `<text class="rotulo" x="${cx + (right ? 9 : -9)}" y="${cy + 4}" text-anchor="${right ? "start" : "end"}">${esc(u.label.replace(/^Gerência /, ""))}</text>`;
    }).join("");
    box.innerHTML = `<svg class="pe-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Taxa de afastados por tamanho de unidade">${g}<line class="eixo" x1="${m.l}" x2="${W - m.r}" y1="${H - m.b}" y2="${H - m.b}"/>${band}${ref}${dots}${lbl}</svg>`;
    box.querySelectorAll(".hit").forEach((c) => {
      c.addEventListener("click", () => escolher(c.dataset.id));
      c.addEventListener("keydown", (e) => { if (e.key === "Enter") escolher(c.dataset.id); });
    });
    bindTips(box);
  }

  /* ---------------- Bloco 3 ---------------- */
  function renderRestr(n) {
    const refP = pct(ROOT.resGarisEf, ROOT.garisEf);
    const us = unidadesComparaveis(sel, (u) => u.garisEf !== null && u.garisEf >= 30 && u.resGarisEf !== null)
      .map((u) => ({ u, p: pct(u.resGarisEf, u.garisEf) })).sort((a, b) => b.p - a.p);
    const local = pct(n.resGarisEf, n.garisEf);
    $("resSub").textContent = `${local !== null ? `Recorte: ${pf(local)} (${nf(n.resGarisEf)} com restrição entre ${nf(n.garisEf)} garis efetivos). ` : ""}Referência COMLURB ${pf(refP)} (linha). Unidades com 30+ garis efetivos.`;
    hbars($("resBars"), us.map(({ u, p }) => ({ id: u.id, label: esc(u.label), pct: p, val: pf(p), sub: `${nf(u.resGarisEf)} com restrição / ${nf(u.garisEf)} garis efetivos`, cor: "var(--st-restricao)", tip: `<b>${esc(u.label)}</b><br>${nf(u.resGarisEf)} de ${nf(u.garisEf)} garis efetivos com restrição` })), { max: 60, ref: refP });
    const rows = (arr) => arr.map((x) => ({ label: esc(x.label), pct: pct(x.r, x.n), val: pf(pct(x.r, x.n)), sub: x.r === null ? "suprimido" : `${nf(x.r)} de ${nf(x.n)}`, cor: "var(--st-restricao)" }));
    hbars($("resFaixa"), rows(D.restricao.faixa.filter((x) => x.n)), { max: 60, ref: refP });
    hbars($("resJornada"), rows(D.restricao.jornada.filter((x) => x.n)), { max: 60, ref: refP });
  }

  /* ---------------- Bloco 4 ---------------- */
  function renderSucessao() {
    const adm = D.admissoes;
    const W = 1240, H = 300, m = { l: 52, r: 10, t: 10, b: 40 };
    const max = Math.max(...adm.map((a) => (a.efetivos || 0) + (a.temporarios || 0) + (a.confianca || 0)));
    const bw = (W - m.l - m.r) / adm.length;
    const Y = (v) => H - m.b - (v / max) * (H - m.t - m.b);
    let g = "";
    const passo = max > 2000 ? 500 : 200;
    for (let v = 0; v <= max; v += passo) g += `<line class="grade" x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${m.l - 8}" y="${Y(v) + 4}" text-anchor="end">${nf(v)}</text>`;
    const series = [["efetivos", "var(--ent-base)", "Efetivos"], ["confianca", "var(--st-restricao)", "Confiança extraquadro"], ["temporarios", "var(--ent-temporario)", "Temporários"]];
    adm.forEach((a, i) => {
      const x = m.l + i * bw;
      let acc = 0;
      series.forEach(([k, c]) => {
        const v = a[k];
        if (!v) return;
        const y0 = Y(acc), y1 = Y(acc + v);
        g += `<rect x="${x + 1}" y="${y1}" width="${Math.max(1, bw - 2)}" height="${Math.max(0, y0 - y1 - (acc ? 1 : 0))}" rx="1.5" fill="${c}"/>`;
        acc += v;
      });
      const tipTxt = `<b>${esc(a.ano)}</b><br>Efetivos: ${a.efetivos === null ? "menos de 10" : nf(a.efetivos)}<br>Confiança extraquadro: ${a.confianca === null ? "menos de 10" : nf(a.confianca)}<br>Temporários: ${a.temporarios === null ? "menos de 10" : nf(a.temporarios)}`;
      g += `<rect class="hit" x="${x}" y="${m.t}" width="${bw}" height="${H - m.t - m.b}" data-tip="${esc(tipTxt)}"/>`;
      if (a.ano === "até 1979" || (+a.ano % 5 === 0 && +a.ano > 1980)) g += `<text x="${x + bw / 2}" y="${H - m.b + 15}" text-anchor="middle">${a.ano === "até 1979" ? "≤79" : a.ano}</text>`;
    });
    g += `<line class="eixo" x1="${m.l}" x2="${W - m.r}" y1="${H - m.b}" y2="${H - m.b}"/>`;
    $("admChart").innerHTML = `<div class="pe-tabela-wrap"><svg class="pe-svg" style="min-width:520px" viewBox="0 0 ${W} ${H}" role="img" aria-label="Admissões do quadro atual por ano">${g}</svg></div>`;
    bindTips($("admChart"));
    $("admLegend").innerHTML = series.map(([, c, l]) => `<div><i style="background:${c}"></i>${l}</div>`).join("");

    const S = D.sucessao;
    const fxBar = (it) => `<div class="mini" style="min-width:120px">${it.fx.map((v, j) => (v ? `<span style="width:${(100 * v) / it.n}%;background:${SEQ[j]}" title="${esc(R.faixas[j])}: ${nf(v)}"></span>` : "")).join("")}</div>`;
    const linha = (it, fam, filho) => {
      const p60 = pct(it.fx[6], it.n), pa = pct(it.apo, it.n);
      return `<tr class="${fam ? "clic" : ""}" ${fam ? `tabindex="0" data-fam="${esc(it.label)}"` : ""}><td>${filho ? '<span class="muted">↳ </span>' : ""}${esc(it.label)}${fam && it.funcoes.length ? ' <span class="muted">▸</span>' : ""}</td><td class="n">${cellN(it.n)}</td><td>${fxBar(it)}</td><td class="n"><div class="barcell">${pf(p60)}<span class="t"><i style="width:${p60 ?? 0}%;background:var(--seq-6)"></i></span></div></td><td class="n">${pf(pa)}</td><td class="n">${it.desde2015 === null ? SUPR : nf(it.desde2015)}</td></tr>`;
    };
    const ordem = [...S].sort((a, b) => (pct(b.fx[6], b.n) ?? 0) - (pct(a.fx[6], a.n) ?? 0));
    let aberta = null;
    const draw = () => {
      $("sucTable").innerHTML = `<thead><tr><th>Família</th><th class="n">Quadro</th><th>Faixa etária</th><th class="n">Acima de 60</th><th class="n">Aposentado INSS</th><th class="n">Admitidos desde 2015</th></tr></thead><tbody>` +
        ordem.map((it) => linha(it, true, false) + (aberta === it.label ? it.funcoes.map((f) => linha(f, false, true)).join("") : "")).join("") + "</tbody>";
      $("sucTable").querySelectorAll("tr[data-fam]").forEach((tr) => {
        const f = () => { aberta = aberta === tr.dataset.fam ? null : tr.dataset.fam; draw(); };
        tr.addEventListener("click", f); tr.addEventListener("keydown", (e) => { if (e.key === "Enter") f(); });
      });
    };
    draw();
    $("fxLegend").innerHTML = R.faixas.map((f, j) => `<div><i style="background:${SEQ[j]}"></i>${esc(f)}</div>`).join("");

    const grupos = Object.keys(D.mapa.grupos);
    let gsel = grupos[0];
    const drawMapa = () => {
      $("mapaSeg").innerHTML = grupos.map((g2) => `<button type="button" aria-pressed="${g2 === gsel}" data-g="${esc(g2)}">${esc(g2.replace(/ \(.*\)/, ""))}</button>`).join("");
      $("mapaSeg").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { gsel = b.dataset.g; drawMapa(); }));
      const M = D.mapa.grupos[gsel], mx = Math.max(1, ...M.flat().map((v) => v || 0));
      const cols = D.mapa.colunas.length;
      let h = `<div class="h"></div>` + D.mapa.colunas.map((c) => `<div class="h hc">${esc(c.replace("Entre ", "").replace("De ", "").replace("Acima de", "+"))}</div>`).join("");
      M.forEach((linhaM, i) => {
        h += `<div class="h">${esc(D.mapa.linhas[i])}</div>` + linhaM.map((v, j) => {
          const t = v ? Math.min(5, Math.floor((v / mx) * 6)) : -1;
          const bg = v === null ? "transparent" : v === 0 ? "rgba(132,165,198,.05)" : SEQ[t + 1 > 6 ? 6 : t + 1];
          return `<div class="c" style="background:${bg};${t >= 4 ? "color:#06111f;font-weight:600" : ""}" data-tip="${esc(`${D.mapa.linhas[i]} · ${D.mapa.colunas[j]} de casa: ${v === null ? "Valor protegido" : nf(v)}`)}">${v === null ? "·" : v === 0 ? "" : nf(v)}</div>`;
        }).join("");
      });
      $("mapa").style.gridTemplateColumns = `minmax(92px,1.1fr) repeat(${cols}, minmax(44px,1fr))`;
      $("mapa").innerHTML = h;
      bindTips($("mapa"));
    };
    drawMapa();
    $("liderTable").innerHTML = `<thead><tr><th>Função</th><th class="n">Pessoas</th><th class="n">Acima de 60</th></tr></thead><tbody>` +
      D.liderancas.map((l) => `<tr><td>${esc(l.label)}</td><td class="n">${cellN(l.n)}</td><td class="n">${pf(pct(l.fx60, l.n))}</td></tr>`).join("") + "</tbody>";
  }

  /* ---------------- Bloco 5 ---------------- */
  function renderTmp(n) {
    const temTemporarios = Number.isFinite(n.vinc[3]) && n.vinc[3] > 0;
    $("bloco-tmp").hidden = !temTemporarios;
    if (!temTemporarios) return;
    // As séries de admissões e perfil são agregados da empresa.
    $("ondaChart").closest(".pe-card").hidden = sel !== "COMLURB";
    const us = unidadesComparaveis(sel, (u) => garisDe(u) !== null && garisDe(u) >= 30 && u.vinc[3] !== null && u.vinc[3] > 0)
      .map((u) => ({ u, p: pct(u.vinc[3], garisDe(u)) })).sort((a, b) => b.p - a.p);
    const ref = pct(ROOT.vinc[3], garisDe(ROOT));
    $("tmpSub").textContent = `${n.vinc[3] !== null ? `Recorte: ${nf(n.vinc[3])} temporários. ` : ""}Referência COMLURB ${pf(ref)} dos garis (linha). Unidades com 30 ou mais garis e contagem de temporários disponível.`;
    hbars($("tmpBars"), us.map(({ u, p }) => ({ id: u.id, label: esc(u.label), pct: p, val: pf(p), sub: `${nf(u.vinc[3])} de ${nf(garisDe(u))} garis`, cor: "var(--ent-temporario)", tip: `<b>${esc(u.label)}</b><br>${nf(u.vinc[3])} temporários entre ${nf(garisDe(u))} garis` })), { max: Math.max(30, ...us.map((x) => x.p)), ref });

    const O = D.ondas, W = 360, H = 150, m = { l: 34, r: 6, t: 8, b: 34 };
    const mx = Math.max(...O.map((o) => o.n || 0)), bw = (W - m.l - m.r) / O.length;
    const Y = (v) => H - m.b - (v / mx) * (H - m.t - m.b);
    let g = `<line class="grade" x1="${m.l}" x2="${W - m.r}" y1="${Y(mx / 2)}" y2="${Y(mx / 2)}"/><text x="${m.l - 6}" y="${Y(mx / 2) + 4}" text-anchor="end">${nf(Math.round(mx / 2))}</text><text x="${m.l - 6}" y="${Y(mx) + 4}" text-anchor="end">${nf(mx)}</text>`;
    O.forEach((o, i) => {
      const x = m.l + i * bw;
      if (o.n) g += `<rect x="${x + 2}" y="${Y(o.n)}" width="${bw - 4}" height="${H - m.b - Y(o.n)}" rx="2" fill="var(--ent-temporario)"/>`;
      g += `<rect class="hit" x="${x}" y="${m.t}" width="${bw}" height="${H - m.t - m.b}" data-tip="${esc(`<b>${o.mes}</b><br>${o.n === null ? "Valor protegido" : nf(o.n) + " admitidos"}`)}"/>`;
      if (i % 2 === 0) g += `<text x="${x + bw / 2}" y="${H - m.b + 14}" text-anchor="middle">${o.mes.replace("/20", "/")}</text>`;
    });
    g += `<line class="eixo" x1="${m.l}" x2="${W - m.r}" y1="${H - m.b}" y2="${H - m.b}"/>`;
    $("ondaChart").innerHTML = `<svg class="pe-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Temporários admitidos por mês">${g}</svg>`;
    bindTips($("ondaChart"));

    const P = D.perfilTemporarios, tt = P.temporarios.reduce((a, v) => a + (v || 0), 0), tg = P.garisEfetivos.reduce((a, v) => a + (v || 0), 0);
    $("perfilTmp").innerHTML = `<div class="pe-hbars">${P.faixas.map((f, i) => {
      const a = pct(P.temporarios[i], tt), b = pct(P.garisEfetivos[i], tg);
      return `<div class="pe-hbar" data-tip="${esc(`<b>${f}</b><br>Temporários: ${pf(a)}<br>Garis efetivos: ${pf(b)}`)}"><span class="lab">${esc(f)}</span><span style="display:grid;gap:3px"><span class="trk"><i style="width:${(a ?? 0) * 2.2}%;background:var(--ent-temporario)"></i></span><span class="trk"><i style="width:${(b ?? 0) * 2.2}%;background:var(--ent-base)"></i></span></span><span class="val">${pf(a, 0)}<small>${pf(b, 0)}</small></span></div>`;
    }).join("")}</div>`;
    bindTips($("perfilTmp"));
    $("perfilLegend").innerHTML = `<div><i style="background:var(--ent-temporario)"></i>Garis temporários</div><div><i style="background:var(--ent-base)"></i>Garis efetivos</div>`;
  }

  /* ---------------- Bloco 6 ---------------- */
  function renderAlertas() {
    const NOMES = { AGENDADAS: "Agendadas", DE_FERIAS: "Em férias", NORMAL: "Normal", SEM_PERIODO: "Sem período aquisitivo", ALERTA_BAIXO: "Alerta baixo", ALERTA_MEDIO: "Alerta médio", ALERTA_ALTO: "Alerta alto", CRITICO: "Crítico", VENCIDO: "Vencidas" };
    const tot = D.ferias.reduce((a, f) => a + (f.n || 0), 0);
    hbars($("feriasBars"), D.ferias.map((f) => ({ label: NOMES[f.label] || f.label, pct: f.n, val: f.n === null ? "—" : nf(f.n), sub: f.n ? pf(pct(f.n, tot)) : "", cor: ["VENCIDO", "CRITICO", "ALERTA_ALTO"].includes(f.label) ? "var(--st-afastado)" : "var(--ent-base)" })), { max: Math.max(...D.ferias.map((f) => f.n || 0)) });
    $("feriasDir").innerHTML = `<thead><tr><th>Diretoria</th><th class="n">Empregados em alerta</th></tr></thead><tbody>` +
      D.feriasDiretoria.map((f) => `<tr><td>${esc(f.label)}</td><td class="n">${f.alerta === null ? SUPR : nf(f.alerta)}</td></tr>`).join("") + "</tbody>";
    $("qualTable").innerHTML = `<thead><tr><th>Ponto</th><th class="n">Registros</th></tr></thead><tbody>` +
      D.qualidade.map((q) => `<tr><td>${esc(q.label)}</td><td class="n">${q.n === null ? SUPR : nf(q.n)}</td></tr>`).join("") + "</tbody>";
  }

  /* ---------------- Rodapé ---------------- */
  $("peRodape").innerHTML = `<div><b style="color:var(--texto)">Fonte:</b> ${esc(D.meta.fonte)}, deduplicada por registro.</div>
    <div><b style="color:var(--texto)">Proteção:</b> ${esc(D.meta.regras.texto)} O traço (—) indica valor suprimido. Não há nomes, matrículas, CPF, datas individuais, endereço, documentos, raça/cor, deficiência, sexo ou nível salarial no pacote.</div>
    <div><b style="color:var(--texto)">Estrutura:</b> Cadastro consolidado de setores, conforme as definições confirmadas para o HUB. Os agrupamentos são apenas de apresentação e não alteram a estrutura cadastrada. Lotações especiais (GGQ02, Cargos Indisponíveis) aparecem destacadas e ficam fora dos comparativos.</div>
    <div><b style="color:var(--texto)">Leitura:</b> afastado e restrição são situações cadastrais. Não medem absenteísmo, produtividade, capacidade operacional nem necessidade de contratação.</div>`;

  function renderRecorte() {
    const n = A[sel];
    renderKpis(n); renderQuadro(n); renderAfast(n); renderRestr(n); renderTmp(n);
  }
  syncSelects(); renderRecorte(); renderSucessao(); renderAlertas();
})();
