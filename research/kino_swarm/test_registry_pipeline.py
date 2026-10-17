import unittest
from registry_pipeline import parse_csv, deduplicate

MAPPING = {'country': 'country', 'authority': 'authority', 'source_url': 'source_url', 'institution_name': 'name', 'registry_id': 'id', 'license_type': 'type'}
META = {'country': 'XX', 'authority': 'Example Regulator', 'source_url': 'https://example.org/registry'}
class PipelineTests(unittest.TestCase):
    def test_csv_dedup_and_provenance(self):
        rows = parse_csv('id,name,type\n1, Alpha Bank ,bank\n1,Alpha Bank,bank\n2,Beta Bank,credit union\n', MAPPING, META)
        self.assertEqual(len(deduplicate(rows)), 2)
        self.assertEqual(rows[0]['source_url'], META['source_url'])
        self.assertNotEqual(rows[0]['record_key'], rows[2]['record_key'])
    def test_missing_required(self):
        with self.assertRaises(ValueError):
            parse_csv('id,name\n1,\n', MAPPING, META)
    def test_conflicting_ids(self):
        rows = parse_csv('id,name\n1,Alpha\n1,Beta\n', MAPPING, META)
        with self.assertRaises(ValueError):
            deduplicate(rows)
if __name__ == '__main__': unittest.main()
