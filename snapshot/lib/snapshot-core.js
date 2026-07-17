/* ============================================================
   HUB COMLURB · snapshot/lib/snapshot-core.js
   Fase 6 (07/2026) · v1.0.0
   Dependências: snapshot/lib/canonical.js (Node puro, sem HUB).

   MECANISMO GENÉRICO — não conhece "AR" nem "DTE" por nome, nem
   nenhuma regra institucional. Recebe:
   - moduloId: identificador curto e opaco do módulo (ex.: "ar",
     "engenharia-dte") — usado só para nomear pastas, nunca para
     ramificar lógica de negócio;
   - um envelope já produzido por hub-ingest-model.js (via Adapter já
     aprovado) OU uma indicação explícita de que o ciclo deve ser
     rejeitado antes mesmo de chegar a um envelope válido.

   Responsabilidades exclusivas deste arquivo:
   - decidir se um envelope é válido o suficiente para virar snapshot
     oficial;
   - calcular hash determinístico;
   - comparar com o último snapshot válido do mesmo módulo;
   - persistir de forma atômica (latest.json nunca fica inconsistente);
   - gerar o conteúdo do relatório (texto), sem decidir onde publicá-lo
     (isso é orquestração, ver snapshot/run.js);
   - identificar (nunca apagar) itens elegíveis para retenção.

   PROIBIDO NESTE ARQUIVO: conhecimento de AR_2026/AR_GERAL/DTE_
   RELATORIO_GERAL, regra de fontes obrigatórias, qualquer regra
   institucional (status/atingimento/bônus/criterio/subgrupo). Essas
   decisões vivem nas pontes finas (snapshot-ar.js/snapshot-dte.js),
   que traduzem o resultado do Adapter para o contrato genérico que
   este arquivo entende.
   ============================================================ */

"use strict";

var fs = require("fs");
var path = require("path");
var crypto = require("crypto");
var canonical = require("./canonical.js");

var SNAPSHOT_VERSION = "1.0.0";
var RETENCAO_DIAS_REJEITADOS_E_FALHAS = 90;
var CAMPOS_VOLATEIS_QUALITY = ["timestamp"];
var CAMPOS_VOLATEIS_LINEAGE = ["timestamp"];

/* ================================================================
   VALIDAÇÃO DO ENVELOPE
   ================================================================ */

/**
 * Decide se um envelope (já produzido por hub-ingest-model.js) é
 * elegível para virar snapshot oficial. Não avalia nenhuma regra de
 * negócio — só a forma mínima já definida pelo contrato do envelope
 * (ver docs/architecture, hub-ingest-model.js).
 */
function avaliarEnvelope(envelope) {
  var motivos = [];
  if (!envelope) {
    return { valido: false, motivos: ["Envelope ausente."] };
  }
  if (envelope.payload === null || envelope.payload === undefined) {
    motivos.push("payload é null — carga não foi validada com sucesso pelo Adapter.");
  }
  if (!envelope.quality || !Array.isArray(envelope.quality.erros)) {
    motivos.push("quality ausente ou malformado.");
  } else if (envelope.quality.erros.length > 0) {
    motivos.push("quality.erros não está vazio (" + envelope.quality.erros.length + " erro(s)).");
  }
  if (!envelope.sourceId) motivos.push("sourceId ausente.");
  if (!envelope.schemaVersion) motivos.push("schemaVersion ausente.");
  if (envelope.referencePeriod === null || envelope.referencePeriod === undefined || envelope.referencePeriod === "") {
    motivos.push("referencePeriod ausente.");
  }
  if (!envelope.lineage) motivos.push("lineage ausente.");

  return { valido: motivos.length === 0, motivos: motivos };
}

/* ================================================================
   HASH DETERMINÍSTICO
   ================================================================ */

function removerCamposVolateis(objeto, campos) {
  if (!objeto || typeof objeto !== "object") return objeto;
  var copia = {};
  Object.keys(objeto).forEach(function (chave) {
    if (campos.indexOf(chave) === -1) copia[chave] = objeto[chave];
  });
  return copia;
}

