# AUDITORIA DE IMPACTO DOS INSIGHTS — JANEIRO A SETEMBRO/2026

**Situação:** análise técnica da nova extração, sem homologação para substituir a série oficial · **Data:** 06/11/2026

## Escopo e decisão de governança
Conferência integral das duas **cópias tratadas** do histórico 1746: 63.738 linhas de Chamados e 15.322 linhas de Ouvidorias (origens preservadas). Comparação janeiro a setembro de 2025 × janeiro a setembro de 2026, com baseline nos cubos públicos `1746-timeline/data.js` e `1746-historico/data.js` da `main`. Em Ouvidorias a visão operacional exclui PCO. Na camada tratada, AP registrada como `Nulo` foi resolvida para AP3 somente em `AP_PADRONIZADA`, e bairro original foi preservado.

**Decisão essencial:** Tipo original prevalece. `LIMPEZA` permanece Limpeza e `PAPELEIRA` permanece Papeleira, independentemente do SubTipo; remapeamentos entre esses dois Tipos no histórico antigo são divergências metodológicas, não justificativa para excluir registros do município. SubTipos de Ouvidorias continuam fora do escopo por estarem incompletos na fonte.

## 1. Totais mensais: comparação nova extração × publicado

| Mês | Chamados na nova base 2026 | Δ vs publicado | Ouvidorias operacionais novas 2026 | Δ vs publicado | Interpretação |
|---|---:|---:|---:|---:|---|
| Janeiro | 30.475 | 0 | 3.668 | 0 | **MANTER** total |
| Fevereiro | 31.103 | 0 | 3.667 | 0 | **MANTER** total |
| Março | 35.562 | 0 | 4.458 | 0 | **MANTER** total |
| Abril | 29.537 | 0 | 3.677 | 0 | **MANTER** total |
| Maio | 24.700 | 0 | 3.149 | 0 | **MANTER** total |
| Junho | 21.542 | 0 | 2.764 | 0 | **MANTER** total |
| Julho | 27.510 | −43 | 3.222 | −14 | **MANTER** fotografia oficial; revisão não incorporada |
| Agosto | 29.589 | −16 | 3.252 | −2 | **MANTER** fotografia oficial; revisão não incorporada |
| Setembro | 24.672 | −23 | 2.463 | −13 | **MANTER** fotografia oficial; revisão não incorporada |

Os totais por município de janeiro a junho coincidem, mas isso **não confirma** igualdade de agrupamentos por Tipo ou AP. Nos meses julho a setembro há, respectivamente, diferenças de Chamados de −43, −16 e −23 e Ouvidorias operacionais de −14, −2 e −13. Em 2025, os nove totais mensais conferem.

## 2. Diferença de classificação por Tipo — prioridade de revisão

| Mês | Limpeza Chamados Δ publicado | Limpeza Chamados Δ na fonte | Limpeza Ouvidorias Δ publicado | Limpeza Ouvidorias Δ na fonte | Papeleira Chamados 2025/2026 na fonte |
|---|---:|---:|---:|---:|---:|
| Janeiro | −2.355 | −2.369 | −260 | −260 | 175 / 189 |
| Fevereiro | +2.763 | +2.809 | +322 | +322 | 170 / 124 |
| Março | +6.639 | +6.692 | +1.309 | +1.309 | 185 / 132 |
| Abril | +2.604 | +2.781 | +844 | +844 | 189 / 12 |
| Maio | −802 | −698 | −26 | −26 | 104 / 0 |
| Junho | +237 | +383 | +109 | +109 | 145 / 0 |
| Julho | +2.666 | +2.834 | +521 | +481 | 176 / 2 |
| Agosto | +4.021 | +4.191 | +665 | +622 | 167 / 0 |
| Setembro | +940 | +1.163 | +165 | +120 | 224 / 1 |

