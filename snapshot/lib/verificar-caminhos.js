/* ============================================================
   HUB COMLURB · snapshot/lib/verificar-caminhos.js
   Fase 6 (07/2026) · v1.0.0
   Dependências: nenhuma (função pura, testável sem git real).

   Recebe a saída já dividida em linhas de `git status --porcelain` e
   decide se alguma alteração está fora dos caminhos autorizados para
   escrita automática (data/snapshots/, data/reports/, data/rejected/).
   Nunca confia no escopo do GITHUB_TOKEN sozinho — esta é a checagem
   explícita exigida antes de qualquer commit automático.
   ============================================================ */

"use strict";

var CAMINHOS_AUTORIZADOS_PADRAO = [
  "data/snapshots/",
  "data/reports/",
  "data/rejected/"
];

/**
 * @param {string[]} linhasGitStatus linhas cruas de `git status --porcelain`
 *   (cada uma no formato "XY caminho" ou "XY orig -> novo" para renames)
 * @param {string[]} [caminhosAutorizados] prefixos permitidos
 * @returns {{ok: boolean, foraDoAutorizado: string[], caminhosAlterados: string[]}}
 */
function avaliarCaminhosAutorizados(linhasGitStatus, caminhosAutorizados) {
  caminhosAutorizados = caminhosAutorizados || CAMINHOS_AUTORIZADOS_PADRAO;

  var linhasLimpas = (linhasGitStatus || [])
    .map(function (l) { return String(l || "").replace(/\r$/, ""); })
    .filter(function (l) { return l.trim() !== ""; });

  var caminhosAlterados = [];
  var foraDoAutorizado = [];

  linhasLimpas.forEach(function (linha) {
    var caminhoRelativo = linha.length > 3 ? linha.slice(3).trim() : linha.trim();
    var partes = caminhoRelativo.split(" -> ");
    partes.forEach(function (p) { caminhosAlterados.push(p); });

    var algumaParteFora = partes.some(function (p) {
      return !caminhosAutorizados.some(function (prefixo) { return p.indexOf(prefixo) === 0; });
    });
    if (algumaParteFora) foraDoAutorizado.push(linha);
  });

  return {
    ok: foraDoAutorizado.length === 0,
    foraDoAutorizado: foraDoAutorizado,
    caminhosAlterados: caminhosAlterados
  };
}

module.exports = {
  CAMINHOS_AUTORIZADOS_PADRAO: CAMINHOS_AUTORIZADOS_PADRAO.slice(),
  avaliarCaminhosAutorizados: avaliarCaminhosAutorizados
};
