# HUB COMLURB · UrbanFlow Core v1 — Status de Implementação

## Fase atual: Fase 7A — Infraestrutura de leitura de snapshots (sem conexão a painéis)

**Fases 1 a 5: concluídas.** Fase 5 reconfirmada em navegador com a
fonte real, após a correção dos percentuais publicados pelo Google
Sheets — resultado oficial vigente abaixo (inalterado desde a
confirmação da proprietária do produto). A observação de "validação
pendente" que aparecia no histórico detalhado desta mesma seção,
abaixo, é um registro de um estado intermediário anterior a essa
reconfirmação — não representa o status atual.

**Fase 6: concluída e fechada.** Publicação em `main` realizada,
primeira execução manual real do workflow concluída com sucesso
(`workflow_dispatch`, conclusão `success`), artifact do relatório de
execução publicado, primeiro snapshot real de AR criado, primeiro
snapshot real de Engenharia/DTE criado, `latest.json` dos dois módulos
criado e apontando para os respectivos snapshots, commit automático do
bot restrito a `data/` (verificado por `verify-paths` antes do
commit), workflow semanal ativo (`cron: '0 11 * * 1'`), tag e release
`fase-6-concluida` publicadas. Suíte completa desta rodada: 263/263
aprovados, 0 reprovados (`hub-selftest` 40/40, Fase 4 42/42, Fase 5
96/96, Fase 6 85/85). Ver seção "Fase 6" ao final deste documento e
`snapshot/README.md` para o relatório completo (arquitetura, formato
do snapshot, hash, retenção, rollback, custo, riscos) — nenhum desses
dois arquivos foi alterado por esta entrega.

**Fase 7A: implementada nesta entrega**, escopo travado em
infraestrutura genérica de leitura/validação/comparação de snapshots
(`hub-snapshot-reader.js`, `hub-data-source.js`), sem qualquer conexão
a painel de produção. Modo vigente em produção continua sendo
exclusivamente a leitura de CSV ao vivo — inalterada. Ver seção "Fase
7A" ao final deste documento.

## Fase 5 concluída e validada (mantido para referência)

**Fase 5 — Piloto Engenharia/DTE: concluída e aprovada em navegador com dados reais.**

**Validação final publicada:** `https://urbanflowrio.github.io/COMLURB/engenharia-operacional/piloto/`

**Resultado oficial vigente:**
- 957 indicadores extraídos;
- 624 registros de gerências ofensoras;
- 13 períodos reconhecidos;
- 0 bloqueios estruturais;
- 0 erros de validação;
- 725 comparações realizadas com segurança;
- 0 divergências numéricas reais;
- 208 registros não comparáveis por perda de contexto da base vertical;
- 161 registros sem correspondência direta na base vertical;
- 0 divergências esperadas entre `null` e zero;
- defasagem temporal de 4 dias registrada e tratada como limitação da comparação;
- suíte final da Fase 5: 96/96 aprovados, 0 reprovados;
- suíte da Fase 4 preservada: 42/42 aprovados, 0 reprovados;
- aprovação humana explícita registrada pela proprietária do produto.

Os 208 registros não comparáveis e os 161 sem correspondência não são falhas do Adapter DTE. Decorrem das limitações estruturais da antiga base `EXPORT_HUB_ENGENHARIA`, que não preserva dimensões como `criterio` e `subgrupoOcorrencia`. O modelo canônico preserva essas dimensões e não foi degradado para reproduzir a perda de contexto da base vertical.

## Concluído
- [x] Fase 1
- [x] Fase 2
- [x] Fase 3
- [x] Fase 4 — Piloto AR validado em produção
- [x] Fase 5 — Piloto Engenharia/DTE validado em produção (reconfirmado em navegador pós-correção de percentuais)
- [x] Fase 6 — Snapshot automático e validação antecipada (AR e Engenharia/DTE): publicada, primeira execução real concluída com sucesso, tag/release `fase-6-concluida` publicadas, snapshots reais dos dois módulos em `data/`. Fechada.
- [x] Fase 7A — Infraestrutura genérica de leitura/validação/comparação de snapshots (`hub-snapshot-reader.js`, `hub-data-source.js`), implementada e testada nesta entrega, sem conexão a painel de produção (ver seção "Fase 7A").

## Próxima ação autorizada
Publicar os arquivos da Fase 7A, revisar, e validar via `node testes/testar-fase7a.js .` (ver seção "Fase 7A" · "Testes"). **A Fase 7B não está autorizada.**

