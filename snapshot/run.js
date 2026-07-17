#!/usr/bin/env node
/* ============================================================
   HUB COMLURB · snapshot/run.js
   Fase 6 (07/2026) · v1.0.0

   CLI da Fase 6. Comandos:

     node snapshot/run.js                          → executa AR e DTE
                                                       (orquestração
                                                       única, um
                                                       processo)
     node snapshot/run.js verify-paths              → confirma que só
                                                       data/snapshots,
                                                       data/reports e
                                                       data/rejected
                                                       foram alterados
                                                       (git status)
     node snapshot/run.js rollback-info <modulo> [--period P] [--snapshot caminho]
                                                      → só consulta,
                                                       nunca altera
                                                       latest.json
     node snapshot/run.js retencao-info              → lista (sem
                                                       apagar) itens
                                                       elegíveis para
                                                       limpeza

   REGRA OBRIGATÓRIA DE ORQUESTRAÇÃO (decisão da proprietária do
   produto para a Fase 6): um único job/processo, não dois workflows
   paralelos fazendo commit. AR e DTE são processados de forma
   independente dentro deste mesmo processo — uma falha em um não
   impede a execução nem a publicação válida do outro. O exit code
   deste processo só é decidido depois que os dois módulos terminarem
   (nunca antes).
   ============================================================ */

"use strict";

var fs = require("fs");
var path = require("path");
var childProcess = require("child_process");

var RAIZ_REPOSITORIO = path.resolve(__dirname, "..");
var RAIZ_DADOS = path.join(RAIZ_REPOSITORIO, "data");
var DIR_ARTIFACT = path.join(__dirname, "_artifact");

var CAMINHOS_AUTORIZADOS_PARA_ESCRITA = [
  "data/snapshots/",
  "data/reports/",
  "data/rejected/"
];

/* ================================================================
   ORQUESTRAÇÃO — comando padrão
   ================================================================ */

function garantirDiretorio(caminho) {
  fs.mkdirSync(caminho, { recursive: true });
}

/**
 * Processa um módulo de forma isolada: qualquer exceção lançada pela
 * cadeia Adapter/snapshot-core é capturada aqui, nunca propagada —
 * satisfaz a exigência de que a falha de um módulo não impeça a
 * execução do outro.
 */
function processarModuloComIsolamento(nomeModuloLog, funcaoProcessamento) {
  return funcaoProcessamento()
    .then(function (resultadoCiclo) {
      return resultadoCiclo;
    })
    .catch(function (erro) {
      console.error("[snapshot/run.js] Exceção não tratada ao processar " + nomeModuloLog + ": " + (erro && erro.stack ? erro.stack : erro));
      return {
        moduloId: nomeModuloLog,
        status: "excecao_nao_tratada",
        falhou: true,
        hash: null,
        relatorioMarkdown: "# Relatório de execução — módulo `" + nomeModuloLog + "`\n\n" +
          "Falha inesperada durante o processamento. Nenhum snapshot foi alterado.\n\n" +
          "Detalhe técnico: " + (erro && erro.message ? erro.message : String(erro)) + "\n",
        excecao: true
      };
    });
}

/**
 * @param {Object} [opcoes] pontos de override usados SOMENTE por
 *   testes/testar-fase6.js (nunca pelo CLI real, que usa os padrões).
 *   Isso existe para permitir testar a orquestração inteira (dois
 *   módulos, artifacts, exit code) sem nunca escrever em data/ do
 *   repositório real — ver regra "não registre snapshots reais na
 *   implementação local".
 * @param {string} [opcoes.raizRepositorio]
 * @param {string} [opcoes.raizDados]
 * @param {string} [opcoes.dirArtifact]
 * @param {Object} [opcoes.optsAR] repassado a snapshotAR.processarAR
 * @param {Object} [opcoes.optsDTE] repassado a snapshotDTE.processarDTE
 * @param {boolean} [opcoes.definirExitCode] default true; false em teste
 *   para não poluir o exit code do processo de teste.
 * @returns {Promise<{resultadoAR:Object, resultadoDTE:Object, houveFalha:boolean, resumo:string}>}
 */
