/* ============================================================
   HUB COMLURB · snapshot/lib/bootstrap-hub.js
   Fase 6 (07/2026) · v1.0.0
   Dependências: papaparse (Node).

   PONTE DE COMPATIBILIDADE — NÃO É ARQUITETURA PERMANENTE.

   Os componentes do HUB (assets/components/*.js) são scripts de
   navegador: IIFEs que esperam `window` global e se registram em
   `window.HUB`. Não exportam módulos CommonJS/ESM. Este arquivo
   replica — isolado num único lugar — o mesmo padrão de bootstrap já
   usado e aprovado em testes/testar-fase4.js e testes/testar-fase5.js
   (`global.window = global`, stub mínimo de `document`,
   `global.Papa = require("papaparse")`, carregamento por
   `eval(fs.readFileSync(...))`), para que a Fase 6 não precise
   reinventar nem duplicar esse mecanismo em vários arquivos.

   REGRAS DE SEGURANÇA (obrigatórias, ver IMPLEMENTATION_STATUS.md):
   - Só carrega arquivos de uma LISTA FIXA, definida abaixo. Nunca
     aceita caminho de arquivo vindo de argumento de linha de comando,
     variável de ambiente ou qualquer entrada externa.
   - Nunca executa conteúdo remoto como código — todos os arquivos
     desta lista são locais, do próprio checkout do repositório.
   - Se qualquer arquivo da lista estiver ausente, falha explicitamente
     (nunca segue em frente com um HUB parcialmente carregado).

   QUANDO SUBSTITUIR ESTA PONTE: se os componentes do HUB um dia
   passarem a exportar módulos CommonJS/ESM nativamente, este arquivo
   inteiro deixa de ser necessário — não é para crescer, é para ser
   removido.
   ============================================================ */

"use strict";

var fs = require("fs");
var path = require("path");

/* Ordem canônica de carregamento — mesma dependência declarada no
   cabeçalho de cada arquivo via HUB.require(...). Não reordenar sem
   conferir as dependências de cada arquivo. */
var ARQUIVOS_CANONICOS = [
  "assets/components/hub-core.js",
  "assets/components/hub-sources.js",
  "assets/components/hub-ingest-model.js",
  "assets/components/hub-ingest-reader.js",
  "assets/components/hub-ingest-decoder.js",
  "assets/components/hub-ingest-adapter-ar.js",
  "assets/components/hub-ingest-adapter-dte.js"
];

/**
 * Carrega o HUB (Camadas 0 e 2 relevantes à Fase 6) em `global.HUB`,
 * a partir da raiz do repositório informada.
 *
 * @param {string} raizRepositorio caminho absoluto ou relativo à raiz
 *   do checkout do repositório (nunca um caminho de arquivo individual
 *   vindo de fora desta função).
 * @returns {{HUB: Object, arquivosCarregados: string[]}}
 */
function bootstrap(raizRepositorio) {
  if (!raizRepositorio) {
    throw new Error("[bootstrap-hub] raizRepositorio é obrigatório.");
  }
  var raiz = path.resolve(raizRepositorio);

  if (typeof global.window === "undefined" || global.window !== global) {
    global.window = global;
  }
  if (typeof global.document === "undefined") {
    global.document = {
      getElementById: function () { return null; },
      addEventListener: function () {},
      createElement: function () { return {}; }
    };
  }
  if (typeof global.Papa === "undefined") {
    global.Papa = require("papaparse");
  }
  // Node 18+/20+ já expõe fetch nativo em global.fetch. Não é
  // polyfillado aqui deliberadamente: se estiver ausente, os módulos
  // remote-csv falham de forma explícita (mesmo comportamento já
  // aprovado de hub-ingest-reader.js) — nunca é mascarado.

  var carregados = [];
  ARQUIVOS_CANONICOS.forEach(function (relativo) {
    var caminho = path.join(raiz, relativo);
    if (!fs.existsSync(caminho)) {
      throw new Error("[bootstrap-hub] Arquivo obrigatório ausente: " + caminho);
    }
    // eslint-disable-next-line no-eval
    (0, eval)(fs.readFileSync(caminho, "utf8"));
    carregados.push(relativo);
  });

  return { HUB: global.HUB, arquivosCarregados: carregados };
}

module.exports = {
  bootstrap: bootstrap,
  ARQUIVOS_CANONICOS: ARQUIVOS_CANONICOS.slice()
};
