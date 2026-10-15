// SonoraPort SWARM 31 — model-powered queue dispatcher.
// Mirrors deployed Supabase Edge Function sonoraport-swarm-model-dispatch v1.
// Requires server-side OPENAI_API_KEY, SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
const headers={"content-type":"application/json","cache-control":"no-store"};
Deno.serve(async(request:Request)=>{
 if(request.method!=="POST")return new Response(JSON.stringify({error:"POST required"}),{status:405,headers});
 const base=Deno.env.get("SUPABASE_URL"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),modelKey=Deno.env.get("OPENAI_API_KEY");
 if(!base||!service||!modelKey)return new Response(JSON.stringify({status:"configuration_missing",databaseConfigured:!!(base&&service),modelConfigured:!!modelKey}),{status:503,headers});
 const queue=await fetch(base+"/rest/v1/sonoraport_swarm_tasks?select=id,target,source_url,assigned_agent,status&status=eq.queued&order=created_at.asc&limit=3",{headers:{apikey:service,authorization:"Bearer "+service}});
 if(!queue.ok)return new Response(JSON.stringify({status:"queue_read_failed",httpStatus:queue.status}),{status:502,headers});
 const tasks=await queue.json();const results=[];
 for(const task of tasks){
  try{
   const res=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{authorization:"Bearer "+modelKey,"content-type":"application/json"},body:JSON.stringify({model:Deno.env.get("SONORAPORT_RESEARCH_MODEL")||"gpt-4.1-mini",store:false,instructions:"Research only public technical documentation; distinguish verified documentation from assumptions; do not invent access or credentials.",input:"Research "+task.target+" official source "+task.source_url+". Extract API interfaces, authentication, SDKs, JSON formats, integration requirements and unknowns."})});
   if(!res.ok){results.push({id:task.id,status:"model_request_failed",httpStatus:res.status});continue}
   const body=await res.json();const findings=(body.output||[]).flatMap((x:{content?:Array<{type:string,text?:string}>})=>x.content||[]).filter((x:{type:string})=>x.type==="output_text").map((x:{text?:string})=>x.text||"").join("\n");
   if(!findings){results.push({id:task.id,status:"empty_output"});continue}
   const saved=await fetch(base+"/rest/v1/sonoraport_swarm_tasks?id=eq."+encodeURIComponent(task.id),{method:"PATCH",headers:{apikey:service,authorization:"Bearer "+service,"content-type":"application/json"},body:JSON.stringify({status:"complete"})});
   results.push({id:task.id,target:task.target,status:saved.ok?"model_completed":"status_update_failed",findings:findings.slice(0,12000)});
  }catch(error){results.push({id:task.id,status:"worker_error",message:String(error).slice(0,120)})}
 }
 return new Response(JSON.stringify({service:"sonoraport-swarm-model-dispatch",processed:results.length,results}),{headers});
});