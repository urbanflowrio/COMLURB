# Território Operacional

Painel territorial do HUB COMLURB para navegação pela estrutura administrativa, localização das unidades e visualização das áreas de Gerências DSU e da estrutura territorial DLU.

## Fontes canônicas

- `data/unidades_comlurb.csv`: cadastro geocodificado utilizado pelo painel.
- `../assets/geojson/GERENCIAS_DSU.geojson`: áreas das Gerências DSU.
- `../assets/geojson/DLU_Novos_Bairros_estrutura2025.geojson`: polígonos territoriais associados às Superintendências DLU.

O arquivo `unidades_comlurb (1).csv` é uma cópia antiga mantida por segurança. Ele não deve ser atualizado nem tratado como fonte oficial.

## Navegação

O painel apresenta três opções permanentes:

1. Unidades COMLURB;
2. Gerências DSU;
3. Bairros DLU.

Nos mapas DSU e DLU, o usuário pode abrir uma área e retornar às unidades correspondentes. O botão Home é fornecido por `assets/components/hub-layout.js`.

## Situação

Revisão técnica estrutural registrada em `REVISAO_TECNICA.md`. A validação visual no ambiente publicado e a data de referência do cadastro ainda precisam ser confirmadas.
