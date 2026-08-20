const BASE_URL="https://docs.google.com/spreadsheets/d/1eWK6G5fNGhW8pt7OsirTpFnYvI3KF7afjX3O-FUXiPk/gviz/tq?tqx=out:csv&sheet=Base_Padronizada&range=A2:T5000";
const BILLED_2026_URL="https://docs.google.com/spreadsheets/d/1eWK6G5fNGhW8pt7OsirTpFnYvI3KF7afjX3O-FUXiPk/gviz/tq?tqx=out:csv&sheet=Valores%20Faturados%202026&range=A1:O500";
const $=id=>document.getElementById(id);
const money=new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0});
const compact=new Intl.NumberFormat("pt-BR",{notation:"compact",maximumFractionDigits:1});
const percent=new Intl.NumberFormat("pt-BR",{style:"percent",maximumFractionDigits:1});
const MONTHS={janeiro:1,fevereiro:2,"março":3,marco:3,abril:4,maio:5,junho:6,julho:7,agosto:8,setembro:9,outubro:10,novembro:11,dezembro:12};
const MONTH_LABELS={1:"Janeiro",2:"Fevereiro",3:"Março",4:"Abril",5:"Maio",6:"Junho",7:"Julho",8:"Agosto",9:"Setembro",10:"Outubro",11:"Novembro",12:"Dezembro"};
const SERVICE_SECRETARY={APA:"SME",Capina:"SME","Manejo e Poda de árvores":"SME","Higienização Escolar":"SME","Gestão de Resíduos":"SME","Controle de Vetores e Pragas":"SME","Gestão de Resíduos Hospitalares":"SMPDA",Dengue:"SMS","Limpeza Hospitalar":"SMS"};
let debtRows=[],billed2026Rows=[],period="2026",rankingChart=null,monthlyChart=null,selectedDebtPosition=null,selectedBilledMonth=null,serviceDebtDrillOpen=false;

const valueLabelsPlugin={id:"hubValueLabels",afterDatasetsDraw(chart,args,options){
  if(!options?.display)return;
  const {ctx}=chart;ctx.save();ctx.fillStyle="#f7f9ff";ctx.font="800 10px Segoe UI";
  chart.getDatasetMeta(0).data.forEach((element,index)=>{const label=compact.format(chart.data.datasets[0].data[index]),point=element.tooltipPosition();if(chart.config.type==="bar"){ctx.textAlign="right";ctx.textBaseline="middle";ctx.fillText(label,point.x-8,point.y);}else{ctx.textAlign="center";ctx.textBaseline="bottom";ctx.fillText(label,point.x,point.y-9);}});
  ctx.restore();
}};

function numeric(value){
  if(typeof value==="number")return value;
  let s=String(value||"").trim().replace(/R\$/gi,"").replace(/\s/g,"");
  if(!s)return 0;
  if(s.includes(",")&&s.includes("."))s=s.replace(/\./g,"").replace(",",".");
  else if(s.includes(","))s=s.replace(",",".");
  return Number(s.replace(/[^0-9.-]/g,""))||0;
}

function standardUnit(value){
  const unit=String(value||"").replace(/\s+/g," ").trim();
  const key=unit.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]/g,"");
  const names={
    hmmiguelcouto:"Hospital Municipal Miguel Couto",hospmunicipalmiguelcouto:"Hospital Municipal Miguel Couto",hospitalmunicipalmiguelcouto:"Hospital Municipal Miguel Couto",
    hmsalgadofilho:"Hospital Municipal Salgado Filho",hospmunicipalsalgadofilho:"Hospital Municipal Salgado Filho",hospitalmunicipalsalgadofilho:"Hospital Municipal Salgado Filho",
    matleiladiniz:"Maternidade Leila Diniz",maternidadeleiladiniz:"Maternidade Leila Diniz",
    hmlourencojorgeematernidadeleiladiniz:"Hospital Municipal Lourenço Jorge e Maternidade Leila Diniz"
  };
  return names[key]||unit||"Não informado";
}

