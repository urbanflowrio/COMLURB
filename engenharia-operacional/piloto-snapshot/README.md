# Piloto Fase 7C — Live × Snapshot Engenharia/DTE

**Status: implementada e testada automaticamente, aguardando validação humana em navegador com dados reais.**

Não confundir com:
- `engenharia-operacional/piloto/` (Fase 5) — valida o Adapter DTE contra a base vertical `EXPORT_HUB_ENGENHARIA` (Google Sheets), não contra snapshot.
- `ar/piloto-snapshot/` (Fase 7B) — mesmo padrão arquitetural, aplicado ao AR (uma única coleção, `payload.linhas`).

## Objetivo

Comprovar que o snapshot automático da Engenharia/DTE (Fase 6) preserva fielmente a saída canônica produzida pelo Adapter DTE (Fase 5) a partir da fonte live — no estágio **pré-regras**, imediatamente após o Adapter, antes de qualquer cálculo de status/atingimento/tendência/bonificação (que hoje nem existem para este módulo).

Não compara dashboards, gráficos, cards, rankings ou sínteses executivas. Não aplica nenhuma regra de negócio.

## Estágio da comparação

```
Locator → Reader → Decoder local (Papa.parse) → Adapter DTE → Validator → envelope canônico
                                                                              │
                                                          ┌───────────────────┴───────────────────┐
                                                          │                                         │
                                                     fonte "live"                            fonte "snapshot"
                                              HUB.ingest.adapterDTE.carregarDTE({})   HUB.snapshotReader.lerAsync("engenharia-dte")
                                                          │                                         │
                                                          └──────────────────┬──────────────────────┘
                                                                             │
                                                          HUB.dataSource.resolver("engenharia-dte", "compare",
                                                            {liveProvider, snapshotProvider, compareProvider: compararColecoesDTE})
```

`hub-data-source.js` (Fase 7A, não alterado) fornece o ponto de extensão `compareProvider` — este piloto injeta um comparador próprio em vez de usar o comparador padrão (pensado para um único valor), porque o payload DTE tem três coleções.

## Formato das três coleções

O Adapter DTE (`hub-ingest-adapter-dte.js`, não alterado) publica, quando válido:

```js
envelope.payload = {
  periodos: ["2025-07", ..., "2026-07"],   // array de strings "AAAA-MM", já ordenado pelo próprio Adapter
  indicadores: [ {...}, ... ],              // registros de indicador
  gerenciasOfensoras: [ {...}, ... ]        // registros de gerência ofensora
}
```

Cada registro de `indicadores`/`gerenciasOfensoras` já carrega um campo `lineage` (posição de origem na planilha), usado como chave canônica — nenhum campo novo foi inventado para este piloto.

## Chaves usadas

| Coleção | Chave |
|---|---|
| `indicadores` | `lineage.linhaOrigem` + `"\|"` + `lineage.colunaOrigem` |
| `gerenciasOfensoras` | `lineage.linhaOrigemCategorica` + `"\|"` + `lineage.linhaOrigemValor` + `"\|"` + `lineage.colunaOrigem` |
| `periodos` | não se aplica — é uma lista de strings, comparada por conjunto (ver abaixo) |

A comparação de `indicadores`/`gerenciasOfensoras` é **inteiramente por chave** (`Map`), nunca por posição no array — reordenar o array de origem não produz nenhuma diferença enquanto chave e campos forem iguais. Isso é O(n): uma indexação por lado, uma passada sobre a união de chaves.

Para `periodos`: o Adapter já entrega `Object.keys(...).sort()` — ordem ascendente lexicográfica sobre `"AAAA-MM"`, que corresponde à ordem cronológica. Essa ordem é um artefato determinístico do próprio código, não uma escolha humana a preservar; por isso o piloto reordena (`sort`) os dois lados antes de comparar por conjunto, em vez de comparar posição a posição. Um item exclusivo de um lado continua sendo reportado (`APENAS_LIVE`/`APENAS_SNAPSHOT`).

## Tratamento de duplicidades e chaves inválidas

Antes de comparar campo a campo, cada coleção é indexada separadamente em live e em snapshot:

- registro **sem** `lineage` → `CHAVE_AUSENTE`;
- `lineage` presente mas com componente ausente/`null` → `CHAVE_INCOMPLETA`;
- chave repetida dentro da mesma coleção/lado → `CHAVE_DUPLICADA` (registrada uma única vez por chave, não sobrescrita silenciosamente no `Map`).

Em qualquer um dos três casos: (a) vira uma diferença estrutural própria; (b) os registros envolvidos **nunca** entram na comparação campo-a-campo (alinhamento seria ambíguo); (c) a classificação geral **nunca** pode ser `EQUIVALENTE`; (d) o restante da coleção continua comparado normalmente.

