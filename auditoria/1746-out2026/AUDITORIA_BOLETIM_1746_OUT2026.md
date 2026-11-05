# Auditoria independente do Boletim Executivo 1746, outubro de 2026

**Data:** 05/11/2026
**Objeto:** versão V7 do boletim, branch `boletim-1746-executivo-v7`, commit `d06d74f`. A versão pública na `main` não foi alterada nem auditada como objeto principal.
**Branch da auditoria:** `auditoria-boletim-1746-out2026`
**Parecer final:** **Revisão obrigatória antes de uso executivo.**

## A. Parecer executivo

**Todos os números do boletim estão corretos em relação às fontes primárias.** Foram 16 afirmações recalculadas a partir das exportações originais da COMLURB, por um caminho independente (Python e planilha de origem, sem usar os cubos nem os testes JavaScript). Outubro concilia sem nenhuma divergência em serviço, subtipo, AP, gerência, bairro e na chave completa de cinco níveis, contra o cubo, a base da Linha do Tempo e o staging.

**A mensagem principal, porém, está errada.** O boletim afirma que a redução das ouvidorias foi influenciada por um "volume excepcional de Remoção Gratuita em outubro de 2025". A série completa de 2025 mostra o contrário:

- Outubro/2025 teve 799 ouvidorias de Remoção Gratuita, o 6º maior valor dos 12 meses de 2025, praticamente na mediana dos demais meses (772).
- O que foi atípico foi o vale de julho a setembro de 2025 (317, 247 e 246). Outubro marcou a volta ao nível normal, confirmado por novembro (1.014) e dezembro (1.133).
- A queda de outubro de 2026 vem de um nível baixo em 2026: setembro (468) e outubro (474) foram os dois menores meses do serviço no ano.

O erro nasceu na proposta original, que comparou outubro de 2025 apenas com setembro. Ele passou pelas 36 verificações automáticas porque elas conferiam números, não interpretações.

**Outros dois problemas relevantes:**

- O contraste "AP5 concentrada, AP3 distribuída" é um efeito do agrupamento. Em proporção, as duas APs precisam de cerca de 10% dos seus bairros para somar metade da alta.
- A taxonomia de Papeleira é instável. O histórico congelado do cubo soma Papeleira a Limpeza, mas outubro não. Com isso, "Limpeza teve mais chamados do que o aumento total" deixa de valer quando as duas classificações são somadas.

**O que se sustenta e deve ser mantido:**

- Concentração da alta de chamados em Limpeza: entre 2.415 e 2.581 dos 2.464, conforme a taxonomia, e persistente de julho a outubro.
- Limpeza como único grande serviço com alta nos dois canais.
- Campo Grande e Bangu como os dois maiores aumentos nos dois canais.
- Tratamento das gerências sem dupla contagem.
- Contraste das 92 ouvidorias a mais nos dois bairros.

**Achado omitido mais relevante:** as ouvidorias operacionais de outubro/2026 (2.213) foram o menor mês do ano. São inferiores a todos os meses de 2025, exceto julho a setembro.

## B. Matriz de rastreabilidade

Fonte primária: exportações COMLURB `FONTE_CHAMADOS_OUT2026_FINAL_ORIGINAL` e `FONTE_OUVIDORIAS_OUT2026_FINAL_ORIGINAL` (Drive, 04/11/2026). Nível A em todas as linhas, no sentido de conferência contra essas exportações; ver limitações em F.

| ID | Afirmação auditada | Valor no boletim | Valor reconstruído | Situação | Impacto | Recomendação |
|---|---|---|---|---|---|---|
| A1 | Chamados out/25 e out/26 | 21.652; 24.116; +11,4% | 21.652; 24.116; +11,4% | Validada | Nenhum | Manter |
| A2 | Ouvidorias operacionais | 2.697; 2.213; −17,9% | 2.697; 2.213; −17,9% (PCO 184 e 156) | Validada | Nenhum | Manter |
| A3 | No ano: +13,5% e +15,5% | +13,5%; +15,5% | Série congelada: idem. Fonte atual: +13,5%; +15,4% | Validada com ressalva | Baixo | Manter; a série oficial é a congelada |
| A4a | Limpeza +2.581, acima do aumento total | 2.581 | +2.581; somando Papeleira, +2.415 | Validada com ressalva | Alto | Retirar "acima do aumento total" |
| A4b | Remoção de resíduos, capina e varrição | 2.060 | 2.060 | Validada | Nenhum | Manter |
| A4c | Decomposição por serviço | +608; −484; −418; +177; −325; −172; +158; −145 | Idênticos | Validada com ressalva | Moderado | Registrar troca de subtipo em Manejo Arbóreo e Papeleira em Demais |
| A5 | Volume excepcional de Remoção Gratuita em out/2025 | 799; 469 e 474 | 799 = 6º de 12 meses de 2025 (z = 0,05); vale em jul a set/25; set e out/26 = menores de 2026 | **Incorreta** | **Crítico** | Reescrever a mensagem principal |
| A6 | Sem Remoção Gratuita, −8,4% | 8,4% | −8,4% | Validada com ressalva | Moderado | Retirar; sustentava a tese de A5 |
| A7 | Único grande serviço com alta nos dois canais | 97,6%; Limpeza | Confirmado em todas as taxonomias; Limpeza ouv +158, dos quais +72 num subtipo reclassificado | Validada com ressalva | Moderado | Manter |
| A8a | AP5 e AP3 reúnem 2.310 dos 2.464 | 2.310 | 2.310 | Validada | Nenhum | Manter |
| A8b | AP5 concentrada, AP3 distribuída | 68%; 56 de 80 | 50% da alta: AP5 com 2 de 21 bairros (10%), AP3 com 7 de 80 (9%) | **Não validada** | Alto | Retirar o contraste |
| A9 | Campo Grande e OG18G | 1.415 → 1.796; 152 → 207; 271 de 381; 599 e 99 | Idênticos | Validada | Nenhum | Manter |
| A10 | Bangu e OG17B | 577 → 986; 46 → 83; 405 de 409; 637 e 52 | Idênticos | Validada com ressalva | Baixo | Manter absolutos ao lado do +80,4% |
| A11 | Maiores aumentos são Bangu e Campo Grande | Critério | Confirmado nos dois canais | Validada | Nenhum | Manter |
| A12 | 92 a mais nos bairros, 484 a menos na cidade | 92 | 92 | Validada | Nenhum | Manter |
| N1 | Papeleira "ausente em 2026" | 166; ausente | Existiu em 2026 até abril (189, 124, 132, 12) | **Incorreta** | Moderado | "Em desuso desde maio de 2026" |