**Constatação crítica:** em Chamados, a diferença entre o Tipo LIMPEZA publicado em 2025 e o mesmo Tipo da nova fonte equivale exatamente à quantidade do Tipo original PAPELEIRA em cada competência (janeiro a setembro). Isso caracteriza a transformação histórica de Tipo anteriormente diagnosticada, sem mudança do total geral. Em 2026, janeiro a abril também apresentam absorções importantes de PAPELEIRA por LIMPEZA nas séries antigas; maio a setembro têm outras pequenas revisões da fonte que devem ser auditadas separadamente.

**Ouvidorias julho–setembro — reclassificação retroativa aparente:**

| Competência | Tipo Limpeza: publicado 2026 | Tipo Limpeza: nova base 2026 | Tipo Papeleira: publicado 2026 | Tipo Papeleira: nova base 2026 |
|---|---:|---:|---:|---:|
| Julho | 1.497 | 1.457 | 46 | 86 |
| Agosto | 1.740 | 1.697 | 45 | 93 |
| Setembro | 1.275 | 1.230 | 53 | 92 |

A variação de Papeleira é maior do que a variação total de Ouvidorias nesses meses. Isso mostra que **mudanças na classificação e revisões da fonte** podem ser mais relevantes para a análise de serviços do que a mudança de volume total. Sem histórico individual de revisão, não é possível atribuir causalidade definitiva a cada transferência.

## 3. Auditoria territorial — APs tratadas e recorte mensal

Os valores abaixo correspondem à **nova fonte** com AP padronizada; a coluna AP original foi mantida. Agosto no HUB usa a categoria explícita `SEM AP (AGO)`; essa categoria não pode ser simplesmente tratada como variação real da AP3 na série congelada.

| Mês | AP3: chamados 2025→2026 (Δ) | AP5: chamados 2025→2026 (Δ) | AP3: ouvidorias 2025→2026 (Δ) | AP5: ouvidorias 2025→2026 (Δ) | Chamados com AP original Nulo (2025/2026) |
|---|---|---|---|---|---|
| Janeiro | 15.200→11.827 (−3.373) | 8.814→7.500 (−1.314) | 1.840→1.423 (−417) | 1.011→952 (−59) | 799/609 |
| Fevereiro | 10.153→12.740 (+2.587) | 7.150→7.925 (+775) | 1.518→1.565 (+47) | 1.007→862 (−145) | 677/622 |
| Março | 8.883→14.164 (+5.281) | 6.521→9.182 (+2.661) | 1.331→1.772 (+441) | 896→1.243 (+347) | 547/731 |
| Abril | 9.698→12.423 (+2.725) | 7.533→7.079 (−454) | 1.129→1.431 (+302) | 838→1.080 (+242) | 597/929 |
| Maio | 10.930→9.662 (−1.268) | 7.154→6.125 (−1.029) | 1.306→1.255 (−51) | 946→848 (−98) | 580/575 |
| Junho | 8.372→8.299 (−73) | 5.098→5.097 (−1) | 862→1.045 (+183) | 621→729 (+108) | 481/497 |
| Julho | 8.655→10.687 (+2.032) | 5.011→6.649 (+1.638) | 830→1.174 (+344) | 510→919 (+409) | 447/762 |
| Agosto | 8.446→11.033 (+2.587) | 4.959→7.400 (+2.441) | 844→1.172 (+328) | 462→906 (+444) | 478/701 |
| Setembro | 7.700→8.741 (+1.041) | 4.873→6.225 (+1.352) | 783→863 (+80) | 437→695 (+258) | 427/500 |

**Situação de comparação territorial:** no HUB o recorte de julho por AP está autorizado somente em volume de Ouvidorias, logo **não se pode validar taxa de Chamados por AP em julho pela fotografia antiga**. Agosto conserva `SEM AP (AGO)`, enquanto a nova fonte redistribui o valor `Nulo` para AP3. Setembro tem recortes de AP publicados mais comparáveis, mas ainda contém pequenas revisões retroativas. Janeiro–junho não têm, no pacote de meses individuais auditado, um baseline publicado completo de AP/bairro para igual comparação; os novos totais territoriais foram conciliados internamente, porém **não se afirma que rankings antigos destes meses eram iguais**.

