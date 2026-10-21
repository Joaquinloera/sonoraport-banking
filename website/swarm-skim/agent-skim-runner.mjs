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
const BATCH_SIZE = 100;
const results = [];
for (let offset = 0; offset < data.records.length; offset += BATCH_SIZE) {
  const end = Math.min(offset + BATCH_SIZE, data.records.length);
  for (let index = offset; index < end; index++) {
    results.push(skim(data.records[index], index));
  }
  console.log(`SKIM batch ${Math.floor(offset / BATCH_SIZE) + 1}: validated ${end - offset} records (${end}/${data.records.length})`);
}
const report = {schemaVersion: '1.0.0', executionType: 'local-evidence-validation', autonomousDiscovery: false, networkFetchPerformed: false, batchSize: BATCH_SIZE, batchCount: Math.ceil(results.length / BATCH_SIZE), sourceEvidenceCount: results.length, results};
fs.mkdirSync(path.dirname(outputPath), {recursive: true});
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2) + '\n');
console.log(`SKIM complete: ${results.length} validated records; ${outputPath}`);
