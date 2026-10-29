"""Gerador dos agregados públicos do módulo Gestão Estratégica de Pessoas (HUB COMLURB).

Uso:
    python gerar_dados_pessoas.py <planilha.xlsx> [saida.js] --data-referencia AAAA-MM-DD [--totais arquivo.json | --rascunho]

Lê a extração funcional (aba "Pessoas"), aplica os critérios conferidos na análise de
21/10/2026 e grava somente contagens agregadas com proteção estatística em
`dados-pessoas.js` (window.PESSOAS_DADOS). Nenhum nome, registro, CPF, data individual,
endereço, documento, raça/cor, deficiência, sexo ou nível salarial é exportado.

Regras de proteção (documento "Análise estratégica da base de Pessoas"):
  * situação cadastral (afastamento, natureza, duração, restrição, aposentadoria INSS)
    só é publicada em grupos com 30+ pessoas, com numerador e complemento >= 10 (zero é publicável);
  * supressão complementar: em toda soma publicada (partes de um total, filhos de uma
    unidade) nunca fica exatamente uma célula suprimida;
  * proteção por programação linear: combinando todas as somas e igualdades entre tabelas,
    nenhum valor protegido pode ser deduzido nem ficar num intervalo com menos de 5 valores (salvo grupo pequeno);
  * contagens suprimidas aparecem como traço, inclusive quando a supressão é complementar;
  * unidades com menos de 30 pessoas são agrupadas em "Demais unidades";
  * a visão por origem (Setor Anterior da GGQ02) só é publicada no nível de diretoria.
O script termina com uma autoverificação: totais de referência e integridade da supressão.
"""
import json
import argparse
import os
import re
import sys
from collections import defaultdict
from datetime import datetime

import numpy as np
import pandas as pd

parser = argparse.ArgumentParser(description="Gera agregados de uma extração funcional")
parser.add_argument("planilha")
parser.add_argument("saida", nargs="?", default="dados-pessoas.js")
parser.add_argument("--data-referencia", required=True, help="Data da extração, no formato AAAA-MM-DD")
parser.add_argument("--totais", help="JSON com os totais conferidos de forma independente para esta data (padrão: totais-AAAA-MM-DD.json ao lado do script)")
parser.add_argument("--rascunho", action="store_true", help="Gera sem totais conferidos; a página exibe aviso de dados em conferência")
parser.add_argument("--publicado-anterior", help="JSON local com contagens de afastados já publicadas por sigla")
parser.add_argument("--desligados", required=True, help="Listagem privada de desligados; saídas até a referência prevalecem sobre a SIPE")
args = parser.parse_args()
ARQ, SAIDA = args.planilha, args.saida
REF = pd.Timestamp(args.data_referencia)
_arq_totais = args.totais or os.path.join(os.path.dirname(os.path.abspath(__file__)), f"totais-{REF:%Y-%m-%d}.json")
if os.path.exists(_arq_totais):
    TOTAIS = json.load(open(_arq_totais, encoding="utf-8"))
    if TOTAIS.get("data_referencia") != REF.strftime("%Y-%m-%d"):
        sys.exit(f"ERRO: {_arq_totais} é de {TOTAIS.get('data_referencia')}, não de {REF:%Y-%m-%d}")
    TOTAIS = TOTAIS["totais"]
    STATUS, FONTE_TOTAIS = "conferido", os.path.basename(_arq_totais)
elif args.rascunho:
    TOTAIS, STATUS, FONTE_TOTAIS = None, "rascunho", None
    print("AVISO: gerando sem totais conferidos (--rascunho). A página exibirá 'dados em conferência'.")
else:
    sys.exit(f"ERRO: não há totais conferidos para {REF:%Y-%m-%d} ({_arq_totais}).\n"
             "Rode conferir_pessoas.py, confira os totais de forma independente, grave o arquivo de totais e gere de novo.\n"
             "Para uma prévia interna, use --rascunho.")
MIN_GRUPO, MIN_CEL = 30, 10

# ---------------------------------------------------------------------------
# 1. Leitura e critérios (idênticos ao conferir_pessoas.py)
# ---------------------------------------------------------------------------
xls = pd.ExcelFile(ARQ)
if len(xls.sheet_names) != 1 or xls.sheet_names[0] not in ("Pessoas", "Página1"):
    sys.exit(f"ERRO: a planilha deve ter uma única aba 'Pessoas' ou 'Página1'; encontradas: {xls.sheet_names}")
raw = pd.read_excel(xls, sheet_name=xls.sheet_names[0], dtype=str)
desligados = pd.read_excel(args.desligados, dtype=str)
if not {'NUMFUNC', 'DTVAC'}.issubset(desligados.columns):
    sys.exit('ERRO: listagem de desligados sem NUMFUNC/DTVAC')
datas_saida = pd.to_datetime(desligados['DTVAC'], errors='coerce', dayfirst=True, format='mixed')
if datas_saida.isna().any():
    sys.exit('ERRO: data inválida na listagem de desligados')
def normalizar_registro(serie):
    return serie.astype(str).str.strip().str.replace(r'\.0$', '', regex=True)
saidas_validas = desligados.loc[datas_saida <= REF].copy()
saidas_validas['_registro'] = normalizar_registro(saidas_validas['NUMFUNC'])
saidas_validas['_saida'] = datas_saida.loc[saidas_validas.index]
ultima_saida = saidas_validas.groupby('_registro')['_saida'].max()
saida_registro = normalizar_registro(raw['Registro']).map(ultima_saida)
inicio_registro = pd.to_datetime(raw['dtexerc'], errors='coerce', dayfirst=True, format='mixed')
mask_desligados = saida_registro.notna() & (inicio_registro <= saida_registro)
total_desconsiderados = int(mask_desligados.sum())
raw = raw.loc[~mask_desligados].copy()
print(f'Conciliação: {total_desconsiderados} registros desligados desconsiderados da SIPE.')
# Exportações do Google Sheets podem armazenar datas como objetos Excel, que
# pandas converte para ISO mesmo com dtype=str. Preserve textos originais e
# normalize apenas datas ISO válidas, inclusive na coluna de validade da CNH.
for coluna_data in ("nascimento", "dtexerc", "validcnh"):
    if coluna_data in raw:
        valor = raw[coluna_data]
        iso = valor.str.fullmatch(r"\d{4}-\d{2}-\d{2}(?: 00:00:00)?", na=False)
        data = pd.to_datetime(valor.where(iso), errors="coerce")
        mask = iso & data.notna()
        raw.loc[mask, coluna_data] = data.loc[mask].dt.strftime("%d/%m/%Y")
# Espaços repetidos variam na exportação do SIPE sem alterar o código.
if "Tipo Afastamento" in raw:
    raw["Tipo Afastamento"] = raw["Tipo Afastamento"].str.replace(r"\s+", " ", regex=True).str.strip()


