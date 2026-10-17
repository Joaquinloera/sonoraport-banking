#!/usr/bin/env python3
"""Run a source-mapped registry CSV through the KINO normalization pipeline.

Example:
python registry_cli.py --input sample.csv --output sample.jsonl --country XX --authority 'Example Regulator' --source-url https://example.org/registry --name-column name --id-column id --license-column type
"""
import argparse
import json
from pathlib import Path
from registry_pipeline import parse_csv, deduplicate, write_jsonl

def main():
    p = argparse.ArgumentParser(description='Normalize a local official registry CSV')
    p.add_argument('--input', required=True)
    p.add_argument('--output', required=True)
    p.add_argument('--country', required=True)
    p.add_argument('--authority', required=True)
    p.add_argument('--source-url', required=True)
    p.add_argument('--name-column', required=True)
    p.add_argument('--id-column', default='')
    p.add_argument('--license-column', default='')
    p.add_argument('--delimiter', choices=['comma', 'tab', 'semicolon'], default='comma')
    args = p.parse_args()
    mapping = {'institution_name': args.name_column}
    if args.id_column: mapping['registry_id'] = args.id_column
    if args.license_column: mapping['license_type'] = args.license_column
    mapping.update({'country': '', 'authority': '', 'source_url': ''})
    metadata = {'country': args.country.upper(), 'authority': args.authority, 'source_url': args.source_url}
    delimiters = {'comma': ',', 'tab': '\t', 'semicolon': ';'}
    rows = parse_csv(Path(args.input).read_text(encoding='utf-8-sig'), mapping, metadata, delimiters[args.delimiter])
    unique = deduplicate(rows)
    write_jsonl(unique, args.output)
    print(json.dumps({'input_rows': len(rows), 'unique_records': len(unique), 'output': args.output}))

if __name__ == '__main__': main()
