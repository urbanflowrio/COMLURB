# Piloto técnico — Live × Snapshot (AR) · Fase 7B

## Finalidade

Validar, de forma isolada e sem qualquer conexão a painel de produção, a
equivalência estrutural entre:

- a saída **live** de `HUB.ingest.adapterAR.carregarAR({})` (mesmo Adapter
  usado por `ar/piloto/`, Fase 4); e
- o **snapshot** congelado do módulo AR, lido por `HUB.snapshotReader.lerAsync("ar", …)`
  (Fase 7A), publicado em `data/snapshots/ar/`.

A comparação ocorre **estritamente antes das regras de negócio**. Este piloto
não carrega `hub-rules-ar.js` nem `hub-state-ar.js`, não calcula status,
atingimento, tendência ou bonificação. Isso evita misturar "o dado mudou"
com "a regra reagiu ao dado", e evita aplicar o mês corrente a um snapshot
capturado em outro momento.

## Fluxo live

1. `HUB.ingest.adapterAR.carregarAR({})` é chamado **uma única vez**,
   buscando as três fontes reais do AR (`AR_2026`, `AR_MAPEAMENTO`,
   `AR_GERAL`) via rede.
2. `resolverLive()` valida se o envelope retornado tem `payload` não nulo
   **e** se `resultado.itens` é, de fato, um array (`Array.isArray`) —
   payload válido sozinho não é suficiente. Ausente, `null`, objeto ou
   string em `resultado.itens` viram `{ok:false, erro}`, nunca um "sucesso"
   disfarçado; array vazio continua sendo um resultado válido. Isso evita
   que uma comparação chegue a rodar sobre um valor que não é array, e
   evita erro tardio ao tentar ler `.length` na interface.
   Extrai `resultado.itens` sem modificação, quando válido.
3. Falha (rede, decodificação, ou payload nulo) vira `{ok:false, erro}` —
   nunca lança exceção para fora, nunca produz um array vazio disfarçado de
   sucesso.

## Fluxo snapshot

1. `HUB.snapshotReader.lerAsync("ar", {baseUrl, maxAgeHoras})` é chamado
   **uma única vez**.
2. `resolverSnapshot()` aceita os estados `snapshot_valido` **e** `stale`
   como sucesso — `stale` nunca é descartado nem convertido em erro, apenas
   sinalizado (aviso na interface). Extrai
   `resultado.snapshot.envelope.payload.linhas`, sem modificação.
3. Qualquer outro estado da enumeração fechada do `hub-snapshot-reader.js`
   (`snapshot_ausente`, `latest_invalido`, `snapshot_apontado_ausente`,
   `hash_divergente`, `modulo_divergente`, `versao_incompativel`,
   `schema_incompativel`, `contrato_invalido`, `erro_leitura`,
   `parametro_invalido`) vira `{ok:false, status, detalhe}`, repassado
   verbatim para a interface — sem reinterpretação, sem fallback para live.

## Comparação pré-regras

Live e snapshot chegam neste piloto no **mesmo formato canônico**: ambos são
a saída do mesmo Adapter (`hub-ingest-adapter-ar.js`), já que
`snapshot/lib/snapshot-ar.js` (Fase 6) gera o snapshot chamando exatamente
`HUB.ingest.adapterAR.carregarAR`. Por isso, nenhuma tradução de campo é
necessária entre os dois lados — a comparação é feita diretamente sobre os
arrays de linhas.

## Estratégia de chamada única

`HUB.dataSource.resolver("ar", "compare", {...})` recebe **providers finos**
(`providerFinoLive`, `providerFinoSnapshot`) que:

- **não** chamam o Adapter ou o `snapshotReader` de novo;
- apenas reexpõem o array já resolvido em `ESTADO.live`/`ESTADO.snapshot`
  (preenchido uma única vez por `executar()`);
- rejeitam a Promise quando a fonte correspondente falhou — nunca resolvem
  para `[]`, para não produzir uma divergência falsa de "array vazio" onde
  a causa real é indisponibilidade da fonte.

A interface (filtros de tipo, texto no path, exibição de tipos sem
ocorrência) opera inteiramente sobre `ESTADO` já carregado. Trocar um filtro
**nunca** dispara uma nova chamada ao Adapter, ao `snapshotReader` ou ao
`HUB.dataSource.resolver`.

## baseUrl portátil

```js
new URL("../../data/", document.baseURI).href
```

