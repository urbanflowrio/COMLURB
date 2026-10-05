# 05 · Plano de validação científica

## 1. Validação de dados
- fechamento por fonte;
- bairros cobertos;
- aliases territoriais;
- duplicidades;
- missing;
- coerência temporal.

## 2. Validação retrospectiva
Calcular o modelo em T0 usando apenas dados disponíveis até T0 e observar T+1/T+2/T+3.

Perguntas possíveis:
- territórios priorizados persistiram críticos?
- houve piora posterior do IPL?
- houve crescimento posterior de chamados/ouvidorias?
- a priorização capturou recorrência melhor que um indicador isolado?

## 3. Validação com especialistas
Coletar ordenações independentes ou julgamentos de prioridade e comparar com o modelo.

Medidas possíveis:
- correlação de Spearman;
- Kendall tau;
- concordância por faixas/top-k;
- análise qualitativa de divergências.

## 4. Sensibilidade
Variar pesos, normalização e parâmetros dentro de faixas justificáveis.

Resultados a registrar:
- estabilidade do Top 5/10;
- mudança média de posição;
- bairros mais sensíveis;
- critérios dominantes.

## 5. Validação de explicabilidade
Para cada bairro priorizado, deve ser possível explicar quais critérios sustentaram a posição.

## 6. Registro de falhas
Divergência não deve ser apagada. Casos em que o modelo falha são parte do resultado científico.