def validar_extracao(raw, ref):
    """Validações obrigatórias para QUALQUER competência, antes de gerar. Não usam os totais de outubro."""
    erros, avisos = [], []
    obrig = ["Registro", "Lotação", "NOMESETOR", "paisetor", "Diretoria", "Superintendência", "Setor Anterior", "Função Cargo",
             "Função EC", "regimejur", "Sit_emp_casa", "Situação", "Sit_afastados", "Sit_restricao", "Sit_ferias", "Tipo Afastamento",
             "dias_afast", "Sit_Aposentadoria", "Idade", "nascimento", "Faixa Etária", "Faixa Tempo de Casa", "dtexerc", "Jornada",
             "jornada_entrada", "STATUS_FERIAS", "percinsal", "catcnh", "validcnh", "centro_custo"]
    falt = [c for c in obrig if c not in raw.columns]
    if falt:
        return [f"colunas ausentes: {falt}"], avisos
    # a data informada precisa ser a data da extração: Idade da base x nascimento na data informada
    nasc = pd.to_datetime(raw["nascimento"], format="%d/%m/%Y", errors="coerce")
    # O sistema de origem calcula Idade como dias/365; tolerância de 3 dias entre a data informada e a da extração
    dif = abs(((ref - nasc).dt.days / 365 - pd.to_numeric(raw["Idade"], errors="coerce")).median())
    if not dif <= 3 / 365:
        erros.append(f"--data-referencia {ref.date()} não corresponde à extração: Idade da base indica cerca de {dif * 365:.0f} dias de diferença")
    adm_ = pd.to_datetime(raw["dtexerc"], format="%d/%m/%Y", errors="coerce")
    if adm_.max() > ref:
        erros.append(f"há admissões posteriores à data de referência ({adm_.max().date()})")
    if adm_.isna().any() or nasc.isna().any():
        erros.append("datas de exercício ou nascimento fora do formato dd/mm/aaaa")
    # duplicidades só podem diferir nos campos de afastamento
    dup = raw[raw["Registro"].duplicated(keep=False)]
    cols = [c for c in raw.columns if c not in ("id", "Tipo Afastamento", "dias_afast", "_dias")]
    if len(dup) and (dup.groupby("Registro")[cols].nunique(dropna=False) > 1).any().any():
        erros.append("registros duplicados diferem em campos além do afastamento: definir critério antes de gerar")
    # chaves de estrutura
    for alvo in ["Diretoria", "paisetor", "NOMESETOR", "centro_custo"]:
        k = int((raw.groupby("Lotação")[alvo].nunique() > 1).sum())
        if k:
            erros.append(f"{k} lotações com mais de um valor de {alvo}")
    # domínios conhecidos (um valor novo mudaria a classificação sem aviso)
    dom = {"Situação": {"Ativo", "Restrição", "Afastado", "Férias"}, "Sit_afastados": {"ATIVO", "AFASTADO"}, "Sit_restricao": {"-", "R"},
           "Sit_ferias": {"ATIVO", "FÉRIAS"}, "regimejur": {"CLT", "TEMPO DETERMINADO", "ESTATUTO"},
           "Sit_Aposentadoria": {"-", "APOSENTADO INSS"},
           "Sit_emp_casa": {"Empregado da casa", "Empregado da casa com Emprego de Confiança", "Empregado com Emprego de Confiança"},
           "Faixa Etária": set(FX_ORDEM), "Faixa Tempo de Casa": set(TC_ORDEM),
           "STATUS_FERIAS": {"NORMAL", "AGENDADAS", "DE_FERIAS", "SEM_PERIODO", "VENCIDO", "ALERTA_BAIXO", "ALERTA_MEDIO", "CRITICO", "ALERTA_ALTO"}}
    for c, ok in dom.items():
        novos = set(raw[c].dropna().unique()) - ok
        if novos:
            erros.append(f"valores novos em {c}: {sorted(novos)}")
    tipos_ok = {"AUX. DOENCA FORA DO CONVENIO (SEM VENCIMENTOS)", "CONTRATO SUSPENSO - INVALIDEZ", "CONTRATO SUSPENSO - APOSENT.",
                "ACIDENTE TRABALHO S/VENCIMENTOS (A CONTAR 16 DIA)", "ACIDENTE S/INC (ATE 15 DIAS)", "AUX DOENCA RECURSO", "SUSPENSAO DE CONTRATO DE TRABALHO",
                "CONTRATO SUSPENSO - RECURSO", "LICENCA MEDICA S/INC (ATE 15 DIAS)", "CONTRATO SUSPENSO - FALTAS", "SAL. MATERNIDADE LEI 10.710",
                "CONTRATO SUSPENSO (RECLUSAO)", "SAL MATERNIDADE - PRORROGACAO ACORDO COLET", "CONTRATO SUSPENSO - MANDATO ELETIVO",
                "LICENCA MATERNIDADE - ADOCAO"}
    novos = set(raw["Tipo Afastamento"].dropna().unique()) - tipos_ok
    if novos:
        erros.append(f"tipos de afastamento sem classificação de natureza: {sorted(novos)}")
    # coerência da situação exclusiva
    esp = np.select([raw["Sit_afastados"] == "AFASTADO", raw["Sit_restricao"] == "R", raw["Sit_ferias"] == "FÉRIAS"], ["Afastado", "Restrição", "Férias"], "Ativo")
    k = int((raw["Situação"] != esp).sum())
    if k:
        erros.append(f"{k} linhas em que Situação não segue a prioridade Afastado > Restrição > Férias > Ativo")
    if ((raw["Sit_afastados"] == "AFASTADO") & (raw["Sit_restricao"] == "R")).any():
        erros.append("há afastados com restrição: a igualdade restrição de garis = situação Restrição deixa de valer")
    # definição de temporário
    k = int(((raw["Função Cargo"] == "GARI TEMPORARIO") != (raw["regimejur"] == "TEMPO DETERMINADO")).sum())
    if k:
        erros.append(f"{k} linhas em que GARI TEMPORARIO e TEMPO DETERMINADO não coincidem")
    if ((raw["Setor Anterior"] != "-") & (raw["Lotação"] != "GGQ02")).any():
        avisos.append("Setor Anterior preenchido fora da GGQ02: a visão por origem considera só a GGQ02")
    return erros, avisos


FX_ORDEM = ["Até 25 anos", "26 a 33 anos", "34 a 40 anos", "41 a 47 anos", "48 a 55 anos", "56 a 60 anos", "Acima de 60 anos"]
TC_ORDEM = ["1 - De 0 até 7 anos", "2 - Entre 8 e 15 anos", "3 - Entre 16 e 23 anos", "4 - Entre 24 e 31 anos",
            "5 - Entre 32 e 39 anos", "6 - Entre 40 e 47 anos", "7 - Acima de 47 anos"]
_erros, _avisos = validar_extracao(raw, REF)
for a in _avisos:
    print("AVISO:", a)
if _erros:
    print("VALIDAÇÃO DA EXTRAÇÃO FALHOU — nada foi gravado:")
    print("\n".join(" - " + e for e in _erros))
    sys.exit(1)
raw["_dias"] = pd.to_numeric(raw["dias_afast"], errors="coerce")
tipos = raw.groupby("Registro")["Tipo Afastamento"].apply(lambda s: " + ".join(sorted(s.dropna().unique())))
u = raw.drop_duplicates("Registro").set_index("Registro").copy()
u["Tipo Afastamento"] = tipos.replace("", np.nan)
u["dias"] = raw.groupby("Registro")["_dias"].max()  # duplicados: vale o afastamento em curso

fc = u["Função Cargo"]
af = u["Sit_afastados"] == "AFASTADO"
res = u["Sit_restricao"] == "R"
apo = u["Sit_Aposentadoria"] == "APOSENTADO INSS"
tmp = u["regimejur"] == "TEMPO DETERMINADO"
gari_ef = fc.isin(["GARI", "GARI II", "GARI III"])
garis = gari_ef | (fc == "GARI TEMPORARIO")
adm = pd.to_datetime(u["dtexerc"], format="%d/%m/%Y", errors="coerce")
efet = (u["regimejur"] == "CLT") & (u["Sit_emp_casa"] != "Empregado com Emprego de Confiança")

VINC = ["Efetivo", "Efetivo com função de confiança", "Confiança extraquadro", "Temporário"]
u["vinc"] = np.select([tmp, u["Sit_emp_casa"] == "Empregado com Emprego de Confiança",
                       u["Sit_emp_casa"] == "Empregado da casa com Emprego de Confiança"], VINC[3:0:-1], VINC[0])
FAM = ["Gari efetivo", "Gari temporário", "Agente de preparo de alimentos", "Emprego de confiança", "Demais cargos"]
u["fam"] = np.select([gari_ef, fc == "GARI TEMPORARIO", fc == "AGENTE DE PREPARO DE ALIMENTOS", fc == "CARGO EMPREGO CONF."], FAM[:4], FAM[4])
SIT = ["Ativo", "Férias", "Restrição", "Afastado"]
T = u["Tipo Afastamento"].fillna("")
NAT = ["Afastamento por doença ou acidente", "Contrato suspenso (invalidez ou aposentadoria)", "Maternidade ou adoção", "Outras suspensões contratuais"]
u["nat"] = np.select([T == "", T.str.contains("INVALIDEZ|APOSENT"), T.str.contains("MATERN|ADOCAO"),
                      T.str.contains("DOENCA|ACIDENTE|LICENCA MEDICA")], ["", NAT[1], NAT[2], NAT[0]], NAT[3])
