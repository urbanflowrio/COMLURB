# HUB COMLURB · UrbanFlow Core v1 — Status de Implementação

## Fase atual: Fase 5 — Piloto Engenharia (Piloto B)

**Fase 4 — Piloto AR: concluída e aprovada.**

**Validação em navegador com dados reais: concluída**, contra a
publicação em `https://urbanflowrio.github.io/COMLURB/ar/piloto/`.
Resultado: Legado 13 indicadores, Nova arquitetura 13 indicadores, 0
divergências de campo, 1 divergência de bônus (aceita e formalmente
explicada pela governança — `combinacaoECPLiberada = false`), pendência
institucional E03 registrada, três fontes operacionais carregadas
corretamente. Suíte final: 42/42 casos aprovados, 0 reprovados.

**Aprovação humana explícita: registrada.** A proprietária do produto
aprovou formalmente a comparação Legado × Nova Arquitetura do Piloto A
(AR) nesta data, com o resultado acima.

**Fase 5 — Piloto Engenharia/DTE: implementada nesta rodada.**

**Escopo confirmado pela proprietária do produto:** a única fonte
oficial do Piloto B é a aba geral da planilha "Relatório Mensal DTE"
(`DTE_RELATORIO_GERAL`). As outras cinco fontes do painel atual e os 11
blocos analíticos do antigo DTE ficam fora do escopo. Não se recriou o
painel, não se alterou sua estética, o Adapter não foi conectado à
produção. `hub-rules-engenharia.js` não foi criado (nenhuma
classificação por limiar/status/score nesta fase).

**Decisões de governança aplicadas nesta rodada (aprovadas pela
proprietária do produto):**
1. Vazio/"-"/"—"/inválido → `null` sempre; zero literal → `0`. O
   Adapter DTE nunca converte ausência em zero. Divergências causadas
   por essa regra no legado/base vertical são esperadas e registradas
   pelo harness, não reproduzidas.
2. Locator: `DTE_RELATORIO_GERAL` (nome aprovado).
3. Detecção de bloco e subgrupo é estrutural e explícita — nunca
   heurística por palavra-chave. Bloco A: algarismo romano. Blocos B/C/D:
   lista nomeada de cabeçalhos confirmados nos dados reais, isolada
   dentro do Adapter DTE. Cabeçalho não reconhecido gera bloqueio
   explícito de linha, nunca é tratado como indicador.
   - **Extensão de governança, justificada por achado real**: a
     detecção de BLOCO em si também usa whitelist (A/B/C/D), não só
     regex genérico de letra maiúscula — porque as letras C e D também
     são algarismos romanos válidos (100 e 500), criando ambiguidade
     estrutural real entre "bloco" e "subgrupo romano" que um regex
     puramente estrutural não resolveria de forma segura. Ver
     comentário de cabeçalho de `hub-ingest-adapter-dte.js`.
