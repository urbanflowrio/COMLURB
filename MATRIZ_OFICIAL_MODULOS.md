# HUB COMLURB | Matriz oficial de módulos

Data da revisão: 15 de setembro de 2026.

Esta matriz registra o estado comprovado no repositório. Campo não comprovado não é preenchido por suposição.

## Módulos do portal executivo

| Módulo | Caminho | Área responsável pelo dado | Origem canônica | Competência ou atualização comprovada | Qualidade e auditabilidade | Situação de homologação |
|---|---|---|---|---|---|---|
| Governança Corporativa | `indicadores-gerais/` | A confirmar formalmente | Google Sheets configurado em `indicadores-gerais/data.js` | Dinâmica. A tela usa a última competência encontrada nas fontes | Regras e testes locais documentados | Operacional. Homologação formal não registrada |
| Acordo de Resultados | `ar/` | A confirmar formalmente | Registro `assets/components/hub-sources.js`, consumido por `ar/ar-config.js` | Dinâmica. A tela usa as competências publicadas | Coberto pela regressão do Core e por piloto de snapshot | Operacional. Homologação formal não registrada |
| Engenharia e Operações | `engenharia-operacional/` | DTE, responsável nominal a confirmar | Registro DTE em `assets/components/hub-sources.js`; Tabela 1493, planilhas de frota e clima declarados no módulo | Dinâmica, com contingência local de frota até jul/2026 | Períodos do snapshot corrigidos e verificados; ausência tratada como nula. Falta conciliar novamente as fontes publicadas | Revisão técnica estrutural aprovada. Conciliação externa e validação visual pendentes |
| IPL | `ipl/` | DLU · responsável nominal a confirmar | SARC e base de avaliações declarados em `ipl/index.html` | Dinâmica. SARC usa `Acumulado` oficial ou valor mensal; territorial usa a competência selecionada | Revisão metodológica registrada em `ipl/HOMOLOGACAO_TECNICA.md`; trechos deduplicados e cálculo territorial separado do oficial | Revisão técnica estrutural aprovada. Conciliação externa SARC e validação visual publicada pendentes |
| Território Operacional | `territorial/` | Área responsável a confirmar | `territorial/data/unidades_comlurb.csv`; camadas em `assets/geojson/` | Cadastro estático. Data de referência não registrada | 342 unidades geocodificadas; 6 feições de Gerências DSU e 215 feições da estrutura territorial DLU. Navegação restaurada | Revisão técnica estrutural aprovada. Validação visual publicada pendente |
| Gestão Estratégica de Pessoas | `pessoas/` | Área responsável a confirmar | Nenhuma fonte pública autorizada | Não se aplica | Bloqueado por LGPD até existir base agregada e anonimizada | Suspenso |
| Performance dos Contratos de Receita | `balanco-receita/` | Área financeira responsável a confirmar | Google Sheets declarado em `balanco-receita/balanco-receita.js` | Exercício 2026 e exercícios anteriores conforme a fonte | Validador independente em `balanco-receita/validacao/`. Última conciliação conhecida sem divergência. Verificação técnica registrada em `balanco-receita/HOMOLOGACAO_TECNICA.md` | Homologação técnica aprovada. Validação visual publicada pendente |
| Chamados 1746 | `chamados-1746/` | Área responsável a confirmar | Cubo analítico em `chamados-1746/chamados_cube.js`. GeoJSON em `chamados-1746/chamados_data.js` | Ago/2026. Corte em 04/09/2026 | Totais, séries e dimensões conciliados. AP de agosto com cobertura parcial documentada. Histórico congelado até jul/2026 | Homologação técnica aprovada com ressalva de AP. Validação visual publicada pendente |
| Ouvidoria Operacional | `ouvidoria/` | Área responsável a confirmar | Cubo analítico em `ouvidoria/ouvidoria_cube.js`. GeoJSON em `ouvidoria/ouvidoria_data.js` | Ago/2026. Corte em 04/09/2026 | Conciliação interna sem divergência. AP de agosto com cobertura parcial. Exclusão da PCO sem base bruta no pacote para reexecução | Homologação técnica aprovada com ressalvas de AP e rastreabilidade da exclusão da PCO. Validação visual publicada pendente |

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
