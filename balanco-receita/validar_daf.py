#!/usr/bin/env python3
"""Validação independente do arquivo estático DAF. Python 3, sem dependências."""
import argparse
import json
import math
from collections import Counter, defaultdict
from pathlib import Path

MONTHS = {"jan": 1, "fev": 2, "mar": 3, "abr": 4, "mai": 5, "jun": 6,
          "jul": 7, "ago": 8, "set": 9, "out": 10, "nov": 11, "dez": 12}

def read(path):
    raw = Path(path).read_text(encoding="utf-8").strip()
    prefix = "window.DAF_DATA="
    if not raw.startswith(prefix):
        raise ValueError("Arquivo não começa com window.DAF_DATA=")
    return json.loads(raw[len(prefix):].rstrip(";"))

def money_sum(rows, key):
    return round(sum(float(x.get(key, 0) or 0) for x in rows), 2)

def check(data):
    errors = []
    records = data.get("registros") or []
    details = data.get("faturamentoDetalhado") or []
    months = data.get("faturamentoMensal") or []
    summary = data.get("resumo") or {}
    if not records: errors.append("registros vazios")
    if not details: errors.append("faturamentoDetalhado vazio")
    if not months: errors.append("faturamentoMensal vazio")
    for i, r in enumerate(records):
        for field in ("secretaria", "servico", "unidade", "ano", "mes", "debito"):
            if r.get(field) is None or r.get(field) == "":
                errors.append(f"registros[{i}]: campo obrigatório ausente {field}")
        for field in ("bruto", "pago", "debito", "debitoBruto"):
            try:
                if not math.isfinite(float(r.get(field, 0) or 0)):
                    errors.append(f"registros[{i}]: {field} não finito")
            except (ValueError, TypeError):
                errors.append(f"registros[{i}]: {field} não numérico")
    bymonth = defaultdict(float)
    for i, row in enumerate(details):
        try:
            m = int(row["mes"]); value = float(row["valor"])
            if m < 1 or m > 12 or not math.isfinite(value) or value < 0:
                errors.append(f"faturamentoDetalhado[{i}]: mês/valor inválido")
            if not row.get("servico") or not row.get("unidade"):
                errors.append(f"faturamentoDetalhado[{i}]: dimensão vazia")
            bymonth[m] += value
        except (ValueError, TypeError, KeyError):
            errors.append(f"faturamentoDetalhado[{i}]: lançamento inválido")
    declared = defaultdict(float)
    for row in months:
        k = str(row.get("mes","")).lower()[:3]
        if k not in MONTHS:
            errors.append(f"faturamentoMensal: mês inválido {k}")
        else:
            declared[MONTHS[k]] += float(row.get("valor") or 0)
    for m in sorted(set(bymonth) | set(declared)):
        if abs(bymonth[m] - declared[m]) > .03:
            errors.append(f"Mês {m}: detalhado {bymonth[m]:.2f} != série {declared[m]:.2f}")
    amount = money_sum(details, "valor")
    expected = float(summary.get("faturamento") or 0)
    if abs(amount - expected) > .05:
        errors.append(f"Faturamento detalhado {amount:.2f} != resumo {expected:.2f}")
    signatures = Counter((str(r.get("secretaria")), str(r.get("servico")), str(r.get("unidade")),
                          str(r.get("contrato")),str(r.get("ano")),str(r.get("mes")),str(r.get("nf"))) for r in records)
    duplicates = [sig for sig, n in signatures.items() if n > 1]
    # Duplicidades podem ser legítimas, mas exigem análise antes de publicação.
    if duplicates:
        errors.append(f"{len(duplicates)} chaves repetidas (secretaria/serviço/unidade/contrato/ano/mês/NF)")
    report = {"corte": data.get("corte"), "lancamentos": len(records),
              "faturamento_linhas": len(details), "faturamento_bruto": amount,
              "debito_liquido_historico": money_sum(records, "debito"),
              "debito_bruto_historico": money_sum(records, "debitoBruto"),
              "meses": sorted(bymonth), "erros": errors, "aprovado": not errors}
    return report

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("arquivo", nargs="?", default="balanco-receita/inteligencia/data.js")
    p.add_argument("--relatorio", default=None)
    a = p.parse_args()
    report = check(read(a.arquivo))
    output = json.dumps(report, ensure_ascii=False, indent=2)
    print(output)
    if a.relatorio:
        Path(a.relatorio).write_text(output + "\n", encoding="utf-8")
    raise SystemExit(0 if report["aprovado"] else 1)
