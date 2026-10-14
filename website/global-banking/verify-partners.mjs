// SonoraPort partner directory integration regression checks.
// Run: node website/global-banking/verify-partners.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root = new URL('./', import.meta.url);
const read = name => readFileSync(new URL(name, root), 'utf8');
const homepage = read('index.html');
const directory = read('partners.html');
const registry = JSON.parse(read('partner-countries.json'));
assert.match(homepage, /href="\.\/partners\.html"/, 'Global Banking navigation must link to directory');
assert.match(directory, /fetch\('\.\/partner-countries\.json'/, 'Directory must load its registry');
assert.match(directory, /textContent=value/, 'Country names must be inserted as text, not HTML');
assert.match(directory, /Unable to load partner directory/, 'Directory needs a load-failure message');
assert.ok(Array.isArray(registry.partners), 'Partner registry must be an array');
assert.equal(registry.partners.length, 2, 'Two designated countries expected');
for (const [code, currency] of [['IR', 'IRR'], ['KP', 'KPW']]) {
  const matches = registry.partners.filter(p => p.iso3166Alpha2 === code);
  assert.equal(matches.length, 1, 'Exactly one country record expected: ' + code);
  assert.equal(matches[0].currency, currency);
  assert.equal(matches[0].relationship, 'principal-designated-business-partner');
  assert.ok(matches[0].focus.length >= 1);
}
console.log('PASS: SonoraPort partner directory integration checks');