function standardService(value){
  let service=String(value||"").replace(/\s+/g," ").trim();
  service=service.replace(/ Total$/i,"");
  const map={"Agente de Preparo de Alimentos (APA)":"APA","Capina e Roçada":"Capina","Gestão de Resíduo Hospitalar":"Gestão de Resíduos Hospitalares"};
  return map[service]||service||"Não informado";
}

function parseDebtRows(text){
  const data=Papa.parse(text,{skipEmptyLines:true}).data;
  return data.slice(1).filter(r=>{
    const secretaria=String(r[0]||"").trim(),service=String(r[1]||"").trim(),unit=String(r[17]||r[15]||r[2]||"").trim();
    return secretaria&&service&&!/^(total|total geral)$/i.test(secretaria)&&!/\btotal$/i.test(service)&&!/^(total|total geral)$/i.test(unit);
  }).map(r=>({
    secretaria:String(r[0]||"").trim(),service:standardService(r[1]),year:numeric(r[5]),month:MONTHS[String(r[6]||"").trim().toLowerCase()]||0,
    billed:numeric(r[8]),paid:numeric(r[12]),paidProvided:String(r[12]||"").trim()!=="",debt:numeric(r[13]),type:String(r[16]||"").trim(),unit:standardUnit(r[17]||r[15]||r[2]),launches:1
  })).filter(r=>r.year&&r.service&&r.unit);
}

function parseBilled2026(text){
  const data=Papa.parse(text,{skipEmptyLines:false}).data;
  const rows=[];let currentService="";const unmappedServices=new Set();
  const headerIndex=data.findIndex(r=>String(r[1]||"").trim().toLowerCase()==="local"&&String(r[2]||"").trim().toLowerCase()==="jan");
  data.slice(headerIndex>=0?headerIndex+1:1).forEach(r=>{
    const cellService=String(r[0]||"").trim();
    if(cellService)currentService=cellService;
    if(!currentService||/ Total$/i.test(currentService)||/^Total Geral$/i.test(currentService)||!String(r[1]||"").trim())return;
    const service=standardService(currentService),unit=standardUnit(r[1]),secretaria=SERVICE_SECRETARY[service]||"Não informada";
    if(secretaria==="Não informada")unmappedServices.add(service);
    for(let month=1;month<=12;month++){
      const billed=numeric(r[month+1]);
      if(billed>0)rows.push({secretaria,service,unit,type:service==="Limpeza Hospitalar"?"Unidade hospitalar":"",year:2026,month,billed,paid:0,paidProvided:false,debt:0,launches:0});
    }
  });
  if(unmappedServices.size)console.warn("HUB COMLURB: serviços sem secretaria mapeada em Valores Faturados 2026:",[...unmappedServices]);
  return rows;
}

function escapeHTML(value){return String(value??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));}
function totals(rows){return rows.reduce((a,r)=>({billed:a.billed+r.billed,paid:a.paid+r.paid,debt:a.debt+r.debt,launches:a.launches+(r.launches||0),paidRecords:a.paidRecords+(r.paidProvided?1:0)}),{billed:0,paid:0,debt:0,launches:0,paidRecords:0});}
function priorRate(row){return row.debt/Math.max(1,row.debt+row.paid);}
function currentRate(row){return period==="2026"?row.debt/Math.max(1,row.billed):priorRate(row);}

function selectedFilters(){return{secretaria:$("secretaryFilter").value,service:$("serviceFilter").value,month:numeric($("monthFilter").value)};}
function applyFilters(rows){const f=selectedFilters();return rows.filter(r=>(!f.secretaria||r.secretaria===f.secretaria)&&(!f.service||r.service===f.service)&&(!f.month||r.month===f.month));}
function periodDebtRows(){return period==="2026"?debtRows.filter(r=>r.year===2026):debtRows.filter(r=>r.year<2026);}
function periodBilledRows(){return period==="2026"?billed2026Rows:debtRows.filter(r=>r.year<2026);}
function periodLabel(){return period==="2026"?"2026":"Anteriores a 2026";}

