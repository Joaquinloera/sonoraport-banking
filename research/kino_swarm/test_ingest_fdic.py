import unittest
from ingest_fdic import ingest, normalize_fdic

class FDICIngestTests(unittest.TestCase):
    def test_normalization_preserves_evidence(self):
        item = {'data': {'CERT': 12, 'NAME': 'Example Bank', 'CITY': 'Phoenix', 'STALP': 'AZ', 'ACTIVE': 1}}
        result = normalize_fdic(item)
        self.assertEqual(result['institution_name'], 'Example Bank')
        self.assertEqual(result['registry_id'], '12')
        self.assertEqual(result['country'], 'US')
        self.assertIn('fdic.gov', result['source_url'])
        self.assertEqual(result['classification_status'], 'needs_review')
    def test_parallel_pages_deduplicate_and_sort(self):
        def fake_fetch(offset, limit):
            data = ({0: [{'data': {'CERT': 2, 'NAME': 'B'}}],
                     1: [{'data': {'CERT': 1, 'NAME': 'A'}}],
                     2: [{'data': {'CERT': 2, 'NAME': 'B'}}]})[offset]
            return offset, data
        result = ingest(3, page_size=1, workers=3, fetch=fake_fetch)
        self.assertEqual(len(result), 2)
        self.assertEqual([r['institution_name'] for r in result], ['A', 'B'])
    def test_conflicting_id_rejected(self):
        def fake_fetch(offset, limit):
            return offset, [{'data': {'CERT': 1, 'NAME': ('Alpha' if offset == 0 else 'Beta')}}]
        with self.assertRaises(ValueError):
            ingest(2, page_size=1, workers=2, fetch=fake_fetch)

if __name__ == '__main__':
    unittest.main()
