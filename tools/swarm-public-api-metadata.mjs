// NORTHCOM SWARM 25: authorized public API metadata collection.
// Run: node tools/swarm-public-api-metadata.mjs
// Writes source-backed JSON locally; never requests credentials or private endpoints.
import {mkdir,writeFile} from 'node:fs/promises';
const targets=[
 {institution:'FDIC',url:'https://api.fdic.gov/banks/docs/',kind:'public-regulatory-api'},
 {institution:'Wells Fargo',url:'https://developer.wellsfargo.com/',kind:'developer-portal'},
 {institution:'Deutsche Bank',url:'https://developer.db.com/',kind:'developer-portal'},
 {institution:'U.S. Bank',url:'https://developer.usbank.com/',kind:'developer-portal'},
 {institution:'Columbia Bank',url:'https://www.columbiabank.com/commercial/api-banking/developer-tools/',kind:'developer-portal'}
];
const limit=3;let cursor=0;
const results=await Promise.all(Array.from({length:limit},async()=>{const output=[];while(cursor<targets.length){const target=targets[cursor++];const record={...target,checked_at:new Date().toISOString(),access:'public-documentation-only',credentials:'not-collected'};try{const response=await fetch(target.url,{signal:AbortSignal.timeout(15000),redirect:'follow',headers:{'User-Agent':'SonoraPort-PublicMetadataCollector/1.0'}});record.http_status=response.status;record.final_url=response.url;record.content_type=response.headers.get('content-type');const html=(await response.text()).slice(0,500000);record.page_title=html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim()||null;record.auth_terms=[...new Set((html.match(/OAuth 2\.0|OAuth|OpenID Connect|API key|sandbox|mTLS|ISO 20022|webhook/gi)||[]).map(x=>x.toLowerCase()))];record.status=response.ok?'retrieved':'http-error';}catch(e){record.status='error';record.error=String(e.message||e)}output.push(record)}return output}));
const data={schema:'sonoraport.public_api_metadata.v1',scope:'public or explicitly authorized only',generated_at:new Date().toISOString(),records:results.flat()};await mkdir('data/swarm',{recursive:true});await writeFile('data/swarm/public-api-metadata.json',JSON.stringify(data,null,2)+'\n');console.log(JSON.stringify({written:'data/swarm/public-api-metadata.json',count:data.records.length,statuses:data.records.map(x=>[x.institution,x.status])}));
