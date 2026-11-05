# 1746 — Matriz de correspondência histórica e plano de decisão

**Data:** 05/11/2026 · **Situação:** inventário auditável para deliberação, sem reprocessamento de fechamentos.

## Regra da matriz
Manter seis colunas lógicas por registro: `tipo_original` / `subtipo_original` / `tipo_congelado` / `subtipo_congelado` / `atividade_analitica_proposta` / `ruleVersion`. Toda transformação precisa de origem, período de vigência, prova de equivalência, evidência da conferência e sinalizador de divergência. A simples remoção de `OUV -` altera somente exibição.

## 16 ocorrências identificadas no diagnóstico (não todas são erros)
| ID | Grupo | Ocorrência | Impacto conhecido | Decisão/tratamento proposto | Estado |
|---|---|---|---|---|---|
| H01 | Erro nosso | Chamados PAPELEIRA de instalação/retirada somados a LIMPEZA nos meses jan–set | 1.535 (2025) e 460 (2026) nos meses fechados; série Limpeza infla e tendência fica subestimada | Preservar cubo fechado; preparar derivação automática separando atividade | Pendente homologação |
| H02 | Erro nosso | Base de julho transformou subtipo instalação/retirada em limpeza de papeleira/contêiner/caçamba | 1.144 (2025) e 459 (2026) jan–jul; subtipo contaminado | Não usar esse subtipo transformado como descrição original; reconciliação por origem | Pendente homologação |
| H03 | Fonte | Ouvidorias instalação/retirada de papeleira dentro de tipo LIMPEZA | 4 e 329 jan–out congelado; outubro +158 oficial versus +86 excluindo 72 | Distinguir tipo oficial e atividade ajustada, sem mudar os totais | Diagnóstico confirmado |
| H04 | Fonte | Reclassificação retroativa julho–set das ouvidorias | 170 no tipo LIMPEZA em fechamento versus 4 na extração atual, por subtipo | Priorizar snapshot congelado; registrar diferenças não incorporadas | Pendente conciliação detalhada |
| H05 | Fonte | Chamados de implantação/retirada no próprio tipo LIMPEZA | 68 (2025) e 4 (2026) jan–out | Classificar atividade sem alterar gerência ou tipo original | Pendente |
| H06 | Serviço distinto | Informação sobre instalação/retirada de caçamba comunitária sob LIMPEZA | 2.117 (2025), 3.506 (2026); cerca de 38% do crescimento de Ouvidorias de Limpeza na fonte | Separar classe analítica `informação relativa a caçamba`; não imputar execução | **Decisão operacional pendente** |
| H07 | Hipótese | Subtipo retirada de caçamba comunitária versus informação instalação/retirada | 221 (2025), 9 (2026), possível mudança de nome | Não unificar antes de verificar equivalência | A confirmar |
| H08 | Serviço distinto | Implantação de varrição no tipo LIMPEZA | 39 e 4 jan–out | Identificar implantação de serviço (não execução de varrição) | Pendente |
| H09 | Agrupamento irredutível | Um subtipo reúne limpeza de papeleira, contêiner e caçamba | Chamados 1.660 e 2.874 jan–out | Objeto `múltiplo` até existir detalhamento; nunca repartir proporcionalmente | Tratamento proposto |
| H10 | Fonte | Fiscalização de caçamba particular em tipos diferentes | Chamados 1 (2025) e 86 (2026), 70 out/26 | Confirmar equivalência e unidade fiscalizadora | A confirmar |
| H11 | Nomenclatura | Poda com/sem `(180 DIAS)` | Acumulado por subtipo dividido; tipo permanece igual | Conferir significado de prazo; exibição única somente após validação | A confirmar |
| H12 | Nomenclatura | Prefixo `OUV -` removido jan–set e mantido em outubro | Subtipos duplicados no acumulado | **Retirar prefixo da exibição** em todo o histórico; preservar origem; teste semântico | Confirmado como diretriz |
| H13 | Nomenclatura | `praças e parques` versus `parque` | Pequeno, regra em mapa anterior | Manter relação documentada, testar equivalência | Verificar |
| H14 | Hipótese | `limpeza de praças` versus `praças e parques` | 36 e 28 jan–out | Não unir automaticamente | A confirmar |
| H15 | Hipótese | `controle de roedores`, `caramujos` e variante composta | 42 e 3 jan–out | Não unir atividades sem validação | A confirmar |
| H16 | Sem erro | Comportamento de equipe e danos a terceiros em vários tipos | Não quantificado | Manter subtipo transversal no contexto do tipo original | Preservar |