## C. Relatório de divergências

| # | Divergência | Encontrado | Esperado | Diferença | Origem provável | Impacto no boletim | Gravidade |
|---|---|---|---|---|---|---|---|
| D1 | Leitura de base atípica em Remoção Gratuita | out/25 tratado como pico | out/25 no nível típico de 2025 | Interpretação | Comparação só com setembro/2025 | Mensagem principal | Crítico |
| D2 | Taxonomia de Papeleira no cubo | Jan a set: Papeleira dentro de Limpeza (2025: 1.535; 2026: 460) | Mesma regra em todos os meses | Out separado, demais meses agregados | Fechamentos anteriores agregaram; outubro não | A4a; séries de Limpeza em Histórico e Linha do Tempo | Alto |
| D3 | Contraste territorial | AP5 concentrada x AP3 distribuída | Concentração proporcional semelhante | Efeito do número de bairros | Métrica não normalizada | A8b | Alto |
| D4 | Papeleira "ausente em 2026" | Ausente | 457 chamados de jan a abr/2026 | Redação | Leitura da série do cubo, que só traz outubro | Nota metodológica | Moderado |
| D5 | Subtipo reclassificado em ouvidorias de Limpeza | 0 → 72 | Subtipo comparável | +72 em Limpeza | Instalação e retirada de papeleira migrou para Limpeza em 2026 | Magnitude de A7 | Moderado |
| D6 | Subtipo renomeado em Manejo Arbóreo | 1.576 → 0 e 0 → 1.227 | Mesmo subtipo | Avaliação de poda passou a "180 dias" | Mudança de cadastro | Leitura de −418 | Moderado |
| D7 | Revisão não documentada de ouvidorias operacionais de setembro | Fonte atual 2.463 | Congelado 2.476 | −13 | Registros reclassificados para a PCO (institucional +2) | Nenhum (congelado vale); documentação | Moderado |
| D8 | Revisão de chamados de agosto | Fonte atual 29.589 | Documentado 29.590 | −1 na documentação | Extração diferente da documentada | Nenhum | Baixo |
| D9 | Série acumulada de Papeleira no cubo | Só o mês de outubro | Dez meses | Série incompleta | Efeito de D2 | Outros módulos | Baixo para o boletim |
| D10 | Chaves repetidas na fonte | 3 em cada fonte (Sampaio, CG13M) | Chave única | Linhas complementares | Exportação de tabela dinâmica | Nenhum (somadas corretamente) | Baixo |

Sem divergência: totais por ano e mês de 2025; janeiro a junho de 2026; outubro em todas as dimensões; separação da PCO (só tipos Ouvidoria e Diversos); vínculo bairro e AP (nenhum bairro em duas APs); área de atuação de OG18G e OG17B (mesmos bairros em 2025 e 2026); exclusão do novembro parcial de 2026 (2.279 chamados) do acumulado.

## D. Avaliação dos insights

| Afirmação | Decisão | Redação sugerida |
|---|---|---|
| Mensagem principal | **Reescrever** | O aumento dos chamados esteve concentrado em Limpeza. As ouvidorias operacionais de outubro foram as menores do ano, com a maior redução em Remoção Gratuita. |
| Leitura de chamados | Reescrever | Limpeza respondeu por praticamente todo o aumento: 2.581 chamados a mais. Remoção de resíduos, capina e varrição somam 2.060 deles. |
| Leitura de ouvidorias | **Reescrever** | Remoção Gratuita teve 474 ouvidorias, contra 799 em outubro de 2025. Setembro e outubro foram os dois menores meses do serviço em 2026. |
| Limpeza nos dois canais | Manter | Sem mudança. |
| Abertura de "Onde ocorreu" | **Reescrever** | A AP5 e a AP3 reúnem 2.310 dos 2.464 chamados adicionais. Na AP5, Campo Grande e Bangu somam 68% do aumento, bem acima dos 40% que representam no volume da área. |
| Campo Grande, Bangu, gerências e 92 ouvidorias | Manter | Sem mudança. |
| Nota sobre Papeleira | Corrigir | Papeleira, classificação em desuso desde maio de 2026, teve 166 chamados em outubro de 2025; eles estão em Demais serviços. |