4. Par "Gerência Ofensora N" (categórica) + linha de valor associada
   vira um único registro canônico, preservando bloco, subgrupo,
   ocorrência, período, posição, código, valor, unidade (quando
   conhecida), rótulos brutos e lineage. Aceita qualquer N válido (não
   limita a 3 — confirmado N=7 nos dados reais). Falha explícita
   (bloqueio de linha) se a linha seguinte não estiver estruturalmente
   associada — nunca inventa valor.
   - **Achado real durante a implementação**: a linha de valor
     associada NEM SEMPRE vem sem rótulo, como descrito originalmente —
     em vários casos repete o rótulo do indicador-pai (ex.: "Valor de
     Horas Extras - Gerência"). Isso NÃO desqualifica a associação; o
     critério real de desqualificação é a linha seguinte ser
     estruturalmente outra coisa (novo bloco, novo subgrupo, nova linha
     de período, ou outra "Gerência Ofensora"). O rótulo da linha de
     valor, quando presente, é preservado em `rotulosBrutos.linhaValor`.

**Achados estruturais adicionais, descobertos só com os dados reais
completos (não previstos no diagnóstico da rodada anterior):**
- O período pode vir na MESMA linha do rótulo do subgrupo (romano ou
  catalogado) ou em linha separada logo abaixo — de forma inconsistente
  mesmo dentro do próprio Bloco A (ex.: "I -" tem período na mesma
  linha; "II -" tem período em linha separada). O Adapter trata os dois
  casos.
- Bloco C não tem nenhum subgrupo confirmado nos dados reais — os
  indicadores ficam direto sob um subgrupo implícito vazio.
- Conversão numérica: valores na casa dos milhões (ex. biogás em Nm³,
  "16.257.432") têm MAIS de um separador de milhar pt-BR. A primeira
  versão do conversor autocontido (`numDTE`, mesma lógica de
  `numAR` do Piloto A) só reconhecia um separador — corrigido para
  aceitar qualquer quantidade de agrupamentos de 3 dígitos. Encontrado
  e corrigido durante a comparação com a base vertical (ver relatório
  de comparação).

**Testes — resultado inicial, anterior à correção pós-auditoria do
Validator (ver seção "Correção pós-auditoria" abaixo, que substitui
esta contagem):**
- Fase 5 (`testes/testar-fase5.js`): 50/50 aprovados, 0 reprovados.
  Inclui: Locator, conversão numérica, detecção de período, bloco/
  subgrupo não reconhecido (falha explícita), Gerência Ofensora (N
  arbitrário, união de par, rótulo próprio na linha de valor, par
  malformado), Bloco C sem subgrupo, falha segura para fonte vazia, e
  execução completa contra os dados reais enviados nesta fase (1118
  indicadores, 546 gerências ofensoras, 35 anotações ignoradas, 13
  períodos, zero bloqueios, zero erros).
- Fase 4 (`testes/testar-fase4.js`), reexecutada para confirmar
  ausência de regressão: 42/42 aprovados, 0 reprovados — nenhum
  arquivo da Fase 4 foi alterado por esta entrega (só `hub-sources.js`
  recebeu uma fonte nova, aditiva).

**Comparação com a base vertical (`engenharia-operacional/piloto/
relatorio-comparacao.json`, gerado contra os dados reais enviados
nesta fase):** 938 valores comparados diretamente, **0 divergências
reais**, 156 linhas da base vertical sem correspondência direta — todas
explicadas pela mesma limitação conhecida (a base vertical reaproveita
o rótulo do indicador-pai como rótulo da linha de valor de gerência
ofensora, produzindo múltiplas linhas com o mesmo rótulo por período;
o modelo canônico correta e deliberadamente não duplica essas linhas
como indicador — elas já estão em `gerenciasOfensoras`). Limitações
conhecidas da base vertical (perda de subgrupo nas linhas de gerência
ofensora, unidade de medida inconsistente, ausência convertida em
zero) documentadas em `harness.js` e não reproduzidas no Adapter.

**Arquivos novos desta entrega (10):**
- `assets/components/hub-ingest-adapter-dte.js`
- `engenharia-operacional/piloto/index.html`
- `engenharia-operacional/piloto/harness.js`
- `engenharia-operacional/piloto/README.md`
- `engenharia-operacional/piloto/base-vertical-amostra.json`
- `engenharia-operacional/piloto/saida-canonica-exemplo.json`
- `engenharia-operacional/piloto/relatorio-comparacao.json`
- `testes/testar-fase5.js`
- `testes/fixtures/dte-geral-real.csv`
- `testes/fixtures/base-vertical-export-hub.json`

**Arquivos alterados desta entrega (2):**
- `assets/components/hub-sources.js` — fonte `DTE_RELATORIO_GERAL`
  adicionada (aditivo, nenhuma fonte existente foi tocada; cabeçalho
  do arquivo também corrigido para não afirmar mais exclusividade da
  Fase 4).
- `docs/architecture/IMPLEMENTATION_STATUS.md` — este documento.

**Nenhum painel de produção foi alterado.** O componente compartilhado
`hub-sources.js` foi alterado apenas de forma aditiva para registrar
`DTE_RELATORIO_GERAL`, sem tocar nenhuma fonte existente. O pipeline do
DTE é: **Locator → Reader → Decoder local DTE (autocontido dentro de
`hub-ingest-adapter-dte.js`, via Papa.parse direto sobre o texto bruto)
→ Adapter → Validator → modelo canônico** — não usa o Decoder genérico
(`hub-ingest-decoder.js`), cujo contrato de cabeçalho único não serve
ao formato largo seccionado da fonte (ver nota de cabeçalho do
Adapter). Nenhum EXPORT_HUB foi criado. Nenhuma estética foi alterada.

**Correção pós-auditoria desta rodada — Validator (decisão de
governança aplicada retroativamente):** qualquer bloqueio estrutural
(bloco/subgrupo/romano não reconhecido, período sem bloco/subgrupo,
indicador ou gerência ofensora sem contexto válido, par de gerência
ofensora malformado ou com associação ambígua) agora entra em
`quality.erros` e invalida `envelope.payload` (torna-se `null`) — nunca
mais um aviso que permitisse publicar carga parcial quando a planilha
ganha uma estrutura nova não reconhecida. `indicadores` e
`gerenciasOfensoras` continuam retornados fora do envelope, só para
diagnóstico. Anotações confirmadas da fonte (`notas`) continuam aviso,
não erro — são reconhecidas corretamente como não-dado, não uma
estrutura desconhecida.

**Testes — duas contagens separadas, reexecutadas após a correção:**
- **Fase 5 (`testes/testar-fase5.js`): 55/55 aprovados, 0 reprovados**
  (49 anteriores + 1 corrigido + 5 novos casos de carga parcial/
  correção do Validator).
- **Fase 4 (`testes/testar-fase4.js`), reexecutada: 42/42 aprovados, 0
  reprovados** — sem regressão.

**Limitação de ambiente, já registrada na Fase 4**: este ambiente de
build não acessa `docs.google.com` — a suíte e o harness rodam contra
os dados reais enviados nesta fase (xlsx + Apps Script), convertidos
para o mesmo formato de CSV publicado pelo Google Sheets, não contra a
URL ao vivo. A validação em navegador real (como a página
`engenharia-operacional/piloto/index.html` faz, quando publicada)
ainda depende da proprietária do produto rodá-la a partir do GitHub
Pages, do mesmo jeito que a Fase 4 foi validada.

**Fase 6: NÃO autorizada.** Nada deste documento ou desta entrega
inicia, prepara ou antecipa a Fase 6.

Este documento não existia em `main` antes da primeira entrega da Fase 4
(conferido por verificação direta do repositório, não presumido). Esta
entrega é uma atualização pontual do mesmo arquivo.

---

## O que esta fase entrega

Cadeia completa `Locator → Reader → Decoder → Adapter AR → Validator →
Modelo canônico (indicadores_metas, já aprovado) → hub-rules + hub-rules-ar
→ State`, rodando em paralelo ao legado (`ar/index.html`, não alterado),
com harness de comparação legado × novo. Mesma arquitetura aprovada na
Fase 3 — nenhuma decisão arquitetural foi reaberta nesta entrega.

## Correção de auditoria — contagem de fontes (item 1)

`hub-sources.js` registra **quatro** fontes do AR: `AR_GERAL`, `AR_2026`,
`AR_MAPEAMENTO`, `AR_GOVERNANCA` — mesma lista de `ar-config.js`, por
completude de contrato.

**Apenas três são operacionais nesta fase**: `AR_GERAL`, `AR_2026`,
`AR_MAPEAMENTO`. São as mesmas três que `ar/index.html` (legado) já lê
hoje. O Adapter AR (`hub-ingest-adapter-ar.js`) busca só essas três; o
piloto (`ar/piloto/index.html`) compara só essas três.

`AR_GOVERNANCA` fica registrada no Locator, sem consumidor. Nenhum código
desta entrega força seu uso para fechar a contagem em quatro. Confirmado
por teste automatizado (ver seção de testes): ao rodar o Adapter AR com
`fetchImpl` instrumentado para contar chamadas, exatamente 3 URLs são
buscadas, e a URL de `AR_GOVERNANCA` nunca aparece entre elas.

Toda menção anterior a "o piloto carrega quatro fontes" estava incorreta
e foi corrigida nesta entrega (`hub-sources.js`, `ar/piloto/index.html`,
`ar/piloto/README.md`).

## Dependência real encontrada em `main` (não presumida — verificada)

Verificação direta do repositório (`codeload.github.com`, 15/07/2026)
encontrou que:

- `assets/components/hub-utils.js` publicado é uma versão **anterior à
  "Fase 2"**: não chama `HUB.require`/`HUB.registerComponent`, não expõe
  `HUB.format.toNumberBR`. Qualquer arquivo desta fase que dependesse
  dessa API quebraria a página assim que publicada.
- `assets/components/hub-sources.js` e `assets/components/hub-state.js`
  (genérico) **não existem** em `main`.
- `ar/index.html` (legado) em `main` tem sua própria função `num()`
  autocontida (não delega para `HUB.format.toNumberBR`) — diferente de
  uma versão anterior deste piloto que assumia essa delegação e teria
  quebrado ao publicar.
- `testes/hub-selftest.js` em `main` tem 133 casos, seis grupos, nenhum
  cobrindo ingestão — é uma versão anterior à que cobria Fases 2/3.
- Já existe em `main` uma cópia de `harness.js` no caminho errado:
  `ar/piloto/piloto/harness.js` (pasta aninhada por engano). Idêntica ao
  `harness.js` correto desta entrega — sobra de um envio anterior.

**Consequência**: todos os arquivos novos desta entrega dependem apenas
de `hub-core.js` (e, quando necessário, `hub-rules.js`) — ambos já
publicados em `main`, e não modificados por esta entrega. Nenhum deles
depende de `hub-utils.js` ou de `hub-state.js`. Isso não é uma decisão de
arquitetura nova: é a mesma arquitetura da Fase 3, implementada de forma a
não quebrar contra o que está realmente publicado.

## Pendência institucional registrada — E03

A memória do produto menciona uma regra binária "Top-5/fora do Top-5"
para E03 (ranking nacional SINISA). Não encontrada em `ar/index.html` nem
em nenhum documento presente nesta entrega. **Nenhuma regra nova foi
implementada para E03** — nem no harness, nem em `hub-rules-ar.js`. Legado
e novo pipeline concordam entre si (os dois usam o mesmo cálculo genérico
de status), então não há divergência legado×novo neste campo — mas a
pendência de decisão institucional continua registrada em
`hub-rules-ar.js` (`BLOQUEIOS_PENDENTES`) e agora também é exibida na
página do piloto: quando E03 está presente E a comparação está aprovada,
`ar/piloto/index.html` não mostra apenas "APROVADO" — mostra "COMPARAÇÃO
LEGADO × NOVA ARQUITETURA APROVADA — PENDÊNCIA INSTITUCIONAL E03
REGISTRADA." Essa é uma correção de exibição no piloto, não uma mudança no
harness nem uma regra nova de cálculo.

## Divergência de bonificação E+C+P — aceita como decisão de governança

`hub-core.js` (não modificado por esta entrega) já registra
`HUB.config.combinacaoECPLiberada = false`, com o comentário "enquanto
false, hub-rules-ar deve retornar `{bloqueado:true}`". O legado ignora
essa flag e sempre soma `regE.pct + regC.pct + bonusPerformance`. O novo
pipeline obedece à governança já registrada em `hub-core.js` — decisão
mais recente e mais autoritativa que o comportamento do painel — e expõe
`bonus.bloqueado = true`, `bonus.bonusTotal = null`, preservando o valor
que *seria* exibido em `bonus.bonusTotalSeLiberado` só para comparação.
**Decisão: aceita.** Não é defeito do novo pipeline; requer confirmação
explícita da Presidência/CVL para destravar (mudar
`HUB.config.combinacaoECPLiberada` para `true`), não correção de código.
O harness classifica essa divergência com `decisao: "ACEITA"`, nunca
"PENDENTE".

---

## Correção pós-publicação — divergência de atingimento (E08/P01)

**Contexto**: após publicação real (`https://urbanflowrio.github.io/COMLURB/ar/piloto/`),
o piloto rodou contra dados reais e reportou: Legado 13 indicadores, Novo
13 indicadores, 2 divergências de campo (E08 e P01, campo `atingimento`:
legado `0`, novo `null`), 1 divergência de bônus (a esperada, `bonusTotal`
— governança E+C+P, inalterada), status PENDENTE DE REVISÃO.

**Rastreamento**: nem E08 nem P01 tiveram divergência reportada em
`realizado(atual)`, `meta`, `unidade` ou `sentido` — só em `atingimento`.
Pela própria mecânica do harness (que compara esses campos
separadamente), isso prova que Reader → Decoder → Adapter produziram o
mesmo `atual` e `meta` nos dois pipelines. O ponto de divergência estava
isolado no cálculo do campo `atingimento` em `hub-rules-ar.js`.

**Causa-raiz**: `aplicarRegrasIndicador()` (v1.1.0) exigia `atual !== 0`
para calcular o campo `atingimento`. Essa guarda nunca existiu no legado
para esse campo especificamente — `ar/index.html · processar()` só exige
`atual≠null`, `meta≠null`, `meta≠0` para calcular `d.atingimento`, e
calcula normalmente `0/meta = 0` quando `atual=0` e `meta>0`. O legado
trata "status" (guarda ampla: `atual===0` → "Sem dado") e "atingimento"
(guarda estrita: só `meta≠0`) como duas contas separadas, com regras
diferentes. A guarda extra em `atingimento` foi um erro de implementação
desta entrega, copiada por engano da guarda de `status`.

**Decisão**: `0` é o resultado correto, não `null`. Os dados permitem
calcular validamente o atingimento (`meta≠0`, `atual` é um número real e
válido — `calcValue()`/`num()` nunca produzem `0` a partir de célula
vazia ou inválida, só de um "0" literal na planilha). Preservar `null`
teria violado a regra de não esconder um cálculo válido atrás de um
estado de ausência. `status` não muda — continua "Sem dado" quando
`atual=0`, que é o comportamento real e correto do legado.

**Arquivo alterado**: `assets/components/hub-rules-ar.js` (v1.1.0 →
v1.2.0), função `aplicarRegrasIndicador` — só o cálculo do campo
`atingimento`. `status`, `tendência`, bonificação, e todas as regras de
outros indicadores permanecem exatamente como estavam. Nenhum outro
arquivo desta entrega foi tocado.

**Risco de regressão**: baixo e localizado. Afeta só indicadores com
`atual===0` e `meta≠0` (deixam de ser `null` e passam a mostrar o valor
numérico real: `0` para maior_melhor, ou `Infinity` para menor_melhor —
mesma fórmula não guardada que o legado sempre teve). Não afeta
indicadores com `meta===0` (continuam `null`) nem `atual===null`
(continuam `null`). Não afeta `status`, `bônus`, `tendência`, nem regras
de E03, C01/C02, ou qualquer outro indicador.

**Testes adicionais**: grupo novo "Correção E08/P01 — atingimento com
atual=0", 9 casos: maior_melhor com atual=0 (resultado 0, status "Sem
dado"), menor_melhor com atual=0 (resultado Infinity — mesma fórmula não
guardada do legado), caso proporcional (SOMA/Mensal) com atual=0
(resultado 0, guarda `metaProporcional > 0` preservada), meta=0 (continua
`null`, única guarda real do campo), e uma comparação direta contra
`AR_LEGADO.processar()` confirmando zero divergências de campo para todos
esses casos.

