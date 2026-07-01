# Engenharia Operacional — HUB COMLURB

Painel de inteligência operacional da Diretoria Técnica e de Engenharia (DTE): destinação de resíduos, biogás, chorume, coleta seletiva/reciclagem e eficiência de frota.

Substitui o antigo painel `/dte` (fora do padrão HUB: CSS inline, emojis, dados estáticos).

## Arquivos

- `index.html` — painel completo (canônico, sem CSS/JS embutido além do necessário)

Depende de:
- `../assets/css/hub-premium.css`
- `../assets/components/hub-utils.js`, `hub-cards.js`, `hub-charts.js`, `hub-layout.js`
- CDN: PapaParse 5.4.1, Chart.js 4.4.0

Por isso **só renderiza corretamente dentro do repositório**, no mesmo nível de `/sme`, `/pessoas`, `/territorial` etc. Aberto solto (fora do HUB-COMLURB), CSS e JS não carregam.

## Telas

1. **Visão Geral** — KPIs (índice de captura, ETR total, frota em operação, chorume acumulado) + fluxo por unidade ETR + série anual de coleta seletiva + frota em operação no tempo.
2. **Destinação e Biogás** — ETR total mensal, biogás CTR Seropédica, chorume acumulado (com alerta automático se o pico atual for 2x+ a média dos primeiros meses da janela).
3. **Coleta Seletiva e Reciclagem** — índice de captura EGP-RIO mensal, coleta seletiva por regional (UDS-S/N/O), origem do peso (frota Comlurb vs. cooperativas/não cadastrados).
4. **Frota e Eficiência** — horas extras, sobrecarga >10% PBT, frota total vs. em operação, ranking de gerências por utilização (mais baixa e mais alta).

## Fontes de dados (ao vivo)

Todas via CSV publicado do Google Sheets, carregado no navegador (client-side, contorna o bloqueio de robots.txt que existe para fetch server-side):

| Fonte | Planilha | Aba | Formato |
|---|---|---|---|
| `ind2025` | 1493 - Indicadores Comlurb Prefeitura | 2025 | largo (rótulo + Total + Jan..Dez) |
| `ind2026` | 1493 - Indicadores Comlurb Prefeitura | 2026 | largo |
| `relatorio` | Relatório mensal DTE | geral | largo (janela rolante de 13 meses, sem coluna Total) |
| `coletaDomiciliar` | Utilização da Frota | Base Coleta Domiciliar | tabular |
| `coletaSeletiva` | Utilização da Frota | Base Coleta Seletiva | tabular |
| `lixoPublico` | Utilização da Frota | Base Lixo Público | tabular |

URLs completas estão em `CONFIG.urls` no topo do `<script>` do `index.html`.

## Como o parser funciona (planilhas em formato largo)

`ind2025`, `ind2026` e `relatorio` não têm uma linha de cabeçalho única — são relatórios com seções e rótulos na coluna A ou B. Por isso não usam `HUB.data.loadCSV` (que espera header tabular), e sim um parser próprio:

- `findRow(rows, label)` — procura a linha cujo rótulo (nas 3 primeiras colunas) contém o texto buscado, normalizado (sem acento, maiúsculo). Não depende de número fixo de coluna.
- `ind1493Serie(rows, label)` — para as abas 1493: retorna `{ total, meses[12] }`, assumindo layout Rótulo → Total → Jan..Dez.
- `relatorioSerie(rows, label, n)` — para o relatório mensal: retorna os `n` valores logo após o rótulo (sem coluna Total).
- `relatorioMeses(rows)` — não fixa os nomes dos meses no código. Lê a linha de datas da própria planilha e formata como `mmm/aa`. Isso é proposital: a janela do relatório mensal é rolante, então hoje é mai/25–mai/26, mês que vem é jun/25–jun/26. Se travasse os rótulos no código, ficaria errado no mês seguinte.

Se a Prefeitura ou a DTE renomearem uma linha na planilha de origem, o gráfico correspondente para de encontrar o rótulo e volta com zero — não quebra o painel inteiro, só aquele card.

### Depuração

Abra o console do navegador (F12). Cada fonte carregada loga `OK <nome>: N linhas` ou `Falhou <nome>` com o motivo. Se um gráfico vier vazio, comece por aí: geralmente é rótulo de linha que mudou na planilha de origem.

## Regras de negócio já aplicadas

- **Índice de captura**: fórmula oficial EGP-RIO — `(total reciclável coletado) / (34,94% do lixo domiciliar + total reciclável coletado) × 100`. Usa o mês mais recente com dado em 2026; se 2026 ainda não tiver nada, cai para 2025.
- **SINISA/IRR não entra neste painel.** É indicador do Acordo de Resultados, com valor sempre a partir do SARC publicado — mora no módulo AR 2026, não aqui, para não duplicar cálculo com metodologia divergente.
- **2022–2024 são anos fechados** (não mudam mais) e ficam com valor fixo no código, comentado como `HIST` — não são estimativa, são fato histórico da Tabela 1493.
- Sem emoji, sem progress bar fora do padrão, sem gradiente decorativo fora do `hub-premium.css`.

## Pendências / próximos passos

- Validar em produção se os rótulos de linha batem exatamente com o texto das planilhas ao vivo (o parser foi construído a partir de uma exportação `.xlsx` anterior — pode haver pequena divergência de texto).
- Definir se o ranking de gerências (tela Frota e Eficiência) deve considerar também Coleta Seletiva e Lixo Público, hoje só usa Coleta Domiciliar.
- Avaliar se cabe filtro de ano na tela de Reciclagem (hoje mostra sempre o ano corrente com dado).

---
Desenvolvido por Greicy Moreira · HUB COMLURB
