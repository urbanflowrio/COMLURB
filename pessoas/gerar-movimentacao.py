"""Gera somente agregados. Entradas privadas ficam fora do repositório.
Uso: python pessoas/gerar-movimentacao.py --sipe JSON --setores JSON --desligados XLSX --output JS
JSON SIPE: colunas A:B (id/Registro), D (lotação), M (função), AK (dtexerc), BW (regime), linhas 2:18516.
JSON setores: linhas A:I, sem cabeçalho. As faixas devem acompanhar os limites da fonte mensal.
"""
import argparse, collections, datetime as dt, json
from pathlib import Path
import openpyxl

def date(v):
    if isinstance(v, dt.datetime): return v.date()
    if isinstance(v, dt.date): return v
    if isinstance(v, (int, float)): return (dt.datetime(1899,12,30)+dt.timedelta(days=v)).date()
    raise ValueError('Data ausente ou inválida')

def protect(values):
    # Uma partição não pode deixar apenas uma célula positiva oculta.
    out=[None if 0 < v < 10 else v for v in values]
    hidden=[i for i,v in enumerate(out) if v is None]
    if len(hidden)==1:
        other=[i for i,v in enumerate(out) if v is not None and v>0]
        if other: out[min(other,key=lambda i:out[i])]=None
    return out

def main():
    p=argparse.ArgumentParser()
    for name in ['sipe','setores','desligados','output']: p.add_argument('--'+name,required=True)
    p.add_argument('--referencia',default='2026-10-26')
    a=p.parse_args(); cutoff=dt.date.fromisoformat(a.referencia)
    s=json.loads(Path(a.sipe).read_text()); cad={r[0]:r for r in json.loads(Path(a.setores).read_text()) if r}
    def col(prefix): return next(v for k,v in s.items() if k.startswith(prefix+'2:'))
    ids=col('A'); units=col('D'); starts=col('AK')
    assert len(ids)==len(units)==len(starts)
    rows=list(openpyxl.load_workbook(a.desligados,read_only=True,data_only=True).active.values)
    h=rows.pop(0); exits=[dict(zip(h,r)) for r in rows if any(v is not None for v in r)]
    assert len(exits)==len({int(r['NUMFUNC']) for r in exits}),'Matrículas de desligados repetidas'
    assert len(ids)==len({int(r[1]) for r in ids}),'Matrículas SIPE repetidas'
    events={}; departures=[]; overlap=0
    for i,row in enumerate(ids):
        start=date(starts[i][0]); assert start<=cutoff
        events[(int(row[1]),start)]=(start,units[i][0])
    sipe_ids={int(r[1]) for r in ids}
    for r in exits:
        start,end=date(r['DTEXERC']),date(r['DTVAC']); assert start<=end
        if end>cutoff: continue
        key=(int(r['NUMFUNC']),start)
        if int(r['NUMFUNC']) in sipe_ids: overlap+=1
        if key not in events: events[key]=(start,r['SETOR'])
        departures.append((end,r['SETOR'],r['FORMAVAC']))
    output={'meta':{'referencia_sipe':a.referencia,'ultimo_desligamento':max(x[0] for x in departures).isoformat(),
        'fonte_desligados':'Listagem de Desligados recebida em 29/10/2026','sobreposicoes':overlap,
        'escopo':'Todos os vínculos presentes nas fontes, inclusive estágios e cargos de confiança.',
        'minimo':10},'anos':{}}
    for year in range(2018,cutoff.year+1):
        ent=[r for r in events.values() if r[0].year==year]; sai=[r for r in departures if r[0].year==year]
        count_months=12 if year<cutoff.year else cutoff.month
        months=[]
        for records in (ent,sai):
            counts=collections.Counter(r[0].month for r in records)
            months.append(protect([counts[m] for m in range(1,count_months+1)]))
        # Hierarquia atual identifica códigos, sem presumir a estrutura de anos anteriores.
        nodes={}
        for kind,records in enumerate((ent,sai)):
            for r in records:
                sector=r[1]; c=cad.get(sector)
                directory=(c[2] if len(c)>2 and c[2] else 'Sem correspondência') if c else 'Sem correspondência'
                n1=(c[3] if len(c)>3 and c[3] else 'Vinculação direta') if c else 'Sem correspondência'
                path=[directory,directory+' / '+n1,directory+' / '+n1+' / '+sector]
                for depth,key in enumerate(path):
                    if key not in nodes: nodes[key]={'id':key,'pai':path[depth-1] if depth else '', 'nome':[directory,n1,sector][depth],'nivel':depth,'v':[0,0]}
                    nodes[key]['v'][kind]+=1
        # Supressão primária e complementar em cada partição da árvore.
        children=collections.defaultdict(list)
        for n in nodes.values(): children[n['pai']].append(n)
        for metric in range(2):
            for group in children.values():
                vals=protect([n['v'][metric] for n in group])
                for n,v in zip(group,vals): n['v'][metric]=v
            # Quando um total é oculto, seus descendentes também ficam ocultos.
            for n in sorted(nodes.values(),key=lambda n:n['nivel']):
                if n['pai'] and nodes[n['pai']]['v'][metric] is None: n['v'][metric]=None
        reasons=collections.Counter(r[2] for r in sai)
        names=sorted(reasons,key=lambda k:-reasons[k]); vals=protect([reasons[k] for k in names])
        output['anos'][str(year)]={'entradas':len(ent),'saidas':len(sai),'meses':[{'mes':m+1,'entradas':months[0][m],'saidas':months[1][m]} for m in range(count_months)],
            'unidades':list(nodes.values()),'motivos':[{'nome':k,'n':v} for k,v in zip(names,vals)]}
        assert sum(collections.Counter(r[0].month for r in ent).values())==len(ent)
        assert sum(collections.Counter(r[0].month for r in sai).values())==len(sai)
    Path(a.output).write_text('/* Somente agregados. Nenhuma matrícula, nome ou CPF. */\nwindow.PESSOAS_MOVIMENTACAO='+json.dumps(output,ensure_ascii=False,separators=(',',':'))+';\n')
    print(json.dumps({'registros_sipe':len(ids),'desligados':len(departures),'sobreposicoes':overlap,'ano_atual':{k:v for k,v in output['anos'][str(cutoff.year)].items() if k in ['entradas','saidas']}},ensure_ascii=False))

if __name__=='__main__': main()