async function comandoOrquestrar(opcoes) {
  opcoes = opcoes || {};
  var raizRepositorio = opcoes.raizRepositorio || RAIZ_REPOSITORIO;
  var raizDados = opcoes.raizDados || RAIZ_DADOS;
  var dirArtifact = opcoes.dirArtifact || DIR_ARTIFACT;

  var bootstrapHub = require("./lib/bootstrap-hub.js");
  var snapshotCore = require("./lib/snapshot-core.js");
  var snapshotAR = require("./lib/snapshot-ar.js");
  var snapshotDTE = require("./lib/snapshot-dte.js");

  console.log("[snapshot/run.js] Carregando componentes do HUB (bootstrap Node)...");
  var carregado = bootstrapHub.bootstrap(raizRepositorio);
  console.log("[snapshot/run.js] Arquivos carregados: " + carregado.arquivosCarregados.join(", "));
  var HUB = carregado.HUB;

  garantirDiretorio(raizDados);

  console.log("[snapshot/run.js] Processando módulo AR...");
  var resultadoAR = await processarModuloComIsolamento("ar", function () {
    return snapshotAR.processarAR(HUB, opcoes.optsAR || {}).then(function (traduzido) {
      return snapshotCore.processarCicloModulo(Object.assign({ raizDados: raizDados }, traduzido));
    });
  });

  console.log("[snapshot/run.js] Processando módulo Engenharia/DTE...");
  var resultadoDTE = await processarModuloComIsolamento("engenharia-dte", function () {
    return snapshotDTE.processarDTE(HUB, opcoes.optsDTE || {}).then(function (traduzido) {
      return snapshotCore.processarCicloModulo(Object.assign({ raizDados: raizDados }, traduzido));
    });
  });

  // Artifacts: publicados SEMPRE, independente de commit — para que o
  // relatório da execução exista mesmo em ciclos "sem mudança".
  garantirDiretorio(dirArtifact);
  fs.writeFileSync(path.join(dirArtifact, "relatorio-ar.md"), resultadoAR.relatorioMarkdown || "(sem relatório)", "utf8");
  fs.writeFileSync(path.join(dirArtifact, "relatorio-engenharia-dte.md"), resultadoDTE.relatorioMarkdown || "(sem relatório)", "utf8");

  var resumo = [
    "# Resumo da execução — Fase 6 (Snapshot AR e Engenharia/DTE)",
    "",
    "Horário: " + new Date().toISOString(),
    "",
    "| Módulo | Status | Falhou | Hash |",
    "|---|---|---|---|",
    "| ar | " + resultadoAR.status + " | " + (resultadoAR.falhou ? "sim" : "não") + " | " + (resultadoAR.hash || "-") + " |",
    "| engenharia-dte | " + resultadoDTE.status + " | " + (resultadoDTE.falhou ? "sim" : "não") + " | " + (resultadoDTE.hash || "-") + " |",
    ""
  ].join("\n");
  fs.writeFileSync(path.join(dirArtifact, "resumo.md"), resumo, "utf8");

  console.log(resumo);

  // REGRA OBRIGATÓRIA: exit code só decidido AQUI, depois que os dois
  // módulos terminaram — nunca antes, nunca dentro do processamento
  // individual de cada módulo.
  var houveFalha = !!(resultadoAR.falhou || resultadoDTE.falhou);
  if (houveFalha) {
    console.error("[snapshot/run.js] Pelo menos um módulo falhou neste ciclo. Resultados válidos do(s) outro(s) módulo(s), se houver, foram preservados normalmente em data/.");
  } else {
    console.log("[snapshot/run.js] Ciclo concluído sem falhas nos dois módulos.");
  }
  if (opcoes.definirExitCode !== false) {
    process.exitCode = houveFalha ? 1 : 0;
  }

  return { resultadoAR: resultadoAR, resultadoDTE: resultadoDTE, houveFalha: houveFalha, resumo: resumo };
}

/* ================================================================
   VERIFY-PATHS — bloqueia commit se algo fora de data/ foi alterado
   ================================================================ */

