# Balanço de Receita | Homologação técnica

Identificação: `BAL-2026-09-15-TEC-01`.

Data: 15 de setembro de 2026.

## Resultado

Homologação técnica aprovada. A validação visual da página publicada em computador e celular permanece pendente porque o ambiente de verificação não conseguiu acessar o GitHub Pages nesta execução.

## Integridade da versão

| Arquivo | SHA-256 |
|---|---|
| `index.html` | `2bcb0b2f67f046300cef4072c7095bc5ae4f93aa3b912f42142df9d55c67f481` |
| `balanco-receita.js` | `f26e55a21d0d5e36557e388c8d4f937606f4eaad02bd52aa5dc657fd0bfff8ad` |
| `balanco-receita.css` | `c0a7bf34f64300bd1718266dd18667f7b519645d5a0b9e7555dbdcee2c4bc73a` |
| `validacao/index.html` | `71571f3db867c5b2dbee3261953b1a387808bdf08234e5e745acfa7233cfb83f` |

Os quatro arquivos são idênticos aos recebidos no pacote 60. Não houve alteração de cálculo, fonte, número ou interface nesta homologação.

## Evidências aprovadas

- Sintaxe JavaScript válida.
- Todos os identificadores consultados pelo JavaScript existem no HTML.
- Exclusão das linhas `Total` e `Total Geral` preservada.
- Padronização de serviços e unidades preservada.
- Ausência de pagamento em 2026 continua apresentada como `Sem informação`, não como zero.
- Terceiro indicador de 2026 permanece como `Serviços com débito identificado`.
- Seleção de ano aplicada aos indicadores, ao gráfico `Onde está o débito`, à leitura por serviço e à tabela analítica.
- Clique anual abre somente os meses do exercício selecionado.
- Botão `Voltar para anos` limpa a seleção e restaura o consolidado.
- Filtros de Secretaria, Serviço e Mês limpam corretamente o contexto anual quando alterados.
- Regra para barras curtas posiciona o valor fora da barra quando não há espaço interno.
- Layout possui regras responsivas específicas para larguras de 1.100, 820 e 700 pixels.
- Validador independente permanece na subpasta `validacao/`.

## Testes executados

| Teste | Resultado |
|---|---|
| Verificações financeiras isoladas | 9 aprovadas, nenhuma reprovada |
| Regressão integral do HUB | 604 aprovadas, nenhuma reprovada |

As verificações isoladas cobriram número em formato brasileiro, unidade padronizada, serviço padronizado, exclusão de total, leitura do débito, filtro anual global, detalhamento mensal anual, leitura do faturamento mensal e soma do faturamento.

## Evidência numérica já existente

A última conciliação conhecida do validador registrou:

- faturamento bruto total de R$ 286.695.447,98;
- débito líquido total de R$ 47.939.420,22;
- 16 grupos conciliados;
- divergência total de R$ 0,00.

Esses valores não foram reconsultados na fonte nesta execução. Portanto, esta homologação não afirma que a planilha não tenha sido alterada depois da última conciliação.

## Pendências para homologação completa

1. Abrir a página publicada depois da atualização do GitHub Pages.
2. Conferir os totais atuais contra o validador publicado.
3. Testar todos os cliques e retornos em computador.
4. Testar filtros, gráficos e tabela em celular.
5. Registrar a competência atual exibida pela fonte.
6. Informar o responsável funcional da área financeira.

Somente depois dessas seis verificações o módulo poderá receber a situação `Homologado` sem ressalvas.
