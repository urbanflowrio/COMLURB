/* ============================================================
   HUB COMLURB · BIBLIOTECA OFICIAL · hub-rules-ar.js
   Camada 2 (Regras específicas) · v1.2.0
   Dependências: hub-core, hub-rules.
   PROIBIDO nesta camada: DOM, fetch, conhecimento de layout de fonte
   (isso é Adapter AR), regra de outro módulo (IPL, Engenharia, etc.).

   v1.1.0: removida a dependência de hub-utils.js do HUB.require — este
   arquivo nunca chamou nenhuma função de HUB.format (usa suas próprias
   normAR/atingimentoAR, ver abaixo); a dependência era desnecessária e,
   conferido por diff contra main em 15/07/2026, o hub-utils.js
   publicado nem registra o componente "utils" (é uma versão anterior à
   "Fase 2"), então HUB.require("utils") quebraria a carga da página.

   FASE 4 (07/2026) — Piloto A (AR).
   Este arquivo contém apenas regras institucionais do AR que NÃO são
   genéricas o suficiente para viver em hub-rules.js. Cada regra abaixo
   foi extraída e comprovada a partir de uma destas fontes (nunca de
   memória):
     - código vivo de ar/index.html (script inline, único caminho de
       execução real do AR — ar/ar.js é órfão, não referenciado);
     - hub-core.js (HUB.config.combinacaoECPLiberada);
     - REGRAS_AR_2026.md NÃO está presente neste ZIP — nenhuma regra
       abaixo depende exclusivamente desse documento; onde a memória
       do produto menciona uma regra que o código não comprova, isso
       está registrado explicitamente como PENDÊNCIA, não implementado.

   v1.2.0 — CORREÇÃO (achado de auditoria com dados reais, E08/P01):
   o campo numérico "atingimento" tinha uma guarda extra (atual!==0) que
   o legado NUNCA teve para esse campo especificamente. ar/index.html
   trata "status" (Dentro da Meta/Atenção/Crítico/Sem dado) e
   "atingimento" (o número bruto) como DUAS contas separadas, com
   guardas DIFERENTES:
     - status (statusCanonico): atual===0 OU meta===0 → "Sem dado"
       (guarda ampla, intencional — não presumir "zero" como medição
       real para fins de classificação executiva).
     - atingimento (dentro de processar()): só exige atual≠null,
       meta≠null, meta≠0. NÃO exige atual≠0 — atual=0 com meta>0 é uma
       divisão válida (0/meta=0), calculada e exibida normalmente.
   Este arquivo agora replica as duas contas separadamente, com guardas
   diferentes cada uma (ver aplicarRegrasIndicador): status continua via
   statusCanonicoAR/statusComPrecedencia (guarda ampla, correta);
   atingimento é calculado inline com a guarda estrita do legado (só
   meta≠0), nunca chamando atingimentoAR() para este campo — essa
   função continua existindo e correta, mas só serve à conta de status.

   DIVERGÊNCIAS COMPROVADAS ENTRE ESTE ARQUIVO E O LEGADO (documentadas
   deliberadamente, ver IMPLEMENTATION_STATUS.md → Fase 4):
     1. (RESOLVIDA em v1.2.0 — ver nota acima.) HUB.rules.atingimento
        (genérico, hub-rules.js) continua tendo comportamento diferente
        do AR para menor_melhor com atual=0/meta=0 — por isso o AR
        continua usando suas próprias funções (atingimentoAR para status,
        cálculo inline para o campo atingimento), nunca delegando a
        HUB.rules.atingimento.
     2. Tendência: ar/index.html usa limiar de estabilidade por diferença
        ABSOLUTA (<0.00001) entre médias de 3 meses. HUB.rules.
        tendenciaTrimestral usa limiar RELATIVO de 2% (LIMIAR_ESTAVEL).
        São regras diferentes por desenho (uma para AR, outra herdada do
        Balanço-Receita) — este arquivo replica a do AR (calcularTendenciaAR),
        não usa HUB.rules.tendenciaTrimestral, para não introduzir
        divergência entre legado e novo pipeline no piloto.
     3. E03 (ranking nacional SINISA): a memória do produto registra
        "E03 = binário Top-5/fora do Top-5, nunca contínuo". O código
        vivo de ar/index.html NÃO implementa esse binário — E03 é
        tratado pelo mesmo statusCanonico genérico de todo indicador
        (atingimento contínuo conforme sentido). Este arquivo replica o
        comportamento do CÓDIGO (genérico), não da memória. Ver bloqueio
        registrado em BLOQUEIOS_PENDENTES abaixo — decisão da proprietária
        do produto necessária antes de implementar o binário.
     4. Combinação E+C+P (bônus total): hub-core.js já contém o campo de
        governança HUB.config.combinacaoECPLiberada=false com o comentário
        "Enquanto false, hub-rules-ar deve retornar {bloqueado:true}".
        ar/index.html IGNORA esse campo e sempre soma regE+regC+regP em
        um bonusTotal numérico exibido no placar executivo. Este arquivo
        obedece a hub-core.js (decisão de governança já registrada, mais
        recente e mais autoritativa que o comportamento do painel) e
        retorna a combinação bloqueada enquanto a flag for false. Esta é
        uma divergência ESPERADA e FORMALMENTE EXPLICADA (não um defeito
        do novo pipeline) — ver comparação legado×novo.
   ============================================================ */