DUR = ["Até 90 dias", "91 a 365 dias", "1 a 5 anos", "Mais de 5 anos"]
u["dur"] = np.where(~af, "", np.select([u["dias"] <= 90, u["dias"] <= 365, u["dias"] <= 1825], DUR[:3], DUR[3]))
FX = ["Até 25 anos", "26 a 33 anos", "34 a 40 anos", "41 a 47 anos", "48 a 55 anos", "56 a 60 anos", "Acima de 60 anos"]
TC = ["1 - De 0 até 7 anos", "2 - Entre 8 e 15 anos", "3 - Entre 16 e 23 anos", "4 - Entre 24 e 31 anos",
      "5 - Entre 32 e 39 anos", "6 - Entre 40 e 47 anos", "7 - Acima de 47 anos"]
TC_LABEL = [t.split(" - ")[1] for t in TC]

# ---------------------------------------------------------------------------
# 2. Hierarquia por paisetor (provisória) com lotações especiais destacadas
# ---------------------------------------------------------------------------
L = u.groupby("Lotação").agg(pai=("paisetor", "first"), nome=("NOMESETOR", "first"), dir=("Diretoria", "first"))
with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "hierarquia_consolidada.json"), encoding="utf-8") as arquivo:
    ENDERECOS = json.load(arquivo)
NOME = {k: v["nome"] for k, v in ENDERECOS.items()}
faltantes = sorted(set(L.index) - set(ENDERECOS))
if faltantes:
    sys.exit("ERRO: lotações sem correspondência no cadastro consolidado: " + ", ".join(faltantes))
ESPECIAIS_PROPRIAS = {"GGQ02": "Lotação administrativa da DGG associada a empregados afastados",
                      "NAO-CI": "Núcleo de cargos indisponíveis"}
ESPECIAIS_CONTIDAS = {"TGM01": "contratos suspensos", "GGP11": "contratos suspensos", "GGP96": "registros de desligados"}


def cadeia(l):
    c = [l]
    while True:
        p = ENDERECOS[c[-1]]["pai"]
        if p == c[-1] or p not in ENDERECOS or len(c) > 10:
            c.append(p)
            return list(reversed(c))
        c.append(p)


def niveis(l):
    c, d = cadeia(l), L.loc[l, "dir"]
    if l in ESPECIAIS_PROPRIAS:
        return l, l
    if c[0] == "COM" and d == "DSU":
        return "_APAS", l
    if c[0] in ("COM", "COML20"):
        return ("_CONV" if c[0] == "COML20" else "_CESS"), l
    resto = c[c.index(d) + 1:] if d in c else c[1:]
    if not resto:
        return "_SEDE", l
    return resto[0], (resto[1] if len(resto) > 1 else resto[0])


NIV = {l: niveis(l) for l in L.index}
u["N1"] = u["Lotação"].map(lambda l: NIV[l][0])
u["N2"] = u["Lotação"].map(lambda l: NIV[l][1])
ROTULO_ESPECIAL = {"_APAS": "APAs/SME (vinculação a homologar)", "_CONV": "Convênio SMS/COMLURB",
                   "_CESS": "Empregados cedidos", "_SEDE": "Sede da diretoria", "_esp": "Lotação especial"}


def tipo_unidade(cod):
    tipo = str(ENDERECOS.get(cod, {}).get("tipo", "")).strip()
    tipos = {"GERÊNCIA": "Gerência", "GERÊNCIA ADJUNTA": "Gerência adjunta",
             "DIVISÃO": "Divisão", "COORDENADORIA": "Coordenadoria",
             "SUPERINTENDENCIA": "Superintendência", "DIRETORIA": "Diretoria",
             "ÓRGÃO EXTERNO": "Órgão externo", "PRESIDÊNCIA": "Presidência"}
    if tipo in tipos:
        return tipos[tipo]
    n = str(NOME.get(cod, cod))
    for pref, t in [(r"^(Gerência Adj|Ger\.? Adj)", "Gerência adjunta"), (r"^(Gerência|Ger\.|GERENCIA)", "Gerência"),
                    (r"^(Divisão|DIVISÃO)", "Divisão"), (r"^(Coordenadoria|Coord\.)", "Coordenadoria"),
                    (r"^Superintendência", "Superintendência"), (r"^Secretaria", "APA/SME"), (r"^Diretoria", "Diretoria")]:
        if re.match(pref, n):
            return t
    return "Outra"


def rotulo(cod):
    return ROTULO_ESPECIAL.get(cod, NOME.get(cod, cod))


# ---------------------------------------------------------------------------
# 3. Células e motor de supressão
# ---------------------------------------------------------------------------
CEL = {}          # id -> dict(v, sens, den, sup)
RESTR = []        # listas [total_id, [membros]]


def cel(cid, v, sens=False, den=None, prio=2):
    """prio: ordem de preferência na supressão complementar (menor = suprime primeiro)."""
    CEL[cid] = {"v": int(v), "sens": sens, "den": den, "sup": False, "prio": prio}
    return cid


def restr(total, membros):
    RESTR.append((total, list(membros)))


def supressao_primaria():
    for c in CEL.values():
        v = c["v"]
        if c["sens"]:
            d = CEL[c["den"]]["v"] if c["den"] else None
            if d is not None and d < MIN_GRUPO:
                c["sup"] = True
            elif v != 0 and (v < MIN_CEL or (d is not None and d - v < MIN_CEL)):
                c["sup"] = True
        elif 0 < v < MIN_CEL:
            c["sup"] = True


def supressao_complementar():
    mudou, voltas = True, 0
    while mudou:
        mudou, voltas = False, voltas + 1
        for total, membros in RESTR:
            ids = [total] + membros
            sup = [i for i in ids if CEL[i]["sup"]]
            if len(sup) == 1:
                cand = sorted([m for m in membros if not CEL[m]["sup"]], key=lambda m: (CEL[m]["prio"], CEL[m]["v"] == 0, CEL[m]["v"], m))
                alvo = cand[0] if cand else total
                if not CEL[alvo]["sup"]:
                    CEL[alvo]["sup"] = True
                    mudou = True
    return voltas


def val(cid):
    c = CEL[cid]
    return None if c["sup"] else c["v"]


# ---------------------------------------------------------------------------
# 4. Árvore de unidades (lotação oficial)
# ---------------------------------------------------------------------------
NODES = {}


IGUALDADES_QUEBRADAS = []


NIVEL_FAMSIT, NIVEL_NATUREZA = 1, 2  # situação por grupo funcional até diretoria; natureza/duração até superintendência


