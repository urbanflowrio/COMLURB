const SOURCE_URL="https://docs.google.com/spreadsheets/d/1eWK6G5fNGhW8pt7OsirTpFnYvI3KF7afjX3O-FUXiPk/gviz/tq?tqx=out:csv&sheet=Base_Padronizada&range=A2:T5000";
const $=id=>document.getElementById(id);
const money=new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0});
const compact=new Intl.NumberFormat("pt-BR",{notation:"compact",maximumFractionDigits:1});
const percent=new Intl.NumberFormat("pt-BR",{style:"percent",maximumFractionDigits:1});
let rawRows=[],period="2026";
const MONTHS={janeiro:1,fevereiro:2,"março":3,marco:3,abril:4,maio:5,junho:6,julho:7,agosto:8,setembro:9,outubro:10,novembro:11,dezembro:12};
const MONTH_LABELS={1:"Janeiro",2:"Fevereiro",3:"Março",4:"Abril",5:"Maio",6:"Junho",7:"Julho",8:"Agosto",9:"Setembro",10:"Outubro",11:"Novembro",12:"Dezembro"};

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
    matleiladiniz:"Maternidade Leila Diniz",maternidadeleiladiniz:"Maternidade Leila Diniz"
  };
  return names[key]||unit||"Não informado";
}

function standardService(value){
  const service=String(value||"").replace(/\s+/g," ").trim();
  const map={"Capina e Roçada":"Capina","Gestão de Resíduo Hospitalar":"Gestão de Resíduos Hospitalares"};
  return map[service]||service||"Não informado";
}

function parseRows(text){
  const data=Papa.parse(text,{skipEmptyLines:true}).data;
  return data.slice(1).filter(r=>r[0]&&r[1]).map(r=>({
    secretaria:String(r[0]||"").trim(),service:standardService(r[1]),year:numeric(r[5]),month:MONTHS[String(r[6]||"").trim().toLowerCase()]||0,billed:numeric(r[8]),paid:numeric(r[12]),paidProvided:String(r[12]||"").trim()!=="",debt:numeric(r[13]),
    type:String(r[16]||"").trim(),unit:standardUnit(r[17]||r[15]||r[2]),launches:1
  })).filter(r=>r.year&&r.service&&r.unit);
}

function escapeHTML(value){return String(value??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));}
function totals(rows){return rows.reduce((a,r)=>({billed:a.billed+r.billed,paid:a.paid+r.paid,debt:a.debt+r.debt,launches:a.launches+r.launches,paidRecords:a.paidRecords+(r.paidProvided?1:0)}),{billed:0,paid:0,debt:0,launches:0,paidRecords:0});}
function rate(row){return row.debt/Math.max(1,row.debt+row.paid);}

function periodRows(){
  if(period==="2026")return rawRows.filter(r=>r.year===2026);
  if(period==="prior")return rawRows.filter(r=>r.year<2026);
  return rawRows.slice();
}

function aggregate(rows){
  const map=new Map();
  rows.forEach(r=>{
    const key=`${r.secretaria}|||${r.service}|||${r.unit}`;
    if(!map.has(key))map.set(key,{secretaria:r.secretaria,service:r.service,unit:r.unit,type:r.type,billed:0,paid:0,debt:0,launches:0,paidProvided:false});
    const x=map.get(key);x.billed+=r.billed;x.paid+=r.paid;x.debt+=r.debt;x.launches+=1;x.paidProvided=x.paidProvided||r.paidProvided;
  });
  return [...map.values()].sort((a,b)=>b.debt-a.debt);
}

function serviceSummary(rows){
  const map=new Map();
  rows.forEach(r=>{if(!map.has(r.service))map.set(r.service,[]);map.get(r.service).push(r);});
  return [...map].map(([name,list])=>{const ordered=aggregate(list),sum=totals(list);return{name,leader:ordered[0],debt:sum.debt,paid:sum.paid,open:sum.debt/Math.max(1,sum.debt+sum.paid)};}).sort((a,b)=>b.debt-a.debt);
}

function periodLabel(){return period==="2026"?"2026":period==="prior"?"Anteriores a 2026":"Consolidado";}

