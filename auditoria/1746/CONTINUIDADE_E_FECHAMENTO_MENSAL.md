# HUB 1746 — continuidade e fechamento mensal

Atualizado em 17/11/2026. Responsável pela decisão de incorporar revisões e pela homologação executiva — Greicy Moreira.

## Comece aqui

Este documento registra como continuar o trabalho sem depender do histórico do chat. Antes de atuar, leia este arquivo, a planilha oficial e os arquivos de corte publicados. Confira as versões atuais antes de editar. Execute somente as etapas autorizadas e registre resultados concretos.

## Arquivos e funções

| Recurso | Endereço | Uso |
|---|---|---|
| Bases oficiais | https://drive.google.com/drive/folders/13cmvRlXG2bzzoRQ2qNrzNxZDq4psLbDD | Pasta base historico |
| Chamados | https://docs.google.com/spreadsheets/d/1JHyp28FigzUrvD9H_EAynap5PgQSrmYQDCOgMtiRkw8/edit | Fonte histórica atualizada pela Greicy |
| Ouvidorias | https://docs.google.com/spreadsheets/d/1-JdPs02T9grCOQgdUz5522bZvqOAUbD32QIaerjXy0U/edit | Fonte histórica atualizada pela Greicy |
| Auditorias | https://drive.google.com/drive/folders/1al5FkJdvWHEEjZEOYFEtlBa4-m42O-DE | Fechamentos e cópias identificadas |
| Auditoria oficial outubro | https://docs.google.com/spreadsheets/d/1vpL5fEmzyy5c3grf4ZNiDNpDepLYVtTGcPuztwQwt8A/edit | Arquivo correto para consultar outubro. Modelo integrado em 17/11 |
| Teste Apps Script v3 | https://docs.google.com/spreadsheets/d/16u81q37Nx-yn3UEEwwBykzji14NETN5DHJHQjcemAWo/edit | Contém novembro SIMULADO e revisões sintéticas. Nunca tratar como fonte oficial |
| Teste anterior | https://docs.google.com/spreadsheets/d/1PHWfjDfmiOa7V7qT_WSUKrhHnz7kn3dIB9Q0p3xo74E/edit | Etapa anterior de validação |
| Cópia de recuperação | https://docs.google.com/spreadsheets/d/1Pv93K_nIpsUGzNlD9biqhlBuWv0y-CGbzmMvCRR8vFg/edit | Estado de outubro antes da integração de 17/11 |
| Projeto Apps Script oficial | https://script.google.com/u/0/home/projects/1SHkCyoXThkxBfNZnkRsg-EyApmIcGsmwWjh1ShfvqSzdWcsXAEcO6fMC/edit | Projeto vinculado aberto pela planilha oficial. Nome Fechamento mensal HUB 1746. Função fecharMes |

Se um link do Apps Script não abrir, entre na planilha oficial e use Extensões → Apps Script. As permissões dependem da conta Google.

## Decisão sobre o histórico

Em 17/11/2026 Greicy aprovou a republicação de 16/11/2026 como referência oficial, incluindo janeiro a setembro recalculados. A aprovação está na aba Aprovação do histórico da auditoria oficial. O commit 5c7f6d1 publicou os seis módulos. A versão de 05/11, commit 149324f, permanece como versão anterior para rastreabilidade.

Exemplos da revisão já incorporada e aprovada:

| Indicador | Versão anterior | Referência aprovada |
|---|---:|---:|
| Chamados outubro/2026 | 24.116 | 24.120 |
| Ouvidorias operacionais outubro/2026 | 2.213 | 2.267 |
| Variação das Ouvidorias de outubro contra 2025 | −17,9% | −15,9% |
| Chamados jan–out/2026 | 278.888 | 278.807 |
| Ouvidorias jan–out/2026 | 32.562 | 32.587 |

Os arquivos de corte informam 11/11/2026. A data real da extração de Chamados ainda precisa de comprovante próprio. A data de alteração no Drive não prova a data da extração.

## Regra para revisões futuras

Cada fechamento publicado fica congelado em todos os recortes, inclusive bairro, serviço, subtipo, AP e gerência. O acumulado oficial soma os meses congelados com o novo mês.

Toda nova extração deve ser comparada com os meses fechados. Registrar qualquer diferença e seu efeito sobre indicadores, taxas, rankings, tendências, prioridades e metas aplicáveis. Revisões com saldo municipal zero também devem aparecer, pois podem mudar bairros e serviços.

Exemplo — outubro publicado com 1.200 e extração de novembro com 1.210. Outubro e o acumulado oficial usam 1.200. Registrar +10 como revisão de outubro. Se houver impacto na leitura publicada, apresentar a revisão à Greicy para decisão. Após aprovação formal, atualizar de forma consistente todos os recortes e registrar a versão anterior, a nova, a fonte, a data e a aprovação. Não usar limiar percentual fixo como único critério.