def medir(nid, m, agrupado=False, nivel=0):
    """Cria as células de um nó a partir da máscara m."""
    g = u[m]
    # custo de supressão: unidades (nível 3) e agrupamentos primeiro; superintendências depois; diretorias e COMLURB por último
    base = (-5 if agrupado else 0) + (20 if nivel == 2 else 0)
    n = cel(f"{nid}|n", len(g), prio=30 + base)  # quadro da unidade: último a ser escolhido
    c = {"n": n}
    # temporários e garis efetivos (denominador da restrição) são mais caros de suprimir que os demais grupos
    c["vinc"] = [cel(f"{nid}|vinc|{k}", (g["vinc"] == k).sum(), prio=(12 if k == "Temporário" else 6) + base) for k in VINC]
    c["fam"] = [cel(f"{nid}|fam|{k}", (g["fam"] == k).sum(), prio=(12 if k in ("Gari efetivo", "Gari temporário") else 6) + base) for k in FAM]
    restr(n, c["vinc"])
    restr(n, c["fam"])
    PRIO_SIT = {"Ativo": 0, "Férias": 1, "Restrição": 3, "Afastado": 4}
    c["sit"] = [cel(f"{nid}|sit|{k}", (g["Situação"] == k).sum(), True, n, PRIO_SIT[k] + base) for k in SIT]
    restr(n, c["sit"])
    c["famsit"] = None if nivel > NIVEL_FAMSIT or nid == "D:PRE" else []
    for i, f in (enumerate(FAM) if c["famsit"] is not None else []):
        linha = [cel(f"{nid}|fs|{f}|{s}", ((g["fam"] == f) & (g["Situação"] == s)).sum(), True, c["fam"][i], PRIO_SIT[s] + base) for s in SIT]
        restr(c["fam"][i], linha)
        c["famsit"].append(linha)
    if c["famsit"] is not None:
        for j in range(len(SIT)):
            restr(c["sit"][j], [c["famsit"][i][j] for i in range(len(FAM))])
    afid = c["sit"][3]
    if nivel <= NIVEL_NATUREZA:
        c["nat"] = [cel(f"{nid}|nat|{k}", (g["nat"] == k).sum(), True, n, (3 if k in NAT[:2] else 1) + base) for k in NAT]
        restr(afid, c["nat"])
        c["dur"] = [cel(f"{nid}|dur|{k}", (g["dur"] == k).sum(), True, n, 2 + base) for k in DUR]
        restr(afid, c["dur"])
    else:
        c["nat"] = c["dur"] = None
    gef = c["fam"][0]  # garis efetivos = mesma célula da família (evita duas cópias do mesmo número)
    c["garisEf"] = gef
    c["resGarisEf"] = cel(f"{nid}|resGarisEf", ((g["fam"] == "Gari efetivo") & (g["Sit_restricao"] == "R")).sum(), True, gef, 3 + base)
    c["garis"] = None  # calculado na página como gari efetivo + gari temporário
    # Igualdades entre tabelas: se uma das células for suprimida, a outra também precisa ser
    if ((g["fam"] == "Gari temporário") == (g["vinc"] == "Temporário")).all():
        restr(c["fam"][1], [c["vinc"][3]])
    if ((g["fam"] == "Emprego de confiança") == (g["vinc"] == "Confiança extraquadro")).all():
        restr(c["fam"][3], [c["vinc"][2]])
    else:
        IGUALDADES_QUEBRADAS.append(f"{nid}: emprego de confiança ≠ confiança extraquadro")
    if c["famsit"] is None:
        pass
    elif (((g["fam"] == "Gari efetivo") & (g["Sit_restricao"] == "R")) == ((g["fam"] == "Gari efetivo") & (g["Situação"] == "Restrição"))).all():
        restr(c["resGarisEf"], [c["famsit"][0][2]])
    else:
        IGUALDADES_QUEBRADAS.append(f"{nid}: restrição de garis ≠ situação Restrição")
    return c


def no(nid, label, nivel, m, pai=None, extra=None):
    NODES[nid] = {"id": nid, "label": label, "nivel": nivel, "pai": pai, "filhos": [], "cel": medir(nid, m, bool((extra or {}).get("agrupado")), nivel), **(extra or {})}
    if pai:
        NODES[pai]["filhos"].append(nid)
    return nid


def restr_hierarquia(pai):
    filhos = NODES[pai]["filhos"]
    if not filhos:
        return
    P = NODES[pai]["cel"]
    F = [NODES[f]["cel"] for f in filhos]
    restr(P["n"], [f["n"] for f in F])
    for chave in ["vinc", "fam"]:
        for j in range(len(P[chave])):
            restr(P[chave][j], [f[chave][j] for f in F])
    for chave in ["sit", "nat", "dur"]:
        if P[chave] is None or any(f[chave] is None for f in F):
            continue
        for j in range(len(P[chave])):
            restr(P[chave][j], [f[chave][j] for f in F])
    if P["famsit"] is not None and all(f["famsit"] is not None for f in F):
        for i in range(len(FAM)):
            for j in range(len(SIT)):
                restr(P["famsit"][i][j], [f["famsit"][i][j] for f in F])
    restr(P["resGarisEf"], [f["resGarisEf"] for f in F])


raiz = no("COMLURB", "COMLURB", 0, pd.Series(True, index=u.index))
ORDEM_DIR = ["DLU", "DSU", "DTE", "DAF", "DGG", "PRE", "DJU", "CEDIDOS"]
for d in ORDEM_DIR:
    md = u["Diretoria"] == d
    did = no(f"D:{d}", d, 1, md, raiz)
    n1s = u[md].groupby("N1").size().sort_values(ascending=False)
    pequenos1 = [k for k, v in n1s.items() if v < MIN_GRUPO]
    if pequenos1 and n1s.loc[pequenos1].sum() < MIN_GRUPO:
        grandes = n1s.drop(index=pequenos1)
        if not grandes.empty:
            pequenos1.append(grandes.idxmin())
    for k1, v1 in n1s.items():
        if k1 in pequenos1:
            continue
        m1 = md & (u["N1"] == k1)
        esp1 = k1 in ESPECIAIS_PROPRIAS
        n1id = no(f"{did}|{k1}", rotulo(k1), 2, m1, did,
                  {"tipo": "Lotação especial" if esp1 else tipo_unidade(k1), "especial": ESPECIAIS_PROPRIAS.get(k1)})
        n2s = u[m1].groupby("N2").size().sort_values(ascending=False)
        if len(n2s) <= 1 or esp1:
            continue
        pequenos2 = [k for k, v in n2s.items() if v < MIN_GRUPO]
        if pequenos2 and n2s.loc[pequenos2].sum() < MIN_GRUPO:
            grandes = n2s.drop(index=pequenos2)
            if not grandes.empty:
                # Preserva UGV-N como gerência visível no agrupamento da UCV.
                candidatas = grandes.drop(index="UGV-N", errors="ignore") if d == "DSU" and k1 == "UCV" else grandes
                pequenos2.append((candidatas if not candidatas.empty else grandes).idxmin())
        for k2, v2 in n2s.items():
            if k2 in pequenos2:
                continue
            m2 = m1 & (u["N2"] == k2)
            contidas = sorted({l for l in u.loc[m2, "Lotação"] if l in ESPECIAIS_CONTIDAS})
            esp2 = k2 in ESPECIAIS_PROPRIAS
            no(f"{n1id}|{k2}", rotulo(k2) + (" (própria lotação)" if k2 == k1 else ""), 3, m2, n1id,
               {"tipo": "Lotação especial" if esp2 else tipo_unidade(k2), "especial": ESPECIAIS_PROPRIAS.get(k2),
                "contem": [f"{l}: {ESPECIAIS_CONTIDAS[l]}" for l in contidas]})
        if pequenos2:
            m2 = m1 & u["N2"].isin(pequenos2)
            no(f"{n1id}|_demais", f"Demais unidades (agrupadas, {len(pequenos2)})", 3, m2, n1id, {"tipo": "Agrupamento", "agrupado": True})
        restr_hierarquia(n1id)
    if pequenos1:
        m1 = md & u["N1"].isin(pequenos1)
        no(f"{did}|_demais", f"Demais unidades (agrupadas, {len(pequenos1)})", 2, m1, did, {"tipo": "Agrupamento", "agrupado": True})
    restr_hierarquia(did)
restr_hierarquia(raiz)