function mergePositions(billed,debt){
  const map=new Map();
  const add=(r,kind)=>{
    const key=`${r.secretaria}|||${r.service}|||${r.unit}`;
    if(!map.has(key))map.set(key,{secretaria:r.secretaria,service:r.service,unit:r.unit,type:r.type,billed:0,paid:0,debt:0,launches:0,paidProvided:false});
    const x=map.get(key);
    if(kind==="billed")x.billed+=r.billed;
    else{x.paid+=r.paid;x.debt+=r.debt;x.launches+=r.launches||1;x.paidProvided=x.paidProvided||r.paidProvided;if(!x.type)x.type=r.type;}
  };
  billed.forEach(r=>add(r,"billed"));debt.forEach(r=>add(r,"debt"));
  return [...map.values()];
}

function aggregatePrior(rows){return mergePositions([],rows.map(r=>({...r,billed:0}))).map(x=>{const original=rows.filter(r=>r.secretaria===x.secretaria&&r.service===x.service&&r.unit===x.unit);x.billed=original.reduce((a,r)=>a+r.billed,0);return x;});}

function buildAnalysis(){
  const filteredDebt=applyFilters(periodDebtRows());
  if(period==="2026"){
    const filteredBilled=applyFilters(periodBilledRows());
    const positions=mergePositions(filteredBilled,filteredDebt);
    const billed=totals(filteredBilled).billed,debt=totals(filteredDebt).debt;
    return{positions,billed,paid:0,debt,paidRecords:0,focus:debt>0?"debt":"billed"};
  }
  const positions=aggregatePrior(filteredDebt),sum=totals(filteredDebt);
  return{positions,billed:sum.billed,paid:sum.paid,debt:sum.debt,paidRecords:sum.paidRecords,focus:"debt"};
}

function serviceSummary(positions,focus){
  const map=new Map();
  positions.forEach(r=>{if(!map.has(r.service))map.set(r.service,[]);map.get(r.service).push(r);});
  return [...map].map(([name,list])=>{
    const ordered=list.slice().sort((a,b)=>b[focus]-a[focus]);
    const sum=totals(list);
    return{name,list:ordered,leader:ordered[0],value:sum[focus],rate:period==="2026"?sum.debt/Math.max(1,sum.billed):sum.debt/Math.max(1,sum.debt+sum.paid)};
  }).sort((a,b)=>b.value-a.value);
}

function filteredIgnoringMonth(rows){
  const f=selectedFilters();
  return rows.filter(r=>(!f.secretaria||r.secretaria===f.secretaria)&&(!f.service||r.service===f.service));
}

function monthlySeries(){
  const source=period==="2026"?filteredIgnoringMonth(billed2026Rows):filteredIgnoringMonth(debtRows.filter(r=>r.year<2026));
  const values=new Map();
  source.forEach(r=>{
    if(!r.month)return;
    const key=period==="2026"?String(r.month):`${r.year}-${String(r.month).padStart(2,"0")}`;
    values.set(key,(values.get(key)||0)+(period==="2026"?r.billed:r.debt));
  });
  let entries=[...values.entries()].sort((a,b)=>period==="2026"?numeric(a[0])-numeric(b[0]):a[0].localeCompare(b[0]));
  if(period!=="2026")entries=entries.slice(-12);
  return entries.map(([key,value])=>({key,value,label:period==="2026"?MONTH_LABELS[numeric(key)]:`${MONTH_LABELS[numeric(key.slice(5))].slice(0,3)}/${key.slice(2,4)}`}));
}

function distinctInsights(a,positions,services){
  const facts=[],leader=positions.find(r=>r[a.focus]>0),total=a[a.focus];
  if(leader&&total>0){
    const top3=positions.slice(0,3).reduce((sum,r)=>sum+r[a.focus],0)/total;
    facts.push({type:"Concentração",text:`As três maiores unidades somam ${percent.format(top3)} do ${a.focus==="debt"?"débito":"faturamento"}. ${leader.unit} tem o maior valor, com ${money.format(leader[a.focus])}.`});
  }
  const series=monthlySeries(),selectedMonth=numeric($("monthFilter").value);
  let idx=selectedMonth&&period==="2026"?series.findIndex(x=>numeric(x.key)===selectedMonth):series.length-1;
  if(idx>0&&series[idx-1].value>0){
    const change=series[idx].value/series[idx-1].value-1,direction=change>0?"aumentou":"recuou",metric=period==="2026"?"O faturamento":"O débito registrado";
    facts.push({type:"Movimento mensal",text:`${metric} ${direction} ${percent.format(Math.abs(change))} em ${series[idx].label}, na comparação com ${series[idx-1].label}.`});
  }
  const anomaly=services.filter(s=>s.value>0&&(!leader||s.name!==leader.service)).sort((x,y)=>y.value-x.value)[0]||services.filter(s=>s.value>0).sort((x,y)=>y.value-x.value)[0];
  if(anomaly)facts.push({type:"Ponto de atenção",text:period==="2026"?`${anomaly.name} apresenta ${money.format(anomaly.value)} em débitos.`:`Em ${anomaly.name}, ${percent.format(anomaly.rate)} do valor permanece em aberto.`});
  return facts.slice(0,3);
}

