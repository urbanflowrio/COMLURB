"use strict";
(function(){
var months=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro"];
var modes={chamados:"Chamados",ouvidoria:"Ouvidorias",historico:"Histórico",timeline:"Linha do Tempo",comparativo:"Comparativo Territorial"};
var mode=document.body.getAttribute("data-mode")||"historico",dataC=[],dataO=[];
var state={mes:"10",ap:"*",tipo:"*",bairro:"*",gerencia:"*",pco:false};
function E(id){return document.getElementById(id)}
function fmt(x){return Number(x).toLocaleString("pt-BR")}
function html(s){return String(s).replace(/[&<>"']/g,function(ch){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]})}
function pct(x,y){return y?((x/y-1)*100).toLocaleString("pt-BR",{maximumFractionDigits:1})+"%":"—"}
function rows(source,channel){return source.filter(function(r){return(state.mes==="*"||Number(state.mes)===r[0])&&(state.ap==="*"||state.ap===r[1])&&(state.tipo==="*"||state.tipo===r[2])&&(state.bairro==="*"||state.bairro===r[3])&&(state.gerencia==="*"||state.gerencia===r[4])&&(channel==="c"||state.pco||r[4]!=="PCO")})}
function sum(arr){return arr.reduce(function(a,r){a.a+=r[5];a.b+=r[6];return a},{a:0,b:0})}
function group(arr,col){var o={};arr.forEach(function(r){var k=r[col]||"(NÃO IDENTIFICADO)",x=o[k]||(o[k]={name:k,a:0,b:0});x.a+=r[5];x.b+=r[6]});return Object.values(o).sort(function(a,b){return b.b-a.b})}
function tbody(arr,field){return "<div class='scroller'><table><thead><tr><th>Recorte</th><th>2025</th><th>2026</th><th>Variação</th><th>%</th></tr></thead><tbody>"+arr.slice(0,25).map(function(x){var diff=x.b-x.a;return "<tr><td>"+(field?"<button class='drill' data-field='"+field+"' data-value='"+html(x.name)+"'>"+html(x.name)+"</button>":html(x.name))+"</td><td>"+fmt(x.a)+"</td><td>"+fmt(x.b)+"</td><td class='"+(diff>0?"up":diff<0?"down":"")+"'>"+(diff>=0?"+":"−")+fmt(Math.abs(diff))+"</td><td>"+pct(x.b,x.a)+"</td></tr>"}).join("")+"</tbody></table></div>"}
function section(title,body){return "<section class='panel'><h2>"+title+"</h2>"+body+"</section>"}
function measure(title,x){return "<div class='metric'><span>"+title+"</span><strong>"+fmt(x.b)+"</strong><small>2025: "+fmt(x.a)+" · "+pct(x.b,x.a)+"</small></div>"}
function render(){
 var c=rows(dataC,"c"),o=rows(dataO,"o"),a=sum(c),b=sum(o);
 var out="<div class='metrics'>"+measure("Chamados",a)+measure("Ouvidorias",b)+"</div>";
 if(mode==="chamados"||mode==="ouvidoria"){
 var target=mode==="chamados"?c:o;
 out+=section("Tipos",tbody(group(target,2),"tipo"));
 out+="<div class='two'>"+section("Áreas de Planejamento",tbody(group(target,1),"ap"))+section("Bairros",tbody(group(target,3),"bairro"))+"</div>";
 out+=section("Gerências",tbody(group(target,4),"gerencia"));
 }
 if(mode==="historico"||mode==="timeline"){
 var mm=months.map(function(m,i){var cc=sum(c.filter(function(r){return r[0]===i+1})),oo=sum(o.filter(function(r){return r[0]===i+1}));return {month:m,c:cc,o:oo}});
 out+=section("Série mensal de Chamados",tbody(mm.map(function(x){return{name:x.month,a:x.c.a,b:x.c.b}})));
 out+=section("Série mensal de Ouvidorias",tbody(mm.map(function(x){return{name:x.month,a:x.o.a,b:x.o.b}})));
 if(mode==="timeline")out+="<div class='two'>"+section("Chamados por Tipo",tbody(group(c,2),"tipo"))+section("Ouvidorias por Tipo",tbody(group(o,2),"tipo"))+"</div>";
 }
 if(mode==="comparativo"){
 var aps=["AP1","AP2","AP3","AP4","AP5"].map(function(ap){var ca=sum(c.filter(function(r){return r[1]===ap})),ou=sum(o.filter(function(r){return r[1]===ap}));return {name:ap,a:ca.a,b:ca.b,oa:ou.a,ob:ou.b,rateA:ca.a?ou.a*1000/ca.a:0,rateB:ca.b?ou.b*1000/ca.b:0}});
 out+=section("Comparação por AP — taxa de Ouvidorias por mil Chamados","<div class='scroller'><table><thead><tr><th>AP</th><th>Chamados 2026</th><th>Ouvidorias 2026</th><th>Taxa 2025</th><th>Taxa 2026</th></tr></thead><tbody>"+aps.map(function(x){return "<tr><td><button class='drill' data-field='ap' data-value='"+x.name+"'>"+x.name+"</button></td><td>"+fmt(x.b)+"</td><td>"+fmt(x.ob)+"</td><td>"+x.rateA.toFixed(1).replace(".",",")+"</td><td>"+x.rateB.toFixed(1).replace(".",",")+"</td></tr>"}).join("")+"</tbody></table></div>");
 out+="<div class='two'>"+section("Chamados por bairro",tbody(group(c,3),"bairro"))+section("Ouvidorias por bairro",tbody(group(o,3),"bairro"))+"</div>"
 }
 E("results").innerHTML=out+"<p class='footnote'>Prévia com dados agregados tratados. Não altera os fechamentos oficiais. "+(state.pco?"Ouvidorias institucionais (com PCO).":"Ouvidorias operacionais (sem PCO).")+"</p>";
 Array.from(document.querySelectorAll(".drill")).forEach(function(b){b.addEventListener("click",function(){state[b.dataset.field]=b.dataset.value;selectors();render();window.scrollTo(0,0)})});
 E("status").textContent="Base tratada em testes · "+(state.mes==="*"?"jan–out/2026":months[Number(state.mes)-1])+" · "+fmt(c.length)+" grupos de Chamados";
}
function option(id,arr,label){var e=E(id),key=id==="mes"?"mes":id;var current=state[key];e.innerHTML="<option value='*'>"+label+"</option>"+arr.map(function(a){return "<option value='"+html(a)+"'>"+html(a)+"</option>"}).join("");e.value=arr.includes(current)||current==="*"?current:"*";state[key]=e.value}
function selectors(){var all=dataC.concat(dataO);var unique=function(col){return Array.from(new Set(all.filter(function(r){return state.ap==="*"||r[1]===state.ap}).map(function(r){return r[col]}))).sort(function(a,b){return a.localeCompare(b,"pt-BR")})};option("ap",Array.from(new Set(all.map(function(r){return r[1]}))).sort(),"Todas as APs");option("tipo",unique(2),"Todos os Tipos");option("bairro",unique(3),"Todos os bairros");option("gerencia",unique(4),"Todas as gerências")}
async function start(){
 E("heading").textContent=modes[mode];E("nav").innerHTML=Object.entries(modes).map(function(pair){return "<a class='"+(mode===pair[0]?"active":"")+"' href='preview-"+pair[0]+".html'>"+pair[1]+"</a>"}).join("");
 try{
 var all=await Promise.all(["chamados-tratados-2025-2026.json","ouvidorias-tratadas-2025-2026.json"].map(async function(name){var r=await fetch(name,{cache:"no-store"});if(!r.ok)throw Error("Não foi possível carregar "+name);return r.json()}));
 dataC=all[0].records;dataO=all[1].records;if(dataC.length<10000||dataO.length<7000)throw Error("Cubo incompleto");
 function validate(d,excludePCO){return d.records.filter(function(r){return r[0]===10&&(!excludePCO||r[4]!=="PCO")}).reduce(function(s,r){return s+r[6]},0)===d.monthly["10"].y26}
 if(!validate(all[0],false)||!validate(all[1],true))throw Error("Falha na conciliação de outubro");
 E("mes").innerHTML="<option value='*'>Jan–Out acumulado</option>"+months.map(function(m,i){return "<option value='"+(i+1)+"'>"+m+"</option>"}).join("");E("mes").value=state.mes;
 selectors();
 ["mes","ap","tipo","bairro","gerencia"].forEach(function(id){E(id).addEventListener("change",function(){state[id]=this.value;if(id==="ap")selectors();render()})});
 E("pco").addEventListener("change",function(){state.pco=this.checked;render()});
 E("reset").addEventListener("click",function(){state={mes:"10",ap:"*",tipo:"*",bairro:"*",gerencia:"*",pco:false};E("mes").value="10";E("pco").checked=false;selectors();render()});
 render();
 }catch(err){E("status").textContent="Falha de validação";E("results").textContent="A prévia não pôde ser exibida: "+err.message+". Nenhum módulo público foi alterado."}
}
start();
})();