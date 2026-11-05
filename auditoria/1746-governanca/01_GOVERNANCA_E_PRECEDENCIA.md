# 1746 — Governança de fontes, regras e fechamentos

**Versão de trabalho:** 0.1 · **Data:** 05/11/2026 · **Situação:** consolidação documental para homologação; não altera dados ou HUB.

## 1. Propósito e limite
Este documento reúne decisões antigas encontradas no Google Drive, regras específicas do 1746 e validações operacionais fornecidas na discussão de novembro de 2026. É uma **minuta de aplicação ao 1746**, não prova de que toda a arquitetura proposta já foi implantada. A publicação de uma nova taxonomia ou alteração de série depende de aprovação e testes.

## 2. Fontes documentais e status
| Fonte | Data/status declarado | Uso nesta consolidação |
|---|---|---|
| [UrbanFlow — Princípios Arquiteturais](https://drive.google.com/file/d/18yDympWeMexAMK_Y9wOoZfoCuu7fnKLx/view) | Fase 1, **proposto para aprovação**; descreve princípios prévios | Fonte única; derivação automática; rastreabilidade; separação Core/instância |
| [ADR-001 — Fonte operacional única](https://drive.google.com/file/d/13x8ltdgVhg9lFzs8t2m9CZebLSF__C1-/view) | Proposto para aprovação | Uma fonte editável por indicador; derivados não editados manualmente |
| [ADR-002 — Fronteira do modelo canônico](https://drive.google.com/file/d/1S2NyyVF_g0OnH1DbHyYds_Z0t06oCy1Y/view) | Proposto para aprovação | Reader/Decoder/Adapter/Validator; schemaVersion |
| [ADR-003 — Camada semântica governada](https://drive.google.com/file/d/158AI7ZAuaHCeCIE7JwqpPNcaurBLZ_iu/view) | Proposto para aprovação | Vocabulário institucional único, não redefinido por painel |
| [ADR-004 — Snapshots](https://drive.google.com/file/d/1yF9011pFyMWAyKDeCCMw2Pv--umMeFCH/view) | Proposto para aprovação | Fechamentos reproduzíveis com fonte, schema, pipeline e regra |
| [ADR-005 — Falha segura](https://drive.google.com/file/d/1QHJdS3vd5lORRhuJIRI1lFJYA__Ql2zf/view) | Proposto para aprovação | Lacunas explícitas; nunca zero/estimativa silenciosa |
| [ADR-008 — Nenhuma fonte derivada manual](https://drive.google.com/file/d/16G-oe85uOHCU_nSn5wCzv_ac2BPKHcwI/view) | Proposto para aprovação | Materialização automática, não segunda fonte de edição |
| [CORE Baseline v1](https://drive.google.com/file/d/17SNyVWEEnoCjT7Jo5mKHKWPHpqMZYn0i/view) | Baseline técnico congelado, julho/2026 | Contratos do Core, não aprovação institucional automática de regras 1746 |
| [Prompt Mestre — Fechamento Mensal 1746](https://docs.google.com/document/d/1cxSo2b5pq9xyz0E24BpnADNQ0ZrMpYMIT2WlbiBfkt0/edit) | Versão referência 21/10/2026 | Norma operacional específica mais recente sobre corte, PCO, homologação e publicação |
| [Prompt mensal 1746](https://docs.google.com/document/d/1L2GKXBtPiwD64Oc1jffvoM669T4hQOv2RTogcYWrtmY/edit) | Set/2026 | Procedimento histórico de atualização e revisões não incorporadas |
| [Governança_Planilhas_HUB_COMLURB](https://docs.google.com/spreadsheets/d/15OLtd4t87Osyx6s2fWcy56r-JnM4eyS6lXfq3QdoDMg/edit) | Jul/2026, modelo de trabalho | Cadastro/log; proposta EXPORT_HUB não é autorização para uma segunda fonte manual |
| [Diagnóstico classificação histórica](../1746-out2026/DIAGNOSTICO_CLASSIFICACAO_HISTORICO.md) | 05/11/2026, diagnóstico | Inventário das 16 ocorrências e impactos, não homologação |

**Precedência recomendada, a homologar:** para fechamento 1746 prevalece o procedimento específico de 21/10/2026; para mecanismos técnicos, contratos do baseline do Core; para semântica de serviço, decisões operacionais explicitamente confirmadas e mapa versionado. Propostas de ADR servem de princípio de desenho, mas não substituem homologação operacional.

## 3. Contratos propostos para o 1746
1. **Origem imutável.** Registrar e conservar `TipoOriginal`, `SubTipoOriginal`, `GerenciaRegistrada`, `APOriginal`, `BairroOriginal`, competência, canal, ano, fonte, extração e corte. Não reescrever as colunas originais.
2. **Semântica central da instância.** `NomeExibicao`, `AtividadeAnalitica`, `Objeto`, `ResponsavelExecutor`, `StatusRegra`, `ruleVersion` e `evidencia` devem sair de um único mapa governado para Chamados e Ouvidorias; não reimplementar nos gráficos.
3. **Limpeza ≠ instalação/retirada.** Coincidência de objeto (papeleira, caçamba, contêiner) não implica equivalência de operação. Descrições compostas não devem ser repartidas sem campo que permita fazê-lo.
4. **Gerência registrada ≠ executora.** Preservar ambas. Instalação/retirada de papeleira → **LDE** (confirmação operacional do usuário, independentemente da gerência registrada). Instalação de caçamba comunitária → **LRS** (confirmação operacional). **Retirada de caçamba comunitária e limpeza física de papeleiras, contêineres e caçambas COMLURB → gerências territoriais** (confirmação operacional). O papel das territoriais em manifestações de informação e encaminhamento **depende do serviço** e ainda necessita explicação; não inferir execução por mera presença do código de gerência.
5. **Prefixo de Ouvidoria.** Remover somente no campo de exibição as variantes iniciais `OUV -`, `OUV –`, `OUV —` (com tolerância de espaços); manter origem e não unir atividades diferentes. O prefixo não deve fazer parte da chave semântica. Não retirar `OUV` no interior de uma expressão.
6. **PCO.** Manter Ouvidorias PCO na base institucional e excluí-las exclusivamente dos indicadores operacionais, conforme norma mensal.
7. **Fechamentos.** Preservar valores fechados de meses anteriores, inclusive julho, agosto e setembro/2026. Extrações posteriores não substituem mês fechado. Registrar em `Revisoes_Nao_Incorporadas` (valor anterior, novo, diferença, extração, motivo).
8. **Série reclassificada paralela.** Permitida somente como materialização **automática**, identificada como analítica, versionada e reconciliada. Nunca substituir a fotografia oficial sem decisão específica. Comparações devem indicar se usam classificação original ou analítica; taxas por mil exigem numerador e denominador compatíveis.
9. **Validação anterior à apresentação.** Fechar por mês/ano/canal/tipo/subtipo/AP/gerência/bairro e total geral; testar não duplicação, nomenclatura, hierarquias e mapeamentos semânticos (testes aritméticos isolados são insuficientes). Exibir indisponível, não zero, se faltar fonte.
10. **Aprovação/publicação.** Teste funcional ≠ conciliação numérica ≠ homologação documental. Mudança em main e em indicadores somente com autorização expressa, revisão, evidência, testes e rollback definido.

## 4. Fluxo de trabalho proposto
`Fonte original → Leitura/decodificação → Adapter versionado → Validação → Snapshot oficial → Regras institucionais → Indicadores → Apresentação`. Série analítica reclassificada, se homologada, deve ser derivada do snapshot oficial com a versão da regra explícita e **não** de uma exportação atualizada retroativamente.

## 5. Limitações e questões para decisão
- Os ADRs antigos estavam marcados como propostas; não assumir sua implantação integral.
- A planilha de governança de julho propõe abas EXPORT_HUB; o princípio posterior de fonte única proíbe segunda base mantida manualmente. Avaliar modelo de exportação apenas se for gerado automaticamente e rastreável.
- As exportações originais de outubro são agregadas; não permitem atribuir atividade específica a cada protocolo quando o subtipo mistura serviços.
- Necessária aprovação da matriz do documento 02 e decisão sobre o significado de registros mistos de informação, implantação de varrição e eventual recálculo paralelo. As executoras de instalação/retirada de caçamba comunitária e limpeza de equipamentos já foram confirmadas pela operação.
- O diagnóstico em `1746-out2026` é evidência de divergências, não norma operacional homologada.

**Status final:** minuta pronta para revisão; nenhuma transformação de dado, cubo, snapshot ou painel alterado.

## Validações adicionais (05/11/2026)
Confirmados: **LRS instala caçambas comunitárias; gerências territoriais as retiram e executam limpeza física de papeleiras/contêineres/caçambas COMLURB**. Papel de cada territorial nos registros de informação: depende do serviço, a detalhar. O rótulo `IMPLANTAÇÃO DE VARRIÇÃO` não deve ser interpretado literalmente até esclarecimento. Esses registros atualizam a minuta, **não** homologam uma série reclassificada.