### APs de julho a setembro que merecem reconciliação específica

**Julho:** AP3: Chamados não comparáveis no recorte; −17 Ouvidorias · AP5: Chamados não comparáveis no recorte; +4 Ouvidorias.

**Agosto:** AP3: +701 Chamados; +111 Ouvidorias · AP5: −7 Chamados; +3 Ouvidorias.

**Setembro:** AP3: −7 Chamados; −7 Ouvidorias · AP5: −3 Chamados; −4 Ouvidorias.

## 4. Principais bairros do crescimento em cada mês — nova fonte

Rankings calculados por diferença absoluta de registros entre o mesmo mês de 2026 e 2025, sem duplicar registros por gerência.

| Mês | Top 3 — Chamados | Top 3 — Ouvidorias operacionais |
|---|---|---|
| Janeiro | TAQUARA (+217); PECHINCHA (+93); RECREIO DOS BANDEIRANTES (+91) | RECREIO DOS BANDEIRANTES (+41); TANQUE (+33); TIJUCA (+29) |
| Fevereiro | TAQUARA (+226); CAMPO GRANDE (+223); BANGU (+168) | TIJUCA (+47); ACARI (+24); PIEDADE (+22) |
| Março | CAMPO GRANDE (+938); TAQUARA (+426); BANGU (+414) | CAMPO GRANDE (+138); BANGU (+64); TAQUARA (+52) |
| Abril | MEIER (+193); CACHAMBI (+167); BANGU (+163) | CAMPO GRANDE (+90); BANGU (+74); REALENGO (+40) |
| Maio | VILA ISABEL (+89); GRAJAU (+71); IRAJA (+67) | RAMOS (+27); QUINTINO BOCAIUVA (+24); REALENGO (+22) |
| Junho | CAMPO GRANDE (+120); BANGU (+99); BENTO RIBEIRO (+79) | CAMPO GRANDE (+57); TAQUARA (+36); CACHAMBI (+30) |
| Julho | CAMPO GRANDE (+614); TIJUCA (+390); CACHAMBI (+260) | CAMPO GRANDE (+112); BANGU (+93); FREGUESIA (JACAREPAGUA) (+74) |
| Agosto | CAMPO GRANDE (+806); BANGU (+369); TIJUCA (+343) | CAMPO GRANDE (+147); BANGU (+69); TAQUARA (+59) |
| Setembro | CAMPO GRANDE (+432); BANGU (+374); TAQUARA (+217) | CAMPO GRANDE (+86); SENADOR CAMARA (+77); BANGU (+36) |

**Julho, agosto e setembro:** o grupo dos três principais bairros de crescimento de Chamados do HUB permanece nas mesmas posições na nova fonte; Campo Grande continua liderando. Nas Ouvidorias, Campo Grande também permanece líder nos três meses, mas pequenas alterações de ordem e composição aparecem nos demais bairros — portanto, legendas e rankings detalhados precisam ser confrontados com a versão do mês, não copiados automaticamente.

## 5. Matriz de decisão — manter, ajustar ou substituir

