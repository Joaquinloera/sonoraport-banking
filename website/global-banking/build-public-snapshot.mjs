/** Reproducible research-only website fallback. Run from repo root with Node 22+. */
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createPublicResearchHandler} from '../../integrations/global-banking/public-research-core.mjs';

const getJSON=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
export const sourceFiles=Object.freeze({
 registry:'../../data/global-banking-all-providers-registry.json',
 skim:'../../research/global-provider-api-auth-skim-2026-10-12.json',
 manifest:'../../research/official-19-lane-execution-manifest-2026-10-12-v2.json',
});
export async function createSnapshot({registry=getJSON(sourceFiles.registry),skim=getJSON(sourceFiles.skim),manifest=getJSON(sourceFiles.manifest)}={}){
 const handler=createPublicResearchHandler({registry,skim,manifest});
 const api=async route=>{
  const r=await handler(new Request('https://research.local/api/global-banking'+route));
  if(r.status!==200)throw Error('PUBLIC_RESEARCH_API_VALIDATION_FAILED');
  return r.json();
 };
 const summary=await api('/summary');
 if(summary.mode!=='PUBLIC_RESEARCH_ONLY'||summary.transfersEnabled!==false||summary.hostedAIAgentsVerified!==0||summary.liveBankingConnectionsVerified!==0)throw Error('PUBLIC_RESEARCH_ASSERTION_FAILED');
 const records=[];
 for(let offset=0;offset<summary.publicResearchEntries;offset+=100){
  const page=await api(`/providers?limit=100&offset=${offset}`);
  if(!Array.isArray(page.records)||page.offset!==offset||page.total!==summary.publicResearchEntries)throw Error('PUBLIC_RESEARCH_PAGE_MISMATCH');
  records.push(...page.records);
 }
 if(records.length!==summary.publicResearchEntries||new Set(records.map(x=>x.id)).size!==records.length)throw Error('PUBLIC_RESEARCH_COUNT_MISMATCH');
 if(records.some(x=>x.integrationStatus!=='NOT_VERIFIED_CONNECTED'||x.livePaymentCapable!==false||x.productionReady!==false))throw Error('PUBLIC_RESEARCH_NOT_FAIL_CLOSED');
 return {
  schemaVersion:'1.0.0',mode:'REPOSITORY_PUBLIC_RESEARCH_SNAPSHOT',
  source:{registry:'data/global-banking-all-providers-registry.json',skim:'research/global-provider-api-auth-skim-2026-10-12.json'},
  status:'OFFLINE_DOCUMENTATION_SNAPSHOT_NOT_LIVE_BANKING',
  sourceEntries:summary.sourceEntries,publicResearchEntries:records.length,historicalEntriesExcluded:summary.historicalEntriesExcluded,
  agentRolesDefined:summary.logicalAgentsDefined,hostedAIAgentsVerified:0,liveBankingConnectionsVerified:0,transfersEnabled:false,
  records,
 };
}
export function snapshotText(snapshot){return JSON.stringify(snapshot,null,2)+'\n';}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 const result=await createSnapshot();
 const p=new URL('./public-registry-snapshot.json',import.meta.url);
 const text=snapshotText(result);
 if(process.argv.includes('--check')){
  if(readFileSync(p,'utf8')!==text)throw Error('PUBLIC_RESEARCH_SNAPSHOT_OUT_OF_DATE');
  console.log('VERIFIED_RESEARCH_SNAPSHOT',result.publicResearchEntries,'public entries');
 }else if(process.argv.includes('--generate')){
  writeFileSync(p,text,{flag:'w'});
  console.log('GENERATED_RESEARCH_SNAPSHOT',result.publicResearchEntries,'public entries');
 }else{
  console.error('Use --generate or --check');process.exitCode=2;
 }
}