"use strict";
(function(){
 const $=id=>document.getElementById(id);
 const query=$('source-query'),lane=$('source-lane'),results=$('evidence-results'),summary=$('evidence-summary');
 const node=(name,text)=>{const el=document.createElement(name);if(text!==undefined)el.textContent=String(text??'');return el};
 let rows=[];
 function officialUrl(raw){try{const u=new URL(raw);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&!u.hash?u.href:null}catch{return null}}
 function textList(parent,title,items){
  if(!Array.isArray(items)||!items.length)return;
  parent.append(node('h3',title));const list=node('ul');
  for(const item of items)list.append(node('li',item));parent.append(list);
 }
 function render(){
  const term=query.value.trim().toLocaleLowerCase(),selected=lane.value;
  const matches=rows.filter(x=>(!selected||x.lane===selected)&&
   (!term||[x.provider,x.lane,x.sourceTitle,x.providerOnboarding,...x.documentedAuthentication,...x.documentedCapability].join(' ').toLocaleLowerCase().includes(term)));
  results.replaceChildren();
  for(const x of matches){
   const card=node('article');card.className='evidence-card';
   const area=node('span',x.lane.replaceAll('_',' '));area.className='tag';card.append(area);
   card.append(node('h2',x.provider));
   const status=node('p','API access status: '+x.sandboxAccess.replaceAll('_',' ').toLowerCase());status.className='evidence-status';card.append(status);
   textList(card,'Documented authentication',x.documentedAuthentication);
   textList(card,'Documented capabilities',x.documentedCapability);
   card.append(node('h3','Enrollment requirements'),node('p',x.providerOnboarding));
   if(x.catalogReconciliationRequired){card.append(node('p','Research catalog reconciliation pending'));}
   const link=node('a','Open official documentation ↗');link.href=x.sourceUrl;link.target='_blank';link.rel='noopener noreferrer';card.append(link);
   results.append(card);
  }
  if(!matches.length)results.append(node('p','No matching public documentation. Change your search or region.'));
  summary.textContent=matches.length+' of '+rows.length+' verified source documents displayed · 0 production banking connections verified';
 }
 async function initialize(){
  try{
   const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),9000);
   let response;
   try{response=await fetch('./official-source-evidence.json',{signal:controller.signal,headers:{Accept:'application/json'}})}
   finally{clearTimeout(timeout)}
   if(!response.ok)throw Error('Documentation fetch failed');
   const data=await response.json();
   if(data.mode!=='PUBLIC_SOURCE_RESEARCH_NOT_PROVIDER_ACCESS'||data.productionBankingConnectionsVerified!==0||
      data.hostedAIAgentsVerified!==0||!Array.isArray(data.entries))throw Error('Unverified source metadata');
   rows=data.entries.filter(x=>x&&typeof x.provider==='string'&&typeof x.lane==='string'&&
    typeof x.providerOnboarding==='string'&&typeof x.sourceTitle==='string'&&
    Array.isArray(x.documentedAuthentication)&&Array.isArray(x.documentedCapability)&&
    typeof x.sandboxAccess==='string'&&officialUrl(x.sourceUrl));
   const regions=[...new Set(rows.map(x=>x.lane))].sort();
   for(const region of regions){const option=node('option',region.replaceAll('_',' '));option.value=region;lane.append(option);}
   query.addEventListener('input',render);lane.addEventListener('change',render);render();
  }catch{
   summary.textContent='Official-source evidence is currently unavailable; no banking status has been inferred.';
  }
 }
 initialize();
})();