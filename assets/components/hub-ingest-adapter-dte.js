/* ============================================================
   HUB COMLURB · BIBLIOTECA OFICIAL · hub-ingest-adapter-dte.js
   Camada 2 (Ingestão · Adapter específico) · v1.0.0
   Dependências: hub-core, hub-sources, hub-ingest-model,
   hub-ingest-reader. NÃO depende de hub-ingest-decoder.js — ver nota
   abaixo.
   PROIBIDO nesta camada: status/atenção/crítico, limiar, score de
   risco, classificação operacional (isso seria hub-rules-engenharia,
   que esta fase explicitamente não cria — ver
   IMPLEMENTATION_STATUS.md · Fase 5), DOM, Chart.js.

   FASE 5 (07/2026) — Piloto B (Engenharia/DTE). ESCOPO APROVADO:
   fonte única = aba geral da planilha "Relatório Mensal DTE"
   (DTE_RELATORIO_GERAL). Não lê nenhuma das outras cinco fontes do
   painel de produção (ind2025, ind2026, coletaDomiciliar,
   coletaSeletiva, lixoPublico) — fora de escopo desta fase. Não
   conecta a engenharia-operacional/index.html.

   POR QUE NÃO USA hub-ingest-decoder.js: o Decoder (Fase 3) assume
   estruturalmente UMA linha de cabeçalho para a planilha inteira
   (matrizParaObjetos). A aba geral do DTE não tem esse formato — é
   "largo seccionado": múltiplos blocos e subgrupos, cada um com sua
   própria linha de datas, dentro da MESMA aba. Forçar o Decoder
   produziria um resultado sem sentido (cabeçalho da planilha inteira
   = a primeira linha textual, que é só o título "DIRETORIA TÉCNICA E
   DE ENGENHARIA - DTE"). Mesma decisão já tomada em
   hub-ingest-adapter-ar.js v1.1.0 para hub-utils.js: quando o
   contrato do componente genérico não serve à fonte real, o Adapter
   fica autocontido em vez de forçar o genérico a mentir sobre o que
   sabe fazer. Este arquivo chama Papa.parse diretamente sobre o
   texto bruto do Reader (mesmo Papa já usado pelo Decoder).

   DECISÃO DE GOVERNANÇA — vazio/"-"/"—"/inválido = null, NUNCA 0
   (aprovada pela proprietária do produto nesta fase). Zero literal e
   válido na fonte permanece 0. O legado (engenharia-operacional/
   index.html) converte ausência em 0 — essa divergência é esperada e
   registrada pelo harness, não reproduzida aqui.

   DECISÃO DE GOVERNANÇA — detecção de bloco e subgrupo é ESTRUTURAL E
   EXPLÍCITA, nunca heurística por palavra-chave:
   - Bloco: identificado por letra maiúscula única + travessão no
     início da linha ("A - ...", "B - ..."), mas SÓ é aceito como
     bloco se a letra estiver em BLOCOS_CONHECIDOS (lista abaixo) e o
     título normalizado bater com o catalogado. Isso é uma extensão
     deliberada da instrução original (que pedia whitelist só para
     subgrupo): letras únicas C e D também são numerais romanos
     válidos (100 e 500) — sem whitelist de bloco, uma leitura
     puramente estrutural teria ambiguidade real entre bloco e
     subgrupo romano para "C - ..." e "D - ...". A whitelist de bloco
     resolve essa ambiguidade real da fonte, não substitui julgamento
     por conveniência.
   - Bloco A: subgrupo reconhecido por algarismo romano
     (^[IVXLCDM]+\s*-\s*), em linha própria, seguida de uma linha de
     período separada — padrão comprovado nos dados reais enviados
     nesta fase.
   - Blocos B, C, D: subgrupo reconhecido por lista nomeada de
     cabeçalhos confirmados na fonte real (BLOCOS_CONHECIDOS[letra]
     .cabecalhosSubgrupo) — aqui o rótulo do subgrupo e a linha de
     período vêm JUNTOS na mesma linha (padrão diferente do Bloco A,
     também comprovado nos dados reais). Bloco C não tem nenhum
     subgrupo confirmado (lista vazia) — os indicadores ficam direto
     sob o bloco.
   - Cabeçalho de subgrupo não reconhecido (letra de bloco fora da
     whitelist, ou padrão "label+período" cujo rótulo não está na
     lista) NUNCA é tratado como indicador — gera bloqueio de
     validação explícito.
   - Linhas de anotação real da fonte (ex.: "Critérios: CDC e CDO",
     "Compactador P6: 6,8 t x 2 viagens / apresentação") são
     estruturalmente distintas: têm rótulo, zero células numéricas E
     NÃO são seguidas de uma linha de período. São registradas como
     nota ignorada (rastreável em `notas`), nunca absorvidas como
     subgrupo nem como indicador.

   DECISÃO DE GOVERNANÇA — Gerência Ofensora: par (linha categórica +
   linha(s) de valor associada(s)) vira registros canônicos. Aceita
   qualquer N válido (não limita a 3). A união só ocorre com linhas
   estruturalmente associadas (não são elas mesmas início de bloco/
   subgrupo/período/nova ofensora). Caso a primeira linha seguinte já
   seja estrutural, bloqueio explícito — nunca inventa valor.

   CORREÇÃO PÓS-AUDITORIA (v1.1.0) — MECANISMO A (bug de duplicação):
   achado real — cada bloco "Gerência Ofensora N" pode ter MAIS DE UMA
   linha de valor associada (ex.: "% Sobrecarga" e "Horas Extras
   (Valor e %)" têm 2 linhas por ofensora: valor absoluto + razão). A
   versão anterior só consumia a primeira linha seguinte; a(s)
   linha(s) além dela eram reprocessadas pelo laço principal como
   indicador comum, criando registros duplicados sob a mesma chave
   (bloco+subgrupo+indicador+período) com valores diferentes. Corrigido:
   após parear a linha categórica com a primeira linha de valor, o
   Adapter continua consumindo as linhas seguintes ENQUANTO elas não
   forem estruturais (não são bloco/subgrupo/período/nova ofensora) —
   parando exatamente no primeiro marcador estrutural. Cada linha
   consumida vira um registro de `gerenciasOfensoras` próprio, com
   `indicadorAssociado` preservando qual rótulo aquele valor representa
   (ou `null` quando a linha vem sem rótulo, padrão já documentado).
   Nenhuma linha de valor associada volta a ser processada como
   indicador comum.

   CORREÇÃO PÓS-AUDITORIA (v1.1.0) — MECANISMO B (critério não
   modelado): achado real — dentro do Bloco A, subgrupo "VII - Geração
   Chorume (m³)", o mesmo indicador ("Tratamento Interno", "Tratamento
   Externo", "Recirculado") se repete sob critérios diferentes ("CTR
   Seriopédica", "Aterro Gramacho (ETC + MANEJO)", "Aterro Bangu (REC.
   + TRAT. EXT)") — cada "critério" é ele mesmo uma linha com valor
   próprio que também define o contexto das linhas seguintes até o
   próximo critério ou o fim do subgrupo. Modelado com a MESMA
   disciplina de subgrupo: lista nomeada de critérios confirmados na
   fonte real (CRITERIOS_CONHECIDOS, abaixo), isolada neste Adapter,
   nunca heurística por palavra-chave. Cada registro de indicador ganha
   `criterio`, `criterioNormalizado` e `linhaOrigemCriterio` (null
   quando o subgrupo não tem critérios catalogados, ou quando o próprio
   registro É o critério). A chave canônica passa a distinguir bloco +
   subgrupo + subgrupoOcorrencia + critério + indicador + período. Um
   indicador repetido dentro do mesmo subgrupo/ocorrência SEM que um
   critério catalogado explique a repetição gera bloqueio estrutural
   ("indicador_duplicado_sem_criterio") — nunca é silenciosamente
   sobrescrito nem duplicado sem explicação.
   ============================================================ */

