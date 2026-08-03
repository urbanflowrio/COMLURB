# Governança Corporativa — HUB COMLURB

Módulo executivo para monitoramento do Acordo de Resultados e dos indicadores gerais da COMLURB.

## Arquitetura

- `index.html`: scaffold e marcação sem lógica de negócio.
- `data.js`: configuração e URL da base publicada.
- `app.js`: carregamento, adaptação de paridade, filtros, cálculos de apresentação e renderização.
- `governanca.css`: apenas extensões específicas do módulo, apoiadas nos tokens de `hub-premium.css`.

## Componentes compartilhados

O módulo utiliza `HUB.header`, `HUB.footer`, `HUB.loading`, `HUB.cards`, `HUB.data` e `HUB.indicadores`.

## Preservação da regra vigente

O painel não migra para `HUB.rules`. A avaliação usa `HUB.indicadores.avaliarIndicador()`, preservando a regra vigente em `indicadores-registro.js`.

A função local `resolverLinha()` mantém a compatibilidade com o painel anterior:

1. diretoria selecionada consolidada;
2. qualquer linha da diretoria selecionada;
3. COMLURB consolidado;
4. qualquer linha consolidada;
5. primeira linha disponível.

A linha encontrada é adaptada localmente para o contrato estrito de `avaliarIndicador()`, tratando caixa, acentuação e as convenções `""`/`"-"`, sem alterar arquivos compartilhados.

## Regras de apresentação

- Aderência = dentro da meta / indicadores avaliáveis.
- Cobertura = indicadores avaliáveis / indicadores monitorados.
- Diferenças entre percentuais são exibidas em pontos percentuais.
- Movimento temporal é apresentado como melhora, piora ou estabilidade, respeitando o sentido do indicador.
- Cobertura inferior a 50% classifica o eixo como `Leitura insuficiente`.

## Limites

Planilha, CSV, metas, sentidos, registro de indicadores e componentes do Core não foram alterados.

## Ajuste de apresentação — 03/08/2026

- Removido o filtro de Diretoria da interface; o painel permanece no consolidado COMLURB.
- O filtro de período permite selecionar cada ano disponível ou comparar os dois anos mais recentes.
- No modo comparativo, o ano mais recente permanece como posição atual e a comparação usa o mesmo último mês disponível do ano anterior.
- Unidades de contagem (`Num.`, `Número`, `Qtd.` e equivalentes) não são mais concatenadas ao valor principal.
- A ficha lateral concentra cor semântica apenas no resultado do ano principal e no status; distância da meta e movimento permanecem neutros para evitar excesso visual.
- O campo técnico `Sentido` foi retirado da camada principal da ficha.

- Unidades de massa como `Ton` são exibidas como `t` no resultado e por extenso nas frases de diferença.

## Ajuste V4 — percentual de atingimento

Indicadores com meta exibem percentual de atingimento no card e na ficha. Para indicadores de maior valor desejável, o cálculo é resultado/meta. Para indicadores de menor valor desejável, o cálculo é meta/resultado. Casos de meta ou resultado zero recebem tratamento explícito para evitar divisão por zero. A métrica não é agregada em média corporativa, pois os indicadores possuem naturezas e unidades diferentes.


## Ajuste V5 — integração das duas abas publicadas

O painel carrega simultaneamente duas fontes da mesma planilha publicada:

1. `pub?output=csv`: fonte principal dos resultados, valores acumulados e séries mensais;
2. `gid=2044729258`: fonte complementar de meta, sentido, unidade e percentual de atingimento, quando informado.

As bases são mescladas por indicador, ano, diretoria e nível organizacional. Campos preenchidos na aba de resultados permanecem prioritários. A aba complementar preenche campos ausentes e pode acrescentar indicadores ainda não presentes na primeira fonte. Quando existe uma coluna explícita de atingimento, o painel usa o valor informado; na ausência dela, mantém o cálculo derivado de resultado, meta e sentido.

## Fontes dinâmicas de hora extra

O módulo carrega mensalmente três CSVs publicados no Google Sheets, configurados em `data.js` em `horaExtraSources`.

As bases são agregadas por competência para alimentar os indicadores:

- `Hora Extra Realizada`, a partir de campos equivalentes a `Total_Horas_Extras`;
- `Horas Domingos e Feriados Realizadas`, a partir de campos equivalentes a `HE_Domingos_Feriados`.

A primeira fonte que disponibiliza um valor válido para o mesmo indicador e competência prevalece, evitando dupla contagem entre abas que possam repetir registros. Os resultados mensais e o acumulado vêm dessas bases; meta, sentido e unidade continuam sendo preservados da base oficial de governança quando já existirem.

As três fontes são opcionais no carregamento: uma indisponibilidade temporária não derruba o painel, mas o status de carregamento informa quantas fontes responderam.

## Indicador retirado da apresentação

`Índice de Conformidade - PGR` foi retirado exclusivamente da exibição deste módulo. O registro compartilhado do HUB não foi alterado.

## Ajuste V7 — catálogo integral de indicadores

O catálogo do painel deixou de depender exclusivamente de `HUB.indicadores.todosOsCards()` e passou a ser construído dinamicamente a partir da união das fontes carregadas:

1. aba Geral (`gid=1044100274`), considerada a fonte principal e integral dos indicadores;
2. aba de metas do Acordo de Resultados (`gid=2044729258`), usada para complementar metas, sentido, unidade e atingimento e também para incluir metas do AR que ainda não estejam na Geral;
3. três fontes mensais de hora extra, incorporadas mesmo quando não possuem meta.

Todo indicador presente nessas fontes é exibido. Indicadores sem eixo explícito usam primeiro o cadastro compartilhado; quando não há cadastro, recebem classificação por palavras-chave e, como último recurso, o eixo `Outros`.

O indicador `Índice de Conformidade - PGR` volta a ser exibido, pois a regra vigente desta versão é considerar todos os indicadores da aba Geral.

O índice de atingimento aparece em todo indicador que possui meta. Quando a base informa o percentual explicitamente, esse valor tem prioridade; caso contrário, o painel calcula o atingimento considerando o sentido do indicador.


## Separação do Acordo de Resultados
Os indicadores presentes na aba do AR são identificados dinamicamente e excluídos da Governança Corporativa. O detalhamento dessas metas permanece exclusivamente no módulo `ar/`. A fonte do AR é consultada apenas para manter a separação atualizada, sem importar metas ou resultados para este painel.

## Integração com o módulo AR

Os indicadores pertencentes ao Acordo de Resultados são excluídos dinamicamente da Governança Corporativa, evitando duplicidade. A página mantém apenas um acesso contextual para `../ar/`, sem reproduzir metas, resultados ou métricas do módulo especializado.
