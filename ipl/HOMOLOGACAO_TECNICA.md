# Homologação técnica — IPL · Índice Padrão de Limpeza

**Data da revisão:** 17/09/2026  
**Escopo:** estrutura, metodologia implementada, semântica dos indicadores e regressão local do módulo.

## Resultado
**Revisão técnica estrutural aprovada com pendência de conciliação externa e validação visual publicada.**

## Controles verificados
- Nome institucional preservado: **Índice Padrão de Limpeza**.
- Pesos territoriais totalizam 100%.
- Redistribuição de N/A preservada.
- Resultado oficial SARC não é recalculado pelo HUB: usa `Acumulado` da fonte ou o valor mensal selecionado.
- Diagnóstico territorial é identificado como cálculo do HUB.
- Trechos abaixo da meta são deduplicados por bairro + logradouro + trecho.
- Reincidência exige duas ou mais avaliações do mesmo trecho no recorte.
- Fatores de perda usam contribuição efetiva de pontos da metodologia calculada.
- Mapa territorial usa uma camada principal de polígonos por nota, sem heatmap sobreposto.
- `ipl/app.js` legado está inerte e sem placeholders de produção.

## Pendências para homologação operacional final
1. Conciliar uma amostra dos valores SARC exibidos com a planilha publicada no ambiente de produção.
2. Confirmar formalmente responsável institucional nominal pelo indicador/módulo.
3. Validar visualmente a página publicada em desktop e resolução de reunião/sala de situação.
4. Registrar qualquer alteração futura da meta em fonte ou regra de governança central.