**Resultado dos testes após a correção** (mesmo comando, mesma suíte):
```
node testes/testar-fase4.js .
```
- **GRUPOS TESTADOS: 7** (6 anteriores + 1 novo)
- **TOTAL: 42 casos**
- **APROVADOS: 42**
- **REPROVADOS: 0**

## Classificação dos arquivos — publicação base da Fase 4 (rodada anterior, já publicada) corretiva

**1 arquivo alterado** (já existente nas entregas anteriores desta fase):
- `assets/components/hub-rules-ar.js` — correção do campo `atingimento`.

**2 arquivos atualizados** (conteúdo, mesmo caminho das entregas
anteriores):
- `testes/testar-fase4.js` — grupo de teste novo (E08/P01).
- `docs/architecture/IMPLEMENTATION_STATUS.md` — esta seção.

**Nenhum arquivo novo. Nenhum componente novo.** Nenhum outro arquivo
desta fase foi tocado por esta correção.



`docs/architecture/IMPLEMENTATION_STATUS.md` não existe em `main`
(verificado por consulta direta ao repositório, não presumido) —
portanto é tecnicamente um arquivo **novo**, não alterado. Mesmo
critério para `testes/testar-fase4.js`.

**12 arquivos novos:**
1. `assets/components/hub-sources.js`
2. `assets/components/hub-ingest-model.js`
3. `assets/components/hub-ingest-reader.js`
4. `assets/components/hub-ingest-decoder.js`
5. `assets/components/hub-ingest-adapter-ar.js`
6. `assets/components/hub-rules-ar.js`
7. `assets/components/hub-state-ar.js`
8. `ar/piloto/index.html`
9. `ar/piloto/harness.js`
10. `ar/piloto/legado-referencia.js`
11. `docs/architecture/IMPLEMENTATION_STATUS.md` (este arquivo)
12. `testes/testar-fase4.js` (suíte reproduzível, ver seção de testes)

