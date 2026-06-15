
(function(){
const MESES = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
const fmtPct = v => Number.isFinite(v) ? (v*100).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+'%' : '—';
const fmtNum = v => Number.isFinite(v) ? v.toLocaleString('pt-BR',{maximumFractionDigits:0}) : '—';
const fmtPP = v => Number.isFinite(v) ? (v*100).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+' p.p.' : '—';
const norm = s => String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
function pick(row, tests){ const keys=Object.keys(row); for(const t of tests){ const k=keys.find(k=>norm(k).includes(t)); if(k) return row[k]; } return ''; }
function parseNumber(x){ if(x==null) return NaN; let s=String(x).trim(); if(!s) return NaN; const pct=s.includes('%'); s=s.replace(/%/g,'').replace(/\s/g,''); if(s.includes(',') && s.includes('.')) s=s.replace(/\./g,'').replace(',','.'); else if(s.includes(',')) s=s.replace(',','.'); s=s.replace(/[^0-9.\-]/g,''); const n=parseFloat(s); if(!Number.isFinite(n)) return NaN; return pct ? n/100 : (n>1.5 && n<=100 ? n/100 : n); }
function parseAbs(x){ if(x==null) return NaN; let s=String(x).trim(); if(!s) return NaN; s=s.replace(/\s/g,''); if(s.includes(',') && s.includes('.')) s=s.replace(/\./g,'').replace(',','.'); else if(s.includes(',')) s=s.replace(',','.'); s=s.replace(/[^0-9.\-]/g,''); const n=parseFloat(s); return Number.isFinite(n)?n:NaN; }
function monthKey(v){ const s=String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase(); const m=s.match(/(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)/); if(m) return MESES.indexOf(m[1])+1; const n=s.match(/(?:^|\D)(1[0-2]|0?[1-9])(?:\D|$)/); return n?parseInt(n[1],10):0; }
function monthLabel(v){ const idx=monthKey(v); return idx?MESES[idx-1]:(String(v||'').trim()||'—'); }
function normalizeRows(rows, serviceKey){
  return rows.map((r, i)=>{
    const ger = pick(r,['gerencia','gerencia_operacional','unidade','sigla','codigo']);
    const mes = pick(r,['mes_realizado','competencia','referencia','mes']);
    const utilRaw = pick(r,['utilizacao','utilizacao_da_capacidade','capacidade_utilizada','percentual','indice']);
    const tonRaw = pick(r,['tonelada','peso','quantidade','volume']);
    const viagensRaw = pick(r,['viagem','qtd_viagem']);
    const capacidadeRaw = pick(r,['capacidade']);
    return {serviceKey, gerencia:String(ger||'Não informado').trim(), mesOriginal:mes, mes:monthLabel(mes), mesNum:monthKey(mes), utilizacao:parseNumber(utilRaw), toneladas:parseAbs(tonRaw), viagens:parseAbs(viagensRaw), capacidade:parseAbs(capacidadeRaw), raw:r, _row:i};
  }).filter(d=>d.gerencia && d.gerencia !== 'Não informado' && Number.isFinite(d.utilizacao));
}
async function fetchDataset(key){
  const cfg=window.OP_DATASETS[key];
  const res=await fetch(cfg.url, {cache:'no-store'});
  if(!res.ok) throw new Error('Falha ao carregar '+cfg.label);
  const text=await res.text();
  const parsed=Papa.parse(text,{header:true,skipEmptyLines:true,dynamicTyping:false});
  return normalizeRows(parsed.data, key);
}
function latestMonth(data){ return Math.max(...data.map(d=>d.mesNum).filter(Boolean)); }
function avg(arr){ const xs=arr.filter(Number.isFinite); return xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:NaN; }
function groupBy(arr, fn){ return arr.reduce((m,x)=>{const k=fn(x);(m[k]=m[k]||[]).push(x);return m;},{}); }
function byServiceSummary(key, data){
  const lm=latestMonth(data); const latest=data.filter(d=>d.mesNum===lm); const all=data;
  const ger=Object.entries(groupBy(latest,d=>d.gerencia)).map(([g,rows])=>({gerencia:g, util:avg(rows.map(r=>r.utilizacao)), rows})).sort((a,b)=>b.util-a.util);
  const months=Object.entries(groupBy(all,d=>d.mesNum)).map(([m,rows])=>({mesNum:+m, mes:MESES[+m-1]||m, util:avg(rows.map(r=>r.utilizacao))})).sort((a,b)=>a.mesNum-b.mesNum);
  return {key, cfg:window.OP_DATASETS[key], latestMonth:lm, latestLabel:MESES[lm-1]||'—', latestAvg:avg(latest.map(d=>d.utilizacao)), yearAvg:avg(all.map(d=>d.utilizacao)), top:ger[0], bottom:ger[ger.length-1], amplitude:ger.length>1?ger[0].util-ger[ger.length-1].util:NaN, gerencias:ger, months, count:latest.length};
}
function setText(id, val){ const el=document.getElementById(id); if(el) el.textContent=val; }
function status(msg){ const el=document.getElementById('opStatus'); if(el) el.innerHTML=msg; }
function niceInsightService(s){
  const top=s.top?.gerencia||'—', bot=s.bottom?.gerencia||'—';
  return `A utilização da capacidade apresentou variação entre as gerências monitoradas, com ${top} registrando o maior índice observado no período e ${bot} compondo a menor referência do indicador em ${s.latestLabel}/2026.`;
}
function chartLine(id, labels, values, label){ const ctx=document.getElementById(id); if(!ctx) return; new Chart(ctx,{type:'line',data:{labels,datasets:[{label,data:values,tension:.35,pointRadius:3,borderWidth:2,fill:true}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>fmtPct(c.raw)}}},scales:{y:{ticks:{callback:v=>(v*100).toFixed(0)+'%',color:'#8ca3b8'},grid:{color:'rgba(255,255,255,.08)'}},x:{ticks:{color:'#8ca3b8'},grid:{display:false}}}}); }
function chartBar(id, labels, values){ const ctx=document.getElementById(id); if(!ctx) return; new Chart(ctx,{type:'bar',data:{labels,datasets:[{data:values,borderWidth:1}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>fmtPct(c.raw)}}},scales:{y:{ticks:{callback:v=>(v*100).toFixed(0)+'%',color:'#8ca3b8'},grid:{color:'rgba(255,255,255,.08)'}},x:{ticks:{color:'#8ca3b8'},grid:{display:false}}}}); }
function renderTable(rows){ const tbody=document.getElementById('rankingBody'); if(!tbody) return; tbody.innerHTML=rows.map((r,i)=>`<tr><td>${i+1}</td><td><strong>${r.gerencia}</strong></td><td class="opValue">${fmtPct(r.util)}</td><td><span class="opStatus">${i===0?'Maior utilização observada':i===rows.length-1?'Menor utilização observada':'Indicador monitorado'}</span></td></tr>`).join(''); }
async function renderServicePage(key){
  try{ status('<div class="opLoading">Carregando dados publicados da planilha única...</div>'); const data=await fetchDataset(key); const s=byServiceSummary(key,data); status('');
    setText('pageService',s.cfg.label); setText('kpiLatest',fmtPct(s.latestAvg)); setText('kpiYear',fmtPct(s.yearAvg)); setText('kpiTop',s.top?`${s.top.gerencia} · ${fmtPct(s.top.util)}`:'—'); setText('kpiBottom',s.bottom?`${s.bottom.gerencia} · ${fmtPct(s.bottom.util)}`:'—'); setText('kpiAmp',fmtPP(s.amplitude)); setText('lastMonth',s.latestLabel+'/2026'); setText('insightMain',niceInsightService(s)); setText('insightTop',`${s.top?.gerencia||'—'} registrou o maior índice de utilização da capacidade operacional em ${s.latestLabel}/2026.`); setText('insightBottom',`${s.bottom?.gerencia||'—'} apresentou o menor valor observado do indicador no período.`); setText('insightAmp',`A diferença entre os extremos observados foi de ${fmtPP(s.amplitude)}, demonstrando a amplitude do indicador entre os territórios acompanhados.`);
    chartLine('chartTrend',s.months.map(m=>m.mes),s.months.map(m=>m.util),'Utilização'); chartBar('chartRanking',s.gerencias.slice(0,12).map(g=>g.gerencia),s.gerencias.slice(0,12).map(g=>g.util)); renderTable(s.gerencias);
  }catch(e){ status(`<div class="opError">Não foi possível carregar os dados agora. Verifique se a planilha está publicada na web e se os cabeçalhos mantêm a coluna de utilização da capacidade.</div>`); console.error(e); }
}
async function renderOverview(){
  try{ status('<div class="opLoading">Carregando as 3 abas publicadas da planilha única...</div>'); const keys=Object.keys(window.OP_DATASETS); const datasets=await Promise.all(keys.map(fetchDataset)); const sums=keys.map((k,i)=>byServiceSummary(k,datasets[i])); status('');
    const avgAll=avg(sums.map(s=>s.latestAvg)); setText('kpiGlobal',fmtPct(avgAll)); setText('kpiServices',String(sums.length)); const allGer=sums.flatMap(s=>s.gerencias.map(g=>({...g, service:s.cfg.short, key:s.key}))).sort((a,b)=>b.util-a.util); setText('kpiTop',allGer[0]?`${allGer[0].gerencia} · ${allGer[0].service}`:'—'); setText('kpiBottom',allGer.at(-1)?`${allGer.at(-1).gerencia} · ${allGer.at(-1).service}`:'—'); setText('kpiAmp',fmtPP(allGer[0]?.util-allGer.at(-1)?.util)); setText('lastMonth',sums[0]?.latestLabel+'/2026');
    const cards=document.getElementById('serviceCards'); if(cards) cards.innerHTML=sums.map(s=>`<a class="opLink" href="${s.key}/"><div class="opLabel">${s.cfg.label}</div><div class="opNumber small">${fmtPct(s.latestAvg)}</div><div class="opText">Utilização média em ${s.latestLabel}/2026</div><span class="opLinkBadge">Abrir painel</span></a>`).join('')+`<a class="opLink" href="frota/"><div class="opLabel">Visão transversal</div><div class="opNumber small">${fmtPct(avgAll)}</div><div class="opText">Consolidado comparativo entre os serviços</div><span class="opLinkBadge">Abrir frota</span></a>`;
    chartBar('chartServices',sums.map(s=>s.cfg.short),sums.map(s=>s.latestAvg)); const months=[...new Set(sums.flatMap(s=>s.months.map(m=>m.mesNum)))].sort((a,b)=>a-b); chartLine('chartTrend',months.map(m=>MESES[m-1]),months.map(m=>avg(sums.map(s=>s.months.find(x=>x.mesNum===m)?.util))),'Média geral');
    setText('insightMain',`A camada operacional consolida a utilização da capacidade da frota nos três serviços monitorados, permitindo leitura integrada por serviço, mês e gerência.`); setText('insightTop',`${allGer[0]?.gerencia||'—'} apresentou a maior utilização observada entre os registros da competência mais recente.`); setText('insightBottom',`${allGer.at(-1)?.gerencia||'—'} compôs a menor referência observada do indicador na competência mais recente.`); setText('insightAmp',`A amplitude entre os extremos observados foi de ${fmtPP(allGer[0]?.util-allGer.at(-1)?.util)}.`);
  }catch(e){ status(`<div class="opError">Não foi possível carregar a planilha publicada agora. A estrutura da pasta está pronta; confirme a publicação das três abas em CSV.</div>`); console.error(e); }
}
window.addEventListener('DOMContentLoaded',()=>{ if(window.OP_PAGE && window.OP_PAGE!=='overview' && window.OP_PAGE!=='frota') renderServicePage(window.OP_PAGE); else renderOverview(); });
})();
