#!/usr/bin/env node
/**
 * SWARM 37 protected invocation + database receipt verification.
 * Environment:
 *   SUPABASE_URL=https://<project>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=<server-side key>
 * Never run in a browser or expose credentials in logs.
 */
const base=process.env.SUPABASE_URL?.replace(/\/$/,"");
const secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!base||!secret){console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");process.exit(2)}
const auth={apikey:secret,Authorization:"Bearer "+secret};
async function json(url,options={}){
 const response=await fetch(url,options);
 const body=await response.json().catch(()=>({}));
 if(!response.ok)throw Error("HTTP "+response.status+" "+JSON.stringify(body).slice(0,200));
 return body;
}
try{
 const response=await json(base+"/functions/v1/sonoraport-swarm-model-dispatch",{method:"POST",headers:auth});
 if(!response.run_id)throw Error("No run_id returned");
 const run=await json(base+"/rest/v1/sonoraport_swarm_runs?select=id,state,jobs_seen,jobs_saved,error_code&id=eq."+encodeURIComponent(response.run_id),{headers:auth});
 const events=await json(base+"/rest/v1/sonoraport_swarm_events?select=stage,outcome,created_at&run_id=eq."+encodeURIComponent(response.run_id),{headers:auth});
 const saved=await json(base+"/rest/v1/sonoraport_swarm_tasks?select=id,target,status,extracted&status=eq.complete&extracted=not.is.null&limit=10",{headers:auth});
 const report={run_id:response.run_id,run:run[0]||null,events,findings_saved:saved.filter(x=>x.extracted?.findings).length};
 console.log(JSON.stringify(report,null,2));
 if(run[0]?.state!=="completed"||report.findings_saved===0)process.exitCode=1;
}catch(error){console.error("SWARM invocation or verification failed:",error.message);process.exitCode=1}
