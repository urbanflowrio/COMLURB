# Auditoria dos indicadores 1746 após a padronização

Base extraída em **11/11/2026**. Este complemento usa os [catálogos aprovados](GUIA_DE_MANUTENCAO_DO_CATALOGO_1746.md) e o [inventário dos seis módulos publicados](PARECER_AUDITORIA_COMPLETA_HUB_1746.md).

## Controles e resultados

- Releitura de 63.738 linhas de Chamados e 41.829 de Ouvidorias. Cobertura de 91 e 163 combinações, respectivamente, sem nomes fora do catálogo. Volumes conferidos como inteiros não negativos.
- 274 combinações não vazias de canal, escopo, ano e mês conciliadas entre total, Tipo, SubTipo, AP original, bairro, gerência e bairro com gerência, de 2020 a 2026. Novembro parcial permanece fora dos comparativos de fechamento.
- [Conciliação municipal mês a mês](INDICADORES_MUNICIPAIS_1746.md). Outubro publicado → recalculado: Chamados 24.116 → 24.120; Ouvidorias operacionais 2.213 → 2.267; Ouvidorias incluindo PCO 2.370 → 2.436. Acumulado: Chamados 278.888 → 278.807; Ouvidorias operacionais 32.562 → 32.587.
- Acumulado de Chamados de Limpeza publicado → recalculado: 80.617 → 79.080 (2025) e 99.911 → 99.453 (2026). Papeleira: 166 → 1.701 e 0 → 460. Em Ouvidorias operacionais de 2026, Limpeza 16.820 → 16.712 e Papeleira 515 → 664.
- A AP original `Nulo` deve permanecer disponível para auditoria. Pela correspondência AP3 documentada no parecer de referência, outubro passa de 7.994 a 9.159 Chamados na AP3 após a atribuição territorial. AP3 e AP5 somam +2.318 dos +2.468 Chamados adicionais (93,9%). Para implementar a regra, usar o cadastro por bairro e verificar Jabour em AP5.
- Outubro: Bangu lidera o aumento de Chamados (+409), seguido por Campo Grande (+376). Campo Grande lidera Ouvidorias (+62), seguido por Bangu (+39). OG18G em Campo Grande e OG17B em Bangu são partes dos totais dos respectivos bairros.
- Manejo Arbóreo: a avaliação de poda sem prazo perde 1.576 Chamados e o rótulo com 180 dias ganha 1.227. A alteração de rótulo exige cautela na leitura; o Tipo agregado é a referência para comparar volumes do serviço.
- Taxa municipal de Ouvidorias operacionais por mil Chamados: 124,6 → 94,0 em outubro de 2025 para outubro de 2026. Dividir Ouvidorias operacionais por Chamados elegíveis do mesmo período e multiplicar por mil. Denominador zero implica taxa indisponível.

## Verificação por módulo

| Módulo | Resultado e ponto de homologação |
|---|---|
| Chamados | Recalcular totais e filtros após exclusão por OUV. Integrar Tipos e Subtipos do catálogo e conferir AP derivada. |
| Ouvidorias | Atualizar outubro em todos os recortes. Preservar a separação de PCO e aplicar rótulos sem prefixo. |
| Histórico | Reconciliar série e cabeçalho com a extração. Identificar explicitamente recortes parciais e séries exploratórias. |
| Linha do Tempo | Reprocessar comparações e taxas dos meses fechados. Validar as decomposições de demanda, composição e taxa após a integração. |
| Comparativo Territorial | Usar Chamados elegíveis por 10 mil moradores com o Censo 2022. A base de ocorrências fornece o numerador; denominadores e taxas de cada bairro exigem conferência no módulo. |
| Boletim Executivo | Atualizar a queda anual das Ouvidorias para 15,9% e a taxa para 94,0. Limpeza sobe 2.587 Chamados e 178 Ouvidorias. Retirar o ajuste de Limpeza que excluía papeleiras com base no SubTipo. |

Este complemento audita a base e confronta os números publicados registrados no parecer. Permanecem pendentes a validação de denominadores bairro a bairro, a reprodução de todas as decomposições da Linha do Tempo e a validação de ponta a ponta dos painéis com os novos dados. As planilhas agregadas não permitem atestar duplicidades de protocolo.

