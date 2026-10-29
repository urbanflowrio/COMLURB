# Gestão Estratégica de Pessoas V8

## Movimentação do quadro (29/10/2026)

Nova seção independente da fotografia cadastral. Fonte: BASE SIPE de 26/10/2026,
Listagem de Desligados recebida em 29/10/2026 (última saída registrada: 23/10/2026)
e Cadastro consolidado de setores. Série observada de 2018 a 2026. Abrange todos
os vínculos presentes nas fontes, inclusive estágios e cargos de confiança.

Entradas combinam `dtexerc` da SIPE e `DTEXERC` dos desligados. Deduplicação por
matrícula e data de exercício preserva diferentes vínculos da mesma matrícula.
Saídas usam `DTVAC`; `FORMAVAC` mantém a classificação original. Nenhuma data
posterior à referência SIPE é incorporada. O saldo observado não reconcilia o
estoque: duas matrículas da listagem ainda constam na SIPE. A hierarquia é a do
cadastro atual, não uma reconstrução histórica; lotações de admissão não estão
disponíveis para quem permanece. Códigos sem correspondência ficam separados.

2026: 667 entradas identificadas, 1.629 saídas registradas, saldo observado -962.
Contagens positivas menores que 10 e complementos são suprimidos. Descendentes
de totais protegidos também são ocultados. Saldo exige os dois valores visíveis.
Não há nomes, matrículas, CPFs, datas individuais ou microdados nos arquivos JS.

Para atualizar, ler as três fontes de forma autenticada, obter a referência da
SIPE e produzir JSONs privados nos formatos documentados em `gerar-movimentacao.py`.
Executar o gerador passando caminhos privados fora do checkout e a nova referência.
Reconciliar totais, verificar sobreposições e cobertura, testar o navegador e
publicar somente os agregados e o código. A rotina de monitoramento anterior
não executa este novo gerador. A lista de desligados também precisa ser atualizada.

As notas abaixo documentam versões anteriores do módulo.

Fonte: extração funcional em 21/10/2026. Hierarquia: Diretoria → Superintendência → Lotação (código) e NOMESETOR (nome).

18.519 registros únicos; 1.712 classificados como afastados; 21 registros duplicados não contabilizados.

Privacidade: nenhuma linha individual, nome de pessoa, matrícula, CPF ou motivo clínico embarcado. Só são publicados grupos com efetivo >=30, afastados >=10, demais >=10, com supressão complementar de grupos reduzidos e sem drill em categorias agregadas.

Indicador é taxa cadastral, não absenteísmo oficial. A hierarquia vem do cadastro informado e deve ser homologada institucionalmente.


## V9 – complementação executiva (26/10/2026)
Incluídas leituras calculadas diretamente do agregado V8, sem dados pessoais: exposição proporcional, concentração absoluta, desvios da média corporativa e faixa etária 48+. A fonte atual não possui contagem de GARI TEMPORARIO; o painel não estima essa informação. Novo arquivo insights-estrategicos.js. Não homologado para publicação sem conferência visual e institucional.
