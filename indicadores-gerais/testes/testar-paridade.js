const fs = require('fs');
const vm = require('vm');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const context = { console, window: { GOVERNANCA_DISABLE_AUTO_INIT: true, GOVERNANCA_CONFIG: { diretoriaDefault:'COMLURB', anoPreferencial:'2026', limiteAtencao:.10 } } };
context.window.window = context.window;
context.window.HUB = { format: {
  clean:v=>String(v??'').trim(),
  norm:v=>String(v??'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').toUpperCase(),
  esc:v=>String(v??'')
}};
context.HUB = context.window.HUB;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'assets/js/indicadores-registro.js'),'utf8'), context);
context.window.HUB = context.HUB;
vm.runInContext(fs.readFileSync(path.join(root,'indicadores-gerais/app.js'),'utf8'), context);
const api = context.window.GOVERNANCA_TEST_API;

const indicator='Índice Padrão de Limpeza - IPL';
const base={Indicador:indicator,Ano:'2026',Acumulado:'83,7',Meta:'85',Unidade:'%',Sentido:'↑',Jan:'80',Fev:'83,7'};
const cases=[
  ['COMLURB exato e hífen',{...base,Diretoria:'COMLURB','Superint.':'-','Gerência':'-'},'COMLURB'],
  ['Comlurb caixa mista',{...base,Diretoria:'Comlurb','Superint.':'-','Gerência':'-'},'COMLURB'],
  ['comlurb minúsculo',{...base,Diretoria:'comlurb','Superint.':'-','Gerência':'-'},'COMLURB'],
  ['consolidado vazio',{...base,Diretoria:'COMLURB','Superint.':'','Gerência':''},'COMLURB'],
  ['diretoria sem consolidado',{...base,Diretoria:'DSU','Superint.':'SUP','Gerência':'GER'},'DSU'],
  ['fallback COMLURB',{...base,Diretoria:'COMLURB','Superint.':'-','Gerência':'-'},'DTE'],
  ['fallback outro consolidado',{...base,Diretoria:'DAF','Superint.':'-','Gerência':'-'},'DTE'],
  ['acentuação de diretoria',{...base,Diretoria:'Diretória Técnica','Superint.':'-','Gerência':'-'},'Diretoria Tecnica'],
  ['meta zero',{...base,Diretoria:'COMLURB','Superint.':'-','Gerência':'-',Meta:'0',Acumulado:'1'},'COMLURB'],
  ['sem meta',{...base,Diretoria:'COMLURB','Superint.':'-','Gerência':'-',Meta:'-'},'COMLURB']
];
let passed=0;
for(const [name,row,dir] of cases){
  const resolved=api.resolverLinha(indicator,dir,'2026',[row]);
  const result=api.avaliarComParidade(indicator,dir,'2026',[row]);
  if(!resolved || !result.row) throw new Error(`${name}: linha não resolvida`);
  const expected=context.HUB.indicadores.calcularStatus(context.HUB.indicadores.parseNumeroBR(row.Acumulado),context.HUB.indicadores.parseNumeroBR(row.Meta),row.Sentido,.10);
  if(result.status.cor!==expected.cor) throw new Error(`${name}: ${result.status.cor} != ${expected.cor}`);
  passed++;
}
const nonexistent=api.avaliarComParidade('Indicador inexistente','COMLURB','2026',cases.map(c=>c[1]));
if(nonexistent.row!==null || nonexistent.status.label!=='sem dado') throw new Error('Indicador inexistente não tratado');
passed++;
const duplicated=[{...base,Diretoria:'DSU','Superint.':'-','Gerência':'-',Acumulado:'90'},{...base,Diretoria:'COMLURB','Superint.':'-','Gerência':'-',Acumulado:'80'}];
if(api.resolverLinha(indicator,'DSU','2026',duplicated).Acumulado!=='90') throw new Error('Preferência da diretoria falhou');
passed++;
console.log(`Paridade: ${passed}/${passed} cenários passaram`);
