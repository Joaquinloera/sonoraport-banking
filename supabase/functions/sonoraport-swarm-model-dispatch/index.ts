const H={"content-type":"application/json","cache-control":"no-store"};
Deno.serve(async(req:Request)=>{
 if(req.method!=="POST")return new Response(JSON.stringify({error:"POST required"}),{status:405,headers:H});
 const base=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),modelKey=Deno.env.get("OPENAI_API_KEY");
 if(!base||!key||!modelKey)return new Response(JSON.stringify({status:"configuration_missing",modelConfigured:!!modelKey}),{status:503,headers:H});
 const auth={apikey:key,authorization:"Bearer "+key};
 const q=await fetch(base+"/rest/v1/sonoraport_swarm_tasks?select=id,target,source_url,assigned_agent&status=eq.queued&limit=2",{headers:auth});
 if(!q.ok)return new Response(JSON.stringify({status:"queue_error",httpStatus:q.status}),{status:502,headers:H});
 const jobs=await q.json();const outcomes=[];
 for(const job of jobs){
  const ai=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{authorization:"Bearer "+modelKey,"content-type":"application/json"},body:JSON.stringify({model:"gpt-4.1-mini",store:false,input:"Research public developer API documentation for "+job.target+" at "+job.source_url+". State unknowns clearly."})});
  if(!ai.ok){outcomes.push({id:job.id,status:"model_error",httpStatus:ai.status});continue}
  const result=await ai.json();const findings=(result.output||[]).flatMap((v:{content?:Array<{type:string,text?:string}>})=>v.content||[]).filter((v:{type:string})=>v.type==="output_text").map((v:{text?:string})=>v.text||"").join("\n");
  if(!findings){outcomes.push({id:job.id,status:"empty"});continue}
  const saved=await fetch(base+"/rest/v1/sonoraport_swarm_tasks?id=eq."+job.id,{method:"PATCH",headers:{...auth,"content-type":"application/json"},body:JSON.stringify({status:"complete",extracted:{findings:findings.slice(0,12000),source_url:job.source_url,model_response_id:result.id}})});
  outcomes.push({id:job.id,status:saved.ok?"saved":"save_failed"});
 }
 return new Response(JSON.stringify({outcomes}),{headers:H});
});