| Eixo | Decisão | Motivo / ação |
|---|---|---|
| Totais municipais de janeiro a junho | **MANTER** | Fecham exatamente em ambos os canais. |
| Totais oficiais de julho a setembro | **MANTER** como fechamentos congelados | Registrar revisões retrospectivas à parte, sem troca silenciosa. |
| Leitura de crescimento de Limpeza no ano | **MANTER a tendência; AJUSTAR números por mês** | Redefinição por Tipo original altera crescimento sobretudo abr–set. |
| Participação dos Tipos LIMPEZA e PAPELEIRA | **SUBSTITUIR classificação histórica analítica** | Tipo original precisa prevalecer; não tratar instalação/retirada como exclusão automática de LIMPEZA. |
| Ouvidorias por Tipo de julho a setembro | **AJUSTAR após homologação** | Diferenças substanciais na distribuição entre Limpeza e Papeleira; totais mudam pouco. |
| Indicadores e taxas de AP3 no histórico | **AJUSTAR em prévia comparável** | AP Nulo recebeu AP3 somente na camada derivada; agosto publicado preserva o resíduo SEM AP. |
| Julho: taxa Chamados/Ouvidorias por AP | **NÃO GERAR** a partir do mês congelado | Falta pareamento territorial autorizado no recorte antigo. |
| Rankings de bairros líderes em Chamados jul–set | **MANTER líderes**, ajustar valores | Os três líderes conservam posições; os números têm revisões pontuais. |
| Rankings e contribuições de Ouvidorias por bairro | **REVALIDAR** | Posições secundárias variam; fontes e classificação devem ser sincronizadas. |
| SubTipos de Ouvidorias | **ADIAR** | Nova base tem campos ausentes; não inferir SubTipos. |
| Narrativa histórica de Remoção Gratuita (mudanças de regime, 2021/2025) | **MANTER com ressalva** | A nova base não demonstra causa nem autoriza classificar o fenômeno como sazonalidade. |

## 6. Testes de consistência realizados
- Leitura completa de **63.738 linhas de Chamados** e **15.322 linhas de Ouvidorias** nas cópias tratadas; agregados derivados por competência, Tipo original, AP padronizada e bairro padronizado.
- Soma das cinco APs padronizadas reproduz exatamente os totais municipais em ambos os canais, para cada mês de janeiro a setembro de 2026.
- PCO excluída das Ouvidorias operacionais. Não houve exclusão adicional por SubTipo.
- Nomes originais preservados; Brás de Pina e Osvaldo Cruz padronizados para reduzir duplicidade de bairro; Freguesia Ilha não foi unificada à Freguesia de Jacarepaguá.
- Nenhum cubo público, HTML público, fechamento congelado ou base original alterado.

## 7. Pendências documentadas e limite de interpretação
1. As diferenças da fonte de julho–setembro são **revisões não incorporadas**, não confirmação de erro no fechamento congelado. Homologar por corte e cadeia de custódia antes de trocar a série.
2. Ainda falta reconciliação histórica das nomenclaturas PAPELEIRA/LIMPEZA e da data exata das reclassificações da própria fonte; sem log de alteração individual, não declarar como fato a causa de cada migração.
3. Os recortes territoriais de janeiro–junho foram validados contra seus totais, não contra fotografias mensais oficiais por AP/bairro — que não estão disponibilizadas na mesma granularidade no `1746-timeline/data.js`.
4. Na AP de agosto, `SEM AP (AGO)` do painel antigo não é necessariamente o mesmo conjunto de linhas que `Nulo` da extração atual; ambos têm versões de corte distintas.
5. O panorama operacional é restrito à série 2025–2026 do HUB. A base histórica vai de 2020 a 2026, mas análises anteriores a 2025 requerem outros fechamentos de referência.

## Arquivos e links
- [Boletim revisado de outubro (prévia)](../../1746-resumo-executivo/previa-outubro-base-tratada.html)
- [Prévia de integração](index.html)
- [Chamados tratados no Drive](https://docs.google.com/spreadsheets/d/1qOTScQ-fldjBv9vios4aMTCiBGqa4KoQT23Yiex81UQ/edit)
- [Ouvidorias tratadas no Drive](https://docs.google.com/spreadsheets/d/1QYo05-kXN-F_HbShX_QIliY8Kwn6_rIgrThsfk1u_A0/edit)
- [Cadastro Territorial Mestre](https://docs.google.com/spreadsheets/d/1u9vJsfd7TbG_5rTcXzpEVotte6QrLfMza3eT0Z_JmKI/edit)
