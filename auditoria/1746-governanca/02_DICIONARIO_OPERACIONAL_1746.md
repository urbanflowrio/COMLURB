# 1746 — Dicionário operacional e de responsabilidades

**Versão:** 0.2 · **Data:** 05/11/2026 · **Situação:** regras confirmadas e hipóteses separadas; **não implantado no HUB**.

## Estrutura mínima dos campos
- `canal`: Chamados ou Ouvidorias (com `institucional` e `operacional` para Ouvidorias, conforme PCO).
- `tipo_original`, `subtipo_original`, `gerencia_registrada`: **nunca sobrescrever**.
- `subtipo_exibicao`: retirar apenas prefixos de Ouvidorias do começo; nomenclaturas equivalentes adicionais exigem aprovação.
- `atividade_analitica`: limpeza / instalação / retirada / instalação-ou-retirada / informação sobre serviço / fiscalização / implantação de serviço / indeterminada.
- `objeto`: papeleira / contêiner / caçamba COMLURB / caçamba comunitária / caçamba particular / varrição / múltiplo.
- `gerencia_executora_validada`: preencher apenas se houver confirmação; nunca deduzir automaticamente pela gerência registrada.
- `status`: Confirmado pela operação (CO) / Evidenciado no nome da fonte (EF) / Pendente (PE) / Em conflito (EC).

## Correspondência operacional inicial
| ID | Tipo/subtipo encontrado na fonte | Canal | Atividade e objeto | Gerência registrada | Executora | Status/observação |
|---|---|---|---|---|---|---|
| OP01 | `PAPELEIRA / INSTALAÇÃO DE PAPELEIRA` (incl. variante OUV -) | Ambos | Instalação de papeleira | LDE nas linhas desse tipo | **LDE** | **CO**: instalação sempre LDE |
| OP02 | `PAPELEIRA / INSTALAÇÃO E/OU RETIRADA DE PAPELEIRA` (incl. OUV -) | Ambos | Instalação ou retirada de papeleira | LDE nas linhas desse tipo | **LDE** | **CO**: instalação/retirada sempre LDE |
| OP03 | `PAPELEIRA / OUV - RETIRADA DE PAPELEIRA` | Ouvidorias | Retirada de papeleira | LDE | **LDE** | **CO** |
| OP04 | `LIMPEZA / (OUV -) INSTALAÇÃO E/OU RETIRADA DE PAPELEIRA` | Ambos | Instalação/retirada de papeleira, **não limpeza** | Gerências territoriais BG/CG/NG/OG/SG | **LDE** | **CO**: executora LDE, registro territorial preservado; não pressupor erro de encaminhamento |
| OP05 | `LIMPEZA / (OUV -) LIMPEZA DE PAPELEIRA, CONTÊINER E CAÇAMBA COMLURB` | Ambos | Limpeza de equipamentos (objeto **múltiplo**, não desagregar) | BG/CG/NG/OG/SG | **Gerências territoriais** | **CO**: limpeza executada pelas gerências territoriais; não atribuir volume separadamente a cada equipamento |
| OP06 | `LIMPEZA (DLU) / OUV - INSTALAÇÃO DE CAÇAMBA DA COMLURB PARA ATENDIMENTO EM COMUNIDADE` | Ouvidorias | Instalação de caçamba comunitária | LRS | **LRS** | **CO** |
| OP07 | `LIMPEZA / OUV - INFORMAÇÃO SOBRE INSTALAÇÃO E RETIRADA DE CAÇAMBA DA COMLURB PARA ATENDIMENTO EM COMUNIDADE` | Ouvidorias | Informação/manifestação relativa à instalação/retirada de caçamba | BG/CG/NG/OG/SG | **Não inferir pelo registro de informação** | **PE**: se confirmada instalação, executora LRS; se confirmada retirada, executora gerência territorial. Papel administrativo da gerência registrada depende do serviço, ainda sem descrição operacional |
| OP08 | `LIMPEZA / OUV - RETIRADA DE CAÇAMBA DA COMLURB INSTALADA PARA ATENDIMENTO EM COMUNIDADE` | Ouvidorias | Retirada de caçamba comunitária | BG/CG/NG/OG/SG | **Gerências territoriais** | **CO**: retirada executada pelas gerências territoriais; não atribuir automaticamente uma gerência específica pela ocorrência |
| OP09 | `FISCALIZAÇÃO DE GRANDE GERADOR / FISCALIZAÇÃO DE CAÇAMBA PARTICULAR...` | Ambos | Fiscalização de caçamba particular | FCZ | Pendente | **EF/PE**: FCZ registrada, executora a confirmar |
| OP10 | `FISC DE REMOÇÃO DE CAÇAMBA PARTICULAR / OUV – FISCALIZAÇÃO DE CAÇAMBA PARTICULAR...` | Ouvidorias | Fiscalização de caçamba particular | FCZ | Pendente | **EF/PE**: analisar equivalência jurídica/operacional com OP09 |
| OP11 | `REMOÇÃO DE CAÇAMBA DE EMPRESA PARTICULAR / (OUV -) REMOÇÃO DE CAÇAMBA PARTICULAR CHEIA` | Ambos | Remoção de caçamba particular | BG/CG/NG/OG/SG | Pendente | **EF/PE**: remoção não é limpeza de equipamento |
| OP12 | `LIMPEZA / OUV - IMPLANTAÇÃO DE VARRIÇÃO` | Ouvidorias | **Significado operacional não definido** (rótulo da fonte não representa necessariamente expansão ou criação de atendimento) | BG/CG/NG/OG/SG | Pendente | **PE**: usuário informou que significa outra coisa; não classificar como ampliação, mudança de itinerário ou execução até receber explicação |
| OP13 | `MANEJO ARBÓREO / AVALIAÇÃO DE PODA...` com/sem `(180 DIAS)` | Ambos | Avaliação de poda | UGV-T e outros conforme fonte | Pendente | **PE**: confirmar que prazo no nome não muda serviço ou acordo de atendimento |
| OP14 | `LIMPEZA / LIMPEZA DE PRAÇAS E PARQUES`, variantes | Ouvidorias | Limpeza de praças/parques | Conforme fonte | Pendente | **PE**: equivalência de nomes precisa de validação |
| OP15 | `CONTROLE DE ROEDORES`, `CONTROLE DE CARAMUJOS` e composição | Ouvidorias | Controle de vetores, atividades potencialmente distintas | Conforme fonte | Pendente | **PE**: não fundir sem decisão |
| OP16 | `COMPORTAMENTO DE EQUIPE`, `DANOS A TERCEIROS` | Ambos | Ocorrência transversal vinculada ao tipo original | Conforme fonte | Conforme serviço original | **EF**: preservar contexto, não unificar entre tipos como um único serviço |

