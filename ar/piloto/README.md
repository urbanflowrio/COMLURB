# Piloto AR

Ambiente técnico de validação da UrbanFlow Core v1 — Fase 4.

Este diretório contém exclusivamente os arquivos de validação da Fase 4.
Não faz parte da navegação institucional do HUB COMLURB.

Objetivo:
- Comparar legado × nova arquitetura.
- Validar a cadeia Locator → Reader → Decoder → Adapter → Rules → State.
- Executar testes antes de qualquer migração definitiva do render.

## Arquivos desta pasta

- `index.html` — página do relatório. Abrir direto:
  `https://urbanflowrio.github.io/COMLURB/ar/piloto/`
- `harness.js` — motor de comparação (diff estruturado legado × novo).
- `legado-referencia.js` — cópia fiel, sem DOM, das funções de cálculo do
  legado real (`ar/index.html`), usada só para o harness comparar. **Não é
  o legado em produção** — `ar/index.html` continua sendo o painel real,
  inalterado.

## Correção nesta entrega

Havia uma cópia de `harness.js` publicada no caminho errado
(`ar/piloto/piloto/harness.js`, uma pasta aninhada por engano). O arquivo
correto é `ar/piloto/harness.js` (raiz desta pasta). A pasta
`ar/piloto/piloto/` pode ser apagada ao publicar esta entrega — ela não é
usada por `index.html` e é só uma sobra do envio anterior.

## Dependências compartilhadas

`index.html` carrega, além dos três arquivos acima: `hub-core.js` e
`hub-rules.js` (já existentes em `main`, inalterados) e **sete arquivos
novos** em `assets/components/` — `hub-sources.js`, `hub-ingest-model.js`,
`hub-ingest-reader.js`, `hub-ingest-decoder.js`, `hub-ingest-adapter-ar.js`,
`hub-rules-ar.js`, `hub-state-ar.js`. Nenhum deles depende de
`hub-utils.js` (a versão publicada em `main` ainda é anterior à "Fase 2" e
não tem a API que a Fase 4 usaria — por isso os arquivos novos trazem sua
própria conversão numérica, sem tocar em nenhum arquivo compartilhado
existente).

## Fontes: quatro registradas, três operacionais

`hub-sources.js` registra quatro fontes do AR (`AR_GERAL`, `AR_2026`,
`AR_MAPEAMENTO`, `AR_GOVERNANCA`), pelo mesmo motivo que `ar-config.js` já
listava as quatro: completude do contrato. **Só três participam desta
comparação** — `AR_GERAL`, `AR_2026`, `AR_MAPEAMENTO` — porque são as
mesmas três que o legado (`ar/index.html`) já lê hoje. `AR_GOVERNANCA` fica
registrada, sem uso forçado só para fechar a contagem em quatro; nenhum
código deste piloto ou do Adapter AR a busca ou lê.

Ver `docs/architecture/IMPLEMENTATION_STATUS.md` para o relatório completo
da Fase 4 (implementação, achados de auditoria, testes, pendências).
