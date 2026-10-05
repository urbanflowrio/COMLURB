# 02 · Dicionário inicial de dados

| Variável | Fonte | Unidade | Granularidade | Periodicidade | Direção preliminar | Observação |
|---|---|---|---|---|---|---|
| Bairro | Território | texto | bairro | estrutural | n/a | chave analítica principal |
| AP | Território | categoria | bairro | estrutural | n/a | atributo territorial |
| Gerência DLU | Território | categoria | bairro | estrutural | n/a | atributo operacional |
| IPL territorial | IPL | % | bairro | conforme avaliações | maior = melhor | diagnóstico territorial, não nota oficial SARC |
| Avaliações IPL | IPL | contagem | bairro | conforme avaliações | contextual | mede cobertura/amostra, não desempenho |
| Trechos abaixo de 80 | IPL | contagem | bairro | conforme avaliações | maior = pior | requer avaliar exposição/amostra |
| Reincidências | IPL | contagem | bairro | conforme avaliações | maior = pior | requer definição temporal formal |
| Chamados 1746 | 1746 | contagem | bairro | mensal/acumulado | maior = maior pressão | volume absoluto pode exigir denominador |
| Variação 1746 YoY | 1746 | % | bairro | acumulado comparável | maior = pior, em princípio | interpretar base pequena com cautela |
| Ouvidorias | Ouvidoria | contagem | bairro | mensal/acumulado | maior = maior criticidade | volume absoluto pode exigir denominador |
| Variação Ouvidoria YoY | Ouvidoria | % | bairro | acumulado comparável | maior = pior, em princípio | interpretar base pequena com cautela |
| Completude | Integração | flag | bairro | execução | maior = melhor qualidade | atributo de qualidade, não desempenho |

## Variáveis candidatas futuras
- chamados por população;
- chamados por extensão de logradouros;
- chamados por frequência operacional;
- persistência crítica em 3/6/12 meses;
- tendência móvel;
- severidade por tipo/subtipo;
- capacidade operacional;
- cobertura de coleta/varrição;
- variáveis socioespaciais, caso justificadas e autorizadas.

## Atenção metodológica
Não normalizar nem ponderar critérios antes de justificar:
1. o significado do critério;
2. a direção de preferência;
3. o denominador adequado;
4. a comparabilidade territorial;
5. a sensibilidade do resultado.
