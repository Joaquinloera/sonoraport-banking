const H={"content-type":"application/json","cache-control":"no-store"};
Deno.serve(async(req:Request)=>{
 if(req.method!=="POST")return new Response(JSON.stringify({error:"POST required"}),{status:405,headers:H});
 const base=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),modelKey=Deno.env.get("OPENAI_API_KEY");
 if(!base||!key)return new Response(JSON.stringify({error:"database_not_configured"}),{status:503,headers:H});
 const headers={apikey:key,authorization:"Bearer "+key,"content-type":"application/json"};
 const insert=async(table:string,body:unknown)=>{const r=await fetch(base+"/rest/v1/"+table,{method:"POST",headers:{...headers,prefer:"return=representation"},body:JSON.stringify(body)});if(!r.ok)throw Error("insert_"+table+"_"+r.status);return await r.json()};
 const patch=async(table:string,id:string,body:unknown)=>{const r=await fetch(base+"/rest/v1/"+table+"?id=eq."+id,{method:"PATCH",headers,body:JSON.stringify(body)});if(!r.ok)throw Error("update_"+table+"_"+r.status)};
 const rows=await insert("sonoraport_swarm_runs",{worker:"model-dispatch-v3",state:"started"});
 const run=rows[0].id;
 const event=async(task_id:string|null,stage:string,outcome:string,detail:unknown={})=>insert("sonoraport_swarm_events",{run_id:run,task_id,stage,outcome,detail});
 try{
  if(!modelKey){await event(null,"configuration","missing_model_key");await patch("sonoraport_swarm_runs",run,{state:"configuration_missing",error_code:"MODEL_KEY_MISSING",finished_at:new Date().toISOString()});return new Response(JSON.stringify({run_id:run,status:"configuration_missing"}),{status:503,headers:H})}
  const q=await fetch(base+"/rest/v1/sonoraport_swarm_tasks?select=id,target,source_url,assigned_agent&status=eq.queued&order=created_at.asc&limit=2",{headers});
  if(!q.ok)throw Error("queue_read_"+q.status);
  const jobs=await q.json();let saved=0;
  for(const job of jobs){
   await event(job.id,"model_request","started",{target:job.target});
   const ai=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"authorization":"Bearer "+modelKey,"content-type":"application/json"},body:JSON.stringify({model:"gpt-4.1-mini",store:false,input:"Summarize publicly available API documentation for "+job.target+" from "+job.source_url+". Clearly distinguish unknown facts."})});
   if(!ai.ok){await event(job.id,"model_request","failed",{http_status:ai.status});continue}
   const output=await ai.json();
   const findings=(output.output||[]).flatMap((x:{content?:Array<{type:string,text?:string}>})=>x.content||[]).filter((x:{type:string})=>x.type==="output_text").map((x:{text?:string})=>x.text||"").join("\n");
   if(!findings){await event(job.id,"model_request","empty");continue}
   await patch("sonoraport_swarm_tasks",job.id,{status:"complete",extracted:{findings:findings.slice(0,12000),source_url:job.source_url,model_response_id:output.id}});
   saved++;await event(job.id,"database_write","saved",{model_response_id:output.id});
  }
  await patch("sonoraport_swarm_runs",run,{state:"completed",jobs_seen:jobs.length,jobs_saved:saved,finished_at:new Date().toISOString()});
  return new Response(JSON.stringify({run_id:run,status:"completed",jobs_seen:jobs.length,jobs_saved:saved}),{headers:H});
 }catch(e){await event(null,"worker","failed",{error:String(e).slice(0,160)}).catch(()=>{});await patch("sonoraport_swarm_runs",run,{state:"failed",error_code:"WORKER_ERROR",finished_at:new Date().toISOString()}).catch(()=>{});return new Response(JSON.stringify({run_id:run,status:"failed"}),{status:500,headers:H})}
});