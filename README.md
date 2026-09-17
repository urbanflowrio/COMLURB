# IPL · Índice Padrão de Limpeza — HUB COMLURB

**Status:** ativo no portal principal  
**Responsável técnico:** Greicy Moreira

## Implementação ativa
A versão publicada do módulo está em `index.html`. O arquivo `app.js` é legado,
não é carregado pela página e foi mantido apenas para preservar a estrutura
histórica do diretório.

## Leituras do painel
O módulo separa duas camadas:

1. **Resultado oficial SARC** — referência institucional usada no painel executivo.
2. **Diagnóstico territorial calculado pelo HUB** — nota calculada a partir da base
   de avaliações de trecho para análise por bairro, logradouro, reincidência e itens NOK.

A ordenação de **prioridade territorial** é uma ferramenta analítica do HUB e não
deve ser interpretada como indicador oficial. Ela combina distância da meta,
reincidência e volume de avaliações.

## Metodologia territorial preservada
- Lixo Branco: faixas 100 / 80 / 50 / 20 / 0.
- Coleta domiciliar: faixas 100 / 80 / 40 / 20.
- Itens binários: OK / NOK / N/A.
- Pesos de itens N/A são redistribuídos igualmente entre os itens válidos.
- Bens inservíveis, entulho, material de obra e pneus compõem um único item de 6%.
- Meta de referência utilizada na interface: 80%.

## Fontes
As URLs de produção estão definidas no início do script de `index.html`:
- base de avaliação dos trechos;
- SARC, aba geral;
- GeoJSON de bairros;
- coordenadas auxiliares de bairros.

O painel não exibe uma data de atualização inventada. A competência é apresentada
com base no mês selecionado e nas competências efetivamente disponíveis nos dados.
