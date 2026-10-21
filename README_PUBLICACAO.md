# Consolidação DAF no Balanço Receita — HUB COMLURB

## Publicação
Substitua os arquivos `balanco-receita/index.html`, `balanco-receita/balanco-receita.js`, `balanco-receita/balanco-receita.css`.
Adicione `balanco-receita/inteligencia/{index.html,app.js,data.js,style.css}`.
Substitua `daf/index.html` pelo redirecionamento. **Não apague outros arquivos do repositório.**

## Fonte
A tela existente passa a consultar a planilha Google DAF validada (ID final 1fWsN8qe...) em vez da antiga fonte. A seção histórica integrada continua com o corte estático de setembro/2026, identificado ao usuário; não há sincronização automática dela.

## Validação em produção
1. Abrir `/balanco-receita/` e conferir carregamento do painel atual.
2. Abrir `#inteligencia-daf`, verificar diagnóstico e filtros em cascata.
3. Abrir `/daf/` e verificar redirecionamento.
4. Comparar estoque e indicadores com a planilha oficial antes de classificar como homologado.

**Nota:** A nova área funciona dentro da página via documento interno (iframe mesmo domínio), evitando conflitos dos estilos/IDs e mantendo o HUB atual intacto.
