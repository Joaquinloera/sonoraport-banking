// SonoraPort v20: non-transactional research integrity checks.
// Run: node website/banking-matrix/verify-matrix.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const root = new URL('../', import.meta.url);
function load(relative, globalName) {
  const source = readFileSync(new URL(relative, root), 'utf8');
  const sandbox = { window: {} };
  vm.runInNewContext(source, sandbox, { timeout: 2000, filename: relative });
  return sandbox.window[globalName];
}
const banking = load('banking-matrix/matrix-data.js', 'SONORAPORT_MATRIX');
const master = load('master-map/master-data.js', 'SONORAPORT_MASTER');
assert.ok(Array.isArray(banking.records) && banking.records.length > 0);
assert.ok(Array.isArray(master) && master.length > 0);
for (const [label, rows] of [['banking', banking.records], ['master', master]]) {
  const seen = new Set();
  for (const row of rows) {
    assert.equal(typeof row.name, 'string', label + ' missing name');
    assert.ok(row.name.trim(), label + ' blank name');
    assert.ok(/^https:\/\//.test(row.url), label + ' invalid official source for ' + row.name);
    assert.ok(row.status, label + ' missing evidence status for ' + row.name);
    const key = row.name.toLowerCase().trim();
    assert.ok(!seen.has(key), label + ' duplicate: ' + row.name);
    seen.add(key);
    if (label === 'banking') {
      assert.equal(row.connected, false, 'unverified provider marked connected: ' + row.name);
      assert.equal(row.credentialsVerified, false, 'unverified provider marked credential-verified: ' + row.name);
    }
  }
}
console.log('SonoraPort matrix validation passed:', banking.records.length, 'banking /', master.length, 'master records');