(function () {
  "use strict";

  var HUB = window.HUB;
  HUB.require("core", "rules");

  /* ================================================================
     PENDÊNCIAS INSTITUCIONAIS REGISTRADAS (não implementadas por falta
     de comprovação em código/documento — ver DATA_INGESTION_MODEL /
     ADR-005, falha segura: melhor não implementar do que inventar)
     ================================================================ */

  var BLOQUEIOS_PENDENTES = [
    {
      id: "E03_BINARIO",
      descricao: "Memória do produto menciona regra binária Top-5/fora do Top-5 para E03 " +
        "(ranking nacional SINISA). Não encontrada em ar/index.html nem em nenhum documento " +
        "presente neste ZIP (REGRAS_AR_2026.md ausente). E03 é tratado pelo statusCanonico " +
        "genérico até decisão da proprietária do produto, com evidência (código ou documento).",
      bloqueiaFase: false
    }
  ];

  /* ================================================================
     CONFIGURAÇÃO INSTITUCIONAL DO CICLO — extraída verbatim de
     ar/index.html (const CASADOS, BONUS_ESTRATEGICO, BONUS_CONDICIONADO,
     BONUS_PERFORMANCE). Nenhum valor foi alterado.
     ================================================================ */

  var CASADOS = [
    {
      id: "par-02",
      label: "Meta dupla: Recuperação de Resíduos + Ranking Nacional",
      membros: ["E02", "E03"],
      bonusNote: "Os dois precisam ser atingidos para que este par conte como uma meta na " +
        "bonificação. O ranking nacional é apurado pela SINISA com dados do ano anterior — " +
        "o resultado de 2026 só será publicado em 2027."
    },
    {
      id: "par-03",
      label: "Meta dupla: Atendimento 1746 Poda + Satisfação Poda",
      membros: ["E04", "E05"],
      bonusNote: "São dois requisitos da mesma meta: atendimento igual ou superior a 95% no " +
        "prazo e nota de satisfação igual ou superior a 4,5. Os dois precisam ser atingidos juntos."
    },
    {
      id: "par-04",
      label: "Meta dupla: Atendimento 1746 Remoção + Satisfação Remoção",
      membros: ["E06", "E07"],
      bonusNote: "São dois requisitos da mesma meta: atendimento igual ou superior a 85% no " +
        "prazo em cada subprefeitura e nota de satisfação igual ou superior a 4,4 para a " +
        "cidade. Os dois precisam ser atingidos juntos."
    },
    {
      id: "par-c06",
      label: "Meta dupla (Condicionada): Conformidade IPL + Desvio Padrão IPL",
      membros: ["C01", "C02"],
      bonusNote: "São dois requisitos da mesma meta: conformidade acumulada igual ou superior " +
        "a 80% e desvio padrão entre gerências igual ou inferior a 5,9. Os dois precisam ser " +
        "atingidos juntos."
    }
  ];

  var BONUS_ESTRATEGICO = [
    { metas: 5, nota: 8.7, pct: 74 },
    { metas: 4, nota: 8.4, pct: 68 },
    { metas: 3, nota: 8, pct: 60 },
    { metas: 2, nota: 7, pct: 20 },
    { metas: 1, nota: 6, pct: 0 },
    { metas: 0, nota: 0, pct: 0 }
  ];

  var BONUS_CONDICIONADO = [
    { metas: 3, ponto: 0.3, pct: 6 },
    { metas: 2, ponto: 0.2, pct: 4 },
    { metas: 1, ponto: 0, pct: 0 },
    { metas: 0, ponto: 0, pct: 0 }
  ];

  var BONUS_PERFORMANCE = { ponto: 1, pct: 20 };

  var GATE_MINIMO_ESTRATEGICAS = 3; // memória do produto (≥3 de 5) confirmada por
                                     // condicionalAtiva=metasEstrategicasAtingidas>=3 no legado

  /* ================================================================
     HELPERS DE TEXTO — réplica exata de norm()/maiorMelhor()/isPercent()
     do legado (minúsculo, sem acento). Deliberadamente distintos de
     HUB.format.norm (que retorna MAIÚSCULO) para não alterar o
     comportamento comprovado do AR.
     ================================================================ */

  function normAR(v) {
    return String(v == null ? "" : v)
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/\s+/g, " ").trim();
  }

  function maiorMelhorAR(sentido) {
    var s = normAR(sentido);
    return s.indexOf("maior") !== -1 || s.indexOf("\u2191") !== -1 || s === "";
  }

  function isPercentAR(unidade) {
    var u = normAR(unidade);
    return u.indexOf("percent") !== -1 || u === "%";
  }

  function ehNumero(v) {
    return typeof v === "number" && isFinite(v);
  }

  /**
   * Escala um valor numérico já convertido (pt-BR → number pelo Adapter)
   * conforme a unidade, igual a calcValue() do legado: se a unidade é
   * percentual e o número está acima de 1,5, assume-se que veio como
   * "45" (não "0,45") e divide por 100.
   */
  function escalarPorUnidade(n, unidade) {
    if (n === null || n === undefined) return null;
    if (isPercentAR(unidade) && n > 1.5) return n / 100;
    return n;
  }

  /* ================================================================
     STATUS CANÔNICO DO AR — réplica exata de statusCanonico() do legado.
     Guarda de zero/nulo própria (ver divergência 1 no cabeçalho).
     ================================================================ */

  function atingimentoAR(atual, meta, sentido) {
    if (atual === null || meta === null || atual === 0 || meta === 0) return null;
    return maiorMelhorAR(sentido) ? atual / meta : meta / atual;
  }

  function statusCanonicoAR(atual, meta, sentido) {
    var a = atingimentoAR(atual, meta, sentido);
    if (a === null) return HUB.rules.STATUS.SEM_DADO;
    if (a >= HUB.rules.LIMIAR_DENTRO) return HUB.rules.STATUS.DENTRO;
    if (a >= HUB.rules.LIMIAR_ATENCAO) return HUB.rules.STATUS.ATENCAO;
    return HUB.rules.STATUS.CRITICO;
  }

  function tagClassAR(status) {
    var s = normAR(status);
    if (s.indexOf("dentro") !== -1 || s.indexOf("superado") !== -1) return "ok";
    if (s.indexOf("aten") !== -1) return "att";
    if (s.indexOf("critic") !== -1) return "crit";
    return "nd";
  }

  function grupoOrdemAR(grupo) {
    var g = normAR(grupo);
    if (g.indexOf("estrateg") !== -1) return 1;
    if (g.indexOf("condicion") !== -1) return 2;
    if (g.indexOf("performance") !== -1) return 3;
    return 9;
  }

  /* ================================================================
     PRECEDÊNCIA DE STATUS PUBLICADO (coluna "Status" da aba AR_2026)
     Réplica exata da regra em processar(): se a coluna Status vier
     preenchida e diferente de "Indisponível", ela prevalece sobre o
     status calculado localmente. No código atual esta regra é GENÉRICA
     (vale para qualquer código, não só C01/C02) — é o mecanismo real
     que implementa, na prática, a precedência SARC mencionada para
     C01/C02: quando a Presidência publica um status oficial na planilha
     (tipicamente C01/C02, cujo cálculo de origem é o SARC), ele vence.
     ================================================================ */

  function statusComPrecedencia(statusPublicadoRaw, atual, metaRef, sentido) {
    var raw = String(statusPublicadoRaw == null ? "" : statusPublicadoRaw).trim();
    if (raw && raw !== "Indisponível") {
      if (raw === "Superado" || raw === "Dentro da Meta") return { status: "Dentro da Meta", origem: "SARC" };
      if (raw === "Atenção") return { status: "Atenção", origem: "SARC" };
      if (raw === "Crítico") return { status: "Crítico", origem: "SARC" };
      return { status: "Sem dado", origem: "SARC" };
    }
    return { status: statusCanonicoAR(atual, metaRef, sentido), origem: "local" };
  }

  /* ================================================================
     META PROPORCIONAL — réplica exata do bloco isSomaAnual em
     processar(): indicadores de acumulação SOMA com periodicidade
     mensal têm a meta anual prorateada pelo mês corrente do calendário
     (não confundir com a regra de exclusão do mês corrente de
     hub-rules.js, que é sobre ciclo de pagamento — são coisas diferentes).
     ================================================================ */

  function calcularMetaProporcional(meta, tipoAcumulado, periodicidade, mesAtual) {
    var isSomaAnual = String(tipoAcumulado || "").toUpperCase() === "SOMA" &&
      normAR(periodicidade).indexOf("mensal") !== -1;
    if (!isSomaAnual || meta === null) return { aplica: false, metaProporcional: null };
    var mes = mesAtual || (new Date().getMonth() + 1);
    return { aplica: true, metaProporcional: meta * (mes / 12) };
  }

  /* ================================================================
     TENDÊNCIA DO AR — réplica exata de tendenciaTexto()/tendenciaClass().
     Distinta de HUB.rules.tendenciaTrimestral (ver divergência 2).
     ================================================================ */

  function calcularTendenciaAR(serieMensal, sentido) {
    var vals = (serieMensal || []).filter(ehNumero);
    if (vals.length < 6) return { texto: "Série curta", classe: "nd" };

    var ult3 = vals.slice(-3), ant3 = vals.slice(-6, -3);
    var mediaUlt = (ult3[0] + ult3[1] + ult3[2]) / 3;
    var mediaAnt = (ant3[0] + ant3[1] + ant3[2]) / 3;
    var dif = mediaUlt - mediaAnt;

    var texto;
    if (Math.abs(dif) < 0.00001) {
      texto = "Estável";
    } else {
      var favoravel = maiorMelhorAR(sentido) ? dif > 0 : dif < 0;
      texto = favoravel ? "Favorável" : "Desfavorável";
    }

    var x = normAR(texto);
    var classe = x.indexOf("favor") !== -1 ? "ok" :
      x.indexOf("desfavor") !== -1 ? "crit" :
      x.indexOf("estavel") !== -1 ? "att" : "nd";

    return { texto: texto, classe: classe };
  }

  /* ================================================================
     REGRA COMPLETA POR INDICADOR — orquestra as peças acima sobre um
     item já adaptado (ver hub-ingest-adapter-ar.js) para produzir tudo
     que hub-state-ar.js precisa para reproduzir a linha do legado.
     ================================================================ */

  function aplicarRegrasIndicador(item, mesAtual) {
    var unidade = item.unidade;
    var sentido = item.sentido;

    var atual = escalarPorUnidade(item.realizado, unidade);
    var metaBruta = escalarPorUnidade(item.meta, unidade);

    var prop = calcularMetaProporcional(metaBruta, item.metadados.tipoAcumulado, item.metadados.periodicidade, mesAtual);
    var metaRef = prop.aplica ? prop.metaProporcional : metaBruta;

    // CORREÇÃO (achado de auditoria com dados reais, E08/P01): o campo
    // numérico "atingimento" replica a fórmula EXATA do legado
    // (ar/index.html · processar()), que só exige atual≠null, meta≠null,
    // meta≠0 — NUNCA exigiu atual≠0. atual=0 com meta>0 é um resultado
    // matemático válido (0/meta = 0), não um dado ausente; por isso não
    // usa atingimentoAR() aqui (aquela função tem a guarda atual===0,
    // correta para STATUS via statusCanonicoAR/statusComPrecedencia
    // abaixo — que continuam corretamente mostrando "Sem dado" quando
    // atual=0 — mas errada para este campo numérico específico).
    var atingimento;
    if (atual === null || metaBruta === null || metaBruta === 0) {
      atingimento = null;
    } else if (prop.aplica) {
      // Réplica exata do ramo isSomaAnual do legado: só calcula se a
      // meta proporcional for estritamente positiva (mesmo guarda "> 0"
      // do legado, não apenas "!== 0").
      atingimento = prop.metaProporcional > 0
        ? (maiorMelhorAR(sentido) ? atual / prop.metaProporcional : prop.metaProporcional / atual)
        : null;
    } else {
      atingimento = maiorMelhorAR(sentido) ? atual / metaBruta : metaBruta / atual;
    }

    var precedencia = statusComPrecedencia(item.metadados.statusPublicadoRaw, atual, metaRef, sentido);

    var par = CASADOS.filter(function (c) { return c.membros.indexOf(item.id) !== -1; })[0] || null;

    // Série mensal chega crua (apenas convertida pt-BR->number) do Adapter;
    // a escala percentual (regra de negócio) é aplicada aqui, igual ao
    // legado (valoresMensais() chama calcValue(), que já escala).
    var serieEscalada = (item.metadados.serieMensal || []).map(function (v) {
      return escalarPorUnidade(v, unidade);
    });
    var tendencia = calcularTendenciaAR(serieEscalada, sentido);

    return {
      codigo: item.id,
      grupo: item.condicaoPactuacao || "Sem grupo",
      ordem: item.metadados.ordem,
      indicador: item.nome,
      descricao: item.metadados.descricao || item.metadados.pendencia || item.metadados.fonte || "",
      unidade: unidade,
      sentido: sentido,
      atual: atual,
      meta: metaBruta,
      metaProporcional: prop.aplica ? prop.metaProporcional : null,
      atingimento: atingimento,
      atingimentoProporcional: prop.aplica,
      status: precedencia.status,
      statusDisplay: precedencia.status,
      statusOrigem: precedencia.origem,
      statusClass: tagClassAR(precedencia.status),
      tendencia: tendencia.texto,
      tendenciaClass: tendencia.classe,
      casadoId: par ? par.id : null,
      casadoLabel: par ? par.label : null
    };
  }

  /* ================================================================
     BONIFICAÇÃO — réplica de calcularBonificacao(), com o bloqueio de
     governança de hub-core.js (divergência 4, ver cabeçalho) aplicado
     ao bônus total combinado.
     ================================================================ */

  function calcularBonificacao(lista) {
    var byId = {};
    lista.forEach(function (d) { byId[d.codigo] = d; });

    var estratIndividuais = ["E01", "E08"];
    var estratCasados = CASADOS.filter(function (c) {
      return lista.some(function (d) { return normAR(d.grupo).indexOf("estrateg") !== -1 && c.membros.indexOf(d.codigo) !== -1; });
    });

    var metasEstrategicasAtingidas = 0;
    var detalhesEstrategicos = [];

    estratIndividuais.forEach(function (cod) {
      var d = byId[cod];
      if (!d) return;
      var atingiu = d.status === "Dentro da Meta";
      if (atingiu) metasEstrategicasAtingidas++;
      detalhesEstrategicos.push({ cod: cod, label: d.indicador, atingiu: atingiu, casado: false });
    });

    estratCasados.forEach(function (par) {
      var todos = par.membros.every(function (m) { var d = byId[m]; return d && d.status === "Dentro da Meta"; });
      if (todos) metasEstrategicasAtingidas++;
      detalhesEstrategicos.push({
        cod: par.membros.join("+"), label: par.label, atingiu: todos, casado: true,
        membros: par.membros.map(function (m) {
          return { cod: m, indicador: (byId[m] && byId[m].indicador) || m, status: (byId[m] && byId[m].statusDisplay) || "Sem dado", statusClass: (byId[m] && byId[m].statusClass) || "nd" };
        }),
        bonusNote: par.bonusNote
      });
    });

    var totalEstrategicas = estratIndividuais.filter(function (c) { return byId[c]; }).length + estratCasados.length;
    var condicionalAtiva = metasEstrategicasAtingidas >= GATE_MINIMO_ESTRATEGICAS;

    var regE = BONUS_ESTRATEGICO.filter(function (r) { return metasEstrategicasAtingidas >= r.metas; })[0] || BONUS_ESTRATEGICO[BONUS_ESTRATEGICO.length - 1];

    var condIndividuais = ["C03", "C04"];
    var condCasados = CASADOS.filter(function (c) {
      return lista.some(function (d) { return normAR(d.grupo).indexOf("condicion") !== -1 && c.membros.indexOf(d.codigo) !== -1; });
    });

    var metasCondicionadasAtingidas = 0;
    var detalhesCondicionados = [];

    condIndividuais.forEach(function (cod) {
      var d = byId[cod];
      if (!d) return;
      var atingiu = condicionalAtiva && d.status === "Dentro da Meta";
      if (atingiu) metasCondicionadasAtingidas++;
      detalhesCondicionados.push({ cod: cod, label: d.indicador, atingiu: atingiu, casado: false, bloqueado: !condicionalAtiva });
    });

    condCasados.forEach(function (par) {
      var todos = condicionalAtiva && par.membros.every(function (m) { var d = byId[m]; return d && d.status === "Dentro da Meta"; });
      if (todos) metasCondicionadasAtingidas++;
      detalhesCondicionados.push({
        cod: par.membros.join("+"), label: par.label, atingiu: todos, casado: true, bloqueado: !condicionalAtiva,
        membros: par.membros.map(function (m) {
          return { cod: m, indicador: (byId[m] && byId[m].indicador) || m, status: (byId[m] && byId[m].statusDisplay) || "Sem dado", statusClass: (byId[m] && byId[m].statusClass) || "nd" };
        }),
        bonusNote: par.bonusNote
      });
    });

    var regC = BONUS_CONDICIONADO.filter(function (r) { return metasCondicionadasAtingidas >= r.metas; })[0] || BONUS_CONDICIONADO[BONUS_CONDICIONADO.length - 1];

    var p01 = byId["P01"];
    var performanceAtingida = condicionalAtiva && p01 && p01.status === "Dentro da Meta";
    var bonusPerformance = performanceAtingida ? BONUS_PERFORMANCE.pct : 0;

    var combinacaoLiberada = !!(HUB.config && HUB.config.combinacaoECPLiberada);

    var resultado = {
      metasEstrategicasAtingidas: metasEstrategicasAtingidas, totalEstrategicas: totalEstrategicas,
      regE: regE, condicionalAtiva: condicionalAtiva,
      metasCondicionadasAtingidas: metasCondicionadasAtingidas, regC: regC,
      performanceAtingida: performanceAtingida, bonusPerformance: bonusPerformance,
      detalhesEstrategicos: detalhesEstrategicos, detalhesCondicionados: detalhesCondicionados,
      combinacaoLiberada: combinacaoLiberada
    };

    if (combinacaoLiberada) {
      resultado.bonusTotal = regE.pct + (condicionalAtiva ? regC.pct : 0) + (condicionalAtiva ? bonusPerformance : 0);
      resultado.bloqueado = false;
      resultado.motivoBloqueio = null;
    } else {
      // Réplica FIEL da soma do legado, calculada mas nunca exposta como
      // bonusTotal — preservada apenas para o relatório de comparação
      // legado×novo poder mostrar "o que o legado exibe" lado a lado com
      // "o que o novo pipeline bloqueia", sem reimplementar a conta duas
      // vezes de formas diferentes.
      resultado.bonusTotalSeLiberado = regE.pct + (condicionalAtiva ? regC.pct : 0) + (condicionalAtiva ? bonusPerformance : 0);
      resultado.bonusTotal = null;
      resultado.bloqueado = true;
      resultado.motivoBloqueio = "Combinação E+C+P bloqueada até confirmação da CVL " +
        "(HUB.config.combinacaoECPLiberada=false, ver hub-core.js).";
    }

    return resultado;
  }

  /* ---------- exporta ---------- */

  HUB.rulesAR = {
    CASADOS: CASADOS,
    BONUS_ESTRATEGICO: BONUS_ESTRATEGICO,
    BONUS_CONDICIONADO: BONUS_CONDICIONADO,
    BONUS_PERFORMANCE: BONUS_PERFORMANCE,
    GATE_MINIMO_ESTRATEGICAS: GATE_MINIMO_ESTRATEGICAS,
    BLOQUEIOS_PENDENTES: BLOQUEIOS_PENDENTES,
    normAR: normAR,
    maiorMelhorAR: maiorMelhorAR,
    isPercentAR: isPercentAR,
    escalarPorUnidade: escalarPorUnidade,
    atingimentoAR: atingimentoAR,
    statusCanonicoAR: statusCanonicoAR,
    tagClassAR: tagClassAR,
    grupoOrdemAR: grupoOrdemAR,
    statusComPrecedencia: statusComPrecedencia,
    calcularMetaProporcional: calcularMetaProporcional,
    calcularTendenciaAR: calcularTendenciaAR,
    aplicarRegrasIndicador: aplicarRegrasIndicador,
    calcularBonificacao: calcularBonificacao
  };

  HUB.registerComponent("rules-ar");

})();
