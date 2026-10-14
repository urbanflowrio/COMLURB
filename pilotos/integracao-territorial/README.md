# Piloto de Inteligência Territorial

Ambiente isolado: `piloto/integracao-territorial-v1`. **Não homologado.**

Em 14/10/2026 validou-se que 32 códigos do GeoJSON DLU, corretamente identificados pelo atributo `gerdlu`, correspondem aos códigos nos cubos de Chamados 1746, Ouvidoria e na Nota Histórico IPL de agosto/2026. Ver `MATRIZ_COMPATIBILIDADE.md` para detalhes, totais e ressalvas.

**Correção importante:** o diagnóstico anterior confundiu o atributo `first_superdlu` com `gerdlu`. Existem apenas cinco feições sem `gerdlu`, e não 178.

Próximo passo: validar geometrias e versão da camada SIURB, cinco feições sem gerência e relacionamento gerência/bairro antes de implementar mapa e indicadores demográficos. A produção permanece intacta.