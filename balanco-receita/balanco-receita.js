const SOURCE_URL = "https://docs.google.com/spreadsheets/d/1eWK6G5fNGhW8pt7OsirTpFnYvI3KF7afjX3O-FUXiPk/gviz/tq?tqx=out:csv&sheet=Principais_Devedores&range=A4:J500";

const FALLBACK = [
  ["SME","APA",1,"2ª CRE",4,882091.83,522541.77,198039.35,.2748],
  ["SME","APA",2,"3ª CRE",4,763569.06,503273.72,119880.61,.1924],
  ["SME","APA",3,"1ª CRE",6,1327867.20,953322.89,114709.87,.1074],
  ["SME","Capina",1,"2ª CRE",2,9365.88,1418.99,6560.76,.8222],
  ["SME","Capina",2,"1ª CRE",2,21580.21,12991.31,5395.06,.2934],
  ["SME","Capina",3,"5ª CRE",3,50201.09,40158.47,1752.72,.0418],
  ["SME","Controle de Vetores e Pragas",1,"9ª CRE",8,975262.32,559654.56,214779.94,.2773],
  ["SME","Controle de Vetores e Pragas",2,"6ª CRE",7,645789.00,324152.71,187312.30,.3662],
  ["SME","Controle de Vetores e Pragas",3,"2ª CRE",4,323988.00,137067.76,119530.76,.4658],
  ["SME","Gestão de Resíduos",1,"9ª CRE",9,1295468.97,341493.90,686865.28,.6679],
  ["SME","Gestão de Resíduos",2,"10ª CRE",7,1249449.81,315867.26,673697.05,.6808],
  ["SME","Gestão de Resíduos",3,"7ª CRE",8,1244777.24,339254.11,648805.76,.6566],
  ["SME","Higienização Escolar",1,"7ª CRE",12,10006478.46,5220979.61,2993575.29,.3644],
  ["SME","Higienização Escolar",2,"8ª CRE",12,12697241.88,8329914.41,2107153.94,.2019],
  ["SME","Higienização Escolar",3,"5ª CRE",10,9837539.06,6528277.60,1531704.49,.1900],
  ["SMS","Dengue",1,"SMS",5,3266248.95,1002039.88,2264209.07,.6932],
  ["SMS","Limpeza Hospitalar",1,"Hospital Municipal Salgado Filho",8,3846953.38,1197136.86,2102629.90,.6372],
  ["SMS","Limpeza Hospitalar",2,"Hospital Municipal Miguel Couto",8,3034532.03,900684.92,1692674.26,.6527],
  ["SMS","Limpeza Hospitalar",3,"Maternidade Leila Diniz",6,1871050.53,0,1609792.78,1]
].map(toRow);

let allRows = FALLBACK.slice();
const $ = id => document.getElementById(id);
const money = new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0});
const compact = new Intl.NumberFormat("pt-BR",{notation:"compact",maximumFractionDigits:1});
const percent = new Intl.NumberFormat("pt-BR",{style:"percent",maximumFractionDigits:1});

function toRow(r){
  return {secretaria:r[0],service:r[1],position:Number(r[2])||0,unit:standardUnit(r[3]),launches:Number(r[4])||0,billed:Number(r[5])||0,paid:Number(r[6])||0,debt:Number(r[7])||0,open:Number(r[8])||0};
}

function standardUnit(value){
  const unit=String(value||"").replace(/\s+/g," ").trim();
  const key=unit.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]/g,"");
  const names={
    "hmmiguelcouto":"Hospital Municipal Miguel Couto",
    "hospmunicipalmiguelcouto":"Hospital Municipal Miguel Couto",
    "hospitalmunicipalmiguelcouto":"Hospital Municipal Miguel Couto",
    "hmsalgadofilho":"Hospital Municipal Salgado Filho",
    "hospmunicipalsalgadofilho":"Hospital Municipal Salgado Filho",
    "hospitalmunicipalsalgadofilho":"Hospital Municipal Salgado Filho",
    "matleiladiniz":"Maternidade Leila Diniz",
    "maternidadeleiladiniz":"Maternidade Leila Diniz"
  };
  return names[key]||unit;
}

