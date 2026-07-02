# CONHECIMENTO DE NEGÓCIO · MÓDULO DTE (descontinuado)
## Registro oficial dos limiares, critérios, fontes e blocos analíticos do antigo painel DTE

**Propósito:** o módulo DTE foi descontinuado definitivamente (decisão de 07/2026). Este documento preserva exclusivamente o conhecimento de negócio contido nele, para recriação futura dentro da Engenharia Operacional sobre a biblioteca oficial (hub-rules + hub-insights). Nenhum código legado do DTE deve ser reaproveitado.

**Validação pendente:** os limiares abaixo foram extraídos do código em produção à época da descontinuação. Antes de recriar qualquer análise, confirmar com a DTE quais valores foram formalmente validados com a diretoria e quais eram provisórios. Até essa confirmação, tratar todos como PROVISÓRIOS.

---

## 1. LIMIARES DE CRITICIDADE (THRESHOLDS)

Origem: `dte-intelligence.js`. Semântica: cada métrica tinha faixa crítica e de atenção; a direção indica quando o valor é ruim.

| Métrica | Unidade | Atenção | Crítico | Direção ruim | Validação |
|---|---|---|---|---|---|
| Taxa operacional da frota própria | % operacional | < 40 | < 20 | menor pior | pendente |
| Utilização da frota (CDC) | % | < 75 | < 60 | menor pior | pendente |
| Sobrecarga (>10% do PBT) | % das pesagens | > 15 | > 25 | maior pior | pendente |
| Horas extras | % | > 1,5 | > 2 | maior pior | pendente |
| Concentração de recebimento em uma ETR | % do total | > 30 | > 40 | maior pior | pendente |
| Taxa de purificação de biogás | % | < 70 | < 60 | menor pior | pendente |
| Taxa operacional (infraestrutura) | % | < 30 | < 20 | menor pior | pendente |

**Nota de tradução para a biblioteca:** a taxonomia do DTE era própria (NORMAL / ATENÇÃO / CRÍTICO, com ícones de semáforo). Na recriação, o mapeamento é: normal → Dentro da Meta, warning → Atenção, critical → Crítico, ausência de dado → Sem dado. Ícones e emojis não retornam (regra de design do HUB).

---

## 2. SCORE DE RISCO OPERACIONAL (0 a 100)

Origem: `calcularRiscoOperacional()`. Modelo: score inicia em 100 e sofre deduções por fator. O peso de cada fator é a dedução máxima possível.

| Fator | Peso (dedução máx.) | Regra de dedução |
|---|---|---|
| Frota própria (taxa operacional) | 25 | < 20% → −25; < 40% → −15; < 60% → −5 |
| Sobrecarga >10% PBT | 20 | > 25% → −20; > 15% → −10 |
| Horas extras | 15 | > 2% → −15; > 1,5% → −8 |
| Concentração ETR (Caju) | 15 | > 40% → −15; > 30% → −8 |
| Utilização da frota | 10 | < 60% → −10; < 75% → −5 |
| Chorume acumulado | 10 | > 150.000 → −10; > 100.000 → −5 |
| Crescimento do lixo público | 5 | > 10% → −5 |

**Classificação do score:** ≥ 80 → risco BAIXO; ≥ 60 → risco MÉDIO; < 60 → risco ALTO.

**Observações de negócio embutidas no modelo:**
- A dependência da ETR Caju era tratada como risco estrutural nomeado (concentração de recebimento em uma única estação).
- Chorume acumulado usa limiares absolutos (100 mil / 150 mil, na unidade da planilha); confirmar unidade (m³ ou t) com a DTE antes de recriar.
- Score, pesos e faixas são candidatos naturais a regras declarativas no hub-insights, com o status final expresso na taxonomia canônica.

---

## 3. CRITÉRIOS DOS RANKINGS

Origem: `gerarRankingCriticos()` e `gerarRankingEficientes()`. Ambos retornavam Top 3 ordenado por score.

**Ranking de pontos críticos** (gatilho de entrada → fórmula do score de ordenação):
| Item | Entra quando | Score de ordenação |
|---|---|---|
| Frota própria | taxa operacional < 30% | 100 − taxa |
| Sobrecarga >10% PBT | > 15% | valor da sobrecarga |
| Horas extras | > 1,5% | valor × 10 |
| Concentração ETR Caju | > 35% | valor da concentração |
| Utilização CDC | < 75% | 100 − utilização |

