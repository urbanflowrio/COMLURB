# 1746 Histórico — V4.2

Baseline auditada para leitura comparável jan–set/2025 x jan–set/2026, com histórico ampliado de Remoção Gratuita.

## Atualização de 08/10/2026

A leitura de Remoção Gratuita deixou de tratar 2025 como evento isolado. O histórico ampliado de `ouv-hist.xlsx` e `chamado-hit.xlsx` mostra mudanças de regime semelhantes em 2021 e 2025. A causa permanece NÃO QUALIFICADA.

### Interpretação autorizada

- Não classificar o fenômeno como sazonalidade.
- Não classificar como deterioração geral de 2026.
- Não usar 2025 como baseline “normal” de Remoção Gratuita sem ressalva.
- A janela jun–set/2025 permanece relevante, mas deve ser lida dentro de uma série com mudanças de regime históricas.
- A pergunta de gestão passa a ser se existe evento de processo comum aos períodos de queda observados em 2021 e 2025.

### Histórico de referência

No subtipo padronizado `REMOÇÃO DE ENTULHO E BENS INSERVÍVEIS`:

- 2021: taxa cai de ~230/mil em janeiro para ~19/mil em setembro e permanece baixa até dezembro.
- 2024: série relativamente estável, aproximadamente 21–47/mil.
- 2025: pico de ~161/mil em março, queda para ~25–27/mil em agosto–setembro e recuperação para ~79/mil em outubro.
- 2026: série disponível até outubro, sendo outubro parcial e não considerado fechamento.

## Regras de padronização nominal

1. `AVALIAÇÃO DE PODA DE ÁRVORES EM LOGRADOURO` e `AVALIAÇÃO DE PODA DE ÁRVORES EM LOGRADOURO (180 DIAS)` são tratados como o MESMO SERVIÇO na camada analítica, sob o rótulo padronizado `AVALIAÇÃO DE PODA DE ÁRVORES EM LOGRADOURO`.
2. `INSTALAÇÃO E/OU RETIRADA DE PAPELEIRA` e `LIMPEZA DE PAPELEIRA, CONTÊINER E CAÇAMBA COMLURB` são SERVIÇOS DISTINTOS e nunca são consolidados entre si.
3. O rótulo bruto permanece preservado na fonte. A regra atua somente na camada analítica.
4. A padronização não autoriza criar taxa por subtipo onde Chamados e Ouvidorias não tenham par comparável legítimo.
5. Jul/Ago/Set 2026 permanecem congelados conforme os fechamentos homologados; nenhuma nova fotografia bruta recalcula esses resultados.

## Governança

- Revisões retroativas permanecem como `Revisão não incorporada`.
- Julho × AP continua somente em volume de Ouvidoria.
- Agosto × AP mantém `SEM AP (AGO)` como resíduo explícito.
- Subtipo continua em volume quando o pareamento taxonômico não é suficiente.
- Histórico ampliado de Remoção Gratuita é camada analítica complementar e não altera os valores oficiais congelados do HUB.
