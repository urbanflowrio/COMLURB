/* Movimentação observada nas fontes. Independente dos filtros da fotografia atual. */
(() => {
  'use strict';
  const data = window.PESSOAS_MOVIMENTACAO;
  if (!data) return;
  const root = document.getElementById('bloco-movimentacao');
  if (!root) return;
  const fmt = n => n == null ? '—' : n.toLocaleString('pt-BR');
  const dateLabel = s => s.split('-').reverse().join('/');
  const el = (tag, text, cls) => { const x = document.createElement(tag); if (text != null) x.textContent = text; if (cls) x.className = cls; return x; };
  const year = root.querySelector('#movAno');
  Object.keys(data.anos).reverse().forEach(y => { const opt = el('option', y); opt.value = y; year.append(opt); });
  let parent = '';
  const diff = (a,b) => a == null || b == null ? null : a-b;
  function table(target, headers, rows) {
    target.replaceChildren();
    const head = el('thead'), tr = el('tr'); headers.forEach(h => tr.append(el('th',h))); head.append(tr); target.append(head);
    const body=el('tbody');
    rows.forEach(row => { const tr=el('tr'); row.forEach((v,i) => {const td=el('td'); if (v instanceof Node) td.append(v); else td.textContent=i ? fmt(v) : v; tr.append(td);}); body.append(tr); });
    target.append(body);
  }
  function units() {
    const d=data.anos[year.value];
    const path=root.querySelector('#movCaminho'); path.replaceChildren();
    const back=el('button',parent ? 'Voltar um nível' : 'COMLURB','pe-btn'); back.type='button'; back.disabled=!parent;
    back.onclick=()=>{parent=d.unidades.find(n=>n.id===parent)?.pai || '';units();};
    path.append(back,el('span',parent || 'COMLURB'));
    const rows=d.unidades.filter(n=>n.pai===parent).sort((a,b)=>(b.v[1]??-1)-(a.v[1]??-1)).map(n=>{
      const name=el('span',n.nome);
      if(d.unidades.some(c=>c.pai===n.id)) {const b=el('button',n.nome,'pe-btn'); b.type='button';b.onclick=()=>{parent=n.id;units();};return[b,...n.v,diff(...n.v)];}
      return[name,...n.v,diff(...n.v)];
    });
    table(root.querySelector('#movUnidades'),['Unidade','Entradas','Saídas','Saldo observado'],rows);
  }
  function render() {
    parent='';const d=data.anos[year.value], k=root.querySelector('#movKpis');k.replaceChildren();
    [['Entradas identificadas',d.entradas],['Desligamentos registrados',d.saidas],['Saldo observado',d.entradas-d.saidas]].forEach(([title,value])=>{
      const box=el('div',null,'pe-card');box.append(el('h3',title),el('strong',fmt(value),'mov-number'));k.append(box);
    });
    table(root.querySelector('#movAnual'),['Ano','Entradas','Saídas','Saldo observado'],Object.entries(data.anos).reverse().map(([y,a])=>{
      const button=el('button',y+(Number(y)===Number(data.meta.referencia_sipe.slice(0,4))?' · parcial':''),'pe-btn');button.type='button';button.setAttribute('aria-pressed',String(y===year.value));button.onclick=()=>{year.value=y;render();};
      return[button,a.entradas,a.saidas,a.entradas-a.saidas];
    }));
    root.querySelector('#movMotivosTitulo').textContent='Motivos dos desligamentos · '+year.value;
    table(root.querySelector('#movMotivos'),['Forma de desligamento','Quantidade'],d.motivos.map(m=>[m.nome,m.n]));
    const partial=Number(year.value)===Number(data.meta.referencia_sipe.slice(0,4));
    root.querySelector('#movPeriodo').textContent=partial ? `${year.value} parcial. SIPE de ${dateLabel(data.meta.referencia_sipe)}; último desligamento registrado em ${dateLabel(data.meta.ultimo_desligamento)}.` : `${year.value}: movimentações identificadas nas fontes disponíveis. Série histórica sujeita à cobertura do cadastro.`;
    const pdv=d.motivos.find(m=>m.nome==='PDV');
    root.querySelector('#movLeitura').textContent=pdv?.n != null && d.saidas ? `PDV: ${fmt(pdv.n)} saídas, equivalentes a ${(pdv.n/d.saidas*100).toLocaleString('pt-BR',{maximumFractionDigits:1})}% dos desligamentos registrados no ano. Considere essa concentração ao comparar períodos e planejar reposições.` : 'Compare entradas e saídas do mesmo período. Os totais incluem diferentes vínculos; o saldo geral não informa a reposição por cargo.';
    units();
  }
  year.addEventListener('change',render);render();
  const subtabs=[...root.querySelectorAll('.pe-subabas [role="tab"]')];
  function selectSubtab(chosen) {
    subtabs.forEach(t=>{const active=t===chosen;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;document.getElementById(t.getAttribute('aria-controls')).hidden=!active;});
  }
  subtabs.forEach((t,i)=>{
    t.addEventListener('click',()=>selectSubtab(t));
    t.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=subtabs[e.key==='Home'?0:e.key==='End'?subtabs.length-1:(i+1)%subtabs.length];selectSubtab(next);next.focus();}});
  });
})();
