#!/usr/bin/env node
/* ============================================================
   HUB COMLURB · testes/executar-hub-selftest-node.js
   Fase 6 (07/2026) · v1.0.0

   Harness Node MÍNIMO para rodar testes/hub-selftest.js (suíte de
   Fases 2/3) fora do navegador, para uso em CI. NÃO reimplementa
   nenhum caso de teste e NÃO altera uma linha de testes/hub-
   selftest.js — só fornece o ambiente DOM mínimo que aquele arquivo
   espera encontrar (`document.getElementById`, `document.
   createElement`), o suficiente para os 40 casos existentes rodarem
   até o fim e produzirem o mesmo resumo que apareceria na tela em
   testes/index.html.

   Não usa navegador, não usa Playwright/Puppeteer, não instala
   dependência nova — é Node puro com um stub de ~15 linhas.

   Uso:

     node testes/executar-hub-selftest-node.js <raiz-do-repositorio>

   Exemplo:

     node testes/executar-hub-selftest-node.js .

   Sinal de resultado: este processo encerra com exit code 0 quando
   testes/hub-selftest.js reporta "todos passaram" (mesmo texto que
   apareceria em testes/index.html), e com exit code 1 em qualquer
   outro caso — incluindo falha de caso, ausência de arquivo
   obrigatório, ou ausência do próprio resumo (sinal de que o
   contrato interno de testes/hub-selftest.js mudou e este harness
   precisaria ser revisado).

   Este harness nunca escreve em nenhum arquivo — só lê
   (fs.readFileSync) e executa em memória (eval indireto, isolado
   nesta função, sobre uma lista fixa de três arquivos locais
   conhecidos, nunca um caminho vindo de fora). Mesmo padrão de
   segurança já usado em snapshot/lib/bootstrap-hub.js.
   ============================================================ */

"use strict";

var fs = require("fs");
var path = require("path");

var raiz = process.argv[2];
if (!raiz) {
  console.error("Uso: node testes/executar-hub-selftest-node.js <raiz-do-repositorio>");
  process.exit(1);
}
raiz = path.resolve(raiz);

/* ---------- ambiente DOM mínimo ---------- */

if (typeof global.window === "undefined" || global.window !== global) {
  global.window = global;
}

var elGrupos = {
  // testes/hub-selftest.js monta um <div> por grupo e chama
  // elGrupos.appendChild(div) — não precisamos armazenar nada aqui,
  // o sinal autoritativo de resultado é elResumo, abaixo.
  appendChild: function () {}
};
var elResumo = { className: "", textContent: "" };

global.document = {
  getElementById: function (id) {
    if (id === "grupos") return elGrupos;
    if (id === "resumo") return elResumo;
    return null;
  },
  createElement: function () {
    return { className: "", innerHTML: "", appendChild: function () {} };
  },
  addEventListener: function () {}
};

/* ---------- carregamento — lista fixa, nunca externa ---------- */

var ARQUIVOS_CANONICOS = [
  "assets/components/hub-core.js",
  "assets/components/hub-rules.js",
  "testes/hub-selftest.js"
];

ARQUIVOS_CANONICOS.forEach(function (relativo) {
  var caminho = path.join(raiz, relativo);
  if (!fs.existsSync(caminho)) {
    console.error("[executar-hub-selftest-node.js] Arquivo obrigatório ausente: " + caminho);
    process.exit(1);
  }
  // eslint-disable-next-line no-eval
  (0, eval)(fs.readFileSync(caminho, "utf8"));
});

/* ---------- leitura do resultado — sem parsear HTML, só o resumo ---------- */

if (!elResumo.textContent) {
  console.error("[executar-hub-selftest-node.js] testes/hub-selftest.js não produziu nenhum resumo — " +
    "o contrato interno do arquivo pode ter mudado (era esperado document.getElementById('resumo').textContent " +
    "preenchido ao final). Este harness precisa ser revisado antes de confiar no resultado.");
  process.exit(1);
}

console.log("[hub-selftest via Node] " + elResumo.textContent);

var falhou = String(elResumo.className || "").indexOf("falha") !== -1;
if (falhou) {
  console.error("[executar-hub-selftest-node.js] hub-selftest.js reportou falha — ver mensagem acima.");
  process.exitCode = 1;
} else {
  process.exitCode = 0;
}
