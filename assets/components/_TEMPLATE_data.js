/**
 * [NOME DO PAINEL] — data.js
 * Configuração de fontes de dados
 *
 * COMO OBTER A URL DO GOOGLE SHEETS:
 *   Arquivo → Publicar na Web → Formato CSV → Publicar
 *   Copiar a URL gerada e colar em DATA_CONFIG.url abaixo.
 *   ATENÇÃO: "Compartilhar" não gera URL pública. Precisa ser "Publicar na Web".
 */

const DATA_CONFIG = {
  name: "[Nome da base]",
  url:  "https://docs.google.com/spreadsheets/d/e/XXXXXXX/pub?output=csv",

  // Mapeamento de campos — lista de nomes possíveis na planilha
  // hub-utils vai tentar cada um em ordem e usar o primeiro que encontrar
  fields: {
    id:        ["ID", "CODIGO", "CÓDIGO"],
    nome:      ["NOME", "DESCRIÇÃO", "DESCRICAO"],
    campo1:    ["CAMPO1"],
    campo2:    ["CAMPO2"]
  }
};
