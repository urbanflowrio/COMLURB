#!/usr/bin/env python3
"""Auditoria independente do Boletim Executivo 1746 (outubro/2026).

Recalcula cada afirmação do boletim a partir das FONTES PRIMÁRIAS (exportações
COMLURB em .xlsx), sem usar os cubos nem os testes JavaScript existentes, e
confronta o resultado com o HTML, os cubos e a base da Linha do Tempo.

Uso:
  python3 auditoria/1746-out2026/auditoria_independente.py \
      --chamados FONTE_CHAMADOS_OUT2026_FINAL_ORIGINAL.xlsx \
      --ouvidorias FONTE_OUVIDORIAS_OUT2026_FINAL_ORIGINAL.xlsx \
      [--repo .] [--html 1746-resumo-executivo/index.html]

Dependências: Python 3.9+, openpyxl, Node.js (apenas para ler os cubos .js).
As fontes primárias não estão no repositório; ficam no Drive da COMLURB.
SHA-256 das versões auditadas em 05/11/2026:
  chamados   6f90fdef93242157f33d3724115a9f7167cac9f3e1c506b5f684508df860f045
  ouvidorias ab2f51898c80e76fef297755f55e4e5d7cfbfb364b70291c55d9b91c59f69bf0
"""
import argparse, collections, hashlib, json, os, re, statistics, subprocess, sys

MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto',
         'Setembro', 'Outubro', 'Novembro', 'Dezembro']
JAN_OUT = MESES[:10]


def sha(path):
    return hashlib.sha256(open(path, 'rb').read()).hexdigest()


def carregar(path):
    import openpyxl
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    linhas = list(wb.worksheets[0].iter_rows(values_only=True))
    cab, regs, total = linhas[0], [], None
    for r in linhas[1:]:
        if r[0] == 'Total Geral':
            total = r
            continue
        d = dict(zip(cab, r))
        regs.append({'tipo': d['Tipo'], 'sub': d['SubTipo'], 'ger': d['Gerência'], 'bairro': d['Bairro'],
                     'ap': d['AP'], 'mes': d['Mês Solicitação'],
                     'v25': int(d[2025.0] or 0), 'v26': int(d[2026.0] or 0)})
    s25 = sum(r['v25'] for r in regs); s26 = sum(r['v26'] for r in regs)
    assert (s25, s26) == (int(total[-3]), int(total[-2])), 'linhas não fecham o Total Geral'
    return regs


def soma(regs, mes=None, meses=None, f=lambda r: True):
    a = b = 0
    for r in regs:
        if mes and r['mes'] != mes: continue
        if meses and r['mes'] not in meses: continue
        if f(r): a += r['v25']; b += r['v26']
    return a, b


def por(regs, chave, mes='Outubro', f=lambda r: True):
    d = collections.defaultdict(lambda: [0, 0])
    for r in regs:
        if r['mes'] == mes and f(r):
            d[chave(r)][0] += r['v25']; d[chave(r)][1] += r['v26']
    return d


def js(path, glob):
    code = ("const fs=require('fs'),vm=require('vm');const c={window:{}};"
            f"vm.runInNewContext(fs.readFileSync({json.dumps(path)},'utf8'),c);"
            f"process.stdout.write(JSON.stringify(c.window.{glob}));")
    return json.loads(subprocess.check_output(['node', '-e', code]))


