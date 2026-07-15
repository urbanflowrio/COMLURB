/* ============================================================
   HUB COMLURB · BIBLIOTECA OFICIAL · hub-ingest-adapter-ar.js
   Camada 2 (Ingestão · Adapter específico) · v1.1.0
   Dependências: hub-core, hub-sources, hub-ingest-model,
   hub-ingest-reader, hub-ingest-decoder.
   PROIBIDO nesta camada: status/atingimento/bônus/tendência (isso é
   hub-rules-ar), DOM, Chart.js.

   FASE 4 (07/2026) — Piloto A (AR).

   v1.1.0: removida a dependência de hub-utils.js (HUB.format.toNumberBR
   / HUB.require("utils")). Conferido por diff direto contra o
   repositório em produção (main, 15/07/2026): o hub-utils.js
   publicado é uma versão anterior à "Fase 2" — não chama
   HUB.registerComponent("utils") e não expõe HUB.format.toNumberBR.
   Depender dele quebraria esta página assim que publicada. Este
   arquivo agora traz sua própria conversão numérica pt-BR
   (numAR, mesma regra de contrato que HUB.format.toNumberBR teria:
   vírgula sempre decimal; ponto isolado só vira milhar quando o
   padrão bate exatamente com agrupamento de 3 dígitos), sem alterar
   nenhum arquivo compartilhado existente.

   Por que um arquivo próprio, e não uma entrada no CONTRATOS de um
   hub-ingest-adapter.js genérico: o mecanismo genérico de contrato
   único-fonte foi desenhado para UMA fonte por contrato. O AR real
   precisa juntar TRÊS fontes antes de produzir uma linha canônica
   (AR_2026 = indicadores pactuados; AR_MAPEAMENTO = código→nome/filtros
   da aba Geral; AR_GERAL = série mensal por indicador, usada para
   localizar sentido/unidade/tendência). Essa junção (encontrarGeral) é
   uma particularidade real da fonte do AR, não um caso genérico. O
   domínio de saída continua sendo o já aprovado "indicadores_metas"
   (hub-ingest-model.js); nenhum domínio novo foi criado.

   Este arquivo NÃO aplica nenhuma regra institucional (status,
   atingimento, bônus, tendência, precedência SARC) — apenas traduz o
   vocabulário bruto das três planilhas para o vocabulário do domínio
   canônico. Essas regras vivem em hub-rules-ar.js.
   ============================================================ */

