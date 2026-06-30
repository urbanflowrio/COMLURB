# Balanço Financeiro Executivo — HUB COMLURB

Módulo de visão executiva dos contratos de receita da COMLURB, focado em leitura por **valor efetivamente recebido**, não por volume faturado.

## Arquivo

- `index.html` — painel único, integrado ao design system do HUB.

## Fonte de dados

Carrega ao vivo, no navegador, via PapaParse, a partir da aba "geral" da planilha publicada:

```
FINANCEIRO_CONTRATOS_RECEITA → aba geral (gid=988341440)
```

URL configurada em `CFG.csvUrl` no início do `<script>` do `index.html`. Para trocar a fonte, edite apenas essa constante.

Colunas esperadas (não alterar nomes na planilha sem atualizar o código): `SECRETARIA`, `SERVIÇO`, `UNIDADES`, `Contrato`, `MÊS COMPETÊNCIA`, `ANO COMPETÊNCIA`, `Valor Fatura`, `INSS`, `ISS`, `IRPJ`, `Valor Líquido Pago`, `Débito Liquido`.

## Filtro de período ativo

`CFG.anosAtivos = ["2025","2026"]`. Só linhas com `Valor Fatura > 0` e ano dentro dessa lista entram no cálculo. Linhas de competências futuras pré-cadastradas (sem valor) são descartadas automaticamente.

## Estrutura do painel (4 camadas)

1. **Situação Financeira** — 4 KPIs: faturado, recebido, débito pendente, contratos em atenção/crítico.
2. **Tendência do Débito** — média móvel trimestral (últimos 3 meses fechados vs. trimestre anterior). O mês mais recente é excluído automaticamente da tendência quando está "em fechamento" (pago = 0 e débito > 0), evitando falso alarme por defasagem de ciclo de pagamento.
3. **Contratos Prioritários** — 3 cards: maior faturamento, maior débito absoluto, maior variação de % débito no último mês fechado.
4. **Carteira Completa** — todos os contratos ativos, em cards (sem tabela dominante).

## Regras de status

```
% Débito / Faturado >= 8%  → Crítico
% Débito / Faturado >= 5%  → Atenção
% Débito / Faturado <  5%  → Dentro da Meta
```

Limiares configuráveis em `CFG.limiarAtencao` e `CFG.limiarCritico`.

## Insights condicionais

Nenhuma frase de leitura aparece nos cards sem que uma condição lógica explícita seja satisfeita:

```
SE (% débito do último mês fechado >= limiar de atenção)
   E (% débito do último mês fechado > % débito do mês anterior)
ENTÃO exibir frase com os dois percentuais
SENÃO SE (% débito acumulado no período >= limiar crítico)
ENTÃO exibir frase de acumulado crítico
SENÃO não exibir nada
```

Não há texto gerado livremente — todo insight nasce de uma regra verificável nos próprios números exibidos no card.

## Dependências

- `../assets/css/hub-premium.css`
- `../assets/components/hub-utils.js`
- `../assets/components/hub-layout.js`
- `../assets/components/hub-cards.js`
- `../assets/components/hub-charts.js`
- PapaParse 5.4.1 (CDN)
- Chart.js 4.4.0 (CDN)

Esses caminhos assumem que `index.html` fica em `balanco-receita/` na raiz do repo, ao lado das demais pastas de módulo (`ar/`, `contratos/`, `dte/` etc.), para que os imports relativos `../assets/...` resolvam corretamente.

## Pendências conhecidas

- Tendência trimestral exige no mínimo 6 meses de dados fechados na carteira agregada. Com menos histórico, o painel exibe aviso em vez de calcular.
- Datas de competência irregulares (ex: "Dezembro/24 a maio/25") não entram na timeline mensal, mas continuam contabilizadas nos totais e cards de contrato.

## Autoria

Desenvolvido por Greicy Moreira — Gabinete da Presidência / Núcleo de Inteligência e Gestão Estratégica Operacional — COMLURB.
