#!/usr/bin/env python3
"""Build 02: full public FDIC institution/location API ingestion, paginated JSONL.
No cardholder data, credentials or bank transaction endpoints.
Usage: python3 tools/ingest_fdic_public.py --output-dir data/fdic-public
"""
import argparse, datetime, hashlib, json, pathlib, time, urllib.parse, urllib.request

BASE = "https://banks.data.fdic.gov/api"
DATASETS = ("institutions", "locations")

def request_page(dataset, offset, limit, retries=4):
    params = urllib.parse.urlencode({"limit": limit, "offset": offset, "format": "json"})
    url = f"{BASE}/{dataset}?{params}"
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "SonoraPort-PublicBankingRegistry/2.0", "Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=60) as response:
                return json.load(response), url
        except Exception:
            if attempt == retries - 1:
                raise
            time.sleep(min(2 ** attempt, 15))

def ingest(dataset, directory, limit):
    path = directory / f"fdic_{dataset}.jsonl"
    temp = directory / f"fdic_{dataset}.jsonl.part"
    count = 0
    expected = None
    sha = hashlib.sha256()
    with temp.open("wb") as out:
        while True:
            payload, url = request_page(dataset, count, limit)
            rows = payload.get("data")
            if not isinstance(rows, list):
                raise ValueError(f"{dataset}: missing data array at offset {count}: {url}")
            total = payload.get("meta", {}).get("total")
            if total is not None:
                if expected is not None and int(total) != expected:
                    raise ValueError(f"{dataset}: source total changed during extraction")
                expected = int(total)
            for row in rows:
                line = (json.dumps(row, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n").encode("utf-8")
                out.write(line)
                sha.update(line)
            count += len(rows)
            print(f"{dataset}: extracted {count} / {expected if expected is not None else '?'}", flush=True)
            if expected is not None and count >= expected:
                break
            if not rows:
                if expected is not None and count != expected:
                    raise ValueError(f"{dataset}: incomplete {count}/{expected}")
                break
            if len(rows) < limit and expected is None:
                break
    if expected is not None and count != expected:
        raise ValueError(f"{dataset}: count mismatch {count}/{expected}")
    temp.replace(path)
    return {"dataset": dataset, "records": count, "source_total": expected, "sha256": sha.hexdigest(), "path": str(path), "source": f"{BASE}/{dataset}", "retrieved_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(), "status": "complete" if expected is not None and count == expected else "count_unverified"}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", default="data/fdic-public")
    parser.add_argument("--page-size", type=int, default=1000)
    parser.add_argument("--dataset", choices=("all",) + DATASETS, default="all")
    args = parser.parse_args()
    if not 1 <= args.page_size <= 10000:
        parser.error("page-size must be 1..10000")
    directory = pathlib.Path(args.output_dir)
    directory.mkdir(parents=True, exist_ok=True)
    datasets = DATASETS if args.dataset == "all" else (args.dataset,)
    results = [ingest(dataset, directory, args.page_size) for dataset in datasets]
    (directory / "manifest.json").write_text(json.dumps({"schemaVersion": "1.0", "results": results}, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