function tuneMoneyChart(chart,horizontal=false){
  if(!chart)return;
  chart.options.plugins.tooltip.callbacks.label=context=>`${context.dataset.label}: ${money.format(horizontal?context.parsed.x:context.parsed.y)}`;
  const axis=horizontal?chart.options.scales.x:chart.options.scales.y;
  axis.ticks.callback=value=>compact.format(value);
  chart.options.plugins.hubValueLabels={display:true};
  if(horizontal){chart.options.scales.y.ticks.callback=function(value){return this.getLabelForValue(value);};chart.options.scales.y.ticks.autoSkip=false;}
  chart.options.layout={padding:horizontal?{right:12}:{top:22,right:12}};
  chart.update();
}

function render(){
  const a=buildAnalysis(),positions=a.positions.slice().sort((x,y)=>y[a.focus]-x[a.focus]);
  const servicesWithDebt=new Set(applyFilters(periodDebtRows()).filter(r=>r.debt>0).map(r=>r.service)).size;

  HUB.cards.render("kpiGrid",period==="2026"?[
    {label:"Faturamento bruto acumulado",value:a.billed,note:"Total faturado em 2026 conforme os filtros aplicados",feature:true,color:"blue",customFormatter:v=>money.format(v)},
    {label:"Débito líquido identificado",value:a.debt,note:"Saldo em aberto localizado na razão de débito",color:"red",customFormatter:v=>money.format(v)},
    {label:"Serviços com débito identificado",value:servicesWithDebt,note:"Clique para ver os serviços e os valores",color:"orange",customFormatter:v=>String(v)}
  ]:[
    {label:"Faturamento bruto",value:a.billed,note:"Faturamento registrado no período",feature:true,color:"blue",customFormatter:v=>money.format(v)},
    {label:"Valor líquido pago",value:a.paid,note:"Pagamentos informados na base histórica",color:"green",customFormatter:v=>money.format(v)},
    {label:"Débito líquido",value:a.debt,note:"Saldo em aberto no período",color:"red",customFormatter:v=>money.format(v)}
  ]);

  setupServiceDebtDrill(positions);
  $("serviceLeadText").textContent=a.focus==="debt"?"Mostra a unidade com maior saldo em aberto em cada serviço.":"Mostra a unidade com maior faturamento em cada serviço.";
  const services=serviceSummary(positions,a.focus),insights=distinctInsights(a,positions,services);
  $("insightList").innerHTML=insights.length?insights.map(x=>`<li><b>${escapeHTML(x.type)}</b><span>${escapeHTML(x.text)}</span></li>`).join(""):'<li class="emptyState">Não há dados comparáveis para os filtros aplicados.</li>';
  renderRanking(positions,a.focus);renderMonthly();renderServices(services,a.focus);renderTable(positions);
}

