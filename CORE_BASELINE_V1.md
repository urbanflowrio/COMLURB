# UrbanFlow Core v1 — Baseline Oficial

## Identificação

- **Nome:** UrbanFlow Core v1
- **Versão:** 1.0.0
- **Status:** baseline oficial congelado
- **Projeto de origem:** HUB COMLURB
- **Natureza:** baseline técnico interno e reutilizável, com
  acoplamentos documentados (não um pacote independente publicável
  nesta fase)

## Escopo

O perímetro oficial do Core — o que está dentro, o que está
"reutilizável com acoplamentos ainda existentes", e o que fica
explicitamente fora (módulos específicos da COMLURB, painéis,
histórico/teste/documentação) — está formalizado em
`docs/architecture/CORE_PERIMETRO.md`. Este documento não duplica
aquele conteúdo; qualquer dúvida sobre o que pertence ao Core deve ser
resolvida ali.

## Garantias do baseline

- Regressão oficial de sete suítes (`hub-selftest`, Fase 4, Fase 5,
  Fase 6, Fase 7A, Fase 7B, Fase 7C), executadas nesta ordem.
- 604/604 testes aprovados, código de saída 0.
- `npm test` é o comando oficial de regressão (`test:regression`
  encadeado, com scripts individuais preservados).
- CI (`.github/workflows/snapshot.yml`) executa a regressão integral
  antes de qualquer captura de snapshot; a captura só prossegue se as
  sete suítes passarem.
- Leitura live × snapshot validada em navegador com dados reais, para
  AR (`ar/piloto-snapshot/`) e Engenharia/DTE
  (`engenharia-operacional/piloto-snapshot/`), classificação
  EQUIVALENTE em ambos.
- Snapshots não representam fechamento mensal oficial — são cópia
  técnica para continuidade operacional e auditoria.
- Os pilotos técnicos (Fase 4, Fase 7B, Fase 7C) permanecem isolados:
  sem link na Home, sem link nos painéis executivos, acessíveis
  apenas por URL direta.

## Contratos públicos congelados

Somente os contratos verificados por leitura direta do código:

- `HUB.require(...)` / `HUB.registerComponent(nome)` — guarda de
  dependências e registro de componentes (`hub-core.js`)
- `HUB.sources` — Locator (registro de fontes; registrar não é o
  mesmo que consumir)
- `HUB.rules` — status / atingimento / acumulação / tendência
  (regras transversais)
- Envelope canônico de ingestão: Locator → Reader → Decoder → Adapter
  → Validator → Modelo canônico (`hub-ingest-model.js` e módulos
  correlatos)
- `HUB.snapshotReader` — leitura/validação de `latest.json` e do
  snapshot apontado (dual export browser/Node)
- `HUB.dataSource.resolver(moduloId, modo, {compareProvider})` — modos
  `live` / `snapshot` / `compare` (dual export browser/Node)
- Componentes públicos de UI documentados no perímetro:
  `HUB.cards.render`, `HUB.charts.*`, `HUB.filters.*`,
  `HUB.header.render`, `HUB.footer.render`, `HUB.loading.*`,
  `HUB.format.*`, `HUB.array.*`, `HUB.storage.*`

Nenhuma API além destas é declarada como contrato congelado.

## Limitações conhecidas

- Acoplamentos ainda existentes entre `hub-sources.js`,
  `hub-rules.js`, componentes de UI/CSS e a instância COMLURB (nomes
  reais de fonte, vocabulário institucional, paleta de marca).
- Duas linhagens não reconciliadas de `hub-utils.js` (versão em
  produção vs. versão referida como "Fase 2" nos cabeçalhos de
  `hub-ingest-adapter-ar.js` e `hub-rules-ar.js`).
- Ausência de `hub-state.js` genérico — `hub-state-ar.js` mantém
  taxonomia local por esse motivo.
- Fontes reais (URLs, nomes de aba/planilha) ainda misturadas
  diretamente em `hub-sources.js`, sem camada de configuração de
  instância.
- Tema visual e vocabulário pt-BR institucional ainda não
  parametrizados — embutidos em `hub-charts.js` / `hub-premium.css`.
- `README.md` e `GUIA_OPERACIONAL.md` ainda descrevem uma estrutura de
  pastas anterior à atual, desatualizados.
- `balanco-receita/` permanece como painel separado, apesar da decisão
  já registrada de absorção em `contratos/`.
- Nenhuma separação física para outro repositório foi feita; o Core
  continua vivendo dentro do repositório `COMLURB`.

## Política de mudança

- Qualquer mudança futura nos contratos públicos listados acima exige
  nova versão.
- Mudanças incompatíveis com os contratos existentes exigem versão
  major.
- Correções compatíveis exigem versão patch.
- Extensões compatíveis (novo contrato, sem alterar os existentes)
  exigem versão minor.
- Hashes protegidos (como os de `testes/testar-fase7b.js`) só podem
  ser atualizados por migração explícita de baseline, documentada
  como tal — nunca como contorno silencioso de falha de teste.
- A regressão integral (`npm test`, sete suítes) deve permanecer verde
  antes de qualquer nova alteração ser considerada parte do baseline.

Não é criado, nesta rodada, nenhum sistema de versionamento novo além
do já existente em `package.json` (`"version": "1.0.0"`, já presente
antes desta fase e apenas confirmado aqui).
