# Como manter a classificação do 1746

Use este guia ao receber uma nova extração. A unidade do catálogo é a combinação **canal + Tipo original + SubTipo original**.

## Referência de 11/11/2026

| Canal | Catálogo | Linhas da fonte | Combinações | Combinações excluídas |
|---|---|---:|---:|---:|
| Chamados | [CSV](CATALOGO_CHAMADOS_1746.csv) | 63.738 | 91 | 21 |
| Ouvidorias | [CSV](CATALOGO_OUVIDORIAS_1746.csv) | 41.829 | 163 | 0 |

[Planilhas históricas de origem](https://drive.google.com/drive/folders/13cmvRlXG2bzzoRQ2qNrzNxZDq4psLbDD)

Os CSVs usam UTF-8 e ponto e vírgula. `linhas_agregadas` indica quantas linhas da planilha contêm a combinação. Cada linha pode representar vários registros, distribuídos nas colunas de ano. As 21 combinações excluídas correspondem a 44 linhas agregadas de Chamados. Para apurar o impacto em volume, some os valores das colunas de ano por competência.

## Aplicação

1. Identifique as colunas pelos cabeçalhos. A ordem difere entre as duas bases. Preserve o canal, o Tipo e o SubTipo originais.
2. Procure a combinação exata no CSV do canal. Para `EXCLUIR_OUV`, retire a linha dos indicadores de Chamados antes de agregar. Para `MANTER`, use `tipo_hub` e `subtipo_hub` em filtros, tabelas, gráficos e detalhamentos. As colunas de exibição ficam vazias nas linhas excluídas.
3. Aplique as [regras aprovadas](REGRAS_DE_CLASSIFICACAO_E_NOMENCLATURA_1746.md). Exemplos: uma linha de Chamados com `OUV - CAPINA EM LOGRADOURO` é excluída. Em Ouvidorias, o mesmo rótulo aparece como **Capina em logradouro**. **Instalação ou retirada de papeleira** pode aparecer em Limpeza ou Papeleira, conforme o Tipo de origem. **Limpeza** inclui `LIMPEZA (DLU)`. Os demais sufixos de Tipo, como `COLETA DOMICILIAR (DLU)`, permanecem identificados.
4. Mantenha os critérios de período e de escopo dos indicadores. Por exemplo, em Ouvidorias, `MANTER` no catálogo significa manter na base do canal. A separação entre manifestações operacionais e PCO continua sendo aplicada no cálculo dos indicadores pertinentes.

## Próxima extração

1. Registre a data da extração, as planilhas de origem e o período usado. Liste as combinações observadas e compare com a versão anterior do catálogo.
2. Para rótulos novos, aplique primeiro a regra do canal. Registre variantes comprovadamente equivalentes no catálogo. Se houver diferença de escopo, mantenha o rótulo de forma distinta até esclarecer o significado com a área responsável. Exemplos de distinções relevantes: praça, parque e o rótulo combinado; avaliação de poda com e sem a indicação de 180 dias; implantação e rotina de varrição.
3. Acrescente ou revise a linha do catálogo com o nome original, o nome exibido e o tratamento. Registre a data e o motivo de qualquer nova consolidação de negócio. As equivalências adicionais da versão inicial são ajustes editoriais, como **Resíduo de coleta domiciliar** e **Resíduo da coleta domiciliar**. Os CSVs registram a correspondência exata.
4. Concilie por mês e ano. Em Chamados, confira **total da fonte = total elegível + volume excluído por OUV**, antes de outros recortes. Em Ouvidorias, confira a igualdade dos totais antes e depois da normalização dentro do mesmo escopo. Confirme também que a soma dos SubTipos corresponde ao respectivo Tipo e que a consolidação de Limpeza soma os dois rótulos de origem uma única vez.
5. Confira os mesmos nomes e totais nos módulos que compartilham o indicador e registre a extração usada. Guarde as versões anteriores no histórico do repositório.

## Situação desta versão

Os catálogos foram conferidos contra as combinações observadas nas duas planilhas. A integração aos módulos e a recontagem dos volumes são etapas posteriores.