function filteredRows(){
  const secretary=$("secretaryFilter").value,service=$("serviceFilter").value,month=numeric($("monthFilter").value);
  return periodRows().filter(r=>(!secretary||r.secretaria===secretary)&&(!service||r.service===service)&&(!month||r.month===month));
}

function render(){
  const service=$("serviceFilter").value;
  const filtered=filteredRows();
  const positions=aggregate(filtered),sum=totals(filtered),leader=positions[0];
  const open=sum.debt/Math.max(1,sum.debt+sum.paid);
  const top3Share=positions.slice(0,3).reduce((a,r)=>a+r.debt,0)/Math.max(1,sum.debt);

  $("kpiBilled").textContent=money.format(sum.billed);
  $("kpiPaid").textContent=sum.paidRecords?money.format(sum.paid):"Não informado";
  $("kpiDebt").textContent=money.format(sum.debt);
  $("openRate").textContent=percent.format(open);
  $("openMeter").style.width=`${Math.min(100,open*100)}%`;
  $("rankingScope").textContent=`${periodLabel()} · ${positions.length} posições`;

  if(leader){
    $("execTitle").textContent=`As três maiores posições concentram ${percent.format(top3Share)} do débito`;
    $("execText").innerHTML=`A maior exposição está em <b>${escapeHTML(leader.unit)}</b>, no serviço de <b>${escapeHTML(leader.service)}</b>, com ${escapeHTML(money.format(leader.debt))}.`;
    $("signalUnit").textContent=leader.unit;
    $("signalValue").textContent=compact.format(leader.debt);
    $("signalText").innerHTML=`Maior saldo de ${escapeHTML(periodLabel().toLowerCase())}, em <b>${escapeHTML(leader.service)}</b>.`;
    $("signalRate").textContent=percent.format(rate(leader));
    $("leaderShare").textContent=percent.format(leader.debt/Math.max(1,sum.debt));
  }else{
    ["execTitle","execText","signalUnit","signalValue","signalText","signalRate","leaderShare"].forEach(id=>$(id).textContent="—");
  }

  renderRanking(positions);
  renderServices(serviceSummary(filtered));
  renderHospitals(positions);
  renderTable(positions);
}

function renderRanking(rows){
  const top=rows.slice(0,7),max=top[0]?.debt||1;
  $("ranking").innerHTML=top.length?top.map((r,i)=>`
    <div class="rankingRow"><span>${String(i+1).padStart(2,"0")}</span>
      <div class="rankCopy"><b title="${escapeHTML(r.unit)}">${escapeHTML(r.unit)}</b><small>${escapeHTML(r.service)}</small></div>
      <div class="rankTrack"><i style="width:${Math.max(2,r.debt/max*100)}%"></i></div>
      <strong>${escapeHTML(compact.format(r.debt))}</strong>
    </div>`).join(""):'<div class="emptyState">Sem dados para o recorte selecionado.</div>';
}

function renderServices(cards){
  $("serviceCards").innerHTML=cards.map((s,i)=>`
    <article class="serviceCard"><div class="serviceTop"><span>${String(i+1).padStart(2,"0")}</span><b>${escapeHTML(compact.format(s.debt))}</b></div>
      <h3>${escapeHTML(s.name)}</h3><p><strong>${escapeHTML(s.leader.unit)}</strong> concentra o maior saldo do serviço.</p>
      <footer><span>${escapeHTML(percent.format(s.open))} em aberto</span><i style="width:${Math.min(100,s.open*100)}%"></i></footer>
    </article>`).join("");
}

function renderHospitals(rows){
  const hospitals=rows.filter(r=>r.type==="Unidade hospitalar"||r.service==="Limpeza Hospitalar").sort((a,b)=>b.debt-a.debt);
  $("hospitalPanel").hidden=!hospitals.length;
  $("hospitalList").innerHTML=hospitals.slice(0,6).map((h,i)=>`
    <div><span>${i+1}</span><p><b>${escapeHTML(h.unit)}</b><small>${escapeHTML(percent.format(rate(h)))} em aberto</small></p><strong>${escapeHTML(money.format(h.debt))}</strong></div>`).join("");
}

