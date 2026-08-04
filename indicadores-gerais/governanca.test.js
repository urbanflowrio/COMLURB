// Testes da V16 — Indicadores Gerais (Governança Corporativa)
// Executar com: node governanca.test.js
//
// Não usa framework externo (Node puro + assert), consistente com o padrão
// de execução via Node.js já usado nas demais suítes do HUB. Carrega o
// app.js real dentro de um sandbox (vm) com stubs mínimos de window/document
// e HUB, com GOVERNANCA_DISABLE_AUTO_INIT ligado para não disparar init()
// nem exigir DOM completo — os testes exercitam apenas as funções puras
// expostas via window.GOVERNANCA_TEST_API.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function carregarApp() {
  const codigo = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');

  const sandbox = {
    console,
    document: {
      getElementById: () => null,
      querySelectorAll: () => [],
      addEventListener: () => {}
    },
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    HUB: {
      indicadores: {
        EIXOS: ['Pessoas', 'Segurança', 'Operação', 'Atendimento', 'Sustentabilidade', 'Receita'],
        MESES: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
        parseNumeroBR: v => (v === undefined || v === null || v === '' ? null : Number(String(v).replace(',', '.'))),
        avaliarIndicador: () => ({ row: null, status: {}, acumulado: null, meta: null, sentido: '', unidade: '' }),
        todosOsCards: () => []
      },
      format: {
        clean: v => (v === undefined || v === null ? '' : String(v).trim()),
        norm: v => (v === undefined || v === null ? '' : String(v).trim().toUpperCase()),
        esc: v => String(v === undefined || v === null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
      }
    },
    window: {}
  };
  sandbox.window.GOVERNANCA_CONFIG = { diretoriaDefault: 'COMLURB', anoPreferencial: '2026', limiteAtencao: 0.9, horaExtraSources: [] };
  sandbox.window.GOVERNANCA_DISABLE_AUTO_INIT = true;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(codigo, sandbox, { filename: 'app.js' });
  return sandbox.window.GOVERNANCA_TEST_API;
}

const API = carregarApp();
let falhas = 0;
function teste(nome, fn) {
  try { fn(); console.log(`OK   ${nome}`); }
  catch (e) { falhas++; console.log(`FAIL ${nome}\n     ${e.message}`); }
}

// Fábrica de KPI sintético para os testes. Só preenche o que as funções
// sob teste realmente leem: eixo, status.cor e variacao.favoravel.
function kpi(eixo, cor, favoravel) {
  return { indicador: `ind-${Math.random().toString(36).slice(2, 7)}`, eixo, status: { cor }, variacao: favoravel === undefined ? null : { favoravel } };
}

// ---------------------------------------------------------------
// 1. críticos + atenção como acompanhamento (sem meta nunca entra)
// ---------------------------------------------------------------
teste('acompanhamento = criticos + atencao, sem-meta excluído', () => {
  const kpis = [
    kpi('Atendimento', 'red'), kpi('Atendimento', 'red'),
    kpi('Atendimento', 'orange'),
    kpi('Atendimento', 'green'), kpi('Atendimento', 'green'), kpi('Atendimento', 'green'),
    kpi('Atendimento', '') // sem meta — não deve contar como acompanhamento
  ];
  const grupos = API.contarPorGrupo(kpis);
  const g = grupos.get('atendimento');
  assert.strictEqual(g.criticos, 2);
  assert.strictEqual(g.atencao, 1);
  assert.strictEqual(g.acompanhamento, 3, 'acompanhamento deve ser criticos+atencao, não incluir sem meta');
  assert.strictEqual(g.semMeta, 1);
  assert.strictEqual(g.total, 7);
});

// ---------------------------------------------------------------
// 2. sem meta tratado separadamente na frase (nunca dentro de "demandam acompanhamento")
// ---------------------------------------------------------------
teste('sem meta aparece em campo separado do quantitativo de acompanhamento', () => {
  const kpis = [
    kpi('Operação', 'green'),
    kpi('Operação', ''), kpi('Operação', '')
  ];
  const grupos = API.contarPorGrupo(kpis);
  const g = grupos.get('operacao');
  const resumo = API.resumoGrupo(g);
  assert.strictEqual(resumo.quantitativo, '0 de 3 indicadores demandam acompanhamento.');
  assert.strictEqual(resumo.semMetaTexto, '2 indicadores permanecem sem meta definida.');
});