As tabelas a seguir mostram todos os Tipos e APs originais com volume no período e os maiores aumentos e reduções nos demais recortes.

## Chamados | Outubro

| Recorte | Indicador | 2025 | 2026 | Diferença |
|---|---|---:|---:|---:|
| Tipo | Limpeza | 5.745 | 8.332 | +2.587 |
| Tipo | Coleta domiciliar | 1.099 | 1.706 | +607 |
| Tipo | Vetores | 1.849 | 2.061 | +212 |
| Tipo | Remoção de carcaça de veículo | 141 | 189 | +48 |
| Tipo | Fiscalização de grande gerador | 38 | 78 | +40 |
| Tipo | Coleta seletiva | 35 | 75 | +40 |
| Tipo | Remoção de caçamba de empresa particular | 40 | 51 | +11 |
| Tipo | Praças | 63 | 70 | +7 |
| Tipo | Remoção gratuita transferência | 25 | 24 | -1 |
| Tipo | Remoção gratuita paquetá | 22 | 18 | -4 |
| Tipo | Papeleira | 166 | 0 | -166 |
| Tipo | Manejo arbóreo | 2.396 | 1.977 | -419 |
| Tipo | Remoção gratuita | 10.033 | 9.539 | -494 |
| SubTipo | Manejo arbóreo › Avaliação de poda de árvores em logradouro (180 dias) | 0 | 1.227 | +1.227 |
| SubTipo | Limpeza › Remoção de resíduos no logradouro | 2.283 | 3.299 | +1.016 |
| SubTipo | Limpeza › Capina em logradouro | 780 | 1.425 | +645 |
| SubTipo | Coleta domiciliar › Verificação de frequência irregular da coleta domiciliar com retirada do resíduo | 1.090 | 1.706 | +616 |
| SubTipo | Limpeza › Varrição de logradouro | 1.506 | 1.912 | +406 |
| SubTipo | Manejo arbóreo › Avaliação de poda de árvores em logradouro | 1.576 | 0 | -1.576 |
| SubTipo | Remoção gratuita › Remoção de entulho e bens inservíveis | 10.033 | 9.539 | -494 |
| SubTipo | Papeleira › Instalação ou retirada de papeleira | 166 | 0 | -166 |
| SubTipo | Manejo arbóreo › Remoção de árvore em logradouro | 328 | 280 | -48 |
| SubTipo | Fiscalização de grande gerador › Fiscalização de estabelecimento com irregularidades no descarte do lixo extraordinário e/ou infectante | 35 | 0 | -35 |
| AP | AP5 | 4.977 | 6.130 | +1.153 |
| AP | AP3 | 7.525 | 8.619 | +1.094 |
| AP | AP4 | 3.818 | 3.999 | +181 |
| AP | Nulo | 469 | 540 | +71 |
| AP | AP1 | 946 | 956 | +10 |
| AP | AP2 | 3.917 | 3.876 | -41 |
| Bairro | BANGU | 577 | 986 | +409 |
| Bairro | CAMPO GRANDE | 1.415 | 1.791 | +376 |
| Bairro | TAQUARA | 637 | 787 | +150 |
| Bairro | RAMOS | 149 | 275 | +126 |
| Bairro | IRAJA | 329 | 451 | +122 |
| Bairro | GUADALUPE | 225 | 161 | -64 |
| Bairro | FREGUESIA (JACAREPAGUA) | 459 | 398 | -61 |
| Bairro | ROCHA MIRANDA | 156 | 105 | -51 |
| Bairro | JACAREPAGUA | 143 | 93 | -50 |
| Bairro | ANIL | 235 | 186 | -49 |
| Gerência | OG17B | 359 | 881 | +522 |
| Gerência | OG18G | 462 | 834 | +372 |
| Gerência | NG25F | 166 | 423 | +257 |
| Gerência | CG10R | 129 | 332 | +203 |
| Gerência | BG16J | 476 | 673 | +197 |
| Gerência | LDO | 5.059 | 4.844 | -215 |
| Gerência | LDN | 3.280 | 3.080 | -200 |
| Gerência | LDE | 166 | 0 | -166 |
| Gerência | UGV-T | 360 | 244 | -116 |
| Gerência | UGV-M | 421 | 321 | -100 |
| Bairro e gerência | BANGU › OG17B | 221 | 637 | +416 |
| Bairro e gerência | CAMPO GRANDE › OG18G | 317 | 597 | +280 |
| Bairro e gerência | PAVUNA › NG25F | 114 | 239 | +125 |
| Bairro e gerência | TAQUARA › BG16J | 207 | 325 | +118 |
| Bairro e gerência | RAMOS › CG10R | 43 | 143 | +100 |
| Bairro e gerência | FREGUESIA (JACAREPAGUA) › LDO | 260 | 195 | -65 |
| Bairro e gerência | TIJUCA › LDN | 460 | 406 | -54 |
| Bairro e gerência | TODOS OS SANTOS › LDN | 144 | 101 | -43 |
| Bairro e gerência | PRACA SECA › LDO | 189 | 149 | -40 |
| Bairro e gerência | ENGENHO NOVO › LDN | 114 | 78 | -36 |

