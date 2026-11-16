"""Recalcula Histórico e Linha do Tempo com os catálogos auditados."""

import json
import sys
from collections import defaultdict

from gerar_cubos import MONTHS, ROOT, load_rows, ratio

FIELDS = ("c2025", "c2026", "o2025", "o2026")
SOURCE = "Extração de 11/11/2026"
PERIODS = {"july": "Julho", "august": "Agosto", "september": "Setembro", "october": "Outubro"}


def counts(values):
    return dict(zip(FIELDS, values))


def comparison(name, values, comparable=True):
    c25, c26, o25, o26 = values
    r25, r26 = ratio(1000 * o25, c25), ratio(1000 * o26, c26)
    return dict(nome=name, **counts(values), cdif=c26-c25, odif=o26-o25,
                cvar=ratio(c26-c25, c25), ovar=ratio(o26-o25, o25),
                rate2025=r25 if comparable else None, rate2026=r26 if comparable else None,
                status="taxa" if comparable and (c25 or c26) else "volume",
                reason="" if comparable else "Volumes por subtipo. O pareamento entre canais requer validação.")


def aggregate(rows, indexes):
    groups = defaultdict(lambda: [0, 0, 0, 0])
    for row, channel in rows:
        key = tuple(row[index] for index in indexes)
        for offset, value in enumerate(row[-1]):
            groups[key][channel * 2 + offset] += value
    return groups


def period(rows, label):
    totals = aggregate(rows, ())[()]
    result = {"meta": {"label": label, **counts(totals), "source": SOURCE,
                       "audit": "Conciliado com a extração histórica"}}
    for dim, indexes in {"tipos": (4,), "subtipos": (4, 5), "aps": (1,),
                         "gerencias": (2,), "bairros": (3,)}.items():
        result[dim] = [
            comparison(" › ".join(key), vals, dim != "subtipos")
            for key, vals in sorted(aggregate(rows, indexes).items())
        ]
        assert all(sum(item[field] for item in result[dim]) == totals[i]
                   for i, field in enumerate(FIELDS)), dim
    return result


def cascade(rows):
    services = {}
    for (name,), values in aggregate(rows, (4,)).items():
        services[name] = {"summary": dict(nome=name, **counts(values)), "subtipos": {}}
    for (name, subtype), values in aggregate(rows, (4, 5)).items():
        services[name]["subtipos"][subtype] = {
            "summary": dict(nome=subtype, **counts(values)), "bairros": []}
    for (name, subtype, ap, management, district), values in aggregate(rows, (4, 5, 1, 2, 3)).items():
        services[name]["subtipos"][subtype]["bairros"].append(
            dict(nome=district, ap=ap, gerencia=management, **counts(values)))
    return services


def write(path, name, data):
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    (ROOT / path).write_text(f"window.{name}={payload};\n", encoding="utf-8")


def main(calls, complaints):
    rows = [(row, 0) for row in load_rows(calls, "CHAMADOS", False)]
    rows.extend((row, 1) for row in load_rows(complaints, "OUVIDORIAS", True))
    monthly_rows = {month: [item for item in rows if item[0][0] == month] for month in MONTHS}
    monthly = []
    for month, subset in monthly_rows.items():
        totals = aggregate(subset, ())[()]
        rg = aggregate(subset, (4,))["Remoção gratuita",]
        total_record = comparison(month, totals)
        rg_record = comparison(month, rg)
        monthly.append(dict(mes=month, **counts(totals), cv=total_record["cvar"], ov=total_record["ovar"],
                            r2025=total_record["rate2025"], r2026=total_record["rate2026"],
                            **{"rg_" + f: value for f, value in counts(rg).items()},
                            rg_r2025=rg_record["rate2025"], rg_r2026=rg_record["rate2026"]))
    total = aggregate(rows, ())[()]
    assert total == [245647, 278807, 28192, 32587]
    assert [monthly[-1][f] for f in FIELDS] == [21652, 24120, 2697, 2267]
    periods = {key: period(monthly_rows[month], month + "/2026") for key, month in PERIODS.items()}
    periods["accumulated"] = period(rows, "Jan–Out/2026")
    full = {month + "/2026": cascade(subset) for month, subset in monthly_rows.items()}
    # Acumulado usa as mesmas linhas de origem dos dez recortes mensais.
    full["Jan–Out/2026"] = cascade(rows)
    for services in full.values():
        for service in services.values():
            for field in FIELDS:
                assert sum(sub["summary"][field] for sub in service["subtipos"].values()) == service["summary"][field]
                for sub in service["subtipos"].values():
                    assert sum(item[field] for item in sub["bairros"]) == sub["summary"][field]
    path = "1746-historico/data.js"
    original = (ROOT / path).read_text(encoding="utf-8").split("=", 1)[1].strip().rstrip(";")
    history = json.loads(original)
    history.update(totals=counts(total), monthly=monthly, periods=periods,
                   preserved=[{"mes": month[:3] + "/26", "c": row["c2026"], "o": row["o2026"]}
                              for month, row in zip(MONTHS, monthly)][6:],
                   governance=[
                       "Janeiro a outubro foram recalculados com a extração de 11/11/2026. Novembro parcial está fora.",
                       "Chamados excluem as marcações OUV. Ouvidorias operacionais excluem PCO.",
                       "As APs originalmente nulas em Chamados foram atribuídas à AP3 conforme o cadastro territorial auditado.",
                       "As taxas por subtipo dependem da validação do pareamento entre canais.",
                   ])
    history["meta"]["cutoff"] = SOURCE
    history["meta"]["october"] = "Prévia para homologação"
    history["meta"]["standardization"] = "Catálogos aprovados da extração de 11/11/2026"
    history["matrix"] = [[month[:3], "Taxa", "Taxa", "Taxa", "Taxa", "Taxa", "Volume"]
                         for month in PERIODS.values()]
    write(path, "HIST1746_V4", history)
    write("1746-timeline/data.js", "TIMELINE1746_DATA",
          {"meta": {"cutoff": "11/11/2026", "source": SOURCE}, "monthly": monthly,
           "accumulated": periods["accumulated"], "periods": periods})
    write("1746-timeline/cascade_data.js", "TIMELINE1746_CASCADE", {"full": full, "monthly": {}})


if __name__ == "__main__":
    main(*sys.argv[1:])
