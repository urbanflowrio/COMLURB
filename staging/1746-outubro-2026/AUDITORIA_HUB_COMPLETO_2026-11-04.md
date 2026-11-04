# Auditoria do HUB COMLURB e fechamento 1746 outubro/2026
**Data:** 04/11/2026
**Repositório:** urbanflowrio/COMLURB
**Produção analisada:** branch `main` (HEAD da árvore `1e63c680af0c9a967bda24c29d717e5fa18a2159`)
**Prévia analisada:** `preparacao-1746-outubro-2026`
**Publicação:** nenhuma alteração realizada na branch `main`.

## 1. Escopo efetivamente executado
- Inventário da árvore Git `main`: 365 objetos, incluindo 26 páginas HTML com `index.html`.
- Conferência estática das 26 páginas HTML de `main`: caminhos de scripts, links e recursos locais explícitos, presença de identificadores duplicados em texto fonte e existência dos destinos na árvore Git.
- Revisão adicional dos sete documentos HTML que compõem a Home, boletim executivo e cinco módulos 1746 na branch de outubro; conferência estática dos recursos locais e IDs.
- Comparação do histórico mensal 2025 e 2026 entre `main` e a branch de outubro, nas séries Timeline e Histórico.
- Recalculo de 44 conciliações numéricas a partir do cubo Timeline de outubro e do cubo Histórico: metas agregadas, totais dos tipos e agregados por AP, gerência e bairro, meses e acumulados.
- Cruzamento granular por bairro x gerência x serviço x subtipo no cubo de cascata, para Campo Grande, Bangu e OG18G.
- Verificação estática do novo boletim e atualização do teste de regressão para refletir duas prioridades territoriais.

**Não executado nesta rodada:** inspeção do ambiente GitHub Pages em navegador real, exercício funcional de todos os filtros e gráficos em cada módulo, verificação de CDN/serviços externos, auditoria integral do conteúdo numérico de todos os módulos não pertencentes ao 1746, revisão LGPD integral de arquivos de dados e homologação independente contra uma fonte externa ao COMLURB.

## 2. Resultados de dados
- **44 de 44 conciliações numéricas passaram sem divergência.** As quatro medidas em 2025/2026 (chamados e ouvidorias operacionais) fecharam nos níveis `tipos`, `APs`, `gerências`, `bairros`, nos dois períodos `Outubro` e `Jan-Out`; também fecharam as somas da série mensal, a concordância com Histórico e o recorte Outubro.
- Outubro/2026: **24.116 chamados**, **2.213 ouvidorias operacionais**, **2.369 ouvidorias institucionais**; **156** tratadas internamente pela PCO. Outubro/2025: **21.652 chamados**, **2.697 ouvidorias operacionais**, **2.881 institucionais**, com **184 PCO**.
- Acumulado jan-out/2026: **278.888 chamados** e **32.562 ouvidorias operacionais**. Comparativo jan-out/2025: **245.656 chamados** e **28.192 ouvidorias operacionais**.
- A revisão das séries `Timeline` e `Histórico` demonstrou preservação das nove competências janeiro a setembro no comparativo entre a prévia e `main`.
- O relatório técnico anterior, `AUDITORIA_REGRESSAO_OUT2026.md`, registra outras **262 verificações de dados e 34 estáticas** sem divergências. Essas verificações são histórico de execução anterior, não novos testes de navegador desta rodada.

## 3. Correção da sobreposição territorial
O desenho anterior apresentava OG18G e Campo Grande como alertas aparentemente independentes. Entretanto, o cruzamento comprova que existe interseção de registros:
| Medida | OG18G total out/2026 | OG18G dentro de Campo Grande out/2026 | Participação |
|---|---:|---:|---:|
| Chamados | 836 | 599 | 71,7% |
| Ouvidorias operacionais | 127 | 99 | 78,0% |

No mesmo cruzamento, outubro/2025 registrou 317 chamados e 48 ouvidorias. Em outubro/2026, a parcela Campo Grande x OG18G subiu para 599 e 99, respectivamente. A soma indevida entre os dois recortes duplicaria registros.

**Tratamento implantado:** a seção do boletim passa a listar **dois recortes de prioridade: Campo Grande, com OG18G como detalhe da interseção, e Bangu**. O boletim declara que a interseção já está incluída no total do bairro e não deve ser somada novamente. A seção mantém os rótulos explícitos Out/2025 e Out/2026, os números absolutos e as contribuições relativas de Limpeza.

