/* ============================================================
   HUB COMLURB · snapshot/lib/canonical.js
   Fase 6 (07/2026) · v1.0.0
   Dependências: nenhuma.

   Responsabilidade única: transformar um valor JS em uma forma
   determinística para fins de hash — mesma entrada semântica sempre
   produz a mesma string, independente da ordem em que as chaves de
   um objeto foram originalmente escritas.

   REGRAS (aprovadas nesta fase):
   - Chaves de OBJETO são ordenadas alfabeticamente, recursivamente.
   - Elementos de ARRAY preservam a ORDEM ORIGINAL — nunca são
     reordenados. A ordem de um array pode ter significado canônico
     (ex.: sequência de linhas de um período) e reordenar apagaria
     essa informação.
   - Não remove nem interpreta nenhum campo — isso é responsabilidade
     de quem monta a entrada do hash (ver snapshot-core.js), nunca
     deste módulo.
   ============================================================ */

"use strict";

/**
 * Retorna uma cópia do valor com todas as chaves de objeto (em
 * qualquer profundidade) ordenadas alfabeticamente. Arrays são
 * percorridos elemento a elemento, na ordem original, sem reordenar.
 */
function canonicalizar(valor) {
  if (Array.isArray(valor)) {
    return valor.map(canonicalizar);
  }
  if (valor !== null && typeof valor === "object") {
    var chaves = Object.keys(valor).sort();
    var saida = {};
    chaves.forEach(function (chave) {
      saida[chave] = canonicalizar(valor[chave]);
    });
    return saida;
  }
  return valor;
}

/**
 * JSON.stringify determinístico: mesma entrada semântica sempre
 * produz a mesma string, para uso exclusivo em cálculo de hash.
 * Não deve ser usado como formato de gravação em disco (a gravação
 * em disco usa JSON.stringify(..., null, 2) normal, para legibilidade
 * humana — ver snapshot-core.js).
 */
function canonicalJSONStringify(valor) {
  return JSON.stringify(canonicalizar(valor));
}

module.exports = {
  canonicalizar: canonicalizar,
  canonicalJSONStringify: canonicalJSONStringify
};
