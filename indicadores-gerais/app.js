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

  let DATA = [];
  let KPIDATA = [];
  let anoSelecionado = '';
  let anosDisponiveis = [];
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

  function distanciaMeta(k) {
    if (k.acumulado === null) return 'Sem resultado disponível';
    if (k.meta === null) return 'Sem meta definida';
    const menorMelhor = clean(k.sentido) === '↓';
    if (menorMelhor) return k.acumulado <= k.meta ? `${formatDiferenca(k.meta - k.acumulado, k.unidade)} abaixo do limite` : `Excesso de ${formatDiferenca(k.acumulado - k.meta, k.unidade)}`;
    return k.acumulado >= k.meta ? `${formatDiferenca(k.acumulado - k.meta, k.unidade)} acima da meta` : `Déficit de ${formatDiferenca(k.meta - k.acumulado, k.unidade)}`;
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

  function anoPrincipal() {
    if (anoSelecionado !== 'comparar') return anoSelecionado;
    return anosDisponiveis[anosDisponiveis.length - 1] || '';
  }

  function anoComparacao() {
    if (anoSelecionado !== 'comparar' || anosDisponiveis.length < 2) return null;
    return anosDisponiveis[anosDisponiveis.length - 2];
  }

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
    const anoBase = anoPrincipal();
    const aval = avaliarComParidade(entry.indicador, diretoriaSelecionada, anoBase);
    const k = Object.assign({ eixo: entry.eixo, eixoLabel: EIXO_LABEL[entry.eixo] || entry.eixo, ano: anoBase }, aval);
    k.distanciaTexto = distanciaMeta(k);
    k.atingimento = percentualAtingimento(k);
    k.variacao = anoSelecionado === 'comparar' ? comparacaoAnual(entry.indicador, k.sentido, k.unidade) : variacaoTemporal(k.row, k.sentido, k.unidade);
    k.rowComparacao = anoComparacao() ? resolverLinha(entry.indicador, diretoriaSelecionada, anoComparacao()) : null;
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

  function classeEixo(r) {
    const cobertura = r.percentualCobertura || 0;
    const aderencia = r.percentualMeta || 0;
    const propCriticos = r.comStatus ? r.red / r.comStatus : 0;
    if (cobertura < 50) return 'insuf';
    if (aderencia < 60 || propCriticos > 0.25) return 'crit';
    if (cobertura < 75 || aderencia < 80 || r.orange > 0 || r.red > 0) return 'att';
    return 'ok';
  }

  function labelEixo(cls) { return cls === 'ok' ? 'Adequado' : cls === 'att' ? 'Atenção' : cls === 'crit' ? 'Crítico' : 'Leitura insuficiente'; }
  function fillClass(cls) { return cls === 'ok' ? 'green' : cls === 'att' ? 'orange' : cls === 'crit' ? 'red' : 'purple'; }

  function renderResumo(kpis) {
    const r = resumoStatus(kpis);
    HUB.cards.render('kpisResumo', [
      { label: 'Aderência às metas', value: r.percentualMeta || 0, format: 'custom', customFormatter: () => r.percentualMeta === null ? '—' : `${r.percentualMeta}%`, note: `${r.green} de ${r.comStatus} indicadores avaliáveis`, feature: true },
      { label: 'Cobertura da leitura', value: r.percentualCobertura || 0, format: 'custom', customFormatter: () => r.percentualCobertura === null ? '—' : `${r.percentualCobertura}%`, note: `${r.comStatus} de ${r.total} monitorados`, color: 'blue' },
      { label: 'Em atenção', value: r.orange, note: `${r.orange} de ${r.comStatus} avaliáveis`, color: 'orange' },
      { label: 'Críticos', value: r.red, note: `${r.red} de ${r.comStatus} avaliáveis`, color: 'red' },
      { label: 'Sem leitura', value: r.sem, note: `${r.sem} de ${r.total} monitorados`, color: 'purple' }
    ]);
  }

  function renderCentro(kpis) {
    const geral = resumoStatus(kpis);
    const eixos = EIXO_ORDEM.map(eixo => {
      const arr = kpis.filter(k => k.eixo === eixo);
      const r = resumoStatus(arr);
      return { eixo, r, cls: classeEixo(r), propCriticos: r.comStatus ? r.red / r.comStatus : 0 };
    }).filter(x => x.r.total);
    const risco = eixos.slice().sort((a, b) => b.r.red - a.r.red || b.propCriticos - a.propCriticos || (a.r.percentualMeta || 0) - (b.r.percentualMeta || 0))[0];
    const insuf = eixos.filter(x => x.cls === 'insuf');
    const partes = [`${geral.percentualMeta === null ? 'Sem aderência calculável' : geral.percentualMeta + '% de aderência às metas'}, com ${geral.percentualCobertura || 0}% de cobertura da leitura.`];
    if (risco && risco.r.red > 0) partes.push(`${EIXO_LABEL[risco.eixo] || risco.eixo} concentra ${risco.r.red} indicador${risco.r.red === 1 ? '' : 'es'} crítico${risco.r.red === 1 ? '' : 's'}.`);
    if (insuf.length) partes.push(`${insuf.map(x => EIXO_LABEL[x.eixo] || x.eixo).join(' e ')} ${insuf.length === 1 ? 'apresenta' : 'apresentam'} leitura insuficiente.`);
    document.getElementById('govNote').textContent = partes.join(' ');
  }

  function renderRadar(kpis) {
    const html = EIXO_ORDEM.map(eixo => {
      const arr = kpis.filter(k => k.eixo === eixo); if (!arr.length) return '';
      const r = resumoStatus(arr); const cls = classeEixo(r); const pct = r.percentualMeta;
      const largura = pct === null ? 0 : Math.max(4, pct);
      return `<div class="radarRow"><div class="radarName"><b>${esc(EIXO_LABEL[eixo] || eixo)}</b><span>${esc(EIXO_DESC[eixo] || '')}</span><span class="radarComposition">${r.green} dentro · ${r.orange} atenção · ${r.red} críticos · ${r.sem} sem leitura · cobertura ${r.percentualCobertura || 0}%</span></div><div class="track radarTrack"><div class="fill ${fillClass(cls)}" style="width:${largura}%"></div></div><div class="radarPct">${pct === null ? '—' : pct + '%'}</div><div class="radarStatus"><span class="tag ${cls}">${labelEixo(cls)}</span></div></div>`;
    }).join('');
    document.getElementById('radarRows').innerHTML = html;
    document.getElementById('radarHint').textContent = `${kpis.length} indicadores monitorados`;
  }

  function statusTag(k) { return k.status.cor === 'green' ? ['ok', 'Dentro da meta'] : k.status.cor === 'orange' ? ['att', 'Atenção'] : k.status.cor === 'red' ? ['crit', 'Crítico'] : ['purple', k.status.label === 'sem dado' ? 'Sem dado' : 'Sem meta']; }

  function cardHTML(k) {
    const tag = statusTag(k);
    const movimento = k.variacao ? k.variacao.texto : '';
    return `<article class="indCard" data-indicador="${esc(k.indicador)}" tabindex="0" role="button"><div><div class="indCardTop"><h3>${esc(k.indicador)}</h3><span class="tag ${tag[0]}">${esc(tag[1])}</span></div><div class="indValue ${esc(k.status.cor || '')}">${esc(formatValor(k.acumulado, k.unidade))}</div>${k.atingimento ? `<div class="indAchievement">${esc(k.atingimento.texto)}</div>` : ''}<div class="indNote">${esc(k.distanciaTexto)}</div>${movimento ? `<div class="indTrend">${esc(movimento)}</div>` : ''}</div><div class="indAction">Abrir ficha →</div></article>`;
  }

  function filtrar(kpis) {
    const termo = norm(buscaAtual);
    return kpis.filter(k => (!termo || norm(k.indicador).includes(termo) || norm(k.eixoLabel).includes(termo)) && (statusAtual === 'todos' || (statusAtual === 'sem' ? !k.status.cor : k.status.cor === statusAtual)));
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
    container.querySelectorAll('.indCard').forEach(card => {
      const open = () => { const k = KPIDATA.find(x => x.indicador === card.dataset.indicador); if (k) abrirDrawer(k); };
      card.addEventListener('click', open); card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
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
      const cells = HUB.indicadores.MESES.map(m => `<div class="monthCell"><small>${m}</small><b>${esc(formatValor(row ? HUB.indicadores.parseNumeroBR(row[m]) : null, k.unidade))}</b></div>`).join('');
      return `<section class="yearCycles"><div class="yearCyclesTitle">${esc(ano)}</div><div class="months">${cells}</div></section>`;
    }).join('');
  }

  function sentidoAmigavel(sentido) {
    const s = clean(sentido);
    if (s === '↓' || norm(s) === 'MENOR' || norm(s) === 'DECRESCENTE' || norm(s) === 'ABAIXO') return 'Menor resultado é melhor';
    if (s === '↑' || norm(s) === 'MAIOR' || norm(s) === 'CRESCENTE' || norm(s) === 'ACIMA') return 'Maior resultado é melhor';
    return 'Regra de sentido não informada';
  }

  function abrirDrawer(k) {
    document.getElementById('drawerEixo').textContent = `${k.eixoLabel} · ${anoSelecionado === 'comparar' ? 'Comparativo ' + anoComparacao() + ' × ' + anoPrincipal() : anoPrincipal()}`;
    document.getElementById('drawerTitulo').textContent = k.indicador;
    const tag = statusTag(k);
    document.getElementById('drawerDetails').innerHTML = `<div class="detailBox ${classeSemantica(k, 'status')}"><small>Resultado ${esc(anoPrincipal())}</small><b>${esc(formatValor(k.acumulado, k.unidade))}</b></div><div class="detailBox"><small>Meta</small><b>${esc(formatValor(k.meta, k.unidade))}</b></div><div class="detailBox ${classeSemantica(k, 'status')}"><small>Status</small><b><span class="tag ${tag[0]}">${esc(tag[1])}</span></b></div><div class="detailBox"><small>Atingimento da meta</small><b>${esc(k.atingimento ? k.atingimento.texto.replace(' de atingimento', '') : '—')}</b></div><div class="detailBox"><small>Distância da meta</small><b>${esc(k.distanciaTexto)}</b></div><div class="detailBox"><small>Sentido do indicador</small><b>${esc(sentidoAmigavel(k.sentido))}</b></div><div class="detailBox detailBoxWide"><small>${anoSelecionado === 'comparar' ? 'Comparação entre anos' : 'Movimento recente'}</small><b>${esc(k.variacao ? k.variacao.texto : 'Sem ciclos suficientes para comparação')}</b>${k.variacao && k.variacao.detalhe ? `<span class="detailSupport">Variação: ${esc(k.variacao.detalhe)}</span>` : ''}</div>`;
    document.getElementById('drawerMonths').innerHTML = ciclosHTML(k);
    document.getElementById('drawerOverlay').classList.add('open'); document.getElementById('drawer').classList.add('open'); document.getElementById('drawer').setAttribute('aria-hidden', 'false');
  }

  function fecharDrawer() { document.getElementById('drawerOverlay').classList.remove('open'); document.getElementById('drawer').classList.remove('open'); document.getElementById('drawer').setAttribute('aria-hidden', 'true'); }

  function salvarFiltros() { try { localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify({ ano: anoSelecionado })); } catch (_) {} }
  function restaurarFiltros() { try { return JSON.parse(localStorage.getItem(FILTER_STORAGE_KEY) || '{}'); } catch (_) { return {}; } }

  function popularFiltros() {
    const saved = restaurarFiltros();
    anosDisponiveis = Array.from(new Set(DATA.map(r => clean(r.Ano)).filter(Boolean))).sort((a, b) => Number(a) - Number(b));
    diretoriaSelecionada = CONFIG.diretoriaDefault;
    const podeComparar = anosDisponiveis.length >= 2;
    anoSelecionado = saved.ano === 'comparar' && podeComparar ? 'comparar' : anosDisponiveis.includes(saved.ano) ? saved.ano : anosDisponiveis.includes(CONFIG.anoPreferencial) ? CONFIG.anoPreferencial : (anosDisponiveis[anosDisponiveis.length - 1] || '');
    const ano = document.getElementById('filtroAno');
    const opcoes = anosDisponiveis.map(v => `<option value="${esc(v)}">${esc(v)}</option>`);
    if (podeComparar) opcoes.push(`<option value="comparar">Comparar ${esc(anosDisponiveis[anosDisponiveis.length - 2])} e ${esc(anosDisponiveis[anosDisponiveis.length - 1])}</option>`);
    ano.innerHTML = opcoes.join(''); ano.value = anoSelecionado;
  }

  function render() { KPIDATA = catalogoIndicadores(DATA).map(montarKpi); renderResumo(KPIDATA); renderCentro(KPIDATA); renderRadar(KPIDATA); renderIndicadores(KPIDATA); salvarFiltros(); }

  function initEventos() {
    document.getElementById('filtroAno').addEventListener('change', e => { anoSelecionado = e.target.value; render(); });
    document.getElementById('buscaIndicador').addEventListener('input', e => { buscaAtual = e.target.value; renderIndicadores(KPIDATA); });
    document.getElementById('filtroStatus').addEventListener('change', e => { statusAtual = e.target.value; renderIndicadores(KPIDATA); });
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
      document.getElementById('dataStatus').textContent = `Indicadores gerais atualizados · ${DATA.length.toLocaleString('pt-BR')} registros exibidos · ${INDICADORES_AR.size.toLocaleString('pt-BR')} indicadores do AR direcionados ao módulo próprio · hora extra: ${fontesAtivas}/${fontesHoraExtra.length} fontes`;
    } catch (error) {
      const el = document.getElementById('errorState'); el.hidden = false; el.textContent = `Não foi possível carregar a base publicada: ${error.message}`;
      document.getElementById('dataStatus').textContent = 'Falha no carregamento';
    } finally { HUB.loading.hide('loading'); }
  }

  window.GOVERNANCA_TEST_API = { normalizarRow, eixoDaLinha, normalizarEixo, eixoPorPalavras, catalogoIndicadores, ehConsolidado, mesclarBases, numeroFlexivel, competenciaDaLinha, agregarFonteHoraExtra, consolidarHoraExtra, aplicarHoraExtra, atingimentoExplicito, resolverLinha, avaliarComParidade, distanciaMeta, percentualAtingimento, variacaoTemporal, sentidoAmigavel, resumoStatus, classeEixo };
  if (!window.GOVERNANCA_DISABLE_AUTO_INIT) init();
})();
