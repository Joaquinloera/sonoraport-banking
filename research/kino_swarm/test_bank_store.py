"""Tests for transactional institution storage; no live API calls."""
import json
import tempfile
import unittest
from pathlib import Path
from bank_store import connect, ingest_file

class BankStoreTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.db = self.root / 'test.sqlite3'
        self.data = self.root / 'input.jsonl'
        self.sample = {'record_key':'key1','country':'XX','authority':'Example Regulator',
                       'institution_name':'Example Bank','source_url':'https://example.org/registry'}

    def write(self, *rows):
        self.data.write_text(''.join(json.dumps(r)+'\n' for r in rows), encoding='utf-8')

    def test_idempotent_import(self):
        self.write(self.sample)
        self.assertEqual(ingest_file(self.db,self.data)['total_institutions'],1)
        self.assertEqual(ingest_file(self.db,self.data)['total_institutions'],1)
        with connect(self.db) as db:
            self.assertEqual(db.execute('SELECT COUNT(*) FROM ingestion_runs WHERE status="completed"').fetchone()[0],2)

    def test_bad_batch_rollback(self):
        self.write(self.sample, {'record_key':'broken'})
        with self.assertRaises(ValueError):
            ingest_file(self.db,self.data)
        with connect(self.db) as db:
            self.assertEqual(db.execute('SELECT COUNT(*) FROM institutions').fetchone()[0],0)
            self.assertEqual(db.execute('SELECT status FROM ingestion_runs').fetchone()[0],'failed')

    def test_multiple_records(self):
        self.write(self.sample, dict(self.sample, record_key='key2',institution_name='Second Bank'))
        self.assertEqual(ingest_file(self.db,self.data)['total_institutions'],2)

if __name__ == '__main__':
    unittest.main()