**1 arquivo alterado:**
1. `ar/piloto/README.md` (já existe em `main`, conteúdo substituído)

**Nenhum arquivo de `main` fora desta lista foi tocado.** Em particular,
não foram alterados: `ar/index.html`, `ar/ar-config.js`, `hub-core.js`,
`hub-rules.js`, `hub-utils.js`, a home (`index.html` da raiz),
`testes/hub-selftest.js`/`testes/index.html` (suíte pré-existente de
Fases 2/3), ou qualquer outro módulo (Pessoas, IPL, Território,
Contratos, Engenharia, Balanço).

**Arquivo a apagar em `main` (não incluído neste ZIP — ação de limpeza):**
- `ar/piloto/piloto/harness.js` e a pasta `ar/piloto/piloto/` — cópia no
  caminho errado, sobra de um envio anterior, substituída pelo
  `ar/piloto/harness.js` correto desta entrega.

---

## Testes — execução auditável e reproduzível

**Suíte incluída neste ZIP**: `testes/testar-fase4.js` (não existe em
`main` — arquivo novo desta entrega).

**Pré-requisito**: `npm install papaparse` (mesma dependência que os
próprios painéis já usam via CDN; aqui é usada em Node).

**Comando exato**, a partir da raiz do repositório (com este ZIP já
mesclado sobre um checkout de `main` — `hub-core.js`/`hub-rules.js` já
existem em `main` e não são reenviados por esta entrega, mas precisam
estar presentes na mesma raiz para a suíte rodar):

