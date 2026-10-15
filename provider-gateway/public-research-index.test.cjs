const assert = require('node:assert/strict');
const {getResearchIndex,getResearchTasks} = require('./public-research-index.cjs');
const providers = getResearchIndex();
const tasks = getResearchTasks();
assert.ok(providers.length >= 13);
assert.equal(new Set(providers.map(x => x.name)).size, providers.length);
assert.equal(tasks.length, 6);
assert.ok(tasks.every(x => x.execution === 'not_started'));
console.log('PASS: provider index and research task manifest');
