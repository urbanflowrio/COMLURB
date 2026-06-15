
(function(){
const SERVICE_META={domiciliar:{nome:'Coleta Domiciliar',curto:'Domiciliar'},seletiva:{nome:'Coleta Seletiva',curto:'Seletiva'},lixo:{nome:'Lixo Público',curto:'Lixo Público'}};
const monthNames=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const fmtPct=v=>(isFinite(v)?v:0).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+'%';
const fmtTon=v=>(isFinite(v)?v:0).toLocaleString('pt-BR',{maximumFractionDigits:0});
const fmtPP=v=>(isFinite(v)?v:0).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+' p.p.';
const byId=id=>document.getElementById(id);
function parseCSV(text){
  const rows=[]; let row=[], cell='', q=false;
  for(let i=0;i<text.length;i++){const c=text[i], n=text[i+1]; if(c==='"'){ if(q&&n==='"'){cell+='"';i++;} else q=!q; } else if(c===','&&!q){row.push(cell); cell='';} else if((c==='\n'||c==='\r')&&!q){ if(c==='\r'&&n==='\n') i++; row.push(cell); if(row.some(x=>String(x).trim()!=='')) rows.push(row); row=[]; cell=''; } else cell+=c;}
  row.push(cell); if(row.some(x=>String(x).trim()!=='')) rows.push(row); return rows;
}
function normalizeKey(k){return String(k||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');}
function num(x){ if(x==null) return 0; let s=String(x).trim().replace(/\s/g,''); if(!s) return 0; if(s.includes(',') && s.includes('.')) s=s.replace(/\./g,'').replace(',','.'); else if(s.includes(',')) s=s.replace(',','.'); s=s.replace('%',''); const v=parseFloat(s); return isFinite(v)?v:0; }
function periodToMonth(v){
  if(!v) return ''; const s=String(v).trim();
  let m=s.match(/(20\d{2})[-\/](\d{1,2})/); if(m) return `${m[1]}-${String(m[2]).padStart(2,'0')}`;
  m=s.match(/(\d{1,2})[-\/](\d{1,2})[-\/](20\d{2})/); if(m) return `${m[3]}-${String(m[2]).padStart(2,'0')}`;
  const d=new Date(s); if(!isNaN(d)) return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  return s;
}
function tableRowsToObjects(matrix, forcedService){
  if(!matrix||matrix.length<2) return [];
  let headerIdx=-1;
  for(let i=0;i<Math.min(8,matrix.length);i++){const keys=matrix[i].map(normalizeKey); if(keys.some(k=>k.includes('periodo')) && keys.some(k=>k.includes('peso')) && keys.some(k=>k.includes('capacidade'))){headerIdx=i;break;}}
  if(headerIdx<0) return [];
  const headers=matrix[headerIdx].map(normalizeKey);
  return matrix.slice(headerIdx+1).map(r=>{const o={}; headers.forEach((h,i)=>o[h]=r[i]); return o;}).filter(o=>Object.values(o).some(v=>String(v||'').trim()!==''))
  .map(o=>{
    const mes=periodToMonth(o.periodo||o.data||o.mes);
    const peso=num(o.peso_total_ton||o.peso_total||o.peso||o.toneladas);
    const cap=num(o.capacidade_total_ton||o.capacidade_total||o.capacidade);
    const ger=String(o.gerencia||o.gerencia_||o.referencia||o.unidade||'').trim();
    return {servico:forcedService,servico_nome:SERVICE_META[forcedService]?.nome||forcedService,periodo:mes+'-01',mes,superintendencia:String(o.superintendencia||'').trim(),gerencia:ger,tipo_veiculo:String(o.tipo_de_veiculo||o.tipo_veiculo||'').trim(),peso,capacidade:cap,utilizacao:cap?peso/cap*100:num(o.capacidade_total_2_viagens||o.utilizacao||o.utilizacao_)};
  }).filter(r=>r.mes&&r.gerencia&&r.capacidade>=0);
}
function classifyCSV(text, fallbackKey){const t=text.toLowerCase(); if(t.includes('coleta seletiva')) return 'seletiva'; if(t.includes('lixo público')||t.includes('lixo publico')) return 'lixo'; if(t.includes('coleta domiciliar')) return 'domiciliar'; return fallbackKey;}
async function loadRows(){
  const fallback=(window.OP_FALLBACK_ROWS||[]).map(r=>({...r, peso:+r.peso, capacidade:+r.capacidade, utilizacao:+r.utilizacao}));
  const urls=window.OP_CSV_URLS||{}; let live=[];
  await Promise.all(Object.entries(urls).map(async([key,url])=>{try{const res=await fetch(url,{cache:'no-store'}); if(!res.ok) throw new Error('HTTP '+res.status); const text=await res.text(); const svc=classifyCSV(text,key); const parsed=tableRowsToObjects(parseCSV(text),svc); if(parsed.length) live=live.concat(parsed);}catch(e){console.warn('Falha no CSV',key,e);}}));
  if(live.length){window.OP_DATA_SOURCE='Planilha publicada'; return live.filter(r=>String(r.mes||'').startsWith('2026-'));}
  window.OP_DATA_SOURCE='Base local de segurança'; return fallback;
}
function aggregate(rows, dims=[]){
  const map=new Map(); rows.forEach(r=>{const key=dims.map(d=>r[d]||'').join('|'); if(!map.has(key)){const o={peso:0,capacidade:0}; dims.forEach(d=>o[d]=r[d]||''); map.set(key,o);} const o=map.get(key); o.peso+=+r.peso||0; o.capacidade+=+r.capacidade||0;});
  return Array.from(map.values()).map(o=>({...o,utilizacao:o.capacidade?o.peso/o.capacidade*100:0}));
}
function latestMonth(rows){return rows.map(r=>r.mes).sort().pop()||''}
function monthLabel(m){ if(!m) return '—'; const [y,mo]=m.split('-').map(Number); return `${monthNames[mo-1]}/${String(y).slice(-2)}`; }
function option(sel, val, label){const o=document.createElement('option'); o.value=val; o.textContent=label; sel.appendChild(o)}
function fillFilters(rows){
 const fMes=byId('fMes'), fServico=byId('fServico'), fGer=byId('fGerencia'); if(!fMes) return;
 const months=[...new Set(rows.map(r=>r.mes))].sort(); fMes.innerHTML=''; months.forEach(m=>option(fMes,m,monthLabel(m))); fMes.value=latestMonth(rows);
 if(fServico){fServico.innerHTML=''; option(fServico,'todos','Todos os serviços'); Object.entries(SERVICE_META).forEach(([k,v])=>option(fServico,k,v.nome)); if(window.OP_PAGE&&SERVICE_META[window.OP_PAGE]) fServico.value=window.OP_PAGE;}
 function updGer(){ if(!fGer) return; const svc=fServico?fServico.value:'todos'; const mes=fMes.value; const subset=rows.filter(r=>(svc==='todos'||r.servico===svc)&&(!mes||r.mes===mes)); const gs=[...new Set(subset.map(r=>r.gerencia).filter(Boolean))].sort(); fGer.innerHTML=''; option(fGer,'todas','Todas as gerências'); gs.forEach(g=>option(fGer,g,g)); }
 updGer(); fMes.onchange=()=>{updGer(); render(rows)}; if(fServico) fServico.onchange=()=>{updGer(); render(rows)}; if(fGer) fGer.onchange=()=>render(rows);
}
function getFiltered(rows){ const mes=byId('fMes')?.value||latestMonth(rows); const serv=byId('fServico')?.value||window.OP_PAGE||'todos'; const ger=byId('fGerencia')?.value||'todas'; return rows.filter(r=>(!mes||r.mes===mes)&&(serv==='todos'||r.servico===serv)&&(ger==='todas'||r.gerencia===ger)); }
function kpi(label,value,note,feature=false){return `<div class="op-kpi ${feature?'feature':''}"><div class="label">${label}</div><div class="value">${value}</div><div class="note">${note||''}</div></div>`}
function bars(items,max=100){return `<div class="bars">${items.map(x=>`<div class="bar-row"><div class="bar-name" title="${x.name}">${x.name}</div><div class="bar-track"><div class="bar-fill" style="width:${Math.min(100,Math.max(0,x.value/max*100))}%"></div></div><div class="bar-value">${fmtPct(x.value)}</div></div>`).join('')}</div>`}
function table(items){return `<table class="op-table"><thead><tr><th>Gerência</th><th class="num">Peso</th><th class="num">Capacidade</th><th class="num">Utilização</th></tr></thead><tbody>${items.map(x=>`<tr><td>${x.gerencia}</td><td class="num">${fmtTon(x.peso)}</td><td class="num">${fmtTon(x.capacidade)}</td><td class="num">${fmtPct(x.utilizacao)}</td></tr>`).join('')}</tbody></table>`}
function render(rows){
 const page=window.OP_PAGE||'overview'; const filtered=getFiltered(rows); const mes=byId('fMes')?.value||latestMonth(rows); const serv=byId('fServico')?.value||'todos'; const baseMonth=rows.filter(r=>r.mes===mes && (serv==='todos'||r.servico===serv)); const allMonth=rows.filter(r=>r.mes===mes);
 const agg=aggregate(filtered,[])[0]||{peso:0,capacidade:0,utilizacao:0}; const byGer=aggregate(baseMonth,['gerencia']).filter(x=>x.gerencia).sort((a,b)=>b.utilizacao-a.utilizacao); const high=byGer[0], low=byGer[byGer.length-1];
 const bySvc=aggregate(allMonth,['servico']).map(x=>({...x,nome:SERVICE_META[x.servico]?.nome||x.servico})).sort((a,b)=>b.utilizacao-a.utilizacao);
 const kpisEl=byId('kpis'); if(kpisEl){
   if(page==='overview'||page==='frota') kpisEl.innerHTML = kpi('Utilização consolidada',fmtPct(aggregate(allMonth,[])[0]?.utilizacao||0),`Competência ${monthLabel(mes)}`,true)+kpi('Peso coletado',fmtTon(aggregate(allMonth,[])[0]?.peso||0)+' t','Soma dos serviços monitorados')+kpi('Maior utilização observada',high?high.gerencia:'—',high?fmtPct(high.utilizacao):'—')+kpi('Amplitude do indicador',high&&low?fmtPP(high.utilizacao-low.utilizacao):'—','Diferença entre extremos observados');
   else kpisEl.innerHTML = kpi('Utilização da capacidade',fmtPct(agg.utilizacao),`Competência ${monthLabel(mes)}`,true)+kpi('Peso coletado',fmtTon(agg.peso)+' t','Volume total lançado')+kpi('Capacidade disponível',fmtTon(agg.capacidade)+' t','Capacidade operacional registrada')+kpi('Gerências monitoradas',String(byGer.length),'Com lançamento no período');
 }
 const source=byId('dataSource'); if(source){source.textContent=window.OP_DATA_SOURCE; source.className='data-badge '+(window.OP_DATA_SOURCE==='Planilha publicada'?'ok':'fallback');}
 const insights=byId('insights'); if(insights){insights.innerHTML = `<div class="insight"><strong>Panorama operacional</strong><p>A utilização da capacidade apresentou comportamentos distintos entre os serviços monitorados em ${monthLabel(mes)}, mantendo uma leitura integrada da operação.</p></div><div class="insight"><strong>Destaques do período</strong><p>${high&&low?`${high.gerencia} registrou a maior utilização observada, enquanto ${low.gerencia} apresentou o menor valor do período, com amplitude de ${fmtPP(high.utilizacao-low.utilizacao)}.`:'Os dados do período estão disponíveis para acompanhamento executivo.'}</p></div><div class="insight"><strong>Cobertura do indicador</strong><p>A camada consolida coleta domiciliar, coleta seletiva e lixo público a partir da planilha única publicada no Google Drive.</p></div>`;}
 const ranking=byId('ranking'); if(ranking) ranking.innerHTML=bars(byGer.slice(0,12).map(x=>({name:x.gerencia,value:x.utilizacao})), Math.max(100, byGer[0]?.utilizacao||100));
 const extremos=byId('extremos'); if(extremos) extremos.innerHTML= high&&low ? `<div class="insight"><strong>Maior utilização observada</strong><p>${high.gerencia} • ${fmtPct(high.utilizacao)}</p></div><div class="insight"><strong>Menor utilização observada</strong><p>${low.gerencia} • ${fmtPct(low.utilizacao)}</p></div><div class="insight"><strong>Amplitude</strong><p>${fmtPP(high.utilizacao-low.utilizacao)} entre os extremos do período.</p></div>` : '<div class="empty">Sem dados para o filtro selecionado.</div>';
 const mensal=byId('mensal'); if(mensal){ const monthAgg=aggregate(rows.filter(r=> serv==='todos'||r.servico===serv),['mes']).sort((a,b)=>a.mes.localeCompare(b.mes)); mensal.innerHTML=`<div class="timeline">${monthAgg.map(x=>`<div class="month-card"><div class="m">${monthLabel(x.mes)}</div><div class="v">${fmtPct(x.utilizacao)}</div></div>`).join('')}</div>`; }
 const servicos=byId('servicos'); if(servicos) servicos.innerHTML=bars(bySvc.map(x=>({name:x.nome,value:x.utilizacao})),Math.max(100,bySvc[0]?.utilizacao||100));
 const tabela=byId('tabela'); if(tabela) tabela.innerHTML=table(byGer);
}
function boot(){loadRows().then(rows=>{window.OP_ROWS=rows; fillFilters(rows); render(rows);}).catch(e=>{console.error(e); byId('kpis')&&(byId('kpis').innerHTML='<div class="empty">Não foi possível carregar os dados.</div>')})}
document.addEventListener('DOMContentLoaded',boot);
})();
