# V4.1 — Entrega funcional e isolamento de dados

Data: 14/10/2026. Escopo: seleção Diretoria → Superintendência/Coordenadoria → Gerência → AP → Bairro, com visão DLU e DSU e mapas independentes.

A versão funcional está no pacote **Piloto_Inteligencia_Territorial_V4_1.zip** entregue na conversa, contendo index.html, app.js, matriz-validada.json, dlu.geojson e siurb-consolidado.geojson. Este último foi fornecido pela usuária para análise e **não será publicado no GitHub** até confirmação de autorização de disponibilização pública.

**Esta branch contém o diagnóstico e os registros de reconciliação, não hospeda a V4.1 funcional.** O pacote deve ser testado localmente por HTTP, conforme seu README. A fonte SIURB não deve ser copiada para main, Pages ou assets públicos.

Regras: Toda gerência DLU cujo código se inicia por C pertence à LRC, sem restringir-se às siglas CG. Indicadores de Chamados 1746, Ouvidoria e IPL permanecem de gerência inteira quando AP/bairro são filtrados. DSU UCV, UGU e UCS recebem camadas de atuação mas não herdam métricas DLU. UGT/UDRN/UDRO/UDRS permanece sem vetor validado.

Pendente: homologação visual, compatibilização administrativa e geométrica das versões SIURB/DLU, geometrias UGT e autorização de publicação da fonte consolidada. Nenhuma mudança na main.