## O que a Greicy faz

Atualiza os dois arquivos oficiais de Chamados e Ouvidorias e identifica competência e data de corte. O período parcial precisa estar distinguido do fechamento oficial. Uma base pronta pode ser auditada internamente; a comparação final depende dos valores publicados do mesmo período.

## Rotina completa para quem executar

1. Ler este documento e conferir arquivos oficiais, competência, corte e última auditoria. Identificar se houve nova extração nos mesmos arquivos. Ignorar cópias de teste como fontes.
2. Preparar a auditoria da competência no padrão Auditoria HUB 1746 - AAAA-MM. Preservar o arquivo do fechamento anterior e sua referência. Verificar se já existe auditoria da mesma competência para evitar duplicação.
3. Importar as duas fontes, conservar os campos originais e aplicar os catálogos aprovados. Informar os números dos meses em todas as linhas novas, inclusive na coluna auxiliar O. Essa coluna precisa estar preenchida antes de calcular os dados oficiais.
4. As abas Fechado Chamados e Fechado Ouvidorias guardam as linhas publicadas como valores. As abas Dados combinam os meses anteriores guardados com a competência atual. Congelados registra os totais publicados. Parâmetros define o mês analisado.
5. Conferir Mensal, Serviços, Bairros e taxas, Território e Decomposição. Os detalhes devem somar o mesmo total oficial. Um serviço novo deve ser sinalizado e incluído após validar a classificação.
6. Registrar revisões de todos os meses anteriores, incluindo mudanças de conteúdo com saldo zero. Na planilha, Revisões compara os totais e Registro de revisões guarda o resultado detalhado da rotina. Revisões não incorporadas é o conceito de governança. A aba de totais isolada não detecta todas as mudanças de recorte.
7. Capturar valores publicados com fonte, caminho ou chave, data e competência. Atualizar a competência da referência em Conferência e Bairros e taxas. Quando houver referência de outro mês, mostrar Pendente.
8. Consultar Placar. Separar comparações com o HUB, controles internos, pendências e repetições. Uma pendência precisa de explicação. Confirmar que a contagem fecha. Não apresentar todas as linhas como evidências independentes.
9. Depois de reconciliar o publicado, guardar as linhas do mês, registrar os totais em Congelados e criar um único registro de fechamento. Conferir conteúdo e totais antes de avançar a competência.
10. Em interrupções, conferir o estado já gravado e retomar sem duplicar. O script v3.1 trata retomada por conteúdo das linhas em A:O, desconsiderando sua ordem. Meses já concluídos não devem ser regravados com uma revisão posterior sem aprovação.
11. Entregar link da auditoria, resultado dos controles, revisões e limitações. Em ausência de nova extração, nenhuma nova auditoria deve ser criada.

## Regras de dados

- Chamados excluem registros com marcação OUV conforme catálogo. Ouvidorias operacionais excluem PCO.
- Tipo original determina o serviço. Preservar os campos originais e o mapeamento.
- Limpeza agrega LIMPEZA e LIMPEZA (DLU).
- Instalação ou retirada de papeleira é distinta de limpeza de papeleira, contêiner e caçamba.
- Campo Grande inclui os registros de OG18G dentro do bairro. Evitar dupla contagem.
- AP nula de Chamados foi atribuída à AP3 no recorte conciliado. Jabour pertence à AP5.
- Chamados por 10 mil moradores = Chamados do bairro ÷ moradores do bairro no Censo 2022 do IBGE × 10.000. A população do bairro não representa toda a cobertura de uma gerência.
- As bases são exportações agregadas. A conciliação não comprova cada protocolo individual.

## Automação e Apps Script

Existem duas rotinas distintas.

A tarefa Auditoria mensal do 1746 no ChatGPT verifica as bases diariamente, por volta das 15h25 de Brasília, e compara com o HUB. Suas instruções incluem esta governança, aprovação da referência de 16/11 e uso do modelo validado. A configuração agendada não prova que um fechamento futuro já foi executado.

O Apps Script fecharMes está salvo no projeto oficial, conforme tela apresentada pela Greicy em 17/11. Nenhum acionador de execução automática foi confirmado no projeto oficial. Salvar o código não cria agendamento. Não é necessário usar Implantar para a rotina vinculada à planilha. A primeira autorização e execução oficial continuam pendentes. O conector do Drive pode ler e gravar planilhas, mas não executa por si só o Apps Script. Uma simulação pela API deve ser descrita como simulação.

O script não importa sozinho as duas fontes do Drive nem publica os seis painéis. Esses passos pertencem ao processamento mensal descrito acima. Evitar prometer publicação automática por apenas colar dados nas fontes.

## Validações concluídas em 17/11

