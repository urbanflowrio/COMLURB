# Rotina mensal — DAF / HUB COMLURB

## Referência
Painel oficial: `balanco-receita/`.
Fonte gerencial: planilha DAF validada no Google Sheets e os fechamentos mensais encaminhados pela DAF.
Arquivos publicados: `balanco-receita/inteligencia/data.js` (base detalhada estática) e `balanco-receita/balanco-receita.js` (lógica visual e filtros).

**Não alterar o HTML, o CSS ou a lógica do painel para atualizar uma competência.**
**Não misturar o estoque histórico de débitos com o saldo líquido a pagar do exercício.**

## Entrega mensal necessária
1. Fechamento DAF atualizado, com abas **Débitos**, **Valores Faturados 2026** e **Visão Geral 2026**; manter exercícios anteriores quando existirem.
2. Mês/ano de corte explícito e indicação de competências fechadas ou parciais.
3. Se houver revisão de exercícios anteriores, fornecer justificativa e preservar registro da mudança.
4. Quando a DAF não tiver enviado uma fonte, manter o último fechamento homologado e indicar pendência, nunca completar com zeros estimados.

## Processo obrigatório (a cada mês)
1. Congelar backup de `data.js` e registrar o commit atual do GitHub.
2. Ler a planilha atual e a versão anterior; validar chaves de lançamentos, atualizações retroativas, duplicidades e competências.
3. Regerar **registros** a partir de Débitos, preservando secretaria, serviço, unidade, contrato, ano, competência, NF, faturamento bruto, valor pago, débito líquido e débito bruto.
4. Regerar **faturamentoDetalhado** a partir das linhas de unidade da aba Valores Faturados (excluir linhas **Total** e **Total Geral**), preservando mês, serviço, unidade e valor numérico.
5. Regerar **faturamentoMensal** a partir do detalhe, não de valores digitados manualmente.
6. Regerar **resumo** a partir da aba Visão Geral (linhas detalhadas, sem contar subtotais em duplicidade).
7. Preencher `corte` e `fonte`, com identificação inequívoca da competência e da origem.
8. Conferir: soma dos lançamentos vs Débitos; faturamento detalhado vs total da planilha; faturamentoMensal vs detalhe; resumo vs demonstrativo; quantidade de registros por secretaria/serviço; período máximo; não haver meses futuros populados.
9. Em caso de divergência, **não publicar** e registrar causa; diferenças centesimais imateriais só poderão ser aceitas mediante registro expresso, nunca silenciosamente.
10. Publicar somente `balanco-receita/inteligencia/data.js`, com cache renovado em `balanco-receita/index.html` quando necessário.
11. Validar no site: abertura, mês final, indicadores, gráficos e filtros secretaria → serviço → mês, além da investigação histórica.
12. Registrar em histórico: competência, data, total faturado, estoque líquido, quantidade de lançamentos, comparação com mês anterior, responsável e commit.

## Critérios de aceite
- O painel informa a competência publicada e permite distinguir **acumulado do exercício** de **estoque histórico**.
- O detalhamento por serviço e secretaria continua funcionando, sem fallback simplificado.
- Nenhum indicador fica em zero por erro de carregamento.
- Mudanças retroativas são documentadas.
- O painel antigo e outros módulos do HUB não são modificados.
- A DAF não é considerada *homologada contabilmente* apenas porque a exibição do HUB passou nos testes.

## Prompt mensal pronto para usar
> Atualize o módulo Balanço Receita / DAF do HUB COMLURB com os novos arquivos do fechamento [mês/ano]. Preserve o visual e a navegação aprovados. Faça backup da versão atual, reconcilie todas as abas e o histórico, atualize exclusivamente os dados estáticos do módulo, compare com o mês anterior, valide os filtros e entregue um parecer com divergências, totais e commit publicado. Não publique se houver diferença material sem justificativa. Preserve o HUB oficial e nunca transforme falha de carga em zero.
