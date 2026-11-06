# Auditoria de impacto — Janeiro a setembro de 2026

**Status:** concluída a comparação de totais, tipos e bases territoriais agregadas; aplicação aos cubos do HUB **ainda não realizada**. Série pública preservada.

**Fontes:** Chamados e Ouvidorias tratados no Drive, auditados em `audit-chamados-jan-set.json` e `audit-ouvidorias-jan-set.json`; comparação com `1746-timeline/data.js` na `main`. Campos E/G originais não foram sobrescritos. Não há base em nível de protocolo.

## 1. Conciliação mensal dos totais

| Mês | Chamados publicados/novos 2026 | Δ Chamados | Ouvidorias operacionais publicadas/novas 2026 | Δ Ouvidorias | Chamados de 2026 recuperados de AP `Nulo` | Ouvidorias de 2026 recuperadas de AP `Nulo`* |
|---|---:|---:|---:|---:|---:|---:|
| Janeiro | 30.475 / 30.475 | +0 | 3.668 / 3.668 | +0 | 609 | 81 |
| Fevereiro | 31.103 / 31.103 | +0 | 3.667 / 3.667 | +0 | 622 | 74 |
| Março | 35.562 / 35.562 | +0 | 4.458 / 4.458 | +0 | 731 | 81 |
| Abril | 29.537 / 29.537 | +0 | 3.677 / 3.677 | +0 | 929 | 125 |
| Maio | 24.700 / 24.700 | +0 | 3.149 / 3.149 | +0 | 575 | 70 |
| Junho | 21.542 / 21.542 | +0 | 2.764 / 2.764 | +0 | 497 | 47 |
| Julho | 27.553 / 27.510 | -43 | 3.236 / 3.222 | -14 | 762 | 88 |
| Agosto | 29.605 / 29.589 | -16 | 3.254 / 3.252 | -2 | 701 | 110 |
| Setembro | 24.695 / 24.672 | -23 | 2.476 / 2.463 | -13 | 500 | 59 |

\* Coluna de AP recuperada de Ouvidorias considera o volume **institucional** da fonte. Não substitui nem deve ser somada automaticamente ao total operacional sem validação de PCO por linha.

**Leitura:** totais municipais de janeiro a junho coincidem; julho a setembro apresentam apenas as revisões históricas já identificadas (Chamados −43/−16/−23, Ouvidorias −14/−2/−13).

## 2. Matriz de impacto: manter, ajustar, substituir

| Objeto | Evidência | Decisão | Providência |
|---|---|---|---|
| **Totais mensais municipais — Jan–Jun** | Fechamentos 2025/2026 coincidem integralmente | **MANTER** | Não alterar números publicados |
| **Totais municipais — Jul–Set** | Revisões retrospectivas pequenas, sem justificativa em nível de protocolo | **MANTER fechamento oficial, AJUSTAR ressalva** | Registrar duas versões e as diferenças; não sobrescrever snapshots |
| **Tipos de Chamados — Jan–Set** | Snapshots incorporaram PAPELEIRA dentro de LIMPEZA em 2025 (1.535 ocorrências) e 2026 (460), em desacordo com o Tipo original | **SUBSTITUIR CLASSIFICAÇÃO** | Exibir PAPELEIRA separada de LIMPEZA em camada de teste; preservar total municipal |
| **Ouvidorias por Tipo — Jul–Set** | LIMPEZA e PAPELEIRA sofreram diferenças de mix retrospectivo; SubTipos de Ouvidorias incompletos | **AJUSTAR análise por Tipo; NÃO inferir SubTipo** | Calcular pelo Tipo original da fonte e registrar diferenças de snapshot |
| **AP3 e categoria SEM AP — Agosto** | AP3 Chamados 10.332 → 11.033 (+701); categoria SEM AP com 701 era separada. Ouvidorias AP3 1.061 → 1.172 (+111), categoria SEM AP com 116 | **SUBSTITUIR REPARTIÇÃO TERRITORIAL** | Recalcular participação, ranking e taxas; total municipal não se altera por redistribuição territorial |
| **AP3 em Jan–Jun** | AP `Nulo` na fonte foi corrigida em camada derivada, mas não há snapshot por AP equivalente conferido para esses meses | **RECALCULAR; COMPARABILIDADE PENDENTE** | Conferir indicadores territoriais com módulos, sem afirmar variação de ranking antes do teste |
| **APs de Jul/26** | Snapshot de julho não possui contagem de Chamados por AP (`null`); não é comparável diretamente | **NÃO HOMOLOGAR taxa territorial de Chamados** | Validar contra cubo fechado de julho por AP antes de classificar impacto |
| **Bairros BRAZ DE PINA e OSWALDO CRUZ** | Padronizados para BRÁS DE PINA e OSVALDO CRUZ em coluna nova, enquanto snapshots usam a grafia antiga | **MANTER VOLUMES, AJUSTAR CHAVES** | Usar tabela de aliases antes de comparar bairros; ausência de nome antigo não é queda real |
| **Taxas Ouvidorias/Chamados** | Canais têm diferenças pequenas e AP3 redistribuída; taxas sensíveis ao denominador por área | **RECALCULAR** | Verificar denominadores e impedir mistura de snapshots com extrações retrospectivas |
| **PCO** | Canal institucional preserva PCO; operacional a exclui | **MANTER REGRA** | Nunca reconciliar Ouvidorias operacionais com institucional sem exclusão |
| **SubTipos de Ouvidorias** | 12.777 linhas sem SubTipo na extração histórica completa | **ADIAR** | Aguardar fonte detalhada; não preencher por inferência |

