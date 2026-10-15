// Source mirror of Supabase Edge Function sonoraport-model-worker-check (v1).
// Deploy with JWT verification enabled. Requires OPENAI_API_KEY in Supabase secrets.
const HEADERS={"content-type":"application/json","cache-control":"no-store"};
Deno.serve(async (request:Request)=>{
 if(request.method!=="POST")return new Response(JSON.stringify({error:"POST required"}),{status:405,headers:HEADERS});
 const modelKey=Deno.env.get("OPENAI_API_KEY");
 if(!modelKey)return new Response(JSON.stringify({status:"missing_model_credential",executed:false}),{status:503,headers:HEADERS});
 const response=await fetch("https://api.openai.com/v1/responses",{
 method:"POST",headers:{"authorization":"Bearer "+modelKey,"content-type":"application/json"},
 body:JSON.stringify({model:Deno.env.get("SONORAPORT_RESEARCH_MODEL")||"gpt-4.1-mini",store:false,
 instructions:"Research public technical documentation. Cite official sources. Do not invent API access, credentials, or integration results.",
 input:"Research the official OpenAI Agents SDK documentation and explain its public handoff and tool-calling interfaces."})
 });
 if(!response.ok)return new Response(JSON.stringify({status:"model_request_failed",httpStatus:response.status,executed:false}),{status:502,headers:HEADERS});
 const data=await response.json();
 const output=(data.output||[]).flatMap((item:{content?:Array<{type:string,text?:string}>})=>item.content||[]).filter((item:{type:string})=>item.type==="output_text").map((item:{text?:string})=>item.text||"").join("\n");
 return new Response(JSON.stringify({status:output?"model_executed":"empty_output",executed:!!output,findings:output.slice(0,8000)}),{headers:HEADERS});
});