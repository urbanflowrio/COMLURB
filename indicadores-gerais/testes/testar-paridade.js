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

const resultados = [{
  Indicador: indicator, Ano: '2026', Diretoria: 'COMLURB', 'Superint.': '-', 'Gerência': '-',
  Acumulado: '83,7', Jan: '80', Fev: '83,7', Meta: '', Unidade: '%', Sentido: ''
}];
const complemento = [{
  Indicador: indicator, Ano: '2026', Diretoria: 'Comlurb', 'Superint.': '', 'Gerência': '',
  Acumulado: '999', Meta: '85', Unidade: '%', Sentido: '↑', 'Percentual de Atingimento': '98,5%'
}, {
  Indicador: 'Indicador só no complemento', Ano: '2026', Diretoria: 'COMLURB', 'Superint.': '-', 'Gerência': '-', Meta: '10'
}];
const integrada = api.mesclarBases(resultados, complemento);
if (integrada.length !== 2) throw new Error(`Mesclagem: esperadas 2 linhas, obtidas ${integrada.length}`);
const linhaIntegrada = integrada.find(r => context.HUB.format.norm(r.Indicador) === context.HUB.format.norm(indicator));
if (!linhaIntegrada) throw new Error('Mesclagem: indicador principal ausente');
if (linhaIntegrada.Acumulado !== '83,7') throw new Error('Mesclagem: resultado principal foi sobrescrito pelo complemento');
if (linhaIntegrada.Meta !== '85' || linhaIntegrada.Sentido !== '↑') throw new Error('Mesclagem: campos complementares não foram incorporados');
const informado = api.atingimentoExplicito(linhaIntegrada);
if (!informado || Math.abs(informado.valor - 98.5) > 1e-9) throw new Error('Atingimento explícito não foi lido corretamente');
const decimal = api.atingimentoExplicito({'Atingimento':'0,985'});
if (!decimal || Math.abs(decimal.valor - 98.5) > 1e-9) throw new Error('Atingimento decimal não foi convertido corretamente');
console.log('Integração de fontes: 6/6 verificações passaram');

const fonteHoraExtraPrincipal = [
  { Mes:'2026-01-01', Colaborador:'A', Total_Horas_Extras:'10,5', HE_Domingos_Feriados:'2' },
  { Mes:'2026-01-01', Colaborador:'B', Total_Horas_Extras:'4.5', HE_Domingos_Feriados:'1,5' },
  { Mes:'2026-02-01', Colaborador:'A', Total_Horas_Extras:'8', HE_Domingos_Feriados:'3' }
];
const fonteHoraExtraDuplicada = [
  { Mes:'2026-01-01', Total_Horas_Extras:'999', HE_Domingos_Feriados:'999' }
];
const horaConsolidada = api.consolidarHoraExtra([fonteHoraExtraPrincipal, fonteHoraExtraDuplicada]);
const horaTotal = horaConsolidada.find(r => r.Indicador === 'Hora Extra Realizada');
const horaDomFeriado = horaConsolidada.find(r => r.Indicador === 'Horas Domingos e Feriados Realizadas');
if (!horaTotal || horaTotal.Jan !== '15' || horaTotal.Fev !== '8' || horaTotal.Acumulado !== '23') throw new Error('Hora extra: total mensal/acumulado incorreto');
if (!horaDomFeriado || horaDomFeriado.Jan !== '3.5' || horaDomFeriado.Fev !== '3' || horaDomFeriado.Acumulado !== '6.5') throw new Error('Hora extra: domingos e feriados incorreto');
const baseGovernanca = [{ Indicador:'Hora Extra Realizada', Ano:'2026', Diretoria:'COMLURB', 'Superint.':'-', 'Gerência':'-', Meta:'20', Sentido:'↓', Unidade:'h', Jan:'1', Acumulado:'1' }];
const comHora = api.aplicarHoraExtra(baseGovernanca, [fonteHoraExtraPrincipal]);
if (comHora.length !== 2) throw new Error('Hora extra: deveria preservar e incluir os dois indicadores');
const horaMesclada = comHora.find(r => r.Indicador === 'Hora Extra Realizada');
if (horaMesclada.Meta !== '20' || horaMesclada.Sentido !== '↓' || horaMesclada.Jan !== '15') throw new Error('Hora extra: metadados ou resultados não preservados');
if (api.numeroFlexivel('1.234,5') !== 1234.5 || api.numeroFlexivel('1234.5') !== 1234.5) throw new Error('Hora extra: parser numérico flexível falhou');
console.log('Hora extra dinâmica: 8/8 verificações passaram');


const catalogo = api.catalogoIndicadores([
  {Indicador:'Indicador cadastrado fora do registro', Ano:'2026', Diretoria:'COMLURB', Eixo:'Financeiro e Receita'},
  {Indicador:'Índice de Conformidade - PGR', Ano:'2026', Diretoria:'COMLURB', Eixo:'Segurança'},
  {Indicador:'Hora Extra Realizada', Ano:'2026', Diretoria:'COMLURB'},
  {Indicador:'Meta exclusiva do AR', Ano:'2026', Diretoria:'COMLURB', Eixo:'Governança e Atendimento'}
]);
if (catalogo.length !== 4) throw new Error(`Catálogo integral: esperados 4 indicadores, obtidos ${catalogo.length}`);
if (!catalogo.some(x => x.indicador === 'Índice de Conformidade - PGR')) throw new Error('Catálogo integral: PGR foi excluído indevidamente');
if (catalogo.find(x => x.indicador === 'Indicador cadastrado fora do registro').eixo !== 'Receita') throw new Error('Catálogo integral: eixo explícito não foi normalizado');
if (catalogo.find(x => x.indicador === 'Hora Extra Realizada').eixo !== 'Pessoas') throw new Error('Catálogo integral: hora extra não foi classificada');
if (catalogo.find(x => x.indicador === 'Meta exclusiva do AR').eixo !== 'Atendimento') throw new Error('Catálogo integral: meta exclusiva do AR não foi incluída/classificada');
console.log('Catálogo integral: 5/5 verificações passaram');
