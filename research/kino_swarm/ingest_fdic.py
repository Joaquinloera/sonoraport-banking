#!/usr/bin/env python3
"""FDIC -> provenance-preserving normalized JSONL, with bounded concurrency.

Run from research/kino_swarm: python ingest_fdic.py --output data/fdic.jsonl --limit 2000
The FDIC public API is the only live source. No private credentials are used.
"""
import argparse
import concurrent.futures
import json
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
import time

API = 'https://api.fdic.gov/banks/institutions'
FIELDS = 'CERT,NAME,CITY,STALP,ACTIVE,WEBADDR'

def fetch_page(offset, limit, retries=3):
    query = urlencode({'limit': limit, 'offset': offset, 'fields': FIELDS, 'sort_by': 'CERT', 'sort_order': 'ASC'})
    request = Request(API + '?' + query, headers={'Accept': 'application/json', 'User-Agent': 'SonoraPort-public-registry-research/1.0'})
    for attempt in range(retries):
        try:
            with urlopen(request, timeout=30) as response:
                data = json.load(response)
            if not isinstance(data.get('data'), list):
                raise ValueError('FDIC API response missing data array')
            return offset, data['data']
        except (HTTPError, URLError, TimeoutError) as error:
            if attempt == retries - 1 or (isinstance(error, HTTPError) and error.code not in (429, 500, 502, 503, 504)):
                raise
            time.sleep(2 ** attempt)

def normalize_fdic(item):
    from registry_pipeline import normalize
    raw = item.get('data', item)
    mapping = {'institution_name': 'NAME', 'registry_id': 'CERT', 'region': 'STALP', 'city': 'CITY', 'website': 'WEBADDR', 'country': '', 'authority': '', 'source_url': ''}
    metadata = {'country': 'US', 'authority': 'FDIC', 'source_url': API}
    record = normalize(raw, mapping, metadata)
    record['active_source_value'] = raw.get('ACTIVE')
    record['license_type'] = 'FDIC institution record — type not independently classified'
    record['classification_status'] = 'needs_review'
    return record

def ingest(limit, page_size=1000, workers=4, fetch=fetch_page):
    from registry_pipeline import deduplicate
    offsets = range(0, limit, page_size)
    pages = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
        futures = [pool.submit(fetch, offset, min(page_size, limit-offset)) for offset in offsets]
        for future in concurrent.futures.as_completed(futures):
            offset, records = future.result()
            pages[offset] = records
    rows = [normalize_fdic(item) for offset in sorted(pages) for item in pages[offset]]
    return deduplicate(rows)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', default='data/fdic.jsonl')
    parser.add_argument('--limit', type=int, default=2000)
    parser.add_argument('--page-size', type=int, default=1000)
    parser.add_argument('--workers', type=int, default=4)
    args = parser.parse_args()
    if not (1 <= args.limit <= 100000 and 1 <= args.page_size <= 1000 and 1 <= args.workers <= 8):
        parser.error('limit 1..100000, page-size 1..1000, workers 1..8')
    records = ingest(args.limit, args.page_size, args.workers)
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open('w', encoding='utf-8') as stream:
        for record in records:
            stream.write(json.dumps(record, ensure_ascii=False, sort_keys=True) + '\n')
    print(json.dumps({'source': API, 'records': len(records), 'output': str(output)}))

if __name__ == '__main__':
    main()
