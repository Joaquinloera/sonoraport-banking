'use strict';
/** Official-source-derived integration requirements. Never initiates payments. */
const SPECS=Object.freeze({
 pix:Object.freeze({source:'https://github.com/bacen/pix-api',specification:'OpenAPI 3.0',release:'2.10.0',securityDocumentation:'separate Pix security and initiation manuals',requires:['institutionProvisioned','securityManualReviewed','sandboxVerified']}),
 jpmorganChase:Object.freeze({source:'https://developer.payments.jpmorgan.com/api/authentication',authentication:'OAuth signed JWT assertions in testing and production',transport:'mTLS certificate where required',callbacks:'registered callback URL and certificate',requires:['bankProvisioned','testEnvironmentCredentials','transportCertificateValid','oauthSignedJwtVerified','callbackCertificateConfigured']}),
 cips:Object.freeze({source:'https://www.cips.com.cn/kjjqgsyyingw/jrcips/index.shtml',specification:'CIPS direct/indirect participant access and technical preparation',requires:['participationPathConfirmed','accessApplicationReviewed','technicalPreparationVerified']}),
 icbcEurope:Object.freeze({source:'https://open.icbc.com.cn/icbc/apip/europe/index.html',specification:'ICBC Europe Open Banking developer onboarding',requires:['regulatedTppVerified','openBankingDirectoryEnrollment','softwareStatementAssertionValidated','clientCredentialsProvisioned','certificateVerified','sandboxAccessProvisioned']}),
 payshap:Object.freeze({source:'https://www.payshap.co.za/',specification:'Participating-bank instant payments',requires:['participatingBankRelationshipVerified','bankTechnicalDocumentationReceived','sandboxVerified']}),
 bbvaApiMarket:Object.freeze({source:'https://www.bbvaapimarket.com/en/banking-apis/',specification:'BBVA banking API catalog; specific product details require provider engagement',requires:['productSelected','providerEnrollmentVerified','productSecurityDocumentationReviewed','sandboxVerified']}),
 spei:Object.freeze({source:'https://www.banxico.org.mx/services/spei_-transfers-banco-mexico.html',specification:'SPEI transfer system public documentation',requires:['participantOrSponsorVerified','integrationDocumentationVerified','sandboxVerified']})
});
function inspectIntegration(id,evidence={}){
 if(!Object.hasOwn(SPECS,id))return {id,recognized:false,ready:false,missing:['official-provider-specification']};
 const missing=SPECS[id].requires.filter(key=>evidence[key]!==true);
 // No public research record establishes authorization to transact.
 return {id,recognized:true,ready:false,missing,stage:missing.length?'prerequisites-missing':'requires-independent-production-authorization',source:SPECS[id].source};
}
module.exports={SPECS,inspectIntegration};
