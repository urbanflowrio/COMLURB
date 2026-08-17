
const CONFIG = {
  systemLabel: "HUB COMLURB",
  title: "Performance dos Contratos de Receita",
  subtitle: "Inteligência financeira dos contratos de receita da Companhia.",
  author: "Greicy Moreira",
  version: "3.0"
};

let flowChart = null;

const fmtMoney = v => {
  if (v >= 1e6) return "R$ " + (v/1e6).toFixed(1).replace(".", ",") + " mi";
  if (v >= 1e3) return "R$ " + (v/1e3).toFixed(0).replace(".", ",") + " mil";
  return "R$ " + Math.round(v).toLocaleString("pt-BR");
};
const fmtPct = v => (Number.isFinite(v) ? v : 0).toFixed(1).replace(".", ",") + "%";
const pctOf = (a,b) => b ? a/b*100 : 0;

function init(){
  HUB.header.render("hubHeader",{
    systemLabel: CONFIG.systemLabel,
    title: CONFIG.title,
    subtitle: CONFIG.subtitle
  });

  HUB.footer.render("hubFooter",{
    author: CONFIG.author,
    version: CONFIG.version
  });

  populateFilters();
  bindEvents();
  render();
}

function populateFilters(){
  const secs = [...new Set(RECEITA_DATA.contracts.map(d=>d.secretaria))].sort();
  const servs = [...new Set(RECEITA_DATA.contracts.map(d=>d.servico))].sort();
  document.getElementById("secretaria").innerHTML =
    '<option value="">Todas</option>' + secs.map(x=>`<option value="${x}">${x}</option>`).join("");
  document.getElementById("servico").innerHTML =
    '<option value="">Todos</option>' + servs.map(x=>`<option value="${x}">${x}</option>`).join("");
}

function bindEvents(){
  ["secretaria","servico"].forEach(id=>document.getElementById(id).addEventListener("change",render));
  document.getElementById("clearFilters").addEventListener("click",()=>{
    document.getElementById("secretaria").value="";
    document.getElementById("servico").value="";
    render();
  });
  document.getElementById("togglePortfolio").addEventListener("click",()=>{
    const box=document.getElementById("portfolio");
    const btn=document.getElementById("togglePortfolio");
    box.hidden=!box.hidden;
    btn.setAttribute("aria-expanded", String(!box.hidden));
    btn.innerHTML = box.hidden ? 'Explorar carteira <span aria-hidden="true">↓</span>' : 'Recolher carteira <span aria-hidden="true">↑</span>';
  });
}

function filteredContracts(){
  const sec=document.getElementById("secretaria").value;
  const serv=document.getElementById("servico").value;
  return RECEITA_DATA.contracts.filter(d=>(!sec||d.secretaria===sec)&&(!serv||d.servico===serv));
}

function totals(list){
  return list.reduce((a,d)=>{
    a.faturado+=d.faturado;a.pago+=d.pago;a.debito+=d.debito;return a;
  },{faturado:0,pago:0,debito:0});
}

function render(){
  const list=filteredContracts();
  const T=totals(list);
  renderKPIs(T);
  renderExecutive(list,T);
  renderChart(T);
  renderSecretaryBars(list,T);
  renderPriorities(list);
  renderPortfolio(list);
}

function renderKPIs(T){
  HUB.cards.render("kpis",[
    {label:"Faturamento Bruto",value:fmtMoney(T.faturado),note:"Total faturado no recorte",feature:true},
    {label:"Valor Líquido Pago",value:fmtMoney(T.pago),note:"Receita efetivamente recebida",color:"green"},
    {label:"Débito Líquido",value:fmtMoney(T.debito),note:"Saldo pendente de recebimento",color:"red"}
  ]);
}

function renderExecutive(list,T){
  const topDebt=[...list].sort((a,b)=>b.debito-a.debito)[0];
  const debtShare=pctOf(T.debito,T.faturado);
  const topShare=topDebt ? pctOf(topDebt.debito,T.debito) : 0;

  document.getElementById("executiveHeadline").textContent = topDebt
    ? `${topDebt.contrato} concentra ${fmtPct(topShare)} do débito líquido do recorte.`
    : "Sem contratos no recorte selecionado.";

  document.getElementById("executiveSubtext").textContent = topDebt
    ? `O débito líquido representa ${fmtPct(debtShare)} do faturamento. O foco gerencial deve permanecer no contrato de maior exposição, sem repetir os totais já apresentados nos KPIs.`
    : "";
}