function comandoVerificarCaminhos() {
  var verificarCaminhos = require("./lib/verificar-caminhos.js");

  var saida;
  try {
    saida = childProcess.execSync("git status --porcelain", {
      cwd: RAIZ_REPOSITORIO,
      encoding: "utf8"
    });
  } catch (erro) {
    console.error("[snapshot/run.js] Não foi possível executar 'git status': " + (erro && erro.message ? erro.message : erro));
    process.exitCode = 1;
    return;
  }

  var linhas = saida.split("\n");
  var avaliacao = verificarCaminhos.avaliarCaminhosAutorizados(linhas, CAMINHOS_AUTORIZADOS_PARA_ESCRITA);

  if (!avaliacao.ok) {
    console.error("[snapshot/run.js] BLOQUEADO: alteração fora dos caminhos autorizados (" + CAMINHOS_AUTORIZADOS_PARA_ESCRITA.join(", ") + "):");
    avaliacao.foraDoAutorizado.forEach(function (l) { console.error("  " + l); });
    process.exitCode = 1;
    return;
  }

  console.log("[snapshot/run.js] Verificação de caminhos OK — nenhuma alteração fora de data/snapshots|reports|rejected.");
  if (avaliacao.caminhosAlterados.length === 0) {
    console.log("[snapshot/run.js] Nenhuma alteração detectada nesta execução.");
  } else {
    console.log("[snapshot/run.js] Alterações detectadas (todas dentro dos caminhos autorizados):");
    avaliacao.caminhosAlterados.forEach(function (l) { console.log("  " + l); });
  }
  process.exitCode = 0;
}

/* ================================================================
   ROLLBACK-INFO — só consulta, nunca altera latest.json
   ================================================================ */

function lerArgumentoComValor(args, nome) {
  var indice = args.indexOf(nome);
  if (indice === -1 || indice === args.length - 1) return null;
  return args[indice + 1];
}

function comandoRollbackInfo(args) {
  var snapshotCore = require("./lib/snapshot-core.js");
  var modulo = args[0];
  if (!modulo) {
    console.error("Uso: node snapshot/run.js rollback-info <modulo> [--period P] [--snapshot caminho]");
    process.exitCode = 1;
    return;
  }

  var periodoFiltro = lerArgumentoComValor(args, "--period");
  var caminhoSnapshotFiltro = lerArgumentoComValor(args, "--snapshot");

  var latest = snapshotCore.lerLatest(RAIZ_DADOS, modulo);
  console.log("=== rollback-info · módulo: " + modulo + " ===");

  if (caminhoSnapshotFiltro) {
    var caminhoAbsoluto = path.isAbsolute(caminhoSnapshotFiltro)
      ? caminhoSnapshotFiltro
      : path.join(RAIZ_REPOSITORIO, caminhoSnapshotFiltro);
    if (!fs.existsSync(caminhoAbsoluto)) {
      console.error("Snapshot não encontrado: " + caminhoAbsoluto);
      process.exitCode = 1;
      return;
    }
    var conteudo = JSON.parse(fs.readFileSync(caminhoAbsoluto, "utf8"));
    console.log("Snapshot localizado: " + caminhoAbsoluto);
    console.log("hash: " + conteudo.hash);
    console.log("referencePeriod: " + (conteudo.envelope && conteudo.envelope.referencePeriod));
    console.log("capturedAt: " + (conteudo.envelope && conteudo.envelope.capturedAt));
    console.log("");
    console.log("Para restaurar como latest (ação MANUAL, este comando não altera nada):");
    console.log("  1. copie o conteúdo de latest.json atual para um backup, se desejar preservá-lo;");
    console.log("  2. edite data/snapshots/" + modulo + "/latest.json com um ponteiro apontando para:");
    console.log("     path: " + path.relative(RAIZ_DADOS, caminhoAbsoluto).split(path.sep).join("/"));
    console.log("     hash: " + conteudo.hash);
    console.log("  3. confirme a edição manualmente (commit humano, não automático).");
    return;
  }

  var dirPeriodos = path.join(RAIZ_DADOS, "snapshots", modulo, "periodos");
  if (!fs.existsSync(dirPeriodos)) {
    console.log("Nenhum snapshot encontrado ainda para este módulo em " + dirPeriodos);
  } else {
    var periodos = fs.readdirSync(dirPeriodos).filter(function (p) {
      return fs.statSync(path.join(dirPeriodos, p)).isDirectory();
    });
    if (periodoFiltro) {
      periodos = periodos.filter(function (p) { return p === periodoFiltro || p.indexOf(periodoFiltro) !== -1; });
    }
    periodos.forEach(function (periodo) {
      var dirPeriodo = path.join(dirPeriodos, periodo);
      var arquivos = fs.readdirSync(dirPeriodo).filter(function (a) { return a.endsWith(".json"); }).sort();
      console.log("Período: " + periodo + " (" + arquivos.length + " captura(s))");
      arquivos.forEach(function (a) {
        console.log("  - " + path.join("data/snapshots", modulo, "periodos", periodo, a).split(path.sep).join("/"));
      });
    });
  }

  console.log("");
  if (latest) {
    console.log("latest.json atual:");
    console.log("  path: " + latest.path);
    console.log("  hash: " + latest.hash);
    console.log("  referencePeriod: " + latest.referencePeriod);
    console.log("  updatedAt: " + latest.updatedAt);
  } else {
    console.log("latest.json ainda não existe para este módulo.");
  }
  console.log("");
  console.log("Para consultar um snapshot específico: node snapshot/run.js rollback-info " + modulo + " --snapshot <caminho-do-arquivo-listado-acima>");
  process.exitCode = 0;
}