# ---------------------------------------------------------------------------
# 5. Tabelas corporativas
# ---------------------------------------------------------------------------
# 5a. Visão por origem (somente diretoria). A GGQ02 permanece na DGG na lotação oficial; a origem é analítica.
# Linhas: DLU, DSU e "demais" (na origem, demais diretorias + códigos sem correspondência, para não expor grupos pequenos).
# A diferença origem − oficial de cada linha é um grupo implícito (empregados da GGQ02 vindos daquela origem):
# ele também precisa respeitar as regras; se não respeitar, a visão por origem não é publicada nesta competência.
gq = u["Lotação"] == "GGQ02"
lot_dir = L["dir"]
dir_orig = u["Diretoria"].copy()
dir_orig[gq] = u.loc[gq, "Setor Anterior"].map(lot_dir).fillna("_NI")
grp = lambda s: s.where(s.isin(["DLU", "DSU"]), "_DEM")
afB_mask = u["nat"] == NAT[0]
ORIG_ROWS = [("DLU", "DLU"), ("DSU", "DSU"), ("_DEM", "Demais diretorias")]
ORIG_LAB = {"_DEM": "Demais diretorias e origem não identificada"}
origem, origem_ok, origem_motivo = [], True, ""
for k, _ in ORIG_ROWS:
    mg = gq & (grp(dir_orig) == k)
    gn, ga, gb = int(mg.sum()), int((mg & af).sum()), int((mg & afB_mask).sum())
    for v in (ga, gb):
        if gn and (gn < MIN_GRUPO or (v != 0 and (v < MIN_CEL or gn - v < MIN_CEL))):
            origem_ok, origem_motivo = False, "grupo implícito da GGQ02 por origem abaixo dos limites"
for vis, serie in [("oficial", grp(u["Diretoria"])), ("origem", grp(dir_orig))]:
    if vis == "origem" and not origem_ok:
        break
    tot_n, tot_a, tot_b = [], [], []
    for k, lab in ORIG_ROWS:
        m = serie == k
        if vis == "oficial" and k in ("DLU", "DSU"):
            cc = NODES[f"D:{k}"]["cel"]
            n, a, b = cc["n"], cc["sit"][3], cc["nat"][0]
        else:
            n = cel(f"orig|{vis}|{k}|n", m.sum())
            a = cel(f"orig|{vis}|{k}|af", (m & af).sum(), True, n)
            b = cel(f"orig|{vis}|{k}|afB", (m & afB_mask).sum(), True, n)
        tot_n.append(n); tot_a.append(a); tot_b.append(b)
        origem.append({"visao": vis, "chave": k, "label": ORIG_LAB.get(k, lab) if vis == "origem" else lab, "n": n, "af": a, "afB": b})
    restr(NODES["COMLURB"]["cel"]["n"], tot_n)
    restr(NODES["COMLURB"]["cel"]["sit"][3], tot_a)
    restr(NODES["COMLURB"]["cel"]["nat"][0], tot_b)

# 5b. Restrição de garis efetivos por jornada e faixa etária
ge = u[gari_ef]
res_jornada, res_faixa = [], []
for k in ge["Jornada"].value_counts().index:
    m = ge["Jornada"] == k
    n = cel(f"resj|{k}|n", m.sum())
    r = cel(f"resj|{k}|r", (m & (ge["Sit_restricao"] == "R")).sum(), True, n)
    res_jornada.append({"label": k, "n": n, "r": r})
restr(NODES["COMLURB"]["cel"]["resGarisEf"], [x["r"] for x in res_jornada])
for k in FX:
    m = ge["Faixa Etária"] == k
    n = cel(f"resf|{k}|n", m.sum())
    r = cel(f"resf|{k}|r", (m & (ge["Sit_restricao"] == "R")).sum(), True, n)
    res_faixa.append({"label": k, "n": n, "r": r})
restr(NODES["COMLURB"]["cel"]["resGarisEf"], [x["r"] for x in res_faixa])

# 5c. Admissões do quadro atual por ano
anos = list(range(1980, REF.year + 1))
adm_ano = []
for y in ["até 1979"] + anos:
    my = (adm.dt.year <= 1979) if y == "até 1979" else (adm.dt.year == y)
    adm_ano.append({"ano": str(y), "efetivos": cel(f"adm|{y}|ef", (my & efet).sum()),
                    "temporarios": cel(f"adm|{y}|tmp", (my & tmp).sum()),
                    "confianca": cel(f"adm|{y}|conf", (my & (u["vinc"] == "Confiança extraquadro")).sum())})
ondas = []
for per, v in adm[tmp].dt.to_period("M").value_counts().sort_index().items():
    ondas.append({"mes": per.strftime("%m/%Y"), "n": cel(f"onda|{per}", v)})

# 5d. Famílias para sucessão
FAMILIAS_SUC = [
    ("Motoristas", ["MOTORISTA"]),
    ("Manutenção de frota e máquinas", ["MECANICO VEICULAR E DE MAQUINAS", "BORRACHEIRO", "SOLDADOR-FUNILEIRO", "LUBRIFICADOR",
        "ELETRICISTA VEICULAR E DE MAQUINAS", "CAPOTEIRO-VIDRACEIRO", "MECANICO INDUSTRIAL", "MECANICO DE APARELHOS E INSTRUMENTOS",
        "TORNEIRO", "FERREIRO", "TECNICO DE MANUTENCAO MECANICA E INDUSTRIAL", "CONTROLADOR TECNICO DE MANUTENCAO MECANICA E INDUS",
        "MESTRE DE FABRICACAO", "SOLDADOR DE FABRICACAO", "SERRALHEIRO", "DESENHISTA INDUSTRIAL"]),
    ("Manutenção predial e obras", ["PEDREIRO", "PINTOR", "CARPINTEIRO", "ELETRICISTA", "BOMBEIRO HIDRAULICO", "VIDRACEIRO DE EDIFICACAO", "MESTRE DE OBRAS"]),
    ("Operação de máquinas e equipamentos", ["OPERADOR DE TRATORES E MAQUINAS", "OPERADOR DE EQUIPAMENTOS LEVES", "OPERADOR DE APARELHOS E INSTRUMENTOS"]),
    ("Controle de vetores e pragas", ["AUXILIAR DE CONTROLE DE VETORES E PRAGAS", "TECNICO DE CONTROLE DE VETORES E PRAGAS",
        "CONTROLADOR TECNICO DE CONTROLE DE VETORES E PRAGA", "ANALISTA TECNICO DE CONTROLE DE VETORES E PRAGAS", "AUXILIAR DE SERVICOS DE LABORATORIO"]),
    ("Administrativo", ["AGENTE ADMINISTRATIVO", "ASSISTENTE ADMINISTRATIVO TECNICO", "CONTROLADOR TECNICO ADMINISTRATIVO",
        "ANALISTA TECNICO ADMINISTRATIVO", "AUXILIAR ADMINISTRATIVO", "ADMINISTRADOR"]),
    ("Nível superior especializado", ["ENGENHEIRO", "ARQUITETO", "BIOLOGISTA", "ECONOMISTAL", "CONTADOR", "ADVOGADO", "PSICOLOGO",
        "ASSISTENTE SOCIAL", "MEDICO DO TRABALHO", "ENFERMEIRO DO TRABALHO", "ANALISTA TECNICO DE INFORMATICA", "ANALISTA DE TECNOLOGIA DA INFORMACAO",
        "PEDAGOGO", "PROFESSOR", "ANALISTA TECNICO DE SEGURANCA DO TRABALHO"]),
    ("Segurança patrimonial", ["VIGIA", "VIGILANTE"]),
    ("Fiscalização", ["AGENTE DE FISCALIZACAO", "TECNICO DE FISCALIZACAO", "CONTROLADOR TECNICO DE FISCALIZACAO", "ANALISTA TECNICO DE FISCALIZACAO"]),
    ("Supervisão e suporte operacional", ["AGENTE DE LIMPEZA E SERVICOS URBANOS", "TECNICO DE LIMPEZA E SERVICOS URBANOS",
        "CONTROLADOR TECNICO DE LIMPEZA E SERVICOS URBANOS", "ANALISTA TECNICO DE LIMPEZA E SERVICOS URBANOS", "AGENTE DE SUPORTE OPERACIONAL",
        "ASSISTENTE TECNICO DE SUPORTE OPERACIONAL", "CONTROLADOR TECNICO DE SUPORTE OPERACIONAL", "AUXILIAR DE SUPORTE OPERACIONAL",
        "ANALISTA TECNICO DE SUPORTE OPERACIONAL", "AUXILIAR DE SERVICOS GERAIS", "AUXILIAR DE SERVICOS GERAIS OPERACIONAIS",
        "OPERADOR DE SERVICOS GERAIS", "AUXILIAR DE SERVICOS DE JARDINAGEM", "TECNICO DE SEGURANCA DO TRABALHO", "TECNICO DE ENFERMAGEM DO TRABALHO",
        "CONTROLADOR TECNICO DE TRANSPORTE", "TECNICO DE TRANSPORTE", "ANALISTA TECNICO DE TRANSPORTE", "TECNICO DE INFORMATICA",
        "TECNICO RELACOES PUBLICAS", "TECNICO DE COMUNICACAO SOCIAL", "TECNICO DE CONTABILIDADE"]),
    ("Gari efetivo", ["GARI", "GARI II", "GARI III"]),
    ("Agente de preparo de alimentos", ["AGENTE DE PREPARO DE ALIMENTOS"]),
]
mapeadas = {f for _, fs in FAMILIAS_SUC for f in fs}
faltando = set(fc[~tmp & (fc != "CARGO EMPREGO CONF.")].unique()) - mapeadas
assert not faltando, f"Funções sem família de sucessão: {faltando}"
base_suc = ~tmp & (fc != "CARGO EMPREGO CONF.")
fx60 = u["Faixa Etária"] == "Acima de 60 anos"
desde2015 = adm.dt.year >= 2015