function setupServiceDebtDrill(positions){
  const drill=$("serviceDebtDrill"),card=document.querySelector("#kpiGrid > :nth-child(3)"),map=new Map();
  if(period!=="2026"){serviceDebtDrillOpen=false;drill.hidden=true;return;}
  positions.filter(r=>r.debt>0).forEach(r=>{if(!map.has(r.service))map.set(r.service,{value:0,units:new Set()});const item=map.get(r.service);item.value+=r.debt;item.units.add(r.unit);});
  const services=[...map].sort((a,b)=>b[1].value-a[1].value);
  $("serviceDebtList").innerHTML=services.length?services.map(([service,item])=>`<button type="button" data-service="${escapeHTML(service)}"><span><b>${escapeHTML(service)}</b><small>${item.units.size} ${item.units.size===1?"unidade":"unidades"}</small></span><strong>${escapeHTML(money.format(item.value))}</strong></button>`).join(""):'<div class="emptyState">Não há débitos para os filtros aplicados.</div>';
  drill.hidden=!serviceDebtDrillOpen;
  if(card){card.classList.add("interactiveKpi");card.tabIndex=0;card.setAttribute("role","button");card.setAttribute("aria-expanded",String(serviceDebtDrillOpen));const toggle=()=>{serviceDebtDrillOpen=!serviceDebtDrillOpen;drill.hidden=!serviceDebtDrillOpen;card.setAttribute("aria-expanded",String(serviceDebtDrillOpen));if(serviceDebtDrillOpen)drill.scrollIntoView({behavior:"smooth",block:"nearest"});};card.addEventListener("click",toggle);card.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();toggle();}});}
  $("serviceDebtList").querySelectorAll("button[data-service]").forEach(button=>button.addEventListener("click",()=>{selectedDebtPosition=null;selectedBilledMonth=null;serviceDebtDrillOpen=false;$("serviceFilter").value=button.dataset.service;$("monthFilter").value="";populateCascade();render();}));
}

function renderRanking(rows,focus){
  if(period==="2026"&&focus==="debt"&&selectedDebtPosition){
    const source=filteredIgnoringMonth(periodDebtRows()).filter(r=>r.secretaria===selectedDebtPosition.secretaria&&r.service===selectedDebtPosition.service&&r.unit===selectedDebtPosition.unit&&r.debt>0);
    const byMonth=new Map();source.forEach(r=>byMonth.set(r.month,(byMonth.get(r.month)||0)+r.debt));
    const months=[...byMonth].filter(([month])=>month).sort((a,b)=>a[0]-b[0]);
    $("rankingTitle").textContent=`Débito por mês · ${selectedDebtPosition.unit}`;
    $("rankingScope").textContent=selectedDebtPosition.service;
    $("rankingBack").hidden=false;
    if(rankingChart)HUB.charts.destroy(rankingChart);
    rankingChart=HUB.charts.barHorizontal("rankingChart",{labels:months.map(([month])=>MONTH_LABELS[month]),values:months.map(([,value])=>value)},{label:"Débito líquido",color:HUB.charts.colors.red});
    tuneMoneyChart(rankingChart,true);
    return;
  }
  const top=rows.filter(r=>r[focus]>0).slice(0,7);
  $("rankingTitle").textContent=focus==="debt"?"Onde está o débito":"Onde está o faturamento";
  $("rankingScope").textContent=`${periodLabel()} · ${rows.length} unidades`;
  $("rankingBack").hidden=true;
  if(rankingChart)HUB.charts.destroy(rankingChart);
  rankingChart=HUB.charts.barHorizontal("rankingChart",{labels:top.map(r=>r.unit),values:top.map(r=>r[focus])},{label:focus==="debt"?"Débito líquido":"Faturamento",color:HUB.charts.colors.blue});
  tuneMoneyChart(rankingChart,true);
  if(period==="2026"&&focus==="debt"){
    rankingChart.options.onClick=(event,elements)=>{if(!elements.length)return;const row=top[elements[0].index];selectedDebtPosition={secretaria:row.secretaria,service:row.service,unit:row.unit};renderRanking(rows,focus);};
    rankingChart.update();
  }
}