Resolvida a partir da URL real da página (`document.baseURI`), sem nenhum
domínio, usuário, organização ou nome de repositório fixo no código. Como
`ar/piloto-snapshot/` está duas pastas abaixo da raiz do repositório e
`data/` está uma pasta abaixo da raiz, `"../../data/"` funciona igual sob
GitHub Pages (`usuario.github.io/QUALQUER-NOME/`), servidor local, ou
qualquer fork — desde que a árvore de diretórios do repositório seja
preservada. A barra final de `data/` é preservada deliberadamente (o
`juntar()` de `hub-snapshot-reader.js` tolera barra final ou não, mas o
formato canônico da URL fica mais legível com ela).

Precisão sobre URLs absolutas nesta entrega: não existe URL absoluta
hardcoded para dados (`latest.json`/`snapshots/`), nem URL fixa da
COMLURB, nem de `urbanflowrio`, nem qualquer domínio, organização, usuário
ou nome de repositório fixado para resolver snapshots. A única URL
absoluta presente em todo o piloto é a dependência externa do **CDN do
PapaParse** em `ar/piloto-snapshot/index.html` — a mesma biblioteca já
usada por `ar/piloto/index.html` e `ar/index.html`, uma dependência
funcional de terceiros (necessária para `hub-ingest-decoder.js` decodificar
CSV), não um acoplamento a dados ou a um host específico do projeto.
`piloto-snapshot.js` não contém nenhuma URL absoluta, nem mesmo essa
exceção.

## Significado das três classificações

- **equivalente** — live e snapshot disponíveis, nenhuma diferença
  estrutural.
- **divergente** — live e snapshot disponíveis, há diferenças (contadas e
  listadas por tipo/path). Acompanhado do aviso: *"Diferenças podem
  decorrer de atualização da fonte live após a captura do snapshot."* —
  nenhuma causa específica é atribuída automaticamente.
- **indisponível** — uma ou ambas as fontes falharam. A interface identifica
  qual (`live`, `snapshot` ou `ambas`).

## Significado de stale

`stale` **não** é uma quarta classificação. É um aviso sobreposto,
exibido junto de `equivalente` ou `divergente` quando o snapshot passou de
`maxAgeHoras` (se configurado). Continua permitindo a comparação
normalmente — nunca bloqueia, nunca aciona fallback para live.

## Configuração

```js
var CONFIG = { maxAgeHoras: null };
```

Local a este arquivo, não é escrita em nenhuma configuração global
(`HUB.config` permanece intocado). `null` = sem avaliação de idade (padrão
de demonstração). Um número não negativo ativa a avaliação. Valores
inválidos (negativos, não numéricos) não são revalidados aqui — o próprio
`hub-snapshot-reader.js` já rejeita com o estado `parametro_invalido`, que
aparece na interface como fonte "snapshot" indisponível, com o motivo
visível. Nenhum fallback é acionado.

## Limitações

- Só compara o módulo AR.
- Só compara pré-regras — não valida se, depois de `hub-rules-ar`/
  `hub-state-ar`, o status/atingimento/tendência calculados a partir do
  live e do snapshot também coincidem. Isso fica para uma fase futura,
  mediante nova aprovação explícita.
- Herda as limitações já documentadas em `hub-snapshot-reader.js`
  (verificação de hash é de coerência declarada, não criptográfica;
  validação de path é estrutural, não uma biblioteca completa de parsing de
  URL).
- Divergência de ordem em arrays de objetos (não de primitivos) é reportada
  como `valor_divergente`/`tipo_divergente` por índice, não como
  `ordem_array_divergente` — mesma limitação documentada em
  `hub-data-source.js`, não alterada aqui.

## Como abrir localmente

Sirva a raiz do repositório com qualquer servidor HTTP estático (por
exemplo, `python3 -m http.server` a partir da raiz) e acesse
`/ar/piloto-snapshot/` no navegador. Abrir o arquivo diretamente por
`file://` não funciona, porque o `fetch` de `latest.json`/CSV exige HTTP.

## Como executar os testes

A partir da raiz do repositório:

```
node testes/testar-fase7b.js .
```

Suíte Node pura, sem servidor, sem rede real — todo `fetch` é mockado, e o
Adapter é exercitado com fixtures locais (mesmo padrão de
`testes/testar-fase4.js`/`testes/testar-fase7a.js`).

## Rollback

Trivial: como nenhum arquivo existente é alterado ou referenciado por esta
pasta (nem `ar/index.html`, nem `ar/piloto/`, nem a home), remover a pasta
`ar/piloto-snapshot/` (ou simplesmente não publicá-la) não deixa nada
pendente no caminho de produção nem no piloto aprovado da Fase 4.

## Aviso

Este piloto é técnico e não substitui, promove nem representa o fechamento
mensal oficial do Acordo de Resultados. A leitura de qualquer resultado
aqui exibido — inclusive "equivalente" — não é uma aprovação de produto;
validação humana em navegador, com dados reais, permanece pendente.