O roteiro v3.1 foi executado no Apps Script da cópia de teste e mostrou ROTEIRO COMPLETO: PASSOU em 117,5 segundos. Cenários executados — interrupção após Chamados, retomada e repetição. Foram guardadas 2.721 linhas de Chamados e 1.563 de Ouvidorias no novembro simulado. As revisões sintéticas incluíram Portuguesa +2 e Zumbi −2 em agosto, +5 Chamados em setembro e +2 Ouvidorias em outubro. Esses números são exclusivamente do teste.

A integração da estrutura na auditoria oficial de outubro foi conferida pelo conector. Resultado — 135 comparações com o HUB e 20 controles internos aprovados, zero divergências, cinco pendências e 61 repetições à parte. Total de 221 linhas de teste. Os 162 bairros fecharam com o total oficial. Acumulados oficiais — Chamados 245.647 em 2025 e 278.807 em 2026; Ouvidorias 28.192 e 32.587.

A migração preservou as bases reais de outubro. A estrutura foi transferida sem incorporar os registros sintéticos de novembro. O projeto oficial recebeu apenas o código de fechamento; o roteiro sintético pertence à cópia de teste.

## Pendências e próximo passo

| Item | Situação e ação |
|---|---|
| Primeiro fechamento real com o novo modelo | Pendente. Quando novembro oficial estiver disponível, validar todo o caminho fonte → classificação → revisão → painel → auditoria → congelamento |
| Autorização e primeira execução oficial do Apps Script | Pendente. Conferir competência e controles antes de executar e guardar log e tempos |
| Agendamento no Apps Script | Nenhum acionador confirmado. A tarefa do ChatGPT já faz a verificação diária. Avaliar necessidade antes de criar outra rotina |
| Data real da extração de Chamados | Não comprovada. Obter registro de extração da COMLURB |
| Cinco pendências da planilha | Referências de decomposição de outubro sem comprovação como publicação. O cálculo fecha; registrar como pendência de referência, sem convertê-la em aprovação |
| Conferência visual dos cartões do Histórico | Pendente no navegador. Pelo código e recálculo, jul–ago 2025 → 2026 = 147,5 → 133,6 e setembro = 144,8 → 137,8 por mil, sem Remoção Gratuita |
| Rótulos antigos nas páginas | Reinspecionar o estado atual. Histórico teve jan–set e corte 05/10, Comparativo teve histórico congelado até não informada, Chamados teve Sem AP (Ago). Corrigir somente os rótulos que ainda estiverem presentes e documentar a mudança |
| Documento antigo RASTREABILIDADE.md | Mantém números anteriores de 05/11. Consultar o aviso de versão e este documento para a referência de 16/11 |
| Virada 2026 → 2027 | O modelo compara colunas 2025 e 2026 e o script não avança dezembro para janeiro. Adaptar parâmetros, colunas, assinaturas e registros para incluir o ano antes de usar em 2027 |
| Desempenho | Acompanhar o tempo real das novas competências e as abas de dados que replicam a base |

## Como deixar a continuidade registrada

Ao concluir uma alteração, atualizar este arquivo com data, ação, evidência, resultado e pendência. Registrar a fonte e a versão utilizadas. Guardar snapshots e decisões aprovadas. Diferenciar publicado, calculado, testado e efetivamente executado. Ler o estado atual dos arquivos antes de afirmar que algo continua válido.

## Organização da pasta AUDITORIA — atualizada em 17/11/2026

Na [pasta AUDITORIA](https://drive.google.com/drive/folders/1al5FkJdvWHEEjZEOYFEtlBa4-m42O-DE), os arquivos de consulta são os fechamentos oficiais, com nome Auditoria HUB 1746 - AAAA-MM. Outubro é a planilha oficial já vinculada neste guia. A aba Leia primeiro explica essa organização.

| Local | Conteúdo | Quando consultar |
|---|---|---|
| Pasta principal AUDITORIA | Auditorias oficiais mensais | Consultar, conferir e continuar o trabalho |
| [Arquivo de versões](https://drive.google.com/drive/folders/1s-vCGYYIfKhblwL-qCDyZuUoSog9znF7) | ARQUIVO - Auditoria outubro antes da integração - 17-11-2026 | Recuperar o estado anterior ou comparar versões |
| [Testes](https://drive.google.com/drive/folders/1X4XxvyQYKxBnVIlQ5X87a3vMuYK32hwU) | Teste Apps Script v3 e teste anterior de fórmulas por critério | Consultar evidências técnicas e repetir testes em cópias |

A cópia v3 contém novembro simulado e alterações artificiais. Esses dados não pertencem ao fechamento oficial. As três planilhas auxiliares foram movidas para as subpastas, mantendo seus IDs e links. Nunca escolher a fonte somente pela data da última modificação ou por ser o arquivo maior. Usar a função e os links registrados neste documento.
