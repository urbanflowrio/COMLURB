#!/usr/bin/env node
"use strict";
/**
 * Integração territorial 1746 — uso exclusivamente em testes.
 * Uso: node staging/1746-territorial-nov2026/reconciliar.cjs CHAMADOS.csv OUVIDORIAS.csv [SAIDA.json]
 *
 * Entrada: exportação CSV da aba Página1 das duas CÓPIAS TRATADAS:
 * A:O da fonte preservada; P AP_PADRONIZADA; Q BAIRRO_PADRONIZADO.
 * Não altera arquivos no Drive, GitHub, cubos ou série publicada.
 */
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { parse } = require("papaparse");
const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const KEY = ["Diretoria","Tipo","SubTipo","Gerência","Bairro","Mês Solicitação","AP","2020","2021","2022","2023","2024","2025","2026","Total Geral","AP_PADRONIZADA","BAIRRO_PADRONIZADO"];
const TARGET_YEAR = [2025,2026];
const VALID_AP = /^AP[1-5]$/;
function integer(value, label) {
  const x = String(value == null ? "" : value).trim();
  if (!x) return 0;
  const s = x.replace(/\s/g,"").replace(/\.(?=\d{3}(?:\D|$))/g,"").replace(",",".");
  const n=Number(s);
  if (!Number.isSafeInteger(n)||n<0) throw new Error("Contagem inválida em "+label+": "+x);
  return n;
}
function clean(raw) {return String(raw==null?"":raw).trim();}
function parseCsv(file) {
  const csv=fs.readFileSync(file,"utf8").replace(/^\uFEFF/,"");
  const d=parse(csv,{header:true,skipEmptyLines:"greedy",delimiter:"",dynamicTyping:false,transformHeader:h=>h.trim().replace(/^\uFEFF/,"")});
  if (d.errors.length) throw new Error("CSV inválido: "+file+" "+JSON.stringify(d.errors.slice(0,3)));
  const missing=KEY.filter(k=>!d.meta.fields.includes(k));
  if (missing.length) throw new Error("Colunas ausentes em "+file+": "+missing.join(", "));
  return d.data;
}
function calc(records,channel) {
  if (!["chamados","ouvidorias"].includes(channel))throw new Error("Canal inválido");
  const months=Object.fromEntries(MONTHS.slice(0,10).map(m=>[m,{institucional2025:0,institucional2026:0,operacional2025:0,operacional2026:0}]));
  const typeMonth=new Map(),apMonth=new Map();
  let originalNulo=0,periodoFuturo=0,semSubtipo=0,semBairro=0,total=0,invalid=0;
  for(let i=0;i<records.length;i++){
    const r=records[i],line=i+2,tipo=clean(r.Tipo),bairro=clean(r.Bairro),apOriginal=clean(r.AP),ap=clean(r.AP_PADRONIZADA),bairroPad=clean(r.BAIRRO_PADRONIZADO),month=clean(r["Mês Solicitação"]),gerencia=clean(r["Gerência"]);
    if(clean(r.Diretoria)==="Total Geral"&&!tipo)continue;
    if(!tipo||!MONTHS.includes(month)) throw new Error(channel+" linha "+line+" sem Tipo ou mês válido");
    if(!bairro||!bairroPad){semBairro++;throw new Error(channel+" linha "+line+" com Bairro ausente");}
    if(!VALID_AP.test(ap)){invalid++;throw new Error(channel+" linha "+line+" AP padronizada inválida: "+ap);}
    if(apOriginal.toLowerCase()==="nulo"||!apOriginal)originalNulo++;
    if(!clean(r.SubTipo))semSubtipo++;
    const amountAll=Array.from({length:7},(_,j)=>integer(r[String(2020+j)],channel+" linha "+line));
    const check=integer(r["Total Geral"],channel+" total linha "+line);
    if(amountAll.reduce((a,b)=>a+b,0)!==check)throw new Error(channel+" total inconsistente na linha "+line);
    total++;
    if(month==="Novembro"||month==="Dezembro"){periodoFuturo+=integer(r["2026"],channel+" novembro/dezembro");}
    for(const year of TARGET_YEAR) {
      const count=integer(r[String(year)],channel+" linha "+line+" "+year);
      if(MONTHS.indexOf(month)>9)continue; // corte fixo Outubro/2026, também no comparativo 2025
      const operational=channel==="chamados"||gerencia!=="PCO";
      const mm=months[month],suffix=year===2025?"2025":"2026";
      mm["institucional"+suffix]+=count;
      if(operational)mm["operacional"+suffix]+=count;
      const k=JSON.stringify([month,year,tipo]);
      const v=typeMonth.get(k)||{mes:month,ano:year,tipo,quantidadeInstitucional:0,quantidadeOperacional:0};
      v.quantidadeInstitucional+=count;
      if(operational)v.quantidadeOperacional+=count;
      typeMonth.set(k,v);
      const ak=JSON.stringify([month,year,ap]);
      const av=apMonth.get(ak)||{mes:month,ano:year,ap,quantidadeInstitucional:0,quantidadeOperacional:0};
      av.quantidadeInstitucional+=count;
      if(operational)av.quantidadeOperacional+=count;
      apMonth.set(ak,av);
    }
  }
  return {canal:channel,linhas:total,linhasAPNuloNaOrigem:originalNulo,linhasSubTipoVazio:semSubtipo,linhasBairroVazio:semBairro,linhasAPInvalida:invalid,volume2026AposOutubro:periodoFuturo,mensal:months,porTipo:[...typeMonth.values()],porAP:[...apMonth.values()]};
}
function reconcile(chamados,ouvidorias,base){
  const differences=[];
  for(const row of base.monthly){
    const m=row.mes,actual={
      chamados2025:chamados.mensal[m].operacional2025,
      chamados2026:chamados.mensal[m].operacional2026,
      ouvidorias2025:ouvidorias.mensal[m].operacional2025,
      ouvidorias2026:ouvidorias.mensal[m].operacional2026
    };
    for(const [key,value] of Object.entries(actual)){
      const previous=row.publicado[key],difference=value-previous;
      if(value!==row.fonte[key])throw new Error("Nova importação diverge do preflight validado: "+m+" "+key+" "+value+" vs "+row.fonte[key]);
      if(difference!==0)differences.push({mes:m,indicador:key,fonte:value,publicado:previous,diferenca:difference,status:"revisao_nao_incorporada"});
    }
  }
  return differences;
}
function selfTest(){
  assert.equal(integer("1.234","teste"),1234);
  assert.equal(integer("0","teste"),0);
  assert.throws(()=>integer("-1","teste"));
  const fixture={"Diretoria":"DLU","Tipo":"LIMPEZA","SubTipo":"INSTALAÇÃO E/OU RETIRADA DE PAPELEIRA","Gerência":"LDE","Bairro":"SAMPAIO","Mês Solicitação":"Outubro","AP":"Nulo","2020":"0","2021":"0","2022":"0","2023":"0","2024":"0","2025":"1","2026":"2","Total Geral":"3","AP_PADRONIZADA":"AP3","BAIRRO_PADRONIZADO":"SAMPAIO"};
  const a=calc([fixture],"chamados");
  assert.equal(a.mensal.Outubro.operacional2026,2);
  assert.equal(a.porTipo[0].tipo,"LIMPEZA"); // nunca transformar em PAPELEIRA por SubTipo
  assert.equal(a.linhasAPNuloNaOrigem,1);
  const ov=calc([{...fixture,Gerência:"PCO",SubTipo:""}],"ouvidorias");
  assert.equal(ov.mensal.Outubro.operacional2026,0);
  assert.equal(ov.mensal.Outubro.institucional2026,2);
  assert.equal(ov.linhasSubTipoVazio,1);
  assert.throws(()=>calc([{...fixture,AP_PADRONIZADA:"Nulo"}],"chamados"));
  process.stdout.write("OK: validação de Tipo, AP, PCO e contagens\n");
}
if(require.main===module){
  if(process.argv.includes("--self-test"))selfTest();
  else{
    const [f1,f2,outFile]=process.argv.slice(2);
    if(!f1||!f2)throw new Error("Uso: node reconciliar.cjs CHAMADOS.csv OUVIDORIAS.csv [SAIDA.json]");
    const baseline=JSON.parse(fs.readFileSync(path.join(__dirname,"preflight.json"),"utf8"));
    const c=calc(parseCsv(f1),"chamados"),o=calc(parseCsv(f2),"ouvidorias");
    if(c.linhas!==63738||o.linhas!==15322)throw new Error("Quantidade de linhas inesperada na exportação");
    if(c.linhasAPNuloNaOrigem!==2079||o.linhasAPNuloNaOrigem!==487)throw new Error("Cobertura de AP original mudou; reauditar fonte");
    if(c.volume2026AposOutubro!==3570||o.volume2026AposOutubro!==0)throw new Error("Corte de novembro foi alterado");
    const diffs=reconcile(c,o,baseline);
    const result={metadata:{versao:"territorial-test-v1",corte:"Outubro/2026",status:"teste_nao_homologado",origens:{chamados:f1,ouvidorias:f2},geradoEm:new Date().toISOString()},totais:{linhasChamados:c.linhas,linhasOuvidorias:o.linhas,APsNulasRecuperadas:c.linhasAPNuloNaOrigem+o.linhasAPNuloNaOrigem},divergencias:diffs,canal:{chamados:c,ouvidorias:o}};
    fs.writeFileSync(outFile||path.join(__dirname,"resultado-teste.json"),JSON.stringify(result,null,2)+"\n");
    process.stdout.write(JSON.stringify({status:"OK",divergencias:diffs.length,linhas:c.linhas+o.linhas})+"\n");
  }
}
module.exports={calc,reconcile,integer};