## 3. Composição territorial na nova base de 2026

| Mês | AP3 Chamados | Participação AP3 em Chamados | AP3 Ouvidorias operacionais | Participação AP3 em Ouvidorias |
|---|---:|---:|---:|---:|
| Janeiro | 11.827 | 38,8% | 1.423 | 38,8% |
| Fevereiro | 12.740 | 41,0% | 1.565 | 42,7% |
| Março | 14.164 | 39,8% | 1.772 | 39,7% |
| Abril | 12.423 | 42,1% | 1.431 | 38,9% |
| Maio | 9.662 | 39,1% | 1.255 | 39,9% |
| Junho | 8.299 | 38,5% | 1.045 | 37,8% |
| Julho | 10.687 | 38,8% | 1.174 | 36,4% |
| Agosto | 11.033 | 37,3% | 1.172 | 36,0% |
| Setembro | 8.741 | 35,4% | 863 | 35,0% |

Os números acima são **nova base territorial tratada**; não representam valores homologados da série antiga. A AP3 recuperada é uma mudança de classificação, não criação de atendimentos.

## 4. Conferência adicional por Tipo contra a Linha do Tempo

| Mês | Exemplos de diferenças de Tipo na fonte em relação à Linha do Tempo (2026) |
|---|---|
| Janeiro | LIMPEZA (C -189; O +0) |
| Fevereiro | LIMPEZA (C -124; O +0) |
| Março | LIMPEZA (C -132; O +0) |
| Abril | LIMPEZA (C -12; O +0) |
| Maio | Sem diferença nos Tipos correspondentes |
| Junho | FISCALIZAÇÃO DE GRANDE GERADOR (C -1; O +0); LIMPEZA (C +1; O +0) |
| Julho | REMOÇÃO GRATUITA (C -50; O +0); LIMPEZA (C -8; O -40); PAPELEIRA (C +2; O +40); VETORES (C +19; O +0); COLETA DOMICILIAR (C +2; O -4) |
| Agosto | PAPELEIRA (C +0; O +48); LIMPEZA (C +3; O -43); REMOÇÃO GRATUITA (C -17; O -2); COLETA SELETIVA (C +0; O -3); MANEJO ARBÓREO (C +2; O -1) |
| Setembro | LIMPEZA (C -1; O -45); PAPELEIRA (C +1; O +39); REMOÇÃO GRATUITA (C -13; O -1); PRAÇAS (C +0; O -8); MANEJO ARBÓREO (C -2; O +5) |

**Nota:** C = Chamados; O = Ouvidorias operacionais. Diferenças de PAPELEIRA/LIMPEZA são taxonômicas, enquanto diferenças adicionais podem decorrer de revisão retrospectiva. Comparações por nome exigem uma tabela de correspondência para Tipos ausentes do painel anterior.

## 5. Condições de homologação do HUB

1. Preservar os fechamentos e identificadores da origem; tratar AP e bairro apenas em colunas adicionais.
2. Na prévia, recalcular os cubos de Chamados, Ouvidorias, Histórico e Linha do Tempo por Tipo, AP, bairro e gerência com a **mesma versão** das duas fontes.
3. Para julho, confrontar AP de Chamados com o fechamento original, pois a Linha do Tempo mostra valores nulos por AP.
4. Para agosto, comparar explicitamente os indicadores AP3/SEM AP antes e depois: conferir que a redistribuição não altera totais municipais.
5. Testar filtros/drill e taxas por território; manter a PCO somente no institucional.
6. SubTipos de Ouvidorias seguem fora da homologação, por decisão da operação.
7. Publicar somente após conferência da prévia e decisão formal de incorporar ou versionar revisões retroativas.

**Resultado desta fase:** auditoria analítica por mês/Tipo/AP/bairro concluída e documentada; **os cinco módulos ainda NÃO estão reprocessados nem homologados.**