**Os volumes e diferenças acima foram transcritos do diagnóstico de 05/11/2026 e não foram recalculados nesta etapa.** Conferência independente dos protocolos não foi possível com as fontes agregadas.

## Registros numéricos de referência (não publicar como série corrigida)
| Canal e intervalo | Indicador congelado | Interpretação proposta | Ressalva |
|---|---|---|---|
| Chamados Limpeza, jan–out/25 vs jan–out/26 | +23,9% | +25,8% excluindo remapeamento histórico de implantação/retirada | Requer validação de todos os meses e versão de regra |
| Ouvidorias Limpeza, jan–out/25 vs jan–out/26 | +29,3% | +26,8% excluindo implantação/retirada de papeleira | Ainda inclui informação de caçamba comunitária |
| Chamados Limpeza, outubro/26 vs outubro/25 | +2.581 | +2.581 no tipo original LIMPEZA | Comparável conforme fonte de outubro |
| Ouvidorias Limpeza, outubro/26 vs outubro/25 | +158 | +86 excluindo 72 casos classificados como instalação/retirada | Não substituir o valor oficial; ajuste analítico |
| Ouvidorias Limpeza, Campo Grande | +48 | +47 retirando 1 ocorrência de instalação/retirada | Bairro continua +55 ouvidorias no total |

## Ordem de execução, sem alteração de dados
1. Confirmar responsabilidades pendentes no dicionário (prioridade: retirada de caçamba comunitária, registros de informação e gerências territoriais).
2. Aprovar regras de classificação por **atividade** separadas de classificação por **tipo oficial**.
3. Extrair matriz original → congelado de cada competência de 2025/2026, incluindo `Revisoes_Nao_Incorporadas`, e verificar consistência por tipo/subtipo/gerência/AP/bairro.
4. Registrar `ruleVersion`, decisão, teste unitário de cada remapeamento e versão da fonte/snapshot.
5. Criar, somente após homologação, pipeline que gera série analítica paralela sem edição manual.
6. Testar somas municipais invariantes, deltas por serviço, taxas por mil, drilldowns territoriais, nomenclatura entre meses, e correspondência entre Chamados/Ouvidorias.
7. Produzir prévia em branch; requer autorização expressa para alterar apresentação ou histórico público.

## Decisão recomendada (ainda não aprovada)
Manter série oficial congelada **como publicada** e gerar separadamente série analítica comparável, com chave de regra e status de homologação. Não usar a extração retroativa de outubro para substituir julho–setembro. Se fonte congelada não permite reconstituir determinada atividade, marcar lacuna em vez de estimar.

## Referências
- [Diagnóstico com as 16 ocorrências](../1746-out2026/DIAGNOSTICO_CLASSIFICACAO_HISTORICO.md)
- [Correspondência detalhada de Papeleira](../1746-out2026/CORRESPONDENCIA_PAPELEIRA.md)
- [Prompt Mestre de fechamento do 1746](https://docs.google.com/document/d/1cxSo2b5pq9xyz0E24BpnADNQ0ZrMpYMIT2WlbiBfkt0/edit)
- [ADR-003](https://drive.google.com/file/d/158AI7ZAuaHCeCIE7JwqpPNcaurBLZ_iu/view)
- [ADR-004](https://drive.google.com/file/d/1yF9011pFyMWAyKDeCCMw2Pv--umMeFCH/view)

**Não executar a transformação sem validação das pendências.**
