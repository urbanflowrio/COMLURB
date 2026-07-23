# Perímetro do UrbanFlow Core — estado observado (Fase 8, Etapa 2)

> Este documento registra o perímetro **observado no estado atual do
> repositório**, com base em leitura direta dos arquivos existentes.
> Não é uma proposta de reestruturação, nem uma promessa de que os
> itens da coluna A já estão livres de acoplamento — ver ressalvas em
> cada item. Nenhum arquivo listado aqui foi movido, duplicado,
> renomeado ou extraído como parte deste documento.
>
> Convenção de classificação usada abaixo:
>
> - **A** — infraestrutura reutilizável
> - **B** — infraestrutura compartilhada ainda acoplada à COMLURB
> - **C** — módulos específicos da instância COMLURB
> - **D** — painéis e produtos finais
> - **E** — itens fora do baseline do Core (histórico, teste, doc)
>
> Quando um arquivo mistura mecanismo genérico com conteúdo específico,
> ele é classificado como **"reutilizável com acoplamentos ainda
> existentes"**, não como A puro nem como B puro — essa é a categoria
> intermediária pedida explicitamente para `hub-sources.js`,
> `hub-rules.js` e os componentes de UI.

---

## A — Infraestrutura reutilizável

Mecanismos sem vocabulário de cliente, sem URLs reais, sem nomes de
indicadores da COMLURB embutidos no código:

| Arquivo | Observação |
|---|---|
| `assets/components/hub-core.js` | Namespace, guarda de dependências, registro de componentes. Nenhum vocabulário de cliente encontrado. |
| `assets/components/hub-ingest-model.js` | Envelope canônico genérico (Locator→Reader→Decoder→Adapter→Validator). Comentário do próprio arquivo declara escopo mínimo, sem conhecimento de AR/IPL/SARC. |
| `assets/components/hub-ingest-reader.js` | Mecanismo de leitura por `readerType`. Sem nomes de fonte fixos no próprio arquivo (fontes vêm de `hub-sources.js`, ver categoria B). |
| `assets/components/hub-ingest-decoder.js` | Detecção estrutural de cabeçalho (célula preenchida vs. vazia). O próprio comentário registra que foi generalizado a partir de `balanco-receita/index.html` sem copiar palavras-chave específicas daquele painel. |
| `assets/components/hub-snapshot-reader.js` | Leitura/validação de `latest.json` + snapshot apontado. Sem conhecimento de AR, DTE, CSV, Google Sheets ou GitHub (declarado no próprio cabeçalho). |
| `assets/components/hub-data-source.js` | Resolução `live`/`snapshot`/`compare` por injeção de providers. Sem conhecimento de AR/DTE (declarado no próprio cabeçalho). |
| `snapshot/run.js` + `snapshot/lib/` | Motor de hashing, escrita atômica, retenção. Parametrizado por módulo, não lê regra de negócio. |
| `testes/hub-selftest.js` + `testes/executar-hub-selftest-node.js` | Harness de teste da biblioteca, não conteúdo de negócio. |
| `assets/components/_TEMPLATE.html`, `_TEMPLATE_app.js`, `_TEMPLATE_data.js` | Scaffold de novo painel, sem dado real. |

## Reutilizáveis com acoplamentos ainda existentes

Estes arquivos contêm mecanismo genérico, mas hoje carregam, junto,
conteúdo real da COMLURB (nomes, URLs, paleta, comentários
institucionais). Não devem ser tratados como A pura enquanto isso não
for separado — o que esta rodada **não** faz:

| Arquivo | Acoplamento identificado |
|---|---|
| `assets/components/hub-sources.js` | Mecanismo de Locator é genérico, mas o objeto `HUB.sources` registra, hoje, nomes reais de fonte da COMLURB (`AR_GERAL`, `AR_2026`, `AR_MAPEAMENTO`, `AR_GOVERNANCA`, `DTE_RELATORIO_GERAL`) diretamente no arquivo — não há indireção por configuração de instância. |
| `assets/components/hub-rules.js` | Mecanismo de status/atingimento/acumulação/tendência é transversal, mas o próprio arquivo documenta a "regra canônica menor-melhor" citando o Acordo de Resultados como origem e aposentando explicitamente a regra antiga de `indicadores-registro.js` — ou seja, a decisão institucional da COMLURB está registrada dentro do arquivo que se propõe genérico. |
| `assets/components/hub-utils.js`, `hub-cards.js`, `hub-charts.js`, `hub-filters.js`, `hub-layout.js` | Mecanismo de UI é genérico (render de cards, gráficos, filtros, header/footer), mas `hub-charts.js` embute a paleta de marca da COMLURB (`#5b9bd5`, `#e87535`, `#78aaa3`, etc.) como constantes internas, não como tema injetável. Textos e rótulos em pt-BR institucional também estão embutidos. |
| `assets/css/hub-premium.css` | CSS único de todos os painéis; mecanismo de layout é reaproveitável, mas variáveis de cor são a paleta de marca da COMLURB, não uma paleta neutra parametrizável. |

