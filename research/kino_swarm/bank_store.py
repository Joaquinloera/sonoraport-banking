"""SQLite storage for normalized public banking-registry records."""
import argparse
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

SCHEMA = """
CREATE TABLE IF NOT EXISTS institutions (
 record_key TEXT PRIMARY KEY, country TEXT NOT NULL, authority TEXT NOT NULL,
 institution_name TEXT NOT NULL, registry_id TEXT, license_type TEXT,
 classification_status TEXT, source_url TEXT NOT NULL, record_json TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_institutions_country ON institutions(country);
CREATE INDEX IF NOT EXISTS idx_institutions_name ON institutions(institution_name);
CREATE TABLE IF NOT EXISTS ingestion_runs (
 run_id INTEGER PRIMARY KEY AUTOINCREMENT, source_file TEXT NOT NULL,
 started_at TEXT NOT NULL, completed_at TEXT, records_seen INTEGER DEFAULT 0,
 status TEXT NOT NULL, error TEXT
);
"""
REQUIRED = ('record_key', 'country', 'authority', 'institution_name', 'source_url')

def connect(path):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(str(path))
    db.executescript(SCHEMA)
    return db

def ingest_file(database, source):
    db = connect(database)
    run_id = None
    now = lambda: datetime.now(timezone.utc).isoformat()
    try:
        run_id = db.execute(
            'INSERT INTO ingestion_runs(source_file,started_at,status) VALUES(?,?,?)',
            (str(Path(source).resolve()), now(), 'running')).lastrowid
        db.commit()
        count = 0
        with Path(source).open(encoding='utf-8') as stream:
            db.execute('BEGIN')
            for line_no, line in enumerate(stream, 1):
                if not line.strip():
                    continue
                try:
                    row = json.loads(line)
                    if not isinstance(row, dict):
                        raise ValueError('not a JSON object')
                    for key in REQUIRED:
                        if not isinstance(row.get(key), str) or not row[key].strip():
                            raise ValueError('missing required field: ' + key)
                    if not row['source_url'].startswith(('https://', 'http://')):
                        raise ValueError('invalid source URL')
                except ValueError as exc:
                    raise ValueError(f'line {line_no}: {exc}') from exc
                db.execute("""INSERT INTO institutions
                  (record_key,country,authority,institution_name,registry_id,license_type,
                   classification_status,source_url,record_json,updated_at)
                  VALUES(?,?,?,?,?,?,?,?,?,?)
                  ON CONFLICT(record_key) DO UPDATE SET
                  country=excluded.country, authority=excluded.authority,
                  institution_name=excluded.institution_name, registry_id=excluded.registry_id,
                  license_type=excluded.license_type,classification_status=excluded.classification_status,
                  source_url=excluded.source_url,record_json=excluded.record_json,updated_at=excluded.updated_at""",
                  tuple(row.get(key) for key in ('record_key','country','authority','institution_name',
                     'registry_id','license_type','classification_status','source_url')) +
                  (json.dumps(row, sort_keys=True, ensure_ascii=False), now()))
                count += 1
            db.commit()
        db.execute('UPDATE ingestion_runs SET completed_at=?,records_seen=?,status=? WHERE run_id=?',
                   (now(), count, 'completed', run_id))
        db.commit()
        return {'records_processed': count,
                'total_institutions': db.execute('SELECT COUNT(*) FROM institutions').fetchone()[0]}
    except Exception as exc:
        db.rollback()
        if run_id is not None:
            db.execute('UPDATE ingestion_runs SET completed_at=?,status=?,error=? WHERE run_id=?',
                       (now(), 'failed', str(exc)[:1000], run_id))
            db.commit()
        raise
    finally:
        db.close()

if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--input', required=True)
    p.add_argument('--database', default='data/institutions.sqlite3')
    args = p.parse_args()
    print(json.dumps(ingest_file(args.database, args.input)))