function renderChart(T){
  const factor = RECEITA_DATA.contracts.reduce((s,d)=>s+d.faturado,0) ? T.faturado / RECEITA_DATA.contracts.reduce((s,d)=>s+d.faturado,0) : 0;
  const months = RECEITA_DATA.months.map(m=>({
    label:m.label,
    faturado:m.faturado*factor,
    pago:m.pago*factor,
    debito:m.debito*factor
  }));

  if(flowChart) flowChart.destroy();
  flowChart=new Chart(document.getElementById("flowChart"),{
    type:"bar",
    data:{
      labels:months.map(m=>m.label),
      datasets:[
        {label:"Faturamento",data:months.map(m=>m.faturado/1e6),backgroundColor:"rgba(91,155,213,.82)",borderRadius:7},
        {label:"Valor líquido pago",data:months.map(m=>m.pago/1e6),backgroundColor:"rgba(120,170,163,.86)",borderRadius:7},
        {label:"Débito líquido",data:months.map(m=>m.debito/1e6),type:"line",borderColor:"#ef6a5d",backgroundColor:"rgba(239,106,93,.10)",fill:true,tension:.32,pointRadius:4,borderWidth:2.2}
      ]
    },
    options:{
      responsive:true,maintainAspectRatio:false,
      interaction:{mode:"index",intersect:false},
      plugins:{
        legend:{labels:{color:"#b8c9de",usePointStyle:true,pointStyle:"circle",boxWidth:8,font:{size:10,weight:"700"}}},
        tooltip:{callbacks:{label:c=>` ${c.dataset.label}: R$ ${Number(c.raw).toFixed(1).replace(".",",")} mi`}}
      },
      scales:{
        x:{grid:{display:false},ticks:{color:"#9db8d4"}},
        y:{beginAtZero:true,grid:{color:"rgba(130,183,231,.12)"},ticks:{color:"#8ca3b8",callback:v=>"R$ "+v+" mi"}}
      }
    }
  });
}

function renderSecretaryBars(list,T){
  const m={};
  list.forEach(d=>m[d.secretaria]=(m[d.secretaria]||0)+d.faturado);
  const rows=Object.entries(m).sort((a,b)=>b[1]-a[1]);
  document.getElementById("secretaryBars").innerHTML=rows.map(([name,val])=>{
    const p=pctOf(val,T.faturado);
    return `<div class="secretaryRow">
      <div class="secretaryTop">
        <div><div class="secretaryName">${name}</div><div class="secretaryValue">${fmtMoney(val)}</div></div>
        <div class="secretaryShare">${fmtPct(p)}</div>
      </div>
      <div class="secretaryTrack"><div class="secretaryFill" style="width:${p}%"></div></div>
    </div>`;
  }).join("");
}

function renderPriorities(list){
  const rows=[...list].filter(d=>d.debito>0).sort((a,b)=>b.debito-a.debito).slice(0,3);
  document.getElementById("priorityMeta").textContent=`${rows.length} prioridade${rows.length===1?"":"s"}`;
  document.getElementById("priorityList").innerHTML=rows.length ? rows.map(d=>`
    <div class="priorityItem">
      <div class="priorityMain">
        <div class="priorityContract">${d.contrato}<span class="priorityPill">${d.secretaria}</span></div>
        <div class="priorityService">${d.servico}</div>
      </div>
      <div><span class="metricLabel">Débito líquido</span><span class="metricValue debt">${fmtMoney(d.debito)}</span></div>
      <div><span class="metricLabel">% do débito total</span><span class="metricValue">${fmtPct(pctOf(d.debito,totals(list).debito))}</span></div>
    </div>`).join("") : '<div class="hint">Nenhum débito líquido no recorte.</div>';
}

function renderPortfolio(list){
  document.getElementById("portfolio").innerHTML=`<div class="portfolioList">${
    [...list].sort((a,b)=>b.faturado-a.faturado).map(d=>`
      <div class="portfolioRow">
        <div>
          <div class="priorityContract">${d.contrato}<span class="priorityPill">${d.secretaria}</span></div>
          <div class="priorityService">${d.servico}</div>
        </div>
        <div><span class="metricLabel">Faturado</span><span class="metricValue">${fmtMoney(d.faturado)}</span></div>
        <div><span class="metricLabel">Líq. pago</span><span class="metricValue">${fmtMoney(d.pago)}</span></div>
        <div><span class="metricLabel">Débito</span><span class="metricValue debt">${fmtMoney(d.debito)}</span></div>
      </div>`).join("")
  }</div>`;
}

document.addEventListener("DOMContentLoaded",init);
