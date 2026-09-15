# HUB COMLURB | Matriz oficial de módulos

Data da revisão: 15 de setembro de 2026.

Esta matriz registra o estado comprovado no repositório. Campo não comprovado não é preenchido por suposição.

## Módulos do portal executivo

| Módulo | Caminho | Área responsável pelo dado | Origem canônica | Competência ou atualização comprovada | Qualidade e auditabilidade | Situação de homologação |
|---|---|---|---|---|---|---|
| Governança Corporativa | `indicadores-gerais/` | A confirmar formalmente | Google Sheets configurado em `indicadores-gerais/data.js` | Dinâmica. A tela usa a última competência encontrada nas fontes | Regras e testes locais documentados | Operacional. Homologação formal não registrada |
| Acordo de Resultados | `ar/` | A confirmar formalmente | Registro `assets/components/hub-sources.js`, consumido por `ar/ar-config.js` | Dinâmica. A tela usa as competências publicadas | Coberto pela regressão do Core e por piloto de snapshot | Operacional. Homologação formal não registrada |
| Desempenho da Operação Urbana | `engenharia-operacional/` | DTE, responsável nominal a confirmar | Registro DTE em `assets/components/hub-sources.js` e fontes complementares declaradas no próprio módulo | Dinâmica, com contingência identificada até jul/2026 | Testes e snapshot disponíveis. Fontes complementares ainda não centralizadas | Em revisão. Não homologado |
| IPL | `ipl/` | Área responsável a confirmar | Google Sheets declarado em `ipl/index.html` | Dinâmica. Competência deve ser confirmada na fonte | Sem validador independente registrado | Operacional. Homologação formal não registrada |
| Território Operacional | `territorial/` | Área responsável a confirmar | `territorial/data/unidades_comlurb.csv` | Cadastro estático. Data de referência não registrada | Arquivo canônico único definido nesta revisão | Operacional. Homologação formal não registrada |
| Gestão Estratégica de Pessoas | `pessoas/` | Área responsável a confirmar | Nenhuma fonte pública autorizada | Não se aplica | Bloqueado por LGPD até existir base agregada e anonimizada | Suspenso |
| Performance dos Contratos de Receita | `balanco-receita/` | Área financeira responsável a confirmar | Google Sheets declarado em `balanco-receita/balanco-receita.js` | Exercício 2026 e exercícios anteriores conforme a fonte | Validador independente em `balanco-receita/validacao/`. Última conciliação conhecida sem divergência | Dados conciliados. Interface sem termo formal de homologação registrado |
| Chamados 1746 | `chamados-1746/` | Área responsável a confirmar | `chamados-1746/chamados_data.js` e `chamados-1746/chamados_cube.js` | Ago/2026. Corte em 04/09/2026 | Histórico congelado até jul/2026. Retificações exigem registro | Fechamento documentado. Homologação formal da interface não registrada |
| Ouvidoria Operacional | `ouvidoria/` | Área responsável a confirmar | `ouvidoria/ouvidoria_data.js` e `ouvidoria/ouvidoria_cube.js` | Ago/2026. Corte em 04/09/2026 | Histórico congelado até jul/2026. Retificações exigem registro | Fechamento documentado. Homologação formal da interface não registrada |

## Fora da Home

| Módulo | Caminho | Situação | Regra |
|---|---|---|---|
| Contratos de Prestação de Serviços | `contratos/` | Acesso direto para avaliação interna | Não inserir na Home sem nova decisão registrada no catálogo oficial |

## Responsabilidade técnica

A coordenação técnica do HUB é de Greicy Moreira. A responsabilidade funcional por cada fonte ainda precisa ser formalizada pela área proprietária do dado. A ausência desse nome está registrada como pendência, não como autorização tácita.

## Regra para mudança de situação

Um módulo só pode receber a situação `Homologado` quando houver registro com:

1. responsável funcional;
2. competência validada;
3. fonte oficial identificada;
4. teste dos totais e filtros;
5. teste em desktop e celular;
6. data, versão e aprovador;
7. resultado registrado em `BASELINE_HOMOLOGACAO.md`.
