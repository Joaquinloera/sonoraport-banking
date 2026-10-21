#!/usr/bin/env python3
"""Audit an official FDIC BankFind CSV export without sampling or dropping rows.
Usage: python tools/audit_fdic_registry.py institutions.csv > fdic-audit.json
Read-only; does not expose accounts or connect to payment systems.
"""
import csv, json, sys, hashlib
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

def main(path):
    p=Path(path)
    digest=hashlib.sha256(p.read_bytes()).hexdigest()
    with p.open(encoding="utf-8-sig",newline="") as f:
        reader=csv.DictReader(f)
        fields=reader.fieldnames or []
        records=list(reader)
    if not fields:
        raise SystemExit("ERROR: no CSV header")
    normalized={k.upper().strip():k for k in fields}
    id_key=next((normalized[x] for x in ("CERT","CERTIFICATE","FDIC_CERT") if x in normalized),None)
    if not id_key:
        raise SystemExit("ERROR: no FDIC CERT column; cannot reconcile unique institutions")
    certs=[(r.get(id_key) or "").strip() for r in records]
    counts=Counter(x for x in certs if x)
    report={
      "scope":"Rows in supplied official FDIC CSV; not all US financial institutions",
      "source_file":p.name,"sha256":digest,
      "audited_at_utc":datetime.now(timezone.utc).isoformat(),
      "row_count":len(records),"column_names":fields,
      "fdic_cert_field":id_key,"unique_nonempty_cert_count":len(counts),
      "missing_cert_rows":sum(not x for x in certs),
      "duplicate_cert_values":{k:v for k,v in counts.items() if v>1},
      "blank_field_counts":{k:sum(not (r.get(k) or "").strip() for r in records) for k in fields},
      "complete":len(records)>0 and all(certs) and not any(v>1 for v in counts.values()),
      "caveat":"Completeness here means internal file integrity only. Independently reconcile count and as-of date with FDIC source."
    }
    print(json.dumps(report,indent=2))
    if not report["complete"]: sys.exit(2)
if __name__=="__main__":
    if len(sys.argv)!=2: raise SystemExit("Usage: python tools/audit_fdic_registry.py institutions.csv")
    main(sys.argv[1])
