/** Public-research-only snapshot validation and filtering, no bank credentials or payments. */
const FORBIDDEN_KEYS=new Set(['accountNumber','routingNumber','balanceUSD','apiKey','clientSecret','privateKey','accessToken']);
export function validatePublicSnapshot(snapshot){
 if(snapshot?.mode!=='REPOSITORY_PUBLIC_RESEARCH_SNAPSHOT'||snapshot.status!=='OFFLINE_DOCUMENTATION_SNAPSHOT_NOT_LIVE_BANKING'||!Array.isArray(snapshot.records))throw Error('PUBLIC_RESEARCH_SNAPSHOT_INVALID');
 if(snapshot.transfersEnabled!==false||snapshot.liveBankingConnectionsVerified!==0||snapshot.hostedAIAgentsVerified!==0)throw Error('PUBLIC_RESEARCH_SNAPSHOT_UNSAFE');
 if(!Number.isInteger(snapshot.publicResearchEntries)||snapshot.records.length!==snapshot.publicResearchEntries||snapshot.sourceEntries!==snapshot.publicResearchEntries+snapshot.historicalEntriesExcluded)throw Error('PUBLIC_RESEARCH_SNAPSHOT_INCOMPLETE');
 const ids=new Set();
 for(const r of snapshot.records){
  if(!r||typeof r.id!=='string'||typeof r.name!=='string'||r.integrationStatus!=='NOT_VERIFIED_CONNECTED'||r.livePaymentCapable!==false||r.productionReady!==false||r.kind==='historical_claims_unverified'||ids.has(r.id))throw Error('PUBLIC_RESEARCH_SNAPSHOT_UNSAFE');
  ids.add(r.id);
  for(const k of FORBIDDEN_KEYS)if(Object.hasOwn(r,k))throw Error('PUBLIC_RESEARCH_SNAPSHOT_UNSAFE');
  if(r.publicReferenceUrl){let u;try{u=new URL(r.publicReferenceUrl)}catch{throw Error('PUBLIC_RESEARCH_SNAPSHOT_UNSAFE')};if(u.protocol!=='https:'||u.username||u.password)throw Error('PUBLIC_RESEARCH_SNAPSHOT_UNSAFE')}
 }
 return snapshot;
}
export function filterSnapshot(snapshot,{query='',region='',offset=0,limit=18}={}){
 validatePublicSnapshot(snapshot);
 if(!Number.isInteger(offset)||offset<0||!Number.isInteger(limit)||limit<1||limit>100)throw Error('INVALID_PUBLIC_RESEARCH_PAGE');
 const q=String(query).trim().toLowerCase(),r=String(region).trim().toLowerCase();
 const matched=snapshot.records.filter(p=>(!q||[p.name,p.region,p.country,p.kind].some(s=>String(s??'').toLowerCase().includes(q)))&&(!r||String(p.region??'').toLowerCase().includes(r)));
 return {total:matched.length,offset,limit,records:matched.slice(offset,offset+limit),source:'REPOSITORY_PUBLIC_SNAPSHOT'};
}