## Ações não autorizadas
- Iniciar a Fase 7B ou 7C;
- ativar o modo `snapshot` em qualquer painel de produção;
- conectar `hub-snapshot-reader.js`/`hub-data-source.js` a `ar/index.html`, `engenharia-operacional/index.html` ou qualquer outro painel;
- remover ou alterar qualquer fetch de CSV ao vivo existente;
- alterar qualquer URL de fonte (Google Sheets);
- recalcular qualquer regra de negócio;
- iniciar novos módulos;
- incluir Pessoas;
- incluir fontes restritas;
- alterar a home;
- recriar o painel Engenharia;
- criar backend;
- criar banco de dados;
- alterar os pilotos aprovados sem nova evidência;
- alterar Adapters, Readers, Model, Rules, State ou painéis de produção;
- alterar qualquer arquivo de `snapshot/lib/`, `snapshot/run.js` ou `.github/workflows/snapshot.yml` (Fase 6, intocada por esta entrega).

---

## Histórico detalhado da implementação da Fase 5
### Correção de integração pós-publicação — index × harness

Após a publicação da versão com o contrato novo do harness, o piloto falhou no navegador com `Cannot read properties of undefined (reading 'length')`. A causa foi a permanência, em `engenharia-operacional/piloto/index.html`, de referências ao campo removido `relatorio.divergenciasReais`. O harness vigente expõe `divergenciasNumericasReais`, `naoComparaveisPorPerdaDeContexto`, `semCorrespondencia` e `divergenciasEsperadasNullZero`.

Correção aplicada somente na integração da página: o `index.html` passou a consumir o contrato atual, exibir cada categoria separadamente e aprovar tecnicamente apenas quando há payload válido, zero bloqueios, zero erros e zero divergências numéricas reais. Limitações da base vertical permanecem visíveis, mas não são tratadas como falha do Adapter. Foi adicionado teste estático de integração para impedir regressão do nome antigo.

**Suíte após esta correção:** foram adicionados 6 testes de integração, elevando o total esperado da Fase 5 de 86 para 92 casos. Neste ambiente, a reexecução completa não foi possível porque a entrega incremental não contém a `main` completa nem a dependência Node `papaparse`; a sintaxe dos arquivos alterados foi validada. Antes da aprovação final, execute `node testes/testar-fase5.js .` e `node testes/testar-fase4.js .` sobre a `main` atual. Registro histórico: naquele momento, a Fase 5 ainda permanecia pendente de reexecução e nova validação ao vivo.


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

**Nota importante sobre estes números**: eles são idênticos antes e
depois da correção da colisão de chave do harness (ver seção
"Correção pós-auditoria (2)" abaixo) porque, contra esta fixture
**congelada** (canônico e base vertical do mesmo instante), a colisão
ficava mascarada por coincidência numérica — algum candidato colidido
batia por acaso com o valor comparado. A colisão só se tornou visível
quando o piloto rodou contra a **fonte ao vivo** publicada em
`https://urbanflowrio.github.io/COMLURB/engenharia-operacional/piloto/`,
que retornou 312 divergências reais. Isso não significa que a fixture
estática deixou de ser útil — significa que ela sozinha não bastava
para expor esse bug específico, e por isso a Fase 5 ainda depende de
nova validação em navegador (ver "Fase 5 pendente" ao final desta
seção).

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

**Nota de proveniência desta rodada específica (correção dos
Mecanismos A, B e C)**: dos 10 arquivos novos listados acima, esta
rodada revisou o conteúdo de `assets/components/hub-ingest-adapter-dte.js`
(Mecanismo A: consumo de múltiplas linhas associadas à Gerência
Ofensora; Mecanismo B: dimensão critério), `engenharia-operacional/
piloto/harness.js` (Mecanismo C: categorização não-comparável; correção
de rotulagem), `testes/testar-fase5.js` (20 novos casos), e regenerou
`engenharia-operacional/piloto/saida-canonica-exemplo.json` e
`engenharia-operacional/piloto/relatorio-comparacao.json`. **Esta é a
primeira rodada em que `hub-ingest-adapter-dte.js` é alterado desde a
entrega original da Fase 5** — as duas rodadas anteriores de correção
pós-auditoria não tocaram nele; esta rodada corrige a causa raiz real
das 312 divergências observadas ao vivo, que estava no Adapter, não
apenas no harness.

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

**Correção pós-auditoria (2) desta rodada — `engenharia-operacional/
piloto/harness.js`: colisão de chave de comparação.**

