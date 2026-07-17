/* ============================================================
   HUB COMLURB · testes/testar-fase6.js
   Suíte de teste reproduzível da Fase 6 (Snapshot automático — AR e
   Engenharia/DTE).

   Uso (a partir da raiz do repositório):

     node testes/testar-fase6.js .

   Não depende de nenhum framework externo além de papaparse (mesma
   dependência já usada pelos painéis e pelas Fases 4/5). Roda em Node
   puro, sem servidor, sem rede — todos os casos usam fixtures locais
   (opts.fixtures / opts.fixtureTexto) ou fetchImpl mockado, nunca a
   URL real do Google Sheets.

   IMPORTANTE — esta suíte NUNCA escreve em data/ do repositório real.
   Todo teste que grava snapshot/relatório/rejeitado usa um diretório
   temporário criado e apagado dentro do próprio teste (ver
   criarDataTemporaria()/limparDataTemporaria() abaixo) — isso está
   alinhado à regra "não registre snapshots reais na implementação
   local" da Fase 6.

   Esta suíte é ESPECÍFICA da Fase 6. Os 42 casos da Fase 4, os 96
   casos da Fase 5 e os 40 casos da suíte de Fases 2/3
   (testes/hub-selftest.js, que roda apenas via testes/index.html no
   navegador) não são re-executados aqui — rode-os separadamente para
   confirmar ausência de regressão.
   ============================================================ */

"use strict";

var fs = require("fs");
var path = require("path");
var os = require("os");
var crypto = require("crypto");

var raiz = process.argv[2];
if (!raiz) {
  console.error("Uso: node testes/testar-fase6.js <raiz-do-repositorio>");
  process.exit(1);
}
raiz = path.resolve(raiz);

var grupos = [], atual = null, totais = { pass: 0, fail: 0 };
function grupo(nome) { atual = { nome: nome, casos: [] }; grupos.push(atual); }
function caso(nome, obtido, esperado) {
  var ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  totais[ok ? "pass" : "fail"]++;
  atual.casos.push({ nome: nome, ok: ok, obtido: obtido, esperado: esperado });
}
function verdadeiro(nome, condicao) { caso(nome, !!condicao, true); }

/* ---------- diretório de dados temporário (nunca toca em data/ real) ---------- */

var DIRS_TEMP_CRIADOS = [];
function criarDataTemporaria() {
  var d = fs.mkdtempSync(path.join(os.tmpdir(), "hub-comlurb-fase6-"));
  DIRS_TEMP_CRIADOS.push(d);
  return d;
}
function limparTudo() {
  DIRS_TEMP_CRIADOS.forEach(function (d) {
    try { fs.rmSync(d, { recursive: true, force: true }); } catch (e) { /* ignora */ }
  });
}

/* ---------- fixtures mínimas (mesmo padrão já usado nas Fases 4/5) ---------- */

var FIX_AR_2026 = "Código,Grupo,Ordem,Indicador Executivo,Unidade,Sentido,Meta_2026,Atual,Tipo_Acumulado,Periodicidade,Status\n" +
  "E01,Estratégica,1,Indicador Um,percentual,maior_melhor,90,95,MEDIA,Mensal,\n";
var FIX_AR_MAPEAMENTO = "Código_AR,Indicador_Geral\n";
var FIX_AR_GERAL = "Ano,Indicador\n";
var FIXTURES_AR_VALIDAS = { AR_2026: FIX_AR_2026, AR_MAPEAMENTO: FIX_AR_MAPEAMENTO, AR_GERAL: FIX_AR_GERAL };

var FIX_AR_2026_ALTERADO = "Código,Grupo,Ordem,Indicador Executivo,Unidade,Sentido,Meta_2026,Atual,Tipo_Acumulado,Periodicidade,Status\n" +
  "E01,Estratégica,1,Indicador Um,percentual,maior_melhor,90,99,MEDIA,Mensal,\n";

var FIX_DTE_BLOCO_C = "C - MANUTENÇÃO FROTA PRÓPRIA,,,,,,,,,,,,,,,,\r\n" +
  ",mai.-25,jun.-25,jul.-25,ago.-25,set.-25,out.-25,nov.-25,dez.-25,jan.-26,fev.-26,mar.-26,abr.-26,mai.-26\r\n" +
  "Frota Total,107,93,93,93,93,93,93,93,93,93,93,93,93\r\n";

