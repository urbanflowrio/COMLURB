# HUB COMLURB · UrbanFlow Core v1 — Status de Implementação

## Fase atual: Fase 4 — Piloto AR

**Implementação: concluída.**
**Publicação: já ocorreu** em `https://urbanflowrio.github.io/COMLURB/ar/piloto/`.
**Auditoria/aprovação: ainda pendente.** A primeira execução com dados
reais encontrou 2 divergências de campo (E08, P01 — campo `atingimento`)
e resultou em status PENDENTE DE REVISÃO. Este documento registra o
diagnóstico, a causa-raiz e a correção mínima aplicada (ver "Correção
pós-publicação" abaixo). A aprovação formal continua exigindo uma nova
execução com dados reais em navegador, com decisão humana explícita da
proprietária do produto — não é dada como certa por esta correção.
**Próxima ação autorizada: publicar esta correção e validar novamente o
piloto com dados reais.** Nenhuma ação além dessa está autorizada agora.
**Fase 5: NÃO autorizada.** Nada deste documento ou desta entrega inicia,
prepara ou antecipa a Fase 5.

Este documento não existia em `main` antes da primeira entrega desta
fase (conferido por verificação direta do repositório, não presumido).

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