teste('exemplo do enunciado: 2 de 6 indicadores + 1 sem meta', () => {
  const kpis = [
    kpi('Operação', 'red'), kpi('Operação', 'orange'),
    kpi('Operação', 'green'), kpi('Operação', 'green'), kpi('Operação', 'green'),
    kpi('Operação', '')
  ];
  const grupos = API.contarPorGrupo(kpis);
  const g = grupos.get('operacao');
  const resumo = API.resumoGrupo(g);
  assert.strictEqual(resumo.quantitativo, '2 de 6 indicadores demandam acompanhamento.');
  assert.strictEqual(resumo.semMetaTexto, '1 indicador permanece sem meta definida.');
});

// ---------------------------------------------------------------
// 2b. leitura de grupos sem meta (ajuste aprovado após a V16)
// ---------------------------------------------------------------
teste('todos avaliáveis e dentro da meta: leitura de bom desempenho', () => {
  const kpis = [kpi('Operação', 'green'), kpi('Operação', 'green')];
  const g = API.contarPorGrupo(kpis).get('operacao');
  assert.strictEqual(API.resumoGrupo(g).situacao, 'Indicadores avaliados dentro da meta no período.');
});

teste('todos sem meta: leitura neutra de pendência de classificação', () => {
  const kpis = [kpi('Operação', ''), kpi('Operação', '')];
  const g = API.contarPorGrupo(kpis).get('operacao');
  assert.strictEqual(API.resumoGrupo(g).situacao, 'Indicadores sem meta formal para classificação no período.');
});

teste('mistura de dentro da meta e sem meta: leitura intermediária', () => {
  const kpis = [kpi('Operação', 'green'), kpi('Operação', '')];
  const g = API.contarPorGrupo(kpis).get('operacao');
  assert.strictEqual(API.resumoGrupo(g).situacao, 'Sem desvios classificados, com parte dos indicadores ainda sem meta.');
});

teste('acompanhamento > 0 mantém a leitura de acompanhamento (não usa as frases de sem meta)', () => {
  const kpis = [kpi('Operação', 'red', false), kpi('Operação', '')];
  const g = API.contarPorGrupo(kpis).get('operacao');
  assert.strictEqual(API.resumoGrupo(g).situacao, 'Situação em atenção, com piora recente em parte dos indicadores.');
});

// ---------------------------------------------------------------
// 3. ausência de repetição entre Situação Corporativa e Síntese Executiva
// ---------------------------------------------------------------
teste('sintese não repete a piora do único grupo já citado na abertura', () => {
  const kpis = [
    kpi('Atendimento', 'red', false), kpi('Atendimento', 'red', false), kpi('Atendimento', 'orange', false),
    kpi('Operação', 'green'), kpi('Operação', 'green')
  ];
  const situacao = API.gerarSituacaoCorporativa(kpis);
  assert.ok(situacao.subtext.includes('Atendimento ao Cidadão'));
  assert.ok(situacao.subtext.includes('piora'));

  const sintese = API.gerarSinteseExecutiva(kpis, situacao);
  const repeteMesmoFato = sintese.some(l => l.includes('Atendimento ao Cidadão') && l.includes('piora'));
  assert.strictEqual(repeteMesmoFato, false, 'a sintese não deve repetir "Atendimento ao Cidadão ... piora" já dito na abertura');
});

teste('sintese pode citar piora de um grupo que NÃO foi nomeado na abertura', () => {
  // Concentração principal em Atendimento (2 desvios); Segurança tem só 1
  // desvio mas com piora — não é o grupo citado na abertura, então pode aparecer.
  const kpis = [
    kpi('Atendimento', 'red', false), kpi('Atendimento', 'orange', false),
    kpi('Segurança', 'orange', false)
  ];
  const situacao = API.gerarSituacaoCorporativa(kpis);
  assert.ok(situacao.subtext.includes('Atendimento ao Cidadão'));
  assert.ok(!situacao.subtext.includes('Segurança') && !situacao.subtext.includes('Pessoas e Segurança'));

  const sintese = API.gerarSinteseExecutiva(kpis, situacao);
  const citaSeguranca = sintese.some(l => l.includes('Pessoas e Segurança') && l.includes('piora'));
  assert.strictEqual(citaSeguranca, true, 'grupo não citado na abertura pode aparecer na sintese');
});