```
node testes/testar-fase4.js .
```

**Resultado:**
- **GRUPOS TESTADOS: 6**
  1. Locator — 4 registradas, 3 operacionais (5 casos)
  2. Reader remote-csv — mecanismo (5 casos)
  3. Adapter AR — confirma consumo de só 3 fontes (4 casos)
  4. Adapter AR + Validator + Modelo canônico (5 casos)
  5. hub-rules-ar — regras específicas (7 casos)
  6. Harness legado×novo — mecanismo e pendência E03 (7 casos)
- **TOTAL: 33 casos**
- **APROVADOS: 33**
- **REPROVADOS: 0**
- **Específicos da Fase 4: 33 de 33** (100% — a suíte cobre só Fase 4;
  os 133 casos pré-existentes de `testes/hub-selftest.js` em `main` não
  foram re-executados porque `hub-core.js`/`hub-rules.js`/`hub-utils.js`
  não foram modificados por esta entrega, então seu comportamento é
  inalterado por construção, não por suposição).

**Confirmação de que o teste usou os arquivos do próprio ZIP**: a suíte
foi executada apontando para uma raiz onde os arquivos deste ZIP (versão
final, pós-auditoria) foram extraídos por cima de um checkout real de
`main` — a mesma operação que a publicação fará. A suíte imprime, no
início da própria saída, o caminho completo de cada arquivo carregado
(`hub-core.js`/`hub-rules.js` de `main`, mais os 7 arquivos novos de
`assets/components/` e os 3 de `ar/piloto/` desta entrega), para
conferência linha a linha por qualquer pessoa que repetir o comando.
Nenhuma falha real foi encontrada nesta execução — por isso nenhum
arquivo funcional já aprovado em auditorias anteriores foi alterado
nesta rodada (regra de execução 6).

