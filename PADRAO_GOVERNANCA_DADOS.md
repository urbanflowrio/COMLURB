# HUB COMLURB | Padrão de governança dos dados

Versão 1.0. Data: 15 de setembro de 2026.

## Registro mínimo obrigatório

Toda fonte incorporada ao HUB deve possuir:

| Campo | Regra |
|---|---|
| Módulo | Nome igual ao catálogo oficial |
| Proprietário do dado | Área responsável pela origem e pela autorização do número |
| Responsável técnico | Pessoa que mantém a integração |
| Origem canônica | Um único arquivo ou endereço oficial |
| Competência mais recente | Formato `AAAA-MM` para dados mensais |
| Data de corte | Formato `AAAA-MM-DD` |
| Frequência prevista | Mensal, semanal, diária ou sob demanda |
| Última leitura bem-sucedida | Data e hora da carga efetivamente concluída |
| Situação da qualidade | Validado, com ressalva, indisponível ou não avaliado |
| Regra de retificação | Como alterações retroativas serão autorizadas e registradas |
| Evidência | Relatório, teste, conciliação ou responsável que aprovou |

## Origem única

1. Uma base publicada deve existir em apenas um caminho canônico.
2. Painéis, testes e documentação devem apontar para essa origem.
3. Cópias para contingência precisam ser identificadas como snapshot, com competência e data de geração.
4. Cópias sem referência, competência ou finalidade não podem permanecer como fonte alternativa.
5. Arquivos de Chamados e Ouvidoria são canônicos nas próprias pastas dos módulos.
6. O cadastro territorial canônico é `territorial/data/unidades_comlurb.csv`.

## Competência e data de corte

Competência informa o período representado pelo dado. Data de corte informa quando a extração foi encerrada. Os dois campos não são equivalentes.

Quando um módulo combina fontes com competências diferentes, a interface deve informar a defasagem e não pode apresentar o conjunto como se todas as fontes estivessem atualizadas no mesmo mês.

## Qualidade

| Situação | Critério mínimo |
|---|---|
| Validado | Fonte carregada, estrutura conferida, totais conciliados e filtros testados |
| Com ressalva | Dado utilizável, mas com limitação descrita e impacto conhecido |
| Indisponível | Fonte ausente ou falha. Valor anterior não pode aparecer como atual |
| Não avaliado | Não existe evidência suficiente para declarar qualidade |

Ausência de valor não deve ser convertida automaticamente em zero.

## Fechamento mensal

1. Preservar competências oficialmente fechadas.
2. Acrescentar a nova competência sem reprocessamento silencioso.
3. Registrar qualquer retificação retroativa com motivo, impacto, responsável e data.
4. Publicar juntos o painel, a base canônica, o cubo derivado e o arquivo de corte quando houver dependência entre eles.

## Bibliotecas externas

Versões aprovadas nesta baseline:

| Biblioteca | Versão |
|---|---:|
| Papa Parse | 5.4.1 |
| Chart.js | 4.4.7 |
| Leaflet | 1.9.4 |
| Leaflet.heat | 0.2.0 |

Não usar endereço sem versão explícita. Mudanças de versão exigem regressão antes da publicação.