/**
 * Monta a entrada usada para o hash. Inclui schemaVersion, sourceId,
 * referencePeriod, domain, payload, quality (sem timestamps voláteis)
 * e lineage (sem timestamps voláteis). NÃO inclui capturedAt (ver
 * decisão de governança da Fase 6 — capturedAt é sempre volátil e
 * ficaria fora do envelope de qualquer forma, nunca dentro deste
 * objeto). Não usa apenas payload, deliberadamente: contrato, fonte,
 * período e qualidade também precisam ser detectáveis por hash.
 */
function construirEntradaHash(envelope) {
  return {
    schemaVersion: envelope.schemaVersion,
    sourceId: envelope.sourceId,
    referencePeriod: envelope.referencePeriod,
    domain: envelope.domain,
    payload: envelope.payload,
    quality: removerCamposVolateis(envelope.quality, CAMPOS_VOLATEIS_QUALITY),
    lineage: removerCamposVolateis(envelope.lineage, CAMPOS_VOLATEIS_LINEAGE)
  };
}

function calcularHash(envelope) {
  var entrada = construirEntradaHash(envelope);
  var canonico = canonical.canonicalJSONStringify(entrada);
  var digest = crypto.createHash("sha256").update(canonico, "utf8").digest("hex");
  return "sha256:" + digest;
}

/* ================================================================
   CAMINHOS E UTILITÁRIOS DE ARQUIVO
   ================================================================ */

