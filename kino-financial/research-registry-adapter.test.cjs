'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {FIELDS,validateResearchRow,sanitizeResearchRows,researchQuery}=require('./research-registry-adapter.cjs');
test('allowlist excludes bank and secret fields',()=>{for(const field of ['account_number','routing_number','api_auth_notes','secret_key','available_balance'])assert.equal(FIELDS.includes(field),false)});
test('sanitizes records and marks research only',()=>{const row=validateResearchRow({company:'Example Bank',official_url:'https://example.org',secret_key:'never'});assert.equal(row.secret_key,undefined);assert.equal(row.connectionStatus,'RESEARCHED_NOT_CONNECTED')});
test('rejects non HTTPS evidence links',()=>{const row=validateResearchRow({company:'Bank',source_url:'javascript:alert(1)'});assert.equal(row.source_url,null)});
test('rejects malformed rows',()=>assert.throws(()=>sanitizeResearchRows([{id:1}]),/Invalid research row/));
test('read-only Supabase query uses approved fields and limit',()=>{const calls=[];const client={from:t=>{calls.push(['from',t]);return {select:f=>{calls.push(['select',f]);return {order:(f,o)=>{calls.push(['order',f,o]);return {limit:n=>{calls.push(['limit',n]);return {data:[]}}}}}}}}};researchQuery(client,{limit:25});assert.equal(calls[0][1],'kino_research_registry');assert.equal(calls[3][1],25)});
test('rejects unbounded query',()=>assert.throws(()=>researchQuery({from:()=>{}},{limit:999}),/Invalid limit/));
