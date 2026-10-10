'use strict';
const RAILS=Object.freeze({
pix:{country:'BR',operator:'Banco Central do Brasil',kind:'instant_payment',source:'https://github.com/bacen/pix-api',auth:['oauth2','mtls'],publicApiSpecification:true,liveConnection:false},
spei:{country:'MX',operator:'Banco de México',kind:'interbank_payment',source:'https://www.banxico.org.mx/services/interbanking-electronic-payme.html',auth:[],publicApiSpecification:false,liveConnection:false},
upi:{country:'IN',operator:'NPCI',kind:'instant_payment',source:'https://www.npci.org.in/',auth:[],publicApiSpecification:false,liveConnection:false},
dcash:{country:'XCD',operator:'Eastern Caribbean Central Bank',kind:'cbdc_project',source:'https://www.eccb-centralbank.org/d-cash',auth:[],publicApiSpecification:false,liveConnection:false},
mbridge:{country:'MULTI',operator:'BIS project',kind:'multi_cbdc_project',source:'https://www.bis.org/project/mbridge',auth:[],publicApiSpecification:false,liveConnection:false},
bradesco:{country:'BR',operator:'Bradesco',kind:'bank_developer_portal',source:'https://developers.bradesco.com.br/',auth:[],publicApiSpecification:false,liveConnection:false},
bbva:{country:'MX',operator:'BBVA API Market',kind:'bank_developer_portal',source:'https://www.bbvaapimarket.com/en/banking-apis/',auth:[],publicApiSpecification:false,liveConnection:false}
});
function getRail(id){if(typeof id!=='string')return null;return Object.hasOwn(RAILS,id)?{id,...RAILS[id]}:null;}
function listRails(){return Object.keys(RAILS).map(getRail);}
function validateConfig(id,config){const rail=getRail(id);if(!rail)return {ok:false,errors:['Unknown rail']};if(!config||typeof config!=='object'||Array.isArray(config))return {ok:false,errors:['Configuration object required']};const errors=[];if(config.environment!=='sandbox')errors.push('Only sandbox configuration accepted');if(config.enableTransfers===true)errors.push('Transfers disabled in research adapter');if(rail.auth.includes('oauth2')&&!config.oauthTokenUrl)errors.push('Missing OAuth token endpoint');if(rail.auth.includes('mtls')&&config.mtlsConfigured!==true)errors.push('mTLS must be configured server-side');return {ok:errors.length===0,errors,rail:id,liveConnection:false};}
module.exports={getRail,listRails,validateConfig};
