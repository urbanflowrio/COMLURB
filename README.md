# Fase 6 — Snapshot automático e validação antecipada (AR e Engenharia/DTE)

Este documento é a referência operacional formal para o mecanismo de
snapshot do HUB COMLURB a partir desta entrega. Não existe nenhum
`MIGRATION_STRATEGY.md` neste repositório — as referências a esse nome
encontradas em comentários de `assets/components/hub-ingest-adapter-ar.js`,
`ar/piloto/index.html` e `ar/piloto/harness.js` são histórico de
comentário, não um documento materializado, e permanecem inalteradas
nesta entrega (decisão da proprietária do produto: não reconstruir nem
inventar esse conteúdo). Da mesma forma, os identificadores ADR-001,
ADR-004 e ADR-005 citados em `hub-ingest-model.js`,
`hub-ingest-reader.js` e `hub-rules-ar.js` não correspondem a nenhum
arquivo existente — são uma lacuna documental de fases anteriores,
registrada aqui e não resolvida retroativamente (ver "Riscos e
limitações conhecidas" abaixo).

## O que esta fase entrega

Um mecanismo que lê as fontes públicas já aprovadas do AR e do
Engenharia/DTE, roda os Adapters já aprovados (Fases 4 e 5, sem
nenhuma alteração), e persiste o resultado validado como um snapshot
canônico versionado — sem backend, sem banco de dados, sem passo
manual adicional na rotina da usuária além de manter a planilha
oficial atualizada.

```
Planilha oficial (Google Sheets, pública)
        │
        ▼
hub-sources.js (Locator, já aprovado)
        │
        ▼
hub-ingest-reader.js (Reader, já aprovado)
        │
        ▼
hub-ingest-adapter-ar.js / hub-ingest-adapter-dte.js (já aprovados)
        │  envelope canônico (schemaVersion, sourceId, capturedAt,
        │  referencePeriod, domain, payload, quality, lineage)
        ▼
snapshot/lib/snapshot-core.js  (NOVO — mecanismo genérico)
   ├─ valida o envelope
   ├─ calcula hash determinístico
   ├─ compara com o último snapshot válido do mesmo módulo
   ├─ grava de forma atômica (nunca deixa latest.json inconsistente)
   └─ gera relatório compreensível por pessoa não técnica
        │
        ▼
GitHub Action (.github/workflows/snapshot.yml) — orquestra, nunca
contém regra de domínio
```

## Arquivos desta entrega

Novos:

- `snapshot/lib/bootstrap-hub.js` — ponte de compatibilidade Node
  (ver seção "Sobre o uso de eval" abaixo).
- `snapshot/lib/canonical.js` — canonicalização determinística para hash.
- `snapshot/lib/snapshot-core.js` — mecanismo genérico (validação, hash,
  comparação, persistência atômica, relatório, retenção). Não conhece
  "AR" nem "DTE" por nome.
- `snapshot/lib/snapshot-ar.js` — ponte fina do módulo AR (única regra
  específica: as três fontes operacionais são obrigatórias).
- `snapshot/lib/snapshot-dte.js` — ponte fina do módulo DTE.
- `snapshot/lib/verificar-caminhos.js` — lógica pura de restrição de
  escrita a `data/snapshots|reports|rejected`.
- `snapshot/run.js` — CLI (orquestração, verify-paths, rollback-info,
  retencao-info).
- `snapshot/README.md` — este arquivo.
- `testes/executar-hub-selftest-node.js` — harness Node mínimo para
  rodar `testes/hub-selftest.js` (Fases 2/3) em CI, sem alterar esse
  arquivo (ver "Testes" abaixo).
- `snapshot/exemplos/` — exemplos gerados a partir de fixtures de
  teste, claramente marcados (ver "Exemplos" abaixo).
- `.github/workflows/snapshot.yml` — workflow.
- `testes/testar-fase6.js` — suíte reproduzível (85 casos).
- `data/snapshots/{ar,engenharia-dte}/periodos/`, `data/reports/{ar,engenharia-dte}/`,
  `data/rejected/{ar,engenharia-dte}/` — estrutura vazia (só `.gitkeep`),
  pronta para a primeira execução real.
- `package.json` — não existia nenhum na raiz do repositório; criado
  mínimo, só com a dependência `papaparse` (já usada pelos próprios
  painéis via CDN) e os scripts de teste/execução.

Alterado:

- `docs/architecture/IMPLEMENTATION_STATUS.md`.

**Nenhum Adapter, Reader, Model, Rule, State, piloto ou painel de
produção foi alterado.** Confirmação por lista, idêntica à exigida:
`ar/index.html`, `ar/ar-config.js`, `ar/ar.js`,
`engenharia-operacional/index.html`, os pilotos aprovados,
`hub-core.js`, `hub-rules.js`, `hub-rules-ar.js`, `hub-state-ar.js`,
`hub-utils.js` e todos os demais módulos — nenhum foi tocado.

## Instalação

```bash
npm install
```

Instala só `papaparse` (Node ≥ 18, testado com Node 20 — mesma versão
usada no workflow). Não há build, não há framework, não há servidor.

## Operação — comandos

```bash
# Executa AR e Engenharia/DTE (um único processo, cada módulo isolado)
node snapshot/run.js

# Confirma que nenhuma escrita saiu de data/snapshots|reports|rejected
node snapshot/run.js verify-paths

# Consulta (nunca altera) o histórico de um módulo
node snapshot/run.js rollback-info ar
node snapshot/run.js rollback-info ar --period 2026
node snapshot/run.js rollback-info engenharia-dte --snapshot data/snapshots/engenharia-dte/periodos/2025-05..2026-05/<arquivo>.json

# Lista (nunca apaga) itens elegíveis para limpeza de retenção
node snapshot/run.js retencao-info
```

Atalhos equivalentes via `npm run`: `npm run snapshot`,
`npm run snapshot:verify-paths`, `npm run snapshot:retencao-info`.

## Primeira execução real — passo a passo

Conforme decisão da proprietária do produto, **nenhum snapshot real
foi gravado durante o desenvolvimento desta fase** — `data/` chega
vazia (só `.gitkeep`) neste ZIP. A primeira captura oficial só deve
acontecer depois de:

1. Publicar os arquivos desta entrega em `main` (ver instruções de
   upload no relatório de entrega).
2. Revisar os arquivos publicados (em especial
   `.github/workflows/snapshot.yml` e os arquivos em `snapshot/lib/`).
3. Ir até a aba **Actions** do repositório no GitHub, selecionar o
   workflow "HUB COMLURB — Snapshot AR e Engenharia/DTE (Fase 6)" e
   clicar em **Run workflow** (execução manual, `workflow_dispatch`).
4. Acompanhar a execução: os dois módulos (AR e Engenharia/DTE) rodam
   dentro do mesmo job. Ao final, um único commit (se houver mudança)
   é feito em `data/`.
5. **Validar o primeiro snapshot real**: abrir o relatório publicado
   como *artifact* da execução (nome
   `relatorio-snapshot-<id-da-execução>`, disponível na página da
   execução mesmo que não tenha havido commit) e conferir, para cada
   módulo: status, período de referência, contagem de registros,
   avisos e erros. Depois, conferir em `data/snapshots/ar/latest.json`
   e `data/snapshots/engenharia-dte/latest.json` que o ponteiro aponta
   para um arquivo existente dentro de `periodos/`.

## Como interromper a execução

- **Execução agendada em andamento**: na aba Actions, abrir a execução
  em andamento e usar **Cancel workflow**. Como o commit só acontece
  depois que os dois módulos terminam de processar (nunca no meio),
  cancelar não deixa `data/` num estado inconsistente — na pior
  hipótese, nenhum commit é feito nesse ciclo.
- **Impedir novas execuções agendadas**: na aba Actions → workflow
  "Snapshot AR e Engenharia/DTE (Fase 6)" → menu "..." → **Disable
  workflow**. `workflow_dispatch` (execução manual) continua
  disponível mesmo com o agendamento desabilitado, caso seja preciso
  rodar pontualmente.

## Como executar rollback-info

`rollback-info` só lê — nunca escreve. Três formas de uso:

```bash
# Lista todos os períodos e capturas disponíveis de um módulo, mais o latest atual
node snapshot/run.js rollback-info ar

# Filtra por período (ex.: "2026" para AR, ou um trecho do referencePeriod do DTE)
node snapshot/run.js rollback-info engenharia-dte --period 2025-05

# Detalha um snapshot específico e informa o procedimento MANUAL de restauração
node snapshot/run.js rollback-info ar --snapshot data/snapshots/ar/periodos/2026/<arquivo>.json
```

A "restauração" sugerida pelo comando é sempre uma edição manual de
`data/snapshots/{modulo}/latest.json`, seguida de commit humano — o
comando nunca altera esse arquivo sozinho, e o histórico completo
nunca é apagado.

## Estrutura de pastas

```
data/
  snapshots/
    ar/
      latest.json
      periodos/
        2026/
          <capturedAt-normalizado>__<hash-curto>.json
    engenharia-dte/
      latest.json
      periodos/
        <referencePeriod-sanitizado>/
          <capturedAt-normalizado>__<hash-curto>.json
  reports/
    ar/<capturedAt-normalizado>__<status>.md
    engenharia-dte/<capturedAt-normalizado>__<status>.md
  rejected/
    ar/<horario-normalizado>__rejeitado.json
    engenharia-dte/<horario-normalizado>__rejeitado.json
```

`referencePeriod` do AR é sempre a string `"2026"` (o ciclo anual do
Acordo de Resultados, já assim definido em
`hub-ingest-adapter-ar.js` — não é um bug desta fase, é o contrato já
aprovado). Isso significa que todas as capturas do ano ficam na mesma
subpasta `periodos/2026/`, diferenciadas por `capturedAt`+hash — o que
está correto para um indicador cumulativo anual atualizado
mensalmente. O `referencePeriod` do DTE é a janela rolante de 13
meses já calculada pelo Adapter (ex.: `2025-05..2026-05`), sanitizada
para nome de pasta.

## `latest.json`

Ponteiro pequeno, aprovado com os campos mínimos exigidos mais dois
campos aditivos (`schemaVersion`, `domain`) usados só para detecção
barata de mudança estrutural nos relatórios:

```json
{
  "snapshotVersion": "1.0.0",
  "moduloId": "ar",
  "path": "snapshots/ar/periodos/2026/2026-07-01T03-00-00-000Z__9983563894ad.json",
  "hash": "sha256:...",
  "referencePeriod": "2026",
  "capturedAt": "2026-07-01T03:00:00.000Z",
  "updatedAt": "2026-07-01T03:00:05.000Z",
  "schemaVersion": "indicadores.v1",
  "domain": "indicadores_metas"
}
```

**Escrita atômica**: (1) grava o arquivo do snapshot; (2) relê e
confere o hash; (3) só então grava um `latest.json.tmp-*` temporário;
(4) relê e confere o hash do temporário; (5) `fs.renameSync` por cima
do `latest.json` real. Se qualquer etapa falhar, uma exceção é
lançada e **nada é sobrescrito** — o `latest.json` anterior permanece
exatamente como estava (testado explicitamente em
`testes/testar-fase6.js`, simulando falha no `rename`).

## Hash e integridade

- **Algoritmo**: SHA-256 (`crypto` nativo do Node).
- **Entrada do hash**: `schemaVersion`, `sourceId`, `referencePeriod`,
  `domain`, `payload`, `quality` (sem `timestamp`), `lineage` (sem
  `timestamp`) — canonicalizados (chaves de objeto ordenadas
  alfabeticamente, recursivamente; **arrays nunca são reordenados**,
  a ordem pode ser canônica).
- **Fora do hash, sempre**: `capturedAt` do envelope e `geradoEm` do
  invólucro (voláteis por definição, mudam a cada execução mesmo sem
  mudança real).
- **Reexecução idêntica**: mesmo hash do `latest` → nenhum arquivo
  novo é criado, `latest.json` não é tocado, o relatório é gerado
  (sempre publicado como *artifact*) mas só é persistido em
  `data/reports/` se houver aviso relevante — caso contrário, nenhum
  commit é gerado nesse ciclo.

## Comportamento de falha

| Situação | Efeito |
|---|---|
| Fonte obrigatória do AR indisponível (`AR_2026`, `AR_MAPEAMENTO` ou `AR_GERAL`) | Snapshot do AR bloqueado neste ciclo, mesmo que o Adapter tivesse produzido um envelope degradado. `AR_GOVERNANCA` não participa desta checagem (não é obrigatória). |
| Falha de leitura/estrutura do DTE (fonte única) | Envelope já vem com `payload=null` do próprio Adapter — snapshot bloqueado. |
| `quality.erros` não vazio | Snapshot bloqueado, `latest.json` intocado. |
| Falha de escrita (disco, permissão, rename) | Exceção propagada, `latest.json` anterior preservado. |
| Módulo AR falha | Módulo Engenharia/DTE continua e publica normalmente no mesmo ciclo (e vice-versa). |
| Arquivo alterado fora de `data/snapshots\|reports\|rejected` | `verify-paths` bloqueia — nenhum commit é feito. |

Nenhum erro bloqueante é rebaixado a aviso. Nenhuma ausência é
convertida em zero (delegado inteiramente aos Adapters já aprovados).

## Retenção

- Snapshots válidos: permanentes.
- Snapshots com hash idêntico ao anterior: nunca duplicados.
- Relatórios de sucesso associados a um novo snapshot: permanentes.
- Relatórios de falha persistidos em `data/reports/` e registros em
  `data/rejected/`: retenção de **90 dias**.
- **Nenhuma exclusão automática** nesta v1. `node snapshot/run.js
  retencao-info` lista os itens elegíveis (idade > 90 dias); a
  exclusão, quando decidida, é manual.

## Frequência

```yaml
schedule:
  - cron: '0 11 * * 1'   # segunda-feira, 08:00 horário de Brasília (11:00 UTC)
workflow_dispatch: {}
```

As fontes são mensais; a cadência semanal serve para detectar quebras
estruturais (mudança de schema, coluna renomeada, fonte despublicada)
antes do fechamento oficial do ciclo — não caracteriza monitoramento
contínuo, e está alinhada ao vocabulário já banido pela filosofia do
produto (`PRODUCT_PHILOSOPHY.md`: nunca "tempo real", nunca
"monitoramento contínuo"). Execuções agendadas podem sofrer atraso por
conta própria do GitHub Actions (fila de runners) — isso é esperado e
não deve ser tratado como falha do sistema.

## Estimativa de custo operacional

Assumindo **repositório público** (compatível com a publicação atual
via GitHub Pages em `urbanflowrio.github.io/COMLURB`):

- **Minutos de GitHub Actions**: ilimitados e gratuitos para
  repositórios públicos. Mesmo se o repositório fosse privado, uma
  execução semanal de poucos minutos (leitura de 4 fontes CSV
  pequenas + processamento local, sem build) fica muito abaixo dos
  2.000 minutos/mês gratuitos do plano padrão — não há risco realista
  de exceder o nível gratuito em nenhum dos dois cenários.
- **Armazenamento**: snapshots são JSON de texto puro, tipicamente
  dezenas a poucas centenas de KB por captura (o maior payload real já
  observado nas Fases 4/5 tem a ordem de milhares de indicadores/
  registros — ainda assim texto, comprime bem no histórico Git).
  Crescimento esperado: ~1 captura nova por semana por módulo, quando
  há mudança real; ciclos "sem mudança" não geram arquivo novo.
- **Artifacts**: relatórios em Markdown, poucos KB cada, com retenção
  configurada em 90 dias — dentro do limite padrão de armazenamento de
  artifacts do plano gratuito.
- **Manutenção mensal esperada**: revisão ocasional do relatório
  semanal (poucos minutos); execução de `retencao-info` e limpeza
  manual, se desejado, com frequência trimestral ou menor.
- **Cenário alternativo (repositório privado)**: os minutos de Actions
  passam a consumir a cota gratuita de 2.000 min/mês (plano gratuito
  de organização/conta) — ainda assim, a cadência semanal e a
  simplicidade do processamento tornam o consumo real uma fração
  pequena dessa cota. Nenhum custo pago é necessário em nenhum dos
  dois cenários.

## Exemplos (`snapshot/exemplos/`)

Gerados a partir de fixtures de teste (nunca da fonte real do Google
Sheets), para ilustrar o formato do snapshot e do relatório:

- `snapshot/exemplos/ciclo-com-sucesso/` — snapshot válido de AR e de
  Engenharia/DTE, mais os relatórios correspondentes.
- `snapshot/exemplos/ciclo-com-falha/` — um registro rejeitado de cada
  módulo (AR por fonte obrigatória indisponível; DTE por fonte
  vazia), mais os relatórios de falha correspondentes.

Todo arquivo `.json` desta pasta tem um campo `AVISO` explícito no
topo, e todo arquivo `.md` tem uma nota no cabeçalho — ambos deixando
claro que aquele conteúdo é exemplo, não captura oficial. Nenhum
arquivo em `snapshot/exemplos/` é lido por `snapshot/run.js` — é
puramente ilustrativo.

## Sobre o uso de `eval` (`bootstrap-hub.js`)

Os componentes do HUB (`assets/components/*.js`) são scripts de
navegador, não módulos Node. `snapshot/lib/bootstrap-hub.js` isola,
num único arquivo, o mesmo padrão de bootstrap já usado e aprovado em
`testes/testar-fase4.js`/`testes/testar-fase5.js`
(`global.window = global` + `eval` sobre uma lista fixa de arquivos
locais). Não é arquitetura permanente: só carrega arquivos de uma
lista fixa definida no próprio arquivo, nunca aceita caminho vindo de
argumento externo, e nunca executa conteúdo remoto. Se os componentes
do HUB um dia passarem a exportar módulos CommonJS/ESM nativamente,
este arquivo deixa de ser necessário.

## Riscos e limitações conhecidas

1. **`MIGRATION_STRATEGY.md` não existe.** Citado em três arquivos já
   aprovados (fora do escopo desta fase para editar); tratado como
   comentário histórico, não como decisão vigente. Este README passa
   a ser a referência operacional formal para o mecanismo de
   snapshot.
2. **ADR-001, ADR-004, ADR-005 não existem.** Citados em
   `hub-ingest-model.js`, `hub-ingest-reader.js` e `hub-rules-ar.js`.
   Nenhum ADR retroativo foi criado nesta fase — lacuna documental
   registrada, não resolvida.
3. **Permissão do `GITHUB_TOKEN`** (`contents: write`) não impõe,
   por si só, restrição de caminho — quem impõe é o step
   `verify-paths`, executado sempre antes do commit. Se esse step for
   removido do workflow no futuro, a proteção deixa de existir.
4. **`bootstrap-hub.js` usa `eval`.** Mitigado por lista fixa de
   arquivos locais e ausência de qualquer entrada externa — mas
   continua sendo `eval`, e deve ser tratado como ponte de
   compatibilidade a substituir se os componentes do HUB algum dia
   exportarem módulos nativamente (ver seção acima).
5. **Visibilidade do repositório** foi assumida como pública para a
   estimativa principal de custo (Seção "Estimativa de custo
   operacional"), por já ser publicado via GitHub Pages. O cenário
   privado também foi documentado e não representa risco de custo
   pago em nenhum dos dois casos.
6. **`quality.avisos` do AR pode ser não vazio em produção** sempre
   que houver código do `AR_2026` sem correspondência completa em
   `AR_MAPEAMENTO`/`AR_GERAL` — isso é comportamento já aprovado do
   Adapter (Fase 4), não desta fase. Na prática, isso significa que
   ciclos "sem mudança" ainda podem gerar relatório persistido (e
   portanto commit) sempre que esses avisos estiverem presentes — não
   é um defeito do mecanismo de snapshot, é a regra "relatório
   persistido quando há aviso relevante" funcionando como
   especificado. Se isso gerar commits semanais mais frequentes do
   que o esperado, a causa está na cobertura do mapeamento/geral, não
   no snapshot.
7. **Concorrência**: o workflow usa `concurrency: hub-comlurb-snapshot`
   com `cancel-in-progress: false` — duas execuções não rodam ao mesmo
   tempo; uma nova execução manual disparada enquanto outra está em
   andamento fica enfileirada, não cancela a anterior.

## Testes

```bash
node testes/executar-hub-selftest-node.js .   # hub-selftest (Fases 2/3), via harness Node
node testes/testar-fase4.js .
node testes/testar-fase5.js .
node testes/testar-fase6.js .

# ou, equivalente, tudo de uma vez:
npm test
```

- `testes/executar-hub-selftest-node.js` — 40/40. Harness Node **mínimo** (sem Playwright/Puppeteer, sem dependência nova) que fornece só o stub de DOM que `testes/hub-selftest.js` espera (`document.getElementById`/`createElement`). **Não altera uma linha de `testes/hub-selftest.js`** — só carrega o arquivo original (junto com `hub-core.js`/`hub-rules.js`, também não alterados) e lê o resumo final (`document.getElementById("resumo")`) que o próprio arquivo já produzia para a tela em `testes/index.html`. Exit code 0 quando o resumo diz "todos passaram"; exit code 1 em qualquer outro caso (inclusive arquivo ausente ou resumo não produzido). `testes/index.html` no navegador continua funcionando exatamente como antes — este harness é uma segunda forma de executar os mesmos 40 casos, não uma substituição.
- `testes/testar-fase6.js` — 22 grupos, 85 casos, cobrindo: snapshot válido (AR e DTE); bloqueio por fonte obrigatória do AR ausente (e confirmação de que `AR_GOVERNANCA` não é obrigatória); falha de leitura; contrato inválido; payload nulo; mudança estrutural; carga parcial (aviso presente, payload válido); preservação do último snapshot válido após falha; escrita atômica (incluindo falha simulada entre gravar o snapshot e atualizar o `latest`); independência entre módulos; hash estável e hash alterado (por payload, `schemaVersion`, `sourceId`, `referencePeriod`, `quality` e ordem de array); `capturedAt` e `lineage.timestamp` fora do hash; reexecução idêntica sem duplicação; relatório de sucesso e de falha persistidos condicionalmente; publicação como *artifact*; verificação de caminhos autorizados (incluindo renames); retenção (identificação sem exclusão); e `rollback-info` como operação somente leitura.
- `testes/testar-fase4.js` — 42/42 (regressão, arquivo não alterado por esta fase).
- `testes/testar-fase5.js` — 96/96 (regressão, arquivo não alterado por esta fase). **Efeito colateral conhecido, pré-existente**: regenera `engenharia-operacional/piloto/saida-canonica-exemplo.json` a cada execução — é por isso que o workflow tem um step de `git checkout -- .` logo depois das quatro suítes, antes de qualquer escrita do snapshot (ver `.github/workflows/snapshot.yml`).

**Total: 263/263 aprovados, 0 reprovados** — reproduzível integralmente a partir dos arquivos desta entrega, sem depender de nenhuma ferramenta externa não versionada. É exatamente essa sequência que o workflow (`.github/workflows/snapshot.yml`) executa, nesta ordem, antes de processar qualquer módulo de snapshot.
