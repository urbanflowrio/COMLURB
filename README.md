# HUB COMLURB · Inteligência Operacional

Portal executivo de inteligência e monitoramento da COMLURB, organizado por módulos independentes e regras comuns de governança, rastreabilidade e apresentação.

## Estrutura
A página inicial está em `index.html`. O catálogo oficial de módulos e suas situações está em `MODULE_CATALOG.md`; a matriz de fontes, competências, responsáveis e validações está em `MATRIZ_OFICIAL_MODULOS.md`.

## Governança técnica
- `CORE_PERIMETRO.md` define o perímetro do Core compartilhado.
- `CORE_BASELINE_V1.md` e `BASELINE_HOMOLOGACAO.md` registram a linha de base.
- `PADRAO_GOVERNANCA_DADOS.md` registra regras de dados.
- `GUIA_OPERACIONAL.md` orienta manutenção e operação.
- Homologações e revisões específicas ficam dentro de cada módulo quando aplicável.

## Regra de manutenção
Módulos devem poder evoluir sem quebrar os demais. Alterações em componentes compartilhados exigem regressão do Core; alterações locais devem manter documentação, fonte, competência e regra de cálculo rastreáveis.