function numeric(value){
  if(typeof value==="number")return value;
  let s=String(value||"").trim().replace(/R\$/gi,"").replace(/\s/g,"").replace(/%/g,"");
  if(!s)return 0;
  if(s.includes(",")&&s.includes("."))s=s.replace(/\./g,"").replace(",",".");
  else if(s.includes(","))s=s.replace(",",".");
  return Number(s.replace(/[^0-9.-]/g,""))||0;
}

function openRate(value){
  const raw=String(value||"");
  const n=numeric(raw);
  return raw.includes("%")||n>1?n/100:n;
}

function parseRows(text){
  const parsed=Papa.parse(text,{skipEmptyLines:true}).data;
  return parsed.slice(1).filter(r=>String(r[0]||"").trim()&&String(r[7]||"").trim()).map(r=>({
    secretaria:String(r[0]||"").trim(),service:String(r[1]||"").replace(/\s+/g," ").trim(),position:numeric(r[2]),
    unit:standardUnit(r[3]),launches:numeric(r[4]),billed:numeric(r[5]),paid:numeric(r[6]),debt:numeric(r[7]),open:openRate(r[8])
  })).filter(r=>r.service&&r.unit&&Number.isFinite(r.debt));
}

function escapeHTML(value){
  return String(value??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
}

function totals(rows){
  return rows.reduce((a,r)=>({billed:a.billed+r.billed,paid:a.paid+r.paid,debt:a.debt+r.debt,launches:a.launches+r.launches}),{billed:0,paid:0,debt:0,launches:0});
}

function serviceSummary(rows){
  const map=new Map();
  rows.forEach(r=>{
    if(!map.has(r.service))map.set(r.service,[]);
    map.get(r.service).push(r);
  });
  return [...map].map(([name,list])=>{
    const ordered=list.slice().sort((a,b)=>b.debt-a.debt);
    const sum=totals(list);
    return {name,leader:ordered[0],debt:sum.debt,paid:sum.paid,open:sum.debt/Math.max(1,sum.debt+sum.paid)};
  }).sort((a,b)=>b.debt-a.debt);
}

function render(){
  const selected=$("serviceFilter").value;
  const rows=selected?allRows.filter(r=>r.service===selected):allRows.slice();
  const sum=totals(rows);
  const leaders=rows.slice().sort((a,b)=>b.debt-a.debt);
  const leader=leaders[0];
  const open=sum.debt/Math.max(1,sum.debt+sum.paid);

  $("kpiBilled").textContent=money.format(sum.billed);
  $("kpiPaid").textContent=money.format(sum.paid);
  $("kpiDebt").textContent=money.format(sum.debt);
  $("kpiLaunches").textContent=`${sum.launches.toLocaleString("pt-BR")} lançamentos associados`;
  $("kpiPositions").textContent=`${rows.length.toLocaleString("pt-BR")} posições entre os principais devedores`;
  $("openRate").textContent=percent.format(open);
  $("openMeter").style.width=`${Math.min(100,open*100)}%`;

  if(leader){
    $("execTitle").textContent=`${leader.unit} concentra o maior saldo do recorte`;
    $("execText").innerHTML=`Em <b>${escapeHTML(leader.service)}</b>, o débito alcança ${escapeHTML(money.format(leader.debt))}.`;
    $("signalValue").textContent=compact.format(leader.debt);
    $("signalUnit").textContent=leader.unit;
    $("signalText").innerHTML=`Maior saldo do recorte em <b>${escapeHTML(leader.service)}</b>.`;
    $("signalRate").textContent=percent.format(leader.open);
    $("signalLaunches").textContent=leader.launches.toLocaleString("pt-BR");
  }

  renderRanking(leaders);
  renderServices(selected?serviceSummary(rows):serviceSummary(allRows));
  renderHospitals(allRows);
  renderTable(leaders);
}

function renderRanking(rows){
  const top=rows.slice(0,8),max=top[0]?.debt||1;
  $("ranking").innerHTML=top.length?top.map((r,i)=>`
    <div class="rankingRow">
      <span>${String(i+1).padStart(2,"0")}</span>
      <div class="rankCopy"><b title="${escapeHTML(r.unit)}">${escapeHTML(r.unit)}</b><small>${escapeHTML(r.service)}</small></div>
      <div class="rankTrack"><i style="width:${Math.max(2,r.debt/max*100)}%"></i></div>
      <strong>${escapeHTML(compact.format(r.debt))}</strong>
    </div>`).join(""):'<div class="emptyState">Sem dados no recorte.</div>';
}

function renderServices(cards){
  $("serviceCards").innerHTML=cards.map((s,i)=>`
    <article class="serviceCard">
      <div class="serviceTop"><span>${String(i+1).padStart(2,"0")}</span><b>${escapeHTML(compact.format(s.debt))}</b></div>
      <h3>${escapeHTML(s.name)}</h3>
      <p><strong>${escapeHTML(s.leader.unit)}</strong> concentra o maior saldo do serviço.</p>
      <footer><span>${escapeHTML(percent.format(s.open))} em aberto</span><i style="width:${Math.min(100,s.open*100)}%"></i></footer>
    </article>`).join("");
}

function renderHospitals(rows){
  const hospitals=rows.filter(r=>r.service.toLowerCase()==="limpeza hospitalar").sort((a,b)=>b.debt-a.debt);
  $("hospitalPanel").hidden=!hospitals.length;
  $("hospitalList").innerHTML=hospitals.map((h,i)=>`
    <div><span>${i+1}</span><p><b>${escapeHTML(h.unit)}</b><small>${escapeHTML(percent.format(h.open))} em aberto</small></p><strong>${escapeHTML(money.format(h.debt))}</strong></div>`).join("");
}

function renderTable(rows){
  $("detailBody").innerHTML=rows.map(r=>`<tr>
    <td>${escapeHTML(r.service)}</td><td><b>${escapeHTML(r.unit)}</b></td><td>${escapeHTML(money.format(r.billed))}</td>
    <td>${escapeHTML(money.format(r.paid))}</td><td><b>${escapeHTML(money.format(r.debt))}</b></td><td>${escapeHTML(percent.format(r.open))}</td>
  </tr>`).join("");
}

function populateFilter(){
  const current=$("serviceFilter").value;
  const services=[...new Set(allRows.map(r=>r.service))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
  $("serviceFilter").innerHTML='<option value="">Todos os serviços</option>'+services.map(s=>`<option value="${escapeHTML(s)}">${escapeHTML(s)}</option>`).join("");
  if(services.includes(current))$("serviceFilter").value=current;
}

async function load(){
  try{
    const response=await fetch(`${SOURCE_URL}&_=${Date.now()}`,{cache:"no-store"});
    if(!response.ok)throw new Error("Fonte indisponível");
    const rows=parseRows(await response.text());
    if(rows.length)allRows=rows;
  }catch(error){
    console.warn("HUB COMLURB: utilizando a última base incorporada.",error);
  }
  populateFilter();
  render();
}

function init(){
  HUB.header.render("header",{
    systemLabel:"HUB COMLURB · INTELIGÊNCIA OPERACIONAL",
    title:"Performance dos Contratos de Receita",
    subtitle:"Débitos por serviço, CRE e unidade hospitalar."
  });
  HUB.footer.render("footer");
  $("serviceFilter").addEventListener("change",render);
  $("clearFilter").addEventListener("click",()=>{$("serviceFilter").value="";render();});
  $("toggleDetails").addEventListener("click",()=>{
    const open=$("detailWrap").classList.toggle("open");
    $("toggleDetails").textContent=open?"Recolher dados":"Explorar dados";
    $("toggleDetails").setAttribute("aria-expanded",String(open));
  });
  load();
}

document.addEventListener("DOMContentLoaded",init);