## Chamados | Jan–out

| Recorte | Indicador | 2025 | 2026 | Diferença |
|---|---|---:|---:|---:|
| Tipo | Limpeza | 79.080 | 99.453 | +20.373 |
| Tipo | Remoção gratuita | 92.761 | 100.176 | +7.415 |
| Tipo | Vetores | 20.221 | 22.500 | +2.279 |
| Tipo | Manejo arbóreo | 30.397 | 32.665 | +2.268 |
| Tipo | Coleta domiciliar | 17.795 | 18.602 | +807 |
| Tipo | Remoção de carcaça de veículo | 1.487 | 2.116 | +629 |
| Tipo | Coleta seletiva | 326 | 616 | +290 |
| Tipo | Praças | 594 | 837 | +243 |
| Tipo | Fiscalização de grande gerador | 340 | 500 | +160 |
| Tipo | Remoção gratuita paquetá | 192 | 232 | +40 |
| Tipo | Remoção de caçamba de empresa particular | 399 | 432 | +33 |
| Tipo | Remoção gratuita transferência | 354 | 218 | -136 |
| Tipo | Papeleira | 1.701 | 460 | -1.241 |
| SubTipo | Manejo arbóreo › Avaliação de poda de árvores em logradouro (180 dias) | 2 | 20.749 | +20.747 |
| SubTipo | Limpeza › Remoção de resíduos no logradouro | 29.585 | 37.208 | +7.623 |
| SubTipo | Remoção gratuita › Remoção de entulho e bens inservíveis | 92.761 | 100.176 | +7.415 |
| SubTipo | Limpeza › Capina em logradouro | 13.283 | 17.666 | +4.383 |
| SubTipo | Limpeza › Varrição de logradouro | 19.199 | 22.555 | +3.356 |
| SubTipo | Manejo arbóreo › Avaliação de poda de árvores em logradouro | 20.419 | 1.343 | -19.076 |
| SubTipo | Papeleira › Instalação ou retirada de papeleira | 1.701 | 460 | -1.241 |
| SubTipo | Manejo arbóreo › Reparo de calçada danificada por raiz | 993 | 815 | -178 |
| SubTipo | Remoção gratuita transferência › Remoção de entulho e bens inservíveis transferência | 354 | 218 | -136 |
| SubTipo | Limpeza › Limpeza de praias | 261 | 192 | -69 |
| AP | AP3 | 90.524 | 102.269 | +11.745 |
| AP | AP5 | 62.087 | 69.310 | +7.223 |
| AP | AP2 | 39.662 | 46.040 | +6.378 |
| AP | AP4 | 37.743 | 43.542 | +5.799 |
| AP | AP1 | 10.129 | 11.180 | +1.051 |
| AP | Nulo | 5.502 | 6.466 | +964 |
| Bairro | CAMPO GRANDE | 17.667 | 20.559 | +2.892 |
| Bairro | BANGU | 7.144 | 9.056 | +1.912 |
| Bairro | TAQUARA | 6.948 | 8.249 | +1.301 |
| Bairro | VILA ISABEL | 3.566 | 4.752 | +1.186 |
| Bairro | TIJUCA | 7.964 | 9.048 | +1.084 |
| Bairro | SANTA CRUZ | 6.934 | 6.621 | -313 |
| Bairro | PACIENCIA | 3.184 | 2.965 | -219 |
| Bairro | SANTA TERESA | 1.702 | 1.592 | -110 |
| Bairro | AGUA SANTA | 550 | 455 | -95 |
| Bairro | LAGOA | 643 | 553 | -90 |
| Gerência | LDN | 30.493 | 33.539 | +3.046 |
| Gerência | BG16J | 5.527 | 8.265 | +2.738 |
| Gerência | LDO | 46.500 | 49.038 | +2.538 |
| Gerência | OG17B | 5.098 | 6.997 | +1.899 |
| Gerência | CG13M | 5.241 | 7.118 | +1.877 |
| Gerência | LDE | 1.701 | 460 | -1.241 |
| Gerência | OG19C | 6.650 | 6.206 | -444 |
| Gerência | OG26P | 3.232 | 2.961 | -271 |
| Gerência | UGV-B | 5.328 | 5.077 | -251 |
| Gerência | SG03R | 1.559 | 1.450 | -109 |
| Bairro e gerência | BANGU › OG17B | 3.134 | 4.817 | +1.683 |
| Bairro e gerência | TAQUARA › BG16J | 2.446 | 3.739 | +1.293 |
| Bairro e gerência | CAMPO GRANDE › LDO | 5.425 | 6.269 | +844 |
| Bairro e gerência | CAMPO GRANDE › OG18G | 5.564 | 6.366 | +802 |
| Bairro e gerência | VILA ISABEL › CG09V | 1.261 | 2.005 | +744 |
| Bairro e gerência | SANTA CRUZ › OG19C | 3.676 | 3.169 | -507 |
| Bairro e gerência | PACIENCIA › OG19C | 1.795 | 1.533 | -262 |
| Bairro e gerência | GUARATIBA › OG26P | 2.672 | 2.449 | -223 |
| Bairro e gerência | COPACABANA › SG05C | 1.046 | 917 | -129 |
| Bairro e gerência | REALENGO › UGV-M | 848 | 724 | -124 |

