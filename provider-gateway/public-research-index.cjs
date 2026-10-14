"use strict";
const fs=require("node:fs");
const path=require("node:path");
const registryPath=path.resolve(__dirname,"../website/integrations/americas-api-skim.json");
function getResearchIndex(){
  const data=JSON.parse(fs.readFileSync(registryPath,"utf8"));
  if(data.schema!=="sonoraport.api-skim.v1"||!Array.isArray(data.providers))throw Error("Invalid research registry");
  return data.providers.map(x=>({name:x.name,region:x.region,kind:x.kind,source:x.official,verification:"documentation_only"}));
}
function getResearchTasks(){
  return ["us-canada","mexico-central-america","south-america","caribbean","brics-public-research","blockchain-public-research"].map((lane,index)=>({id:index+1,lane,execution:"not_started",researchOnly:true}));
}
module.exports={getResearchIndex,getResearchTasks};