def linha_suc(prefixo, m, label):
    n = cel(f"{prefixo}|n", m.sum())
    return {"label": label, "n": n,
            "fx": [cel(f"{prefixo}|fx|{k}", (m & (u["Faixa Etária"] == k)).sum()) for k in FX],
            "apo": cel(f"{prefixo}|apo", (m & apo).sum(), True, n),
            "desde2015": cel(f"{prefixo}|d15", (m & desde2015).sum())}


sucessao = []
tot_apo = cel("suc|tot|apo", (base_suc & apo).sum(), True, cel("suc|tot|n", base_suc.sum()))
for fam_lab, funcs in FAMILIAS_SUC:
    mf = base_suc & fc.isin(funcs)
    item = linha_suc(f"suc|{fam_lab}", mf, fam_lab)
    item["funcoes"] = []
    grandes = [f for f in funcs if (mf & (fc == f)).sum() >= MIN_GRUPO]
    for f in grandes:
        item["funcoes"].append(linha_suc(f"suc|{fam_lab}|{f}", mf & (fc == f), f.capitalize()))
    resto = [f for f in funcs if f not in grandes and (mf & (fc == f)).sum() > 0]
    if resto and grandes:
        item["funcoes"].append(linha_suc(f"suc|{fam_lab}|_resto", mf & fc.isin(resto), f"Demais funções ({len(resto)})"))
    if item["funcoes"]:
        restr(item["apo"], [x["apo"] for x in item["funcoes"]])
    sucessao.append(item)
restr(tot_apo, [x["apo"] for x in sucessao])

# Mapa idade × tempo de casa (quadro sem temporários)
mapa = {"linhas": FX, "colunas": TC_LABEL, "grupos": {}}
for g_lab, m in [("Quadro sem temporários", ~tmp), ("Gari efetivo", gari_ef),
                 ("Demais cargos (exceto garis, agentes de preparo e confiança)", u["fam"] == "Demais cargos")]:
    mapa["grupos"][g_lab] = [[cel(f"mapa|{g_lab}|{a}|{t}", (m & (u["Faixa Etária"] == a) & (u["Faixa Tempo de Casa"] == t)).sum())
                              for t in TC] for a in FX]

# Lideranças
ec = u["Função EC"].fillna("")
lider = []
for lab, pat in [("Encarregados", "^ENCARREGADO"), ("Gerentes", "^GERENTE"), ("Coordenadores", "^COORDENADOR"),
                 ("Assistentes", "^ASSISTENTE"), ("Assessores, superintendentes e outros", "^(ASSESSOR|SUPERINTENDENTE|OUVIDOR|LIDER)")]:
    m = ec.str.match(pat)
    lider.append({"label": lab, "n": cel(f"lid|{lab}|n", m.sum()), "fx60": cel(f"lid|{lab}|fx60", (m & fx60).sum())})

# Temporários: perfil etário comparado
perfil_tmp = {"faixas": FX,
              "temporarios": [cel(f"ptmp|t|{k}", (tmp & (u["Faixa Etária"] == k)).sum()) for k in FX],
              "garisEfetivos": [cel(f"ptmp|g|{k}", (gari_ef & (u["Faixa Etária"] == k)).sum()) for k in FX]}

# Férias (não afastados) e alertas
na = ~af
ferias = [{"label": k, "n": cel(f"fer|{k}", (na & (u["STATUS_FERIAS"] == k)).sum())}
          for k in ["AGENDADAS", "DE_FERIAS", "NORMAL", "SEM_PERIODO", "ALERTA_BAIXO", "ALERTA_MEDIO", "ALERTA_ALTO", "CRITICO", "VENCIDO"]]
alerta = na & u["STATUS_FERIAS"].isin(["VENCIDO", "CRITICO", "ALERTA_ALTO"])
# Só o número de alertas: o total de não afastados por diretoria permitiria recalcular os afastados suprimidos
ferias_dir = [{"label": d, "alerta": cel(f"ferd|{d}|a", (alerta & (u["Diretoria"] == d)).sum())} for d in ORDEM_DIR]

# Qualidade cadastral
txt = u["validcnh"].fillna("").str.strip()
ok = txt.str.fullmatch(r"\d{2}/\d{2}/\d{4}")
ano_cnh = pd.to_numeric(txt.str[-4:].where(ok), errors="coerce")
val_cnh = pd.to_datetime(txt.where(ok & ~(ano_cnh > 2040)), format="%d/%m/%Y", errors="coerce")
idade = pd.to_numeric(u["Idade"], errors="coerce")
qualidade = [
    ("Registros duplicados (licença em curso + auxílio com início futuro)", int(raw["Registro"].duplicated().sum())),
    ("Superintendência não informada (\"-\")", int((u["Superintendência"] == "-").sum())),
    ("Lotados na GGQ02 sem estar afastados", int((gq & ~af).sum())),
    ("Temporários classificados como \"Empregado da casa\"", int((tmp & (u["Sit_emp_casa"] == "Empregado da casa")).sum())),
    ("Temporários sem percentual de insalubridade", int((tmp & u["percinsal"].isna()).sum())),
    ("Registros sem horário de jornada", int(u["jornada_entrada"].isna().sum())),
    ("Motoristas com CNH vencida no cadastro", int(((fc == "MOTORISTA") & (val_cnh < REF)).sum())),
    ("Motoristas sem CNH registrada", int(((fc == "MOTORISTA") & u["catcnh"].isna()).sum())),
    ("Registros com 75 anos ou mais (situação a avaliar pelo Jurídico)", int((idade >= 75).sum())),
    ("Lotações com menos de 30 pessoas", int((u.groupby("Lotação").size() < MIN_GRUPO).sum())),
    ("Códigos de Setor Anterior sem correspondência", int((gq & ~u["Setor Anterior"].isin(L.index)).sum())),
]
qual_cels = [{"label": k, "n": cel(f"q|{i}", v)} for i, (k, v) in enumerate(qualidade)]

# ---------------------------------------------------------------------------
# 6. Supressão e exportação
# ---------------------------------------------------------------------------
# Rótulos repetidos (ex.: "Ger. de Serv. Extraord. e Pronto Emprego" em cada regional) recebem o nome da unidade-mãe
from collections import Counter
_cont = Counter(nd["label"] for nd in NODES.values() if nd["nivel"] >= 2)
for nd in NODES.values():
    if nd["nivel"] >= 2 and _cont[nd["label"]] > 1 and nd["pai"]:
        mae = NODES[nd["pai"]]["label"].replace("Superintendência Regional ", "Regional ")
        nd["label"] = f"{nd['label']} · {mae}"

# Relações entre tabelas corporativas que um leitor também conhece (entram na proteção por programação linear)
AUX = set()


