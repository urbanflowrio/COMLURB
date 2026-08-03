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
