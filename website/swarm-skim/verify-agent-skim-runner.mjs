import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'sonoraport-skim-'));
try {
 const input = path.join(temp, 'input.json'), output = path.join(temp, 'output.json');
 fs.writeFileSync(input, JSON.stringify({records:[{region:'US',provider:'FedNow',source:'https://www.frbservices.org/',technicalFindings:'Ping',onboarding:'DevRel',unverified:'Credentials'}]}));
 execFileSync(process.execPath,[path.join(dir,'agent-skim-runner.mjs'),input,output]);
 const result=JSON.parse(fs.readFileSync(output,'utf8'));
 assert.equal(result.results.length,1);
 assert.equal(result.results[0].providerConnectionVerified,false);
 assert.equal(result.results[0].paymentInitiationAuthorized,false);
 assert.equal(result.networkFetchPerformed,false);
 fs.writeFileSync(input,JSON.stringify({records:[{region:'US',provider:'Bad',source:'http://example.com',technicalFindings:'X',onboarding:'X',unverified:'X'}]}));
 assert.throws(()=>execFileSync(process.execPath,[path.join(dir,'agent-skim-runner.mjs'),input,output],{stdio:'pipe'}));
 console.log('PASS: bounded worker output, fail-closed provider status, unsafe source rejected');
} finally {fs.rmSync(temp,{recursive:true,force:true});}
