# Revisão técnica | Território Operacional

Identificação: `TER-2026-09-15-REV-01`  
Data: 15 de setembro de 2026  
Situação: estrutura técnica aprovada; validação visual publicada pendente.

## Correções realizadas

- restauração das opções Unidades COMLURB, Gerências DSU e Bairros DLU;
- correção do acesso às unidades a partir das áreas DSU e DLU;
- leitura do campo `first_superdlu` existente na camada DLU;
- substituição do gráfico de rosca por barras horizontais;
- retirada de gradientes e da expressão “recorte”;
- configuração explícita de todos os botões;
- descrição acessível do gráfico;
- suporte à preferência por movimento reduzido;
- melhoria da legibilidade e do comportamento em telas menores;
- preservação do botão Home pelo componente compartilhado.

## Verificações das fontes locais

| Fonte | Registros válidos | Observação |
|---|---:|---|
| `data/unidades_comlurb.csv` | 342 | Todas as unidades possuem latitude e longitude válidas |
| `GERENCIAS_DSU.geojson` | 6 feições | Seis Gerências DSU identificadas |
| `DLU_Novos_Bairros_estrutura2025.geojson` | 215 feições | Feições associadas a cinco Superintendências DLU |

Nenhum arquivo de dados ou GeoJSON foi modificado.

## Validação técnica

- scripts incorporados sem erro de sintaxe;
- nenhum botão sem `type`;
- gráfico com descrição acessível;
- nenhum travessão, gradiente, gráfico de rosca ou ocorrência de “recorte” na página principal;
- regressão geral com 604 aprovações e nenhuma reprovação.

## Pendências para homologação final

1. Confirmar a data de referência do cadastro `unidades_comlurb.csv`.
2. Formalizar a área responsável pela manutenção do cadastro e dos GeoJSON.
3. Testar a página publicada em desktop e celular.
4. Conferir filtros, busca, hierarquia, popups e retorno das camadas para as unidades.
5. Confirmar funcionalmente se o nome “Bairros DLU” deve ser mantido, pois o GeoJSON identifica as feições pela Superintendência DLU e não contém o nome individual do bairro.