function sanitizarNomePasta(valor) {
  return String(valor == null ? "sem-periodo" : valor)
    .trim()
    .replace(/[^a-zA-Z0-9_.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "sem-periodo";
}

function normalizarTimestampParaNomeArquivo(iso) {
  return String(iso || new Date().toISOString()).replace(/[:.]/g, "-");
}

function dirModulo(raizDados, moduloId, subpasta) {
  return path.join(raizDados, subpasta, moduloId);
}

function caminhoLatest(raizDados, moduloId) {
  return path.join(dirModulo(raizDados, moduloId, "snapshots"), "latest.json");
}

function lerLatest(raizDados, moduloId) {
  var caminho = caminhoLatest(raizDados, moduloId);
  if (!fs.existsSync(caminho)) return null;
  try {
    return JSON.parse(fs.readFileSync(caminho, "utf8"));
  } catch (erro) {
    // latest.json corrompido é tratado como ausente para fins de
    // comparação, mas o problema deve aparecer no relatório — quem
    // chama esta função decide o que fazer com esse sinal.
    return null;
  }
}

/* ================================================================
   PERSISTÊNCIA — SNAPSHOT VÁLIDO (gravação atômica)
   ================================================================ */

/**
 * Grava um snapshot válido (arquivo do período) e só então atualiza
 * latest.json — e mesmo essa atualização é atômica (escreve um
 * temporário, confirma releitura, e só depois renomeia por cima do
 * latest.json real). Se qualquer etapa falhar, o latest anterior
 * permanece intocado — nunca há uma janela onde latest.json aponta
 * para um arquivo inexistente ou incompleto.
 *
 * @param {string} raizDados caminho absoluto da pasta data/
 * @param {string} moduloId identificador opaco do módulo
 * @param {Object} envelope envelope já validado (avaliarEnvelope().valido === true)
 * @param {string} hash hash já calculado (calcularHash(envelope))
 * @returns {{caminhoSnapshot: string, caminhoLatest: string, ponteiro: Object}}
 */
function gravarSnapshotValido(raizDados, moduloId, envelope, hash) {
  var dirPeriodo = path.join(
    dirModulo(raizDados, moduloId, "snapshots"),
    "periodos",
    sanitizarNomePasta(envelope.referencePeriod)
  );
  fs.mkdirSync(dirPeriodo, { recursive: true });

  var capturadoNormalizado = normalizarTimestampParaNomeArquivo(envelope.capturedAt);
  var hashPrefixo = hash.replace("sha256:", "").slice(0, 12);
  var nomeArquivo = capturadoNormalizado + "__" + hashPrefixo + ".json";
  var caminhoSnapshot = path.join(dirPeriodo, nomeArquivo);

  var involucro = {
    snapshotVersion: SNAPSHOT_VERSION,
    moduloId: moduloId,
    hash: hash,
    hashInputVersion: SNAPSHOT_VERSION,
    geradoEm: new Date().toISOString(),
    envelope: envelope
  };

  fs.writeFileSync(caminhoSnapshot, JSON.stringify(involucro, null, 2) + "\n", "utf8");

  // Passo 2 da escrita atômica: confirmar que o arquivo existe e pode
  // ser relido corretamente antes de tocar no ponteiro latest.
  var releitura;
  try {
    releitura = JSON.parse(fs.readFileSync(caminhoSnapshot, "utf8"));
  } catch (erro) {
    throw new Error("[snapshot-core] Falha ao confirmar gravação do snapshot (releitura inválida): " + caminhoSnapshot);
  }
  if (releitura.hash !== hash) {
    throw new Error("[snapshot-core] Falha ao confirmar gravação do snapshot (hash não confere na releitura): " + caminhoSnapshot);
  }

  var ponteiro = {
    snapshotVersion: SNAPSHOT_VERSION,
    moduloId: moduloId,
    path: path.relative(raizDados, caminhoSnapshot).split(path.sep).join("/"),
    hash: hash,
    referencePeriod: envelope.referencePeriod,
    capturedAt: envelope.capturedAt,
    updatedAt: new Date().toISOString(),
    // Campos adicionais (além do mínimo pedido) só para permitir
    // detecção barata de mudança estrutural em relatórios futuros,
    // sem precisar reabrir o snapshot inteiro — não substituem nada
    // do contrato mínimo, são aditivos.
    schemaVersion: envelope.schemaVersion,
    domain: envelope.domain
  };

  var caminhoLatestArq = caminhoLatest(raizDados, moduloId);
  var temporario = caminhoLatestArq + ".tmp-" + process.pid + "-" + Date.now();
  fs.writeFileSync(temporario, JSON.stringify(ponteiro, null, 2) + "\n", "utf8");

  var releituraPonteiro;
  try {
    releituraPonteiro = JSON.parse(fs.readFileSync(temporario, "utf8"));
  } catch (erro) {
    fs.unlinkSync(temporario);
    throw new Error("[snapshot-core] Falha ao confirmar gravação do latest temporário (releitura inválida).");
  }
  if (releituraPonteiro.hash !== hash) {
    fs.unlinkSync(temporario);
    throw new Error("[snapshot-core] Falha ao confirmar gravação do latest temporário (hash não confere na releitura).");
  }

  fs.renameSync(temporario, caminhoLatestArq);

  return { caminhoSnapshot: caminhoSnapshot, caminhoLatest: caminhoLatestArq, ponteiro: ponteiro };
}

/* ================================================================
   PERSISTÊNCIA — REJEITADO (nunca inclui CSV/payload bruto completo)
   ================================================================ */

/**
 * Grava um registro de rejeição — nunca o conteúdo bruto completo da
 * fonte. Campos aceitos: modulo, fonte, horario, etapa, motivo,
 * diagnostico, resumoEntrada (opcional, já resumido por quem chama),
 * hashEntradaBruta (opcional).
 */
function gravarRejeitado(raizDados, moduloId, registro) {
  var dirRej = dirModulo(raizDados, moduloId, "rejected");
  fs.mkdirSync(dirRej, { recursive: true });

  var horario = registro.horario || new Date().toISOString();
  var nomeArquivo = normalizarTimestampParaNomeArquivo(horario) + "__rejeitado.json";
  var caminho = path.join(dirRej, nomeArquivo);

  var conteudo = {
    modulo: moduloId,
    fonte: registro.fonte || null,
    horario: horario,
    etapa: registro.etapa || "desconhecida",
    motivo: registro.motivo || "Motivo não informado.",
    diagnostico: registro.diagnostico || null,
    resumoEntrada: registro.resumoEntrada || null,
    hashEntradaBruta: registro.hashEntradaBruta || null
  };

  fs.writeFileSync(caminho, JSON.stringify(conteudo, null, 2) + "\n", "utf8");
  return caminho;
}

/* ================================================================
   RELATÓRIOS — persistência condicional em data/reports
   ================================================================ */

function gravarRelatorioPersistido(raizDados, moduloId, statusResumo, conteudoMarkdown) {
  var dirRel = dirModulo(raizDados, moduloId, "reports");
  fs.mkdirSync(dirRel, { recursive: true });
  var nomeArquivo = normalizarTimestampParaNomeArquivo(new Date().toISOString()) + "__" + statusResumo + ".md";
  var caminho = path.join(dirRel, nomeArquivo);
  fs.writeFileSync(caminho, conteudoMarkdown, "utf8");
  return caminho;
}

/* ================================================================
   RETENÇÃO — só identifica, nunca apaga
   ================================================================ */

/**
 * Lista arquivos elegíveis para limpeza (rejected/* e reports/*falha*
 * mais antigos que RETENCAO_DIAS_REJEITADOS_E_FALHAS dias). Nunca
 * apaga nada — quem chama decide o que fazer com a lista.
 */
function listarElegiveisRetencao(raizDados, agora) {
  agora = agora || new Date();
  var limiteMs = RETENCAO_DIAS_REJEITADOS_E_FALHAS * 24 * 60 * 60 * 1000;
  var elegiveis = [];

  function varrer(diretorioBase, ehElegivelPorNome) {
    if (!fs.existsSync(diretorioBase)) return;
    fs.readdirSync(diretorioBase).forEach(function (moduloDir) {
      var caminhoModulo = path.join(diretorioBase, moduloDir);
      if (!fs.statSync(caminhoModulo).isDirectory()) return;
      fs.readdirSync(caminhoModulo).forEach(function (arquivo) {
        if (!ehElegivelPorNome(arquivo)) return;
        var caminhoArquivo = path.join(caminhoModulo, arquivo);
        var stat = fs.statSync(caminhoArquivo);
        var idadeMs = agora.getTime() - stat.mtime.getTime();
        if (idadeMs > limiteMs) {
          elegiveis.push({
            caminho: caminhoArquivo,
            modulo: moduloDir,
            idadeDias: Math.floor(idadeMs / (24 * 60 * 60 * 1000)),
            mtime: stat.mtime.toISOString()
          });
        }
      });
    });
  }

  varrer(path.join(raizDados, "rejected"), function () { return true; });
  varrer(path.join(raizDados, "reports"), function (nome) { return nome.indexOf("falha") !== -1; });

  return elegiveis;
}

/* ================================================================
   CICLO COMPLETO DE UM MÓDULO
   ================================================================ */

/**
 * Processa o ciclo de um módulo já traduzido para o contrato genérico:
 *
 * @param {Object} params
 * @param {string} params.raizDados caminho absoluto da pasta data/
 * @param {string} params.moduloId identificador opaco ("ar", "engenharia-dte")
 * @param {boolean} [params.rejeitarAntesDoEnvelope] quando true, o ciclo é
 *   rejeitado sem sequer avaliar o envelope (ex.: fonte obrigatória
 *   ausente, decidido pela ponte fina do módulo, nunca por este arquivo)
 * @param {Object} [params.registroRejeicao] usado só quando
 *   rejeitarAntesDoEnvelope é true — mesmo formato de gravarRejeitado()
 * @param {Object} [params.envelope] envelope já produzido pelo Adapter
 * @param {string} [params.resumoRegistros] texto curto, já formatado
 *   pela ponte fina do módulo (ex.: "13 indicadores"), usado só para
 *   compor o relatório — este arquivo não interpreta o payload.
 * @returns {Object} resultado do ciclo, incluindo status, hash,
 *   caminhoRelatorio (se persistido) e falhou (boolean)
 */
function processarCicloModulo(params) {
  var raizDados = params.raizDados;
  var moduloId = params.moduloId;
  var agoraISO = new Date().toISOString();

  if (params.rejeitarAntesDoEnvelope) {
    var registro = params.registroRejeicao || {};
    var caminhoRejeitado = gravarRejeitado(raizDados, moduloId, registro);
    var relatorioFalha = montarRelatorio({
      moduloId: moduloId,
      status: "falha_pre_envelope",
      horario: agoraISO,
      fonte: registro.fonte,
      referencePeriod: null,
      registrosProcessados: null,
      avisos: [],
      erros: [registro.motivo || "Ciclo rejeitado antes da produção do envelope."],
      diferencaSnapshotAnterior: "não aplicável — ciclo rejeitado antes da comparação",
      snapshotCriado: false,
      ultimoSnapshotValidoPreservado: true,
      hash: null,
      proximoPassoRecomendado: "Corrigir a causa listada em 'erros' e reexecutar. Nenhum snapshot foi tocado."
    });
    var caminhoRelatorioFalha = gravarRelatorioPersistido(raizDados, moduloId, "falha", relatorioFalha);
    return {
      moduloId: moduloId,
      status: "falha_pre_envelope",
      falhou: true,
      hash: null,
      caminhoRejeitado: caminhoRejeitado,
      caminhoRelatorio: caminhoRelatorioFalha,
      relatorioMarkdown: relatorioFalha
    };
  }

  var envelope = params.envelope;
  var avaliacao = avaliarEnvelope(envelope);

  if (!avaliacao.valido) {
    var registroInvalido = {
      fonte: envelope ? envelope.sourceId : null,
      horario: agoraISO,
      etapa: "validator",
      motivo: avaliacao.motivos.join(" | "),
      diagnostico: envelope ? { quality: envelope.quality || null } : null,
      resumoEntrada: params.resumoRegistros || null
    };
    var caminhoRejeitadoInv = gravarRejeitado(raizDados, moduloId, registroInvalido);
    var relatorioInvalido = montarRelatorio({
      moduloId: moduloId,
      status: "falha_validacao",
      horario: agoraISO,
      fonte: registroInvalido.fonte,
      referencePeriod: envelope ? envelope.referencePeriod : null,
      registrosProcessados: params.resumoRegistros || null,
      avisos: (envelope && envelope.quality && envelope.quality.avisos) || [],
      erros: avaliacao.motivos,
      diferencaSnapshotAnterior: "não aplicável — envelope inválido",
      snapshotCriado: false,
      ultimoSnapshotValidoPreservado: true,
      hash: null,
      proximoPassoRecomendado: "Revisar 'erros' acima e a fonte de origem. O último snapshot válido não foi alterado."
    });
    var caminhoRelatorioInvalido = gravarRelatorioPersistido(raizDados, moduloId, "falha", relatorioInvalido);
    return {
      moduloId: moduloId,
      status: "falha_validacao",
      falhou: true,
      hash: null,
      caminhoRejeitado: caminhoRejeitadoInv,
      caminhoRelatorio: caminhoRelatorioInvalido,
      relatorioMarkdown: relatorioInvalido
    };
  }

  var hash = calcularHash(envelope);
  var latestAnterior = lerLatest(raizDados, moduloId);
  var mudou = !latestAnterior || latestAnterior.hash !== hash;
  var mudancaEstrutural = !!latestAnterior &&
    (latestAnterior.schemaVersion !== envelope.schemaVersion || latestAnterior.domain !== envelope.domain);

  var avisos = (envelope.quality && envelope.quality.avisos) || [];

  if (!mudou) {
    var relatorioSemMudanca = montarRelatorio({
      moduloId: moduloId,
      status: "sem_mudanca",
      horario: agoraISO,
      fonte: envelope.sourceId,
      referencePeriod: envelope.referencePeriod,
      registrosProcessados: params.resumoRegistros || null,
      avisos: avisos,
      erros: [],
      diferencaSnapshotAnterior: "nenhuma — hash idêntico ao último snapshot válido",
      snapshotCriado: false,
      ultimoSnapshotValidoPreservado: true,
      hash: hash,
      proximoPassoRecomendado: "Nenhuma ação necessária."
    });

    var persistirPorAviso = avisos.length > 0;
    var caminhoRelatorioSM = persistirPorAviso
      ? gravarRelatorioPersistido(raizDados, moduloId, "sem_mudanca_com_aviso", relatorioSemMudanca)
      : null;

    return {
      moduloId: moduloId,
      status: "sem_mudanca",
      falhou: false,
      hash: hash,
      caminhoRejeitado: null,
      caminhoRelatorio: caminhoRelatorioSM,
      relatorioMarkdown: relatorioSemMudanca,
      commitRelevante: persistirPorAviso
    };
  }

  var gravacao = gravarSnapshotValido(raizDados, moduloId, envelope, hash);
  var statusCiclo = latestAnterior ? "novo_snapshot" : "primeiro_snapshot";

  var relatorioNovo = montarRelatorio({
    moduloId: moduloId,
    status: statusCiclo,
    horario: agoraISO,
    fonte: envelope.sourceId,
    referencePeriod: envelope.referencePeriod,
    registrosProcessados: params.resumoRegistros || null,
    avisos: avisos,
    erros: [],
    diferencaSnapshotAnterior: latestAnterior
      ? ("hash anterior " + latestAnterior.hash + " → hash novo " + hash + (mudancaEstrutural ? " (MUDANÇA ESTRUTURAL: schemaVersion/domain diferentes)" : ""))
      : "nenhum snapshot anterior — esta é a primeira captura válida do módulo",
    snapshotCriado: true,
    ultimoSnapshotValidoPreservado: true,
    hash: hash,
    proximoPassoRecomendado: mudancaEstrutural
      ? "Mudança estrutural detectada — revisar manualmente antes de considerar este snapshot rotina."
      : "Nenhuma ação necessária além da revisão de rotina do relatório."
  });

  var caminhoRelatorioNovo = gravarRelatorioPersistido(raizDados, moduloId, statusCiclo, relatorioNovo);

  return {
    moduloId: moduloId,
    status: statusCiclo,
    falhou: false,
    hash: hash,
    caminhoSnapshot: gravacao.caminhoSnapshot,
    caminhoLatest: gravacao.caminhoLatest,
    caminhoRejeitado: null,
    caminhoRelatorio: caminhoRelatorioNovo,
    relatorioMarkdown: relatorioNovo,
    mudancaEstrutural: mudancaEstrutural,
    commitRelevante: true
  };
}

/* ================================================================
   RELATÓRIO — texto compreensível por pessoa não técnica
   ================================================================ */

function montarRelatorio(campos) {
  var linhas = [];
  linhas.push("# Relatório de execução — módulo `" + campos.moduloId + "`");
  linhas.push("");
  linhas.push("- **Fonte:** " + (campos.fonte || "não identificada"));
  linhas.push("- **Horário da execução:** " + campos.horario);
  linhas.push("- **Período de referência:** " + (campos.referencePeriod || "não disponível"));
  linhas.push("- **Status:** " + campos.status);
  linhas.push("- **Registros processados:** " + (campos.registrosProcessados || "não disponível"));
  linhas.push("- **Avisos:** " + (campos.avisos && campos.avisos.length ? campos.avisos.length : "nenhum"));
  linhas.push("- **Erros:** " + (campos.erros && campos.erros.length ? campos.erros.length : "nenhum"));
  linhas.push("- **Diferença em relação ao snapshot anterior:** " + campos.diferencaSnapshotAnterior);
  linhas.push("- **Snapshot criado nesta execução:** " + (campos.snapshotCriado ? "sim" : "não"));
  linhas.push("- **Último snapshot válido preservado:** " + (campos.ultimoSnapshotValidoPreservado ? "sim" : "não"));
  linhas.push("- **Hash:** " + (campos.hash || "não calculado"));
  linhas.push("- **Próximo passo recomendado:** " + campos.proximoPassoRecomendado);

  if (campos.erros && campos.erros.length) {
    linhas.push("");
    linhas.push("## Detalhe dos erros");
    campos.erros.forEach(function (e) { linhas.push("- " + e); });
  }
  if (campos.avisos && campos.avisos.length) {
    linhas.push("");
    linhas.push("## Detalhe dos avisos");
    campos.avisos.forEach(function (a) { linhas.push("- " + JSON.stringify(a)); });
  }

  linhas.push("");
  return linhas.join("\n") + "\n";
}

/* ================================================================
   EXPORTA
   ================================================================ */

module.exports = {
  SNAPSHOT_VERSION: SNAPSHOT_VERSION,
  RETENCAO_DIAS_REJEITADOS_E_FALHAS: RETENCAO_DIAS_REJEITADOS_E_FALHAS,
  avaliarEnvelope: avaliarEnvelope,
  construirEntradaHash: construirEntradaHash,
  calcularHash: calcularHash,
  lerLatest: lerLatest,
  caminhoLatest: caminhoLatest,
  gravarSnapshotValido: gravarSnapshotValido,
  gravarRejeitado: gravarRejeitado,
  gravarRelatorioPersistido: gravarRelatorioPersistido,
  listarElegiveisRetencao: listarElegiveisRetencao,
  processarCicloModulo: processarCicloModulo,
  montarRelatorio: montarRelatorio,
  _sanitizarNomePasta: sanitizarNomePasta,
  _normalizarTimestampParaNomeArquivo: normalizarTimestampParaNomeArquivo
};
