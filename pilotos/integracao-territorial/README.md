# Piloto de Integração Territorial — V1 (ambiente isolado)

**Status:** diagnóstico de compatibilidade e protótipo não homologado. **Branch:** `piloto/integracao-territorial-v1`. **Base:** commit `343ed916a1cc979ea22387728e0e5fc1e46303ee`. **Data:** 14/10/2026.

## Proteção da produção

Este piloto não modifica a Home, o Território Operacional, os cubos de Chamados/Ouvidoria, o IPL nem qualquer fonte oficial. Não deve ser incorporado à `main` até homologação específica. O GitHub Pages serve a `main` e não publica automaticamente esta branch.

## Descobertas verificadas

1. O catálogo `Bases_SIURB.xlsx` aponta as camadas **Gerências Departamento DLU**, item ArcGIS `3f43b00332934c61a52f820d1c0e4d03`, e **Censo 2022**, item `cf4676b4bcb7468f98b7b09020999456`. São referências catalogadas, **não dados obtidos nem acesso confirmado**; as páginas do SIURB não responderam por acesso público na verificação desta sessão.
2. O GeoJSON já publicado `assets/geojson/DLU_Novos_Bairros_estrutura2025.geojson` contém **215 feições**, com campo `first_superdlu`; **178 registros sem código**, 37 com código (LRB=5, LRC=8, LRN=8, LRO=7, LRS=9). Esses cinco códigos **não equivalem às 32 gerências**. Não é válido agregar chamados, ouvidorias, população ou IPL nas 32 gerências usando apenas esse arquivo.
3. A malha preliminar IBGE 2022 fornecida tem geometria de setores censitários, mas seus campos `v0001` a `v0007` precisam de dicionário antes de interpretação. O arquivo `33.csv` de coordenadas não declara uma coluna específica de número de domicílios por ponto.
4. A metodologia entregue registra 144 setores sem pontos associados, dos quais 77 com população e/ou domicílios; nesses setores foram produzidos pontos sintéticos. Essa regra e as fórmulas do PDF precisam de revisão/reprodução antes de uso como denominador estatístico.

## Próximo ponto de controle (antes de qualquer integração de resultados)

- Obter da administração SIURB um GeoJSON ou FeatureServer **autorizado e acessível** com as geometrias das 32 gerências DLU, identificador oficial, área de vigência, versão e data de corte.
- Conferir os 32 códigos contra chaves reais dos cubos de 1746, Ouvidoria e IPL; listar ausências e duplicidades.
- Obter dicionário e totas oficiais da fonte demográfica, conferir reconciliação setorial e por gerência; não calcular taxas por habitantes sem validação.
- Implantar interface com cascata gerência → bairro → setor apenas quando os cruzamentos forem demonstravelmente corretos.
- Respeitar separação entre competências: censo 2022 versus 1746/ouvidoria 2026 e indicadores IPL; exibir datas e origem ao lado dos valores.
- Não incorporar dados pessoais, endereços ponto a ponto nem serviços restritos em qualquer artefato público.

## Protocolo de aceite

Conferir geometria, completude de todas as 32 gerências, unicidade das chaves, reconciliação dos totais (município → gerência → bairro), ausência de perdas nas interseções, competência e fonte, drill-down funcional, responsividade, ausência de dados sensíveis e regressão do Território Operacional original. **Não homologado nesta etapa.**
