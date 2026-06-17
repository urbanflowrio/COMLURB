/* ============================================================
   HUB COMLURB — Registro de Indicadores + Motor de Cálculo
   Usado por: Indicadores Gerais (catálogo) e Radar PRE (briefing)

   Mapeia cada um dos 63 indicadores oficiais ao eixo estratégico
   e define como ele aparece no painel: card executivo ou
   dimensão de drill dentro da Ficha de outro indicador.

   Eixo é decisão editorial, não vem da planilha.
   Diretoria NÃO é fixada aqui, é lida direto da planilha em
   tempo de execução.

   O motor de cálculo (status, tendência, avaliarIndicador) é
   compartilhado: qualquer página que precisar desses números
   chama essas funções, em vez de reimplementar a lógica.
   ============================================================ */

window.HUB = window.HUB || {};

HUB.indicadores = (function () {

  const EIXOS = ['Pessoas', 'Segurança', 'Operação', 'Atendimento', 'Sustentabilidade', 'Receita'];
  const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  // exibicao: 'card'  -> aparece como card executivo no painel geral
  //           'drill' -> só aparece como tipo de serviço dentro da
  //                      Ficha do indicador indicado em cardPai
  const REGISTRO = [

    // ---------------- PESSOAS (5) ----------------
    { indicador: 'Absenteísmo - Gerenciável', eixo: 'Pessoas', exibicao: 'card' },
    { indicador: 'Adicional Noturno Realizado', eixo: 'Pessoas', exibicao: 'card' },
    { indicador: 'Empregados Afastados', eixo: 'Pessoas', exibicao: 'card' },
    { indicador: 'Hora Extra Realizada', eixo: 'Pessoas', exibicao: 'card' },
    { indicador: 'Horas Domingos e Feriados Realizadas', eixo: 'Pessoas', exibicao: 'card' },

    // ---------------- SEGURANÇA (6) ----------------
    { indicador: 'Acidente de Trabalho – Típico', eixo: 'Segurança', exibicao: 'card' },
    { indicador: 'Acidente de Trabalho – Trajeto', eixo: 'Segurança', exibicao: 'card' },
    { indicador: 'Índice de Conformidade - PGR', eixo: 'Segurança', exibicao: 'card' },
    { indicador: 'Taxa de Frequência de Acidentes', eixo: 'Segurança', exibicao: 'card' },
    { indicador: 'Taxa de Gravidade de Acidentes', eixo: 'Segurança', exibicao: 'card' },
    { indicador: 'Treinamentos Realizados (NR)', eixo: 'Segurança', exibicao: 'card' },

    // ---------------- OPERAÇÃO (10) ----------------
    { indicador: 'Índice Padrão de Limpeza - IPL', eixo: 'Operação', exibicao: 'card' },
    { indicador: 'Desvio Padrão - IPL Setorial', eixo: 'Operação', exibicao: 'card' },
    { indicador: 'Índice Padrão de Roçada - IPR', eixo: 'Operação', exibicao: 'card' },
    { indicador: 'Índice de Utilização da Frota de Coleta Domiciliar', eixo: 'Operação', exibicao: 'card' },
    { indicador: 'Índice de Utilização da Frota de Remoção de Lixo Público', eixo: 'Operação', exibicao: 'card' },
    { indicador: 'Praças', eixo: 'Operação', exibicao: 'card' },
    { indicador: 'Produção do Serviço de Manejo Arbóreo', eixo: 'Operação', exibicao: 'card' },
    { indicador: 'Resíduos Coletados no RJ', eixo: 'Operação', exibicao: 'card' },
    { indicador: 'Resíduos Recebidos nas ETRs', eixo: 'Operação', exibicao: 'card' },
    { indicador: 'Resíduos Recebidos no CTR Gericinó', eixo: 'Operação', exibicao: 'card' },

    // ---------------- SUSTENTABILIDADE (6) ----------------
    { indicador: 'Cadastro de Grandes Geradores', eixo: 'Sustentabilidade', exibicao: 'card' },
    { indicador: 'Cadastro de Grandes Geradores com segregação de resíduos', eixo: 'Sustentabilidade', exibicao: 'card' },
    { indicador: 'Ecopontos', eixo: 'Sustentabilidade', exibicao: 'card' },
    { indicador: 'Índice do Coletado em Relação ao Potencial Reciclável', eixo: 'Sustentabilidade', exibicao: 'card' },
    { indicador: 'Resíduos Desviados do Aterro', eixo: 'Sustentabilidade', exibicao: 'card' },
    { indicador: 'Resíduos Orgânicos (Biometanização)', eixo: 'Sustentabilidade', exibicao: 'card' },

    // ---------------- RECEITA (2) ----------------
    { indicador: 'Índice de Eficiência da Arrecadação - Órgãos Públicos', eixo: 'Receita', exibicao: 'card' },
    { indicador: 'Índice de Eficiência da Arrecadação - Receitas Diversas', eixo: 'Receita', exibicao: 'card' },

    // ---------------- ATENDIMENTO — cards executivos (9) ----------------
    { indicador: 'Índice de Atendimento das Solicitações 1746', eixo: 'Atendimento', exibicao: 'card' },
    { indicador: 'Solicitações 1746', eixo: 'Atendimento', exibicao: 'card' },
    { indicador: 'Solicitações Ouvidoria', eixo: 'Atendimento', exibicao: 'card' },
    { indicador: 'Performance de Atendimento da Remoção Gratuita', eixo: 'Atendimento', exibicao: 'card' },
    { indicador: 'Performance de Atendimento de Capina em Logradouro', eixo: 'Atendimento', exibicao: 'card' },
    { indicador: 'Performance de Atendimento de Controle de Roedores e Caramujos', eixo: 'Atendimento', exibicao: 'card' },
    { indicador: 'Performance de Atendimento de Poda de Árvore', eixo: 'Atendimento', exibicao: 'card' },
    { indicador: 'Tempo Médio de Atendimento - Remoção Gratuita', eixo: 'Atendimento', exibicao: 'card' },
    { indicador: 'Tempo Médio de Atendimento - Vetores', eixo: 'Atendimento', exibicao: 'card' },

    // ---------------- ATENDIMENTO — drill por tipo de serviço, dentro de "Solicitações 1746" (13) ----------------
    { indicador: 'Solicitações 1746 - Capina', eixo: 'Atendimento', exibicao: 'drill', cardPai: 'Solicitações 1746', tipoServico: 'Capina' },
    { indicador: 'Solicitações 1746 - Coleta', eixo: 'Atendimento', exibicao: 'drill', cardPai: 'Solicitações 1746', tipoServico: 'Coleta' },
    { indicador: 'Solicitações 1746 - Destoca de Toco e Raiz', eixo: 'Atendimento', exibicao: 'drill', cardPai: 'Solicitações 1746', tipoServico: 'Destoca de Toco e Raiz' },
    { indicador: 'Solicitações 1746 - Limpeza', eixo: 'Atendimento', exibicao: 'drill', cardPai: 'Solicitações 1746', tipoServico: 'Limpeza' },
    { indicador: 'Solicitações 1746 - Limpeza de Ralos', eixo: 'Atendimento', exibicao: 'drill', cardPai: 'Solicitações 1746', tipoServico: 'Limpeza de Ralos' },
    { indicador: 'Solicitações 1746 - Poda de Árvore', eixo: 'Atendimento', exibicao: 'drill', cardPai: 'Solicitações 1746', tipoServico: 'Poda de Árvore' },
    { indicador: 'Solicitações 1746 - Praças', eixo: 'Atendimento', exibicao: 'drill', cardPai: 'Solicitações 1746', tipoServico: 'Praças' },
    { indicador: 'Solicitações 1746 - Remoção de Árvore', eixo: 'Atendimento', exibicao: 'drill', cardPai: 'Solicitações 1746', tipoServico: 'Remoção de Árvore' },
    { indicador: 'Solicitações 1746 - Remoção de Resíduos', eixo: 'Atendimento', exibicao: 'drill', cardPai: 'Solicitações 1746', tipoServico: 'Remoção de Resíduos' },
    { indicador: 'Solicitações 1746 - Remoção Gratuita', eixo: 'Atendimento', exibicao: 'drill', cardPai: 'Solicitações 1746', tipoServico: 'Remoção Gratuita' },
    { indicador: 'Solicitações 1746 - Risco de Queda', eixo: 'Atendimento', exibicao: 'drill', cardPai: 'Solicitações 1746', tipoServico: 'Risco de Queda' },
    { indicador: 'Solicitações 1746 - Varrição', eixo: 'Atendimento', exibicao: 'drill', cardPai: 'Solicitações 1746', tipoServico: 'Varrição' },
    { indicador: 'Solicitações 1746 - Vetores', eixo: 'Atendimento', exibicao: 'drill', cardPai: 'Solicitações 1746', tipoServico: 'Vetores' },

    // ---------------- ATENDIMENTO — drill por tipo de serviço, dentro de "Solicitações Ouvidoria" (12) ----------------
    { indicador: 'Solicitações Ouvidoria - Capina', eixo: 'Atendimento', exibicao: 'drill', cardPai: 'Solicitações Ouvidoria', tipoServico: 'Capina' },
    { indicador: 'Solicitações Ouvidoria - Coleta', eixo: 'Atendimento', exibicao: 'drill', cardPai: 'Solicitações Ouvidoria', tipoServico: 'Coleta' },
    { indicador: 'Solicitações Ouvidoria - Destoca de Toco e Raiz', eixo: 'Atendimento', exibicao: 'drill', cardPai: 'Solicitações Ouvidoria', tipoServico: 'Destoca de Toco e Raiz' },
    { indicador: 'Solicitações Ouvidoria - Limpeza de Ralos', eixo: 'Atendimento', exibicao: 'drill', cardPai: 'Solicitações Ouvidoria', tipoServico: 'Limpeza de Ralos' },
    { indicador: 'Solicitações Ouvidoria - Poda de Árvore', eixo: 'Atendimento', exibicao: 'drill', cardPai: 'Solicitações Ouvidoria', tipoServico: 'Poda de Árvore' },
    { indicador: 'Solicitações Ouvidoria - Praças', eixo: 'Atendimento', exibicao: 'drill', cardPai: 'Solicitações Ouvidoria', tipoServico: 'Praças' },
    { indicador: 'Solicitações Ouvidoria - Remoção de Árvore', eixo: 'Atendimento', exibicao: 'drill', cardPai: 'Solicitações Ouvidoria', tipoServico: 'Remoção de Árvore' },
    { indicador: 'Solicitações Ouvidoria - Remoção de Resíduos', eixo: 'Atendimento', exibicao: 'drill', cardPai: 'Solicitações Ouvidoria', tipoServico: 'Remoção de Resíduos' },
    { indicador: 'Solicitações Ouvidoria - Remoção Gratuita', eixo: 'Atendimento', exibicao: 'drill', cardPai: 'Solicitações Ouvidoria', tipoServico: 'Remoção Gratuita' },
    { indicador: 'Solicitações Ouvidoria - Risco de Queda', eixo: 'Atendimento', exibicao: 'drill', cardPai: 'Solicitações Ouvidoria', tipoServico: 'Risco de Queda' },
    { indicador: 'Solicitações Ouvidoria - Varrição', eixo: 'Atendimento', exibicao: 'drill', cardPai: 'Solicitações Ouvidoria', tipoServico: 'Varrição' },
    { indicador: 'Solicitações Ouvidoria - Vetores', eixo: 'Atendimento', exibicao: 'drill', cardPai: 'Solicitações Ouvidoria', tipoServico: 'Vetores' }

  ];

  // ---------------- helpers de registro ----------------

  function porIndicador(nome) { return REGISTRO.find(function (r) { return r.indicador === nome; }); }
  function porEixo(eixo) { return REGISTRO.filter(function (r) { return r.eixo === eixo; }); }
  function cardsDoEixo(eixo) { return REGISTRO.filter(function (r) { return r.eixo === eixo && r.exibicao === 'card'; }); }
  function drillsDoCard(nomeCardPai) { return REGISTRO.filter(function (r) { return r.cardPai === nomeCardPai; }); }
  function getEixo(nome) { const r = porIndicador(nome); return r ? r.eixo : null; }
  function ehCard(nome) { const r = porIndicador(nome); return r ? r.exibicao === 'card' : false; }
  function listaIndicadoresValidos() { return REGISTRO.map(function (r) { return r.indicador; }); }
  function todosOsCards() { return REGISTRO.filter(function (r) { return r.exibicao === 'card'; }); }

  // ---------------- motor de cálculo (compartilhado) ----------------

  function parseNumeroBR(v) {
    if (v === undefined || v === null) return null;
    const s = String(v).trim();
    if (s === '' || s === '-') return null;
    const n = parseFloat(s.replace(',', '.'));
    return isNaN(n) ? null : n;
  }

  // pega a linha consolidada de um indicador pra uma diretoria (ou COMLURB) num ano,
  // ignorando o detalhe de Superintendência/Gerência (que fica pra Ficha de cada indicador)
  function linhaCorporativa(data, indicador, diretoria, ano) {
    return data.find(function (r) {
      return r.Indicador === indicador &&
        r.Diretoria === diretoria &&
        r['Superint.'] === '-' &&
        r['Gerência'] === '-' &&
        String(r.Ano) === String(ano);
    });
  }

  // limiteAtencao: desvio percentual da meta até virar "crítico". Rascunho, 10% por padrão.
  function calcularStatus(valor, meta, sentido, limiteAtencao) {
    limiteAtencao = limiteAtencao === undefined ? 0.10 : limiteAtencao;
    if (valor === null) return { cor: '', label: 'sem dado', desvio: null };
    if (meta === null) return { cor: '', label: 'sem meta definida', desvio: null };
    const atingiu = sentido === '↑' ? valor >= meta : valor <= meta;
    if (atingiu) return { cor: 'green', label: 'dentro da meta', desvio: 0 };
    if (meta === 0) return { cor: 'red', label: 'crítico', desvio: 1 };
    const desvio = sentido === '↑' ? (meta - valor) / Math.abs(meta) : (valor - meta) / Math.abs(meta);
    if (desvio <= limiteAtencao) return { cor: 'orange', label: 'atenção', desvio: desvio };
    return { cor: 'red', label: 'crítico', desvio: desvio };
  }

  // tendência simples: olha as transições mês a mês e conta quantos ciclos
  // consecutivos mantêm a mesma direção, a partir do mês mais recente.
  function calcularTendencia(row, sentido) {
    const valores = [];
    MESES.forEach(function (m) {
      const v = parseNumeroBR(row[m]);
      if (v !== null) valores.push(v);
    });
    if (valores.length < 2) return null;

    const direcoes = [];
    for (let i = 1; i < valores.length; i++) {
      const diff = valores[i] - valores[i - 1];
      direcoes.push(Math.abs(diff) < 1e-9 ? 0 : (diff > 0 ? 1 : -1));
    }

    const ultimaDirecao = direcoes[direcoes.length - 1];
    if (ultimaDirecao === 0) return { simbolo: '→', texto: 'estável', ciclos: 0 };

    let ciclos = 0;
    for (let i = direcoes.length - 1; i >= 0; i--) {
      if (direcoes[i] === ultimaDirecao) ciclos++;
      else break;
    }

    const melhorando = (sentido === '↑' && ultimaDirecao === 1) || (sentido === '↓' && ultimaDirecao === -1);
    return { simbolo: melhorando ? '↑' : '↓', texto: melhorando ? 'melhorando' : 'piorando', ciclos: ciclos };
  }

  // função única que qualquer página chama pra avaliar um indicador:
  // devolve valor, meta, unidade, status, tendência e delta já calculados.
  function avaliarIndicador(data, indicadorNome, diretoria, ano, limiteAtencao) {
    const row = linhaCorporativa(data, indicadorNome, diretoria, ano);
    if (!row) {
      return {
        indicador: indicadorNome, row: null, acumulado: null, meta: null,
        unidade: '', sentido: null, status: { cor: '', label: 'sem dado', desvio: null },
        tendencia: null, delta: null
      };
    }
    const acumulado = parseNumeroBR(row.Acumulado);
    const meta = parseNumeroBR(row.Meta);
    const sentido = row.Sentido;
    const unidade = row.Unidade || '';
    const status = calcularStatus(acumulado, meta, sentido, limiteAtencao);
    const tendencia = calcularTendencia(row, sentido);
    const delta = (meta !== null && acumulado !== null) ? (acumulado - meta) : null;
    return { indicador: indicadorNome, row: row, acumulado: acumulado, meta: meta, unidade: unidade, sentido: sentido, status: status, tendencia: tendencia, delta: delta };
  }

  return {
    EIXOS: EIXOS,
    MESES: MESES,
    REGISTRO: REGISTRO,
    porIndicador: porIndicador,
    porEixo: porEixo,
    cardsDoEixo: cardsDoEixo,
    drillsDoCard: drillsDoCard,
    getEixo: getEixo,
    ehCard: ehCard,
    listaIndicadoresValidos: listaIndicadoresValidos,
    todosOsCards: todosOsCards,
    parseNumeroBR: parseNumeroBR,
    linhaCorporativa: linhaCorporativa,
    calcularStatus: calcularStatus,
    calcularTendencia: calcularTendencia,
    avaliarIndicador: avaliarIndicador
  };

})();