def aux(cid, v):
    """Célula interna nunca publicada, usada para escrever relações com mais de um termo do lado do total."""
    cel(cid, v); CEL[cid]["sup"] = True; AUX.add(cid)
    return cid


_R = NODES["COMLURB"]["cel"]
_ger = [x for x in sucessao if x["label"] == "Gari efetivo"][0]
_apa = [x for x in sucessao if x["label"] == "Agente de preparo de alimentos"][0]
RESTR_LP = []
def rlp(total, membros):
    RESTR_LP.append((total, list(membros)))
rlp(_R["fam"][0], [_ger["n"]]); rlp(_R["fam"][2], [_apa["n"]])
rlp(_R["fam"][4], [x["n"] for x in sucessao if x not in (_ger, _apa)])
for x in sucessao:
    rlp(x["n"], x["fx"])
    if x["funcoes"]:
        rlp(x["n"], [f["n"] for f in x["funcoes"]]); rlp(x["desde2015"], [f["desde2015"] for f in x["funcoes"]])
        for j in range(len(FX)):
            rlp(x["fx"][j], [f["fx"][j] for f in x["funcoes"]])
        for f in x["funcoes"]:
            rlp(f["n"], f["fx"])
rlp(_R["garisEf"], [t["n"] for t in res_faixa]); rlp(_R["garisEf"], [t["n"] for t in res_jornada])
for j, t in enumerate(res_faixa):
    rlp(t["n"], [_ger["fx"][j]]); rlp(t["n"], [perfil_tmp["garisEfetivos"][j]])
    rlp(_ger["fx"][j], mapa["grupos"]["Gari efetivo"][j])
rlp(_R["vinc"][3], perfil_tmp["temporarios"]); rlp(_R["vinc"][3], [o["n"] for o in ondas])
rlp(_R["vinc"][3], [a_["temporarios"] for a_ in adm_ano]); rlp(_R["vinc"][2], [a_["confianca"] for a_ in adm_ano])
_ef = aux("aux|efetivos", CEL[_R["vinc"][0]]["v"] + CEL[_R["vinc"][1]]["v"])
rlp(_ef, [_R["vinc"][0], _R["vinc"][1]]); rlp(_ef, [a_["efetivos"] for a_ in adm_ano])
_qs = aux("aux|quadro_sem_tmp", CEL[_R["n"]]["v"] - CEL[_R["vinc"][3]]["v"])
rlp(_R["n"], [_qs, _R["vinc"][3]]); rlp(_qs, sum(mapa["grupos"]["Quadro sem temporários"], []))
rlp(_R["fam"][4], sum(mapa["grupos"]["Demais cargos (exceto garis, agentes de preparo e confiança)"], []))
rlp(_R["n"], [f["n"] for f in ferias] + [_R["sit"][3]])
_al = aux("aux|alerta_ferias", sum(CEL[f["n"]]["v"] for f in ferias if f["label"] in ("VENCIDO", "CRITICO", "ALERTA_ALTO")))
rlp(_al, [f["n"] for f in ferias if f["label"] in ("VENCIDO", "CRITICO", "ALERTA_ALTO")]); rlp(_al, [f["alerta"] for f in ferias_dir])
_gq = NODES["D:DGG|GGQ02"]["cel"] if "D:DGG|GGQ02" in NODES else None
if _gq:
    rlp([q for q, (lab_, _) in zip(qual_cels, qualidade) if "GGQ02 sem" in lab_][0]["n"], _gq["sit"][:3])

# Totais corporativos-chave não devem ser escolhidos para supressão complementar
for _k in [x for x in CEL if x.startswith("COMLURB|")]:
    CEL[_k]["prio"] = 99
# Totais por diretoria também não entram como complementares (só se forem eles mesmos protegidos)
for _d in ORDEM_DIR:
    _c = NODES[f"D:{_d}"]["cel"]
    for _k in [_c["n"], _c["resGarisEf"]] + _c["sit"] + _c["vinc"] + _c["fam"] + (_c["nat"] or []) + (_c["dur"] or []) + (_c["famsit"][0] if _c["famsit"] else []):
        CEL[_k]["prio"] = max(CEL[_k]["prio"], 90)
supressao_primaria()
_protegidos_temporais = set()
if args.publicado_anterior:
    with open(args.publicado_anterior, encoding="utf-8") as arquivo:
        _anterior = json.load(arquivo)
    for _id, _nd in NODES.items():
        _sigla = _id.split("|")[-1]
        _valores = _anterior.get(_sigla, [])
        if not _valores or _nd["nivel"] < 2:
            continue
        _cid = _nd["cel"]["sit"][3]
        if len(_valores) > 1 or any(0 < abs(CEL[_cid]["v"] - int(_v)) < 10 for _v in _valores):
            CEL[_cid]["sup"] = True
            _protegidos_temporais.add(_cid)
    print(f"Triagem temporal: {len(_protegidos_temporais)} contagens adicionais protegidas.")
voltas = supressao_complementar()


def protegido(cid):
    """Célula cujo valor não pode ser conhecido (exato ou quase) por quem lê o pacote."""
    c = CEL[cid]
    if cid in AUX or not c["sup"]:
        return False
    if cid in _protegidos_temporais:
        return True
    v = c["v"]
    if c["sens"]:
        d = CEL[c["den"]]["v"] if c["den"] else None
        if d == 0:
            return False
        if v == 0:
            return d is not None and d < MIN_GRUPO  # zero só é publicável (ou dedutível) em grupo com 30+
        return (d is not None and d < MIN_GRUPO) or v < MIN_CEL or (d is not None and d - v < MIN_CEL)
    return 0 < v < MIN_CEL


def protecao_lp(max_rodadas=40):
    """Suprime células adicionais até que nenhum valor protegido possa ser deduzido pela combinação de todas as somas."""
    from scipy.optimize import linprog
    from scipy.sparse import coo_matrix
    import scipy.sparse.csgraph as csg
    todas = RESTR + RESTR_LP
    cache, historico, insist = {}, [], {}
    for rodada in range(1, max_rodadas + 1):
        variaveis = sorted({i for t, m in todas for i in [t] + m if CEL[i]["sup"]})
        idx = {v: k for k, v in enumerate(variaveis)}
        rr, cc, vv, bb = [], [], [], []
        linha = 0
        for t, m in todas:
            termos = [(t, 1.0)] + [(x, -1.0) for x in m]
            const = -sum(coef * CEL[x]["v"] for x, coef in termos if not CEL[x]["sup"])
            usados = [(x, coef) for x, coef in termos if CEL[x]["sup"]]
            if not usados:
                continue
            for x, coef in usados:
                rr.append(linha); cc.append(idx[x]); vv.append(coef)
            bb.append(const); linha += 1
        A = coo_matrix((vv, (rr, cc)), shape=(linha, len(variaveis))).tocsr()
        b = np.array(bb)
        ncomp, comp = csg.connected_components((A.T @ A) != 0, directed=False)
        violacoes = []
        for k in range(ncomp):
            cols = np.where(comp == k)[0]
            alvo = [j for j in cols if protegido(variaveis[j])]
            if not alvo:
                continue
            chave = frozenset(variaveis[j] for j in cols)
            if chave in cache:
                violacoes += cache[chave]; continue
            rows = np.unique(A[:, cols].nonzero()[0])
            Ac, bc = A[rows][:, cols], b[rows]
            pos = {j: i for i, j in enumerate(cols)}
            viol_c = []
            for j in alvo:
                obj = np.zeros(len(cols)); obj[pos[j]] = 1
                lo = linprog(obj, A_eq=Ac, b_eq=bc, bounds=(0, None), method="highs")
                hi = linprog(-obj, A_eq=Ac, b_eq=bc, bounds=(0, None), method="highs")
                lo_v = lo.fun if lo.status == 0 else 0.0
                hi_v = -hi.fun if hi.status == 0 else float("inf")
                cid = variaveis[j]
                c = CEL[cid]
                d = CEL[c["den"]]["v"] if c["sens"] and c["den"] else None
                largura_min = 4
                if not c["sens"]:
                    largura_min = 1  # contagem não sensível: basta não ser exata
                if hi_v - lo_v < largura_min - 0.5:
                    viol_c.append(cid)
            cache[chave] = viol_c
            violacoes += viol_c
        historico.append(len(violacoes))
        print(f"  proteção LP, rodada {rodada}: {len(variaveis)} células suprimidas, {len(violacoes)} ainda dedutíveis", flush=True)
        if not violacoes:
            return rodada, historico
        # para cada violação, suprime células publicadas ligadas a ela; se persistir, amplia o alcance
        novas = set()
        livre = lambda x: not CEL[x]["sup"] and x not in AUX and CEL[x]["prio"] < 50
        for cid in violacoes:
            insist[cid] = insist.get(cid, 0) + 1
            ligadas = [[t] + m for t, m in todas if cid == t or cid in m]
            custo = lambda x: (CEL[x]["prio"], CEL[x]["v"] == 0, CEL[x]["v"], x)  # desempate pelo id: resultado reprodutível
            # escalada gradual: 1, 2, 4, 8... células mais baratas ligadas ao caso; vizinhos de 2ª ordem só se faltar opção
            k = 2 ** (insist[cid] - 1)
            alcance = {x for grupo in ligadas for x in grupo}
            cand = sorted({x for x in alcance if livre(x)}, key=custo)
            if len(cand) < k:
                alcance |= {x for t, m in todas if alcance & set([t] + m) for x in [t] + m}
                cand = sorted({x for x in alcance if livre(x)}, key=custo)
            novas |= set(cand[:k])
        if not novas:
            raise RuntimeError("Proteção por programação linear não encontrou células para suprimir: " + ", ".join(violacoes[:5]))
        for x in novas:
            CEL[x]["sup"] = True
        supressao_complementar()
    raise RuntimeError(f"Proteção não convergiu em {max_rodadas} rodadas: {historico}")


