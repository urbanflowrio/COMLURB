# Revisão técnica | Engenharia e Operações

Identificação: `DTE-2026-09-15-REV-01`  
Data: 15 de setembro de 2026  
Situação: estrutura técnica aprovada; conciliação externa e validação visual publicadas pendentes.

## Escopo verificado

- sintaxe dos scripts incorporados ao HTML;
- presença e tipo dos botões;
- botão Home pelo componente compartilhado;
- descrição acessível dos gráficos;
- preferência por movimento reduzido;
- ausência de travessões, gráficos de rosca e gradientes;
- tratamento de valores ausentes sem criar falsos zeros;
- janela móvel de até 13 competências;
- estrutura de filtros, gráficos e detalhamentos;
- períodos e continuidade do snapshot local de frota;
- regressão geral do HUB.

A regressão geral terminou com 604 aprovações e nenhuma reprovação.

## Correção crítica de período

A planilha histórica de coleta seletiva usa o primeiro campo de `Período` para abreviar o exercício e mantém `2026` no último campo. Assim:

- `21/01/2026` significa janeiro de 2021;
- `25/12/2026` significa dezembro de 2025;
- `26/07/2026` significa julho de 2026.

A interpretação anterior tratava todos esses registros como meses de 2026. Isso misturava exercícios diferentes na mesma competência. A função de normalização foi corrigida e o snapshot passou a apresentar 67 competências contínuas, de janeiro de 2021 a julho de 2026, sem meses ausentes.

## Verificações do snapshot

| Série | Linhas | Competências | Intervalo | Períodos inválidos |
|---|---:|---:|---|---:|
| Coleta domiciliar | 641 | 7 | jan/2026 a jul/2026 | 0 |
| Coleta seletiva | 521 | 67 | jan/2021 a jul/2026 | 0 |
| Lixo público | 1.434 | 7 | jan/2026 a jul/2026 | 0 |

Há uma linha de coleta seletiva com capacidade igual a zero. A regra vigente a exclui do cálculo de utilização para impedir divisão inválida. A ocorrência permanece na fonte e deve ser investigada pelo responsável funcional.

## Limites e pendências

1. As fontes externas não foram reconsultadas nesta revisão. Os números exibidos ainda precisam ser conciliados no ambiente publicado.
2. As fontes complementares continuam declaradas no próprio módulo e ainda devem ser centralizadas na governança de fontes.
3. O responsável funcional nominal do dado precisa ser formalizado.
4. A Poda Mecanizada permanece sem indicador porque a série oficial de manejos realizados não foi localizada.
5. A homologação visual deve testar desktop, celular, filtros, detalhamentos, estados sem dados e falha de fonte.

## Critério para homologação final

Concluir somente após comparar o painel com cada fonte publicada na mesma data, registrar a competência validada, resolver ou aceitar formalmente a capacidade zero e obter aprovação funcional e visual.
