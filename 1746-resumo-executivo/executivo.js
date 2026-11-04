'use strict';
(() => {
const D=window.TIMELINE1746_DATA, $=id=>document.getElementById(id);
if(!D || !D.periods?.october || !D.accumulated){$('error').textContent='Não foi possível carregar os cubos auditados. Confira a origem da página e o arquivo 1746-timeline/data.js.';return;}
const num=n=>Number.isFinite(n)?Math.round(n).toLocaleString('pt-BR'):'—';
const pct=n=>Number.isFinite(n)?(n>0?'+':'')+(n*100).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+'%':'—';
const diff=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)?a-b:null;
const rel=(a,b)=>b>0?(a-b)/b:null;
const esc=t=>String(t??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const field=()=> $('metric').value, period=()=>D[$('scope').value==='accumulated'?'accumulated':'periods']?.[$('scope').value==='accumulated'?'tipos':'october']||null;
const getScope=()=> $('scope').value==='accumulated'?D.accumulated:D.periods.october;
const metric=()=>field(); const rows=(key)=>getScope()[key]||[];
const v=(r,m,y)=>r?.[m+y]??null;
const d=(r,m)=>diff(v(r,m,2026),v(r,m,2025));
const sorted=(a,m,mode='delta')=>[...a].filter(r=>Number.isFinite(v(r,m,2026))).sort((x,y)=> mode==='volume'?v(y,m,2026)-v(x,m,2026):d(y,m)-d(x,m));
const table=(headers,arr)=>'<div class="tablebox"><table><thead><tr>'+headers.map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+arr.map(r=>'<tr>'+r.map((c,i)=>'<td>'+c+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
function renderKpis(){
const oct=D.periods.october.meta,acc=D.accumulated.meta;
const items=[['Chamados · Outubro',oct.c2026,oct.c2025],['Ouvidorias operacionais · Outubro',oct.o2026,oct.o2025]];
$('kpis').innerHTML=items.map(([label,a,b])=>'<div class="card kpi"><div class="label">'+esc(label)+'</div><div class="value">'+num(a)+'</div><div class="delta '+(a<b?'down':'')+'">'+pct(rel(a,b))+' · '+(a>=b?'+':'')+num(a-b)+'</div><div class="note">Comparável em 2025: '+num(b)+'</div></div>').join('');
$('accumulated').innerHTML='<div class="kpi"><div class="label">Chamados</div><div class="value">'+num(acc.c2026)+'</div><div class="delta">'+pct(rel(acc.c2026,acc.c2025))+' frente a '+num(acc.c2025)+'</div></div><div class="statline kpi"><div class="label">Ouvidorias operacionais</div><div class="value">'+num(acc.o2026)+'</div><div class="delta">'+pct(rel(acc.o2026,acc.o2025))+' frente a '+num(acc.o2025)+'</div></div>';
$('executiveSummary').innerHTML='<b>Leitura de outubro.</b> Os chamados cresceram '+pct(rel(oct.c2026,oct.c2025))+' ('+num(oct.c2026-oct.c2025)+' registros), enquanto as ouvidorias operacionais variaram '+pct(rel(oct.o2026,oct.o2025))+' ('+num(oct.o2026-oct.o2025)+'). A divergência de movimentos exige investigar serviços e territórios; não permite concluir melhora ou piora da qualidade dos serviços.';
}
function renderHighlights(){
 const tipos=D.periods.october.tipos||[];
 const r=tipos.filter(x=>Number.isFinite(x.c2025)&&Number.isFinite(x.c2026)&&Number.isFinite(x.o2025)&&Number.isFinite(x.o2026));
 const topC=[...r].sort((a,b)=>(b.c2026-b.c2025)-(a.c2026-a.c2025))[0];
 const topFall=[...r].sort((a,b)=>(a.o2026-a.o2025)-(b.o2026-b.o2025))[0];
 const items=[
  ['O que impulsionou os chamados',topC?esc(topC.nome)+': '+(d(topC,'c')>=0?'+':'')+num(d(topC,'c'))+' registros em outubro':'Sem tipo comparável'],
  ['Onde houve redução de ouvidorias',topFall?esc(topFall.nome)+': '+num(d(topFall,'o'))+' registros':'Sem tipo comparável']
 ];
 $('highlights').innerHTML=items.map(x=>'<div class="highlight"><b>'+x[0]+'</b><span>'+x[1]+'</span></div>').join('');
}
function renderTrend(){let m=$('trendMetric').value,max=Math.max(...D.monthly.flatMap(x=>[x[m+'2025'],x[m+'2026']]));$('trend').innerHTML=D.monthly.map(x=>'<div class="chartrow"><span>'+esc(x.mes)+'</span><div class="twobar"><div class="barline"><span class="bar" style="width:'+100*x[m+'2025']/max+'%"></span></div><div class="barline"><span class="bar new" style="width:'+100*x[m+'2026']/max+'%"></span></div></div><span style="text-align:right">'+pct(rel(x[m+'2026'],x[m+'2025']))+'</span></div>').join('')}
function renderOrigins(){
const m=metric(),rs=sorted(rows('tipos'),m),positive=rs.filter(r=>d(r,m)>0).slice(0,5),negative=[...rs].reverse().filter(r=>d(r,m)<0).slice(0,3),meta=getScope().meta,total=d(meta,m);
const items=[...positive,...negative.filter(x=>!positive.includes(x))];
$('origin').innerHTML='<p class="note">Saldo líquido no período: <b>'+((total>=0)?'+':'')+num(total)+'</b>. Percentuais de contribuição podem superar 100% quando existem compensações negativas.</p>'+table(['Tipo','2025','2026','Dif.','% var.'],items.map(r=>[esc(r.nome),num(v(r,m,2025)),num(v(r,m,2026)),'<span class="'+(d(r,m)>=0?'positive':'negative')+'">'+(d(r,m)>0?'+':'')+num(d(r,m))+'</span>',pct(rel(v(r,m,2026),v(r,m,2025)))]));
const subs=sorted(rows('subtipos'),m,'volume').slice(0,8);$('subtypes').innerHTML=table(['Subtipo','2026','Dif.'],subs.map(r=>[esc(r.nome),num(v(r,m,2026)),Number.isFinite(d(r,m))?(d(r,m)>0?'+':'')+num(d(r,m)):'—']))+'<p class="note">Subtipos podem ter nomenclaturas diferentes entre Chamados e Ouvidorias; sem taxa cruzada.</p>';
}
function renderTerritory(){
const m=metric();
for(const [id,key] of [['aps','aps'],['gerencias','gerencias'],['bairros','bairros']]){
const data=rows(key),top=sorted(data,m,'volume').slice(0,5),growth=sorted(data,m).filter(r=>d(r,m)>0).slice(0,5);
$(id).innerHTML='<div class="note"><b>Maior volume em 2026</b></div>'+table(['Local','2026'],top.map(r=>[esc(r.nome),num(v(r,m,2026))]))+'<div class="note" style="margin:12px 0 7px"><b>Maior crescimento absoluto</b></div>'+table(['Local','Dif.'],growth.map(r=>[esc(r.nome),'<span class="positive">+'+num(d(r,m))+'</span>']))+(data.length>5?'<p class="note">Top 5 de '+data.length+' categorias disponíveis no cubo.</p>':'');
}
}
function classify(a,m){
const months=['july','august','september','october'].map(k=>D.periods[k]?.tipos?.find(x=>x.nome===a.nome));
if(months.some(x=>!x || !Number.isFinite(x[m+'2025']) || !Number.isFinite(x[m+'2026'])))return null;
const plus=months.map(x=>x[m+'2026']>x[m+'2025'] && x[m+'2025']>=10);
let last=0;for(let i=3;i>=0&&plus[i];i--)last++;
return {last,plus,months};
}
function renderPersistence(){
const m=metric(),a=rows('tipos').filter(x=>v(x,m,2026)>=80).map(r=>({r,p:classify(r,m)})).filter(x=>x.p&&x.p.last>0).sort((a,b)=>b.p.last-a.p.last||v(b.r,m,2026)-v(a.r,m,2026)).slice(0,9);
$('persistence').innerHTML= a.length?table(['Serviço','Jul','Ago','Set','Out','Classificação'],a.map(({r,p})=>[esc(r.nome),...p.months.map(x=>pct(rel(x[m+'2026'],x[m+'2025']))),p.last>=3?'<span class="pill high">Persistente</span>':p.last===2?'<span class="pill watch">Emergente</span>':'<span class="pill">Pontual</span>'])):'<p>Não há casos classificados com os critérios definidos.</p>';
}
function renderQuadrants(){
const list=rows('tipos').filter(r=>r.status==='taxa'&&v(r,'c',2025)>=100&&v(r,'o',2025)>=20&&v(r,'c',2026)>=100).map(r=>({r,upC:d(r,'c')>0,upO:d(r,'o')>0}));
const groups=[['Chamados ↑ · Ouvidorias ↑',x=>x.upC&&x.upO],['Chamados ↑ · Ouvidorias ↓/=',x=>x.upC&&!x.upO],['Chamados ↓/= · Ouvidorias ↑',x=>!x.upC&&x.upO],['Ambos ↓/=',x=>!x.upC&&!x.upO]];
$('quadrants').innerHTML=groups.map(([title,test])=>'<div style="background:#0b2a40;border:1px solid var(--edge);padding:12px;border-radius:10px"><div class="note">'+title+'</div><div class="kpi value" style="font-weight:800;font-size:24px">'+list.filter(test).length+'</div><div class="note">serviços com base mínima</div></div>').join('');
const valid=list.map(({r})=>r).sort((a,b)=>v(b,'o',2026)-v(a,'o',2026)).slice(0,7);
$('relative').innerHTML=table(['Serviço','Ouvid.','/mil'],valid.map(r=>[esc(r.nome),num(v(r,'o',2026)),Number.isFinite(r.rate2026)?num(r.rate2026):'—']))+'<p class="note">Somente tipos com status de taxa válida no cubo; pares mínimos para leitura da matriz.</p>';
}
function renderAlerts(){
const domain=[['serviço','tipos'],['AP','aps'],['gerência','gerencias'],['bairro','bairros']];
const all=[];
for(let [kind,key] of domain) for(let r of D.periods.october[key]||[]){
if(!Number.isFinite(r.c2025)||!Number.isFinite(r.c2026)||!Number.isFinite(r.o2025)||!Number.isFinite(r.o2026))continue;
if(r.c2025<80 || r.o2025<20 || r.o2026<20)continue;
const cv=rel(r.c2026,r.c2025),ov=rel(r.o2026,r.o2025);
let level,description;
if(cv>=.15&&ov>=.20){level='high';description='Crescimento simultâneo de chamados e ouvidorias.'}
else if(ov>=.20){level='watch';description='Ouvidorias crescem, mesmo sem crescimento simultâneo expressivo de chamados.'}
else if(cv>=.20){level='observe';description='Chamados crescem sem elevação proporcional de ouvidorias.'}
else continue;
const score=(level==='high'?2e6:level==='watch'?1e6:0)+Math.max(0,r.o2026-r.o2025)*100+Math.max(0,r.c2026-r.c2025);
all.push({kind,r,cv,ov,level,description,score});
}
all.sort((a,b)=>b.score-a.score);
const selected=all.slice(0,3);
$('alerts').innerHTML=selected.length?selected.map((a,i)=>'<button type="button" class="card alert" data-alert-index="'+i+'" aria-controls="alertDetail" aria-expanded="false" aria-label="Ver o detalhamento de '+esc(a.r.nome)+' ('+a.kind+')"><span class="pill '+a.level+'">'+(a.level==='high'?'Alta atenção':a.level==='watch'?'Monitorar ouvidorias':'Monitorar demanda')+'</span><h3>'+esc(a.r.nome)+' <span class="note">· '+a.kind+'</span></h3><p>'+a.description+'</p><div class="numbers">Chamados: <b>'+pct(a.cv)+'</b> · Ouvidorias: <b>'+pct(a.ov)+'</b></div><div class="numbers">2026: '+num(a.r.c2026)+' chamados · '+num(a.r.o2026)+' ouvidorias</div></button>').join(''):'<div class="card">Nenhum recorte atende aos critérios de alerta definidos para outubro.</div>';
const region=$('alertDetail'), content=$('detailContent'),title=$('detailTitle');
const kindKey={'serviço':'tipos','AP':'aps','gerência':'gerencias','bairro':'bairros'};
let current=null;
const signed=n=>(n>0?'+':'')+num(n);
function renderAlertDetail(index) {
 const a=selected[index];if(!a)return;
 if(current===index){closeDetail();return;}
 current=index;
 const {r,kind}=a;
 const key=kindKey[kind],siblings=D.periods.october[key]||[];
 const comparable=siblings.filter(x=>Number.isFinite(x.c2026)&&Number.isFinite(x.o2026));
 const rankFor=m=>[...comparable].sort((x,y)=>y[m+'2026']-x[m+'2026']).findIndex(x=>x.nome===r.nome)+1;
 const posC=rankFor('c'),posO=rankFor('o');
 const total=D.periods.october.meta;
 title.textContent=r.nome+' · '+kind+' · Outubro/2026';
 const metricCard=(label,m)=>'<div class="detail-metric"><label>'+label+'</label><strong>'+num(r[m+'2026'])+' <span style="font-size:13px;color:var(--muted);font-weight:400">em 2026</span></strong><p>Out/2025: <b>'+num(r[m+'2025'])+'</b></p><p>Diferença: <b>'+signed(r[m+'2026']-r[m+'2025'])+'</b> · Variação: <b>'+pct(rel(r[m+'2026'],r[m+'2025']))+'</b></p></div>';
 const context=a.level==='high'?'Os dois indicadores cresceram neste recorte. Prioridade para verificar a natureza da demanda e o histórico local.':a.level==='watch'?'As manifestações cresceram mais intensamente do que o volume de chamados. Investigar a composição e o contexto operacional.':'O volume de chamados cresceu sem aumento proporcional das manifestações. Isso não prova melhora ou piora dos serviços.';
 const peerCount=comparable.length;
 const contributionNote=kind==='serviço'?'O painel apresenta este serviço específico.':'O cubo contém totais por '+kind+' e não relaciona, neste recorte, cada serviço individualmente a esta localização. Não é possível identificar com segurança os serviços causadores desta variação sem um cruzamento adicional.';
 const rank=(p)=>p>0?'posição '+p+' entre '+peerCount+' recortes com valores disponíveis':'posição indisponível';
 content.innerHTML='<div class="detail-metrics">'+metricCard('Chamados','c')+metricCard('Ouvidorias operacionais','o')+'</div>'+
 '<div class="detail-context"><div><h4>Leitura do alerta</h4><p>'+context+'</p><p>'+contributionNote+'</p></div>'+
 '<div><h4>Posição em volume · outubro/2026</h4><p>Chamados: <b>'+rank(posC)+'</b></p><p>Ouvidorias: <b>'+rank(posO)+'</b></p><p class="note">Ranking apenas entre recortes com ambos os totais disponíveis, não um ranking institucional completo.</p></div></div>'+
 '<div class="detail-disclaimer">Base: outubro/2025 × outubro/2026, COMLURB. Volumes agregados por '+esc(kind)+'. Não equivale a comprovação de falha, identificação de ocorrências repetidas ou causa da variação.</div>';
 region.hidden=false;
 $('alerts').querySelectorAll('[data-alert-index]').forEach(btn=>btn.setAttribute('aria-expanded',String(Number(btn.dataset.alertIndex)===index)));
 region.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function closeDetail(){region.hidden=true;current=null;$('alerts').querySelectorAll('[data-alert-index]').forEach(btn=>btn.setAttribute('aria-expanded','false'))}
$('alerts').addEventListener('click',event=>{const target=event.target.closest('[data-alert-index]');if(target)renderAlertDetail(Number(target.dataset.alertIndex));});
$('detailClose').addEventListener('click',closeDetail);
$('alertRules').textContent='Critérios exploratórios: pelo menos 80 chamados em out/2025, 20 ouvidorias em out/2025 e em out/2026; atenção alta = chamados +15% e ouvidorias +20%; monitorar ouvidorias = +20% em ouvidorias; monitorar demanda = +20% em chamados. Exibidos três recortes com maior prioridade, sem eliminação de sobreposição entre serviço e território. Comparação de volumes, não de taxas nem de ocorrências individualizadas.';
}
$('metric').addEventListener('change',()=>{renderOrigins();renderTerritory();renderPersistence()});
$('scope').addEventListener('change',()=>{renderOrigins();renderTerritory();renderPersistence()});
$('trendMetric').addEventListener('change',renderTrend);
try{renderKpis();renderHighlights();renderTrend();renderAlerts();renderQuadrants();renderOrigins();renderTerritory();renderPersistence()}catch(e){$('error').textContent='Erro ao construir a leitura executiva: '+e.message;console.error(e)}
})();