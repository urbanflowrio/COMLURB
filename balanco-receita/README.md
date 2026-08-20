# Performance dos Contratos de Receita

Módulo financeiro do HUB COMLURB para leitura do faturamento e dos débitos de 2026 e dos exercícios anteriores.

## Arquivos

- `index.html`: estrutura da página;
- `balanco-receita.css`: estilos específicos do módulo;
- `balanco-receita.js`: leitura da planilha, filtros, cálculos e renderização.

## Fonte

Google Sheets:

- `Valores Faturados 2026`, para o faturamento mensal acumulado de 2026;
- `Base_Padronizada`, para os débitos de 2026 e para o estoque dos exercícios anteriores.

## Atualização

Os indicadores são recalculados no navegador sempre que a página é aberta. O seletor de período alterna entre 2026 e exercícios anteriores. Os filtros seguem a hierarquia período → secretaria → serviço → mês.

Linhas identificadas como total ou total geral são excluídas da leitura. Serviços novos da aba de faturamento que ainda não estejam vinculados a uma secretaria geram um alerta no console do navegador para revisão do mapa `SERVICE_SECRETARY`.

O início da tabela de `Valores Faturados 2026` é localizado automaticamente pelo cabeçalho `Local` / `jan`, evitando a perda da primeira linha de dados. Para a APA, o acumulado validado de janeiro a julho de 2026 é de R$ 9.630.464,45.

Em 2026, a planilha não possui uma fonte de pagamentos realizados. Por isso, a visão apresenta faturamento bruto acumulado, débito líquido identificado e quantidade de serviços com débito. O KPI `Valor Líquido Pago` permanece apenas na visão dos exercícios anteriores, onde o campo existe.
Em 2026, o painel não calcula uma taxa de inadimplência nem relaciona percentualmente o débito ao faturamento. O terceiro KPI informa quantos serviços possuem débito identificado no recorte. No gráfico `Onde está o débito`, o clique em uma unidade abre o detalhamento dos valores por mês de competência; o botão `Voltar para unidades` retorna ao ranking.
No gráfico `Faturamento mês a mês`, o clique em uma competência abre a composição do faturamento por serviço. O botão `Voltar para evolução mensal` retorna à série temporal.

## Integração com o HUB

O módulo reutiliza o cabeçalho, o rodapé, a identidade visual, os cards (`HUB.cards`) e os gráficos (`HUB.charts`) localizados em `../assets`.

## Síntese executiva

A leitura executiva apresenta até três fatos distintos, quando houver base suficiente:

- concentração financeira nas três maiores posições;
- variação em relação à competência mensal anterior;
- serviço com maior débito identificado em 2026 ou maior exposição proporcional nos exercícios anteriores.

O gráfico mensal usa faturamento em 2026 e débito nas competências históricas. A série respeita os filtros de secretaria e serviço; o filtro de mês define o recorte dos indicadores e, em 2026, a competência usada na comparação.

O ranking identifica as unidades no eixo e mostra o valor diretamente em cada barra. A evolução mensal também exibe rótulos de valor nos pontos. O detalhamento das unidades hospitalares integra a leitura por serviço, dentro de `Limpeza Hospitalar`, sem ocupar um bloco isolado no painel. A leitura por serviço é apresentada como `Desempenho por frente de receita`, e a base analítica como `Débitos em aberto por unidade`.

O painel não consolida 2026 com os exercícios anteriores porque as duas visões possuem fontes e grãos distintos. A linha mensal foi priorizada em lugar de gauge radial ou gráfico de rosca por permitir comparação temporal direta.
