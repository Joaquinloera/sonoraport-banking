"""Offline API tests using fictional institutions."""
import json
import sqlite3
import tempfile
import unittest
from pathlib import Path
try:
    from .banking_api import dispatch
except ImportError:
    from banking_api import dispatch

class RegistryAPITest(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.db=str(Path(self.temp.name)/'fixture.sqlite3')
        with sqlite3.connect(self.db) as conn:
            conn.execute('CREATE TABLE institutions (record_key TEXT,country TEXT,institution_name TEXT,license_type TEXT,classification_status TEXT,record_json TEXT)')
            for key,country,name in [('1','US','Example Bank'),('2','MX','Fictional Banco')]:
                item={'record_key':key,'country':country,'institution_name':name}
                conn.execute('INSERT INTO institutions VALUES (?,?,?,?,?,?)',(key,country,name,'fictional','needs_review',json.dumps(item)))
    def tearDown(self):
        self.temp.cleanup()
    def test_health(self):
        status,result=dispatch('/api/health',self.db)
        self.assertEqual(status,200)
        self.assertFalse(result['live_banking'])
    def test_country_filter(self):
        status,result=dispatch('/api/institutions?country=MX',self.db)
        self.assertEqual(status,200)
        self.assertEqual(result['total_matches'],1)
    def test_coverage(self):
        status,result=dispatch('/api/coverage',self.db)
        self.assertEqual(status,200)
        self.assertEqual(result['total_records'],2)
    def test_bad_limit(self):
        self.assertEqual(dispatch('/api/institutions?limit=9999',self.db)[0],400)
    def test_unknown_query(self):
        self.assertEqual(dispatch('/api/institutions?secret=1',self.db)[0],400)
    def test_not_found(self):
        self.assertEqual(dispatch('/api/private',self.db)[0],404)

if __name__=='__main__':
    unittest.main()
