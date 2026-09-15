# HUB COMLURB | Manifesto da entrega

Identificação: `HUB-2026-09-15-GOV-01`.

## Objetivo

Registrar a governança do catálogo, os módulos, as fontes e as revisões técnicas executadas. Os arquivos legados permanecem preservados por segurança. Mudanças de interface e de interpretação de dados são documentadas nas seções específicas de cada módulo.

## Arquivos incluídos ou modificados

- `BASELINE_HOMOLOGACAO.md`
- `CONSOLIDATION_STATUS.md`
- `MANIFESTO_ENTREGA_GOVERNANCA.md`
- `MATRIZ_OFICIAL_MODULOS.md`
- `MODULE_CATALOG.md`
- `PADRAO_GOVERNANCA_DADOS.md`
- `ar/index.html`
- `assets/components/_TEMPLATE.html`
- `assets/components/hub-all.js`
- `contratos/sme/index.html`
- `engenharia-operacional/index.html`
- `ipl/index.html`
- `package-lock.json`
- `package.json`
- `territorial/index.html`
- `testes/testar-fase7b.js`

## Arquivos legados mantidos por segurança

- `app.js`
- `data.js`
- `receita.css`
- `testar-fase7b.js`
- `assets/data/chamados-1746/chamados_data.js`
- `assets/data/chamados-1746/chamados_cube.js`
- `assets/data/ouvidoria/ouvidoria_data.js`
- `assets/data/ouvidoria/ouvidoria_cube.js`
- `territorial/unidades_comlurb (1).csv`

Esses arquivos não devem ser utilizados nem atualizados. Sua exclusão fica adiada até a homologação final dos módulos. Os arquivos canônicos de Chamados e Ouvidoria permanecem dentro das pastas dos próprios módulos. A suíte oficial da Fase 7B permanece em `testes/testar-fase7b.js`. O cadastro territorial permanece em `territorial/data/unidades_comlurb.csv`.

## Validação

- Home conferida sem acesso a Contratos de Prestação de Serviços.
- Dependências externas conferidas com versão explícita.
- Referências aos arquivos excluídos verificadas antes da retirada.
- Regressão integral executada com 604 aprovações e nenhuma reprovação.

## Aplicação confirmada no pacote 61

Em 15 de setembro de 2026, os nove arquivos listados para exclusão ainda estavam presentes no pacote 61. Eles foram retirados desta versão de trabalho. A homologação técnica do Balanço de Receita foi registrada em `balanco-receita/HOMOLOGACAO_TECNICA.md`.

## Aplicação confirmada no pacote 62

Os nove arquivos legados permaneceram no pacote 62. Por decisão de segurança, não serão excluídos antes da homologação final. O módulo Chamados 1746 teve sua fonte analítica separada do GeoJSON, sem alteração dos totais. A homologação técnica e a ressalva de cobertura das áreas de planejamento foram registradas em `chamados-1746/HOMOLOGACAO_TECNICA.md` e `chamados-1746/data-cutoff.json`.

## Homologação da Ouvidoria no pacote 63

O módulo Ouvidoria teve 1.126 verificações internas aprovadas, sem alteração dos totais. Foram registrados dois limites: cobertura parcial de AP em agosto e ausência da base bruta necessária para reexecutar a exclusão dos registros da PCO. Os arquivos legados foram mantidos por segurança.

### Arquivos modificados na homologação da Ouvidoria

- `BASELINE_HOMOLOGACAO.md`
- `MANIFESTO_ENTREGA_GOVERNANCA.md`
- `MATRIZ_OFICIAL_MODULOS.md`
- `MODULE_CATALOG.md`
- `ouvidoria/HOMOLOGACAO_TECNICA.md`
- `ouvidoria/README.md`
- `ouvidoria/data-cutoff.json`
- `ouvidoria/index.html`

### Arquivos modificados na homologação de Chamados

- `BASELINE_HOMOLOGACAO.md`
- `MANIFESTO_ENTREGA_GOVERNANCA.md`
- `MATRIZ_OFICIAL_MODULOS.md`
- `MODULE_CATALOG.md`
- `chamados-1746/HOMOLOGACAO_TECNICA.md`
- `chamados-1746/README.md`
- `chamados-1746/chamados_data.js`
- `chamados-1746/data-cutoff.json`
- `chamados-1746/index.html`

## Revisão técnica de Engenharia e Operações

O módulo foi revisado sem alterar suas fontes ou o snapshot local. Foi corrigida a interpretação dos períodos da frota: na série histórica de coleta seletiva, valores como `21/01/2026` identificam janeiro de 2021. A correção preserva 67 competências contínuas, de janeiro de 2021 a julho de 2026, sem concentrar exercícios anteriores em 2026.

Também foram padronizados o título, a linguagem, os estados sem informação, os botões, a descrição acessível dos gráficos, a redução de movimento e o uso de cores sólidas. A página mantém o botão Home fornecido pelo componente compartilhado.

Esta etapa aprova a estrutura técnica. A homologação final depende de nova conciliação com as fontes publicadas e de teste visual em desktop e celular.

### Arquivos modificados nesta revisão

- `BASELINE_HOMOLOGACAO.md`
- `MANIFESTO_ENTREGA_GOVERNANCA.md`
- `MATRIZ_OFICIAL_MODULOS.md`
- `MODULE_CATALOG.md`
- `engenharia-operacional/README.md`
- `engenharia-operacional/REVISAO_TECNICA.md`
- `engenharia-operacional/index.html`
