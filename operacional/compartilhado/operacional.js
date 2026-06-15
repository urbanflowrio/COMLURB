
const CSV_URLS={
 'Coleta Domiciliar':'https://docs.google.com/spreadsheets/d/e/2PACX-1vQck5g3cWZN-in8I9ogYmytl8X_IbDd4ENxJvIhDv7va2viE2GCh9GA5sxzJC9fqeSk2jS7uBGP571u/pub?gid=1898137343&single=true&output=csv',
 'Coleta Seletiva':'https://docs.google.com/spreadsheets/d/e/2PACX-1vQck5g3cWZN-in8I9ogYmytl8X_IbDd4ENxJvIhDv7va2viE2GCh9GA5sxzJC9fqeSk2jS7uBGP571u/pub?gid=1599396593&single=true&output=csv',
 'Lixo Público':'https://docs.google.com/spreadsheets/d/e/2PACX-1vQck5g3cWZN-in8I9ogYmytl8X_IbDd4ENxJvIhDv7va2viE2GCh9GA5sxzJC9fqeSk2jS7uBGP571u/pub?gid=1210816191&single=true&output=csv'
};
const PAGE=window.OPERACIONAL_PAGE||'geral';
const SERVICE_BY_PAGE={'coleta-domiciliar':'Coleta Domiciliar','coleta-seletiva':'Coleta Seletiva','lixo-publico':'Lixo Público'};
let RAW=[];
function strip(s){return String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();}
function brNum(v){ if(v==null||v==='')return 0; if(typeof v==='number')return v; let s=String(v).trim().replace(/%/g,''); if(s.includes(',') && s.includes('.')) s=s.replace(/\./g,'').replace(',','.'); else s=s.replace(',','.'); let n=Number(s); return isFinite(n)?n:0;}
function parseCSV(text){
 const first=(text.split(/\r?\n/).find(l=>l.trim())||''); const sep=(first.match(/;/g)||[]).length>(first.match(/,/g)||[]).length?';':','; const rows=[]; let row=[],cur='',q=false;
 for(let i=0;i<text.length;i++){const c=text[i],n=text[i+1]; if(c==='"'){ if(q&&n==='"'){cur+='"';i++;} else q=!q;} else if(c===sep&&!q){row.push(cur);cur='';} else if((c==='\n'||c==='\r')&&!q){ if(c==='\r'&&n==='\n')i++; row.push(cur); if(row.some(x=>String(x).trim()!==''))rows.push(row); row=[]; cur='';} else cur+=c;}
 if(cur||row.length){row.push(cur); if(row.some(x=>String(x).trim()!==''))rows.push(row);} if(!rows.length)return [];
 const h=rows.shift().map(x=>String(x).trim()); return rows.map(r=>{let o={};h.forEach((k,i)=>o[k]=r[i]??'');return o;});
}
function getField(o,names){const keys=Object.keys(o); for(const name of names){let sn=strip(name); let k=keys.find(x=>strip(x)===sn); if(k) return o[k];} return '';}
function normPeriod(v){let s=String(v||'').trim(); if(!s)return ''; let m=s.match(/(20\d{2})[-\/](\d{1,2})/); if(m)return `${m[1]}-${m[2].padStart(2,'0')}`; m=s.match(/(\d{1,2})[-\/](\d{1,2})[-\/](20\d{2})/); if(m)return `${m[3]}-${m[2].padStart(2,'0')}`; const d=new Date(s); if(!isNaN(d))return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; return s;}
function normalizeRows(rows,servico){return rows.map(o=>({servico,periodo:normPeriod(getField(o,['Período','Periodo','Competência','Competencia','Mês','Mes'])),superintendencia:String(getField(o,['Superintendencia','Superintendência','Super','Diretoria'])||'').trim(),gerencia:String(getField(o,['Gerência','Gerencia','Referência','Referencia'])||'').trim(),veiculo:String(getField(o,['Tipo de Veiculo','Tipo de Veículo','Veiculo','Veículo'])||'').trim(),peso:brNum(getField(o,['Peso Total (ton)','Peso Total','Peso','Toneladas'])),capacidade:brNum(getField(o,['Capacidade Total (ton)','Capacidade Total','Capacidade']))})).filter(r=>r.periodo&&r.periodo.startsWith('2026')&&r.capacidade>0);}
async function loadData(){
 try{const all=[]; for(const [servico,url] of Object.entries(CSV_URLS)){const txt=await fetch(url,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(r.status); return r.text()}); all.push(...normalizeRows(parseCSV(txt),servico));} if(all.length){document.querySelector('#dataSource').textContent='Planilha publicada · atualização dinâmica'; return all;}}
 catch(e){console.warn('CSV indisponível, usando fallback embutido',e)}
 document.querySelector('#dataSource').textContent='Dados embutidos · fallback operacional'; return window.OPERACIONAL_FALLBACK||[];
}
function fmtPct(n){return (n||0).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+'%'} function fmtTon(n){return (n||0).toLocaleString('pt-BR',{maximumFractionDigits:0})+' t'}
function monthName(p){const [y,m]=p.split('-'); return ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][Number(m)-1]+'/'+y}
function agg(rows){let peso=rows.reduce((a,r)=>a+r.peso,0),cap=rows.reduce((a,r)=>a+r.capacidade,0); return {peso,cap,util:cap?peso/cap*100:0,count:rows.length};}
function group(rows,key){const m=new Map(); rows.forEach(r=>{let k=typeof key==='function'?key(r):r[key]; if(!k)k='—'; if(!m.has(k))m.set(k,[]); m.get(k).push(r)}); return [...m.entries()].map(([name,items])=>({name,items,...agg(items)}));}
function fillSelect(id,vals,all='Todos'){const el=document.getElementById(id); if(!el)return; const cur=el.value; el.innerHTML=`<option value="">${all}</option>`+vals.map(v=>`<option>${v}</option>`).join(''); if(vals.includes(cur))el.value=cur;}
function currentRows(){let rows=RAW.slice(); const fixed=SERVICE_BY_PAGE[PAGE]; const s=fixed||document.getElementById('fServico')?.value; const p=document.getElementById('fPeriodo')?.value; const g=document.getElementById('fGerencia')?.value; if(s)rows=rows.filter(r=>r.servico===s); if(p)rows=rows.filter(r=>r.periodo===p); if(g)rows=rows.filter(r=>r.gerencia===g); return rows;}
function renderBars(el,items,max=10){el.innerHTML=''; if(!items.length){el.innerHTML='<div class="empty">Sem registros para o filtro selecionado.</div>';return} items.slice(0,max).forEach((it,i)=>{let c=i<2?'green':(i>7?'orange':''); el.insertAdjacentHTML('beforeend',`<div class="barRow"><div class="barName">${it.name}</div><div class="track"><div class="fill ${c}" style="width:${Math.min(it.util,110)}%"></div></div><div class="num">${fmtTon(it.peso)}</div><div class="pct">${fmtPct(it.util)}</div></div>`)});}
function update(){
 const fixed=SERVICE_BY_PAGE[PAGE]; const months=[...new Set(RAW.map(r=>r.periodo))].sort(); fillSelect('fPeriodo',months.map(monthName),'Todas'); const fp=document.getElementById('fPeriodo'); if(fp){ const old=fp.valueRaw||''; [...fp.options].forEach((o,i)=>{if(i>0)o.value=months[i-1]}); if(!fp.value && months.length) fp.value=months[months.length-1];}
 if(!fixed){fillSelect('fServico',[...new Set(RAW.map(r=>r.servico))].sort(),'Todos os serviços')} else {const fs=document.getElementById('fServico'); if(fs){fs.innerHTML=`<option>${fixed}</option>`; fs.value=fixed;}}
 const service=fixed||document.getElementById('fServico')?.value; let forGer=RAW.filter(r=>(!service||r.servico===service)); fillSelect('fGerencia',[...new Set(forGer.map(r=>r.gerencia).filter(Boolean))].sort(),'Todas as gerências'); render();
}
function render(){
 const rows=currentRows(), a=agg(rows), months=[...new Set(RAW.map(r=>r.periodo))].sort(), last=months[months.length-1]||'';
 document.getElementById('lastCompetencia').textContent=last?monthName(last):'—'; document.getElementById('kUtil').textContent=fmtPct(a.util); document.getElementById('kPeso').textContent=fmtTon(a.peso);
 const byGer=group(rows,'gerencia').filter(x=>x.name!=='—').sort((a,b)=>b.util-a.util); const top=byGer[0], bottom=byGer[byGer.length-1]; document.getElementById('kTop').textContent=top?`${top.name} · ${fmtPct(top.util)}`:'—'; document.getElementById('kAmp').textContent=(top&&bottom)?(top.util-bottom.util).toLocaleString('pt-BR',{maximumFractionDigits:1})+' p.p.':'—';
 document.getElementById('nTop').textContent=top?'Maior utilização observada':'—'; document.getElementById('nAmp').textContent=bottom?`${bottom.name} · ${fmtPct(bottom.util)}`:'Diferença entre extremos observados';
 const chartTitle=document.getElementById('chartTitle'); if(chartTitle) chartTitle.textContent=PAGE==='geral'?'Utilização por serviço':'Utilização por gerência';
 const items=PAGE==='geral'?group(rows,'servico').sort((a,b)=>b.util-a.util):byGer; renderBars(document.getElementById('bars'),items, PAGE==='geral'?5:14);
 const tbody=document.getElementById('tbody'); if(tbody){tbody.innerHTML=''; byGer.slice(0,12).forEach(x=>tbody.insertAdjacentHTML('beforeend',`<tr><td>${x.name}</td><td>${fmtTon(x.peso)}</td><td>${fmtTon(x.cap)}</td><td>${fmtPct(x.util)}</td></tr>`));}
 document.getElementById('insight1').textContent=`A utilização da capacidade apresentou leitura consolidada de ${fmtPct(a.util)} em ${document.getElementById('lastCompetencia').textContent}, considerando os filtros aplicados.`;
 document.getElementById('insight2').textContent=top&&bottom?`${top.name} registrou a maior utilização observada, enquanto ${bottom.name} marcou o menor valor do recorte. A amplitude foi de ${(top.util-bottom.util).toLocaleString('pt-BR',{maximumFractionDigits:1})} pontos percentuais.`:'Os dados do período estão disponíveis para acompanhamento executivo.';
}
document.addEventListener('DOMContentLoaded',async()=>{RAW=await loadData(); update(); ['fPeriodo','fServico','fGerencia'].forEach(id=>document.getElementById(id)?.addEventListener('change',()=>{ if(id==='fServico') update(); else render(); }));});
