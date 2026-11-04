# Auditoria de regressão · Prévia 1746 · outubro/2026

**Ambiente:** branch `preparacao-1746-outubro-2026`. **Produção:** branch `main` intocada.

## Fonte de dados

COMLURB, extrações definitivas de outubro, validadas tecnicamente. Referência independente não disponível; homologação independente **não realizada**. Data da extração final não informada.

| Indicador | Out/2025 | Out/2026 | Jan–Out/2026 |
|---|---:|---:|---:|
| Chamados | 21.652 | 24.116 | 278.888 |
| Ouvidorias operacionais | 2.697 | 2.213 | 32.562 |
| Ouvidorias institucionais (incluindo PCO) | 2.881 | 2.369 | — |

PCO Outubro: 184 (2025) e 156 (2026). A camada operacional exclui PCO, sem excluí-la do total institucional.

## Testes

**262 verificações programáticas sobre os cubos e arquivos históricos: 0 falhas.**
Incluíram a igualdade dos totais de outubro, atualização incremental dos acumulados, preservação literal do objeto Setembro, imutabilidade das nove primeiras competências das séries, somatórios anuais de `children` / AP / gerência / bairro no mensal e acumulado, reconciliação de cada tipo com seus subtipos, e conferência de cada ramo da cascata de Janeiro–Outubro e Outubro.

**34 verificações estáticas em cinco interfaces HTML: 0 falhas.**
Todas as cinco páginas possuem estrutura HTML, indicações de outubro, ressalvas de validação, IDs sem duplicidade e referências locais de scripts existentes na branch.

**Teste de navegador real: NÃO REALIZADO.**
A auditoria **não demonstra** que Chart.js, Leaflet, menus, filtros clicáveis, mapa ou responsividade estejam corretos em execução. Esses itens são condicionantes de publicação. Verificação estática não deve ser apresentada como teste funcional.

## Regras e ressalvas

1. Outubro foi adicionado de modo incremental, sem reprocessamento do histórico Jan–Set.
2. Os dados gerais de Ouvidoria são mantidos nas fontes; a visualização operacional remove PCO.
3. Não calcular taxas para subtipos sem pareamento nominal comprovado. Volumes podem ser exibidos separadamente.
4. A data de corte da extração de outubro permanece não informada; `data-cutoff.json` não deve inventá-la.
5. Os números são tecnicamente conferidos, não objeto de homologação independente.
6. Mesclar com `main` e publicar depende de revisão visual/funcional e autorização expressa.

## Conclusão

**Prévia preparada e testes de dados/estrutura aprovados. Não liberada para produção.**
