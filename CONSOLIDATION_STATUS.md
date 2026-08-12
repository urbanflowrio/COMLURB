# HUB COMLURB — Rodada de consolidação

Data: 12 de agosto de 2026.

## Resultado

- regressão da Fase 4 tornada independente do mês em que o teste foi criado;
- baseline da Fase 7B reconciliada com o `package.json` vigente;
- CI ampliada para executar as sete suítes por meio de `npm test`;
- dados incorporados de Ouvidoria e Chamados 1746 separados do HTML;
- imagens Base64 dos dois painéis movidas para `assets/media/`;
- fontes operacionais compartilhadas de AR e do relatório DTE consumidas pelo registro central;
- módulos oficiais de Ouvidoria, Chamados 1746 e Contratos incluídos na Home;
- catálogo formal de módulos oficiais e pilotos criado em `MODULE_CATALOG.md`.

## Baseline esperada

| Suíte | Casos esperados |
|---|---:|
| Selftest | 40 |
| Fase 4 | 42 |
| Fase 5 | 96 |
| Fase 6 | 85 |
| Fase 7A | 102 |
| Fase 7B | 146 |
| Fase 7C | 93 |
| **Total** | **604** |

O resultado só deve ser declarado válido quando as sete suítes terminarem com zero reprovações.