---

## Confirmações exigidas

- **`ar/index.html` não foi alterado.**
- **`ar/ar-config.js` não foi alterado.**
- **`hub-core.js` não foi alterado.**
- **`hub-rules.js` não foi alterado.**
- **`hub-utils.js` não foi alterado** (e nenhum arquivo novo depende dele).
- **Home e outros módulos não foram alterados.**
- **Render visual do AR permanece idêntico** (consequência direta do
  legado não ter sido tocado).
- **Rollback trivial**: como nenhum arquivo consumido pelo legado foi
  alterado, não há nada a reverter no caminho de produção.
- **Nenhuma regra nova foi criada para E03** — só a exibição no piloto foi
  corrigida para nunca esconder a pendência atrás de "APROVADO".
- **Nenhum valor inválido vira zero** em nenhum ponto do pipeline (meta/
  atual ausentes ou não numéricos permanecem `null`; ver testes 4.4/4.5).
- **Nenhum dado sensível é exposto**: as quatro fontes do AR são públicas,
  sem dado pessoal individual.
- **Nenhum passo manual foi adicionado à atualização** além de publicar
  os arquivos deste ZIP e apagar `ar/piloto/piloto/` (limpeza de uma
  sobra já existente, não uma etapa nova introduzida por esta entrega).

## Não executado nesta fase

- Validação com dados reais das três fontes em navegador com rede (o
  ambiente usado para produzir esta entrega não acessa `docs.google.com`
  — mecanismo comprovado com `fetchImpl` mockado e fixtures sintéticas,
  não com dados de produção).
- Aprovação humana do piloto.
- Qualquer atividade de Fase 5.
- Qualquer alteração em Engenharia/DTE (Piloto B).
- Snapshot automático, GitHub Actions, backend, ou qualquer componente
  não explicitamente listado nesta entrega.