## Classificações

Seis estados, exatamente:

| Estado | Significado |
|---|---|
| `EQUIVALENTE` | live carregou, Adapter executou, snapshot existe e é válido, hash válido, três coleções comparadas, zero diferenças, zero problemas de chave. |
| `DIVERGENTE` | ambas as fontes carregaram, mas há pelo menos uma diferença (de qualquer natureza, inclusive chave inválida/duplicada). |
| `LIVE_INDISPONIVEL` | falha na leitura da fonte live, na decodificação, ou o Adapter não produziu payload/coleções válidas. |
| `SNAPSHOT_INDISPONIVEL` | snapshot inexistente ou não localizado (`snapshot_ausente`, `erro_leitura`, ou falha equivalente do piloto). |
| `SNAPSHOT_INVALIDO` | snapshot encontrado, porém rejeitado (envelope/payload/hash/metadados/estrutura incompatíveis — inclui payload sem as três coleções do contrato DTE). |
| `ERRO_DE_COMPARACAO` | exceção durante a comparação, ou falha simultânea de ambas as fontes. |

## Naturezas de diferença

`APENAS_LIVE`, `APENAS_SNAPSHOT`, `CAMPO_AUSENTE_LIVE`, `CAMPO_AUSENTE_SNAPSHOT`, `VALOR_DIFERENTE`, `TIPO_DIFERENTE`, `CHAVE_AUSENTE`, `CHAVE_INCOMPLETA`, `CHAVE_DUPLICADA`, `ESTRUTURA_INVALIDA`.

Nenhuma coerção de tipo é feita: `"10"` (string) nunca é tratada como equivalente a `10` (número); `null`, ausência de campo e string vazia nunca são tratados como equivalentes entre si.

## Limite de renderização

`CONFIG.limiteDiferencasRenderizadas = 300` (constante local do arquivo `piloto-snapshot-dte.js`). A tabela de diferenças exibe no máximo essa quantidade da lista já filtrada; a contagem total real (`diferencas.length`) é sempre exibida sem truncamento, junto de um aviso quando a amostra exibida for menor que o total.

## Acesso

Somente por URL direta, após publicação no GitHub Pages:

```
https://urbanflowrio.github.io/COMLURB/engenharia-operacional/piloto-snapshot/
```

Sem link na Home, sem link no painel executivo de Engenharia/DTE, `robots: noindex, nofollow`.

## Limitações

- Volume da DTE (centenas de indicadores/gerências ofensoras) é maior que o do AR — a indexação por `Map` evita comparação quadrática, mas a renderização de amostra ainda é limitada por desempenho de navegador (ver acima).
- `hash` do snapshot é coerência declarada (ponteiro `latest.json` × arquivo), não recomputação criptográfica — mesma limitação documentada em `hub-snapshot-reader.js`.
- Este piloto não valida nada além do estágio pré-regras: não existe ainda `hub-rules-engenharia.js`/`hub-state-engenharia.js` a comparar.

## Avisos exibidos na interface

- "Este snapshot é uma cópia técnica para continuidade operacional e auditoria."
- "O snapshot não representa fechamento mensal oficial."
- "Esta página é um piloto técnico isolado e não integra o painel executivo."

## Rodando os testes

A partir da raiz do repositório:

```
node testes/testar-fase7c.js .
```

Não depende de `papaparse` nem de qualquer dependência nova — os testes injetam funções fake no lugar de `HUB.ingest.adapterDTE.carregarDTE` e usam os mesmos fixtures de `testes/fixtures/fase7a/` (par `latest.json`/snapshot já aprovado na Fase 7A) para os estados genéricos do `snapshotReader`, e fixtures inline no próprio arquivo de teste para o contrato de três coleções específico do DTE.

Para confirmar ausência de regressão, rode também as suítes das fases anteriores (ver `IMPLEMENTATION_STATUS.md` para a lista completa e as contagens).

## Validação humana pendente

A Fase 7C só poderá ser marcada como concluída após validação em navegador com dados reais:

1. abrir a URL direta acima já publicada no GitHub Pages;
2. confirmar que a classificação geral aparece em destaque e é uma das seis previstas;
3. conferir que os três avisos obrigatórios estão visíveis;
4. conferir a volumetria de `periodos`/`indicadores`/`gerenciasOfensoras` (live e snapshot);
5. conferir os metadados do snapshot (`capturedAt`, `referencePeriod`, idade, hash);
6. se houver divergências, testar os filtros por coleção/natureza/chave;
7. confirmar que a página não aparece na Home nem no painel executivo de Engenharia/DTE.