rodadas_lp, historico_lp = protecao_lp()
print(f"Proteção por programação linear: {rodadas_lp} rodadas; células protegidas dedutíveis por rodada: {historico_lp}")


def exp(obj):
    if isinstance(obj, str) and obj in CEL:
        return val(obj)
    if isinstance(obj, list):
        return [exp(x) for x in obj]
    if isinstance(obj, dict):
        return {k: exp(v) for k, v in obj.items()}
    return obj


def exp_no(nid):
    nd = NODES[nid]
    c = nd["cel"]
    if nd.get("agrupado", False):
        if CEL[c["n"]]["v"] < MIN_GRUPO:
            raise ValueError("Agrupamento abaixo do mínimo: " + nid)
    return {"id": nid, "label": nd["label"], "nivel": nd["nivel"], "pai": nd["pai"], "filhos": nd["filhos"],
            "tipo": nd.get("tipo"), "especial": nd.get("especial"), "contem": nd.get("contem") or [],
            "agrupado": nd.get("agrupado", False),
            "n": val(c["n"]), "vinc": exp(c["vinc"]), "fam": exp(c["fam"]), "sit": exp(c["sit"]),
            "famsit": exp(c["famsit"]), "nat": exp(c["nat"]), "dur": exp(c["dur"]),
            "garisEf": val(c["garisEf"]), "resGarisEf": val(c["resGarisEf"]), "garis": None}


dados = {
    "meta": {
        "fonte": f"Extração funcional de {REF:%d/%m/%Y} (aba {xls.sheet_names[0]})",
        "referencia": REF.strftime("%Y-%m-%d"),
        "conciliacao_desligados": {"desconsiderados_sipe": total_desconsiderados, "regra": "Desligamentos até a referência prevalecem sobre a presença na SIPE; fonte bruta preservada."},
        "gerado_em": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "regras": {"grupo_minimo": MIN_GRUPO, "celula_minima": MIN_CEL,
                   "texto": "Situação cadastral publicada só em grupos com 30+ pessoas, com numerador e complemento >= 10 e supressão complementar. Valores suprimidos aparecem como traço."},
        "provisorio": "Estrutura do cadastro consolidado de setores. APAs exibidas em grupo próprio. Comparativos entre unidades são provisórios.",
        "status": STATUS,
        "totais_conferidos": FONTE_TOTAIS,
        "origem_publicada": origem_ok,
        "origem_motivo": origem_motivo,
        "rotulos": {"vinc": VINC, "fam": FAM, "sit": SIT, "nat": NAT, "dur": DUR, "faixas": FX, "tempo": TC_LABEL},
    },
    "arvore": {nid: exp_no(nid) for nid in NODES},
    "origem": exp(origem),
    "restricao": {"jornada": exp(res_jornada), "faixa": exp(res_faixa)},
    "admissoes": exp(adm_ano),
    "ondas": exp(ondas),
    "sucessao": exp(sucessao),
    "mapa": exp(mapa),
    "liderancas": exp(lider),
    "perfilTemporarios": exp(perfil_tmp),
    "ferias": exp(ferias),
    "feriasDiretoria": exp(ferias_dir),
    "qualidade": exp(qual_cels),
}

# ---------------------------------------------------------------------------
# 7. Autoverificação
# ---------------------------------------------------------------------------
falhas = []
R = dados["arvore"]["COMLURB"]
obtidos = {"quadro": R["n"], "afastados": R["sit"][3], "restricao": R["sit"][2], "temporarios": R["vinc"][3],
           "garis_efetivos_com_restricao": R["resGarisEf"], "beneficio": R["nat"][0], "contratos_suspensos": R["nat"][1]}
if TOTAIS is not None:
    for k, ref in TOTAIS.items():
        if k in obtidos and obtidos[k] != ref:
            falhas.append(f"{k}: gerado {obtidos[k]}, conferido {ref}")
    faltam = set(obtidos) - set(TOTAIS)
    if faltam:
        falhas.append(f"arquivo de totais sem: {sorted(faltam)}")
for q in IGUALDADES_QUEBRADAS[:5]:
    print("AVISO (igualdade entre tabelas não vale; relação fica só como desigualdade):", q)
for cid, c in CEL.items():
    if c["sup"]:
        continue
    if c["sens"]:
        d = CEL[c["den"]]["v"] if c["den"] else None
        if d is not None and d < MIN_GRUPO:
            falhas.append(f"célula sensível publicada em grupo pequeno: {cid}")
        if c["v"] != 0 and (c["v"] < MIN_CEL or (d is not None and d - c["v"] < MIN_CEL)):
            falhas.append(f"célula sensível abaixo do limite: {cid}")
    elif 0 < c["v"] < MIN_CEL:
        falhas.append(f"contagem abaixo de 10 publicada: {cid}")
for total, membros in RESTR:
    if sum(CEL[i]["sup"] for i in [total] + membros) == 1:
        falhas.append(f"restrição com uma única célula suprimida: {total}")
texto = json.dumps(dados, ensure_ascii=False)
for proibido in ["cpf", "nascimento", "Registro\"", "nomelogender", "Raça", "Sexo", "referencia\""]:
    if proibido.lower() in texto.lower() and proibido not in ("referencia\"",):
        falhas.append(f"termo proibido no pacote: {proibido}")
if falhas:
    print("FALHAS NA AUTOVERIFICAÇÃO:")
    print("\n".join(falhas[:40]))
    sys.exit(1)

with open(SAIDA, "w", encoding="utf-8") as fh:
    fh.write("/* Gestão Estratégica de Pessoas — agregados públicos protegidos. Gerado por gerar_dados_pessoas.py.\n"
             "   Nenhum registro individual. Valores null = suprimidos por proteção estatística. */\n")
    fh.write("window.PESSOAS_DADOS=" + texto + ";\n")
n_sup = sum(c["sup"] for c in CEL.values())
print(f"OK: {len(NODES)} unidades, {len(CEL)} células ({n_sup} suprimidas), {len(RESTR)} somas protegidas, {voltas} rodadas de supressão complementar.")
print(f"Gravado em {SAIDA} ({len(texto) / 1024:.0f} KB).")