- **Causa-raiz confirmada**: a chave de comparação do harness só
  incluía o subgrupo/critério para o Bloco A. Isso generalizou por
  engano, para os Blocos B e D, uma exceção que só era válida para o
  Bloco C (onde o subgrupo registrado pela base vertical é
  comprovadamente não confiável — achado já documentado). Sem o
  subgrupo na chave, qualquer rótulo de indicador repetido em mais de
  um subgrupo dentro do mesmo bloco colidia em um único balde de
  candidatos. Confirmado empiricamente, contra a própria fixture desta
  fase: 6 grupos de rótulo colidindo só no Bloco B (ex.: "Peso Coletado
  / Capacidade Estimada (t)" em 7 subgrupos diferentes), totalizando
  ≈23% dos registros canônicos do Bloco B.
- **Por que não apareceu antes**: contra a fixture congelada (canônico
  e base vertical gerados no mesmo instante), a colisão ficava mascarada
  — por coincidência numérica, algum dos candidatos colididos batia por
  acaso com o valor comparado, então nenhuma divergência era reportada.
  Contra a fonte ao vivo (valores já diferentes desde a captura da
  fixture), a coincidência deixou de ocorrer e a ambiguidade virou
  divergência visível, inclusive casos de "canonico: [null, null, ...]"
  quando nenhum candidato colidido batia com o valor da base vertical
  naquele período.
- **Correção aplicada**: a chave agora inclui subgrupo para os Blocos
  A, B e D. **O Bloco C continua como única exceção deliberada e
  documentada** (subgrupo excluído da chave só para ele, porque seu
  rastreamento de subgrupo na base vertical é comprovadamente não
  confiável — não porque o Adapter tenha essa limitação).
- **Distinção importante — bug de chave × descompasso temporal**: são
  duas causas diferentes e independentes, ambas relevantes para
  interpretar divergências desta fase:
  - **Bug de chave** (corrigido nesta rodada): colisão estrutural no
    harness, presente mesmo comparando dois retratos do mesmo instante.
    Já corrigido e testado.
  - **Descompasso temporal** (limitação de comparação, não erro de
    código): a base vertical é um instantâneo estático gerado pelo
    Apps Script em um momento fixo; o canônico pode ser capturado ao
    vivo, em outro momento, da mesma fonte que é atualizada mês a mês.
    O harness agora calcula e relata `defasagemDiasEntreCanonicoEBaseVertical`
    e `possivelDefasagemTemporal` explicitamente — **sem nunca
    reclassificar ou esconder uma divergência real por causa disso**;
    é só contexto para quem interpreta o relatório. Uma divergência de
    valor pode ser causada por atualização normal da fonte no período,
    não necessariamente por um erro do Adapter ou do harness.
- **Adapter DTE**: não foi alterado nesta rodada específica (correção
  2). **Foi alterado na rodada seguinte** — ver "Correção pós-auditoria
  (3)" abaixo, que revisa esta conclusão: o pequeno delta de contagem
  observado ao vivo NÃO era só descompasso temporal — havia também um
  bug real de duplicação no Adapter (Mecanismo A).

**Correção pós-auditoria (3) desta rodada — Mecanismos A, B e C
(diagnóstico completo solicitado pela auditoria, aceito e corrigido).**

- **Mecanismo A — bug de duplicação no Adapter DTE (confirmado e
  corrigido)**: cada bloco "Gerência Ofensora N" pode ter **mais de
  uma** linha de valor associada (ex.: "% Sobrecarga" e "Horas Extras
  (Valor e %)" têm 2 linhas por ofensora — valor absoluto e razão). A
  versão anterior do Adapter só consumia a primeira linha seguinte; a
  segunda linha (quando existia) era reprocessada pelo laço principal
  como indicador comum, criando registros duplicados sob a mesma chave
  (bloco+subgrupo+indicador+período) com valores diferentes — a causa
  raiz real das 312 divergências observadas ao vivo, não a colisão de
  chave do harness (que também era real, mas não a causa dominante).
  **Corrigido em `hub-ingest-adapter-dte.js`**: o Adapter agora consome
  todas as linhas seguintes enquanto não forem estruturais (nunca uma
  contagem fixa), cada uma virando um registro de `gerenciasOfensoras`
  com `indicadorAssociado` preservando qual rótulo aquele valor
  representa. Nenhuma linha de valor associada volta a ser processada
  como indicador comum. Lineage das duas (ou mais) linhas de origem
  preservado.
- **Mecanismo B — critério não modelado (confirmado e corrigido)**: no
  Bloco A, subgrupo "VII - Geração Chorume (m³)", o mesmo indicador
  ("Tratamento Interno", "Tratamento Externo", "Recirculado") se repete
  sob critérios diferentes ("CTR Seriopédica", "Aterro Gramacho (ETC +
  MANEJO)", "Aterro Bangu (REC. + TRAT. EXT)"). **Adicionado ao modelo
  canônico**: `criterio`, `criterioNormalizado`, `linhaOrigemCriterio`
  — preenchidos só quando um cabeçalho de critério estruturalmente
  reconhecido é encontrado (lista nomeada, `CRITERIOS_CONHECIDOS`,
  isolada no Adapter, mesma disciplina de subgrupo — nunca palavra-chave
  livre). Indicador repetido no mesmo bloco/subgrupo/ocorrência SEM que
  um critério catalogado explique a repetição gera bloqueio estrutural
  (`indicador_duplicado_sem_criterio`) — nunca duplicado nem
  sobrescrito silenciosamente. A chave canônica agora distingue bloco +
  subgrupo + subgrupoOcorrência + critério + indicador + período.
- **Mecanismo C — limitação estrutural da base vertical (não
  "corrigida", reconhecida)**: a base vertical não registra
  subgrupoOcorrência nem critério — não há como desambiguar quando o
  modelo canônico distingue corretamente duas séries que a base
  vertical não consegue distinguir (ex.: "P16A - Trator de Praia -
  h/mês" aparece em 2 ocorrências físicas diferentes de "Horas
  Utilizadas / Horas Estimadas (h)" no Bloco B). **Nenhuma tentativa de
  adivinhar a ocorrência foi feita, e `subgrupoOcorrencia` não foi
  removido do canônico.** O harness agora classifica esses casos como
  `NAO_COMPARAVEL_POR_PERDA_DE_CONTEXTO`, nunca como divergência real —
  mesmo quando um dos candidatos canônicos bate por coincidência
  numérica com o valor da base vertical.
- **Rotulagem do relatório corrigida**: `engenharia-operacional/piloto/
  harness.js` agora expõe bloco, subgrupo e indicador em campos
  separados e corretos em toda saída (semCorrespondencia,
  divergenciasNumericasReais, naoComparaveisPorPerdaDeContexto,
  divergenciasEsperadasNullZero) — nunca mais expõe o subgrupo da base
  vertical (coluna "Indicador") como se fosse o indicador real (que
  está em "Unidade_Operacional").
- **Categorias finais do relatório de comparação** (`resumo`):
  `comparadosComSeguranca`, `divergenciasNumericasReais`,
  `naoComparaveisPorPerdaDeContexto`, `semCorrespondencia`,
  `divergenciasEsperadasNullZero`, mais os metadados
  `defasagemDiasEntreCanonicoEBaseVertical` e `possivelDefasagemTemporal`
  (nunca reclassificam nem escondem uma divergência).

**Resultado da comparação com a base vertical após as três correções
(mesma fixture usada nos testes)**: 730 comparados com segurança, **0
divergências numéricas reais**, 208 não comparáveis por perda de
contexto (explicados: subgrupoOcorrência/critério que a base vertical
não registra), 156 sem correspondência (limitação já documentada —
rótulo do indicador-pai reaproveitado nas linhas de valor de gerência
ofensora, de forma inconsistente entre linhas com rótulo próprio e
linhas sem rótulo — ver `harness.js` para o achado completo), 0
divergências esperadas null×zero (nenhuma ocorreu nesta amostra),
defasagem de 4 dias detectada e relatada (não escondida).

**Testes — quatro rodadas registradas nesta fase, a mais recente é a
oficial:**
- Fase 5, resultado inicial (antes da correção do Validator): 50/50 —
  substituído.
- Fase 5, após a correção do Validator: 55/55 — substituído.
- Fase 5, após a primeira correção do harness (colisão de chave,
  causa-raiz ainda incompleta): 66/66 — substituído.
- **Fase 5, após a correção dos Mecanismos A, B e C — resultado atual e
  oficial: 86/86 aprovados, 0 reprovados.** Inclui os 66 casos
  anteriores mais 20 novos: consumo de múltiplas linhas associadas à
  Gerência Ofensora sem duplicar indicador (6 casos), critério
  catalogado preservado e sem colisão (5 casos), critério desconhecido
  gera bloqueio (2 casos), não comparável por perda de contexto — duas
  ocorrências do mesmo subgrupo (4 casos), rotulagem correta do
  relatório — indicador ≠ subgrupo (2 casos), null×zero classificado
  como esperada (1 caso).
- **Fase 4 (`testes/testar-fase4.js`), reexecutada nesta rodada: 42/42
  aprovados, 0 reprovados** — sem regressão; nenhum arquivo da Fase 4
  foi tocado.

**Fase 5 ainda pendente de validação em navegador após a publicação
desta correção.** A auditoria já rodou o piloto ao vivo duas vezes
(antes de qualquer correção: 312 divergências reais; após a primeira
correção do harness, sem tocar o Adapter: as mesmas 312 — prova de que
a causa raiz estava no Adapter, não só no harness). Esta rodada corrige
o Adapter (Mecanismo A), adiciona a dimensão critério (Mecanismo B) e
corrige a classificação do harness (Mecanismo C) — mas a confirmação
definitiva só vem de uma nova execução em
`https://urbanflowrio.github.io/COMLURB/engenharia-operacional/piloto/`
após esta entrega ser publicada. Até essa nova validação ao vivo, a
Fase 5 permanece **não aprovada**.

**Limitação de ambiente, já registrada na Fase 4**: este ambiente de
build não acessa `docs.google.com` — a suíte e o harness rodam contra
os dados reais enviados nesta fase (xlsx + Apps Script), convertidos
para o mesmo formato de CSV publicado pelo Google Sheets, não contra a
URL ao vivo. A validação em navegador real (como a página
`engenharia-operacional/piloto/index.html` faz, quando publicada)
ainda depende da proprietária do produto rodá-la a partir do GitHub
Pages, do mesmo jeito que a Fase 4 foi validada.

**Registro histórico da rodada:** naquele momento, a Fase 6 ainda não estava autorizada.

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


## Correção de validação ao vivo — percentuais publicados pelo Google Sheets

A validação em navegador após a correção de integração `index.html × harness.js` executou sem falha de interface, mas registrou **312 divergências numéricas reais**. O padrão foi determinístico: 24 séries percentuais/razões do Bloco B × 13 períodos, sempre com `canonico: null` e valor numérico na base vertical.

Causa-raiz: a fonte pública viva passou a entregar células percentuais no formato exibido pelo Google Sheets, com símbolo `%` (por exemplo, `71,9%`), enquanto a fixture congelada usada nos testes continha a fração decimal equivalente (`0,719`). A função `numDTE` não removia `%`, portanto convertia essas células em `null`.

Correção aplicada somente em `assets/components/hub-ingest-adapter-dte.js`:

- percentual pt-BR com `%` é convertido para fração decimal (`71,9% → 0.719`);
- `0%` permanece zero legítimo;
- negativos são preservados (`-12,5% → -0.125`);
- vazio e inválido continuam `null`;
- moedas e números já suportados permanecem inalterados.

Testes específicos adicionados em `testes/testar-fase5.js`. Registro histórico: após essa correção, a Fase 5 ainda aguardava a validação final no navegador.


### Verificação local do corretivo percentual

- Suíte da Fase 5 executada em ambiente local controlado com as fixtures da entrega: **96/96 aprovados, 0 reprovados**.
- A contagem aumentou em 4 casos específicos de percentual publicado pelo Google Sheets.
- A suíte da Fase 4 não foi reexecutada contra a `main` real neste ambiente; nenhum arquivo funcional da Fase 4 foi alterado por este corretivo. A validação de regressão permanece a ser executada na raiz completa do repositório, se desejado.
- Próxima ação: publicar os três arquivos corretivos e validar novamente o piloto no navegador.


## Fase 6 — Snapshot automático e validação antecipada (AR e Engenharia/DTE)

**Status: implementada e testada nesta entrega.** Publicação em `main`
e primeira execução real ainda pendentes — ver "Não executado nesta
fase" abaixo. Escopo travado em AR e Engenharia/DTE, conforme
autorizado. Documentação operacional completa em `snapshot/README.md`
(arquitetura, formato do snapshot, política de hash, retenção,
rollback, custo estimado, riscos conhecidos).

### Decisão de orquestração

Um único job de workflow processa os dois módulos (AR e
Engenharia/DTE) dentro do mesmo processo Node, de forma independente
entre si — não dois jobs paralelos fazendo commit (decisão explícita
da proprietária do produto, para evitar corrida entre commits). Uma
falha em um módulo não impede o processamento nem a publicação válida
do outro. Um único commit é feito ao final do ciclo, contendo somente
snapshots válidos, ponteiros `latest` válidos e relatórios — nunca um
snapshot inválido.

### Arquivos novos
- `snapshot/lib/bootstrap-hub.js`
- `snapshot/lib/canonical.js`
- `snapshot/lib/snapshot-core.js`
- `snapshot/lib/snapshot-ar.js`
- `snapshot/lib/snapshot-dte.js`
- `snapshot/lib/verificar-caminhos.js`
- `snapshot/run.js`
- `snapshot/README.md`
- `testes/executar-hub-selftest-node.js` (harness Node mínimo para hub-selftest, sem alterar esse arquivo)
- `snapshot/exemplos/` (marcados como exemplo, gerados de fixtures — nunca dados reais)
- `.github/workflows/snapshot.yml`
- `testes/testar-fase6.js`
- `data/snapshots/{ar,engenharia-dte}/periodos/`, `data/reports/{ar,engenharia-dte}/`, `data/rejected/{ar,engenharia-dte}/` (estrutura vazia, só `.gitkeep`)
- `package.json` (não existia nenhum na raiz; criado mínimo, só `papaparse` e scripts de teste/execução)

### Arquivo alterado
- `docs/architecture/IMPLEMENTATION_STATUS.md` (este arquivo)

### Não alterado (confirmação explícita)
Nenhum Adapter, Reader, Model, Rule, State, piloto ou painel de
produção. Especificamente intocados: `ar/index.html`,
`ar/ar-config.js`, `ar/ar.js`, `engenharia-operacional/index.html`,
os pilotos aprovados, `hub-core.js`, `hub-rules.js`,
`hub-rules-ar.js`, `hub-state-ar.js`, `hub-utils.js`, a home
(`index.html` da raiz) e todos os demais módulos do HUB.

### Testes
- `testes/testar-fase6.js`: **22 grupos, 85 casos, 85 aprovados, 0 reprovados.**
- `testes/executar-hub-selftest-node.js` (novo nesta correção): harness
  Node mínimo, versionado, que executa `testes/hub-selftest.js`
  (Fases 2/3) sem navegador e sem alterar uma linha desse arquivo —
  **40/40 aprovados**, exit code 0. Reproduz localmente com
  `node testes/executar-hub-selftest-node.js .`.
- Regressão confirmada nesta mesma entrega, no mesmo ambiente:
  - `testes/testar-fase4.js`: 42/42 aprovados.
  - `testes/testar-fase5.js`: 96/96 aprovados.
- **Total geral desta rodada: 263 casos executados, 263 aprovados, 0 reprovados — as quatro suítes (hub-selftest, Fase 4, Fase 5, Fase 6) são executadas integralmente pelo próprio workflow (`.github/workflows/snapshot.yml`), nesta ordem, antes de qualquer módulo de snapshot ser processado. Nenhum resultado depende de ferramenta externa não versionada.**

### Bloqueios
Nenhum bloqueio técnico nesta entrega. Duas lacunas documentais
pré-existentes (não desta fase) foram identificadas e registradas,
sem bloquear a implementação, conforme decisão explícita da
proprietária do produto:
- `MIGRATION_STRATEGY.md` citado em comentários de código de fases
  anteriores, mas nunca materializado como arquivo;
- ADR-001, ADR-004 e ADR-005 citados em comentários de código de
  fases anteriores, mas nunca materializados como arquivos.

Detalhamento completo em `snapshot/README.md` · "Riscos e limitações conhecidas".

### Não executado nesta fase
- Publicação dos arquivos em `main` (commit humano, fora do escopo desta entrega).
- Primeira execução real do workflow (só deve ocorrer após publicação, revisão e disparo manual pela aba Actions — ver `snapshot/README.md`).
- Qualquer captura real de dado do Google Sheets — `data/` chega vazia (só `.gitkeep`) neste ZIP, por decisão explícita ("não registre snapshots reais na implementação local").
- Fase 7, sob qualquer forma.

### Próxima ação autorizada
Publicar os arquivos desta entrega em `main`, revisar, e executar o
workflow manualmente pela aba Actions para validar a primeira captura
real. **A Fase 7 não está autorizada.**

### Fechamento factual (acréscimo posterior a esta seção, não uma reescrita)

A ação acima foi cumprida. Registro factual do que se confirmou depois
da entrega original desta fase, sem alterar nenhum parágrafo anterior:

- Arquivos publicados em `main`.
- Primeira execução manual real do workflow "HUB COMLURB — Snapshot AR
  e Engenharia/DTE (Fase 6)" concluída com sucesso (`workflow_dispatch`,
  `conclusion: success`).
- Artifact do relatório da execução (`relatorio-snapshot-<id>`)
  publicado.
- Primeiro snapshot real do módulo AR criado em
  `data/snapshots/ar/periodos/2026/` (13 indicadores válidos, 11
  avisos, 0 erros).
- Primeiro snapshot real do módulo Engenharia/DTE criado em
  `data/snapshots/engenharia-dte/periodos/2025-05..2026-05/` (957
  indicadores, 624 registros de gerência ofensora, 1 aviso, 0 erros).
- `data/snapshots/ar/latest.json` e
  `data/snapshots/engenharia-dte/latest.json` criados, cada um
  apontando para um arquivo existente em `periodos/`.
- Commit automático do bot (`hub-comlurb-snapshot-bot`) restrito a
  `data/`, confirmado pelo step `verify-paths` do workflow antes do
  commit.
- Workflow semanal ativo (`cron: '0 11 * * 1'`, além de
  `workflow_dispatch` manual).
- Tag e release `fase-6-concluida` publicadas.
- Suíte completa desta rodada: **263/263 aprovados, 0 reprovados**
  (`hub-selftest` 40/40, Fase 4 42/42, Fase 5 96/96, Fase 6 85/85).

Nenhum Adapter, Reader, Model, Rule, State, piloto ou painel de
produção foi alterado por esta confirmação — é só o registro factual
de que a "Próxima ação autorizada" acima foi executada e validada.

---

## Fase 7A — Infraestrutura de leitura de snapshots (sem conexão a painéis)

**Status: implementada e testada nesta entrega.** Escopo travado em
infraestrutura genérica — nenhum painel de produção foi alterado,
nenhuma URL de fonte foi alterada, nenhum Adapter/Rule/State foi
tocado, nenhum arquivo da Fase 6 (`snapshot/lib/`, `snapshot/run.js`,
`.github/workflows/snapshot.yml`) foi tocado.

### Objetivo desta etapa

Preparar a conexão futura dos painéis de AR e Engenharia/DTE aos
snapshots validados da Fase 6, sem realizar essa conexão agora. A
Fase 7 foi dividida em 7A (esta entrega, só infraestrutura) → 7B
(piloto controlado AR) → 7C (piloto controlado Engenharia/DTE) → 7D
(eventual promoção do snapshot a fonte principal, só após validação
humana explícita). Nenhuma etapa além de 7A foi iniciada.

### Arquivos novos

- `assets/components/hub-snapshot-reader.js` — leitura, validação e
  resolução segura de `latest.json` + snapshot apontado. Camada
  isolada: não conhece AR, DTE, CSV, Google Sheets, GitHub ou GitHub
  Pages. Não escreve em disco. Nunca executa conteúdo do snapshot.
  Nunca usa `eval`.
- `assets/components/hub-data-source.js` — estratégia de fonte
  (`live`/`snapshot`/`compare`) via providers injetados
  (`liveProvider`/`snapshotProvider`/`compareProvider` opcional). Não
  conhece `HUB.data.loadCSV`, PapaParse ou Google Sheets. Modo padrão:
  `live`.
- `testes/testar-fase7a.js` — suíte reproduzível (15 grupos, 102
  casos).
- `testes/fixtures/fase7a/` — fixtures de arquivo representativas
  (par latest+snapshot válido, JSON malformado, hash divergente); as
  demais variações paramétricas (path traversal, versões, moduloId
  divergente etc.) são construídas em memória dentro da própria
  suíte, documentado no cabeçalho do arquivo de teste.

### Arquivo alterado

- `docs/architecture/IMPLEMENTATION_STATUS.md` (este arquivo).

### Não alterado (confirmação explícita, idêntica à exigida)

`ar/index.html`, `ar/ar.js`, `ar/ar-config.js`,
`engenharia-operacional/index.html`, qualquer painel de produção,
qualquer URL de fonte, qualquer Adapter, Rule, State,
`snapshot/run.js`, `snapshot/lib/*`,
`.github/workflows/snapshot.yml`, `package.json` (nenhuma dependência
nova foi necessária).

### Padrão de módulo (desvio deliberado, restrito a estes dois arquivos)

Todo o restante da biblioteca HUB usa IIFE de navegador
(`window.HUB`, ver `hub-core.js`), testável em Node só via o harness
de bootstrap com `eval` da Fase 6 (`snapshot/lib/bootstrap-hub.js`,
não reutilizado nem alterado aqui). `hub-snapshot-reader.js` e
`hub-data-source.js` usam em vez disso um padrão dual: anexam-se a
`window.HUB` quando `window` existe, e exportam via `module.exports`
quando `module` existe — carregáveis em Node por `require()` direto
nos testes, sem `eval`. Nenhum componente antigo foi alterado para
uniformizar este padrão; a divergência é intencional, documentada no
cabeçalho de ambos os arquivos, e restrita a estes dois arquivos
novos. Não caracteriza início de migração geral da biblioteca para
CommonJS.

### Contratos públicos

**`HUB.snapshotReader.lerAsync(moduloId, opts)`** — `opts.baseUrl`
obrigatório (raiz onde vive `snapshots/`, sem valor padrão — nunca
acoplado a GitHub/GitHub Pages/COMLURB); `opts.fetchImpl` injetável
(obrigatório em Node — ausência nunca aciona rede real; em navegador,
se omitido, usa `globalThis.fetch` automaticamente);
`opts.maxAgeHoras` opcional (ausente = sem avaliação de idade; número
finito ≥ 0 = avaliação ativa; inválido/negativo = `parametro_invalido`);
`opts.expectedSnapshotVersion`/`opts.expectedSchemaVersion` opcionais
(ausentes não bloqueiam; divergentes bloqueiam com estado específico);
`opts.now` opcional (injeção de relógio para testes determinísticos de
`stale`, padrão `Date.now`). Nunca lança exceção para falha
operacional esperada; nunca escreve; nunca faz fallback; nunca
executa conteúdo do snapshot.

Enumeração fechada de estados: `snapshot_valido`, `snapshot_ausente`,
`latest_invalido`, `snapshot_apontado_ausente`, `hash_divergente`,
`modulo_divergente`, `versao_incompativel`, `schema_incompativel`,
`contrato_invalido`, `erro_leitura`, `stale`, `parametro_invalido`.

**Limitação documentada sobre hash** (correção conceitual
incorporada nesta entrega): a checagem `latest.hash === snapshot.hash`
valida apenas a coerência DECLARADA entre o ponteiro e o arquivo
apontado — não é uma validação criptográfica do conteúdo. Este
arquivo não recomputa o hash canônico da Fase 6
(`snapshot/lib/canonical.js`/`snapshot-core.js`, intocados). Eventual
recomputação de hash no navegador é evolução arquitetural posterior,
condicionada a decisão explícita sobre reuso de canonicalização entre
Node e browser.

**`HUB.dataSource.resolver(moduloId, modo, opts)`** — `modo` padrão
`"live"`; `"snapshot"` e `"compare"` explícitos; modo desconhecido
rejeitado (`modo: "modo_desconhecido"`), nunca aceito silenciosamente.
`opts.liveProvider`/`opts.snapshotProvider`/`opts.compareProvider`
(opcional) — funções injetadas, nunca dependências fixas a
`HUB.data.loadCSV`/CSV/Google Sheets. Em `compare`, as duas fontes são
chamadas de forma independente (falha de uma não impede a captura do
resultado da outra); o valor principal retornado continua sendo o do
`live`; o relatório de comparação fica em campo separado
(`comparacao`) e nunca altera o resultado exibido.

**`HUB.dataSource.comparar(liveValor, snapshotValor, erros)`** —
função pura e determinística, sem `JSON.stringify` como estratégia
geral (walk estrutural recursivo); objetos comparados por propriedade
independente da ordem de declaração; arrays comparados preservando
ordem original (nunca reordenados silenciosamente), com detecção
específica de reordenação pura via `ordem_array_divergente`; nunca
modifica os objetos recebidos. Tipos de diferença:
`campo_ausente_live`, `campo_ausente_snapshot`, `valor_divergente`,
`tipo_divergente`, `ordem_array_divergente`; classificações de topo:
`igualdade`, `divergente`, `erro_live`, `erro_snapshot`, `erro_ambos`.

### Testes

- `testes/testar-fase7a.js`: **15 grupos, 102 casos, 102 aprovados, 0
  reprovados.**
- Regressão confirmada nesta mesma entrega, no mesmo ambiente:
  `hub-selftest` 40/40, Fase 4 42/42, Fase 5 96/96, Fase 6 85/85.
- **Total geral desta rodada: 40 + 42 + 96 + 85 + 102 = 365 casos
  executados, 365 aprovados, 0 reprovados.**
- Nenhum teste desta suíte escreve em `data/` nem acessa rede real —
  todo `fetch` é mockado via `fetchImpl` injetado, apontando para
  URLs fictícias (`mock://...`).

### Correção de coerência incorporada após auditoria (mesma entrega)

Uma auditoria prévia identificou três lacunas de coerência entre
`latest.json` e o snapshot apontado, corrigidas antes da liberação
para upload:

1. **`snapshotVersion`**: além de comparar `expectedSnapshotVersion`
   contra `latest.snapshotVersion`, agora `latest.snapshotVersion` e
   `snapshot.snapshotVersion` são sempre comparados entre si — mesmo
   sem `expectedSnapshotVersion` informado. Quando informado, os três
   valores devem ser compatíveis. Divergência => `versao_incompativel`.
2. **`schemaVersion`**: `latest.schemaVersion` e
   `snapshot.envelope.schemaVersion` agora são sempre comparados entre
   si — mesmo sem `expectedSchemaVersion` informado. Quando informado,
   os três valores devem ser compatíveis. Divergência =>
   `schema_incompativel`.
3. **`capturedAt`**: `latest.capturedAt` e `snapshot.envelope.capturedAt`
   agora são comparados por igualdade estrita (sem tolerância
   temporal). Divergência => `contrato_invalido`, com detalhe
   explícito de que ponteiro e envelope descrevem capturas diferentes.

As três checagens ocorrem sempre depois da validação de `hash` e
`referencePeriod`, e sempre antes do cálculo de `stale` — uma
divergência de coerência nunca é mascarada por `maxAgeHoras`
(verificado por teste dedicado).

### Riscos e limitações conhecidas

1. **Verificação de hash é de coerência declarada, não criptográfica**
   (ver seção "Contratos públicos" acima) — documentado, não
   resolvido nesta fase por decisão explícita (não duplicar/alterar a
   canonicalização da Fase 6).
2. **Validação de path é estrutural, não uma biblioteca completa de
   parsing de URL** — cobre absoluto, protocolo, protocolo-relativo,
   barra invertida (direta e `%5c`), travessia direta e
   percent-encoded (decodificação iterativa até 3 níveis) e restrição
   de prefixo ao módulo solicitado; não é uma garantia formal contra
   toda técnica de evasão de path conhecida.
3. **Heurística de `ordem_array_divergente`** aplica-se a arrays cujos
   elementos são todos primitivos e de mesmo tamanho; arrays de
   objetos com reordenação pura são reportados como
   `valor_divergente`/`tipo_divergente` por índice, não como
   `ordem_array_divergente` — limitação aceitável para esta fase,
   documentada no código.
4. **Padrão de módulo dual (browser+Node) é uma primeira exceção** ao
   IIFE-only vigente no restante de `assets/components/` — decisão
   deliberada e restrita, não uma migração geral (ver seção acima).

### Não executado nesta fase

- Conexão de `hub-snapshot-reader.js`/`hub-data-source.js` a qualquer
  painel de produção.
- Qualquer piloto visual com dado real (Fase 7B/7C).
- Qualquer decisão de produto sobre política de `maxAge` em produção.
- Qualquer alteração em `snapshot/lib/`, `snapshot/run.js` ou
  `.github/workflows/snapshot.yml`.
- Fase 7B e Fase 7C, sob qualquer forma.

### Próxima ação autorizada

Aguardar autorização explícita para Fase 7B (piloto controlado de
consumo de snapshot no AR, modo `compare` em harness isolado, sem
alterar a interface pública do painel). **A Fase 7B não está
autorizada.**
