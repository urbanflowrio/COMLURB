// Recalcula, a partir dos cubos auditados, cada afirmação do Boletim Executivo 1746 (outubro/2026)
// e confere se o número exibido no HTML corresponde ao valor calculado.
// Uso: node tests/1746-outubro/boletim-rastreabilidade.cjs
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..', '..');
function load(rel) {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx);
  return ctx.window;
}
const C = load('chamados-1746/chamados_cube.js').CHAMADOS_CUBE;
const O = load('ouvidoria/ouvidoria_cube.js').OUVIDORIA_CUBE;
const K = load('1746-timeline/cascade_data.js').TIMELINE1746_CASCADE;
const html = fs.readFileSync(path.join(ROOT, '1746-resumo-executivo/index.html'), 'utf8');
const text = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<script[\s\S]*?<\/script>/g, '')
  .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

const int = n => Math.abs(n).toLocaleString('pt-BR');
const sig = n => (n < 0 ? '−' : '+') + int(n);
const pct = (x, d = 1) => (x < 0 ? '−' : '+') + Math.abs(x * 100).toFixed(d).replace('.', ',') + '%';
const pctAbs = (x, d = 1) => Math.abs(x * 100).toFixed(d).replace('.', ',') + '%';

let fail = 0, ok = 0;
function check(id, desc, expected) {
  const list = Array.isArray(expected) ? expected : [expected];
  const missing = list.filter(e => !text.includes(e));
  if (missing.length) { fail++; console.log(`FALHA ${id} ${desc}: não encontrado no HTML -> ${missing.join(' | ')}`); }
  else { ok++; console.log(`ok    ${id} ${desc}: ${list.join(' | ')}`); }
}
function assert(id, desc, cond, detail) {
  if (cond) { ok++; console.log(`ok    ${id} ${desc}${detail ? ': ' + detail : ''}`); }
  else { fail++; console.log(`FALHA ${id} ${desc}${detail ? ': ' + detail : ''}`); }
}

const cOut = C.periods.outubro.all, oOut = O.periods.outubro.all;
const cAc = C.periods.acumulado.all, oAc = O.periods.acumulado.all;

// A1, A2: resultado do mês
check('A1', 'Chamados out/2025 e out/2026', [int(cOut.total2025), int(cOut.total2026), pct(cOut.var), int(cOut.dif) + ' a mais']);
check('A2', 'Ouvidorias operacionais out/2025 e out/2026', [int(oOut.total2025), int(oOut.total2026), pct(oOut.var), int(oOut.dif) + ' a menos']);
// A3: acumulado
check('A3', 'Acumulado janeiro a outubro', [pct(cAc.var), pct(oAc.var)]);
assert('A3', 'Acumulado cobre 10 meses', cAc.mensal.length === 10 && oAc.mensal.length === 10);

// A4: decomposição por serviço
const svc = (arr, n) => arr.children.find(r => r.nome === n);
const cNamed = ['LIMPEZA', 'COLETA DOMICILIAR', 'REMOÇÃO GRATUITA', 'MANEJO ARBÓREO'];
const cDemais = cOut.dif - cNamed.reduce((s, n) => s + svc(cOut, n).dif, 0);
check('A4', 'Decomposição de chamados', [...cNamed.map(n => sig(svc(cOut, n).dif)), sig(cDemais), sig(cOut.dif)]);
const oNamed = ['REMOÇÃO GRATUITA', 'MANEJO ARBÓREO', 'LIMPEZA'];
const oDemais = oOut.dif - oNamed.reduce((s, n) => s + svc(oOut, n).dif, 0);
check('A4', 'Decomposição de ouvidorias', [...oNamed.map(n => sig(svc(oOut, n).dif)), sig(oDemais), sig(oOut.dif)]);
assert('A4', 'Soma dos serviços fecha o total (chamados)', cOut.children.reduce((s, r) => s + r.dif, 0) === cOut.dif);
assert('A4', 'Soma dos serviços fecha o total (ouvidorias)', oOut.children.reduce((s, r) => s + r.dif, 0) === oOut.dif);
check('A4', 'Limpeza acima do aumento total', '2.581 chamados a mais');
assert('A4', 'Limpeza > aumento total', svc(cOut, 'LIMPEZA').dif > cOut.dif);

// A5: base atípica de Remoção Gratuita
const rg = O.periods.acumulado.byTipo['REMOÇÃO GRATUITA'].mensal;
const set = rg.find(r => r.mes === 'Setembro'), out = rg.find(r => r.mes === 'Outubro');
check('A5', 'Remoção Gratuita out/2025, set e out/2026', [int(out.v2025), int(set.v2026), int(out.v2026)]);
assert('A5', 'Out/2025 mais que o triplo de set/2025', out.v2025 > 3 * set.v2025, `${out.v2025} x ${set.v2025}`);
// A6: queda sem Remoção Gratuita
const rgo = svc(oOut, 'REMOÇÃO GRATUITA');
const semRG = ((oOut.total2026 - rgo.v2026) / (oOut.total2025 - rgo.v2025)) - 1;
check('A6', 'Redução sem Remoção Gratuita', pctAbs(semRG));

// A7: subtipos de Limpeza
const lch = C.periods.outubro.byTipo['LIMPEZA'].children;
const tres = ['REMOÇÃO DE RESÍDUOS NO LOGRADOURO', 'CAPINA EM LOGRADOURO', 'VARRIÇÃO DE LOGRADOURO']
  .reduce((s, n) => s + lch.find(r => r.nome === n).dif, 0);
check('A7', 'Remoção de resíduos, capina e varrição', int(tres));

