const H={"content-type":"application/json","cache-control":"no-store"};
Deno.serve(async(req:Request)=>{
 if(req.method!=="POST")return new Response(JSON.stringify({error:"POST required"}),{status:405,headers:H});
 const base=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),modelKey=Deno.env.get("OPENAI_API_KEY");
 if(!base||!key)return new Response(JSON.stringify({error:"database_not_configured"}),{status:503,headers:H});
 const headers={apikey:key,authorization:"Bearer "+key,"content-type":"application/json"};
 const request=async(path:string,method="GET",body?:unknown,prefer?:string)=>{
  const r=await fetch(base+"/rest/v1/"+path,{method,headers:{...headers,...(prefer?{prefer}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
  if(!r.ok)throw Error("db_"+method+"_"+r.status);return await r.json().catch(()=>null);
 };
 const rows=await request("sonoraport_swarm_runs","POST",{worker:"model-dispatch-v4",state:"started"},"return=representation");
 const run=rows[0].id;
 const event=async(task_id:string|null,stage:string,outcome:string,detail:unknown={})=>request("sonoraport_swarm_events","POST",{run_id:run,task_id,stage,outcome,detail});
 const finish=async(state:string,jobs_seen:number,jobs_saved:number,error_code?:string)=>request("sonoraport_swarm_runs?id=eq."+run,"PATCH",{state,jobs_seen,jobs_saved,finished_at:new Date().toISOString(),...(error_code?{error_code}:{})});
 let jobsSeen=0,saved=0,failed=0;
 try{
  if(!modelKey){await event(null,"configuration","missing_model_key");await finish("configuration_missing",0,0,"MODEL_KEY_MISSING");return new Response(JSON.stringify({run_id:run,status:"configuration_missing"}),{status:503,headers:H})}
  const jobs=await request("rpc/sonoraport_claim_swarm_tasks","POST",{p_limit:2});jobsSeen=jobs.length;
  for(const job of jobs){
   try{
    await event(job.id,"model_request","started",{target:job.target,source_url:job.source_url});
    const ai=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{authorization:"Bearer "+modelKey,"content-type":"application/json"},body:JSON.stringify({model:"gpt-4.1-mini",store:false,input:"Analyze public technical documentation for "+job.target+". Official source: "+job.source_url+". Extract APIs, auth, SDKs, webhooks, sandbox/production access and requirements. Clearly label every unverified or unknown claim. Do not invent API keys, credentials or endpoints."})});
    if(!ai.ok)throw Error("model_http_"+ai.status);
    const output=await ai.json();
    const findings=(output.output||[]).flatMap((x:{content?:Array<{type:string,text?:string}>})=>x.content||[]).filter((x:{type:string})=>x.type==="output_text").map((x:{text?:string})=>x.text||"").join("\n");
    if(!findings)throw Error("model_empty_output");
    await request("sonoraport_swarm_tasks?id=eq."+job.id,"PATCH",{status:"complete",error:null,extracted:{findings:findings.slice(0,12000),source_url:job.source_url,model_response_id:output.id,verification:"model_generated_unverified"}});
    saved++;await event(job.id,"database_write","saved",{model_response_id:output.id});
   }catch(e){failed++;const message=String(e).slice(0,160);await request("sonoraport_swarm_tasks?id=eq."+job.id,"PATCH",{status:"queued",error:message});await event(job.id,"model_request","failed",{error:message})}
  }
  await finish(failed?"failed":"completed",jobsSeen,saved,failed?"TASK_FAILURE":undefined);
  return new Response(JSON.stringify({run_id:run,status:failed?"failed":"completed",jobs_seen:jobsSeen,jobs_saved:saved,jobs_failed:failed}),{status:failed?500:200,headers:H});
 }catch(e){await event(null,"worker","failed",{error:String(e).slice(0,160)}).catch(()=>{});await finish("failed",jobsSeen,saved,"WORKER_ERROR").catch(()=>{});return new Response(JSON.stringify({run_id:run,status:"failed"}),{status:500,headers:H})}
});