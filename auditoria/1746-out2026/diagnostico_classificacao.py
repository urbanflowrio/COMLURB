#!/usr/bin/env python3
"""Diagnóstico de classificação do 1746 (05/11/2026). Ver DIAGNOSTICO_CLASSIFICACAO_HISTORICO.md.

Parte 1, inventário da fonte atual:
  python3 diagnostico_classificacao.py fonte FONTE_CHAMADOS.xlsx FONTE_OUVIDORIAS.xlsx saida.json
Parte 2, efeito nos fechamentos congelados (pasta com as bases renomeadas:
  BASE_CH_JUL2026.xlsx, BASE_CH_AGO2026.xlsx, BASE_CH_SET2026_POS.xlsx,
  BASE_OUV_JUL2026.xlsx, BASE_OUV_AGO2026.xlsx, BASE_OUV_SET2026_POS.xlsm):
  python3 diagnostico_classificacao.py congelado PASTA saida.json
Dependência: openpyxl. As bases ficam no Drive da COMLURB, não no repositório.
"""
import sys
def fonte(argv):
    import openpyxl,sys,collections,re,json
    MESES=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro']
    def load(p,ouv):
        wb=openpyxl.load_workbook(p,read_only=True,data_only=True); rows=list(wb.worksheets[0].iter_rows(values_only=True)); cab=rows[0]; R=[]
        for r in rows[1:]:
            if r[0]=='Total Geral': continue
            d=dict(zip(cab,r))
            if ouv and d['Gerência']=='PCO': continue
            if d['Mês Solicitação'] not in MESES: continue
            R.append((d['Tipo'],d['SubTipo'],d['Mês Solicitação'],int(d[2025.0] or 0),int(d[2026.0] or 0)))
        return R
    norm=lambda s: re.sub(r'^OUV\s*[-–]\s*','',str(s).strip().upper())
    out={}
    for canal,p,ouv in [('CH',sys.argv[1],False),('OUV',sys.argv[2],True)]:
        R=load(p,ouv)
        tot=collections.defaultdict(lambda:[0,0]); mes=collections.defaultdict(lambda:collections.defaultdict(lambda:[0,0]))
        for t,s,m,a,b in R: tot[(t,s)][0]+=a; tot[(t,s)][1]+=b; mes[(t,s)][m][0]+=a; mes[(t,s)][m][1]+=b
        print(f'\n######## {canal}: subtipos por tipo (jan-out 2025 / 2026)')
        bytipo=collections.defaultdict(list)
        for (t,s),v in tot.items(): bytipo[t].append((s,v))
        for t in sorted(bytipo):
            st=sorted(bytipo[t],key=lambda x:-sum(x[1]))
            print(f'## {t} [{sum(v[0] for _,v in st)} / {sum(v[1] for _,v in st)}]')
            for s,v in st: print(f'    {v[0]:>6} {v[1]:>6}  {s}')
        print(f'\n######## {canal}: mesmo subtipo (sem prefixo) em mais de um tipo')
        ns=collections.defaultdict(dict)
        for (t,s),v in tot.items(): ns[norm(s)].setdefault(t,[0,0]); ns[norm(s)][t][0]+=v[0]; ns[norm(s)][t][1]+=v[1]
        for s,d in ns.items():
            if len(d)>1: print('  ',s,d)
        print(f'\n######## {canal}: mensal dos subtipos de papeleira/caçamba/contêiner')
        for (t,s) in sorted(tot):
            if re.search(r'PAPELEIRA|CA[ÇC]AMBA|CONT[ÊE]INER',str(s)):
                print('  ',t,'|',s); print('     ',[(m[:3],mes[(t,s)][m][0],mes[(t,s)][m][1]) for m in MESES])
        out[canal]={'tot':{f'{t}||{s}':v for (t,s),v in tot.items()},'mes':{f'{t}||{s}':{m:mes[(t,s)][m] for m in MESES} for (t,s) in tot}}
    json.dump(out,open(sys.argv[3],'w'),ensure_ascii=False)

def congelado(argv):
    import openpyxl,sys,collections,re,json,os
    D=sys.argv[1]
    def rows(f,sh):
        wb=openpyxl.load_workbook(os.path.join(D,f),read_only=True,data_only=True); return list(wb[sh].iter_rows(values_only=True))
    pat=lambda s: bool(re.search(r'PAPELEIRA',str(s))) and bool(re.search(r'INSTALA|RETIRADA',str(s)))
    res={}
    # chamados JUL: Dados (Tipo,Sub,Ger,Bairro,Mes,AP,2025,2026,Chave,TipoP,SubP,Periodo)
    def acc(key,mes,tipo_o,sub_o,tipo_p,sub_p,a,b):
        d=res.setdefault(key,{}).setdefault(mes,collections.Counter())
        a=int(a or 0); b=int(b or 0)
        if tipo_p=='LIMPEZA':
            d['limp_pub_25']+=a; d['limp_pub_26']+=b
            if pat(sub_o): d['imp_em_limp_25']+=a; d['imp_em_limp_26']+=b
        if tipo_o=='PAPELEIRA': d['tipo_pap_orig_25']+=a; d['tipo_pap_orig_26']+=b
        if tipo_p=='PAPELEIRA': d['pap_pub_25']+=a; d['pap_pub_26']+=b
    for r in rows('BASE_CH_JUL2026.xlsx','Dados')[1:]:
        if not r[0]: continue
        acc('CH_JUL',r[4],r[0],r[1],r[9],r[10],r[6],r[7])
    for f,k in [('BASE_CH_AGO2026.xlsx','CH_AGO'),('BASE_CH_SET2026_POS.xlsx','CH_SET')]:
        for r in rows(f,'Dados_Mes')[1:]:
            if not r[0]: continue
            acc(k,r[4],r[0],r[1],r[9],r[10],r[6],r[7])
    # ouvidorias JUL: Dados (Tipo,Sub,Mes,Ger,Bairro,AP,2025,2026,SubNorm,Oper,JanJul)
    for r in rows('BASE_OUV_JUL2026.xlsx','Dados')[1:]:
        if not r[0] or r[9]!=1: continue
        acc('OUV_JUL',r[2],r[0],r[1],r[0],r[8],r[6],r[7])
    for f,k in [('BASE_OUV_AGO2026.xlsx','OUV_AGO'),('BASE_OUV_SET2026_POS.xlsm','OUV_SET')]:
        for r in rows(f,'Dados_Mes')[1:]:
            if not r[0] or r[11]!=1: continue
            acc(k,r[2],r[0],r[1],r[0],r[9],r[6],r[7])
    MES=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro']
    for k,v in res.items():
        print('##',k)
        for m in MES:
            if m in v: print('  ',m[:3],dict(v[m]))
    json.dump({k:{m:dict(c) for m,c in v.items()} for k,v in res.items()},open(sys.argv[2],'w'),ensure_ascii=False)

if __name__ == '__main__':
    modo = sys.argv.pop(1)
    {'fonte': fonte, 'congelado': congelado}[modo](sys.argv)
