'use strict';
(() => {
const D=window.TIMELINE1746_DATA, $=id=>document.getElementById(id);
if(!D || !D.periods?.october || !D.accumulated){$('error').textContent='Não foi possível carregar os cubos auditados. Confira a origem da página e o arquivo 1746-timeline/data.js.';return;}
const num=n=>Number.isFinite(n)?Math.round(n).toLocaleString('pt-BR'):'n/d';
const pct=n=>Number.isFinite(n)?(n>0?'+':'')+(n*100).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+'%':'n/d';
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
const subs=sorted(rows('subtipos'),m,'volume').slice(0,8);$('subtypes').innerHTML=table(['Subtipo','2026','Dif.'],subs.map(r=>[esc(r.nome),num(v(r,m,2026)),Number.isFinite(d(r,m))?(d(r,m)>0?'+':'')+num(d(r,m)):'n/d']))+'<p class="note">Subtipos podem ter nomenclaturas diferentes entre Chamados e Ouvidorias; sem taxa cruzada.</p>';
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
 const contributionNote=kind==='serviço'?'Veja abaixo os subtipos deste serviço em outubro.':'Veja abaixo os serviços que compõem o recorte selecionado e abra cada um para conhecer os subtipos.';

 const rank=(p)=>p>0?'posição '+p+' entre '+peerCount+' recortes com valores disponíveis':'posição indisponível';
 content.innerHTML='<div class="detail-metrics">'+metricCard('Chamados','c')+metricCard('Ouvidorias operacionais','o')+'</div>'+
 '<div class="detail-context"><div><h4>Leitura do alerta</h4><p>'+context+'</p><p>'+contributionNote+'</p></div>'+
 '<div><h4>Posição em volume · outubro/2026</h4><p>Chamados: <b>'+rank(posC)+'</b></p><p>Ouvidorias: <b>'+rank(posO)+'</b></p><p class="note">Ranking apenas entre recortes com ambos os totais disponíveis, não um ranking institucional completo.</p></div></div>'+
 '<div id="alertCascade" class="cascade-area" aria-label="Composição por serviço e subtipo"></div>'+ 
 '<div class="detail-disclaimer">Base: outubro/2025 comparado com outubro/2026, COMLURB. Os subtipos preservam as nomenclaturas próprias de Chamados e Ouvidorias e não são usados como taxas cruzadas. A composição não comprova a causa do crescimento.</div>';
 region.hidden=false;
 renderAlertCascade(a);
 $('alerts').querySelectorAll('[data-alert-index]').forEach(btn=>btn.setAttribute('aria-expanded',String(Number(btn.dataset.alertIndex)===index)));
 region.scrollIntoView({behavior:'smooth',block:'nearest'});
}

const alertCascadeState={rows:[],selectedService:null,selectedSubtype:null};
const metrics=['c2025','c2026','o2025','o2026'];
const emptyCounts=()=>({c2025:0,c2026:0,o2025:0,o2026:0});
const addCounts=(to,from)=>{for(const k of metrics)to[k]+=(Number(from[k])||0);return to;};
function renderAlertCascade(a){
 const mount=$('alertCascade');
 const cascade=window.TIMELINE1746_CASCADE?.full?.['Outubro/2026'];
 if(!cascade){mount.innerHTML='<h4>Serviços e subtipos</h4><p class="cascade-note">A base em cascata não foi carregada. Confira a disponibilidade do arquivo 1746-timeline/cascade_data.js.</p>';return;}
 const collections=[];
 const match=(row)=>a.kind==='bairro'?row.nome===a.r.nome:a.kind==='gerência'?row.gerencia===a.r.nome:a.kind==='AP'?row.ap===a.r.nome:true;
 for(const [serviceName,service] of Object.entries(cascade)){
  if(a.kind==='serviço'&&serviceName!==a.r.nome)continue;
  const subs=[];
  const serviceTotal=emptyCounts();
  for(const [subName,sub] of Object.entries(service.subtipos||{})){
   const matching=a.kind==='serviço'?sub.bairros||[]:(sub.bairros||[]).filter(match);
   const sum=matching.reduce(addCounts,emptyCounts());
   if(!metrics.some(k=>sum[k]))continue;
   addCounts(serviceTotal,sum);
   subs.push({name:subName,sum,locations:matching});
  }
  if(subs.length)collections.push({name:serviceName,sum:serviceTotal,subs});
 }
 const check=collections.reduce((t,s)=>addCounts(t,s.sum),emptyCounts());
 const valid=metrics.every(k=>check[k]===Number(a.r[k]||0));
 if(!valid){
  mount.innerHTML='<h4>Composição por serviço e subtipo</h4><p class="cascade-note">O cruzamento disponível não reconciliou os quatro totais deste alerta. Por segurança, a composição não será exibida.</p>';
  return;
 }
 alertCascadeState.rows=collections.sort((a,b)=>(b.sum.c2026+b.sum.o2026)-(a.sum.c2026+a.sum.o2026));
 alertCascadeState.selectedService=null;alertCascadeState.selectedSubtype=null;
 const signedQty=n=>(n>0?'+':'')+num(n);
 const summ=(s,k)=>num(s[k])+' ('+signedQty(s[k]-s[k.replace('2026','2025')])+')';
 mount.innerHTML='<h4>De onde vêm os registros: serviço e subtipo</h4>'+
 '<p class="cascade-note">Recorte: '+esc(a.r.nome)+'. Totais conferidos com os indicadores do alerta para 2025 e 2026. Selecione um serviço para ver seus subtipos e depois escolha um subtipo para identificar os recortes territoriais disponíveis.</p>'+
 '<div id="alertCascadeServices">'+alertCascadeState.rows.map((s,i)=>'<div class="cascade-service"><button type="button" data-service-index="'+i+'" aria-expanded="false"><span class="cascade-title">'+esc(s.name)+'<small class="cascade-meta">'+s.subs.length+' subtipo(s) com registros</small></span><span class="cascade-qty">'+num(s.sum.c2026)+'<small>chamados</small></span><span class="cascade-qty">'+num(s.sum.o2026)+'<small>ouvidorias</small></span><span class="cascade-arrow">▸</span></button><div class="cascade-subwrap" data-service-body="'+i+'" hidden></div></div>').join('')+'</div>'+
 '<p class="cascade-note">Conferência: '+num(check.c2026)+' chamados e '+num(check.o2026)+' ouvidorias, com reconciliação dos dois anos. Diferenças e variações por subtipo representam volumes próprios de cada base.</p>';
 mount.onclick=(event)=>{
  const subButton=event.target.closest('[data-sub-index]');
  if(subButton){const si=Number(subButton.dataset.serviceParent),sb=Number(subButton.dataset.subIndex);openCascadeSubtype(si,sb,a);return;}
  const serviceButton=event.target.closest('[data-service-index]');
  if(serviceButton)openCascadeService(Number(serviceButton.dataset.serviceIndex),a);
 };
}
function openCascadeService(index,a){
 const mount=$('alertCascade');
 const parent=mount.querySelector('[data-service-body="'+index+'"]');
 const button=mount.querySelector('[data-service-index="'+index+'"]');
 if(!parent||!button)return;
 const open=button.getAttribute('aria-expanded')==='true';
 mount.querySelectorAll('[data-service-body]').forEach(el=>el.hidden=true);
 mount.querySelectorAll('[data-service-index]').forEach(el=>el.setAttribute('aria-expanded','false'));
 if(open)return;
 const svc=alertCascadeState.rows[index];
 button.setAttribute('aria-expanded','true');parent.hidden=false;
 parent.innerHTML='<p class="cascade-summary">'+esc(svc.name)+'. Selecione um subtipo para consultar a distribuição territorial específica.</p>'+
 [...svc.subs].sort((a,b)=>(b.sum.c2026+b.sum.o2026)-(a.sum.c2026+a.sum.o2026)).map(sub=>{
   const subIndex=svc.subs.indexOf(sub);
   return '<div class="cascade-sub"><button type="button" data-service-parent="'+index+'" data-sub-index="'+subIndex+'" aria-expanded="false"><span class="cascade-title">'+esc(sub.name)+'</span><span class="cascade-qty">'+num(sub.sum.c2026)+'<small>chamados</small></span><span class="cascade-qty">'+num(sub.sum.o2026)+'<small>ouvidorias</small></span><span class="cascade-arrow">▸</span></button><div class="cascade-territory" data-sub-body="'+subIndex+'" hidden></div></div>';
 }).join('');
}
function openCascadeSubtype(serviceIndex,subIndex,a){
 const mount=$('alertCascade'),service=alertCascadeState.rows[serviceIndex],sub=service?.subs[subIndex];
 if(!sub)return;
 const section=mount.querySelector('[data-service-body="'+serviceIndex+'"]');
 const body=section.querySelector('[data-sub-body="'+subIndex+'"]'),button=section.querySelector('[data-sub-index="'+subIndex+'"]');
 if(!body||!button)return;
 const opened=button.getAttribute('aria-expanded')==='true';
 section.querySelectorAll('[data-sub-body]').forEach(el=>el.hidden=true);
 section.querySelectorAll('[data-sub-index]').forEach(el=>el.setAttribute('aria-expanded','false'));
 if(opened)return;
 button.setAttribute('aria-expanded','true');body.hidden=false;
 const key=a.kind==='bairro'?'gerencia':a.kind==='gerência'?'nome':a.kind==='AP'?'gerencia':'nome';
 const data=new Map();
 for(const r of sub.locations){const label=a.kind==='bairro'?r.ap+' / '+r.gerencia:a.kind==='gerência'?r.nome:a.kind==='AP'?r.gerencia:r.nome;const v=data.get(label)||emptyCounts();addCounts(v,r);data.set(label,v);}
 const rows=[...data.entries()].sort((a,b)=>(b[1].c2026+b[1].o2026)-(a[1].c2026+a[1].o2026)).slice(0,20);
 const location=a.kind==='bairro'?'AP / Gerência':a.kind==='gerência'?'Bairro':a.kind==='AP'?'Gerência':'Bairro';
 body.innerHTML='<div class="cascade-summary">Subtipo: <b>'+esc(sub.name)+'</b>. Chamados em 2025: '+num(sub.sum.c2025)+', em 2026: '+num(sub.sum.c2026)+'. Ouvidorias em 2025: '+num(sub.sum.o2025)+', em 2026: '+num(sub.sum.o2026)+'.</div>'+
 table([location,'Chamados 2026','Ouvidorias 2026'],rows.map(([name,x])=>[esc(name),num(x.c2026),num(x.o2026)]))+
 (data.size>rows.length?'<p class="cascade-note">Exibidos os 20 recortes de maior volume entre '+data.size+'.</p>':'');
}

function closeDetail(){region.hidden=true;current=null;$('alerts').querySelectorAll('[data-alert-index]').forEach(btn=>btn.setAttribute('aria-expanded','false'))}
$('alerts').addEventListener('click',event=>{const target=event.target.closest('[data-alert-index]');if(target)renderAlertDetail(Number(target.dataset.alertIndex));});
$('detailClose').addEventListener('click',closeDetail);
$('alertRules').textContent='Critérios exploratórios: pelo menos 80 chamados em out/2025, 20 ouvidorias em out/2025 e em out/2026; atenção alta = chamados +15% e ouvidorias +20%; monitorar ouvidorias = +20% em ouvidorias; monitorar demanda = +20% em chamados. Exibidos três recortes com maior prioridade, sem eliminação de sobreposição entre serviço e território. Comparação de volumes, não de taxas nem de ocorrências individualizadas.';
}
$('metric').addEventListener('change',()=>{renderOrigins();renderTerritory();renderPersistence()});
$('scope').addEventListener('change',()=>{renderOrigins();renderTerritory();renderPersistence()});
$('trendMetric').addEventListener('change',renderTrend);
try{renderKpis();renderHighlights();renderTrend();renderAlerts();renderOrigins();renderTerritory();renderPersistence()}catch(e){$('error').textContent='Erro ao construir a leitura executiva: '+e.message;console.error(e)}
})();