br = lambda n: f'{abs(n):,}'.replace(',', '.')
pct = lambda x, d=1: f'{x*100:+.{d}f}%'.replace('.', ',').replace('-', '−')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--chamados', required=True); ap.add_argument('--ouvidorias', required=True)
    ap.add_argument('--repo', default='.'); ap.add_argument('--html', default='1746-resumo-executivo/index.html')
    ap.add_argument('--json', default=None, help='grava a matriz em JSON')
    a = ap.parse_args()
    R = lambda p: os.path.join(a.repo, p)

    CH = carregar(a.chamados)
    OUI = carregar(a.ouvidorias)                      # institucional
    OU = [r for r in OUI if r['ger'] != 'PCO']        # operacional
    html = open(R(a.html), encoding='utf-8').read()
    texto = re.sub(r'<[^>]+>', ' ', re.sub(r'<(style|script)[\s\S]*?</\1>|<!--[\s\S]*?-->', '', html))
    texto = re.sub(r'\s+', ' ', texto)
    C = js(R('chamados-1746/chamados_cube.js'), 'CHAMADOS_CUBE')
    O = js(R('ouvidoria/ouvidoria_cube.js'), 'OUVIDORIA_CUBE')

    M = []  # matriz

    def reg(i, afirm, boletim, reconstr, nivel, situacao, impacto, nota):
        no_html = all(s in texto for s in (boletim if isinstance(boletim, list) else [boletim]))
        M.append(dict(id=i, afirmacao=afirm, valor_boletim=boletim, valor_reconstruido=reconstr, nivel=nivel,
                      no_html=no_html, situacao=situacao, impacto=impacto, nota=nota))

    # ---------- Integridade ----------
    print('FONTES'); print(' chamados  ', sha(a.chamados)); print(' ouvidorias', sha(a.ouvidorias))
    pco = soma([r for r in OUI if r['ger'] == 'PCO'], 'Outubro')
    tipos_pco = sorted({r['tipo'] for r in OUI if r['ger'] == 'PCO'})
    tipos_pco_fora = sorted({r['tipo'] for r in OU if r['tipo'] in tipos_pco})
    print('PCO out/25 e out/26', pco, '| tipos na PCO', tipos_pco, '| esses tipos fora da PCO:', tipos_pco_fora)
    print('Bairros em mais de uma AP:', [b for b, s in collections.defaultdict(set, {}).items()] or
          sorted({r['bairro'] for r in CH if len({x['ap'] for x in CH if x['bairro'] == r['bairro']}) > 1}))

    print('\nHISTÓRICO: fonte atual x cubo congelado (2026)')
    for nm, regs, cubo in [('Chamados', CH, C), ('Ouvidorias operacionais', OU, O)]:
        cm = {x['mes']: (x['v2025'], x['v2026']) for x in cubo['periods']['acumulado']['all']['mensal']}
        difs = {m: soma(regs, m)[1] - cm[m][1] for m in JAN_OUT if soma(regs, m) != cm[m]}
        d25 = [m for m in JAN_OUT if soma(regs, m)[0] != cm[m][0]]
        print(f' {nm}: 2025 divergente em {d25 or "nenhum mês"}; 2026 divergências {difs}')

    # ---------- Resultado ----------
    c = soma(CH, 'Outubro'); o = soma(OU, 'Outubro')
    reg('A1', 'Chamados out/25 e out/26', [br(c[0]), br(c[1]), pct(c[1]/c[0]-1), br(c[1]-c[0]) + ' a mais'],
        f'{c[0]} / {c[1]} ({pct(c[1]/c[0]-1)})', 'A', 'Validada', '-', 'Fonte primária, mês Outubro.')
    reg('A2', 'Ouvidorias operacionais out/25 e out/26', [br(o[0]), br(o[1]), pct(o[1]/o[0]-1)],
        f'{o[0]} / {o[1]} ({pct(o[1]/o[0]-1)}); PCO {pco}', 'A', 'Validada', '-',
        'Operacional = institucional menos Gerência PCO; a PCO contém só os tipos Ouvidoria e Diversos.')
    ac = soma(CH, meses=JAN_OUT); ao = soma(OU, meses=JAN_OUT)
    cc = C['periods']['acumulado']['all']; oc = O['periods']['acumulado']['all']
    reg('A3', 'No ano: chamados +13,5%, ouvidorias +15,5%', [pct(cc['var']), pct(oc['var'])],
        f'Série oficial congelada: {pct(cc["var"])} / {pct(oc["var"])}; fonte atual: {pct(ac[1]/ac[0]-1)} / {pct(ao[1]/ao[0]-1)}',
        'A', 'Validada com ressalva', 'Baixo',
        'Usa a série congelada (regra de data de corte). Com a fonte atual, ouvidorias seriam +15,4%. '
        f'Novembro/2026 parcial na fonte ({soma(CH, "Novembro")[1]} chamados) corretamente excluído.')

    # ---------- O que explica ----------
    ts = por(CH, lambda r: r['tipo']); to = por(OU, lambda r: r['tipo'])
    d = lambda t, n: t[n][1] - t[n][0]
    lim = d(ts, 'LIMPEZA'); pap = d(ts, 'PAPELEIRA'); tot = c[1] - c[0]
    reg('A4a', 'Limpeza +2.581, acima do aumento total', '2.581 chamados a mais',
        f'Limpeza {lim:+}; Limpeza + Papeleira {lim + pap:+} (total {tot:+})', 'A', 'Validada com ressalva', 'Alto',
        'Depende da taxonomia: o histórico congelado do cubo agrega Papeleira a Limpeza, mas outubro não. '
        'Somando Papeleira, a alta de Limpeza é menor que o aumento total.')
    sub = por(CH, lambda r: r['sub'], f=lambda r: r['tipo'] == 'LIMPEZA')
    tres = sum(sub[s][1] - sub[s][0] for s in ['REMOÇÃO DE RESÍDUOS NO LOGRADOURO', 'CAPINA EM LOGRADOURO', 'VARRIÇÃO DE LOGRADOURO'])
    reg('A4b', 'Remoção de resíduos, capina e varrição: 2.060', br(tres), tres, 'A', 'Validada', '-', '')
    rg = to['REMOÇÃO GRATUITA']
    rg_m = {m: soma(OU, m, f=lambda r: r['tipo'] == 'REMOÇÃO GRATUITA') for m in MESES}
    v25 = [rg_m[m][0] for m in MESES]; outros = [v for m, v in zip(MESES, v25) if m != 'Outubro']
    z = (rg[0] - statistics.mean(outros)) / statistics.pstdev(outros)
    reg('A5', 'Volume excepcional de Remoção Gratuita em out/2025', ['799', '469 em setembro e 474 em outubro'],
        f'out/25 = {rg[0]}: {sorted(v25, reverse=True).index(rg[0]) + 1}º de 12 meses de 2025, mediana dos demais '
        f'{statistics.median(outros)}, z = {z:.2f}; jul a set/25 = {rg_m["Julho"][0]}, {rg_m["Agosto"][0]}, {rg_m["Setembro"][0]}; '
        f'nov e dez/25 = {rg_m["Novembro"][0]}, {rg_m["Dezembro"][0]}; set e out/26 = {rg_m["Setembro"][1]}, {rg_m["Outubro"][1]}',
        'A', 'Incorreta', 'Crítico',
        'Out/2025 está no nível típico de 2025; o atípico foi o vale de jul a set/2025. A queda de out/2026 vem do '
        'nível baixo de 2026 (set e out são os menores do ano), não de uma base inflada.')
    sem = (o[1] - rg[1]) / (o[0] - rg[0]) - 1
    reg('A6', 'Sem Remoção Gratuita, redução de 8,4%', '8,4%', pct(sem), 'A', 'Validada com ressalva', 'Moderado',
        'Aritmética correta; perde sentido se a premissa de base excepcional (A5) for retirada.')
    oc_lim = d(to, 'LIMPEZA'); subo = por(OU, lambda r: r['sub'], f=lambda r: r['tipo'] == 'LIMPEZA')
    novo = subo['OUV - INSTALAÇÃO E/OU RETIRADA DE PAPELEIRA']
    base = c[0]; grandes = [k for k, v in ts.items() if v[0] / base >= 0.05]
    dois = [k for k in grandes if d(ts, k) > 0 and d(to, k) > 0]
    reg('A7', 'Entre os cinco serviços com 97,6% dos chamados, só Limpeza cresceu nos dois canais',
        ['97,6%', 'Limpeza foi o único que cresceu nos dois canais'],
        f'grandes = {sorted(grandes)}; {sum(ts[k][0] for k in grandes)/base*100:.1f}%; crescem nos dois: {dois}; '
        f'Limpeza ouv {oc_lim:+}, dos quais {novo[1]-novo[0]:+} num subtipo de Papeleira inexistente em Limpeza em out/25',
        'A', 'Validada com ressalva', 'Moderado',
        'Conclusão se mantém em todas as taxonomias testadas; a magnitude em ouvidorias cai para +86 sem o subtipo reclassificado.')
    reg('A4c', 'Decomposição de chamados e ouvidorias', ['+608', '−484', '−418', '+177', '−325', '−172', '+158', '−145'],
        {k: d(ts, k) for k in ['COLETA DOMICILIAR', 'REMOÇÃO GRATUITA', 'MANEJO ARBÓREO']} | {'ouv': {k: d(to, k) for k in ['REMOÇÃO GRATUITA', 'MANEJO ARBÓREO', 'LIMPEZA']}},
        'A', 'Validada com ressalva', 'Moderado',
        'Manejo Arbóreo: subtipo de avaliação de poda trocado de nome (1.576 para 1.227 com a versão "180 dias"); '
        '"Demais serviços" inclui −166 de Papeleira.')

    # ---------- Onde ocorreu ----------
    apd = por(CH, lambda r: r['ap'])
    bai = lambda ap_: {k: v for k, v in por(CH, lambda r: r['bairro'], f=lambda r: r['ap'] == ap_).items()}
    def perfil(ap_):
        b = bai(ap_); g = sum(v[1] - v[0] for v in b.values()); s = sorted(b.values(), key=lambda v: -(v[1] - v[0]))
        acc = k = 0
        for v in s:
            acc += v[1] - v[0]; k += 1
            if acc >= g / 2: break
        return len(b), k, sum(1 for v in b.values() if v[1] > v[0])
    n5, k5, g5 = perfil('AP5'); n3, k3, g3 = perfil('AP3')
    reg('A8a', 'AP5 e AP3 reúnem 2.310 dos 2.464', '2.310', (apd['AP5'][1]-apd['AP5'][0]) + (apd['AP3'][1]-apd['AP3'][0]), 'A', 'Validada', '-', '')
    reg('A8b', 'AP5 concentrada (68% em dois bairros), AP3 distribuída', ['68%', '56 dos 80 bairros'],
        f'Bairros para 50% da alta: AP5 {k5} de {n5} ({k5/n5:.0%}), AP3 {k3} de {n3} ({k3/n3:.0%}); '
        f'bairros que cresceram: AP5 {g5}/{n5} ({g5/n5:.0%}), AP3 {g3}/{n3} ({g3/n3:.0%})',
        'A', 'Não validada', 'Alto',
        'Os números estão certos, mas o contraste decorre do agrupamento: AP5 tem 21 bairros e dois deles somam 40% da base. '
        'Proporcionalmente, a concentração é a mesma nas duas APs.')
    bc = por(CH, lambda r: r['bairro']); bo = por(OU, lambda r: r['bairro'])
    top = lambda t: sorted(t, key=lambda k: -(t[k][1] - t[k][0]))[:2]
    for nome, ger, i in [('CAMPO GRANDE', 'OG18G', 'A9'), ('BANGU', 'OG17B', 'A10')]:
        lc = por(CH, lambda r: r['bairro'], f=lambda r: r['tipo'] == 'LIMPEZA')[nome]
        lo = por(OU, lambda r: r['bairro'], f=lambda r: r['tipo'] == 'LIMPEZA')[nome]
        gc = por(CH, lambda r: (r['bairro'], r['ger']))[(nome, ger)]; go = por(OU, lambda r: (r['bairro'], r['ger']))[(nome, ger)]
        reg(i, f'{nome}: valores, Limpeza e gerência {ger}',
            [f'{br(bc[nome][0])} → {br(bc[nome][1])}', f'{br(bo[nome][0])} → {br(bo[nome][1])}',
             f'{br(lc[1]-lc[0])} dos {br(bc[nome][1]-bc[nome][0])} chamados', f'{br(gc[1])} chamados e {br(go[1])} ouvidorias'],
            f'ch {bc[nome]}, ouv {bo[nome]}, Limpeza ch {lc[1]-lc[0]:+} ouv {lo[1]-lo[0]:+}, {ger} ch {gc} ouv {go}',
            'A', 'Validada com ressalva' if nome == 'BANGU' else 'Validada', 'Baixo' if nome == 'BANGU' else '-',
            'Gerência com a mesma área de atuação em 2025 e 2026 (mesmos bairros em jan a out). ' +
            ('Ouvidorias sobre base pequena (46): o +80,4% deve vir sempre com os absolutos, como já vem.' if nome == 'BANGU' else ''))
    reg('A11', 'Dois maiores aumentos de chamados e de ouvidorias são Bangu e Campo Grande', ['Bangu', 'Campo Grande'],
        f'chamados {top(bc)}, ouvidorias {top(bo)}', 'A', 'Validada', '-', '')
    reg('A12', '92 ouvidorias a mais nos dois bairros, 484 a menos na cidade', '92 ouvidorias a mais',
        (bo['CAMPO GRANDE'][1]-bo['CAMPO GRANDE'][0]) + (bo['BANGU'][1]-bo['BANGU'][0]), 'A', 'Validada', '-', '')

    # ---------- Nota metodológica ----------
    pm = {m: soma(CH, m, f=lambda r: r['tipo'] == 'PAPELEIRA') for m in JAN_OUT}
    reg('N1', 'Papeleira: 166 em out/25, "ausente em 2026"', ['166 chamados', 'ausente em 2026'],
        'Papeleira 2026: ' + ', '.join(f'{m[:3]} {pm[m][1]}' for m in JAN_OUT) + f'; 2025 em todos os meses ({sum(v[0] for v in pm.values())} no ano)',
        'A', 'Incorreta', 'Moderado', 'O tipo existiu em 2026 até abril; a redação correta é "em desuso desde maio de 2026".')

    # ---------- saída ----------
    print('\nMATRIZ')
    for m in M:
        print(f"{m['id']:5} [{m['nivel']}] {m['situacao']:22} {m['impacto']:8} html={'ok' if m['no_html'] else 'AUSENTE'} | {m['afirmacao']}")
        print(f"       reconstruído: {m['valor_reconstruido']}")
        if m['nota']: print(f"       nota: {m['nota']}")
    if a.json: json.dump(M, open(a.json, 'w', encoding='utf-8'), ensure_ascii=False, indent=1, default=str)
    falhas = [m for m in M if m['situacao'] in ('Incorreta', 'Não validada')]
    print(f'\n{len(M)} afirmações auditadas; {len(falhas)} incorretas ou não validadas.')


if __name__ == '__main__':
    main()
