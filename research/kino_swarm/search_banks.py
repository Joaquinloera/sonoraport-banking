"""Read-only search and coverage summary for the KINO SQLite institution store."""
import argparse
import json
import sqlite3
from pathlib import Path

def search(database, country=None, name=None, license_type=None, classification_status=None, limit=50, offset=0):
    if not 1 <= limit <= 500 or offset < 0:
        raise ValueError('limit must be 1..500 and offset nonnegative')
    if not Path(database).is_file():
        raise FileNotFoundError(f'Database not found: {database}')
    clauses, params = [], []
    if country:
        clauses.append('country = ?')
        params.append(country.strip().upper())
    if name:
        clauses.append('institution_name LIKE ? ESCAPE "\\"')
        params.append('%' + name.strip().replace('\\', '\\\\').replace('%', '\\%').replace('_', '\\_') + '%')
    if license_type:
        clauses.append('license_type = ?')
        params.append(license_type.strip())
    if classification_status:
        clauses.append('classification_status = ?')
        params.append(classification_status.strip())
    where = (' WHERE ' + ' AND '.join(clauses)) if clauses else ''
    with sqlite3.connect(f'file:{Path(database).resolve()}?mode=ro', uri=True) as db:
        total = db.execute('SELECT COUNT(*) FROM institutions' + where, params).fetchone()[0]
        rows = db.execute('SELECT record_json FROM institutions' + where +
                          ' ORDER BY country, institution_name, record_key LIMIT ? OFFSET ?',
                          params + [limit, offset]).fetchall()
    return {'total_matches': total, 'limit': limit, 'offset': offset,
            'results': [json.loads(row[0]) for row in rows]}

def coverage(database):
    if not Path(database).is_file():
        raise FileNotFoundError(f'Database not found: {database}')
    with sqlite3.connect(f'file:{Path(database).resolve()}?mode=ro', uri=True) as db:
        rows = db.execute('SELECT country, COUNT(*) FROM institutions GROUP BY country ORDER BY country').fetchall()
    return {'countries': [{'country': c, 'records': n} for c, n in rows],
            'total_records': sum(n for _, n in rows)}

def main():
    p = argparse.ArgumentParser(description='Search imported public banking records (read-only)')
    p.add_argument('--database', default='data/institutions.sqlite3')
    p.add_argument('--country')
    p.add_argument('--name')
    p.add_argument('--license-type')
    p.add_argument('--classification-status')
    p.add_argument('--limit', type=int, default=50)
    p.add_argument('--offset', type=int, default=0)
    p.add_argument('--coverage', action='store_true')
    args = p.parse_args()
    output = coverage(args.database) if args.coverage else search(args.database, args.country, args.name, args.license_type, args.classification_status, args.limit, args.offset)
    print(json.dumps(output, indent=2, ensure_ascii=False))

if __name__ == '__main__':
    main()