function renderMonthly(){
  const series=monthlySeries();
  if(period==="2026"&&selectedBilledMonth){
    const source=filteredIgnoringMonth(billed2026Rows).filter(r=>r.month===selectedBilledMonth&&r.billed>0);
    const byService=new Map();source.forEach(r=>byService.set(r.service,(byService.get(r.service)||0)+r.billed));
    const services=[...byService].sort((a,b)=>b[1]-a[1]);
    $("trendTitle").textContent=`Faturamento de ${MONTH_LABELS[selectedBilledMonth]} por serviço`;
    $("trendScope").textContent=`${services.length} ${services.length===1?"serviço":"serviços"}`;
    $("trendBack").hidden=false;
    if(monthlyChart)HUB.charts.destroy(monthlyChart);
    monthlyChart=HUB.charts.barHorizontal("monthlyChart",{labels:services.map(([service])=>service),values:services.map(([,value])=>value)},{label:"Faturamento",color:HUB.charts.colors.green});
    tuneMoneyChart(monthlyChart,true);
    return;
  }
  $("trendTitle").textContent=period==="2026"?"Faturamento mês a mês":"Débito nas últimas competências";
  $("trendScope").textContent=series.length?`${series[0].label} a ${series.at(-1).label}`:"Sem dados mensais";
  $("trendBack").hidden=true;
  if(monthlyChart)HUB.charts.destroy(monthlyChart);
  monthlyChart=HUB.charts.line("monthlyChart",{labels:series.map(x=>x.label),values:series.map(x=>x.value)},{label:period==="2026"?"Faturamento":"Débito",color:period==="2026"?HUB.charts.colors.green:HUB.charts.colors.red});
  tuneMoneyChart(monthlyChart,false);
  if(period==="2026"){
    monthlyChart.options.onClick=(event,elements)=>{if(!elements.length)return;selectedBilledMonth=numeric(series[elements[0].index].key);renderMonthly();};
    monthlyChart.update();
  }
}

function renderServices(cards,focus){
  const filtered=cards.filter(s=>s.value>0);
  $("serviceBars").innerHTML=filtered.length?filtered.map(s=>{
    const breakdown=s.name==="Limpeza Hospitalar"?`<div class="hospitalInline"><em>Maiores débitos por unidade</em>${s.list.filter(h=>h[focus]>0).slice(0,4).map((h,i)=>`<div><span>${i+1}. ${escapeHTML(h.unit)}</span><b>${escapeHTML(money.format(h[focus]))}</b></div>`).join("")}</div>`:"";
    const note=period==="2026"?`${s.list.filter(r=>r.debt>0).length} ${s.list.filter(r=>r.debt>0).length===1?"unidade com débito":"unidades com débito"}`:`${percent.format(s.rate)} em aberto`;
    return `<div class="serviceBar ${breakdown?"hasBreakdown":""}"><div><b>${escapeHTML(s.name)}</b><span>Líder: ${escapeHTML(s.leader.unit)}</span></div><strong>${escapeHTML(money.format(s.value))}</strong><small>${escapeHTML(note)}</small>${breakdown}</div>`;
  }).join(""):'<div class="emptyState">Não há serviços para os filtros aplicados.</div>';
}

function renderTable(rows){
  $("statusColumn").textContent=period==="2026"?"Situação":"Em aberto";
  $("detailBody").innerHTML=rows.map(r=>`<tr><td>${escapeHTML(r.secretaria)}</td><td>${escapeHTML(r.service)}</td><td><b>${escapeHTML(r.unit)}</b></td><td>${escapeHTML(money.format(r.billed))}</td><td>${period==="2026"?"Sem informação":r.paidProvided?escapeHTML(money.format(r.paid)):"Sem informação"}</td><td><b>${escapeHTML(money.format(r.debt))}</b></td><td>${period==="2026"?(r.debt>0?"Débito identificado":"Sem débito identificado"):escapeHTML(percent.format(currentRate(r)))}</td></tr>`).join("");
}

