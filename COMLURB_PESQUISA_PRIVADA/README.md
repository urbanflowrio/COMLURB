# COMLURB · Pesquisa Privada — Laboratório Territorial

**Status:** camada experimental, privada e independente do HUB institucional.  
**Finalidade:** pesquisa, estruturação metodológica e desenvolvimento de um futuro modelo multicritério de apoio à decisão territorial.

## Princípio central
Esta pasta **não altera nenhum arquivo do HUB COMLURB**. Ela utiliza cópias controladas (snapshots) das bases necessárias para 1746, Ouvidoria e território. O IPL continua sendo lido da mesma fonte pública usada no módulo oficial, preservando a regra de cálculo territorial observada no HUB.

## O que existe aqui
- `app/` — aplicação experimental da matriz integrada por bairro.
- `data/source_snapshots/` — cópias congeladas das bases usadas na V1.
- `docs/` — documentação científica, de governança e evolução do projeto.
- `exports/` — destino recomendado para CSVs e resultados exportados.
- `validation/` — evidências, testes e resultados de validação futuros.
- `MANIFEST_SHA256.txt` — hashes dos arquivos-base para rastreabilidade.

## Como abrir
Por usar `fetch()` para carregar o GeoJSON, abra a pasta com um servidor HTTP local. Exemplos:

### Python
```bash
cd COMLURB_PESQUISA_PRIVADA
python -m http.server 8000
```
Depois acesse:
`http://localhost:8000/app/`

### VS Code
Também pode usar a extensão Live Server apontando para esta pasta.

> Abrir `index.html` diretamente por `file://` pode bloquear o carregamento do GeoJSON em alguns navegadores.

## Fontes da V1
- Chamados 1746: snapshot de `chamados_cube.js` proveniente do HUB analisado.
- Ouvidoria: snapshot de `ouvidoria_cube.js` proveniente do HUB analisado.
- Território: snapshot de `DLU_Novos_Bairros_estrutura2025.geojson` proveniente do HUB analisado.
- IPL: planilha pública consumida pelo módulo IPL, acessada em tempo real pela aplicação experimental.

## O que a V1 faz
Integra por bairro:
- AP;
- gerência DLU;
- IPL territorial calculado;
- quantidade de avaliações IPL;
- trechos abaixo de 80;
- reincidências;
- Chamados 1746 acumulados;
- variação YoY dos Chamados;
- Ouvidorias acumuladas;
- variação YoY das Ouvidorias;
- completude dos dados.

## O que a V1 deliberadamente NÃO faz
- não cria ranking institucional;
- não define pesos arbitrários;
- não substitui indicador oficial;
- não recalcula a nota oficial SARC;
- não altera o HUB;
- não publica resultados automaticamente;
- não usa a matriz para responsabilização de equipes ou territórios.

## Próxima evolução científica
A próxima fase é transformar sinais brutos em critérios científicos: definir direção de preferência, normalização, denominadores, pesos, método multicritério, análise de sensibilidade e validação histórica/especialistas.

Leia primeiro:
1. `docs/01_METODOLOGIA_CIENTIFICA.md`
2. `docs/02_DICIONARIO_DE_DADOS.md`
3. `docs/03_GOVERNANCA_E_SEPARACAO_DO_HUB.md`
4. `docs/04_MODELO_DE_DECISAO_ROADMAP.md`
5. `docs/05_PLANO_DE_VALIDACAO.md`
6. `docs/06_ENQUADRAMENTO_PEP.md`
