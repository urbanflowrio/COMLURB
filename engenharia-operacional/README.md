# Engenharia e Operações

Painel executivo do HUB COMLURB para acompanhamento de indicadores operacionais do DTE, coleta seletiva, frota, produtividade, clima e indicadores complementares.

## Arquivos do módulo

- `index.html`: interface, regras de leitura, filtros, gráficos e detalhamentos.
- `fleet-snapshot.js`: contingência local das planilhas de frota. Não é a origem preferencial quando a fonte publicada está disponível.
- `REVISAO_TECNICA.md`: escopo, verificações, limites e pendências da revisão vigente.
- `piloto/` e `piloto-snapshot/`: artefatos técnicos que não integram o menu executivo.

## Regras vigentes

- A janela temporal padrão contém até 13 competências, encerrando na última competência válida.
- Ausência ou conteúdo inválido deve ser apresentado como informação indisponível, nunca convertido automaticamente em zero.
- O snapshot de frota contém uma codificação excepcional: `21/01/2026` representa janeiro de 2021 e `26/07/2026` representa julho de 2026.
- O indicador de Poda Mecanizada não deve ser exibido enquanto a série oficial de manejos realizados não estiver disponível.
- O botão Home é inserido por `assets/components/hub-layout.js` e aponta para `../index.html`.

## Publicação

Preservar os caminhos do módulo. Antes da homologação final, validar as fontes publicadas, os totais, filtros, detalhamentos, desktop e celular conforme `REVISAO_TECNICA.md`.