function renderTable(rows){
  $("detailBody").innerHTML=rows.map(r=>`<tr><td>${escapeHTML(r.secretaria)}</td><td>${escapeHTML(r.service)}</td><td><b>${escapeHTML(r.unit)}</b></td><td>${escapeHTML(money.format(r.billed))}</td><td>${r.paidProvided?escapeHTML(money.format(r.paid)):"Não informado"}</td><td><b>${escapeHTML(money.format(r.debt))}</b></td><td>${escapeHTML(percent.format(rate(r)))}</td></tr>`).join("");
}

function fillSelect(id,items,placeholder,current,label=value=>value){
  const select=$(id);
  select.innerHTML=`<option value="">${placeholder}</option>`+items.map(value=>`<option value="${escapeHTML(value)}">${escapeHTML(label(value))}</option>`).join("");
  select.value=items.includes(current)?current:"";
}

function populateCascade(){
  const periodBase=periodRows();
  const currentSecretary=$("secretaryFilter").value;
  const secretaries=[...new Set(periodBase.map(r=>r.secretaria))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
  fillSelect("secretaryFilter",secretaries,"Todas as secretarias",currentSecretary);

  const secretary=$("secretaryFilter").value;
  const serviceBase=periodBase.filter(r=>!secretary||r.secretaria===secretary);
  const currentService=$("serviceFilter").value;
  const services=[...new Set(serviceBase.map(r=>r.service))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
  fillSelect("serviceFilter",services,"Todos os serviços",currentService);

  const service=$("serviceFilter").value;
  const monthBase=serviceBase.filter(r=>!service||r.service===service);
  const currentMonth=$("monthFilter").value;
  const months=[...new Set(monthBase.map(r=>r.month).filter(Boolean))].sort((a,b)=>a-b).map(String);
  fillSelect("monthFilter",months,"Todos os meses",currentMonth,value=>MONTH_LABELS[value]);
}

async function load(){
  try{
    const response=await fetch(`${SOURCE_URL}&_=${Date.now()}`,{cache:"no-store"});
    if(!response.ok)throw new Error("Fonte indisponível");
    rawRows=parseRows(await response.text());
    if(!rawRows.length)throw new Error("Base vazia");
    $("dataAlert").hidden=true;
  }catch(error){
    $("dataAlert").hidden=false;
    console.warn("HUB COMLURB: falha na atualização da base.",error);
  }
  populateCascade();render();
}

function init(){
  HUB.header.render("header",{systemLabel:"HUB COMLURB · INTELIGÊNCIA OPERACIONAL",title:"Performance dos Contratos de Receita",subtitle:"Débitos por período, secretaria, serviço, CRE e unidade hospitalar."});
  HUB.footer.render("footer");
  document.querySelectorAll("[data-period]").forEach(btn=>btn.addEventListener("click",()=>{
    period=btn.dataset.period;document.querySelectorAll("[data-period]").forEach(b=>b.classList.toggle("active",b===btn));
    $("secretaryFilter").value="";$("serviceFilter").value="";$("monthFilter").value="";populateCascade();render();
  }));
  $("secretaryFilter").addEventListener("change",()=>{$("serviceFilter").value="";$("monthFilter").value="";populateCascade();render();});
  $("serviceFilter").addEventListener("change",()=>{$("monthFilter").value="";populateCascade();render();});
  $("monthFilter").addEventListener("change",render);
  $("clearFilter").addEventListener("click",()=>{$("secretaryFilter").value="";$("serviceFilter").value="";$("monthFilter").value="";period="2026";document.querySelectorAll("[data-period]").forEach(b=>b.classList.toggle("active",b.dataset.period==="2026"));populateCascade();render();});
  $("toggleDetails").addEventListener("click",()=>{const open=$("detailWrap").classList.toggle("open");$("toggleDetails").textContent=open?"Recolher dados":"Explorar dados";$("toggleDetails").setAttribute("aria-expanded",String(open));});
  load();
}

document.addEventListener("DOMContentLoaded",init);