async function rodar() {
  var bootstrapHub = require(path.join(raiz, "snapshot/lib/bootstrap-hub.js"));
  var canonical = require(path.join(raiz, "snapshot/lib/canonical.js"));
  var snapshotCore = require(path.join(raiz, "snapshot/lib/snapshot-core.js"));
  var snapshotAR = require(path.join(raiz, "snapshot/lib/snapshot-ar.js"));
  var snapshotDTE = require(path.join(raiz, "snapshot/lib/snapshot-dte.js"));
  var verificarCaminhos = require(path.join(raiz, "snapshot/lib/verificar-caminhos.js"));
  var runCli = require(path.join(raiz, "snapshot/run.js"));

  var carregado = bootstrapHub.bootstrap(raiz);
  var HUB = carregado.HUB;

  /* ================= canonical.js — canonicalização determinística ================= */
  grupo("Fase 6 · canonical.js — canonicalização determinística");
  var objA = { b: 2, a: 1, c: { y: 2, x: 1 } };
  var objB = { c: { x: 1, y: 2 }, a: 1, b: 2 };
  caso("Chaves de objeto reordenadas produzem a mesma string canônica", canonical.canonicalJSONStringify(objA), canonical.canonicalJSONStringify(objB));
  var arrA = { lista: [3, 1, 2] };
  var arrB = { lista: [3, 1, 2] };
  var arrC = { lista: [1, 2, 3] };
  caso("Arrays preservam ordem — mesma ordem produz mesma string", canonical.canonicalJSONStringify(arrA), canonical.canonicalJSONStringify(arrB));
  verdadeiro("Arrays preservam ordem — ordem diferente produz string diferente (nunca reordenado)", canonical.canonicalJSONStringify(arrA) !== canonical.canonicalJSONStringify(arrC));

  /* ================= snapshot-core.avaliarEnvelope ================= */
  grupo("Fase 6 · snapshot-core.avaliarEnvelope — validação do envelope");
  var envelopeValido = HUB.ingest.model.criarEnvelope({
    schemaVersion: "indicadores.v1", sourceId: "AR_2026", domain: "indicadores_metas",
    referencePeriod: "2026", payload: { linhas: [] },
    quality: HUB.ingest.model.criarQuality([], []),
    lineage: HUB.ingest.model.criarLineage("AR_2026", "validator")
  });
  verdadeiro("Envelope completo e sem erros é válido", snapshotCore.avaliarEnvelope(envelopeValido).valido);

  var envelopePayloadNull = HUB.ingest.model.criarEnvelope({
    schemaVersion: "indicadores.v1", sourceId: "AR_2026", domain: "indicadores_metas",
    referencePeriod: "2026", payload: null,
    quality: HUB.ingest.model.criarQuality([{ etapa: "x", tipo: "y", mensagem: "z" }], []),
    lineage: HUB.ingest.model.criarLineage("AR_2026", "validator")
  });
  verdadeiro("payload null é inválido", !snapshotCore.avaliarEnvelope(envelopePayloadNull).valido);
  verdadeiro("Envelope ausente (null) é inválido, sem lançar exceção", !snapshotCore.avaliarEnvelope(null).valido);

  var envelopeComErro = HUB.ingest.model.criarEnvelope({
    schemaVersion: "indicadores.v1", sourceId: "AR_2026", domain: "indicadores_metas",
    referencePeriod: "2026", payload: { linhas: [] },
    quality: HUB.ingest.model.criarQuality([{ etapa: "validator", tipo: "erro_x", mensagem: "falhou" }], []),
    lineage: HUB.ingest.model.criarLineage("AR_2026", "validator")
  });
  verdadeiro("quality.erros não vazio é inválido", !snapshotCore.avaliarEnvelope(envelopeComErro).valido);

  /* ================= snapshot-core.calcularHash ================= */
  grupo("Fase 6 · snapshot-core.calcularHash — política de hash");
  function envelopeBase(overrides) {
    var base = {
      schemaVersion: "indicadores.v1", sourceId: "AR_2026", domain: "indicadores_metas",
      referencePeriod: "2026", payload: { linhas: [{ codigo: "E01" }] },
      quality: HUB.ingest.model.criarQuality([], []),
      lineage: HUB.ingest.model.criarLineage("AR_2026", "validator")
    };
    Object.keys(overrides || {}).forEach(function (k) { base[k] = overrides[k]; });
    return HUB.ingest.model.criarEnvelope(base);
  }

  var e1 = envelopeBase();
  var e2 = envelopeBase();
  caso("Mesma entrada semântica produz o mesmo hash", snapshotCore.calcularHash(e1), snapshotCore.calcularHash(e2));

  var e3 = envelopeBase();
  e3.capturedAt = "2099-01-01T00:00:00.000Z";
  caso("capturedAt diferente NÃO altera o hash", snapshotCore.calcularHash(e1), snapshotCore.calcularHash(e3));

  var e4 = envelopeBase();
  e4.lineage = Object.assign({}, e4.lineage, { timestamp: "2099-01-01T00:00:00.000Z" });
  caso("lineage.timestamp diferente NÃO altera o hash", snapshotCore.calcularHash(e1), snapshotCore.calcularHash(e4));

  var e5 = envelopeBase({ referencePeriod: "2027" });
  verdadeiro("referencePeriod diferente ALTERA o hash", snapshotCore.calcularHash(e1) !== snapshotCore.calcularHash(e5));

  var e6 = envelopeBase({ schemaVersion: "indicadores.v2" });
  verdadeiro("schemaVersion diferente ALTERA o hash", snapshotCore.calcularHash(e1) !== snapshotCore.calcularHash(e6));

  var e7 = envelopeBase({ sourceId: "AR_2026_OUTRO" });
  verdadeiro("sourceId diferente ALTERA o hash", snapshotCore.calcularHash(e1) !== snapshotCore.calcularHash(e7));

  var e8 = envelopeBase({ quality: HUB.ingest.model.criarQuality([], ["aviso novo"]) });
  verdadeiro("quality diferente (além de timestamp) ALTERA o hash", snapshotCore.calcularHash(e1) !== snapshotCore.calcularHash(e8));

  var e9 = envelopeBase({ payload: { linhas: [{ codigo: "E01" }, { codigo: "E02" }] } });
  verdadeiro("payload diferente ALTERA o hash", snapshotCore.calcularHash(e1) !== snapshotCore.calcularHash(e9));

  var eArrayOrdem1 = envelopeBase({ payload: { linhas: [{ codigo: "A" }, { codigo: "B" }] } });
  var eArrayOrdem2 = envelopeBase({ payload: { linhas: [{ codigo: "B" }, { codigo: "A" }] } });
  verdadeiro("Ordem diferente dentro de um array do payload ALTERA o hash (arrays nunca são reordenados)", snapshotCore.calcularHash(eArrayOrdem1) !== snapshotCore.calcularHash(eArrayOrdem2));

  /* ================= snapshot-ar.js — fontes obrigatórias ================= */
  grupo("Fase 6 · snapshot-ar.js — bloqueio quando fonte obrigatória falha");
  function mockFetchFalhandoUma(urlFalha) {
    return function (url) {
      if (url === urlFalha) return Promise.resolve({ ok: false, status: 500, statusText: "erro simulado" });
      if (url === HUB.sources.fonte("AR_2026").url) return Promise.resolve({ ok: true, status: 200, statusText: "OK", text: function () { return Promise.resolve(FIX_AR_2026); } });
      if (url === HUB.sources.fonte("AR_MAPEAMENTO").url) return Promise.resolve({ ok: true, status: 200, statusText: "OK", text: function () { return Promise.resolve(FIX_AR_MAPEAMENTO); } });
      if (url === HUB.sources.fonte("AR_GERAL").url) return Promise.resolve({ ok: true, status: 200, statusText: "OK", text: function () { return Promise.resolve(FIX_AR_GERAL); } });
      return Promise.resolve({ ok: false, status: 500, statusText: "não deveria ser chamada" });
    };
  }

  var resFalhaGeral = await snapshotAR.processarAR(HUB, { fetchImpl: mockFetchFalhandoUma(HUB.sources.fonte("AR_GERAL").url) });
  verdadeiro("AR_GERAL indisponível bloqueia o ciclo antes do envelope", resFalhaGeral.rejeitarAntesDoEnvelope);
  verdadeiro("Motivo da rejeição cita AR_GERAL", resFalhaGeral.registroRejeicao.motivo.indexOf("AR_GERAL") !== -1);

  var resFalhaMapa = await snapshotAR.processarAR(HUB, { fetchImpl: mockFetchFalhandoUma(HUB.sources.fonte("AR_MAPEAMENTO").url) });
  verdadeiro("AR_MAPEAMENTO indisponível bloqueia o ciclo (mesmo o Adapter degradando graciosamente)", resFalhaMapa.rejeitarAntesDoEnvelope);

  var resOK = await snapshotAR.processarAR(HUB, { fixtures: FIXTURES_AR_VALIDAS });
  verdadeiro("Com as três fontes obrigatórias OK, o ciclo NÃO é rejeitado antes do envelope", !resOK.rejeitarAntesDoEnvelope);
  caso("moduloId é 'ar'", resOK.moduloId, "ar");

  grupo("Fase 6 · snapshot-ar.js — AR_GOVERNANCA não é fonte obrigatória");
  caso("Lista de fontes obrigatórias tem exatamente 3 itens", snapshotAR.FONTES_OBRIGATORIAS.length, 3);
  verdadeiro("AR_GOVERNANCA NÃO está na lista de fontes obrigatórias", snapshotAR.FONTES_OBRIGATORIAS.indexOf("AR_GOVERNANCA") === -1);

  /* ================= snapshot-dte.js ================= */
  grupo("Fase 6 · snapshot-dte.js — ciclo válido e ciclo com falha");
  var resDteOk = await snapshotDTE.processarDTE(HUB, { fixtureTexto: FIX_DTE_BLOCO_C });
  verdadeiro("Fixture válida produz envelope com payload não-nulo", !!resDteOk.envelope.payload);
  var resDteVazio = await snapshotDTE.processarDTE(HUB, { fixtureTexto: "" });
  verdadeiro("Fixture vazia produz envelope com payload nulo", resDteVazio.envelope.payload === null);

  /* ================= processarCicloModulo — ciclo completo com dados temporários ================= */
  grupo("Fase 6 · processarCicloModulo — primeiro snapshot válido (AR)");
  var dadosAR1 = criarDataTemporaria();
  var traduzidoAR1 = await snapshotAR.processarAR(HUB, { fixtures: FIXTURES_AR_VALIDAS });
  var cicloAR1 = snapshotCore.processarCicloModulo(Object.assign({ raizDados: dadosAR1 }, traduzidoAR1));
  caso("Status = primeiro_snapshot", cicloAR1.status, "primeiro_snapshot");
  verdadeiro("Não falhou", !cicloAR1.falhou);
  verdadeiro("Hash presente", !!cicloAR1.hash);
  verdadeiro("Arquivo de snapshot foi realmente criado em disco", fs.existsSync(cicloAR1.caminhoSnapshot));
  verdadeiro("latest.json foi criado", fs.existsSync(cicloAR1.caminhoLatest));
  var latest1 = JSON.parse(fs.readFileSync(cicloAR1.caminhoLatest, "utf8"));
  caso("latest.json.referencePeriod = '2026'", latest1.referencePeriod, "2026");

  grupo("Fase 6 · processarCicloModulo — reexecução idêntica não duplica");
  var arquivosAntes = fs.readdirSync(path.join(dadosAR1, "snapshots", "ar", "periodos", "2026"));
  var traduzidoAR2 = await snapshotAR.processarAR(HUB, { fixtures: FIXTURES_AR_VALIDAS });
  var cicloAR2 = snapshotCore.processarCicloModulo(Object.assign({ raizDados: dadosAR1 }, traduzidoAR2));
  caso("Status = sem_mudanca", cicloAR2.status, "sem_mudanca");
  caso("Hash idêntico ao ciclo anterior", cicloAR2.hash, cicloAR1.hash);
  var arquivosDepois = fs.readdirSync(path.join(dadosAR1, "snapshots", "ar", "periodos", "2026"));
  caso("Nenhum arquivo novo de snapshot foi criado (mesma contagem de arquivos)", arquivosDepois.length, arquivosAntes.length);
  var latestDepois = JSON.parse(fs.readFileSync(cicloAR1.caminhoLatest, "utf8"));
  caso("latest.json não foi alterado (updatedAt idêntico)", latestDepois.updatedAt, latest1.updatedAt);

  grupo("Fase 6 · processarCicloModulo — mudança real gera novo snapshot e atualiza latest");
  var traduzidoAR3 = await snapshotAR.processarAR(HUB, { fixtures: { AR_2026: FIX_AR_2026_ALTERADO, AR_MAPEAMENTO: FIX_AR_MAPEAMENTO, AR_GERAL: FIX_AR_GERAL } });
  var cicloAR3 = snapshotCore.processarCicloModulo(Object.assign({ raizDados: dadosAR1 }, traduzidoAR3));
  caso("Status = novo_snapshot (já havia um latest anterior)", cicloAR3.status, "novo_snapshot");
  verdadeiro("Hash é diferente do snapshot anterior", cicloAR3.hash !== cicloAR1.hash);
  var arquivosApos3 = fs.readdirSync(path.join(dadosAR1, "snapshots", "ar", "periodos", "2026"));
  caso("Um novo arquivo de snapshot foi adicionado", arquivosApos3.length, arquivosAntes.length + 1);
  var latestApos3 = JSON.parse(fs.readFileSync(cicloAR1.caminhoLatest, "utf8"));
  caso("latest.json agora aponta para o novo hash", latestApos3.hash, cicloAR3.hash);

  /* ================= falha de validação preserva o latest anterior ================= */
  grupo("Fase 6 · processarCicloModulo — falha de validação preserva o último snapshot válido");
  var latestAntesDaFalha = JSON.parse(fs.readFileSync(cicloAR1.caminhoLatest, "utf8"));
  var cicloFalhaValidacao = snapshotCore.processarCicloModulo({
    raizDados: dadosAR1,
    moduloId: "ar",
    rejeitarAntesDoEnvelope: false,
    envelope: HUB.ingest.model.criarEnvelope({
      schemaVersion: "indicadores.v1", sourceId: "AR_2026", domain: "indicadores_metas",
      referencePeriod: "2026", payload: null,
      quality: HUB.ingest.model.criarQuality([{ etapa: "reader", tipo: "falha_leitura", mensagem: "simulada" }], []),
      lineage: HUB.ingest.model.criarLineage("AR_2026", "reader")
    })
  });
  verdadeiro("Ciclo com envelope inválido é reportado como falha", cicloFalhaValidacao.falhou);
  var latestDepoisDaFalha = JSON.parse(fs.readFileSync(cicloAR1.caminhoLatest, "utf8"));
  caso("latest.json permanece EXATAMENTE igual após a falha", latestDepoisDaFalha, latestAntesDaFalha);
  verdadeiro("Registro de rejeição foi gravado", fs.existsSync(cicloFalhaValidacao.caminhoRejeitado));

  /* ================= rejected nunca contém CSV/payload bruto completo ================= */
  grupo("Fase 6 · rejected — nunca contém conteúdo bruto completo da fonte");
  var conteudoRejeitado = JSON.parse(fs.readFileSync(cicloFalhaValidacao.caminhoRejeitado, "utf8"));
  var camposRejeitado = Object.keys(conteudoRejeitado).sort();
  caso("Campos do registro rejeitado são exatamente os aprovados", camposRejeitado,
    ["diagnostico", "etapa", "fonte", "hashEntradaBruta", "horario", "modulo", "motivo", "resumoEntrada"].sort());
  verdadeiro("Nenhum campo contém texto CSV bruto (heurística: nenhuma vírgula em série longa nos valores string)",
    Object.keys(conteudoRejeitado).every(function (k) {
      var v = conteudoRejeitado[k];
      return typeof v !== "string" || v.split(",").length < 5;
    }));

  /* ================= falha entre gravação do snapshot e atualização do latest ================= */
  grupo("Fase 6 · escrita atômica — falha entre gravar snapshot e atualizar latest preserva o latest anterior");
  var dadosAtomico = criarDataTemporaria();
  var traduzidoAtomico1 = await snapshotAR.processarAR(HUB, { fixtures: FIXTURES_AR_VALIDAS });
  var cicloAtomico1 = snapshotCore.processarCicloModulo(Object.assign({ raizDados: dadosAtomico }, traduzidoAtomico1));
  var latestAtomicoAntes = JSON.parse(fs.readFileSync(cicloAtomico1.caminhoLatest, "utf8"));

  var renameOriginal = fs.renameSync;
  fs.renameSync = function () { throw new Error("Falha simulada de filesystem no rename do latest."); };
  var lancouExcecao = false;
  try {
    var traduzidoAtomico2 = await snapshotAR.processarAR(HUB, { fixtures: { AR_2026: FIX_AR_2026_ALTERADO, AR_MAPEAMENTO: FIX_AR_MAPEAMENTO, AR_GERAL: FIX_AR_GERAL } });
    snapshotCore.processarCicloModulo(Object.assign({ raizDados: dadosAtomico }, traduzidoAtomico2));
  } catch (e) {
    lancouExcecao = true;
  }
  fs.renameSync = renameOriginal;

  verdadeiro("Falha no rename atômico propaga exceção (nunca mascarada)", lancouExcecao);
  var latestAtomicoDepois = JSON.parse(fs.readFileSync(cicloAtomico1.caminhoLatest, "utf8"));
  caso("latest.json permanece o anterior (a escrita do novo nunca foi confirmada)", latestAtomicoDepois, latestAtomicoAntes);

  /* ================= mudança estrutural (schemaVersion/domain) ================= */
  grupo("Fase 6 · processarCicloModulo — mudança estrutural é sinalizada no relatório");
  var dadosEstrutural = criarDataTemporaria();
  var envEstrutural1 = envelopeBase();
  var cicloEstrutural1 = snapshotCore.processarCicloModulo({ raizDados: dadosEstrutural, moduloId: "ar", rejeitarAntesDoEnvelope: false, envelope: envEstrutural1 });
  verdadeiro("Primeiro ciclo sem latest anterior: mudancaEstrutural não se aplica (undefined/false)", !cicloEstrutural1.mudancaEstrutural);
  var envEstrutural2 = envelopeBase({ schemaVersion: "indicadores.v2" });
  var cicloEstrutural2 = snapshotCore.processarCicloModulo({ raizDados: dadosEstrutural, moduloId: "ar", rejeitarAntesDoEnvelope: false, envelope: envEstrutural2 });
  verdadeiro("schemaVersion diferente do latest anterior é sinalizado como mudancaEstrutural=true", cicloEstrutural2.mudancaEstrutural === true);
  verdadeiro("Relatório da mudança estrutural menciona explicitamente 'MUDANÇA ESTRUTURAL'", cicloEstrutural2.relatorioMarkdown.indexOf("MUDANÇA ESTRUTURAL") !== -1);

  /* ================= carga parcial (avisos presentes, payload ainda válido) ================= */
  grupo("Fase 6 · processarCicloModulo — carga parcial (avisos presentes, payload válido)");
  var envComAviso = envelopeBase({ quality: HUB.ingest.model.criarQuality([], ["linha X sem correspondência de mapeamento"]) });
  var dadosParcial = criarDataTemporaria();
  var cicloParcial = snapshotCore.processarCicloModulo({ raizDados: dadosParcial, moduloId: "ar", rejeitarAntesDoEnvelope: false, envelope: envComAviso });
  verdadeiro("Carga com aviso (mas sem erro) NÃO falha — snapshot é criado normalmente", !cicloParcial.falhou);
  caso("Status = primeiro_snapshot mesmo com aviso presente", cicloParcial.status, "primeiro_snapshot");
  verdadeiro("Relatório lista o aviso", cicloParcial.relatorioMarkdown.indexOf("Detalhe dos avisos") !== -1);

  /* ================= relatório de sucesso e de falha são persistidos quando relevantes ================= */
  grupo("Fase 6 · relatórios — persistência condicional em data/reports");
  verdadeiro("Relatório de sucesso (novo_snapshot) foi persistido em disco", fs.existsSync(cicloAR3.caminhoRelatorio));
  var conteudoRelatorioSucesso = fs.readFileSync(cicloAR3.caminhoRelatorio, "utf8");
  verdadeiro("Relatório de sucesso persistido contém o status do ciclo", conteudoRelatorioSucesso.indexOf("novo_snapshot") !== -1);
  verdadeiro("Relatório de falha (validação) foi persistido em disco", fs.existsSync(cicloFalhaValidacao.caminhoRelatorio));
  var conteudoRelatorioFalha = fs.readFileSync(cicloFalhaValidacao.caminhoRelatorio, "utf8");
  verdadeiro("Relatório de falha persistido lista os erros", conteudoRelatorioFalha.indexOf("Detalhe dos erros") !== -1);
  var dadosSemAviso = criarDataTemporaria();
  var envSemAviso = envelopeBase();
  snapshotCore.processarCicloModulo({ raizDados: dadosSemAviso, moduloId: "ar", rejeitarAntesDoEnvelope: false, envelope: envSemAviso });
  var cicloSemAvisoRepetido = snapshotCore.processarCicloModulo({ raizDados: dadosSemAviso, moduloId: "ar", rejeitarAntesDoEnvelope: false, envelope: envelopeBase() });
  caso("Repetição sem avisos: status = sem_mudanca", cicloSemAvisoRepetido.status, "sem_mudanca");
  verdadeiro("Ciclo 'sem_mudanca' sem avisos NÃO persiste relatório novo (evita commit desnecessário)", cicloSemAvisoRepetido.caminhoRelatorio === null);

  verdadeiro("(nota) cicloAR2 usa fixtures reais do AR, que geram avisos legítimos de join incompleto — por isso persiste relatório; comportamento correto, não é o caso testado acima", cicloAR2.status === "sem_mudanca");

  /* ================= independência entre módulos (isolamento de exceção) ================= */
  grupo("Fase 6 · run.js — independência entre módulos (uma exceção não impede o outro)");
  var chamouSegundo = false;
  var resultadoIsolado = await runCli.processarModuloComIsolamento("modulo-com-erro", function () {
    return Promise.reject(new Error("erro proposital de teste"));
  });
  verdadeiro("Exceção é capturada e retorna um resultado controlado (falhou=true), nunca propaga", resultadoIsolado.falhou === true);
  await runCli.processarModuloComIsolamento("modulo-ok", function () { chamouSegundo = true; return Promise.resolve({ falhou: false, status: "ok" }); });
  verdadeiro("Um segundo módulo processado depois de um que lançou exceção executa normalmente", chamouSegundo);

  /* ================= orquestração completa (dois módulos, um processo, sem tocar em data/ real) ================= */
  grupo("Fase 6 · run.js · comandoOrquestrar — execução completa dos dois módulos");
  var dadosOrq = criarDataTemporaria();
  var artifactOrq = criarDataTemporaria();
  var resultadoOrq = await runCli.comandoOrquestrar({
    raizRepositorio: raiz,
    raizDados: dadosOrq,
    dirArtifact: artifactOrq,
    definirExitCode: false,
    optsAR: { fixtures: FIXTURES_AR_VALIDAS },
    optsDTE: { fixtureTexto: FIX_DTE_BLOCO_C }
  });
  caso("AR processado com sucesso (primeiro_snapshot)", resultadoOrq.resultadoAR.status, "primeiro_snapshot");
  caso("DTE processado com sucesso (primeiro_snapshot)", resultadoOrq.resultadoDTE.status, "primeiro_snapshot");
  verdadeiro("houveFalha = false quando os dois módulos têm sucesso", !resultadoOrq.houveFalha);
  verdadeiro("Relatório de AR publicado como artifact", fs.existsSync(path.join(artifactOrq, "relatorio-ar.md")));
  verdadeiro("Relatório de DTE publicado como artifact", fs.existsSync(path.join(artifactOrq, "relatorio-engenharia-dte.md")));
  verdadeiro("Resumo publicado como artifact", fs.existsSync(path.join(artifactOrq, "resumo.md")));

  grupo("Fase 6 · run.js · comandoOrquestrar — falha de um módulo não impede a publicação válida do outro");
  var dadosOrq2 = criarDataTemporaria();
  var artifactOrq2 = criarDataTemporaria();
  var resultadoOrq2 = await runCli.comandoOrquestrar({
    raizRepositorio: raiz,
    raizDados: dadosOrq2,
    dirArtifact: artifactOrq2,
    definirExitCode: false,
    optsAR: { fetchImpl: mockFetchFalhandoUma(HUB.sources.fonte("AR_GERAL").url) },
    optsDTE: { fixtureTexto: FIX_DTE_BLOCO_C }
  });
  verdadeiro("AR falhou neste ciclo", resultadoOrq2.resultadoAR.falhou);
  verdadeiro("DTE NÃO falhou, mesmo com AR falhando no mesmo processo", !resultadoOrq2.resultadoDTE.falhou);
  verdadeiro("houveFalha = true no resultado agregado (reflete a falha real)", resultadoOrq2.houveFalha);
  verdadeiro("Snapshot válido do DTE foi publicado em data/ mesmo com AR falho", fs.existsSync(snapshotCore.caminhoLatest(dadosOrq2, "engenharia-dte")));
  verdadeiro("Nenhum snapshot de AR foi publicado (ciclo bloqueado)", !fs.existsSync(snapshotCore.caminhoLatest(dadosOrq2, "ar")));

  /* ================= verify-paths ================= */
  grupo("Fase 6 · verificar-caminhos.js — restrição de escrita a data/");
  var linhasOk = [" M data/snapshots/ar/latest.json", "?? data/reports/ar/2026-07-16.md"];
  verdadeiro("Alterações só dentro de data/ autorizados são aprovadas", verificarCaminhos.avaliarCaminhosAutorizados(linhasOk).ok);

  var linhasBloqueio = [" M data/snapshots/ar/latest.json", " M assets/components/hub-core.js"];
  var avaliacaoBloqueio = verificarCaminhos.avaliarCaminhosAutorizados(linhasBloqueio);
  verdadeiro("Alteração fora de data/ é bloqueada", !avaliacaoBloqueio.ok);
  verdadeiro("Arquivo fora do autorizado é listado no motivo do bloqueio", avaliacaoBloqueio.foraDoAutorizado.some(function (l) { return l.indexOf("hub-core.js") !== -1; }));

  var linhasRename = [" R  data/reports/ar/antigo.md -> assets/components/arquivo-indevido.js"];
  verdadeiro("Rename para fora de data/ também é bloqueado (os dois lados são checados)", !verificarCaminhos.avaliarCaminhosAutorizados(linhasRename).ok);

  var linhasVazias = [""];
  verdadeiro("Nenhuma alteração (linha vazia) é aprovada trivialmente", verificarCaminhos.avaliarCaminhosAutorizados(linhasVazias).ok);

  /* ================= retenção — identifica, nunca apaga ================= */
  grupo("Fase 6 · retenção — identificação de itens elegíveis sem exclusão automática");
  var dadosRetencao = criarDataTemporaria();
  var dirRejAR = path.join(dadosRetencao, "rejected", "ar");
  fs.mkdirSync(dirRejAR, { recursive: true });
  var arquivoAntigo = path.join(dirRejAR, "antigo__rejeitado.json");
  var arquivoRecente = path.join(dirRejAR, "recente__rejeitado.json");
  fs.writeFileSync(arquivoAntigo, "{}", "utf8");
  fs.writeFileSync(arquivoRecente, "{}", "utf8");
  var dataAntiga = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000);
  fs.utimesSync(arquivoAntigo, dataAntiga, dataAntiga);

  var elegiveis = snapshotCore.listarElegiveisRetencao(dadosRetencao, new Date());
  verdadeiro("Arquivo com mais de 90 dias é elegível", elegiveis.some(function (i) { return i.caminho === arquivoAntigo; }));
  verdadeiro("Arquivo recente NÃO é elegível", !elegiveis.some(function (i) { return i.caminho === arquivoRecente; }));
  verdadeiro("Nenhum arquivo foi apagado pela função de identificação", fs.existsSync(arquivoAntigo) && fs.existsSync(arquivoRecente));

  /* ================= rollback-info — leitura pura, nunca modifica ================= */
  grupo("Fase 6 · rollback-info — leitura não modifica latest.json nem o snapshot");
  var conteudoLatestAntes = fs.readFileSync(cicloAtomico1.caminhoLatest, "utf8");
  var mtimeAntes = fs.statSync(cicloAtomico1.caminhoLatest).mtimeMs;
  var leituraRollback = snapshotCore.lerLatest(dadosAtomico, "ar");
  var conteudoLatestDepois = fs.readFileSync(cicloAtomico1.caminhoLatest, "utf8");
  var mtimeDepois = fs.statSync(cicloAtomico1.caminhoLatest).mtimeMs;
  caso("Conteúdo do latest.json não mudou depois da leitura", conteudoLatestDepois, conteudoLatestAntes);
  caso("mtime do latest.json não mudou depois da leitura", mtimeDepois, mtimeAntes);
  verdadeiro("lerLatest retornou o ponteiro esperado", leituraRollback && leituraRollback.hash === latestAtomicoAntes.hash);

  /* ================= bootstrap-hub.js ================= */
  grupo("Fase 6 · bootstrap-hub.js — lista fixa, nenhuma entrada externa");
  verdadeiro("ARQUIVOS_CANONICOS é uma lista fixa não vazia", bootstrapHub.ARQUIVOS_CANONICOS.length > 0);
  verdadeiro("Todos os arquivos da lista canônica existem no checkout", bootstrapHub.ARQUIVOS_CANONICOS.every(function (rel) {
    return fs.existsSync(path.join(raiz, rel));
  }));

  /* ---------- resumo final ---------- */
  console.log("\n=== Fase 6 — resultado da suíte ===\n");
  grupos.forEach(function (g) {
    console.log("== " + g.nome + " ==");
    g.casos.forEach(function (c) {
      console.log("  [" + (c.ok ? "PASSOU" : "FALHOU") + "] " + c.nome +
        (c.ok ? "" : " — esperado " + JSON.stringify(c.esperado) + ", obtido " + JSON.stringify(c.obtido)));
    });
  });
  console.log("\nGRUPOS TESTADOS: " + grupos.length);
  console.log("TOTAL: " + (totais.pass + totais.fail) + " casos | APROVADOS: " + totais.pass + " | REPROVADOS: " + totais.fail);

  limparTudo();

  if (totais.fail > 0) process.exit(1);
}

rodar().catch(function (erro) {
  console.error("[testar-fase6.js] Falha fatal na execução da suíte: " + (erro && erro.stack ? erro.stack : erro));
  limparTudo();
  process.exit(1);
});
