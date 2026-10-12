'use strict';
// Read-only public research metadata contract. No bank-account data or credentials.
const FIELDS=Object.freeze(['id','project','category','company','official_url','source_url','research_date','research_tool']);
function validateResearchRow(row){
 if(!row||typeof row!=='object'||typeof row.company!=='string'||!row.company.trim())throw Error('Invalid research row');
 const safe={};for(const field of FIELDS)if(row[field]!==undefined)safe[field]=row[field];
 for(const field of ['official_url','source_url'])if(safe[field]!==undefined&&safe[field]!==null){try{const u=new URL(safe[field]);if(u.protocol!=='https:')throw Error()}catch{safe[field]=null}}
 return Object.freeze({...safe,connectionStatus:'RESEARCHED_NOT_CONNECTED'});
}
function sanitizeResearchRows(rows){if(!Array.isArray(rows))throw Error('Expected array');return rows.map(validateResearchRow)}
function researchQuery(client,{limit=50}={}){
 if(!client||typeof client.from!=='function')throw Error('Authenticated Supabase client required');
 if(!Number.isInteger(limit)||limit<1||limit>100)throw Error('Invalid limit');
 return client.from('kino_research_registry').select(FIELDS.join(',')).order('research_date',{ascending:false}).limit(limit);
}
module.exports={FIELDS,validateResearchRow,sanitizeResearchRows,researchQuery};
