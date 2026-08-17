(function () {
  'use strict';

  const CONFIG = window.GOVERNANCA_CONFIG;
  const EIXO_LABEL = {
    Pessoas: 'Pessoas', Segurança: 'Segurança do Trabalho', Operação: 'Operação',
    Atendimento: 'Governança e Atendimento ao Cidadão', Sustentabilidade: 'Sustentabilidade', Receita: 'Financeiro e Receita'
  };
  const EIXO_DESC = {
    Pessoas: 'Quadro, disponibilidade e ocorrências funcionais', Segurança: 'Acidentes, conformidade e prevenção',
    Operação: 'Execução operacional e padrão de limpeza', Atendimento: '1746, Ouvidoria, prazos e resposta ao cidadão',
    Sustentabilidade: 'Reciclagem, desvio de aterro e indicadores ambientais', Receita: 'Arrecadação e eficiência financeira',
    Outros: 'Indicadores gerais sem eixo cadastrado'
  };
  const EIXO_ORDEM = HUB.indicadores.EIXOS.concat(['Outros']);
  const PRIORIDADE_STATUS = { red: 0, orange: 1, green: 2, '': 3 };
  const FILTER_STORAGE_KEY = 'governanca-corporativa-filtros';
  const ANO_FIXO = '2026';

  // Grupos executivos derivados diretamente dos eixos já existentes (EIXO_LABEL acima).
  // Nenhuma classificação por palavra-chave nova: Operação permanece único (frota, capacidade
  // operacional e performance dos serviços não são separados artificialmente).
  const GRUPO_EIXO = {
    Pessoas: 'pessoas_seguranca',
    Segurança: 'pessoas_seguranca',
    Operação: 'operacao',
    Atendimento: 'atendimento',
    Sustentabilidade: 'sustentabilidade',
    Receita: 'financeiro_receita',
    Outros: 'outros'
  };
  const GRUPO_LABEL = {
    pessoas_seguranca: 'Pessoas e Segurança',
    operacao: 'Operação',
    atendimento: 'Atendimento ao Cidadão',
    sustentabilidade: 'Sustentabilidade',
    financeiro_receita: 'Financeiro e Receita',
    outros: 'Outros indicadores'
  };
  const GRUPO_ORDEM = ['pessoas_seguranca', 'operacao', 'atendimento', 'sustentabilidade', 'financeiro_receita', 'outros'];

  let DATA = [];
  let KPIDATA = [];
  let anoSelecionado = '2026';
  let anosDisponiveis = ['2026'];
  let diretoriaSelecionada = CONFIG.diretoriaDefault;
  let buscaAtual = '';
  let statusAtual = 'todos';
  let INDICADORES_AR = new Set();

  function clean(v) { return HUB.format.clean(v); }
  function norm(v) { return HUB.format.norm(v); }
  function esc(v) { return HUB.format.esc(v); }

  function normalizarHeader(k) {
    const h = clean(k);
    const mapa = { Superint: 'Superint.', Superintendência: 'Superint.', Superintendencia: 'Superint.', Gerencia: 'Gerência', 'Diretoria ': 'Diretoria', 'Indicador ': 'Indicador', 'Ano ': 'Ano' };
    return mapa[h] || h;
  }

  function normalizarRow(row) {
    const out = {};
    Object.keys(row || {}).forEach(k => { out[normalizarHeader(k)] = clean(row[k]); });
    return out;
  }

  function eixoDaLinha(row) {
    if (!row) return '';
    const aliases = ['EIXO', 'EIXO ESTRATEGICO', 'EIXO ESTRATÉGICO', 'CATEGORIA', 'DIMENSAO', 'DIMENSÃO'];
    const key = Object.keys(row).find(k => aliases.includes(norm(k))) || Object.keys(row).find(k => norm(k).includes('EIXO'));
    return key ? clean(row[key]) : '';
  }

  function normalizarEixo(valor) {
    const n = norm(valor);
    if (!n) return '';
    if (n.includes('PESSO')) return 'Pessoas';
    if (n.includes('SEGUR')) return 'Segurança';
    if (n.includes('OPER')) return 'Operação';
    if (n.includes('ATEND') || n.includes('GOVERN') || n.includes('CIDADA')) return 'Atendimento';
    if (n.includes('SUSTENT') || n.includes('AMBIENT') || n.includes('RECICL')) return 'Sustentabilidade';
    if (n.includes('RECEITA') || n.includes('FINANC')) return 'Receita';
    return '';
  }

  function eixoPorPalavras(indicador) {
    const n = norm(indicador);
    if (/ACIDENT|PGR|SEGURAN|AFASTAMENTO|ABSENTEIS/.test(n)) return 'Segurança';
    if (/HORA EXTRA|PESSOAL|SERVIDOR|EMPREGAD|COLABORADOR|FALTA/.test(n)) return 'Pessoas';
    if (/1746|OUVIDORIA|ATENDIMENTO|CIDADAO|PRAZO/.test(n)) return 'Atendimento';
    if (/RECICL|ATERRO|RESIDU|CO2|CARBON|SUSTENT/.test(n)) return 'Sustentabilidade';
    if (/RECEITA|ARRECAD|FATUR|CUSTO|FINANC/.test(n)) return 'Receita';
    if (/IPL|LIMPEZA|COLETA|VARRICAO|VARRIÇÃO|OPERAC|CTR/.test(n)) return 'Operação';
    return 'Outros';
  }

  function catalogoIndicadores(data = DATA) {
    const registro = new Map(HUB.indicadores.todosOsCards().map(item => [norm(item.indicador), item]));
    const catalogo = new Map();
    (data || []).forEach(row => {
      const indicador = clean(row && row.Indicador);
      if (!indicador) return;
      const chave = norm(indicador);
      if (INDICADORES_AR.has(chave)) return;
      const cadastrado = registro.get(chave);
      const eixo = normalizarEixo(eixoDaLinha(row)) || (cadastrado && cadastrado.eixo) || eixoPorPalavras(indicador);
      if (!catalogo.has(chave)) catalogo.set(chave, { indicador, eixo });
      else if (catalogo.get(chave).eixo === 'Outros' && eixo !== 'Outros') catalogo.get(chave).eixo = eixo;
    });
    return Array.from(catalogo.values()).sort((a, b) => {
      const ea = EIXO_ORDEM.indexOf(a.eixo), eb = EIXO_ORDEM.indexOf(b.eixo);
      return (ea - eb) || a.indicador.localeCompare(b.indicador, 'pt-BR');
    });
  }


  function valorPreenchido(v) { return v !== undefined && v !== null && clean(v) !== ''; }

  function chaveBase(row) {
    return [norm(row && row.Indicador), norm(row && row.Ano), norm(row && row.Diretoria)].join('¦');
  }

  function chaveCompleta(row) {
    return [chaveBase(row), norm(row && row['Superint.']), norm(row && row['Gerência'])].join('¦');
  }

  function mesclarBases(resultados, complemento) {
    const baseResultados = (resultados || []).map(normalizarRow).filter(r => clean(r.Indicador));
    const baseComplemento = (complemento || []).map(normalizarRow).filter(r => clean(r.Indicador));
    const usados = new Set();

    function localizarComplemento(row) {
      let idx = baseComplemento.findIndex((c, i) => !usados.has(i) && chaveCompleta(c) === chaveCompleta(row));
      if (idx >= 0) return idx;
      idx = baseComplemento.findIndex((c, i) => !usados.has(i) && chaveBase(c) === chaveBase(row) && ehConsolidado(c) === ehConsolidado(row));
      if (idx >= 0) return idx;
      idx = baseComplemento.findIndex((c, i) => !usados.has(i) && norm(c.Indicador) === norm(row.Indicador) && norm(c.Ano) === norm(row.Ano));
      return idx;
    }

    const mesclada = baseResultados.map(row => {
      const idx = localizarComplemento(row);
      if (idx < 0) return row;
      usados.add(idx);
      const apoio = baseComplemento[idx];
      const merged = Object.assign({}, apoio);
      Object.keys(row).forEach(k => { if (valorPreenchido(row[k])) merged[k] = row[k]; });
      return merged;
    });

    baseComplemento.forEach((row, idx) => { if (!usados.has(idx)) mesclada.push(row); });
    return mesclada;
  }


  const MESES_NUMERO = { 1: 'Jan', 2: 'Fev', 3: 'Mar', 4: 'Abr', 5: 'Mai', 6: 'Jun', 7: 'Jul', 8: 'Ago', 9: 'Set', 10: 'Out', 11: 'Nov', 12: 'Dez' };
  const ALIASES_HORA_EXTRA = {
    'Hora Extra Realizada': [
      'TOTAL_HORAS_EXTRAS', 'TOTAL HORAS EXTRAS', 'TOTAL DE HORAS EXTRAS',
      'HORAS EXTRAS REALIZADAS', 'HORA EXTRA REALIZADA', 'TOTAL_HE', 'TOTAL HE'
    ],
    'Horas Domingos e Feriados Realizadas': [
      'HE_DOMINGOS_FERIADOS', 'HE DOMINGOS FERIADOS', 'HORAS DOMINGOS FERIADOS',
      'HORAS DOMINGOS E FERIADOS', 'DOMINGOS_FERIADOS', 'DOMINGOS E FERIADOS'
    ]
  };

  function numeroFlexivel(v) {
    if (v === undefined || v === null) return null;
    let texto = clean(v).replace(/R\$/gi, '').replace(/%/g, '').replace(/\s+/g, '');
    if (!texto || texto === '-') return null;
    const temVirgula = texto.includes(',');
    const temPonto = texto.includes('.');
    if (temVirgula && temPonto) {
      if (texto.lastIndexOf(',') > texto.lastIndexOf('.')) texto = texto.replace(/\./g, '').replace(',', '.');
      else texto = texto.replace(/,/g, '');
    } else if (temVirgula) texto = texto.replace(',', '.');
    const valor = Number(texto);
    return Number.isFinite(valor) ? valor : null;
  }

  function campoPorAliases(row, aliases) {
    if (!row) return null;
    const keys = Object.keys(row);
    const normalizados = aliases.map(norm);
    let key = keys.find(k => normalizados.includes(norm(k)));
    if (!key) key = keys.find(k => normalizados.some(alias => norm(k).includes(alias)));
    return key || null;
  }

  function competenciaDaLinha(row) {
    const keys = Object.keys(row || {});
    const key = keys.find(k => ['MES', 'MÊS', 'COMPETENCIA', 'COMPETÊNCIA', 'DATA', 'ANO MES', 'ANO_MES'].includes(norm(k))) ||
      keys.find(k => norm(k).includes('COMPET') || norm(k) === 'MES' || norm(k).includes('ANO MES'));
    if (!key) return null;
    const bruto = clean(row[key]);
    if (!bruto) return null;
    let ano, mes;
    let m = bruto.match(/^(\d{4})[-\/]([01]?\d)/);
    if (m) { ano = Number(m[1]); mes = Number(m[2]); }
    if (!m) {
      m = bruto.match(/^([0-3]?\d)[-\/]([01]?\d)[-\/](\d{4})$/);
      if (m) { ano = Number(m[3]); mes = Number(m[2]); }
    }
    if (!m) {
      m = bruto.match(/^([01]?\d)[-\/](\d{4})$/);
      if (m) { ano = Number(m[2]); mes = Number(m[1]); }
    }
    if (!ano || !mes || mes < 1 || mes > 12) return null;
    return { ano: String(ano), mes, mesLabel: MESES_NUMERO[mes] };
  }

  function agregarFonteHoraExtra(rows) {
    const agregado = {};
    (rows || []).forEach(raw => {
      const row = normalizarRow(raw);
      const competencia = competenciaDaLinha(row);
      if (!competencia) return;
      Object.keys(ALIASES_HORA_EXTRA).forEach(indicador => {
        const key = campoPorAliases(row, ALIASES_HORA_EXTRA[indicador]);
        if (!key) return;
        const valor = numeroFlexivel(row[key]);
        if (valor === null) return;
        const chave = `${indicador}¦${competencia.ano}¦${competencia.mes}`;
        agregado[chave] = (agregado[chave] || 0) + valor;
      });
    });
    return agregado;
  }

  function consolidarHoraExtra(fontes) {
    const porFonte = (fontes || []).map(agregarFonteHoraExtra);
    const escolhido = {};
    // As fontes são complementares, mas podem repetir a mesma competência.
    // A primeira fonte com um valor válido para indicador/mês prevalece, evitando dupla contagem.
    porFonte.forEach(fonte => {
      Object.keys(fonte).forEach(chave => {
        if (escolhido[chave] === undefined) escolhido[chave] = fonte[chave];
      });
    });

    const porAno = {};
    Object.keys(escolhido).forEach(chave => {
      const [indicador, ano, mesNumero] = chave.split('¦');
      const id = `${indicador}¦${ano}`;
      if (!porAno[id]) porAno[id] = { indicador, ano, meses: {} };
      porAno[id].meses[Number(mesNumero)] = escolhido[chave];
    });

    return Object.values(porAno).map(item => {
      const row = {
        Indicador: item.indicador,
        Diretoria: CONFIG.diretoriaDefault,
        'Superint.': '-',
        'Gerência': '-',
        Ano: item.ano,
        Unidade: 'h',
        Sentido: '↓'
      };
      let acumulado = 0;
      Object.keys(item.meses).forEach(mesNumero => {
        const valor = item.meses[mesNumero];
        row[MESES_NUMERO[Number(mesNumero)]] = String(valor);
        acumulado += valor;
      });
      row.Acumulado = String(acumulado);
      return row;
    });
  }

  function aplicarHoraExtra(data, fontes) {
    const sinteticas = consolidarHoraExtra(fontes);
    if (!sinteticas.length) return data;
    const resultado = data.slice();
    sinteticas.forEach(nova => {
      const idx = resultado.findIndex(r => norm(r.Indicador) === norm(nova.Indicador) && norm(r.Ano) === norm(nova.Ano) && norm(r.Diretoria) === norm(CONFIG.diretoriaDefault) && ehConsolidado(r));
      if (idx >= 0) {
        const existente = resultado[idx];
        // Preserva meta, sentido e demais metadados da governança; substitui apenas resultado mensal/acumulado.
        resultado[idx] = Object.assign({}, existente, nova, {
          Meta: existente.Meta,
          Sentido: valorPreenchido(existente.Sentido) ? existente.Sentido : nova.Sentido,
          Unidade: valorPreenchido(existente.Unidade) ? existente.Unidade : nova.Unidade
        });
      } else resultado.push(nova);
    });
    return resultado;
  }

  function atingimentoExplicito(row) {
    if (!row) return null;
    const aliases = ['ATINGIMENTO', '% ATINGIMENTO', 'PERCENTUAL DE ATINGIMENTO', 'ATINGIMENTO DA META', '% DA META', 'PERCENTUAL META'];
    const key = Object.keys(row).find(k => aliases.includes(norm(k)) || norm(k).includes('ATINGIMENTO'));
    if (!key || !valorPreenchido(row[key])) return null;
    const bruto = clean(row[key]);
    let valor = HUB.indicadores.parseNumeroBR(bruto);
    if (valor === null || !Number.isFinite(valor)) return null;
    if (!bruto.includes('%') && Math.abs(valor) <= 1) valor *= 100;
    return { valor, texto: `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% de atingimento`, origem: 'base complementar' };
  }

  function ehConsolidado(row) {
    const sup = clean(row && row['Superint.']);
    const ger = clean(row && row['Gerência']);
    return (sup === '' || sup === '-') && (ger === '' || ger === '-');
  }

  function resolverLinha(indicador, diretoria, ano, data = DATA) {
    const base = data.filter(r => norm(r.Indicador) === norm(indicador) && norm(r.Ano) === norm(ano));
    return base.find(r => norm(r.Diretoria) === norm(diretoria) && ehConsolidado(r)) ||
      base.find(r => norm(r.Diretoria) === norm(diretoria)) ||
      base.find(r => norm(r.Diretoria) === 'COMLURB' && ehConsolidado(r)) ||
      base.find(ehConsolidado) || base[0] || null;
  }

  function avaliarComParidade(indicador, diretoria, ano, data = DATA) {
    const row = resolverLinha(indicador, diretoria, ano, data);
    if (!row) return HUB.indicadores.avaliarIndicador([], indicador, diretoria, ano, CONFIG.limiteAtencao);
    const adaptada = Object.assign({}, row, {
      Indicador: indicador,
      Diretoria: diretoria,
      Ano: String(ano),
      'Superint.': '-',
      'Gerência': '-'
    });
    return HUB.indicadores.avaliarIndicador([adaptada], indicador, diretoria, ano, CONFIG.limiteAtencao);
  }

  function unidadeVisual(unidade) {
    const u = norm(unidade);
    if (!u || ['NUM', 'NUM.', 'NUMERO', 'NÚMERO', 'QTD', 'QTD.', 'QUANTIDADE'].includes(u)) return '';
    if (['TON', 'TON.', 'TONELADA', 'TONELADAS'].includes(u)) return 't';
    return clean(unidade);
  }

  function formatValor(v, unidade) {
    if (v === null || v === undefined || Number.isNaN(v)) return '—';
    const opts = Math.abs(v) >= 1000 ? { maximumFractionDigits: 0 } : { maximumFractionDigits: 1 };
    const numero = Number(v).toLocaleString('pt-BR', opts);
    const u = unidadeVisual(unidade);
    if (!u) return numero;
    if (u === '%') return numero + '%';
    if (/^R\$/i.test(u)) return 'R$ ' + numero;
    return numero + ' ' + u;
  }

  function indicadorCTR(k) {
    return /RESIDUOS RECEBIDOS NO CTR|CTR GERICINO/.test(norm(k && k.indicador));
  }

  function unidadeDescritiva(unidade) {
    const u = unidadeVisual(unidade);
    if (u === 't') return 'Toneladas';
    if (u === '%') return 'Percentual';
    if (u === 'h') return 'Horas';
    return u || 'Unidades';
  }

  function formatValorIndicador(k, valor) {
    return formatValor(valor, indicadorCTR(k) ? '' : k.unidade);
  }

  function formatDiferenca(v, unidade) {
    if (v === null || v === undefined || Number.isNaN(v)) return '—';
    const abs = Math.abs(v);
    const num = abs.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
    const u = unidadeVisual(unidade);
    if (u === '%') return num + ' p.p.';
    if (u === 't') return num + (abs === 1 ? ' tonelada' : ' toneladas');
    if (!u) return num + (abs === 1 ? ' unidade' : ' unidades');
    return num + ' ' + u;
  }

  function mesesComValor(row) {
    if (!row) return [];
    return HUB.indicadores.MESES.map((mes, index) => ({
      mes,
      numero: index + 1,
      valor: HUB.indicadores.parseNumeroBR(row[mes])
    })).filter(item => item.valor !== null);
  }

  function metaMensalExplicita(row, mes) {
    if (!row || !mes) return null;
    const alvo = norm(mes);
    const key = Object.keys(row).find(k => {
      const n = norm(k).replace(/[_-]+/g, ' ');
      return n.includes('META') && n.includes(alvo);
    });
    return key ? HUB.indicadores.parseNumeroBR(row[key]) : null;
  }

  function indicadorNaoAditivo(indicador, unidade) {
    const u = norm(unidade);
    const nome = norm(indicador);
    if (u.includes('%') || /PERCENTUAL|TAXA|INDICE|ÍNDICE|MEDIA|MÉDIA|TEMPO MEDIO|TEMPO MÉDIO|IPL|NOTA|PROPORCAO|PROPORÇÃO/.test(nome)) return true;
    return false;
  }

  function acumuladoEhSomaMensal(row) {
    if (!row) return false;
    const meses = mesesComValor(row);
    if (meses.length < 2) return false;
    const acumulado = HUB.indicadores.parseNumeroBR(row.Acumulado);
    if (acumulado === null) return false;
    const soma = meses.reduce((acc, item) => acc + item.valor, 0);
    const tolerancia = Math.max(0.5, Math.abs(soma) * 0.02);
    return Math.abs(acumulado - soma) <= tolerancia;
  }

  // Meta usada para classificar o desempenho no ano corrente.
  // 1) se houver meta específica da última competência, ela prevalece;
  // 2) percentuais, taxas, índices e médias mantêm a meta integral;
  // 3) metas anuais cumulativas são linearmente proporcionadas até a última
  //    competência com resultado (ex.: Fev = 2/12 da meta anual).
  function referenciaMetaPeriodo(row, indicador, metaAnual, unidade) {
    if (metaAnual === null || metaAnual === undefined || !row) return { meta: metaAnual, metaAnual, mes: null, mesNumero: null, tipo: 'sem_meta' };
    const meses = mesesComValor(row);
    const ultimo = meses.length ? meses[meses.length - 1] : null;
    if (!ultimo) return { meta: metaAnual, metaAnual, mes: null, mesNumero: null, tipo: 'integral' };

    const metaExplicita = metaMensalExplicita(row, ultimo.mes);
    if (metaExplicita !== null) return { meta: metaExplicita, metaAnual, mes: ultimo.mes, mesNumero: ultimo.numero, tipo: 'competencia' };

    if (indicadorNaoAditivo(indicador, unidade)) return { meta: metaAnual, metaAnual, mes: ultimo.mes, mesNumero: ultimo.numero, tipo: 'integral' };

    if (acumuladoEhSomaMensal(row)) {
      return { meta: metaAnual * (ultimo.numero / 12), metaAnual, mes: ultimo.mes, mesNumero: ultimo.numero, tipo: 'proporcional' };
    }

    return { meta: metaAnual, metaAnual, mes: ultimo.mes, mesNumero: ultimo.numero, tipo: 'integral' };
  }

  function calcularStatusReferencia(valor, meta, sentido, limiteAtencao) {
    if (valor === null || valor === undefined || meta === null || meta === undefined) return { cor: '', label: 'sem leitura', desvio: null };
    const menorMelhor = clean(sentido) === '↓';
    const atingiu = menorMelhor ? valor <= meta : valor >= meta;
    if (atingiu) return { cor: 'green', label: 'estável', desvio: 0 };
    if (meta === 0) return { cor: 'red', label: 'crítico', desvio: 1 };
    const desvio = menorMelhor ? (valor - meta) / Math.abs(meta) : (meta - valor) / Math.abs(meta);
    if (desvio <= limiteAtencao) return { cor: 'orange', label: 'atenção', desvio };
    return { cor: 'red', label: 'crítico', desvio };
  }

  function distanciaMeta(k) {
    if (k.acumulado === null) return 'Sem resultado disponível';
    if (k.meta === null) return 'Sem meta definida';
    const menorMelhor = clean(k.sentido) === '↓';
    if (menorMelhor) return k.acumulado <= k.meta ? `${formatDiferenca(k.meta - k.acumulado, k.unidade)} abaixo do limite` : `Excesso de ${formatDiferenca(k.acumulado - k.meta, k.unidade)}`;
    return k.acumulado >= k.meta ? `${formatDiferenca(k.acumulado - k.meta, k.unidade)} acima da meta` : `Déficit de ${formatDiferenca(k.meta - k.acumulado, k.unidade)}`;
  }

  function distanciaMetaValor(k) {
    if (k.acumulado === null || k.meta === null || !k.meta) return null;
    return Math.abs(k.acumulado - k.meta) / Math.abs(k.meta);
  }

  function variacaoTemporal(row, sentido, unidade) {
    if (!row) return null;
    const pares = HUB.indicadores.MESES.map(m => ({ mes: m, valor: HUB.indicadores.parseNumeroBR(row[m]) })).filter(p => p.valor !== null);
    if (pares.length < 2) return null;
    const anterior = pares[pares.length - 2];
    const atual = pares[pares.length - 1];
    const delta = atual.valor - anterior.valor;
    if (Math.abs(delta) < 1e-9) return { texto: `Estável em relação a ${anterior.mes}`, delta: 0, mesAnterior: anterior.mes, mesAtual: atual.mes };
    const menorMelhor = clean(sentido) === '↓';
    const favoravel = menorMelhor ? delta < 0 : delta > 0;
    return { texto: `${favoravel ? 'Melhora' : 'Piora'} em relação a ${anterior.mes}`, detalhe: formatDiferenca(delta, unidade), delta, favoravel, mesAnterior: anterior.mes, mesAtual: atual.mes };
  }

  function anoPrincipal() { return ANO_FIXO; }

  function anoComparacao() { return null; }

  function ultimoValorDisponivel(row) {
    if (!row) return null;
    const pares = HUB.indicadores.MESES.map(m => ({ mes: m, valor: HUB.indicadores.parseNumeroBR(row[m]) })).filter(p => p.valor !== null);
    return pares.length ? pares[pares.length - 1] : null;
  }

  function comparacaoAnual(indicador, sentido, unidade) {
    const anteriorAno = anoComparacao();
    if (!anteriorAno) return null;
    const atualAno = anoPrincipal();
    const atualRow = resolverLinha(indicador, diretoriaSelecionada, atualAno);
    const anteriorRow = resolverLinha(indicador, diretoriaSelecionada, anteriorAno);
    const atual = ultimoValorDisponivel(atualRow);
    if (!atual || !anteriorRow) return null;
    const anteriorValor = HUB.indicadores.parseNumeroBR(anteriorRow[atual.mes]);
    if (anteriorValor === null) return null;
    const delta = atual.valor - anteriorValor;
    if (Math.abs(delta) < 1e-9) return { texto: `Estável em ${atual.mes}: ${atualAno} igual a ${anteriorAno}`, delta: 0, favoravel: null, mes: atual.mes, anoAtual: atualAno, anoAnterior: anteriorAno };
    const menorMelhor = clean(sentido) === '↓';
    const favoravel = menorMelhor ? delta < 0 : delta > 0;
    return { texto: `${favoravel ? 'Melhora' : 'Piora'} em ${atual.mes}, comparando ${atualAno} com ${anteriorAno}`, detalhe: formatDiferenca(delta, unidade), delta, favoravel, mes: atual.mes, anoAtual: atualAno, anoAnterior: anteriorAno };
  }


  function percentualAtingimento(k) {
    if (!k) return null;
    const informado = atingimentoExplicito(k.row);
    if (informado) return informado;
    if (k.acumulado === null || k.acumulado === undefined || k.meta === null || k.meta === undefined) return null;
    const atual = Number(k.acumulado);
    const meta = Number(k.meta);
    if (!Number.isFinite(atual) || !Number.isFinite(meta)) return null;
    const menorMelhor = clean(k.sentido) === '↓';

    if (menorMelhor) {
      if (meta === 0 && atual === 0) return { valor: 100, texto: '100% de atingimento' };
      if (meta === 0 && atual > 0) return { valor: 0, texto: '0% de atingimento' };
      if (atual === 0 && meta > 0) return { valor: null, texto: 'Acima de 100% de atingimento', superado: true };
      const valor = (meta / atual) * 100;
      return { valor, texto: `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% de atingimento` };
    }

    if (meta === 0) {
      const valor = atual >= 0 ? 100 : 0;
      return { valor, texto: `${valor}% de atingimento` };
    }
    const valor = (atual / meta) * 100;
    return { valor, texto: `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% de atingimento` };
  }

  function montarKpi(entry) {
    const anoBase = ANO_FIXO;
    const aval = avaliarComParidade(entry.indicador, diretoriaSelecionada, anoBase);
    const k = Object.assign({ eixo: entry.eixo, eixoLabel: EIXO_LABEL[entry.eixo] || entry.eixo, ano: anoBase }, aval);
    k.metaAnual = k.meta;
    k.referenciaMeta = referenciaMetaPeriodo(k.row, k.indicador, k.metaAnual, k.unidade);
    k.meta = k.referenciaMeta.meta;
    k.status = calcularStatusReferencia(k.acumulado, k.meta, k.sentido, CONFIG.limiteAtencao);
    k.distanciaTexto = distanciaMeta(k);
    k.atingimento = percentualAtingimento(k);
    k.variacao = variacaoTemporal(k.row, k.sentido, k.unidade);
    k.rowComparacao = null;
    return k;
  }

  function resumoStatus(kpis) {
    const r = { green: 0, orange: 0, red: 0, sem: 0, total: kpis.length };
    kpis.forEach(k => { if (k.status.cor === 'green') r.green++; else if (k.status.cor === 'orange') r.orange++; else if (k.status.cor === 'red') r.red++; else r.sem++; });
    r.comStatus = r.green + r.orange + r.red;
    r.percentualMeta = r.comStatus ? Math.round(r.green / r.comStatus * 100) : null;
    r.percentualCobertura = r.total ? Math.round(r.comStatus / r.total * 100) : null;
    return r;
  }

  // ------------------------------------------------------------------
  // V16 — Situação Corporativa / Síntese Executiva / Visão Estratégica
  //
  // Substitui renderHero + renderZonaAlertas + renderVisaoEstrategica (barras).
  // agruparPorTema (contagem simples) foi substituída por contarPorGrupo,
  // que separa acompanhamento (críticos + atenção) de sem meta e calcula
  // a tendência predominante do grupo. resumoStatus e statusTag continuam
  // usados pela camada "Todos os indicadores".
  // ------------------------------------------------------------------

  function statusTag(k) { return k.status.cor === 'green' ? ['ok', 'Estável'] : k.status.cor === 'orange' ? ['att', 'Atenção'] : k.status.cor === 'red' ? ['crit', 'Crítico'] : ['purple', k.status.label === 'sem dado' ? 'Sem dado' : 'Sem meta']; }

  // Contagem por grupo institucional. acompanhamento = críticos + atenção
  // (regra obrigatória: sem meta NUNCA entra nessa contagem). tendencia é o
  // sinal predominante entre os indicadores do grupo que têm variação
  // calculada (favoravel true = melhora, false = piora); empate ou ausência
  // de dados resulta em 'estavel'.
  function contarPorGrupo(kpis) {
    const grupos = new Map();
    GRUPO_ORDEM.forEach(g => grupos.set(g, {
      grupo: g, label: GRUPO_LABEL[g],
      total: 0, criticos: 0, atencao: 0, dentroMeta: 0, semMeta: 0,
      melhoraCount: 0, pioraCount: 0
    }));
    kpis.forEach(k => {
      const g = GRUPO_EIXO[k.eixo] || 'outros';
      const acc = grupos.get(g);
      acc.total++;
      if (k.status.cor === 'red') acc.criticos++;
      else if (k.status.cor === 'orange') acc.atencao++;
      else if (k.status.cor === 'green') acc.dentroMeta++;
      else acc.semMeta++;
      if (k.variacao && k.variacao.favoravel === true) acc.melhoraCount++;
      else if (k.variacao && k.variacao.favoravel === false) acc.pioraCount++;
    });
    grupos.forEach(acc => {
      acc.acompanhamento = acc.criticos + acc.atencao;
      acc.tendencia = acc.pioraCount > acc.melhoraCount ? 'piora' : acc.melhoraCount > acc.pioraCount ? 'melhora' : 'estavel';
    });
    return grupos;
  }

  // Blocos exibidos na Visão Estratégica: ordem institucional fixa
  // (GRUPO_ORDEM, sem reordenar por gravidade). Grupos com total 0 não
  // aparecem; 'outros' só aparece se houver indicador de fato classificado
  // como Outros — garante que nenhum indicador fique invisível.
  function blocosVisaoEstrategica(kpis) {
    const grupos = contarPorGrupo(kpis);
    return GRUPO_ORDEM.map(g => grupos.get(g)).filter(g => g.total > 0);
  }

  // Ajuste 1 (aprovado): quando acompanhamento é 0, a leitura qualitativa
  // não pode dizer genericamente "sem desvios relevantes" — precisa
  // diferenciar se os indicadores foram avaliados dentro da meta, se estão
  // sem meta formal, ou se é uma mistura das duas coisas. Quando
  // acompanhamento > 0, a leitura de acompanhamento existente é mantida.
  //
  // quantitativo e semMetaTexto vêm separados (não mais concatenados em
  // uma única frase) para a Visão Estratégica em 3 colunas: quantitativo
  // é a 2ª coluna, semMetaTexto vira a linha complementar abaixo da linha.
  function resumoGrupo(g) {
    let situacao;
    if (g.acompanhamento > 0) {
      situacao = g.tendencia === 'piora' ? 'Situação em atenção, com piora recente em parte dos indicadores.'
        : g.tendencia === 'melhora' ? 'Situação em acompanhamento, com melhora recente em parte dos indicadores.'
        : 'Situação em acompanhamento, sem alteração relevante no período.';
    } else if (g.semMeta === 0) {
      situacao = 'Indicadores avaliados dentro da meta no período.';
    } else if (g.dentroMeta === 0) {
      situacao = 'Indicadores sem meta formal para classificação no período.';
    } else {
      situacao = 'Sem desvios classificados, com parte dos indicadores ainda sem meta.';
    }

    const quantitativo = `${g.acompanhamento} de ${g.total} indicador${g.total === 1 ? '' : 'es'} demanda${g.acompanhamento === 1 ? '' : 'm'} acompanhamento.`;
    const semMetaTexto = g.semMeta > 0
      ? `${g.semMeta} indicador${g.semMeta === 1 ? '' : 'es'} permanece${g.semMeta === 1 ? '' : 'm'} sem meta definida.`
      : '';

    return { situacao, quantitativo, semMetaTexto };
  }

  // Concentração principal para a Situação Corporativa: grupo(s) com maior
  // acompanhamento (críticos + atenção). Mais de dois grupos empatados no
  // topo vira leitura genérica ("vários eixos de atuação") para não inflar
  // a frase com uma lista longa.
  function concentracaoPrincipal(kpis) {
    const grupos = Array.from(contarPorGrupo(kpis).values()).filter(g => g.acompanhamento > 0);
    if (!grupos.length) return { grupos: [], multiplos: false, piora: false };
    const max = Math.max(...grupos.map(g => g.acompanhamento));
    const topo = grupos.filter(g => g.acompanhamento === max);
    if (topo.length > 2) return { grupos: [], multiplos: true, piora: topo.some(g => g.tendencia === 'piora') };
    return { grupos: topo.map(g => g.label), multiplos: false, piora: topo.some(g => g.tendencia === 'piora') };
  }

  // Ajuste 3 (aprovado): o vocabulário do subtexto depende da composição
  // real do desvio — "desvios críticos" quando há pelo menos um crítico,
  // "pontos de acompanhamento" quando há só atenção. Quando não há nem
  // crítico nem atenção, a frase não pode soar como "está tudo bem" se
  // ainda existem indicadores sem meta — nesse caso o texto permanece
  // neutro e menciona a pendência de classificação em vez de elogiar o
  // desempenho.
  function gerarSituacaoCorporativa(kpis) {
    const totalCriticos = kpis.filter(k => k.status.cor === 'red').length;
    const totalAtencao = kpis.filter(k => k.status.cor === 'orange').length;
    const totalSemMeta = kpis.filter(k => !k.status.cor).length;
    const qtd = totalCriticos + totalAtencao;
    const concentracao = concentracaoPrincipal(kpis);
    const headline = qtd === 0
      ? 'Nenhum indicador em situação de desvio no período'
      : `${qtd} indicador${qtd === 1 ? '' : 'es'} demanda${qtd === 1 ? '' : 'm'} acompanhamento prioritário`;
    const termoDesvio = totalCriticos > 0 ? 'desvios críticos' : 'pontos de acompanhamento';

    let subtext;
    if (qtd === 0) {
      subtext = totalSemMeta === 0
        ? 'Os indicadores acompanhados estão dentro da meta no período.'
        : `Nenhum indicador crítico ou em atenção no período. ${totalSemMeta} indicador${totalSemMeta === 1 ? '' : 'es'} permanece${totalSemMeta === 1 ? '' : 'm'} sem meta definida, sem avaliação de desempenho.`;
    } else if (concentracao.multiplos) {
      subtext = `Os principais ${termoDesvio} estão distribuídos entre vários eixos de atuação${concentracao.piora ? ', com piora recente em parte dos indicadores acompanhados.' : '.'}`;
    } else if (!concentracao.grupos.length) {
      subtext = `Os indicadores acompanhados não apresentam concentração relevante de ${termoDesvio} no período.`;
    } else {
      subtext = `Os principais ${termoDesvio} estão concentrados em ${concentracao.grupos.join(' e ')}${concentracao.piora ? ', com piora recente em parte dos indicadores acompanhados.' : '.'}`;
    }
    return { qtd, headline, subtext, concentracao };
  }

  // Síntese executiva: até 3 fatos, cada um de um tipo diferente da
  // abertura (melhora / piora / acompanhamento contínuo). A linha de piora
  // é omitida quando o mesmo grupo e o mesmo fato (piora) já foram citados
  // na Situação Corporativa — regra obrigatória contra repetição.
  function gerarSinteseExecutiva(kpis, situacao) {
    const grupos = Array.from(contarPorGrupo(kpis).values()).filter(g => g.total > 0);
    const porOrdem = (a, b) => GRUPO_ORDEM.indexOf(a.grupo) - GRUPO_ORDEM.indexOf(b.grupo);
    const linhas = [];
    const usados = new Set();

    const candidatosMelhora = grupos.filter(g => g.melhoraCount > 0).sort((a, b) => (b.melhoraCount - a.melhoraCount) || porOrdem(a, b));
    if (candidatosMelhora.length) {
      const g = candidatosMelhora[0];
      linhas.push(`${g.label} apresentou evolução positiva no período.`);
      usados.add(g.grupo);
    }

    const concentracaoRepeteGrupo = g => situacao && situacao.concentracao && situacao.concentracao.piora &&
      situacao.concentracao.grupos.includes(g.label);
    const candidatosPiora = grupos.filter(g => g.pioraCount > 0 && !concentracaoRepeteGrupo(g)).sort((a, b) => (b.pioraCount - a.pioraCount) || porOrdem(a, b));
    if (candidatosPiora.length) {
      const g = candidatosPiora[0];
      linhas.push(`${g.label} apresentou piora no período, concentrando parte dos desvios recentes.`);
      usados.add(g.grupo);
    }

    const candidatosContinuo = grupos.filter(g => g.acompanhamento > 0 && g.tendencia === 'estavel' && !usados.has(g.grupo)).sort(porOrdem);
    if (candidatosContinuo.length) {
      const g = candidatosContinuo[0];
      linhas.push(`${g.label} segue em acompanhamento, sem alteração relevante no período.`);
    }

    return linhas.slice(0, 3);
  }

  function cardHTML(k) {
    const tag = statusTag(k);
    const movimento = k.variacao ? k.variacao.texto : '';
    return `<article class="indCard" data-indicador="${esc(k.indicador)}" tabindex="0" role="button"><div><div class="indCardTop"><h3>${esc(k.indicador)}</h3><span class="tag ${tag[0]}">${esc(tag[1])}</span></div><div class="indValue ${esc(k.status.cor || '')}">${esc(formatValorIndicador(k, k.acumulado))}</div>${k.atingimento ? `<div class="indAchievement">${esc(k.atingimento.texto)}</div>` : ''}<div class="indNote">${esc(k.distanciaTexto)}</div>${movimento ? `<div class="indTrend">${esc(movimento)}</div>` : ''}</div><div class="indAction">Abrir ficha →</div></article>`;
  }

  const TENDENCIA_LABEL = { piora: 'Piora', melhora: 'Melhora', estavel: 'Estável' };

  // Ajuste 2 (aprovado): linha em 3 colunas (nome / quantitativo de
  // acompanhamento / tendência predominante), sem tabela administrativa e
  // sem card. A leitura qualitativa (Ajuste 1) e a frase de sem meta ficam
  // abaixo, como texto complementar menor e neutro.
  function grupoBlocoHTML(g) {
    const resumo = resumoGrupo(g);
    // Quando o grupo é 100% sem meta, a leitura qualitativa já cobre isso
    // por completo — não repetir a contagem de sem meta na mesma linha.
    const semMetaJaCoberto = g.acompanhamento === 0 && g.dentroMeta === 0;
    const complemento = [resumo.situacao, semMetaJaCoberto ? '' : resumo.semMetaTexto].filter(Boolean).join(' ');
    return `<div class="grupoBloco">
      <div class="grupoBlocoNome">${esc(g.label)}</div>
      <div class="grupoBlocoQtd">${esc(resumo.quantitativo)}</div>
      <div class="grupoBlocoTendencia ${esc(g.tendencia)}">${esc(TENDENCIA_LABEL[g.tendencia])}</div>
      <div class="grupoBlocoComplemento">${esc(complemento)}</div>
    </div>`;
  }

  function filtrar(kpis) {
    const termo = norm(buscaAtual);
    return kpis.filter(k => (!termo || norm(k.indicador).includes(termo) || norm(k.eixoLabel).includes(termo)) && (
      statusAtual === 'todos' ? true :
      statusAtual === 'alertas' ? (k.status.cor === 'red' || k.status.cor === 'orange') :
      statusAtual === 'sem' ? !k.status.cor :
      k.status.cor === statusAtual
    ));
  }

  function vincularCards(container) {
    container.querySelectorAll('.indCard').forEach(card => {
      const open = () => { const k = KPIDATA.find(x => x.indicador === card.dataset.indicador); if (k) abrirDrawer(k); };
      card.addEventListener('click', open);
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
  }

  function renderSituacaoCorporativa(kpis) {
    const situacao = gerarSituacaoCorporativa(kpis);
    document.getElementById('situacaoEyebrow').textContent =
      `Situação Corporativa · ${anoSelecionado === 'comparar' ? `Comparativo ${anoComparacao()} × ${anoPrincipal()}` : anoPrincipal()}`;
    document.getElementById('situacaoHeadline').textContent = situacao.headline;
    document.getElementById('situacaoSubtext').textContent = situacao.subtext;
    return situacao;
  }

  function renderSinteseExecutiva(kpis, situacao) {
    const linhas = gerarSinteseExecutiva(kpis, situacao);
    const container = document.getElementById('sinteseList');
    container.innerHTML = linhas.length
      ? linhas.map(texto => `<li>${esc(texto)}</li>`).join('')
      : '<li class="sinteseEmpty">Sem leituras adicionais no período selecionado.</li>';
  }

  function renderVisaoEstrategica(kpis) {
    const blocos = blocosVisaoEstrategica(kpis);
    document.getElementById('visaoEstrategicaLista').innerHTML = blocos.map(grupoBlocoHTML).join('');
  }

  function renderExecutiveCockpit(kpis) {
    const avaliaveis = kpis.filter(k => k.metaAnual !== null && k.metaAnual !== undefined && k.acumulado !== null && k.acumulado !== undefined);
    const resumo = resumoStatus(avaliaveis);
    const situacao = gerarSituacaoCorporativa(avaliaveis);
    document.getElementById('heroPeriod').textContent = ANO_FIXO;

    const pct = valor => resumo.comStatus ? `${Math.round(valor / resumo.comStatus * 100)}% dos avaliados` : 'Sem base classificável';
    const scorecards = [
      { cls: '', valor: resumo.comStatus, label: 'Avaliados', support: 'Indicadores com meta e resultado em 2026' },
      { cls: 'is-green', valor: resumo.green, label: 'Estáveis', support: pct(resumo.green) },
      { cls: 'is-orange', valor: resumo.orange, label: 'Atenção', support: pct(resumo.orange) },
      { cls: 'is-red', valor: resumo.red, label: 'Críticos', support: pct(resumo.red) }
    ];
    document.getElementById('corporateScoreboard').innerHTML = scorecards.map(item => `<div class="scoreItem ${item.cls}"><div class="scoreValue">${esc(item.valor)}</div><div class="scoreLabel">${esc(item.label)}</div><div class="scoreSupport">${esc(item.support)}</div></div>`).join('');

    document.getElementById('executiveHeadline').textContent = situacao.headline;
    const sintese = gerarSinteseExecutiva(avaliaveis, situacao);
    document.getElementById('executiveSubtext').textContent = [situacao.subtext, sintese[0] || ''].filter(Boolean).join(' ');
    return situacao;
  }

  function statusPill(qtd, label, dotClass) {
    if (!qtd) return '';
    return `<span class="statusPill"><span class="statusDot ${dotClass}"></span>${esc(qtd)} ${esc(label)}</span>`;
  }

  function renderAxisPerformance(kpis) {
    const avaliaveis = kpis.filter(k => k.metaAnual !== null && k.metaAnual !== undefined && k.acumulado !== null && k.acumulado !== undefined);
    const grupos = blocosVisaoEstrategica(avaliaveis);
    document.getElementById('axisPerformance').innerHTML = grupos.map(g => {
      const pills = [
        statusPill(g.dentroMeta, 'estável' + (g.dentroMeta === 1 ? '' : 'is'), 'dotGreen'),
        statusPill(g.atencao, 'atenção', 'dotOrange'),
        statusPill(g.criticos, 'crítico' + (g.criticos === 1 ? '' : 's'), 'dotRed')
      ].filter(Boolean).join('');
      return `<div class="axisRow"><div><div class="axisName">${esc(g.label)}</div><div class="axisMeta">${esc(g.total)} indicador${g.total === 1 ? '' : 'es'} avaliado${g.total === 1 ? '' : 's'}</div></div><div class="statusDistribution">${pills || '<span class="statusPill"><span class="statusDot dotMuted"></span>Sem indicadores</span>'}</div><div class="axisTrend ${esc(g.tendencia)}">${esc(TENDENCIA_LABEL[g.tendencia])}</div></div>`;
    }).join('');
  }

  function prioridadeOrdenada(kpis) {
    return kpis.filter(k => k.status.cor === 'red' || k.status.cor === 'orange').sort((a, b) => {
      const status = PRIORIDADE_STATUS[a.status.cor] - PRIORIDADE_STATUS[b.status.cor];
      if (status) return status;
      const da = distanciaMetaValor(a), db = distanciaMetaValor(b);
      if (da !== null && db !== null && db !== da) return db - da;
      if (da !== null && db === null) return -1;
      if (da === null && db !== null) return 1;
      return a.indicador.localeCompare(b.indicador, 'pt-BR');
    });
  }

  function rotuloMetaReferencia(k) {
    if (!k || !k.referenciaMeta) return 'Meta';
    if (k.referenciaMeta.tipo === 'proporcional' || k.referenciaMeta.tipo === 'competencia') return `Meta até ${k.referenciaMeta.mes}`;
    return 'Meta';
  }

  function renderPriorities(kpis) {
    const prioridades = prioridadeOrdenada(kpis.filter(k => k.metaAnual !== null && k.metaAnual !== undefined));
    document.getElementById('priorityCount').textContent = prioridades.length ? `${prioridades.length} em acompanhamento` : 'Sem desvios classificados';
    const container = document.getElementById('priorityList');
    if (!prioridades.length) {
      container.innerHTML = '<div class="emptyState">Nenhum indicador crítico ou em atenção no período selecionado.</div>';
      return;
    }
    container.innerHTML = prioridades.slice(0, 5).map(k => {
      const tag = statusTag(k);
      return `<div class="priorityRow" data-priority-indicador="${esc(k.indicador)}" tabindex="0" role="button"><div><div class="priorityName">${esc(k.indicador)}</div><div class="priorityAxis">${esc(k.eixoLabel)}</div></div><div class="priorityMetric"><b>${esc(formatValorIndicador(k, k.acumulado))}</b><small>${esc(rotuloMetaReferencia(k))} ${esc(formatValorIndicador(k, k.meta))}</small></div><span class="tag ${tag[0]}">${esc(tag[1])}</span></div>`;
    }).join('');
    container.querySelectorAll('[data-priority-indicador]').forEach(row => {
      const open = () => { const k = KPIDATA.find(x => x.indicador === row.dataset.priorityIndicador); if (k) abrirDrawer(k); };
      row.addEventListener('click', open);
      row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
  }

  function renderMovements(kpis) {
    const movimentos = kpis.filter(k => k.metaAnual !== null && k.metaAnual !== undefined && k.variacao && k.variacao.favoravel !== null && k.variacao.favoravel !== undefined);
    const melhoras = movimentos.filter(k => k.variacao.favoravel === true).sort((a, b) => Math.abs(b.variacao.delta || 0) - Math.abs(a.variacao.delta || 0)).slice(0, 3);
    const pioras = movimentos.filter(k => k.variacao.favoravel === false).sort((a, b) => {
      const status = PRIORIDADE_STATUS[a.status.cor || ''] - PRIORIDADE_STATUS[b.status.cor || ''];
      return status || Math.abs(b.variacao.delta || 0) - Math.abs(a.variacao.delta || 0);
    }).slice(0, 3);
    const html = arr => arr.length ? arr.map(k => `<div class="movementItem"><b>${esc(k.indicador)}</b><span>${esc(k.variacao.texto)}${k.variacao.detalhe ? ` · ${esc(k.variacao.detalhe)}` : ''}</span></div>`).join('') : '<div class="emptyState">Sem movimento relevante calculável.</div>';
    document.getElementById('improvementList').innerHTML = html(melhoras);
    document.getElementById('worseningList').innerHTML = html(pioras);
  }

  function renderIndicadores(kpis) {
    const filtrados = filtrar(kpis);
    const html = EIXO_ORDEM.map(eixo => {
      const arr = filtrados.filter(k => k.eixo === eixo).sort((a, b) => PRIORIDADE_STATUS[a.status.cor || ''] - PRIORIDADE_STATUS[b.status.cor || ''] || a.indicador.localeCompare(b.indicador, 'pt-BR'));
      if (!arr.length) return '';
      return `<section class="panel eixoPanel"><div class="panelHead"><div><h2>${esc(EIXO_LABEL[eixo] || eixo)}</h2><div class="hint">${arr.length} indicador${arr.length === 1 ? '' : 'es'}</div></div></div><div class="body"><div class="indicatorGrid">${arr.map(cardHTML).join('')}</div></div></section>`;
    }).join('');
    const container = document.getElementById('indicadoresContainer');
    container.innerHTML = html || '<div class="governancaError">Nenhum indicador encontrado para os filtros aplicados.</div>';
    vincularCards(container);
  }

  function classeSemantica(k, tipo) {
    if (tipo === 'movimento') {
      if (!k.variacao || k.variacao.favoravel === null || k.variacao.favoravel === undefined) return 'semantic-neutral';
      return k.variacao.favoravel ? 'semantic-positive' : 'semantic-negative';
    }
    if (!k.status.cor) return 'semantic-neutral';
    if (k.status.cor === 'green') return 'semantic-positive';
    if (k.status.cor === 'red') return 'semantic-negative';
    return 'semantic-warning';
  }

  function ciclosHTML(k) {
    const anos = anoSelecionado === 'comparar' ? [anoComparacao(), anoPrincipal()].filter(Boolean) : [anoPrincipal()];
    return anos.map(ano => {
      const row = ano === anoPrincipal() ? k.row : resolverLinha(k.indicador, diretoriaSelecionada, ano);
      const cells = HUB.indicadores.MESES.map(m => `<div class="monthCell"><small>${m}</small><b>${esc(formatValorIndicador(k, row ? HUB.indicadores.parseNumeroBR(row[m]) : null))}</b></div>`).join('');
      return `<section class="yearCycles"><div class="yearCyclesTitle">${esc(ano)}</div><div class="months">${cells}</div></section>`;
    }).join('');
  }

  function sentidoAmigavel(sentido) {
    const s = clean(sentido);
    if (s === '↓' || norm(s) === 'MENOR' || norm(s) === 'DECRESCENTE' || norm(s) === 'ABAIXO') return 'O desempenho melhora quando o resultado diminui.';
    if (s === '↑' || norm(s) === 'MAIOR' || norm(s) === 'CRESCENTE' || norm(s) === 'ACIMA') return 'O desempenho melhora quando o resultado aumenta.';
    return 'A regra de avaliação deste indicador não foi informada.';
  }

  function abrirDrawer(k) {
    document.getElementById('drawerEixo').textContent = `${k.eixoLabel} · ${anoSelecionado === 'comparar' ? 'Comparativo ' + anoComparacao() + ' × ' + anoPrincipal() : anoPrincipal()}`;
    document.getElementById('drawerTitulo').textContent = k.indicador;
    const tag = statusTag(k);
    const resultClass = k.status.cor === 'red' ? 'result-critical' : k.status.cor === 'green' ? 'result-positive' : k.status.cor === 'orange' ? 'result-warning' : '';
    const unidadeBox = indicadorCTR(k) ? `<div class="detailBox"><small>Unidade de medida</small><b>${esc(unidadeDescritiva(k.unidade))}</b></div>` : '';
    document.getElementById('drawerDetails').innerHTML = `<div class="detailBox"><small>Resultado ${esc(anoPrincipal())}</small><b class="${resultClass}">${esc(formatValorIndicador(k, k.acumulado))}</b></div><div class="detailBox"><small>${esc(rotuloMetaReferencia(k))}</small><b>${esc(formatValorIndicador(k, k.meta))}</b></div>${k.referenciaMeta && k.referenciaMeta.tipo === 'proporcional' ? `<div class="detailBox"><small>Meta anual</small><b>${esc(formatValorIndicador(k, k.metaAnual))}</b></div>` : ''}<div class="detailBox"><small>Status</small><b><span class="tag ${tag[0]}">${esc(tag[1])}</span></b></div><div class="detailBox"><small>Atingimento da meta</small><b>${esc(k.atingimento ? k.atingimento.texto.replace(' de atingimento', '') : '—')}</b></div><div class="detailBox"><small>Distância da meta</small><b>${esc(k.distanciaTexto)}</b></div>${unidadeBox}<div class="detailBox detailBoxWide"><small>Como interpretar</small><b>${esc(sentidoAmigavel(k.sentido))}</b></div><div class="detailBox detailBoxWide"><small>${anoSelecionado === 'comparar' ? 'Comparação entre anos' : 'Movimento recente'}</small><b>${esc(k.variacao ? k.variacao.texto : 'Sem ciclos suficientes para comparação')}</b>${k.variacao && k.variacao.detalhe ? `<span class="detailSupport">Variação: ${esc(k.variacao.detalhe)}</span>` : ''}</div>`;
    document.getElementById('drawerMonths').innerHTML = ciclosHTML(k);
    document.getElementById('drawerOverlay').classList.add('open'); document.getElementById('drawer').classList.add('open'); document.getElementById('drawer').setAttribute('aria-hidden', 'false');
  }

  function fecharDrawer() { document.getElementById('drawerOverlay').classList.remove('open'); document.getElementById('drawer').classList.remove('open'); document.getElementById('drawer').setAttribute('aria-hidden', 'true'); }

  function salvarFiltros() {}
  function restaurarFiltros() { return {}; }

  function popularFiltros() {
    anosDisponiveis = [ANO_FIXO];
    anoSelecionado = ANO_FIXO;
    diretoriaSelecionada = CONFIG.diretoriaDefault;
  }

  function render() {
    const data2026 = DATA.filter(r => clean(r.Ano) === ANO_FIXO);
    KPIDATA = catalogoIndicadores(data2026).map(montarKpi);
    renderExecutiveCockpit(KPIDATA);
    renderAxisPerformance(KPIDATA);
    renderPriorities(KPIDATA);
    renderMovements(KPIDATA);
    renderIndicadores(KPIDATA);
    salvarFiltros();
  }

  function initEventos() {
    document.getElementById('buscaIndicador').addEventListener('input', e => { buscaAtual = e.target.value; renderIndicadores(KPIDATA); });
    document.getElementById('filtroStatus').addEventListener('change', e => { statusAtual = e.target.value; renderIndicadores(KPIDATA); });
    document.getElementById('toggleIndicadores').addEventListener('click', e => {
      const section = document.getElementById('todosIndicadores');
      const aberto = !section.hidden;
      section.hidden = aberto;
      e.currentTarget.setAttribute('aria-expanded', String(!aberto));
      e.currentTarget.innerHTML = aberto ? 'Explorar indicadores <span aria-hidden="true">↓</span>' : 'Recolher indicadores <span aria-hidden="true">↑</span>';
      if (!aberto) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    document.getElementById('drawerClose').addEventListener('click', fecharDrawer); document.getElementById('drawerOverlay').addEventListener('click', fecharDrawer); document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharDrawer(); });
  }

  async function init() {
    HUB.header.render('hubHeader', { systemLabel: CONFIG.systemLabel, title: CONFIG.title, subtitle: CONFIG.subtitle });
    HUB.footer.render('hubFooter');
    HUB.loading.show('loading', 'Carregando indicadores corporativos...');
    initEventos();
    try {
      const carregamentosHoraExtra = (CONFIG.horaExtraSources || []).map((source, index) =>
        HUB.data.loadCSV(source.url, { required: false, name: source.name || `Hora extra ${index + 1}` })
      );
      const [resultados, metasAR, ...fontesHoraExtra] = await Promise.all([
        HUB.data.loadCSV(CONFIG.csvResultadosUrl, { required: true, name: 'Indicadores gerais' }),
        HUB.data.loadCSV(CONFIG.csvARUrl, { required: true, name: 'Catálogo do Acordo de Resultados' }),
        ...carregamentosHoraExtra
      ]);
      INDICADORES_AR = new Set((metasAR || []).map(normalizarRow).map(r => norm(r.Indicador)).filter(Boolean));
      DATA = aplicarHoraExtra((resultados || []).map(normalizarRow).filter(r => clean(r.Indicador) && !INDICADORES_AR.has(norm(r.Indicador))), fontesHoraExtra);
      popularFiltros(); render();
      document.getElementById('conteudo').hidden = false;
      const linhasHoraExtra = fontesHoraExtra.reduce((total, rows) => total + rows.length, 0);
      const fontesAtivas = fontesHoraExtra.filter(rows => rows.length > 0).length;
      const registros2026 = DATA.filter(r => clean(r.Ano) === ANO_FIXO).length;
      document.getElementById('dataStatus').textContent = `Governança Corporativa · ${ANO_FIXO} · ${registros2026.toLocaleString('pt-BR')} registros na competência do painel · hora extra: ${fontesAtivas}/${fontesHoraExtra.length} fontes`;
    } catch (error) {
      const el = document.getElementById('errorState'); el.hidden = false; el.textContent = `Não foi possível carregar a base publicada: ${error.message}`;
      document.getElementById('dataStatus').textContent = 'Falha no carregamento';
    } finally { HUB.loading.hide('loading'); }
  }

  window.GOVERNANCA_TEST_API = {
    normalizarRow, eixoDaLinha, normalizarEixo, eixoPorPalavras, catalogoIndicadores, ehConsolidado, mesclarBases,
    numeroFlexivel, competenciaDaLinha, agregarFonteHoraExtra, consolidarHoraExtra, aplicarHoraExtra,
    atingimentoExplicito, resolverLinha, avaliarComParidade, distanciaMeta, distanciaMetaValor, percentualAtingimento, referenciaMetaPeriodo, calcularStatusReferencia,
    variacaoTemporal, sentidoAmigavel, resumoStatus, indicadorCTR,
    contarPorGrupo, blocosVisaoEstrategica, resumoGrupo, concentracaoPrincipal, gerarSituacaoCorporativa, gerarSinteseExecutiva,
    GRUPO_ORDEM, GRUPO_LABEL
  };
  if (!window.GOVERNANCA_DISABLE_AUTO_INIT) init();
})();