## Ouvidorias operacionais | Outubro

| Recorte | Indicador | 2025 | 2026 | Diferença |
|---|---|---:|---:|---:|
| Tipo | Limpeza | 1.011 | 1.189 | +178 |
| Tipo | Coleta seletiva | 11 | 12 | +1 |
| Tipo | Remoção de carcaça de veículo | 14 | 13 | -1 |
| Tipo | Fiscalização de remoção de caçamba particular | 1 | 0 | -1 |
| Tipo | Vetores | 39 | 38 | -1 |
| Tipo | Papeleira | 53 | 50 | -3 |
| Tipo | Remoção de caçamba de empresa particular | 7 | 2 | -5 |
| Tipo | Fiscalização de grande gerador | 31 | 4 | -27 |
| Tipo | Praças | 49 | 12 | -37 |
| Tipo | Coleta domiciliar | 202 | 154 | -48 |
| Tipo | Manejo arbóreo | 480 | 310 | -170 |
| Tipo | Remoção gratuita | 799 | 483 | -316 |
| SubTipo | Limpeza › Remoção de resíduos no logradouro | 282 | 334 | +52 |
| SubTipo | Limpeza › Capina em logradouro | 54 | 102 | +48 |
| SubTipo | Limpeza › Instalação ou retirada de papeleira | 0 | 45 | +45 |
| SubTipo | Limpeza › Informação sobre caçamba comunitária | 266 | 302 | +36 |
| SubTipo | Limpeza › Limpeza de praças e parques | 16 | 38 | +22 |
| SubTipo | Remoção gratuita › Remoção de entulho e bens inservíveis | 794 | 482 | -312 |
| SubTipo | Manejo arbóreo › Avaliação de poda de árvores em logradouro | 320 | 189 | -131 |
| SubTipo | Manejo arbóreo › Remoção de árvore em logradouro | 88 | 37 | -51 |
| SubTipo | Coleta domiciliar › Verificação de frequência irregular da coleta domiciliar com retirada do resíduo | 160 | 112 | -48 |
| SubTipo | Praças › Manutenção de mobiliário, brinquedos e equipamentos esportivos em praças e parques públicos | 49 | 12 | -37 |
| AP | AP5 | 554 | 607 | +53 |
| AP | AP1 | 92 | 88 | -4 |
| AP | AP3 | 1.011 | 913 | -98 |
| AP | AP4 | 563 | 393 | -170 |
| AP | AP2 | 477 | 266 | -211 |
| Bairro | CAMPO GRANDE | 152 | 214 | +62 |
| Bairro | BANGU | 46 | 85 | +39 |
| Bairro | PAVUNA | 33 | 53 | +20 |
| Bairro | SENADOR CAMARA | 27 | 46 | +19 |
| Bairro | IRAJA | 29 | 48 | +19 |
| Bairro | TIJUCA | 129 | 57 | -72 |
| Bairro | FREGUESIA (JACAREPAGUA) | 74 | 39 | -35 |
| Bairro | VILA ISABEL | 61 | 26 | -35 |
| Bairro | RECREIO DOS BANDEIRANTES | 74 | 39 | -35 |
| Bairro | PIEDADE | 49 | 17 | -32 |
| Gerência | OG18G | 70 | 130 | +60 |
| Gerência | NG25F | 34 | 69 | +35 |
| Gerência | OG17B | 59 | 92 | +33 |
| Gerência | NG15M | 38 | 60 | +22 |
| Gerência | BG16J | 87 | 100 | +13 |
| Gerência | LDN | 329 | 166 | -163 |
| Gerência | LDO | 446 | 299 | -147 |
| Gerência | UGV-B | 90 | 36 | -54 |
| Gerência | UGV-T | 97 | 46 | -51 |
| Gerência | UGV-S | 86 | 41 | -45 |
| Bairro e gerência | CAMPO GRANDE › OG18G | 48 | 102 | +54 |
| Bairro e gerência | BANGU › OG17B | 28 | 54 | +26 |
| Bairro e gerência | PAVUNA › NG25F | 25 | 47 | +22 |
| Bairro e gerência | PECHINCHA › BG16F | 20 | 35 | +15 |
| Bairro e gerência | SENADOR CAMARA › OG17B | 15 | 30 | +15 |
| Bairro e gerência | TIJUCA › LDN | 42 | 12 | -30 |
| Bairro e gerência | PIEDADE › CG13P | 31 | 12 | -19 |
| Bairro e gerência | RECREIO DOS BANDEIRANTES › BG24R | 38 | 19 | -19 |
| Bairro e gerência | VICENTE DE CARVALHO › NG14I | 20 | 2 | -18 |
| Bairro e gerência | VILA ISABEL › LDN | 24 | 6 | -18 |

