/** Public research metadata only. No banking accounts, private keys, or transfers. */
import {createPublicResearchHandler} from '../../integrations/global-banking/public-research-core.mjs';
let ready;
async function loadHandler(){
  if(!ready){
    ready=Promise.all([
      import('../../data/global-banking-all-providers-registry.json',{with:{type:'json'}}),
      import('../../research/global-provider-api-auth-skim-2026-10-12.json',{with:{type:'json'}}),
      import('../../research/official-19-lane-execution-manifest-2026-10-12-v2.json',{with:{type:'json'}})
    ]).then(([r,s,m])=>createPublicResearchHandler({registry:r.default,skim:s.default,manifest:m.default}));
  }
  return ready;
}
export default async function handler(request){
  try{return await (await loadHandler())(request)}
  catch{return Response.json({error:'PUBLIC_RESEARCH_DATA_UNAVAILABLE'},{status:503,headers:{'Cache-Control':'no-store'}})}
}
export const config={path:'/api/global-banking/*'};