(function () {
  "use strict";

  var HUB = window.HUB;
  HUB.require("core", "sources", "ingest-model", "ingest-reader", "ingest-decoder");

  var MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  /* ================================================================
     NORMALIZAÇÃO ESTRUTURAL DE TEXTO — usada apenas para casar linhas
     entre as três planilhas (join), não para nenhuma regra de negócio.
     Réplica de norm()/key() do legado; duplicada localmente (em vez de
     importada de hub-rules-ar) porque o Adapter não pode depender da
     camada de regras (ver cabeçalho).
     ================================================================ */

  function normJoin(v) {
    return String(v == null ? "" : v)
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/\s+/g, " ").trim();
  }

  /**
   * Resolve um campo por lista de aliases em uma linha genérica,
   * exigindo valor não-vazio (réplica de get() do legado — mais
   * estrita que HUB.pick, que aceita string vazia como "encontrado").
   */
  function pickAR(linha, aliases, fallback) {
    if (!linha) return fallback === undefined ? "" : fallback;
    for (var i = 0; i < aliases.length; i++) {
      var v = linha[aliases[i]];
      if (v !== undefined && String(v).trim() !== "") return v;
    }
    var dict = {};
    Object.keys(linha).forEach(function (k) {
      dict[normJoin(k).replace(/[^a-z0-9]/g, "")] = k;
    });
    for (var j = 0; j < aliases.length; j++) {
      var chave = dict[normJoin(aliases[j]).replace(/[^a-z0-9]/g, "")];
      if (chave !== undefined && linha[chave] !== undefined && String(linha[chave]).trim() !== "") return linha[chave];
    }
    return fallback === undefined ? "" : fallback;
  }

  /* ================================================================
     CONTRATO DE FONTE — aliases das três planilhas reais do AR,
     extraídos verbatim das listas usadas em get(...) dentro de
     ar/index.html (montarMapeamento, encontrarGeral, processar).
     ================================================================ */

  var ALIASES_AR2026 = {
    codigo: ["Código", "Codigo"],
    grupo: ["Grupo"],
    ordem: ["Ordem"],
    indicador: ["Indicador Executivo", "Indicador_Executivo", "Indicador"],
    descricao: ["Descrição Resumida", "Descricao Resumida", "Descrição", "Descricao"],
    unidade: ["Unidade"],
    sentido: ["Sentido"],
    metaRaw: ["Meta_2026", "Meta 2026", "Meta"],
    atualRaw: ["Atual", "Resultado Atual", "Acumulado"],
    fonte: ["Fonte_Dados", "Fonte Dados", "Fonte"],
    pendencia: ["Pendência_Oficial", "Pendencia Oficial", "Pendência", "Pendencia"],
    tipoAcumulado: ["Tipo_Acumulado", "Tipo Acumulado"],
    periodicidade: ["Periodicidade"],
    statusPublicado: ["Status"]
  };

  var ALIASES_MAPEAMENTO = {
    codigo: ["Código_AR", "Codigo_AR", "Código", "Codigo", "Código AR", "Codigo AR"],
    indicadorGeral: ["Indicador_Geral", "Indicador Geral", "Indicador Real", "Nome na geral", "Indicador"],
    diretoria: ["Filtro_Diretoria", "Diretoria"],
    superint: ["Filtro_Superint", "Filtro_Superintendência", "Superint.", "Superintendência"],
    gerencia: ["Filtro_Gerência", "Filtro_Gerencia", "Gerência", "Gerencia"]
  };

  var ALIASES_GERAL = {
    ano: ["Ano"],
    indicador: ["Indicador"],
    diretoria: ["Diretoria"],
    superint: ["Superint.", "Superintendência", "Superint"],
    gerencia: ["Gerência", "Gerencia"],
    unidade: ["Unidade"],
    sentido: ["Sentido"],
    acumulado: ["Acumulado"],
    meta: ["Meta"]
  };

  var FONTES_AR = { AR2026: "AR_2026", MAPEAMENTO: "AR_MAPEAMENTO", GERAL: "AR_GERAL" };

  /* ================================================================
     JUNÇÃO — montarMapeamento / encontrarGeral, réplica exata da
     lógica do legado.
     ================================================================ */

  function montarMapeamento(linhasMapeamento) {
    var mapa = {};
    (linhasMapeamento || []).forEach(function (r) {
      var codigo = String(pickAR(r, ALIASES_MAPEAMENTO.codigo, "")).trim();
      if (!codigo) return;
      mapa[codigo] = {
        indicadorGeral: String(pickAR(r, ALIASES_MAPEAMENTO.indicadorGeral, "")).trim(),
        diretoria: String(pickAR(r, ALIASES_MAPEAMENTO.diretoria, "")).trim(),
        superint: String(pickAR(r, ALIASES_MAPEAMENTO.superint, "")).trim(),
        gerencia: String(pickAR(r, ALIASES_MAPEAMENTO.gerencia, "")).trim()
      };
    });
    return mapa;
  }

  function encontrarGeral(nomeIndicador, mapItem, linhasGeral) {
    var nomeMap = normJoin(mapItem ? mapItem.indicadorGeral : "");
    var nomeInd = normJoin(nomeIndicador);

    var candidatas = (linhasGeral || []).filter(function (r) {
      var ano = String(pickAR(r, ALIASES_GERAL.ano, "")).trim();
      if (ano && ano !== "2026") return false;

      var nomeGeral = normJoin(pickAR(r, ALIASES_GERAL.indicador, ""));
      if (nomeMap) {
        if (nomeGeral !== nomeMap && nomeGeral.indexOf(nomeMap) === -1 && nomeMap.indexOf(nomeGeral) === -1) return false;
      } else {
        if (nomeGeral !== nomeInd && nomeGeral.indexOf(nomeInd) === -1 && nomeInd.indexOf(nomeGeral) === -1) return false;
      }

      var fDir = normJoin(mapItem ? mapItem.diretoria : "");
      var fSup = normJoin(mapItem ? mapItem.superint : "");
      var fGer = normJoin(mapItem ? mapItem.gerencia : "");
      if (fDir && fDir !== "-" && normJoin(pickAR(r, ALIASES_GERAL.diretoria, "")) !== fDir) return false;
      if (fSup && fSup !== "-" && normJoin(pickAR(r, ALIASES_GERAL.superint, "")) !== fSup) return false;
      if (fGer && fGer !== "-" && normJoin(pickAR(r, ALIASES_GERAL.gerencia, "")) !== fGer) return false;
      return true;
    });

    return candidatas[0] || null;
  }

  // Conversão numérica pt-BR autocontida (não depende de hub-utils.js —
  // ver nota de v1.1.0 no cabeçalho). Mesmo contrato de HUB.format.
  // toNumberBR({allowAmbiguous:true, onErrorReturnNull:true}): vírgula é
  // sempre decimal; ponto isolado só vira separador de milhar quando o
  // padrão bate exatamente com um agrupamento de 3 dígitos; caso
  // contrário é tratado como decimal; inválido/vazio -> null (nunca zero).
  function numAR(v) {
    if (v === null || v === undefined) return null;
    if (typeof v === "number") return isFinite(v) ? v : null;

    var s = String(v).replace(/\u00A0/g, " ").trim();
    if (s === "") return null;
    s = s.replace(/\s+/g, "");

    var negativo = false;
    var parenMatch = /^\((.*)\)$/.exec(s);
    if (parenMatch) { negativo = true; s = parenMatch[1]; }
    if (s.charAt(0) === "-") { negativo = true; s = s.slice(1); }
    else if (s.charAt(0) === "+") { s = s.slice(1); }
    s = s.replace(/^R\$/i, "");

    var isPct = /%$/.test(s);
    if (isPct) s = s.slice(0, -1);
    if (s === "" || s === "-") return null;

    var temVirgula = s.indexOf(",") !== -1;
    var temPonto = s.indexOf(".") !== -1;
    var norm;

    if (temVirgula && temPonto) {
      norm = s.replace(/\./g, "").replace(",", ".");
    } else if (temVirgula && !temPonto) {
      norm = s.replace(",", ".");
    } else if (!temVirgula && temPonto) {
      var partes = s.split(".");
      var pareceMilhar = partes.length === 2 && /^\d{1,3}$/.test(partes[0]) && /^\d{3}$/.test(partes[1]);
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
     ADAPTAÇÃO — uma linha genérica de AR_2026 (+ contexto de
     mapeamento/geral já carregados) -> payload canônico do domínio
     indicadores_metas.
     ================================================================ */

  function adaptarLinha(linhaAR2026, indice, mapa, linhasGeral) {
    var codigo = String(pickAR(linhaAR2026, ALIASES_AR2026.codigo, "")).trim() || ("AR" + (indice + 1));
    var indicadorNome = String(pickAR(linhaAR2026, ALIASES_AR2026.indicador, codigo)).trim();
    var unidade = String(pickAR(linhaAR2026, ALIASES_AR2026.unidade, "")).trim();
    var sentido = String(pickAR(linhaAR2026, ALIASES_AR2026.sentido, "maior_melhor")).trim();
    var metaRaw = pickAR(linhaAR2026, ALIASES_AR2026.metaRaw, "");
    var atualRaw = pickAR(linhaAR2026, ALIASES_AR2026.atualRaw, "");

    var mapItem = mapa[codigo] || null;
    var linhaGeral = encontrarGeral(indicadorNome, mapItem, linhasGeral);

    // Fallback de unidade/sentido/valores a partir da aba Geral, réplica
    // exata do bloco "if(linha){...}" em processar().
    if (linhaGeral) {
      if (!unidade) unidade = String(pickAR(linhaGeral, ALIASES_GERAL.unidade, "")).trim();
      if (!sentido) sentido = String(pickAR(linhaGeral, ALIASES_GERAL.sentido, "maior_melhor")).trim();
      if (!String(atualRaw).trim()) atualRaw = pickAR(linhaGeral, ALIASES_GERAL.acumulado, "");
      if (!String(metaRaw).trim()) metaRaw = pickAR(linhaGeral, ALIASES_GERAL.meta, "");
    }

    var meta = numAR(metaRaw);
    var realizado = numAR(atualRaw);

    var serieMensal = linhaGeral
      ? MESES.map(function (m) { return numAR(linhaGeral[m]); }).filter(function (v) { return v !== null; })
      : [];

    var grupo = String(pickAR(linhaAR2026, ALIASES_AR2026.grupo, "")).trim() || "Sem grupo";
    var ordem = numAR(pickAR(linhaAR2026, ALIASES_AR2026.ordem, "")) || (indice + 1);
    var statusPublicadoRaw = String(pickAR(linhaAR2026, ALIASES_AR2026.statusPublicado, "")).trim();

    return {
      // ---- campos canônicos do domínio indicadores_metas ----
      id: codigo,
      nome: indicadorNome,
      meta: meta,
      realizado: realizado,
      unidade: unidade,
      sentido: sentido,
      periodo: "2026",
      acumulado: realizado,
      origem: linhaGeral ? "geral+mapeamento" : "ar2026",
      condicaoPactuacao: grupo,
      statusDisponibilidade: (realizado !== null && meta !== null && realizado !== 0 && meta !== 0) ? "disponivel" : "sem_dado",
      // ---- metadados necessários às regras (hub-rules-ar) ----
      metadados: {
        descricao: String(pickAR(linhaAR2026, ALIASES_AR2026.descricao, "")).trim(),
        fonte: String(pickAR(linhaAR2026, ALIASES_AR2026.fonte, "")).trim(),
        pendencia: String(pickAR(linhaAR2026, ALIASES_AR2026.pendencia, "")).trim(),
        tipoAcumulado: String(pickAR(linhaAR2026, ALIASES_AR2026.tipoAcumulado, "SOMA")).trim().toUpperCase(),
        periodicidade: String(pickAR(linhaAR2026, ALIASES_AR2026.periodicidade, "Mensal")).trim(),
        ordem: ordem,
        statusPublicadoRaw: statusPublicadoRaw,
        serieMensal: serieMensal,
        encontradoNaGeral: !!linhaGeral
      }
    };
  }

  /* ================================================================
     VALIDATOR — obrigatório apenas "id" (código), com fallback já
     garantido pelo Adapter (AR<n>), então na prática só bloqueia
     duplicidade real de código. meta/realizado ausentes ou não
     numéricos NUNCA bloqueiam a linha (o legado sempre exibe a linha
     como "Sem dado", nunca a descarta) — viram aviso, não erro,
     preservando o princípio de falha segura sem inventar um
     comportamento mais estrito do que o legado comprovadamente tem.
     ================================================================ */

  function validar(itens) {
    var chavesVistas = [];
    var linhasValidas = [];
    var linhasComErro = [];
    var avisosGlobais = [];

    itens.forEach(function (item, indice) {
      var erros = [];
      var avisos = [];

      if (!item.id) {
        erros.push({ campo: "id", tipo: "campo_ausente", mensagem: "Código do indicador ausente e sem fallback (não deveria ocorrer)." });
      } else if (chavesVistas.indexOf(item.id) !== -1) {
        erros.push({ campo: "id", tipo: "chave_duplicada", mensagem: "Código de indicador AR duplicado: " + item.id });
      } else {
        chavesVistas.push(item.id);
      }

      if (item.meta === null) {
        avisos.push({ campo: "meta", tipo: "valor_ausente_ou_invalido", mensagem: "Meta ausente/não numérica para " + item.id + " — indicador será 'Sem dado', não descartado." });
      }
      if (item.realizado === null) {
        avisos.push({ campo: "realizado", tipo: "valor_ausente_ou_invalido", mensagem: "Realizado ausente/não numérico para " + item.id + " — indicador será 'Sem dado', não descartado." });
      }
      if (!item.metadados.encontradoNaGeral) {
        avisos.push({ campo: "origem", tipo: "sem_correspondencia_geral", mensagem: "Nenhuma linha correspondente encontrada na aba Geral para " + item.id + " — tendência ficará 'Série curta', sentido/unidade dependem só de AR_2026." });
      }

      avisos.forEach(function (a) { avisosGlobais.push(Object.assign({ linha: indice }, a)); });

      if (erros.length) {
        linhasComErro.push({ linha: indice, id: item.id, erros: erros });
      } else {
        linhasValidas.push(item);
      }
    });

    var errosGlobais = [];
    linhasComErro.forEach(function (le) { le.erros.forEach(function (e) { errosGlobais.push(Object.assign({ linha: le.linha }, e)); }); });

    return {
      linhasValidas: linhasValidas,
      linhasComErro: linhasComErro,
      quality: HUB.ingest.model.criarQuality(errosGlobais, avisosGlobais)
    };
  }

  /* ================================================================
     PIPELINE AR — Locator -> Reader (remote-csv, 3x) -> Decoder (3x)
     -> junção -> Adapter -> Validator -> Modelo canônico.
     Assíncrono (as 3 fontes são buscadas em paralelo). Snapshot fica
     fora da cadeia (ver MIGRATION_STRATEGY.md §3.4).
     ================================================================ */

  function buscarEDecodificar(sourceId, opts) {
    return HUB.ingest.reader.lerAsync(sourceId, opts).then(function (leitura) {
      if (!leitura.ok) {
        return { ok: false, linhas: [], etapa: "reader", motivo: leitura.motivo };
      }
      var decodificado = HUB.ingest.decoder.decodificar(leitura.raw, leitura.tipo, (opts && opts.decoderOpts) || {});
      if (!decodificado.ok) {
        return { ok: false, linhas: [], etapa: "decoder", motivo: decodificado.motivo };
      }
      return { ok: true, linhas: decodificado.linhas, etapa: null, motivo: null };
    });
  }

  /**
   * Executa a cadeia completa para o AR.
   * @param {Object} opts
   * @param {Function} [opts.fetchImpl] injeção de fetch (teste determinístico)
   * @param {Object} [opts.fixtures] quando presente, substitui a busca de
   *   rede por texto CSV fixo por fonte: { AR_2026: "...", AR_MAPEAMENTO:
   *   "...", AR_GERAL: "..." } — usado para validar a cadeia sem depender
   *   de rede real (ver limitação de ambiente registrada em
   *   IMPLEMENTATION_STATUS.md). NUNCA usado silenciosamente: quem chama
   *   com fixtures precisa saber que está fazendo isso.
   * @returns {Promise<{envelope, itens, linhasComErro, diagnosticoFontes}>}
   */
  function carregarAR(opts) {
    opts = opts || {};

    function origemLinhas(sourceId) {
      if (opts.fixtures && opts.fixtures[sourceId] !== undefined) {
        var decodificado = HUB.ingest.decoder.decodificar(opts.fixtures[sourceId], "texto", {});
        return Promise.resolve(decodificado.ok
          ? { ok: true, linhas: decodificado.linhas, etapa: null, motivo: null }
          : { ok: false, linhas: [], etapa: "decoder", motivo: decodificado.motivo });
      }
      return buscarEDecodificar(sourceId, opts);
    }

    return Promise.all([
      origemLinhas(FONTES_AR.AR2026),
      origemLinhas(FONTES_AR.MAPEAMENTO),
      origemLinhas(FONTES_AR.GERAL)
    ]).then(function (resultados) {
      var rAR2026 = resultados[0], rMap = resultados[1], rGeral = resultados[2];

      var diagnosticoFontes = {
        AR_2026: { ok: rAR2026.ok, etapa: rAR2026.etapa, motivo: rAR2026.motivo, linhas: rAR2026.linhas.length },
        AR_MAPEAMENTO: { ok: rMap.ok, etapa: rMap.etapa, motivo: rMap.motivo, linhas: rMap.linhas.length },
        AR_GERAL: { ok: rGeral.ok, etapa: rGeral.etapa, motivo: rGeral.motivo, linhas: rGeral.linhas.length }
      };

      // Falha segura: AR_2026 é a fonte primária — sem ela não há o que
      // adaptar. AR_MAPEAMENTO/AR_GERAL ausentes degradam qualidade
      // (avisos por linha, ver validar()) mas não impedem o envelope,
      // igual ao legado, que também segue em frente se apenas o join
      // falhar para alguns códigos.
      if (!rAR2026.ok) {
        return {
          envelope: HUB.ingest.model.criarEnvelope({
            schemaVersion: "indicadores.v1",
            sourceId: FONTES_AR.AR2026,
            domain: "indicadores_metas",
            referencePeriod: "2026",
            payload: null,
            quality: HUB.ingest.model.criarQuality([{ etapa: rAR2026.etapa, tipo: "falha_leitura", mensagem: rAR2026.motivo }], []),
            lineage: HUB.ingest.model.criarLineage(FONTES_AR.AR2026, rAR2026.etapa)
          }),
          itens: [], linhasComErro: [], diagnosticoFontes: diagnosticoFontes
        };
      }

      var mapa = montarMapeamento(rMap.ok ? rMap.linhas : []);
      var itens = rAR2026.linhas.map(function (linha, indice) {
        return adaptarLinha(linha, indice, mapa, rGeral.ok ? rGeral.linhas : []);
      });

      var resultadoValidacao = validar(itens);
      var cargaValida = resultadoValidacao.quality.erros.length === 0;

      var envelope = HUB.ingest.model.criarEnvelope({
        schemaVersion: "indicadores.v1",
        sourceId: FONTES_AR.AR2026,
        domain: "indicadores_metas",
        referencePeriod: "2026",
        payload: cargaValida ? { linhas: resultadoValidacao.linhasValidas } : null,
        quality: resultadoValidacao.quality,
        lineage: HUB.ingest.model.criarLineage(FONTES_AR.AR2026, "validator")
      });

      return {
        envelope: envelope,
        itens: resultadoValidacao.linhasValidas,
        linhasComErro: resultadoValidacao.linhasComErro,
        diagnosticoFontes: diagnosticoFontes
      };
    });
  }

  /* ---------- exporta ---------- */

  HUB.ingest = HUB.ingest || {};
  HUB.ingest.adapterAR = {
    carregarAR: carregarAR,
    _montarMapeamento: montarMapeamento,
    _encontrarGeral: encontrarGeral,
    _adaptarLinha: adaptarLinha,
    _validar: validar,
    _pickAR: pickAR
  };

  HUB.registerComponent("ingest-adapter-ar");

})();