## Ouvidorias operacionais | Jan–out

| Recorte | Indicador | 2025 | 2026 | Diferença |
|---|---|---:|---:|---:|
| Tipo | Limpeza | 13.014 | 16.712 | +3.698 |
| Tipo | Remoção gratuita | 7.234 | 8.297 | +1.063 |
| Tipo | Papeleira | 462 | 664 | +202 |
| Tipo | Vetores | 284 | 451 | +167 |
| Tipo | Remoção de carcaça de veículo | 94 | 142 | +48 |
| Tipo | Remoção de caçamba de empresa particular | 26 | 40 | +14 |
| Tipo | Fiscalização de grande gerador | 97 | 104 | +7 |
| Tipo | Coleta seletiva | 150 | 153 | +3 |
| Tipo | Fiscalização de remoção de caçamba particular | 8 | 8 | 0 |
| Tipo | Remoção gratuita paquetá | 1 | 1 | 0 |
| Tipo | Fiscalização | 4 | 1 | -3 |
| Tipo | Coleta domiciliar | 1.997 | 1.847 | -150 |
| Tipo | Praças | 381 | 214 | -167 |
| Tipo | Manejo arbóreo | 4.440 | 3.953 | -487 |
| SubTipo | Limpeza › Informação sobre caçamba comunitária | 2.117 | 3.537 | +1.420 |
| SubTipo | Remoção gratuita › Remoção de entulho e bens inservíveis | 7.198 | 8.269 | +1.071 |
| SubTipo | Limpeza › Remoção de resíduos no logradouro | 4.103 | 4.950 | +847 |
| SubTipo | Limpeza › Capina em logradouro | 1.433 | 1.897 | +464 |
| SubTipo | Limpeza › Limpeza de papeleira, contêiner e caçamba | 157 | 446 | +289 |
| SubTipo | Coleta domiciliar › Verificação de frequência irregular da coleta domiciliar com retirada do resíduo | 1.532 | 1.200 | -332 |
| SubTipo | Manejo arbóreo › Avaliação de poda de árvores em logradouro | 2.908 | 2.647 | -261 |
| SubTipo | Manejo arbóreo › Remoção de árvore em logradouro | 692 | 445 | -247 |
| SubTipo | Limpeza › Retirada de caçamba comunitária | 221 | 9 | -212 |
| SubTipo | Praças › Manutenção de mobiliário, brinquedos e equipamentos esportivos em praças e parques públicos | 380 | 213 | -167 |
| AP | AP5 | 7.282 | 8.841 | +1.559 |
| AP | AP3 | 11.454 | 12.613 | +1.159 |
| AP | AP4 | 4.736 | 5.798 | +1.062 |
| AP | AP2 | 3.672 | 4.340 | +668 |
| AP | AP1 | 1.048 | 995 | -53 |
| Bairro | CAMPO GRANDE | 2.155 | 2.633 | +478 |
| Bairro | BANGU | 752 | 1.118 | +366 |
| Bairro | SENADOR CAMARA | 220 | 518 | +298 |
| Bairro | TAQUARA | 874 | 1.143 | +269 |
| Bairro | REALENGO | 553 | 762 | +209 |
| Bairro | SANTA CRUZ | 789 | 683 | -106 |
| Bairro | BENTO RIBEIRO | 438 | 372 | -66 |
| Bairro | CENTRO | 257 | 217 | -40 |
| Bairro | OSWALDO CRUZ | 254 | 215 | -39 |
| Bairro | RICARDO DE ALBUQUERQUE | 197 | 160 | -37 |
| Gerência | LDO | 4.795 | 5.426 | +631 |
| Gerência | BG16J | 848 | 1.453 | +605 |
| Gerência | OG17B | 663 | 1.261 | +598 |
| Gerência | OG18G | 1.097 | 1.556 | +459 |
| Gerência | NG15M | 512 | 859 | +347 |
| Gerência | UGV-B | 770 | 576 | -194 |
| Gerência | NG15H | 697 | 554 | -143 |
| Gerência | UGV-S | 591 | 471 | -120 |
| Gerência | NG22A | 479 | 400 | -79 |
| Gerência | UGV-T | 754 | 680 | -74 |
| Bairro e gerência | CAMPO GRANDE › OG18G | 774 | 1.120 | +346 |
| Bairro e gerência | TAQUARA › BG16J | 382 | 719 | +337 |
| Bairro e gerência | BANGU › OG17B | 403 | 703 | +300 |
| Bairro e gerência | SENADOR CAMARA › OG17B | 115 | 399 | +284 |
| Bairro e gerência | CAMPO GRANDE › LDO | 530 | 712 | +182 |
| Bairro e gerência | SANTA CRUZ › OG19C | 587 | 481 | -106 |
| Bairro e gerência | CAMPO GRANDE › OG18V | 453 | 378 | -75 |
| Bairro e gerência | BENTO RIBEIRO › NG15H | 208 | 147 | -61 |
| Bairro e gerência | TAQUARA › UGV-B | 140 | 88 | -52 |
| Bairro e gerência | GUADALUPE › NG22A | 150 | 104 | -46 |
