'use strict';
/** Official-source-derived integration requirements. Never initiates payments. */
const SPECS=Object.freeze({
 pix:Object.freeze({source:'https://github.com/bacen/pix-api',specification:'OpenAPI 3.0',release:'2.10.0',securityDocumentation:'separate Pix security and initiation manuals',requires:['institutionProvisioned','securityManualReviewed','sandboxVerified']}),
 jpmorganChase:Object.freeze({source:'https://developer.payments.jpmorgan.com/api/authentication',authentication:'OAuth signed JWT assertions in testing and production',transport:'mTLS certificate where required',callbacks:'registered callback URL and certificate',requires:['bankProvisioned','testEnvironmentCredentials','transportCertificateValid','oauthSignedJwtVerified','callbackCertificateConfigured']}),
 spei:Object.freeze({source:'https://www.banxico.org.mx/services/spei_-transfers-banco-mexico.html',specification:'SPEI transfer system public documentation',requires:['participantOrSponsorVerified','integrationDocumentationVerified','sandboxVerified']})
});
function inspectIntegration(id,evidence={}){
 if(!Object.hasOwn(SPECS,id))return {id,recognized:false,ready:false,missing:['official-provider-specification']};
 const missing=SPECS[id].requires.filter(key=>evidence[key]!==true);
 // No public research record establishes authorization to transact.
 return {id,recognized:true,ready:false,missing,stage:missing.length?'prerequisites-missing':'requires-independent-production-authorization',source:SPECS[id].source};
}
module.exports={SPECS,inspectIntegration};
