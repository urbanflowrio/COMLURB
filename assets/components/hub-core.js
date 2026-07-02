/* ============================================================
   HUB COMLURB · BIBLIOTECA OFICIAL · hub-core.js
   Camada 0 (Núcleo) · v2.0.0
   Dependências: nenhuma. Deve ser o PRIMEIRO script do HUB.

   Responsabilidades:
   - Namespace global HUB, versão e build
   - Guarda de dependências (HUB.require)
   - Registro de componentes carregados
   - Configuração global compartilhada (HUB.config)
   ============================================================ */

(function () {
  "use strict";

  if (window.HUB && window.HUB.__core) {
    console.warn("[HUB] hub-core.js carregado mais de uma vez; ignorando.");
    return;
  }

  window.HUB = window.HUB || {};
  var HUB = window.HUB;

  HUB.__core = true;
  HUB.version = "2.0.0";
  HUB.build = "2026-07-02";

  /* ---------- registro de componentes ---------- */

  var componentes = ["core"];

  HUB.registerComponent = function (nome) {
    if (componentes.indexOf(nome) === -1) componentes.push(nome);
  };

  HUB.components = function () {
    return componentes.slice();
  };

  /* ---------- guarda de dependências ----------
     Uso no topo de cada arquivo da biblioteca:
       HUB.require("core", "rules");
     Erro claro e imediato se a ordem de carregamento estiver errada. */

  HUB.require = function () {
    var faltando = [];
    for (var i = 0; i < arguments.length; i++) {
      if (componentes.indexOf(arguments[i]) === -1) faltando.push(arguments[i]);
    }
    if (faltando.length) {
      var msg = "[HUB] Dependência ausente: " + faltando.join(", ") +
        ". Verifique a ordem canônica de carregamento dos scripts (ver GUIA_OPERACIONAL).";
      console.error(msg);
      throw new Error(msg);
    }
  };

  /* ---------- configuração global ----------
     Valores institucionais compartilhados. Nenhum painel deve
     redefinir estes textos ou parâmetros localmente. */

  HUB.config = {
    cicloAR: 2026,
    metaIPL: 77.0,
    footer: {
      autor: "Greicy Moreira",
      instituicao: "Gabinete da Presidência / HUB COMLURB • Núcleo de Inteligência e Gestão Estratégica Operacional"
    },
    // Combinação E+C+P do AR depende de confirmação da CVL.
    // Enquanto false, hub-rules-ar deve retornar {bloqueado:true}.
    combinacaoECPLiberada: false
  };

})();