**Ranking de destaques de eficiência** (gatilho → score):
| Item | Entra quando | Score |
|---|---|---|
| Purificação de biogás | > 70% | valor |
| Utilização CDC | > 75% | valor |
| Frota própria ativa | taxa operacional > 30% | valor |
| Distribuição entre ETRs | concentração Caju < 35% | 100 − concentração |
| Controle de horas extras | < 1,5% | 100 − (valor × 20) |

**Nota:** os gatilhos dos rankings não coincidem exatamente com os limiares da seção 1 (ex.: frota própria entra no ranking crítico abaixo de 30%, mas o limiar de atenção era 40%). Essa diferença era intencional (ranking mais seletivo que o semáforo) ou inconsistência; decidir na recriação.

---

## 4. FONTES DE DADOS

Origem: `dte/data.js`. Duas planilhas publicadas em CSV, a catalogar no hub-sources na recriação:

1. **Relatório principal DTE** (CSV seccionado):
   `https://docs.google.com/spreadsheets/d/e/2PACX-1vTRbfRYtnjYlxLIPTfIpC_Q7ftJ6uUf1BK9gcZs_CSEiEnIE7qCAk_U_3_bibXftsCAf5K1uQdAPsOx/pub?output=csv`
2. **Planilha complementar** (gid 925345857):
   `https://docs.google.com/spreadsheets/d/e/2PACX-1vTGM0j-OA3ERumBvilwumifE-V60PLI_iDOUwc1KGOYl47cEr74-O7tkKuAjf6yykn8cd7V7mAorDNL/pub?gid=925345857&single=true&output=csv`

**Estrutura de seções lidas do CSV principal** (o parsing era por título de seção, mesmo padrão do parseSecoes da Engenharia): recebimento, tipo de coleta, biogás, chorume, utilização, sobrecarga, horas extras, frota própria, intervenções.

Confirmar com a DTE se as duas planilhas continuam ativas e alimentadas antes de catalogar.

---

## 5. BLOCOS ANALÍTICOS SEM EQUIVALENTE NA ENGENHARIA OPERACIONAL

Inventário comparativo feito em 07/2026 (DTE vs Engenharia). Estes 11 blocos existiam apenas no DTE e são o conteúdo a recriar, na ordem de valor sugerida:

1. **Sobrecarga >10% PBT** (frota; alimenta risco e ranking) → destino: aba Frota e Eficiência
2. **Gerências Ofensoras** (ranking de sobrecarga por gerência) → Frota e Eficiência
3. **Ranking por ETR** (recebimento por estação; base do indicador de concentração) → Destinação e Biogás
4. **Consumo de Diesel** → aba nova Manutenção e Ativos
5. **Intervenções Prediais** (volume) → Manutenção e Ativos
6. **Tipos de Intervenção** (distribuição) → Manutenção e Ativos
7. **Tratores** (disponibilidade/uso) → Manutenção e Ativos
8. **Lubrificantes** (consumo) → Manutenção e Ativos
9. **RCC Gericinó** (recebimento; dialoga com a meta C04 do AR, cujo dado oficial pertence ao módulo AR) → Destinação e Biogás
10. **Operação Bem Verde** → Destinação e Biogás
11. **Purificação CTR** (taxa de purificação de biogás; alimenta ranking de eficiência) → Destinação e Biogás

Regra de governança na recriação: nenhum destes blocos pode duplicar métrica que já tenha módulo dono (ex.: RCC Gericinó como meta do AR permanece do AR; a Engenharia mostra a dimensão operacional, não o atingimento da meta).

---

## 6. DIRETRIZES PARA A RECRIAÇÃO (resumo executivo)

1. Recriar somente sobre a biblioteca oficial: fontes no hub-sources, parsing no hub-data, limiares e score como regras declarativas no hub-insights, status sempre via hub-rules/hub-status.
2. Taxonomia canônica em tudo; sem ícones, sem emojis, sem labels próprios.
3. Todos os limiares deste documento entram como constantes nomeadas e testadas, nunca como números soltos no código de painel.
4. Antes da primeira linha de código: validação dos limiares com a DTE (seção 1 e 2) e confirmação das fontes (seção 4).