/* ================================================================
   RETENCAO-INFO — só lista, nunca apaga
   ================================================================ */

function comandoRetencaoInfo() {
  var snapshotCore = require("./lib/snapshot-core.js");
  var elegiveis = snapshotCore.listarElegiveisRetencao(RAIZ_DADOS, new Date());
  console.log("=== Itens elegíveis para limpeza (retenção de " + snapshotCore.RETENCAO_DIAS_REJEITADOS_E_FALHAS + " dias) ===");
  if (elegiveis.length === 0) {
    console.log("Nenhum item elegível no momento.");
  } else {
    elegiveis.forEach(function (item) {
      console.log("  - " + item.caminho + " (módulo: " + item.modulo + ", idade: " + item.idadeDias + " dia(s))");
    });
  }
  console.log("");
  console.log("Nenhum arquivo foi apagado por este comando. A exclusão, quando decidida, é manual.");
  process.exitCode = 0;
}

/* ================================================================
   DISPATCH
   ================================================================ */

function main() {
  var argv = process.argv.slice(2);
  var comando = argv[0];

  if (!comando || comando === "run") {
    comandoOrquestrar().catch(function (erro) {
      console.error("[snapshot/run.js] Falha fatal na orquestração: " + (erro && erro.stack ? erro.stack : erro));
      process.exitCode = 1;
    });
    return;
  }

  if (comando === "verify-paths") {
    comandoVerificarCaminhos();
    return;
  }

  if (comando === "rollback-info") {
    comandoRollbackInfo(argv.slice(1));
    return;
  }

  if (comando === "retencao-info") {
    comandoRetencaoInfo();
    return;
  }

  console.error("Comando desconhecido: " + comando);
  console.error("Comandos disponíveis: (nenhum)/run, verify-paths, rollback-info, retencao-info");
  process.exitCode = 1;
}

/* ================================================================
   EXPORTA (para testes/testar-fase6.js) + guarda de execução direta
   ================================================================ */

module.exports = {
  RAIZ_REPOSITORIO: RAIZ_REPOSITORIO,
  RAIZ_DADOS: RAIZ_DADOS,
  DIR_ARTIFACT: DIR_ARTIFACT,
  CAMINHOS_AUTORIZADOS_PARA_ESCRITA: CAMINHOS_AUTORIZADOS_PARA_ESCRITA.slice(),
  comandoOrquestrar: comandoOrquestrar,
  comandoVerificarCaminhos: comandoVerificarCaminhos,
  comandoRollbackInfo: comandoRollbackInfo,
  comandoRetencaoInfo: comandoRetencaoInfo,
  processarModuloComIsolamento: processarModuloComIsolamento
};

// Só executa o CLI quando este arquivo é o ponto de entrada direto
// (`node snapshot/run.js ...`) — quando é `require`ado (ex.: pelos
// testes), nenhum comando roda sozinho.
if (require.main === module) {
  main();
}
