import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const evidencePath = process.argv[2] ?? path.join(here, '../global-banking/research-evidence-2026-10-13.json');
const outputPath = process.argv[3] ?? path.join(here, 'latest-skim-results.json');
const data = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
if (!Array.isArray(data.records)) throw new Error('Invalid evidence roster');
const required = ['region', 'provider', 'source', 'technicalFindings', 'onboarding', 'unverified'];
function skim(record, index) {
  for (const key of required) if (typeof record[key] !== 'string' || !record[key].trim()) throw new Error(`Missing ${key} in record ${index}`);
  const source = new URL(record.source);
  if (source.protocol !== 'https:') throw new Error(`Non-HTTPS source: ${record.source}`);
  return {
    taskId: `SKIM-${String(index + 1).padStart(4, '0')}`,
    workerId: `RESEARCH-${String(index + 1).padStart(3, '0')}`,
    target: record.provider, region: record.region, source: source.href,
    extracted: {technicalFindings: record.technicalFindings, accessRequirements: record.onboarding},
    gaps: record.unverified, status: 'evidence-skimmed-needs-independent-verification',
    providerConnectionVerified: false, paymentInitiationAuthorized: false
  };
}
const results = [];
for (let index = 0; index < data.records.length; index++) {
  results.push(skim(data.records[index], index));
}
const report = {schemaVersion: '1.0.0', executionType: 'local-evidence-validation', autonomousDiscovery: false, networkFetchPerformed: false, sourceEvidenceCount: results.length, results};
fs.mkdirSync(path.dirname(outputPath), {recursive: true});
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2) + '\n');
console.log(`SKIM complete: ${results.length} validated records; ${outputPath}`);
