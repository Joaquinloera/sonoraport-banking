"""KINO public-registry data normalizer and provenance-preserving deduplicator."""
import csv
import hashlib
import io
import json
from datetime import datetime, timezone
from pathlib import Path

REQUIRED = ('country', 'authority', 'source_url', 'institution_name')

def clean(value):
    return ' '.join(str(value or '').split()).strip()

def normalize(raw, mapping, metadata):
    record = {key: clean(metadata.get(key) or raw.get(field, '')) for key, field in mapping.items()}
    for key in REQUIRED:
        if not record.get(key):
            raise ValueError('missing required field: ' + key)
    record['license_type'] = clean(record.get('license_type')) or 'unclassified'
    record['registry_id'] = clean(record.get('registry_id'))
    identity = '|'.join((record['country'].upper(), record['authority'].casefold(),
                         record['registry_id'] or record['institution_name'].casefold()))
    record['record_key'] = hashlib.sha256(identity.encode('utf-8')).hexdigest()[:24]
    record['collected_at'] = datetime.now(timezone.utc).isoformat()
    record['classification_status'] = 'needs_review' if record['license_type'] == 'unclassified' else 'source_label_only'
    return record

def parse_csv(text, mapping, metadata, delimiter=','):
    if delimiter not in (',', '\t', ';'):
        raise ValueError('unsupported delimiter')
    return [normalize(row, mapping, metadata) for row in csv.DictReader(io.StringIO(text), delimiter=delimiter)]

def deduplicate(records):
    unique = {}
    for row in records:
        key = row['record_key']
        if key in unique and unique[key]['institution_name'] != row['institution_name']:
            raise ValueError('conflicting registry ID: ' + key)
        unique[key] = row
    return sorted(unique.values(), key=lambda x: (x['country'], x['institution_name'], x['record_key']))

def write_jsonl(records, output):
    path = Path(output)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('w', encoding='utf-8') as f:
        for row in deduplicate(records):
            f.write(json.dumps(row, ensure_ascii=False, sort_keys=True) + '\n')
    return path
