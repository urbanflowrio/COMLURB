# pessoas — HUB COMLURB

**Status:** Temporariamente indisponível — em revisão por LGPD.
**Responsável técnico:** Greicy Moreira

## Situação atual

A versão anterior deste módulo carregava, diretamente no navegador, as
bases individualizadas R54 (dados funcionais) e LAUDOS (dados de saúde),
incluindo nome, matrícula, idade, bairro de residência, afastamento e
tipos de laudo médico por servidor. A interface permitia busca nominal e
exportação em massa desses campos em Excel.

Isso foi identificado como risco crítico de LGPD e foi desativado nesta
versão. `index.html` não carrega mais nenhuma planilha individualizada,
não contém nenhuma URL de fonte de dado pessoal e não mantém nenhum dado
de servidor em memória no navegador. `data.js`, `screens.js` e `app.js`
foram substituídos por stubs sem lógica e sem dado algum, mantidos apenas
para não quebrar referências antigas em cache.

## Fontes de dados

Nenhuma. O módulo não deve voltar a carregar R54 ou LAUDOS por inteiro no
cliente.

## Requisitos para republicação

1. Fonte de dados já agregada e anonimizada (não a planilha individual
   filtrada no cliente) — a agregação deve ocorrer antes de chegar ao
   navegador.
2. Piso mínimo por grupo (quantidade mínima de pessoas por recorte, por
   exemplo bairro, setor ou função) para impedir reidentificação em
   recortes pequenos.
3. Nenhum campo individual (nome, matrícula, idade, bairro de residência,
   afastamento, laudo) em nenhum objeto JavaScript servido ao navegador,
   mesmo que não exibido na tela.
4. Nenhuma URL de planilha individualizada exposta no código-fonte.
5. Nenhuma busca nominal nem exportação por pessoa.

Enquanto esses requisitos não estiverem atendidos por uma fonte real, o
módulo deve permanecer na versão institucional de indisponibilidade
temporária.
