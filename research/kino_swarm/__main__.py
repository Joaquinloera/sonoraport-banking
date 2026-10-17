#!/usr/bin/env python3
"""KINO SWARM: bounded, auditable concurrent public-registry ingestion.

Usage: python -m kino_swarm --output data/banks.jsonl --limit 10000
No credentials, payment execution, or private endpoints required.
"""
import argparse
import concurrent.futures
import json
import pathlib
import time
import urllib.parse
import urllib.request

FDIC_API = "https://api.fdic.gov/banks/institutions"
FIELDS = "CERT,NAME,CITY,STALP,ACTIVE,WEBADDR"
HEADERS = {"User-Agent": "SonoraPort-KINO-public-registry-research/1.0", "Accept": "application/json"}

def fetch_page(offset, page_size=1000, retries=3):
    query = urllib.parse.urlencode({"limit": page_size, "offset": offset, "fields": FIELDS})
    request = urllib.request.Request(FDIC_API + "?" + query, headers=HEADERS)
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(request, timeout=35) as response:
                body = json.load(response)
            return offset, body
        except Exception:
            if attempt == retries - 1:
                raise
            time.sleep(2 ** attempt)

def normalize(entry):
    source = entry.get("data") or {}
    return {"source": "FDIC BankFind", "source_url": FDIC_API,
            "country": "US", "institution_id": str(source.get("CERT", "")),
            "name": source.get("NAME"), "city": source.get("CITY"),
            "region": source.get("STALP"), "active": source.get("ACTIVE"),
            "website": source.get("WEBADDR")}

def harvest(limit, workers, page_size):
    offsets = range(0, limit, page_size)
    seen = set()
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
        jobs = {pool.submit(fetch_page, offset, min(page_size, limit-offset)): offset for offset in offsets}
        for future in concurrent.futures.as_completed(jobs):
            offset, payload = future.result()
            for entry in payload.get("data", []):
                item = normalize(entry)
                key = item["institution_id"]
                if not key or key in seen:
                    continue
                seen.add(key)
                yield item

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="data/banks.jsonl")
    parser.add_argument("--limit", type=int, default=10000)
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--page-size", type=int, default=1000)
    args = parser.parse_args()
    if not (1 <= args.limit <= 100000 and 1 <= args.workers <= 8 and 1 <= args.page_size <= 1000):
        parser.error("limit 1..100000; workers 1..8; page-size 1..1000")
    path = pathlib.Path(args.output)
    path.parent.mkdir(parents=True, exist_ok=True)
    count = 0
    with path.open("w", encoding="utf-8") as stream:
        for row in harvest(args.limit, args.workers, args.page_size):
            stream.write(json.dumps(row, ensure_ascii=False) + "\n")
            count += 1
    print(json.dumps({"records_written": count, "source": FDIC_API, "output": str(path)}))

if __name__ == "__main__":
    main()
