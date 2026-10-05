# LAB — Pesquisa Privada / Apoio à Decisão

Camada experimental e não oficial criada para pesquisa aplicada sobre apoio à decisão territorial na gestão da limpeza urbana.

## Acesso

Quando a pasta `lab` estiver na raiz do mesmo repositório do HUB publicado no GitHub Pages, o acesso direto será:

`https://urbanflowrio.github.io/COMLURB/lab/`

O arquivo de entrada é `lab/index.html`. Não é necessário criar outro domínio, outra Home ou outro projeto GitHub Pages.

## Regra de separação

Esta pasta é independente do HUB institucional:

- não altera a Home do HUB;
- não altera menus, rotas ou scripts existentes;
- não substitui indicadores oficiais;
- não deve ser usada como instrumento institucional de responsabilização;
- não deve ser apresentada como metodologia homologada;
- pode ser modificada livremente para experimentação científica.

## Conteúdo

- `index.html` — interface do Laboratório Territorial.
- `app.js` — construção da matriz integrada por bairro.
- `data/source_snapshots/` — snapshots próprios de 1746, Ouvidoria e território.
- `docs/` — documentação metodológica e científica.
- `validation/` — área destinada às evidências de validação.
- `exports/` — área destinada a resultados exportados.
- `CHANGELOG.md` — histórico de versões.
- `MANIFEST_SHA256.txt` — hashes dos arquivos para rastreabilidade.

## Fonte IPL

O IPL continua sendo lido da fonte publicada utilizada pelo módulo correspondente, preservando a lógica territorial já adotada, inclusive a ponderação por classe de logradouro A/B/C (90/6/4). A camada LAB não redefine a nota oficial SARC.

## Estado científico atual

A V1 integra os sinais por bairro, mas deliberadamente ainda não cria uma pontuação multicritério final. As próximas etapas são:

1. qualificação e seleção dos critérios;
2. análise de denominadores e vieses territoriais;
3. normalização;
4. elicitação/justificativa de pesos;
5. escolha e aplicação do método multicritério;
6. análise de sensibilidade;
7. validação histórica e com especialistas.

## Uso recomendado

Trate esta pasta como um laboratório pessoal. A publicação em um GitHub Pages público torna o endereço tecnicamente acessível a quem souber a URL, mesmo que ele não esteja linkado na Home ou no About.
