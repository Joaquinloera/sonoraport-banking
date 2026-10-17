import json
import sqlite3
import tempfile
import unittest
from pathlib import Path
from search_banks import search, coverage

class SearchTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.db = self.root / 'banks.db'
        records = [
            dict(record_key='a', country='BR', authority='Example', institution_name='Alpha Bank', source_url='https://example.org', license_type='bank', classification_status='source_label_only'),
            dict(record_key='b', country='MX', authority='Example', institution_name='Beta Bank', source_url='https://example.org', license_type='bank', classification_status='needs_review'),
            dict(record_key='c', country='BR', authority='Example', institution_name='100% Savings_Bank', source_url='https://example.org', license_type='other', classification_status='needs_review'),
        ]
        with sqlite3.connect(self.db) as db:
            db.execute("CREATE TABLE institutions(record_key TEXT PRIMARY KEY, country TEXT, authority TEXT, institution_name TEXT, source_url TEXT, license_type TEXT, classification_status TEXT, record_json TEXT)")
            for record in records:
                db.execute("INSERT INTO institutions VALUES(?,?,?,?,?,?,?,?)", (record['record_key'], record['country'], record['authority'], record['institution_name'], record['source_url'], record['license_type'], record['classification_status'], json.dumps(record)))

    def test_country_filter(self):
        result = search(self.db, country='br')
        self.assertEqual(result['total_matches'], 2)
        self.assertTrue(all(x['country'] == 'BR' for x in result['results']))

    def test_literal_wildcards_and_filters(self):
        self.assertEqual(search(self.db, name='100%')['total_matches'], 1)
        self.assertEqual(search(self.db, name='Savings_')['total_matches'], 1)
        self.assertEqual(search(self.db, country='BR', license_type='bank')['total_matches'], 1)

    def test_pagination(self):
        a = search(self.db, limit=1, offset=0)
        b = search(self.db, limit=1, offset=1)
        self.assertEqual(a['total_matches'], 3)
        self.assertNotEqual(a['results'][0]['record_key'], b['results'][0]['record_key'])

    def test_coverage(self):
        self.assertEqual(coverage(self.db)['countries'], [{'country': 'BR', 'records': 2}, {'country': 'MX', 'records': 1}])

    def test_invalid_limit(self):
        with self.assertRaises(ValueError): search(self.db, limit=501)

    def test_missing_database(self):
        with self.assertRaises(FileNotFoundError): search(self.root / 'missing.db')

if __name__ == '__main__': unittest.main()
