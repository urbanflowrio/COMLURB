# IPL · Índice Padrão de Limpeza — HUB COMLURB

**Status:** ativo no portal principal  
**Área institucional:** DLU · responsável nominal a confirmar  
**Implementação ativa:** `ipl/index.html`

## Nome institucional
O módulo preserva a denominação oficial **Índice Padrão de Limpeza (IPL)**. “Análise territorial” é uma visão do painel e não substitui o nome do indicador.

## Camadas de leitura
1. **Resultado oficial SARC** — usa diretamente os valores publicados na fonte SARC. Sem mês selecionado, usa o campo `Acumulado`; com mês selecionado, usa o valor do respectivo mês. O HUB não recalcula acumulado oficial por média simples.
2. **Diagnóstico territorial calculado pelo HUB** — calcula notas a partir das avaliações de trechos para localizar não conformidades, perda de pontos, reincidência e concentração territorial.

A **prioridade territorial para análise** é uma ordenação analítica do HUB e não um indicador oficial da COMLURB.

## Metodologia territorial preservada
- Lixo Branco: faixas 100 / 80 / 50 / 20 / 0.
- Coleta domiciliar: faixas 100 / 80 / 40 / 20.
- Itens binários: OK / NOK / N/A.
- Pesos de itens N/A são redistribuídos igualmente entre os itens válidos.
- Bens inservíveis, entulho, material de obra e pneus compõem um único item de 6%.
- Meta de referência da interface: 80%, centralizada em `IPL_CONFIG`.

## Leitura territorial
- “Trechos abaixo da meta” representa **trechos únicos** (bairro + logradouro + trecho) com ao menos uma avaliação abaixo da meta.
- “Avaliações” representa a quantidade de registros avaliativos da base.
- “Reincidência” representa o mesmo bairro + logradouro + trecho com duas ou mais avaliações no recorte.
- “Principais fatores de perda” soma a perda de pontos calculada por componente, em vez de contar apenas ocorrências NOK.

## Fontes
As fontes de produção estão declaradas no início do script de `ipl/index.html`:
- SARC · resultado institucional;
- base de avaliações do IPL;
- GeoJSON de bairros;
- coordenadas auxiliares de bairros.

## Código legado
`ipl/app.js` está explicitamente desativado e não é carregado pela página. Não deve receber novas regras de produção.
