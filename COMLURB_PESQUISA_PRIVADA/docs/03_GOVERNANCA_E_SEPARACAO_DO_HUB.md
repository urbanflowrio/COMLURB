# 03 · Governança e separação do HUB

## Regra estrutural
Esta pasta é autônoma e privada. Nenhum arquivo do HUB deve ser editado para suportar esta pesquisa.

## Proibições
- Não adicionar link desta camada na Home institucional sem decisão explícita futura.
- Não escrever arquivos dentro do diretório oficial do HUB.
- Não substituir cubos oficiais.
- Não renomear indicadores institucionais.
- Não publicar ranking experimental como resultado oficial.
- Não utilizar dados experimentais para avaliação funcional de pessoas/equipes.

## Snapshots
As bases locais em `data/source_snapshots` são cópias de referência para reproduzir a V1.

Quando uma nova competência for incorporada:
1. manter a versão anterior;
2. registrar a nova origem e competência;
3. recalcular hashes;
4. atualizar o changelog;
5. executar testes de reconciliação.

## IPL
O IPL é atualmente consumido da fonte pública usada pelo módulo do HUB. Isso deve ser registrado a cada análise, pois a fonte pode mudar após a execução.

Para pesquisas retrospectivas formais, recomenda-se congelar também snapshots do IPL por competência.

## Nomenclatura
Todos os produtos desta pasta devem conter pelo menos uma das expressões:
- Experimental;
- Pesquisa;
- Não oficial.
