# Piloto B — Engenharia/DTE (Fase 5)

Valida a cadeia Locator → Reader → Adapter DTE → Validator → Modelo canônico
contra a **única fonte oficial autorizada nesta fase**: a aba geral da
planilha "Relatório Mensal DTE" (`DTE_RELATORIO_GERAL` em `hub-sources.js`).

## Escopo desta fase (não confundir com o painel de produção)

- **Não** recria as quatro telas de `engenharia-operacional/index.html`.
- **Não** migra as outras cinco fontes hoje consumidas pelo painel (`ind2025`,
  `ind2026`, `coletaDomiciliar`, `coletaSeletiva`, `lixoPublico`).
- **Não** recria os 11 blocos analíticos do antigo DTE (`docs/CONHECIMENTO_DTE.md`).
- **Não** classifica nada por limiar/status/score — só estrutura, períodos,
  blocos, subgrupos, indicadores, unidades e valores.
- **Não** altera `engenharia-operacional/index.html` nem sua estética.

## Arquivos

- `../../assets/components/hub-ingest-adapter-dte.js` — Adapter (Camada 2).
- `../../assets/components/hub-sources.js` — fonte `DTE_RELATORIO_GERAL` adicionada.
- `harness.js` — comparação canônico × base vertical.
- `index.html` — relatório técnico em navegador (fonte real + comparação).
- `base-vertical-amostra.json` — cópia estática da aba `EXPORT_HUB_ENGENHARIA`
  (gerada pelo Apps Script enviado nesta fase), usada só como amostra de
  comparação e controle — **nunca fonte oficial**.
- `saida-canonica-exemplo.json` — envelope canônico de exemplo, gerado contra
  os dados reais enviados nesta fase.
- `relatorio-comparacao.json` — saída do harness contra a mesma amostra.

## Decisão sobre a base vertical (EXPORT_HUB)

A aba `EXPORT_HUB_ENGENHARIA` é gerada por
`Apps_Script_Atualizar_EXPORT_HUB_ENGENHARIA.gs` — uma instância do padrão
EXPORT_HUB identificado na Fase 1 como padrão **a não reproduzir** na
arquitetura. O Adapter DTE não depende dela: lê e transforma a aba geral
diretamente. A base vertical é usada só como amostra de comparação, e tem
limitações conhecidas, documentadas em `harness.js` e no relatório de
comparação:

1. Perde o vínculo entre as linhas "Gerência Ofensora N" e o
   subgrupo/critério real ao qual pertencem (a coluna `Grupo` só registra o
   bloco A–D).
2. Reaproveita o rótulo do indicador-pai como rótulo da linha de valor da
   gerência ofensora, produzindo múltiplas linhas com o mesmo rótulo por
   período na base vertical — o motivo dos "sem correspondência" no
   relatório de comparação (documentado, não um erro do Adapter).
3. Infere unidade de medida heuristicamente e de forma inconsistente para
   o mesmo tipo de dado.
4. Converte ausência em zero (mesmo comportamento do legado).

O modelo canônico não reproduz nenhuma dessas limitações.

## Rodando os testes

A partir da raiz do repositório, com esta entrega já mesclada sobre `main`:

```
node testes/testar-fase5.js .
node testes/testar-fase4.js .   # confirma ausência de regressão
```