// ---------------------------------------------------------------
// 3b. vocabulário do subtexto (ajuste aprovado após a V16)
// ---------------------------------------------------------------
teste('com crítico presente, subtexto usa "desvios críticos"', () => {
  const kpis = [kpi('Atendimento', 'red', false), kpi('Operação', 'green')];
  const situacao = API.gerarSituacaoCorporativa(kpis);
  assert.ok(situacao.subtext.includes('desvios críticos'));
  assert.ok(!situacao.subtext.includes('pontos de acompanhamento'));
});

teste('só com atenção (sem crítico), subtexto usa "pontos de acompanhamento"', () => {
  const kpis = [kpi('Atendimento', 'orange', false), kpi('Operação', 'green')];
  const situacao = API.gerarSituacaoCorporativa(kpis);
  assert.ok(situacao.subtext.includes('pontos de acompanhamento'));
  assert.ok(!situacao.subtext.includes('desvios críticos'));
});

teste('sem crítico, sem atenção e sem indicador pendente: pode afirmar dentro da meta', () => {
  const kpis = [kpi('Operação', 'green'), kpi('Atendimento', 'green')];
  const situacao = API.gerarSituacaoCorporativa(kpis);
  assert.strictEqual(situacao.subtext, 'Os indicadores acompanhados estão dentro da meta no período.');
});

teste('sem crítico, sem atenção mas com indicador sem meta: não afirma bom desempenho', () => {
  const kpis = [kpi('Operação', 'green'), kpi('Atendimento', '')];
  const situacao = API.gerarSituacaoCorporativa(kpis);
  assert.ok(!situacao.subtext.includes('dentro da meta'), 'não deve elogiar desempenho geral havendo indicador sem meta');
  assert.ok(situacao.subtext.includes('sem meta definida'));
});

// ---------------------------------------------------------------
// 4. fallback "Outros indicadores"
// ---------------------------------------------------------------
teste('bloco "Outros indicadores" aparece quando há indicador sem eixo classificado', () => {
  const kpis = [kpi('Operação', 'green'), kpi('Outros', 'orange', false)];
  const blocos = API.blocosVisaoEstrategica(kpis);
  const outros = blocos.find(b => b.grupo === 'outros');
  assert.ok(outros, 'bloco outros deve existir');
  assert.strictEqual(outros.label, 'Outros indicadores');
  assert.strictEqual(outros.total, 1, 'nenhum indicador de Outros pode ficar de fora da contagem');
});

teste('bloco "Outros indicadores" não aparece quando não há indicador classificado como Outros', () => {
  const kpis = [kpi('Operação', 'green'), kpi('Atendimento', 'red', false)];
  const blocos = API.blocosVisaoEstrategica(kpis);
  const outros = blocos.find(b => b.grupo === 'outros');
  assert.strictEqual(outros, undefined);
});

// ---------------------------------------------------------------
// 5. ordem institucional fixa (não ordenar por gravidade)
// ---------------------------------------------------------------
teste('Visão Estratégica mantém ordem institucional mesmo com Financeiro mais grave', () => {
  const kpis = [
    kpi('Pessoas', 'green'),
    kpi('Receita', 'red', false), kpi('Receita', 'red', false), kpi('Receita', 'red', false)
  ];
  const blocos = API.blocosVisaoEstrategica(kpis);
  const ordemLabels = blocos.map(b => b.grupo);
  const indicePessoas = ordemLabels.indexOf('pessoas_seguranca');
  const indiceReceita = ordemLabels.indexOf('financeiro_receita');
  assert.ok(indicePessoas !== -1 && indiceReceita !== -1);
  assert.ok(indicePessoas < indiceReceita, 'Pessoas e Segurança deve vir antes de Financeiro e Receita, independente da gravidade');
  assert.deepStrictEqual(ordemLabels, API.GRUPO_ORDEM.filter(g => ordemLabels.includes(g)), 'ordem deve seguir GRUPO_ORDEM sem reordenar por críticos/atenção');
});

teste('grupos com total 0 não aparecem, mas não alteram a ordem relativa dos demais', () => {
  const kpis = [kpi('Pessoas', 'green'), kpi('Receita', 'orange', false)];
  const blocos = API.blocosVisaoEstrategica(kpis);
  const ordemLabels = blocos.map(b => b.grupo).join(',');
  assert.strictEqual(ordemLabels, 'pessoas_seguranca,financeiro_receita');
});

// ---------------------------------------------------------------
console.log(`\n${falhas === 0 ? 'Todos os testes passaram.' : falhas + ' teste(s) falharam.'}`);
process.exitCode = falhas === 0 ? 0 : 1;