As siglas acima são **valores observados** em fontes e matrizes auditadas; nome da gerência registrada e responsabilidade pela execução são conceitos diferentes. Para OP01–OP06 e OP08 a atribuição operacional, quando preenchida, decorre de validação direta do usuário, não da mera frequência do código na planilha.

## Regras de apresentação
1. Retirar prefixo `OUV -` / `OUV –` (incluindo espaço e variação de travessão) **somente** em `subtipo_exibicao`.
2. Não eliminar distinção entre instalação, retirada, limpeza e fiscalização; tampouco juntar atividades por gerência ou objeto em comum.
3. Todo indicador rotulado `Limpeza` precisa declarar se é **tipo oficial da fonte** ou **atividade analítica de limpeza**.
4. Não atribuir LDE a uma limpeza de equipamento, nem LRS à retirada de caçamba: a **retirada de caçamba comunitária é executada pelas gerências territoriais**, enquanto sua **instalação é da LRS**.
5. Não redistribuir registros territoriais ao mudar executora analítica; manter `gerencia_registrada`, `bairro` e `AP`.

## Perguntas pendentes de negócio
- Nos registros de **informação** sobre instalação/retirada de caçamba, a gerência territorial acompanha, recebe ou encaminha? O texto não permite determinar execução efetiva.
- A categoria de fiscalização de caçamba particular de empresas não credenciadas é exatamente equivalente entre os dois tipos?
- O que **significa de fato** `IMPLANTAÇÃO DE VARRIÇÃO` no 1746? A hipótese anterior de implantação/ampliação não foi confirmada; o usuário informou que é outra coisa.
- Expressões de poda com `180 DIAS` são semanticamente equivalentes?

## Evidências principais
- [Correspondência de Papeleira](../1746-out2026/CORRESPONDENCIA_PAPELEIRA.md)
- [Diagnóstico de classificação](../1746-out2026/DIAGNOSTICO_CLASSIFICACAO_HISTORICO.md)
- Exportações da COMLURB de outubro/2026 (origem de tipos, subtipos, gerências).
- Validações operacionais fornecidas na discussão de 05/11/2026: **LDE para instalação e retirada de papeleiras**, **LRS para instalação de caçamba comunitária**, **gerências territoriais para retirada de caçamba comunitária e limpeza de papeleiras, contêineres e caçambas COMLURB**, solicitação de **eliminar prefixo OUV da exibição**. O papel administrativo das territoriais depende do serviço; o significado de implantação de varrição ainda requer esclarecimento.

**Não é um mapeamento produtivo.** Homologar as linhas PE/EC antes de gerar séries analíticas.

## Registro de validação operacional — 05/11/2026
- **Confirmado:** retirada de caçamba comunitária → gerências territoriais (BG/CG/NG/OG/SG em conjunto, sem presumir código individual).
- **Confirmado:** limpeza física de papeleiras, contêineres e caçambas COMLURB → gerências territoriais. O subtipo de limpeza continua agregado para os três objetos.
- **Pendente de explicação:** papel das territoriais em cada tipo de solicitação/manifestação; não marcar automaticamente como executoras apenas pelo campo de gerência registrada.
- **Pendente de definição:** o significado de `IMPLANTAÇÃO DE VARRIÇÃO`; o usuário rejeitou a interpretação anterior, sem especificar ainda a correta. Não criar regra de classificação a partir do nome.