// A8: grandes serviços (>= 5% dos chamados de out/2025)
const grandes = cOut.children.filter(r => r.v2025 / cOut.total2025 >= 0.05);
const partGrandes = grandes.reduce((s, r) => s + r.v2025, 0) / cOut.total2025;
const ambos = grandes.filter(r => r.dif > 0 && (svc(oOut, r.nome) || { dif: 0 }).dif > 0).map(r => r.nome);
assert('A8', 'Cinco grandes serviços', grandes.length === 5, grandes.map(r => r.nome).join(', '));
check('A8', 'Participação dos grandes serviços', pctAbs(partGrandes));
assert('A8', 'Limpeza é o único que cresceu nos dois canais', ambos.length === 1 && ambos[0] === 'LIMPEZA', ambos.join(', '));

// A9: AP5 concentrada, AP3 distribuída
const ap = n => cOut.ap.find(r => r.nome === n);
check('A9', 'AP5 + AP3 no aumento', int(ap('AP5').dif + ap('AP3').dif));
const cas = K.full['Outubro/2026'];
const bairros = {};
for (const S of Object.values(cas)) for (const T of Object.values(S.subtipos || {})) for (const b of T.bairros || []) {
  const k = b.ap + '|' + b.nome; bairros[k] = bairros[k] || { ap: b.ap, nome: b.nome, c25: 0, c26: 0, o25: 0, o26: 0 };
  bairros[k].c25 += b.c2025; bairros[k].c26 += b.c2026; bairros[k].o25 += b.o2025; bairros[k].o26 += b.o2026;
}
const doAP = a => Object.values(bairros).filter(b => b.ap === a);
const ap5 = doAP('AP5'), ap3 = doAP('AP3');
const dif = b => b.c26 - b.c25;
const ap5Tot = ap5.reduce((s, b) => s + dif(b), 0), ap3Tot = ap3.reduce((s, b) => s + dif(b), 0);
assert('A9', 'Cascata concilia com o cubo por AP', ap5Tot === ap('AP5').dif && ap3Tot === ap('AP3').dif, `${ap5Tot}/${ap('AP5').dif} ${ap3Tot}/${ap('AP3').dif}`);
const cgBg = ap5.filter(b => ['CAMPO GRANDE', 'BANGU'].includes(b.nome)).reduce((s, b) => s + dif(b), 0);
check('A9', 'AP5: dois bairros no aumento', Math.round(cgBg / ap5Tot * 100) + '%');
const ap3Max = Math.max(...ap3.map(dif));
assert('A9', 'AP3: nenhum bairro passa de 11%', ap3Max / ap3Tot <= 0.11, (ap3Max / ap3Tot * 100).toFixed(2) + '%');
check('A9', 'AP3: bairros com alta', `${ap3.filter(b => dif(b) > 0).length} dos ${ap3.length} bairros`);

// A10: bairros destacados e gerências
const bc = n => cOut.bairros.find(r => r.nome === n), bo = n => oOut.bairros.find(r => r.nome === n);
const topC = [...cOut.bairros].sort((a, b) => b.dif - a.dif).slice(0, 2).map(r => r.nome).sort();
const topO = [...oOut.bairros].sort((a, b) => b.dif - a.dif).slice(0, 2).map(r => r.nome).sort();
assert('A10', 'Critério: dois maiores aumentos coincidem', JSON.stringify(topC) === JSON.stringify(['BANGU', 'CAMPO GRANDE']) && JSON.stringify(topO) === JSON.stringify(topC), topC + ' / ' + topO);
for (const [nome, ger] of [['CAMPO GRANDE', 'OG18G'], ['BANGU', 'OG17B']]) {
  const c = bc(nome), o = bo(nome);
  check('A10', nome + ' chamados e ouvidorias', [`${int(c.v2025)} → ${int(c.v2026)}`, pct(c.var), `${int(o.v2025)} → ${int(o.v2026)}`, pct(o.var)]);
  const lc = C.periods.outubro.byTipo['LIMPEZA'].bairros.find(r => r.nome === nome);
  const lo = O.periods.outubro.byTipo['LIMPEZA'].bairros.find(r => r.nome === nome);
  check('A10', nome + ' participação de Limpeza', [`${int(lc.dif)} dos ${int(c.dif)} chamados`, `${int(lo.dif)} das ${int(o.dif)} ouvidorias`]);
  const tot = Object.values(bairros).find(b => b.nome === nome);
  assert('A10', nome + ' cascata concilia com o cubo', tot.c25 === c.v2025 && tot.c26 === c.v2026 && tot.o25 === o.v2025 && tot.o26 === o.v2026);
  let gc = 0, go = 0;
  for (const S of Object.values(cas)) for (const T of Object.values(S.subtipos || {})) for (const b of T.bairros || [])
    if (b.nome === nome && b.gerencia === ger) { gc += b.c2026; go += b.o2026; }
  check('A10', `${ger} dentro de ${nome}`, `${ger} registrou ${int(gc)} chamados e ${int(go)} ouvidorias`);
  assert('A10', `${ger} contida no bairro`, gc <= c.v2026 && go <= o.v2026);
}
const soma = bo('CAMPO GRANDE').dif + bo('BANGU').dif;
check('A10', 'Ouvidorias a mais nos dois bairros', `${int(soma)} ouvidorias a mais`);

// Papeleira
const pap = svc(cOut, 'PAPELEIRA');
assert('M1', 'Papeleira: 166 em out/2025 e zero em 2026', pap.v2025 === 166 && pap.v2026 === 0);

// Redação
assert('R1', 'Sem travessões no texto', !/[–—]/.test(text));

console.log(`\n${ok} verificações aprovadas, ${fail} falhas.`);
process.exit(fail ? 1 : 0);