### Candidatos a novos insights (no máximo cinco, por relevância e robustez)

1. **Ouvidorias de outubro foram as menores do ano.** São 2.213, o menor mês de 2026 e abaixo de todos os meses de 2025, exceto julho a setembro. Relevância alta, evidência robusta. Já incorporado na redação sugerida, sem nova seção.
2. **Dois terços do aumento anual das ouvidorias ocorreram de julho a setembro**, quando 2025 teve o vale. Foram +2.917 de +4.341 na fonte atual. Sem Remoção Gratuita, o acumulado ainda sobe 15,7%. Relevância alta para interpretar o +15,5%; robusto. Sugestão: uma frase curta junto ao acumulado, se a Diretoria precisar explicar o número anual.
3. **A alta de Limpeza é persistente.** Julho a outubro de 2026 ficaram todos acima de 2025 (+51%, +66%, +18% e +45%). Robusto. Não exige nova informação na página; sustenta a mensagem principal.
4. **Coleta Domiciliar: +608 chamados (+55%)**, concentrados em um único subtipo, a verificação de frequência irregular. As ouvidorias do serviço caíram. Relevância média. Não recomendo incluir.
5. **Manejo Arbóreo: −418 chamados, quase todo num subtipo renomeado.** É alerta de comparabilidade, não insight. Não incluir; registrar na nota técnica.

## E. Evidências reproduzíveis

- **Script:** `auditoria/1746-out2026/auditoria_independente.py` (Python, openpyxl). Recalcula todas as afirmações a partir das fontes primárias e compara com o HTML e os cubos.
- **Matriz gerada:** `auditoria/1746-out2026/matriz_auditoria.json`.
- **Fontes primárias**, no Drive da COMLURB e fora do repositório:

| Fonte | SHA-256 | Linhas | Total geral 2025 | Total geral 2026 |
|---|---|---:|---:|---:|
| FONTE_CHAMADOS_OUT2026_FINAL_ORIGINAL | `6f90fdef93242157f33d3724115a9f7167cac9f3e1c506b5f684508df860f045` | 32.393 | 294.552 | 281.085 |
| FONTE_OUVIDORIAS_OUT2026_FINAL_ORIGINAL | `ab2f51898c80e76fef297755f55e4e5d7cfbfb364b70291c55d9b91c59f69bf0` | 19.512 | 37.021 | 34.261 |

- **Reprodução:**

```
python3 auditoria/1746-out2026/auditoria_independente.py \
  --chamados FONTE_CHAMADOS_OUT2026_FINAL_ORIGINAL.xlsx \
  --ouvidorias FONTE_OUVIDORIAS_OUT2026_FINAL_ORIGINAL.xlsx \
  --json matriz_auditoria.json
```

## F. Parecer final

**Revisão obrigatória antes de uso executivo.**

Os números estão corretos e rastreáveis até as exportações da COMLURB. A mensagem principal, porém, comunica uma explicação que os dados contradizem, e uma das leituras territoriais não resiste à normalização. Com as reescritas da seção D, que não acrescentam indicadores nem seções, o boletim fica apto para aprovação com ressalvas.

**O que foi auditado:**
- Os dez meses de 2025 e 2026 nas fontes primárias.
- Todas as dimensões de outubro.
- A regra da PCO e o vínculo territorial.
- A preservação do histórico.
- A taxonomia entre anos.
- A robustez estatística da tese de base atípica.
- Todos os números e frases da V7.

**O que não pôde ser verificado:**
- **Registros individuais.** As fontes primárias são exportações agregadas de tabela dinâmica, não registros do sistema 1746. Por isso não é possível detectar protocolos duplicados, conferir a classificação de cada registro ou validar a extração em si.
- **Data de corte.** A data da extração continua não documentada.
- **Sazonalidade.** Só há 2025 e 2026 nas fontes. Separar sazonalidade de tendência exige ao menos 2024.
- **Causas.** Não há dado que explique o vale de julho a setembro de 2025 nem a queda de Remoção Gratuita em 2026; qualquer causa seria hipótese.
- **Mudanças de área das gerências.** Só foi possível confirmar que OG18G e OG17B atenderam os mesmos bairros nos dois anos. Mudanças de área dentro de um bairro não aparecem nas fontes.
- **Homologação independente.** Não foi realizada.

**Evidências que permitiriam ampliar a auditoria:**
- Extração em nível de registro de outubro dos dois anos, com número de protocolo.
- Série de 2024.
- Documentação da data de extração.
- Registro formal das mudanças de classificação de Papeleira e Manejo Arbóreo.
