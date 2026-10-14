// SonoraPort evidence cross-checker. No claim of autonomous AI execution.
import fs from 'node:fs';
const file=process.argv[2];
if(!file)throw new Error('Usage: node cross-check-evidence.mjs evidence.json');
const input=JSON.parse(fs.readFileSync(file,'utf8'));
const records=input.results??input.records;
if(!Array.isArray(records)||records.length===0)throw new Error('No records to verify');
const checked=records.map((r,i)=>{
 const source=r.source??r.source_url;
 let valid=false;try{const u=new URL(source);valid=u.protocol==='https:';}catch{}
 const hasEvidence=Boolean(r.extracted?.technicalFindings||r.technicalFindings);
 const gaps=r.gaps??r.unverified??'not recorded';
 return {index:i+1,target:r.target??r.provider,source,sourceUrlValid:valid,technicalEvidencePresent:hasEvidence,gaps,independentSourceVerified:false,apiConnectionVerified:false,status:valid&&hasEvidence?'needs-independent-source-review':'incomplete'};
});
const report={schemaVersion:'1.0.0',executionType:'static-evidence-quality-gate',autonomousAgentsExecuted:false,results:checked};
console.log(JSON.stringify(report,null,2));
if(checked.some(x=>!x.sourceUrlValid||!x.technicalEvidencePresent))process.exitCode=1;