**Achado adicional (não solicitado, mas relevante para esta
classificação):** `assets/components/hub-ingest-adapter-ar.js` e
`assets/components/hub-rules-ar.js` documentam, no próprio cabeçalho,
que removeram a dependência de `hub-utils.js` porque a versão hoje
publicada diverge de uma versão anterior referida como "Fase 2" (que
não registra o componente `"utils"` nem expõe
`HUB.format.toNumberBR`). Isso indica que `hub-utils.js`, listado
acima como parcialmente reutilizável, tem duas linhagens não
reconciliadas — risco de acoplamento que já existia antes desta
auditoria e que esta rodada não resolve.

## B — Infraestrutura compartilhada ainda acoplada à COMLURB

(Sobreposta em parte com a tabela acima; itens abaixo são os que não
têm nenhum uso fora do contexto COMLURB hoje, mesmo sendo
"compartilhados" entre os painéis da COMLURB.)

- Conteúdo de `HUB.sources` (nomes e estrutura das cinco fontes reais)
- Paleta de marca em `hub-charts.js` / `hub-premium.css`
- Vocabulário institucional em comentários de `hub-rules.js`

## C — Módulos específicos da instância COMLURB

| Arquivo | Escopo |
|---|---|
| `assets/components/hub-rules-ar.js` | Regras do Acordo de Resultados 2026 (bônus E/C/P, atingimento AR) |
| `assets/components/hub-state-ar.js` | Estado operacional específico do AR |
| `assets/components/hub-ingest-adapter-ar.js` | Adapter do Acordo de Resultados |
| `assets/components/hub-ingest-adapter-dte.js` | Adapter de Engenharia/DTE |
| `docs/CONHECIMENTO_DTE.md` | Conhecimento institucional de domínio DTE |

## D — Painéis e produtos finais

`ar/`, `engenharia-operacional/`, `ipl/`, `indicadores-gerais/`,
`pessoas/`, `contratos/` (incluindo `contratos/sme/`,
`contratos/sms/`), `balanco-receita/`, `territorial/`, `materiais/`,
mais `index.html` (portal) e os pilotos técnicos
(`ar/piloto/`, `ar/piloto-snapshot/`,
`engenharia-operacional/piloto/`,
`engenharia-operacional/piloto-snapshot/`).

**Observação registrada, não resolvida nesta rodada:** `balanco-receita/`
permanece como painel funcional separado de `contratos/`, apesar de a
absorção de Balanço Receita em Contratos já constar como decisão
tomada. Nenhuma ação foi tomada sobre isso aqui — apenas registro do
estado observado, conforme escopo autorizado ("não mover
`balanco-receita`").

## E — Itens fora do baseline do Core (histórico, teste, documentação)

- `testes/testar-fase4.js`, `testar-fase5.js`, `testar-fase6.js`,
  `testar-fase7a.js`, `testar-fase7b.js`, `testar-fase7c.js` — suítes
  específicas de cada fase (o *harness*/mecanismo de teste em si é A;
  o conteúdo de cada suíte, que valida regras e dados específicos de
  cada fase, é E)
- `docs/architecture/IMPLEMENTATION_STATUS.md` — registro histórico de
  fases, não documentação viva do Core
- `README.md`, `GUIA_OPERACIONAL.md` — documentação da instância
  COMLURB (desatualizada em relação à estrutura atual; fora do escopo
  de correção desta rodada)
- `snapshot/exemplos/` — dados de exemplo/fixture
- `data/snapshots/`, `data/reports/`, `data/rejected/` — dados
  capturados, não código

---

## Limitações desta classificação

- Este documento não cria nenhuma camada de configuração de instância.
  A distinção A / "reutilizável com acoplamentos" é apenas descritiva.
- Nenhum arquivo foi movido, duplicado, renomeado ou extraído.
- Não foi criado `hub-state.js` genérico nem `ADRS.md` nesta rodada —
  ambos permanecem pendências já registradas na auditoria da Etapa 1.
- Esta classificação reflete o estado do checkout no momento da
  Etapa 2 da Fase 8 e deve ser revisada se qualquer um dos arquivos
  acima for alterado depois.