## 4. Auditoria estática de toda a estrutura do HUB público
- **26 páginas HTML em `main`** examinadas. Links e fontes de arquivo locais explícitos foram confrontados com os objetos existentes na árvore Git, inclusive caminhos relativos. **Nenhum recurso local comprovadamente ausente** após resolver caminhos e decodificar o nome do logotipo.
- Os módulos examinados abrangem: Home; Chamados, Ouvidorias, Comparativo, Histórico e Timeline do 1746; Pessoas; Território; AR e pilotos; Engenharia Operacional e pilotos; IPL; Receita e validação; Contratos e contratos SME/SMS; Indicadores Gerais e ANA; Lab; Testes; DAF.
- A análise textual de identificadores sinalizou `e06Drill` duas vezes em `ar/index.html`, mas elas aparecem em **saídas alternativas da função geradora de HTML**, e não comprovam dois IDs simultâneos no DOM. Não classificar como defeito sem execução em navegador.
- `main` continua com referência de competência **setembro/2026** para os módulos do 1746. É consistente com a decisão de **não publicar outubro ainda**, e não é divergência de total.
- Os dados analíticos do 1746 usam fechamento histórico e há diferenças entre extrações posteriores e meses congelados já documentadas nos arquivos `data-cutoff.json`. Não reprocessar janeiro a setembro automaticamente.

**Limitação importante:** a disponibilidade real de GitHub Pages, serviços externos, carregamento de Chart.js/Leaflet, renderização de gráficos, eventos e drill-down não pode ser inferida somente dos caminhos que existem no repositório.

## 5. Auditoria estática da prévia de outubro
- Home e seis páginas de entrada/visão do 1746 examinadas; todos os recursos locais explícitos encontrados na árvore da branch e nenhum ID HTML duplicado detectado nesses arquivos.
- O novo Boletim Executivo usa somente HTML/CSS, três seções fixas, duas prioridades territoriais e **nenhum JavaScript**, evitando falhas de carregamento de dados nessa página.
- O teste `tests/1746-outubro/executivo.spec.cjs` foi atualizado para esperar duas prioridades e validar a interseção apresentada, não os três alertas antigos.
- As três prévias obsoletas (v2, v3, v4) e o JavaScript `executivo.js` não utilizado foram removidos da branch para evitar acesso acidental a análises ultrapassadas. Permanecem `index.html` e `boletim-outubro-2026-auditado-v5.html`.
- A execução em Chromium [41882429579](https://github.com/urbanflowrio/COMLURB/actions/runs/41882429579) mostrou **5 de 5 smoke tests dos módulos analíticos aprovados**. A suíte geral falhou porque o teste do boletim ainda esperava três prioridades; o boletim corretamente apresentava duas. Corrigimos a expectativa no commit `2ec4419a`. A aprovação da suíte completa **ainda não foi confirmada após esse ajuste**. Esses smoke tests verificam carregamento, filtros selecionados e responsividade básica, mas não homologam exaustivamente todos os fluxos de interação e gráficos.

## 6. Pendências e recomendações
**P1. Homologação:** confirmar aprovação da suíte atualizada no GitHub Actions e realizar conferência visual do boletim desktop/celular, além dos filtros/drill-down mais importantes dos cinco módulos técnicos. Os cinco smoke tests passaram na execução anterior, mas a suíte atualizada precisa ser confirmada.

**P1. Comparação de produção:** comparar o conteúdo servido pelo GitHub Pages com o HEAD de `main` para confirmar implantação e invalidação de cache. O endereço público não pôde ser inspecionado nesta rodada.

**P2. Governança:** registrar formalmente a regra de sobreposição de alertas entre gerência e bairro; separar total territorial, subtotal gerencial e interseção.

**P2. Metadados:** manter explícito que a extração final de outubro não possui data de corte informada. O `cutoff` legado de 05/10/2026 na Timeline corresponde ao fechamento anterior e não deve ser interpretado como data da extração final de outubro.

**P2. Revisão geral:** programar auditoria funcional e de dados de módulos não relacionados ao 1746; a conferência estrutural das páginas foi efetuada, mas não oferece certificação de suas métricas, integridade de dados pessoais ou desempenho.

## 7. Conclusão e status
**Aprovado no escopo verificado:** conciliação dos indicadores testados, preservação histórica do 1746, recursos locais estáticos e correção da sobreposição no boletim.

**Não homologado para produção:** testes completos em navegador, CDN, implantação GitHub Pages, auditoria integral de indicadores dos demais módulos, fonte independente do 1746 e aceite da Diretoria.

**Recomendação:** preservar a branch `main` e liberar publicação apenas após revisão visual/funcional final e autorização expressa.