(function () {
  "use strict";

  var HUB = window.HUB;
  HUB.require("core", "sources", "ingest-model", "ingest-reader");

  var MESES_PT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  var PERIODO_RE = /^([a-z]{3})\.-(\d{2})$/i;
  var ROMANO_RE = /^[IVXLCDM]+\s*-\s*/;
  var BLOCO_RE = /^([A-Z])\s*-\s*(.+)$/;
  var OFENSORA_RE = /^Gerência\s+Ofensora\s+(\d+)$/i;

  /* ================================================================
     CATÁLOGO ESTRUTURAL DA FONTE (particularidade do DTE — fica só
     neste Adapter, não no mecanismo genérico). Extraído diretamente
     dos dados reais enviados nesta fase (xlsx real da aba geral),
     não inferido do painel legado.
     ================================================================ */

  var BLOCOS_CONHECIDOS = {
    A: {
      tituloNormalizado: normEstrutural("ATIVIDADES OPERACIONAIS - COORDENADORIA DE DESTINAÇÃO DE RESÍDUOS - TCD"),
      tipoSubgrupo: "romano"
    },
    B: {
      tituloNormalizado: normEstrutural("MONITORAMENTO FROTA CONTRATADA"),
      tipoSubgrupo: "lista",
      cabecalhosSubgrupo: [
        "Coleta Domiciliar e Comunidade",
        "Remoção Manual - P8",
        "Remoção Mecanizada - P8",
        "Remoção Mecanizada - P9",
        "Remoção Caixa Estacionária - P10",
        "Remoção Caixa Estacionária - P10A",
        "Horas Utilizadas / Horas Estimadas (h)",
        "% Sobrecarga",
        "Horas Extras (Valor e %)",
        "Coleta Seletiva",
        "Indicador de Poda: KM/Manejo",
        "Indicador de Poda: Manejo/Apresentação"
      ].map(normEstrutural)
    },
    C: {
      tituloNormalizado: normEstrutural("MANUTENÇÃO FROTA PRÓPRIA"),
      tipoSubgrupo: "lista",
      cabecalhosSubgrupo: [] // confirmado nos dados reais: nenhum subgrupo, indicadores direto sob o bloco
    },
    D: {
      tituloNormalizado: normEstrutural("MANUTENÇÃO PREDIAL - GERÊNCIA DE OBRAS - TGO"),
      tipoSubgrupo: "lista",
      cabecalhosSubgrupo: ["Quantidades"].map(normEstrutural)
    }
  };

  /* ================================================================
     NORMALIZAÇÃO ESTRUTURAL — usada só para comparar/casar rótulos
     contra o catálogo acima, nunca para decidir valor de negócio. O
     rótulo bruto original é sempre preservado nos registros de saída.
     ================================================================ */

  function normEstrutural(v) {
    return String(v == null ? "" : v)
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/\s+/g, " ").trim();
  }

  /* ================================================================
     CRITÉRIOS CONHECIDOS — particularidade do DTE (correção pós-
     auditoria, Mecanismo B). Chave: "letraBloco|subgrupoNormalizado".
     Ausência de chave = subgrupo sem conceito de critério (não ativa
     checagem de duplicidade por critério — comportamento idêntico ao
     anterior para todos os demais subgrupos). Extraído diretamente dos
     dados reais enviados nesta fase.
     ================================================================ */

  var CRITERIOS_CONHECIDOS = {};
  CRITERIOS_CONHECIDOS["a|" + normEstrutural("VII - Geração Chorume (m³)")] = [
    "CTR Seriopédica",
    "Aterro Gramacho (ETC + MANEJO)",
    "Aterro Bangu (REC. + TRAT. EXT)"
  ].map(normEstrutural);

  function criteriosDoSubgrupo(letraBloco, subgrupoNormalizado) {
    var chave = String(letraBloco || "").toLowerCase() + "|" + subgrupoNormalizado;
    return CRITERIOS_CONHECIDOS.hasOwnProperty(chave) ? CRITERIOS_CONHECIDOS[chave] : [];
  }

  /* ================================================================
     LINHA ESTRUTURAL — usado para decidir onde parar de consumir
     linhas associadas a "Gerência Ofensora N" (Mecanismo A). Uma linha
     é estrutural se poderia começar um novo bloco, subgrupo (romano ou
     catalogado), período isolado, ou uma nova "Gerência Ofensora" —
     nunca decidido por contagem fixa de linhas.
     ================================================================ */

  function linhaEhEstrutural(rotulo, vals, blocoAtual) {
    if (BLOCO_RE.test(rotulo)) return true;
    if (ROMANO_RE.test(rotulo)) return true;
    if (OFENSORA_RE.test(rotulo)) return true;
    if (linhaEhPeriodo(vals)) return true;
    if (blocoAtual && blocoAtual.config.tipoSubgrupo === "lista" && blocoAtual.config.cabecalhosSubgrupo.indexOf(normEstrutural(rotulo)) !== -1) return true;
    return false;
  }

  /* ================================================================
     CONVERSÃO NUMÉRICA — autocontida (mesmo motivo de
     hub-ingest-adapter-ar.js: não depender de hub-utils.js). Vazio,
     "-", "—", ou qualquer texto não numérico -> null. Zero literal
     numérico -> 0 (preservado). NUNCA converte ausência em 0.
     ================================================================ */

  function numDTE(v) {
    if (v === null || v === undefined) return null;
    if (typeof v === "number") return isFinite(v) ? v : null;

    var s = String(v).replace(/\u00A0/g, " ").trim();
    if (s === "" || s === "-" || s === "—" || s === "–") return null;
    s = s.replace(/\s+/g, "");

    var negativo = false;
    if (s.charAt(0) === "-") { negativo = true; s = s.slice(1); }
    s = s.replace(/^R\$/i, "");
    if (s === "") return null;

    var temVirgula = s.indexOf(",") !== -1;
    var temPonto = s.indexOf(".") !== -1;
    var norm;
    if (temVirgula && temPonto) {
      norm = s.replace(/\./g, "").replace(",", ".");
    } else if (temVirgula && !temPonto) {
      norm = s.replace(",", ".");
    } else if (!temVirgula && temPonto) {
      // Achado real (dados enviados nesta fase): valores de biogás
      // chegam à casa dos milhões (ex. "16.257.432"), com MAIS de um
      // separador de milhar. O padrão precisa aceitar qualquer
      // quantidade de agrupamentos de 3 dígitos, não só um.
      var pareceMilhar = /^\d{1,3}(\.\d{3})+$/.test(s);
      norm = pareceMilhar ? s.replace(/\./g, "") : s;
    } else {
      norm = s;
    }

    var n = Number(norm);
    if (!isFinite(n)) return null;
    if (negativo) n = -n;
    return n;
  }

  /* ================================================================
     DETECÇÃO DE LINHA DE PERÍODO — estrutural: >=10 das 13 células de
     dado (colunas 1..13) batem no padrão "mmm.-aa" com abreviação de
     mês válida em português.
     ================================================================ */

  function celulaEhPeriodo(v) {
    var s = String(v == null ? "" : v).trim().toLowerCase();
    var m = PERIODO_RE.exec(s);
    if (!m) return null;
    var mesIdx = MESES_PT.indexOf(m[1]);
    if (mesIdx === -1) return null;
    return { ano: 2000 + parseInt(m[2], 10), mes: mesIdx + 1 };
  }

  function linhaEhPeriodo(celulas13) {
    var count = 0;
    for (var i = 0; i < celulas13.length; i++) {
      if (celulaEhPeriodo(celulas13[i])) count++;
    }
    return count >= 10;
  }

  function parsearPeriodos(celulas13) {
    return celulas13.map(function (v) {
      var p = celulaEhPeriodo(v);
      return p ? (p.ano + "-" + String(p.mes).padStart(2, "0")) : null;
    });
  }

  /* ================================================================
     ADAPTER — matriz bruta (array de arrays, já decodificada de CSV
     via Papa.parse local, sem cabeçalho único) -> registros canônicos
     do domínio series_operacionais.
     ================================================================ */

  function adaptar(matriz) {
    var indicadores = [];
    var gerenciasOfensoras = [];
    var notas = [];
    var bloqueios = [];

    var blocoAtual = null;       // { letra, rotuloBruto, rotuloNormalizado, config }
    var subgrupoAtual = null;    // { rotuloBruto, rotuloNormalizado, ocorrencia, periodos[13] }
    var contadorOcorrencia = {}; // chave "letraBloco|rotuloNormalizadoSubgrupo" -> contagem
    var criterioAtual = null;    // { rotuloBruto, rotuloNormalizado, linhaOrigem } — Mecanismo B
    var indicadoresVistosNoSubgrupo = {}; // rotuloNormalizado -> criterioNormalizado (ou null) na 1ª vez visto — Mecanismos A e B

    function novoSubgrupo(dados) {
      subgrupoAtual = dados;
      criterioAtual = null;
      indicadoresVistosNoSubgrupo = {};
    }

    function celulas13(linha) { return (linha || []).slice(1, 14).map(function (c) { return c === undefined ? "" : c; }); }

    function novaOcorrencia(letra, rotuloNormalizado) {
      var chave = letra + "|" + rotuloNormalizado;
      contadorOcorrencia[chave] = (contadorOcorrencia[chave] || 0) + 1;
      return contadorOcorrencia[chave];
    }

    for (var i = 0; i < matriz.length; i++) {
      var linha = matriz[i] || [];
      var rotuloBruto = String(linha[0] === undefined || linha[0] === null ? "" : linha[0]).trim();
      var vals = celulas13(linha);
      var numPreenchidas = vals.filter(function (v) { return String(v).trim() !== ""; }).length;
      var ehLinhaPeriodoIsolada = !rotuloBruto && linhaEhPeriodo(vals);
      var ehLinhaPeriodoComRotulo = !!rotuloBruto && linhaEhPeriodo(vals);

      /* ---- 1. Bloco (whitelist — ver nota de cabeçalho) ---- */
      var mBloco = BLOCO_RE.exec(rotuloBruto);
      if (mBloco && !ehLinhaPeriodoComRotulo) {
        var letra = mBloco[1];
        var tituloResto = normEstrutural(mBloco[2]);
        var config = BLOCOS_CONHECIDOS[letra];
        if (config && config.tituloNormalizado === tituloResto) {
          blocoAtual = { letra: letra, rotuloBruto: rotuloBruto, rotuloNormalizado: tituloResto, config: config };
          subgrupoAtual = null;
          criterioAtual = null;
          indicadoresVistosNoSubgrupo = {};
          continue;
        }
        // Letra não catalogada, ou título não bate com o catalogado:
        // mudança de estrutura real. Falha explícita — não classifica
        // como bloco novo silenciosamente, não tenta como subgrupo.
        bloqueios.push({
          linha: i, tipo: "bloco_nao_reconhecido",
          mensagem: "Linha " + i + ": cabeçalho de bloco não reconhecido ou com título divergente do catalogado: " +
            JSON.stringify(rotuloBruto)
        });
        continue;
      }

      /* ---- 2. Subgrupo romano (só válido dentro de Bloco A). Achado real
         (dados enviados nesta fase): o período pode vir NA MESMA linha do
         rótulo romano (ex.: "I - Recebimento Resíduos Totais - t") ou em
         linha separada logo abaixo (ex.: "II - Recebimento..."), de forma
         inconsistente mesmo dentro do próprio Bloco A. Os dois casos são
         tratados aqui: se a própria linha já carrega o período, ele é
         usado direto; caso contrário fica pendente e a etapa 4 (linha de
         período isolada) o preenche. ---- */
      if (ROMANO_RE.test(rotuloBruto)) {
        if (!blocoAtual || blocoAtual.config.tipoSubgrupo !== "romano") {
          bloqueios.push({
            linha: i, tipo: "romano_fora_de_contexto",
            mensagem: "Linha " + i + ": subgrupo romano " + JSON.stringify(rotuloBruto) +
              " fora do Bloco A (bloco atual: " + (blocoAtual ? blocoAtual.letra : "nenhum") + ")."
          });
          continue;
        }
        novoSubgrupo({
          rotuloBruto: rotuloBruto, rotuloNormalizado: normEstrutural(rotuloBruto),
          ocorrencia: novaOcorrencia(blocoAtual.letra, normEstrutural(rotuloBruto)),
          periodos: ehLinhaPeriodoComRotulo ? parsearPeriodos(vals) : null
        });
        continue;
      }

      /* ---- 3. Subgrupo por lista (Blocos B/C/D) — rótulo catalogado,
         período na mesma linha (padrão comprovado) ou pendente. ---- */
      if (blocoAtual && blocoAtual.config.tipoSubgrupo === "lista" && blocoAtual.config.cabecalhosSubgrupo.length &&
          rotuloBruto && blocoAtual.config.cabecalhosSubgrupo.indexOf(normEstrutural(rotuloBruto)) !== -1) {
        var rotNorm3 = normEstrutural(rotuloBruto);
        novoSubgrupo({
          rotuloBruto: rotuloBruto, rotuloNormalizado: rotNorm3,
          ocorrencia: novaOcorrencia(blocoAtual.letra, rotNorm3),
          periodos: ehLinhaPeriodoComRotulo ? parsearPeriodos(vals) : null
        });
        continue;
      }

      /* ---- 3b. Rótulo com período na mesma linha, fora de qualquer
         subgrupo catalogado (Bloco A ou lista): mudança de estrutura
         real — nunca vira indicador silenciosamente. ---- */
      if (ehLinhaPeriodoComRotulo) {
        if (!blocoAtual) {
          bloqueios.push({ linha: i, tipo: "periodo_sem_bloco", mensagem: "Linha " + i + ": linha de período com rótulo fora de qualquer bloco reconhecido." });
          continue;
        }
        bloqueios.push({
          linha: i, tipo: "subgrupo_nao_reconhecido",
          mensagem: "Linha " + i + ": cabeçalho de subgrupo não reconhecido no Bloco " + blocoAtual.letra + ": " + JSON.stringify(rotuloBruto)
        });
        continue;
      }

      /* ---- 4. Linha de período isolada (preenche subgrupo pendente: Bloco A e Bloco C anônimo) ---- */
      if (ehLinhaPeriodoIsolada) {
        if (!blocoAtual) {
          bloqueios.push({ linha: i, tipo: "periodo_sem_bloco", mensagem: "Linha " + i + ": linha de período sem bloco ativo." });
          continue;
        }
        if (!subgrupoAtual) {
          // Bloco C (sem subgrupo confirmado): cria subgrupo implícito.
          if (blocoAtual.config.cabecalhosSubgrupo && blocoAtual.config.cabecalhosSubgrupo.length === 0) {
            novoSubgrupo({ rotuloBruto: "", rotuloNormalizado: "", ocorrencia: novaOcorrencia(blocoAtual.letra, ""), periodos: parsearPeriodos(vals) });
            continue;
          }
          bloqueios.push({ linha: i, tipo: "periodo_sem_subgrupo", mensagem: "Linha " + i + ": linha de período sem subgrupo ativo no Bloco " + blocoAtual.letra + "." });
          continue;
        }
        subgrupoAtual.periodos = parsearPeriodos(vals);
        continue;
      }

      /* ---- 5. Linha vazia (sem rótulo, sem dado, não é período) — ruído estrutural, ignorada silenciosamente ---- */
      if (!rotuloBruto && numPreenchidas === 0) continue;

      /* ---- 6. Gerência Ofensora N (categórica) + linha(s) de valor associada(s) ----
         CORREÇÃO PÓS-AUDITORIA (Mecanismo A): consome TODAS as linhas
         seguintes enquanto não forem estruturais (nunca uma contagem
         fixa) — cada uma vira um registro de gerenciaOfensora próprio,
         e NENHUMA delas é reprocessada como indicador comum abaixo. */
      var mOfensora = OFENSORA_RE.exec(rotuloBruto);
      if (mOfensora) {
        if (!blocoAtual || !subgrupoAtual || !subgrupoAtual.periodos) {
          bloqueios.push({ linha: i, tipo: "ofensora_sem_contexto", mensagem: "Linha " + i + ": " + JSON.stringify(rotuloBruto) + " sem bloco/subgrupo/período ativo." });
          continue;
        }
        var posicao = parseInt(mOfensora[1], 10);

        var primeiraLinhaValor = matriz[i + 1] || [];
        var primeiroRotuloValor = String(primeiraLinhaValor[0] === undefined || primeiraLinhaValor[0] === null ? "" : primeiraLinhaValor[0]).trim();
        var primeirosVals = celulas13(primeiraLinhaValor);
        if (linhaEhEstrutural(primeiroRotuloValor, primeirosVals, blocoAtual)) {
          bloqueios.push({
            linha: i, tipo: "ofensora_par_malformado",
            mensagem: "Linha " + i + " (" + rotuloBruto + "): linha seguinte é estruturalmente outra coisa (novo bloco/subgrupo/período/gerência ofensora). Nenhum valor foi inventado."
          });
          continue;
        }

        var algumValorOuCodigo = false;
        var j = i + 1;
        while (j < matriz.length) {
          var linhaAssoc = matriz[j] || [];
          var rotuloAssoc = String(linhaAssoc[0] === undefined || linhaAssoc[0] === null ? "" : linhaAssoc[0]).trim();
          var valsAssoc = celulas13(linhaAssoc);
          if (linhaEhEstrutural(rotuloAssoc, valsAssoc, blocoAtual)) break;
          var numPreenchidasAssoc = valsAssoc.filter(function (v) { return String(v).trim() !== ""; }).length;
          if (numPreenchidasAssoc === 0) break; // linha sem nenhum dado próprio (ex.: anotação) — não é uma linha de valor associada, para de consumir.

          var algumNestaLinha = false;
          for (var p = 0; p < 13; p++) {
            var codigo = String(vals[p] === undefined || vals[p] === null ? "" : vals[p]).trim();
            var periodo = subgrupoAtual.periodos[p];
            if (!codigo || !periodo) continue;
            algumNestaLinha = true;
            algumValorOuCodigo = true;
            gerenciasOfensoras.push({
              bloco: blocoAtual.rotuloBruto, blocoNormalizado: blocoAtual.rotuloNormalizado,
              subgrupo: subgrupoAtual.rotuloBruto, subgrupoNormalizado: subgrupoAtual.rotuloNormalizado,
              subgrupoOcorrencia: subgrupoAtual.ocorrencia,
              criterio: criterioAtual ? criterioAtual.rotuloBruto : null,
              criterioNormalizado: criterioAtual ? criterioAtual.rotuloNormalizado : null,
              periodo: periodo,
              posicaoOfensora: posicao,
              codigoGerencia: codigo,
              valor: numDTE(valsAssoc[p]),
              indicadorAssociado: rotuloAssoc || null,
              indicadorAssociadoNormalizado: rotuloAssoc ? normEstrutural(rotuloAssoc) : null,
              unidadeMedida: null, // não declarada na fonte para estas linhas — não inferida heuristicamente (ver decisão de governança)
              rotulosBrutos: { linhaCategorica: rotuloBruto, linhaValor: rotuloAssoc },
              lineage: { linhaOrigemCategorica: i, linhaOrigemValor: j, colunaOrigem: p + 1 }
            });
          }
          if (!algumNestaLinha) break; // linha não-estrutural mas sem nenhum dado válido: para de consumir, não força.
          j++;
        }
        if (!algumValorOuCodigo) {
          bloqueios.push({ linha: i, tipo: "ofensora_sem_dado_valido", mensagem: "Linha " + i + " (" + rotuloBruto + "): nenhum par código+período válido encontrado." });
        }
        i = j - 1; // pula todas as linhas consumidas — elas NUNCA são reprocessadas como indicador comum.
        continue;
      }

      /* ---- 7. Indicador (rótulo + ao menos 1 célula preenchida, contexto de subgrupo ativo) ----
         CORREÇÃO PÓS-AUDITORIA (Mecanismo B): se o rótulo bate com um
         critério catalogado para este bloco+subgrupo, esta linha é o
         PRÓPRIO critério (define o contexto das linhas seguintes) —
         ainda vira um registro de indicador (ela também tem valor),
         mas com criterio=null (não pertence a nenhum critério, ela
         DEFINE um). Caso contrário, é um indicador comum sob o
         critério ativo (se houver). Repetição do mesmo rótulo dentro
         do mesmo bloco+subgrupo+ocorrência SEM que um critério
         catalogado e DIFERENTE do anterior explique a repetição é
         bloqueio estrutural — nunca duplicado nem sobrescrito
         silenciosamente. */
      if (rotuloBruto && numPreenchidas > 0) {
        if (!blocoAtual || !subgrupoAtual || !subgrupoAtual.periodos) {
          bloqueios.push({ linha: i, tipo: "indicador_sem_contexto", mensagem: "Linha " + i + " (" + rotuloBruto + "): indicador sem bloco/subgrupo/período ativo." });
          continue;
        }

        var rotIndNorm = normEstrutural(rotuloBruto);
        var criteriosAtivos = criteriosDoSubgrupo(blocoAtual.letra, subgrupoAtual.rotuloNormalizado);
        var ehLinhaDeCriterio = criteriosAtivos.length > 0 && criteriosAtivos.indexOf(rotIndNorm) !== -1;

        if (ehLinhaDeCriterio) {
          criterioAtual = { rotuloBruto: rotuloBruto, rotuloNormalizado: rotIndNorm, linhaOrigem: i };
        } else if (criteriosAtivos.length > 0) {
          // Critério catalogado ativo para este subgrupo: checa duplicidade explicada por critério.
          var criterioNoPrimeiroVisto = indicadoresVistosNoSubgrupo.hasOwnProperty(rotIndNorm) ? indicadoresVistosNoSubgrupo[rotIndNorm] : undefined;
          var criterioAgoraNorm = criterioAtual ? criterioAtual.rotuloNormalizado : null;
          if (criterioNoPrimeiroVisto !== undefined && criterioNoPrimeiroVisto === criterioAgoraNorm) {
            bloqueios.push({
              linha: i, tipo: "indicador_duplicado_sem_criterio",
              mensagem: "Linha " + i + " (" + rotuloBruto + "): repetido no mesmo bloco/subgrupo/ocorrência sob o mesmo critério (" +
                (criterioAgoraNorm || "nenhum") + ") — nenhum critério catalogado novo explica a repetição."
            });
            continue;
          }
          if (criterioNoPrimeiroVisto === undefined) indicadoresVistosNoSubgrupo[rotIndNorm] = criterioAgoraNorm;
        } else {
          indicadoresVistosNoSubgrupo[rotIndNorm] = null;
        }

        for (var q = 0; q < 13; q++) {
          var per = subgrupoAtual.periodos[q];
          if (!per) continue;
          indicadores.push({
            bloco: blocoAtual.rotuloBruto, blocoNormalizado: blocoAtual.rotuloNormalizado,
            subgrupo: subgrupoAtual.rotuloBruto, subgrupoNormalizado: subgrupoAtual.rotuloNormalizado,
            subgrupoOcorrencia: subgrupoAtual.ocorrencia,
            criterio: ehLinhaDeCriterio ? null : (criterioAtual ? criterioAtual.rotuloBruto : null),
            criterioNormalizado: ehLinhaDeCriterio ? null : (criterioAtual ? criterioAtual.rotuloNormalizado : null),
            linhaOrigemCriterio: ehLinhaDeCriterio ? null : (criterioAtual ? criterioAtual.linhaOrigem : null),
            indicadorBruto: rotuloBruto, indicadorNormalizado: rotIndNorm,
            periodo: per,
            valor: numDTE(vals[q]),
            lineage: { linhaOrigem: i, colunaOrigem: q + 1 }
          });
        }
        continue;
      }

      /* ---- 8. Rótulo sem nenhum dado e sem ser período: anotação/nota da fonte ---- */
      if (rotuloBruto && numPreenchidas === 0) {
        notas.push({ linha: i, rotuloBruto: rotuloBruto, bloco: blocoAtual ? blocoAtual.rotuloBruto : null, subgrupo: subgrupoAtual ? subgrupoAtual.rotuloBruto : null });
        continue;
      }
    }

    return { indicadores: indicadores, gerenciasOfensoras: gerenciasOfensoras, notas: notas, bloqueios: bloqueios };
  }

  /* ================================================================
     PIPELINE DTE — Locator -> Reader (remote-csv) -> Papa.parse local
     -> Adapter -> Validator -> Modelo canônico (domínio
     series_operacionais).
     ================================================================ */

  function decodificarTextoLocal(texto) {
    if (typeof Papa === "undefined") {
      return { ok: false, matriz: null, motivo: "PapaParse indisponível para decodificar a aba geral do DTE." };
    }
    var parsed = Papa.parse(texto, { skipEmptyLines: true });
    if (!parsed.data || !parsed.data.length) {
      return { ok: false, matriz: null, motivo: "Aba geral do DTE decodificada está vazia." };
    }
    return { ok: true, matriz: parsed.data, motivo: null };
  }

  /**
   * Validator — DECISÃO DE GOVERNANÇA (correção pós-auditoria desta
   * fase): qualquer bloqueio estrutural é um ERRO que invalida o
   * envelope inteiro (payload = null), nunca um aviso que deixa passar
   * carga parcial. Uma planilha que ganhou um bloco/subgrupo/estrutura
   * de período não reconhecida não pode virar uma publicação oficial
   * parcial — isso mascararia justamente o tipo de mudança estrutural
   * que esta fase existe para detectar. `indicadores` e
   * `gerenciasOfensoras` continuam retornados FORA do envelope (ver
   * carregarDTE) só para diagnóstico — nunca como payload oficial
   * quando há bloqueio.
   *
   * Tipos de bloqueio, todos bloqueantes (erro, nunca aviso):
   * bloco_nao_reconhecido, subgrupo_nao_reconhecido,
   * romano_fora_de_contexto, periodo_sem_bloco, periodo_sem_subgrupo
   * (estrutura de período inválida), indicador_sem_contexto,
   * ofensora_sem_contexto, ofensora_par_malformado (associação
   * ambígua ou linha de valor ausente), ofensora_sem_dado_valido.
   *
   * NÃO bloqueiam: linhas de anotação confirmadas da fonte (`notas` —
   * ex. "Critérios:", "Obs:") — continuam aviso, pois são reconhecidas
   * e classificadas corretamente como não-dado, não uma estrutura não
   * reconhecida.
   */
  function validar(resultadoAdapter) {
    var erros = [];
    var avisos = [];

    resultadoAdapter.bloqueios.forEach(function (b) {
      erros.push({ campo: "linha_" + b.linha, tipo: b.tipo, mensagem: b.mensagem });
    });

    if (resultadoAdapter.indicadores.length === 0 && resultadoAdapter.gerenciasOfensoras.length === 0) {
      erros.push({ tipo: "nenhum_registro_produzido", mensagem: "Nenhum indicador nem gerência ofensora foi extraído — possível mudança estrutural total na fonte." });
    }
    if (resultadoAdapter.notas.length) {
      avisos.push({ campo: "notas", tipo: "anotacoes_ignoradas", mensagem: resultadoAdapter.notas.length + " linha(s) de anotação da fonte foram identificadas e ignoradas (não viram indicador nem subgrupo)." });
    }

    return HUB.ingest.model.criarQuality(erros, avisos);
  }

  /**
   * Executa a cadeia completa para o DTE (aba geral).
   * @param {Object} opts
   * @param {Function} [opts.fetchImpl] injeção de fetch (teste determinístico)
   * @param {string} [opts.fixtureTexto] quando presente, substitui a
   *   busca de rede por um CSV bruto fixo — mesma disciplina de
   *   hub-ingest-adapter-ar.js: nunca usado silenciosamente.
   * @returns {Promise<{envelope, indicadores, gerenciasOfensoras, notas, bloqueios, diagnosticoFonte}>}
   */
  function carregarDTE(opts) {
    opts = opts || {};
    var SOURCE_ID = "DTE_RELATORIO_GERAL";

    function origemTexto() {
      if (opts.fixtureTexto !== undefined && opts.fixtureTexto !== null) {
        return Promise.resolve({ ok: true, raw: opts.fixtureTexto, tipo: "texto", motivo: null });
      }
      return HUB.ingest.reader.lerAsync(SOURCE_ID, opts);
    }

    return origemTexto().then(function (leitura) {
      var diagnosticoFonte = { ok: leitura.ok, motivo: leitura.motivo };

      if (!leitura.ok) {
        return {
          envelope: HUB.ingest.model.criarEnvelope({
            schemaVersion: "series_operacionais.dte.v1",
            sourceId: SOURCE_ID,
            domain: "series_operacionais",
            referencePeriod: null,
            payload: null,
            quality: HUB.ingest.model.criarQuality([{ etapa: "reader", tipo: "falha_leitura", mensagem: leitura.motivo }], []),
            lineage: HUB.ingest.model.criarLineage(SOURCE_ID, "reader")
          }),
          indicadores: [], gerenciasOfensoras: [], notas: [], bloqueios: [], diagnosticoFonte: diagnosticoFonte
        };
      }

      var decod = decodificarTextoLocal(leitura.raw);
      if (!decod.ok) {
        return {
          envelope: HUB.ingest.model.criarEnvelope({
            schemaVersion: "series_operacionais.dte.v1",
            sourceId: SOURCE_ID,
            domain: "series_operacionais",
            referencePeriod: null,
            payload: null,
            quality: HUB.ingest.model.criarQuality([{ etapa: "decoder_local", tipo: "falha_decodificacao", mensagem: decod.motivo }], []),
            lineage: HUB.ingest.model.criarLineage(SOURCE_ID, "decoder_local")
          }),
          indicadores: [], gerenciasOfensoras: [], notas: [], bloqueios: [], diagnosticoFonte: diagnosticoFonte
        };
      }

      var resultado = adaptar(decod.matriz);
      var quality = validar(resultado);
      var cargaValida = quality.erros.length === 0;

      var periodosDetectados = {};
      resultado.indicadores.forEach(function (r) { periodosDetectados[r.periodo] = true; });
      resultado.gerenciasOfensoras.forEach(function (r) { periodosDetectados[r.periodo] = true; });
      var listaPeriodos = Object.keys(periodosDetectados).sort();

      var envelope = HUB.ingest.model.criarEnvelope({
        schemaVersion: "series_operacionais.dte.v1",
        sourceId: SOURCE_ID,
        domain: "series_operacionais",
        referencePeriod: listaPeriodos.length ? (listaPeriodos[0] + ".." + listaPeriodos[listaPeriodos.length - 1]) : null,
        payload: cargaValida ? { periodos: listaPeriodos, indicadores: resultado.indicadores, gerenciasOfensoras: resultado.gerenciasOfensoras } : null,
        quality: quality,
        lineage: HUB.ingest.model.criarLineage(SOURCE_ID, "validator")
      });

      return {
        envelope: envelope,
        indicadores: resultado.indicadores,
        gerenciasOfensoras: resultado.gerenciasOfensoras,
        notas: resultado.notas,
        bloqueios: resultado.bloqueios,
        diagnosticoFonte: diagnosticoFonte
      };
    });
  }

  /* ---------- exporta ---------- */

  HUB.ingest = HUB.ingest || {};
  HUB.ingest.adapterDTE = {
    carregarDTE: carregarDTE,
    _adaptar: adaptar,
    _validar: validar,
    _numDTE: numDTE,
    _normEstrutural: normEstrutural,
    _celulaEhPeriodo: celulaEhPeriodo,
    _linhaEhEstrutural: linhaEhEstrutural,
    _criteriosDoSubgrupo: criteriosDoSubgrupo,
    CRITERIOS_CONHECIDOS: CRITERIOS_CONHECIDOS,
    BLOCOS_CONHECIDOS: BLOCOS_CONHECIDOS
  };

  HUB.registerComponent("ingest-adapter-dte");

})();
