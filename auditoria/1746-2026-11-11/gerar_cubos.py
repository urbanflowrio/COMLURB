"""Gera os cubos de revisão a partir das duas planilhas históricas auditadas."""

import csv
import json
import sys
from collections import defaultdict
from pathlib import Path

from openpyxl import load_workbook

AUDIT = Path(__file__).resolve().parent
ROOT = AUDIT.parents[1]
MONTHS = "Janeiro Fevereiro Março Abril Maio Junho Julho Agosto Setembro Outubro".split()
PERIODS = {"acumulado": MONTHS, "setembro": ["Setembro"], "outubro": ["Outubro"]}


def load_rows(path, catalog_name, operational):
    with (AUDIT / f"CATALOGO_{catalog_name}_1746.csv").open(encoding="utf-8") as source:
        catalog = {
            (row["tipo_original"], row["subtipo_original"]): row
            for row in csv.DictReader(source, delimiter=";")
        }
    book = load_workbook(path, read_only=True, data_only=True)
    try:
        rows = book.active.values
        headers = next(rows)
        for cells in rows:
            if not cells[0] or cells[0] == "Total Geral":
                continue
            row = dict(zip(headers, cells))
            month = row["Mês Solicitação"]
            values = tuple(int(row[year] or 0) for year in (2025, 2026))
            if month not in MONTHS or not any(values):
                continue
            management = row["Gerência"]
            if operational and management == "PCO":
                continue
            label = catalog[row["Tipo"], row["SubTipo"]]
            if label["tratamento"] == "EXCLUIR_OUV":
                continue
            ap = row["AP"]
            # Os Nulo desta extração foram conciliados com AP3 no parecer.
            if not operational and ap == "Nulo":
                ap = "AP3"
            yield month, ap, management, row["Bairro"], label["tipo_hub"], label["subtipo_hub"], values
    finally:
        book.close()


def ratio(numerator, denominator):
    return numerator / denominator if denominator else None


def metric(label, values, field="nome"):
    previous, current = values
    return {
        field: label,
        "v2025": previous,
        "v2026": current,
        "dif": current - previous,
        "var": ratio(current - previous, previous),
    }


def summarize(rows, months, child_index=None):
    counts = defaultdict(lambda: defaultdict(lambda: [0, 0]))
    totals = [0, 0]
    dimensions = ("mensal", "ap", "gerencias", "bairros")
    for row in rows:
        keys = list(zip(dimensions, row[:4]))
        if child_index is not None:
            keys.append(("children", row[child_index]))
        for index, value in enumerate(row[-1]):
            totals[index] += value
            for dimension, key in keys:
                counts[dimension][key][index] += value
    previous, current = totals
    change = current - previous
    summary = {
        "total2025": previous,
        "total2026": current,
        "dif": change,
        "var": ratio(change, previous),
        "mensal": [metric(month, counts["mensal"][month], "mes") for month in months],
    }
    for dimension in (*dimensions[1:], "children"):
        records = []
        for name, values in counts[dimension].items():
            item = metric(name, values)
            item.update(contrib=ratio(item["dif"], change), part=ratio(item["v2026"], current))
            records.append(item)
        summary[dimension] = sorted(records, key=lambda item: (-item["v2026"], item["nome"]))
        if dimension != "children" or child_index is not None:
            for index, field in enumerate(("v2025", "v2026")):
                assert sum(item[field] for item in records) == totals[index], dimension
    return summary


def build_cube(rows):
    periods = {}
    for period, months in PERIODS.items():
        subset = [row for row in rows if row[0] in months]
        types = defaultdict(list)
        for row in subset:
            types[row[4]].append(row)
        by_type = {}
        by_subtype = {}
        for name, type_rows in types.items():
            by_type[name] = summarize(type_rows, months, 5)
            subtypes = defaultdict(list)
            for row in type_rows:
                subtypes[row[5]].append(row)
            by_subtype[name] = {
                subtype: summarize(subtype_rows, months)
                for subtype, subtype_rows in subtypes.items()
            }
        periods[period] = {
            "all": summarize(subset, months, 4),
            "byTipo": by_type,
            "byTipoSubtipo": by_subtype,
        }
    return {"periods": periods, "types": sorted(periods["acumulado"]["byTipo"])}


def main(calls, complaints):
    specs = [
        (calls, "CHAMADOS", "chamados-1746/chamados_cube.js", ((245647, 278807), (21652, 24120))),
        (complaints, "OUVIDORIAS", "ouvidoria/ouvidoria_cube.js", ((28192, 32587), (2697, 2267))),
    ]
    outputs = {}
    for source, channel, path, expected in specs:
        cube = build_cube(list(load_rows(source, channel, channel == "OUVIDORIAS")))
        for period, totals in zip(("acumulado", "outubro"), expected):
            row = cube["periods"][period]["all"]
            assert (row["total2025"], row["total2026"]) == totals, (channel, period, row["total2025"], row["total2026"])
        variable = "OUVIDORIA" if channel == "OUVIDORIAS" else channel
        payload = json.dumps(cube, ensure_ascii=False, separators=(",", ":"))
        outputs[path] = f"window.{variable}_CUBE={payload};\n"
    for path, content in outputs.items():
        (ROOT / path).write_text(content, encoding="utf-8")


if __name__ == "__main__":
    main(*sys.argv[1:])
