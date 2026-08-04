const fs = require('fs');
const vm = require('vm');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const context = { console, window: { GOVERNANCA_DISABLE_AUTO_INIT: true, GOVERNANCA_CONFIG: { diretoriaDefault: 'COMLURB', anoPreferencial: '2026', limiteAtencao: .10 } } };
context.window.window = context.window;
context.window.HUB = {
  format: {
    clean: v => String(v ?? '').trim(),
    norm: v => String(v ?? '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').toUpperCase(),
    esc: v => String(v ?? '')
  }
};
context.HUB = context.window.HUB;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'assets/js/indicadores-registro.js'), 'utf8'), context);
context.window.HUB = context.HUB;
vm.runInContext(fs.readFileSync(path.join(root, 'indicadores-gerais/app.js'), 'utf8'), context);
const api = context.window.GOVERNANCA_TEST_API;

let ok = 0, total = 0;
function check(nome, condicao) {
  total++;
  if (condicao) { ok++; } else { console.log('FALHOU:', nome); }
}

function kpi(over) {
  return Object.assign({
    indicador: 'Indicador X', eixo: 'Operação',
    status: { cor: 'green', label: 'dentro da meta' },
    meta: 100, unidade: '%', acumulado: 100, sentido: '↑',
    variacao: null
  }, over);
}

// --- agruparPorTema: estrutural entra naturalmente no grupo do eixo ---
const kpisEstruturais = [
  kpi({ indicador: 'Absenteísmo Gerenciável', eixo: 'Pessoas', status: { cor: 'red' } }),
  kpi({ indicador: 'Chamados 1746', eixo: 'Atendimento', status: { cor: 'orange' } }),
  kpi({ indicador: 'Utilização de Frota', eixo: 'Operação', status: { cor: 'green' } }),
  kpi({ indicador: 'Reciclagem', eixo: 'Sustentabilidade', status: { cor: '' } })
];
const grupos = api.agruparPorTema(kpisEstruturais);
check('Pessoas e Segurança recebe o crítico de absenteísmo', grupos.get('pessoas_seguranca').red === 1);
check('Atendimento ao Cidadão recebe a atenção de 1746', grupos.get('atendimento').orange === 1);
check('Sustentabilidade sem meta é contabilizada', grupos.get('sustentabilidade').sem === 1);
check('Nenhuma categoria nova de agenda permanente foi criada (só 6 grupos)', grupos.size === 6);

// --- leituraExecutivaTexto: até 3 frases, sem repetir números do topo ---
const resumo = api.resumoStatus(kpisEstruturais);
const texto = api.leituraExecutivaTexto(kpisEstruturais, resumo);
check('Leitura executiva tem no máximo 3 frases', texto.split('.').filter(Boolean).length <= 3);
check('Leitura executiva menciona o grupo do crítico concentrado', texto.includes('Pessoas e Segurança'));
check('Leitura executiva não repete a contagem bruta do heroStats (ex: "1 crítico")', !/\b1 crítico\b/.test(texto));

// --- referenciaResumida: meta presente vs ausente ---
check('Com meta, mostra "meta <valor>"', api.referenciaResumida(kpi({ meta: 95, unidade: '%' })) === 'meta 95%');
check('Sem meta, mostra texto neutro', api.referenciaResumida(kpi({ meta: null })) === 'sem meta cadastrada');

// --- alertasOrdenados: indicador estrutural crítico aparece nos alertas (sem exclusão) ---
const kpisAlerta = [
  kpi({ indicador: 'Absenteísmo Gerenciável', eixo: 'Pessoas', status: { cor: 'red' }, meta: 5, acumulado: 8 }),
  kpi({ indicador: 'IPL Sustentabilidade', eixo: 'Sustentabilidade', status: { cor: 'orange' }, meta: 80, acumulado: 75 }),
  kpi({ indicador: 'Dentro da Meta', eixo: 'Operação', status: { cor: 'green' } })
];
const alertas = api.alertasOrdenados(kpisAlerta);
check('Indicador estrutural crítico aparece na Zona de Alertas', alertas.some(k => k.indicador === 'Absenteísmo Gerenciável'));
check('Indicador dentro da meta não aparece nos alertas', !alertas.some(k => k.indicador === 'Dentro da Meta'));
check('Crítico vem antes de atenção', alertas[0].status.cor === 'red');

console.log(`Apresentação V15: ${ok}/${total} verificações passaram`);
process.exit(ok === total ? 0 : 1);
