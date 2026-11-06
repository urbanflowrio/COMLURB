# Integração territorial 1746 — versão de testes (novembro/2026)

**Estado:** pronta para auditoria e homologação técnica; **não aplicada ao HUB público**.

## Conteúdo
- `preflight.json`: fotografia auditada dos totais por mês (jan–out/2025 e jan–out/2026) das duas bases territoriais tratadas, com comparação ao `1746-historico/data.js` na `main`.
- `index.html`: prévia visual da conciliação, **somente dados agregados de auditoria**.
- `reconciliar.cjs`: importador para novas exportações CSV das abas `Página1` das **cópias tratadas**, com revalidação obrigatória antes de gerar `resultado-teste.json`.

## Fontes
- [Chamados histórico original](https://docs.google.com/spreadsheets/d/1JHyp28FigzUrvD9H_EAynap5PgQSrmYQDCOgMtiRkw8/edit)
- [Chamados histórico tratado](https://docs.google.com/spreadsheets/d/1qOTScQ-fldjBv9vios4aMTCiBGqa4KoQT23Yiex81UQ/edit)
- [Ouvidorias histórico original](https://docs.google.com/spreadsheets/d/1-JdPs02T9grCOQgdUz5522bZvqOAUbD32QIaerjXy0U/edit)
- [Ouvidorias histórico tratado](https://docs.google.com/spreadsheets/d/1QYo05-kXN-F_HbShX_QIliY8Kwn6_rIgrThsfk1u_A0/edit)
- [Cadastro Territorial Mestre](https://docs.google.com/spreadsheets/d/1u9vJsfd7TbG_5rTcXzpEVotte6QrLfMza3eT0Z_JmKI/edit)
- [Planilha de auditoria dos Tipos e APs](https://docs.google.com/spreadsheets/d/14dJ53yzJR7ct6-wUKOW4JS1puWFv2LNjEWPLp7H9Qsc/edit)

## Contrato de transformação
1. Copiar **sem editar** as colunas A:O das fontes. **E** = Bairro original; **G** = AP original, com possíveis valores `Nulo`.
2. A cópia tratada acrescenta **P = AP_PADRONIZADA**, **Q = BAIRRO_PADRONIZADO**. Todas as 2.566 linhas cuja AP original era `Nulo` passaram a AP3 exclusivamente no campo P, usando a correspondência dos seis bairros homologados.
3. 612 `BRAZ DE PINA` → `BRÁS DE PINA`, 546 `OSWALDO CRUZ` → `OSVALDO CRUZ` e 14 `IMPERIAL DE SAO CRISTOVAO` → `IMPERIAL DE SÃO CRISTÓVÃO` somente no campo Q. Demais bairros preservados; **Jabour = AP5** validado pela operação.
4. **Tipo vem sempre da coluna B**. Uma linha `LIMPEZA` permanece `LIMPEZA` mesmo quando o SubTipo menciona papeleira ou caçamba. O SubTipo não altera Tipo; não restaurar SubTipo de Ouvidorias por aproximação.
5. **PCO** (gerência original = `PCO`) é contabilizada no institucional e excluída da vista operacional de Ouvidorias. Chamados não passam pelo filtro PCO.
6. A integração considera somente **janeiro a outubro**, nos anos comparáveis de 2025 e 2026. Nov/2026 possui **3.570 Chamados** na extração e não entra no fechamento.
7. **Fontes de outubro não substituem os fechamentos congelados**. O pipeline registra diferenças como `revisao_nao_incorporada`; não corrige a série pública silenciosamente.

## Execução local
No diretório raiz do repo, após `npm ci`, exportar em formato CSV a aba `Página1` de cada cópia tratada, **sem alterar colunas**. Executar:

```bash
node staging/1746-territorial-nov2026/reconciliar.cjs --self-test
node staging/1746-territorial-nov2026/reconciliar.cjs ./CHAMADOS_TRATADOS.csv ./OUVIDORIAS_TRATADAS.csv ./resultado-teste.json
```

As verificações impedem CSV sem campos originais ou P/Q, AP inválida, soma anual inconsistente, número diferente de linhas ou de APs originalmente Nulo e importações cuja série mensal não corresponda ao preflight documentado. O resultado fica fora dos módulos publicados; inclui volume por mês, Tipo original, AP padronizada, distinção institucional/operacional e diferenças mensais.

## Resultado da conciliação inicial, verificado via Google Sheets

| Mês 2026 | Chamados: fonte menos HUB | Ouvidorias operacionais: fonte menos HUB |
|---|---:|---:|
| Janeiro–Junho | 0 | 0 |
| Julho | −43 | −14 |
| Agosto | −16 | −2 |
| Setembro | −23 | −13 |
| Outubro | +4 | 0 |

Em 2025 os totais mensais de janeiro a outubro coincidem entre fonte e HUB. Em 2026, os dados diferentes permanecem **visíveis e não incorporados**. Em outubro o histórico de Chamados tem 24.120, enquanto o HUB possui 24.116. Ouvidorias operacionais de outubro: 2.213 em ambos.

## Limitações de homologação
- A conferência integral por mês/Tipo foi efetuada diretamente nas planilhas e registrada em `preflight.json`, mas **o importador CSV não foi executado nesta etapa com exportações locais completas**.
- O pipeline é uma etapa de **preparo e teste de dados**, não um novo cubo homologado. Nenhum dos cinco módulos públicos foi substituído nesta branch.
- Falta conciliar cada revisão retroativa com seus fechamentos e validar o uso dos campos P/Q no drilldown antes de substituir cubos.
- SubTipos de Ouvidorias permanecem fora do escopo até a origem fornecer todos os SubTipos.

## Publicação
Esta branch `teste-integracao-territorial-1746-nov2026` destina-se à conferência. **Não realizar merge ou publicar os arquivos derivados como série oficial sem homologação específica**.