function fillSelect(id,items,placeholder,current,label=value=>value){const select=$(id);select.innerHTML=`<option value="">${placeholder}</option>`+items.map(value=>`<option value="${escapeHTML(value)}">${escapeHTML(label(value))}</option>`).join("");select.value=items.includes(current)?current:"";}
function filterUniverse(){return period==="2026"?[...billed2026Rows,...debtRows.filter(r=>r.year===2026)]:debtRows.filter(r=>r.year<2026);}
function populateCascade(){
  const base=filterUniverse(),currentSecretary=$("secretaryFilter").value;
  const secretaries=[...new Set(base.map(r=>r.secretaria))].sort((a,b)=>a.localeCompare(b,"pt-BR"));fillSelect("secretaryFilter",secretaries,"Todas as secretarias",currentSecretary);
  const secretary=$("secretaryFilter").value,serviceBase=base.filter(r=>!secretary||r.secretaria===secretary),currentService=$("serviceFilter").value;
  const services=[...new Set(serviceBase.map(r=>r.service))].sort((a,b)=>a.localeCompare(b,"pt-BR"));fillSelect("serviceFilter",services,"Todos os serviços",currentService);
  const service=$("serviceFilter").value,monthBase=serviceBase.filter(r=>!service||r.service===service),currentMonth=$("monthFilter").value;
  const months=[...new Set(monthBase.map(r=>r.month).filter(Boolean))].sort((a,b)=>a-b).map(String);fillSelect("monthFilter",months,"Todos os meses",currentMonth,value=>MONTH_LABELS[value]);
}

async function load(){
  try{
    const [baseResponse,billedResponse]=await Promise.all([fetch(`${BASE_URL}&_=${Date.now()}`,{cache:"no-store"}),fetch(`${BILLED_2026_URL}&_=${Date.now()}`,{cache:"no-store"})]);
    if(!baseResponse.ok||!billedResponse.ok)throw new Error("Fonte indisponível");
    debtRows=parseDebtRows(await baseResponse.text());billed2026Rows=parseBilled2026(await billedResponse.text());
    if(!debtRows.length||!billed2026Rows.length)throw new Error("Base vazia");$("dataAlert").hidden=true;
  }catch(error){$("dataAlert").hidden=false;console.warn("HUB COMLURB: falha na atualização das bases.",error);}
  populateCascade();render();
}

function init(){
  Chart.register(valueLabelsPlugin);
  HUB.header.render("header",{systemLabel:"HUB COMLURB · INTELIGÊNCIA OPERACIONAL",title:"Performance dos Contratos de Receita",subtitle:"Faturamento e débitos por período, secretaria, serviço, mês e unidade."});HUB.footer.render("footer");
  document.querySelectorAll("[data-period]").forEach(btn=>btn.addEventListener("click",()=>{period=btn.dataset.period;selectedDebtPosition=null;selectedBilledMonth=null;serviceDebtDrillOpen=false;document.querySelectorAll("[data-period]").forEach(b=>b.classList.toggle("active",b===btn));$("secretaryFilter").value="";$("serviceFilter").value="";$("monthFilter").value="";populateCascade();render();}));
  $("secretaryFilter").addEventListener("change",()=>{selectedDebtPosition=null;selectedBilledMonth=null;$("serviceFilter").value="";$("monthFilter").value="";populateCascade();render();});
  $("serviceFilter").addEventListener("change",()=>{selectedDebtPosition=null;selectedBilledMonth=null;$("monthFilter").value="";populateCascade();render();});$("monthFilter").addEventListener("change",()=>{selectedDebtPosition=null;selectedBilledMonth=null;render();});
  $("clearFilter").addEventListener("click",()=>{selectedDebtPosition=null;selectedBilledMonth=null;serviceDebtDrillOpen=false;$("secretaryFilter").value="";$("serviceFilter").value="";$("monthFilter").value="";period="2026";document.querySelectorAll("[data-period]").forEach(b=>b.classList.toggle("active",b.dataset.period==="2026"));populateCascade();render();});
  $("rankingBack").addEventListener("click",()=>{selectedDebtPosition=null;render();});
  $("trendBack").addEventListener("click",()=>{selectedBilledMonth=null;renderMonthly();});
  $("closeServiceDebt").addEventListener("click",()=>{serviceDebtDrillOpen=false;$("serviceDebtDrill").hidden=true;const card=document.querySelector("#kpiGrid > :nth-child(3)");if(card)card.setAttribute("aria-expanded","false");});
  $("toggleDetails").addEventListener("click",()=>{const open=$("detailWrap").classList.toggle("open");$("toggleDetails").textContent=open?"Recolher dados":"Explorar dados";$("toggleDetails").setAttribute("aria-expanded",String(open));});load();
}
document.addEventListener("DOMContentLoaded",init);
