/** SonoraPort research-only browser; no secrets, payment forms or write operations. */
const $=selector=>document.querySelector(selector);
const query=$('#query'),region=$('#region'),view=$('#view');
const grid=$('#provider-grid'),count=$('#result-count'),previous=$('#previous'),next=$('#next'),page=$('#page-status');
const state={seed:null,docs:[],regions:[],summary:null,apiAvailable:false,offset:0,limit:18,timer:null,requestSequence:0};
const api='/api/global-banking/';
function node(tag,text='',className=''){
 const el=document.createElement(tag);if(className)el.className=className;el.textContent=String(text??'');return el;
}
function httpsUrl(value){
 try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null}catch{return null}
}
function sourceLink(url){const href=httpsUrl(url);if(!href)return null;
 const link=node('a','Read official source ↗');link.href=href;link.target='_blank';link.rel='noopener noreferrer';return link;
}
async function loadJson(url){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),8000);
 try{const res=await fetch(url,{signal:controller.signal,headers:{Accept:'application/json'}});if(!res.ok)throw Error('HTTP '+res.status);return await res.json();}
 finally{clearTimeout(timer)}
}
function fillRegions(){const values=[...new Set([...state.docs.map(x=>x.region),...state.regions.map(x=>x.lane)])].filter(Boolean).sort();
 for(const name of values){const option=node('option',name.replaceAll('_',' '));option.value=name;region.append(option)}
 const out=$('#region-grid');out.replaceChildren();
 for(const lane of state.regions){const card=node('article','','lane');card.append(node('h3',lane.lane.replaceAll('_',' ')));
 const passed=lane.sourcesFetched===2;card.append(node('p',passed?'Two official documents fetched · API access unverified':'Official source verification pending'));
 out.append(card)}
}
function setSummary(){const s=state.summary??{};
 $('#metric-sources').textContent=state.apiAvailable?String(s.sourceEntries??'—'):'178*';
 $('#metric-portals').textContent=String(state.docs.length);
 $('#metric-regions').textContent=String(state.regions.length);
 $('#metric-agents').textContent=String(s.logicalAgentsDefined??144);
 $('#data-status').textContent=state.apiAvailable?'Live read-only research API responding · No bank accounts or transfers connected':'Repository documentation snapshot · Live research API not yet verified. *Source registry count from prior GitHub audit.';
}
function cardOf(provider,isDoc){
 const card=node('article','','card');card.append(node('span',provider.region?.replaceAll('_',' ')||'GLOBAL','tag'));
 card.append(node('h3',provider.name));
 const status=isDoc?'Documentation researched · not connected':'Registry source · not connected';
 card.append(node('p',status,'state'));
 if(isDoc){
  if(provider.documentedAuthentication?.length)card.append(node('p','Auth research: '+provider.documentedAuthentication.join('; ')));
  if(provider.sourceStatus)card.append(node('p','Evidence: '+provider.sourceStatus.replaceAll('_',' ')));
  const link=sourceLink(provider.sourceUrl);if(link)card.append(link);
 }else{
  card.append(node('p','Type: '+provider.kind?.replaceAll('_',' ')));
  if(provider.evidenceStatus)card.append(node('p','Evidence: '+provider.evidenceStatus.replaceAll('_',' ')));
  const link=sourceLink(provider.publicReferenceUrl);if(link)card.append(link);
 }
 return card;
}
function renderCards(records,total,isDoc){grid.replaceChildren();for(const d of records)grid.append(cardOf(d,isDoc));
 if(!records.length)grid.append(node('p','No matching published research entries. Try another search or region.'));
 count.textContent=`${records.length} displayed · ${total} matching ${isDoc?'developer research records':'public source entries'}`;
 const first=total?state.offset+1:0;const last=Math.min(state.offset+records.length,total);
 page.textContent=`${first}–${last} of ${total}`;previous.disabled=state.offset===0;next.disabled=state.offset+state.limit>=total;
}
async function render(){const current=++state.requestSequence;
 const search=query.value.trim().toLowerCase();const lane=region.value;const isDoc=view.value==='developers';
 if(!isDoc&&!state.apiAvailable){grid.replaceChildren(node('p','The complete source registry becomes searchable here when the read-only Netlify research API is published. The verified developer source snapshot remains available above.'));
  count.textContent='Full registry unavailable: serverless API not yet verified';previous.disabled=true;next.disabled=true;page.textContent='—';return;
 }
 if(isDoc){const subset=state.docs.filter(d=>(!lane||d.region===lane)&&(!search||[d.name,d.category,d.region,...(d.documentedAuthentication||[])].join(' ').toLowerCase().includes(search)));
  if(current===state.requestSequence)renderCards(subset.slice(state.offset,state.offset+state.limit),subset.length,true);return;
 }
 try{const url=new URL(api+'providers',window.location.origin);url.searchParams.set('limit',String(state.limit));url.searchParams.set('offset',String(state.offset));if(search)url.searchParams.set('query',search);if(lane)url.searchParams.set('region',lane);
  const d=await loadJson(url.href);if(current===state.requestSequence)renderCards(d.records||[],d.total||0,false);
 }catch{if(current===state.requestSequence){grid.replaceChildren(node('p','The registry API could not be verified. Showing no invented banking entries.'));count.textContent='API temporarily unavailable';previous.disabled=true;next.disabled=true;page.textContent='—';}}
}
function changeFilters(){state.offset=0;clearTimeout(state.timer);state.timer=setTimeout(render,180)}
query.addEventListener('input',changeFilters);region.addEventListener('change',changeFilters);view.addEventListener('change',changeFilters);
previous.addEventListener('click',()=>{state.offset=Math.max(0,state.offset-state.limit);render()});
next.addEventListener('click',()=>{state.offset+=state.limit;render()});
async function boot(){
 try{state.seed=await loadJson('./research-seed.json');state.docs=state.seed.providers.map(x=>({...x,documentedAuthentication:x.documentedAuthentication||[]}));state.regions=state.seed.regions;}
 catch{$('#data-status').textContent='Local research snapshot unavailable; no private data requested.';}
 try{
  const [summary,docs,regions]=await Promise.all([loadJson(api+'summary'),loadJson(api+'developer-docs'),loadJson(api+'regions')]);
  if(summary.mode!=='PUBLIC_RESEARCH_ONLY'||summary.transfersEnabled!==false||!Array.isArray(docs.providers)||!Array.isArray(regions.regions))throw Error('UNTRUSTED_API_STATUS');
  state.summary=summary;state.docs=docs.providers;state.regions=regions.regions;state.apiAvailable=true;
 }catch{state.apiAvailable=false;}
 fillRegions();setSummary();render();
}
await boot();