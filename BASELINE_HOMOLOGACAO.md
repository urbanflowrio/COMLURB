# HUB COMLURB | Baseline e homologação

Baseline de governança: `HUB-2026-09-15-GOV-01`.

Esta baseline organiza o estado recebido no pacote 60. Ela não transforma automaticamente painéis operacionais em painéis homologados.

## Evidências vigentes

| Componente | Estado protegido | Evidência disponível | Situação |
|---|---|---|---|
| UrbanFlow Core | Baseline V1 | `CORE_BASELINE_V1.md` e regressão de 604 casos | Baseline técnica existente |
| Balanço de Receita | Regras financeiras e validador | Validador independente, última conciliação conhecida sem divergência, 9 verificações financeiras isoladas e regressão geral aprovada | Homologação técnica aprovada em 15/09/2026. Validação visual publicada pendente |
| Chamados 1746 | Fechamento até ago/2026 | `chamados-1746/HOMOLOGACAO_TECNICA.md` e `chamados-1746/data-cutoff.json` | Homologação técnica aprovada com ressalva de AP. Validação visual publicada pendente |
| Ouvidoria | Fechamento até ago/2026 | `ouvidoria/HOMOLOGACAO_TECNICA.md` e `ouvidoria/data-cutoff.json` | Homologação técnica aprovada com ressalvas. Validação visual publicada pendente |
| Engenharia Operacional | Estado recebido no pacote 60 | Testes e snapshot parciais | Em revisão, não homologado |
| Demais módulos | Estado recebido no pacote 60 | Sem termo formal localizado | Homologação não comprovada |

## Registro obrigatório de homologação

Copiar e preencher uma linha somente depois da aprovação:

| Data | Módulo | Versão | Competência | Testes executados | Responsável funcional | Aprovador | Resultado |
|---|---|---|---|---|---|---|---|
| A preencher | A preencher | A preencher | A preencher | Totais, filtros, drill-down, desktop e celular | A preencher | A preencher | Aprovado ou rejeitado |

## Homologações técnicas registradas

| Data | Módulo | Identificação | Competência | Verificações | Responsável técnico | Resultado |
|---|---|---|---|---|---|---|
| 15/09/2026 | Balanço de Receita | `BAL-2026-09-15-TEC-01` | Conforme Google Sheets. Competência atual não reconsultada nesta execução | Sintaxe, referências HTML, filtros, drill-down anual, retorno, padronização, 9 testes isolados e regressão de 604 casos | Greicy Moreira | Técnica aprovada. Visual publicada pendente |
| 15/09/2026 | Chamados 1746 | `CHA-2026-09-15-TEC-01` | Ago/2026. Corte em 04/09/2026 | Totais, séries, tipos, subtipos, gerências, bairros, referências, sintaxe, acessibilidade estática e regressão geral | Greicy Moreira | Técnica aprovada com ressalva de cobertura de AP em agosto. Visual publicada pendente |
| 15/09/2026 | Ouvidoria | `OUV-2026-09-15-TEC-01` | Ago/2026. Corte em 04/09/2026 | Totais, séries, tipos, subtipos, gerências, bairros, referências, sintaxe, acessibilidade estática e regressão geral | Greicy Moreira | Técnica aprovada com ressalvas de AP e da comprovação da exclusão da PCO. Visual publicada pendente |

## Controle de publicação

1. Usar esta baseline como referência antes de alterar um módulo.
2. Entregar os arquivos mantendo os caminhos originais.
3. Conferir o conteúdo depois da compactação.
4. Executar `npm test` quando arquivos do Core ou da integração forem alterados.
5. Registrar toda exclusão no manifesto da entrega.
6. Não declarar homologação apenas porque a página abriu sem erro.

## Arquivos legados mantidos por segurança

Os itens abaixo foram identificados como cópias sem referência ou arquivos antigos da raiz. Por decisão de segurança, permanecem no repositório até a homologação final dos módulos. Não devem ser utilizados nem atualizados.

| Caminho legado | Motivo |
|---|---|
| `app.js` | Aplicação antiga do módulo financeiro, sem referência na Home atual |
| `data.js` | Base estática antiga do financeiro, sem referência na Home atual |
| `receita.css` | Estilo antigo do financeiro, sem referência na Home atual |
| `testar-fase7b.js` | Cópia da suíte mantida corretamente em `testes/testar-fase7b.js` |
| `assets/data/chamados-1746/chamados_data.js` | Cópia idêntica e não referenciada |
| `assets/data/chamados-1746/chamados_cube.js` | Cópia idêntica e não referenciada |
| `assets/data/ouvidoria/ouvidoria_data.js` | Cópia idêntica e não referenciada |
| `assets/data/ouvidoria/ouvidoria_cube.js` | Cópia idêntica e não referenciada |
| `territorial/unidades_comlurb (1).csv` | Cópia idêntica. O painel usa `territorial/data/unidades_comlurb.csv` |
